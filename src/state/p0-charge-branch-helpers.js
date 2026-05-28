import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_HANDOFF_STATUSES,
  createChargeBranchDistanceState,
  createChargeBranchRollClaim,
  createChargeFollowThroughResolution,
  createEvadeChoiceHandoff,
  resolveAdjustedChargeDistanceRoll,
  resolveEvadeDistanceRoll,
} from '../engine/charge/index.js';
import { getUnitMovementBudgetUd } from '../engine/movement/budget.js';
import { COMMAND_PLAYER_IDS } from './p0-command-context.js';
import { SETUP_VIEW_MODES } from './p0-setup.js';

export function reanchorChargePreviewToSecondaryTarget(preview, gameState, secondaryRequest, secondaryDeclarationSnapshot) {
  if (!secondaryRequest?.unitId || !secondaryDeclarationSnapshot) {
    return preview;
  }

  const secondaryTargetSnapshot = gameState.units.find((unit) => unit.id === secondaryRequest.unitId) ?? null;
  const secondaryContactEvent = secondaryDeclarationSnapshot.contactEvent ?? null;

  return {
    ...preview,
    intent: preview?.intent
      ? {
          ...preview.intent,
          targetUnitId: secondaryRequest.unitId,
          targetSnapshot: secondaryTargetSnapshot,
        }
      : preview?.intent ?? null,
    contactEvents: secondaryContactEvent
      ? [
        secondaryContactEvent,
        ...(Array.isArray(preview?.contactEvents) ? preview.contactEvents.slice(1) : []),
      ]
      : preview?.contactEvents ?? [],
    declarationSnapshot: secondaryDeclarationSnapshot,
    followThroughResolution: createChargeFollowThroughResolution({
      ...preview?.followThroughResolution,
      selectedTargetId: secondaryRequest.unitId,
    }),
  };
}

export function createChargeReactionBranchDistanceClaim(gameState, preview, reactionRequest, handoffStatus, declarationSnapshot) {
  if (handoffStatus !== CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED) {
    return createChargeBranchDistanceState();
  }

  const nextHistory = Array.isArray(preview?.branchDistanceRoll?.history)
    ? preview.branchDistanceRoll.history.map((entry) => createChargeBranchDistanceState(entry))
    : [];

  if (preview?.branchDistanceRoll?.claim || preview?.branchDistanceRoll?.result) {
    nextHistory.push(createChargeBranchDistanceState({
      claim: preview?.branchDistanceRoll?.claim ?? null,
      result: preview?.branchDistanceRoll?.result ?? null,
    }));
  }

  return createChargeBranchDistanceState({
    history: nextHistory,
    claim: createChargeBranchRollClaim({
      reason: CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
      actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
      reactingUnitId: reactionRequest?.unitId ?? preview.intent?.targetUnitId ?? null,
      chargingUnitId: preview.intent?.unitId ?? null,
      targetUnitId: reactionRequest?.unitId ?? preview.intent?.targetUnitId ?? null,
      declarationSnapshot: declarationSnapshot ?? null,
      actionLogToken: reactionRequest?.actionLogToken ?? null,
    }),
  });
}

export function createChargeBranchDistanceClaim(gameState, preview, primaryRequest, handoffStatus) {
  return createChargeReactionBranchDistanceClaim(
    gameState,
    preview,
    primaryRequest,
    handoffStatus,
    preview?.declarationSnapshot ?? null,
  );
}

export function createAdjustedChargeDistanceClaim(gameState, preview) {
  const nextHistory = Array.isArray(preview?.branchDistanceRoll?.history)
    ? preview.branchDistanceRoll.history.map((entry) => createChargeBranchDistanceState(entry))
    : [];

  if (preview?.branchDistanceRoll?.claim || preview?.branchDistanceRoll?.result) {
    nextHistory.push(createChargeBranchDistanceState({
      claim: preview?.branchDistanceRoll?.claim ?? null,
      result: preview?.branchDistanceRoll?.result ?? null,
    }));
  }

  return createChargeBranchDistanceState({
    history: nextHistory,
    claim: createChargeBranchRollClaim({
      reason: CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE,
      actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
      reactingUnitId: preview?.reactionDecision?.unitId ?? preview.intent?.targetUnitId ?? null,
      chargingUnitId: preview.intent?.unitId ?? null,
      targetUnitId: preview.intent?.targetUnitId ?? null,
      declarationSnapshot: preview.declarationSnapshot ?? null,
      actionLogToken: preview?.branchDistanceRoll?.claim?.actionLogToken ?? null,
    }),
  });
}

function getChargeBranchDistanceRollBaseUd(gameState, preview) {
  const reason = preview?.branchDistanceRoll?.claim?.reason ?? null;
  const unitId = reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE
    ? preview?.intent?.unitId ?? null
    : preview?.branchDistanceRoll?.claim?.reactingUnitId
      ?? preview?.secondaryReactionDecision?.unitId
      ?? preview?.reactionDecision?.unitId
      ?? preview?.intent?.targetUnitId
      ?? null;
  const targetUnit = gameState.units.find((unit) => unit.id === unitId) ?? null;

  return getUnitMovementBudgetUd({
    selectedUnit: targetUnit,
    units: gameState.units,
  });
}

function shouldNeverReduceChargeBranchDistance(gameState, preview) {
  const reason = preview?.branchDistanceRoll?.claim?.reason ?? null;
  if (reason !== CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
    return false;
  }

  const chargingUnitId = preview?.intent?.unitId ?? null;
  const chargingUnit = gameState.units.find((unit) => unit.id === chargingUnitId) ?? null;
  return String(chargingUnit?.troopType ?? '').toLowerCase() === 'heavy-infantry';
}

export function resolveChargeBranchDistanceResult(gameState, preview, dieRoll) {
  const claim = preview?.branchDistanceRoll?.claim ?? null;
  if (!claim) {
    return null;
  }

  const baseDistanceUd = getChargeBranchDistanceRollBaseUd(gameState, preview);
  if (claim.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
    return resolveAdjustedChargeDistanceRoll({
      dieRoll,
      baseDistanceUd,
      claim,
      neverReduce: shouldNeverReduceChargeBranchDistance(gameState, preview),
    });
  }

  return resolveEvadeDistanceRoll({
    dieRoll,
    baseDistanceUd,
    claim,
  });
}

function getUnitScenarioLabel(gameState, unitId) {
  const unit = gameState?.units?.find((candidate) => candidate.id === unitId) ?? null;
  return unit?.scenarioLabel ?? unit?.id ?? unitId ?? 'unknown unit';
}

function getSetupViewModeForPlayer(playerId) {
  return playerId === COMMAND_PLAYER_IDS.PLAYER_TWO
    ? SETUP_VIEW_MODES.PLAYER_TWO
    : SETUP_VIEW_MODES.PLAYER_ONE;
}

export function createEvadeChoiceHandoffFromMove(gameState, evadeMove) {
  if (evadeMove?.status !== 'choice-required' || !evadeMove?.reactingUnitId) {
    return createEvadeChoiceHandoff();
  }

  const reactingUnit = gameState.units.find((unit) => unit.id === evadeMove.reactingUnitId) ?? null;
  const reactingPlayerId = reactingUnit?.owner ?? null;
  const targetLabel = getUnitScenarioLabel(gameState, evadeMove.reactingUnitId);

  return createEvadeChoiceHandoff({
    status: 'pending',
    reactingUnitId: evadeMove.reactingUnitId,
    reactingPlayerId,
    targetLabel,
    prompt: `${targetLabel} darf ausweichen. Bitte Spieler ${reactingPlayerId === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'B' : 'A'} den Ausweichzug machen.`,
    nextViewMode: getSetupViewModeForPlayer(reactingPlayerId),
    returnViewMode: gameState.setupViewMode ?? SETUP_VIEW_MODES.CANONICAL,
  });
}