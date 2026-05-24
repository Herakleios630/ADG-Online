import test from 'node:test';
import assert from 'node:assert/strict';

import { getBattlefieldProfile, BATTLEFIELD_PROFILE_IDS } from '../data/battlefield-profiles.js';
import { CHARGE_BRANCH_ROLL_REASONS } from '../engine/charge/index.js';
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
    selectedUnit: {
      id: 'test-unit-1',
      isCommander: true,
      hasIncludedCommander: false,
      attachedUnitId: null,
    },
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

test('command panel hides the attach commander action for normal units', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: {
      id: 'p1-c1-cav-1',
      isCommander: false,
      hasIncludedCommander: false,
      attachedUnitId: null,
    },
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
    canAttachCommander: false,
  });

  assert.doesNotMatch(html, /data-action="attach-commander"/);
});

test('command panel enables the charge button before any movement is taken', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

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
    canShowMovementButtons: presentation.canShowMovementButtons,
    canUseFreeCommandPoint: presentation.canUseFreeCommandPoint,
    useFreeCommandPoint: presentation.useFreeCommandPoint,
    chargePreviewActive: presentation.chargePreviewActive,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.canStartCharge, true);
  assert.equal(presentation.chargePreviewActive, false);
  assert.equal(presentation.chargeDisabledReason, null);
  assert.match(html, /data-action="start-charge-preview"/);
  assert.doesNotMatch(html, /data-action="start-charge-preview"[^>]*disabled/);
});

test('command panel locks and allows cancel while a charge preview is active', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });

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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.chargePreviewActive, true);
  assert.equal(presentation.canStartCharge, false);
  assert.equal(presentation.canCancelMovement, true);
  assert.equal(presentation.selectionLockActive, true);
  assert.match(presentation.helperCopy, /Charge aktiv/);
  assert.match(presentation.selectionLockCopy, /Charge-Vorschau/);
  assert.match(html, /class="[^"]*is-active[^"]*"[^>]*data-action="start-charge-preview"/);
  assert.doesNotMatch(html, /data-action="cancel-movement-preview"[^>]*disabled/);
});

test('charge helper copy switches to a reaction-pending pause message when the defender exposes an evade hook', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
  assert.ok(selectedUnit);

  const presentation = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.equal(state.game.chargePreview.status, 'reaction-pending');
  assert.match(presentation.helperCopy, /Charge pausiert im Reaktionsschritt/i);
  assert.match(presentation.diagnostics.map((item) => item.text).join(' '), /may-evade hook/i);
});

test('command panel switches the confirm button to direction confirmation as soon as a direct legal charge target is selected', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    chargeStartControlsActive: presentation.chargeStartControlsActive,
    chargeStartOptions: presentation.chargeStartOptions,
    selectedChargeStartType: presentation.selectedChargeStartType,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    chargeWhyItems: presentation.chargeWhyItems,
    confirmActionLabel: presentation.confirmActionLabel,
    confirmActionTitle: presentation.confirmActionTitle,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(state.game.chargePreview.status, 'ready');
  assert.equal(presentation.canConfirmMovement, true);
  assert.equal(presentation.confirmActionLabel, 'Richtung bestaetigen');
  assert.match(presentation.helperCopy, /Richtung bestaetigen/i);
  assert.equal(presentation.chargeWhyItems.some((item) => item.label === 'Status' && /Bereit/.test(item.value)), true);
  assert.equal(presentation.chargeWhyItems.some((item) => item.label === 'Start' && item.value.length > 0), true);
  assert.match(html, /Richtung bestaetigen/);
  assert.match(html, /data-charge-why-card/);
  assert.match(html, /Charge-Status/);
  assert.match(html, /Pfad:/);
});

test('charge why-card shows frozen reaction and handoff details after a no-evade decision', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_REACTION, decisionType: 'no-evade' });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    chargeStartControlsActive: presentation.chargeStartControlsActive,
    chargeStartOptions: presentation.chargeStartOptions,
    selectedChargeStartType: presentation.selectedChargeStartType,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    chargeWhyItems: presentation.chargeWhyItems,
    confirmActionLabel: presentation.confirmActionLabel,
    confirmActionTitle: presentation.confirmActionTitle,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.chargeWhyItems.some((item) => item.label === 'Reaktion' && /Keine Ausweichreaktion/.test(item.value)), true);
  assert.equal(presentation.chargeWhyItems.some((item) => item.label === 'Handoff' && /Weiter ohne Ausweichen/.test(item.value)), true);
  assert.match(html, /Handoff:/);
  assert.match(html, /Weiter ohne Ausweichen/);
});

test('command panel exposes the adjusted charge roll trigger after the evade plan resolves', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_REACTION, decisionType: 'evade' });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    chargeStartControlsActive: presentation.chargeStartControlsActive,
    chargeStartOptions: presentation.chargeStartOptions,
    selectedChargeStartType: presentation.selectedChargeStartType,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    canStartAdjustedChargeDistanceRoll: presentation.canStartAdjustedChargeDistanceRoll,
    chargeWhyItems: presentation.chargeWhyItems,
    confirmActionLabel: presentation.confirmActionLabel,
    confirmActionTitle: presentation.confirmActionTitle,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.canStartAdjustedChargeDistanceRoll, true);
  assert.match(presentation.helperCopy, /Folgewurf fuer die angepasste Charge-Distanz/i);
  assert.match(html, /data-action="start-adjusted-charge-distance-roll"/);
  assert.match(html, /Adjusted Charge wuerfeln/);
});

test('command panel exposes stop and continue actions for a pending non-impetuous follow-through choice', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_REACTION, decisionType: 'evade' });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 4 });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    chargeStartControlsActive: presentation.chargeStartControlsActive,
    chargeStartOptions: presentation.chargeStartOptions,
    selectedChargeStartType: presentation.selectedChargeStartType,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    canStartAdjustedChargeDistanceRoll: presentation.canStartAdjustedChargeDistanceRoll,
    canResolveChargeContinuationChoice: presentation.canResolveChargeContinuationChoice,
    minimumChargeContinuationDistanceUd: presentation.minimumChargeContinuationDistanceUd,
    maximumChargeContinuationDistanceUd: presentation.maximumChargeContinuationDistanceUd,
    chargeWhyItems: presentation.chargeWhyItems,
    confirmActionLabel: presentation.confirmActionLabel,
    confirmActionTitle: presentation.confirmActionTitle,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.canResolveChargeContinuationChoice, true);
  assert.match(presentation.helperCopy, /stoppen oder bis 4 UD voll weiterziehen/i);
  assert.match(html, /data-action="resolve-charge-continuation-choice"/);
  assert.match(html, /data-option="stop"/);
  assert.match(html, /data-option="continue"/);
  assert.match(html, /Stop at 2 UD/);
  assert.match(html, /Continue to 4 UD/);
});

test('command panel distinguishes a secondary target pause from a caught evader follow-through result', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_REACTION, decisionType: 'evade' });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 4 });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    chargeStartControlsActive: presentation.chargeStartControlsActive,
    chargeStartOptions: presentation.chargeStartOptions,
    selectedChargeStartType: presentation.selectedChargeStartType,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    canStartAdjustedChargeDistanceRoll: presentation.canStartAdjustedChargeDistanceRoll,
    canResolveChargeContinuationChoice: presentation.canResolveChargeContinuationChoice,
    minimumChargeContinuationDistanceUd: presentation.minimumChargeContinuationDistanceUd,
    maximumChargeContinuationDistanceUd: presentation.maximumChargeContinuationDistanceUd,
    chargeWhyItems: presentation.chargeWhyItems,
    confirmActionLabel: presentation.confirmActionLabel,
    confirmActionTitle: presentation.confirmActionTitle,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.match(presentation.helperCopy, /Sekundaerziel .*test-unit-4.* pausiert/i);
  assert.deepEqual(
    presentation.chargeWhyItems.find((item) => item.label === 'Follow-through'),
    { label: 'Follow-through', value: 'Secondary target pause: test-unit-4' },
  );
  assert.deepEqual(
    presentation.chargeWhyItems.find((item) => item.label === 'Next reaction'),
    { label: 'Next reaction', value: 'test-unit-4 (Keine Ausweichreaktion)' },
  );
  assert.match(presentation.helperCopy, /naechste pausierte Reaktion ist test-unit-4/i);
  assert.match(html, /Secondary target pause: test-unit-4/);
  assert.match(html, /Next reaction:.*test-unit-4 \(Keine Ausweichreaktion\)/i);

  const caughtState = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        followThroughResolution: {
          ...state.game.chargePreview.followThroughResolution,
          status: 'caught-evader',
          defenderId: 'test-unit-3',
          combatPosture: 'rear-attack',
          cohesionLoss: {
            amount: 1,
            reason: 'caught-evader',
            exceptionStatus: 'light-charger-check-pending',
          },
        },
      },
    },
  };
  const caughtPresentation = getAdvancePreviewPresentation({
    state: caughtState,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });
  const caughtHtml = renderAdvanceCommandPanel({
    selectedUnit,
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: caughtPresentation.advanceModeActive,
    slideModeActive: caughtPresentation.slideModeActive,
    wheelModeActive: caughtPresentation.wheelModeActive,
    wheelPivotSide: caughtPresentation.wheelPivotSide,
    advancePreviewUd: caughtPresentation.advancePreviewUd,
    slidePreviewUd: caughtPresentation.slidePreviewUd,
    wheelPreviewAngleRadians: caughtPresentation.wheelPreviewAngleRadians,
    wheelDistanceUd: caughtPresentation.wheelDistanceUd,
    previewDistanceUd: caughtPresentation.previewDistanceUd,
    slideAvailable: caughtPresentation.slideAvailable,
    remainingAdvanceBudgetUd: caughtPresentation.remainingAdvanceBudgetUd,
    maxAdvanceUd: caughtPresentation.maxAdvanceUd,
    helperCopy: caughtPresentation.helperCopy,
    diagnostics: caughtPresentation.diagnostics,
    canCancelMovement: caughtPresentation.canCancelMovement,
    canConfirmMovement: caughtPresentation.canConfirmMovement,
    selectionLockActive: caughtPresentation.selectionLockActive,
    selectionLockCopy: caughtPresentation.selectionLockCopy,
    canMarkStay: caughtPresentation.canMarkStay,
    canShowMovementButtons: caughtPresentation.canShowMovementButtons,
    canUseFreeCommandPoint: caughtPresentation.canUseFreeCommandPoint,
    useFreeCommandPoint: caughtPresentation.useFreeCommandPoint,
    chargePreviewActive: caughtPresentation.chargePreviewActive,
    chargeStartControlsActive: caughtPresentation.chargeStartControlsActive,
    chargeStartOptions: caughtPresentation.chargeStartOptions,
    selectedChargeStartType: caughtPresentation.selectedChargeStartType,
    canStartCharge: caughtPresentation.canStartCharge,
    chargeDisabledReason: caughtPresentation.chargeDisabledReason,
    canStartAdjustedChargeDistanceRoll: caughtPresentation.canStartAdjustedChargeDistanceRoll,
    canResolveChargeContinuationChoice: caughtPresentation.canResolveChargeContinuationChoice,
    minimumChargeContinuationDistanceUd: caughtPresentation.minimumChargeContinuationDistanceUd,
    maximumChargeContinuationDistanceUd: caughtPresentation.maximumChargeContinuationDistanceUd,
    chargeWhyItems: caughtPresentation.chargeWhyItems,
    confirmActionLabel: caughtPresentation.confirmActionLabel,
    confirmActionTitle: caughtPresentation.confirmActionTitle,
    movementBudgetLabel: caughtPresentation.movementBudgetLabel,
  });

  assert.match(caughtPresentation.helperCopy, /Rear-Attack-Hook/i);
  assert.match(caughtPresentation.helperCopy, /1 Cohesion Loss/i);
  assert.match(caughtHtml, /Evader caught \(rear attack\): test-unit-3/i);

  const resolvedSecondaryState = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'no-evade-handoff',
        intent: {
          ...state.game.chargePreview.intent,
          targetUnitId: 'test-unit-4',
          targetSnapshot: state.game.units.find((unit) => unit.id === 'test-unit-4') ?? null,
        },
        declarationSnapshot: {
          ...state.game.chargePreview.declarationSnapshot,
          targetUnitId: 'test-unit-4',
          targetSnapshot: state.game.units.find((unit) => unit.id === 'test-unit-4') ?? null,
        },
        followThroughResolution: {
          ...state.game.chargePreview.followThroughResolution,
          selectedTargetId: 'test-unit-4',
        },
        reactionRequests: state.game.chargePreview.reactionRequests.map((request, index) => (
          index === 1 ? { ...request, status: 'complete' } : request
        )),
        handoffStatus: 'no-evade',
        secondaryReactionDecision: {
          type: 'no-evade',
          unitId: 'test-unit-4',
          requestType: 'none',
          handoffStatus: 'no-evade',
          declarationSnapshot: null,
        },
      },
    },
  };
  const resolvedSecondaryPresentation = getAdvancePreviewPresentation({
    state: resolvedSecondaryState,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });

  assert.deepEqual(
    resolvedSecondaryPresentation.chargeWhyItems.find((item) => item.label === 'Recorded reaction'),
    { label: 'Recorded reaction', value: 'test-unit-4 (no-evade)' },
  );
  assert.deepEqual(
    resolvedSecondaryPresentation.chargeWhyItems.find((item) => item.label === 'Ziel'),
    { label: 'Ziel', value: 'test-unit-4' },
  );
  assert.match(resolvedSecondaryPresentation.helperCopy, /als test-unit-4 \(no-evade\) abgeschlossen/i);

  const secondaryEvadeResolvedState = {
    ...resolvedSecondaryState,
    game: {
      ...resolvedSecondaryState.game,
      chargePreview: {
        ...resolvedSecondaryState.game.chargePreview,
        status: 'evade-required',
        handoffStatus: 'evade-required',
        intent: {
          ...resolvedSecondaryState.game.chargePreview.intent,
          targetUnitId: 'test-unit-4',
          targetSnapshot: resolvedSecondaryState.game.units.find((unit) => unit.id === 'test-unit-4') ?? null,
        },
        declarationSnapshot: {
          ...resolvedSecondaryState.game.chargePreview.declarationSnapshot,
          targetUnitId: 'test-unit-4',
          targetSnapshot: resolvedSecondaryState.game.units.find((unit) => unit.id === 'test-unit-4') ?? null,
        },
        followThroughResolution: {
          ...resolvedSecondaryState.game.chargePreview.followThroughResolution,
          selectedTargetId: 'test-unit-4',
        },
        branchDistanceRoll: {
          history: [],
          claim: {
            reason: CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
            targetUnitId: 'test-unit-4',
            reactingUnitId: 'test-unit-4',
          },
          result: {
            distanceOutcome: 'normal-movement',
          },
        },
        evadePlan: {
          reactingUnitId: 'test-unit-4',
        },
        secondaryReactionDecision: {
          type: 'evade',
          unitId: 'test-unit-4',
          requestType: 'may-evade',
          handoffStatus: 'evade-required',
          declarationSnapshot: null,
        },
      },
    },
  };
  const secondaryEvadeResolvedPresentation = getAdvancePreviewPresentation({
    state: secondaryEvadeResolvedState,
    selectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });
  const secondaryEvadeResolvedHtml = renderAdvanceCommandPanel({
    selectedUnit,
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: secondaryEvadeResolvedPresentation.advanceModeActive,
    slideModeActive: secondaryEvadeResolvedPresentation.slideModeActive,
    wheelModeActive: secondaryEvadeResolvedPresentation.wheelModeActive,
    wheelPivotSide: secondaryEvadeResolvedPresentation.wheelPivotSide,
    advancePreviewUd: secondaryEvadeResolvedPresentation.advancePreviewUd,
    slidePreviewUd: secondaryEvadeResolvedPresentation.slidePreviewUd,
    wheelPreviewAngleRadians: secondaryEvadeResolvedPresentation.wheelPreviewAngleRadians,
    wheelDistanceUd: secondaryEvadeResolvedPresentation.wheelDistanceUd,
    previewDistanceUd: secondaryEvadeResolvedPresentation.previewDistanceUd,
    slideAvailable: secondaryEvadeResolvedPresentation.slideAvailable,
    remainingAdvanceBudgetUd: secondaryEvadeResolvedPresentation.remainingAdvanceBudgetUd,
    maxAdvanceUd: secondaryEvadeResolvedPresentation.maxAdvanceUd,
    helperCopy: secondaryEvadeResolvedPresentation.helperCopy,
    diagnostics: secondaryEvadeResolvedPresentation.diagnostics,
    canCancelMovement: secondaryEvadeResolvedPresentation.canCancelMovement,
    canConfirmMovement: secondaryEvadeResolvedPresentation.canConfirmMovement,
    selectionLockActive: secondaryEvadeResolvedPresentation.selectionLockActive,
    selectionLockCopy: secondaryEvadeResolvedPresentation.selectionLockCopy,
    canMarkStay: secondaryEvadeResolvedPresentation.canMarkStay,
    canShowMovementButtons: secondaryEvadeResolvedPresentation.canShowMovementButtons,
    canUseFreeCommandPoint: secondaryEvadeResolvedPresentation.canUseFreeCommandPoint,
    useFreeCommandPoint: secondaryEvadeResolvedPresentation.useFreeCommandPoint,
    chargePreviewActive: secondaryEvadeResolvedPresentation.chargePreviewActive,
    chargeStartControlsActive: secondaryEvadeResolvedPresentation.chargeStartControlsActive,
    chargeStartOptions: secondaryEvadeResolvedPresentation.chargeStartOptions,
    selectedChargeStartType: secondaryEvadeResolvedPresentation.selectedChargeStartType,
    canStartCharge: secondaryEvadeResolvedPresentation.canStartCharge,
    chargeDisabledReason: secondaryEvadeResolvedPresentation.chargeDisabledReason,
    chargeWhyItems: secondaryEvadeResolvedPresentation.chargeWhyItems,
    confirmActionLabel: secondaryEvadeResolvedPresentation.confirmActionLabel,
    confirmActionTitle: secondaryEvadeResolvedPresentation.confirmActionTitle,
    movementBudgetLabel: secondaryEvadeResolvedPresentation.movementBudgetLabel,
  });

  assert.deepEqual(
    secondaryEvadeResolvedPresentation.chargeWhyItems.find((item) => item.label === 'Ziel'),
    { label: 'Ziel', value: 'test-unit-4' },
  );
  assert.match(secondaryEvadeResolvedPresentation.helperCopy, /Sekundaerziel-Reaktion ist jetzt als test-unit-4 \(evade\) aufgeloest/i);
  assert.doesNotMatch(secondaryEvadeResolvedHtml, /Adjusted Charge wuerfeln/);
});

test('command panel explains forced impetuous full continuation without showing stop-or-continue buttons', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-1') {
          return {
            ...unit,
            troopType: 'cavalry',
            chargeReactionCapability: {
              ...(unit.chargeReactionCapability ?? {}),
              family: 'cavalry',
              hasImpetuous: true,
            },
          };
        }

        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_REACTION, decisionType: 'evade' });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 4 });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    chargeStartControlsActive: presentation.chargeStartControlsActive,
    chargeStartOptions: presentation.chargeStartOptions,
    selectedChargeStartType: presentation.selectedChargeStartType,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    canStartAdjustedChargeDistanceRoll: presentation.canStartAdjustedChargeDistanceRoll,
    canResolveChargeContinuationChoice: presentation.canResolveChargeContinuationChoice,
    minimumChargeContinuationDistanceUd: presentation.minimumChargeContinuationDistanceUd,
    maximumChargeContinuationDistanceUd: presentation.maximumChargeContinuationDistanceUd,
    chargeWhyItems: presentation.chargeWhyItems,
    confirmActionLabel: presentation.confirmActionLabel,
    confirmActionTitle: presentation.confirmActionTitle,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.canResolveChargeContinuationChoice, false);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.continuationChoice?.selectedOption, 'continue');
  assert.match(presentation.helperCopy, /impetuose .* voll weiterziehen .* 4 UD/i);
  assert.doesNotMatch(html, /data-action="resolve-charge-continuation-choice"/);
});

test('command panel shows charge-start controls after selecting a charge target', () => {
  let state = advanceToBattlefield();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });

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
    canIssueMovementCommands: false,
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
    chargePreviewActive: presentation.chargePreviewActive,
    chargeStartControlsActive: presentation.chargeStartControlsActive,
    chargeStartOptions: presentation.chargeStartOptions,
    selectedChargeStartType: presentation.selectedChargeStartType,
    canStartCharge: presentation.canStartCharge,
    chargeDisabledReason: presentation.chargeDisabledReason,
    movementBudgetLabel: presentation.movementBudgetLabel,
  });

  assert.equal(presentation.chargeStartControlsActive, true);
  assert.equal(presentation.chargeStartOptions.length, 3);
  assert.match(presentation.helperCopy, /Charge-Ziel gesetzt/);
  assert.match(presentation.helperCopy, /Tunnel bleibt vorwaerts/);
  assert.doesNotMatch(html, /data-action="select-charge-start-manoeuvre"/);
  assert.doesNotMatch(html, /battlefield-charge-start-controls/);
  assert.doesNotMatch(html, /data-action="toggle-slide-mode"[^>]*disabled/);
  assert.doesNotMatch(html, /data-action="toggle-wheel-mode"[^>]*disabled/);
  assert.match(html, /data-action="toggle-advance-mode"[^>]*disabled/);
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

test('command panel gates evade slide choice buttons behind the hotseat handoff acknowledgement', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_REACTION, decisionType: 'evade' });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
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
    canIssueMovementCommands: false,
    ...presentation,
  });

  assert.doesNotMatch(html, /data-action="select-evade-avoidance-choice"/);
  assert.doesNotMatch(html, /Adjusted Charge wuerfeln/);

  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
  const acknowledgedSelectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);

  const acknowledgedPresentation = getAdvancePreviewPresentation({
    state,
    selectedUnit: acknowledgedSelectedUnit,
    isSetupActive: false,
    canDragUnitsInSetup: false,
    battlefieldProfile,
  });
  const acknowledgedHtml = renderAdvanceCommandPanel({
    selectedUnit: acknowledgedSelectedUnit,
    isSetupActive: false,
    canIssueMovementCommands: false,
    ...acknowledgedPresentation,
  });

  assert.match(acknowledgedHtml, /data-action="select-evade-avoidance-choice"/);
  assert.match(acknowledgedHtml, /data-side="left"/);
  assert.match(acknowledgedHtml, /data-side="right"/);
  assert.match(acknowledgedHtml, /data-candidate-id="/);
  assert.doesNotMatch(acknowledgedHtml, /Adjusted Charge wuerfeln/);
});

test('command panel renders generic evade choice labels for direction-wheel candidates', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: null,
    setupStepId: null,
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    advancePreviewUd: 0,
    previewDistanceUd: 0,
    wheelDistanceUd: 0,
    slidePreviewUd: 0,
    previewUnitStyle: '',
    previewAdvanceStyle: '',
    slideGhostStyle: '',
    slideReachStyle: '',
    wheelGuideStyle: '',
    previewDiagnosticsSummary: '',
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: 'choice required',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    canResolveEvadeAvoidanceChoice: true,
    evadeAvoidanceCandidates: [
      {
        id: 'direction-wheel-left-1.571',
        type: 'direction-wheel',
        pivotSide: 'left',
        angleRadians: Math.PI / 2,
        spentDistanceUd: 1.5,
      },
    ],
  });

  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571"/);
  assert.match(html, /Direction-Wheel links/);
  assert.match(html, /90 Grad, 1\.5 UD/);
});

test('command panel renders chained direction-wheel-slide evade labels from generic candidate state', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: null,
    setupStepId: null,
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    advancePreviewUd: 0,
    previewDistanceUd: 0,
    wheelDistanceUd: 0,
    slidePreviewUd: 0,
    previewUnitStyle: '',
    previewAdvanceStyle: '',
    slideGhostStyle: '',
    slideReachStyle: '',
    wheelGuideStyle: '',
    previewDiagnosticsSummary: '',
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: 'choice required',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    canResolveEvadeAvoidanceChoice: true,
    evadeAvoidanceCandidates: [
      {
        id: 'direction-wheel-left-1.571-slide-left-0.500',
        type: 'direction-wheel-slide',
        side: 'left',
        distanceUd: 0.5,
        avoidanceSteps: [
          {
            type: 'direction-wheel',
            pivotSide: 'left',
            angleRadians: Math.PI / 2,
          },
          {
            type: 'slide',
            side: 'left',
            distanceUd: 0.5,
          },
        ],
      },
    ],
  });

  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571-slide-left-0\.500"/);
  assert.match(html, /Direction-Wheel links/);
  assert.match(html, /dann links sliden \(0\.5 UD\)/);
});

test('command panel renders generic labels for multi-wheel evade paths from avoidance steps', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: null,
    setupStepId: null,
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    advancePreviewUd: 0,
    previewDistanceUd: 0,
    wheelDistanceUd: 0,
    slidePreviewUd: 0,
    previewUnitStyle: '',
    previewAdvanceStyle: '',
    slideGhostStyle: '',
    slideReachStyle: '',
    wheelGuideStyle: '',
    previewDiagnosticsSummary: '',
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: 'choice required',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    canResolveEvadeAvoidanceChoice: true,
    evadeAvoidanceCandidates: [
      {
        id: 'wheel-right-0.035-wheel-right-0.017-slide-left-0.500-wheel-left-0.070',
        type: 'obstacle-wheel',
        avoidanceSteps: [
          { type: 'obstacle-wheel', pivotSide: 'right', angleRadians: 0.035, spentDistanceUd: 0.033 },
          { type: 'obstacle-wheel', pivotSide: 'right', angleRadians: 0.017, spentDistanceUd: 0.016 },
          { type: 'slide', side: 'left', distanceUd: 0.5 },
          { type: 'obstacle-wheel', pivotSide: 'left', angleRadians: 0.07, spentDistanceUd: 0.067 },
        ],
      },
    ],
  });

  assert.match(html, /Obstacle-Wheel rechts/);
  assert.match(html, /dann Obstacle-Wheel rechts/);
  assert.match(html, /dann links sliden/);
  assert.match(html, /dann Obstacle-Wheel links/);
});

test('command panel renders an evade tree reset action when a node path is active', () => {
  const html = renderAdvanceCommandPanel({
    selectedUnit: null,
    setupStepId: null,
    isSetupActive: false,
    canIssueMovementCommands: false,
    advanceModeActive: false,
    slideModeActive: false,
    wheelModeActive: false,
    advancePreviewUd: 0,
    previewDistanceUd: 0,
    wheelDistanceUd: 0,
    slidePreviewUd: 0,
    previewUnitStyle: '',
    previewAdvanceStyle: '',
    slideGhostStyle: '',
    slideReachStyle: '',
    wheelGuideStyle: '',
    previewDiagnosticsSummary: '',
    remainingAdvanceBudgetUd: 0,
    maxAdvanceUd: 0,
    helperCopy: 'choice required',
    diagnostics: [],
    canCancelMovement: false,
    canConfirmMovement: false,
    canResolveEvadeAvoidanceChoice: true,
    evadeChoicePathStepIds: ['direction-wheel-left-1.571'],
    evadeAvoidanceCandidates: [
      {
        id: 'direction-wheel-left-1.571-slide-left-0.500',
        type: 'direction-wheel-slide',
        avoidanceSteps: [
          { type: 'direction-wheel', pivotSide: 'left', angleRadians: Math.PI / 2 },
          { type: 'slide', side: 'left', distanceUd: 0.5 },
        ],
      },
    ],
  });

  assert.match(html, /data-action="reset-evade-avoidance-path"/);
  assert.match(html, /Knotenpfad reset/);
});