import { addVectors, scaleVector } from './vector.js';

function getEdgeMidpoint(edge) {
  return {
    x: (edge.start.x + edge.end.x) / 2,
    y: (edge.start.y + edge.end.y) / 2,
  };
}

function extendLine(center, axis, extensionUd) {
  return {
    start: addVectors(center, scaleVector(axis, -extensionUd)),
    end: addVectors(center, scaleVector(axis, extensionUd)),
  };
}

function extendRay(start, axis, extensionUd) {
  return {
    start,
    end: addVectors(start, scaleVector(axis, extensionUd)),
  };
}

export function getFacingBoundaries(unitGeometry, extensionUd = 100) {
  return {
    frontBoundary: {
      center: getEdgeMidpoint(unitGeometry.frontEdge),
      line: extendLine(getEdgeMidpoint(unitGeometry.frontEdge), unitGeometry.rightAxis, extensionUd),
      leftExtension: extendRay(unitGeometry.corners.frontLeft, scaleVector(unitGeometry.rightAxis, -1), extensionUd),
      rightExtension: extendRay(unitGeometry.corners.frontRight, unitGeometry.rightAxis, extensionUd),
    },
    rearBoundary: {
      center: getEdgeMidpoint(unitGeometry.rearEdge),
      line: extendLine(getEdgeMidpoint(unitGeometry.rearEdge), unitGeometry.rightAxis, extensionUd),
      leftExtension: extendRay(unitGeometry.corners.rearLeft, scaleVector(unitGeometry.rightAxis, -1), extensionUd),
      rightExtension: extendRay(unitGeometry.corners.rearRight, unitGeometry.rightAxis, extensionUd),
    },
    leftFlankBoundary: {
      center: getEdgeMidpoint(unitGeometry.leftFlankEdge),
      line: extendLine(getEdgeMidpoint(unitGeometry.leftFlankEdge), unitGeometry.forwardAxis, extensionUd),
      frontExtension: extendRay(unitGeometry.corners.frontLeft, unitGeometry.forwardAxis, extensionUd),
      rearExtension: extendRay(unitGeometry.corners.rearLeft, scaleVector(unitGeometry.forwardAxis, -1), extensionUd),
    },
    rightFlankBoundary: {
      center: getEdgeMidpoint(unitGeometry.rightFlankEdge),
      line: extendLine(getEdgeMidpoint(unitGeometry.rightFlankEdge), unitGeometry.forwardAxis, extensionUd),
      frontExtension: extendRay(unitGeometry.corners.frontRight, unitGeometry.forwardAxis, extensionUd),
      rearExtension: extendRay(unitGeometry.corners.rearRight, scaleVector(unitGeometry.forwardAxis, -1), extensionUd),
    },
  };
}