import test from 'node:test';
import assert from 'node:assert/strict';

import { getBattlefieldProfile, BATTLEFIELD_PROFILE_IDS } from '../data/battlefield-profiles.js';
import { getAdvancePreviewPresentation, renderAdvanceCommandPanel } from './battlefield-command-panel.js';
import { ACTION_TYPES, BATTLE_PHASE_IDS, createInitialAppState, reduceAppState } from '../state/p0-state.js';
import { MOVEMENT_SLIDE_SIDES } from '../state/p0-slide.js';

function advanceToBattlefield(state = createInitialAppState()) {
  const nextState = reduceAppState(state, { type: ACTION_TYPES.START_NEW_GAME });

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
      },
    },
  };
}

function selectTestUnit(state) {
  return reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
}

test('advance presentation keeps free slide out of the remaining advance range', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

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

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
  assert.ok(selectedUnit);

  const presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.equal(Number(presentation.previewDistanceUd.toFixed(3)), 2);
  assert.equal(Number(presentation.remainingAdvanceBudgetUd.toFixed(3)), 3);
  assert.equal(Number(presentation.maxAdvanceUd.toFixed(3)), 4);
});

test('command panel renders diagnostics and a dedicated cancel preview action', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
  assert.ok(selectedUnit);

  const presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });
  const html = renderAdvanceCommandPanel({
    selectedUnit,
    isSetupActive: false,
    advanceModeActive: presentation.advanceModeActive,
    slideModeActive: presentation.slideModeActive,
    wheelModeActive: presentation.wheelModeActive,
    wheelPivotSide: presentation.wheelPivotSide,
    advancePreviewUd: presentation.advancePreviewUd,
    slidePreviewUd: presentation.slidePreviewUd,
    wheelPreviewAngleRadians: presentation.wheelPreviewAngleRadians,
    wheelDistanceUd: presentation.wheelDistanceUd,
    previewDistanceUd: presentation.previewDistanceUd,
    slideAvailable: presentation.slideAvailable,
    remainingAdvanceBudgetUd: presentation.remainingAdvanceBudgetUd,
    maxAdvanceUd: presentation.maxAdvanceUd,
    helperCopy: presentation.helperCopy,
    diagnostics: presentation.diagnostics,
    canCancelMovement: presentation.canCancelMovement,
    canConfirmMovement: presentation.canConfirmMovement,
  });

  assert.match(html, /data-action="cancel-movement-preview"/);
  assert.match(html, /Diagnostics/);
  assert.match(html, /needs-source-check/);
});