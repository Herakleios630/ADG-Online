import test from 'node:test';
import assert from 'node:assert/strict';

import { getBattlefieldProfile, BATTLEFIELD_PROFILE_IDS } from '../../data/battlefield-profiles.js';
import {
  createInitialDeploymentSetupState,
  createVisibleDeploymentPlaceholder,
  doDeploymentPlaceholdersOverlap,
  isDeploymentPlaceholderWithinBattlefield,
} from './deployment-placeholders.js';

const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

test('initial deployment setup state creates two placeholder zones and visible unit placeholders', () => {
  const deployment = createInitialDeploymentSetupState([
    {
      id: 'test-unit-1',
      owner: 'player-1',
      xUd: 10,
      yUd: 10,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
    },
  ], battlefieldProfile);

  assert.equal(deployment.zones.length, 2);
  assert.equal(deployment.visiblePlaceholders.length, 1);
  assert.equal(deployment.visiblePlaceholders[0].unitId, 'test-unit-1');
  assert.equal(deployment.zones[0].sourceStatus, 'needs-source-check');
});

test('visible deployment placeholder can be rejected when outside battlefield bounds', () => {
  const placeholder = createVisibleDeploymentPlaceholder({
    id: 'deployment-unit-1',
    unitId: 'test-unit-1',
    owner: 'player-1',
    corpsId: 'player-1-corps-a',
    deploymentGroupId: 'player-1-group-a',
    pose: { xUd: 29.8, yUd: 19.8 },
    footprint: { widthUd: 1, depthUd: 1, rotationRadians: 0 },
  });

  assert.equal(isDeploymentPlaceholderWithinBattlefield(placeholder, battlefieldProfile), false);
});

test('deployment placeholder overlap helper reports overlapping footprints', () => {
  const left = createVisibleDeploymentPlaceholder({
    id: 'deployment-unit-1',
    unitId: 'test-unit-1',
    owner: 'player-1',
    corpsId: 'player-1-corps-a',
    deploymentGroupId: 'player-1-group-a',
    pose: { xUd: 10, yUd: 15 },
    footprint: { widthUd: 1, depthUd: 1, rotationRadians: 0 },
  });
  const right = createVisibleDeploymentPlaceholder({
    id: 'deployment-unit-2',
    unitId: 'test-unit-2',
    owner: 'player-1',
    corpsId: 'player-1-corps-b',
    deploymentGroupId: 'player-1-group-b',
    pose: { xUd: 10.4, yUd: 15 },
    footprint: { widthUd: 1, depthUd: 1, rotationRadians: 0 },
  });

  assert.equal(doDeploymentPlaceholdersOverlap(left, right), true);
});