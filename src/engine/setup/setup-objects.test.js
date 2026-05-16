import test from 'node:test';
import assert from 'node:assert/strict';

import { STANDARD_200_BATTLEFIELD_PROFILE } from '../../data/battlefield-profiles.js';
import {
  createMandatoryCampPlaceholders,
  createSetupObjectPlaceholder,
  isSetupObjectWithinBattlefield,
  SETUP_OBJECT_FAMILIES,
  SETUP_OBJECT_TYPE_IDS,
} from './setup-objects.js';

test('mandatory camp placeholders exist for both players', () => {
  const camps = createMandatoryCampPlaceholders();

  assert.equal(camps.length, 2);
  assert.equal(camps[0].family, SETUP_OBJECT_FAMILIES.CAMP);
  assert.equal(camps[0].type, SETUP_OBJECT_TYPE_IDS.CAMP);
  assert.equal(camps[1].owner, 'player-2');
  assert.equal(camps[0].pose.yUd > camps[1].pose.yUd, true);
  assert.equal(camps[0].pose.yUd, 18.2);
  assert.equal(camps[1].pose.yUd, 1.8);
});

test('setup object placeholders stay within battlefield when positioned legally', () => {
  const setupObject = createSetupObjectPlaceholder({
    pose: { xUd: 6, yUd: 18 },
    footprint: { widthUd: 2.5, depthUd: 1.6, rotationRadians: 0 },
  });

  assert.equal(isSetupObjectWithinBattlefield(setupObject, STANDARD_200_BATTLEFIELD_PROFILE), true);
});

test('setup object placeholder rejects out-of-bounds footprint placement', () => {
  const setupObject = createSetupObjectPlaceholder({
    pose: { xUd: 29.5, yUd: 19.7 },
    footprint: { widthUd: 3, depthUd: 2, rotationRadians: 0 },
  });

  assert.equal(isSetupObjectWithinBattlefield(setupObject, STANDARD_200_BATTLEFIELD_PROFILE), false);
});