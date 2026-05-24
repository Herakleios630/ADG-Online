import {
  dotProduct,
  getVectorLength,
  localPointToWorldPoint,
  rotateVector,
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
  chargeModeActive: false,
  lastChargeAngleRadians: 0,
};

const MAX_WHEEL_ANGLE_RADIANS = Math.PI / 2;
const WHEEL_DRAG_EPSILON = 1e-9;

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
  battlefieldWheelDragSession.chargeModeActive = false;
  battlefieldWheelDragSession.lastChargeAngleRadians = 0;
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

function getWheelSignedRotationDirection(pivotSide) {
  return pivotSide === MOVEMENT_PIVOT_SIDES.LEFT ? -1 : 1;
}

function getProjectedAngleDelta(pointerDelta, displacement, angleRangeRadians) {
  const displacementLengthSquared = dotProduct(displacement, displacement);
  if (displacementLengthSquared <= WHEEL_DRAG_EPSILON || angleRangeRadians <= WHEEL_DRAG_EPSILON) {
    return 0;
  }

  const progress = dotProduct(pointerDelta, displacement) / displacementLengthSquared;
  return progress > 0 ? progress * angleRangeRadians : 0;
}

function getProjectedWheelDragAngleRadians(startAngleRadians, pivotSide, startVector, candidateVector) {
  const pointerDelta = subtractVectors(candidateVector, startVector);
  const signedDirection = getWheelSignedRotationDirection(pivotSide);
  const remainingAngleRadians = MAX_WHEEL_ANGLE_RADIANS - startAngleRadians;
  const angleDeltas = [0];

  if (remainingAngleRadians > WHEEL_DRAG_EPSILON) {
    const maxAngleVector = rotateVector(startVector, signedDirection * remainingAngleRadians);
    const maxAngleDisplacement = subtractVectors(maxAngleVector, startVector);
    angleDeltas.push(getProjectedAngleDelta(pointerDelta, maxAngleDisplacement, remainingAngleRadians));
  }

  if (startAngleRadians > WHEEL_DRAG_EPSILON) {
    const zeroAngleVector = rotateVector(startVector, -signedDirection * startAngleRadians);
    const zeroAngleDisplacement = subtractVectors(zeroAngleVector, startVector);
    angleDeltas.push(-getProjectedAngleDelta(pointerDelta, zeroAngleDisplacement, startAngleRadians));
  }

  const strongestDelta = angleDeltas.reduce((strongest, candidate) => (
    Math.abs(candidate) > Math.abs(strongest) ? candidate : strongest
  ), 0);

  return clamp(startAngleRadians + strongestDelta, 0, MAX_WHEEL_ANGLE_RADIANS);
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

  const angleRadians = getProjectedWheelDragAngleRadians(
    battlefieldWheelDragSession.startAngleRadians,
    battlefieldWheelDragSession.pivotSide,
    battlefieldWheelDragSession.startVector,
    candidateVector,
  );

  if (battlefieldWheelDragSession.chargeModeActive) {
    battlefieldWheelDragSession.lastChargeAngleRadians = angleRadians;
    battlefieldWheelDragSession.dispatch({
      type: ACTION_TYPES.PREVIEW_CHARGE_START_MANOEUVRE,
      manoeuvreType: 'wheel',
      pivotSide: battlefieldWheelDragSession.pivotSide,
      angleRadians,
    });
    return;
  }

  battlefieldWheelDragSession.dispatch({
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: battlefieldWheelDragSession.pivotSide,
    angleRadians,
  });
}

function handleBattlefieldWheelDragEnd() {
  if (!battlefieldWheelDragSession.active) {
    return;
  }

  if (battlefieldWheelDragSession.chargeModeActive && battlefieldWheelDragSession.dispatch) {
    battlefieldWheelDragSession.dispatch({
      type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
      manoeuvreType: 'wheel',
      pivotSide: battlefieldWheelDragSession.pivotSide,
      angleRadians: battlefieldWheelDragSession.lastChargeAngleRadians,
    });
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

  const chargeStartControlsActive = state.game.chargePreview?.intent?.unitId === state.game.selectedUnitId
    && (state.game.chargePreview?.status === 'manoeuvre-selecting' || state.game.chargePreview?.status === 'ready');
  const chargeWheelActive = chargeStartControlsActive
    && state.game.chargePreview?.intent?.startManoeuvre?.type === 'wheel';

  if ((!state.game.wheelModeActive && !chargeWheelActive) || state.game.selectedUnitId !== unitId) {
    return false;
  }

  const pivotSide = getOppositeFrontCornerSide(cornerSide);
  const basePose = chargeWheelActive
    ? {
        xUd: selectedUnit.xUd,
        yUd: selectedUnit.yUd,
        rotationRadians: selectedUnit.rotationRadians ?? 0,
      }
    : getWheelBasePose(state, selectedUnit, pivotSide);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(state.game.movement.preview);
  const isAdjustingVisibleWheel = chargeWheelActive
    ? state.game.chargePreview?.intent?.startManoeuvre?.pivotSide === pivotSide
      && Number(state.game.chargePreview?.intent?.startManoeuvre?.wheelAngleRadians ?? 0) > 0
    : lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.WHEEL
      && state.game.wheelPivotSide === pivotSide
      && state.game.wheelPreviewAngleRadians > 0;
  const startPose = isAdjustingVisibleWheel
    ? (chargeWheelActive
      ? (state.game.chargePreview?.intent?.startPose ?? basePose)
      : getMovementPreviewEndPose(state.game.movement.preview, basePose))
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
  battlefieldWheelDragSession.startAngleRadians = chargeWheelActive
    ? (state.game.chargePreview?.intent?.startManoeuvre?.pivotSide === pivotSide
      ? Number(state.game.chargePreview?.intent?.startManoeuvre?.wheelAngleRadians ?? 0)
      : 0)
    : (state.game.wheelPivotSide === pivotSide ? state.game.wheelPreviewAngleRadians : 0);
  battlefieldWheelDragSession.pivotSide = pivotSide;
  battlefieldWheelDragSession.pivotWorldPoint = pivotWorldPoint;
  battlefieldWheelDragSession.startVector = subtractVectors(movingCornerWorldPoint, pivotWorldPoint);
  battlefieldWheelDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldWheelDragSession.onSuppressNextSurfaceClick = onSuppressNextSurfaceClick;
  battlefieldWheelDragSession.chargeModeActive = chargeWheelActive;
  battlefieldWheelDragSession.lastChargeAngleRadians = battlefieldWheelDragSession.startAngleRadians;
  return true;
}

export function bindWheelActionButtons({ container, dispatch, state }) {
  const wheelButton = container.querySelector('[data-action="toggle-wheel-mode"]');
  if (wheelButton) {
    wheelButton.addEventListener('click', () => {
      const chargeStartControlsActive = state.game.chargePreview?.intent?.unitId === state.game.selectedUnitId
        && (state.game.chargePreview?.status === 'manoeuvre-selecting' || state.game.chargePreview?.status === 'ready');
      if (chargeStartControlsActive) {
        stopBattlefieldWheelDragSession();
        const currentStart = state.game.chargePreview?.intent?.startManoeuvre;
        dispatch({
          type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
          manoeuvreType: 'wheel',
          pivotSide: currentStart?.type === 'wheel' ? currentStart.pivotSide : MOVEMENT_PIVOT_SIDES.LEFT,
          angleRadians: currentStart?.type === 'wheel' ? currentStart.wheelAngleRadians : 0,
        });
        return;
      }

      stopBattlefieldWheelDragSession();
      dispatch({ type: ACTION_TYPES.SET_WHEEL_MODE, isActive: !state.game.wheelModeActive });
    });
  }

  const confirmMovementButton = container.querySelector('[data-action="confirm-movement"]');
  if (confirmMovementButton) {
    confirmMovementButton.addEventListener('click', () => {
      stopBattlefieldWheelDragSession();

      if (state.game.chargePreview?.status === 'ready' && state.game.chargePreview?.intent?.unitId === state.game.selectedUnitId) {
        dispatch({ type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
        return;
      }

      if (state.game.commanderFreeMovePreview?.status === 'ready') {
        dispatch({ type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE });
        return;
      }

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