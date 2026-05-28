import test from 'node:test';
import assert from 'node:assert/strict';

import { UNIT_PROFILE_IDS } from '../../data/unit-profiles.js';
import { createCombinedShotGroup } from './support.js';
import {
  SHOOTING_RESOLUTION_REASON_CODES,
  SHOOTING_RESOLUTION_STATUSES,
  resolveCombinedShotOutcome,
} from './resolution.js';

function createShooter(overrides = {}) {
  return {
    id: overrides.id ?? 'shooter-1',
    shootingProfileId: overrides.shootingProfileId ?? 'sp-light-missile-foot',
    sourceStatus: overrides.sourceStatus,
  };
}

function createTargetUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'target-1',
    profileId: overrides.profileId ?? UNIT_PROFILE_IDS.LIGHT_INFANTRY,
    selectedAbilityIds: overrides.selectedAbilityIds ?? [],
  };
}

test('P8-07 resolves baseline support with an explicit verified protection input into a deterministic result', () => {
  const declaredShotGroup = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTargetUnit({ id: 'target-1' }),
    supportingShooters: [
      createShooter({ id: 'support-1' }),
      createShooter({ id: 'support-2' }),
      createShooter({ id: 'support-3' }),
    ],
  });

  const resolution = resolveCombinedShotOutcome({
    declaredShotGroup,
    targetUnit: createTargetUnit({ id: 'target-1' }),
    actingPlayerId: 'player-1',
    phase: 'shooting',
    shooterDieRoll: 5,
    targetDieRoll: 3,
    simultaneousGroupId: 'sim-shot-1',
    resolvedTargetProtectionValue: 1,
    resolvedTargetProtectionSourceStatus: 'verified',
  });

  assert.equal(resolution.status, SHOOTING_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.result.shooterModifierTotal, 2);
  assert.equal(resolution.result.targetProtectionValue, 1);
  assert.equal(resolution.result.shooterTotal, 7);
  assert.equal(resolution.result.targetTotal, 4);
  assert.equal(resolution.result.cohesionLoss, 1);
  assert.equal(resolution.record.simultaneousGroupId, 'sim-shot-1');
  assert.equal(resolution.shooterModifierBreakdown[0]?.code, SHOOTING_RESOLUTION_REASON_CODES.SUPPORT_BONUS_APPLIED);
  assert.equal(resolution.targetProtectionBreakdown[0]?.code, SHOOTING_RESOLUTION_REASON_CODES.BASIC_PROTECTION_OVERRIDE);
});

test('P8-07 returns no effect when the modified shooter total does not beat an explicit verified protection plus target die', () => {
  const declaredShotGroup = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTargetUnit({ id: 'target-2' }),
  });

  const resolution = resolveCombinedShotOutcome({
    declaredShotGroup,
    targetUnit: createTargetUnit({ id: 'target-2' }),
    shooterDieRoll: 2,
    targetDieRoll: 4,
    resolvedTargetProtectionValue: 1,
    resolvedTargetProtectionSourceStatus: 'verified',
  });

  assert.equal(resolution.status, SHOOTING_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.result.shooterModifierTotal, 0);
  assert.equal(resolution.result.targetProtectionValue, 1);
  assert.equal(resolution.result.cohesionLoss, 0);
});

test('P8-07 keeps basic protection source-open when no explicit verified protection value is provided', () => {
  const declaredShotGroup = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTargetUnit({ id: 'target-implicit-light' }),
  });

  const resolution = resolveCombinedShotOutcome({
    declaredShotGroup,
    targetUnit: createTargetUnit({ id: 'target-implicit-light' }),
    shooterDieRoll: 5,
    targetDieRoll: 3,
  });

  assert.equal(resolution.status, SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(resolution.result, null);
  assert.equal(resolution.record, null);
  assert.equal(resolution.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_RESOLUTION_REASON_CODES.BASIC_PROTECTION_DEFERRED), true);
});

test('P8-07 keeps broader modifier families source-open until the ordered table is source-closed', () => {
  const declaredShotGroup = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTargetUnit({ id: 'target-3' }),
  });

  const resolution = resolveCombinedShotOutcome({
    declaredShotGroup,
    targetUnit: createTargetUnit({ id: 'target-3' }),
    shooterDieRoll: 4,
    targetDieRoll: 2,
    requestedModifierIds: ['target-in-cover'],
  });

  assert.equal(resolution.status, SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(resolution.result, null);
  assert.equal(resolution.record, null);
  assert.equal(resolution.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_RESOLUTION_REASON_CODES.ADDITIONAL_MODIFIER_DEFERRED), true);
});

test('P8-07 keeps unresolved basic protection families source-open instead of inventing values', () => {
  const declaredShotGroup = createCombinedShotGroup({
    mainShooter: createShooter({ id: 'main' }),
    targetUnit: createTargetUnit({ id: 'target-4', profileId: UNIT_PROFILE_IDS.CAVALRY_BOW }),
  });

  const resolution = resolveCombinedShotOutcome({
    declaredShotGroup,
    targetUnit: createTargetUnit({ id: 'target-4', profileId: UNIT_PROFILE_IDS.CAVALRY_BOW }),
    shooterDieRoll: 4,
    targetDieRoll: 2,
  });

  assert.equal(resolution.status, SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(resolution.result, null);
  assert.equal(resolution.record, null);
  assert.equal(resolution.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_RESOLUTION_REASON_CODES.BASIC_PROTECTION_DEFERRED), true);
});