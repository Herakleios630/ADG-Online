import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
} from './classification.js';
import { createChargeGuideSegment } from './path.js';
import { resolveChargeContactState } from './contact.js';
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
  MOVEMENT_PIVOT_SIDES,
  getWheelDistanceUdForAngleRadians,
  getWheelEndPose,
} from '../movement/index.js';





export const CHARGE_BRANCH_ROLL_REASONS = {
  EVADE_DISTANCE: 'evade-distance',
  ADJUSTED_CHARGE_DISTANCE: 'adjusted-charge-distance',
};

export const CHARGE_BRANCH_DISTANCE_OUTCOMES = {
  MOVEMENT_MINUS_ONE: 'movement-minus-1-ud',
  NORMAL_MOVEMENT: 'normal-movement',
  MOVEMENT_PLUS_ONE: 'movement-plus-1-ud',
};

export const EVADE_PLAN_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const CHARGE_MOVEMENT_PLAN_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const CHARGE_MOVEMENT_CONTINUATION_DECISIONS = {
  STOP: 'stop',
  CONTINUE: 'continue',
};

const SIMPLE_EVADE_BLOCKER_MAX_AHEAD_UD = 1;
const SIMPLE_EVADE_SLIDE_STEP_UD = 0.25;
const EVADE_LINEAR_PATH_SAMPLE_STEP_UD = 0.25;
const EVADE_PATH_CLEARANCE_TOLERANCE_UD = 0.02;
const EVADE_WHEEL_STEP_RADIANS = Math.PI / 180;
const EVADE_MAX_LATER_AVOIDANCE_STEPS = 4;

function getSignedAngleDeltaRadians(targetAngleRadians, sourceAngleRadians) {
  const normalizedDeltaRadians = normalizeAngleRadians(targetAngleRadians - sourceAngleRadians);
  return normalizedDeltaRadians > Math.PI
    ? normalizedDeltaRadians - (Math.PI * 2)
    : normalizedDeltaRadians;
}

export function resolveEvadeReorientation({
  reactingUnit,
  contactClassification,
  selectedContactSide = null,
  contactSnapshot = null,
}) {
  if (!reactingUnit) {
    throw new Error('Evade reorientation requires a reacting unit.');
  }

  const startPose = getEvadeStartPose(reactingUnit, contactSnapshot);
  const contactType = getEffectiveContactType(contactClassification, selectedContactSide);
  const flankSide = getEffectiveFlankSide(contactClassification, selectedContactSide);
  const reorientedRotationRadians = normalizeAngleRadians(
    Number(startPose.rotationRadians ?? 0) + getEvadeRotationDelta(contactType, flankSide),
  );

  return {
    startPose,
    contactType,
    flankSide,
    reorientedPose: {
      xUd: Number(startPose.xUd ?? 0),
      yUd: Number(startPose.yUd ?? 0),
      rotationRadians: reorientedRotationRadians,
    },
  };
}

function getChargeBranchDistanceOutcome(dieRoll) {
  if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 6) {
    throw new Error('Charge branch roll resolution requires a D6 roll from 1 to 6.');
  }

  if (dieRoll === 1) {
    return CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_MINUS_ONE;
  }

  if (dieRoll === 6) {
    return CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_PLUS_ONE;
  }

  return CHARGE_BRANCH_DISTANCE_OUTCOMES.NORMAL_MOVEMENT;
}

function getDistanceModifierUd(distanceOutcome, { neverReduce = false } = {}) {
  if (distanceOutcome === CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_MINUS_ONE) {
    return neverReduce ? 0 : -1;
  }

  if (distanceOutcome === CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_PLUS_ONE) {
    return 1;
  }

  return 0;
}

export function createChargeBranchRollClaim(overrides = {}) {
  return {
    reason: overrides.reason ?? null,
    actingPlayerId: overrides.actingPlayerId ?? null,
    reactingUnitId: overrides.reactingUnitId ?? null,
    chargingUnitId: overrides.chargingUnitId ?? null,
    targetUnitId: overrides.targetUnitId ?? null,
    declarationSnapshot: overrides.declarationSnapshot ?? null,
    actionLogToken: overrides.actionLogToken ?? null,
  };
}

export function createChargeBranchRollResult(overrides = {}) {
  const dieRoll = overrides.dieRoll;
  const distanceOutcome = overrides.distanceOutcome ?? getChargeBranchDistanceOutcome(dieRoll);
  const baseDistanceUd = Number.isFinite(overrides.baseDistanceUd) ? overrides.baseDistanceUd : 0;
  const modifierUd = Number.isFinite(overrides.modifierUd)
    ? overrides.modifierUd
    : getDistanceModifierUd(distanceOutcome, { neverReduce: Boolean(overrides.neverReduce) });

  return {
    claim: overrides.claim ?? null,
    dieRoll,
    distanceOutcome,
    baseDistanceUd,
    modifierUd,
    resolvedDistanceUd: Math.max(0, baseDistanceUd + modifierUd),
    neverReduce: Boolean(overrides.neverReduce),
  };
}

export function createEvadePlan(overrides = {}) {
  return {
    reactingUnitId: overrides.reactingUnitId ?? null,
    contactType: overrides.contactType ?? CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT,
    flankSide: overrides.flankSide ?? null,
    selectedContactSide: overrides.selectedContactSide ?? null,
    startPose: overrides.startPose ?? null,
    reorientedPose: overrides.reorientedPose ?? null,
    endPose: overrides.endPose ?? null,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : 0,
    spentAvoidanceUd: Number.isFinite(overrides.spentAvoidanceUd) ? overrides.spentAvoidanceUd : 0,
    remainingDistanceUd: Number.isFinite(overrides.remainingDistanceUd) ? overrides.remainingDistanceUd : null,
    avoidanceSteps: Array.isArray(overrides.avoidanceSteps) ? overrides.avoidanceSteps : [],
    avoidanceCandidates: Array.isArray(overrides.avoidanceCandidates) ? overrides.avoidanceCandidates : [],
    choiceRequired: Boolean(overrides.choiceRequired),
    rollResult: overrides.rollResult ?? null,
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
    sourceStatus: overrides.sourceStatus ?? EVADE_PLAN_SOURCE_STATUSES.VERIFIED,
  };
}

export function createChargeMovementPlan(overrides = {}) {
  return {
    chargingUnitId: overrides.chargingUnitId ?? null,
    startPose: overrides.startPose ?? null,
    contactPose: overrides.contactPose ?? null,
    endPose: overrides.endPose ?? null,
    frozenDirectionRadians: Number.isFinite(overrides.frozenDirectionRadians)
      ? overrides.frozenDirectionRadians
      : null,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : 0,
    rollResult: overrides.rollResult ?? null,
    contactState: overrides.contactState ?? null,
    continuationChoice: overrides.continuationChoice ?? null,
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
    sourceStatus: overrides.sourceStatus ?? CHARGE_MOVEMENT_PLAN_SOURCE_STATUSES.VERIFIED,
  };
}

export function createChargeMovementContinuationChoice(overrides = {}) {
  return {
    required: Boolean(overrides.required),
    selectedOption: overrides.selectedOption ?? null,
    minimumDistanceUd: Number.isFinite(overrides.minimumDistanceUd) ? overrides.minimumDistanceUd : 0,
    minimumEndPose: overrides.minimumEndPose ?? null,
    maximumDistanceUd: Number.isFinite(overrides.maximumDistanceUd) ? overrides.maximumDistanceUd : 0,
    maximumEndPose: overrides.maximumEndPose ?? null,
    isImpetuous: Boolean(overrides.isImpetuous),
    minimumLabel: overrides.minimumLabel ?? null,
  };
}

function createEvadeDiagnostic(overrides = {}) {
  return {
    code: overrides.code ?? 'charge.evade',
    status: overrides.status ?? 'info',
    text: overrides.text ?? '',
  };
}

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

function getMinimumClearanceSlideDistance({ blockerUnits = [], unit, side }) {
  if (!Array.isArray(blockerUnits) || blockerUnits.length === 0) {
    return 0;
  }

  return blockerUnits.reduce((maximumDistanceUd, blockerUnit) => {
    const requiredDistanceUd = getRequiredSlideDistanceForBlocker({ blockerUnit, unit, side });
    return Number(Math.max(maximumDistanceUd, Number(requiredDistanceUd ?? 0)).toFixed(3));
  }, 0);
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

function getEvadePlanDiagnostics({
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

  for (const unit of units) {
    if (!unit || ignoredUnitIds.includes(unit.id)) {
      continue;
    }

    const measurement = getFootprintCommandRangeMeasurement(evadeFootprint, createFootprintFromPose(unit));
    if (measurement.distanceUd <= 1e-6) {
      diagnostics.push(createEvadeDiagnostic({
        code: 'charge.evade.interpenetration',
        status: 'warn',
        text: `The isolated evade end pose overlaps unit '${unit.id ?? 'unknown'}'; obstacle and interpenetration resolution remain outside the current P7A subset.`,
      }));
      break;
    }
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
      code: 'charge.evade.path-interpenetration',
      status: 'warn',
      text: `The isolated evade path crosses unit '${pathOverlapUnitId}'; obstacle and interpenetration resolution remain outside the current supported straight-path subset.`,
    }));
  }

  return diagnostics;
}

function getFirstOverlappingUnitId({
  reactingUnit,
  pose,
  units = [],
  ignoredUnitIds = [],
  shrinkFootprintUd = 0,
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

function getFirstLinearPathOverlapUnitId({
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

function doesPoseOverlapAnyUnit({ reactingUnit, pose, units = [], ignoredUnitIds = [] }) {
  return Boolean(getFirstOverlappingUnitId({ reactingUnit, pose, units, ignoredUnitIds }));
}

function isPoseInsideBattlefield({ reactingUnit, pose, battlefieldProfile = null }) {
  if (!battlefieldProfile) {
    return true;
  }

  const bounds = getFootprintBounds(createFootprintFromPose(reactingUnit, pose));
  return bounds.minX >= 0
    && bounds.maxX <= Number(battlefieldProfile.widthUd ?? 0)
    && bounds.minY >= 0
    && bounds.maxY <= Number(battlefieldProfile.heightUd ?? 0);
}

function getSlideAdjustedEvadePose({
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

function createEvadeAvoidanceCandidate(overrides = {}) {
  return {
    id: overrides.id ?? null,
    type: overrides.type ?? 'slide',
    side: overrides.side ?? null,
    pivotSide: overrides.pivotSide ?? null,
    angleRadians: Number.isFinite(overrides.angleRadians) ? overrides.angleRadians : null,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : null,
    spentDistanceUd: Number.isFinite(overrides.spentDistanceUd)
      ? overrides.spentDistanceUd
      : Number.isFinite(overrides.distanceUd)
        ? overrides.distanceUd
        : 0,
    intermediatePose: overrides.intermediatePose ?? null,
    endPose: overrides.endPose ?? null,
    remainingDistanceUd: Number.isFinite(overrides.remainingDistanceUd) ? overrides.remainingDistanceUd : null,
    blockerUnitIds: Array.isArray(overrides.blockerUnitIds) ? overrides.blockerUnitIds : [],
    avoidanceSteps: Array.isArray(overrides.avoidanceSteps) ? overrides.avoidanceSteps : [],
  };
}

function createStraightEvadeCandidate({ endPose, distanceUd }) {
  return createEvadeAvoidanceCandidate({
    id: 'straight',
    type: 'straight',
    spentDistanceUd: 0,
    endPose,
    remainingDistanceUd: distanceUd,
  });
}

function getEvadeCandidateSteps(candidate = null) {
  if (Array.isArray(candidate?.avoidanceSteps) && candidate.avoidanceSteps.length > 0) {
    return candidate.avoidanceSteps.filter(Boolean);
  }

  if (!candidate || candidate.type === 'straight') {
    return [];
  }

  return [candidate];
}

function createEvadeAvoidanceStep(overrides = {}) {
  return {
    id: overrides.id ?? null,
    type: overrides.type ?? 'slide',
    side: overrides.side ?? null,
    pivotSide: overrides.pivotSide ?? null,
    angleRadians: Number.isFinite(overrides.angleRadians) ? overrides.angleRadians : null,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : null,
    spentDistanceUd: Number.isFinite(overrides.spentDistanceUd)
      ? overrides.spentDistanceUd
      : Number.isFinite(overrides.distanceUd)
        ? overrides.distanceUd
        : 0,
    endPose: overrides.endPose ?? null,
    remainingDistanceUd: Number.isFinite(overrides.remainingDistanceUd) ? overrides.remainingDistanceUd : null,
  };
}

export function getEvadeStepIdPart(step = null) {
  if (!step?.type) {
    return null;
  }

  if (step.type === 'direction-wheel') {
    return `direction-wheel-${step.pivotSide}-${Number(step.angleRadians ?? 0).toFixed(3)}`;
  }

  if (step.type === 'obstacle-wheel') {
    return `wheel-${step.pivotSide}-${Number(step.angleRadians ?? 0).toFixed(3)}`;
  }

  if (step.type === 'slide') {
    return `slide-${step.side}-${Number(step.distanceUd ?? step.spentDistanceUd ?? 0).toFixed(3)}`;
  }

  return `${step.type}`;
}

function getEvadeCandidateTypeFromSteps(avoidanceSteps = []) {
  if (!Array.isArray(avoidanceSteps) || avoidanceSteps.length === 0) {
    return 'straight';
  }

  const hasDirectionWheel = avoidanceSteps.some((step) => step?.type === 'direction-wheel');
  const hasSlide = avoidanceSteps.some((step) => step?.type === 'slide');
  const hasObstacleWheel = avoidanceSteps.some((step) => step?.type === 'obstacle-wheel');

  if (hasDirectionWheel && hasSlide) {
    return 'direction-wheel-slide';
  }

  if (hasDirectionWheel && hasObstacleWheel) {
    return 'direction-wheel-obstacle-wheel';
  }

  if (hasDirectionWheel) {
    return 'direction-wheel';
  }

  if (hasObstacleWheel) {
    return 'obstacle-wheel';
  }

  return 'slide';
}

function createAvoidanceCandidateFromSteps({
  avoidanceSteps = [],
  endPose = null,
  blockerUnitIds = [],
}) {
  const normalizedSteps = Array.isArray(avoidanceSteps) ? avoidanceSteps.filter(Boolean) : [];
  const lastStep = normalizedSteps[normalizedSteps.length - 1] ?? null;
  const firstStep = normalizedSteps[0] ?? null;

  return createEvadeAvoidanceCandidate({
    id: normalizedSteps.map(getEvadeStepIdPart).filter(Boolean).join('-'),
    type: getEvadeCandidateTypeFromSteps(normalizedSteps),
    side: lastStep?.type === 'slide' ? lastStep.side : null,
    pivotSide: lastStep?.type === 'obstacle-wheel' ? lastStep.pivotSide : null,
    angleRadians: Number.isFinite(lastStep?.angleRadians) ? lastStep.angleRadians : null,
    distanceUd: Number.isFinite(lastStep?.distanceUd) ? lastStep.distanceUd : null,
    spentDistanceUd: normalizedSteps.reduce((total, step) => total + Number(step?.spentDistanceUd ?? step?.distanceUd ?? 0), 0),
    intermediatePose: firstStep?.endPose ?? null,
    endPose,
    remainingDistanceUd: lastStep?.remainingDistanceUd ?? 0,
    blockerUnitIds: Array.from(new Set((blockerUnitIds ?? []).filter(Boolean))),
    avoidanceSteps: normalizedSteps,
  });
}

function getBaseAvoidanceTypeLabel(baseAvoidanceSteps = []) {
  if (!Array.isArray(baseAvoidanceSteps) || baseAvoidanceSteps.length === 0) {
    return null;
  }

  return baseAvoidanceSteps.map((step) => step?.type).filter(Boolean).join('-');
}

function getCandidateTypeWithBase(baseAvoidanceSteps = [], leafType) {
  const baseLabel = getBaseAvoidanceTypeLabel(baseAvoidanceSteps);
  return baseLabel ? `${baseLabel}-${leafType}` : leafType;
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
    const overlapUnitId = getFirstOverlappingUnitId({
      reactingUnit,
      pose: sampledPose,
      units,
      ignoredUnitIds,
      shrinkFootprintUd: EVADE_PATH_CLEARANCE_TOLERANCE_UD,
    });

    if (overlapUnitId) {
      const previousProgress = (sampleIndex - 1) / sampleCount;
      return {
        unitId: overlapUnitId,
        encounterPose: previousPose,
        travelledDistanceUd: Number((distanceUd * previousProgress).toFixed(3)),
        blockedPose: sampledPose,
      };
    }

    previousPose = sampledPose;
  }

  return null;
}

function getPathAvoidanceCandidates({
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
}) {
  if (recursionDepth > EVADE_MAX_LATER_AVOIDANCE_STEPS) {
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
    return [];
  }

  const nextVisitedStateKeys = [...visitedStateKeys, stateKey];
  const straightEndPose = getLinearEndPose(startPose, startPose.rotationRadians, distanceUd);
  const firstOverlap = getFirstLinearPathOverlap({
    reactingUnit,
    startPose,
    endPose: straightEndPose,
    units,
    ignoredUnitIds,
  });

  if (!firstOverlap) {
    return [];
  }

  const remainingDistanceUd = Number(Math.max(0, distanceUd - Number(firstOverlap.travelledDistanceUd ?? 0)).toFixed(3));
  if (remainingDistanceUd <= GEOMETRY_EPSILON) {
    return [];
  }

  const continueOrCompleteAvoidance = ({
    nextPose,
    nextRemainingDistanceUd,
    nextAvoidanceSteps,
    nextLaterSlideAvailable,
    nextRemainingWheelBudgetRadians,
    nextBlockerUnitIds,
  }) => {
    if (!nextPose) {
      return [];
    }

    const intermediateInsideBattlefield = isPoseInsideBattlefield({
      reactingUnit,
      pose: nextPose,
      battlefieldProfile,
    });
    const intermediateOverlap = intermediateInsideBattlefield
      ? doesPoseOverlapAnyUnit({
        reactingUnit,
        pose: nextPose,
        units,
        ignoredUnitIds,
      })
      : true;

    if (!intermediateInsideBattlefield || intermediateOverlap) {
      return [];
    }

    const continuedEndPose = getLinearEndPose(nextPose, nextPose.rotationRadians, nextRemainingDistanceUd);
    const insideBattlefield = isPoseInsideBattlefield({
      reactingUnit,
      pose: continuedEndPose,
      battlefieldProfile,
    });
    const finalOverlap = insideBattlefield
      ? doesPoseOverlapAnyUnit({
        reactingUnit,
        pose: continuedEndPose,
        units,
        ignoredUnitIds,
      })
      : true;
    const nextOverlap = insideBattlefield && !finalOverlap
      ? getFirstLinearPathOverlap({
        reactingUnit,
        startPose: nextPose,
        endPose: continuedEndPose,
        units,
        ignoredUnitIds,
      })
      : { unitId: null };

    if (insideBattlefield && !finalOverlap && !nextOverlap) {
      return [createAvoidanceCandidateFromSteps({
        avoidanceSteps: nextAvoidanceSteps,
        endPose: continuedEndPose,
        blockerUnitIds: nextBlockerUnitIds,
      })];
    }

    if (nextRemainingDistanceUd <= GEOMETRY_EPSILON) {
      return [];
    }

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
    });
  };

  const candidates = [];
  const encounterPose = {
    xUd: Number(firstOverlap.encounterPose.xUd ?? 0),
    yUd: Number(firstOverlap.encounterPose.yUd ?? 0),
    rotationRadians: Number(firstOverlap.encounterPose.rotationRadians ?? startPose.rotationRadians ?? 0),
  };
  const encounterUnit = {
    ...reactingUnit,
    xUd: encounterPose.xUd,
    yUd: encounterPose.yUd,
    rotationRadians: encounterPose.rotationRadians,
  };
  const overlapBlocker = units.find((unit) => unit?.id === firstOverlap.unitId) ?? null;
  const nextBlockerUnitIds = Array.from(new Set([
    ...blockerUnitIds,
    firstOverlap.unitId,
  ].filter(Boolean)));

  if (laterSlideAvailable) {
    for (const side of ['left', 'right']) {
      const minimumSlideDistanceUd = overlapBlocker
        ? getMinimumClearanceSlideDistance({
          blockerUnits: [overlapBlocker],
          unit: encounterUnit,
          side,
        })
        : 0;
      for (const slideDistanceUd of iterateEvadeSlideDistancesFromMinimum(minimumSlideDistanceUd)) {
        const slideResult = getSlideAdjustedEvadePose({
          reorientedPose: encounterPose,
          side,
          slideDistanceUd,
          totalDistanceUd: remainingDistanceUd,
        });
        const slideStep = createEvadeAvoidanceStep({
          id: `slide-step-${side}-${slideDistanceUd.toFixed(3)}`,
          type: 'slide',
          side,
          distanceUd: slideDistanceUd,
          spentDistanceUd: slideDistanceUd,
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

        if (completedCandidates.length > 0) {
          candidates.push(...completedCandidates);
        }
      }
    }
  }

  for (const pivotSide of [MOVEMENT_PIVOT_SIDES.LEFT, MOVEMENT_PIVOT_SIDES.RIGHT]) {
    for (
      let angleRadians = EVADE_WHEEL_STEP_RADIANS;
      angleRadians <= remainingWheelBudgetRadians + GEOMETRY_EPSILON;
      angleRadians += EVADE_WHEEL_STEP_RADIANS
    ) {
      const wheelDistanceUd = getWheelDistanceUdForAngleRadians(angleRadians);
      if (wheelDistanceUd > remainingDistanceUd + GEOMETRY_EPSILON) {
        break;
      }

      const wheelResult = getWheelAdjustedEvadePose({
        reactingUnit,
        reorientedPose: encounterPose,
        pivotSide,
        angleRadians,
        totalDistanceUd: remainingDistanceUd,
      });

      const wheelStep = createEvadeAvoidanceStep({
        id: `wheel-step-${pivotSide}-${angleRadians.toFixed(3)}`,
        type: 'obstacle-wheel',
        pivotSide,
        angleRadians: Number(angleRadians.toFixed(3)),
        spentDistanceUd: wheelResult.spentDistanceUd,
        endPose: wheelResult.intermediatePose,
        remainingDistanceUd: wheelResult.remainingDistanceUd,
      });
      const completedCandidates = continueOrCompleteAvoidance({
        nextPose: wheelResult.intermediatePose,
        nextRemainingDistanceUd: wheelResult.remainingDistanceUd,
        nextAvoidanceSteps: [...baseAvoidanceSteps, wheelStep],
        nextLaterSlideAvailable: laterSlideAvailable,
        nextRemainingWheelBudgetRadians: Math.max(0, remainingWheelBudgetRadians - angleRadians),
        nextBlockerUnitIds,
      });

      if (completedCandidates.length > 0) {
        candidates.push(...completedCandidates);
      }
    }
  }

  return dedupeEvadeCandidates(candidates);
}

function getWheelAdjustedEvadePose({
  reactingUnit,
  reorientedPose,
  pivotSide,
  angleRadians,
  totalDistanceUd,
}) {
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

function isCandidateEndPoseLegal({
  candidateStartPose = null,
  candidateEndPose,
  reactingUnit,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
}) {
  return isPoseInsideBattlefield({
    reactingUnit,
    pose: candidateEndPose,
    battlefieldProfile,
  }) && !doesPoseOverlapAnyUnit({
    reactingUnit,
    pose: candidateEndPose,
    units,
    ignoredUnitIds,
  }) && !getFirstLinearPathOverlapUnitId({
    reactingUnit,
    startPose: candidateStartPose,
    endPose: candidateEndPose,
    units,
    ignoredUnitIds,
  });
}

function getDirectionWheelCandidates({
  reactingUnit,
  reorientedPose,
  distanceUd,
  chargeDirectionRadians = null,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
  requireDirectBlockerClearance = false,
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
  const candidate = getWheelAdjustedEvadePose({
    reactingUnit,
    reorientedPose,
    pivotSide,
    angleRadians: wheelAngleRadians,
    totalDistanceUd: distanceUd,
  });
  const directionWheelStep = createEvadeAvoidanceStep({
    id: `direction-wheel-step-${pivotSide}-${wheelAngleRadians.toFixed(3)}`,
    type: 'direction-wheel',
    pivotSide,
    angleRadians: wheelAngleRadians,
    spentDistanceUd: candidate.spentDistanceUd,
    endPose: candidate.intermediatePose,
    remainingDistanceUd: candidate.remainingDistanceUd,
  });
  const directCandidateIsLegal = isCandidateEndPoseLegal({
    candidateStartPose: candidate.intermediatePose,
    candidateEndPose: candidate.endPose,
    reactingUnit,
    battlefieldProfile,
    units,
    ignoredUnitIds,
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

  return dedupeEvadeCandidates([
    ...(directCandidateIsLegal ? [createEvadeAvoidanceCandidate({
      id: `direction-wheel-${pivotSide}-${wheelAngleRadians.toFixed(3)}`,
      type: 'direction-wheel',
      pivotSide,
      angleRadians: wheelAngleRadians,
      spentDistanceUd: candidate.spentDistanceUd,
      intermediatePose: candidate.intermediatePose,
      endPose: candidate.endPose,
      remainingDistanceUd: candidate.remainingDistanceUd,
      avoidanceSteps: [directionWheelStep],
    })] : []),
    ...getPathAvoidanceCandidates({
      reactingUnit,
      startPose: candidate.intermediatePose,
      distanceUd: candidate.remainingDistanceUd,
      battlefieldProfile,
      units,
      ignoredUnitIds,
      baseAvoidanceSteps: [directionWheelStep],
      laterSlideAvailable: true,
      remainingWheelBudgetRadians: Math.PI / 2,
    }),
  ]);
}

function getObstacleWheelCandidates({
  reactingUnit,
  reorientedPose,
  distanceUd,
  blockerUnitIds = [],
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
}) {
  if (!Array.isArray(blockerUnitIds) || blockerUnitIds.length === 0) {
    return [];
  }

  const candidates = [];

  for (const pivotSide of [MOVEMENT_PIVOT_SIDES.LEFT, MOVEMENT_PIVOT_SIDES.RIGHT]) {
    for (
      let angleRadians = EVADE_WHEEL_STEP_RADIANS;
      angleRadians <= (Math.PI / 2) + GEOMETRY_EPSILON;
      angleRadians += EVADE_WHEEL_STEP_RADIANS
    ) {
      const spentDistanceUd = getWheelDistanceUdForAngleRadians(angleRadians);
      if (spentDistanceUd > distanceUd + GEOMETRY_EPSILON) {
        break;
      }

      const candidate = getWheelAdjustedEvadePose({
        reactingUnit,
        reorientedPose,
        pivotSide,
        angleRadians,
        totalDistanceUd: distanceUd,
      });
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
        continue;
      }

      if (!isCandidateEndPoseLegal({
        candidateStartPose: candidate.intermediatePose,
        candidateEndPose: candidate.endPose,
        reactingUnit,
        battlefieldProfile,
        units,
        ignoredUnitIds,
      })) {
        continue;
      }

      candidates.push(createEvadeAvoidanceCandidate({
        id: `obstacle-wheel-${pivotSide}-${angleRadians.toFixed(3)}`,
        type: 'obstacle-wheel',
        pivotSide,
        angleRadians: Number(angleRadians.toFixed(3)),
        spentDistanceUd: candidate.spentDistanceUd,
        intermediatePose: candidate.intermediatePose,
        endPose: candidate.endPose,
        remainingDistanceUd: candidate.remainingDistanceUd,
        blockerUnitIds,
        avoidanceSteps: [createEvadeAvoidanceStep({
          id: `obstacle-wheel-step-${pivotSide}-${angleRadians.toFixed(3)}`,
          type: 'obstacle-wheel',
          pivotSide,
          angleRadians: Number(angleRadians.toFixed(3)),
          spentDistanceUd: candidate.spentDistanceUd,
          endPose: candidate.intermediatePose,
          remainingDistanceUd: candidate.remainingDistanceUd,
        })],
      }));
    }
  }

  return dedupeEvadeCandidates(candidates);
}

function dedupeEvadeCandidates(candidates = []) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = candidate?.id
      ?? [
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

function getPoseDistanceUd(leftPose, rightPose) {
  if (!leftPose || !rightPose) {
    return 0;
  }

  const deltaXUd = Number(leftPose.xUd ?? 0) - Number(rightPose.xUd ?? 0);
  const deltaYUd = Number(leftPose.yUd ?? 0) - Number(rightPose.yUd ?? 0);
  return Number(Math.hypot(deltaXUd, deltaYUd).toFixed(3));
}

function getEvadeChoiceReferencePose(contactSnapshot = null, fallbackPose = null) {
  return contactSnapshot?.chargerContactPose
    ?? contactSnapshot?.chargerStartPose
    ?? fallbackPose
    ?? null;
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

function compareEvadeCandidates(leftCandidate, rightCandidate, referencePose = null) {
  const distanceDelta = getPoseDistanceUd(rightCandidate?.endPose, referencePose)
    - getPoseDistanceUd(leftCandidate?.endPose, referencePose);
  if (Math.abs(distanceDelta) > GEOMETRY_EPSILON) {
    return distanceDelta;
  }

  const remainingDistanceDelta = Number(rightCandidate?.remainingDistanceUd ?? 0)
    - Number(leftCandidate?.remainingDistanceUd ?? 0);
  if (Math.abs(remainingDistanceDelta) > GEOMETRY_EPSILON) {
    return remainingDistanceDelta;
  }

  const spentDistanceDelta = Number(leftCandidate?.spentDistanceUd ?? leftCandidate?.distanceUd ?? 0)
    - Number(rightCandidate?.spentDistanceUd ?? rightCandidate?.distanceUd ?? 0);
  if (Math.abs(spentDistanceDelta) > GEOMETRY_EPSILON) {
    return spentDistanceDelta;
  }

  const stepCountDelta = getEvadeCandidateSteps(leftCandidate).length - getEvadeCandidateSteps(rightCandidate).length;
  if (stepCountDelta !== 0) {
    return stepCountDelta;
  }

  const slideTieBreakDelta = getEvadeCandidateSlideTieBreakScore(rightCandidate)
    - getEvadeCandidateSlideTieBreakScore(leftCandidate);
  if (slideTieBreakDelta !== 0) {
    return slideTieBreakDelta;
  }

  return String(leftCandidate?.id ?? '').localeCompare(String(rightCandidate?.id ?? ''));
}

function getPreferredEvadeCandidatesByDistance({ candidates = [], referencePose = null }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const rankedCandidates = [...candidates].sort((leftCandidate, rightCandidate) => (
    compareEvadeCandidates(leftCandidate, rightCandidate, referencePose)
  ));

  return rankedCandidates.length > 0 ? [rankedCandidates[0]] : [];
}

function resolvePlayerFacingEvadeCandidates({
  candidates = [],
  contactSnapshot = null,
  fallbackReferencePose = null,
}) {
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
      ...getPreferredEvadeCandidatesByDistance({
        candidates: branchCandidates.get('no-direction-wheel'),
        referencePose,
      }),
      ...getPreferredEvadeCandidatesByDistance({
        candidates: branchCandidates.get('direction-wheel'),
        referencePose,
      }),
    ]);
  }

  const [[, singleBranchCandidates]] = [...branchCandidates.entries()];
  return dedupeEvadeCandidates(getPreferredEvadeCandidatesByDistance({
    candidates: singleBranchCandidates,
    referencePose,
  }));
}

function getDirectBlockerClearanceSlides({
  reactingUnit,
  reorientedPose,
  distanceUd,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
}) {
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
    return {
      blockerUnitIds: [],
      clearanceSlides: [],
    };
  }

  const clearanceSlides = directBlockerEvaluation.clearanceSlides
    .map((slide) => {
      const candidate = getSlideAdjustedEvadePose({
        reorientedPose,
        side: slide.side,
        slideDistanceUd: slide.distanceUd,
        totalDistanceUd: distanceUd,
      });
      const finalOverlaps = doesPoseOverlapAnyUnit({
        reactingUnit,
        pose: candidate.endPose,
        units,
        ignoredUnitIds,
      });
      const pathBlocked = Boolean(getFirstLinearPathOverlapUnitId({
        reactingUnit,
        startPose: candidate.intermediatePose,
        endPose: candidate.endPose,
        units,
        ignoredUnitIds,
      }));
      const insideBattlefield = isPoseInsideBattlefield({
        reactingUnit,
        pose: candidate.endPose,
        battlefieldProfile,
      });

      if (finalOverlaps || pathBlocked || !insideBattlefield) {
        return null;
      }

      return createEvadeAvoidanceCandidate({
        id: `direct-slide-${slide.side}-${slide.distanceUd.toFixed(3)}`,
        type: 'slide',
        side: slide.side,
        distanceUd: slide.distanceUd,
        spentDistanceUd: slide.distanceUd,
        intermediatePose: candidate.intermediatePose,
        endPose: candidate.endPose,
        remainingDistanceUd: candidate.remainingDistanceUd,
        blockerUnitIds: directBlockerEvaluation.blockerUnitIds,
        avoidanceSteps: [createEvadeAvoidanceStep({
          id: `direct-slide-step-${slide.side}-${slide.distanceUd.toFixed(3)}`,
          type: 'slide',
          side: slide.side,
          distanceUd: slide.distanceUd,
          spentDistanceUd: slide.distanceUd,
          endPose: candidate.intermediatePose,
          remainingDistanceUd: candidate.remainingDistanceUd,
        })],
      });
    })
    .filter(Boolean);

  return {
    blockerUnitIds: directBlockerEvaluation.blockerUnitIds,
    clearanceSlides,
  };
}

function getFinalOverlapClearanceSlides({
  reactingUnit,
  reorientedPose,
  distanceUd,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
}) {
  const clearanceSlides = [];

  for (const side of ['left', 'right']) {
    for (const slideDistanceUd of iterateSimpleEvadeSlideDistances()) {
      if (slideDistanceUd <= 0) {
        continue;
      }

      const candidate = getSlideAdjustedEvadePose({
        reorientedPose,
        side,
        slideDistanceUd,
        totalDistanceUd: distanceUd,
      });
      const finalOverlaps = doesPoseOverlapAnyUnit({
        reactingUnit,
        pose: candidate.endPose,
        units,
        ignoredUnitIds,
      });
      const pathBlocked = Boolean(getFirstLinearPathOverlapUnitId({
        reactingUnit,
        startPose: candidate.intermediatePose,
        endPose: candidate.endPose,
        units,
        ignoredUnitIds,
      }));
      const insideBattlefield = isPoseInsideBattlefield({
        reactingUnit,
        pose: candidate.endPose,
        battlefieldProfile,
      });

      if (!finalOverlaps && !pathBlocked && insideBattlefield) {
        clearanceSlides.push(createEvadeAvoidanceCandidate({
          id: `final-overlap-slide-${side}-${slideDistanceUd.toFixed(3)}`,
          type: 'slide',
          side,
          distanceUd: slideDistanceUd,
          spentDistanceUd: slideDistanceUd,
          intermediatePose: candidate.intermediatePose,
          endPose: candidate.endPose,
          remainingDistanceUd: candidate.remainingDistanceUd,
          avoidanceSteps: [createEvadeAvoidanceStep({
            id: `final-overlap-slide-step-${side}-${slideDistanceUd.toFixed(3)}`,
            type: 'slide',
            side,
            distanceUd: slideDistanceUd,
            spentDistanceUd: slideDistanceUd,
            endPose: candidate.intermediatePose,
            remainingDistanceUd: candidate.remainingDistanceUd,
          })],
        }));
        break;
      }
    }
  }

  return clearanceSlides;
}

function isMountedChargeUnit(chargingUnit) {
  const troopType = String(chargingUnit?.troopType ?? '').toLowerCase();
  const family = String(chargingUnit?.chargeReactionCapability?.family ?? '').toLowerCase();

  return [
    'cavalry',
    'light-cavalry',
    'camelry',
    'camelry',
    'light-chariot',
    'light-chariots',
    'general',
  ].includes(troopType) || [
    'cavalry',
    'light-cavalry',
    'camelry',
    'camelry',
    'light-chariots',
  ].includes(family);
}

function isChargeUnitImpetuous(chargingUnit) {
  return Boolean(chargingUnit?.hasImpetuous ?? chargingUnit?.chargeReactionCapability?.hasImpetuous);
}

function getChargeFollowThroughMinimumDistanceUd(chargingUnit, maximumDistanceUd) {
  const minimumDistanceUd = isMountedChargeUnit(chargingUnit) ? 2 : 1;
  return Number(Math.min(Math.max(0, maximumDistanceUd), minimumDistanceUd).toFixed(3));
}

function getLinearEndPose(startPose, rotationRadians, distanceUd) {
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

function getEvadeStartPose(reactingUnit, contactSnapshot) {
  return contactSnapshot?.defenderPose ?? {
    xUd: Number(reactingUnit?.xUd ?? 0),
    yUd: Number(reactingUnit?.yUd ?? 0),
    rotationRadians: Number(reactingUnit?.rotationRadians ?? 0),
  };
}

function getEffectiveContactType(contactClassification, selectedContactSide) {
  if (contactClassification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK) {
    if (selectedContactSide === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
      return CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR;
    }

    return CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK;
  }

  return contactClassification?.type ?? CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT;
}

function getEffectiveFlankSide(contactClassification, selectedContactSide) {
  if (selectedContactSide === CHARGE_CONTACT_FLANK_SIDES.LEFT || selectedContactSide === CHARGE_CONTACT_FLANK_SIDES.RIGHT) {
    return selectedContactSide;
  }

  return contactClassification?.flankSide ?? null;
}

function getEvadeRotationDelta(contactType, flankSide) {
  if (contactType === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    return Math.PI;
  }

  if (contactType === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    return 0;
  }

  if (contactType === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK) {
    if (flankSide === CHARGE_CONTACT_FLANK_SIDES.LEFT) {
      return Math.PI / 2;
    }

    if (flankSide === CHARGE_CONTACT_FLANK_SIDES.RIGHT) {
      return -Math.PI / 2;
    }
  }

  throw new Error('Isolated evade plan requires a supported front, flank, or rear contact classification.');
}

export function resolveIsolatedSingleUnitEvadePlan({
  reactingUnit,
  contactClassification,
  selectedContactSide = null,
  contactSnapshot = null,
  chargeDirectionRadians = null,
  distanceRollResult,
  battlefieldProfile = null,
  units = [],
  ignoredUnitIds = [],
}) {
  if (!reactingUnit || !distanceRollResult || !Number.isFinite(distanceRollResult.resolvedDistanceUd)) {
    throw new Error('Isolated evade plan requires a reacting unit and a resolved evade distance result.');
  }

  const {
    startPose,
    contactType,
    flankSide,
    reorientedPose,
  } = resolveEvadeReorientation({
    reactingUnit,
    contactClassification,
    selectedContactSide,
    contactSnapshot,
  });
  const { forwardAxis } = getAxesFromRotation(reorientedPose.rotationRadians);
  const endPosition = addVectors(
    { x: reorientedPose.xUd, y: reorientedPose.yUd },
    scaleVector(forwardAxis, distanceRollResult.resolvedDistanceUd),
  );
  const straightEndPose = {
    xUd: Number(endPosition.x.toFixed(3)),
    yUd: Number(endPosition.y.toFixed(3)),
    rotationRadians: reorientedPose.rotationRadians,
  };
  const straightDiagnostics = getEvadePlanDiagnostics({
    reactingUnit,
    startPose: reorientedPose,
    endPose: straightEndPose,
    battlefieldProfile,
    units,
    ignoredUnitIds,
  });
  const straightCandidate = createStraightEvadeCandidate({
    endPose: straightEndPose,
    distanceUd: distanceRollResult.resolvedDistanceUd,
  });
  const straightPathAvoidanceCandidates = getPathAvoidanceCandidates({
    reactingUnit,
    startPose: reorientedPose,
    distanceUd: distanceRollResult.resolvedDistanceUd,
    battlefieldProfile,
    units,
    ignoredUnitIds,
    idPrefix: 'straight',
  });
  const directBlockerClearance = getDirectBlockerClearanceSlides({
    reactingUnit,
    reorientedPose,
    distanceUd: distanceRollResult.resolvedDistanceUd,
    battlefieldProfile,
    units,
    ignoredUnitIds,
  });
  const directionWheelCandidates = getDirectionWheelCandidates({
    reactingUnit,
    reorientedPose,
    distanceUd: distanceRollResult.resolvedDistanceUd,
    chargeDirectionRadians,
    battlefieldProfile,
    units,
    ignoredUnitIds,
    requireDirectBlockerClearance: directBlockerClearance.blockerUnitIds.length > 0,
  });
  const straightHasFinalOverlap = straightDiagnostics.some((diagnostic) => diagnostic.code === 'charge.evade.interpenetration');
  const directBlockerSlides = directBlockerClearance.clearanceSlides;
  const obstacleWheelCandidates = directBlockerSlides.length === 0
    ? getObstacleWheelCandidates({
      reactingUnit,
      reorientedPose,
      distanceUd: distanceRollResult.resolvedDistanceUd,
      blockerUnitIds: directBlockerClearance.blockerUnitIds,
      battlefieldProfile,
      units,
      ignoredUnitIds,
    })
    : [];
  const finalOverlapSlides = directBlockerClearance.blockerUnitIds.length === 0 && straightHasFinalOverlap
    ? getFinalOverlapClearanceSlides({
      reactingUnit,
      reorientedPose,
      distanceUd: distanceRollResult.resolvedDistanceUd,
      battlefieldProfile,
      units,
      ignoredUnitIds,
    })
    : [];
  const baselineLegal = straightDiagnostics.length === 0;
  let solverCandidates = [];

  if (directBlockerClearance.blockerUnitIds.length > 0) {
    solverCandidates = dedupeEvadeCandidates([
      ...directBlockerSlides,
      ...directionWheelCandidates,
      ...obstacleWheelCandidates,
    ]);
  } else if (straightHasFinalOverlap) {
    solverCandidates = dedupeEvadeCandidates([
      ...finalOverlapSlides,
      ...directionWheelCandidates,
    ]);
  } else if (baselineLegal && directionWheelCandidates.length > 0) {
    solverCandidates = [straightCandidate, ...directionWheelCandidates];
  } else if (!baselineLegal) {
    solverCandidates = dedupeEvadeCandidates([
      ...straightPathAvoidanceCandidates,
      ...directionWheelCandidates,
    ]);
  }

  const avoidanceCandidates = resolvePlayerFacingEvadeCandidates({
    candidates: solverCandidates,
    contactSnapshot,
    fallbackReferencePose: startPose,
  });
  const selectedAvoidanceCandidate = avoidanceCandidates.length === 1 ? avoidanceCandidates[0] : null;
  const blockedByDirectBlocker = directBlockerClearance.blockerUnitIds.length > 0 && solverCandidates.length === 0;
  const endPose = blockedByDirectBlocker
    ? null
    : selectedAvoidanceCandidate?.endPose ?? avoidanceCandidates[0]?.endPose ?? straightEndPose;
  const diagnostics = blockedByDirectBlocker
    ? [createEvadeDiagnostic({
      code: 'charge.evade.blocked',
      status: 'warn',
      text: 'The evade path is blocked by a nearby obstacle or unit that cannot be cleared within the supported direct-blocker subset.',
    })]
    : selectedAvoidanceCandidate
      ? []
      : straightDiagnostics;
  const selectedAvoidanceSteps = selectedAvoidanceCandidate && selectedAvoidanceCandidate.type !== 'straight'
    ? (selectedAvoidanceCandidate.avoidanceSteps?.length > 0 ? selectedAvoidanceCandidate.avoidanceSteps : [selectedAvoidanceCandidate])
    : [];

  return createEvadePlan({
    reactingUnitId: reactingUnit.id ?? null,
    contactType,
    flankSide,
    selectedContactSide,
    startPose,
    reorientedPose,
    endPose,
    distanceUd: distanceRollResult.resolvedDistanceUd,
    spentAvoidanceUd: selectedAvoidanceCandidate?.spentDistanceUd ?? 0,
    remainingDistanceUd: selectedAvoidanceCandidate?.remainingDistanceUd ?? distanceRollResult.resolvedDistanceUd,
    avoidanceSteps: selectedAvoidanceSteps,
    avoidanceCandidates,
    choiceRequired: avoidanceCandidates.length > 1,
    rollResult: distanceRollResult,
    diagnostics,
    sourceStatus: diagnostics.length > 0 || avoidanceCandidates.length > 1
      ? EVADE_PLAN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
      : EVADE_PLAN_SOURCE_STATUSES.VERIFIED,
  });
}

export function resolveAdjustedChargeFollowThroughPlan({
  chargingUnit,
  declarationSnapshot,
  distanceRollResult,
  contactState = null,
}) {
  if (!chargingUnit || !distanceRollResult || !Number.isFinite(distanceRollResult.resolvedDistanceUd)) {
    throw new Error('Adjusted charge follow-through requires a charging unit and a resolved adjusted charge distance result.');
  }

  const startPose = declarationSnapshot?.contactEvent?.contactSnapshot?.chargerStartPose
    ?? declarationSnapshot?.startPose
    ?? {
      xUd: Number(chargingUnit.xUd ?? 0),
      yUd: Number(chargingUnit.yUd ?? 0),
      rotationRadians: Number(chargingUnit.rotationRadians ?? 0),
    };
  const frozenDirectionRadians = Number.isFinite(declarationSnapshot?.frozenDirectionRadians)
    ? declarationSnapshot.frozenDirectionRadians
    : Number(startPose.rotationRadians ?? chargingUnit.rotationRadians ?? 0);
  const maximumDistanceUd = Number(distanceRollResult.resolvedDistanceUd ?? 0);
  const maximumEndPose = getLinearEndPose(startPose, frozenDirectionRadians, maximumDistanceUd);
  const minimumDistanceUd = getChargeFollowThroughMinimumDistanceUd(chargingUnit, maximumDistanceUd);
  const isImpetuous = isChargeUnitImpetuous(chargingUnit);
  const hasBlockingContact = Boolean(contactState?.contactEvents?.length);
  const hasForcedFullContinuation = isImpetuous
    && !hasBlockingContact
    && maximumDistanceUd > minimumDistanceUd + GEOMETRY_EPSILON;
  const continuationChoice = createChargeMovementContinuationChoice({
    required: !isImpetuous && !hasBlockingContact && maximumDistanceUd > minimumDistanceUd + GEOMETRY_EPSILON,
    selectedOption: hasForcedFullContinuation ? CHARGE_MOVEMENT_CONTINUATION_DECISIONS.CONTINUE : null,
    minimumDistanceUd,
    minimumEndPose: getLinearEndPose(startPose, frozenDirectionRadians, minimumDistanceUd),
    maximumDistanceUd,
    maximumEndPose,
    isImpetuous,
    minimumLabel: isMountedChargeUnit(chargingUnit) ? '2 UD mounted minimum' : '1 UD foot minimum',
  });

  return createChargeMovementPlan({
    chargingUnitId: chargingUnit.id ?? null,
    startPose: {
      xUd: Number(startPose.xUd ?? 0),
      yUd: Number(startPose.yUd ?? 0),
      rotationRadians: Number(startPose.rotationRadians ?? chargingUnit.rotationRadians ?? 0),
    },
    contactPose: declarationSnapshot?.contactEvent?.contactSnapshot?.chargerContactPose ?? null,
    endPose: maximumEndPose,
    frozenDirectionRadians,
    distanceUd: maximumDistanceUd,
    rollResult: distanceRollResult,
    contactState,
    continuationChoice,
  });
}

export function resolveAdjustedChargeFollowThroughContactState({
  chargingUnit,
  declarationSnapshot,
  distanceRollResult,
  evadePlan,
  evadeMove = null,
  battlefieldProfile,
  units = [],
}) {
  const reactingUnitId = evadeMove?.reactingUnitId ?? evadePlan?.reactingUnitId ?? null;
  const evaderPose = evadeMove?.finalPose ?? evadePlan?.endPose ?? null;

  if (!chargingUnit || !declarationSnapshot || !distanceRollResult || !reactingUnitId || !evaderPose) {
    return null;
  }

  const startPose = declarationSnapshot?.contactEvent?.contactSnapshot?.chargerStartPose
    ?? declarationSnapshot?.startPose
    ?? {
      xUd: Number(chargingUnit.xUd ?? 0),
      yUd: Number(chargingUnit.yUd ?? 0),
      rotationRadians: Number(chargingUnit.rotationRadians ?? 0),
    };
  const frozenDirectionRadians = Number.isFinite(declarationSnapshot?.frozenDirectionRadians)
    ? declarationSnapshot.frozenDirectionRadians
    : Number(startPose.rotationRadians ?? chargingUnit.rotationRadians ?? 0);
  const posedCharger = {
    ...chargingUnit,
    xUd: Number(startPose.xUd ?? chargingUnit.xUd ?? 0),
    yUd: Number(startPose.yUd ?? chargingUnit.yUd ?? 0),
    rotationRadians: frozenDirectionRadians,
  };
  const reactingUnit = (units ?? []).find((unit) => unit.id === reactingUnitId) ?? null;

  if (!reactingUnit) {
    return null;
  }

  const posedEvader = {
    ...reactingUnit,
    xUd: Number(evaderPose.xUd ?? reactingUnit.xUd ?? 0),
    yUd: Number(evaderPose.yUd ?? reactingUnit.yUd ?? 0),
    rotationRadians: Number(evaderPose.rotationRadians ?? reactingUnit.rotationRadians ?? 0),
  };
  const unitsWithEvaderPose = Array.isArray(units)
    ? units.map((unit) => {
      if (unit.id === posedCharger.id) {
        return posedCharger;
      }

      if (unit.id === posedEvader.id) {
        return posedEvader;
      }

      return unit;
    })
    : [posedCharger, posedEvader];

  return resolveChargeContactState({
    selectedUnit: posedCharger,
    targetUnit: posedEvader,
    pathSegments: [createChargeGuideSegment({
      xUd: posedCharger.xUd,
      yUd: posedCharger.yUd,
      rotationRadians: frozenDirectionRadians,
      distanceUd: Number(distanceRollResult.resolvedDistanceUd ?? 0),
    })],
    battlefieldProfile,
    units: unitsWithEvaderPose,
  });
}

export function resolveEvadeDistanceRoll({ dieRoll, baseDistanceUd, claim = null }) {
  return createChargeBranchRollResult({
    claim,
    dieRoll,
    baseDistanceUd,
  });
}

export function resolveAdjustedChargeDistanceRoll({ dieRoll, baseDistanceUd, claim = null, neverReduce = false }) {
  return createChargeBranchRollResult({
    claim,
    dieRoll,
    baseDistanceUd,
    neverReduce,
  });
}

