import { ACTION_TYPES } from '../state/p0-state.js';

const battlefieldAdvanceDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  startMouseX: 0,
  startMouseY: 0,
  startPreviewUd: 0,
  maxAdvanceUd: 4,
  battlefieldProfile: null,
  forwardAxis: { x: 0, y: -1 },
  onSuppressNextSurfaceClick: null,
  onRecordDragCheckpoint: null,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function stopBattlefieldAdvanceDragSession() {
  battlefieldAdvanceDragSession.active = false;
  battlefieldAdvanceDragSession.dispatch = null;
  battlefieldAdvanceDragSession.surfaceRect = null;
  battlefieldAdvanceDragSession.battlefieldProfile = null;
  battlefieldAdvanceDragSession.onSuppressNextSurfaceClick = null;
  battlefieldAdvanceDragSession.onRecordDragCheckpoint = null;
}

function handleBattlefieldAdvanceDragMove(event) {
  if (!battlefieldAdvanceDragSession.active || !battlefieldAdvanceDragSession.dispatch || !battlefieldAdvanceDragSession.surfaceRect) {
    return;
  }

  const zoom = battlefieldAdvanceDragSession.zoom;
  const pixelsPerUdX = (battlefieldAdvanceDragSession.surfaceRect.width * zoom)
    / battlefieldAdvanceDragSession.battlefieldProfile.widthUd;
  const pixelsPerUdY = (battlefieldAdvanceDragSession.surfaceRect.height * zoom)
    / battlefieldAdvanceDragSession.battlefieldProfile.heightUd;

  if (!pixelsPerUdX || !pixelsPerUdY) {
    return;
  }

  const deltaWorldXUd = (event.clientX - battlefieldAdvanceDragSession.startMouseX) / pixelsPerUdX;
  const deltaWorldYUd = (event.clientY - battlefieldAdvanceDragSession.startMouseY) / pixelsPerUdY;
  const deltaUd =
    deltaWorldXUd * battlefieldAdvanceDragSession.forwardAxis.x
    + deltaWorldYUd * battlefieldAdvanceDragSession.forwardAxis.y;

  battlefieldAdvanceDragSession.dispatch({
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: clamp(
      battlefieldAdvanceDragSession.startPreviewUd + deltaUd,
      0,
      battlefieldAdvanceDragSession.maxAdvanceUd,
    ),
  });
}

function handleBattlefieldAdvanceDragEnd() {
  if (!battlefieldAdvanceDragSession.active) {
    return;
  }

  battlefieldAdvanceDragSession.onRecordDragCheckpoint?.();
  battlefieldAdvanceDragSession.onSuppressNextSurfaceClick?.();
  stopBattlefieldAdvanceDragSession();
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', handleBattlefieldAdvanceDragMove);
  window.addEventListener('mouseup', handleBattlefieldAdvanceDragEnd);
}

export function tryStartBattlefieldAdvanceDrag({
  event,
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  unitId,
  maxAdvanceUd,
  onSuppressNextSurfaceClick,
  onRecordDragCheckpoint,
}) {
  if (event.button !== 0 || !battlefieldSurface) {
    return false;
  }

  if (!state.game.advanceModeActive || state.game.selectedUnitId !== unitId) {
    return false;
  }

  const selectedUnit = state.game.units.find((unit) => unit.id === unitId);
  if (!selectedUnit) {
    return false;
  }

  const rotation = selectedUnit.rotationRadians ?? 0;

  event.preventDefault();
  onSuppressNextSurfaceClick();
  battlefieldAdvanceDragSession.active = true;
  battlefieldAdvanceDragSession.dispatch = dispatch;
  battlefieldAdvanceDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
  battlefieldAdvanceDragSession.zoom = state.game.viewport.zoom;
  battlefieldAdvanceDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldAdvanceDragSession.startMouseX = event.clientX;
  battlefieldAdvanceDragSession.startMouseY = event.clientY;
  battlefieldAdvanceDragSession.startPreviewUd = state.game.advancePreviewUd;
  battlefieldAdvanceDragSession.maxAdvanceUd = maxAdvanceUd;
  battlefieldAdvanceDragSession.forwardAxis = {
    x: Math.sin(rotation),
    y: -Math.cos(rotation),
  };
  battlefieldAdvanceDragSession.onSuppressNextSurfaceClick = onSuppressNextSurfaceClick;
  battlefieldAdvanceDragSession.onRecordDragCheckpoint = onRecordDragCheckpoint ?? null;
  return true;
}

export function bindAdvanceActionButtons({ container, dispatch, state }) {
  const toggleAdvanceModeButton = container.querySelector('[data-action="toggle-advance-mode"]');
  if (toggleAdvanceModeButton) {
    toggleAdvanceModeButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: !state.game.advanceModeActive });
    });
  }

  const resetTestUnitsButton = container.querySelector('[data-action="reset-test-units"]');
  if (resetTestUnitsButton) {
    resetTestUnitsButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.RESET_TEST_UNITS });
    });
  }
}