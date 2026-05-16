import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BATTLEFIELD_PROFILE_IDS,
  STANDARD_200_BATTLEFIELD_PROFILE,
  convertCmToUd,
  convertUdToCm,
  getBattlefieldProfile,
} from './battlefield-profiles.js';

test('standard 200 battlefield profile exposes the expected dimensions', () => {
  assert.equal(STANDARD_200_BATTLEFIELD_PROFILE.id, BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  assert.equal(STANDARD_200_BATTLEFIELD_PROFILE.formatId, 'standard-200');
  assert.equal(STANDARD_200_BATTLEFIELD_PROFILE.widthUd, 30);
  assert.equal(STANDARD_200_BATTLEFIELD_PROFILE.heightUd, 20);
  assert.equal(STANDARD_200_BATTLEFIELD_PROFILE.widthCm, 120);
  assert.equal(STANDARD_200_BATTLEFIELD_PROFILE.heightCm, 80);
  assert.equal(STANDARD_200_BATTLEFIELD_PROFILE.udInCm, 4);
});

test('battlefield profile conversion helpers map between UD and centimeters consistently', () => {
  assert.equal(convertUdToCm(30), 120);
  assert.equal(convertUdToCm(20), 80);
  assert.equal(convertCmToUd(120), 30);
  assert.equal(convertCmToUd(80), 20);
  assert.equal(convertCmToUd(convertUdToCm(7.5)), 7.5);
});

test('unknown profile ids fall back to the standard 200 battlefield profile', () => {
  assert.deepEqual(getBattlefieldProfile('unknown-profile'), STANDARD_200_BATTLEFIELD_PROFILE);
});
