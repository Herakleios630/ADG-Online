import { getShootingProfileForUnit } from '../../data/unit-profiles.js';
import { SHOOTING_SOURCE_STATUSES } from './model.js';

const SHOOTING_PHASE_ID = 'shooting';

export const SHOOTING_SEQUENCE_TYPES = {
  ACTIVE_PLAYER: 'active-player-sequence',
  OPPONENT_REACTIVE: 'opponent-reactive-sequence',
};

export const SHOOTING_ELIGIBILITY_STATUSES = {
  ELIGIBLE: 'eligible',
  INELIGIBLE: 'ineligible',
  SOURCE_OPEN: 'source-open',
};

export const SHOOTING_ELIGIBILITY_REASON_CODES = {
  WRONG_PHASE: 'wrong-phase',
  NON_SHOOTER_PROFILE: 'non-shooter-profile',
  SHOOTING_PROFILE_UNRESOLVED: 'shooting-profile-unresolved',
  NOT_ACTIVE_PLAYER: 'not-active-player',
  MULTI_MOVE_LOCKED: 'multi-move-locked',
  CHARGED_THIS_SEQUENCE: 'charged-this-sequence',
  EVADED_THIS_SEQUENCE: 'evaded-this-sequence',
  DISENGAGED_THIS_SEQUENCE: 'disengaged-this-sequence',
  RETREATED_OUT_OF_ZOC_THIS_SEQUENCE: 'retreated-out-of-zoc-this-sequence',
  SEQUENCE_LOCKED: 'sequence-locked',
  MELEE_LOCKED: 'melee-locked',
  MELEE_SUPPORT_LOCKED: 'melee-support-locked',
  OPPONENT_SEQUENCE_DEFERRED: 'opponent-sequence-deferred',
  TARGET_MISSING: 'target-missing',
  TARGET_SELF: 'target-self',
  TARGET_FRIENDLY: 'target-friendly',
  TARGET_ALREADY_SHOT: 'target-already-shot',
  TARGET_IN_MELEE: 'target-in-melee',
  TARGET_IN_MELEE_SUPPORT: 'target-in-melee-support',
};

function createDiagnostic(code, message, sourceStatus = SHOOTING_SOURCE_STATUSES.VERIFIED) {
  return { code, message, sourceStatus };
}

function resolveShootingProfile(unit) {
  try {
    return {
      profile: getShootingProfileForUnit(unit),
      error: null,
    };
  } catch (error) {
    return {
      profile: null,
      error,
    };
  }
}

function isMeleeLocked(unit) {
  return Boolean(unit?.engagedInMelee);
}

function isMeleeSupportLocked(unit) {
  return Boolean(unit?.inMeleeSupport) && !Boolean(unit?.providesOnlySimpleSupport);
}

function getTargetedUnitIds(shootingState) {
  return Array.isArray(shootingState?.targetedUnitIds) ? new Set(shootingState.targetedUnitIds) : new Set();
}

function getMoveCountThisSequence(unit) {
  return Number.isFinite(unit?.moveCountThisSequence) ? Number(unit.moveCountThisSequence) : 0;
}

export function getShooterEligibility({
  unit,
  shootingState = null,
  activePlayerId = null,
  currentPhaseId = null,
  sequenceType = shootingState?.sequenceType ?? SHOOTING_SEQUENCE_TYPES.ACTIVE_PLAYER,
} = {}) {
  const diagnostics = [];
  const { profile, error } = resolveShootingProfile(unit);

  if (error) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.SHOOTING_PROFILE_UNRESOLVED,
      error.message,
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.SOURCE_OPEN,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      shootingProfileId: null,
      sequenceType,
      diagnostics,
    };
  }

  if (currentPhaseId !== SHOOTING_PHASE_ID) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.WRONG_PHASE,
      'Shooting is only available during the shooting phase.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (sequenceType === SHOOTING_SEQUENCE_TYPES.OPPONENT_REACTIVE) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.OPPONENT_SEQUENCE_DEFERRED,
      'Opponent-sequence reactive shooting remains source-open in the current P8-03 state seam.',
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.SOURCE_OPEN,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (!profile.canShoot) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.NON_SHOOTER_PROFILE,
      'This unit profile is not a shooter in the current subset.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (activePlayerId && unit?.owner !== activePlayerId) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.NOT_ACTIVE_PLAYER,
      'Only units of the active player can shoot in the current sequence seam.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (getMoveCountThisSequence(unit) > 1) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.MULTI_MOVE_LOCKED,
      'Units that already made a second or later move this sequence cannot shoot.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (Boolean(unit?.hasChargedThisSequence)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.CHARGED_THIS_SEQUENCE,
      'Units that charged this sequence cannot shoot.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (Boolean(unit?.hasEvadedThisSequence)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.EVADED_THIS_SEQUENCE,
      'Units that evaded this sequence cannot shoot.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (Boolean(unit?.hasDisengagedThisSequence)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.DISENGAGED_THIS_SEQUENCE,
      'Units that disengaged this sequence cannot shoot.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (Boolean(unit?.retreatedOutOfZocThisSequence)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.RETREATED_OUT_OF_ZOC_THIS_SEQUENCE,
      'Units that retreated out of an enemy ZoC this sequence cannot shoot.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (Boolean(unit?.cannotShootThisSequence)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.SEQUENCE_LOCKED,
      'This unit is already marked as unable to shoot this sequence.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (isMeleeLocked(unit)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.MELEE_LOCKED,
      'Units engaged in melee cannot shoot.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  if (isMeleeSupportLocked(unit)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.MELEE_SUPPORT_LOCKED,
      'Units providing melee support cannot shoot.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canShoot: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      shootingProfileId: profile.id,
      sequenceType,
      diagnostics,
    };
  }

  return {
    status: SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE,
    canShoot: true,
    sourceStatus: profile.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
    shootingProfileId: profile.id,
    sequenceType,
    diagnostics,
  };
}

export function getTargetEligibility({
  shooterUnit,
  targetUnit,
  shootingState = null,
  activePlayerId = null,
  currentPhaseId = null,
  sequenceType = shootingState?.sequenceType ?? SHOOTING_SEQUENCE_TYPES.ACTIVE_PLAYER,
} = {}) {
  const diagnostics = [];
  const targetedUnitIds = getTargetedUnitIds(shootingState);

  if (currentPhaseId !== SHOOTING_PHASE_ID) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.WRONG_PHASE,
      'Targets can only be selected during the shooting phase.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      sequenceType,
      diagnostics,
    };
  }

  if (sequenceType === SHOOTING_SEQUENCE_TYPES.OPPONENT_REACTIVE) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.OPPONENT_SEQUENCE_DEFERRED,
      'Opponent-sequence target handling remains source-open in the current P8-03 state seam.',
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.SOURCE_OPEN,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      sequenceType,
      diagnostics,
    };
  }

  if (!targetUnit) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_MISSING,
      'A target unit is required.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      sequenceType,
      diagnostics,
    };
  }

  if (shooterUnit?.id && targetUnit.id === shooterUnit.id) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_SELF,
      'A unit cannot target itself.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      sequenceType,
      diagnostics,
    };
  }

  const effectiveActivePlayerId = activePlayerId ?? shooterUnit?.owner ?? null;
  if (effectiveActivePlayerId && targetUnit.owner === effectiveActivePlayerId) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_FRIENDLY,
      'Friendly units cannot be targeted by shooting.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      sequenceType,
      diagnostics,
    };
  }

  if (targetedUnitIds.has(targetUnit.id)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_ALREADY_SHOT,
      'This target has already been shot at in the current shooting phase.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      sequenceType,
      diagnostics,
    };
  }

  if (isMeleeLocked(targetUnit)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_IN_MELEE,
      'Units engaged in melee cannot be targeted by shooting.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      sequenceType,
      diagnostics,
    };
  }

  if (isMeleeSupportLocked(targetUnit)) {
    diagnostics.push(createDiagnostic(
      SHOOTING_ELIGIBILITY_REASON_CODES.TARGET_IN_MELEE_SUPPORT,
      'Units providing melee support cannot be targeted by shooting.',
    ));

    return {
      status: SHOOTING_ELIGIBILITY_STATUSES.INELIGIBLE,
      canBeTargeted: false,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      sequenceType,
      diagnostics,
    };
  }

  return {
    status: SHOOTING_ELIGIBILITY_STATUSES.ELIGIBLE,
    canBeTargeted: true,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    sequenceType,
    diagnostics,
  };
}