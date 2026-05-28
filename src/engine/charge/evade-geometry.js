import { getResolvedAbilityIdsForUnit } from '../../data/unit-profiles.js';
import {
  GEOMETRY_EPSILON,
  addVectors,
  getAxesFromRotation,
  getRotatedRectangleBounds,
  getUnitBaseGeometry,
  normalizeAngleRadians,
  scaleVector,
  worldPointToLocalPoint,
} from '../geometry/index.js';
import { getFootprintCommandRangeMeasurement } from '../command/range.js';
import {
  createEvadeDiagnostic,
  EVADE_PLAN_SOURCE_STATUSES,
} from './evade-model.js';

const SIMPLE_EVADE_BLOCKER_MAX_AHEAD_UD = 1;
const SIMPLE_EVADE_SLIDE_STEP_UD = 0.25;
const EVADE_LINEAR_PATH_SAMPLE_STEP_UD = 0.25;
const EVADE_PATH_CLEARANCE_TOLERANCE_UD = 0.005;
const LIGHT_TROOP_END_HALF_TURN_FAMILIES = new Set([
  'javelinmen',
  'light-cavalry',
  'light-infantry',
]);

function normalizePoseUnit(unit = {}) {
  return {
    id: unit.id ?? null,
    owner: unit.owner ?? null,
    xUd: Number.isFinite(unit.xUd) ? unit.xUd : 0,
    yUd: Number.isFinite(unit.yUd) ? unit.yUd : 0,
    widthUd: Number.isFinite(unit.widthUd) ? unit.widthUd : 1,
    depthUd: Number.isFinite(unit.depthUd) ? unit.depthUd : 1,
    rotationRadians: Number.isFinite(unit.rotationRadians) ? unit.rotationRadians : 0,
    baseShape: unit.baseShape === 'circle' ? 'circle' : 'rectangle',
  };
}

function createFootprintFromPose(unit, pose) {
  return {
    id: unit?.id ?? null,
    xUd: Number(pose?.xUd ?? unit?.xUd ?? 0),
    yUd: Number(pose?.yUd ?? unit?.yUd ?? 0),
    widthUd: Number(unit?.widthUd ?? 0),
    depthUd: Number(unit?.depthUd ?? unit?.widthUd ?? 0),
    rotationRadians: Number(pose?.rotationRadians ?? unit?.rotationRadians ?? 0),
    baseShape: unit?.baseShape === 'circle' ? 'circle' : 'rectangle',
  };
}

function getPoseUnitGeometry(unit) {
  const normalized = normalizePoseUnit(unit);

  return getUnitBaseGeometry({
    center: { x: normalized.xUd, y: normalized.yUd },
    widthUd: normalized.widthUd,
    depthUd: normalized.depthUd,
    rotationRadians: normalized.rotationRadians,
  });
}

function getLocalBoundsForBlockerRelativeToUnit(blockerUnit, unit) {
  const unitGeometry = getPoseUnitGeometry(unit);
  const blockerGeometry = getPoseUnitGeometry(blockerUnit);
  const localPoints = [
    blockerGeometry.center,
    blockerGeometry.corners.frontLeft,
    blockerGeometry.corners.frontRight,
    blockerGeometry.corners.rearRight,
    blockerGeometry.corners.rearLeft,
  ].map((point) => worldPointToLocalPoint({
    center: unitGeometry.center,
    widthUd: unitGeometry.widthUd,
    depthUd: unitGeometry.depthUd,
    rotationRadians: unitGeometry.rotationRadians,
  }, point));

  return {
    minX: Math.min(...localPoints.map((point) => point.x)),
    maxX: Math.max(...localPoints.map((point) => point.x)),
    minY: Math.min(...localPoints.map((point) => point.y)),
    maxY: Math.max(...localPoints.map((point) => point.y)),
  };
}

function isSimpleEvadeBlockerDirectlyAhead(blockerUnit, unit) {
  const blockerBounds = getLocalBoundsForBlockerRelativeToUnit(blockerUnit, unit);
  const halfWidth = Number(unit.widthUd ?? 1) / 2;
  const halfDepth = Number(unit.depthUd ?? 1) / 2;
  const overlapsFrontLaneX = blockerBounds.maxX > -halfWidth + GEOMETRY_EPSILON
    && blockerBounds.minX < halfWidth - GEOMETRY_EPSILON;
  const intersectsAheadStripY = blockerBounds.maxY > halfDepth + GEOMETRY_EPSILON
    && blockerBounds.minY < halfDepth + SIMPLE_EVADE_BLOCKER_MAX_AHEAD_UD - GEOMETRY_EPSILON;

  return overlapsFrontLaneX && intersectsAheadStripY;
}

function getSlidPoseUnit(unit, side, distanceUd) {
  const normalized = normalizePoseUnit(unit);
  const { rightAxis } = getAxesFromRotation(normalized.rotationRadians);
  const signedDistanceUd = side === 'left' ? -Math.abs(distanceUd) : Math.abs(distanceUd);
  const nextCenter = addVectors(
    { x: normalized.xUd, y: normalized.yUd },
    scaleVector(rightAxis, signedDistanceUd),
  );

  return {
    ...normalized,
    xUd: nextCenter.x,
    yUd: nextCenter.y,
  };
}

function* iterateSimpleEvadeSlideDistances() {
  yield 0;
  for (
    let distanceUd = SIMPLE_EVADE_SLIDE_STEP_UD;
    distanceUd <= SIMPLE_EVADE_BLOCKER_MAX_AHEAD_UD + GEOMETRY_EPSILON;
    distanceUd += SIMPLE_EVADE_SLIDE_STEP_UD
  ) {
    yield Number(Math.min(SIMPLE_EVADE_BLOCKER_MAX_AHEAD_UD, distanceUd).toFixed(3));
  }
}

function getRequiredSlideDistanceForBlocker({ blockerUnit, unit, side }) {
  if (!blockerUnit || !unit || (side !== 'left' && side !== 'right')) {
    return null;
  }

  const blockerBounds = getLocalBoundsForBlockerRelativeToUnit(blockerUnit, unit);
  const halfWidth = Number(unit.widthUd ?? 1) / 2;
  const requiredDistanceUd = side === 'left'
    ? (halfWidth - blockerBounds.minX + GEOMETRY_EPSILON)
    : (blockerBounds.maxX + halfWidth + GEOMETRY_EPSILON);

  return Number(Math.max(0, requiredDistanceUd).toFixed(3));
}

function* iterateEvadeSlideDistancesFromMinimum(minimumDistanceUd = 0) {
  const normalizedMinimumUd = Number(Math.max(0, minimumDistanceUd).toFixed(3));
  if (normalizedMinimumUd > SIMPLE_EVADE_BLOCKER_MAX_AHEAD_UD + GEOMETRY_EPSILON) {
    return;
  }

  const yielded = new Set();
  if (normalizedMinimumUd > GEOMETRY_EPSILON) {
    yielded.add(normalizedMinimumUd.toFixed(3));
    yield normalizedMinimumUd;
  }

  const startStepUd = Math.max(
    SIMPLE_EVADE_SLIDE_STEP_UD,
    Math.ceil((normalizedMinimumUd - GEOMETRY_EPSILON) / SIMPLE_EVADE_SLIDE_STEP_UD) * SIMPLE_EVADE_SLIDE_STEP_UD,
  );

  for (const distanceUd of iterateSimpleEvadeSlideDistances()) {
    if (distanceUd + GEOMETRY_EPSILON < startStepUd) {
      continue;
    }

    const normalizedDistanceUd = Number(distanceUd.toFixed(3));
    const key = normalizedDistanceUd.toFixed(3);
    if (yielded.has(key)) {
      continue;
    }

    yielded.add(key);
    yield normalizedDistanceUd;
  }
}

export function getPermittedLateSlideDistances(minimumDistanceUd = 0, remainingDistanceUd = 0) {
  const normalizedRemainingDistanceUd = Number(Math.min(1, Math.max(0, remainingDistanceUd)).toFixed(3));
  if (normalizedRemainingDistanceUd <= GEOMETRY_EPSILON) {
    return [];
  }

  const distances = [...iterateEvadeSlideDistancesFromMinimum(minimumDistanceUd)]
    .filter((distanceUd) => distanceUd <= normalizedRemainingDistanceUd + GEOMETRY_EPSILON);

  if (distances.length > 0) {
    return distances;
  }

  return [normalizedRemainingDistanceUd];
}

export function getMinimumClearanceSlideDistance({ blockerUnits = [], unit, side }) {
  if (!Array.isArray(blockerUnits) || blockerUnits.length === 0) {
    return 0;
  }

  return blockerUnits.reduce((maximumDistanceUd, blockerUnit) => {
    const requiredDistanceUd = getRequiredSlideDistanceForBlocker({ blockerUnit, unit, side });
    return Number(Math.max(maximumDistanceUd, Number(requiredDistanceUd ?? 0)).toFixed(3));
  }, 0);
}

function summarizeClearanceBlocker(blockerUnit, unit) {
  if (!blockerUnit || !unit) {
    return null;
  }

  const localBounds = getLocalBoundsForBlockerRelativeToUnit(blockerUnit, unit);

  return {
    id: blockerUnit.id ?? null,
    pose: {
      xUd: Number.isFinite(blockerUnit.xUd) ? blockerUnit.xUd : null,
      yUd: Number.isFinite(blockerUnit.yUd) ? blockerUnit.yUd : null,
      rotationRadians: Number.isFinite(blockerUnit.rotationRadians) ? blockerUnit.rotationRadians : null,
    },
    localBounds: {
      minX: Number(localBounds.minX.toFixed(3)),
      maxX: Number(localBounds.maxX.toFixed(3)),
      minY: Number(localBounds.minY.toFixed(3)),
      maxY: Number(localBounds.maxY.toFixed(3)),
    },
    requiredSlideDistances: {
      left: getRequiredSlideDistanceForBlocker({ blockerUnit, unit, side: 'left' }),
      right: getRequiredSlideDistanceForBlocker({ blockerUnit, unit, side: 'right' }),
    },
  };
}

export function getClearanceBlockerSummaries({ blockerUnits = [], unit }) {
  if (!Array.isArray(blockerUnits) || blockerUnits.length === 0 || !unit) {
    return [];
  }

  return blockerUnits
    .map((blockerUnit) => summarizeClearanceBlocker(blockerUnit, unit))
    .filter(Boolean);
}

export function getLimitingClearanceBlocker(clearanceBlockers = [], side) {
  if (!Array.isArray(clearanceBlockers) || clearanceBlockers.length === 0) {
    return null;
  }

  return clearanceBlockers.reduce((currentMaximum, blocker) => {
    const blockerDistanceUd = Number(blocker?.requiredSlideDistances?.[side] ?? 0);
    const maximumDistanceUd = Number(currentMaximum?.requiredSlideDistances?.[side] ?? -Infinity);
    return blockerDistanceUd > maximumDistanceUd ? blocker : currentMaximum;
  }, null);
}

export function evaluateSimpleBlockedEvade({
  reorientedUnit,
  units = [],
  ignoredUnitIds = [],
}) {
  const normalizedUnit = normalizePoseUnit(reorientedUnit);
  const candidateUnits = Array.isArray(units)
    ? units.filter((unit) => unit?.id && !ignoredUnitIds.includes(unit.id))
    : [];
  const directlyAheadBlockers = candidateUnits.filter((unit) => isSimpleEvadeBlockerDirectlyAhead(unit, normalizedUnit));

  if (directlyAheadBlockers.length === 0) {
    return {
      isBlocked: false,
      blockerUnitIds: [],
      clearanceSlides: [],
    };
  }

  const clearanceSlides = [];
  for (const side of ['left', 'right']) {
    const minimumDistanceUd = getMinimumClearanceSlideDistance({
      blockerUnits: directlyAheadBlockers,
      unit: normalizedUnit,
      side,
    });

    for (const distanceUd of iterateEvadeSlideDistancesFromMinimum(minimumDistanceUd)) {
      const slidUnit = getSlidPoseUnit(normalizedUnit, side, distanceUd);
      const stillBlocked = candidateUnits.some((unit) => isSimpleEvadeBlockerDirectlyAhead(unit, slidUnit));
      if (!stillBlocked) {
        clearanceSlides.push({ side, distanceUd });
        break;
      }
    }
  }

  return {
    isBlocked: clearanceSlides.length === 0,
    blockerUnitIds: directlyAheadBlockers.map((unit) => unit.id ?? null).filter(Boolean).sort(),
    clearanceSlides,
  };
}

function getFootprintBounds(footprint) {
  if (footprint.baseShape === 'circle') {
    const radiusUd = Number(footprint.widthUd ?? 0) / 2;
    return {
      minX: footprint.xUd - radiusUd,
      maxX: footprint.xUd + radiusUd,
      minY: footprint.yUd - radiusUd,
      maxY: footprint.yUd + radiusUd,
    };
  }

  return getRotatedRectangleBounds({
    center: { x: footprint.xUd, y: footprint.yUd },
    widthUd: footprint.widthUd,
    depthUd: footprint.depthUd,
    rotationRadians: footprint.rotationRadians,
  });
}

export function getEvadePlanDiagnostics({
  reactingUnit,
  startPose = null,
  endPose,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
}) {
  const diagnostics = [];
  const evadeFootprint = createFootprintFromPose(reactingUnit, endPose);

  if (battlefieldProfile) {
    const bounds = getFootprintBounds(evadeFootprint);
    if (
      bounds.minX < 0
      || bounds.maxX > Number(battlefieldProfile.widthUd ?? 0)
      || bounds.minY < 0
      || bounds.maxY > Number(battlefieldProfile.heightUd ?? 0)
    ) {
      diagnostics.push(createEvadeDiagnostic({
        code: 'charge.evade.table-edge',
        status: 'warn',
        text: 'The isolated evade end pose would leave the battlefield footprint; table-edge loss is not resolved in the current P7A subset.',
      }));
    }
  }

  const overlapUnitId = getFirstOverlappingUnitId({
    reactingUnit,
    pose: endPose,
    units,
    ignoredUnitIds,
  });
  if (overlapUnitId) {
    diagnostics.push(createEvadeDiagnostic({
      code: 'charge.evade.final-overlap',
      status: 'warn',
      text: `The isolated evade end pose still overlaps unit '${overlapUnitId}'; evade movement must end clear, and this unresolved overlap remains outside the current supported subset.`,
    }));
  }

  const pathOverlapUnitId = diagnostics.length === 0
    ? getFirstLinearPathOverlapUnitId({
      reactingUnit,
      startPose,
      endPose,
      units,
      ignoredUnitIds,
    })
    : null;
  if (pathOverlapUnitId) {
    diagnostics.push(createEvadeDiagnostic({
      code: 'charge.evade.path-overlap',
      status: 'warn',
      text: `The isolated evade path still runs into unit '${pathOverlapUnitId}'; later obstacle handling remains unresolved for this path in the current supported subset.`,
    }));
  }

  return diagnostics;
}

export function getFirstOverlappingUnitId({
  reactingUnit,
  pose,
  units = [],
  ignoredUnitIds = [],
  shrinkFootprintUd = EVADE_PATH_CLEARANCE_TOLERANCE_UD,
}) {
  const evadeFootprint = createFootprintFromPose({
    ...reactingUnit,
    widthUd: Math.max(GEOMETRY_EPSILON, Number(reactingUnit?.widthUd ?? 0) - shrinkFootprintUd),
    depthUd: Math.max(GEOMETRY_EPSILON, Number(reactingUnit?.depthUd ?? reactingUnit?.widthUd ?? 0) - shrinkFootprintUd),
  }, pose);

  for (const unit of units ?? []) {
    if (!unit || ignoredUnitIds.includes(unit.id)) {
      continue;
    }

    const measurement = getFootprintCommandRangeMeasurement(evadeFootprint, createFootprintFromPose(unit));
    if (measurement.distanceUd <= 1e-6) {
      return unit.id ?? 'unknown';
    }
  }

  return null;
}

export function getFirstLinearPathOverlapUnitId({
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
  for (let sampleIndex = 1; sampleIndex < sampleCount; sampleIndex += 1) {
    const progress = sampleIndex / sampleCount;
    const sampledPose = {
      xUd: Number((Number(startPose.xUd ?? 0) + (deltaXUd * progress)).toFixed(3)),
      yUd: Number((Number(startPose.yUd ?? 0) + (deltaYUd * progress)).toFixed(3)),
      rotationRadians: Number(endPose.rotationRadians ?? startPose.rotationRadians ?? 0),
    };
    const overlapUnitId = getFirstOverlappingUnitId({
      reactingUnit,
      pose: sampledPose,
      units,
      ignoredUnitIds,
      shrinkFootprintUd: EVADE_PATH_CLEARANCE_TOLERANCE_UD,
    });

    if (overlapUnitId) {
      return overlapUnitId;
    }
  }

  return null;
}

function interpolatePose(startPose, endPose, progress) {
  return {
    xUd: Number((Number(startPose.xUd ?? 0) + ((Number(endPose.xUd ?? 0) - Number(startPose.xUd ?? 0)) * progress)).toFixed(3)),
    yUd: Number((Number(startPose.yUd ?? 0) + ((Number(endPose.yUd ?? 0) - Number(startPose.yUd ?? 0)) * progress)).toFixed(3)),
    rotationRadians: Number(endPose.rotationRadians ?? startPose.rotationRadians ?? 0),
  };
}

export function refineLinearPathBoundaryPose({
  reactingUnit,
  legalPose,
  overlappingPose,
  units = [],
  ignoredUnitIds = [],
  allowedUnitIds = null,
  shrinkFootprintUd = EVADE_PATH_CLEARANCE_TOLERANCE_UD,
}) {
  let lowPose = legalPose;
  let highPose = overlappingPose;

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const midPose = interpolatePose(lowPose, highPose, 0.5);
    const overlappingUnits = getOverlappingUnitsAtPose({
      reactingUnit,
      pose: midPose,
      units,
      ignoredUnitIds,
      shrinkFootprintUd,
    });
    const isRelevantOverlap = allowedUnitIds
      ? overlappingUnits.some((unit) => allowedUnitIds.has(unit?.id))
      : overlappingUnits.length > 0;

    if (isRelevantOverlap) {
      highPose = midPose;
    } else {
      lowPose = midPose;
    }
  }

  return lowPose;
}

export function getOverlappingUnitsAtPose({
  reactingUnit,
  pose,
  units = [],
  ignoredUnitIds = [],
  shrinkFootprintUd = EVADE_PATH_CLEARANCE_TOLERANCE_UD,
}) {
  const evadeFootprint = createFootprintFromPose({
    ...reactingUnit,
    widthUd: Math.max(GEOMETRY_EPSILON, Number(reactingUnit?.widthUd ?? 0) - shrinkFootprintUd),
    depthUd: Math.max(GEOMETRY_EPSILON, Number(reactingUnit?.depthUd ?? reactingUnit?.widthUd ?? 0) - shrinkFootprintUd),
  }, pose);

  return (units ?? []).filter((unit) => {
    if (!unit || ignoredUnitIds.includes(unit.id)) {
      return false;
    }

    return getFootprintCommandRangeMeasurement(evadeFootprint, createFootprintFromPose(unit)).distanceUd <= 1e-6;
  });
}

export function doesPoseOverlapAnyUnit({ reactingUnit, pose, units = [], ignoredUnitIds = [], shrinkFootprintUd = 0 }) {
  return Boolean(getFirstOverlappingUnitId({ reactingUnit, pose, units, ignoredUnitIds, shrinkFootprintUd }));
}

export function isPoseInsideBattlefield({ reactingUnit, pose, battlefieldProfile = null }) {
  if (!battlefieldProfile) {
    return true;
  }

  const bounds = getFootprintBounds(createFootprintFromPose(reactingUnit, pose));
  return bounds.minX >= 0
    && bounds.maxX <= Number(battlefieldProfile.widthUd ?? 0)
    && bounds.minY >= 0
    && bounds.maxY <= Number(battlefieldProfile.heightUd ?? 0);
}

export function createTableExitHook({ reactingUnit, pose, battlefieldProfile = null }) {
  if (!battlefieldProfile || isPoseInsideBattlefield({ reactingUnit, pose, battlefieldProfile })) {
    return null;
  }

  const bounds = getFootprintBounds(createFootprintFromPose(reactingUnit, pose));
  const widthUd = Number(battlefieldProfile.widthUd ?? 0);
  const heightUd = Number(battlefieldProfile.heightUd ?? 0);
  const exitEdges = [
    bounds.minX < 0 ? 'west' : null,
    bounds.maxX > widthUd ? 'east' : null,
    bounds.minY < 0 ? 'north' : null,
    bounds.maxY > heightUd ? 'south' : null,
  ].filter(Boolean);

  return {
    exitsTable: true,
    exitEdges,
    exitPose: pose,
    removeFromPlay: true,
    deferredAccountingHook: {
      phase: 'P10',
      reason: 'army-cohesion-and-victory-accounting',
    },
    sourceStatus: EVADE_PLAN_SOURCE_STATUSES.VERIFIED,
  };
}

function isLightTroopForEndHalfTurn(unit = {}) {
  if (typeof unit?.profileId === 'string' && unit.profileId.trim().length > 0) {
    try {
      const resolvedAbilityIds = getResolvedAbilityIdsForUnit(unit);
      return resolvedAbilityIds.includes('light-troops');
    } catch {
      // Keep the legacy fallback for not-yet-migrated or source-open units.
    }
  }

  const family = String(unit?.chargeReactionCapability?.family ?? '').toLowerCase();
  const troopType = String(unit?.troopType ?? '').toLowerCase();

  return LIGHT_TROOP_END_HALF_TURN_FAMILIES.has(family) || LIGHT_TROOP_END_HALF_TURN_FAMILIES.has(troopType);
}

export function createEndHalfTurnHook({ reactingUnit, endPose }) {
  if (!endPose || !isLightTroopForEndHalfTurn(reactingUnit)) {
    return null;
  }

  return {
    available: true,
    applied: true,
    reason: 'light-troop-end-half-turn',
    rotationBeforeRadians: Number(endPose.rotationRadians ?? 0),
    rotationAfterRadians: normalizeAngleRadians(Number(endPose.rotationRadians ?? 0) + Math.PI),
    sourceStatus: EVADE_PLAN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  };
}

export function applyEndHalfTurnHookToPose(endPose, hook) {
  if (!endPose || !hook?.applied || !Number.isFinite(hook.rotationAfterRadians)) {
    return endPose;
  }

  return {
    ...endPose,
    rotationRadians: hook.rotationAfterRadians,
  };
}

export function getSlideAdjustedEvadePose({
  reorientedPose,
  side,
  slideDistanceUd,
  totalDistanceUd,
}) {
  const { forwardAxis, rightAxis } = getAxesFromRotation(reorientedPose.rotationRadians);
  const signedSlideDistanceUd = side === 'left' ? -Math.abs(slideDistanceUd) : Math.abs(slideDistanceUd);
  const remainingDistanceUd = Number(Math.max(0, totalDistanceUd - slideDistanceUd).toFixed(3));
  const afterSlide = addVectors(
    { x: Number(reorientedPose.xUd ?? 0), y: Number(reorientedPose.yUd ?? 0) },
    scaleVector(rightAxis, signedSlideDistanceUd),
  );
  const endPosition = addVectors(afterSlide, scaleVector(forwardAxis, remainingDistanceUd));

  return {
    intermediatePose: {
      xUd: Number(afterSlide.x.toFixed(3)),
      yUd: Number(afterSlide.y.toFixed(3)),
      rotationRadians: reorientedPose.rotationRadians,
    },
    endPose: {
      xUd: Number(endPosition.x.toFixed(3)),
      yUd: Number(endPosition.y.toFixed(3)),
      rotationRadians: reorientedPose.rotationRadians,
    },
    remainingDistanceUd,
  };
}