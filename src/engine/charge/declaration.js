import { getFootprintCommandRangeMeasurement } from '../command/range.js';
import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../../data/battlefield-profiles.js';
import {
  createAdvancePreview,
  createMovementPreview,
  createSlidePreview,
  createWheelPreview,
  evaluateZocTransitionsForMovementPreview,
  getMovementPreviewEndPose,
  getMovementPreviewSpentBudgetUd,
  getWheelAngleRadiansForDistanceUd,
  MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SLIDE_SIDES,
  splitMovementPreviewIntoPathSamples,
} from '../movement/index.js';
import { getUnitMovementBudgetUd } from '../movement/budget.js';

export const CHARGE_TARGET_CANDIDATE_STATUSES = {
  ELIGIBLE: 'eligible',
  BLOCKED: 'blocked',
};

export const CHARGE_TARGET_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const CHARGE_PATH_FAMILY_IDS = {
  ADVANCE: 'advance',
  SLIDE_ADVANCE: 'slide+advance',
  WHEEL_ADVANCE: 'wheel+advance',
};

const CHARGE_PATH_EPSILON = 1e-6;
const CHARGE_ADVANCE_STEP_UD = 0.1;
const CHARGE_SLIDE_STEP_UD = 0.25;
const CHARGE_WHEEL_STEP_DISTANCE_UD = 0.25;
const CHARGE_FAILURE_REASON_PRIORITIES = {
  'zoc-blocked': 5,
  'earlier-enemy-contact': 4,
  'path-blocked': 3,
  'no-contact': 1,
};

export function createChargeTargetDiagnostic(overrides = {}) {
  return {
    code: overrides.code ?? 'charge.target',
    status: overrides.status ?? 'info',
    text: overrides.text ?? '',
    sourceStatus: overrides.sourceStatus ?? CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
  };
}

export function createChargeTargetCandidate(overrides = {}) {
  return {
    unitId: overrides.unitId ?? null,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : null,
    maxChargeRangeUd: Number.isFinite(overrides.maxChargeRangeUd) ? overrides.maxChargeRangeUd : null,
    status: overrides.status ?? CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED,
    sourceStatus: overrides.sourceStatus ?? CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
    reason: overrides.reason ?? '',
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
  };
}

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(2);
}

function getChargeRangeEvaluation(chargingUnit, targetUnit, units, maxChargeRangeUdOverride = null) {
  const measurement = getFootprintCommandRangeMeasurement(chargingUnit, targetUnit);
  const maxChargeRangeUd = Number.isFinite(maxChargeRangeUdOverride)
    ? Math.max(0, Number(maxChargeRangeUdOverride))
    : getUnitMovementBudgetUd({ selectedUnit: chargingUnit, units });

  return {
    distanceUd: measurement.distanceUd,
    maxChargeRangeUd,
    isInRange: measurement.distanceUd <= maxChargeRangeUd + 1e-6,
  };
}

function createPosedUnit(baseUnit, pose) {
  return {
    ...baseUnit,
    xUd: pose.xUd,
    yUd: pose.yUd,
    rotationRadians: pose.rotationRadians ?? 0,
  };
}

function doesUnitsOverlap(leftUnit, rightUnit) {
  return getFootprintCommandRangeMeasurement(leftUnit, rightUnit).distanceUd <= CHARGE_PATH_EPSILON;
}

function formatFailureText(sequenceLabel, text) {
  return `${sequenceLabel}: ${text}`;
}

function buildAcceptedPreview(segments, explanations = ['Charge candidate preview is ready.']) {
  return createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments,
    explanations,
  });
}

function getChargeFailurePriority(code) {
  return CHARGE_FAILURE_REASON_PRIORITIES[code] ?? 0;
}

function choosePreferredFailure(currentFailure, nextFailure) {
  if (!nextFailure) {
    return currentFailure;
  }

  if (!currentFailure) {
    return nextFailure;
  }

  return getChargeFailurePriority(nextFailure.code) > getChargeFailurePriority(currentFailure.code)
    ? nextFailure
    : currentFailure;
}

function getEndPoseUnit(baseUnit, preview) {
  const endPose = getMovementPreviewEndPose(preview, {
    xUd: baseUnit.xUd,
    yUd: baseUnit.yUd,
    rotationRadians: baseUnit.rotationRadians ?? 0,
  });

  return createPosedUnit(baseUnit, endPose);
}

function findFirstOverlappingSample(pathSamples, chargingUnit, units) {
  for (let index = 0; index < pathSamples.length; index += 1) {
    const posedUnit = createPosedUnit(chargingUnit, pathSamples[index].pose);
    const blockingUnit = units.find((unit) => doesUnitsOverlap(posedUnit, unit)) || null;
    if (blockingUnit) {
      return {
        index,
        sample: pathSamples[index],
        unit: blockingUnit,
      };
    }
  }

  return null;
}

function findFirstZocBlockingSample(zocTransition, contactSampleIndex) {
  const zocSamples = Array.isArray(zocTransition?.samples) ? zocTransition.samples : [];
  const index = zocSamples.findIndex(
    (sample) => sample.inEnemyZoc && (contactSampleIndex === -1 || sample.pathSampleIndex <= contactSampleIndex),
  );

  if (index === -1) {
    return null;
  }

  return {
    index: zocSamples[index].pathSampleIndex,
    code: 'zoc-blocked',
    sample: zocSamples[index],
    enemyId: zocSamples[index].mostThreateningEnemyId ?? null,
    sourceStatus: zocTransition.sourceStatus,
  };
}

function getBlockingEventPriority(event) {
  if (event?.code === 'zoc-blocked') {
    return 0;
  }

  if (event?.code === 'path-blocked') {
    return 1;
  }

  return 2;
}

function chooseEarliestBlockingEvent(events) {
  return events
    .filter(Boolean)
    .sort((left, right) => (left.index - right.index) || (getBlockingEventPriority(left) - getBlockingEventPriority(right)))[0] ?? null;
}

function evaluateChargePathContact({ preview, chargingUnit, targetUnit, blockerUnits, enemyZocUnits }) {
  const zocTransition = evaluateZocTransitionsForMovementPreview({
    preview,
    movingUnit: chargingUnit,
    enemyUnits: enemyZocUnits,
    samplesPerUd: 8,
  });
  const pathSamples = zocTransition.samples.length > 0
    ? zocTransition.samples.map((sample, pathSampleIndex) => ({
        ...sample,
        pathSampleIndex,
      }))
    : splitMovementPreviewIntoPathSamples(preview, { samplesPerUd: 8, minSamplesPerSegment: 2 }).map((sample, pathSampleIndex) => ({
        ...sample,
        pathSampleIndex,
      }));
  let contactSampleIndex = -1;
  const friendlyBlockerUnits = blockerUnits.filter((unit) => unit.owner === chargingUnit.owner);
  const earlierEnemyUnits = blockerUnits.filter((unit) => unit.owner !== chargingUnit.owner);

  for (let index = 0; index < pathSamples.length; index += 1) {
    const posedUnit = createPosedUnit(chargingUnit, pathSamples[index].pose);
    if (doesUnitsOverlap(posedUnit, targetUnit)) {
      contactSampleIndex = index;
      break;
    }
  }

  const friendlyBlockingSample = findFirstOverlappingSample(pathSamples, chargingUnit, friendlyBlockerUnits);
  const earlierEnemySample = findFirstOverlappingSample(pathSamples, chargingUnit, earlierEnemyUnits);
  const zocBlockingSample = findFirstZocBlockingSample(
    {
      ...zocTransition,
      samples: pathSamples,
    },
    contactSampleIndex,
  );

  const blockerBeforeTarget = chooseEarliestBlockingEvent([
    friendlyBlockingSample && (contactSampleIndex === -1 || friendlyBlockingSample.index <= contactSampleIndex)
      ? {
          ...friendlyBlockingSample,
          code: 'path-blocked',
        }
      : null,
    earlierEnemySample && (contactSampleIndex === -1 || earlierEnemySample.index <= contactSampleIndex)
      ? {
          ...earlierEnemySample,
          code: 'earlier-enemy-contact',
        }
      : null,
    zocBlockingSample,
  ]);

  if (blockerBeforeTarget) {
    if (blockerBeforeTarget.code === 'zoc-blocked') {
      return {
        ok: false,
        code: 'zoc-blocked',
        text: `der Charge-Pfad kreuzt feindliche ZoC${blockerBeforeTarget.enemyId ? ` (${blockerBeforeTarget.enemyId})` : ''}.`,
        sourceStatus: blockerBeforeTarget.sourceStatus === MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
          ? CHARGE_TARGET_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
          : CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
      };
    }

    const blockingUnit = blockerBeforeTarget.unit;
    return {
      ok: false,
      code: blockingUnit.owner === chargingUnit.owner ? 'path-blocked' : 'earlier-enemy-contact',
      text: blockingUnit.owner === chargingUnit.owner
        ? `der Charge-Pfad wird vor dem Ziel von ${blockingUnit?.id ?? 'einer anderen Einheit'} blockiert.`
        : `der Charge trifft ${blockingUnit?.id ?? 'eine andere Feindeinheit'} vor dem ausgewaehlten Ziel zuerst.`,
      sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
    };
  }

  if (contactSampleIndex === -1) {
    return {
      ok: false,
      code: 'no-contact',
      text: 'kein gerader Advance-Korridor erreicht die Zielfootprint innerhalb des Restbudgets.',
      sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
    };
  }

  return {
    ok: true,
    sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
  };
}

function createAdvanceSequenceEvaluation({
  chargingUnit,
  targetUnit,
  prefixPreview,
  sequenceLabel,
  maxChargeRangeUd,
  battlefieldProfile,
  blockerUnits,
  enemyZocUnits,
}) {
  const spentBudgetUd = getMovementPreviewSpentBudgetUd(prefixPreview);
  const remainingAdvanceUd = Math.max(0, maxChargeRangeUd - spentBudgetUd);
  const baseUnit = getEndPoseUnit(chargingUnit, prefixPreview);
  let bestFailure = null;

  for (let distanceUd = 0; distanceUd <= remainingAdvanceUd + CHARGE_PATH_EPSILON; distanceUd += CHARGE_ADVANCE_STEP_UD) {
    const clampedDistanceUd = Math.min(remainingAdvanceUd, Number(distanceUd.toFixed(3)));
    const advancePreview = createAdvancePreview(baseUnit, clampedDistanceUd, battlefieldProfile);
    if (advancePreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
      continue;
    }

    const preview = buildAcceptedPreview([
      ...prefixPreview.segments,
      ...advancePreview.segments,
    ]);
    const pathEvaluation = evaluateChargePathContact({
      preview,
      chargingUnit,
      targetUnit,
      blockerUnits,
      enemyZocUnits,
    });

    if (pathEvaluation.ok) {
      return {
        ok: true,
        sequenceLabel,
        preview,
        sourceStatus: pathEvaluation.sourceStatus,
      };
    }

    bestFailure = choosePreferredFailure(bestFailure, {
      code: pathEvaluation.code,
      reason: formatFailureText(sequenceLabel, pathEvaluation.text),
      sourceStatus: pathEvaluation.sourceStatus,
    });
  }

  return {
    ok: false,
    code: bestFailure?.code ?? 'no-contact',
    reason: bestFailure?.reason ?? formatFailureText(sequenceLabel, 'kein legaler Advance erreicht das Ziel.'),
    sourceStatus: bestFailure?.sourceStatus ?? CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
  };
}

function* iterateSlideDistances() {
  yield 0;
  for (let distanceUd = CHARGE_SLIDE_STEP_UD; distanceUd <= 1 + CHARGE_PATH_EPSILON; distanceUd += CHARGE_SLIDE_STEP_UD) {
    yield Number(Math.min(1, distanceUd).toFixed(3));
  }
}

function* iterateWheelAngles(maxChargeRangeUd) {
  const maxAngle = getWheelAngleRadiansForDistanceUd(maxChargeRangeUd);
  for (let spentUd = CHARGE_WHEEL_STEP_DISTANCE_UD; spentUd <= maxChargeRangeUd + CHARGE_PATH_EPSILON; spentUd += CHARGE_WHEEL_STEP_DISTANCE_UD) {
    const angle = getWheelAngleRadiansForDistanceUd(Math.min(maxChargeRangeUd, spentUd));
    if (angle > 0 && angle <= maxAngle + CHARGE_PATH_EPSILON) {
      yield Number(angle.toFixed(6));
    }
  }
}

function getResolvedChargePathFamilies(allowedPathFamilies) {
  if (!Array.isArray(allowedPathFamilies) || allowedPathFamilies.length === 0) {
    return new Set(Object.values(CHARGE_PATH_FAMILY_IDS));
  }

  return new Set(allowedPathFamilies);
}

function getChargeFeasibilityEvaluation({
  chargingUnit,
  targetUnit,
  units,
  battlefieldProfile,
  maxChargeRangeUdOverride = null,
  allowedPathFamilies = null,
}) {
  const maxChargeRangeUd = Number.isFinite(maxChargeRangeUdOverride)
    ? Math.max(0, Number(maxChargeRangeUdOverride))
    : getUnitMovementBudgetUd({ selectedUnit: chargingUnit, units });
  const pathFamilies = getResolvedChargePathFamilies(allowedPathFamilies);
  const blockerUnits = units.filter((unit) => unit.id !== chargingUnit.id && unit.id !== targetUnit.id);
  const enemyZocUnits = units.filter((unit) => unit.owner !== chargingUnit.owner && unit.id !== targetUnit.id);
  let bestFailure = null;

  if (pathFamilies.has(CHARGE_PATH_FAMILY_IDS.ADVANCE)) {
    const directEvaluation = createAdvanceSequenceEvaluation({
      chargingUnit,
      targetUnit,
      prefixPreview: buildAcceptedPreview([]),
      sequenceLabel: 'Advance',
      maxChargeRangeUd,
      battlefieldProfile,
      blockerUnits,
      enemyZocUnits,
    });
    if (directEvaluation.ok) {
      return directEvaluation;
    }
    bestFailure = choosePreferredFailure(bestFailure, directEvaluation);
  }

  if (pathFamilies.has(CHARGE_PATH_FAMILY_IDS.SLIDE_ADVANCE)) {
    for (const side of [MOVEMENT_SLIDE_SIDES.LEFT, MOVEMENT_SLIDE_SIDES.RIGHT]) {
      for (const distanceUd of iterateSlideDistances()) {
        if (distanceUd <= 0) {
          continue;
        }

        const slidePreview = createSlidePreview(chargingUnit, side, distanceUd, battlefieldProfile);
        if (slidePreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
          bestFailure = choosePreferredFailure(bestFailure, {
            code: 'path-blocked',
            reason: formatFailureText(`Slide ${side}`, 'Startmanoever verlaesst das Spielfeld.'),
            sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
          });
          continue;
        }

        const evaluation = createAdvanceSequenceEvaluation({
          chargingUnit,
          targetUnit,
          prefixPreview: buildAcceptedPreview(slidePreview.segments),
          sequenceLabel: `Slide ${side} + Advance`,
          maxChargeRangeUd,
          battlefieldProfile,
          blockerUnits,
          enemyZocUnits,
        });
        if (evaluation.ok) {
          return evaluation;
        }
        bestFailure = choosePreferredFailure(bestFailure, evaluation);
      }
    }
  }

  if (pathFamilies.has(CHARGE_PATH_FAMILY_IDS.WHEEL_ADVANCE)) {
    for (const pivotSide of [MOVEMENT_PIVOT_SIDES.LEFT, MOVEMENT_PIVOT_SIDES.RIGHT]) {
      for (const angleRadians of iterateWheelAngles(maxChargeRangeUd)) {
        const wheelPreview = createWheelPreview(chargingUnit, pivotSide, angleRadians, battlefieldProfile);
        if (wheelPreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
          bestFailure = choosePreferredFailure(bestFailure, {
            code: 'path-blocked',
            reason: formatFailureText(`Wheel ${pivotSide}`, 'Startmanoever verlaesst das Spielfeld.'),
            sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
          });
          continue;
        }

        const evaluation = createAdvanceSequenceEvaluation({
          chargingUnit,
          targetUnit,
          prefixPreview: buildAcceptedPreview(wheelPreview.segments),
          sequenceLabel: `Wheel ${pivotSide} + Advance`,
          maxChargeRangeUd,
          battlefieldProfile,
          blockerUnits,
          enemyZocUnits,
        });
        if (evaluation.ok) {
          return evaluation;
        }
        bestFailure = choosePreferredFailure(bestFailure, evaluation);
      }
    }
  }

  return {
    ok: false,
    code: bestFailure?.code ?? 'no-contact',
    reason: bestFailure?.reason ?? 'Kein legaler Charge-Pfad gefunden.',
    sourceStatus: bestFailure?.sourceStatus ?? CHARGE_TARGET_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  };
}

function createFriendlyTargetCandidate(unit) {
  return createChargeTargetCandidate({
    unitId: unit.id,
    status: CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED,
    sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
    reason: 'Nur feindliche Einheiten koennen als Charge-Ziel ausgewaehlt werden.',
    diagnostics: [
      createChargeTargetDiagnostic({
        code: 'charge.target.enemy-only',
        status: 'blocked',
        text: 'Charge-Ziele muessen feindliche Einheiten sein.',
      }),
    ],
  });
}

function createChargeContextChargingUnit(chargingUnit, chargeContext) {
  const startPose = chargeContext?.startPose;
  if (!chargingUnit || !startPose) {
    return chargingUnit;
  }

  return createPosedUnit(chargingUnit, startPose);
}

function createEnemyTargetCandidate(unit, chargingUnit, units, battlefieldProfile, chargeContext = null) {
  const evaluationChargingUnit = createChargeContextChargingUnit(chargingUnit, chargeContext);
  const remainingChargeRangeUd = Number.isFinite(chargeContext?.remainingChargeRangeUd)
    ? Math.max(0, Number(chargeContext.remainingChargeRangeUd))
    : null;
  const rangeEvaluation = getChargeRangeEvaluation(evaluationChargingUnit, unit, units, remainingChargeRangeUd);
  if (!rangeEvaluation.isInRange) {
    return createChargeTargetCandidate({
      unitId: unit.id,
      distanceUd: rangeEvaluation.distanceUd,
      maxChargeRangeUd: rangeEvaluation.maxChargeRangeUd,
      status: CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED,
      sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
      reason: `Charge-Ziel liegt ausserhalb der Reichweite: ${formatLengthUd(rangeEvaluation.distanceUd)} UD zwischen den naechsten Punkten bei maximal ${formatLengthUd(rangeEvaluation.maxChargeRangeUd)} UD.`,
      diagnostics: [
        createChargeTargetDiagnostic({
          code: 'charge.target.enemy',
          status: 'ok',
          text: 'Feindliche Einheit erkannt.',
        }),
        createChargeTargetDiagnostic({
          code: 'charge.target.range',
          status: 'blocked',
          text: `Die Distanz zwischen den naechsten Punkten betraegt ${formatLengthUd(rangeEvaluation.distanceUd)} UD und ueberschreitet die aktuelle Charge-Reichweite von ${formatLengthUd(rangeEvaluation.maxChargeRangeUd)} UD.`,
        }),
      ],
    });
  }

  const feasibility = getChargeFeasibilityEvaluation({
    chargingUnit: evaluationChargingUnit,
    targetUnit: unit,
    units,
    battlefieldProfile,
    maxChargeRangeUdOverride: remainingChargeRangeUd,
    allowedPathFamilies: chargeContext?.allowedPathFamilies ?? null,
  });
  if (!feasibility.ok) {
    return createChargeTargetCandidate({
      unitId: unit.id,
      distanceUd: rangeEvaluation.distanceUd,
      maxChargeRangeUd: rangeEvaluation.maxChargeRangeUd,
      status: CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED,
      sourceStatus: feasibility.sourceStatus,
      reason: `Charge-Ziel liegt zwar innerhalb der Grundreichweite, ist aber aktuell nicht erreichbar: ${feasibility.reason}`,
      diagnostics: [
        createChargeTargetDiagnostic({
          code: 'charge.target.enemy',
          status: 'ok',
          text: 'Feindliche Einheit erkannt.',
        }),
        createChargeTargetDiagnostic({
          code: 'charge.target.range',
          status: 'ok',
          text: `Die Distanz zwischen den naechsten Punkten betraegt ${formatLengthUd(rangeEvaluation.distanceUd)} UD und liegt innerhalb der aktuellen Charge-Reichweite von ${formatLengthUd(rangeEvaluation.maxChargeRangeUd)} UD.`,
          sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
        }),
        createChargeTargetDiagnostic({
          code: 'charge.target.path-feasibility',
          status: 'blocked',
          text: feasibility.reason,
          sourceStatus: feasibility.sourceStatus,
        }),
      ],
    });
  }

  return createChargeTargetCandidate({
    unitId: unit.id,
    distanceUd: rangeEvaluation.distanceUd,
    maxChargeRangeUd: rangeEvaluation.maxChargeRangeUd,
    status: CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE,
    sourceStatus: feasibility.sourceStatus,
    reason: `Charge-Ziel ist erreichbar via ${feasibility.sequenceLabel}: ${formatLengthUd(rangeEvaluation.distanceUd)} UD zwischen den naechsten Punkten bei maximal ${formatLengthUd(rangeEvaluation.maxChargeRangeUd)} UD.`,
    diagnostics: [
      createChargeTargetDiagnostic({
        code: 'charge.target.enemy',
        status: 'ok',
        text: 'Feindliche Einheit kann im aktuellen P7-Schnitt als Charge-Ziel ausgewaehlt werden.',
      }),
      createChargeTargetDiagnostic({
        code: 'charge.target.range',
        status: 'ok',
        text: `Die Distanz zwischen den naechsten Punkten betraegt ${formatLengthUd(rangeEvaluation.distanceUd)} UD und liegt innerhalb der aktuellen Charge-Reichweite von ${formatLengthUd(rangeEvaluation.maxChargeRangeUd)} UD.`,
        sourceStatus: CHARGE_TARGET_SOURCE_STATUSES.VERIFIED,
      }),
      createChargeTargetDiagnostic({
        code: 'charge.target.path-feasibility',
        status: 'ok',
        text: `Mindestens ein legaler Charge-Pfad wurde gefunden (${feasibility.sequenceLabel}).`,
        sourceStatus: feasibility.sourceStatus,
      }),
    ],
  });
}

export function getChargeTargetCandidates({ units, chargingUnitId, battlefieldProfile, chargeContext = null }) {
  if (!Array.isArray(units) || !chargingUnitId) {
    return [];
  }

  const chargingUnit = units.find((unit) => unit.id === chargingUnitId) || null;
  if (!chargingUnit) {
    return [];
  }

  const resolvedBattlefieldProfile = battlefieldProfile
    ?? getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM)
    ?? null;
  if (!resolvedBattlefieldProfile) {
    return [];
  }

  return units
    .filter((unit) => unit.id !== chargingUnit.id)
    .map((unit) => (unit.owner === chargingUnit.owner
      ? createFriendlyTargetCandidate(unit)
      : createEnemyTargetCandidate(unit, chargingUnit, units, resolvedBattlefieldProfile, chargeContext)));
}

export function getChargeTargetCandidateByUnitId(candidates, unitId) {
  if (!Array.isArray(candidates) || !unitId) {
    return null;
  }

  return candidates.find((candidate) => candidate.unitId === unitId) || null;
}
