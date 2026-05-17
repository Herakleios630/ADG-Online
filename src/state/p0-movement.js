import {
  createMovementConfirmation,
  createMovementDraft,
  createMovementPreview,
  getCommittedMovementPreviewSegments,
  getLastCommittedMovementPreviewSegment,
  getMovementPreviewSpentBudgetUd,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
} from '../engine/movement/model.js';
import {
  buildMovementValidationSnapshot,
  createMovementValidationSnapshot,
  MOVEMENT_VALIDATION_STATUSES,
} from '../engine/movement/validation.js';

export {
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from '../engine/movement/model.js';

export function createInitialMovementState() {
  return {
    selectedCommandId: null,
    draft: null,
    preview: createMovementPreview(),
    confirmation: createMovementConfirmation(),
    validationSnapshot: createMovementValidationSnapshot(),
  };
}

const MIN_NON_SLIDE_DISTANCE_FOR_SLIDE_UD = 1;

export function doesMovementPreviewContainCommand(preview, commandId) {
  return getCommittedMovementPreviewSegments(preview).some((segment) => segment.commandId === commandId);
}

export function requiresSlideQualifiedMovement(preview) {
  return doesMovementPreviewContainCommand(preview, MOVEMENT_COMMAND_IDS.SLIDE);
}

export function getSlideQualifiedMovementDistanceUd(preview) {
  return requiresSlideQualifiedMovement(preview)
    ? getMovementPreviewSpentBudgetUd(preview)
    : 0;
}

export function createConfirmationForPreview(preview) {
  if (preview.status === 'accepted' && (!requiresSlideQualifiedMovement(preview) || getSlideQualifiedMovementDistanceUd(preview) >= MIN_NON_SLIDE_DISTANCE_FOR_SLIDE_UD)) {
    return createMovementConfirmation({
      status: MOVEMENT_CONFIRMATION_STATUSES.READY,
      readyCommandId: getLastCommittedMovementPreviewSegment(preview)?.commandId ?? null,
    });
  }

  if (preview.status === 'accepted') {
    return createMovementConfirmation({
      status: MOVEMENT_CONFIRMATION_STATUSES.BLOCKED,
      readyCommandId: null,
    });
  }

  if (preview.status === 'rejected') {
    return createMovementConfirmation({
      status: MOVEMENT_CONFIRMATION_STATUSES.BLOCKED,
      readyCommandId: null,
    });
  }

  return createMovementConfirmation();
}

export function buildGameMovementValidationSnapshot(gameState, movementState = gameState.movement) {
  const selectedUnit = gameState.units.find((unit) => unit.id === gameState.selectedUnitId) || null;

  return buildMovementValidationSnapshot({
    selectedUnit,
    selectedCommandId: movementState.selectedCommandId,
    preview: movementState.preview,
    commandContext: gameState.commandContext,
    units: gameState.units,
  });
}

function applyValidationToConfirmation(confirmation, validationSnapshot) {
  if (validationSnapshot.status !== MOVEMENT_VALIDATION_STATUSES.INVALID) {
    return confirmation;
  }

  return createMovementConfirmation({
    status: MOVEMENT_CONFIRMATION_STATUSES.BLOCKED,
    readyCommandId: null,
  });
}

export function withMovementValidationSnapshot(gameState, movementState) {
  const validationSnapshot = buildGameMovementValidationSnapshot(gameState, movementState);

  return {
    ...movementState,
    validationSnapshot,
    confirmation: applyValidationToConfirmation(movementState.confirmation, validationSnapshot),
  };
}

/**
 * Returns true only when the active player owns the selected unit and the active
 * phase is Movement. This is the P5-06 gate: movement commands from the wrong
 * player or in the wrong phase are silently rejected.
 */
export function isMovementCommandAllowed(gameState) {
  if (gameState.setup.isActive) {
    return false;
  }

  if (gameState.commandContext.currentPhaseId !== 'movement') {
    return false;
  }

  const selectedUnit = gameState.units.find((u) => u.id === gameState.selectedUnitId) ?? null;

  if (!selectedUnit) {
    return false;
  }

  return selectedUnit.owner === gameState.commandContext.activePlayerId;
}

export function reduceSelectMovementCommand(gameState, commandId) {
  if (gameState.setup.isActive) {
    return {
      ...gameState,
      movement: createInitialMovementState(),
    };
  }

  if (!isMovementCommandAllowed(gameState)) {
    return gameState;
  }

  return {
    ...gameState,
    movement: {
      ...gameState.movement,
      selectedCommandId: commandId,
      draft: null,
      preview: createMovementPreview(),
      confirmation: createMovementConfirmation(),
      validationSnapshot: createMovementValidationSnapshot(),
    },
  };
}

export function reduceSetMovementDraft(gameState, draft) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  if (!isMovementCommandAllowed(gameState)) {
    return gameState;
  }

  const normalizedDraft = createMovementDraft(draft);

  return {
    ...gameState,
    movement: withMovementValidationSnapshot(gameState, {
      ...gameState.movement,
      selectedCommandId: normalizedDraft.commandId,
      draft: normalizedDraft,
      preview: createMovementPreview(),
      confirmation: createMovementConfirmation(),
    }),
  };
}

export function reduceSetMovementPreview(gameState, preview) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  if (!isMovementCommandAllowed(gameState)) {
    return gameState;
  }

  const normalizedPreview = createMovementPreview(preview);

  return {
    ...gameState,
    movement: withMovementValidationSnapshot(gameState, {
      ...gameState.movement,
      preview: normalizedPreview,
      confirmation: createConfirmationForPreview(normalizedPreview),
    }),
  };
}

export function reduceClearMovementDraft(gameState) {
  return {
    ...gameState,
    movement: createInitialMovementState(),
  };
}