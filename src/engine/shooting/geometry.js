import {
  GEOMETRY_EPSILON,
  addVectors,
  getPointDistance,
  getRotatedRectangleCorners,
  getUnitBaseGeometry,
  normalizeVector,
  scaleVector,
  subtractVectors,
  worldPointToLocalPoint,
} from '../geometry/index.js';
import {
  SHOOTING_EDGE_RULES,
  SHOOTING_PROFILE_IDS,
  SHOOTING_SOURCE_STATUSES,
  SHOOTING_ZONE_KINDS,
  getShootingProfile,
} from './model.js';

export const SHOOTING_GEOMETRY_REASON_CODES = {
  SHOOTING_PROFILE_UNRESOLVED: 'shooting-profile-unresolved',
  NON_SHOOTER_PROFILE: 'non-shooter-profile',
  UNSUPPORTED_EDGE_RULE: 'unsupported-edge-rule',
  UNSUPPORTED_ZONE_KIND: 'unsupported-zone-kind',
  SPECIAL_ZONE_DEFERRED: 'special-zone-deferred',
};

function createDiagnostic(code, message, sourceStatus = SHOOTING_SOURCE_STATUSES.VERIFIED) {
  return { code, message, sourceStatus };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toWorldRectangle(unit) {
  return {
    center: { x: Number(unit?.xUd ?? 0), y: Number(unit?.yUd ?? 0) },
    widthUd: Number(unit?.widthUd ?? 0),
    depthUd: Number(unit?.depthUd ?? 0),
    rotationRadians: Number(unit?.rotationRadians ?? 0),
  };
}

function getCircleRadiusUd(unit) {
  return Number(unit?.widthUd ?? 0) / 2;
}

function isCircleBase(unit) {
  return unit?.baseShape === 'circle';
}

function buildMeasurement(sourcePoint, targetPoint) {
  return {
    sourcePoint,
    targetPoint,
    distanceUd: getPointDistance(sourcePoint, targetPoint),
  };
}

function chooseBestMeasurement(currentBest, candidate) {
  if (!candidate) {
    return currentBest;
  }

  if (!currentBest) {
    return candidate;
  }

  return candidate.distanceUd < currentBest.distanceUd - GEOMETRY_EPSILON ? candidate : currentBest;
}

function getClosestPointOnSegment(start, end, point) {
  const segment = subtractVectors(end, start);
  const segmentLengthSquared = (segment.x * segment.x) + (segment.y * segment.y);

  if (segmentLengthSquared <= GEOMETRY_EPSILON) {
    return start;
  }

  const fromStart = subtractVectors(point, start);
  const factor = clamp(((fromStart.x * segment.x) + (fromStart.y * segment.y)) / segmentLengthSquared, 0, 1);

  return addVectors(start, scaleVector(segment, factor));
}

function getClosestPointOnRotatedRectangle(rectangle, worldPoint) {
  const localPoint = worldPointToLocalPoint(rectangle, worldPoint);
  const halfWidth = rectangle.widthUd / 2;
  const halfDepth = rectangle.depthUd / 2;
  const clampedLocalPoint = {
    x: clamp(localPoint.x, -halfWidth, halfWidth),
    y: clamp(localPoint.y, -halfDepth, halfDepth),
  };

  return {
    x: rectangle.center.x + (clampedLocalPoint.x * Math.cos(rectangle.rotationRadians)) - (clampedLocalPoint.y * Math.sin(rectangle.rotationRadians)),
    y: rectangle.center.y + (clampedLocalPoint.x * Math.sin(rectangle.rotationRadians)) + (clampedLocalPoint.y * Math.cos(rectangle.rotationRadians)),
  };
}

function getClosestPointOnCircle(unit, worldPoint) {
  const center = { x: Number(unit?.xUd ?? 0), y: Number(unit?.yUd ?? 0) };
  const offset = subtractVectors(worldPoint, center);
  const length = getPointDistance(center, worldPoint);
  const radiusUd = getCircleRadiusUd(unit);

  if (length <= GEOMETRY_EPSILON) {
    return center;
  }

  return addVectors(center, scaleVector(normalizeVector(offset), radiusUd));
}

function getSegmentIntersectionPoint(leftStart, leftEnd, rightStart, rightEnd) {
  const leftDelta = subtractVectors(leftEnd, leftStart);
  const rightDelta = subtractVectors(rightEnd, rightStart);
  const determinant = (leftDelta.x * rightDelta.y) - (leftDelta.y * rightDelta.x);

  if (Math.abs(determinant) <= GEOMETRY_EPSILON) {
    return null;
  }

  const startDelta = subtractVectors(rightStart, leftStart);
  const leftFactor = ((startDelta.x * rightDelta.y) - (startDelta.y * rightDelta.x)) / determinant;
  const rightFactor = ((startDelta.x * leftDelta.y) - (startDelta.y * leftDelta.x)) / determinant;

  if (
    leftFactor < -GEOMETRY_EPSILON
    || leftFactor > 1 + GEOMETRY_EPSILON
    || rightFactor < -GEOMETRY_EPSILON
    || rightFactor > 1 + GEOMETRY_EPSILON
  ) {
    return null;
  }

  return {
    x: leftStart.x + (leftDelta.x * leftFactor),
    y: leftStart.y + (leftDelta.y * leftFactor),
  };
}

function getRectangleEdges(rectangle) {
  const corners = getRotatedRectangleCorners(rectangle);
  return [
    { start: corners[0], end: corners[1] },
    { start: corners[1], end: corners[2] },
    { start: corners[2], end: corners[3] },
    { start: corners[3], end: corners[0] },
  ];
}

function getFrontEdgeMeasurementToCircle(frontEdge, targetUnit) {
  const center = { x: Number(targetUnit?.xUd ?? 0), y: Number(targetUnit?.yUd ?? 0) };
  const sourcePoint = getClosestPointOnSegment(frontEdge.start, frontEdge.end, center);
  const targetPoint = getClosestPointOnCircle(targetUnit, sourcePoint);
  const distanceUd = getPointDistance(sourcePoint, targetPoint);

  if (distanceUd <= GEOMETRY_EPSILON) {
    return buildMeasurement(sourcePoint, sourcePoint);
  }

  return buildMeasurement(sourcePoint, targetPoint);
}

function getFrontEdgeMeasurementToRectangle(frontEdge, targetUnit) {
  const targetRectangle = toWorldRectangle(targetUnit);
  const targetEdges = getRectangleEdges(targetRectangle);

  for (const targetEdge of targetEdges) {
    const intersectionPoint = getSegmentIntersectionPoint(
      frontEdge.start,
      frontEdge.end,
      targetEdge.start,
      targetEdge.end,
    );

    if (intersectionPoint) {
      return buildMeasurement(intersectionPoint, intersectionPoint);
    }
  }

  let bestMeasurement = null;
  const targetCorners = getRotatedRectangleCorners(targetRectangle);

  for (const targetCorner of targetCorners) {
    bestMeasurement = chooseBestMeasurement(
      bestMeasurement,
      buildMeasurement(getClosestPointOnSegment(frontEdge.start, frontEdge.end, targetCorner), targetCorner),
    );
  }

  bestMeasurement = chooseBestMeasurement(
    bestMeasurement,
    buildMeasurement(frontEdge.start, getClosestPointOnRotatedRectangle(targetRectangle, frontEdge.start)),
  );
  bestMeasurement = chooseBestMeasurement(
    bestMeasurement,
    buildMeasurement(frontEdge.end, getClosestPointOnRotatedRectangle(targetRectangle, frontEdge.end)),
  );

  return bestMeasurement;
}

function getTargetMeasurementFromFrontEdge(shooterUnit, targetUnit) {
  const shooterGeometry = getUnitBaseGeometry(toWorldRectangle(shooterUnit));
  const frontEdge = shooterGeometry.frontEdge;

  return isCircleBase(targetUnit)
    ? getFrontEdgeMeasurementToCircle(frontEdge, targetUnit)
    : getFrontEdgeMeasurementToRectangle(frontEdge, targetUnit);
}

export function getNormalFrontZoneLocalBounds(shooterUnit, profile) {
  const halfWidthUd = Number(shooterUnit?.widthUd ?? 0) / 2;
  const halfDepthUd = Number(shooterUnit?.depthUd ?? 0) / 2;
  const rangeUd = Number(profile?.rangeUd ?? 0);

  return {
    minX: -(halfWidthUd + 1),
    maxX: halfWidthUd + 1,
    minY: halfDepthUd,
    maxY: halfDepthUd + rangeUd,
  };
}

function isLocalPointInBounds(point, bounds) {
  return point.x >= bounds.minX - GEOMETRY_EPSILON
    && point.x <= bounds.maxX + GEOMETRY_EPSILON
    && point.y >= bounds.minY - GEOMETRY_EPSILON
    && point.y <= bounds.maxY + GEOMETRY_EPSILON;
}

function getZoneRectangleCorners(bounds) {
  return [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
    { x: bounds.minX, y: bounds.maxY },
  ];
}

function getLocalRectangleEdges(corners) {
  return [
    { start: corners[0], end: corners[1] },
    { start: corners[1], end: corners[2] },
    { start: corners[2], end: corners[3] },
    { start: corners[3], end: corners[0] },
  ];
}

function isPointInsideLocalRectangle(point, corners) {
  const xValues = corners.map((corner) => corner.x);
  const yValues = corners.map((corner) => corner.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  return point.x >= minX - GEOMETRY_EPSILON
    && point.x <= maxX + GEOMETRY_EPSILON
    && point.y >= minY - GEOMETRY_EPSILON
    && point.y <= maxY + GEOMETRY_EPSILON;
}

function evaluateRectangleTargetInZone(shooterUnit, targetUnit, zoneBounds) {
  const targetRectangle = toWorldRectangle(targetUnit);
  const targetCornersLocal = getRotatedRectangleCorners(targetRectangle)
    .map((corner) => worldPointToLocalPoint(toWorldRectangle(shooterUnit), corner));

  if (targetCornersLocal.some((corner) => isLocalPointInBounds(corner, zoneBounds))) {
    return true;
  }

  const zoneCorners = getZoneRectangleCorners(zoneBounds);
  if (zoneCorners.some((corner) => isPointInsideLocalRectangle(corner, targetCornersLocal))) {
    return true;
  }

  const zoneEdges = getLocalRectangleEdges(zoneCorners);
  const targetEdges = getLocalRectangleEdges(targetCornersLocal);

  return zoneEdges.some((zoneEdge) => targetEdges.some((targetEdge) => getSegmentIntersectionPoint(
    zoneEdge.start,
    zoneEdge.end,
    targetEdge.start,
    targetEdge.end,
  )));
}

function evaluateCircleTargetInZone(shooterUnit, targetUnit, zoneBounds) {
  const localCenter = worldPointToLocalPoint(toWorldRectangle(shooterUnit), {
    x: Number(targetUnit?.xUd ?? 0),
    y: Number(targetUnit?.yUd ?? 0),
  });
  const closestPoint = {
    x: clamp(localCenter.x, zoneBounds.minX, zoneBounds.maxX),
    y: clamp(localCenter.y, zoneBounds.minY, zoneBounds.maxY),
  };

  return getPointDistance(localCenter, closestPoint) <= getCircleRadiusUd(targetUnit) + GEOMETRY_EPSILON;
}

function getTargetInZone(shooterUnit, targetUnit, profile) {
  const zoneBounds = getNormalFrontZoneLocalBounds(shooterUnit, profile);
  const inZone = isCircleBase(targetUnit)
    ? evaluateCircleTargetInZone(shooterUnit, targetUnit, zoneBounds)
    : evaluateRectangleTargetInZone(shooterUnit, targetUnit, zoneBounds);

  return {
    zoneBounds,
    inZone,
  };
}

function resolveShootingProfile(profileOrId) {
  if (!profileOrId) {
    return getShootingProfile(SHOOTING_PROFILE_IDS.NONE);
  }

  return typeof profileOrId === 'string' ? getShootingProfile(profileOrId) : profileOrId;
}

export function evaluateShootingGeometry({
  shooterUnit,
  targetUnit,
  shootingProfile = null,
  shootingProfileId = null,
} = {}) {
  const diagnostics = [];
  let profile;

  try {
    profile = resolveShootingProfile(shootingProfile ?? shootingProfileId);
  } catch (error) {
    diagnostics.push(createDiagnostic(
      SHOOTING_GEOMETRY_REASON_CODES.SHOOTING_PROFILE_UNRESOLVED,
      error.message,
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));

    return {
      shooterUnitId: shooterUnit?.id ?? null,
      targetUnitId: targetUnit?.id ?? null,
      shootingProfileId: shootingProfileId ?? null,
      measurement: null,
      zoneBounds: null,
      isInRange: false,
      isInZone: false,
      canTargetByGeometry: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      diagnostics,
    };
  }

  if (!profile.canShoot) {
    diagnostics.push(createDiagnostic(
      SHOOTING_GEOMETRY_REASON_CODES.NON_SHOOTER_PROFILE,
      'This unit profile has no supported shooting geometry in the current subset.',
    ));

    return {
      shooterUnitId: shooterUnit?.id ?? null,
      targetUnitId: targetUnit?.id ?? null,
      shootingProfileId: profile.id,
      measurement: null,
      zoneBounds: null,
      isInRange: false,
      isInZone: false,
      canTargetByGeometry: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      diagnostics,
    };
  }

  if (profile.shootingEdgeRule !== SHOOTING_EDGE_RULES.FRONT_EDGE) {
    diagnostics.push(createDiagnostic(
      SHOOTING_GEOMETRY_REASON_CODES.UNSUPPORTED_EDGE_RULE,
      `Unsupported shooting edge rule '${profile.shootingEdgeRule}' for the current P8-04 subset.`,
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));

    return {
      shooterUnitId: shooterUnit?.id ?? null,
      targetUnitId: targetUnit?.id ?? null,
      shootingProfileId: profile.id,
      measurement: null,
      zoneBounds: null,
      isInRange: false,
      isInZone: false,
      canTargetByGeometry: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      diagnostics,
    };
  }

  if (profile.shootingZoneKind !== SHOOTING_ZONE_KINDS.NORMAL_FRONT_RECTANGLE) {
    diagnostics.push(createDiagnostic(
      SHOOTING_GEOMETRY_REASON_CODES.UNSUPPORTED_ZONE_KIND,
      `Unsupported shooting zone kind '${profile.shootingZoneKind}' for the current P8-04 subset.`,
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));

    return {
      shooterUnitId: shooterUnit?.id ?? null,
      targetUnitId: targetUnit?.id ?? null,
      shootingProfileId: profile.id,
      measurement: null,
      zoneBounds: null,
      isInRange: false,
      isInZone: false,
      canTargetByGeometry: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      diagnostics,
    };
  }

  if (profile.specialZoneStatus !== SHOOTING_SOURCE_STATUSES.VERIFIED) {
    diagnostics.push(createDiagnostic(
      SHOOTING_GEOMETRY_REASON_CODES.SPECIAL_ZONE_DEFERRED,
      'This profile still carries deferred special-zone families outside the current normal-rectangle P8-04 subset.',
      profile.specialZoneStatus,
    ));
  }

  const measurement = targetUnit ? getTargetMeasurementFromFrontEdge(shooterUnit, targetUnit) : null;
  const zoneEvaluation = targetUnit ? getTargetInZone(shooterUnit, targetUnit, profile) : { zoneBounds: getNormalFrontZoneLocalBounds(shooterUnit, profile), inZone: false };
  const isInRange = Boolean(measurement) && measurement.distanceUd <= Number(profile.rangeUd ?? 0) + GEOMETRY_EPSILON;
  const isInZone = Boolean(zoneEvaluation.inZone);

  return {
    shooterUnitId: shooterUnit?.id ?? null,
    targetUnitId: targetUnit?.id ?? null,
    shootingProfileId: profile.id,
    rangeUd: profile.rangeUd,
    shootingEdgeRule: profile.shootingEdgeRule,
    shootingZoneKind: profile.shootingZoneKind,
    specialZoneStatus: profile.specialZoneStatus,
    measurement,
    zoneBounds: zoneEvaluation.zoneBounds,
    isInRange,
    isInZone,
    canTargetByGeometry: isInRange && isInZone,
    sourceStatus: profile.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
    diagnostics,
  };
}