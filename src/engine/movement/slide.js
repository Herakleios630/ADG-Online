import { addVectors, getAxesFromRotation, getRotatedRectangleBounds, scaleVector } from '../geometry/index.js';

import {
  applyMovementPreview,
  createMovementPreview,
  createMovementSegment,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from './model.js';

export const MOVEMENT_SLIDE_SIDES = {
  LEFT: 'left',
  RIGHT: 'right',
};

function getSignedSlideDistanceUd(side, distanceUd) {
  return side === MOVEMENT_SLIDE_SIDES.LEFT
    ? -Math.abs(distanceUd)
    : Math.abs(distanceUd);
}

function getSlideEndPose(unit, side, distanceUd) {
  const { rightAxis } = getAxesFromRotation(unit.rotationRadians ?? 0);
  const signedDistanceUd = getSignedSlideDistanceUd(side, distanceUd);
  const nextCenter = addVectors(
    { x: unit.xUd, y: unit.yUd },
    scaleVector(rightAxis, signedDistanceUd),
  );

  return {
    xUd: nextCenter.x,
    yUd: nextCenter.y,
    rotationRadians: unit.rotationRadians ?? 0,
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

export function createSlideSegment(unit, side, distanceUd) {
  const resolvedDistanceUd = Math.abs(distanceUd);

  return createMovementSegment({
    commandId: 'slide',
    unitId: unit.id,
    startPose: {
      xUd: unit.xUd,
      yUd: unit.yUd,
      rotationRadians: unit.rotationRadians ?? 0,
    },
    endPose: getSlideEndPose(unit, side, resolvedDistanceUd),
    distance: {
      requestedUd: resolvedDistanceUd,
      resolvedUd: resolvedDistanceUd,
      measurementMode: `slide-${side}-free-lateral`,
    },
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
}

export function createSlidePreview(unit, side, distanceUd, battlefieldProfile) {
  const segment = createSlideSegment(unit, side, distanceUd);
  const inBounds = isPoseInsideBattlefield(segment.endPose, unit, battlefieldProfile);

  if (!inBounds) {
    return createMovementPreview({
      status: MOVEMENT_PREVIEW_STATUSES.REJECTED,
      segments: [segment],
      explanations: ['Slide preview leaves the battlefield footprint.'],
      diagnostics: [
        {
          id: 'battlefield-bounds',
          severity: 'error',
          message: 'Slide preview leaves the battlefield footprint.',
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
            id: 'slide-free-lateral-p4',
            severity: 'warning',
            message: 'P4 uses a user-approved slide assumption: lateral movement up to 1 UD is free, but the full chain still needs at least 1 UD forward before confirmation.',
            sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
          },
          {
            id: 'battlefield-bounds',
            severity: 'info',
            message: 'Slide preview remains inside battlefield bounds.',
            sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
          },
        ],
      },
    ],
    explanations: ['Slide preview is ready geometrically.'],
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
}

export function applySlidePreview(unit, preview) {
  return applyMovementPreview(unit, preview);
}