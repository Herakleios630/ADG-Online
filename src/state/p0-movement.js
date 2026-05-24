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
import { getCommandPointCostBreakdown, spendCommandPoints } from '../engine/command/index.js';

export {
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from '../engine/movement/model.js';

function createMovementOrderCommandSnapshot(snapshot = {}) {
  return {
    status: snapshot.status ?? 'placeholder',
    unitId: snapshot.unitId ?? null,
    corpsId: snapshot.corpsId ?? null,
    distanceUd: Number.isFinite(snapshot.distanceUd) ? snapshot.distanceUd : null,
    commandRangeUd: Number.isFinite(snapshot.commandRangeUd) ? snapshot.commandRangeUd : null,
    label: snapshot.label ?? 'Order command status pending.',
    sourceStatus: snapshot.sourceStatus ?? 'placeholder',
  };
}

function getCurrentOrderCommandPointDiagnostic(gameState, movementState) {
  if (
    !movementState?.selectedCommandId
    || movementState.preview?.status !== 'accepted'
    || !Array.isArray(movementState.preview?.segments)
    || movementState.preview.segments.length === 0
  ) {
    return {
      blocked: false,
      costBreakdown: null,
      diagnostic: null,
    };
  }

  const available = gameState.commandContext?.commandPoints?.available;
  if (!Number.isInteger(available)) {
    return {
      blocked: false,
      costBreakdown: null,
      diagnostic: {
        id: 'command-point-cost',
        label: 'Command points',
        status: 'placeholder',
        text: 'Command-point cost check is pending because the active corps has no concrete CP snapshot yet.',
      },
    };
  }

  const orderSnapshot = getFrozenMovementOrderCommandSnapshot(gameState, movementState);
  if (orderSnapshot.status !== 'in-command' && orderSnapshot.status !== 'out-of-command') {
    return {
      blocked: false,
      costBreakdown: null,
      diagnostic: {
        id: 'command-point-cost',
        label: 'Command points',
        status: 'placeholder',
        text: 'Command-point cost check is pending because the order command snapshot is not yet resolved.',
      },
    };
  }

  if (gameState.commandContext?.commander?.engagedInCombat) {
    return {
      blocked: true,
      costBreakdown: null,
      diagnostic: {
        id: 'command-point-cost',
        label: 'Command points',
        status: 'blocked',
        text: 'Command-point cost check stays blocked because the active commander is marked as engaged in combat and that surcharge path is not source-closed in the current P6 subset.',
      },
    };
  }

  const costBreakdown = getCommandPointCostBreakdown({
    inCommand: orderSnapshot.status === 'in-command',
    useFreeCommandPoint: shouldUseFreeCommandPointForCurrentOrder(gameState, movementState),
  });
  const blocked = costBreakdown.totalCost > available;
  const usesFreeCommandPoint = Boolean(costBreakdown.usesFreeCommandPoint);

  return {
    blocked,
    costBreakdown,
    diagnostic: {
      id: 'command-point-cost',
      label: 'Command points',
      status: blocked ? 'blocked' : 'verified',
      text: blocked
        ? `Current order needs ${costBreakdown.totalCost} CP but only ${available} CP remain for the active corps.`
        : usesFreeCommandPoint
          ? `Current order uses the free CP for the base order and costs ${costBreakdown.totalCost} total CP from the corps pool.`
          : `Current order costs ${costBreakdown.totalCost} CP and ${available} CP are available for the active corps.`,
    },
  };
}

export function getFrozenMovementOrderCommandSnapshot(gameState, movementState = gameState.movement) {
  if (movementState?.orderCommandSnapshot) {
    return movementState.orderCommandSnapshot;
  }

  const selectedUnitId = gameState.selectedUnitId ?? null;
  const liveSnapshot = gameState.commandContext?.inCommand ?? null;

  return createMovementOrderCommandSnapshot({
    ...liveSnapshot,
    unitId: liveSnapshot?.unitId ?? selectedUnitId,
  });
}

export function createInitialMovementState() {
  return {
    selectedCommandId: null,
    draft: null,
    preview: createMovementPreview(),
    confirmation: createMovementConfirmation(),
    validationSnapshot: createMovementValidationSnapshot(),
    orderCommandSnapshot: null,
    useFreeCommandPoint: false,
  };
}

export function hasUnitFinishedMovementPhase(unit) {
  return Boolean(
    unit
      && (
        Number(unit.advanceUsedUd ?? 0) > 0
        || Boolean(unit.slideUsedThisMovementPhase)
        || Boolean(unit.stayedThisMovementPhase)
      )
  );
}

export function canUseFreeCommandPointForCurrentOrder(gameState, selectedUnit = gameState.units.find((unit) => unit.id === gameState.selectedUnitId) || null) {
  if (!selectedUnit) {
    return false;
  }

  if (selectedUnit.isCommander && !selectedUnit.hasIncludedCommander) {
    return false;
  }

  if (Number(gameState.commandContext?.commandPoints?.free ?? 0) < 1) {
    return false;
  }

  const attachedUnitId = gameState.commandContext?.commander?.attachedUnitId ?? null;
  return Boolean(selectedUnit.hasIncludedCommander || (attachedUnitId && attachedUnitId === selectedUnit.id));
}

function shouldUseFreeCommandPointForCurrentOrder(gameState, movementState = gameState.movement) {
  return Boolean(movementState?.useFreeCommandPoint)
    && canUseFreeCommandPointForCurrentOrder(gameState);
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

export function getCurrentOrderCommandPointCostBreakdown(gameState, movementState = gameState.movement) {
  return getCurrentOrderCommandPointDiagnostic(gameState, movementState).costBreakdown;
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
  const commandPointCheck = getCurrentOrderCommandPointDiagnostic(gameState, movementState);
  const effectiveValidationSnapshot = createMovementValidationSnapshot({
    ...validationSnapshot,
    status: commandPointCheck.blocked
      ? MOVEMENT_VALIDATION_STATUSES.INVALID
      : validationSnapshot.status,
    diagnostics: commandPointCheck.diagnostic
      ? [...validationSnapshot.diagnostics, commandPointCheck.diagnostic]
      : validationSnapshot.diagnostics,
  });

  return {
    ...movementState,
    validationSnapshot: effectiveValidationSnapshot,
    confirmation: applyValidationToConfirmation(movementState.confirmation, effectiveValidationSnapshot),
  };
}

export function spendCommandPointsForCurrentOrder(gameState, movementState = gameState.movement) {
  const costBreakdown = getCurrentOrderCommandPointCostBreakdown(gameState, movementState);
  if (!costBreakdown) {
    return {
      ok: true,
      nextGameState: gameState,
    };
  }

  const spendResult = spendCommandPoints(
    gameState.commandContext.commandPoints,
    costBreakdown,
    { unitId: movementState.orderCommandSnapshot?.unitId ?? gameState.selectedUnitId ?? null },
  );

  if (!spendResult.ok) {
    return {
      ok: false,
      nextGameState: {
        ...gameState,
        movement: withMovementValidationSnapshot(gameState, {
          ...movementState,
          confirmation: createMovementConfirmation({
            status: MOVEMENT_CONFIRMATION_STATUSES.BLOCKED,
            readyCommandId: null,
          }),
        }),
      },
    };
  }

  return {
    ok: true,
    nextGameState: {
      ...gameState,
      commandContext: {
        ...gameState.commandContext,
        commandPoints: spendResult.nextState,
      },
    },
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

  if (hasUnitFinishedMovementPhase(selectedUnit)) {
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
      orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
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
      orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
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
      orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
    }),
  };
}

export function reduceSetUseFreeCommandPointForOrder(gameState, useFreeCommandPoint) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  return {
    ...gameState,
    movement: withMovementValidationSnapshot(gameState, {
      ...gameState.movement,
      useFreeCommandPoint: Boolean(useFreeCommandPoint) && canUseFreeCommandPointForCurrentOrder(gameState),
    }),
  };
}

export function reduceClearMovementDraft(gameState) {
  return {
    ...gameState,
    movement: createInitialMovementState(),
  };
}