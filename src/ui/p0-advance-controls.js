import { ACTION_TYPES } from '../state/p0-state.js';

const battlefieldAdvanceDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  startMouseY: 0,
  startPreviewUd: 0,
  maxAdvanceUd: 4,
  battlefieldProfile: null,
  onSuppressNextSurfaceClick: null,
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
}

function handleBattlefieldAdvanceDragMove(event) {
  if (!battlefieldAdvanceDragSession.active || !battlefieldAdvanceDragSession.dispatch || !battlefieldAdvanceDragSession.surfaceRect) {
    return;
  }

  const pixelsPerUd = (battlefieldAdvanceDragSession.surfaceRect.height * battlefieldAdvanceDragSession.zoom)
    / battlefieldAdvanceDragSession.battlefieldProfile.heightUd;
  if (!pixelsPerUd) {
    return;
  }

  const deltaUd = -(event.clientY - battlefieldAdvanceDragSession.startMouseY) / pixelsPerUd;
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
}) {
  if (event.button !== 0 || !battlefieldSurface) {
    return false;
  }

  if (!state.game.advanceModeActive || state.game.selectedUnitId !== unitId) {
    return false;
  }

  event.preventDefault();
  onSuppressNextSurfaceClick();
  battlefieldAdvanceDragSession.active = true;
  battlefieldAdvanceDragSession.dispatch = dispatch;
  battlefieldAdvanceDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
  battlefieldAdvanceDragSession.zoom = state.game.viewport.zoom;
  battlefieldAdvanceDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldAdvanceDragSession.startMouseY = event.clientY;
  battlefieldAdvanceDragSession.startPreviewUd = state.game.advancePreviewUd;
  battlefieldAdvanceDragSession.maxAdvanceUd = maxAdvanceUd;
  battlefieldAdvanceDragSession.onSuppressNextSurfaceClick = onSuppressNextSurfaceClick;
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