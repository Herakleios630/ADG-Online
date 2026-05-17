import test from 'node:test';
import assert from 'node:assert/strict';

import { STANDARD_200_BATTLEFIELD_PROFILE } from '../data/battlefield-profiles.js';
import {
  clampBattlefieldCenterToFootprint,
  clampBattlefieldPointUd,
  getBattlefieldPointUd,
} from './battlefield-coordinate.js';

const SURFACE_RECT = {
  left: 0,
  top: 0,
  width: 300,
  height: 200,
};

test('getBattlefieldPointUd maps client coordinates into UD space', () => {
  const point = getBattlefieldPointUd(
    SURFACE_RECT,
    1,
    0,
    0,
    150,
    100,
    STANDARD_200_BATTLEFIELD_PROFILE,
  );

  assert.equal(point.xUd, 15);
  assert.equal(point.yUd, 10);
});

test('clampBattlefieldPointUd respects footprint bounds', () => {
  const point = clampBattlefieldPointUd(
    SURFACE_RECT,
    1,
    0,
    0,
    0,
    0,
    STANDARD_200_BATTLEFIELD_PROFILE,
    {
      widthUd: 4,
      depthUd: 2,
      rotationRadians: 0,
    },
  );

  assert.equal(point.xUd, 2);
  assert.equal(point.yUd, 1);
});

test('clampBattlefieldCenterToFootprint keeps rotated footprints on the table', () => {
  const point = clampBattlefieldCenterToFootprint(
    -2,
    25,
    STANDARD_200_BATTLEFIELD_PROFILE,
    {
      widthUd: 4,
      depthUd: 2,
      rotationRadians: Math.PI / 2,
    },
  );

  assert.ok(Math.abs(point.xUd - 1) < 1e-9);
  assert.equal(point.yUd, 18);
});