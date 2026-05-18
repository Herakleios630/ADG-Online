import {
  GEOMETRY_EPSILON,
  addVectors,
  getPointDistance,
  getRotatedRectangleCorners,
  normalizeVector,
  scaleVector,
  subtractVectors,
  worldPointToLocalPoint,
  localPointToWorldPoint,
} from '../geometry/index.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRectangleFootprint(footprint) {
  return {
    center: { x: Number(footprint.xUd), y: Number(footprint.yUd) },
    widthUd: Number(footprint.widthUd),
    depthUd: Number(footprint.depthUd),
    rotationRadians: Number(footprint.rotationRadians ?? 0),
  };
}

function getCircleRadiusUd(footprint) {
  return Number(footprint.widthUd) / 2;
}

function isCircleFootprint(footprint) {
  return footprint.baseShape === 'circle';
}

function isPointInsideRotatedRectangle(rectangle, point) {
  const localPoint = worldPointToLocalPoint(rectangle, point);
  const halfWidth = rectangle.widthUd / 2;
  const halfDepth = rectangle.depthUd / 2;

  return Math.abs(localPoint.x) <= halfWidth + GEOMETRY_EPSILON
    && Math.abs(localPoint.y) <= halfDepth + GEOMETRY_EPSILON;
}

function getClosestPointOnRotatedRectangle(rectangle, worldPoint) {
  const localPoint = worldPointToLocalPoint(rectangle, worldPoint);
  const halfWidth = rectangle.widthUd / 2;
  const halfDepth = rectangle.depthUd / 2;

  return localPointToWorldPoint(rectangle, {
    x: clamp(localPoint.x, -halfWidth, halfWidth),
    y: clamp(localPoint.y, -halfDepth, halfDepth),
  });
}

function getClosestPointOnCircle(footprint, worldPoint) {
  const center = { x: Number(footprint.xUd), y: Number(footprint.yUd) };
  const offset = subtractVectors(worldPoint, center);
  const length = getPointDistance(center, worldPoint);
  const radiusUd = getCircleRadiusUd(footprint);

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

function getCircleToCircleMeasurement(sourceFootprint, targetFootprint) {
  const sourceCenter = { x: Number(sourceFootprint.xUd), y: Number(sourceFootprint.yUd) };
  const targetCenter = { x: Number(targetFootprint.xUd), y: Number(targetFootprint.yUd) };
  const centerDistanceUd = getPointDistance(sourceCenter, targetCenter);
  const sourceRadiusUd = getCircleRadiusUd(sourceFootprint);
  const targetRadiusUd = getCircleRadiusUd(targetFootprint);

  if (centerDistanceUd <= GEOMETRY_EPSILON) {
    return buildMeasurement(sourceCenter, targetCenter);
  }

  const direction = normalizeVector(subtractVectors(targetCenter, sourceCenter));
  if (centerDistanceUd <= sourceRadiusUd + targetRadiusUd + GEOMETRY_EPSILON) {
    const overlapPoint = addVectors(sourceCenter, scaleVector(direction, Math.min(sourceRadiusUd, centerDistanceUd / 2)));
    return buildMeasurement(overlapPoint, overlapPoint);
  }

  return buildMeasurement(
    addVectors(sourceCenter, scaleVector(direction, sourceRadiusUd)),
    addVectors(targetCenter, scaleVector(direction, -targetRadiusUd)),
  );
}

function getCircleToRectangleMeasurement(circleFootprint, rectangleFootprint) {
  const circleCenter = { x: Number(circleFootprint.xUd), y: Number(circleFootprint.yUd) };
  const rectangle = getRectangleFootprint(rectangleFootprint);
  const closestRectanglePoint = getClosestPointOnRotatedRectangle(rectangle, circleCenter);
  const centerToRectangleDistanceUd = getPointDistance(circleCenter, closestRectanglePoint);
  const circleRadiusUd = getCircleRadiusUd(circleFootprint);

  if (centerToRectangleDistanceUd <= circleRadiusUd + GEOMETRY_EPSILON) {
    return buildMeasurement(closestRectanglePoint, closestRectanglePoint);
  }

  return buildMeasurement(
    getClosestPointOnCircle(circleFootprint, closestRectanglePoint),
    closestRectanglePoint,
  );
}

function getRectangleToRectangleMeasurement(sourceFootprint, targetFootprint) {
  const sourceRectangle = getRectangleFootprint(sourceFootprint);
  const targetRectangle = getRectangleFootprint(targetFootprint);
  const sourceEdges = getRectangleEdges(sourceRectangle);
  const targetEdges = getRectangleEdges(targetRectangle);

  for (const sourceEdge of sourceEdges) {
    for (const targetEdge of targetEdges) {
      const intersectionPoint = getSegmentIntersectionPoint(
        sourceEdge.start,
        sourceEdge.end,
        targetEdge.start,
        targetEdge.end,
      );

      if (intersectionPoint) {
        return buildMeasurement(intersectionPoint, intersectionPoint);
      }
    }
  }

  let bestMeasurement = null;
  const sourceCorners = getRotatedRectangleCorners(sourceRectangle);
  const targetCorners = getRotatedRectangleCorners(targetRectangle);

  for (const sourceCorner of sourceCorners) {
    bestMeasurement = chooseBestMeasurement(
      bestMeasurement,
      buildMeasurement(sourceCorner, getClosestPointOnRotatedRectangle(targetRectangle, sourceCorner)),
    );
  }

  for (const targetCorner of targetCorners) {
    bestMeasurement = chooseBestMeasurement(
      bestMeasurement,
      buildMeasurement(getClosestPointOnRotatedRectangle(sourceRectangle, targetCorner), targetCorner),
    );
  }

  for (const sourceCorner of sourceCorners) {
    if (isPointInsideRotatedRectangle(targetRectangle, sourceCorner)) {
      return buildMeasurement(sourceCorner, sourceCorner);
    }
  }

  for (const targetCorner of targetCorners) {
    if (isPointInsideRotatedRectangle(sourceRectangle, targetCorner)) {
      return buildMeasurement(targetCorner, targetCorner);
    }
  }

  return bestMeasurement;
}

export function getFootprintCommandRangeMeasurement(sourceFootprint, targetFootprint) {
  if (isCircleFootprint(sourceFootprint) && isCircleFootprint(targetFootprint)) {
    return getCircleToCircleMeasurement(sourceFootprint, targetFootprint);
  }

  if (isCircleFootprint(sourceFootprint)) {
    return getCircleToRectangleMeasurement(sourceFootprint, targetFootprint);
  }

  if (isCircleFootprint(targetFootprint)) {
    const measurement = getCircleToRectangleMeasurement(targetFootprint, sourceFootprint);
    return {
      sourcePoint: measurement.targetPoint,
      targetPoint: measurement.sourcePoint,
      distanceUd: measurement.distanceUd,
    };
  }

  return getRectangleToRectangleMeasurement(sourceFootprint, targetFootprint);
}

function toCommandFootprint(unit) {
  return {
    id: unit.id ?? null,
    xUd: Number(unit.xUd),
    yUd: Number(unit.yUd),
    widthUd: Number(unit.widthUd),
    depthUd: Number(unit.depthUd),
    rotationRadians: Number(unit.rotationRadians ?? 0),
    baseShape: unit.baseShape === 'circle' ? 'circle' : 'rectangle',
  };
}

export function getUnitCommandRangeMeasurement(commanderUnit, targetUnit) {
  const measurement = getFootprintCommandRangeMeasurement(
    toCommandFootprint(commanderUnit),
    toCommandFootprint(targetUnit),
  );

  return {
    ...measurement,
    commanderUnitId: commanderUnit.id ?? null,
    targetUnitId: targetUnit.id ?? null,
  };
}

export function getGroupCommandRangeMeasurement(commanderUnit, targetUnits = []) {
  let bestMeasurement = null;

  for (const targetUnit of targetUnits) {
    const measurement = getUnitCommandRangeMeasurement(commanderUnit, targetUnit);
    bestMeasurement = chooseBestMeasurement(bestMeasurement, measurement);
  }

  return bestMeasurement;
}

export function evaluateCommandRange(commanderUnit, targetUnitOrUnits, commandRangeUd = commanderUnit.commandRangeUd) {
  const measurement = Array.isArray(targetUnitOrUnits)
    ? getGroupCommandRangeMeasurement(commanderUnit, targetUnitOrUnits)
    : getUnitCommandRangeMeasurement(commanderUnit, targetUnitOrUnits);

  return {
    ...measurement,
    commandRangeUd,
    inRange: measurement ? measurement.distanceUd < Number(commandRangeUd) - GEOMETRY_EPSILON : false,
  };
}