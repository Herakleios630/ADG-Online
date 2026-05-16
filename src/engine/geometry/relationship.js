import { worldPointToLocalPoint } from './rectangle.js';
import { getUnitBaseGeometry } from './unit-base.js';
import { getRectangleCenterDistance } from './distance.js';
import { FACING_ZONE_LABELS, classifyLocalPointFacingZone } from './facing-zones.js';

function isLeftFlankLabel(label) {
  return label === FACING_ZONE_LABELS.LEFT_FLANK;
}

function isRightFlankLabel(label) {
  return label === FACING_ZONE_LABELS.RIGHT_FLANK;
}

function getFlankRelationshipLabel(localTargetCenter, localTargetCorners, halfWidthUd) {
  const entirelyLeft = localTargetCorners.every((corner) => corner.x < -halfWidthUd - 1e-9);
  const entirelyRight = localTargetCorners.every((corner) => corner.x > halfWidthUd + 1e-9);

  if (entirelyLeft) {
    return FACING_ZONE_LABELS.LEFT_FLANK;
  }

  if (entirelyRight) {
    return FACING_ZONE_LABELS.RIGHT_FLANK;
  }

  if (localTargetCenter.x < -1e-9) {
    return FACING_ZONE_LABELS.LEFT_FLANK;
  }

  if (localTargetCenter.x > 1e-9) {
    return FACING_ZONE_LABELS.RIGHT_FLANK;
  }

  return FACING_ZONE_LABELS.FLANK;
}

function getSourceRectangle(geometry) {
  return {
    center: geometry.center,
    widthUd: geometry.widthUd,
    depthUd: geometry.depthUd,
    rotationRadians: geometry.rotationRadians,
  };
}

function getUniqueLabels(labels) {
  return [...new Set(labels)];
}

function getBoundaryFlags(localPoint, halfWidthUd, halfDepthUd) {
  const boundaryFlags = [];

  if (Math.abs(Math.abs(localPoint.x) - halfWidthUd) <= 1e-9) {
    boundaryFlags.push(localPoint.x < 0 ? 'leftFlankBoundary' : 'rightFlankBoundary');
  }

  if (Math.abs(Math.abs(localPoint.y) - halfDepthUd) <= 1e-9) {
    boundaryFlags.push(localPoint.y < 0 ? 'rearBoundary' : 'frontBoundary');
  }

  return [...new Set(boundaryFlags)];
}

export function classifyFacingRelationship(sourceUnitBase, targetUnitBase) {
  const sourceGeometry = getUnitBaseGeometry(sourceUnitBase);
  const targetGeometry = getUnitBaseGeometry(targetUnitBase);
  const sourceRectangle = getSourceRectangle(sourceGeometry);
  const halfWidthUd = sourceGeometry.widthUd / 2;
  const halfDepthUd = sourceGeometry.depthUd / 2;

  const localTargetCenter = worldPointToLocalPoint(sourceRectangle, targetGeometry.center);
  const localTargetCorners = Object.values(targetGeometry.corners).map((corner) =>
    worldPointToLocalPoint(sourceRectangle, corner),
  );
  const centerLabel = classifyLocalPointFacingZone(localTargetCenter, halfWidthUd, halfDepthUd);
  const cornerLabels = localTargetCorners.map((corner) =>
    classifyLocalPointFacingZone(corner, halfWidthUd, halfDepthUd),
  );
  const distinctCornerLabels = getUniqueLabels(
    cornerLabels.filter((label) => label !== FACING_ZONE_LABELS.BOUNDARY),
  );
  const allCornersInFront = cornerLabels.every((label) => label === FACING_ZONE_LABELS.FRONT);
  const hasRearCorner = cornerLabels.includes(FACING_ZONE_LABELS.REAR);
  const hasFlankCorner = cornerLabels.some((label) => isLeftFlankLabel(label) || isRightFlankLabel(label));

  let primaryLabel = centerLabel;
  let explanation = 'Target center determines the current geometric relationship.';

  if (centerLabel === FACING_ZONE_LABELS.BOUNDARY) {
    explanation = 'Target center lies directly on a source-facing boundary line.';
  } else if (allCornersInFront && centerLabel === FACING_ZONE_LABELS.FRONT) {
    primaryLabel = FACING_ZONE_LABELS.FRONT;
    explanation = 'Target footprint lies completely beyond the source front boundary.';
  } else if (hasRearCorner && hasFlankCorner) {
    primaryLabel = FACING_ZONE_LABELS.AMBIGUOUS;
    explanation = 'Target footprint spans both flank and rear space, so the geometric contact is ambiguous.';
  } else if (hasRearCorner) {
    primaryLabel = FACING_ZONE_LABELS.REAR;
    explanation = 'Part of the target footprint reaches beyond the source rear boundary.';
  } else if (distinctCornerLabels.some((label) => label !== FACING_ZONE_LABELS.FRONT) || centerLabel !== FACING_ZONE_LABELS.FRONT) {
    primaryLabel = getFlankRelationshipLabel(localTargetCenter, localTargetCorners, halfWidthUd);
    explanation = 'Part of the target footprint lies behind the source front boundary but not beyond the rear boundary.';
  } else if (centerLabel === FACING_ZONE_LABELS.AMBIGUOUS) {
    explanation = 'Target center overlaps the source footprint.';
  }

  return {
    primaryLabel,
    centerLabel,
    cornerLabels,
    localTargetCenter,
    localTargetCorners,
    involvedBoundaries: getBoundaryFlags(localTargetCenter, halfWidthUd, halfDepthUd),
    sourceGeometry,
    targetGeometry,
    distances: {
      centerToCenterUd: getRectangleCenterDistance(sourceGeometry, targetGeometry),
    },
    explanation,
  };
}