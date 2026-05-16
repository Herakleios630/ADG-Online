import { getAxesFromRotation } from './angle.js';
import { getRotatedRectangleCorners } from './rectangle.js';

function createEdge(start, end) {
  return { start, end };
}

export function getUnitBaseGeometry(unitBase) {
  const { center, widthUd, depthUd, rotationRadians } = unitBase;
  const corners = getRotatedRectangleCorners({
    center,
    widthUd,
    depthUd,
    rotationRadians,
  });
  const { forwardAxis, rightAxis } = getAxesFromRotation(rotationRadians);

  return {
    center,
    widthUd,
    depthUd,
    rotationRadians,
    dimensions: {
      widthUd,
      depthUd,
    },
    corners: {
      frontLeft: corners[0],
      frontRight: corners[1],
      rearRight: corners[2],
      rearLeft: corners[3],
    },
    frontEdge: createEdge(corners[0], corners[1]),
    rightFlankEdge: createEdge(corners[1], corners[2]),
    rearEdge: createEdge(corners[3], corners[2]),
    leftFlankEdge: createEdge(corners[0], corners[3]),
    forwardAxis,
    rightAxis,
  };
}