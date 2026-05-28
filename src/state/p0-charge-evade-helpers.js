import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import {
  CHARGE_BRANCH_ROLL_REASONS,
  EVADE_CHOICE_KINDS,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createEvadeMoveResolution,
  createEvadePlan,
  getEvadeStepIdPart,
  resolveIsolatedSingleUnitEvadePlan,
} from '../engine/charge/index.js';

function createTerrainEvadeHardBlocker(placeholder) {
  const blocksEvade = Boolean(
    placeholder?.blocksEvade
    || placeholder?.blocksMovement
    || placeholder?.impassable
    || placeholder?.movementEffect === 'impassable',
  );
  if (!blocksEvade || !placeholder?.id || !placeholder?.pose || !placeholder?.footprint) {
    return null;
  }

  return {
    id: `terrain:${placeholder.id}`,
    xUd: Number(placeholder.pose.xUd ?? 0),
    yUd: Number(placeholder.pose.yUd ?? 0),
    widthUd: Number(placeholder.footprint.widthUd ?? 0),
    depthUd: Number(placeholder.footprint.depthUd ?? 0),
    rotationRadians: Number(placeholder.footprint.rotationRadians ?? 0),
    baseShape: 'rectangle',
    evadeHardBlockerKind: 'impassable-terrain-hard-blocker',
    sourceId: placeholder.id,
  };
}

function createSetupObjectEvadeHardBlocker(setupObject) {
  const family = String(setupObject?.family ?? '').toLowerCase();
  const blocksEvade = ['fortification', 'obstacle', 'stakes'].includes(family)
    || setupObject?.blocksEvade
    || setupObject?.blocksMovement
    || setupObject?.impassable;
  if (!blocksEvade || !setupObject?.id || !setupObject?.pose || !setupObject?.footprint) {
    return null;
  }

  return {
    id: `setup-object:${setupObject.id}`,
    owner: setupObject.owner ?? null,
    xUd: Number(setupObject.pose.xUd ?? 0),
    yUd: Number(setupObject.pose.yUd ?? 0),
    widthUd: Number(setupObject.footprint.widthUd ?? 0),
    depthUd: Number(setupObject.footprint.depthUd ?? 0),
    rotationRadians: Number(setupObject.footprint.rotationRadians ?? 0),
    baseShape: 'rectangle',
    evadeHardBlockerKind: 'setup-object-hard-blocker',
    sourceId: setupObject.id,
  };
}

function getEvadeHardBlockersFromGameState(gameState) {
  return [
    ...(gameState?.setup?.terrain?.placeholders ?? []).map(createTerrainEvadeHardBlocker),
    ...(gameState?.setup?.setupObjects?.placeholders ?? []).map(createSetupObjectEvadeHardBlocker),
  ].filter(Boolean);
}

export function resolveChargePreviewEvadePlan(gameState, preview, result, options = {}) {
  if (preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE) {
    return null;
  }

  const reactingUnitId = preview?.branchDistanceRoll?.claim?.reactingUnitId
    ?? preview?.secondaryReactionDecision?.unitId
    ?? preview?.reactionDecision?.unitId
    ?? preview?.intent?.targetUnitId
    ?? null;
  const reactingUnit = gameState.units.find((unit) => unit.id === reactingUnitId) ?? null;
  const primaryContactEvent = preview?.branchDistanceRoll?.claim?.declarationSnapshot?.contactEvent
    ?? preview?.contactEvents?.[0]
    ?? null;

  if (!reactingUnit || !primaryContactEvent?.classification || !primaryContactEvent?.contactSnapshot) {
    return createEvadePlan({ sourceStatus: 'needs-source-check' });
  }

  return resolveIsolatedSingleUnitEvadePlan({
    reactingUnit,
    contactClassification: primaryContactEvent.classification,
    selectedContactSide: preview?.selectedContactSide?.side ?? null,
    contactSnapshot: primaryContactEvent.contactSnapshot,
    chargeDirectionRadians: preview?.branchDistanceRoll?.claim?.declarationSnapshot?.frozenDirectionRadians ?? null,
    distanceRollResult: result,
    battlefieldProfile: getBattlefieldProfile(gameState.battlefieldProfileId),
    units: gameState.units,
    hardBlockers: getEvadeHardBlockersFromGameState(gameState),
    ignoredUnitIds: [reactingUnit.id ?? null, preview?.intent?.unitId ?? null].filter(Boolean),
    deferInitialBranchChoice: Boolean(options.deferInitialBranchChoice),
    selectedInitialBranch: options.selectedInitialBranch ?? null,
  });
}

export function createEvadeMoveResolutionFromPlan(gameState, preview, evadePlan) {
  if (
    !evadePlan?.reactingUnitId
    || (
      !evadePlan?.choiceRequired
      && !evadePlan?.endPose
      && !evadePlan?.tableExit?.exitsTable
    )
  ) {
    return createEvadeMoveResolution({
      status: EVADE_MOVE_RESOLUTION_STATUSES.SOURCE_OPEN,
      reactingUnitId: evadePlan?.reactingUnitId ?? null,
      actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
      declarationSnapshot: preview?.branchDistanceRoll?.claim?.declarationSnapshot ?? null,
      diagnostics: evadePlan?.diagnostics ?? [],
      sourceStatus: evadePlan?.sourceStatus ?? 'needs-source-check',
      notice: 'Evade movement could not be committed because the resolved plan is incomplete.',
    });
  }

  const sourceOpen = evadePlan.sourceStatus === 'needs-source-check'
    || (evadePlan.diagnostics ?? []).some((diagnostic) => diagnostic?.status === 'warn' || diagnostic?.sourceStatus === 'needs-source-check');
  const choiceRequired = Boolean(evadePlan.choiceRequired);

  return createEvadeMoveResolution({
    status: choiceRequired
      ? EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
      : sourceOpen
        ? EVADE_MOVE_RESOLUTION_STATUSES.SOURCE_OPEN
        : EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED,
    reactingUnitId: evadePlan.reactingUnitId,
    actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
    declarationSnapshot: preview?.branchDistanceRoll?.claim?.declarationSnapshot ?? null,
    startPose: evadePlan.startPose,
    reorientedPose: evadePlan.reorientedPose,
    finalPose: evadePlan.endPose,
    distanceUd: evadePlan.distanceUd,
    spentAvoidanceUd: evadePlan.spentAvoidanceUd ?? 0,
    remainingDistanceUd: evadePlan.remainingDistanceUd ?? evadePlan.distanceUd,
    rollResult: evadePlan.rollResult,
    avoidanceSteps: evadePlan.avoidanceSteps ?? [],
    avoidanceCandidates: evadePlan.avoidanceCandidates ?? [],
    pathSegments: evadePlan.pathSegments ?? [],
    choicePathStepIds: [],
    tableExit: evadePlan.tableExit ?? null,
    endHalfTurnHook: evadePlan.endHalfTurnHook ?? null,
    choiceRequired,
    choiceKind: evadePlan.choiceKind ?? EVADE_CHOICE_KINDS.NONE,
    autoCommit: !sourceOpen && !choiceRequired,
    notice: choiceRequired
      ? evadePlan.choiceKind === EVADE_CHOICE_KINDS.INITIAL_BRANCH
        ? 'Evade movement requires a defender choice between current orientation and an optional direction wheel before branch resolution can continue.'
        : 'Evade movement requires a defender choice before it can be committed.'
      : sourceOpen
        ? 'Evade movement remains source-open and cannot be committed before adjusted charge distance.'
        : evadePlan.tableExit?.exitsTable
          ? 'Evade movement exits the table and is removed from play before adjusted charge distance; downstream accounting is deferred.'
          : 'Evade movement has no supported player choice and is committed before adjusted charge distance.',
    cannotShootHook: !sourceOpen && !choiceRequired,
    repeatEvadeHook: !sourceOpen && !choiceRequired ? { increment: 1 } : null,
    diagnostics: evadePlan.diagnostics ?? [],
    decisionTrace: evadePlan.decisionTrace ?? [],
    sourceStatus: evadePlan.sourceStatus,
  });
}

export function resolveEvadePlanAvoidanceChoice(evadePlan, choice = {}) {
  const candidates = Array.isArray(evadePlan?.avoidanceCandidates) ? evadePlan.avoidanceCandidates : [];
  const selectedCandidate = candidates.find((candidate) => candidate?.id && candidate.id === choice.candidateId)
    ?? candidates.find((candidate) => (
      candidate?.type === 'slide'
      && candidate.side === choice.side
      && Number(candidate.distanceUd ?? candidate.spentDistanceUd ?? 0) === Number(choice.distanceUd ?? candidate.distanceUd ?? 0)
    ))
    ?? null;

  if (!selectedCandidate?.endPose) {
    return null;
  }

  const inheritedEndHalfTurnHook = selectedCandidate.endHalfTurnHook ?? evadePlan.endHalfTurnHook ?? null;
  const selectedEndPose = inheritedEndHalfTurnHook?.applied
    ? {
      ...selectedCandidate.endPose,
      rotationRadians: Number.isFinite(inheritedEndHalfTurnHook.rotationAfterRadians)
        ? inheritedEndHalfTurnHook.rotationAfterRadians
        : selectedCandidate.endPose.rotationRadians,
    }
    : selectedCandidate.endPose;
  const endHalfTurnHook = inheritedEndHalfTurnHook?.applied
    ? {
      ...inheritedEndHalfTurnHook,
      rotationBeforeRadians: Number.isFinite(selectedCandidate.endPose.rotationRadians)
        ? selectedCandidate.endPose.rotationRadians
        : inheritedEndHalfTurnHook.rotationBeforeRadians,
      rotationAfterRadians: Number.isFinite(inheritedEndHalfTurnHook.rotationAfterRadians)
        ? inheritedEndHalfTurnHook.rotationAfterRadians
        : selectedEndPose.rotationRadians,
    }
    : inheritedEndHalfTurnHook;

  return createEvadePlan({
    ...evadePlan,
    endPose: selectedEndPose,
    spentAvoidanceUd: selectedCandidate.spentDistanceUd ?? selectedCandidate.distanceUd ?? 0,
    remainingDistanceUd: selectedCandidate.remainingDistanceUd ?? Math.max(0, Number(evadePlan.distanceUd ?? 0) - Number(selectedCandidate.distanceUd ?? 0)),
    avoidanceSteps: selectedCandidate.type === 'straight'
      ? []
      : (selectedCandidate.avoidanceSteps?.length > 0 ? selectedCandidate.avoidanceSteps : [selectedCandidate]),
    tableExit: selectedCandidate.tableExit ?? null,
    endHalfTurnHook,
    pathSegments: null,
    choiceRequired: false,
    choiceKind: EVADE_CHOICE_KINDS.NONE,
    diagnostics: [],
    sourceStatus: 'verified',
  });
}

function getEvadeCandidateAvoidanceSteps(candidate) {
  if (Array.isArray(candidate?.avoidanceSteps) && candidate.avoidanceSteps.length > 0) {
    return candidate.avoidanceSteps;
  }

  if (candidate?.type === 'straight') {
    return [];
  }

  return candidate ? [candidate] : [];
}

function doesEvadeCandidateMatchChoicePath(candidate, choicePathStepIds = []) {
  if (!Array.isArray(choicePathStepIds) || choicePathStepIds.length === 0) {
    return true;
  }

  const steps = getEvadeCandidateAvoidanceSteps(candidate);
  if (steps.length < choicePathStepIds.length) {
    return false;
  }

  return choicePathStepIds.every((stepId, index) => getEvadeStepIdPart(steps[index]) === stepId);
}

export function getEvadeChoiceFrontierStepIds(candidates = [], choicePathStepIds = []) {
  const nextStepIds = new Set();

  candidates.forEach((candidate) => {
    if (!doesEvadeCandidateMatchChoicePath(candidate, choicePathStepIds)) {
      return;
    }

    const steps = getEvadeCandidateAvoidanceSteps(candidate);
    const nextStep = steps[choicePathStepIds.length] ?? null;
    const nextStepId = getEvadeStepIdPart(nextStep);
    if (nextStepId) {
      nextStepIds.add(nextStepId);
    }
  });

  return nextStepIds;
}