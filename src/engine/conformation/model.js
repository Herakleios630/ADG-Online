export const CONFORMATION_PLAN_STATUSES = {
  IDLE: 'idle',
  READY: 'ready',
  CHOICE_REQUIRED: 'choice-required',
  BLOCKED: 'blocked',
  SOURCE_OPEN: 'source-open',
  APPLIED: 'applied',
};

export const CONFORMATION_CANDIDATE_STATUSES = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
  BLOCKED: 'blocked',
  OPTIONAL: 'optional',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const CONFORMATION_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  ERRATA_CHECK: 'errata-check',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const CONFORMATION_OPTIONAL_CHOICE_TYPES = {
  TERRAIN: 'terrain-choice',
  CANDIDATE_SELECTION: 'candidate-selection',
};

export const CONFORMATION_SHIFTING_PLAN_STATUSES = {
  NONE: 'none',
  READY: 'ready',
  BLOCKED: 'blocked',
  SOURCE_OPEN: 'source-open',
};

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

export function createConformationDiagnostic(overrides = {}) {
  return {
    code: overrides.code ?? null,
    severity: overrides.severity ?? 'info',
    message: overrides.message ?? null,
    unitId: overrides.unitId ?? null,
    candidateId: overrides.candidateId ?? null,
    sourceStatus: overrides.sourceStatus ?? null,
    details: cloneSerializable(overrides.details ?? null),
  };
}

export function createConformationShiftPlan(overrides = {}) {
  return {
    status: overrides.status ?? CONFORMATION_SHIFTING_PLAN_STATUSES.NONE,
    shiftedUnitIds: Array.isArray(overrides.shiftedUnitIds) ? cloneSerializable(overrides.shiftedUnitIds) : [],
    steps: Array.isArray(overrides.steps) ? cloneSerializable(overrides.steps) : [],
    lockEffects: Array.isArray(overrides.lockEffects) ? cloneSerializable(overrides.lockEffects) : [],
    diagnostics: Array.isArray(overrides.diagnostics)
      ? overrides.diagnostics.map((entry) => createConformationDiagnostic(entry))
      : [],
    sourceStatus: overrides.sourceStatus ?? null,
  };
}

export function createConformationOptionalChoice(overrides = {}) {
  return {
    type: overrides.type ?? CONFORMATION_OPTIONAL_CHOICE_TYPES.CANDIDATE_SELECTION,
    prompt: overrides.prompt ?? null,
    selectedOptionId: overrides.selectedOptionId ?? null,
    options: Array.isArray(overrides.options) ? cloneSerializable(overrides.options) : [],
    sourceStatus: overrides.sourceStatus ?? null,
  };
}

export function createConformationCandidate(overrides = {}) {
  return {
    id: overrides.id ?? null,
    status: overrides.status ?? CONFORMATION_CANDIDATE_STATUSES.COMPLETE,
    contactSide: overrides.contactSide ?? null,
    contactRelationship: overrides.contactRelationship ?? null,
    finalPose: cloneSerializable(overrides.finalPose ?? null),
    movementPose: cloneSerializable(overrides.movementPose ?? null),
    principalOpponentId: overrides.principalOpponentId ?? null,
    contactSpanUd: Number.isFinite(overrides.contactSpanUd) ? overrides.contactSpanUd : null,
    lateralMisalignmentUd: Number.isFinite(overrides.lateralMisalignmentUd) ? overrides.lateralMisalignmentUd : null,
    deterministicPriority: Number.isFinite(overrides.deterministicPriority) ? overrides.deterministicPriority : null,
    sourceStatus: overrides.sourceStatus ?? null,
    optionalChoice: overrides.optionalChoice ? createConformationOptionalChoice(overrides.optionalChoice) : null,
    shiftingPlan: overrides.shiftingPlan ? createConformationShiftPlan(overrides.shiftingPlan) : null,
    diagnostics: Array.isArray(overrides.diagnostics)
      ? overrides.diagnostics.map((entry) => createConformationDiagnostic(entry))
      : [],
  };
}

export function createConformationPlan(overrides = {}) {
  return {
    status: overrides.status ?? CONFORMATION_PLAN_STATUSES.IDLE,
    sourceStatus: overrides.sourceStatus ?? null,
    controllingEnemyId: overrides.controllingEnemyId ?? null,
    principalOpponentId: overrides.principalOpponentId ?? null,
    selectedCandidateId: overrides.selectedCandidateId ?? null,
    contactSnapshot: cloneSerializable(overrides.contactSnapshot ?? null),
    contactClassification: cloneSerializable(overrides.contactClassification ?? null),
    candidates: Array.isArray(overrides.candidates)
      ? overrides.candidates.map((entry) => createConformationCandidate(entry))
      : [],
    optionalChoice: overrides.optionalChoice ? createConformationOptionalChoice(overrides.optionalChoice) : null,
    shiftingPlan: overrides.shiftingPlan ? createConformationShiftPlan(overrides.shiftingPlan) : null,
    diagnostics: Array.isArray(overrides.diagnostics)
      ? overrides.diagnostics.map((entry) => createConformationDiagnostic(entry))
      : [],
  };
}