import test from 'node:test';
import assert from 'node:assert/strict';

import { UNIT_PROFILE_IDS } from '../../data/unit-profiles.js';
import {
  CONFORMATION_SHIFTING_PLAN_STATUSES,
  CONFORMATION_SOURCE_STATUSES,
} from './index.js';
import { resolveSimpleConformationShift } from './shifting.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit',
    owner: overrides.owner ?? 'player-1',
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 10,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 1,
    rotationRadians: overrides.rotationRadians ?? 0,
    troopType: overrides.troopType ?? null,
    profileId: overrides.profileId ?? null,
    inMeleeSupport: overrides.inMeleeSupport ?? false,
    providesOnlySimpleSupport: overrides.providesOnlySimpleSupport ?? false,
    wouldSupportFriendlyAfterConformation: overrides.wouldSupportFriendlyAfterConformation,
    baseShape: 'rectangle',
  };
}

test('simple conformation shift stays empty when no blocker is present', () => {
  const charger = createUnit({ id: 'charger' });
  const defender = createUnit({ id: 'defender', owner: 'player-2' });

  const result = resolveSimpleConformationShift({
    chargerUnit: charger,
    defenderUnit: defender,
    blockerUnit: null,
    idealPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
    units: [charger, defender],
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
  });

  assert.equal(result.shiftingPlan.status, CONFORMATION_SHIFTING_PLAN_STATUSES.NONE);
  assert.equal(result.shiftedPose, null);
});

test('simple conformation shift prefers a legal rear shift for one friendly blocker', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', owner: 'player-2', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });
  const blocker = createUnit({ id: 'blocker', xUd: 10, yUd: 9, rotationRadians: Math.PI });

  const result = resolveSimpleConformationShift({
    chargerUnit: charger,
    defenderUnit: defender,
    blockerUnit: blocker,
    idealPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
    units: [defender, blocker],
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
  });

  assert.equal(result.shiftingPlan.status, CONFORMATION_SHIFTING_PLAN_STATUSES.READY);
  assert.deepEqual(result.shiftingPlan.shiftedUnitIds, ['blocker']);
  assert.equal(result.shiftingPlan.steps[0]?.direction, 'rear');
  assert.ok(result.shiftingPlan.steps[0]?.distanceUd > 1);
  assert.equal(result.shiftingPlan.lockEffects[0]?.movedOrRalliedLock, true);
  assert.equal(result.shiftedPose?.yUd < blocker.yUd, true);
});

test('simple conformation shift records the light-troops lock exception', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', owner: 'player-2', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });
  const blocker = createUnit({
    id: 'light-blocker',
    xUd: 10,
    yUd: 9,
    rotationRadians: Math.PI,
    profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY,
  });

  const result = resolveSimpleConformationShift({
    chargerUnit: charger,
    defenderUnit: defender,
    blockerUnit: blocker,
    idealPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
    units: [defender, blocker],
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
  });

  assert.equal(result.shiftingPlan.status, CONFORMATION_SHIFTING_PLAN_STATUSES.READY);
  assert.equal(result.shiftingPlan.lockEffects[0]?.movedOrRalliedLock, false);
  assert.equal(result.shiftingPlan.lockEffects[0]?.lightTroopsException, true);
});

test('simple conformation shift blocks unshiftable blocker families', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', owner: 'player-2', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });
  const blocker = createUnit({ id: 'war-wagon-blocker', xUd: 10, yUd: 9, troopType: 'war-wagon' });

  const result = resolveSimpleConformationShift({
    chargerUnit: charger,
    defenderUnit: defender,
    blockerUnit: blocker,
    idealPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
    units: [defender, blocker],
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
  });

  assert.equal(result.shiftingPlan.status, CONFORMATION_SHIFTING_PLAN_STATUSES.SOURCE_OPEN);
  assert.equal(result.shiftingPlan.diagnostics[0]?.code, 'conformation.shift.blocked.unshiftable-unit');
  assert.equal(result.shiftingPlan.sourceStatus, CONFORMATION_SOURCE_STATUSES.ERRATA_CHECK);
});

test('simple conformation shift blocks a supporting blocker that would lose support', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', owner: 'player-2', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });
  const blocker = createUnit({
    id: 'support-blocker',
    xUd: 10,
    yUd: 9,
    rotationRadians: Math.PI,
    inMeleeSupport: true,
    providesOnlySimpleSupport: true,
    wouldSupportFriendlyAfterConformation: false,
  });

  const result = resolveSimpleConformationShift({
    chargerUnit: charger,
    defenderUnit: defender,
    blockerUnit: blocker,
    idealPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
    units: [defender, blocker],
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
  });

  assert.equal(result.shiftingPlan.status, CONFORMATION_SHIFTING_PLAN_STATUSES.BLOCKED);
  assert.equal(result.shiftingPlan.diagnostics[0]?.code, 'conformation.shift.blocked.support-preservation');
});