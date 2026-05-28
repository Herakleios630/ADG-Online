import {
  SHOOTING_SOURCE_STATUSES,
  getShootingProfile,
} from './model.js';

export const SHOOTING_SUPPORT_STATUSES = {
  READY: 'ready',
  INVALID: 'invalid',
  SOURCE_OPEN: 'source-open',
};

export const SHOOTING_SUPPORT_REASON_CODES = {
  MAIN_SHOOTER_REQUIRED: 'main-shooter-required',
  TARGET_REQUIRED: 'target-required',
  MAIN_SHOOTER_PROFILE_REQUIRED: 'main-shooter-profile-required',
  MAIN_SHOOTER_NOT_ELIGIBLE: 'main-shooter-not-eligible',
  SUPPORTER_PROFILE_REQUIRED: 'supporter-profile-required',
  SUPPORTER_NOT_ELIGIBLE: 'supporter-not-eligible',
  DUPLICATE_SUPPORTER_IGNORED: 'duplicate-supporter-ignored',
  SELF_SUPPORT_IGNORED: 'self-support-ignored',
  SUPPORT_CAP_APPLIED: 'support-cap-applied',
  SUPPORT_FAMILY_DEFERRED: 'support-family-deferred',
};

const MAX_SUPPORT_BONUS = 3;

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function createDiagnostic(code, message, context = {}) {
  return {
    code,
    message,
    ...context,
  };
}

function getParticipantId(participant, fallbackLabel) {
  if (typeof participant?.id === 'string' && participant.id.trim().length > 0) {
    return participant.id.trim();
  }

  return fallbackLabel;
}

function resolveParticipantProfile(participant, requiredCode, invalidCode, roleLabel) {
  const shootingProfileId = typeof participant?.shootingProfileId === 'string' && participant.shootingProfileId.trim().length > 0
    ? participant.shootingProfileId.trim()
    : null;

  if (!shootingProfileId) {
    return {
      profile: null,
      diagnostic: createDiagnostic(
        requiredCode,
        `${roleLabel} requires a resolved shooting profile id.`,
        { unitId: getParticipantId(participant, roleLabel.toLowerCase().replace(/\s+/g, '-')) },
      ),
    };
  }

  const profile = getShootingProfile(shootingProfileId);

  if (!profile.canShoot || !profile.supportEligible) {
    return {
      profile: null,
      diagnostic: createDiagnostic(
        invalidCode,
        `${roleLabel} '${getParticipantId(participant, 'unknown-unit')}' cannot contribute to a combined shot in the current subset.`,
        {
          unitId: getParticipantId(participant, 'unknown-unit'),
          shootingProfileId,
        },
      ),
    };
  }

  return { profile, diagnostic: null };
}

function getParticipantSourceStatus(participant, profile) {
  if (participant?.sourceStatus === SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK) {
    return SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK;
  }

  return profile?.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED;
}

export function createCombinedShotGroup({
  mainShooter,
  targetUnit,
  supportingShooters = [],
} = {}) {
  const diagnostics = [];

  if (!mainShooter || typeof mainShooter !== 'object') {
    diagnostics.push(createDiagnostic(
      SHOOTING_SUPPORT_REASON_CODES.MAIN_SHOOTER_REQUIRED,
      'Combined shot groups require one main shooter.',
    ));
  }

  if (!targetUnit || typeof targetUnit !== 'object') {
    diagnostics.push(createDiagnostic(
      SHOOTING_SUPPORT_REASON_CODES.TARGET_REQUIRED,
      'Combined shot groups require one target unit.',
    ));
  }

  const mainResolution = mainShooter && typeof mainShooter === 'object'
    ? resolveParticipantProfile(
      mainShooter,
      SHOOTING_SUPPORT_REASON_CODES.MAIN_SHOOTER_PROFILE_REQUIRED,
      SHOOTING_SUPPORT_REASON_CODES.MAIN_SHOOTER_NOT_ELIGIBLE,
      'Main shooter',
    )
    : { profile: null, diagnostic: null };

  if (mainResolution.diagnostic) {
    diagnostics.push(mainResolution.diagnostic);
  }

  const uniqueSupportingShooters = [];
  const seenSupporterIds = new Set();
  const mainShooterUnitId = getParticipantId(mainShooter, 'main-shooter');

  for (const supportingShooter of Array.isArray(supportingShooters) ? supportingShooters : []) {
    const supporterUnitId = getParticipantId(supportingShooter, 'supporter');

    if (supporterUnitId === mainShooterUnitId) {
      diagnostics.push(createDiagnostic(
        SHOOTING_SUPPORT_REASON_CODES.SELF_SUPPORT_IGNORED,
        `Main shooter '${mainShooterUnitId}' cannot also count as supporting fire.`,
        { unitId: supporterUnitId },
      ));
      continue;
    }

    if (seenSupporterIds.has(supporterUnitId)) {
      diagnostics.push(createDiagnostic(
        SHOOTING_SUPPORT_REASON_CODES.DUPLICATE_SUPPORTER_IGNORED,
        `Supporter '${supporterUnitId}' was listed more than once and was only counted once.`,
        { unitId: supporterUnitId },
      ));
      continue;
    }

    seenSupporterIds.add(supporterUnitId);
    uniqueSupportingShooters.push(supportingShooter);
  }

  const supportingEntries = uniqueSupportingShooters.map((supportingShooter) => {
    const resolution = resolveParticipantProfile(
      supportingShooter,
      SHOOTING_SUPPORT_REASON_CODES.SUPPORTER_PROFILE_REQUIRED,
      SHOOTING_SUPPORT_REASON_CODES.SUPPORTER_NOT_ELIGIBLE,
      'Supporting shooter',
    );

    if (resolution.diagnostic) {
      diagnostics.push(resolution.diagnostic);
      return null;
    }

    return {
      unitId: getParticipantId(supportingShooter, 'supporter'),
      shootingProfileId: resolution.profile.id,
      countsAsLightTroops: Boolean(resolution.profile.supportCountsAsLightTroops),
      sourceStatus: getParticipantSourceStatus(supportingShooter, resolution.profile),
    };
  }).filter(Boolean);

  if (diagnostics.some((diagnostic) => (
    diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.MAIN_SHOOTER_REQUIRED
      || diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.TARGET_REQUIRED
      || diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.MAIN_SHOOTER_PROFILE_REQUIRED
      || diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.MAIN_SHOOTER_NOT_ELIGIBLE
      || diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.SUPPORTER_PROFILE_REQUIRED
      || diagnostic.code === SHOOTING_SUPPORT_REASON_CODES.SUPPORTER_NOT_ELIGIBLE
  ))) {
    return {
      status: SHOOTING_SUPPORT_STATUSES.INVALID,
      mainShooterUnitId: mainShooterUnitId || null,
      targetUnitId: getParticipantId(targetUnit, 'target-unit'),
      supportingUnitIds: supportingEntries.map((entry) => entry.unitId),
      supportBonus: 0,
      supportContributionTotal: 0,
      roundedSupportContribution: 0,
      fullSupportCount: 0,
      lightTroopSupportCount: 0,
      diagnostics,
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    };
  }

  const fullSupportCount = supportingEntries.filter((entry) => !entry.countsAsLightTroops).length;
  const lightTroopSupportCount = supportingEntries.filter((entry) => entry.countsAsLightTroops).length;
  const supportContributionTotal = fullSupportCount + (lightTroopSupportCount * 0.5);
  const roundedSupportContribution = Math.ceil(supportContributionTotal);
  const supportBonus = Math.min(MAX_SUPPORT_BONUS, roundedSupportContribution);

  if (roundedSupportContribution > MAX_SUPPORT_BONUS) {
    diagnostics.push(createDiagnostic(
      SHOOTING_SUPPORT_REASON_CODES.SUPPORT_CAP_APPLIED,
      `Combined-shot support is capped at +${MAX_SUPPORT_BONUS}.`,
      {
        requestedSupportBonus: roundedSupportContribution,
        cappedSupportBonus: supportBonus,
      },
    ));
  }

  const sourceOpenParticipants = [
    {
      unitId: mainShooterUnitId,
      sourceStatus: getParticipantSourceStatus(mainShooter, mainResolution.profile),
    },
    ...supportingEntries.map((entry) => ({
      unitId: entry.unitId,
      sourceStatus: entry.sourceStatus,
    })),
  ].filter((entry) => entry.sourceStatus === SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK);

  if (sourceOpenParticipants.length > 0) {
    diagnostics.push(createDiagnostic(
      SHOOTING_SUPPORT_REASON_CODES.SUPPORT_FAMILY_DEFERRED,
      'This combined-shot support group includes source-open support families and stays diagnostic-only for now.',
      {
        unitIds: sourceOpenParticipants.map((entry) => entry.unitId),
      },
    ));
  }

  const targetUnitId = getParticipantId(targetUnit, 'target-unit');

  return {
    status: sourceOpenParticipants.length > 0
      ? SHOOTING_SUPPORT_STATUSES.SOURCE_OPEN
      : SHOOTING_SUPPORT_STATUSES.READY,
    mainShooterUnitId,
    mainShooterProfileId: mainResolution.profile.id,
    targetUnitId,
    supportingUnitIds: supportingEntries.map((entry) => entry.unitId),
    supportBonus,
    supportContributionTotal,
    roundedSupportContribution,
    fullSupportCount,
    lightTroopSupportCount,
    diagnostics,
    sourceStatus: sourceOpenParticipants.length > 0
      ? SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
      : SHOOTING_SOURCE_STATUSES.VERIFIED,
    declarationSnapshot: cloneSerializable({
      mainShooterUnitId,
      mainShooterProfileId: mainResolution.profile.id,
      targetUnitId,
      supportingUnitIds: supportingEntries.map((entry) => entry.unitId),
      supportBonus,
      supportContributionTotal,
      roundedSupportContribution,
      fullSupportCount,
      lightTroopSupportCount,
    }),
  };
}