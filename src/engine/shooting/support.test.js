import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHOOTING_SUPPORT_REASON_CODES,
  SHOOTING_SUPPORT_STATUSES,
  createCombinedShotGroup,
} from './support.js';
import { SHOOTING_PROFILE_IDS, SHOOTING_SOURCE_STATUSES } from './index.js';

function createShooter(overrides = {}) {
  return {
    id: overrides.id ?? 'shooter-1',
    shootingProfileId: overrides.shootingProfileId ?? SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    sourceStatus: overrides.sourceStatus,
  };
}

function createTarget(overrides = {}) {
  return {
    id: overrides.id ?? 'target-1',
  };
}

test('P8-06 rounds light-troop support up after totaling', () => {
  const result = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTarget(),
    supportingShooters: [
      createShooter({ id: 'support-1' }),
      createShooter({ id: 'support-2' }),
      createShooter({ id: 'support-3' }),
    ],
  });

  assert.equal(result.status, SHOOTING_SUPPORT_STATUSES.READY);
  assert.equal(result.supportContributionTotal, 1.5);
  assert.equal(result.roundedSupportContribution, 2);
  assert.equal(result.supportBonus, 2);
});

test('P8-06 caps combined-shot support bonus at +3', () => {
  const result = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main', shootingProfileId: SHOOTING_PROFILE_IDS.MOUNTED_BOW }),
    targetUnit: createTarget(),
    supportingShooters: [
      createShooter({ id: 'support-1', shootingProfileId: SHOOTING_PROFILE_IDS.MOUNTED_BOW }),
      createShooter({ id: 'support-2', shootingProfileId: SHOOTING_PROFILE_IDS.MOUNTED_BOW }),
      createShooter({ id: 'support-3', shootingProfileId: SHOOTING_PROFILE_IDS.MOUNTED_BOW }),
      createShooter({ id: 'support-4', shootingProfileId: SHOOTING_PROFILE_IDS.MOUNTED_BOW }),
    ],
  });

  assert.equal(result.status, SHOOTING_SUPPORT_STATUSES.READY);
  assert.equal(result.roundedSupportContribution, 4);
  assert.equal(result.supportBonus, 3);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.SUPPORT_CAP_APPLIED), true);
});

test('P8-06 rejects non-support-eligible supporting shooters', () => {
  const result = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTarget(),
    supportingShooters: [
      createShooter({ id: 'support-1', shootingProfileId: SHOOTING_PROFILE_IDS.NONE }),
    ],
  });

  assert.equal(result.status, SHOOTING_SUPPORT_STATUSES.INVALID);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_SUPPORT_REASON_CODES.SUPPORTER_NOT_ELIGIBLE);
});

test('P8-06 keeps source-open support families diagnostic-only', () => {
  const result = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTarget(),
    supportingShooters: [
      createShooter({ id: 'support-1', sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK }),
    ],
  });

  assert.equal(result.status, SHOOTING_SUPPORT_STATUSES.SOURCE_OPEN);
  assert.equal(result.sourceStatus, SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.SUPPORT_FAMILY_DEFERRED), true);
});