import {
  SHOOTING_PROFILE_IDS,
  getShootingProfile,
} from '../engine/shooting/index.js';

export { SHOOTING_PROFILE_IDS };

export const UNIT_PROFILE_IDS = {
  LIGHT_INFANTRY: 'light-infantry',
  MEDIUM_INFANTRY: 'medium-infantry',
  HEAVY_INFANTRY: 'heavy-infantry',
  CAVALRY: 'cavalry',
  CAVALRY_BOW: 'cavalry-bow',
  PIKE: 'pike',
  ELEPHANT: 'elephant',
};

export const BASE_PROFILE_IDS = {
  FOOT_LIGHT: 'bp-foot-light',
  FOOT_FORMED: 'bp-foot-formed',
  FOOT_DEEP: 'bp-foot-deep',
  MOUNTED: 'bp-mounted',
  ELEPHANT: 'bp-elephant',
};

export const MOVEMENT_PROFILE_IDS = {
  LIGHT_FOOT: 'mp-light-foot',
  MEDIUM_FOOT: 'mp-medium-foot',
  HEAVY_FOOT: 'mp-heavy-foot',
  MOUNTED: 'mp-mounted',
  MOUNTED_PROVISIONAL: 'mp-mounted-provisional',
  PIKE_FOOT: 'mp-pike-foot',
  ELEPHANT: 'mp-elephant',
};

export const CHARGE_REACTION_CAPABILITY_IDS = {
  LIGHT_INFANTRY_DEFAULT: 'crc-light-infantry-default',
  MEDIUM_INFANTRY_DEFAULT: 'crc-medium-infantry-default',
  HEAVY_INFANTRY_DEFAULT: 'crc-heavy-infantry-default',
  CAVALRY_DEFAULT: 'crc-cavalry-default',
  CAVALRY_BOW_DEFAULT: 'crc-cavalry-bow-default',
  PIKE_DEFAULT: 'crc-pike-default',
  ELEPHANT_DEFAULT: 'crc-elephant-default',
};

export const EVADE_PROFILE_IDS = {
  LIGHT_INFANTRY_DEFAULT: 'ep-light-infantry-default',
  MEDIUM_INFANTRY_DEFAULT: 'ep-medium-infantry-default',
  HEAVY_INFANTRY_DEFAULT: 'ep-heavy-infantry-default',
  CAVALRY_DEFAULT: 'ep-cavalry-default',
  CAVALRY_BOW_DEFAULT: 'ep-cavalry-bow-default',
  PIKE_DEFAULT: 'ep-pike-default',
  ELEPHANT_DEFAULT: 'ep-elephant-default',
};

export const COMBAT_PROFILE_IDS = {
  LIGHT_INFANTRY_DEFAULT: 'cp-light-infantry-default',
  MEDIUM_INFANTRY_DEFAULT: 'cp-medium-infantry-default',
  HEAVY_INFANTRY_DEFAULT: 'cp-heavy-infantry-default',
  CAVALRY_DEFAULT: 'cp-cavalry-default',
  CAVALRY_BOW_DEFAULT: 'cp-cavalry-bow-default',
  PIKE_DEFAULT: 'cp-pike-default',
  ELEPHANT_DEFAULT: 'cp-elephant-default',
};

export const VISUAL_PROFILE_IDS = {
  LIGHT_FOOT: 'vp-light-foot',
  MEDIUM_FOOT: 'vp-medium-foot',
  HEAVY_FOOT: 'vp-heavy-foot',
  CAVALRY: 'vp-cavalry',
  CAVALRY_BOW: 'vp-cavalry-bow',
  PIKE: 'vp-pike',
  ELEPHANT: 'vp-elephant',
  COMMANDER: 'vp-commander',
};

export const BASE_PROFILES = deepFreeze({
  [BASE_PROFILE_IDS.FOOT_LIGHT]: {
    id: BASE_PROFILE_IDS.FOOT_LIGHT,
    label: 'Light Foot Fixture Base',
    widthUd: 1,
    depthUd: 0.5,
    shape: 'square',
    sourceStatus: 'needs-source-check',
    sourceRefs: ['docs/rules/units-and-bases.md', 'docs/rules/open-verification.md'],
  },
  [BASE_PROFILE_IDS.FOOT_FORMED]: {
    id: BASE_PROFILE_IDS.FOOT_FORMED,
    label: 'Formed Foot Fixture Base',
    widthUd: 1,
    depthUd: 1,
    shape: 'square',
    sourceStatus: 'needs-source-check',
    sourceRefs: ['docs/rules/units-and-bases.md', 'docs/rules/open-verification.md'],
  },
  [BASE_PROFILE_IDS.FOOT_DEEP]: {
    id: BASE_PROFILE_IDS.FOOT_DEEP,
    label: 'Deep Foot Fixture Base',
    widthUd: 1,
    depthUd: 1,
    shape: 'square',
    sourceStatus: 'needs-source-check',
    sourceRefs: ['docs/rules/units-and-bases.md', 'docs/rules/open-verification.md'],
  },
  [BASE_PROFILE_IDS.MOUNTED]: {
    id: BASE_PROFILE_IDS.MOUNTED,
    label: 'Mounted Fixture Base',
    widthUd: 1,
    depthUd: 0.75,
    shape: 'rectangle',
    sourceStatus: 'needs-source-check',
    sourceRefs: ['docs/rules/units-and-bases.md', 'docs/rules/open-verification.md'],
  },
  [BASE_PROFILE_IDS.ELEPHANT]: {
    id: BASE_PROFILE_IDS.ELEPHANT,
    label: 'Elephant Fixture Base',
    widthUd: 1,
    depthUd: 1,
    shape: 'square',
    sourceStatus: 'needs-source-check',
    sourceRefs: ['docs/rules/units-and-bases.md', 'docs/rules/open-verification.md'],
  },
});

export const VISUAL_PROFILES = deepFreeze({
  [VISUAL_PROFILE_IDS.LIGHT_FOOT]: {
    id: VISUAL_PROFILE_IDS.LIGHT_FOOT,
    renderFamily: 'foot-light',
    baseSilhouette: 'loose-foot',
    baseDepthHint: 'half',
    figureSilhouette: 'skirmishers',
    formationHint: 'open-order-foot',
    figureCountHint: 'two-figures',
    figureCount: 2,
    figureFiles: 2,
    figureRanks: 1,
    figureMarkerShape: 'circle',
    figureShapeHint: 'light-foot',
    facingMarker: 'front-notch',
    accentSlot: 'base-rim',
    ownerColorTreatment: 'rim-and-badge',
  },
  [VISUAL_PROFILE_IDS.MEDIUM_FOOT]: {
    id: VISUAL_PROFILE_IDS.MEDIUM_FOOT,
    renderFamily: 'foot-medium',
    baseSilhouette: 'formed-foot',
    baseDepthHint: 'full',
    figureSilhouette: 'ranked-infantry',
    formationHint: 'medium-formed-foot',
    figureCountHint: 'six-figures',
    figureCount: 6,
    figureFiles: 3,
    figureRanks: 2,
    figureMarkerShape: 'circle',
    figureShapeHint: 'ordered-foot',
    facingMarker: 'front-notch',
    accentSlot: 'base-rim',
    ownerColorTreatment: 'rim-and-badge',
  },
  [VISUAL_PROFILE_IDS.HEAVY_FOOT]: {
    id: VISUAL_PROFILE_IDS.HEAVY_FOOT,
    renderFamily: 'foot-heavy',
    baseSilhouette: 'formed-foot',
    baseDepthHint: 'three-quarter',
    figureSilhouette: 'dense-infantry',
    formationHint: 'heavy-formed-foot',
    figureCountHint: 'eight-figures',
    figureCount: 8,
    figureFiles: 4,
    figureRanks: 2,
    figureMarkerShape: 'circle',
    figureShapeHint: 'heavy-foot',
    facingMarker: 'front-notch',
    accentSlot: 'base-rim',
    ownerColorTreatment: 'rim-and-badge',
  },
  [VISUAL_PROFILE_IDS.CAVALRY]: {
    id: VISUAL_PROFILE_IDS.CAVALRY,
    renderFamily: 'mounted',
    baseSilhouette: 'mounted',
    baseDepthHint: 'three-quarter',
    figureSilhouette: 'horsemen',
    formationHint: 'mounted-line',
    figureCountHint: 'three-riders',
    figureCount: 3,
    figureFiles: 3,
    figureRanks: 1,
    figureMarkerShape: 'oval',
    figureShapeHint: 'mounted',
    facingMarker: 'front-wedge',
    accentSlot: 'saddle-cloth',
    ownerColorTreatment: 'rim-and-cloth',
  },
  [VISUAL_PROFILE_IDS.CAVALRY_BOW]: {
    id: VISUAL_PROFILE_IDS.CAVALRY_BOW,
    renderFamily: 'mounted-bow',
    baseSilhouette: 'mounted',
    baseDepthHint: 'three-quarter',
    figureSilhouette: 'horse-archers',
    formationHint: 'mounted-missile-line',
    figureCountHint: 'two-riders',
    figureCount: 2,
    figureFiles: 2,
    figureRanks: 1,
    figureMarkerShape: 'oval',
    figureShapeHint: 'mounted-bow',
    facingMarker: 'front-wedge',
    accentSlot: 'saddle-cloth',
    ownerColorTreatment: 'rim-and-cloth',
  },
  [VISUAL_PROFILE_IDS.PIKE]: {
    id: VISUAL_PROFILE_IDS.PIKE,
    renderFamily: 'pike-block',
    baseSilhouette: 'deep-foot',
    baseDepthHint: 'deep',
    figureSilhouette: 'pike-block',
    formationHint: 'deep-formed-foot',
    figureCountHint: 'twelve-figures',
    figureCount: 12,
    figureFiles: 4,
    figureRanks: 3,
    figureMarkerShape: 'circle',
    figureShapeHint: 'pike-front',
    facingMarker: 'front-notch',
    accentSlot: 'base-rim',
    ownerColorTreatment: 'rim-and-badge',
  },
  [VISUAL_PROFILE_IDS.ELEPHANT]: {
    id: VISUAL_PROFILE_IDS.ELEPHANT,
    renderFamily: 'elephant',
    baseSilhouette: 'elephant',
    baseDepthHint: 'full',
    figureSilhouette: 'elephant',
    formationHint: 'single-large-target',
    figureCountHint: 'single',
    figureCount: 1,
    figureFiles: 1,
    figureRanks: 1,
    figureMarkerShape: 'circle',
    figureShapeHint: 'elephant-mass',
    facingMarker: 'front-cap',
    accentSlot: 'howdah-cloth',
    ownerColorTreatment: 'rim-and-cloth',
  },
  [VISUAL_PROFILE_IDS.COMMANDER]: {
    id: VISUAL_PROFILE_IDS.COMMANDER,
    renderFamily: 'commander',
    baseSilhouette: 'commander',
    baseDepthHint: 'full',
    figureSilhouette: 'leader',
    formationHint: 'command-stand',
    figureCountHint: 'single',
    figureCount: 1,
    figureFiles: 1,
    figureRanks: 1,
    figureMarkerShape: 'circle',
    figureShapeHint: 'leader-stand',
    facingMarker: 'front-chevron',
    accentSlot: 'command-ring',
    ownerColorTreatment: 'ring-and-badge',
  },
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return value;
}

function createUnitProfile(profile) {
  return deepFreeze({
    ...profile,
    defaultAbilities: [...(profile.defaultAbilities ?? [])],
    keywords: [...(profile.keywords ?? [])],
    sourceRefs: [...(profile.sourceRefs ?? [])],
    defaultChargeReactionCapability: profile.defaultChargeReactionCapability
      ? { ...profile.defaultChargeReactionCapability }
      : null,
  });
}

export const UNIT_PROFILES = deepFreeze({
  [UNIT_PROFILE_IDS.LIGHT_INFANTRY]: createUnitProfile({
    id: UNIT_PROFILE_IDS.LIGHT_INFANTRY,
    label: 'Light Infantry',
    troopFamily: 'light-infantry',
    baseProfileId: BASE_PROFILE_IDS.FOOT_LIGHT,
    movementProfileId: MOVEMENT_PROFILE_IDS.LIGHT_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.LIGHT_INFANTRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.LIGHT_INFANTRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    combatProfileId: COMBAT_PROFILE_IDS.LIGHT_INFANTRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.LIGHT_FOOT,
    defaultAbilities: ['light-troops'],
    keywords: ['foot', 'light-infantry', 'evade-capable'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md', 'docs/rules/shooting.md'],
    defaultChargeReactionCapability: {
      family: 'light-infantry',
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
  }),
  [UNIT_PROFILE_IDS.MEDIUM_INFANTRY]: createUnitProfile({
    id: UNIT_PROFILE_IDS.MEDIUM_INFANTRY,
    label: 'Medium Infantry',
    troopFamily: 'medium-infantry',
    baseProfileId: BASE_PROFILE_IDS.FOOT_FORMED,
    movementProfileId: MOVEMENT_PROFILE_IDS.MEDIUM_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.MEDIUM_INFANTRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.MEDIUM_INFANTRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.MEDIUM_INFANTRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.MEDIUM_FOOT,
    defaultAbilities: [],
    keywords: ['foot', 'formed-foot', 'control-anchor'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md', 'docs/rules/units-and-bases.md'],
    defaultChargeReactionCapability: {
      family: 'medium-infantry',
      inOpenTerrain: true,
    },
    verificationStatus: 'provisional-anchor',
  }),
  [UNIT_PROFILE_IDS.HEAVY_INFANTRY]: createUnitProfile({
    id: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
    label: 'Heavy Infantry',
    troopFamily: 'heavy-infantry',
    baseProfileId: BASE_PROFILE_IDS.FOOT_FORMED,
    movementProfileId: MOVEMENT_PROFILE_IDS.HEAVY_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.HEAVY_INFANTRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.HEAVY_INFANTRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.HEAVY_INFANTRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.HEAVY_FOOT,
    defaultAbilities: ['heavy-charge-anchor'],
    keywords: ['foot', 'heavy-infantry', 'control-anchor'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md', 'docs/rules/units-and-bases.md'],
    defaultChargeReactionCapability: {
      family: 'heavy-infantry',
      inOpenTerrain: true,
      chargeWeight: 'heavy',
    },
    verificationStatus: 'provisional-anchor',
  }),
  [UNIT_PROFILE_IDS.CAVALRY]: createUnitProfile({
    id: UNIT_PROFILE_IDS.CAVALRY,
    label: 'Cavalry',
    troopFamily: 'cavalry',
    baseProfileId: BASE_PROFILE_IDS.MOUNTED,
    movementProfileId: MOVEMENT_PROFILE_IDS.MOUNTED,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.CAVALRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.CAVALRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.CAVALRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.CAVALRY,
    defaultAbilities: [],
    keywords: ['mounted', 'cavalry', 'evade-capable'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md'],
    defaultChargeReactionCapability: {
      family: 'cavalry',
      hasImpact: false,
      hasImpetuous: false,
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
  }),
  [UNIT_PROFILE_IDS.CAVALRY_BOW]: createUnitProfile({
    id: UNIT_PROFILE_IDS.CAVALRY_BOW,
    label: 'Cavalry Bow',
    troopFamily: 'cavalry-bow',
    baseProfileId: BASE_PROFILE_IDS.MOUNTED,
    movementProfileId: MOVEMENT_PROFILE_IDS.MOUNTED_PROVISIONAL,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.CAVALRY_BOW_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.CAVALRY_BOW_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.MOUNTED_BOW,
    combatProfileId: COMBAT_PROFILE_IDS.CAVALRY_BOW_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.CAVALRY_BOW,
    defaultAbilities: ['bow'],
    keywords: ['mounted', 'cavalry-bow', 'evade-capable', 'missile'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/shooting.md', 'docs/source/Ancient_Period.md', 'docs/source/Classic_Period.md'],
    defaultChargeReactionCapability: {
      family: 'cavalry',
      hasImpact: false,
      hasImpetuous: false,
      hasBow: true,
      inOpenTerrain: true,
    },
    verificationStatus: 'provisional-anchor',
  }),
  [UNIT_PROFILE_IDS.PIKE]: createUnitProfile({
    id: UNIT_PROFILE_IDS.PIKE,
    label: 'Pike',
    troopFamily: 'pike',
    baseProfileId: BASE_PROFILE_IDS.FOOT_DEEP,
    movementProfileId: MOVEMENT_PROFILE_IDS.PIKE_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.PIKE_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.PIKE_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.PIKE_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.PIKE,
    defaultAbilities: [],
    keywords: ['foot', 'pike', 'conformation-anchor'],
    sourceRefs: ['docs/rules/movement.md', 'docs/rules/units-and-bases.md'],
    defaultChargeReactionCapability: {
      family: 'pike',
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
  }),
  [UNIT_PROFILE_IDS.ELEPHANT]: createUnitProfile({
    id: UNIT_PROFILE_IDS.ELEPHANT,
    label: 'Elephant',
    troopFamily: 'elephant',
    baseProfileId: BASE_PROFILE_IDS.ELEPHANT,
    movementProfileId: MOVEMENT_PROFILE_IDS.ELEPHANT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.ELEPHANT_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.ELEPHANT_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.ELEPHANT_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.ELEPHANT,
    defaultAbilities: [],
    keywords: ['elephant', 'special-target-anchor'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/units-and-bases.md'],
    defaultChargeReactionCapability: {
      family: 'elephant',
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
  }),
});

function createProfileDerivedChargeReactionCapability(profile, unit = {}) {
  if (!profile?.defaultChargeReactionCapability || typeof profile.defaultChargeReactionCapability !== 'object') {
    throw new Error(`Unit profile '${profile?.id ?? 'unknown-profile'}' is missing defaultChargeReactionCapability.`);
  }

  const selectedAbilityIds = Array.isArray(unit.selectedAbilityIds) ? unit.selectedAbilityIds : [];
  const abilityIds = new Set([...(profile.defaultAbilities ?? []), ...selectedAbilityIds]);
  const capability = {
    family: profile.defaultChargeReactionCapability.family ?? null,
    hasImpact: false,
    hasImpetuous: false,
    hasBow: false,
    hasCrossbow: false,
    hasDoubleBow: false,
    hasDoubleCrossbow: false,
    inOpenTerrain: true,
    engagedInMelee: false,
    inMeleeSupport: false,
    providesOnlySimpleSupport: false,
    blockedEvade: null,
    wouldConformIntoLightTroops: false,
    wouldConformIntoElephants: false,
    wouldConformIntoScythedChariots: false,
    wouldSupportFriendlyAfterConformation: false,
    chargeWeight: null,
    ...profile.defaultChargeReactionCapability,
  };

  if (abilityIds.has('bow')) {
    capability.hasBow = true;
  }
  if (abilityIds.has('crossbow')) {
    capability.hasCrossbow = true;
  }
  if (abilityIds.has('double-bow')) {
    capability.hasDoubleBow = true;
  }
  if (abilityIds.has('double-crossbow')) {
    capability.hasDoubleCrossbow = true;
  }
  if (abilityIds.has('impact')) {
    capability.hasImpact = true;
  }
  if (abilityIds.has('impetuous')) {
    capability.hasImpetuous = true;
  }
  if (abilityIds.has('heavy-charge-anchor')) {
    capability.chargeWeight = 'heavy';
  }
  if (abilityIds.has('light-charge-anchor')) {
    capability.chargeWeight = 'light';
  }

  return capability;
}

export function getAllUnitProfiles() {
  return Object.values(UNIT_PROFILES);
}

export function getBaseProfile(baseProfileId) {
  if (typeof baseProfileId !== 'string' || baseProfileId.trim().length === 0) {
    throw new Error('Base profile id is required.');
  }

  const normalizedBaseProfileId = baseProfileId.trim();
  const baseProfile = BASE_PROFILES[normalizedBaseProfileId];

  if (!baseProfile) {
    throw new Error(`Unknown base profile id '${normalizedBaseProfileId}'.`);
  }

  return baseProfile;
}

export function getVisualProfile(visualProfileId) {
  if (typeof visualProfileId !== 'string' || visualProfileId.trim().length === 0) {
    throw new Error('Visual profile id is required.');
  }

  const normalizedVisualProfileId = visualProfileId.trim();
  const visualProfile = VISUAL_PROFILES[normalizedVisualProfileId];

  if (!visualProfile) {
    throw new Error(`Unknown visual profile id '${normalizedVisualProfileId}'.`);
  }

  return visualProfile;
}

export function getVisualProfileForUnit(unit) {
  if (!unit || typeof unit !== 'object') {
    throw new Error('Unit data is required to resolve a visual profile.');
  }

  const actualDepthUd = Number(unit.depthUd ?? NaN);
  if (typeof unit.visualProfileId === 'string' && unit.visualProfileId.trim().length > 0) {
    const visualProfile = getVisualProfile(unit.visualProfileId);
    if (visualProfile.baseDepthHint === 'half' && Number.isFinite(actualDepthUd) && actualDepthUd <= 0.5) {
      return {
        ...visualProfile,
        baseDepthHint: 'full',
      };
    }

    return visualProfile;
  }

  const visualProfile = getVisualProfile(getUnitProfileForUnit(unit).visualProfileId);
  if (visualProfile.baseDepthHint === 'half' && Number.isFinite(actualDepthUd) && actualDepthUd <= 0.5) {
    return {
      ...visualProfile,
      baseDepthHint: 'full',
    };
  }

  return visualProfile;
}

export function getDefaultFootprintForProfile(profileId) {
  const profile = getUnitProfile(profileId);
  const baseProfile = getBaseProfile(profile.baseProfileId);

  return {
    widthUd: baseProfile.widthUd,
    depthUd: baseProfile.depthUd,
    baseShape: baseProfile.shape,
  };
}

export function getUnitProfile(profileId) {
  if (typeof profileId !== 'string' || profileId.trim().length === 0) {
    throw new Error('Unit profile id is required.');
  }

  const normalizedProfileId = profileId.trim();
  const profile = UNIT_PROFILES[normalizedProfileId];

  if (!profile) {
    throw new Error(`Unknown unit profile id '${normalizedProfileId}'.`);
  }

  return profile;
}

export function getUnitProfileForUnit(unit) {
  if (!unit || typeof unit !== 'object') {
    throw new Error('Unit data is required to resolve a unit profile.');
  }

  if (typeof unit.profileId !== 'string' || unit.profileId.trim().length === 0) {
    const unitId = typeof unit.id === 'string' && unit.id.length > 0 ? unit.id : 'unknown-unit';
    throw new Error(`Unit '${unitId}' is missing profileId.`);
  }

  return getUnitProfile(unit.profileId);
}

export function getShootingProfileForUnit(unit) {
  if (!unit || typeof unit !== 'object') {
    throw new Error('Unit data is required to resolve a shooting profile.');
  }

  const explicitShootingProfileId = typeof unit.shootingProfileId === 'string' && unit.shootingProfileId.trim().length > 0
    ? unit.shootingProfileId.trim()
    : null;
  const profile = explicitShootingProfileId ? null : getUnitProfileForUnit(unit);

  return getShootingProfile(explicitShootingProfileId ?? profile.shootingProfileId);
}

export function getResolvedAbilityIdsForUnit(unit) {
  if (!unit || typeof unit !== 'object') {
    throw new Error('Unit data is required to resolve ability ids.');
  }

  const profile = getUnitProfileForUnit(unit);
  const selectedAbilityIds = Array.isArray(unit.selectedAbilityIds) ? unit.selectedAbilityIds : [];

  return [...new Set([...(profile.defaultAbilities ?? []), ...selectedAbilityIds])];
}

export function getChargeReactionCapabilityForUnit(unit) {
  if (!unit || typeof unit !== 'object') {
    throw new Error('Unit data is required to resolve charge reaction capability.');
  }

  if (unit.chargeReactionCapability != null) {
    return unit.chargeReactionCapability;
  }

  const profile = getUnitProfileForUnit(unit);
  return createProfileDerivedChargeReactionCapability(profile, unit);
}