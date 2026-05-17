export const COMMAND_CONTEXT_SOURCE_STATUSES = {
  PLACEHOLDER: 'placeholder',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const COMMAND_PLAYER_IDS = {
  PLAYER_ONE: 'player-1',
  PLAYER_TWO: 'player-2',
};

export function createInitialCommandContextState(currentPhaseId) {
  return {
    activePlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
    activeCorpsId: null,
    currentPhaseId,
    sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
    commander: {
      commanderId: null,
      label: 'Commander hook pending',
      sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
    },
    commandPoints: {
      available: null,
      label: 'CP placeholder pending source check',
      sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
    },
    inCommand: {
      status: 'placeholder',
      label: 'In-command hook pending source check',
      sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
    },
  };
}

export function reduceSetActiveBattlePhase(gameState, phaseId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  return {
    ...gameState,
    phaseTracker: {
      ...gameState.phaseTracker,
      mode: 'battle',
      currentBattlePhaseId: phaseId,
    },
    commandContext: {
      ...gameState.commandContext,
      currentPhaseId: phaseId,
    },
  };
}

export function reduceSetActivePlayer(gameState, activePlayerId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  return {
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      activePlayerId,
    },
  };
}

export function reduceSelectActiveCorps(gameState, activeCorpsId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  const corpsCards = gameState.setup.battlePlan.corpsCards ?? [];
  const nextActiveCorpsId = corpsCards.some((corpsCard) => corpsCard.id === activeCorpsId)
    ? activeCorpsId
    : null;

  return {
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      activeCorpsId: nextActiveCorpsId,
    },
  };
}