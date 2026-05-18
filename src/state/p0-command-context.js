import { createCommandPointState as createEngineCommandPointState, evaluateInCommand, generateCommandPoints } from '../engine/command/index.js';

export const COMMAND_CONTEXT_SOURCE_STATUSES = {
  PLACEHOLDER: 'placeholder',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const COMMAND_PLAYER_IDS = {
  PLAYER_ONE: 'player-1',
  PLAYER_TWO: 'player-2',
};

export const COMMAND_CORPS_STATUSES = {
  NOT_YET_ACTIVATED: 'not-yet-activated',
  ACTIVE: 'active',
  SPENT: 'spent',
};

const COMMANDER_QUALITY_CP_VALUES = {
  ordinary: 0,
  competent: 1,
  brilliant: 2,
};

function createCorpsActivationState(corpsCards = []) {
  return {
    corps: corpsCards.map((corpsCard, index) => ({
      corpsId: corpsCard.id,
      label: corpsCard.label,
      ownerId: corpsCard.owner,
      status: COMMAND_CORPS_STATUSES.NOT_YET_ACTIVATED,
      activationIndex: index,
      activationRoll: null,
      sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
    })),
    activeSequence: 0,
    activationHistory: [],
    sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
  };
}

function createCommandPointState() {
  return {
    available: null,
    spent: 0,
    free: 0,
    lastRoll: null,
    ledger: [],
    label: 'CP placeholder pending source check',
    sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
  };
}

function getCommanderValueForQuality(quality) {
  const normalizedQuality = String(quality ?? '').toLowerCase();
  return Object.hasOwn(COMMANDER_QUALITY_CP_VALUES, normalizedQuality)
    ? COMMANDER_QUALITY_CP_VALUES[normalizedQuality]
    : null;
}

function getDeterministicActivationRoll(sequence, activationIndex) {
  return ((sequence + activationIndex + 2) % 6) + 1;
}

function createActivatedCommandPointState(commanderUnit, sequence, activationIndex) {
  const commanderValue = getCommanderValueForQuality(commanderUnit?.commanderQuality);
  if (commanderValue == null) {
    return createEngineCommandPointState({
      available: null,
      spent: 0,
      free: 0,
      lastRoll: null,
      ledger: [],
    });
  }

  const dieRoll = getDeterministicActivationRoll(sequence, activationIndex);
  return generateCommandPoints({
    dieRoll,
    commanderValue,
    freeCp: 1,
  });
}

function createCommanderState() {
  return {
    commanderId: null,
    unitId: null,
    corpsId: null,
    attachedUnitId: null,
    quality: null,
    rangeUd: null,
    engagedInCombat: false,
    label: 'Commander hook pending',
    sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
  };
}

function createInCommandState() {
  return {
    status: 'placeholder',
    unitId: null,
    corpsId: null,
    distanceUd: null,
    commandRangeUd: null,
    label: 'In-command hook pending source check',
    sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
  };
}

function createCommanderLabel(commanderUnit) {
  if (!commanderUnit) {
    return 'Commander hook pending';
  }

  const role = commanderUnit.hasIncludedCommander ? 'Included commander' : 'Commander';
  const quality = commanderUnit.commanderQuality ?? 'unknown quality';
  const range = Number.isFinite(commanderUnit.commandRangeUd) ? `${commanderUnit.commandRangeUd} UD` : 'unknown range';
  return `${role}: ${quality} / ${range}`;
}

function toCorpsSlotId(corpsId) {
  const raw = String(corpsId ?? '').toLowerCase();
  if (!raw) {
    return null;
  }

  const normalized = raw.replaceAll('_', '-');
  const match = normalized.match(/corps-(\d+)/);
  if (!match) {
    return null;
  }

  return `corps-${match[1]}`;
}

function getCommanderUnitForActiveCorps(gameState, activeCorpsId = gameState.commandContext.activeCorpsId) {
  if (!activeCorpsId) {
    return null;
  }

  const activeCorpsSlotId = toCorpsSlotId(activeCorpsId);

  return gameState.units.find((unit) => (
    unit.owner === gameState.commandContext.activePlayerId
      && toCorpsSlotId(unit.corpsId) === activeCorpsSlotId
      && (unit.isCommander || unit.hasIncludedCommander)
  )) ?? null;
}

export function syncCommandContextSnapshots(gameState, selectedUnitId = gameState.selectedUnitId) {
  const commanderUnit = getCommanderUnitForActiveCorps(gameState);
  const selectedUnit = gameState.units.find((unit) => unit.id === selectedUnitId) ?? null;
  const inCommand = evaluateInCommand({
    commanderUnit,
    selectedUnit,
    activeCorpsId: gameState.commandContext.activeCorpsId,
  });
  const preserveCommanderEngaged = Boolean(
    commanderUnit
      && gameState.commandContext?.commander?.unitId === commanderUnit.id
      && gameState.commandContext?.commander?.engagedInCombat,
  );

  return {
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      commander: commanderUnit
        ? {
            commanderId: commanderUnit.id,
            unitId: commanderUnit.id,
            corpsId: commanderUnit.corpsId,
            attachedUnitId: commanderUnit.hasIncludedCommander ? commanderUnit.id : (commanderUnit.attachedUnitId ?? null),
            quality: commanderUnit.commanderQuality ?? null,
            rangeUd: commanderUnit.commandRangeUd ?? null,
            engagedInCombat: preserveCommanderEngaged,
            label: createCommanderLabel(commanderUnit),
            sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
          }
        : createCommanderState(),
      inCommand: {
        status: inCommand.status,
        unitId: inCommand.unitId,
        corpsId: inCommand.corpsId,
        distanceUd: inCommand.distanceUd,
        commandRangeUd: inCommand.commandRangeUd,
        label: inCommand.label,
        sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      },
    },
  };
}

export function createInitialCommandContextState(currentPhaseId, corpsCards = []) {
  return {
    activePlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
    activeCorpsId: null,
    currentPhaseId,
    sourceStatus: COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
    commander: createCommanderState(),
    commandPoints: createCommandPointState(),
    corpsActivation: createCorpsActivationState(corpsCards),
    inCommand: createInCommandState(),
  };
}

export function resetCorpsActivationState(corpsActivation, corpsCards = []) {
  const initial = createCorpsActivationState(corpsCards);
  return {
    ...corpsActivation,
    corps: initial.corps,
    activeSequence: 0,
    activationHistory: [],
    sourceStatus: corpsActivation?.sourceStatus ?? COMMAND_CONTEXT_SOURCE_STATUSES.PLACEHOLDER,
  };
}

export function reduceBeginCorpsActivation(gameState, corpsId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  const corpsCards = gameState.setup.battlePlan.corpsCards ?? [];
  const validCorpsId = corpsCards.some((corpsCard) => corpsCard.id === corpsId) ? corpsId : null;
  if (!validCorpsId) {
    return gameState;
  }

  const corpsRecord = gameState.commandContext.corpsActivation.corps.find((entry) => entry.corpsId === validCorpsId);
  if (!corpsRecord || corpsRecord.status !== COMMAND_CORPS_STATUSES.NOT_YET_ACTIVATED) {
    return gameState;
  }

  if (gameState.commandContext.activeCorpsId && gameState.commandContext.activeCorpsId !== validCorpsId) {
    return gameState;
  }

  const nextSequence = gameState.commandContext.corpsActivation.activeSequence + 1;
  const provisionalGameState = {
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      activeCorpsId: validCorpsId,
    },
  };
  const commanderUnit = getCommanderUnitForActiveCorps(provisionalGameState, validCorpsId);
  const activationRoll = getDeterministicActivationRoll(nextSequence, corpsRecord.activationIndex);
  const commandPoints = createActivatedCommandPointState(commanderUnit, nextSequence, corpsRecord.activationIndex);

  return syncCommandContextSnapshots({
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      activeCorpsId: validCorpsId,
      commandPoints,
      corpsActivation: {
        ...gameState.commandContext.corpsActivation,
        corps: gameState.commandContext.corpsActivation.corps.map((entry) =>
          entry.corpsId === validCorpsId
            ? {
                ...entry,
                status: COMMAND_CORPS_STATUSES.ACTIVE,
                activationRoll,
              }
            : entry,
        ),
        activeSequence: nextSequence,
        activationHistory: [
          ...gameState.commandContext.corpsActivation.activationHistory,
          {
            corpsId: validCorpsId,
            status: COMMAND_CORPS_STATUSES.ACTIVE,
            sequence: nextSequence,
            activationRoll,
          },
        ],
      },
    },
  });
}

export function reduceCompleteActiveCorps(gameState, corpsId = gameState.commandContext.activeCorpsId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  const activeCorpsId = gameState.commandContext.activeCorpsId;
  if (!activeCorpsId || activeCorpsId !== corpsId) {
    return gameState;
  }

  const corpsRecord = gameState.commandContext.corpsActivation.corps.find((entry) => entry.corpsId === corpsId);
  if (!corpsRecord || corpsRecord.status !== COMMAND_CORPS_STATUSES.ACTIVE) {
    return gameState;
  }

  return syncCommandContextSnapshots({
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      activeCorpsId: null,
      commandPoints: createCommandPointState(),
      corpsActivation: {
        ...gameState.commandContext.corpsActivation,
        corps: gameState.commandContext.corpsActivation.corps.map((entry) =>
          entry.corpsId === corpsId
            ? {
                ...entry,
                status: COMMAND_CORPS_STATUSES.SPENT,
              }
            : entry,
        ),
        activationHistory: [
          ...gameState.commandContext.corpsActivation.activationHistory,
          {
            corpsId,
            status: COMMAND_CORPS_STATUSES.SPENT,
            sequence: gameState.commandContext.corpsActivation.activeSequence,
          },
        ],
      },
    },
  });
}

export function reduceSetActiveBattlePhase(gameState, phaseId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  return syncCommandContextSnapshots({
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
  });
}

export function reduceSetActivePlayer(gameState, activePlayerId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  return syncCommandContextSnapshots({
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      activePlayerId,
    },
  });
}

export function reduceSelectActiveCorps(gameState, activeCorpsId) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  return reduceBeginCorpsActivation(gameState, activeCorpsId);
}