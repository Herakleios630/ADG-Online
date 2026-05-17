import { getAxesFromRotation, getRotatedRectangleBounds } from '../geometry/index.js';

import {
  applyMovementPreview,
  createMovementPreview,
  createMovementSegment,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from './model.js';

function getAdvanceEndPose(unit, distanceUd) {
  const { forwardAxis } = getAxesFromRotation(unit.rotationRadians ?? 0);

  return {
    xUd: unit.xUd + forwardAxis.x * distanceUd,
    yUd: unit.yUd + forwardAxis.y * distanceUd,
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

export function createAdvanceSegment(unit, distanceUd) {
  return createMovementSegment({
    commandId: 'advance',
    unitId: unit.id,
    startPose: {
      xUd: unit.xUd,
      yUd: unit.yUd,
      rotationRadians: unit.rotationRadians ?? 0,
    },
    endPose: getAdvanceEndPose(unit, distanceUd),
    distance: {
      requestedUd: distanceUd,
      resolvedUd: distanceUd,
      measurementMode: 'forward-axis',
    },
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
}

export function createAdvancePreview(unit, distanceUd, battlefieldProfile) {
  const segment = createAdvanceSegment(unit, distanceUd);
  const inBounds = isPoseInsideBattlefield(segment.endPose, unit, battlefieldProfile);

  if (!inBounds) {
    return createMovementPreview({
      status: MOVEMENT_PREVIEW_STATUSES.REJECTED,
      segments: [segment],
      explanations: ['Advance preview leaves the battlefield footprint.'],
      diagnostics: [
        {
          id: 'battlefield-bounds',
          severity: 'error',
          message: 'Advance preview leaves the battlefield footprint.',
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
            message: 'Advance preview remains inside battlefield bounds.',
            sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
          },
        ],
      },
    ],
    explanations: ['Advance preview is ready to confirm.'],
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
}

export function applyAdvancePreview(unit, preview) {
  return applyMovementPreview(unit, preview);
}