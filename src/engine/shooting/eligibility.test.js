import test from 'node:test';
import assert from 'node:assert/strict';

import { UNIT_PROFILE_IDS } from '../../data/unit-profiles.js';
import {
  SHOOTING_ELIGIBILITY_REASON_CODES,
  SHOOTING_ELIGIBILITY_STATUSES,
  SHOOTING_SEQUENCE_TYPES,
  getShooterEligibility,
  getTargetEligibility,
} from './eligibility.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit-1',
    owner: overrides.owner ?? 'player-1',
    profileId: overrides.profileId ?? UNIT_PROFILE_IDS.LIGHT_INFANTRY,
    moveCountThisSequence: Number.isFinite(overrides.moveCountThisSequence) ? overrides.moveCountThisSequence : 0,
    hasChargedThisSequence: Boolean(overrides.hasChargedThisSequence),
    hasEvadedThisSequence: Boolean(overrides.hasEvadedThisSequence),
    hasDisengagedThisSequence: Boolean(overrides.hasDisengagedThisSequence),
    retreatedOutOfZocThisSequence: Boolean(overrides.retreatedOutOfZocThisSequence),
    engagedInMelee: Boolean(overrides.engagedInMelee),
    inMeleeSupport: Boolean(overrides.inMeleeSupport),
    providesOnlySimpleSupport: Boolean(overrides.providesOnlySimpleSupport),
    cannotShootThisSequence: Boolean(overrides.cannotShootThisSequence),
  };
}

test('P8-03 shooter eligibility allows current-subset missile troops for the active player in shooting phase', () => {
  const result = getShooterEligibility({
    unit: createUnit(),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
    shootingState: {
      sequenceType: SHOOTING_SEQUENCE_TYPES.ACTIVE_PLAYER,
      targetedUnitIds: [],
    },
  });

  assert.equal(result.status, SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE);
  assert.equal(result.canShoot, true);
  assert.deepEqual(result.diagnostics, []);
});

test('P8-03 shooter eligibility rejects sequence locks and melee locks', () => {
  const sequenceLocked = getShooterEligibility({
    unit: createUnit({ cannotShootThisSequence: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(sequenceLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(sequenceLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.SEQUENCE_LOCKED);

  const meleeLocked = getShooterEligibility({
    unit: createUnit({ engagedInMelee: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(meleeLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(meleeLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.MELEE_LOCKED);

  const supportLocked = getShooterEligibility({
    unit: createUnit({ inMeleeSupport: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(supportLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(supportLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.MELEE_SUPPORT_LOCKED);
});

test('P8-03 shooter eligibility rejects live and deferred seam lock inputs', () => {
  const multiMoveLocked = getShooterEligibility({
    unit: createUnit({ moveCountThisSequence: 2 }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(multiMoveLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(multiMoveLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.MULTI_MOVE_LOCKED);

  const chargedLocked = getShooterEligibility({
    unit: createUnit({ hasChargedThisSequence: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(chargedLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(chargedLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.CHARGED_THIS_SEQUENCE);

  const evadedLocked = getShooterEligibility({
    unit: createUnit({ hasEvadedThisSequence: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(evadedLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(evadedLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.EVADED_THIS_SEQUENCE);

  const disengagedLocked = getShooterEligibility({
    unit: createUnit({ hasDisengagedThisSequence: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(disengagedLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(disengagedLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.DISENGAGED_THIS_SEQUENCE);

  const retreatLocked = getShooterEligibility({
    unit: createUnit({ retreatedOutOfZocThisSequence: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
  });
  assert.equal(retreatLocked.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(retreatLocked.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.RETREATED_OUT_OF_ZOC_THIS_SEQUENCE);
});

test('P8-03 shooter eligibility keeps opponent-sequence reactive shooting source-open', () => {
  const result = getShooterEligibility({
    unit: createUnit(),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
    sequenceType: SHOOTING_SEQUENCE_TYPES.OPPONENT_REACTIVE,
  });

  assert.equal(result.status, SHOOTING_ELIGIBILITY_STATUSES.SOURCE_OPEN);
  assert.equal(result.canShoot, false);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.OPPONENT_SEQUENCE_DEFERRED);
});

test('P8-03 target eligibility rejects already-shot and melee-locked targets', () => {
  const shooterUnit = createUnit({ id: 'shooter-1' });
  const alreadyShot = getTargetEligibility({
    shooterUnit,
    targetUnit: createUnit({ id: 'target-1', owner: 'player-2' }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
    shootingState: {
      sequenceType: SHOOTING_SEQUENCE_TYPES.ACTIVE_PLAYER,
      targetedUnitIds: ['target-1'],
    },
  });
  assert.equal(alreadyShot.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(alreadyShot.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_ALREADY_SHOT);

  const meleeTarget = getTargetEligibility({
    shooterUnit,
    targetUnit: createUnit({ id: 'target-2', owner: 'player-2', engagedInMelee: true }),
    activePlayerId: 'player-1',
    currentPhaseId: 'shooting',
    shootingState: {
      sequenceType: SHOOTING_SEQUENCE_TYPES.ACTIVE_PLAYER,
      targetedUnitIds: [],
    },
  });
  assert.equal(meleeTarget.status, SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE);
  assert.equal(meleeTarget.diagnostics[0]?.code, SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_IN_MELEE);
});