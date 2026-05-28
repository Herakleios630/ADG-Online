import {
  GEOMETRY_EPSILON,
  addVectors,
  getAxesFromRotation,
  normalizeAngleRadians,
  scaleVector,
} from '../geometry/index.js';
import {
  MOVEMENT_PIVOT_SIDES,
  getWheelDistanceUdForAngleRadians,
  getWheelEndPose,
} from '../movement/index.js';
import {
  appendEvadeDecisionTrace,
  createAvoidanceCandidateFromSteps,
  createEvadeAvoidanceCandidate,
  createEvadeAvoidanceStep,
  getEvadeCandidateSteps,
  getEvadePathDistanceUd,
  getSignedAngleDeltaRadians,
  summarizeEvadeCandidateForDecisionTrace,
} from './evade-model.js';
import {
  doesPoseOverlapAnyUnit,
  evaluateSimpleBlockedEvade,
  getClearanceBlockerSummaries,
  getFirstLinearPathOverlapUnitId,
  getLimitingClearanceBlocker,
  getMinimumClearanceSlideDistance,
  getOverlappingUnitsAtPose,
  getPermittedLateSlideDistances,
  getSlideAdjustedEvadePose,
  isPoseInsideBattlefield,
  refineLinearPathBoundaryPose,
} from './evade-geometry.js';

const EVADE_LINEAR_PATH_SAMPLE_STEP_UD = 0.25;
const EVADE_WHEEL_STEP_RADIANS = Math.PI / 36;
const EVADE_WHEEL_REFINEMENT_ITERATIONS = 8;
const EVADE_MAX_LATER_AVOIDANCE_STEPS = 4;
const EVADE_MIN_RETAINED_AVOIDANCE_STEP_UD = 0.001;
const EVADE_WAYFINDING_V2_WHEEL_ANGLES_RADIANS = [Math.PI / 12, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2];
const EVADE_WAYFINDING_V2_MANOEUVRE_BUFFER_UD = 1;
const EVADE_WAYFINDING_V2_MAX_CONFLICT_DEPTH = 1;
const EVADE_DIRECTION_WHEEL_RESERVE_ALIGNMENT_TOLERANCE_RADIANS = Math.PI / 12;
const EVADE_DIRECTION_WHEEL_CORRIDOR_PRIORITY_THRESHOLD_UD = 0.5;
const EVADE_DIRECTION_WHEEL_SLIDE_ROOT_WHEEL_BACK_UD_TOLERANCE = 0.5;

function getBlockerKindFromUnits(blockerUnits = []) {
  const blockerKinds = Array.from(new Set(
    blockerUnits
      .map((unit) => unit?.evadeHardBlockerKind ?? null)
      .filter(Boolean),
  ));

  return blockerKinds.length > 0
    ? blockerKinds.join('+')
    : 'unit-conservative-hard-blocker';
}

function getMemoPoseKey(pose, suffix = '') {
  if (!pose) {
    return `null:${suffix}`;
  }

  return [
    Number(pose.xUd ?? 0).toFixed(3),
    Number(pose.yUd ?? 0).toFixed(3),
    Number(pose.rotationRadians ?? 0).toFixed(3),
    suffix,
  ].join(':');
}

function getMemoPathKey(startPose, endPose, suffix = '') {
  return `${getMemoPoseKey(startPose)}=>${getMemoPoseKey(endPose)}:${suffix}`;
}

function getMemoizedOverlappingUnitsAtPose({ reactingUnit, pose, units = [], ignoredUnitIds = [], solverMemo = null }) {
  if (!solverMemo) {
    return getOverlappingUnitsAtPose({ reactingUnit, pose, units, ignoredUnitIds });
  }

  const memoKey = getMemoPoseKey(pose, ignoredUnitIds.join(','));
  if (solverMemo.overlappingUnitsAtPose.has(memoKey)) {
    return solverMemo.overlappingUnitsAtPose.get(memoKey);
  }

  const overlappingUnits = getOverlappingUnitsAtPose({ reactingUnit, pose, units, ignoredUnitIds });
  solverMemo.overlappingUnitsAtPose.set(memoKey, overlappingUnits);
  return overlappingUnits;
}

function getMemoizedIsPoseInsideBattlefield({ reactingUnit, pose, battlefieldProfile = null, solverMemo = null }) {
  if (!solverMemo) {
    return isPoseInsideBattlefield({ reactingUnit, pose, battlefieldProfile });
  }

  const battlefieldKey = battlefieldProfile
    ? `${Number(battlefieldProfile.widthUd ?? 0).toFixed(3)}:${Number(battlefieldProfile.heightUd ?? 0).toFixed(3)}`
    : 'none';
  const memoKey = getMemoPoseKey(pose, battlefieldKey);
  if (solverMemo.insideBattlefield.has(memoKey)) {
    return solverMemo.insideBattlefield.get(memoKey);
  }

  const insideBattlefield = isPoseInsideBattlefield({ reactingUnit, pose, battlefieldProfile });
  solverMemo.insideBattlefield.set(memoKey, insideBattlefield);
  return insideBattlefield;
}

function getMemoizedDoesPoseOverlapAnyUnit({ reactingUnit, pose, units = [], ignoredUnitIds = [], shrinkFootprintUd = 0, solverMemo = null }) {
  if (!solverMemo) {
    return doesPoseOverlapAnyUnit({ reactingUnit, pose, units, ignoredUnitIds, shrinkFootprintUd });
  }

  const memoKey = getMemoPoseKey(pose, `${ignoredUnitIds.join(',')}:${Number(shrinkFootprintUd ?? 0).toFixed(3)}`);
  if (solverMemo.overlapAny.has(memoKey)) {
    return solverMemo.overlapAny.get(memoKey);
  }

  const overlapsAnyUnit = doesPoseOverlapAnyUnit({ reactingUnit, pose, units, ignoredUnitIds, shrinkFootprintUd });
  solverMemo.overlapAny.set(memoKey, overlapsAnyUnit);
  return overlapsAnyUnit;
}

function getMemoizedFirstLinearPathOverlap({ reactingUnit, startPose, endPose, units = [], ignoredUnitIds = [], solverMemo = null }) {
  if (!solverMemo) {
    return getFirstLinearPathOverlap({ reactingUnit, startPose, endPose, units, ignoredUnitIds });
  }

  const memoKey = getMemoPathKey(startPose, endPose, ignoredUnitIds.join(','));
  if (solverMemo.linearPathOverlap.has(memoKey)) {
    return solverMemo.linearPathOverlap.get(memoKey);
  }

  const overlap = getFirstLinearPathOverlap({ reactingUnit, startPose, endPose, units, ignoredUnitIds });
  solverMemo.linearPathOverlap.set(memoKey, overlap);
  return overlap;
}

function getMemoizedFirstLinearPathOverlapAgainstUnits({
  reactingUnit,
  startPose,
  endPose,
  blockerUnitIds = [],
  units = [],
  ignoredUnitIds = [],
  solverMemo = null,
}) {
  if (!solverMemo) {
    return getFirstLinearPathOverlapAgainstUnits({ reactingUnit, startPose, endPose, blockerUnitIds, units, ignoredUnitIds });
  }

  const memoKey = getMemoPathKey(startPose, endPose, `${ignoredUnitIds.join(',')}:${blockerUnitIds.filter(Boolean).join(',')}`);
  if (solverMemo.blockerLinearPathOverlap.has(memoKey)) {
    return solverMemo.blockerLinearPathOverlap.get(memoKey);
  }

  const overlap = getFirstLinearPathOverlapAgainstUnits({ reactingUnit, startPose, endPose, blockerUnitIds, units, ignoredUnitIds });
  solverMemo.blockerLinearPathOverlap.set(memoKey, overlap);
  return overlap;
}

export function detectNextHardEvadeConflict({
  reactingUnit,
  startPose,
  distanceUd,
  units = [],
  ignoredUnitIds = [],
  solverMemo = null,
}) {
  if (!startPose || !Number.isFinite(distanceUd) || distanceUd <= GEOMETRY_EPSILON) {
    return null;
  }

  const endPose = getLinearEndPose(startPose, startPose.rotationRadians, distanceUd);
  const firstOverlap = getMemoizedFirstLinearPathOverlap({
    reactingUnit,
    startPose,
    endPose,
    units,
    ignoredUnitIds,
    solverMemo,
  });

  if (!firstOverlap) {
    return null;
  }

  const travelledDistanceUd = Number.isFinite(firstOverlap.travelledDistanceUd) ? firstOverlap.travelledDistanceUd : null;
  const manoeuvreTravelledDistanceUd = Number.isFinite(travelledDistanceUd)
    ? Number(Math.max(0, travelledDistanceUd - EVADE_WAYFINDING_V2_MANOEUVRE_BUFFER_UD).toFixed(3))
    : null;

  return {
    type: 'hard-unit-conflict',
    blockerKind: getBlockerKindFromUnits(firstOverlap.blockerUnits),
    blockerUnitIds: firstOverlap.blockerUnitIds?.length > 0
      ? [...firstOverlap.blockerUnitIds]
      : [firstOverlap.unitId].filter(Boolean),
    blockerUnits: Array.isArray(firstOverlap.blockerUnits) ? firstOverlap.blockerUnits : [],
    encounterPose: firstOverlap.encounterPose ?? null,
    manoeuvrePose: Number.isFinite(manoeuvreTravelledDistanceUd)
      ? getLinearEndPose(startPose, startPose.rotationRadians, manoeuvreTravelledDistanceUd)
      : firstOverlap.encounterPose ?? null,
    blockedPose: firstOverlap.blockedPose ?? null,
    travelledDistanceUd,
    manoeuvreTravelledDistanceUd,
    friendlyInterpenetrationPolicy: 'conservative-block-unless-source-locked',
  };
}

export function getLinearEndPose(startPose, rotationRadians, distanceUd) {
  const { forwardAxis } = getAxesFromRotation(rotationRadians);
  const endPosition = addVectors(
    { x: Number(startPose.xUd ?? 0), y: Number(startPose.yUd ?? 0) },
    scaleVector(forwardAxis, distanceUd),
  );

  return {
    xUd: Number(endPosition.x.toFixed(3)),
    yUd: Number(endPosition.y.toFixed(3)),
    rotationRadians,
  };
}

function getFirstLinearPathOverlap({
  reactingUnit,
  startPose,
  endPose,
  units = [],
  ignoredUnitIds = [],
}) {
  if (!startPose || !endPose) {
    return null;
  }

  const deltaXUd = Number(endPose.xUd ?? 0) - Number(startPose.xUd ?? 0);
  const deltaYUd = Number(endPose.yUd ?? 0) - Number(startPose.yUd ?? 0);
  const distanceUd = Math.hypot(deltaXUd, deltaYUd);

  if (distanceUd <= GEOMETRY_EPSILON) {
    return null;
  }

  const sampleCount = Math.max(1, Math.ceil(distanceUd / EVADE_LINEAR_PATH_SAMPLE_STEP_UD));
  let previousPose = {
    xUd: Number(startPose.xUd ?? 0),
    yUd: Number(startPose.yUd ?? 0),
    rotationRadians: Number(startPose.rotationRadians ?? endPose.rotationRadians ?? 0),
  };

  for (let sampleIndex = 1; sampleIndex < sampleCount; sampleIndex += 1) {
    const progress = sampleIndex / sampleCount;
    const sampledPose = {
      xUd: Number((Number(startPose.xUd ?? 0) + (deltaXUd * progress)).toFixed(3)),
      yUd: Number((Number(startPose.yUd ?? 0) + (deltaYUd * progress)).toFixed(3)),
      rotationRadians: Number(endPose.rotationRadians ?? startPose.rotationRadians ?? 0),
    };
    const overlappingUnits = getOverlappingUnitsAtPose({
      reactingUnit,
      pose: sampledPose,
      units,
      ignoredUnitIds,
      shrinkFootprintUd: 0.005,
    });
    const overlapUnitId = overlappingUnits[0]?.id ?? null;

    if (overlapUnitId) {
      const overlappingUnitIds = overlappingUnits.map((unit) => unit?.id ?? null).filter(Boolean);
      const refinedEncounterPose = refineLinearPathBoundaryPose({
        reactingUnit,
        legalPose: previousPose,
        overlappingPose: sampledPose,
        units,
        ignoredUnitIds,
        allowedUnitIds: new Set(overlappingUnitIds),
      });
      return {
        unitId: overlapUnitId,
        blockerUnits: overlappingUnits,
        blockerUnitIds: overlappingUnitIds,
        encounterPose: refinedEncounterPose,
        travelledDistanceUd: getEvadePathDistanceUd(startPose, refinedEncounterPose),
        blockedPose: sampledPose,
      };
    }

    previousPose = sampledPose;
  }

  return null;
}

function getFirstLinearPathOverlapAgainstUnits({
  reactingUnit,
  startPose,
  endPose,
  blockerUnitIds = [],
  units = [],
  ignoredUnitIds = [],
}) {
  if (!startPose || !endPose || !Array.isArray(blockerUnitIds) || blockerUnitIds.length === 0) {
    return null;
  }

  const deltaXUd = Number(endPose.xUd ?? 0) - Number(startPose.xUd ?? 0);
  const deltaYUd = Number(endPose.yUd ?? 0) - Number(startPose.yUd ?? 0);
  const distanceUd = Math.hypot(deltaXUd, deltaYUd);

  if (distanceUd <= GEOMETRY_EPSILON) {
    return null;
  }

  const allowedIds = new Set(blockerUnitIds.filter(Boolean));
  const sampleCount = Math.max(1, Math.ceil(distanceUd / EVADE_LINEAR_PATH_SAMPLE_STEP_UD));
  let previousPose = {
    xUd: Number(startPose.xUd ?? 0),
    yUd: Number(startPose.yUd ?? 0),
    rotationRadians: Number(startPose.rotationRadians ?? endPose.rotationRadians ?? 0),
  };

  for (let sampleIndex = 1; sampleIndex <= sampleCount; sampleIndex += 1) {
    const progress = sampleIndex / sampleCount;
    const sampledPose = {
      xUd: Number((Number(startPose.xUd ?? 0) + (deltaXUd * progress)).toFixed(3)),
      yUd: Number((Number(startPose.yUd ?? 0) + (deltaYUd * progress)).toFixed(3)),
      rotationRadians: Number(endPose.rotationRadians ?? startPose.rotationRadians ?? 0),
    };
    const overlappingUnits = getOverlappingUnitsAtPose({
      reactingUnit,
      pose: sampledPose,
      units,
      ignoredUnitIds,
    }).filter((unit) => allowedIds.has(unit?.id));

    if (overlappingUnits.length > 0) {
      const refinedEncounterPose = refineLinearPathBoundaryPose({
        reactingUnit,
        legalPose: previousPose,
        overlappingPose: sampledPose,
        units,
        ignoredUnitIds,
        allowedUnitIds: allowedIds,
      });
      const refinedBlockerUnits = getOverlappingUnitsAtPose({
        reactingUnit,
        pose: sampledPose,
        units,
        ignoredUnitIds,
      }).filter((unit) => allowedIds.has(unit?.id));
      return {
        blockerUnits: refinedBlockerUnits.length > 0 ? refinedBlockerUnits : overlappingUnits,
        blockerUnitIds: (refinedBlockerUnits.length > 0 ? refinedBlockerUnits : overlappingUnits).map((unit) => unit.id ?? null).filter(Boolean),
        encounterPose: refinedEncounterPose,
        blockedPose: sampledPose,
        travelledDistanceUd: getEvadePathDistanceUd(startPose, refinedEncounterPose),
      };
    }

    previousPose = sampledPose;
  }

  return null;
}

function refineWheelAngleResult({ minimumAngleRadians = 0, maximumAngleRadians, evaluateAngle }) {
  if (!Number.isFinite(maximumAngleRadians) || typeof evaluateAngle !== 'function') {
    return null;
  }

  const normalizedMinimumAngleRadians = Math.max(0, Number(minimumAngleRadians ?? 0));
  let lowerBoundRadians = Math.min(normalizedMinimumAngleRadians, maximumAngleRadians);
  let upperBoundRadians = Math.max(normalizedMinimumAngleRadians, maximumAngleRadians);
  let bestResult = evaluateAngle(upperBoundRadians);

  if (!bestResult) {
    return null;
  }

  for (let iteration = 0; iteration < EVADE_WHEEL_REFINEMENT_ITERATIONS; iteration += 1) {
    if (upperBoundRadians - lowerBoundRadians <= GEOMETRY_EPSILON) {
      break;
    }

    const midpointRadians = (lowerBoundRadians + upperBoundRadians) / 2;
    const midpointResult = evaluateAngle(midpointRadians);
    if (midpointResult) {
      bestResult = midpointResult;
      upperBoundRadians = midpointRadians;
      continue;
    }

    lowerBoundRadians = midpointRadians;
  }

  return bestResult;
}

function refineSlideDistanceResult({ minimumDistanceUd = 0, maximumDistanceUd, evaluateDistance }) {
  if (!Number.isFinite(maximumDistanceUd) || typeof evaluateDistance !== 'function') {
    return null;
  }

  const normalizedMinimumDistanceUd = Math.max(0, Number(minimumDistanceUd ?? 0));
  let lowerBoundDistanceUd = Math.min(normalizedMinimumDistanceUd, maximumDistanceUd);
  let upperBoundDistanceUd = Math.max(normalizedMinimumDistanceUd, maximumDistanceUd);
  let bestResult = evaluateDistance(upperBoundDistanceUd);

  if (!bestResult) {
    return null;
  }

  for (let iteration = 0; iteration < EVADE_WHEEL_REFINEMENT_ITERATIONS; iteration += 1) {
    if (upperBoundDistanceUd - lowerBoundDistanceUd <= GEOMETRY_EPSILON) {
      break;
    }

    const midpointDistanceUd = (lowerBoundDistanceUd + upperBoundDistanceUd) / 2;
    const midpointResult = evaluateDistance(midpointDistanceUd);
    if (midpointResult) {
      bestResult = midpointResult;
      upperBoundDistanceUd = midpointDistanceUd;
      continue;
    }

    lowerBoundDistanceUd = midpointDistanceUd;
  }

  return bestResult;
}

function getWheelAdjustedEvadePose({ reactingUnit, reorientedPose, pivotSide, angleRadians, totalDistanceUd }) {
  const wheeledPose = getWheelEndPose({
    ...reactingUnit,
    xUd: reorientedPose.xUd,
    yUd: reorientedPose.yUd,
    rotationRadians: reorientedPose.rotationRadians,
  }, pivotSide, angleRadians);
  const spentDistanceUd = Number(getWheelDistanceUdForAngleRadians(angleRadians).toFixed(3));
  const remainingDistanceUd = Number(Math.max(0, totalDistanceUd - spentDistanceUd).toFixed(3));
  const endPose = getLinearEndPose(wheeledPose, wheeledPose.rotationRadians, remainingDistanceUd);

  return {
    intermediatePose: {
      xUd: Number(wheeledPose.xUd.toFixed(3)),
      yUd: Number(wheeledPose.yUd.toFixed(3)),
      rotationRadians: normalizeAngleRadians(Number(wheeledPose.rotationRadians ?? 0)),
    },
    endPose: {
      xUd: Number(endPose.xUd.toFixed(3)),
      yUd: Number(endPose.yUd.toFixed(3)),
      rotationRadians: normalizeAngleRadians(Number(endPose.rotationRadians ?? 0)),
    },
    spentDistanceUd,
    remainingDistanceUd,
  };
}

function getOppositePivotSide(pivotSide) {
  return pivotSide === MOVEMENT_PIVOT_SIDES.LEFT ? MOVEMENT_PIVOT_SIDES.RIGHT : MOVEMENT_PIVOT_SIDES.LEFT;
}

function isCandidateEndPoseLegal({ candidateStartPose = null, candidateEndPose, reactingUnit, battlefieldProfile = null, units = [], ignoredUnitIds = [], solverMemo = null }) {
  return getMemoizedIsPoseInsideBattlefield({ reactingUnit, pose: candidateEndPose, battlefieldProfile, solverMemo })
    && !getMemoizedDoesPoseOverlapAnyUnit({ reactingUnit, pose: candidateEndPose, units, ignoredUnitIds, solverMemo })
    && !getMemoizedFirstLinearPathOverlap({ reactingUnit, startPose: candidateStartPose, endPose: candidateEndPose, units, ignoredUnitIds, solverMemo });
}

function isIntermediatePoseLegal({ reactingUnit, pose, battlefieldProfile = null, units = [], ignoredUnitIds = [], solverMemo = null }) {
  return getMemoizedIsPoseInsideBattlefield({ reactingUnit, pose, battlefieldProfile, solverMemo })
    && !getMemoizedDoesPoseOverlapAnyUnit({ reactingUnit, pose, units, ignoredUnitIds, shrinkFootprintUd: 0.005, solverMemo });
}

function isWheelArcPathLegal({ reactingUnit, startPose, pivotSide, angleRadians, battlefieldProfile = null, units = [], ignoredUnitIds = [], solverMemo = null }) {
  if (!startPose || !Number.isFinite(angleRadians) || angleRadians <= GEOMETRY_EPSILON) {
    return true;
  }

  const sampleCount = Math.max(1, Math.ceil(angleRadians / EVADE_WHEEL_STEP_RADIANS));
  for (let sampleIndex = 1; sampleIndex <= sampleCount; sampleIndex += 1) {
    const sampledAngleRadians = angleRadians * (sampleIndex / sampleCount);
    const sampledPose = getWheelEndPose({
      ...reactingUnit,
      xUd: startPose.xUd,
      yUd: startPose.yUd,
      rotationRadians: startPose.rotationRadians,
    }, pivotSide, sampledAngleRadians);

    if (!isIntermediatePoseLegal({
      reactingUnit,
      pose: {
        xUd: Number(sampledPose.xUd.toFixed(3)),
        yUd: Number(sampledPose.yUd.toFixed(3)),
        rotationRadians: normalizeAngleRadians(Number(sampledPose.rotationRadians ?? 0)),
      },
      battlefieldProfile,
      units,
      ignoredUnitIds,
      solverMemo,
    })) {
      return false;
    }
  }

  return true;
}

function createWayfindingV2Candidate({ avoidanceSteps, endPose, blockerUnitIds = [], patternId, reasonCodes = [] }) {
  return mergeCandidateAnalysis(createAvoidanceCandidateFromSteps({
    avoidanceSteps,
    endPose,
    blockerUnitIds,
  }), {
    generationSource: 'wayfinding-v2-pattern',
    wayfindingPatternId: patternId,
    wayfindingReasonCodes: reasonCodes,
  });
}

function getWayfindingTravelProbeValues(minimumTravelledDistanceUd = 0, maximumTravelledDistanceUd = 0, probeOrder = 'latest-first') {
  const minimumTravel = Number(Math.max(0, minimumTravelledDistanceUd).toFixed(3));
  const maximumTravel = Number(Math.max(minimumTravel, maximumTravelledDistanceUd).toFixed(3));
  const values = [];

  for (let travelledDistanceUd = maximumTravel; travelledDistanceUd >= minimumTravel - GEOMETRY_EPSILON; travelledDistanceUd -= EVADE_LINEAR_PATH_SAMPLE_STEP_UD) {
    values.push(Number(Math.max(minimumTravel, travelledDistanceUd).toFixed(3)));
  }

  if (!values.includes(minimumTravel)) {
    values.push(minimumTravel);
  }

  const dedupedValues = Array.from(new Set(values.map((value) => Number(value.toFixed(3)))));
  return probeOrder === 'earliest-first'
    ? dedupedValues.sort((leftValue, rightValue) => leftValue - rightValue)
    : dedupedValues.sort((leftValue, rightValue) => rightValue - leftValue);
}

function getLatestAcceptedWayfindingPatternResult({
  minimumTravelledDistanceUd = 0,
  maximumTravelledDistanceUd = 0,
  probeOrder = 'latest-first',
  evaluateTravelledDistance,
}) {
  if (typeof evaluateTravelledDistance !== 'function') {
    return null;
  }

  for (const travelledDistanceUd of getWayfindingTravelProbeValues(minimumTravelledDistanceUd, maximumTravelledDistanceUd, probeOrder)) {
    const result = evaluateTravelledDistance(travelledDistanceUd);
    if (result?.accepted) {
      return result;
    }
  }

  return null;
}

function continueOrRecurseWayfindingV2Pattern({
  reactingUnit,
  nextPose,
  nextRemainingDistanceUd,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
  nextAvoidanceSteps = [],
  nextLaterSlideAvailable = true,
  nextRemainingWheelBudgetRadians = Math.PI / 2,
  blockerUnitIds = [],
  patternId,
  reasonCodes = [],
  recursionDepth = 0,
  decisionTrace = null,
  solverMemo = null,
}) {
  if (!nextPose) {
    return { accepted: false, reason: 'missing-next-pose' };
  }

  const intermediateLegal = isIntermediatePoseLegal({
    reactingUnit,
    pose: nextPose,
    battlefieldProfile,
    units,
    ignoredUnitIds,
    solverMemo,
  });
  if (!intermediateLegal) {
    return { accepted: false, reason: 'intermediate-blocked' };
  }

  const continuedEndPose = getLinearEndPose(nextPose, nextPose.rotationRadians, nextRemainingDistanceUd);
  const continuedPathLegal = isCandidateEndPoseLegal({
    candidateStartPose: nextPose,
    candidateEndPose: continuedEndPose,
    reactingUnit,
    battlefieldProfile,
    units,
    ignoredUnitIds,
    solverMemo,
  });
  if (continuedPathLegal) {
    return {
      accepted: true,
      candidate: createWayfindingV2Candidate({
        avoidanceSteps: nextAvoidanceSteps,
        endPose: continuedEndPose,
        blockerUnitIds,
        patternId,
        reasonCodes,
      }),
    };
  }

  if (nextRemainingDistanceUd <= GEOMETRY_EPSILON || recursionDepth >= EVADE_WAYFINDING_V2_MAX_CONFLICT_DEPTH) {
    return { accepted: false, reason: 'continued-path-blocked' };
  }

  const recursiveCandidates = getEvadeWayfindingV2PatternCandidates({
    reactingUnit,
    startPose: nextPose,
    distanceUd: nextRemainingDistanceUd,
    battlefieldProfile,
    units,
    ignoredUnitIds,
    baseAvoidanceSteps: nextAvoidanceSteps,
    laterSlideAvailable: nextLaterSlideAvailable,
    remainingWheelBudgetRadians: nextRemainingWheelBudgetRadians,
    decisionTrace,
    solverMemo,
    recursionDepth: recursionDepth + 1,
  });
  if (recursiveCandidates.length === 0) {
    return { accepted: false, reason: 'continued-path-blocked' };
  }

  const recursiveCandidate = getPreferredEvadeCandidatesByDistance({
    candidates: recursiveCandidates,
    referencePose: continuedEndPose,
    rankingPolicy: nextAvoidanceSteps[0]?.type === 'direction-wheel'
      ? 'direction-wheel-branch-retention'
      : 'default',
  })[0] ?? recursiveCandidates[0];

  return {
    accepted: true,
    candidate: mergeCandidateAnalysis({
      ...recursiveCandidate,
      blockerUnitIds: Array.from(new Set([
        ...blockerUnitIds,
        ...(recursiveCandidate?.blockerUnitIds ?? []),
      ].filter(Boolean))),
    }, {
      generationSource: 'wayfinding-v2-pattern',
      wayfindingPatternId: `${patternId}->${recursiveCandidate?.analysis?.wayfindingPatternId ?? 'continued'}`,
      wayfindingReasonCodes: Array.from(new Set([
        ...reasonCodes,
        'recursive-hard-conflict-chain',
        ...(recursiveCandidate?.analysis?.wayfindingReasonCodes ?? []),
      ])),
    }),
  };
}

function getEvadeWayfindingV2PatternCandidates({
  reactingUnit,
  startPose,
  distanceUd,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
  baseAvoidanceSteps = [],
  laterSlideAvailable = true,
  remainingWheelBudgetRadians = Math.PI / 2,
  decisionTrace = null,
  solverMemo = null,
  recursionDepth = 0,
}) {
  const conflict = detectNextHardEvadeConflict({
    reactingUnit,
    startPose,
    distanceUd,
    units,
    ignoredUnitIds,
    solverMemo,
  });

  if (!conflict?.encounterPose) {
    appendEvadeDecisionTrace(decisionTrace, {
      stage: 'wayfinding-v2-patterns',
      recursionDepth,
      reason: 'no-hard-conflict',
      patternCandidates: [],
    });
    return [];
  }

  const conservativeTravelledDistanceUd = Number(conflict.manoeuvreTravelledDistanceUd ?? conflict.travelledDistanceUd ?? 0);
  const maximumTravelledDistanceUd = Number(conflict.travelledDistanceUd ?? conservativeTravelledDistanceUd);
  const remainingDistanceUd = Number(Math.max(0, distanceUd - conservativeTravelledDistanceUd).toFixed(3));
  const blockerUnits = conflict.blockerUnits?.length > 0
    ? conflict.blockerUnits
    : units.filter((unit) => conflict.blockerUnitIds?.includes(unit?.id));
  const blockerUnitIds = Array.from(new Set((conflict.blockerUnitIds ?? []).filter(Boolean)));
  const candidates = [];
  const patternSummaries = [];

  const recordPattern = (patternId, status, reason, candidate = null) => {
    patternSummaries.push({
      patternId,
      status,
      reason,
      candidateId: candidate?.id ?? null,
    });
  };

  if (remainingDistanceUd <= GEOMETRY_EPSILON) {
    appendEvadeDecisionTrace(decisionTrace, {
      stage: 'wayfinding-v2-patterns',
      recursionDepth,
      conflict,
      remainingDistanceUd,
      patternCandidates: [],
      rejectedReason: 'no-remaining-distance',
    });
    return [];
  }

  const getPatternStartPose = (travelledDistanceUd) => getLinearEndPose(startPose, startPose.rotationRadians, travelledDistanceUd);

  const evaluateSlidePattern = (side, travelledDistanceUd, forcedSlideDistanceUd = null) => {
    const patternStartPose = getPatternStartPose(travelledDistanceUd);
    const patternRemainingDistanceUd = Number(Math.max(0, distanceUd - travelledDistanceUd).toFixed(3));
    if (patternRemainingDistanceUd <= GEOMETRY_EPSILON) {
      return { accepted: false, reason: 'no-remaining-distance' };
    }

    const patternUnit = {
      ...reactingUnit,
      xUd: patternStartPose.xUd,
      yUd: patternStartPose.yUd,
      rotationRadians: patternStartPose.rotationRadians,
    };
    const minimumSlideDistanceUd = getMinimumClearanceSlideDistance({ blockerUnits, unit: patternUnit, side });
    const permittedSlideDistances = getPermittedLateSlideDistances(minimumSlideDistanceUd, patternRemainingDistanceUd);
    const slideDistanceUd = Number.isFinite(forcedSlideDistanceUd)
      ? forcedSlideDistanceUd
      : permittedSlideDistances[0] ?? null;
    if (!Number.isFinite(slideDistanceUd)) {
      return { accepted: false, reason: 'no-legal-slide-distance' };
    }

    if (!permittedSlideDistances.some((distanceUd) => Math.abs(distanceUd - slideDistanceUd) <= GEOMETRY_EPSILON)) {
      return { accepted: false, reason: 'no-legal-slide-distance' };
    }

    const slideResult = getSlideAdjustedEvadePose({
      reorientedPose: patternStartPose,
      side,
      slideDistanceUd,
      totalDistanceUd: patternRemainingDistanceUd,
    });
    const slidePathLegal = isCandidateEndPoseLegal({
      candidateStartPose: patternStartPose,
      candidateEndPose: slideResult.intermediatePose,
      reactingUnit,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      solverMemo,
    });
    if (!slidePathLegal) {
      return {
        accepted: false,
        reason: 'slide-swept-path-blocked',
      };
    }

    const slideStep = createEvadeAvoidanceStep({
      id: `wayfinding-v2-slide-step-${side}-${slideDistanceUd.toFixed(3)}`,
      type: 'slide',
      side,
      distanceUd: slideDistanceUd,
      spentDistanceUd: slideDistanceUd,
      endPose: slideResult.intermediatePose,
      remainingDistanceUd: slideResult.remainingDistanceUd,
    });
    return continueOrRecurseWayfindingV2Pattern({
      reactingUnit,
      nextPose: slideResult.intermediatePose,
      nextRemainingDistanceUd: slideResult.remainingDistanceUd,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      nextAvoidanceSteps: [...baseAvoidanceSteps, slideStep],
      nextLaterSlideAvailable: false,
      nextRemainingWheelBudgetRadians: remainingWheelBudgetRadians,
      blockerUnitIds,
      patternId: `slide-${side}-straight`,
      reasonCodes: ['hard-conflict-slide-clearance'],
      recursionDepth,
      decisionTrace,
      solverMemo,
    });
  };

  const getSlidePatternResults = (side, travelledDistanceUd) => {
    const patternStartPose = getPatternStartPose(travelledDistanceUd);
    const patternRemainingDistanceUd = Number(Math.max(0, distanceUd - travelledDistanceUd).toFixed(3));
    if (patternRemainingDistanceUd <= GEOMETRY_EPSILON) {
      return [{ accepted: false, reason: 'no-remaining-distance' }];
    }

    const patternUnit = {
      ...reactingUnit,
      xUd: patternStartPose.xUd,
      yUd: patternStartPose.yUd,
      rotationRadians: patternStartPose.rotationRadians,
    };
    const minimumSlideDistanceUd = getMinimumClearanceSlideDistance({ blockerUnits, unit: patternUnit, side });
    const permittedSlideDistances = getPermittedLateSlideDistances(minimumSlideDistanceUd, patternRemainingDistanceUd);
    if (permittedSlideDistances.length === 0) {
      return [{ accepted: false, reason: 'no-legal-slide-distance' }];
    }

    return permittedSlideDistances.map((slideDistanceUd) => evaluateSlidePattern(side, travelledDistanceUd, slideDistanceUd));
  };

  const evaluateWheelOutStep = (pivotSide, angleRadians, travelledDistanceUd) => {
    const patternStartPose = getPatternStartPose(travelledDistanceUd);
    const patternRemainingDistanceUd = Number(Math.max(0, distanceUd - travelledDistanceUd).toFixed(3));
    if (patternRemainingDistanceUd <= GEOMETRY_EPSILON) {
      return { accepted: false, reason: 'no-remaining-distance' };
    }

    if (getWheelDistanceUdForAngleRadians(angleRadians) > patternRemainingDistanceUd + GEOMETRY_EPSILON) {
      return { accepted: false, reason: 'insufficient-wheel-budget-or-distance' };
    }

    const wheelResult = getWheelAdjustedEvadePose({
      reactingUnit,
      reorientedPose: patternStartPose,
      pivotSide,
      angleRadians,
      totalDistanceUd: patternRemainingDistanceUd,
    });
    const wheelStep = createEvadeAvoidanceStep({
      id: `wayfinding-v2-wheel-step-${pivotSide}-${angleRadians.toFixed(3)}`,
      type: 'obstacle-wheel',
      pivotSide,
      angleRadians: Number(angleRadians.toFixed(6)),
      spentDistanceUd: wheelResult.spentDistanceUd,
      endPose: wheelResult.intermediatePose,
      remainingDistanceUd: wheelResult.remainingDistanceUd,
    });

    const wheelIntermediateLegal = isIntermediatePoseLegal({
      reactingUnit,
      pose: wheelResult.intermediatePose,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      solverMemo,
    });
    if (!wheelIntermediateLegal) {
      return { accepted: false, reason: 'intermediate-blocked' };
    }

    const wheelArcLegal = isWheelArcPathLegal({
      reactingUnit,
      startPose: patternStartPose,
      pivotSide,
      angleRadians,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      solverMemo,
    });
    if (!wheelArcLegal) {
      return { accepted: false, reason: 'wheel-arc-swept-path-blocked' };
    }

    return {
      accepted: true,
      wheelResult,
      wheelStep,
    };
  };

  const evaluateWheelPattern = (pivotSide, angleRadians, travelledDistanceUd) => {
    const wheelOutStepResult = evaluateWheelOutStep(pivotSide, angleRadians, travelledDistanceUd);
    if (!wheelOutStepResult?.accepted) {
      return wheelOutStepResult;
    }

    const continuedPatternResult = continueOrRecurseWayfindingV2Pattern({
      reactingUnit,
      nextPose: wheelOutStepResult.wheelResult.intermediatePose,
      nextRemainingDistanceUd: wheelOutStepResult.wheelResult.remainingDistanceUd,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      nextAvoidanceSteps: [...baseAvoidanceSteps, wheelOutStepResult.wheelStep],
      nextLaterSlideAvailable: laterSlideAvailable,
      nextRemainingWheelBudgetRadians: Math.max(0, remainingWheelBudgetRadians - angleRadians),
      blockerUnitIds,
      patternId: `wheel-${pivotSide}-${angleRadians.toFixed(3)}-straight`,
      reasonCodes: ['hard-conflict-wheel-out-clearance', 'wheel-arc-swept-check-sampled'],
      recursionDepth,
      decisionTrace,
      solverMemo,
    });

    return {
      ...continuedPatternResult,
      wheelResult: wheelOutStepResult.wheelResult,
      wheelStep: wheelOutStepResult.wheelStep,
    };
  };

  const evaluateWheelBackPattern = (pivotSide, angleRadians, travelledDistanceUd) => {
    const oppositePivotSide = getOppositePivotSide(pivotSide);
    const wheelOutStepResult = evaluateWheelOutStep(pivotSide, angleRadians, travelledDistanceUd);
    if (!wheelOutStepResult?.accepted) {
      return wheelOutStepResult;
    }

    const wheelBackDistanceUd = getWheelDistanceUdForAngleRadians(angleRadians);
    const maximumStraightDistanceUd = Number(Math.max(0, (wheelOutStepResult.wheelResult?.remainingDistanceUd ?? 0) - wheelBackDistanceUd).toFixed(3));
    if (maximumStraightDistanceUd <= GEOMETRY_EPSILON || (angleRadians * 2) > (Math.PI / 2) + GEOMETRY_EPSILON) {
      return { accepted: false, reason: 'insufficient-realignment-budget' };
    }

    let latestRejectedReason = 'pre-wheel-back-path-blocked';
    const straightProbeValues = [...getWayfindingTravelProbeValues(0, maximumStraightDistanceUd)]
      .sort((leftValue, rightValue) => leftValue - rightValue);

    for (const straightDistanceUd of straightProbeValues) {
      const preWheelBackPose = getLinearEndPose(
        wheelOutStepResult.wheelResult.intermediatePose,
        wheelOutStepResult.wheelResult.intermediatePose.rotationRadians,
        straightDistanceUd,
      );
      const preWheelBackPathLegal = isCandidateEndPoseLegal({
        candidateStartPose: wheelOutStepResult.wheelResult.intermediatePose,
        candidateEndPose: preWheelBackPose,
        reactingUnit,
        battlefieldProfile,
        units,
        ignoredUnitIds,
        solverMemo,
      });
      if (!preWheelBackPathLegal) {
        latestRejectedReason = 'pre-wheel-back-path-blocked';
        continue;
      }

      const wheelBackResult = getWheelAdjustedEvadePose({
        reactingUnit,
        reorientedPose: preWheelBackPose,
        pivotSide: oppositePivotSide,
        angleRadians,
        totalDistanceUd: Number(Math.max(wheelBackDistanceUd, (wheelOutStepResult.wheelResult?.remainingDistanceUd ?? 0) - straightDistanceUd).toFixed(3)),
      });
      const wheelBackStep = createEvadeAvoidanceStep({
        id: `wayfinding-v2-wheel-back-step-${oppositePivotSide}-${angleRadians.toFixed(3)}`,
        type: 'obstacle-wheel',
        pivotSide: oppositePivotSide,
        angleRadians: Number(angleRadians.toFixed(6)),
        spentDistanceUd: wheelBackDistanceUd,
        endPose: wheelBackResult.intermediatePose,
        remainingDistanceUd: wheelBackResult.remainingDistanceUd,
      });
      const wheelBackPatternResult = continueOrRecurseWayfindingV2Pattern({
        reactingUnit,
        nextPose: wheelBackResult.intermediatePose,
        nextRemainingDistanceUd: wheelBackResult.remainingDistanceUd,
        battlefieldProfile,
        units,
        ignoredUnitIds,
        nextAvoidanceSteps: [...baseAvoidanceSteps, wheelOutStepResult.wheelStep, wheelBackStep],
        nextLaterSlideAvailable: laterSlideAvailable,
        nextRemainingWheelBudgetRadians: Math.max(0, remainingWheelBudgetRadians - (angleRadians * 2)),
        blockerUnitIds,
        patternId: `wheel-${pivotSide}-${angleRadians.toFixed(3)}-straight-wheel-${oppositePivotSide}-${angleRadians.toFixed(3)}`,
        reasonCodes: ['hard-conflict-wheel-out-clearance', 'realignment-wheel-back', 'wheel-arc-swept-check-sampled'],
        recursionDepth,
        decisionTrace,
        solverMemo,
      });
      if (wheelBackPatternResult?.accepted) {
        return wheelBackPatternResult;
      }

      latestRejectedReason = wheelBackPatternResult?.reason ?? 'wheel-back-end-blocked';
    }

    return {
      accepted: false,
      reason: latestRejectedReason,
    };
  };

  const hasLaterSlideRoot = baseAvoidanceSteps.some((step) => step?.type === 'slide');

  if (laterSlideAvailable) {
    for (const side of ['left', 'right']) {
      const patternId = `slide-${side}-straight`;
      let slidePatternResults = [];
      let slidePatternRejectedReason = 'continued-path-blocked';
      for (const travelledDistanceUd of getWayfindingTravelProbeValues(conservativeTravelledDistanceUd, maximumTravelledDistanceUd)) {
        const travelResults = getSlidePatternResults(side, travelledDistanceUd);
        const acceptedTravelResults = travelResults.filter((result) => result?.accepted);
        if (acceptedTravelResults.length > 0) {
          slidePatternResults = acceptedTravelResults;
          break;
        }
        slidePatternRejectedReason = travelResults.find((result) => result?.reason)?.reason ?? slidePatternRejectedReason;
      }

      if (slidePatternResults.length === 0) {
        const fallbackSlidePatternResult = evaluateSlidePattern(side, conservativeTravelledDistanceUd);
        if (fallbackSlidePatternResult?.accepted) {
          slidePatternResults = [fallbackSlidePatternResult];
        } else {
          slidePatternRejectedReason = fallbackSlidePatternResult?.reason ?? slidePatternRejectedReason;
        }
      }

      if (slidePatternResults.length === 0) {
        recordPattern(patternId, 'rejected', slidePatternRejectedReason);
        continue;
      }

      for (const slidePatternResult of slidePatternResults) {
        const candidate = slidePatternResult.candidate;
        candidates.push(candidate);
        recordPattern(patternId, 'accepted', 'legal-slide-straight-pattern', candidate);
      }
    }
  }

  for (const pivotSide of [MOVEMENT_PIVOT_SIDES.LEFT, MOVEMENT_PIVOT_SIDES.RIGHT]) {
    for (const angleRadians of EVADE_WAYFINDING_V2_WHEEL_ANGLES_RADIANS) {
      const patternId = `wheel-${pivotSide}-${angleRadians.toFixed(3)}-straight`;
      if (angleRadians > remainingWheelBudgetRadians + GEOMETRY_EPSILON || getWheelDistanceUdForAngleRadians(angleRadians) > remainingDistanceUd + GEOMETRY_EPSILON) {
        recordPattern(patternId, 'rejected', 'insufficient-wheel-budget-or-distance');
        continue;
      }

      const wheelPatternResult = getLatestAcceptedWayfindingPatternResult({
        minimumTravelledDistanceUd: conservativeTravelledDistanceUd,
        maximumTravelledDistanceUd,
        evaluateTravelledDistance: (travelledDistanceUd) => evaluateWheelPattern(pivotSide, angleRadians, travelledDistanceUd),
      }) ?? evaluateWheelPattern(pivotSide, angleRadians, conservativeTravelledDistanceUd);

      if (!wheelPatternResult?.accepted) {
        recordPattern(patternId, 'rejected', wheelPatternResult?.reason ?? 'continued-path-blocked');
        continue;
      }

      const candidate = wheelPatternResult.candidate;
      candidates.push(candidate);
      recordPattern(patternId, 'accepted', 'legal-wheel-out-straight-pattern', candidate);

      const wheelBackPatternId = `wheel-${pivotSide}-${angleRadians.toFixed(3)}-straight-wheel-${getOppositePivotSide(pivotSide)}-${angleRadians.toFixed(3)}`;

      const wheelBackPatternResult = getLatestAcceptedWayfindingPatternResult({
        minimumTravelledDistanceUd: conservativeTravelledDistanceUd,
        maximumTravelledDistanceUd,
        probeOrder: hasLaterSlideRoot ? 'earliest-first' : 'latest-first',
        evaluateTravelledDistance: (travelledDistanceUd) => evaluateWheelBackPattern(pivotSide, angleRadians, travelledDistanceUd),
      }) ?? evaluateWheelBackPattern(pivotSide, angleRadians, conservativeTravelledDistanceUd);

      if (!wheelBackPatternResult?.accepted) {
        recordPattern(wheelBackPatternId, 'rejected', wheelBackPatternResult?.reason ?? 'pre-wheel-back-path-blocked');
        continue;
      }

      const wheelBackCandidate = wheelBackPatternResult.candidate;
      candidates.push(wheelBackCandidate);
      recordPattern(wheelBackPatternId, 'accepted', 'legal-wheel-out-straight-wheel-back-pattern', wheelBackCandidate);
    }
  }

  appendEvadeDecisionTrace(decisionTrace, {
    stage: 'wayfinding-v2-patterns',
    recursionDepth,
    conflict: {
      type: conflict.type,
      blockerKind: conflict.blockerKind,
      blockerUnitIds,
      travelledDistanceUd: conflict.travelledDistanceUd,
      encounterPose: conflict.encounterPose,
      manoeuvrePose: conflict.manoeuvrePose,
      manoeuvreTravelledDistanceUd: conflict.manoeuvreTravelledDistanceUd,
      friendlyInterpenetrationPolicy: conflict.friendlyInterpenetrationPolicy,
    },
    remainingDistanceUd,
    patternCandidates: patternSummaries.slice(0, 16),
    acceptedCandidateCount: candidates.length,
    limitation: 'wheel candidates require legal sampled wheel arc, intermediate pose, and post-wheel straight path in this slice',
  });

  return dedupeEvadeCandidates(candidates);
}

export function getPathAvoidanceCandidates({
  reactingUnit,
  startPose,
  distanceUd,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
  baseAvoidanceSteps = [],
  laterSlideAvailable = true,
  remainingWheelBudgetRadians = Math.PI / 2,
  blockerUnitIds = [],
  recursionDepth = 0,
  visitedStateKeys = [],
  decisionTrace = null,
  solverMemo = null,
}) {
  if (recursionDepth > EVADE_MAX_LATER_AVOIDANCE_STEPS) {
    appendEvadeDecisionTrace(decisionTrace, { stage: 'path-avoidance-stop', reason: 'max-depth', recursionDepth });
    return [];
  }

  const stateKey = [
    Number(startPose?.xUd ?? 0).toFixed(3),
    Number(startPose?.yUd ?? 0).toFixed(3),
    Number(startPose?.rotationRadians ?? 0).toFixed(3),
    Number(distanceUd ?? 0).toFixed(3),
    Number(remainingWheelBudgetRadians ?? 0).toFixed(3),
    laterSlideAvailable ? 'slide' : 'no-slide',
  ].join(':');

  if (visitedStateKeys.includes(stateKey)) {
    appendEvadeDecisionTrace(decisionTrace, { stage: 'path-avoidance-stop', reason: 'visited-state', recursionDepth, stateKey });
    return [];
  }

  const nextVisitedStateKeys = [...visitedStateKeys, stateKey];
  const straightEndPose = getLinearEndPose(startPose, startPose.rotationRadians, distanceUd);
  const firstOverlap = getMemoizedFirstLinearPathOverlap({ reactingUnit, startPose, endPose: straightEndPose, units, ignoredUnitIds, solverMemo })
    ?? getMemoizedFirstLinearPathOverlapAgainstUnits({
      reactingUnit,
      startPose,
      endPose: straightEndPose,
      blockerUnitIds,
      units,
      ignoredUnitIds,
      solverMemo,
    });

  if (!firstOverlap) {
    appendEvadeDecisionTrace(decisionTrace, { stage: 'path-avoidance-stop', reason: 'no-overlap', recursionDepth, startPose, distanceUd });
    return [];
  }

  const remainingDistanceUd = Number(Math.max(0, distanceUd - Number(firstOverlap.travelledDistanceUd ?? 0)).toFixed(3));
  if (remainingDistanceUd <= GEOMETRY_EPSILON) {
    appendEvadeDecisionTrace(decisionTrace, { stage: 'path-avoidance-stop', reason: 'no-remaining-distance', recursionDepth, firstOverlap, remainingDistanceUd });
    return [];
  }

  const continueOrCompleteAvoidance = ({ nextPose, nextRemainingDistanceUd, nextAvoidanceSteps, nextLaterSlideAvailable, nextRemainingWheelBudgetRadians, nextBlockerUnitIds }) => {
    if (!nextPose) {
      return [];
    }

    const intermediateInsideBattlefield = getMemoizedIsPoseInsideBattlefield({ reactingUnit, pose: nextPose, battlefieldProfile, solverMemo });
    const intermediateOverlap = intermediateInsideBattlefield
      ? getMemoizedDoesPoseOverlapAnyUnit({ reactingUnit, pose: nextPose, units, ignoredUnitIds, shrinkFootprintUd: 0.005, solverMemo })
      : true;

    if (!intermediateInsideBattlefield || intermediateOverlap) {
      appendEvadeDecisionTrace(decisionTrace, {
        stage: 'path-avoidance-reject',
        reason: !intermediateInsideBattlefield ? 'intermediate-outside-battlefield' : 'intermediate-overlap',
        recursionDepth,
        nextPose,
      });
      return [];
    }

    const continuedEndPose = getLinearEndPose(nextPose, nextPose.rotationRadians, nextRemainingDistanceUd);
    const insideBattlefield = getMemoizedIsPoseInsideBattlefield({ reactingUnit, pose: continuedEndPose, battlefieldProfile, solverMemo });
    const finalOverlap = insideBattlefield
      ? getMemoizedDoesPoseOverlapAnyUnit({ reactingUnit, pose: continuedEndPose, units, ignoredUnitIds, shrinkFootprintUd: 0.005, solverMemo })
      : true;
    const nextOverlap = insideBattlefield && !finalOverlap
      ? getMemoizedFirstLinearPathOverlap({ reactingUnit, startPose: nextPose, endPose: continuedEndPose, units, ignoredUnitIds, solverMemo })
      : { unitId: null };

    if (insideBattlefield && !finalOverlap && !nextOverlap) {
      appendEvadeDecisionTrace(decisionTrace, { stage: 'path-avoidance-accept', recursionDepth, nextPose, continuedEndPose });
      return [createAvoidanceCandidateFromSteps({ avoidanceSteps: nextAvoidanceSteps, endPose: continuedEndPose, blockerUnitIds: nextBlockerUnitIds })];
    }

    if (nextRemainingDistanceUd <= GEOMETRY_EPSILON) {
      appendEvadeDecisionTrace(decisionTrace, { stage: 'path-avoidance-reject', reason: 'blocked-at-end-no-distance-left', recursionDepth, nextPose, continuedEndPose, insideBattlefield, finalOverlap, nextOverlap });
      return [];
    }

    appendEvadeDecisionTrace(decisionTrace, { stage: 'path-avoidance-recurse', recursionDepth, nextPose, nextRemainingDistanceUd, insideBattlefield, finalOverlap, nextOverlap });
    return getPathAvoidanceCandidates({
      reactingUnit,
      startPose: nextPose,
      distanceUd: nextRemainingDistanceUd,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      baseAvoidanceSteps: nextAvoidanceSteps,
      laterSlideAvailable: nextLaterSlideAvailable,
      remainingWheelBudgetRadians: nextRemainingWheelBudgetRadians,
      blockerUnitIds: nextBlockerUnitIds,
      recursionDepth: recursionDepth + 1,
      visitedStateKeys: nextVisitedStateKeys,
      decisionTrace,
      solverMemo,
    });
  };

  const candidates = [];
  const encounterPose = {
    xUd: Number(firstOverlap.encounterPose.xUd ?? 0),
    yUd: Number(firstOverlap.encounterPose.yUd ?? 0),
    rotationRadians: Number(firstOverlap.encounterPose.rotationRadians ?? startPose.rotationRadians ?? 0),
  };
  const encounterUnit = { ...reactingUnit, xUd: encounterPose.xUd, yUd: encounterPose.yUd, rotationRadians: encounterPose.rotationRadians };
  const encounterBlockers = getMemoizedOverlappingUnitsAtPose({ reactingUnit, pose: encounterPose, units, ignoredUnitIds, solverMemo });
  const firstOverlapBlockerIds = new Set((firstOverlap.blockerUnitIds?.length > 0 ? firstOverlap.blockerUnitIds : [firstOverlap.unitId]).filter(Boolean));
  const sampledOverlapBlockers = firstOverlap.blockerUnits?.length > 0 ? firstOverlap.blockerUnits : units.filter((unit) => firstOverlapBlockerIds.has(unit?.id));
  const relevantEncounterBlockers = Array.from(new Map([
    ...sampledOverlapBlockers,
    ...encounterBlockers,
  ].filter(Boolean).map((unit) => [unit.id, unit])).values());
  const clearanceBlockers = getClearanceBlockerSummaries({ blockerUnits: relevantEncounterBlockers, unit: encounterUnit });
  const nextBlockerUnitIds = Array.from(new Set([
    ...blockerUnitIds,
    ...relevantEncounterBlockers.map((unit) => unit?.id ?? null),
  ].filter(Boolean)));
  appendEvadeDecisionTrace(decisionTrace, {
    stage: 'path-avoidance-encounter',
    recursionDepth,
    firstOverlap: {
      unitId: firstOverlap.unitId ?? null,
      travelledDistanceUd: Number.isFinite(firstOverlap.travelledDistanceUd) ? firstOverlap.travelledDistanceUd : null,
      encounterPose: firstOverlap.encounterPose ?? null,
      blockedPose: firstOverlap.blockedPose ?? null,
    },
    remainingDistanceUd,
    blockerUnitIds: nextBlockerUnitIds,
    clearanceBlockers,
  });

  if (laterSlideAvailable) {
    for (const side of ['left', 'right']) {
      const minimumSlideDistanceUd = relevantEncounterBlockers.length > 0 ? getMinimumClearanceSlideDistance({ blockerUnits: relevantEncounterBlockers, unit: encounterUnit, side }) : 0;
      appendEvadeDecisionTrace(decisionTrace, {
        stage: 'path-avoidance-slide-side',
        recursionDepth,
        side,
        minimumSlideDistanceUd,
        limitingBlocker: getLimitingClearanceBlocker(clearanceBlockers, side),
        permittedDistances: getPermittedLateSlideDistances(minimumSlideDistanceUd, remainingDistanceUd),
      });
      let previousRejectedSlideDistanceUd = null;
      for (const slideDistanceUd of getPermittedLateSlideDistances(minimumSlideDistanceUd, remainingDistanceUd)) {
        const evaluateSlideDistance = (trialSlideDistanceUd) => {
          const slideResult = getSlideAdjustedEvadePose({ reorientedPose: encounterPose, side, slideDistanceUd: trialSlideDistanceUd, totalDistanceUd: remainingDistanceUd });
          const slideStep = createEvadeAvoidanceStep({
            id: `slide-step-${side}-${trialSlideDistanceUd.toFixed(6)}`,
            type: 'slide',
            side,
            distanceUd: Number(trialSlideDistanceUd.toFixed(6)),
            spentDistanceUd: Number(trialSlideDistanceUd.toFixed(6)),
            endPose: slideResult.intermediatePose,
            remainingDistanceUd: slideResult.remainingDistanceUd,
          });
          const completedCandidates = continueOrCompleteAvoidance({
            nextPose: slideResult.intermediatePose,
            nextRemainingDistanceUd: slideResult.remainingDistanceUd,
            nextAvoidanceSteps: [...baseAvoidanceSteps, slideStep],
            nextLaterSlideAvailable: false,
            nextRemainingWheelBudgetRadians: remainingWheelBudgetRadians,
            nextBlockerUnitIds,
          });
          return completedCandidates.length > 0 ? { completedCandidates } : null;
        };

        const coarseSlideResult = evaluateSlideDistance(slideDistanceUd);
        if (coarseSlideResult?.completedCandidates?.length > 0) {
          const refinedSlideResult = previousRejectedSlideDistanceUd === null
            ? coarseSlideResult
            : refineSlideDistanceResult({ minimumDistanceUd: previousRejectedSlideDistanceUd, maximumDistanceUd: slideDistanceUd, evaluateDistance: evaluateSlideDistance }) ?? coarseSlideResult;
          candidates.push(...refinedSlideResult.completedCandidates);
          break;
        }

        previousRejectedSlideDistanceUd = slideDistanceUd;
      }
    }
  }

  for (const pivotSide of [MOVEMENT_PIVOT_SIDES.LEFT, MOVEMENT_PIVOT_SIDES.RIGHT]) {
    for (let angleRadians = EVADE_WHEEL_STEP_RADIANS; angleRadians <= remainingWheelBudgetRadians + GEOMETRY_EPSILON; angleRadians += EVADE_WHEEL_STEP_RADIANS) {
      const lowerAngleRadians = Math.max(0, angleRadians - EVADE_WHEEL_STEP_RADIANS);
      const wheelDistanceUd = getWheelDistanceUdForAngleRadians(angleRadians);
      if (wheelDistanceUd > remainingDistanceUd + GEOMETRY_EPSILON) {
        break;
      }

      const refinedWheelResult = refineWheelAngleResult({
        minimumAngleRadians: lowerAngleRadians,
        maximumAngleRadians: angleRadians,
        evaluateAngle: (trialAngleRadians) => {
          if (!isRetainedAvoidanceWheelAngle(trialAngleRadians)) {
            return null;
          }

          const wheelResult = getWheelAdjustedEvadePose({ reactingUnit, reorientedPose: encounterPose, pivotSide, angleRadians: trialAngleRadians, totalDistanceUd: remainingDistanceUd });
          const wheelStep = createEvadeAvoidanceStep({
            id: `wheel-step-${pivotSide}-${trialAngleRadians.toFixed(6)}`,
            type: 'obstacle-wheel',
            pivotSide,
            angleRadians: Number(trialAngleRadians.toFixed(6)),
            spentDistanceUd: wheelResult.spentDistanceUd,
            endPose: wheelResult.intermediatePose,
            remainingDistanceUd: wheelResult.remainingDistanceUd,
          });
          const completedCandidates = continueOrCompleteAvoidance({
            nextPose: wheelResult.intermediatePose,
            nextRemainingDistanceUd: wheelResult.remainingDistanceUd,
            nextAvoidanceSteps: [...baseAvoidanceSteps, wheelStep],
            nextLaterSlideAvailable: laterSlideAvailable,
            nextRemainingWheelBudgetRadians: Math.max(0, remainingWheelBudgetRadians - trialAngleRadians),
            nextBlockerUnitIds,
          });
          return completedCandidates.length > 0 ? { completedCandidates } : null;
        },
      });

      if (refinedWheelResult?.completedCandidates?.length > 0) {
        candidates.push(...refinedWheelResult.completedCandidates);
        break;
      }
    }
  }

  return dedupeEvadeCandidates(candidates);
}

function getPoseDistanceUd(leftPose, rightPose) {
  if (!leftPose || !rightPose) {
    return 0;
  }

  const deltaXUd = Number(leftPose.xUd ?? 0) - Number(rightPose.xUd ?? 0);
  const deltaYUd = Number(leftPose.yUd ?? 0) - Number(rightPose.yUd ?? 0);
  return Number(Math.hypot(deltaXUd, deltaYUd).toFixed(3));
}

function mergeCandidateAnalysis(candidate, analysis = null) {
  if (!candidate || !analysis) {
    return candidate;
  }

  return {
    ...candidate,
    analysis: {
      ...(candidate.analysis ?? {}),
      ...analysis,
    },
  };
}

export function dedupeEvadeCandidates(candidates = []) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = candidate?.id ?? [
      candidate?.type,
      candidate?.side,
      candidate?.pivotSide,
      Number(candidate?.angleRadians ?? 0).toFixed(3),
      Number(candidate?.distanceUd ?? candidate?.spentDistanceUd ?? 0).toFixed(3),
    ].join(':');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getEvadeCandidateInitialDecisionKey(candidate) {
  const firstStepType = candidate?.avoidanceSteps?.[0]?.type ?? candidate?.type ?? null;
  return firstStepType === 'direction-wheel' ? 'direction-wheel' : 'no-direction-wheel';
}

function getEvadeChoiceReferencePose(contactSnapshot = null, fallbackPose = null) {
  return contactSnapshot?.chargerContactPose ?? contactSnapshot?.chargerStartPose ?? fallbackPose ?? null;
}

function getEvadeCandidateSlideTieBreakScore(candidate = null) {
  const steps = getEvadeCandidateSteps(candidate);
  const laterSteps = steps[0]?.type === 'direction-wheel' ? steps.slice(1) : steps;
  const hasSlide = laterSteps.some((step) => step?.type === 'slide');
  const hasObstacleWheel = laterSteps.some((step) => step?.type === 'obstacle-wheel');

  if (hasSlide && !hasObstacleWheel) {
    return 2;
  }

  if (hasSlide) {
    return 1;
  }

  return 0;
}

function getAbsoluteAngleDeltaRadians(leftRadians = 0, rightRadians = 0) {
  return Math.abs(getSignedAngleDeltaRadians(leftRadians, rightRadians));
}

function getDirectionWheelCorridorReferencePose(candidate = null) {
  const steps = getEvadeCandidateSteps(candidate);
  const initialDirectionWheelStep = steps[0]?.type === 'direction-wheel' ? steps[0] : null;
  return initialDirectionWheelStep?.endPose ?? null;
}

function getPoseLateralOffsetFromCorridorUd(pose = null, corridorReferencePose = null, corridorRotationRadians = 0) {
  if (!pose || !corridorReferencePose) {
    return 0;
  }

  const { rightAxis } = getAxesFromRotation(corridorRotationRadians);
  const deltaXUd = Number(pose.xUd ?? 0) - Number(corridorReferencePose.xUd ?? 0);
  const deltaYUd = Number(pose.yUd ?? 0) - Number(corridorReferencePose.yUd ?? 0);
  return Number(Math.abs((deltaXUd * rightAxis.x) + (deltaYUd * rightAxis.y)).toFixed(3));
}

function getDirectionWheelBranchTargetRotationRadians(candidate = null) {
  const steps = getEvadeCandidateSteps(candidate);
  const initialDirectionWheelStep = steps[0]?.type === 'direction-wheel' ? steps[0] : null;
  return Number.isFinite(initialDirectionWheelStep?.endPose?.rotationRadians)
    ? initialDirectionWheelStep.endPose.rotationRadians
    : Number.isFinite(candidate?.endPose?.rotationRadians)
      ? candidate.endPose.rotationRadians
      : null;
}

function hasRealignmentWheelBack(candidate = null) {
  const steps = getEvadeCandidateSteps(candidate);
  const laterSteps = steps[0]?.type === 'direction-wheel' ? steps.slice(1) : steps;
  const laterWheelSteps = laterSteps.filter((step) => step?.type === 'obstacle-wheel');
  if (laterWheelSteps.length < 2) {
    return false;
  }

  const penultimateWheelStep = laterWheelSteps[laterWheelSteps.length - 2];
  const lastWheelStep = laterWheelSteps[laterWheelSteps.length - 1];
  return penultimateWheelStep?.pivotSide
    && lastWheelStep?.pivotSide
    && penultimateWheelStep.pivotSide !== lastWheelStep.pivotSide;
}

function getDirectionWheelRetentionSignals(candidate = null) {
  const steps = getEvadeCandidateSteps(candidate);
  const laterSteps = steps[0]?.type === 'direction-wheel' ? steps.slice(1) : steps;
  const firstLaterStep = laterSteps[0] ?? null;
  const targetRotationRadians = getDirectionWheelBranchTargetRotationRadians(candidate);
  const corridorReferencePose = getDirectionWheelCorridorReferencePose(candidate);
  const finalRotationRadians = Number.isFinite(candidate?.endPose?.rotationRadians)
    ? candidate.endPose.rotationRadians
    : null;
  const laterPoses = [
    ...laterSteps.map((step) => step?.endPose).filter(Boolean),
    candidate?.endPose ?? null,
  ].filter(Boolean);
  const finalLateralDeviationUd = getPoseLateralOffsetFromCorridorUd(candidate?.endPose ?? null, corridorReferencePose, targetRotationRadians ?? 0);
  const maxLateralDeviationUd = laterPoses.length > 0
    ? Number(Math.max(...laterPoses.map((pose) => getPoseLateralOffsetFromCorridorUd(pose, corridorReferencePose, targetRotationRadians ?? 0))).toFixed(3))
    : 0;
  const totalLaterSpentDistanceUd = Number(laterSteps
    .reduce((sum, step) => sum + Number(step?.spentDistanceUd ?? step?.distanceUd ?? 0), 0)
    .toFixed(3));
  const largestLaterWheelRadians = Number(laterSteps
    .filter((step) => step?.type === 'obstacle-wheel')
    .reduce((largestAngleRadians, step) => Math.max(largestAngleRadians, Number(step?.angleRadians ?? 0)), 0)
    .toFixed(6));

  return {
    laterStepCount: laterSteps.length,
    laterWheelCount: laterSteps.filter((step) => step?.type === 'obstacle-wheel').length,
    laterSlideCount: laterSteps.filter((step) => step?.type === 'slide').length,
    totalLaterSpentDistanceUd,
    largestLaterWheelRadians,
    finalLateralDeviationUd,
    maxLateralDeviationUd,
    firstLaterStepType: firstLaterStep?.type ?? null,
    firstLaterRemainingDistanceUd: Number.isFinite(firstLaterStep?.remainingDistanceUd)
      ? firstLaterStep.remainingDistanceUd
      : null,
    finalRemainingDistanceUd: Number.isFinite(candidate?.remainingDistanceUd) ? candidate.remainingDistanceUd : 0,
    hasRealignmentWheelBack: hasRealignmentWheelBack(candidate),
    finalAlignmentDeltaRadians: Number.isFinite(targetRotationRadians) && Number.isFinite(finalRotationRadians)
      ? getAbsoluteAngleDeltaRadians(finalRotationRadians, targetRotationRadians)
      : null,
  };
}

function getDirectionWheelCorridorScore(candidate = null) {
  const signals = getDirectionWheelRetentionSignals(candidate);
  return {
    maxLateralDeviationUd: signals.maxLateralDeviationUd,
    finalLateralDeviationUd: signals.finalLateralDeviationUd,
    totalLaterSpentDistanceUd: signals.totalLaterSpentDistanceUd,
    largestLaterWheelRadians: signals.largestLaterWheelRadians,
    finalAlignmentDeltaRadians: signals.finalAlignmentDeltaRadians,
    laterStepCount: signals.laterStepCount,
    laterSlideCount: signals.laterSlideCount,
    laterWheelCount: signals.laterWheelCount,
    firstLaterStepType: signals.firstLaterStepType,
  };
}

function getDirectionWheelFirstLaterStepPriority(stepType = null) {
  if (stepType === 'obstacle-wheel') {
    return 0;
  }

  if (stepType === 'slide') {
    return 1;
  }

  return 2;
}

function shouldPreferDirectionWheelReserveWithinAlignmentTolerance(leftSignals, rightSignals) {
  if (!leftSignals?.hasRealignmentWheelBack || !rightSignals?.hasRealignmentWheelBack) {
    return false;
  }

  if (!Number.isFinite(leftSignals.finalAlignmentDeltaRadians) || !Number.isFinite(rightSignals.finalAlignmentDeltaRadians)) {
    return false;
  }

  return Math.abs(leftSignals.finalAlignmentDeltaRadians - rightSignals.finalAlignmentDeltaRadians)
    <= EVADE_DIRECTION_WHEEL_RESERVE_ALIGNMENT_TOLERANCE_RADIANS + GEOMETRY_EPSILON;
}

function shouldPreferDirectionWheelSlideOverWheelPath(leftSignals, rightSignals) {
  if (leftSignals?.firstLaterStepType !== 'slide' || rightSignals?.firstLaterStepType !== 'obstacle-wheel') {
    return false;
  }

  const alignmentIsComparable = Number.isFinite(leftSignals.finalAlignmentDeltaRadians)
    && Number.isFinite(rightSignals.finalAlignmentDeltaRadians)
    && Math.abs(leftSignals.finalAlignmentDeltaRadians - rightSignals.finalAlignmentDeltaRadians)
      <= EVADE_DIRECTION_WHEEL_RESERVE_ALIGNMENT_TOLERANCE_RADIANS + GEOMETRY_EPSILON;
  const savesLaterWheel = (leftSignals?.laterWheelCount ?? 0) < (rightSignals?.laterWheelCount ?? 0);
  const doesNotAddLaterSteps = (leftSignals?.laterStepCount ?? 0) <= (rightSignals?.laterStepCount ?? 0);

  return alignmentIsComparable || (savesLaterWheel && doesNotAddLaterSteps);
}

function shouldPreferDirectionWheelSlideCorridorBypass(leftSignals, rightSignals) {
  if (leftSignals?.firstLaterStepType !== 'slide' || rightSignals?.firstLaterStepType !== 'obstacle-wheel') {
    return false;
  }

  if ((leftSignals?.laterSlideCount ?? 0) > 1) {
    return false;
  }

  const alignmentIsComparableOrBetter = Number.isFinite(leftSignals.finalAlignmentDeltaRadians)
    && Number.isFinite(rightSignals.finalAlignmentDeltaRadians)
    && leftSignals.finalAlignmentDeltaRadians <= rightSignals.finalAlignmentDeltaRadians
      + EVADE_DIRECTION_WHEEL_RESERVE_ALIGNMENT_TOLERANCE_RADIANS
      + GEOMETRY_EPSILON;
  if (!alignmentIsComparableOrBetter) {
    return false;
  }

  const dominatesCorridorAndSpend = (leftSignals.maxLateralDeviationUd ?? Number.POSITIVE_INFINITY)
      <= (rightSignals.maxLateralDeviationUd ?? Number.POSITIVE_INFINITY) + GEOMETRY_EPSILON
    && (leftSignals.finalLateralDeviationUd ?? Number.POSITIVE_INFINITY)
      <= (rightSignals.finalLateralDeviationUd ?? Number.POSITIVE_INFINITY) + GEOMETRY_EPSILON
    && (leftSignals.totalLaterSpentDistanceUd ?? Number.POSITIVE_INFINITY)
      <= (rightSignals.totalLaterSpentDistanceUd ?? Number.POSITIVE_INFINITY) + GEOMETRY_EPSILON
    && (leftSignals.largestLaterWheelRadians ?? Number.POSITIVE_INFINITY)
      <= (rightSignals.largestLaterWheelRadians ?? Number.POSITIVE_INFINITY) + GEOMETRY_EPSILON;
  const improvesAnyCorridorOrSpendMetric = (leftSignals.maxLateralDeviationUd ?? Number.POSITIVE_INFINITY)
      + GEOMETRY_EPSILON < (rightSignals.maxLateralDeviationUd ?? Number.POSITIVE_INFINITY)
    || (leftSignals.finalLateralDeviationUd ?? Number.POSITIVE_INFINITY)
      + GEOMETRY_EPSILON < (rightSignals.finalLateralDeviationUd ?? Number.POSITIVE_INFINITY)
    || (leftSignals.totalLaterSpentDistanceUd ?? Number.POSITIVE_INFINITY)
      + GEOMETRY_EPSILON < (rightSignals.totalLaterSpentDistanceUd ?? Number.POSITIVE_INFINITY)
    || (leftSignals.largestLaterWheelRadians ?? Number.POSITIVE_INFINITY)
      + GEOMETRY_EPSILON < (rightSignals.largestLaterWheelRadians ?? Number.POSITIVE_INFINITY);
  if (dominatesCorridorAndSpend && improvesAnyCorridorOrSpendMetric) {
    return true;
  }

  const materialFinalCorridorGain = (leftSignals.finalLateralDeviationUd ?? Number.POSITIVE_INFINITY)
    + (EVADE_DIRECTION_WHEEL_CORRIDOR_PRIORITY_THRESHOLD_UD / 2)
    + GEOMETRY_EPSILON < (rightSignals.finalLateralDeviationUd ?? Number.POSITIVE_INFINITY);
  const spendsLessManoeuvreDistance = (leftSignals.totalLaterSpentDistanceUd ?? Number.POSITIVE_INFINITY)
    + GEOMETRY_EPSILON < (rightSignals.totalLaterSpentDistanceUd ?? Number.POSITIVE_INFINITY);
  const noWorseLargestWheel = (leftSignals.largestLaterWheelRadians ?? Number.POSITIVE_INFINITY)
    <= (rightSignals.largestLaterWheelRadians ?? Number.POSITIVE_INFINITY) + GEOMETRY_EPSILON;

  return materialFinalCorridorGain && spendsLessManoeuvreDistance && noWorseLargestWheel;
}

function shouldPreferDirectionWheelSlideRootWheelBack(leftSignals, rightSignals) {
  if (leftSignals?.firstLaterStepType !== 'slide' || rightSignals?.firstLaterStepType !== 'slide') {
    return false;
  }

  if (!leftSignals?.hasRealignmentWheelBack || rightSignals?.hasRealignmentWheelBack) {
    return false;
  }

  const usesHumanScaleWheelBack = (leftSignals?.laterWheelCount ?? 0) <= 2
    && (leftSignals?.largestLaterWheelRadians ?? Math.PI) <= ((rightSignals?.largestLaterWheelRadians ?? Math.PI) + GEOMETRY_EPSILON)
    && ((leftSignals?.totalLaterSpentDistanceUd ?? Number.POSITIVE_INFINITY) <= (rightSignals?.totalLaterSpentDistanceUd ?? 0) + EVADE_DIRECTION_WHEEL_SLIDE_ROOT_WHEEL_BACK_UD_TOLERANCE + GEOMETRY_EPSILON);

  return usesHumanScaleWheelBack;
}

function shouldPreferDirectionWheelRealignmentOverLaterSlide(leftSignals, rightSignals) {
  if (leftSignals?.firstLaterStepType !== 'obstacle-wheel' || rightSignals?.firstLaterStepType !== 'obstacle-wheel') {
    return false;
  }

  if (!leftSignals?.hasRealignmentWheelBack || rightSignals?.hasRealignmentWheelBack) {
    return false;
  }

  return (rightSignals?.laterSlideCount ?? 0) > 0;
}

function compareDirectionWheelBranchCandidates(leftCandidate, rightCandidate, referencePose = null) {
  const leftSignals = getDirectionWheelRetentionSignals(leftCandidate);
  const rightSignals = getDirectionWheelRetentionSignals(rightCandidate);

  const leftHasNoLaterAvoidance = leftSignals.laterStepCount === 0;
  const rightHasNoLaterAvoidance = rightSignals.laterStepCount === 0;
  if (leftHasNoLaterAvoidance !== rightHasNoLaterAvoidance) {
    return leftHasNoLaterAvoidance ? -1 : 1;
  }

  if (shouldPreferDirectionWheelSlideCorridorBypass(leftSignals, rightSignals)) {
    return -1;
  }

  if (shouldPreferDirectionWheelSlideCorridorBypass(rightSignals, leftSignals)) {
    return 1;
  }

  if (shouldPreferDirectionWheelSlideOverWheelPath(leftSignals, rightSignals)) {
    return -1;
  }

  if (shouldPreferDirectionWheelSlideOverWheelPath(rightSignals, leftSignals)) {
    return 1;
  }

  if (shouldPreferDirectionWheelSlideRootWheelBack(leftSignals, rightSignals)) {
    return -1;
  }

  if (shouldPreferDirectionWheelSlideRootWheelBack(rightSignals, leftSignals)) {
    return 1;
  }

  if (shouldPreferDirectionWheelRealignmentOverLaterSlide(leftSignals, rightSignals)) {
    return -1;
  }

  if (shouldPreferDirectionWheelRealignmentOverLaterSlide(rightSignals, leftSignals)) {
    return 1;
  }

  if (leftSignals.hasRealignmentWheelBack && rightSignals.hasRealignmentWheelBack) {
    const laterSlideCountDelta = leftSignals.laterSlideCount - rightSignals.laterSlideCount;
    if (laterSlideCountDelta !== 0) {
      return laterSlideCountDelta;
    }
  }

  const lateralDeviationDelta = leftSignals.maxLateralDeviationUd - rightSignals.maxLateralDeviationUd;
  const lateralDeviationIsMaterial = Math.abs(lateralDeviationDelta) > EVADE_DIRECTION_WHEEL_CORRIDOR_PRIORITY_THRESHOLD_UD + GEOMETRY_EPSILON;
  if (lateralDeviationIsMaterial) {
    return lateralDeviationDelta;
  }

  const realignmentDelta = (leftSignals.finalAlignmentDeltaRadians ?? Math.PI) - (rightSignals.finalAlignmentDeltaRadians ?? Math.PI);
  const leftHasMaterialRealignmentReturn = leftSignals.hasRealignmentWheelBack
    && ((leftSignals.finalAlignmentDeltaRadians ?? Math.PI) + EVADE_DIRECTION_WHEEL_RESERVE_ALIGNMENT_TOLERANCE_RADIANS + GEOMETRY_EPSILON
      < (rightSignals.finalAlignmentDeltaRadians ?? Math.PI));
  const rightHasMaterialRealignmentReturn = rightSignals.hasRealignmentWheelBack
    && ((rightSignals.finalAlignmentDeltaRadians ?? Math.PI) + EVADE_DIRECTION_WHEEL_RESERVE_ALIGNMENT_TOLERANCE_RADIANS + GEOMETRY_EPSILON
      < (leftSignals.finalAlignmentDeltaRadians ?? Math.PI));
  if (leftHasMaterialRealignmentReturn !== rightHasMaterialRealignmentReturn) {
    return leftHasMaterialRealignmentReturn ? -1 : 1;
  }

  const finalLateralDeviationDelta = leftSignals.finalLateralDeviationUd - rightSignals.finalLateralDeviationUd;
  if (Math.abs(finalLateralDeviationDelta) > (EVADE_DIRECTION_WHEEL_CORRIDOR_PRIORITY_THRESHOLD_UD / 2) + GEOMETRY_EPSILON) {
    return finalLateralDeviationDelta;
  }

  const totalLaterSpentDistanceDelta = leftSignals.totalLaterSpentDistanceUd - rightSignals.totalLaterSpentDistanceUd;
  if (Math.abs(totalLaterSpentDistanceDelta) > GEOMETRY_EPSILON) {
    return totalLaterSpentDistanceDelta;
  }

  const leftUsesMicroWheelChain = leftSignals.laterWheelCount > 2;
  const rightUsesMicroWheelChain = rightSignals.laterWheelCount > 2;
  if (leftUsesMicroWheelChain !== rightUsesMicroWheelChain) {
    return leftUsesMicroWheelChain ? 1 : -1;
  }

  const largestLaterWheelDelta = leftSignals.largestLaterWheelRadians - rightSignals.largestLaterWheelRadians;
  if (Math.abs(largestLaterWheelDelta) > GEOMETRY_EPSILON) {
    return largestLaterWheelDelta;
  }

  if (Math.abs(lateralDeviationDelta) > GEOMETRY_EPSILON) {
    return lateralDeviationDelta;
  }

  const laterStepPriorityDelta = getDirectionWheelFirstLaterStepPriority(leftSignals.firstLaterStepType)
    - getDirectionWheelFirstLaterStepPriority(rightSignals.firstLaterStepType);
  if (laterStepPriorityDelta !== 0) {
    return laterStepPriorityDelta;
  }

  const reservePreferenceEligible = shouldPreferDirectionWheelReserveWithinAlignmentTolerance(leftSignals, rightSignals);
  if (reservePreferenceEligible) {
    const finalRemainingDistanceDelta = rightSignals.finalRemainingDistanceUd - leftSignals.finalRemainingDistanceUd;
    if (Math.abs(finalRemainingDistanceDelta) > GEOMETRY_EPSILON) {
      return finalRemainingDistanceDelta;
    }

    const laterWheelCountDelta = leftSignals.laterWheelCount - rightSignals.laterWheelCount;
    if (laterWheelCountDelta !== 0) {
      return laterWheelCountDelta;
    }

    const laterStepCountDelta = leftSignals.laterStepCount - rightSignals.laterStepCount;
    if (laterStepCountDelta !== 0) {
      return laterStepCountDelta;
    }
  }

  if (Math.abs(realignmentDelta) > GEOMETRY_EPSILON) {
    return realignmentDelta;
  }

  if (leftSignals.hasRealignmentWheelBack !== rightSignals.hasRealignmentWheelBack) {
    return leftSignals.hasRealignmentWheelBack ? -1 : 1;
  }

  const laterWheelCountDelta = leftSignals.laterWheelCount - rightSignals.laterWheelCount;
  if (laterWheelCountDelta !== 0) {
    return laterWheelCountDelta;
  }

  const laterStepCountDelta = leftSignals.laterStepCount - rightSignals.laterStepCount;
  if (laterStepCountDelta !== 0) {
    return laterStepCountDelta;
  }

  const firstLaterRemainingDistanceDelta = (rightSignals.firstLaterRemainingDistanceUd ?? -1) - (leftSignals.firstLaterRemainingDistanceUd ?? -1);
  if (Math.abs(firstLaterRemainingDistanceDelta) > GEOMETRY_EPSILON) {
    return firstLaterRemainingDistanceDelta;
  }

  const finalRemainingDistanceDelta = rightSignals.finalRemainingDistanceUd - leftSignals.finalRemainingDistanceUd;
  if (Math.abs(finalRemainingDistanceDelta) > GEOMETRY_EPSILON) {
    return finalRemainingDistanceDelta;
  }

  return compareEvadeCandidates(leftCandidate, rightCandidate, referencePose);
}

function getDirectionWheelBranchRankingReasonCodes(selectedCandidate = null, runnerUpCandidate = null, alternativeCandidates = []) {
  const selectedSignals = getDirectionWheelRetentionSignals(selectedCandidate);
  const runnerUpSignals = getDirectionWheelRetentionSignals(runnerUpCandidate);
  const reasonCodes = [];
  const reservePreferenceEligible = shouldPreferDirectionWheelReserveWithinAlignmentTolerance(selectedSignals, runnerUpSignals);

  if (selectedSignals.laterStepCount === 0 && runnerUpSignals.laterStepCount > 0) {
    reasonCodes.push('prefer-no-later-avoidance');
  }

  if (shouldPreferDirectionWheelSlideCorridorBypass(selectedSignals, runnerUpSignals)) {
    reasonCodes.push('prefer-slide-first-corridor-bypass');
  }

  if (!reasonCodes.includes('prefer-slide-first-corridor-bypass')
    && alternativeCandidates.some((candidate) => shouldPreferDirectionWheelSlideCorridorBypass(selectedSignals, getDirectionWheelRetentionSignals(candidate)))) {
    reasonCodes.push('prefer-slide-first-corridor-bypass');
  }

  if (shouldPreferDirectionWheelSlideOverWheelPath(selectedSignals, runnerUpSignals)) {
    reasonCodes.push('prefer-first-later-slide-over-wheel-path');
  }

  if (shouldPreferDirectionWheelSlideRootWheelBack(selectedSignals, runnerUpSignals)) {
    reasonCodes.push('prefer-slide-root-wheel-back-bypass');
  }

  if (shouldPreferDirectionWheelRealignmentOverLaterSlide(selectedSignals, runnerUpSignals)) {
    reasonCodes.push('prefer-realignment-wheel-back-over-later-slide');
  }

  if (selectedSignals.hasRealignmentWheelBack
    && runnerUpSignals.hasRealignmentWheelBack
    && (selectedSignals.laterSlideCount ?? 0) < (runnerUpSignals.laterSlideCount ?? 0)) {
    reasonCodes.push('prefer-fewer-later-slides-after-realignment');
  }

  if ((selectedSignals.maxLateralDeviationUd ?? 0) + EVADE_DIRECTION_WHEEL_CORRIDOR_PRIORITY_THRESHOLD_UD + GEOMETRY_EPSILON < (runnerUpSignals.maxLateralDeviationUd ?? 0)) {
    reasonCodes.push('prefer-corridor-natural-bypass');
  }

  if ((selectedSignals.totalLaterSpentDistanceUd ?? 0) + GEOMETRY_EPSILON < (runnerUpSignals.totalLaterSpentDistanceUd ?? 0)) {
    reasonCodes.push('prefer-lower-manoeuvre-ud-spend');
  }

  if ((selectedSignals.finalLateralDeviationUd ?? 0) + (EVADE_DIRECTION_WHEEL_CORRIDOR_PRIORITY_THRESHOLD_UD / 2) + GEOMETRY_EPSILON < (runnerUpSignals.finalLateralDeviationUd ?? 0)) {
    reasonCodes.push('prefer-earlier-return-to-corridor');
  }

  if (selectedSignals.hasRealignmentWheelBack
    && ((selectedSignals.finalAlignmentDeltaRadians ?? Math.PI) + EVADE_DIRECTION_WHEEL_RESERVE_ALIGNMENT_TOLERANCE_RADIANS + GEOMETRY_EPSILON
      < (runnerUpSignals.finalAlignmentDeltaRadians ?? Math.PI))) {
    reasonCodes.push('prefer-return-to-flee-corridor');
  }

  if ((selectedSignals.laterWheelCount ?? 0) <= 2 && (runnerUpSignals.laterWheelCount ?? 0) > 2) {
    reasonCodes.push('avoid-micro-wheel-chain');
  }

  if ((selectedSignals.largestLaterWheelRadians ?? 0) + GEOMETRY_EPSILON < (runnerUpSignals.largestLaterWheelRadians ?? 0)) {
    reasonCodes.push('prefer-smaller-largest-wheel');
  }

  if (reservePreferenceEligible
    && (selectedSignals.finalRemainingDistanceUd ?? 0) > (runnerUpSignals.finalRemainingDistanceUd ?? 0) + GEOMETRY_EPSILON) {
    reasonCodes.push('prefer-more-final-straight-reserve-within-alignment-tolerance');
  }

  if (selectedSignals.firstLaterStepType === 'obstacle-wheel' && runnerUpSignals.firstLaterStepType === 'slide') {
    reasonCodes.push('prefer-first-later-wheel');
  }

  if ((selectedSignals.finalAlignmentDeltaRadians ?? Math.PI) + GEOMETRY_EPSILON < (runnerUpSignals.finalAlignmentDeltaRadians ?? Math.PI)) {
    reasonCodes.push('prefer-closer-return-to-flee-direction');
  }

  if (selectedSignals.hasRealignmentWheelBack && !runnerUpSignals.hasRealignmentWheelBack) {
    reasonCodes.push('prefer-realignment-wheel-back');
  }

  if (selectedSignals.laterWheelCount < runnerUpSignals.laterWheelCount) {
    reasonCodes.push('prefer-fewer-later-wheels');
  }

  if (selectedSignals.laterStepCount < runnerUpSignals.laterStepCount) {
    reasonCodes.push('prefer-fewer-later-steps');
  }

  if ((selectedSignals.firstLaterRemainingDistanceUd ?? -1) > (runnerUpSignals.firstLaterRemainingDistanceUd ?? -1) + GEOMETRY_EPSILON) {
    reasonCodes.push('prefer-more-reserve-after-first-later-step');
  }

  if (reasonCodes.length === 0) {
    reasonCodes.push('fallback-distance-from-charger');
  }

  return reasonCodes;
}

function compareEvadeCandidates(leftCandidate, rightCandidate, referencePose = null) {
  const distanceDelta = getPoseDistanceUd(rightCandidate?.endPose, referencePose) - getPoseDistanceUd(leftCandidate?.endPose, referencePose);
  if (Math.abs(distanceDelta) > GEOMETRY_EPSILON) {
    return distanceDelta;
  }

  const remainingDistanceDelta = Number(rightCandidate?.remainingDistanceUd ?? 0) - Number(leftCandidate?.remainingDistanceUd ?? 0);
  if (Math.abs(remainingDistanceDelta) > GEOMETRY_EPSILON) {
    return remainingDistanceDelta;
  }

  const spentDistanceDelta = Number(leftCandidate?.spentDistanceUd ?? leftCandidate?.distanceUd ?? 0) - Number(rightCandidate?.spentDistanceUd ?? rightCandidate?.distanceUd ?? 0);
  if (Math.abs(spentDistanceDelta) > GEOMETRY_EPSILON) {
    return spentDistanceDelta;
  }

  const stepCountDelta = getEvadeCandidateSteps(leftCandidate).length - getEvadeCandidateSteps(rightCandidate).length;
  if (stepCountDelta !== 0) {
    return stepCountDelta;
  }

  const slideTieBreakDelta = getEvadeCandidateSlideTieBreakScore(rightCandidate) - getEvadeCandidateSlideTieBreakScore(leftCandidate);
  if (slideTieBreakDelta !== 0) {
    return slideTieBreakDelta;
  }

  return String(leftCandidate?.id ?? '').localeCompare(String(rightCandidate?.id ?? ''));
}

function getPreferredEvadeCandidatesByDistance({ candidates = [], referencePose = null, rankingPolicy = 'default' }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const compareCandidates = rankingPolicy === 'direction-wheel-branch-retention'
    ? (leftCandidate, rightCandidate) => compareDirectionWheelBranchCandidates(leftCandidate, rightCandidate, referencePose)
    : (leftCandidate, rightCandidate) => compareEvadeCandidates(leftCandidate, rightCandidate, referencePose);
  const rankedCandidates = [...candidates].sort(compareCandidates);
  return rankedCandidates.length > 0 ? [rankedCandidates[0]] : [];
}

export function resolvePlayerFacingEvadeCandidates({ candidates = [], contactSnapshot = null, fallbackReferencePose = null }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const referencePose = getEvadeChoiceReferencePose(contactSnapshot, fallbackReferencePose);
  const branchCandidates = new Map();

  for (const candidate of candidates) {
    const branchKey = getEvadeCandidateInitialDecisionKey(candidate);
    if (!branchCandidates.has(branchKey)) {
      branchCandidates.set(branchKey, []);
    }

    branchCandidates.get(branchKey).push(candidate);
  }

  if (branchCandidates.has('direction-wheel') && branchCandidates.has('no-direction-wheel')) {
    return dedupeEvadeCandidates([
      ...getPreferredEvadeCandidatesByDistance({ candidates: branchCandidates.get('no-direction-wheel'), referencePose }),
      ...getPreferredEvadeCandidatesByDistance({ candidates: branchCandidates.get('direction-wheel'), referencePose }),
    ]);
  }

  const [[, singleBranchCandidates]] = [...branchCandidates.entries()];
  const finalOverlapSlideCandidates = singleBranchCandidates.filter((candidate) => candidate?.type === 'slide' && String(candidate?.id ?? '').startsWith('final-overlap-slide-'));
  if (finalOverlapSlideCandidates.length > 1) {
    return dedupeEvadeCandidates(finalOverlapSlideCandidates);
  }

  return dedupeEvadeCandidates(getPreferredEvadeCandidatesByDistance({ candidates: singleBranchCandidates, referencePose }));
}

export function getDirectionWheelCandidates({
  reactingUnit,
  reorientedPose,
  distanceUd,
  chargeDirectionRadians = null,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
  requireDirectBlockerClearance = false,
  solverMemo = null,
  branchReferencePose = null,
  decisionTrace = null,
}) {
  if (!Number.isFinite(chargeDirectionRadians)) {
    return [];
  }

  const signedDeltaRadians = getSignedAngleDeltaRadians(chargeDirectionRadians, reorientedPose.rotationRadians);
  const wheelAngleRadians = Math.abs(signedDeltaRadians);
  if (wheelAngleRadians <= GEOMETRY_EPSILON || wheelAngleRadians > (Math.PI / 2) + GEOMETRY_EPSILON) {
    return [];
  }

  const pivotSide = signedDeltaRadians > 0 ? MOVEMENT_PIVOT_SIDES.RIGHT : MOVEMENT_PIVOT_SIDES.LEFT;
  const candidate = getWheelAdjustedEvadePose({ reactingUnit, reorientedPose, pivotSide, angleRadians: wheelAngleRadians, totalDistanceUd: distanceUd });
  const directionWheelStep = createEvadeAvoidanceStep({
    id: `direction-wheel-step-${pivotSide}-${wheelAngleRadians.toFixed(3)}`,
    type: 'direction-wheel',
    pivotSide,
    angleRadians: wheelAngleRadians,
    spentDistanceUd: candidate.spentDistanceUd,
    endPose: candidate.intermediatePose,
    remainingDistanceUd: candidate.remainingDistanceUd,
    analysis: {
      generationSource: 'direction-wheel',
      availableDistanceBeforeStepUd: distanceUd,
    },
  });
  const directCandidateIsLegal = isCandidateEndPoseLegal({
    candidateStartPose: candidate.intermediatePose,
    candidateEndPose: candidate.endPose,
    reactingUnit,
    battlefieldProfile,
    units,
    ignoredUnitIds,
    solverMemo,
  });

  if (requireDirectBlockerClearance) {
    const postWheelBlockers = evaluateSimpleBlockedEvade({
      reorientedUnit: {
        ...reactingUnit,
        xUd: candidate.intermediatePose.xUd,
        yUd: candidate.intermediatePose.yUd,
        rotationRadians: candidate.intermediatePose.rotationRadians,
      },
      units,
      ignoredUnitIds,
    });

    if (postWheelBlockers.blockerUnitIds.length > 0) {
      return [];
    }
  }

  const directCandidateCount = directCandidateIsLegal ? 1 : 0;
  const wayfindingPatternCandidates = getEvadeWayfindingV2PatternCandidates({
    reactingUnit,
    startPose: candidate.intermediatePose,
    distanceUd: candidate.remainingDistanceUd,
    battlefieldProfile,
    units,
    ignoredUnitIds,
    baseAvoidanceSteps: [directionWheelStep],
    laterSlideAvailable: true,
    remainingWheelBudgetRadians: Math.PI / 2,
    decisionTrace,
    solverMemo,
  });
  const pathAvoidanceCandidates = (wayfindingPatternCandidates.length > 0
    ? wayfindingPatternCandidates
    : getPathAvoidanceCandidates({
      reactingUnit,
      startPose: candidate.intermediatePose,
      distanceUd: candidate.remainingDistanceUd,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      baseAvoidanceSteps: [directionWheelStep],
      laterSlideAvailable: true,
      remainingWheelBudgetRadians: Math.PI / 2,
      solverMemo,
    })).map((avoidanceCandidate) => mergeCandidateAnalysis(avoidanceCandidate, {
    generationSource: avoidanceCandidate?.analysis?.generationSource ?? 'direction-wheel-path-avoidance',
    wayfindingV2Used: wayfindingPatternCandidates.length > 0,
  }));
  const unrankedDirectionWheelBranchCandidates = dedupeEvadeCandidates([
    ...(directCandidateIsLegal ? [mergeCandidateAnalysis(createEvadeAvoidanceCandidate({
      id: `direction-wheel-${pivotSide}-${wheelAngleRadians.toFixed(3)}`,
      type: 'direction-wheel',
      pivotSide,
      angleRadians: wheelAngleRadians,
      spentDistanceUd: candidate.spentDistanceUd,
      intermediatePose: candidate.intermediatePose,
      endPose: candidate.endPose,
      remainingDistanceUd: candidate.remainingDistanceUd,
      avoidanceSteps: [directionWheelStep],
    }), {
      generationSource: 'direction-wheel-direct',
    })] : []),
    ...pathAvoidanceCandidates,
  ]);

  appendEvadeDecisionTrace(decisionTrace, {
    stage: 'direction-wheel-branch-generated',
    directCandidateIsLegal,
    requireDirectBlockerClearance,
    directCandidateCount,
    pathAvoidanceCandidateCount: pathAvoidanceCandidates.length,
    candidateCount: unrankedDirectionWheelBranchCandidates.length,
    candidates: unrankedDirectionWheelBranchCandidates.slice(0, 6).map(summarizeEvadeCandidateForDecisionTrace),
  });

  if (!branchReferencePose) {
    return unrankedDirectionWheelBranchCandidates;
  }

  const rankedDirectionWheelBranchCandidates = getPreferredEvadeCandidatesByDistance({
    candidates: unrankedDirectionWheelBranchCandidates,
    referencePose: branchReferencePose,
    rankingPolicy: 'direction-wheel-branch-retention',
  }).map((rankedCandidate) => mergeCandidateAnalysis(rankedCandidate, {
    branchRankingPolicy: 'direction-wheel-branch-retention',
    branchRankingReasonCodes: getDirectionWheelBranchRankingReasonCodes(
      rankedCandidate,
      [...unrankedDirectionWheelBranchCandidates]
        .filter((candidate) => candidate?.id !== rankedCandidate?.id)
        .sort((leftCandidate, rightCandidate) => compareDirectionWheelBranchCandidates(leftCandidate, rightCandidate, branchReferencePose))[0] ?? null,
      unrankedDirectionWheelBranchCandidates.filter((candidate) => candidate?.id !== rankedCandidate?.id),
    ),
    branchRankingCorridorScore: getDirectionWheelCorridorScore(rankedCandidate),
    branchRankingCandidateCount: unrankedDirectionWheelBranchCandidates.length,
    branchRankingDiscardedCount: Math.max(0, unrankedDirectionWheelBranchCandidates.length - 1),
    branchRankingSelected: true,
  }));

  appendEvadeDecisionTrace(decisionTrace, {
    stage: 'direction-wheel-branch-ranked',
    preRankCandidateCount: unrankedDirectionWheelBranchCandidates.length,
    candidateCount: rankedDirectionWheelBranchCandidates.length,
    selectedCandidateId: rankedDirectionWheelBranchCandidates[0]?.id ?? null,
    selectedCandidateAnalysis: rankedDirectionWheelBranchCandidates[0]
      ? summarizeEvadeCandidateForDecisionTrace(rankedDirectionWheelBranchCandidates[0]).analysis
      : null,
  });

  return rankedDirectionWheelBranchCandidates;
}

export function getObstacleWheelCandidates({ reactingUnit, reorientedPose, distanceUd, blockerUnitIds = [], battlefieldProfile = null, units = [], ignoredUnitIds = [], solverMemo = null }) {
  if (!Array.isArray(blockerUnitIds) || blockerUnitIds.length === 0) {
    return [];
  }

  const candidates = [];
  for (const pivotSide of [MOVEMENT_PIVOT_SIDES.LEFT, MOVEMENT_PIVOT_SIDES.RIGHT]) {
    for (let angleRadians = EVADE_WHEEL_STEP_RADIANS; angleRadians <= (Math.PI / 2) + GEOMETRY_EPSILON; angleRadians += EVADE_WHEEL_STEP_RADIANS) {
      const lowerAngleRadians = Math.max(0, angleRadians - EVADE_WHEEL_STEP_RADIANS);
      const spentDistanceUd = getWheelDistanceUdForAngleRadians(angleRadians);
      if (spentDistanceUd > distanceUd + GEOMETRY_EPSILON) {
        break;
      }

      const refinedCandidate = refineWheelAngleResult({
        minimumAngleRadians: lowerAngleRadians,
        maximumAngleRadians: angleRadians,
        evaluateAngle: (trialAngleRadians) => {
          const candidate = getWheelAdjustedEvadePose({ reactingUnit, reorientedPose, pivotSide, angleRadians: trialAngleRadians, totalDistanceUd: distanceUd });
          const postWheelBlockers = evaluateSimpleBlockedEvade({
            reorientedUnit: {
              ...reactingUnit,
              xUd: candidate.intermediatePose.xUd,
              yUd: candidate.intermediatePose.yUd,
              rotationRadians: candidate.intermediatePose.rotationRadians,
            },
            units,
            ignoredUnitIds,
          });

          if (postWheelBlockers.blockerUnitIds.length > 0) {
            return null;
          }

          if (!isWheelArcPathLegal({ reactingUnit, startPose: reorientedPose, pivotSide, angleRadians: trialAngleRadians, battlefieldProfile, units, ignoredUnitIds, solverMemo })) {
            return null;
          }

          if (!isCandidateEndPoseLegal({ candidateStartPose: candidate.intermediatePose, candidateEndPose: candidate.endPose, reactingUnit, battlefieldProfile, units, ignoredUnitIds, solverMemo })) {
            return null;
          }

          return { candidate, angleRadians: trialAngleRadians };
        },
      });

      if (!refinedCandidate?.candidate) {
        continue;
      }

      candidates.push(createEvadeAvoidanceCandidate({
        id: `obstacle-wheel-${pivotSide}-${refinedCandidate.angleRadians.toFixed(6)}`,
        type: 'obstacle-wheel',
        pivotSide,
        angleRadians: Number(refinedCandidate.angleRadians.toFixed(6)),
        spentDistanceUd: refinedCandidate.candidate.spentDistanceUd,
        intermediatePose: refinedCandidate.candidate.intermediatePose,
        endPose: refinedCandidate.candidate.endPose,
        remainingDistanceUd: refinedCandidate.candidate.remainingDistanceUd,
        blockerUnitIds,
        avoidanceSteps: [createEvadeAvoidanceStep({
          id: `obstacle-wheel-step-${pivotSide}-${refinedCandidate.angleRadians.toFixed(6)}`,
          type: 'obstacle-wheel',
          pivotSide,
          angleRadians: Number(refinedCandidate.angleRadians.toFixed(6)),
          spentDistanceUd: refinedCandidate.candidate.spentDistanceUd,
          endPose: refinedCandidate.candidate.intermediatePose,
          remainingDistanceUd: refinedCandidate.candidate.remainingDistanceUd,
        })],
      }));
      break;
    }
  }

  return dedupeEvadeCandidates(candidates);
}

export function getDirectBlockerClearanceSlides({ reactingUnit, reorientedPose, distanceUd, battlefieldProfile = null, units = [], ignoredUnitIds = [], decisionTrace = null, solverMemo = null }) {
  const directBlockerEvaluation = evaluateSimpleBlockedEvade({
    reorientedUnit: {
      ...reactingUnit,
      xUd: reorientedPose.xUd,
      yUd: reorientedPose.yUd,
      rotationRadians: reorientedPose.rotationRadians,
    },
    units,
    ignoredUnitIds,
  });

  if (directBlockerEvaluation.blockerUnitIds.length === 0) {
    return { blockerUnitIds: [], clearanceSlides: [] };
  }

  const clearanceSlides = directBlockerEvaluation.clearanceSlides.flatMap((slide) => {
    const candidate = getSlideAdjustedEvadePose({ reorientedPose, side: slide.side, slideDistanceUd: slide.distanceUd, totalDistanceUd: distanceUd });
    const finalOverlaps = getMemoizedDoesPoseOverlapAnyUnit({ reactingUnit, pose: candidate.endPose, units, ignoredUnitIds, solverMemo });
    const pathBlocked = Boolean(getMemoizedFirstLinearPathOverlap({ reactingUnit, startPose: candidate.intermediatePose, endPose: candidate.endPose, units, ignoredUnitIds, solverMemo }));
    const insideBattlefield = getMemoizedIsPoseInsideBattlefield({ reactingUnit, pose: candidate.endPose, battlefieldProfile, solverMemo });

    const slideStep = createEvadeAvoidanceStep({
      id: `direct-slide-step-${slide.side}-${slide.distanceUd.toFixed(3)}`,
      type: 'slide',
      side: slide.side,
      distanceUd: slide.distanceUd,
      spentDistanceUd: slide.distanceUd,
      endPose: candidate.intermediatePose,
      remainingDistanceUd: candidate.remainingDistanceUd,
    });

    if (!insideBattlefield || finalOverlaps) {
      return [];
    }

    if (pathBlocked) {
      return getPathAvoidanceCandidates({
        reactingUnit,
        startPose: candidate.intermediatePose,
        distanceUd: candidate.remainingDistanceUd,
        battlefieldProfile,
        units,
        ignoredUnitIds,
        baseAvoidanceSteps: [slideStep],
        laterSlideAvailable: true,
        remainingWheelBudgetRadians: Math.PI / 2,
        blockerUnitIds: directBlockerEvaluation.blockerUnitIds,
        decisionTrace,
        solverMemo,
      });
    }

    return [createEvadeAvoidanceCandidate({
      id: `direct-slide-${slide.side}-${slide.distanceUd.toFixed(3)}`,
      type: 'slide',
      side: slide.side,
      distanceUd: slide.distanceUd,
      spentDistanceUd: slide.distanceUd,
      intermediatePose: candidate.intermediatePose,
      endPose: candidate.endPose,
      remainingDistanceUd: candidate.remainingDistanceUd,
      blockerUnitIds: directBlockerEvaluation.blockerUnitIds,
      avoidanceSteps: [slideStep],
    })];
  }).filter(Boolean);

  return {
    blockerUnitIds: directBlockerEvaluation.blockerUnitIds,
    clearanceSlides,
  };
}

export function getFinalOverlapClearanceSlides({ reactingUnit, reorientedPose, distanceUd, battlefieldProfile = null, units = [], ignoredUnitIds = [], solverMemo = null }) {
  const clearanceSlides = [];
  const straightEndPose = getLinearEndPose(reorientedPose, reorientedPose.rotationRadians, distanceUd);
  const finalOverlapBlockers = getMemoizedOverlappingUnitsAtPose({ reactingUnit, pose: straightEndPose, units, ignoredUnitIds, solverMemo });

  if (finalOverlapBlockers.length === 0) {
    return clearanceSlides;
  }

  const firstFinalOverlap = getMemoizedFirstLinearPathOverlapAgainstUnits({
    reactingUnit,
    startPose: reorientedPose,
    endPose: straightEndPose,
    blockerUnitIds: finalOverlapBlockers.map((unit) => unit.id ?? null).filter(Boolean),
    units,
    ignoredUnitIds,
    solverMemo,
  });

  if (!firstFinalOverlap) {
    return clearanceSlides;
  }

  const encounterPose = firstFinalOverlap.encounterPose;
  const remainingDistanceUd = Number(Math.max(0, distanceUd - Number(firstFinalOverlap.travelledDistanceUd ?? 0)).toFixed(3));
  if (remainingDistanceUd <= GEOMETRY_EPSILON) {
    return clearanceSlides;
  }

  for (const side of ['left', 'right']) {
    const minimumSlideDistanceUd = getMinimumClearanceSlideDistance({
      blockerUnits: firstFinalOverlap.blockerUnits,
      unit: {
        ...reactingUnit,
        xUd: encounterPose.xUd,
        yUd: encounterPose.yUd,
        rotationRadians: encounterPose.rotationRadians,
      },
      side,
    });
    let previousRejectedSlideDistanceUd = null;

    for (const slideDistanceUd of getPermittedLateSlideDistances(minimumSlideDistanceUd, remainingDistanceUd)) {
      if (slideDistanceUd <= 0) {
        continue;
      }

      const evaluateSlideDistance = (trialSlideDistanceUd) => {
        const candidate = getSlideAdjustedEvadePose({ reorientedPose: encounterPose, side, slideDistanceUd: trialSlideDistanceUd, totalDistanceUd: remainingDistanceUd });
        const finalOverlaps = getMemoizedDoesPoseOverlapAnyUnit({ reactingUnit, pose: candidate.endPose, units, ignoredUnitIds, solverMemo });
        const pathBlocked = Boolean(getMemoizedFirstLinearPathOverlap({ reactingUnit, startPose: reorientedPose, endPose: encounterPose, units, ignoredUnitIds, solverMemo }));
        const continuedPathBlocked = Boolean(getMemoizedFirstLinearPathOverlap({ reactingUnit, startPose: candidate.intermediatePose, endPose: candidate.endPose, units, ignoredUnitIds, solverMemo }));
        const insideBattlefield = getMemoizedIsPoseInsideBattlefield({ reactingUnit, pose: candidate.endPose, battlefieldProfile, solverMemo });

        if (finalOverlaps || pathBlocked || continuedPathBlocked || !insideBattlefield) {
          return null;
        }

        return {
          candidate: createEvadeAvoidanceCandidate({
            id: `final-overlap-slide-${side}-${trialSlideDistanceUd.toFixed(6)}`,
            type: 'slide',
            side,
            distanceUd: Number(trialSlideDistanceUd.toFixed(6)),
            spentDistanceUd: Number(trialSlideDistanceUd.toFixed(6)),
            intermediatePose: candidate.intermediatePose,
            endPose: candidate.endPose,
            remainingDistanceUd: candidate.remainingDistanceUd,
            avoidanceSteps: [createEvadeAvoidanceStep({
              id: `final-overlap-slide-step-${side}-${trialSlideDistanceUd.toFixed(6)}`,
              type: 'slide',
              startPose: encounterPose,
              side,
              distanceUd: Number(trialSlideDistanceUd.toFixed(6)),
              spentDistanceUd: Number(trialSlideDistanceUd.toFixed(6)),
              endPose: candidate.intermediatePose,
              remainingDistanceUd: candidate.remainingDistanceUd,
            })],
          }),
        };
      };

      const coarseSlideResult = evaluateSlideDistance(slideDistanceUd);
      if (coarseSlideResult?.candidate) {
        const refinedSlideResult = previousRejectedSlideDistanceUd === null
          ? coarseSlideResult
          : refineSlideDistanceResult({ minimumDistanceUd: previousRejectedSlideDistanceUd, maximumDistanceUd: slideDistanceUd, evaluateDistance: evaluateSlideDistance }) ?? coarseSlideResult;
        clearanceSlides.push(refinedSlideResult.candidate);
        break;
      }

      previousRejectedSlideDistanceUd = slideDistanceUd;
    }
  }

  return clearanceSlides;
}

function isRetainedAvoidanceWheelAngle(angleRadians) {
  return getWheelDistanceUdForAngleRadians(angleRadians) >= EVADE_MIN_RETAINED_AVOIDANCE_STEP_UD;
}




