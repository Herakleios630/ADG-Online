import {
  crossProduct,
  dotProduct,
  getVectorLength,
  localPointToWorldPoint,
  subtractVectors,
} from '../engine/geometry/index.js';
import {
  getCommittedMovementPreviewSegments,
  getLastCommittedMovementPreviewSegment,
  getMovementPreviewEndPose,
  MOVEMENT_COMMAND_IDS,
} from '../engine/movement/index.js';
import { ACTION_TYPES, MOVEMENT_PIVOT_SIDES } from '../state/p0-state.js';
import { getBattlefieldPointUd } from './battlefield-coordinate.js';

const battlefieldWheelDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  startAngleRadians: 0,
  pivotSide: null,
  pivotWorldPoint: null,
  startVector: null,
  battlefieldProfile: null,
  onSuppressNextSurfaceClick: null,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function stopBattlefieldWheelDragSession() {
  battlefieldWheelDragSession.active = false;
  battlefieldWheelDragSession.dispatch = null;
  battlefieldWheelDragSession.surfaceRect = null;
  battlefieldWheelDragSession.pivotSide = null;
  battlefieldWheelDragSession.pivotWorldPoint = null;
  battlefieldWheelDragSession.startVector = null;
  battlefieldWheelDragSession.battlefieldProfile = null;
  battlefieldWheelDragSession.onSuppressNextSurfaceClick = null;
}

function getFrontCornerLocalPoint(unit, side) {
  return {
    x: side === MOVEMENT_PIVOT_SIDES.LEFT ? -(unit.widthUd / 2) : unit.widthUd / 2,
    y: unit.depthUd / 2,
  };
}

function getOppositeFrontCornerSide(side) {
  return side === MOVEMENT_PIVOT_SIDES.LEFT
    ? MOVEMENT_PIVOT_SIDES.RIGHT
    : MOVEMENT_PIVOT_SIDES.LEFT;
}

function getSignedAngleBetween(startVector, endVector) {
  return Math.atan2(crossProduct(startVector, endVector), dotProduct(startVector, endVector));
}

function getWheelBasePose(state, selectedUnit, pivotSide) {
  const preview = state.game.movement.preview;
  const committedSegments = getCommittedMovementPreviewSegments(preview);
  const trimmedSegments = preview.status === 'accepted' && committedSegments[committedSegments.length - 1]?.commandId === MOVEMENT_COMMAND_IDS.WHEEL
    ? committedSegments.slice(0, -1)
    : committedSegments;

  return getMovementPreviewEndPose({ status: 'accepted', segments: trimmedSegments }, {
    xUd: selectedUnit.xUd,
    yUd: selectedUnit.yUd,
    rotationRadians: selectedUnit.rotationRadians ?? 0,
  });
}

function handleBattlefieldWheelDragMove(event) {
  if (!battlefieldWheelDragSession.active || !battlefieldWheelDragSession.dispatch || !battlefieldWheelDragSession.surfaceRect) {
    return;
  }

  const pointerUd = getBattlefieldPointUd(
    battlefieldWheelDragSession.surfaceRect,
    battlefieldWheelDragSession.zoom,
    0,
    0,
    event.clientX,
    event.clientY,
    battlefieldWheelDragSession.battlefieldProfile,
  );
  const candidateVector = subtractVectors(
    { x: pointerUd.xUd, y: pointerUd.yUd },
    battlefieldWheelDragSession.pivotWorldPoint,
  );

  if (
    getVectorLength(candidateVector) <= 1e-9
    || getVectorLength(battlefieldWheelDragSession.startVector) <= 1e-9
  ) {
    return;
  }

  const signedDeltaAngle = getSignedAngleBetween(battlefieldWheelDragSession.startVector, candidateVector);
  const orientedDeltaAngle = battlefieldWheelDragSession.pivotSide === MOVEMENT_PIVOT_SIDES.LEFT
    ? -signedDeltaAngle
    : signedDeltaAngle;

  battlefieldWheelDragSession.dispatch({
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: battlefieldWheelDragSession.pivotSide,
    angleRadians: clamp(
      battlefieldWheelDragSession.startAngleRadians + orientedDeltaAngle,
      0,
      Math.PI / 2,
    ),
  });
}

function handleBattlefieldWheelDragEnd() {
  if (!battlefieldWheelDragSession.active) {
    return;
  }

  battlefieldWheelDragSession.onSuppressNextSurfaceClick?.();
  stopBattlefieldWheelDragSession();
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', handleBattlefieldWheelDragMove);
  window.addEventListener('mouseup', handleBattlefieldWheelDragEnd);
}

export function tryStartBattlefieldWheelDrag({
  event,
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  unitId,
  selectedUnit,
  cornerSide,
  onSuppressNextSurfaceClick,
}) {
  if (event.button !== 0 || !battlefieldSurface || !selectedUnit || !cornerSide) {
    return false;
  }

  if (!state.game.wheelModeActive || state.game.selectedUnitId !== unitId) {
    return false;
  }

  const pivotSide = getOppositeFrontCornerSide(cornerSide);
  const basePose = getWheelBasePose(state, selectedUnit, pivotSide);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(state.game.movement.preview);
  const isAdjustingVisibleWheel = lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.WHEEL
    && state.game.wheelPivotSide === pivotSide
    && state.game.wheelPreviewAngleRadians > 0;
  const startPose = isAdjustingVisibleWheel
    ? getMovementPreviewEndPose(state.game.movement.preview, basePose)
    : basePose;
  const baseRectangle = {
    center: { x: basePose.xUd, y: basePose.yUd },
    widthUd: selectedUnit.widthUd,
    depthUd: selectedUnit.depthUd,
    rotationRadians: basePose.rotationRadians,
  };
  const startRectangle = {
    center: { x: startPose.xUd, y: startPose.yUd },
    widthUd: selectedUnit.widthUd,
    depthUd: selectedUnit.depthUd,
    rotationRadians: startPose.rotationRadians,
  };
  const pivotWorldPoint = localPointToWorldPoint(baseRectangle, getFrontCornerLocalPoint(selectedUnit, pivotSide));
  const movingCornerWorldPoint = localPointToWorldPoint(startRectangle, getFrontCornerLocalPoint(selectedUnit, cornerSide));

  event.preventDefault();
  onSuppressNextSurfaceClick();
  battlefieldWheelDragSession.active = true;
  battlefieldWheelDragSession.dispatch = dispatch;
  battlefieldWheelDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
  battlefieldWheelDragSession.zoom = state.game.viewport.zoom;
  battlefieldWheelDragSession.startAngleRadians = state.game.wheelPivotSide === pivotSide ? state.game.wheelPreviewAngleRadians : 0;
  battlefieldWheelDragSession.pivotSide = pivotSide;
  battlefieldWheelDragSession.pivotWorldPoint = pivotWorldPoint;
  battlefieldWheelDragSession.startVector = subtractVectors(movingCornerWorldPoint, pivotWorldPoint);
  battlefieldWheelDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldWheelDragSession.onSuppressNextSurfaceClick = onSuppressNextSurfaceClick;
  return true;
}

export function bindWheelActionButtons({ container, dispatch, state }) {
  const wheelButton = container.querySelector('[data-action="toggle-wheel-mode"]');
  if (wheelButton) {
    wheelButton.addEventListener('click', () => {
      stopBattlefieldWheelDragSession();
      dispatch({ type: ACTION_TYPES.SET_WHEEL_MODE, isActive: !state.game.wheelModeActive });
    });
  }

  const confirmMovementButton = container.querySelector('[data-action="confirm-movement"]');
  if (confirmMovementButton) {
    confirmMovementButton.addEventListener('click', () => {
      stopBattlefieldWheelDragSession();
      if (state.game.movement.selectedCommandId === 'wheel') {
        dispatch({ type: ACTION_TYPES.CONFIRM_WHEEL });
        return;
      }

      if (state.game.movement.selectedCommandId === 'slide') {
        dispatch({ type: ACTION_TYPES.CONFIRM_SLIDE });
        return;
      }

      dispatch({ type: ACTION_TYPES.CONFIRM_ADVANCE });
    });
  }
}