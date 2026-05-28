import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHOOTING_EDGE_RULES,
  SHOOTING_PROFILE_IDS,
  SHOOTING_RESOLUTION_APPLICATION_STATUSES,
  SHOOTING_SOURCE_STATUSES,
  SHOOTING_WEAPON_FAMILIES,
  SHOOTING_ZONE_KINDS,
  createShotResolutionRecord,
  createShootingProfileSnapshot,
  createShootingRollClaim,
  createShootingRollResult,
  getAllShootingProfiles,
  getShootingProfile,
} from './index.js';

test('P8-01 shooting profiles expose only the source-gated first subset', () => {
  assert.deepEqual(
    getAllShootingProfiles().map((profile) => profile.id).sort(),
    [
      SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
      SHOOTING_PROFILE_IDS.MOUNTED_BOW,
      SHOOTING_PROFILE_IDS.NONE,
    ].sort(),
  );
});

test('light missile foot profile uses the P8-00 normal front-zone range baseline', () => {
  const profile = getShootingProfile(SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT);

  assert.equal(profile.canShoot, true);
  assert.equal(profile.weaponFamily, SHOOTING_WEAPON_FAMILIES.LIGHT_MISSILE_FOOT);
  assert.equal(profile.rangeUd, 2);
  assert.equal(profile.shootingEdgeRule, SHOOTING_EDGE_RULES.FRONT_EDGE);
  assert.equal(profile.shootingZoneKind, SHOOTING_ZONE_KINDS.NORMAL_FRONT_RECTANGLE);
  assert.equal(profile.supportEligible, true);
  assert.equal(profile.supportCountsAsLightTroops, true);
  assert.equal(profile.sourceStatus, SHOOTING_SOURCE_STATUSES.VERIFIED);
  assert.equal(profile.deferredRuleIds.includes('javelin-range-1'), true);
});

test('mounted bow profile stays normal-zone only and defers light cavalry 360 shooting', () => {
  const profile = getShootingProfile(SHOOTING_PROFILE_IDS.MOUNTED_BOW);

  assert.equal(profile.canShoot, true);
  assert.equal(profile.weaponFamily, SHOOTING_WEAPON_FAMILIES.MOUNTED_BOW);
  assert.equal(profile.rangeUd, 2);
  assert.equal(profile.shootingEdgeRule, SHOOTING_EDGE_RULES.FRONT_EDGE);
  assert.equal(profile.shootingZoneKind, SHOOTING_ZONE_KINDS.NORMAL_FRONT_RECTANGLE);
  assert.equal(profile.specialZoneStatus, SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK);
  assert.equal(profile.deferredRuleIds.includes('light-cavalry-360-zone'), true);
});

test('no-shoot profile is an explicit non-shooter instead of an implicit default', () => {
  const profile = getShootingProfile(SHOOTING_PROFILE_IDS.NONE);

  assert.equal(profile.canShoot, false);
  assert.equal(profile.weaponFamily, SHOOTING_WEAPON_FAMILIES.NONE);
  assert.equal(profile.rangeUd, null);
  assert.equal(profile.shootingEdgeRule, SHOOTING_EDGE_RULES.NONE);
  assert.equal(profile.shootingZoneKind, SHOOTING_ZONE_KINDS.NONE);
});

test('shooting profile snapshots remain serializable and unknown ids fail loudly', () => {
  const profile = getShootingProfile(SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT);
  const snapshot = createShootingProfileSnapshot(profile);

  assert.deepEqual(snapshot, JSON.parse(JSON.stringify(profile)));
  assert.throws(
    () => getShootingProfile('sp-unsupported-javelin'),
    /Unknown shooting profile id 'sp-unsupported-javelin'\./,
  );
  assert.throws(
    () => getShootingProfile(''),
    /Shooting profile id is required\./,
  );
});

test('P8-02 shooting roll claims keep reducer-owned declaration context serializable', () => {
  const claim = createShootingRollClaim({
    reason: 'shooting-declaration',
    actingPlayerId: 'player-1',
    shooterUnitId: 'unit-archers',
    targetUnitId: 'unit-target',
    phase: 'shooting-own-sequence',
    declarationSnapshot: {
      shooterUnitId: 'unit-archers',
      targetUnitId: 'unit-target',
      supportUnitIds: ['unit-support-1'],
    },
    actionLogToken: 'shot-001',
    simultaneousGroupId: 'sim-group-1',
  });

  assert.deepEqual(claim, {
    reason: 'shooting-declaration',
    actingPlayerId: 'player-1',
    shooterUnitId: 'unit-archers',
    targetUnitId: 'unit-target',
    phase: 'shooting-own-sequence',
    declarationSnapshot: {
      shooterUnitId: 'unit-archers',
      targetUnitId: 'unit-target',
      supportUnitIds: ['unit-support-1'],
    },
    actionLogToken: 'shot-001',
    simultaneousGroupId: 'sim-group-1',
  });
});

test('P8-02 shooting roll results compute totals and enforce one cohesion loss maximum', () => {
  const claim = createShootingRollClaim({
    shooterUnitId: 'unit-archers',
    targetUnitId: 'unit-target',
    simultaneousGroupId: 'sim-group-1',
  });
  const result = createShootingRollResult({
    claim,
    shooterDieRoll: 5,
    targetDieRoll: 3,
    shooterModifierTotal: 2,
    targetProtectionValue: 1,
  });

  assert.equal(result.shooterTotal, 7);
  assert.equal(result.targetTotal, 4);
  assert.equal(result.cohesionLoss, 1);
  assert.equal(result.simultaneousGroupId, 'sim-group-1');
  assert.equal(result.applyAfterResolutionGroup, true);
  assert.equal(result.sourceStatus, SHOOTING_SOURCE_STATUSES.VERIFIED);
});

test('P8-02 shot resolution records preserve simultaneous application metadata for later counterfire', () => {
  const claim = createShootingRollClaim({
    shooterUnitId: 'unit-archers',
    targetUnitId: 'unit-target',
    simultaneousGroupId: 'sim-group-2',
  });
  const result = createShootingRollResult({
    claim,
    shooterDieRoll: 4,
    targetDieRoll: 4,
    shooterModifierTotal: 0,
    targetProtectionValue: 1,
  });
  const record = createShotResolutionRecord({
    claim,
    result,
  });

  assert.equal(record.simultaneousGroupId, 'sim-group-2');
  assert.equal(record.applyAfterResolutionGroup, true);
  assert.equal(record.applicationStatus, SHOOTING_RESOLUTION_APPLICATION_STATUSES.PENDING_SIMULTANEOUS_GROUP);
  assert.deepEqual(record, JSON.parse(JSON.stringify(record)));
});

test('P8-02 shooting roll validation rejects invalid D6 values and invalid cohesion loss overrides', () => {
  assert.throws(
    () => createShootingRollResult({
      shooterDieRoll: 0,
      targetDieRoll: 3,
    }),
    /Shooting shooter roll resolution requires a D6 roll from 1 to 6\./,
  );

  assert.throws(
    () => createShootingRollResult({
      shooterDieRoll: 3,
      targetDieRoll: 7,
    }),
    /Shooting target roll resolution requires a D6 roll from 1 to 6\./,
  );

  assert.throws(
    () => createShootingRollResult({
      shooterDieRoll: 6,
      targetDieRoll: 1,
      cohesionLoss: 2,
    }),
    /Shooting cohesion loss must be 0 or 1\./,
  );
});