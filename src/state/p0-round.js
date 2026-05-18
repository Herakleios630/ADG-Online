import {
  COMMAND_CORPS_STATUSES,
  reduceCompleteActiveCorps,
  resetCorpsActivationState,
  syncCommandContextSnapshots,
} from './p0-command-context.js';

export const ROUND_PHASE_IDS = {
  CORPS_MOVEMENT: 'corps-movement',
  SHOOTING: 'shooting',
  COMBAT: 'combat',
  ROUT_PURSUIT: 'rout-pursuit',
  VICTORY_CHECK: 'victory-check',
};

export const ROUND_PHASE_LABELS = {
  [ROUND_PHASE_IDS.CORPS_MOVEMENT]: 'Bewegung',
  [ROUND_PHASE_IDS.SHOOTING]: 'Schiessen',
  [ROUND_PHASE_IDS.COMBAT]: 'Kampf',
  [ROUND_PHASE_IDS.ROUT_PURSUIT]: 'Flucht und Verfolgung',
  [ROUND_PHASE_IDS.VICTORY_CHECK]: 'Siegbedingungen',
};

export const ROUND_DIALOG_TYPES = {
  ROUND_START: 'round-start',
  CORPS_SELECTION: 'corps-selection',
  NEXT_CORPS_PROMPT: 'next-corps-prompt',
  PHASE_ANNOUNCE: 'phase-announce',
  PLAYER_SWITCH: 'player-switch',
};

// Post-movement phases in turn order
const POST_MOVEMENT_PHASE_SEQUENCE = [
  ROUND_PHASE_IDS.SHOOTING,
  ROUND_PHASE_IDS.COMBAT,
  ROUND_PHASE_IDS.ROUT_PURSUIT,
  ROUND_PHASE_IDS.VICTORY_CHECK,
];

const ROUND_TO_BATTLE_PHASE_ID = {
  [ROUND_PHASE_IDS.CORPS_MOVEMENT]: 'movement',
  [ROUND_PHASE_IDS.SHOOTING]: 'shooting',
  [ROUND_PHASE_IDS.COMBAT]: 'melee',
  [ROUND_PHASE_IDS.ROUT_PURSUIT]: 'cleanup',
  [ROUND_PHASE_IDS.VICTORY_CHECK]: 'victory',
};

function setGameBattlePhase(gameState, phaseId) {
  return {
    ...gameState,
    phaseTracker: {
      ...gameState.phaseTracker,
      currentBattlePhaseId: phaseId,
    },
    commandContext: {
      ...gameState.commandContext,
      currentPhaseId: phaseId,
    },
  };
}

export function createInitialRoundState() {
  return {
    roundNumber: 1,
    turnPlayerId: 'player-1',
    roundPhase: ROUND_PHASE_IDS.CORPS_MOVEMENT,
    dialog: {
      type: ROUND_DIALOG_TYPES.ROUND_START,
      phaseLabel: null,
    },
  };
}

export function getAvailableCorpsForPlayer(corpsActivation, playerId) {
  return corpsActivation.corps.filter(
    (entry) => entry.ownerId === playerId && entry.status === COMMAND_CORPS_STATUSES.NOT_YET_ACTIVATED,
  );
}

function resetPlayerUnitsMovement(units, playerId) {
  return units.map((unit) =>
    unit.owner === playerId
      ? {
          ...unit,
          advanceUsedUd: 0,
          slideUsedThisMovementPhase: false,
          stayedThisMovementPhase: false,
          commanderMovePhaseStartXUd: null,
          commanderMovePhaseStartYUd: null,
          attachOriginXUd: null,
          attachOriginYUd: null,
          attachOriginRotationRadians: null,
          attachOriginAdvanceUsedUd: null,
        }
      : unit,
  );
}

function clearPlayerCommanderAttachments(units, playerId) {
  return units.map((unit) => (
    unit.owner === playerId
      ? {
          ...unit,
          attachedUnitId: null,
          attachedCommanderId: null,
          attachOriginXUd: null,
          attachOriginYUd: null,
          attachOriginRotationRadians: null,
          attachOriginAdvanceUsedUd: null,
        }
      : unit
  ));
}

function resetAllCorpsActivation(commandContext) {
  return {
    ...commandContext,
    activeCorpsId: null,
    activePlayerId: 'player-1',
    corpsActivation: {
      ...commandContext.corpsActivation,
      corps: commandContext.corpsActivation.corps.map((entry) => ({
        ...entry,
        status: COMMAND_CORPS_STATUSES.NOT_YET_ACTIVATED,
        activationRoll: null,
      })),
      activeSequence: 0,
      activationHistory: [],
    },
  };
}

function createIdleCommandPointState(commandPoints) {
  return {
    ...commandPoints,
    available: null,
    spent: 0,
    free: 0,
    lastRoll: null,
    ledger: [],
    label: 'CP placeholder pending source check',
  };
}

function resetTurnCommandState(gameState, playerId) {
  const corpsCards = gameState.setup.battlePlan?.corpsCards ?? [];

  return syncCommandContextSnapshots({
    ...gameState,
    selectedUnitId: null,
    commandContext: {
      ...gameState.commandContext,
      activePlayerId: playerId,
      activeCorpsId: null,
      commandPoints: createIdleCommandPointState(gameState.commandContext.commandPoints),
      corpsActivation: resetCorpsActivationState(gameState.commandContext.corpsActivation, corpsCards),
    },
  }, null);
}

function buildPhaseAnnounceState(round, phaseId) {
  return {
    ...round,
    roundPhase: phaseId,
    dialog: {
      type: ROUND_DIALOG_TYPES.PHASE_ANNOUNCE,
      phaseLabel: ROUND_PHASE_LABELS[phaseId],
    },
  };
}

// ROUND_BEGIN: "Beginnen" clicked on round-start or player-switch dialog.
// Opens corps-selection for the current turn player and resets that player's movement state.
export function reduceRoundBegin(gameState) {
  const round = gameState.round;
  if (!round) return gameState;
  if (
    round.dialog.type !== ROUND_DIALOG_TYPES.ROUND_START
    && round.dialog.type !== ROUND_DIALOG_TYPES.PLAYER_SWITCH
  ) {
    return gameState;
  }
  const nextGameState = resetTurnCommandState({
    ...gameState,
    units: resetPlayerUnitsMovement(gameState.units, round.turnPlayerId),
    round: {
      ...round,
      roundPhase: ROUND_PHASE_IDS.CORPS_MOVEMENT,
      dialog: { type: ROUND_DIALOG_TYPES.CORPS_SELECTION, phaseLabel: null },
    },
  }, round.turnPlayerId);

  return setGameBattlePhase(nextGameState, ROUND_TO_BATTLE_PHASE_ID[ROUND_PHASE_IDS.CORPS_MOVEMENT]);
}

// REQUEST_NEXT_CORPS: "Nächstes Corps" button or equivalent.
// Completes the active corps if any, then opens next-corps-prompt (if corps remain) or advances to shooting.
export function reduceRequestNextCorps(gameState) {
  const round = gameState.round;
  if (!round || round.roundPhase !== ROUND_PHASE_IDS.CORPS_MOVEMENT) return gameState;
  if (round.dialog.type !== null) return gameState;

  let nextGameState = gameState;
  if (gameState.commandContext.activeCorpsId) {
    const afterComplete = reduceCompleteActiveCorps(gameState, gameState.commandContext.activeCorpsId);
    if (afterComplete !== gameState) {
      nextGameState = afterComplete;
    }
  }

  const remaining = getAvailableCorpsForPlayer(
    nextGameState.commandContext.corpsActivation,
    round.turnPlayerId,
  );

  if (remaining.length > 0) {
    return {
      ...nextGameState,
      round: {
        ...round,
        dialog: { type: ROUND_DIALOG_TYPES.NEXT_CORPS_PROMPT, phaseLabel: null },
      },
    };
  }

  // No remaining corps — advance to shooting
  return setGameBattlePhase({
    ...nextGameState,
    round: buildPhaseAnnounceState(round, ROUND_PHASE_IDS.SHOOTING),
  }, ROUND_TO_BATTLE_PHASE_ID[ROUND_PHASE_IDS.SHOOTING]);
}

// CONFIRM_NEXT_CORPS: "Ja" clicked in next-corps-prompt dialog.
export function reduceConfirmNextCorps(gameState) {
  const round = gameState.round;
  if (!round || round.dialog.type !== ROUND_DIALOG_TYPES.NEXT_CORPS_PROMPT) return gameState;

  return {
    ...gameState,
    round: {
      ...round,
      dialog: { type: ROUND_DIALOG_TYPES.CORPS_SELECTION, phaseLabel: null },
    },
  };
}

// SKIP_REMAINING_CORPS: "Nein" clicked in next-corps-prompt dialog.
export function reduceSkipRemainingCorps(gameState) {
  const round = gameState.round;
  if (!round || round.dialog.type !== ROUND_DIALOG_TYPES.NEXT_CORPS_PROMPT) return gameState;

  return setGameBattlePhase({
    ...gameState,
    round: buildPhaseAnnounceState(round, ROUND_PHASE_IDS.SHOOTING),
  }, ROUND_TO_BATTLE_PHASE_ID[ROUND_PHASE_IDS.SHOOTING]);
}

// ADVANCE_ROUND_PHASE: "Weiter" clicked in phase-announce dialog.
// Sequences through shooting → combat → rout-pursuit → victory-check.
// After P1 victory-check: switches to P2 (shows player-switch dialog).
// After P2 victory-check: increments round number and resets all corps for round N+1.
export function reduceAdvanceRoundPhase(gameState) {
  const round = gameState.round;
  if (!round || round.dialog.type !== ROUND_DIALOG_TYPES.PHASE_ANNOUNCE) return gameState;

  const currentIndex = POST_MOVEMENT_PHASE_SEQUENCE.indexOf(round.roundPhase);
  const nextIndex = currentIndex + 1;

  if (nextIndex < POST_MOVEMENT_PHASE_SEQUENCE.length) {
    // Advance to the next post-movement phase
    const nextPhaseId = POST_MOVEMENT_PHASE_SEQUENCE[nextIndex];
    return setGameBattlePhase({
      ...gameState,
      round: buildPhaseAnnounceState(round, nextPhaseId),
    }, ROUND_TO_BATTLE_PHASE_ID[nextPhaseId]);
  }

  // Victory-check done for current player
  if (round.turnPlayerId === 'player-1') {
    // Switch to Player 2's turn
    return setGameBattlePhase({
      ...gameState,
      units: clearPlayerCommanderAttachments(gameState.units, 'player-1'),
      round: {
        ...round,
        turnPlayerId: 'player-2',
        roundPhase: ROUND_PHASE_IDS.CORPS_MOVEMENT,
        dialog: { type: ROUND_DIALOG_TYPES.PLAYER_SWITCH, phaseLabel: null },
      },
    }, ROUND_TO_BATTLE_PHASE_ID[ROUND_PHASE_IDS.CORPS_MOVEMENT]);
  }

  // Player 2 also done — start the next round
  const nextRoundNumber = round.roundNumber + 1;
  return setGameBattlePhase({
    ...gameState,
    units: clearPlayerCommanderAttachments(gameState.units, 'player-2'),
    commandContext: resetAllCorpsActivation(gameState.commandContext),
    round: {
      roundNumber: nextRoundNumber,
      turnPlayerId: 'player-1',
      roundPhase: ROUND_PHASE_IDS.CORPS_MOVEMENT,
      dialog: { type: ROUND_DIALOG_TYPES.ROUND_START, phaseLabel: null },
    },
  }, ROUND_TO_BATTLE_PHASE_ID[ROUND_PHASE_IDS.CORPS_MOVEMENT]);
}
