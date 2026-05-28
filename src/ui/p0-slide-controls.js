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
  onRecordDragCheckpoint: null,
  chargeModeActive: false,
  lastChargeSlideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
  lastChargeDistanceUd: 0,
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
  battlefieldSlideDragSession.onRecordDragCheckpoint = null;
  battlefieldSlideDragSession.chargeModeActive = false;
  battlefieldSlideDragSession.lastChargeSlideSide = MOVEMENT_SLIDE_SIDES.RIGHT;
  battlefieldSlideDragSession.lastChargeDistanceUd = 0;
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
  const slideSide = signedDistanceUd < 0 ? MOVEMENT_SLIDE_SIDES.LEFT : MOVEMENT_SLIDE_SIDES.RIGHT;
  const distanceUd = clamp(Math.abs(signedDistanceUd), 0, 1);

  if (battlefieldSlideDragSession.chargeModeActive) {
    battlefieldSlideDragSession.lastChargeSlideSide = slideSide;
    battlefieldSlideDragSession.lastChargeDistanceUd = distanceUd;
    battlefieldSlideDragSession.dispatch({
      type: ACTION_TYPES.PREVIEW_CHARGE_START_MANOEUVRE,
      manoeuvreType: 'shift-slide',
      slideSide,
      distanceUd,
    });
    return;
  }

  battlefieldSlideDragSession.dispatch({
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide,
    distanceUd,
  });
}

function handleBattlefieldSlideDragEnd() {
  if (!battlefieldSlideDragSession.active) {
    return;
  }

  if (battlefieldSlideDragSession.chargeModeActive && battlefieldSlideDragSession.dispatch) {
    battlefieldSlideDragSession.dispatch({
      type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
      manoeuvreType: 'shift-slide',
      slideSide: battlefieldSlideDragSession.lastChargeSlideSide,
      distanceUd: battlefieldSlideDragSession.lastChargeDistanceUd,
    });
  }

  battlefieldSlideDragSession.onRecordDragCheckpoint?.();
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
  onRecordDragCheckpoint,
}) {
  if (event.button !== 0 || !battlefieldSurface) {
    return false;
  }

  const chargeStartControlsActive = state.game.chargePreview?.intent?.unitId === state.game.selectedUnitId
    && (state.game.chargePreview?.status === 'manoeuvre-selecting' || state.game.chargePreview?.status === 'ready');
  const chargeSlideActive = chargeStartControlsActive
    && state.game.chargePreview?.intent?.startManoeuvre?.type === 'shift-slide';

  if ((!state.game.slideModeActive && !chargeSlideActive) || state.game.selectedUnitId !== unitId) {
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
  battlefieldSlideDragSession.startPreviewUd = chargeSlideActive
    ? ((state.game.chargePreview?.intent?.startManoeuvre?.slideSide === MOVEMENT_SLIDE_SIDES.LEFT ? -1 : 1)
      * Number(state.game.chargePreview?.intent?.startManoeuvre?.slideDistanceUd ?? 0))
    : (state.game.slidePreviewSide === MOVEMENT_SLIDE_SIDES.LEFT
      ? -(state.game.slidePreviewUd ?? 0)
      : (state.game.slidePreviewUd ?? 0));
  battlefieldSlideDragSession.onSuppressNextSurfaceClick = onSuppressNextSurfaceClick;
  battlefieldSlideDragSession.onRecordDragCheckpoint = onRecordDragCheckpoint ?? null;
  battlefieldSlideDragSession.chargeModeActive = chargeSlideActive;
  battlefieldSlideDragSession.lastChargeSlideSide = chargeSlideActive
    ? (state.game.chargePreview?.intent?.startManoeuvre?.slideSide ?? MOVEMENT_SLIDE_SIDES.RIGHT)
    : MOVEMENT_SLIDE_SIDES.RIGHT;
  battlefieldSlideDragSession.lastChargeDistanceUd = chargeSlideActive
    ? Number(state.game.chargePreview?.intent?.startManoeuvre?.slideDistanceUd ?? 0)
    : 0;
  return true;
}

export function bindSlideActionButtons({ container, dispatch, state }) {
  const slideButton = container.querySelector('[data-action="toggle-slide-mode"]');
  if (slideButton) {
    slideButton.addEventListener('click', () => {
      const chargeStartControlsActive = state.game.chargePreview?.intent?.unitId === state.game.selectedUnitId
        && (state.game.chargePreview?.status === 'manoeuvre-selecting' || state.game.chargePreview?.status === 'ready');
      if (chargeStartControlsActive) {
        stopBattlefieldSlideDragSession();
        const currentStart = state.game.chargePreview?.intent?.startManoeuvre;
        dispatch({
          type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
          manoeuvreType: 'shift-slide',
          slideSide: currentStart?.type === 'shift-slide' ? currentStart.slideSide : MOVEMENT_SLIDE_SIDES.RIGHT,
          distanceUd: currentStart?.type === 'shift-slide' ? currentStart.slideDistanceUd : 0,
        });
        return;
      }

      stopBattlefieldSlideDragSession();
      dispatch({ type: ACTION_TYPES.SET_SLIDE_MODE, isActive: !state.game.slideModeActive });
    });
  }
}
