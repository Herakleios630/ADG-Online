export const SHOOTING_PROFILE_IDS = {
  NONE: 'sp-none',
  LIGHT_MISSILE_FOOT: 'sp-light-missile-foot',
  MOUNTED_BOW: 'sp-mounted-bow',
};

export const SHOOTING_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const SHOOTING_WEAPON_FAMILIES = {
  NONE: 'none',
  LIGHT_MISSILE_FOOT: 'light-missile-foot',
  MOUNTED_BOW: 'mounted-bow',
};

export const SHOOTING_EDGE_RULES = {
  NONE: 'none',
  FRONT_EDGE: 'front-edge',
};

export const SHOOTING_ZONE_KINDS = {
  NONE: 'none',
  NORMAL_FRONT_RECTANGLE: 'normal-front-rectangle',
  DEFERRED_SPECIAL: 'deferred-special',
};

export const SHOOTING_RESOLUTION_APPLICATION_STATUSES = {
  NONE: 'none',
  PENDING_SIMULTANEOUS_GROUP: 'pending-simultaneous-group',
  APPLIED: 'applied',
};

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function getValidatedD6Roll(dieRoll, label) {
  if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 6) {
    throw new Error(`${label} requires a D6 roll from 1 to 6.`);
  }

  return dieRoll;
}

function getValidatedCohesionLoss(cohesionLoss) {
  if (!Number.isInteger(cohesionLoss) || cohesionLoss < 0 || cohesionLoss > 1) {
    throw new Error('Shooting cohesion loss must be 0 or 1.');
  }

  return cohesionLoss;
}

function createShootingProfile(profile) {
  return Object.freeze({
    id: profile.id,
    label: profile.label,
    canShoot: Boolean(profile.canShoot),
    weaponFamily: profile.weaponFamily ?? SHOOTING_WEAPON_FAMILIES.NONE,
    rangeUd: Number.isFinite(profile.rangeUd) ? profile.rangeUd : null,
    shootingEdgeRule: profile.shootingEdgeRule ?? SHOOTING_EDGE_RULES.NONE,
    shootingZoneKind: profile.shootingZoneKind ?? SHOOTING_ZONE_KINDS.NONE,
    supportEligible: Boolean(profile.supportEligible),
    supportCountsAsLightTroops: Boolean(profile.supportCountsAsLightTroops),
    specialZoneStatus: profile.specialZoneStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
    sourceStatus: profile.sourceStatus ?? SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    sourceRefs: Object.freeze([...(profile.sourceRefs ?? [])]),
    deferredRuleIds: Object.freeze([...(profile.deferredRuleIds ?? [])]),
  });
}

export const SHOOTING_PROFILES = Object.freeze({
  [SHOOTING_PROFILE_IDS.NONE]: createShootingProfile({
    id: SHOOTING_PROFILE_IDS.NONE,
    label: 'No Shooting',
    canShoot: false,
    weaponFamily: SHOOTING_WEAPON_FAMILIES.NONE,
    rangeUd: null,
    shootingEdgeRule: SHOOTING_EDGE_RULES.NONE,
    shootingZoneKind: SHOOTING_ZONE_KINDS.NONE,
    supportEligible: false,
    supportCountsAsLightTroops: false,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    sourceRefs: ['P8_todo.md', 'docs/rules/shooting.md'],
  }),
  [SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT]: createShootingProfile({
    id: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    label: 'Light Missile Foot',
    canShoot: true,
    weaponFamily: SHOOTING_WEAPON_FAMILIES.LIGHT_MISSILE_FOOT,
    rangeUd: 2,
    shootingEdgeRule: SHOOTING_EDGE_RULES.FRONT_EDGE,
    shootingZoneKind: SHOOTING_ZONE_KINDS.NORMAL_FRONT_RECTANGLE,
    supportEligible: true,
    supportCountsAsLightTroops: true,
    specialZoneStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    sourceRefs: [
      'docs/source/Rules_v2.md#rv2.shooting-core',
      'docs/rules/shooting.md#p8-00-first-implementation-boundary',
      'rules-v2-examples/rv2-p56-shooting-ranges-table-a.png',
    ],
    deferredRuleIds: ['javelin-range-1', 'incendiary-light-infantry', 'ordered-modifier-stack'],
  }),
  [SHOOTING_PROFILE_IDS.MOUNTED_BOW]: createShootingProfile({
    id: SHOOTING_PROFILE_IDS.MOUNTED_BOW,
    label: 'Mounted Bow',
    canShoot: true,
    weaponFamily: SHOOTING_WEAPON_FAMILIES.MOUNTED_BOW,
    rangeUd: 2,
    shootingEdgeRule: SHOOTING_EDGE_RULES.FRONT_EDGE,
    shootingZoneKind: SHOOTING_ZONE_KINDS.NORMAL_FRONT_RECTANGLE,
    supportEligible: true,
    supportCountsAsLightTroops: false,
    specialZoneStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    sourceRefs: [
      'docs/source/Rules_v2.md#rv2.shooting-core',
      'docs/rules/shooting.md#p8-00-first-implementation-boundary',
      'rules-v2-examples/rv2-p56-shooting-ranges-table-a.png',
    ],
    deferredRuleIds: ['light-cavalry-360-zone', 'mounted-crossbow-firearm-taxonomy', 'ordered-modifier-stack'],
  }),
});

export function createShootingProfileSnapshot(profile) {
  return cloneSerializable(profile);
}

export function createShootingRollClaim(overrides = {}) {
  return {
    reason: overrides.reason ?? null,
    actingPlayerId: overrides.actingPlayerId ?? null,
    shooterUnitId: overrides.shooterUnitId ?? null,
    targetUnitId: overrides.targetUnitId ?? null,
    phase: overrides.phase ?? null,
    declarationSnapshot: cloneSerializable(overrides.declarationSnapshot ?? null),
    actionLogToken: overrides.actionLogToken ?? null,
    simultaneousGroupId: overrides.simultaneousGroupId ?? null,
  };
}

export function createShootingRollResult(overrides = {}) {
  const shooterDieRoll = getValidatedD6Roll(overrides.shooterDieRoll, 'Shooting shooter roll resolution');
  const targetDieRoll = getValidatedD6Roll(overrides.targetDieRoll, 'Shooting target roll resolution');
  const shooterModifierTotal = Number.isFinite(overrides.shooterModifierTotal) ? overrides.shooterModifierTotal : 0;
  const targetProtectionValue = Number.isFinite(overrides.targetProtectionValue) ? overrides.targetProtectionValue : 0;
  const shooterTotal = Number.isFinite(overrides.shooterTotal)
    ? overrides.shooterTotal
    : shooterDieRoll + shooterModifierTotal;
  const targetTotal = Number.isFinite(overrides.targetTotal)
    ? overrides.targetTotal
    : targetDieRoll + targetProtectionValue;
  const cohesionLoss = overrides.cohesionLoss == null
    ? (shooterTotal > targetTotal ? 1 : 0)
    : getValidatedCohesionLoss(overrides.cohesionLoss);

  return {
    claim: cloneSerializable(overrides.claim ?? null),
    shooterDieRoll,
    targetDieRoll,
    shooterModifierTotal,
    targetProtectionValue,
    shooterTotal,
    targetTotal,
    cohesionLoss,
    simultaneousGroupId: overrides.simultaneousGroupId ?? overrides.claim?.simultaneousGroupId ?? null,
    applyAfterResolutionGroup: overrides.applyAfterResolutionGroup !== false,
    sourceStatus: overrides.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
  };
}

export function createShotResolutionRecord(overrides = {}) {
  const claim = cloneSerializable(overrides.claim ?? null);
  const result = cloneSerializable(overrides.result ?? null);

  return {
    claim,
    result,
    simultaneousGroupId: overrides.simultaneousGroupId ?? result?.simultaneousGroupId ?? claim?.simultaneousGroupId ?? null,
    applyAfterResolutionGroup: overrides.applyAfterResolutionGroup ?? (result?.applyAfterResolutionGroup !== false),
    applicationStatus: overrides.applicationStatus ?? SHOOTING_RESOLUTION_APPLICATION_STATUSES.PENDING_SIMULTANEOUS_GROUP,
    sourceStatus: overrides.sourceStatus ?? result?.sourceStatus ?? SHOOTING_SOURCE_STATUSES.VERIFIED,
  };
}

export function getShootingProfile(shootingProfileId) {
  if (typeof shootingProfileId !== 'string' || shootingProfileId.trim().length === 0) {
    throw new Error('Shooting profile id is required.');
  }

  const normalizedShootingProfileId = shootingProfileId.trim();
  const profile = SHOOTING_PROFILES[normalizedShootingProfileId];

  if (!profile) {
    throw new Error(`Unknown shooting profile id '${normalizedShootingProfileId}'.`);
  }

  return profile;
}

export function getAllShootingProfiles() {
  return Object.values(SHOOTING_PROFILES);
}