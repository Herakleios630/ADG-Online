export const CHARGE_PREVIEW_STATUSES = {
  IDLE: 'idle',
  TARGETING: 'targeting',
  MANOEUVRE_SELECTING: 'manoeuvre-selecting',
  REACTION_PENDING: 'reaction-pending',
  CONFORMATION_PREVIEW: 'conformation-preview',
  READY: 'ready',
  NO_EVADE_HANDOFF: 'no-evade-handoff',
  EVADE_REQUIRED: 'evade-required',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
};

export const CHARGE_REACTION_REQUEST_TYPES = {
  NONE: 'none',
  MAY_EVADE: 'may-evade',
  MUST_EVADE: 'must-evade',
  BLOCKED_EVADE: 'blocked-evade',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const CHARGE_REACTION_DECISION_TYPES = {
  NO_EVADE: 'no-evade',
  EVADE: 'evade',
  FORCED_EVADE: 'forced-evade',
  BLOCKED_NO_EVADE: 'blocked-no-evade',
};

export const CHARGE_HANDOFF_STATUSES = {
  NONE: 'none',
  NO_EVADE: 'no-evade',
  BLOCKED_NO_EVADE: 'blocked-no-evade',
  EVADE_REQUIRED: 'evade-required',
};

export const CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES = {
  NONE: 'none',
  CAUGHT_EVADER: 'caught-evader',
  SECONDARY_TARGET: 'secondary-target',
  FRIENDLY_BLOCKER: 'friendly-blocker',
};

export const CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES = {
  REAR_ATTACK: 'rear-attack',
};

export const EVADE_MOVE_RESOLUTION_STATUSES = {
  NONE: 'none',
  PENDING: 'pending',
  CHOICE_REQUIRED: 'choice-required',
  COMMITTED: 'committed',
  BLOCKED: 'blocked',
  SOURCE_OPEN: 'source-open',
};

export const EVADE_CHOICE_HANDOFF_STATUSES = {
  IDLE: 'idle',
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
};

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

export function createChargeIntent(overrides = {}) {
  return {
    unitId: overrides.unitId ?? null,
    targetUnitId: overrides.targetUnitId ?? null,
    startPose: overrides.startPose ?? null,
    targetSnapshot: overrides.targetSnapshot ?? null,
    startManoeuvre: overrides.startManoeuvre ?? null,
    frozenDirectionRadians: Number.isFinite(overrides.frozenDirectionRadians)
      ? overrides.frozenDirectionRadians
      : null,
    commandSnapshot: overrides.commandSnapshot ?? null,
  };
}

export function createChargeReactionRequest(overrides = {}) {
  return {
    type: overrides.type ?? CHARGE_REACTION_REQUEST_TYPES.NONE,
    unitId: overrides.unitId ?? null,
    status: overrides.status ?? 'idle',
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
    sourceStatus: overrides.sourceStatus ?? null,
    contactEventIndex: Number.isInteger(overrides.contactEventIndex) ? overrides.contactEventIndex : null,
    chargePathSnapshot: Array.isArray(overrides.chargePathSnapshot) ? overrides.chargePathSnapshot : [],
    contactSnapshot: overrides.contactSnapshot ?? null,
    adjustedChargeDistanceUd: Number.isFinite(overrides.adjustedChargeDistanceUd)
      ? overrides.adjustedChargeDistanceUd
      : null,
    caughtByCharger: Boolean(overrides.caughtByCharger),
    actionLogToken: overrides.actionLogToken ?? null,
  };
}

export function createChargeDeclarationSnapshot(overrides = {}) {
  return {
    unitId: overrides.unitId ?? null,
    targetUnitId: overrides.targetUnitId ?? null,
    targetSnapshot: cloneSerializable(overrides.targetSnapshot ?? null),
    startPose: cloneSerializable(overrides.startPose ?? null),
    startManoeuvre: cloneSerializable(overrides.startManoeuvre ?? null),
    frozenDirectionRadians: Number.isFinite(overrides.frozenDirectionRadians)
      ? overrides.frozenDirectionRadians
      : null,
    commandSnapshot: cloneSerializable(overrides.commandSnapshot ?? null),
    selectedContactSide: cloneSerializable(overrides.selectedContactSide ?? null),
    pathSegments: Array.isArray(overrides.pathSegments) ? cloneSerializable(overrides.pathSegments) : [],
    contactEvent: cloneSerializable(overrides.contactEvent ?? null),
    reactionRequests: Array.isArray(overrides.reactionRequests) ? cloneSerializable(overrides.reactionRequests) : [],
  };
}

export function createChargeReactionDecision(overrides = {}) {
  return {
    type: overrides.type ?? null,
    unitId: overrides.unitId ?? null,
    requestType: overrides.requestType ?? null,
    handoffStatus: overrides.handoffStatus ?? CHARGE_HANDOFF_STATUSES.NONE,
    declarationSnapshot: cloneSerializable(overrides.declarationSnapshot ?? null),
  };
}

export function createChargeBranchDistanceState(overrides = {}) {
  return {
    history: Array.isArray(overrides.history) ? cloneSerializable(overrides.history) : [],
    claim: cloneSerializable(overrides.claim ?? null),
    result: cloneSerializable(overrides.result ?? null),
  };
}

export function createChargeConformationPlan(overrides = {}) {
  return {
    status: overrides.status ?? 'idle',
    selectedCandidateId: overrides.selectedCandidateId ?? null,
    candidates: Array.isArray(overrides.candidates) ? overrides.candidates : [],
    shiftingPlan: overrides.shiftingPlan ?? null,
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
  };
}

export function createEvadeMoveResolution(overrides = {}) {
  return {
    status: overrides.status ?? EVADE_MOVE_RESOLUTION_STATUSES.NONE,
    reactingUnitId: overrides.reactingUnitId ?? null,
    actingPlayerId: overrides.actingPlayerId ?? null,
    declarationSnapshot: cloneSerializable(overrides.declarationSnapshot ?? null),
    startPose: cloneSerializable(overrides.startPose ?? null),
    reorientedPose: cloneSerializable(overrides.reorientedPose ?? null),
    finalPose: cloneSerializable(overrides.finalPose ?? null),
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : 0,
    spentAvoidanceUd: Number.isFinite(overrides.spentAvoidanceUd) ? overrides.spentAvoidanceUd : 0,
    remainingDistanceUd: Number.isFinite(overrides.remainingDistanceUd) ? overrides.remainingDistanceUd : null,
    rollResult: cloneSerializable(overrides.rollResult ?? null),
    avoidanceSteps: Array.isArray(overrides.avoidanceSteps) ? cloneSerializable(overrides.avoidanceSteps) : [],
    avoidanceCandidates: Array.isArray(overrides.avoidanceCandidates) ? cloneSerializable(overrides.avoidanceCandidates) : [],
    choicePathStepIds: Array.isArray(overrides.choicePathStepIds) ? cloneSerializable(overrides.choicePathStepIds) : [],
    choiceRequired: Boolean(overrides.choiceRequired),
    autoCommit: Boolean(overrides.autoCommit),
    notice: overrides.notice ?? null,
    tableExit: cloneSerializable(overrides.tableExit ?? null),
    cannotShootHook: Boolean(overrides.cannotShootHook),
    repeatEvadeHook: cloneSerializable(overrides.repeatEvadeHook ?? null),
    diagnostics: Array.isArray(overrides.diagnostics) ? cloneSerializable(overrides.diagnostics) : [],
    sourceStatus: overrides.sourceStatus ?? null,
  };
}

export function createEvadeChoiceHandoff(overrides = {}) {
  return {
    status: overrides.status ?? EVADE_CHOICE_HANDOFF_STATUSES.IDLE,
    reactingUnitId: overrides.reactingUnitId ?? null,
    reactingPlayerId: overrides.reactingPlayerId ?? null,
    targetLabel: overrides.targetLabel ?? null,
    prompt: overrides.prompt ?? null,
    nextViewMode: overrides.nextViewMode ?? null,
    returnViewMode: overrides.returnViewMode ?? null,
  };
}

export function createChargeFollowThroughResolution(overrides = {}) {
  return {
    status: overrides.status ?? CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.NONE,
    defenderId: overrides.defenderId ?? null,
    selectedTargetId: overrides.selectedTargetId ?? null,
    contactType: overrides.contactType ?? null,
    combatPosture: overrides.combatPosture ?? null,
    cohesionLoss: overrides.cohesionLoss ?? null,
  };
}

export function createInitialChargePreview(overrides = {}) {
  return {
    status: overrides.status ?? CHARGE_PREVIEW_STATUSES.IDLE,
    intent: overrides.intent ?? null,
    targetCandidates: Array.isArray(overrides.targetCandidates) ? overrides.targetCandidates : [],
    startManoeuvreOptions: Array.isArray(overrides.startManoeuvreOptions) ? overrides.startManoeuvreOptions : [],
    pathSegments: Array.isArray(overrides.pathSegments) ? overrides.pathSegments : [],
    contactEvents: Array.isArray(overrides.contactEvents) ? overrides.contactEvents : [],
    selectedContactSide: overrides.selectedContactSide && typeof overrides.selectedContactSide === 'object'
      ? {
          defenderId: overrides.selectedContactSide.defenderId ?? null,
          side: overrides.selectedContactSide.side ?? null,
        }
      : null,
    reactionRequests: Array.isArray(overrides.reactionRequests) ? overrides.reactionRequests : [],
    declarationSnapshot: overrides.declarationSnapshot ?? null,
    reactionDecision: overrides.reactionDecision ?? null,
    secondaryReactionDecision: overrides.secondaryReactionDecision ?? null,
    branchDistanceRoll: createChargeBranchDistanceState(overrides.branchDistanceRoll),
    evadePlan: overrides.evasionPlan ?? overrides.evadePlan ?? null,
    evadeMove: createEvadeMoveResolution(overrides.evadeMove),
    evadeChoiceHandoff: createEvadeChoiceHandoff(overrides.evadeChoiceHandoff),
    chargeMovementPlan: overrides.chargeMovementPlan ?? null,
    followThroughResolution: createChargeFollowThroughResolution(overrides.followThroughResolution),
    handoffStatus: overrides.handoffStatus ?? CHARGE_HANDOFF_STATUSES.NONE,
    conformationPlan: overrides.conformationPlan ?? createChargeConformationPlan(),
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
  };
}