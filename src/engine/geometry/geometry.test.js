import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GEOMETRY_EPSILON,
  addVectors,
  classifyFacingRelationship,
  classifyLocalPointFacingZone,
  degreesToRadians,
  FACING_ZONE_LABELS,
  dotProduct,
  getFacingBoundaries,
  getAxesFromRotation,
  getRotatedRectangleCorners,
  getRotatedRectangleBounds,
  getUnitBaseGeometry,
  getVectorLength,
  normalizeAngleRadians,
  normalizeVector,
  projectPointOntoAxis,
  radiansToDegrees,
  rotateVector,
  scaleVector,
  subtractVectors,
  worldPointToLocalPoint,
  localPointToWorldPoint,
} from './index.js';

function assertPointClose(actual, expected, message) {
  assert.ok(Math.abs(actual.x - expected.x) <= GEOMETRY_EPSILON, `${message} x`);
  assert.ok(Math.abs(actual.y - expected.y) <= GEOMETRY_EPSILON, `${message} y`);
}

test('vector helpers add, subtract, scale, and project deterministically', () => {
  assert.deepEqual(addVectors({ x: 1, y: 2 }, { x: 3, y: -4 }), { x: 4, y: -2 });
  assert.deepEqual(subtractVectors({ x: 5, y: 1 }, { x: 2, y: -3 }), { x: 3, y: 4 });
  assert.deepEqual(scaleVector({ x: 2, y: -3 }, 1.5), { x: 3, y: -4.5 });
  assert.equal(dotProduct({ x: 2, y: 1 }, { x: -3, y: 4 }), -2);
  assert.equal(projectPointOntoAxis({ x: 3, y: 4 }, { x: 0, y: 1 }), 4);
});

test('vector normalization and rotation handle geometry primitives', () => {
  assert.equal(getVectorLength({ x: 3, y: 4 }), 5);
  assertPointClose(normalizeVector({ x: 3, y: 4 }), { x: 0.6, y: 0.8 }, 'normalize');
  assertPointClose(rotateVector({ x: 0, y: -1 }, degreesToRadians(90)), { x: 1, y: 0 }, 'rotate');
});

test('angle helpers normalize values and derive forward/right axes', () => {
  assert.equal(degreesToRadians(180), Math.PI);
  assert.equal(radiansToDegrees(Math.PI / 2), 90);
  assert.equal(normalizeAngleRadians(-Math.PI / 2), Math.PI * 1.5);

  const axes = getAxesFromRotation(degreesToRadians(90));
  assertPointClose(axes.forwardAxis, { x: 1, y: 0 }, 'forward axis');
  assertPointClose(axes.rightAxis, { x: 0, y: 1 }, 'right axis');
});

test('rotated rectangle corners stay stable for an axis-aligned rectangle', () => {
  const corners = getRotatedRectangleCorners({
    center: { x: 10, y: 20 },
    widthUd: 4,
    depthUd: 2,
    rotationRadians: 0,
  });

  assertPointClose(corners[0], { x: 8, y: 19 }, 'front-left corner');
  assertPointClose(corners[1], { x: 12, y: 19 }, 'front-right corner');
  assertPointClose(corners[2], { x: 12, y: 21 }, 'rear-right corner');
  assertPointClose(corners[3], { x: 8, y: 21 }, 'rear-left corner');
});

test('local/world rectangle transforms round-trip for rotated rectangles', () => {
  const rectangle = {
    center: { x: 4, y: -3 },
    widthUd: 6,
    depthUd: 2,
    rotationRadians: degreesToRadians(30),
  };
  const localPoint = { x: 2, y: -1 };

  const worldPoint = localPointToWorldPoint(rectangle, localPoint);
  const roundTripPoint = worldPointToLocalPoint(rectangle, worldPoint);

  assertPointClose(roundTripPoint, localPoint, 'round trip local point');
});

test('rotated rectangle bounds capture the full footprint extents', () => {
  const bounds = getRotatedRectangleBounds({
    center: { x: 0, y: 0 },
    widthUd: 2,
    depthUd: 2,
    rotationRadians: degreesToRadians(45),
  });

  const expectedExtent = Math.SQRT2;
  assert.ok(Math.abs(bounds.minX + expectedExtent) <= GEOMETRY_EPSILON, 'minX extent');
  assert.ok(Math.abs(bounds.maxX - expectedExtent) <= GEOMETRY_EPSILON, 'maxX extent');
  assert.ok(Math.abs(bounds.minY + expectedExtent) <= GEOMETRY_EPSILON, 'minY extent');
  assert.ok(Math.abs(bounds.maxY - expectedExtent) <= GEOMETRY_EPSILON, 'maxY extent');
});

test('unit base geometry derives stable edges and axes for an axis-aligned unit', () => {
  const geometry = getUnitBaseGeometry({
    center: { x: 10, y: 20 },
    widthUd: 4,
    depthUd: 2,
    rotationRadians: 0,
  });

  assertPointClose(geometry.corners.frontLeft, { x: 8, y: 19 }, 'frontLeft');
  assertPointClose(geometry.corners.frontRight, { x: 12, y: 19 }, 'frontRight');
  assertPointClose(geometry.corners.rearRight, { x: 12, y: 21 }, 'rearRight');
  assertPointClose(geometry.corners.rearLeft, { x: 8, y: 21 }, 'rearLeft');
  assertPointClose(geometry.frontEdge.start, geometry.corners.frontLeft, 'front edge start');
  assertPointClose(geometry.frontEdge.end, geometry.corners.frontRight, 'front edge end');
  assertPointClose(geometry.rearEdge.start, geometry.corners.rearLeft, 'rear edge start');
  assertPointClose(geometry.rearEdge.end, geometry.corners.rearRight, 'rear edge end');
  assertPointClose(geometry.leftFlankEdge.start, geometry.corners.frontLeft, 'left flank start');
  assertPointClose(geometry.leftFlankEdge.end, geometry.corners.rearLeft, 'left flank end');
  assertPointClose(geometry.rightFlankEdge.start, geometry.corners.frontRight, 'right flank start');
  assertPointClose(geometry.rightFlankEdge.end, geometry.corners.rearRight, 'right flank end');
  assertPointClose(geometry.forwardAxis, { x: 0, y: -1 }, 'forward axis');
  assertPointClose(geometry.rightAxis, { x: 1, y: 0 }, 'right axis');
});

test('unit base geometry remains stable for a ninety-degree rotation', () => {
  const geometry = getUnitBaseGeometry({
    center: { x: 10, y: 20 },
    widthUd: 4,
    depthUd: 2,
    rotationRadians: degreesToRadians(90),
  });

  assertPointClose(geometry.corners.frontLeft, { x: 11, y: 18 }, 'rotated frontLeft');
  assertPointClose(geometry.corners.frontRight, { x: 11, y: 22 }, 'rotated frontRight');
  assertPointClose(geometry.corners.rearRight, { x: 9, y: 22 }, 'rotated rearRight');
  assertPointClose(geometry.corners.rearLeft, { x: 9, y: 18 }, 'rotated rearLeft');
  assertPointClose(geometry.forwardAxis, { x: 1, y: 0 }, 'rotated forward axis');
  assertPointClose(geometry.rightAxis, { x: 0, y: 1 }, 'rotated right axis');
});

test('facing boundaries derive stable midpoints and extension directions', () => {
  const geometry = getUnitBaseGeometry({
    center: { x: 4, y: -3 },
    widthUd: 6,
    depthUd: 2,
    rotationRadians: degreesToRadians(30),
  });
  const boundaries = getFacingBoundaries(geometry, 10);

  assertPointClose(boundaries.frontBoundary.center, {
    x: geometry.center.x + geometry.forwardAxis.x,
    y: geometry.center.y + geometry.forwardAxis.y,
  }, 'front boundary center');
  assertPointClose(boundaries.rearBoundary.center, {
    x: geometry.center.x - geometry.forwardAxis.x,
    y: geometry.center.y - geometry.forwardAxis.y,
  }, 'rear boundary center');
  assertPointClose(boundaries.leftFlankBoundary.center, {
    x: geometry.center.x - (geometry.rightAxis.x * 3),
    y: geometry.center.y - (geometry.rightAxis.y * 3),
  }, 'left flank boundary center');
  assertPointClose(boundaries.rightFlankBoundary.center, {
    x: geometry.center.x + (geometry.rightAxis.x * 3),
    y: geometry.center.y + (geometry.rightAxis.y * 3),
  }, 'right flank boundary center');

  const frontLineDelta = subtractVectors(
    boundaries.frontBoundary.line.end,
    boundaries.frontBoundary.line.start,
  );
  const rightFlankLineDelta = subtractVectors(
    boundaries.rightFlankBoundary.line.end,
    boundaries.rightFlankBoundary.line.start,
  );

  assertPointClose(normalizeVector(frontLineDelta), geometry.rightAxis, 'front boundary axis');
  assertPointClose(normalizeVector(rightFlankLineDelta), geometry.forwardAxis, 'right flank boundary axis');
  assertPointClose(boundaries.frontBoundary.leftExtension.start, geometry.corners.frontLeft, 'front left extension start');
  assertPointClose(boundaries.frontBoundary.rightExtension.start, geometry.corners.frontRight, 'front right extension start');
  assertPointClose(boundaries.leftFlankBoundary.frontExtension.start, geometry.corners.frontLeft, 'left front extension start');
  assertPointClose(boundaries.leftFlankBoundary.rearExtension.start, geometry.corners.rearLeft, 'left rear extension start');
  assertPointClose(boundaries.rearBoundary.leftExtension.start, geometry.corners.rearLeft, 'rear left extension start');
  assertPointClose(boundaries.rightFlankBoundary.frontExtension.start, geometry.corners.frontRight, 'right front extension start');
  assertPointClose(
    normalizeVector(subtractVectors(boundaries.frontBoundary.leftExtension.end, boundaries.frontBoundary.leftExtension.start)),
    scaleVector(geometry.rightAxis, -1),
    'front left extension axis',
  );
  assertPointClose(
    normalizeVector(subtractVectors(boundaries.frontBoundary.rightExtension.end, boundaries.frontBoundary.rightExtension.start)),
    geometry.rightAxis,
    'front right extension axis',
  );
  assertPointClose(
    normalizeVector(subtractVectors(boundaries.leftFlankBoundary.frontExtension.end, boundaries.leftFlankBoundary.frontExtension.start)),
    geometry.forwardAxis,
    'left front extension axis',
  );
  assertPointClose(
    normalizeVector(subtractVectors(boundaries.rightFlankBoundary.rearExtension.end, boundaries.rightFlankBoundary.rearExtension.start)),
    scaleVector(geometry.forwardAxis, -1),
    'right rear extension axis',
  );
});

test('local point facing-zone classification distinguishes front, flanks, rear, boundary, and ambiguous', () => {
  assert.equal(classifyLocalPointFacingZone({ x: 0, y: 2 }, 1, 0.5), FACING_ZONE_LABELS.FRONT);
  assert.equal(classifyLocalPointFacingZone({ x: -2, y: 0 }, 1, 0.5), FACING_ZONE_LABELS.LEFT_FLANK);
  assert.equal(classifyLocalPointFacingZone({ x: 2, y: 0 }, 1, 0.5), FACING_ZONE_LABELS.RIGHT_FLANK);
  assert.equal(classifyLocalPointFacingZone({ x: 0, y: -2 }, 1, 0.5), FACING_ZONE_LABELS.REAR);
  assert.equal(classifyLocalPointFacingZone({ x: 1, y: 0 }, 1, 0.5), FACING_ZONE_LABELS.BOUNDARY);
  assert.equal(classifyLocalPointFacingZone({ x: 2, y: 2 }, 1, 0.5), FACING_ZONE_LABELS.FRONT);
  assert.equal(classifyLocalPointFacingZone({ x: 2, y: -1 }, 1, 0.5), FACING_ZONE_LABELS.REAR);
  assert.equal(classifyLocalPointFacingZone({ x: 1.5, y: -1 }, 1, 0.5), FACING_ZONE_LABELS.REAR);
  assert.equal(classifyLocalPointFacingZone({ x: 0, y: 0 }, 1, 0.5), FACING_ZONE_LABELS.AMBIGUOUS);
});

test('facing relationship classifier identifies a front target from axis-aligned geometry', () => {
  const relationship = classifyFacingRelationship(
    {
      center: { x: 10, y: 10 },
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    {
      center: { x: 10, y: 6 },
      widthUd: 1,
      depthUd: 0.5,
      rotationRadians: 0,
    },
  );

  assert.equal(relationship.primaryLabel, FACING_ZONE_LABELS.FRONT);
  assert.equal(relationship.centerLabel, FACING_ZONE_LABELS.FRONT);
});

test('facing relationship classifier tracks rotated-source front correctly', () => {
  const relationship = classifyFacingRelationship(
    {
      center: { x: 10, y: 10 },
      widthUd: 2,
      depthUd: 1,
      rotationRadians: degreesToRadians(90),
    },
    {
      center: { x: 14, y: 10 },
      widthUd: 1,
      depthUd: 0.5,
      rotationRadians: degreesToRadians(15),
    },
  );

  assert.equal(relationship.primaryLabel, FACING_ZONE_LABELS.FRONT);
  assert.equal(relationship.centerLabel, FACING_ZONE_LABELS.FRONT);
});

test('facing relationship classifier returns boundary when target center lies on a source edge line', () => {
  const relationship = classifyFacingRelationship(
    {
      center: { x: 10, y: 10 },
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    {
      center: { x: 11, y: 10 },
      widthUd: 0.5,
      depthUd: 0.5,
      rotationRadians: 0,
    },
  );

  assert.equal(relationship.primaryLabel, FACING_ZONE_LABELS.BOUNDARY);
  assert.deepEqual(relationship.involvedBoundaries, ['rightFlankBoundary']);
});

test('facing relationship classifier returns flank when target footprint crosses the front line', () => {
  const relationship = classifyFacingRelationship(
    {
      center: { x: 10, y: 10 },
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    {
      center: { x: 10, y: 9.4 },
      widthUd: 5,
      depthUd: 0.5,
      rotationRadians: 0,
    },
  );

  assert.equal(relationship.centerLabel, FACING_ZONE_LABELS.FRONT);
  assert.equal(relationship.primaryLabel, FACING_ZONE_LABELS.FLANK);
});

test('facing relationship classifier returns ambiguous when target footprint spans flank and rear space', () => {
  const relationship = classifyFacingRelationship(
    {
      center: { x: 10, y: 10 },
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    {
      center: { x: 12.5, y: 10.9 },
      widthUd: 0.5,
      depthUd: 1.5,
      rotationRadians: 0,
    },
  );

  assert.equal(relationship.centerLabel, FACING_ZONE_LABELS.REAR);
  assert.equal(relationship.primaryLabel, FACING_ZONE_LABELS.AMBIGUOUS);
});

test('facing relationship classifier returns rear when target footprint lies beyond the rear line', () => {
  const relationship = classifyFacingRelationship(
    {
      center: { x: 10, y: 10 },
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    {
      center: { x: 12.5, y: 11.5 },
      widthUd: 0.5,
      depthUd: 0.5,
      rotationRadians: 0,
    },
  );

  assert.equal(relationship.centerLabel, FACING_ZONE_LABELS.REAR);
  assert.equal(relationship.primaryLabel, FACING_ZONE_LABELS.REAR);
});