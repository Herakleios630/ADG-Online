import test from 'node:test';
import assert from 'node:assert/strict';

import { BATTLEFIELD_PROFILE_IDS } from '../data/battlefield-profiles.js';
import {
  ACTION_TYPES,
  OVERLAY_MODES,
  SCREEN_IDS,
  SETUP_STEP_IDS,
  createInitialAppState,
  reduceAppState,
} from './p0-state.js';

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
    },
  };
}

function selectTestUnit(state) {
  return reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
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

test('setup visibility mode can switch to hotseat handoff', () => {
  let state = startNewGame();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SETUP_VIEW_MODE,
    viewMode: 'hotseat-handoff',
  });

  assert.equal(state.game.setupViewMode, 'hotseat-handoff');
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

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 14,
    yUd: 12,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.xUd, 10);
  assert.equal(unit.yUd, 10);
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

test('starting a new game creates explicit deployment zones and visible deployment placeholders', () => {
  const state = startNewGame();

  assert.equal(state.game.setup.deployment.zones.length, 2);
  assert.equal(state.game.setup.deployment.visiblePlaceholders.length, 1);
  assert.equal(state.game.setup.deployment.visiblePlaceholders[0].unitId, 'test-unit-1');
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
});

test('setup flow blocks advance-mode interaction', () => {
  let state = selectTestUnit(startNewGame());

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
  assert.equal(unit.yUd, 10);
  assert.equal(unit.advanceUsedUd, 0);
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

test('debug mode requires a selected unit and initializes a debug unit pose', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  assert.equal(state.game.debug.isActive, false);

  state = selectTestUnit(state);
  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });

  assert.equal(state.game.debug.isActive, true);
  assert.equal(state.game.debug.showFacingGeometryOverlay, false);
  assert.equal(state.game.debug.unitPose.xUd, 12);
  assert.equal(state.game.debug.unitPose.yUd, 10);
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