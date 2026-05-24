import {
  getRotatedRectangleBounds,
  localPointToWorldPoint,
  subtractVectors,
} from '../geometry/index.js';

import {
  applyMovementPreview,
  createMovementPreview,
  createMovementSegment,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from './model.js';

const FULL_SINGLE_UNIT_WHEEL_ANGLE_RADIANS = Math.PI / 2;
const FULL_SINGLE_UNIT_WHEEL_DISTANCE_UD = 1.5;

export function getWheelDistanceUdForAngleRadians(angleRadians) {
  return (Math.abs(angleRadians) / FULL_SINGLE_UNIT_WHEEL_ANGLE_RADIANS) * FULL_SINGLE_UNIT_WHEEL_DISTANCE_UD;
}

export function getWheelAngleRadiansForDistanceUd(distanceUd) {
  if (distanceUd <= 0) {
    return 0;
  }

  if (distanceUd >= FULL_SINGLE_UNIT_WHEEL_DISTANCE_UD) {
    return FULL_SINGLE_UNIT_WHEEL_ANGLE_RADIANS;
  }

  return (distanceUd / FULL_SINGLE_UNIT_WHEEL_DISTANCE_UD) * FULL_SINGLE_UNIT_WHEEL_ANGLE_RADIANS;
}

function getWheelPivotLocalPoint(unit, pivotSide) {
  return {
    x: pivotSide === MOVEMENT_PIVOT_SIDES.LEFT ? -(unit.widthUd / 2) : unit.widthUd / 2,
    y: unit.depthUd / 2,
  };
}

function getWheelSignedAngleRadians(pivotSide, angleRadians) {
  return pivotSide === MOVEMENT_PIVOT_SIDES.LEFT ? -Math.abs(angleRadians) : Math.abs(angleRadians);
}

export function getWheelEndPose(unit, pivotSide, angleRadians) {
  const pivotLocalPoint = getWheelPivotLocalPoint(unit, pivotSide);
  const pivotWorldPoint = localPointToWorldPoint(
    {
      center: { x: unit.xUd, y: unit.yUd },
      widthUd: unit.widthUd,
      depthUd: unit.depthUd,
      rotationRadians: unit.rotationRadians ?? 0,
    },
    pivotLocalPoint,
  );
  const endRotationRadians = (unit.rotationRadians ?? 0) + getWheelSignedAngleRadians(pivotSide, angleRadians);
  const endPivotOffset = localPointToWorldPoint(
    {
      center: { x: 0, y: 0 },
      widthUd: unit.widthUd,
      depthUd: unit.depthUd,
      rotationRadians: endRotationRadians,
    },
    pivotLocalPoint,
  );
  const nextCenter = subtractVectors(pivotWorldPoint, endPivotOffset);

  return {
    xUd: nextCenter.x,
    yUd: nextCenter.y,
    rotationRadians: endRotationRadians,
  };
}

function isPoseInsideBattlefield(pose, unit, battlefieldProfile) {
  const footprintBounds = getRotatedRectangleBounds({
    center: { x: pose.xUd, y: pose.yUd },
    widthUd: unit.widthUd,
    depthUd: unit.depthUd,
    rotationRadians: pose.rotationRadians,
  });

  return footprintBounds.minX >= 0
    && footprintBounds.maxX <= battlefieldProfile.widthUd
    && footprintBounds.minY >= 0
    && footprintBounds.maxY <= battlefieldProfile.heightUd;
}

export function createWheelSegment(unit, pivotSide, angleRadians) {
  const resolvedAngleRadians = Math.abs(angleRadians);
  const resolvedDistanceUd = getWheelDistanceUdForAngleRadians(resolvedAngleRadians);

  return createMovementSegment({
    commandId: 'wheel',
    unitId: unit.id,
    startPose: {
      xUd: unit.xUd,
      yUd: unit.yUd,
      rotationRadians: unit.rotationRadians ?? 0,
    },
    endPose: getWheelEndPose(unit, pivotSide, resolvedAngleRadians),
    maneuver: {
      pivotSide,
      angleRadians: resolvedAngleRadians,
    },
    distance: {
      requestedUd: resolvedDistanceUd,
      resolvedUd: resolvedDistanceUd,
      measurementMode: 'p4-linear-90deg-equals-1.5ud',
    },
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
}

export function createWheelPreview(unit, pivotSide, angleRadians, battlefieldProfile) {
  const segment = createWheelSegment(unit, pivotSide, angleRadians);
  const inBounds = isPoseInsideBattlefield(segment.endPose, unit, battlefieldProfile);

  if (!inBounds) {
    return createMovementPreview({
      status: MOVEMENT_PREVIEW_STATUSES.REJECTED,
      segments: [segment],
      explanations: ['Wheel preview leaves the battlefield footprint.'],
      diagnostics: [
        {
          id: 'battlefield-bounds',
          severity: 'error',
          message: 'Wheel preview leaves the battlefield footprint.',
          sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
        },
      ],
      sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
    });
  }

  return createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [
      {
        ...segment,
        diagnostics: [
          {
            id: 'battlefield-bounds',
            severity: 'info',
            message: 'Wheel preview remains inside battlefield bounds.',
            sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
          },
        ],
      },
    ],
    explanations: ['Wheel preview is ready to confirm.'],
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
}

export function applyWheelPreview(unit, preview) {
  return applyMovementPreview(unit, preview);
}