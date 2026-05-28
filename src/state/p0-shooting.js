import {
  SHOOTING_ELIGIBILITY_STATUSES,
  SHOOTING_LOS_STATUSES,
  SHOOTING_PRIORITY_STATUSES,
  SHOOTING_RESOLUTION_STATUSES,
  SHOOTING_SUPPORT_STATUSES,
  SHOOTING_SEQUENCE_TYPES,
  SHOOTING_SOURCE_STATUSES,
  createCombinedShotGroup,
  evaluateLineOfSight,
  evaluateShootingGeometry,
  getShooterEligibility,
  getShootingProfile,
  getTargetEligibility,
  resolveCombinedShotOutcome,
  selectPriorityShootingTargets,
} from '../engine/shooting/index.js';

export const SHOOTING_PHASE_STATE_STATUSES = {
  IDLE: 'idle',
  ACTIVE: 'active',
};

export const SHOOTING_DECLARATION_STATUSES = {
  DECLARED: 'declared',
  REJECTED: 'rejected',
};

export const SHOOTING_DECLARATION_REASON_CODES = {
  INVALID_SHOT_GROUP: 'invalid-shot-group',
  SHOT_GROUP_SOURCE_OPEN: 'shot-group-source-open',
  TARGET_ALREADY_DECLARED: 'target-already-declared',
};

export const SHOOTING_PREVIEW_STATUSES = {
  IDLE: 'idle',
  TARGETING: 'targeting',
  READY: 'ready',
  BLOCKED: 'blocked',
  SOURCE_OPEN: 'source-open',
};

export const SHOOTING_TARGET_CANDIDATE_STATUSES = {
  ELIGIBLE: 'eligible',
  BLOCKED: 'blocked',
  SOURCE_OPEN: 'source-open',
};

export const SHOOTING_TARGET_CANDIDATE_REASON_CODES = {
  SHOOTER_INELIGIBLE: 'shooter-ineligible',
  TARGET_INELIGIBLE: 'target-ineligible',
  TARGET_OUT_OF_ZONE: 'target-out-of-zone',
  TARGET_OUT_OF_RANGE: 'target-out-of-range',
  TARGET_NO_LINE_OF_SIGHT: 'target-no-line-of-sight',
  TARGET_NON_PRIORITY: 'target-non-priority',
  TARGET_PRIORITY_SOURCE_OPEN: 'target-priority-source-open',
};

export const SHOOTING_RESOLUTION_DRAFT_STATUSES = {
  IDLE: 'idle',
  ACTIVE: 'active',
};

export const SHOOTING_PROCEDURE_STATUSES = {
  IDLE: 'idle',
  ANNOUNCED: 'announced',
  ACTIVE: 'active',
  COMPLETE: 'complete',
};

export const SHOOTING_SEQUENCE_HANDOFF_STATUSES = {
  IDLE: 'idle',
  PENDING: 'pending',
};

export const SHOOTING_SEQUENCE_HANDOFF_KINDS = {
  NEXT_PLAYER: 'next-player',
  MELEE: 'melee',
};

export const SHOOTING_PROCEDURE_UNIT_STATUSES = {
  ACTIVE: 'active',
  WAITING: 'waiting',
  FINISHED: 'finished',
  BLOCKED: 'blocked',
  SOURCE_OPEN: 'source-open',
  NON_RANGED: 'non-ranged',
};

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

export function createInitialShootingPreviewState(overrides = {}) {
  return {
    status: overrides.status ?? SHOOTING_PREVIEW_STATUSES.IDLE,
    shooterUnitId: overrides.shooterUnitId ?? null,
    targetUnitId: overrides.targetUnitId ?? null,
  };
}

export function createInitialShootingResolutionDraftState(overrides = {}) {
  return {
    status: overrides.status ?? SHOOTING_RESOLUTION_DRAFT_STATUSES.IDLE,
    shooterUnitId: overrides.shooterUnitId ?? null,
    targetUnitId: overrides.targetUnitId ?? null,
    shooterDieRoll: Number.isInteger(overrides.shooterDieRoll) ? overrides.shooterDieRoll : 1,
    targetDieRoll: Number.isInteger(overrides.targetDieRoll) ? overrides.targetDieRoll : 1,
    resolvedTargetProtectionValue: Number.isFinite(overrides.resolvedTargetProtectionValue)
      ? Number(overrides.resolvedTargetProtectionValue)
      : null,
    resolvedTargetProtectionSourceStatus: overrides.resolvedTargetProtectionSourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
  };
}

export function createInitialShootingProcedureState(overrides = {}) {
  return {
    status: overrides.status ?? SHOOTING_PROCEDURE_STATUSES.IDLE,
    actingPlayerId: overrides.actingPlayerId ?? null,
    activeShooterUnitId: overrides.activeShooterUnitId ?? null,
    selectableUnitIds: Array.isArray(overrides.selectableUnitIds) ? [...overrides.selectableUnitIds] : [],
    queueUnitIds: Array.isArray(overrides.queueUnitIds) ? [...overrides.queueUnitIds] : [],
    processedUnitIds: Array.isArray(overrides.processedUnitIds) ? [...new Set(overrides.processedUnitIds)] : [],
    passedUnitIds: Array.isArray(overrides.passedUnitIds) ? [...new Set(overrides.passedUnitIds)] : [],
    blockedUnitIds: Array.isArray(overrides.blockedUnitIds) ? [...new Set(overrides.blockedUnitIds)] : [],
    sourceOpenUnitIds: Array.isArray(overrides.sourceOpenUnitIds) ? [...new Set(overrides.sourceOpenUnitIds)] : [],
    unitStatuses: Array.isArray(overrides.unitStatuses) ? cloneSerializable(overrides.unitStatuses) : [],
    overview: {
      totalRangedUnits: Number.isFinite(overrides.overview?.totalRangedUnits) ? overrides.overview.totalRangedUnits : 0,
      eligibleUnits: Number.isFinite(overrides.overview?.eligibleUnits) ? overrides.overview.eligibleUnits : 0,
      blockedUnits: Number.isFinite(overrides.overview?.blockedUnits) ? overrides.overview.blockedUnits : 0,
      sourceOpenUnits: Number.isFinite(overrides.overview?.sourceOpenUnits) ? overrides.overview.sourceOpenUnits : 0,
      completedUnits: Number.isFinite(overrides.overview?.completedUnits) ? overrides.overview.completedUnits : 0,
    },
  };
}

export function createInitialShootingSequenceHandoffState(overrides = {}) {
  return {
    status: overrides.status ?? SHOOTING_SEQUENCE_HANDOFF_STATUSES.IDLE,
    kind: overrides.kind ?? null,
    nextPlayerId: overrides.nextPlayerId ?? null,
  };
}

export function createInitialShootingState(overrides = {}) {
  return {
    status: overrides.status ?? SHOOTING_PHASE_STATE_STATUSES.IDLE,
    phaseId: overrides.phaseId ?? null,
    actingPlayerId: overrides.actingPlayerId ?? null,
    sequenceType: overrides.sequenceType ?? SHOOTING_SEQUENCE_TYPES.ACTIVE_PLAYER,
    declaredShots: Array.isArray(overrides.declaredShots) ? cloneSerializable(overrides.declaredShots) : [],
    targetedUnitIds: Array.isArray(overrides.targetedUnitIds) ? [...new Set(overrides.targetedUnitIds)] : [],
    pendingRollClaims: Array.isArray(overrides.pendingRollClaims) ? cloneSerializable(overrides.pendingRollClaims) : [],
    resolvedShots: Array.isArray(overrides.resolvedShots) ? cloneSerializable(overrides.resolvedShots) : [],
    sourceStatus: overrides.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
    preview: createInitialShootingPreviewState(overrides.preview),
    resolutionDraft: createInitialShootingResolutionDraftState(overrides.resolutionDraft),
    procedure: createInitialShootingProcedureState(overrides.procedure),
    handoff: createInitialShootingSequenceHandoffState(overrides.handoff),
  };
}

export function applyUnitShootingSequenceFlags(unit, overrides = {}) {
  if (!unit || typeof unit !== 'object') {
    return unit;
  }

  const nextMoveCount = Number.isFinite(overrides.moveCountThisSequence)
    ? Number(overrides.moveCountThisSequence)
    : (Number(unit.moveCountThisSequence ?? 0) + (overrides.incrementMoveCount ? 1 : 0));

  return {
    ...unit,
    moveCountThisSequence: nextMoveCount,
    hasChargedThisSequence: Boolean(unit.hasChargedThisSequence) || Boolean(overrides.hasChargedThisSequence),
    hasDisengagedThisSequence: Boolean(unit.hasDisengagedThisSequence) || Boolean(overrides.hasDisengagedThisSequence),
    retreatedOutOfZocThisSequence: Boolean(unit.retreatedOutOfZocThisSequence) || Boolean(overrides.retreatedOutOfZocThisSequence),
    cannotShootThisSequence: Boolean(unit.cannotShootThisSequence) || Boolean(overrides.cannotShootThisSequence),
  };
}

export function beginShootingPhaseState(gameState, overrides = {}) {
  const nextGameState = {
    ...gameState,
    shooting: createInitialShootingState({
      status: SHOOTING_PHASE_STATE_STATUSES.ACTIVE,
      phaseId: overrides.phaseId ?? 'shooting',
      actingPlayerId: overrides.actingPlayerId ?? gameState.round?.turnPlayerId ?? gameState.commandContext?.activePlayerId ?? null,
      sequenceType: overrides.sequenceType ?? SHOOTING_SEQUENCE_TYPES.ACTIVE_PLAYER,
      sourceStatus: overrides.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
    }),
  };

  return rebuildShootingProcedureState(nextGameState, {
    status: SHOOTING_PROCEDURE_STATUSES.ANNOUNCED,
    activeShooterUnitId: null,
    selectedUnitId: nextGameState.selectedUnitId ?? null,
  });
}

export function resetShootingPhaseState(gameState) {
  return {
    ...gameState,
    shooting: createInitialShootingState(),
  };
}

function createDiagnostic(code, message, context = {}) {
  return {
    code,
    message,
    ...context,
  };
}

function createPanelDiagnostic(label, diagnostic) {
  return {
    label,
    status: diagnostic?.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
    text: diagnostic?.message ?? diagnostic?.code ?? 'Unknown shooting diagnostic.',
    code: diagnostic?.code ?? null,
  };
}

function getPrimaryDiagnosticCode(diagnostics = []) {
  return Array.isArray(diagnostics) ? diagnostics[0]?.code ?? null : null;
}

function isNonShooterEligibility(shooterEligibility) {
  return getPrimaryDiagnosticCode(shooterEligibility?.diagnostics) === 'non-shooter-profile';
}

function getUnitProcedureLabel(unit) {
  return unit?.scenarioLabel ?? unit?.id ?? 'Unknown unit';
}

function compareProcedureUnits(left, right) {
  const deltaX = Number(left?.xUd ?? 0) - Number(right?.xUd ?? 0);
  if (Math.abs(deltaX) > 0.001) {
    return deltaX;
  }

  return Number(left?.yUd ?? 0) - Number(right?.yUd ?? 0);
}

function createTargetCandidate({
  targetUnit,
  status,
  sourceStatus = SHOOTING_SOURCE_STATUSES.VERIFIED,
  diagnostics = [],
  reasonCode = null,
} = {}) {
  return {
    unitId: targetUnit?.id ?? null,
    targetUnit,
    status,
    sourceStatus,
    diagnostics,
    reasonCode,
    reason: diagnostics[0]?.message ?? null,
  };
}

function getPreviewForSelectedUnit(gameState, selectedUnit) {
  const preview = gameState?.shooting?.preview ?? createInitialShootingPreviewState();

  if (!selectedUnit || preview.shooterUnitId !== selectedUnit.id) {
    return createInitialShootingPreviewState();
  }

  return preview;
}

function getResolutionDraftForSelectedUnit(gameState, selectedUnit) {
  const resolutionDraft = gameState?.shooting?.resolutionDraft ?? createInitialShootingResolutionDraftState();

  if (!selectedUnit || resolutionDraft.shooterUnitId !== selectedUnit.id) {
    return createInitialShootingResolutionDraftState();
  }

  return resolutionDraft;
}

function getTargetCandidateById(targetCandidates, unitId) {
  return (Array.isArray(targetCandidates) ? targetCandidates : []).find((candidate) => candidate.unitId === unitId) ?? null;
}

function getDeclaredShotGroupForShooter(gameState, shooterUnitId) {
  return (gameState?.shooting?.declaredShots ?? []).find((shot) => shot?.mainShooterUnitId === shooterUnitId) ?? null;
}

function getResolvedShotRecord(gameState, shooterUnitId, targetUnitId) {
  return (gameState?.shooting?.resolvedShots ?? []).find((record) =>
    record?.claim?.shooterUnitId === shooterUnitId
    && record?.claim?.targetUnitId === targetUnitId,
  ) ?? null;
}

function getUnresolvedDeclaredShotGroup(gameState, shooterUnitId) {
  const declaredShotGroup = getDeclaredShotGroupForShooter(gameState, shooterUnitId);
  if (!declaredShotGroup) {
    return null;
  }

  return getResolvedShotRecord(gameState, shooterUnitId, declaredShotGroup.targetUnitId) ? null : declaredShotGroup;
}

function getSelectableProcedureUnitIds(procedure) {
  if (!procedure) {
    return [];
  }

  if (Array.isArray(procedure.selectableUnitIds) && procedure.selectableUnitIds.length > 0) {
    return procedure.selectableUnitIds;
  }

  return Array.isArray(procedure.queueUnitIds) ? procedure.queueUnitIds : [];
}

function resolveProcedureActiveShooterUnitId(gameState, procedure = gameState?.shooting?.procedure ?? null) {
  if (!procedure || procedure.status !== SHOOTING_PROCEDURE_STATUSES.ACTIVE) {
    return null;
  }

  const selectableUnitIds = getSelectableProcedureUnitIds(procedure);
  const selectedUnitId = gameState?.selectedUnitId ?? null;
  if (!selectedUnitId || !selectableUnitIds.includes(selectedUnitId)) {
    return null;
  }

  return procedure.processedUnitIds?.includes(selectedUnitId) ? null : selectedUnitId;
}

function findUnitById(gameState, unitId) {
  return (gameState?.units ?? []).find((unit) => unit?.id === unitId) ?? null;
}

function getProcedureEligibleShooterContext(gameState, unit) {
  if (!unit) {
    return null;
  }

  const shootingState = gameState?.shooting ?? createInitialShootingState();
  const actingPlayerId = shootingState.actingPlayerId ?? gameState?.commandContext?.activePlayerId ?? null;
  const currentPhaseId = shootingState.phaseId ?? gameState?.commandContext?.currentPhaseId ?? 'shooting';
  const shooterEligibility = getShooterEligibility({
    unit,
    shootingState,
    activePlayerId: actingPlayerId,
    currentPhaseId,
    sequenceType: shootingState.sequenceType,
  });

  if (shooterEligibility.status !== SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE) {
    return null;
  }

  return {
    shooterEligibility,
    shootingProfile: shooterEligibility.shootingProfileId
      ? getShootingProfile(shooterEligibility.shootingProfileId)
      : null,
  };
}

function getShootingProcedureProjection(gameState, options = {}) {
  const shootingState = gameState?.shooting ?? createInitialShootingState();
  const actingPlayerId = options.actingPlayerId ?? shootingState.actingPlayerId ?? gameState?.commandContext?.activePlayerId ?? null;
  const currentPhaseId = options.currentPhaseId ?? shootingState.phaseId ?? gameState?.commandContext?.currentPhaseId ?? 'shooting';
  const processedUnitIds = new Set(options.processedUnitIds ?? shootingState.procedure?.processedUnitIds ?? []);
  const selectedUnitId = options.selectedUnitId ?? gameState?.selectedUnitId ?? null;
  const queueEntries = [];
  const rangedUnitIds = [];
  const blockedUnitIds = [];
  const sourceOpenUnitIds = [];
  const unitStatuses = [];
  let totalRangedUnits = 0;
  let eligibleUnits = 0;
  let blockedUnits = 0;
  let sourceOpenUnits = 0;

  for (const unit of gameState?.units ?? []) {
    if (!unit || unit.owner !== actingPlayerId) {
      continue;
    }

    const shooterEligibility = getShooterEligibility({
      unit,
      shootingState,
      activePlayerId: actingPlayerId,
      currentPhaseId,
      sequenceType: shootingState.sequenceType,
    });
    const baseStatus = {
      unitId: unit.id,
      label: getUnitProcedureLabel(unit),
      canShoot: false,
      sourceStatus: shooterEligibility.sourceStatus,
      reasonCode: getPrimaryDiagnosticCode(shooterEligibility.diagnostics),
      reason: shooterEligibility.diagnostics?.[0]?.message ?? null,
    };

    if (isNonShooterEligibility(shooterEligibility)) {
      unitStatuses.push({
        ...baseStatus,
        status: SHOOTING_PROCEDURE_UNIT_STATUSES.NON_RANGED,
      });
      continue;
    }

    totalRangedUnits += 1;
    rangedUnitIds.push(unit.id);

    if (processedUnitIds.has(unit.id)) {
      unitStatuses.push({
        ...baseStatus,
        status: SHOOTING_PROCEDURE_UNIT_STATUSES.FINISHED,
        canShoot: true,
        reasonCode: null,
        reason: null,
      });
      continue;
    }

    if (shooterEligibility.status === SHOOTING_ELIGIBILITY_STATUSES.SOURCE_OPEN) {
      sourceOpenUnits += 1;
      sourceOpenUnitIds.push(unit.id);
      unitStatuses.push({
        ...baseStatus,
        status: SHOOTING_PROCEDURE_UNIT_STATUSES.SOURCE_OPEN,
      });
      continue;
    }

    if (shooterEligibility.status !== SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE) {
      blockedUnits += 1;
      blockedUnitIds.push(unit.id);
      unitStatuses.push({
        ...baseStatus,
        status: SHOOTING_PROCEDURE_UNIT_STATUSES.BLOCKED,
      });
      continue;
    }

    const targetSelection = buildTargetCandidates({
      gameState,
      shooterUnit: unit,
      shooterEligibility,
    });
    const targetCandidates = targetSelection.targetCandidates;
    const hasEligibleTarget = targetCandidates.some((candidate) => candidate.status === SHOOTING_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
    const hasSourceOpenTarget = targetCandidates.some((candidate) => candidate.status === SHOOTING_TARGET_CANDIDATE_STATUSES.SOURCE_OPEN);

    if (!hasEligibleTarget) {
      if (hasSourceOpenTarget) {
        sourceOpenUnits += 1;
        sourceOpenUnitIds.push(unit.id);
        unitStatuses.push({
          ...baseStatus,
          status: SHOOTING_PROCEDURE_UNIT_STATUSES.SOURCE_OPEN,
        });
        continue;
      }

      blockedUnits += 1;
      blockedUnitIds.push(unit.id);
      unitStatuses.push({
        ...baseStatus,
        status: SHOOTING_PROCEDURE_UNIT_STATUSES.BLOCKED,
        reasonCode: 'no-eligible-target',
        reason: 'This shooter currently has no legal target in the guided shooting subset.',
      });
      continue;
    }

    eligibleUnits += 1;
    queueEntries.push(unit);
    unitStatuses.push({
      ...baseStatus,
      status: processedUnitIds.has(unit.id)
        ? SHOOTING_PROCEDURE_UNIT_STATUSES.FINISHED
        : SHOOTING_PROCEDURE_UNIT_STATUSES.WAITING,
      canShoot: true,
      reasonCode: null,
      reason: null,
    });
  }

  const selectableUnitIds = queueEntries.sort(compareProcedureUnits).map((unit) => unit.id);
  const activeShooterUnitId = selectableUnitIds.includes(selectedUnitId) && !processedUnitIds.has(selectedUnitId)
    ? selectedUnitId
    : null;

  return {
    activeShooterUnitId,
    selectableUnitIds,
    queueUnitIds: selectableUnitIds,
    processedUnitIds: [...processedUnitIds],
    blockedUnitIds,
    sourceOpenUnitIds,
    unitStatuses: unitStatuses.map((entry) => (
      entry.unitId === activeShooterUnitId && entry.status === SHOOTING_PROCEDURE_UNIT_STATUSES.WAITING
        ? { ...entry, status: SHOOTING_PROCEDURE_UNIT_STATUSES.ACTIVE }
        : entry
    )),
    overview: {
      totalRangedUnits,
      eligibleUnits,
      blockedUnits,
      sourceOpenUnits,
      completedUnits: [...processedUnitIds].filter((unitId) => rangedUnitIds.includes(unitId)).length,
    },
  };
}

export function rebuildShootingProcedureState(gameState, options = {}) {
  const currentProcedure = gameState?.shooting?.procedure ?? createInitialShootingProcedureState();
  const projection = getShootingProcedureProjection(gameState, {
    processedUnitIds: options.processedUnitIds ?? currentProcedure.processedUnitIds,
    activeShooterUnitId: options.activeShooterUnitId,
    actingPlayerId: options.actingPlayerId,
    currentPhaseId: options.currentPhaseId,
    selectedUnitId: options.selectedUnitId ?? gameState?.selectedUnitId ?? null,
  });
  const nextStatus = options.status
    ?? (projection.selectableUnitIds.some((unitId) => !projection.processedUnitIds.includes(unitId))
      ? currentProcedure.status
      : SHOOTING_PROCEDURE_STATUSES.COMPLETE);

  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      procedure: createInitialShootingProcedureState({
        ...currentProcedure,
        ...projection,
        status: nextStatus,
        actingPlayerId: options.actingPlayerId ?? gameState.shooting?.actingPlayerId ?? currentProcedure.actingPlayerId,
        passedUnitIds: options.passedUnitIds ?? currentProcedure.passedUnitIds,
      }),
    },
  };
}

function advanceShootingProcedurePastShooter(gameState, shooterUnitIds, { passed = false, clearSelection = true } = {}) {
  const procedure = gameState?.shooting?.procedure ?? createInitialShootingProcedureState();
  const consumedUnitIds = [...new Set((Array.isArray(shooterUnitIds) ? shooterUnitIds : [shooterUnitIds]).filter(Boolean))];
  const selectableUnitIds = getSelectableProcedureUnitIds(procedure);

  if (consumedUnitIds.length === 0 || consumedUnitIds.some((unitId) => !selectableUnitIds.includes(unitId))) {
    return gameState;
  }

  const processedUnitIds = [...new Set([...procedure.processedUnitIds, ...consumedUnitIds])];
  const passedUnitIds = passed
    ? [...new Set([...procedure.passedUnitIds, ...consumedUnitIds])]
    : procedure.passedUnitIds;
  const nextStatus = selectableUnitIds.some((unitId) => !processedUnitIds.includes(unitId))
    ? SHOOTING_PROCEDURE_STATUSES.ACTIVE
    : SHOOTING_PROCEDURE_STATUSES.COMPLETE;
  const nextGameState = rebuildShootingProcedureState({
    ...gameState,
    shooting: {
      ...gameState.shooting,
      preview: createInitialShootingPreviewState(),
      resolutionDraft: createInitialShootingResolutionDraftState(),
    },
  }, {
    status: nextStatus,
    activeShooterUnitId: null,
    processedUnitIds,
    passedUnitIds,
    selectedUnitId: clearSelection ? null : gameState.selectedUnitId ?? null,
  });

  return {
    ...nextGameState,
    selectedUnitId: clearSelection ? null : gameState.selectedUnitId ?? null,
  };
}

export function acknowledgeShootingPhaseProcedure(gameState) {
  const selectableUnitIds = getSelectableProcedureUnitIds(gameState?.shooting?.procedure);
  const nextStatus = selectableUnitIds.some((unitId) => !(gameState?.shooting?.procedure?.processedUnitIds ?? []).includes(unitId))
    ? SHOOTING_PROCEDURE_STATUSES.ACTIVE
    : SHOOTING_PROCEDURE_STATUSES.COMPLETE;

  return {
    ...rebuildShootingProcedureState(gameState, {
      status: nextStatus,
      activeShooterUnitId: null,
      selectedUnitId: gameState?.selectedUnitId ?? null,
    }),
    selectedUnitId: gameState?.selectedUnitId ?? null,
  };
}

export function passShootingProcedureUnit(gameState, shooterUnitId = gameState?.selectedUnitId ?? null) {
  const procedure = gameState?.shooting?.procedure ?? createInitialShootingProcedureState();
  const activeShooterUnitId = resolveProcedureActiveShooterUnitId(gameState, procedure);
  if (
    procedure.status !== SHOOTING_PROCEDURE_STATUSES.ACTIVE
    || !shooterUnitId
    || activeShooterUnitId !== shooterUnitId
    || getUnresolvedDeclaredShotGroup(gameState, shooterUnitId)
  ) {
    return gameState;
  }

  return advanceShootingProcedurePastShooter(gameState, shooterUnitId, { passed: true });
}

export function getShootingProcedurePresentation(gameState, unitId = null) {
  const procedure = gameState?.shooting?.procedure ?? createInitialShootingProcedureState();
  const activeShooterUnitId = resolveProcedureActiveShooterUnitId(gameState, procedure);

  return {
    status: procedure.status,
    activeShooterUnitId,
    selectableUnitIds: getSelectableProcedureUnitIds(procedure),
    queueUnitIds: procedure.queueUnitIds,
    overview: procedure.overview,
    unitStatus: (procedure.unitStatuses ?? []).find((entry) => entry.unitId === unitId) ?? null,
    canPassActiveShooter: Boolean(
      procedure.status === SHOOTING_PROCEDURE_STATUSES.ACTIVE
        && unitId
        && activeShooterUnitId === unitId
        && !getUnresolvedDeclaredShotGroup(gameState, unitId)
    ),
  };
}

function buildTargetCandidates({ gameState, shooterUnit, shooterEligibility, chosenTargetUnitId = null }) {
  const shootingProfile = shooterEligibility?.shootingProfileId
    ? getShootingProfile(shooterEligibility.shootingProfileId)
    : null;
  const candidateSeeds = [];
  const priorityEligibleTargets = [];

  for (const targetUnit of gameState.units ?? []) {
    if (!targetUnit || targetUnit.id === shooterUnit.id) {
      continue;
    }

    const targetEligibility = getTargetEligibility({
      shooterUnit,
      targetUnit,
      shootingState: gameState.shooting,
      activePlayerId: gameState.commandContext?.activePlayerId ?? null,
      currentPhaseId: gameState.commandContext?.currentPhaseId ?? null,
    });

    if (targetEligibility.status !== SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE) {
      candidateSeeds.push(createTargetCandidate({
        targetUnit,
        status: targetEligibility.status === SHOOTING_ELIGIBILITY_STATUSES.SOURCE_OPEN
          ? SHOOTING_TARGET_CANDIDATE_STATUSES.SOURCE_OPEN
          : SHOOTING_TARGET_CANDIDATE_STATUSES.BLOCKED,
        sourceStatus: targetEligibility.sourceStatus,
        diagnostics: targetEligibility.diagnostics,
        reasonCode: SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_INELIGIBLE,
      }));
      continue;
    }

    const geometry = evaluateShootingGeometry({
      shooterUnit,
      targetUnit,
      shootingProfile,
      shootingProfileId: shooterEligibility.shootingProfileId,
    });

    if (geometry.sourceStatus !== SHOOTING_SOURCE_STATUSES.VERIFIED) {
      candidateSeeds.push(createTargetCandidate({
        targetUnit,
        status: SHOOTING_TARGET_CANDIDATE_STATUSES.SOURCE_OPEN,
        sourceStatus: geometry.sourceStatus,
        diagnostics: geometry.diagnostics,
        reasonCode: SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_OUT_OF_ZONE,
      }));
      continue;
    }

    if (!geometry.isInZone) {
      candidateSeeds.push(createTargetCandidate({
        targetUnit,
        status: SHOOTING_TARGET_CANDIDATE_STATUSES.BLOCKED,
        diagnostics: [createDiagnostic(
          SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_OUT_OF_ZONE,
          'Target is outside the current supported shooting zone.',
          { sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED },
        )],
        reasonCode: SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_OUT_OF_ZONE,
      }));
      continue;
    }

    if (!geometry.isInRange) {
      candidateSeeds.push(createTargetCandidate({
        targetUnit,
        status: SHOOTING_TARGET_CANDIDATE_STATUSES.BLOCKED,
        diagnostics: [createDiagnostic(
          SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_OUT_OF_RANGE,
          'Target is outside the current supported shooting range.',
          { sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED },
        )],
        reasonCode: SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_OUT_OF_RANGE,
      }));
      continue;
    }

    const lineOfSight = evaluateLineOfSight({
      shooterUnit,
      targetUnit,
      blockerUnits: gameState.units,
    });

    if (lineOfSight.status === SHOOTING_LOS_STATUSES.SOURCE_OPEN) {
      candidateSeeds.push(createTargetCandidate({
        targetUnit,
        status: SHOOTING_TARGET_CANDIDATE_STATUSES.SOURCE_OPEN,
        sourceStatus: lineOfSight.sourceStatus,
        diagnostics: lineOfSight.diagnostics,
        reasonCode: SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_NO_LINE_OF_SIGHT,
      }));
      continue;
    }

    if (!lineOfSight.hasLineOfSight) {
      candidateSeeds.push(createTargetCandidate({
        targetUnit,
        status: SHOOTING_TARGET_CANDIDATE_STATUSES.BLOCKED,
        diagnostics: lineOfSight.diagnostics,
        reasonCode: SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_NO_LINE_OF_SIGHT,
      }));
      continue;
    }

    priorityEligibleTargets.push(targetUnit);
    candidateSeeds.push({
      unitId: targetUnit.id,
      targetUnit,
      status: 'pending-priority',
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      diagnostics: [],
      reasonCode: null,
      reason: null,
    });
  }

  const prioritySelection = selectPriorityShootingTargets({
    shooterUnit,
    targetUnits: priorityEligibleTargets,
    shootingProfile,
    shootingProfileId: shooterEligibility?.shootingProfileId ?? null,
  });
  const priorityTargetIds = new Set((prioritySelection.priorityTargets ?? []).map((candidate) => candidate.targetUnitId));
  const priorityCandidatesById = new Map((prioritySelection.candidates ?? []).map((candidate) => [candidate.targetUnitId, candidate]));
  const selectedTargetUnitId = prioritySelection.status === SHOOTING_PRIORITY_STATUSES.SELECTED
    ? prioritySelection.selectedTargetUnitId
    : prioritySelection.status === SHOOTING_PRIORITY_STATUSES.PLAYER_CHOICE_REQUIRED
      && chosenTargetUnitId
      && priorityTargetIds.has(chosenTargetUnitId)
      ? chosenTargetUnitId
      : null;

  const targetCandidates = candidateSeeds.map((candidate) => {
    if (candidate.status !== 'pending-priority') {
      return candidate;
    }

    const priorityCandidate = priorityCandidatesById.get(candidate.unitId) ?? null;

    if (prioritySelection.status === SHOOTING_PRIORITY_STATUSES.PLAYER_CHOICE_REQUIRED && priorityTargetIds.has(candidate.unitId)) {
      return createTargetCandidate({
        targetUnit: candidate.targetUnit,
        status: SHOOTING_TARGET_CANDIDATE_STATUSES.ELIGIBLE,
        diagnostics: priorityCandidate?.diagnostics ?? [],
      });
    }

    if (selectedTargetUnitId === candidate.unitId) {
      return createTargetCandidate({
        targetUnit: candidate.targetUnit,
        status: SHOOTING_TARGET_CANDIDATE_STATUSES.ELIGIBLE,
        diagnostics: priorityCandidate?.diagnostics ?? [],
      });
    }

    return createTargetCandidate({
      targetUnit: candidate.targetUnit,
      status: SHOOTING_TARGET_CANDIDATE_STATUSES.BLOCKED,
      diagnostics: priorityCandidate?.diagnostics?.length
        ? priorityCandidate.diagnostics
        : [createDiagnostic(
          SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_NON_PRIORITY,
          'This target is not the current priority target in the supported P8 subset.',
          { sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED },
        )],
      reasonCode: SHOOTING_TARGET_CANDIDATE_REASON_CODES.TARGET_NON_PRIORITY,
    });
  });

  return {
    targetCandidates,
    prioritySelection,
    selectedTargetUnitId,
  };
}

function buildSupportingShotGroup({ gameState, mainShooter, shooterEligibility, targetUnitId, processedUnitIds = [] }) {
  const targetUnit = findUnitById(gameState, targetUnitId);
  if (!mainShooter || !targetUnit || shooterEligibility?.status !== SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE) {
    return null;
  }

  const processedUnitIdSet = new Set(processedUnitIds);
  const supportingShooters = [];

  for (const unit of gameState?.units ?? []) {
    if (!unit || unit.id === mainShooter.id || unit.owner !== mainShooter.owner || processedUnitIdSet.has(unit.id)) {
      continue;
    }

    if (getUnresolvedDeclaredShotGroup(gameState, unit.id)) {
      continue;
    }

    const supportContext = getProcedureEligibleShooterContext(gameState, unit);
    if (!supportContext?.shootingProfile?.supportEligible) {
      continue;
    }

    const supportTargeting = buildTargetCandidates({
      gameState,
      shooterUnit: unit,
      shooterEligibility: supportContext.shooterEligibility,
      chosenTargetUnitId: targetUnitId,
    });
    const supportTargetCandidate = getTargetCandidateById(supportTargeting.targetCandidates, targetUnitId);

    if (supportTargetCandidate?.status !== SHOOTING_TARGET_CANDIDATE_STATUSES.ELIGIBLE) {
      continue;
    }

    supportingShooters.push({
      id: unit.id,
      shootingProfileId: supportContext.shooterEligibility.shootingProfileId,
      sourceStatus: supportContext.shooterEligibility.sourceStatus,
      supportValueLabel: supportContext.shootingProfile.supportCountsAsLightTroops ? '+1/2' : '+1',
    });
  }

  return {
    supportingShooters,
    declaredShotGroup: createCombinedShotGroup({
      mainShooter: {
        id: mainShooter.id,
        shootingProfileId: shooterEligibility.shootingProfileId,
        sourceStatus: shooterEligibility.sourceStatus,
      },
      targetUnit,
      supportingShooters,
    }),
  };
}

function mapSupportingShooterPresentation(gameState, supportingUnitIds = []) {
  return supportingUnitIds.map((unitId) => {
    const unit = findUnitById(gameState, unitId);
    if (!unit) {
      return null;
    }

    const profile = unit.shootingProfileId ? getShootingProfile(unit.shootingProfileId) : null;

    return {
      id: unit.id,
      label: unit.scenarioLabel ?? unit.id,
      supportValueLabel: profile?.supportCountsAsLightTroops ? '+1/2' : '+1',
    };
  }).filter(Boolean);
}

export function getShootingDeclarationPresentation({ gameState, selectedUnit = null } = {}) {
  const preview = getPreviewForSelectedUnit(gameState, selectedUnit);
  const shootingPhaseActive = gameState?.commandContext?.currentPhaseId === 'shooting';
  const procedure = gameState?.shooting?.procedure ?? createInitialShootingProcedureState();
  const activeProcedureShooterUnitId = resolveProcedureActiveShooterUnitId(gameState, procedure);
  const selectableProcedureUnitIds = getSelectableProcedureUnitIds(procedure);
  const basePresentation = {
    shootingPreviewActive: preview.status !== SHOOTING_PREVIEW_STATUSES.IDLE,
    shootingPreviewStatus: preview.status,
    shootingTargetingActive: preview.status === SHOOTING_PREVIEW_STATUSES.TARGETING,
    canStartShootingDeclaration: false,
    canCancelShootingDeclaration: preview.status !== SHOOTING_PREVIEW_STATUSES.IDLE,
    canConfirmShootingDeclaration: false,
    shootDisabledReason: '',
    helperCopy: shootingPhaseActive
      ? 'Shoot waehlen, dann ein Ziel anklicken, um die reducer-owned Deklaration vorzubereiten.'
      : 'Shooting commands are only available during the shooting phase.',
    diagnostics: [],
    whyItems: [],
    targetCandidates: [],
    selectedTargetCandidate: null,
    declaredShotGroup: null,
    supportingShooters: [],
    autoSelectedTargetUnitId: null,
  };

  if (!selectedUnit) {
    return basePresentation;
  }

  if (
    procedure.status === SHOOTING_PROCEDURE_STATUSES.ACTIVE
    && !selectableProcedureUnitIds.includes(selectedUnit.id)
  ) {
    return {
      ...basePresentation,
      shootDisabledReason: 'This unit is not an unresolved shooter in the guided shooting procedure.',
      helperCopy: activeProcedureShooterUnitId
        ? 'Resolve or pass the currently selected shooter, or select another unresolved ranged unit.'
        : 'Select one unresolved ranged unit to choose the next shooter order.',
      diagnostics: [{
        label: 'Procedure',
        status: SHOOTING_SOURCE_STATUSES.VERIFIED,
        text: 'This unit is outside the unresolved guided shooting set.',
        code: 'shooting-procedure-unresolved-shooter-required',
      }],
      whyItems: [
        { label: 'Status', value: SHOOTING_PREVIEW_STATUSES.BLOCKED },
        { label: 'Procedure selected shooter', value: activeProcedureShooterUnitId ?? 'none' },
      ],
    };
  }

  const shooterEligibility = getShooterEligibility({
    unit: selectedUnit,
    shootingState: gameState.shooting,
    activePlayerId: gameState.commandContext?.activePlayerId ?? null,
    currentPhaseId: gameState.commandContext?.currentPhaseId ?? null,
  });
  const canStartShootingDeclaration = shooterEligibility.status === SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE;
  const shootDisabledReason = canStartShootingDeclaration
    ? ''
    : shooterEligibility.diagnostics[0]?.message ?? 'This unit cannot start a shot declaration in the current supported subset.';
  const targetSelection = canStartShootingDeclaration || basePresentation.shootingPreviewActive
    ? buildTargetCandidates({
      gameState,
      shooterUnit: selectedUnit,
      shooterEligibility,
      chosenTargetUnitId: preview.targetUnitId,
    })
    : { targetCandidates: [], selectedTargetUnitId: null, prioritySelection: null };
  const targetCandidates = targetSelection.targetCandidates;
  const autoSelectedTargetUnitId = targetSelection.selectedTargetUnitId;
  const selectedTargetCandidate = getTargetCandidateById(targetCandidates, preview.targetUnitId);
  const effectiveSelectedTargetCandidate = selectedTargetCandidate
    ?? (autoSelectedTargetUnitId ? getTargetCandidateById(targetCandidates, autoSelectedTargetUnitId) : null);
  const supportGroup = effectiveSelectedTargetCandidate?.status === SHOOTING_TARGET_CANDIDATE_STATUSES.ELIGIBLE
    ? buildSupportingShotGroup({
      gameState,
      mainShooter: selectedUnit,
      shooterEligibility,
      targetUnitId: effectiveSelectedTargetCandidate.unitId,
      processedUnitIds: procedure.processedUnitIds,
    })
    : null;
  const declaredShotGroup = supportGroup?.declaredShotGroup ?? null;

  const effectivePreviewStatus = preview.status === SHOOTING_PREVIEW_STATUSES.IDLE
    ? (autoSelectedTargetUnitId ? SHOOTING_PREVIEW_STATUSES.READY : SHOOTING_PREVIEW_STATUSES.IDLE)
    : effectiveSelectedTargetCandidate == null
      ? SHOOTING_PREVIEW_STATUSES.TARGETING
      : effectiveSelectedTargetCandidate.status === SHOOTING_TARGET_CANDIDATE_STATUSES.ELIGIBLE
        ? SHOOTING_PREVIEW_STATUSES.READY
        : effectiveSelectedTargetCandidate.status === SHOOTING_TARGET_CANDIDATE_STATUSES.SOURCE_OPEN
          ? SHOOTING_PREVIEW_STATUSES.SOURCE_OPEN
          : SHOOTING_PREVIEW_STATUSES.BLOCKED;

  const diagnostics = [
    ...shooterEligibility.diagnostics.map((diagnostic) => createPanelDiagnostic('Shooter', diagnostic)),
    ...(targetSelection.prioritySelection?.diagnostics ?? []).map((diagnostic) => createPanelDiagnostic('Priority', diagnostic)),
    ...(effectiveSelectedTargetCandidate?.diagnostics ?? []).map((diagnostic) => createPanelDiagnostic('Target', diagnostic)),
    ...(declaredShotGroup?.diagnostics ?? []).map((diagnostic) => createPanelDiagnostic('Declaration', diagnostic)),
  ];

  const whyItems = [
    { label: 'Status', value: effectivePreviewStatus },
    { label: 'Shooter', value: selectedUnit.scenarioLabel ?? selectedUnit.id },
    { label: 'Shooter check', value: shooterEligibility.status },
    effectiveSelectedTargetCandidate
      ? { label: 'Target', value: effectiveSelectedTargetCandidate.targetUnit?.scenarioLabel ?? effectiveSelectedTargetCandidate.unitId ?? 'unknown' }
      : null,
    effectiveSelectedTargetCandidate
      ? { label: 'Target check', value: effectiveSelectedTargetCandidate.status }
      : null,
    targetSelection.prioritySelection?.status === SHOOTING_PRIORITY_STATUSES.PLAYER_CHOICE_REQUIRED
      ? { label: 'Priority', value: 'player-choice-required' }
      : null,
    declaredShotGroup
      ? { label: 'Support bonus', value: `+${declaredShotGroup.supportBonus}` }
      : null,
    effectiveSelectedTargetCandidate?.sourceStatus && effectiveSelectedTargetCandidate.sourceStatus !== SHOOTING_SOURCE_STATUSES.VERIFIED
      ? { label: 'Source', value: effectiveSelectedTargetCandidate.sourceStatus }
      : null,
  ].filter(Boolean);

  return {
    shootingPreviewActive: effectivePreviewStatus !== SHOOTING_PREVIEW_STATUSES.IDLE,
    shootingPreviewStatus: effectivePreviewStatus,
    shootingTargetingActive: effectivePreviewStatus === SHOOTING_PREVIEW_STATUSES.TARGETING,
    canStartShootingDeclaration: canStartShootingDeclaration && !basePresentation.shootingPreviewActive,
    canCancelShootingDeclaration: effectivePreviewStatus !== SHOOTING_PREVIEW_STATUSES.IDLE,
    canConfirmShootingDeclaration: Boolean(
      declaredShotGroup
        && declaredShotGroup.status === SHOOTING_SUPPORT_STATUSES.READY
        && effectivePreviewStatus === SHOOTING_PREVIEW_STATUSES.READY
    ),
    shootDisabledReason,
    helperCopy: effectivePreviewStatus === SHOOTING_PREVIEW_STATUSES.READY
      ? 'Shot declaration is ready. Confirm to lock the target and finish the main shooter with all legal same-target supporters.'
      : effectivePreviewStatus === SHOOTING_PREVIEW_STATUSES.BLOCKED
        ? 'Selected target stays visible for why-surface review, but cannot be declared in the current subset.'
        : effectivePreviewStatus === SHOOTING_PREVIEW_STATUSES.SOURCE_OPEN
          ? 'Selected target remains source-open and stays diagnostic-only for now.'
          : targetSelection.prioritySelection?.status === SHOOTING_PRIORITY_STATUSES.PLAYER_CHOICE_REQUIRED
            ? 'Several tied priority targets are legal. Choose one of them before declaring the shot.'
          : canStartShootingDeclaration
            ? autoSelectedTargetUnitId
              ? 'Priority target is unique and has been selected automatically.'
              : 'Shoot waehlen, then click a target to build the declaration preview.'
            : basePresentation.helperCopy,
    diagnostics,
    whyItems,
    targetCandidates,
    selectedTargetCandidate: effectiveSelectedTargetCandidate,
    declaredShotGroup,
    supportingShooters: supportGroup?.supportingShooters ?? [],
    autoSelectedTargetUnitId,
  };
}

export function getShootingResolutionPresentation({ gameState, selectedUnit = null } = {}) {
  const shootingPhaseActive = gameState?.commandContext?.currentPhaseId === 'shooting';
  const resolutionDraft = getResolutionDraftForSelectedUnit(gameState, selectedUnit);
  const declaredShotGroup = selectedUnit ? getUnresolvedDeclaredShotGroup(gameState, selectedUnit.id) : null;
  const resolvedShotRecord = selectedUnit
    ? (gameState?.shooting?.resolvedShots ?? []).find((record) => record?.claim?.shooterUnitId === selectedUnit.id) ?? null
    : null;
  const targetUnit = declaredShotGroup?.targetUnitId
    ? (gameState?.units ?? []).find((unit) => unit.id === declaredShotGroup.targetUnitId) ?? null
    : null;
  const resolutionPreview = shootingPhaseActive && declaredShotGroup && resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE
    ? resolveCombinedShotOutcome({
      declaredShotGroup,
      targetUnit,
      actingPlayerId: gameState?.shooting?.actingPlayerId ?? gameState?.commandContext?.activePlayerId ?? null,
      phase: gameState?.shooting?.phaseId ?? gameState?.commandContext?.currentPhaseId ?? null,
      shooterDieRoll: resolutionDraft.shooterDieRoll,
      targetDieRoll: resolutionDraft.targetDieRoll,
      resolvedTargetProtectionValue: resolutionDraft.resolvedTargetProtectionValue,
      resolvedTargetProtectionSourceStatus: resolutionDraft.resolvedTargetProtectionSourceStatus,
    })
    : null;
  const diagnostics = (resolutionPreview?.diagnostics ?? []).map((diagnostic) => createPanelDiagnostic('Resolution', diagnostic));
  const protectionValueLabel = Number.isFinite(resolutionDraft.resolvedTargetProtectionValue)
    ? `verified ${resolutionDraft.resolvedTargetProtectionValue}`
    : 'missing';
  const supportingShooters = declaredShotGroup
    ? mapSupportingShooterPresentation(gameState, declaredShotGroup.supportingUnitIds)
    : [];

  return {
    hasDeclaredShotToResolve: Boolean(declaredShotGroup),
    declaredShotGroup,
    supportingShooters,
    resolvedShotRecord,
    resolutionDraftActive: resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE,
    canStartShootingResolution: Boolean(shootingPhaseActive && declaredShotGroup && resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.IDLE),
    canConfirmShootingResolution: resolutionPreview?.status === SHOOTING_RESOLUTION_STATUSES.RESOLVED,
    helperCopy: resolvedShotRecord
      ? 'Resolved shot summary is frozen in reducer state for this shooting phase.'
      : resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE
        ? resolutionPreview?.status === SHOOTING_RESOLUTION_STATUSES.RESOLVED
          ? 'Roll/result preview is ready. Confirm to record the deterministic result in reducer state.'
          : 'Roll/result preview stays source-open until a verified explicit protection value is provided.'
        : declaredShotGroup
          ? 'Shot declaration is locked. Start Roll/Result to enter explicit verified protection and deterministic D6 values.'
          : 'No declared shot is waiting for roll/result on this unit.',
    diagnostics,
    whyItems: declaredShotGroup || resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE || resolvedShotRecord
      ? [
          { label: 'Declared target', value: targetUnit?.scenarioLabel ?? declaredShotGroup?.targetUnitId ?? resolvedShotRecord?.claim?.targetUnitId ?? 'unknown' },
          resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE
            ? { label: 'Shooter D6', value: String(resolutionDraft.shooterDieRoll) }
            : null,
          resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE
            ? { label: 'Target D6', value: String(resolutionDraft.targetDieRoll) }
            : null,
          resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE
            ? { label: 'Protection', value: protectionValueLabel }
            : null,
          resolutionDraft.status === SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE && resolutionPreview
            ? { label: 'Resolution', value: resolutionPreview.status }
            : null,
          resolvedShotRecord?.result
            ? { label: 'Last result', value: `CL ${resolvedShotRecord.result.cohesionLoss}, shooter ${resolvedShotRecord.result.shooterTotal} vs target ${resolvedShotRecord.result.targetTotal}` }
            : null,
        ].filter(Boolean)
      : [],
    resolutionDraft,
    resolutionPreview,
  };
}

export function startShootingDeclarationPreview(gameState, shooterUnitId) {
  const shooterUnit = gameState?.units?.find((unit) => unit.id === shooterUnitId) ?? null;
  const presentation = getShootingDeclarationPresentation({ gameState, selectedUnit: shooterUnit });

  if (!shooterUnit || !presentation.canStartShootingDeclaration) {
    return gameState;
  }

  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      preview: createInitialShootingPreviewState({
        status: presentation.autoSelectedTargetUnitId
          ? SHOOTING_PREVIEW_STATUSES.READY
          : SHOOTING_PREVIEW_STATUSES.TARGETING,
        shooterUnitId,
        targetUnitId: presentation.autoSelectedTargetUnitId,
      }),
    },
  };
}

export function setShootingDeclarationTarget(gameState, targetUnitId) {
  const shooterUnitId = gameState?.shooting?.preview?.shooterUnitId ?? null;
  const shooterUnit = gameState?.units?.find((unit) => unit.id === shooterUnitId) ?? null;

  if (!shooterUnit) {
    return gameState;
  }

  const presentation = getShootingDeclarationPresentation({ gameState, selectedUnit: shooterUnit });
  const selectedTargetCandidate = getTargetCandidateById(presentation.targetCandidates, targetUnitId);
  const nextStatus = selectedTargetCandidate == null
    ? SHOOTING_PREVIEW_STATUSES.TARGETING
    : selectedTargetCandidate.status === SHOOTING_TARGET_CANDIDATE_STATUSES.ELIGIBLE
      ? SHOOTING_PREVIEW_STATUSES.READY
      : selectedTargetCandidate.status === SHOOTING_TARGET_CANDIDATE_STATUSES.SOURCE_OPEN
        ? SHOOTING_PREVIEW_STATUSES.SOURCE_OPEN
        : SHOOTING_PREVIEW_STATUSES.BLOCKED;

  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      preview: createInitialShootingPreviewState({
        status: nextStatus,
        shooterUnitId,
        targetUnitId,
      }),
    },
  };
}

export function cancelShootingDeclarationPreview(gameState) {
  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      preview: createInitialShootingPreviewState(),
    },
  };
}

export function startShootingResolutionDraft(gameState, shooterUnitId) {
  const declaredShotGroup = getUnresolvedDeclaredShotGroup(gameState, shooterUnitId);

  if (!declaredShotGroup || gameState?.commandContext?.currentPhaseId !== 'shooting') {
    return gameState;
  }

  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      resolutionDraft: createInitialShootingResolutionDraftState({
        status: SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE,
        shooterUnitId,
        targetUnitId: declaredShotGroup.targetUnitId,
      }),
    },
  };
}

export function setShootingResolutionDraftProtection(gameState, resolvedTargetProtectionValue) {
  const resolutionDraft = gameState?.shooting?.resolutionDraft ?? createInitialShootingResolutionDraftState();

  if (resolutionDraft.status !== SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE) {
    return gameState;
  }

  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      resolutionDraft: createInitialShootingResolutionDraftState({
        ...resolutionDraft,
        resolvedTargetProtectionValue,
      }),
    },
  };
}

export function setShootingResolutionDraftDieRoll(gameState, dieOwner, dieRoll) {
  const resolutionDraft = gameState?.shooting?.resolutionDraft ?? createInitialShootingResolutionDraftState();

  if (resolutionDraft.status !== SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE || !Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 6) {
    return gameState;
  }

  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      resolutionDraft: createInitialShootingResolutionDraftState({
        ...resolutionDraft,
        shooterDieRoll: dieOwner === 'shooter' ? dieRoll : resolutionDraft.shooterDieRoll,
        targetDieRoll: dieOwner === 'target' ? dieRoll : resolutionDraft.targetDieRoll,
      }),
    },
  };
}

export function cancelShootingResolutionDraft(gameState) {
  return {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      resolutionDraft: createInitialShootingResolutionDraftState(),
    },
  };
}

export function confirmShootingResolution(gameState) {
  const shooterUnitId = gameState?.shooting?.resolutionDraft?.shooterUnitId ?? null;
  const shooterUnit = gameState?.units?.find((unit) => unit.id === shooterUnitId) ?? null;
  const presentation = getShootingResolutionPresentation({ gameState, selectedUnit: shooterUnit });
  const declaredShotGroup = shooterUnitId ? getUnresolvedDeclaredShotGroup(gameState, shooterUnitId) : null;

  if (!presentation.canConfirmShootingResolution || !presentation.resolutionPreview?.claim || !presentation.resolutionPreview?.record) {
    return gameState;
  }

  const nextGameState = {
    ...gameState,
    shooting: {
      ...gameState.shooting,
      pendingRollClaims: [...gameState.shooting.pendingRollClaims, cloneSerializable(presentation.resolutionPreview.claim)],
      resolvedShots: [...gameState.shooting.resolvedShots, cloneSerializable(presentation.resolutionPreview.record)],
      resolutionDraft: createInitialShootingResolutionDraftState(),
    },
  };

  return advanceShootingProcedurePastShooter(
    nextGameState,
    [shooterUnitId, ...(declaredShotGroup?.supportingUnitIds ?? [])],
  );
}

export function confirmShootingDeclaration(gameState) {
  const shooterUnitId = gameState?.shooting?.preview?.shooterUnitId ?? null;
  const shooterUnit = gameState?.units?.find((unit) => unit.id === shooterUnitId) ?? null;
  const presentation = getShootingDeclarationPresentation({ gameState, selectedUnit: shooterUnit });

  if (!presentation.canConfirmShootingDeclaration || !presentation.declaredShotGroup) {
    return {
      status: SHOOTING_DECLARATION_STATUSES.REJECTED,
      nextGameState: gameState,
      diagnostics: presentation.diagnostics,
    };
  }

  const declarationResult = declareShootingShotGroup(gameState, presentation.declaredShotGroup);
  if (declarationResult.status !== SHOOTING_DECLARATION_STATUSES.DECLARED) {
    return declarationResult;
  }

  return {
    ...declarationResult,
    nextGameState: {
      ...declarationResult.nextGameState,
      shooting: {
        ...declarationResult.nextGameState.shooting,
        preview: createInitialShootingPreviewState(),
        resolutionDraft: createInitialShootingResolutionDraftState({
          status: SHOOTING_RESOLUTION_DRAFT_STATUSES.ACTIVE,
          shooterUnitId,
          targetUnitId: presentation.declaredShotGroup.targetUnitId,
        }),
      },
    },
  };
}

export function declareShootingShotGroup(gameState, declaredShotGroup) {
  const targetUnitId = typeof declaredShotGroup?.targetUnitId === 'string' && declaredShotGroup.targetUnitId.trim().length > 0
    ? declaredShotGroup.targetUnitId.trim()
    : null;
  const declaredShotGroupSourceStatus = declaredShotGroup?.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED;

  if (!declaredShotGroup || typeof declaredShotGroup !== 'object' || declaredShotGroup.status === SHOOTING_SUPPORT_STATUSES.INVALID) {
    return {
      status: SHOOTING_DECLARATION_STATUSES.REJECTED,
      nextGameState: gameState,
      diagnostics: [createDiagnostic(
        SHOOTING_DECLARATION_REASON_CODES.INVALID_SHOT_GROUP,
        'Only valid combined-shot groups can be registered in shooting phase state.',
      )],
    };
  }

  if (
    declaredShotGroup.status === SHOOTING_SUPPORT_STATUSES.SOURCE_OPEN
    || declaredShotGroupSourceStatus !== SHOOTING_SOURCE_STATUSES.VERIFIED
  ) {
    return {
      status: SHOOTING_DECLARATION_STATUSES.REJECTED,
      nextGameState: gameState,
      diagnostics: [createDiagnostic(
        SHOOTING_DECLARATION_REASON_CODES.SHOT_GROUP_SOURCE_OPEN,
        'Source-open combined-shot groups stay diagnostic-only until the support family is source-closed.',
        { targetUnitId },
      )],
    };
  }

  if (!targetUnitId) {
    return {
      status: SHOOTING_DECLARATION_STATUSES.REJECTED,
      nextGameState: gameState,
      diagnostics: [createDiagnostic(
        SHOOTING_DECLARATION_REASON_CODES.INVALID_SHOT_GROUP,
        'Combined-shot groups require a target unit id before they can be registered.',
      )],
    };
  }

  if (gameState.shooting.targetedUnitIds.includes(targetUnitId)) {
    return {
      status: SHOOTING_DECLARATION_STATUSES.REJECTED,
      nextGameState: gameState,
      diagnostics: [createDiagnostic(
        SHOOTING_DECLARATION_REASON_CODES.TARGET_ALREADY_DECLARED,
        `Target '${targetUnitId}' has already been shot at this phase.`,
        { targetUnitId },
      )],
    };
  }

  const nextDeclaredShots = [...gameState.shooting.declaredShots, cloneSerializable(declaredShotGroup)];
  const nextTargetedUnitIds = [...gameState.shooting.targetedUnitIds, targetUnitId];

  return {
    status: SHOOTING_DECLARATION_STATUSES.DECLARED,
    nextGameState: {
      ...gameState,
      shooting: {
        ...gameState.shooting,
        declaredShots: nextDeclaredShots,
        targetedUnitIds: nextTargetedUnitIds,
      },
    },
    diagnostics: [],
  };
}