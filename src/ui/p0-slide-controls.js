import { ACTION_TYPES } from '../state/p0-state.js';
import { MOVEMENT_SLIDE_SIDES } from '../state/p0-slide.js';

const battlefieldSlideDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  startMouseX: 0,
  startPreviewUd: 0,
  battlefieldProfile: null,
  onSuppressNextSurfaceClick: null,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function stopBattlefieldSlideDragSession() {
  battlefieldSlideDragSession.active = false;
  battlefieldSlideDragSession.dispatch = null;
  battlefieldSlideDragSession.surfaceRect = null;
  battlefieldSlideDragSession.battlefieldProfile = null;
  battlefieldSlideDragSession.onSuppressNextSurfaceClick = null;
}

function handleBattlefieldSlideDragMove(event) {
  if (!battlefieldSlideDragSession.active || !battlefieldSlideDragSession.dispatch || !battlefieldSlideDragSession.surfaceRect) {
    return;
  }

  const pixelsPerUd = (battlefieldSlideDragSession.surfaceRect.width * battlefieldSlideDragSession.zoom)
    / battlefieldSlideDragSession.battlefieldProfile.widthUd;
  if (!pixelsPerUd) {
    return;
  }

  const signedDistanceUd = battlefieldSlideDragSession.startPreviewUd + ((event.clientX - battlefieldSlideDragSession.startMouseX) / pixelsPerUd);
  battlefieldSlideDragSession.dispatch({
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: signedDistanceUd < 0 ? MOVEMENT_SLIDE_SIDES.LEFT : MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: clamp(Math.abs(signedDistanceUd), 0, 1),
  });
}

function handleBattlefieldSlideDragEnd() {
  if (!battlefieldSlideDragSession.active) {
    return;
  }

  battlefieldSlideDragSession.onSuppressNextSurfaceClick?.();
  stopBattlefieldSlideDragSession();
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', handleBattlefieldSlideDragMove);
  window.addEventListener('mouseup', handleBattlefieldSlideDragEnd);
}

export function tryStartBattlefieldSlideDrag({
  event,
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  unitId,
  onSuppressNextSurfaceClick,
}) {
  if (event.button !== 0 || !battlefieldSurface) {
    return false;
  }

  if (!state.game.slideModeActive || state.game.selectedUnitId !== unitId) {
    return false;
  }

  event.preventDefault();
  onSuppressNextSurfaceClick();
  battlefieldSlideDragSession.active = true;
  battlefieldSlideDragSession.dispatch = dispatch;
  battlefieldSlideDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
  battlefieldSlideDragSession.zoom = state.game.viewport.zoom;
  battlefieldSlideDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldSlideDragSession.startMouseX = event.clientX;
  battlefieldSlideDragSession.startPreviewUd = state.game.slidePreviewSide === MOVEMENT_SLIDE_SIDES.LEFT
    ? -(state.game.slidePreviewUd ?? 0)
    : (state.game.slidePreviewUd ?? 0);
  battlefieldSlideDragSession.onSuppressNextSurfaceClick = onSuppressNextSurfaceClick;
  return true;
}

export function bindSlideActionButtons({ container, dispatch, state }) {
  const slideButton = container.querySelector('[data-action="toggle-slide-mode"]');
  if (slideButton) {
    slideButton.addEventListener('click', () => {
      stopBattlefieldSlideDragSession();
      dispatch({ type: ACTION_TYPES.SET_SLIDE_MODE, isActive: !state.game.slideModeActive });
    });
  }
}
