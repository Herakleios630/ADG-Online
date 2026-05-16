export {
  GEOMETRY_EPSILON,
  addVectors,
  subtractVectors,
  scaleVector,
  dotProduct,
  crossProduct,
  getVectorLength,
  normalizeVector,
  getPerpendicularVector,
  rotateVector,
} from './vector.js';

export {
  TAU_RADIANS,
  degreesToRadians,
  radiansToDegrees,
  normalizeAngleRadians,
  getAxesFromRotation,
} from './angle.js';

export {
  localPointToWorldPoint,
  worldPointToLocalPoint,
  getRotatedRectangleCorners,
  getRotatedRectangleBounds,
  projectPointOntoAxis,
} from './rectangle.js';

export { getUnitBaseGeometry } from './unit-base.js';

export { getFacingBoundaries } from './facing-boundaries.js';

export { getPointDistance, getRectangleCenterDistance } from './distance.js';

export { FACING_ZONE_LABELS, classifyLocalPointFacingZone } from './facing-zones.js';

export { classifyFacingRelationship } from './relationship.js';