import { getAxesFromRotation } from './angle.js';
import { addVectors, dotProduct, scaleVector } from './vector.js';

export function localPointToWorldPoint(rectangle, localPoint) {
  const { forwardAxis, rightAxis } = getAxesFromRotation(rectangle.rotationRadians);
  const rightOffset = scaleVector(rightAxis, localPoint.x);
  const forwardOffset = scaleVector(forwardAxis, localPoint.y);

  return addVectors(rectangle.center, addVectors(rightOffset, forwardOffset));
}

export function worldPointToLocalPoint(rectangle, worldPoint) {
  const { forwardAxis, rightAxis } = getAxesFromRotation(rectangle.rotationRadians);
  const relativePoint = {
    x: worldPoint.x - rectangle.center.x,
    y: worldPoint.y - rectangle.center.y,
  };

  return {
    x: dotProduct(relativePoint, rightAxis),
    y: dotProduct(relativePoint, forwardAxis),
  };
}

export function getRotatedRectangleCorners(rectangle) {
  const halfWidth = rectangle.widthUd / 2;
  const halfDepth = rectangle.depthUd / 2;
  const localCorners = [
    { x: -halfWidth, y: halfDepth },
    { x: halfWidth, y: halfDepth },
    { x: halfWidth, y: -halfDepth },
    { x: -halfWidth, y: -halfDepth },
  ];

  return localCorners.map((corner) => localPointToWorldPoint(rectangle, corner));
}

export function getRotatedRectangleBounds(rectangle) {
  const corners = getRotatedRectangleCorners(rectangle);
  const xValues = corners.map((corner) => corner.x);
  const yValues = corners.map((corner) => corner.y);

  return {
    minX: Math.min(...xValues),
    maxX: Math.max(...xValues),
    minY: Math.min(...yValues),
    maxY: Math.max(...yValues),
  };
}

export function projectPointOntoAxis(point, axis) {
  return dotProduct(point, axis);
}