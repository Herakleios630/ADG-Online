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
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
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
    canIssueMovementCommands: true,
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
    selectionLockActive: presentation.selectionLockActive,
    selectionLockCopy: presentation.selectionLockCopy,
    canMarkStay: presentation.canMarkStay,
    canShowMovementButtons: false,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.match(html, /data-action="mark-unit-stay"/);
  assert.doesNotMatch(html, /data-action="toggle-advance-mode"/);
  assert.match(html, /General-Budget: 5 UD/i);
  assert.match(html, /data-action="cancel-movement-preview"/);
  assert.match(html, /Diagnostics/);
  assert.match(html, /needs-source-check/);
  assert.match(html, /Auswahl fixiert/);
  assert.match(html, /noch nicht bestaetigte Bewegung/);
  assert.match(html, /Bewegung beenden/);
  assert.ok(html.indexOf('data-action="toggle-advance-mode"') < html.indexOf('Diagnostics'));
  assert.match(html, /<details class="battlefield-collapsible-card battlefield-command-details">/);
});

test('command panel renders the attach commander action from reducer-owned flags', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: { id: 'p1-c1-cav-1' },
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    wheelPivotSide: null,
    advancePreviewUd: 0,
    slidePreviewUd: 0,
    wheelPreviewAngleRadians: 0,
    wheelDistanceUd: 0,
    previewDistanceUd: 0,
    slideAvailable: false,
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: '',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    selectionLockActive: false,
    selectionLockCopy: '',
    canMarkStay: false,
    canShowMovementButtons: false,
    canAttachCommander: true,
  });

  assert.match(html, /data-action="attach-commander"/);
  assert.doesNotMatch(html, /data-action="attach-commander" disabled/);
  assert.doesNotMatch(html, /data-action="detach-commander"/);
});

test('command panel shows the next corps button during corps movement when no popup is open', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: null,
    isSetupActive: false,
    roundState: {
      roundPhase: 'corps-movement',
      dialog: { type: null, phaseLabel: null },
    },
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    wheelPivotSide: null,
    advancePreviewUd: 0,
    slidePreviewUd: 0,
    wheelPreviewAngleRadians: 0,
    wheelDistanceUd: 0,
    previewDistanceUd: 0,
    slideAvailable: false,
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: 'Waehle zuerst die Testeinheit aus.',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    selectionLockActive: false,
    selectionLockCopy: '',
    canMarkStay: false,
    canShowMovementButtons: false,
  });

  assert.match(html, /data-action="request-next-corps"/);
  assert.match(html, /Naechstes Corps/);
});

test('setup command panel renders only the top next-step action', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: null,
    isSetupActive: true,
    setupStepId: 'terrain-adjustment',
    roundState: null,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    wheelPivotSide: null,
    advancePreviewUd: 0,
    slidePreviewUd: 0,
    wheelPreviewAngleRadians: 0,
    wheelDistanceUd: 0,
    previewDistanceUd: 0,
    slideAvailable: false,
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: '',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    selectionLockActive: false,
    selectionLockCopy: '',
    canMarkStay: false,
    canShowMovementButtons: false,
  });

  assert.match(html, /data-action="setup-next"/);
  assert.match(html, /Naechster Schritt/);
  assert.doesNotMatch(html, /data-action="mark-unit-stay"/);
  assert.doesNotMatch(html, /data-action="reset-test-units"/);
  assert.doesNotMatch(html, /data-action="confirm-movement"/);
  assert.doesNotMatch(html, /data-action="cancel-movement-preview"/);
  assert.ok(html.indexOf('Naechster Schritt') < html.indexOf('</div>'));
});

test('battle mode labels the reset button as unit reset', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: { id: 'p1-c1-cav-1' },
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    wheelPivotSide: null,
    advancePreviewUd: 0,
    slidePreviewUd: 0,
    wheelPreviewAngleRadians: 0,
    wheelDistanceUd: 0,
    previewDistanceUd: 0,
    slideAvailable: false,
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: '',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    selectionLockActive: false,
    selectionLockCopy: '',
    canMarkStay: false,
    canShowMovementButtons: false,
  });

  assert.match(html, /Einheit zuruecksetzen/);
});

test('battle mode can render a smoke toggle for commander-engaged blocked diagnostics', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: { id: 'p1-c1-cav-1' },
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    wheelPivotSide: null,
    advancePreviewUd: 0,
    slidePreviewUd: 0,
    wheelPreviewAngleRadians: 0,
    wheelDistanceUd: 0,
    previewDistanceUd: 0,
    slideAvailable: false,
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: '',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    selectionLockActive: false,
    selectionLockCopy: '',
    canMarkStay: false,
    canShowMovementButtons: false,
    canToggleCommanderEngagedDiagnostic: true,
    commanderEngagedDiagnosticActive: true,
  });

  assert.match(html, /data-action="toggle-commander-engaged-diagnostic"/);
  assert.match(html, /Diagnosefall: aktiven Kommandeur als im Nahkampf markieren/);
  assert.match(html, /checked/);
});

test('free commander presentation uses 5 UD budget and shows spent drag as preview total', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(initialGeneral);

  let presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit: initialGeneral,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.equal(Number(presentation.remainingAdvanceBudgetUd.toFixed(3)), 5);
  assert.equal(Number(presentation.previewDistanceUd.toFixed(3)), 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 3).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  const movedGeneral = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(movedGeneral);

  presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit: movedGeneral,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.equal(Number(presentation.previewDistanceUd.toFixed(3)), 3);
  assert.equal(Number(presentation.remainingAdvanceBudgetUd.toFixed(3)), 2);
  assert.match(presentation.movementBudgetLabel, /General-Budget/);
});

test('medium infantry presentation references the approved 3 UD P6 budget', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-2' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c2-mi-1' });

  const selectedUnit = state.game.units.find((unit) => unit.id === 'p1-c2-mi-1');
  assert.ok(selectedUnit);

  const presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.equal(Number(presentation.remainingAdvanceBudgetUd.toFixed(3)), 3);
  assert.match(presentation.helperCopy, /aktuellen P6-Budgets von maximal 3 UD/i);
  assert.match(presentation.movementBudgetLabel, /P6-Budget \(3 UD\)/);
});

test('included commander host unit exposes the optional free CP toggle in the command panel', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-1' });

  const selectedUnit = state.game.units.find((unit) => unit.id === 'p1-c3-hi-1');
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
    canIssueMovementCommands: true,
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
    selectionLockActive: presentation.selectionLockActive,
    selectionLockCopy: presentation.selectionLockCopy,
    canMarkStay: presentation.canMarkStay,
    canShowMovementButtons: presentation.canShowMovementButtons,
    canUseFreeCommandPoint: presentation.canUseFreeCommandPoint,
    useFreeCommandPoint: presentation.useFreeCommandPoint,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.canUseFreeCommandPoint, true);
  assert.equal(presentation.useFreeCommandPoint, false);
  assert.match(html, /data-action="toggle-use-free-command-point"/);
  assert.match(html, /Freien CP fuer diese Kommandeursbewegung nutzen/);
});

test('heavy infantry presentation explains the operational-zone budget switch', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

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
            yUd: 4,
          };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-2' });

  const selectedUnit = state.game.units.find((unit) => unit.id === 'p1-c3-hi-2');
  assert.ok(selectedUnit);

  let presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.equal(Number(presentation.remainingAdvanceBudgetUd.toFixed(3)), 3);
  assert.match(presentation.helperCopy, /grants the 3 UD operational-zone budget/i);
  assert.match(presentation.movementBudgetLabel, /Operational Zone 3 UD/);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) =>
        unit.id === 'p2-c2-mi-1'
          ? {
              ...unit,
              xUd: 10,
              yUd: 6.2,
            }
          : unit,
      ),
    },
  };

  presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit: state.game.units.find((unit) => unit.id === 'p1-c3-hi-2'),
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.equal(Number(presentation.remainingAdvanceBudgetUd.toFixed(3)), 2);
  assert.match(presentation.helperCopy, /keeps the 2 UD budget/i);
  assert.match(presentation.movementBudgetLabel, /Heavy Infantry 2 UD/);
});