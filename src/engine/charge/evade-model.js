import {
  GEOMETRY_EPSILON,
  normalizeAngleRadians,
} from '../geometry/index.js';

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

export const EVADE_CHOICE_KINDS = {
  NONE: 'none',
  INITIAL_BRANCH: 'initial-branch',
  AVOIDANCE_CANDIDATE: 'avoidance-candidate',
};

export const EVADE_INITIAL_BRANCH_IDS = {
  CURRENT_ORIENTATION: 'branch-current-orientation',
  DIRECTION_WHEEL: 'branch-direction-wheel',
};

export const CHARGE_MOVEMENT_PLAN_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const CHARGE_MOVEMENT_CONTINUATION_DECISIONS = {
  STOP: 'stop',
  CONTINUE: 'continue',
};

export function getSignedAngleDeltaRadians(targetAngleRadians, sourceAngleRadians) {
  const normalizedDeltaRadians = normalizeAngleRadians(targetAngleRadians - sourceAngleRadians);
  return normalizedDeltaRadians > Math.PI
    ? normalizedDeltaRadians - (Math.PI * 2)
    : normalizedDeltaRadians;
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
  const avoidanceSteps = Array.isArray(overrides.avoidanceSteps) ? overrides.avoidanceSteps : [];
  const endHalfTurnHook = overrides.endHalfTurnHook ?? null;
  const pathSegments = Array.isArray(overrides.pathSegments)
    ? overrides.pathSegments
    : buildEvadePathSegments({
      reorientedPose: overrides.reorientedPose ?? null,
      avoidanceSteps,
      endPose: overrides.endPose ?? null,
      endHalfTurnHook,
    });

  return {
    reactingUnitId: overrides.reactingUnitId ?? null,
    contactType: overrides.contactType ?? null,
    flankSide: overrides.flankSide ?? null,
    selectedContactSide: overrides.selectedContactSide ?? null,
    startPose: overrides.startPose ?? null,
    reorientedPose: overrides.reorientedPose ?? null,
    endPose: overrides.endPose ?? null,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : 0,
    spentAvoidanceUd: Number.isFinite(overrides.spentAvoidanceUd) ? overrides.spentAvoidanceUd : 0,
    remainingDistanceUd: Number.isFinite(overrides.remainingDistanceUd) ? overrides.remainingDistanceUd : null,
    avoidanceSteps,
    avoidanceCandidates: Array.isArray(overrides.avoidanceCandidates) ? overrides.avoidanceCandidates : [],
    pathSegments,
    tableExit: overrides.tableExit ?? null,
    endHalfTurnHook,
    choiceRequired: Boolean(overrides.choiceRequired),
    choiceKind: overrides.choiceKind ?? EVADE_CHOICE_KINDS.NONE,
    rollResult: overrides.rollResult ?? null,
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
    decisionTrace: Array.isArray(overrides.decisionTrace) ? overrides.decisionTrace : [],
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
    decisionTrace: Array.isArray(overrides.decisionTrace) ? overrides.decisionTrace : [],
    sourceStatus: overrides.sourceStatus ?? CHARGE_MOVEMENT_PLAN_SOURCE_STATUSES.VERIFIED,
  };
}

export function summarizeEvadeDiagnosticForDecisionTrace(diagnostic) {
  return {
    code: diagnostic?.code ?? null,
    status: diagnostic?.status ?? null,
    text: diagnostic?.text ?? null,
    sourceStatus: diagnostic?.sourceStatus ?? null,
  };
}

export function summarizeEvadeCandidateForDecisionTrace(candidate) {
  const avoidanceSteps = Array.isArray(candidate?.avoidanceSteps)
    ? candidate.avoidanceSteps.map((step) => ({
      type: step?.type ?? null,
      side: step?.side ?? null,
      pivotSide: step?.pivotSide ?? null,
      angleRadians: Number.isFinite(step?.angleRadians) ? step.angleRadians : null,
      distanceUd: Number.isFinite(step?.distanceUd) ? step.distanceUd : null,
      spentDistanceUd: Number.isFinite(step?.spentDistanceUd) ? step.spentDistanceUd : null,
    }))
    : [];
  const normalizedSteps = getEvadeCandidateSteps(candidate);
  const branchKey = normalizedSteps[0]?.type === 'direction-wheel' ? 'direction-wheel' : 'current-orientation';
  const laterAvoidanceSteps = normalizedSteps[0]?.type === 'direction-wheel' ? normalizedSteps.slice(1) : normalizedSteps;
  const firstLaterAvoidanceStep = laterAvoidanceSteps[0] ?? null;

  return {
    id: candidate?.id ?? null,
    type: candidate?.type ?? null,
    side: candidate?.side ?? null,
    pivotSide: candidate?.pivotSide ?? null,
    distanceUd: Number.isFinite(candidate?.distanceUd) ? candidate.distanceUd : null,
    spentDistanceUd: Number.isFinite(candidate?.spentDistanceUd) ? candidate.spentDistanceUd : null,
    remainingDistanceUd: Number.isFinite(candidate?.remainingDistanceUd) ? candidate.remainingDistanceUd : null,
    blockerUnitIds: Array.isArray(candidate?.blockerUnitIds) ? [...candidate.blockerUnitIds] : [],
    analysis: {
      generationSource: candidate?.analysis?.generationSource ?? null,
      branchKey,
      branchRankingPolicy: candidate?.analysis?.branchRankingPolicy ?? null,
      branchRankingReasonCodes: Array.isArray(candidate?.analysis?.branchRankingReasonCodes)
        ? [...candidate.analysis.branchRankingReasonCodes]
        : [],
      branchRankingCorridorScore: candidate?.analysis?.branchRankingCorridorScore && typeof candidate.analysis.branchRankingCorridorScore === 'object'
        ? { ...candidate.analysis.branchRankingCorridorScore }
        : null,
      branchRankingCandidateCount: Number.isFinite(candidate?.analysis?.branchRankingCandidateCount)
        ? candidate.analysis.branchRankingCandidateCount
        : null,
      branchRankingDiscardedCount: Number.isFinite(candidate?.analysis?.branchRankingDiscardedCount)
        ? candidate.analysis.branchRankingDiscardedCount
        : null,
      branchRankingSelected: candidate?.analysis?.branchRankingSelected === true,
      totalStepCount: normalizedSteps.length,
      laterStepCount: laterAvoidanceSteps.length,
      laterWheelCount: laterAvoidanceSteps.filter((step) => step?.type === 'obstacle-wheel').length,
      laterSlideCount: laterAvoidanceSteps.filter((step) => step?.type === 'slide').length,
      firstLaterStepType: firstLaterAvoidanceStep?.type ?? null,
      firstLaterTriggerDistanceUd: Number.isFinite(firstLaterAvoidanceStep?.analysis?.triggerEncounterDistanceUd)
        ? firstLaterAvoidanceStep.analysis.triggerEncounterDistanceUd
        : null,
      firstLaterAvailableDistanceUd: Number.isFinite(firstLaterAvoidanceStep?.analysis?.availableDistanceBeforeStepUd)
        ? firstLaterAvoidanceStep.analysis.availableDistanceBeforeStepUd
        : null,
      firstLaterRemainingDistanceUd: Number.isFinite(firstLaterAvoidanceStep?.remainingDistanceUd)
        ? firstLaterAvoidanceStep.remainingDistanceUd
        : null,
    },
    avoidanceSteps,
  };
}

export function appendEvadeDecisionTrace(decisionTrace, entry) {
  if (!Array.isArray(decisionTrace) || decisionTrace.length > 80) {
    return;
  }

  decisionTrace.push(entry);
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

export function createEvadeDiagnostic(overrides = {}) {
  return {
    code: overrides.code ?? 'charge.evade',
    status: overrides.status ?? 'info',
    text: overrides.text ?? '',
  };
}

export function createEvadeAvoidanceCandidate(overrides = {}) {
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
    analysis: overrides.analysis ?? null,
  };
}

export function createStraightEvadeCandidate({ endPose, distanceUd }) {
  return createEvadeAvoidanceCandidate({
    id: 'straight',
    type: 'straight',
    spentDistanceUd: 0,
    endPose,
    remainingDistanceUd: distanceUd,
  });
}

export function getEvadeCandidateSteps(candidate = null) {
  if (Array.isArray(candidate?.avoidanceSteps) && candidate.avoidanceSteps.length > 0) {
    return candidate.avoidanceSteps.filter(Boolean);
  }

  if (!candidate || candidate.type === 'straight') {
    return [];
  }

  return [candidate];
}

export function createEvadeAvoidanceStep(overrides = {}) {
  return {
    id: overrides.id ?? null,
    type: overrides.type ?? 'slide',
    startPose: overrides.startPose ?? null,
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
    analysis: overrides.analysis ?? null,
  };
}

function getEvadePathSegmentKind(stepType) {
  switch (stepType) {
    case 'slide':
      return 'evade-slide';
    case 'direction-wheel':
      return 'evade-direction-wheel';
    case 'obstacle-wheel':
      return 'evade-obstacle-wheel';
    case 'straight':
      return 'evade-straight';
    default:
      return 'evade-step';
  }
}

export function getEvadePathDistanceUd(startPose = null, endPose = null) {
  if (!startPose || !endPose) {
    return 0;
  }

  return Number(Math.hypot(
    Number(endPose.xUd ?? 0) - Number(startPose.xUd ?? 0),
    Number(endPose.yUd ?? 0) - Number(startPose.yUd ?? 0),
  ).toFixed(3));
}

function buildEvadePathSegments({
  reorientedPose = null,
  avoidanceSteps = [],
  endPose = null,
  endHalfTurnHook = null,
}) {
  if (!reorientedPose || !endPose) {
    return [];
  }

  const movementEndPose = endHalfTurnHook?.applied
    ? {
      ...endPose,
      rotationRadians: Number.isFinite(endHalfTurnHook.rotationBeforeRadians)
        ? endHalfTurnHook.rotationBeforeRadians
        : Number(endPose.rotationRadians ?? 0),
    }
    : endPose;

  const pathSegments = [];
  let currentPose = reorientedPose;

  for (const step of avoidanceSteps.filter(Boolean)) {
    if (!step?.endPose) {
      continue;
    }

    const stepStartPose = step.startPose ?? currentPose;
    const preStepStraightDistanceUd = getEvadePathDistanceUd(currentPose, stepStartPose);
    if (preStepStraightDistanceUd > GEOMETRY_EPSILON) {
      pathSegments.push({
        kind: 'evade-straight',
        xUd: Number(currentPose.xUd ?? 0),
        yUd: Number(currentPose.yUd ?? 0),
        rotationRadians: Number(currentPose.rotationRadians ?? 0),
        distanceUd: preStepStraightDistanceUd,
        endPose: stepStartPose,
        remainingDistanceUd: Number.isFinite(step.remainingDistanceUd) ? step.remainingDistanceUd : null,
      });
    }

    pathSegments.push({
      kind: getEvadePathSegmentKind(step.type),
      xUd: Number(stepStartPose.xUd ?? 0),
      yUd: Number(stepStartPose.yUd ?? 0),
      rotationRadians: Number(stepStartPose.rotationRadians ?? 0),
      distanceUd: Number(step.spentDistanceUd ?? step.distanceUd ?? 0),
      side: step.side ?? null,
      pivotSide: step.pivotSide ?? null,
      angleRadians: Number.isFinite(step.angleRadians) ? step.angleRadians : null,
      endPose: step.endPose,
      remainingDistanceUd: Number.isFinite(step.remainingDistanceUd) ? step.remainingDistanceUd : null,
    });
    currentPose = step.endPose;
  }

  const straightDistanceUd = getEvadePathDistanceUd(currentPose, movementEndPose);
  if (straightDistanceUd > GEOMETRY_EPSILON) {
    pathSegments.push({
      kind: 'evade-straight',
      xUd: Number(currentPose.xUd ?? 0),
      yUd: Number(currentPose.yUd ?? 0),
      rotationRadians: Number(currentPose.rotationRadians ?? 0),
      distanceUd: straightDistanceUd,
      endPose: movementEndPose,
      remainingDistanceUd: 0,
    });
  }

  if (endHalfTurnHook?.applied) {
    pathSegments.push({
      kind: 'evade-end-half-turn',
      xUd: Number(movementEndPose.xUd ?? 0),
      yUd: Number(movementEndPose.yUd ?? 0),
      rotationRadians: Number(endHalfTurnHook.rotationBeforeRadians ?? movementEndPose.rotationRadians ?? 0),
      distanceUd: 0,
      angleRadians: Number.isFinite(endHalfTurnHook.rotationAfterRadians)
        ? getSignedAngleDeltaRadians(
          endHalfTurnHook.rotationAfterRadians,
          endHalfTurnHook.rotationBeforeRadians ?? movementEndPose.rotationRadians ?? 0,
        )
        : null,
      endPose,
    });
  }

  return pathSegments;
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

export function createAvoidanceCandidateFromSteps({
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

export function getCandidateTypeWithBase(baseAvoidanceSteps = [], leafType) {
  const baseLabel = getBaseAvoidanceTypeLabel(baseAvoidanceSteps);
  return baseLabel ? `${baseLabel}-${leafType}` : leafType;
}