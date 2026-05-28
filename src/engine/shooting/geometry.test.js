import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHOOTING_GEOMETRY_REASON_CODES,
  evaluateShootingGeometry,
  getNormalFrontZoneLocalBounds,
} from './geometry.js';
import {
  SHOOTING_PROFILE_IDS,
  SHOOTING_SOURCE_STATUSES,
  getShootingProfile,
} from './index.js';

function createRectangleUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit-1',
    xUd: Number(overrides.xUd ?? 10),
    yUd: Number(overrides.yUd ?? 10),
    widthUd: Number(overrides.widthUd ?? 1),
    depthUd: Number(overrides.depthUd ?? 1),
    rotationRadians: Number(overrides.rotationRadians ?? 0),
    baseShape: 'rectangle',
  };
}

function createCircleUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'circle-1',
    xUd: Number(overrides.xUd ?? 10),
    yUd: Number(overrides.yUd ?? 10),
    widthUd: Number(overrides.widthUd ?? 1),
    depthUd: Number(overrides.depthUd ?? overrides.widthUd ?? 1),
    rotationRadians: Number(overrides.rotationRadians ?? 0),
    baseShape: 'circle',
  };
}

test('P8-04 normal front zone bounds use shooter width plus 1 UD lateral padding and full range depth', () => {
  const bounds = getNormalFrontZoneLocalBounds(
    createRectangleUnit({ widthUd: 2, depthUd: 1 }),
    getShootingProfile(SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT),
  );

  assert.deepEqual(bounds, {
    minX: -2,
    maxX: 2,
    minY: 0.5,
    maxY: 2.5,
  });
});

test('P8-04 front-edge range measurement accepts exact range equality on a rectangle target', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter', xUd: 10, yUd: 10 });
  const targetUnit = createRectangleUnit({ id: 'target', xUd: 10, yUd: 7 });

  const result = evaluateShootingGeometry({
    shooterUnit,
    targetUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
  });

  assert.equal(result.isInRange, true);
  assert.equal(result.isInZone, true);
  assert.equal(result.canTargetByGeometry, true);
  assert.equal(result.measurement?.distanceUd, 2);
  assert.equal(result.sourceStatus, SHOOTING_SOURCE_STATUSES.VERIFIED);
});

test('P8-04 normal front zone rejects a target just outside the lateral 1 UD padding', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter', xUd: 10, yUd: 10 });
  const targetUnit = createRectangleUnit({ id: 'target', xUd: 12.01, yUd: 8 });

  const result = evaluateShootingGeometry({
    shooterUnit,
    targetUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
  });

  assert.equal(result.isInRange, true);
  assert.equal(result.isInZone, false);
  assert.equal(result.canTargetByGeometry, false);
});

test('P8-04 normal front zone includes a target touching the lateral boundary exactly', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter', xUd: 10, yUd: 10 });
  const targetUnit = createRectangleUnit({ id: 'target', xUd: 12, yUd: 8 });

  const result = evaluateShootingGeometry({
    shooterUnit,
    targetUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
  });

  assert.equal(result.isInZone, true);
  assert.equal(result.canTargetByGeometry, true);
});

test('P8-04 geometry follows shooter rotation instead of assuming north-facing rectangles', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter', xUd: 10, yUd: 10, rotationRadians: Math.PI / 2 });
  const targetUnit = createCircleUnit({ id: 'target', xUd: 12.75, yUd: 10, widthUd: 0.5 });

  const result = evaluateShootingGeometry({
    shooterUnit,
    targetUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
  });

  assert.equal(result.isInRange, true);
  assert.equal(result.isInZone, true);
  assert.equal(result.canTargetByGeometry, true);
});

test('P8-04 mounted bow keeps normal rectangle geometry but warns about deferred special-zone families', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter', xUd: 10, yUd: 10 });
  const targetUnit = createRectangleUnit({ id: 'target', xUd: 10, yUd: 8 });

  const result = evaluateShootingGeometry({
    shooterUnit,
    targetUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.MOUNTED_BOW,
  });

  assert.equal(result.isInRange, true);
  assert.equal(result.isInZone, true);
  assert.equal(result.canTargetByGeometry, true);
  assert.equal(
    result.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_GEOMETRY_REASON_CODES.SPECIAL_ZONE_DEFERRED),
    true,
  );
});

test('P8-04 non-shooter profile returns a verified geometry rejection instead of implicit fallback', () => {
  const result = evaluateShootingGeometry({
    shooterUnit: createRectangleUnit({ id: 'shooter' }),
    targetUnit: createRectangleUnit({ id: 'target', xUd: 10, yUd: 12 }),
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
  });

  assert.equal(result.canTargetByGeometry, false);
  assert.equal(result.measurement, null);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_GEOMETRY_REASON_CODES.NON_SHOOTER_PROFILE);
});