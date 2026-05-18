import test from 'node:test';
import assert from 'node:assert/strict';

import { BATTLEFIELD_PROFILE_IDS } from '../data/battlefield-profiles.js';
import { COMMAND_CP_REASON_CODES } from '../engine/command/index.js';
import { degreesToRadians } from '../engine/geometry/index.js';
import { getWheelAngleRadiansForDistanceUd } from '../engine/movement/wheel.js';
import {
  ACTION_TYPES,
  BATTLE_PHASE_IDS,
  COMMAND_PLAYER_IDS,
  OVERLAY_MODES,
  SCREEN_IDS,
  SETUP_STEP_IDS,
  createInitialAppState,
  reduceAppState,
} from './p0-state.js';
import {
  getSlideQualifiedMovementDistanceUd,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from './p0-movement.js';
import { getMovementPreviewAdvanceDistanceUd, getMovementPreviewResolvedDistanceUd } from '../engine/movement/index.js';
import { MOVEMENT_SLIDE_SIDES } from './p0-slide.js';

function startNewGame(state = createInitialAppState()) {
  return reduceAppState(state, { type: ACTION_TYPES.START_NEW_GAME });
}

function advanceToBattlefield(state = createInitialAppState()) {
  const nextState = startNewGame(state);

  return {
    ...nextState,
    game: {
      ...nextState.game,
      setup: {
        ...nextState.game.setup,
        isActive: false,
      },
      commandContext: {
        ...nextState.game.commandContext,
        currentPhaseId: BATTLE_PHASE_IDS.MOVEMENT,
        activePlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
      },
    },
  };
}

function startDirectBattle(state = createInitialAppState()) {
  return reduceAppState(state, { type: ACTION_TYPES.START_DIRECT_BATTLE });
}

function selectTestUnit(state) {
  const withActiveCorps = state.game.commandContext.currentPhaseId === BATTLE_PHASE_IDS.MOVEMENT
    && state.game.commandContext.activePlayerId === COMMAND_PLAYER_IDS.PLAYER_ONE
    && !state.game.commandContext.activeCorpsId
    ? reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' })
    : state;

  return reduceAppState(withActiveCorps, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
}

function completeSetupToBattle(state = startNewGame()) {
  let nextState = state;

  while (nextState.game.setup.currentStepId !== SETUP_STEP_IDS.READY) {
    nextState = reduceAppState(nextState, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  return reduceAppState(nextState, { type: ACTION_TYPES.COMPLETE_SETUP });
}

function exhaustCurrentPlayerCorps(state) {
  const corpsIds = ['corps-1', 'corps-2', 'corps-3'];
  let nextState = state;

  corpsIds.forEach((corpsId, index) => {
    nextState = reduceAppState(nextState, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId });
    nextState = reduceAppState(nextState, { type: ACTION_TYPES.REQUEST_NEXT_CORPS });

    if (index < corpsIds.length - 1) {
      nextState = reduceAppState(nextState, { type: ACTION_TYPES.CONFIRM_NEXT_CORPS });
    }
  });

  return nextState;
}

test('new game defaults to 200 points', () => {
  const state = createInitialAppState();

  assert.equal(state.shell.newGame.points, 200);
  assert.equal(state.shell.currentScreen, SCREEN_IDS.MAIN_MENU);
  assert.equal(state.game.battlefieldProfileId, BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
});

test('starting a new game enters the battlefield setup flow', () => {
  const state = startNewGame();

  assert.equal(state.shell.currentScreen, SCREEN_IDS.BATTLEFIELD);
  assert.equal(state.game.setup.isActive, true);
  assert.equal(state.game.setup.currentStepId, SETUP_STEP_IDS.FORMAT);
  assert.equal(state.game.setupViewMode, 'canonical');
});

test('locking the current setup step marks it as fixed', () => {
  let state = startNewGame();

  state = reduceAppState(state, { type: ACTION_TYPES.LOCK_CURRENT_SETUP_STEP });

  assert.deepEqual(state.game.setup.lockedStepIds, [SETUP_STEP_IDS.FORMAT]);
});

test('direct battle start skips setup and enters the battlefield movement phase', () => {
  const state = startDirectBattle();

  assert.equal(state.shell.currentScreen, SCREEN_IDS.BATTLEFIELD);
  assert.equal(state.game.setup.isActive, false);
  assert.equal(state.game.phaseTracker.mode, 'battle');
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.MOVEMENT);
  assert.equal(state.game.round?.dialog?.type, 'round-start');
});

test('round begin opens corps selection and selecting a corps closes the popup', () => {
  let state = startDirectBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  assert.equal(state.game.round.dialog.type, 'corps-selection');
  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.MOVEMENT);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-1');
  assert.equal(state.game.round.dialog.type, null);
});

test('requesting the next corps spends the active corps and can branch into shooting', () => {
  let state = startDirectBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });

  state = reduceAppState(state, { type: ACTION_TYPES.REQUEST_NEXT_CORPS });
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-1')?.status, 'spent');
  assert.equal(state.game.round.dialog.type, 'next-corps-prompt');

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_NEXT_CORPS });
  assert.equal(state.game.round.dialog.type, 'corps-selection');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-2' });
  state = reduceAppState(state, { type: ACTION_TYPES.REQUEST_NEXT_CORPS });
  state = reduceAppState(state, { type: ACTION_TYPES.SKIP_REMAINING_CORPS });

  assert.equal(state.game.round.roundPhase, 'shooting');
  assert.equal(state.game.round.dialog.type, 'phase-announce');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.SHOOTING);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.SHOOTING);
});

test('round flow switches to player two and then starts a fresh next round', () => {
  let state = startDirectBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  state = exhaustCurrentPlayerCorps(state);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.roundPhase, 'combat');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.MELEE);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.roundPhase, 'rout-pursuit');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.CLEANUP);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.roundPhase, 'victory-check');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.VICTORY);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.turnPlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.equal(state.game.round.dialog.type, 'player-switch');
  assert.equal(state.game.round.roundPhase, 'corps-movement');

  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  assert.equal(state.game.round.dialog.type, 'corps-selection');
  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.ok(state.game.commandContext.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-1');
  assert.equal(state.game.commandContext.commander.unitId, 'test-unit-2');

  state = exhaustCurrentPlayerCorps(state);
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });

  assert.equal(state.game.round.roundNumber, 2);
  assert.equal(state.game.round.turnPlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.round.dialog.type, 'round-start');
  assert.ok(state.game.commandContext.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));
});

test('selecting a unit from a non-active corps is ignored', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c2-mi-1' });

  assert.equal(state.game.selectedUnitId, null);
});

test('command context initializes as a placeholder skeleton', () => {
  const state = createInitialAppState();

  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
  assert.equal(state.game.commandContext.sourceStatus, 'placeholder');
  assert.equal(state.game.commandContext.commandPoints.available, null);
  assert.equal(state.game.commandContext.inCommand.status, 'placeholder');
});

test('command context remains JSON-serializable', () => {
  const state = completeSetupToBattle();
  const serialized = JSON.stringify(state.game.commandContext);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(parsed.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
  assert.equal(parsed.sourceStatus, 'placeholder');
  assert.equal(parsed.corpsActivation.corps.length, 3);
  assert.ok(parsed.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));
  assert.equal(parsed.commandPoints.spent, 0);
  assert.equal(parsed.commandPoints.free, 0);
  assert.deepEqual(parsed.commandPoints.ledger, []);
  assert.equal(parsed.commander.attachedUnitId, null);
  assert.equal(parsed.inCommand.unitId, null);
});

test('command context activates, completes, and resets corps lifecycle deterministically', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.ok(state.game.commandContext.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-2');
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-2').status, 'active');
  assert.equal(state.game.commandContext.corpsActivation.activationHistory.at(-1).status, 'active');

  state = reduceAppState(state, {
    type: ACTION_TYPES.COMPLETE_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-2').status, 'spent');
  assert.equal(state.game.commandContext.corpsActivation.activationHistory.at(-1).status, 'spent');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  assert.equal(state.game.commandContext.activeCorpsId, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.COMMAND,
  });
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-2').status, 'spent');
  assert.ok(state.game.commandContext.corpsActivation.corps.some((corps) => corps.status === 'not-yet-activated'));
});

test('corps activation generates a deterministic placeholder CP snapshot and roll log', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });

  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.lastRoll, 4);
  assert.equal(state.game.commandContext.commandPoints.free, 1);
  assert.equal(state.game.commandContext.commandPoints.ledger.length, 2);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-1').activationRoll, 4);
  assert.equal(state.game.commandContext.corpsActivation.activationHistory.at(-1).activationRoll, 4);

  state = reduceAppState(state, {
    type: ACTION_TYPES.COMPLETE_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });

  assert.equal(state.game.commandContext.commandPoints.available, null);
  assert.equal(state.game.commandContext.commandPoints.lastRoll, null);
  assert.deepEqual(state.game.commandContext.commandPoints.ledger, []);
});

test('active corps selection resolves the active commander snapshot', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });

  assert.equal(state.game.commandContext.commander.unitId, 'test-unit-1');
  assert.equal(state.game.commandContext.commander.quality, 'brilliant');
  assert.equal(state.game.commandContext.commander.rangeUd, 8);
  assert.match(state.game.commandContext.commander.label, /brilliant/i);
});

test('selected unit receives an in-command snapshot against the active corps commander', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commandContext.inCommand.status, 'in-command');
  assert.equal(state.game.commandContext.inCommand.unitId, 'p1-c1-cav-1');
  assert.ok(state.game.commandContext.inCommand.distanceUd < state.game.commandContext.inCommand.commandRangeUd);
});

test('selected unit becomes out of command when moved beyond strict command range', () => {
  let state = completeSetupToBattle();

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'p1-c1-cav-1'
          ? { ...unit, xUd: 18, yUd: unit.yUd }
          : unit
      )),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commandContext.inCommand.status, 'out-of-command');
  assert.ok(state.game.commandContext.inCommand.distanceUd > state.game.commandContext.inCommand.commandRangeUd);
});

test('commander-engaged diagnostic toggle produces a reproducible blocked order case', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_COMMANDER_ENGAGED_DIAGNOSTIC,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.commandContext.commander.engagedInCombat, true);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
  assert.match(
    state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'commander-engaged')?.text ?? '',
    /engaged in combat/i,
  );

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_COMMANDER_ENGAGED_DIAGNOSTIC,
    isActive: false,
  });

  assert.equal(state.game.commandContext.commander.engagedInCombat, false);
});

test('selected commander uses attach targeting, then confirms attachment and follows the host move', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.commandContext.commandPoints.free, 1);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'targeting');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');
  assert.equal(state.game.commanderFreeMovePreview.targetUnitId, 'p1-c1-cav-1');

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  const attachedHost = state.game.units.find((unit) => unit.id === 'p1-c1-cav-1');
  const attachedCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.equal(attachedHost?.attachedCommanderId, 'test-unit-1');
  assert.equal(attachedCommander?.attachedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.commandContext.commander.attachedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.commandContext.commandPoints.free, 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.DETACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.units.find((unit) => unit.id === 'p1-c1-cav-1')?.attachedCommanderId, 'test-unit-1');
  assert.equal(state.game.units.find((unit) => unit.id === 'test-unit-1')?.attachedUnitId, 'p1-c1-cav-1');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const movedHost = state.game.units.find((unit) => unit.id === 'p1-c1-cav-1');
  const movedCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(movedHost);
  assert.ok(movedCommander);
  assert.equal(Number(Math.abs(movedHost.yUd - movedCommander.yUd).toFixed(3)), Number(((movedHost.depthUd / 2) + (movedCommander.depthUd / 2)).toFixed(3)));
});

test('attached commanders are released automatically when the player turn ends', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      round: {
        ...state.game.round,
        turnPlayerId: 'player-1',
        roundPhase: 'victory-check',
        dialog: { type: 'phase-announce', phaseLabel: 'Siegbedingungen' },
      },
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });

  assert.equal(state.game.units.find((unit) => unit.id === 'p1-c1-cav-1')?.attachedCommanderId, null);
  assert.equal(state.game.units.find((unit) => unit.id === 'test-unit-1')?.attachedUnitId, null);
});

test('resetting an attached commander clears the host attachment relation as well', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESET_TEST_UNITS,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.units.find((unit) => unit.id === 'test-unit-1')?.attachedUnitId, null);
  assert.equal(state.game.units.find((unit) => unit.id === 'p1-c1-cav-1')?.attachedCommanderId, null);
  assert.equal(state.game.commandContext.commander.attachedUnitId, null);
});

test('resetting a moved host restores its attached commander to the pre-attach position', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });

  const initialCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(initialCommander);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialCommander.xUd + 2).toFixed(3)),
    yUd: initialCommander.yUd,
    dragOriginXUd: initialCommander.xUd,
    dragOriginYUd: initialCommander.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'move');

  const preAttachCommander = {
    xUd: Number(state.game.commanderFreeMovePreview.xUd),
    yUd: Number(state.game.commanderFreeMovePreview.yUd),
    advanceUsedUd: Number(state.game.commanderFreeMovePreview.nextSpentUd),
  };
  assert.equal(preAttachCommander.advanceUsedUd, 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const afterHostMoveCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(afterHostMoveCommander);
  assert.notEqual(afterHostMoveCommander.yUd, preAttachCommander.yUd);

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESET_TEST_UNITS,
    unitId: 'p1-c1-cav-1',
  });

  const resetCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  const resetHost = state.game.units.find((unit) => unit.id === 'p1-c1-cav-1');
  assert.ok(resetCommander);
  assert.ok(resetHost);
  assert.equal(resetCommander.attachedUnitId, null);
  assert.equal(resetHost.attachedCommanderId, null);
  assert.equal(resetCommander.xUd, preAttachCommander.xUd);
  assert.equal(resetCommander.yUd, preAttachCommander.yUd);
  assert.equal(resetCommander.advanceUsedUd, preAttachCommander.advanceUsedUd);
});

test('attach targeting still accepts a host when only the host footprint touches the remaining commander radius', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });

  const initialCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(initialCommander);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialCommander.xUd + 4.2).toFixed(3)),
    yUd: initialCommander.yUd,
    dragOriginXUd: initialCommander.xUd,
    dragOriginYUd: initialCommander.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 4.2);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'p1-c1-cav-1'
          ? {
              ...unit,
              xUd: Number((state.game.commanderFreeMovePreview.xUd + 1.3).toFixed(3)),
              yUd: state.game.commanderFreeMovePreview.yUd,
            }
          : unit
      )),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.targetUnitId, 'p1-c1-cav-1');
  assert.ok(Number(state.game.commanderFreeMovePreview.nextSpentUd) <= 5);
});

test('movement keeps the in-command snapshot frozen from order start across chained commands', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.orderCommandSnapshot.status, 'in-command');
  assert.equal(state.game.movement.orderCommandSnapshot.unitId, 'p1-c1-cav-1');

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.orderCommandSnapshot.status, 'in-command');
  assert.match(state.game.movement.orderCommandSnapshot.label, /In command at/);
});

test('a later move rechecks command status with a fresh order snapshot', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  assert.equal(state.game.movement.orderCommandSnapshot, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-2',
  });

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.orderCommandSnapshot.status, 'out-of-command');
  assert.match(state.game.movement.orderCommandSnapshot.label, /Out of command at 9\.00 UD\./);
});

test('confirm advance spends CP for the frozen order snapshot, including the out-of-command surcharge', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  assert.equal(state.game.commandContext.commandPoints.available, 2);
  assert.equal(state.game.commandContext.commandPoints.spent, 2);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-2).reasonCode, 'base-order');
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, 'out-of-command');
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'p1-c1-cav-1');

test('included commander host unit can optionally spend the free CP on its movement order', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c3-hi-1',
  });

  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.free, 1);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).amount, -1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'p1-c3-hi-1');
});
});

test('movement preview blocks confirmation when the current order costs more CP than remain', () => {
  let state = completeSetupToBattle();
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        commandPoints: {
          ...state.game.commandContext.commandPoints,
          available: 1,
          label: '1 CP available',
        },
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const cpDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-point-cost');
  assert.ok(cpDiagnostic);
  assert.equal(cpDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(state.game.commandContext.commandPoints.available, 1);
});

test('P6 command fixture includes three corps per player with requested compositions', () => {
  const state = createInitialAppState();
  const fixtureUnits = state.game.units.filter((unit) => unit.fixtureTag === 'p6-command-fixture');

  assert.equal(fixtureUnits.length, 20);

  for (const owner of [COMMAND_PLAYER_IDS.PLAYER_ONE, COMMAND_PLAYER_IDS.PLAYER_TWO]) {
    const ownerUnits = fixtureUnits.filter((unit) => unit.owner === owner);
    const ownerCorpsIds = new Set(ownerUnits.map((unit) => unit.corpsId));

    assert.equal(ownerUnits.length, 10);
    assert.equal(ownerCorpsIds.size, 3);

    const corpsOneUnits = ownerUnits.filter((unit) => unit.corpsId.endsWith('corps-1'));
    assert.equal(corpsOneUnits.filter((unit) => unit.troopType === 'general').length, 1);
    assert.equal(corpsOneUnits.filter((unit) => unit.troopType === 'cavalry').length, 2);

    const corpsTwoUnits = ownerUnits.filter((unit) => unit.corpsId.endsWith('corps-2'));
    assert.equal(corpsTwoUnits.filter((unit) => unit.troopType === 'general').length, 1);
    assert.equal(corpsTwoUnits.filter((unit) => unit.troopType === 'medium-infantry').length, 2);

    const corpsThreeUnits = ownerUnits.filter((unit) => unit.corpsId.endsWith('corps-3'));
    assert.equal(corpsThreeUnits.filter((unit) => unit.troopType === 'heavy-infantry').length, 4);
    assert.equal(corpsThreeUnits.filter((unit) => unit.hasIncludedCommander).length, 1);
  }
});

test('P6 command fixture uses requested commander qualities, ranges, and base dimensions', () => {
  const state = createInitialAppState();
  const fixtureUnits = state.game.units.filter((unit) => unit.fixtureTag === 'p6-command-fixture');

  const brilliantCommanders = fixtureUnits.filter((unit) => unit.commanderQuality === 'brilliant');
  const competentCommanders = fixtureUnits.filter((unit) => unit.commanderQuality === 'competent');
  const ordinaryCommanders = fixtureUnits.filter((unit) => unit.commanderQuality === 'ordinary');

  assert.equal(brilliantCommanders.length, 2);
  assert.equal(competentCommanders.length, 2);
  assert.equal(ordinaryCommanders.length, 2);

  assert.ok(brilliantCommanders.every((unit) => unit.commandRangeUd === 8));
  assert.ok(competentCommanders.every((unit) => unit.commandRangeUd === 6));
  assert.ok(ordinaryCommanders.every((unit) => unit.commandRangeUd === 4));

  const generals = fixtureUnits.filter((unit) => unit.troopType === 'general');
  const mediumInfantry = fixtureUnits.filter((unit) => unit.troopType === 'medium-infantry');
  const cavalry = fixtureUnits.filter((unit) => unit.troopType === 'cavalry');
  const heavyInfantry = fixtureUnits.filter((unit) => unit.troopType === 'heavy-infantry');

  assert.ok(generals.every((unit) => unit.baseShape === 'circle' && unit.widthUd === 1 && unit.depthUd === 1));
  assert.ok(mediumInfantry.every((unit) => unit.baseShape === 'square' && unit.widthUd === 1 && unit.depthUd === 1));
  assert.ok(cavalry.every((unit) => unit.baseShape === 'rectangle' && unit.widthUd === 1 && unit.depthUd === 0.75));
  assert.ok(heavyInfantry.every((unit) => unit.baseShape === 'rectangle' && unit.widthUd === 1 && unit.depthUd === 0.75));
});

test('P6 command fixture corps are placed side-by-side in each player zone orientation', () => {
  const state = createInitialAppState();
  const fixtureUnits = state.game.units.filter((unit) => unit.fixtureTag === 'p6-command-fixture');

  const playerOneUnits = fixtureUnits.filter((unit) => unit.owner === COMMAND_PLAYER_IDS.PLAYER_ONE);
  const playerTwoUnits = fixtureUnits.filter((unit) => unit.owner === COMMAND_PLAYER_IDS.PLAYER_TWO);

  const playerOneCorpsCenters = new Set(
    playerOneUnits
      .filter((unit) => unit.isCommander)
      .map((unit) => Number(unit.xUd.toFixed(2))),
  );

  const playerTwoCorpsCenters = new Set(
    playerTwoUnits
      .filter((unit) => unit.isCommander)
      .map((unit) => Number(unit.xUd.toFixed(2))),
  );

  assert.equal(playerOneCorpsCenters.size, 2);
  assert.equal(playerTwoCorpsCenters.size, 2);

  assert.ok(playerOneUnits.every((unit) => unit.yUd >= 17));
  assert.ok(playerTwoUnits.every((unit) => unit.yUd <= 3));
  assert.ok(playerOneUnits.every((unit) => unit.facing === 'north' && unit.rotationRadians === 0));
  assert.ok(playerTwoUnits.every((unit) => unit.facing === 'south' && unit.rotationRadians === Math.PI));
});

test('movement state initializes as a serializable placeholder spine', () => {
  const state = createInitialAppState();
  const serialized = JSON.stringify(state.game.movement);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.selectedCommandId, null);
  assert.equal(parsed.draft, null);
  assert.equal(parsed.preview.status, MOVEMENT_PREVIEW_STATUSES.IDLE);
  assert.equal(parsed.preview.sourceStatus, MOVEMENT_SOURCE_STATUSES.PLACEHOLDER);
  assert.equal(parsed.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.IDLE);
});

test('movement draft and preview store declarative serializable command data after setup', () => {
  let state = selectTestUnit(completeSetupToBattle());

  // P5-06: movement commands require active phase = movement.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.MOVEMENT });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_MOVEMENT_COMMAND,
    commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_DRAFT,
    draft: {
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      segments: [
        {
          commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
          unitId: 'test-unit-1',
          startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
          endPose: { xUd: 10, yUd: 8, rotationRadians: 0 },
          distance: { requestedUd: 2, resolvedUd: 2, measurementMode: 'front-edge' },
        },
      ],
      sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
    },
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_PREVIEW,
    preview: {
      status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
      segments: state.game.movement.draft.segments,
      explanations: ['Preview only. No legality checks yet.'],
      sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
    },
  });

  assert.equal(state.game.movement.selectedCommandId, MOVEMENT_COMMAND_IDS.ADVANCE);
  assert.equal(state.game.movement.draft.unitId, 'test-unit-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments[0].endPose.yUd, 8);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
});

test('movement draft state resets during setup and when clearing or changing selection', () => {
  let state = selectTestUnit(startNewGame());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_MOVEMENT_COMMAND,
    commandId: MOVEMENT_COMMAND_IDS.WHEEL,
  });
  assert.equal(state.game.movement.selectedCommandId, null);

  state = selectTestUnit(completeSetupToBattle());
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_DRAFT,
    draft: {
      commandId: MOVEMENT_COMMAND_IDS.SLIDE,
      unitId: 'test-unit-1',
      segments: [],
    },
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CLEAR_MOVEMENT_DRAFT });

  assert.equal(state.game.movement.selectedCommandId, null);
  assert.equal(state.game.movement.draft, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_DRAFT,
    draft: {
      commandId: MOVEMENT_COMMAND_IDS.SLIDE,
      unitId: 'test-unit-1',
      segments: [],
    },
  });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });

  assert.equal(state.game.movement.selectedCommandId, null);
  assert.equal(state.game.movement.draft, null);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.IDLE);
});

test('cancel movement preview clears command ui state without resetting the unit', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_MOVEMENT_PREVIEW });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.slideModeActive, false);
  assert.equal(state.game.wheelModeActive, false);
  assert.equal(state.game.movement.selectedCommandId, null);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.IDLE);
});

test('pending movement preview blocks deselection and switching to another unit until cancel', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-2' });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_MOVEMENT_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });
  assert.equal(state.game.selectedUnitId, null);
});

test('changing active corps does not bypass pending movement order atomicity', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });

  assert.equal(state.game.commandContext.activeCorpsId, 'corps-1');
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.orderCommandSnapshot.unitId, 'p1-c1-cav-1');
});

test('pending commander free move preview also blocks deselection and switching until canceled', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });
  assert.equal(state.game.selectedUnitId, 'test-unit-1');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  assert.equal(state.game.selectedUnitId, 'test-unit-1');

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_COMMANDER_FREE_MOVE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
});

test('movement validation snapshot reports missing active corps as placeholder during preview', () => {
  let state = reduceAppState(advanceToBattlefield(), { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const commandContextDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-context');
  assert.ok(commandContextDiagnostic);
  assert.equal(commandContextDiagnostic.status, 'placeholder');

  const commandLegalityDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-legality');
  assert.ok(commandLegalityDiagnostic);
  assert.equal(commandLegalityDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('confirm advance is blocked when no active corps is selected even if preview exists', () => {
  let state = reduceAppState(advanceToBattlefield(), { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
});

test('movement validation blocks confirmation when the selected unit falls outside the active corps', () => {
  let state = advanceToBattlefield();
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'p1-c2-mi-1');
  assert.ok(initialUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      selectedUnitId: 'p1-c2-mi-1',
      commandContext: {
        ...state.game.commandContext,
        activeCorpsId: 'corps-1',
        currentPhaseId: BATTLE_PHASE_IDS.MOVEMENT,
        activePlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'wrong-corps',
          unitId: 'p1-c2-mi-1',
          corpsId: 'corps-2',
          label: 'Selected unit is outside the active corps.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const commandLegalityDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-legality');
  assert.ok(commandLegalityDiagnostic);
  assert.equal(commandLegalityDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'p1-c2-mi-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
});

test('movement confirmation is blocked for source-sensitive difficult manoeuvre cases in the current P6 subset', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              isCataphract: true,
            }
          : unit
      )),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const difficultDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'difficult-manoeuvre');
  assert.ok(difficultDiagnostic);
  assert.equal(difficultDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('movement confirmation is blocked when the active commander is marked as engaged in combat', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        commander: {
          ...state.game.commandContext.commander,
          engagedInCombat: true,
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const engagedDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'commander-engaged');
  assert.ok(engagedDiagnostic);
  assert.equal(engagedDiagnostic.status, 'blocked');

  const commandPointDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-point-cost');
  assert.ok(commandPointDiagnostic);
  assert.equal(commandPointDiagnostic.status, 'blocked');

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('wheel preview stores left-side wheel state without mutating the unit first', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.LEFT,
    angleRadians: Math.PI / 4,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.rotationRadians, 0);
  assert.equal(state.game.wheelModeActive, true);
  assert.equal(state.game.wheelPivotSide, MOVEMENT_PIVOT_SIDES.LEFT);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments[0].maneuver.pivotSide, MOVEMENT_PIVOT_SIDES.LEFT);
});

test('confirm wheel updates unit pose through reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_WHEEL });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.xUd.toFixed(3)), Number(initialUnit.xUd.toFixed(3)));
  assert.equal(Number(unit.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(Number(unit.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));
  assert.equal(unit.advanceUsedUd, 1.5);
  assert.equal(state.game.wheelModeActive, false);
});

test('wheel preview is blocked during setup and resets advance mode when selected', () => {
  let state = selectTestUnit(startNewGame());

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });

  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.wheelModeActive, false);
  assert.equal(state.game.movement.selectedCommandId, null);
});

test('wheel preview rejects battlefield overflow and blocks confirmation', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              xUd: 0.7,
              yUd: 0.7,
              widthUd: 2,
              depthUd: 1,
            }
          : unit,
      ),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.LEFT,
    angleRadians: Math.PI / 2,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.REJECTED);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('wheel preview stores the chosen fixed pivot side and linear P4 distance fact', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 4,
  });

  assert.equal(state.game.wheelPivotSide, MOVEMENT_PIVOT_SIDES.RIGHT);
  assert.equal(Number(state.game.movement.preview.segments[0].distance.resolvedUd.toFixed(3)), 0.75);
});

test('setup visibility mode can switch to hotseat handoff', () => {
  let state = startNewGame();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SETUP_VIEW_MODE,
    viewMode: 'hotseat-handoff',
  });

  assert.equal(state.game.setupViewMode, 'hotseat-handoff');
});

test('command context can change active player, corps, and battle phase after setup', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_PLAYER,
    playerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });

  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-2');
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.MOVEMENT);
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.MOVEMENT);
});

test('command context ignores player, corps, and phase changes during setup', () => {
  let state = startNewGame();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_PLAYER,
    playerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });

  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
});

test('setup step navigation advances, rewinds, and locks serializable state', () => {
  let state = startNewGame();

  state = reduceAppState(state, { type: ACTION_TYPES.LOCK_CURRENT_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.GO_TO_PREVIOUS_SETUP_STEP });

  assert.deepEqual(state.game.setup.lockedStepIds, [SETUP_STEP_IDS.FORMAT]);
  assert.equal(state.game.setup.currentStepId, SETUP_STEP_IDS.REGION);
});

test('terrain placeholders can be added, selected, updated, locked, and removed during terrain setup', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-1',
      terrainType: 'hill',
      label: 'Hill',
      pose: { xUd: 8, yUd: 8 },
      footprint: { widthUd: 4, depthUd: 2, rotationRadians: 0 },
    },
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
    patch: {
      pose: { xUd: 10, yUd: 9 },
    },
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.LOCK_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
  });

  let placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === 'terrain-1');
  assert.ok(placeholder);
  assert.equal(state.game.setup.terrain.selectedPlaceholderId, 'terrain-1');
  assert.equal(placeholder.pose.xUd, 10);
  assert.equal(placeholder.pose.yUd, 9);
  assert.equal(placeholder.lockState, 'locked');

  state = reduceAppState(state, {
    type: ACTION_TYPES.REMOVE_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
  });

  placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === 'terrain-1');
  assert.equal(placeholder, undefined);
  assert.equal(state.game.setup.terrain.selectedPlaceholderId, null);
});

test('terrain placeholders reject full-footprint placements outside the battlefield', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-outside',
      pose: { xUd: 29, yUd: 19 },
      footprint: { widthUd: 4, depthUd: 4, rotationRadians: 0 },
    },
  });

  assert.equal(state.game.setup.terrain.placeholders.length, 0);
  assert.equal(state.game.setup.terrain.validation.activeSource, 'attempted-placeholder');
  assert.ok(
    state.game.setup.terrain.validation.activeResults.some(
      (result) => result.id === 'battlefield-bounds' && result.ok === false,
    ),
  );
});

test('standard-200 setup starts with two mandatory camp placeholders', () => {
  const state = startNewGame();
  const camps = state.game.setup.setupObjects.placeholders;
  const playerOneCamp = camps.find((setupObject) => setupObject.id === 'camp-player-1');
  const playerTwoCamp = camps.find((setupObject) => setupObject.id === 'camp-player-2');

  assert.equal(camps.length, 2);
  assert.deepEqual(
    camps.map((setupObject) => setupObject.id),
    ['camp-player-1', 'camp-player-2'],
  );
  assert.ok(playerOneCamp);
  assert.ok(playerTwoCamp);
  assert.equal(playerOneCamp.pose.yUd, 18.2);
  assert.equal(playerTwoCamp.pose.yUd, 1.8);
});

test('setup objects can be selected, moved in camps step, and stay inside the battlefield', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.CAMPS) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_SETUP_OBJECT,
    setupObjectId: 'camp-player-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_SETUP_OBJECT,
    setupObjectId: 'camp-player-1',
    patch: {
      pose: { xUd: 7, yUd: 17 },
    },
  });

  const camp = state.game.setup.setupObjects.placeholders.find((setupObject) => setupObject.id === 'camp-player-1');
  assert.ok(camp);
  assert.equal(state.game.setup.setupObjects.selectedObjectId, 'camp-player-1');
  assert.equal(camp.pose.xUd, 7);
  assert.equal(camp.pose.yUd, 17);

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_SETUP_OBJECT,
    setupObjectId: 'camp-player-1',
    patch: {
      pose: { xUd: 29.8, yUd: 19.8 },
    },
  });

  const stillValidCamp = state.game.setup.setupObjects.placeholders.find((setupObject) => setupObject.id === 'camp-player-1');
  assert.ok(stillValidCamp);
  assert.equal(stillValidCamp.pose.xUd, 7);
  assert.equal(stillValidCamp.pose.yUd, 17);
});

test('camp step can add related public setup-object placeholders', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.CAMPS) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_SETUP_OBJECT,
    setupObject: {
      id: 'fortification-1',
      family: 'fortification',
      type: 'fortification',
      label: 'Fortification',
      pose: { xUd: 10, yUd: 16 },
      footprint: { widthUd: 3, depthUd: 0.8, rotationRadians: 0 },
    },
  });

  assert.ok(state.game.setup.setupObjects.placeholders.some((setupObject) => setupObject.id === 'fortification-1'));
  assert.equal(state.game.setup.setupObjects.selectedObjectId, 'fortification-1');
});

test('battle plan stores owner-private corps assignments by field', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.BATTLE_PLAN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_BATTLE_PLAN_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
    corpsId: 'corps-1',
    fieldId: 'left',
  });

  assert.equal(state.game.setup.battlePlan.visibilityScope, 'owner-only');
  assert.equal(state.game.setup.battlePlan.selectedCorpsId, 'corps-1');
  assert.deepEqual(state.game.setup.battlePlan.fieldAssignments.left, ['corps-1']);
});

test('battle plan reassigns corps from one field to another', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.BATTLE_PLAN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
    corpsId: 'corps-2',
    fieldId: 'center',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
    corpsId: 'corps-2',
    fieldId: 'flank-march',
  });

  assert.deepEqual(state.game.setup.battlePlan.fieldAssignments.center, []);
  assert.deepEqual(state.game.setup.battlePlan.fieldAssignments['flank-march'], ['corps-2']);
});

test('ambush markers keep public shell state separate from private contents', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.AMBUSHES) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  assert.equal(state.game.setup.ambushMarkers.markers.length, 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_AMBUSH_MARKER,
    markerId: 'ambush-marker-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_AMBUSH_MARKER_CONTENTS,
    markerId: 'ambush-marker-1',
    privateContents: {
      notes: 'LH behind wood',
    },
  });

  const marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === 'ambush-marker-1');
  assert.ok(marker);
  assert.equal(state.game.setup.ambushMarkers.visibilityScope, 'owner-only');
  assert.equal(state.game.setup.ambushMarkers.selectedMarkerId, 'ambush-marker-1');
  assert.equal(marker.publicShell.label, 'Marker I');
  assert.equal(marker.privateContents.notes, 'LH behind wood');
});

test('ambush marker shell can move inside battlefield but rejects out-of-bounds updates', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.AMBUSHES) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_AMBUSH_MARKER,
    markerId: 'ambush-marker-2',
    patch: {
      pose: { xUd: 11, yUd: 12 },
    },
  });

  let marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === 'ambush-marker-2');
  assert.ok(marker);
  assert.equal(marker.pose.xUd, 11);
  assert.equal(marker.pose.yUd, 12);

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_AMBUSH_MARKER,
    markerId: 'ambush-marker-2',
    patch: {
      pose: { xUd: 29.8, yUd: 19.8 },
    },
  });

  marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === 'ambush-marker-2');
  assert.ok(marker);
  assert.equal(marker.pose.xUd, 11);
  assert.equal(marker.pose.yUd, 12);
});

test('adding an ambush marker auto-selects it for immediate notes editing', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.AMBUSHES) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });

  assert.equal(state.game.setup.ambushMarkers.markers.length, 1);
  assert.equal(state.game.setup.ambushMarkers.selectedMarkerId, 'ambush-marker-1');
});

test('terrain validation tracks source-check warnings for selected road placeholders', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-road',
      terrainType: 'road',
      label: 'Road',
      pose: { xUd: 9, yUd: 8 },
      footprint: { widthUd: 5, depthUd: 1, rotationRadians: 0 },
    },
  });

  assert.ok(
    state.game.setup.terrain.validation.activeResults.some(
      (result) => result.id === 'road-river-source-check' && result.sourceStatus === 'needs-source-check',
    ),
  );
  assert.equal(state.game.setup.terrain.validation.activeSummary.errorCount, 0);
});

test('terrain update keeps last valid placeholder state when an invalid move is attempted', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-1',
      pose: { xUd: 8, yUd: 8 },
      footprint: { widthUd: 4, depthUd: 2, rotationRadians: 0 },
    },
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
    patch: {
      pose: { xUd: 29, yUd: 19 },
    },
  });

  const placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === 'terrain-1');
  assert.ok(placeholder);
  assert.equal(placeholder.pose.xUd, 8);
  assert.equal(placeholder.pose.yUd, 8);
  assert.equal(state.game.setup.terrain.validation.activeSource, 'attempted-placeholder');
  assert.ok(
    state.game.setup.terrain.validation.activeResults.some(
      (result) => result.id === 'battlefield-bounds' && result.ok === false,
    ),
  );
});

test('unit placement is blocked before the deployment setup step', () => {
  let state = selectTestUnit(startNewGame());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 14,
    yUd: 12,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.xUd, initialUnit.xUd);
  assert.equal(unit.yUd, initialUnit.yUd);
});

test('unit placement is allowed during deployment setup step', () => {
  let state = selectTestUnit(startNewGame());

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.DEPLOYMENT) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 14,
    yUd: 12,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.xUd, 14);
  assert.equal(unit.yUd, 12);
  assert.equal(state.game.setup.deployment.visiblePlaceholders[0].pose.xUd, 14);
  assert.equal(state.game.setup.deployment.visiblePlaceholders[0].pose.yUd, 12);
});

test('non-included general drag creates a ghost preview and only moves on confirm', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  const targetXUd = Number((initialGeneral.xUd + 3).toFixed(3));
  const targetYUd = Number((initialGeneral.yUd - 4).toFixed(3));
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: targetXUd,
    yUd: targetYUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
  });

  const previewGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(previewGeneral);
  assert.equal(previewGeneral.xUd, initialGeneral.xUd);
  assert.equal(previewGeneral.yUd, initialGeneral.yUd);
  assert.equal(previewGeneral.advanceUsedUd, 0);
  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.unitId, 'test-unit-1');
  assert.equal(state.game.commanderFreeMovePreview.xUd, targetXUd);
  assert.equal(state.game.commanderFreeMovePreview.yUd, targetYUd);
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 5);

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  const movedGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(movedGeneral);
  assert.equal(movedGeneral.xUd, targetXUd);
  assert.equal(movedGeneral.yUd, targetYUd);
  assert.equal(movedGeneral.advanceUsedUd, 5);
  assert.equal(state.game.commanderFreeMovePreview.status, 'idle');
  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).amount, -1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'test-unit-1');
});

test('free commander split drag spends the free CP only once when the move starts', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);

  const afterFirstConfirm = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(afterFirstConfirm);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((afterFirstConfirm.xUd + 3).toFixed(3)),
    yUd: afterFirstConfirm.yUd,
    dragOriginXUd: afterFirstConfirm.xUd,
    dragOriginYUd: afterFirstConfirm.yUd,
    maxDistanceUd: 3,
    dragSpentUdAtStart: 2,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);
});

test('commander attach targeting uses the current unconfirmed ghost position and remaining budget', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'move');
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'targeting');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');
  assert.equal(state.game.commanderFreeMovePreview.xUd, Number((initialGeneral.xUd + 2).toFixed(3)));
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');
  assert.equal(state.game.commanderFreeMovePreview.targetUnitId, 'p1-c1-cav-1');
  assert.ok(Number(state.game.commanderFreeMovePreview.nextSpentUd) > 2);
  assert.ok(Number(state.game.commanderFreeMovePreview.nextSpentUd) <= 5);
});

test('non-included general free drag is blocked beyond 5 UD', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 5.2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
  });

  const blockedGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(blockedGeneral);
  assert.equal(blockedGeneral.xUd, initialGeneral.xUd);
  assert.equal(blockedGeneral.yUd, initialGeneral.yUd);
  assert.equal(blockedGeneral.advanceUsedUd, 0);
});

test('confirming a general free drag ends that commander movement for the phase', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  const afterFirstConfirm = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(afterFirstConfirm);
  assert.equal(Number(afterFirstConfirm.advanceUsedUd.toFixed(3)), 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((afterFirstConfirm.xUd + 3).toFixed(3)),
    yUd: afterFirstConfirm.yUd,
    dragOriginXUd: afterFirstConfirm.xUd,
    dragOriginYUd: afterFirstConfirm.yUd,
    maxDistanceUd: 3,
    dragSpentUdAtStart: 2,
  });

  const unchangedAfterSecondAttempt = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unchangedAfterSecondAttempt);
  assert.equal(unchangedAfterSecondAttempt.xUd, afterFirstConfirm.xUd);
  assert.equal(unchangedAfterSecondAttempt.yUd, afterFirstConfirm.yUd);
  assert.equal(unchangedAfterSecondAttempt.advanceUsedUd, afterFirstConfirm.advanceUsedUd);
  assert.equal(state.game.commanderFreeMovePreview.status, 'idle');
});

test('stay action marks a selected unit as stayed during movement phase', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.MARK_UNIT_STAY,
    unitId: 'test-unit-1',
  });

  const stayedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(stayedUnit);
  assert.equal(stayedUnit.stayedThisMovementPhase, true);
  assert.equal(stayedUnit.advanceUsedUd, 5);
});

test('non-included general free drag reset restores the drag-start position and refreshes budget', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: Number((initialGeneral.yUd - 1).toFixed(3)),
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  const movedGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(movedGeneral);
  assert.ok((movedGeneral.advanceUsedUd ?? 0) > 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESET_COMMANDER_FREE_MOVE,
    unitId: 'test-unit-1',
  });

  const resetGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(resetGeneral);
  assert.equal(resetGeneral.xUd, initialGeneral.xUd);
  assert.equal(resetGeneral.yUd, initialGeneral.yUd);
  assert.equal(resetGeneral.advanceUsedUd, 0);
  assert.equal(resetGeneral.commanderMovePhaseStartXUd, null);
  assert.equal(resetGeneral.commanderMovePhaseStartYUd, null);
  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).amount, 1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'test-unit-1');
});

test('reset test units only resets the selected unit to the completed setup baseline', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.DEPLOYMENT) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 14,
    yUd: 12,
  });

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.READY) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, { type: ACTION_TYPES.COMPLETE_SETUP });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.MOVEMENT });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const movedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  const otherUnitBeforeReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(movedUnit);
  assert.ok(otherUnitBeforeReset);
  assert.notEqual(movedUnit.yUd, 12);

  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS });

  const resetUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  const otherUnitAfterReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(resetUnit);
  assert.ok(otherUnitAfterReset);
  assert.equal(resetUnit.xUd, 14);
  assert.equal(resetUnit.yUd, 12);
  assert.equal(resetUnit.advanceUsedUd, 0);
  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(otherUnitAfterReset.xUd, otherUnitBeforeReset.xUd);
  assert.equal(otherUnitAfterReset.yUd, otherUnitBeforeReset.yUd);
});

test('reset test units leaves non-selected moved units untouched', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const movedCavalry = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(movedCavalry);

  state = reduceAppState(state, { type: ACTION_TYPES.MARK_UNIT_STAY, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-2' });
  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS });

  const cavalryAfterOtherReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  const selectedAfterReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-2');
  assert.ok(cavalryAfterOtherReset);
  assert.ok(selectedAfterReset);
  assert.equal(cavalryAfterOtherReset.xUd, movedCavalry.xUd);
  assert.equal(cavalryAfterOtherReset.yUd, movedCavalry.yUd);
  assert.equal(selectedAfterReset.advanceUsedUd, 0);
});

test('after movement is confirmed the same unit stays selectable for reset but cannot receive more movement commands', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 1);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-2' });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-2');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  const beforeRetry = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(beforeRetry);
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const afterRetry = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(afterRetry);
  assert.equal(afterRetry.yUd, beforeRetry.yUd);
  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 1);

  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS, unitId: 'p1-c1-cav-1' });
  const resetUnit = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(resetUnit);
  assert.equal(resetUnit.advanceUsedUd, 0);
});

test('reset test units refunds a free CP consumed by the selected unit movement order', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);

  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS });

  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 1);
});

test('included general host unit cannot use commander free drag movement', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-1' });

  const initialUnit = state.game.units.find((candidate) => candidate.id === 'p1-c3-hi-1');
  assert.ok(initialUnit);
  assert.equal(initialUnit.hasIncludedCommander, true);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'p1-c3-hi-1',
    xUd: Number((initialUnit.xUd + 1).toFixed(3)),
    yUd: initialUnit.yUd,
    dragOriginXUd: initialUnit.xUd,
    dragOriginYUd: initialUnit.yUd,
    maxDistanceUd: 5,
  });

  const unchangedUnit = state.game.units.find((candidate) => candidate.id === 'p1-c3-hi-1');
  assert.ok(unchangedUnit);
  assert.equal(unchangedUnit.xUd, initialUnit.xUd);
  assert.equal(unchangedUnit.yUd, initialUnit.yUd);
});

test('starting a new game creates explicit deployment zones and visible deployment placeholders', () => {
  const state = startNewGame();

  assert.equal(state.game.setup.deployment.zones.length, 2);
  assert.equal(state.game.setup.deployment.visiblePlaceholders.length, 2);
  assert.deepEqual(
    state.game.setup.deployment.visiblePlaceholders.map((placeholder) => placeholder.unitId),
    ['test-unit-1', 'test-unit-2'],
  );
  assert.equal(state.game.setup.deployment.sourceStatus, 'needs-source-check');
});

test('ready setup step can transition into battle mode', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.READY) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, { type: ACTION_TYPES.COMPLETE_SETUP });

  assert.equal(state.game.setup.isActive, false);
  assert.equal(state.game.phaseTracker.mode, 'battle');
  assert.ok(state.game.setup.lockedStepIds.includes(SETUP_STEP_IDS.READY));
});

test('overlay cycle follows the configured order', () => {
  let state = advanceToBattlefield();
  const seenModes = [];

  for (let index = 0; index < OVERLAY_MODES.length; index += 1) {
    state = reduceAppState(state, { type: ACTION_TYPES.CYCLE_OVERLAY_MODE });
    seenModes.push(state.game.overlayMode);
  }

  assert.deepEqual(seenModes, ['Aufstellungszonen', 'Sektoren', 'Beides', 'Aus']);
});

test('advance preview clamps to the 4 UD P0 limit', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advancePreviewUd, 4);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
});

test('setup flow blocks advance-mode interaction', () => {
  let state = selectTestUnit(startNewGame());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(unit.advanceUsedUd, 0);
});

test('confirm advance updates unit position through reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1.5,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd - 1.5);
  assert.equal(unit.advanceUsedUd, 1.5);
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(state.game.advanceModeActive, false);
});

test('advance preview stores movement preview data without mutating the unit first', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments[0].endPose.yUd, initialUnit.yUd - 2);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
});

test('advance preview follows rotated facing before confirmation', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              rotationRadians: degreesToRadians(90),
            }
          : unit,
      ),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2,
  });

  assert.equal(Number(state.game.movement.preview.segments[0].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 2).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.yUd.toFixed(3)), Number(initialUnit.yUd.toFixed(3)));
});

test('advance preview rejects full-footprint battlefield overflow', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 1,
    yUd: 0.6,
  });
  state = {
    ...state,
    game: {
      ...state.game,
      setup: {
        ...state.game.setup,
        isActive: false,
      },
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              xUd: 1,
              yUd: 0.6,
            }
          : unit,
      ),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.REJECTED);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
  assert.equal(unit.yUd, 0.6);
});

test('confirming movement blocks later advance previews for the same unit in the same phase', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1.56,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.IDLE);
});

test('wheel preview clamps to the remaining shared movement budget', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-2'
          ? {
              ...unit,
              yUd: 1,
            }
          : unit,
      ),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 3.5,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });

  assert.equal(Number(state.game.movement.preview.segments[1].distance.resolvedUd.toFixed(3)), 0.5);
  assert.equal(Number(state.game.wheelPreviewAngleRadians.toFixed(3)), Number((Math.PI / 6).toFixed(3)));
});

test('medium infantry advance preview clamps to the approved 3 UD subset budget', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c2-mi-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advancePreviewUd, 3);
  assert.equal(Number(state.game.movement.preview.segments[0].distance.resolvedUd.toFixed(3)), 3);
});

test('heavy infantry advance preview clamps to 2 UD when an enemy starts within 4 UD', () => {
  let state = advanceToBattlefield();

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'p1-c3-hi-2') {
          return {
            ...unit,
            xUd: 10,
            yUd: 10,
          };
        }

        if (unit.id === 'p2-c2-mi-1') {
          return {
            ...unit,
            xUd: 10,
            yUd: 6,
          };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-2' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advancePreviewUd, 2);
  assert.equal(Number(state.game.movement.preview.segments[0].distance.resolvedUd.toFixed(3)), 2);
});

test('advance preview keeps the wheeled ghost rotation before confirmation', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(Number(state.game.movement.preview.segments[1].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[1].endPose.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[1].endPose.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));
});

test('switching from advance preview to wheel preserves the chained ghost pose', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments.length, 1);
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(state.game.wheelModeActive, true);
});

test('mixed movement chain confirms from the final preview pose and budget', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments.length, 3);
  assert.equal(Number(getMovementPreviewResolvedDistanceUd(state.game.movement.preview).toFixed(3)), 3.5);
  assert.equal(Number(state.game.movement.preview.segments[2].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[2].endPose.yUd.toFixed(3)), Number((initialUnit.yUd - 2).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[2].endPose.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(unit.yUd.toFixed(3)), Number((initialUnit.yUd - 2).toFixed(3)));
  assert.equal(Number(unit.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));
  assert.equal(Number(unit.advanceUsedUd.toFixed(3)), 3.5);
});

test('slide preview moves laterally and stays blocked without 1 UD forward in the chain', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.yUd.toFixed(3)), Number(initialUnit.yUd.toFixed(3)));
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
  assert.equal(Number(getMovementPreviewAdvanceDistanceUd(state.game.movement.preview).toFixed(3)), 0);
});

test('slide stays blocked until the chained move reaches at least 1 UD of advance or wheel movement', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.LEFT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 0.9,
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
  assert.equal(Number(getSlideQualifiedMovementDistanceUd(state.game.movement.preview).toFixed(3)), 1);
});

test('slide also stays blocked when the chained wheel distance is below 1 UD', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: getWheelAngleRadiansForDistanceUd(0.9),
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: getWheelAngleRadiansForDistanceUd(1),
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
});

test('slide is free but confirm applies the chained lateral move', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(unit.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(Number(unit.advanceUsedUd.toFixed(3)), 1);
  assert.equal(unit.slideUsedThisMovementPhase, true);
});

test('a unit can only use one slide per movement phase', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const usedSlideUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(usedSlideUnit);
  assert.equal(usedSlideUnit.slideUsedThisMovementPhase, true);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });

  assert.equal(state.game.slideModeActive, false);
  assert.equal(state.game.movement.selectedCommandId, null);
});

test('zoc subset legality allows confirmation when advance closes on most-threatening enemy without contact', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-2') {
          return { ...unit, xUd: selectedUnit.xUd, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        if (unit.id === 'test-unit-3') {
          return { ...unit, xUd: selectedUnit.xUd - 1, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        if (unit.id === 'test-unit-4') {
          return { ...unit, xUd: selectedUnit.xUd + 1, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1.9,
  });

  const zocDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'zoc-subset-legality');
  assert.ok(zocDiagnostic);
  assert.equal(zocDiagnostic.status, 'verified');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.yUd.toFixed(3)), Number((selectedUnit.yUd - 1.9).toFixed(3)));
  assert.equal(unit.advanceUsedUd, 1.9);
});

test('zoc subset legality still blocks confirmation when path would create contact with most-threatening enemy', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-2') {
          return { ...unit, xUd: selectedUnit.xUd, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2.4,
  });

  const zocDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'zoc-subset-legality');
  assert.ok(zocDiagnostic);
  assert.equal(zocDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, selectedUnit.yUd);
  assert.equal(unit.advanceUsedUd, 0);
});

test('debug mode requires a selected unit and initializes a debug unit pose', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  assert.equal(state.game.debug.isActive, false);

  state = selectTestUnit(state);
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);
  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });

  assert.equal(state.game.debug.isActive, true);
  assert.equal(state.game.debug.showFacingGeometryOverlay, false);
  assert.equal(state.game.debug.unitPose.xUd, selectedUnit.xUd + 2);
  assert.equal(state.game.debug.unitPose.yUd, selectedUnit.yUd);
  assert.equal(state.game.debug.unitPose.rotationRadians, 0);
  assert.equal(state.game.debug.unitDimensions.widthUd, 1);
  assert.equal(state.game.debug.unitDimensions.depthUd, 1);
});

test('facing geometry overlay only toggles while debug mode is active', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_FACING_GEOMETRY_OVERLAY });
  assert.equal(state.game.debug.showFacingGeometryOverlay, false);

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_FACING_GEOMETRY_OVERLAY });
  assert.equal(state.game.debug.showFacingGeometryOverlay, true);

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  assert.equal(state.game.debug.isActive, false);
  assert.equal(state.game.debug.showFacingGeometryOverlay, false);
});

test('debug unit pose updates stay in serializable reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_DEBUG_UNIT_POSITION,
    xUd: 15.25,
    yUd: 6.5,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_DEBUG_UNIT_ROTATION,
    rotationRadians: Math.PI / 3,
  });

  assert.deepEqual(state.game.debug.unitPose, {
    xUd: 15.25,
    yUd: 6.5,
    rotationRadians: Math.PI / 3,
  });
  assert.equal(state.game.selectedUnitId, 'test-unit-1');
});

test('debug unit rotation is normalized in reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_DEBUG_UNIT_ROTATION,
    rotationRadians: -(Math.PI / 2),
  });

  assert.equal(state.game.debug.unitPose.rotationRadians, Math.PI * 1.5);
});

test('selected unit rotation is debug-only and normalized for overlay inspection', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SELECTED_UNIT_ROTATION,
    rotationRadians: Math.PI / 2,
  });
  assert.equal(state.game.units[0].rotationRadians, 0);

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SELECTED_UNIT_ROTATION,
    rotationRadians: -(Math.PI / 2),
  });

  assert.equal(state.game.units[0].rotationRadians, Math.PI * 1.5);
});

// P5-06: Owner and phase enforcement for movement commands

test('advance mode is blocked when the active player does not own the selected unit', () => {
  // Player-1 owns test-unit-1; player-2 is set as active player → advance must be blocked.
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_PLAYER,
    playerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });

  assert.equal(state.game.advanceModeActive, false);
});

test('advance preview distance is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  // Activate advance while player-1 is active (allowed).
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  assert.equal(state.game.advanceModeActive, true);

  // Switch to player-2 (wrong owner) and attempt to set a preview distance.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });

  // State should be unchanged (unit not moved, preview stays at 0).
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').yUd, selectedUnit.yUd);
});

test('confirm advance is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });
  assert.equal(state.game.advancePreviewUd, 2);

  // Switch to player-2 and attempt to confirm.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  // Unit must not have moved.
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').yUd, selectedUnit.yUd);
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').advanceUsedUd, 0);
});

test('advance mode is blocked when the active phase is not movement', () => {
  let state = selectTestUnit(advanceToBattlefield());

  // Switch to command phase (wrong phase).
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.COMMAND });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });

  assert.equal(state.game.advanceModeActive, false);
});

test('confirm advance is blocked when the active phase is not movement', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });

  // Switch to command phase and try to confirm.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.COMMAND });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').yUd, selectedUnit.yUd);
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').advanceUsedUd, 0);
});

test('player-2 can advance their own unit when active player is player-2 and phase is movement', () => {
  // Select test-unit-2 (player-2) and set up correct context.
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-2' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit2 = state.game.units.find((u) => u.id === 'test-unit-2');
  assert.ok(unit2.advanceUsedUd > 0, 'player-2 unit should have moved');
});

test('wheel mode is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_WHEEL_MODE, isActive: true });

  assert.equal(state.game.wheelModeActive, false);
});

test('slide mode is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_SLIDE_MODE, isActive: true });

  assert.equal(state.game.slideModeActive, false);
});
