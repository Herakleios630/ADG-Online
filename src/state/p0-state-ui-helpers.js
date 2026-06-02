import { createInitialChargePreview } from '../engine/charge/index.js';
import { syncCommandContextSnapshots } from './p0-command-context.js';
import { createInitialAdvanceState } from './p0-advance.js';
import { createInitialMovementState, withMovementValidationSnapshot } from './p0-movement.js';
import { MELEE_PROCEDURE_STATUSES } from './p9-melee-v2.js';
import { createInitialShootingPreviewState } from './p0-shooting.js';
import { createInitialSlideState } from './p0-slide.js';
import { createInitialWheelState } from './p0-wheel.js';
import { createInitialCommandMenuState, createInitialCommanderFreeMovePreview } from './p0-state-initializers.js';

const IDLE_CHARGE_PREVIEW_STATUS = 'idle';

export function isUnitSelectionLockedByPendingMove(gameState, nextUnitId) {
  if (nextUnitId === gameState.selectedUnitId) {
    return false;
  }

  const hasPendingMovementPreview = Array.isArray(gameState.movement?.preview?.segments)
    && gameState.movement.preview.segments.length > 0;
  const hasPendingCommanderPreview = gameState.commanderFreeMovePreview?.status === 'targeting'
    || gameState.commanderFreeMovePreview?.status === 'ready';
  const hasPendingChargePreview = gameState.chargePreview?.status
    && gameState.chargePreview.status !== IDLE_CHARGE_PREVIEW_STATUS;
  return hasPendingMovementPreview || hasPendingCommanderPreview || hasPendingChargePreview;
}

export function resetMovementCommandUi(gameState) {
  return {
    ...gameState,
    commandMenu: createInitialCommandMenuState(),
    movement: createInitialMovementState(),
    chargePreview: createInitialChargePreview(),
    commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
    ...createInitialAdvanceState(),
    ...createInitialSlideState(),
    ...createInitialWheelState(),
  };
}

export function setActiveCommandMenuBranch(gameState, branch) {
  return {
    ...gameState,
    commandMenu: {
      ...createInitialCommandMenuState(),
      activeBranch: branch ?? null,
    },
  };
}

export function resolveEffectiveCommandMenuBranch(gameState, selectedUnit = null) {
  if (gameState?.setup?.isActive || !selectedUnit) {
    return null;
  }

  const shootingPhaseActive = gameState?.commandContext?.currentPhaseId === 'shooting';
  const meleePhaseActive = gameState?.commandContext?.currentPhaseId === 'melee';

  const hasPendingChargePreview = gameState?.chargePreview?.status !== IDLE_CHARGE_PREVIEW_STATUS
    && gameState?.chargePreview?.intent?.unitId === selectedUnit.id;
  if (hasPendingChargePreview) {
    return 'charge';
  }

  const hasPendingCommanderPreview = gameState?.commanderFreeMovePreview?.status !== 'idle'
    && gameState?.commanderFreeMovePreview?.unitId === selectedUnit.id;
  if (hasPendingCommanderPreview) {
    return gameState.commanderFreeMovePreview.mode === 'attach' ? 'attach' : 'move';
  }

  const hasPendingShootingPreview = shootingPhaseActive
    && gameState?.shooting?.preview?.status !== createInitialShootingPreviewState().status
    && gameState?.shooting?.preview?.shooterUnitId === selectedUnit.id;
  if (hasPendingShootingPreview) {
    return 'shoot';
  }

  const hasPendingShootingResolutionDraft = shootingPhaseActive
    && gameState?.shooting?.resolutionDraft?.status === 'active'
    && gameState?.shooting?.resolutionDraft?.shooterUnitId === selectedUnit.id;
  if (hasPendingShootingResolutionDraft) {
    return 'shoot';
  }

  const hasActiveMeleeProcedure = meleePhaseActive
    && (
      gameState?.melee?.status === MELEE_PROCEDURE_STATUSES.ACTIVE
      || gameState?.melee?.status === MELEE_PROCEDURE_STATUSES.PREVIEW_READY
      || gameState?.melee?.status === MELEE_PROCEDURE_STATUSES.APPLIED
    )
    && (selectedUnit?.engagedInMelee || selectedUnit?.meleePendingOpponentId);
  if (hasActiveMeleeProcedure) {
    return 'melee';
  }

  const hasPendingMovementPreview = Boolean(
    gameState?.movement?.selectedCommandId
      || gameState?.movement?.preview?.status !== 'idle'
      || gameState?.advanceModeActive
      || gameState?.slideModeActive
      || gameState?.wheelModeActive,
  );
  if (hasPendingMovementPreview) {
    return 'move';
  }

  return gameState?.commandMenu?.activeBranch ?? null;
}

export function reduceSetCommanderEngagedDiagnostic(gameState, isEngaged) {
  if (gameState.setup.isActive || !gameState.commandContext?.commander?.unitId) {
    return gameState;
  }

  const nextGameState = syncCommandContextSnapshots({
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      commander: {
        ...gameState.commandContext.commander,
        engagedInCombat: Boolean(isEngaged),
      },
    },
  });

  return {
    ...nextGameState,
    movement: withMovementValidationSnapshot(nextGameState, nextGameState.movement),
  };
}