import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTION_TYPES,
  OVERLAY_MODES,
  SCREEN_IDS,
  createInitialAppState,
  reduceAppState,
} from './p0-state.js';

function advanceToBattlefield(state = createInitialAppState()) {
  return reduceAppState(state, { type: ACTION_TYPES.START_NEW_GAME });
}

function selectTestUnit(state) {
  return reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
}

test('new game defaults to 200 points', () => {
  const state = createInitialAppState();

  assert.equal(state.shell.newGame.points, 200);
  assert.equal(state.shell.currentScreen, SCREEN_IDS.MAIN_MENU);
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
});

test('confirm advance updates unit position through reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1.5,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, 8.5);
  assert.equal(unit.advanceUsedUd, 1.5);
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(state.game.advanceModeActive, false);
});

test('remaining budget limits later advance previews after a partial move', () => {
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

  assert.equal(state.game.advancePreviewUd, 2.44);
});