import {
  SHOOTING_PROFILE_IDS,
  getShootingProfile,
} from '../engine/shooting/index.js';

export { SHOOTING_PROFILE_IDS };

export const UNIT_PROFILE_IDS = {
  COMMANDER: 'commander',
  LIGHT_INFANTRY: 'light-infantry',
  LIGHT_INFANTRY_JAVELIN: 'light-infantry-javelin',
  MEDIUM_INFANTRY: 'medium-infantry',
  MEDIUM_INFANTRY_SWORDSMEN: 'medium-infantry-swordsmen',
  HEAVY_INFANTRY: 'heavy-infantry',
  HEAVY_INFANTRY_SPEARMEN: 'heavy-infantry-spearmen',
  CAVALRY: 'cavalry',
  MEDIUM_CAVALRY_IMPETUOUS: 'medium-cavalry-impetuous',
  HEAVY_CAVALRY_IMPACT: 'heavy-cavalry-impact',
  CAVALRY_BOW: 'cavalry-bow',
  PIKE: 'pike',
  ELEPHANT: 'elephant',
};

const P22_UNIT_CHARACTERISTICS_SOURCE_REF = 'docs/source/rules-v2-examples/rv2-p22-unit-characteristics-tables-a.png';

const DEFAULT_COHESION_BY_PROFILE_ID = deepFreeze({
  [UNIT_PROFILE_IDS.LIGHT_INFANTRY]: 2,
  [UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN]: 3,
  [UNIT_PROFILE_IDS.MEDIUM_INFANTRY]: 3,
  [UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN]: 3,
  [UNIT_PROFILE_IDS.HEAVY_INFANTRY]: 4,
  [UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN]: 4,
  [UNIT_PROFILE_IDS.CAVALRY]: 3,
  [UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS]: 3,
  [UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT]: 3,
  [UNIT_PROFILE_IDS.CAVALRY_BOW]: 2,
  [UNIT_PROFILE_IDS.PIKE]: 4,
  [UNIT_PROFILE_IDS.ELEPHANT]: 3,
});

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
    defaultCohesion: Number.isFinite(profile.defaultCohesion) ? Number(profile.defaultCohesion) : null,
    defaultChargeReactionCapability: profile.defaultChargeReactionCapability
      ? { ...profile.defaultChargeReactionCapability }
      : null,
  });
}

export const UNIT_PROFILES = deepFreeze({
  [UNIT_PROFILE_IDS.COMMANDER]: createUnitProfile({
    id: UNIT_PROFILE_IDS.COMMANDER,
    label: 'Commander',
    troopFamily: 'general',
    baseProfileId: BASE_PROFILE_IDS.FOOT_FORMED,
    movementProfileId: MOVEMENT_PROFILE_IDS.MEDIUM_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.MEDIUM_INFANTRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.MEDIUM_INFANTRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.MEDIUM_INFANTRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.COMMANDER,
    defaultAbilities: [],
    defaultCohesion: null,
    keywords: ['general', 'commander', 'command-stand'],
    sourceRefs: ['docs/rules/command.md', 'docs/rules/open-verification.md'],
    defaultChargeReactionCapability: {
      family: 'medium-infantry',
      inOpenTerrain: true,
      chargeWeight: 'heavy',
    },
    verificationStatus: 'needs-source-check',
  }),
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
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.LIGHT_INFANTRY],
    keywords: ['foot', 'light-infantry', 'evade-capable'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md', 'docs/rules/shooting.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'light-infantry',
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
  }),
  [UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN]: createUnitProfile({
    id: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
    label: 'Light Infantry Javelin',
    troopFamily: 'light-infantry-javelin',
    baseProfileId: BASE_PROFILE_IDS.FOOT_LIGHT,
    movementProfileId: MOVEMENT_PROFILE_IDS.LIGHT_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.LIGHT_INFANTRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.LIGHT_INFANTRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    combatProfileId: COMBAT_PROFILE_IDS.LIGHT_INFANTRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.LIGHT_FOOT,
    defaultAbilities: ['light-troops', 'javelin'],
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN],
    keywords: ['foot', 'light-infantry', 'javelin', 'missile', 'evade-capable'],
    sourceRefs: ['docs/rules/melee.md', 'docs/rules/shooting.md', 'docs/rules/units-and-bases.md', 'docs/rules/open-verification.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
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
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.MEDIUM_INFANTRY],
    keywords: ['foot', 'formed-foot', 'control-anchor'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md', 'docs/rules/units-and-bases.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'medium-infantry',
      inOpenTerrain: true,
    },
    verificationStatus: 'provisional-anchor',
  }),
  [UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN]: createUnitProfile({
    id: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
    label: 'Medium Infantry Swordsmen',
    troopFamily: 'medium-infantry-swordsmen',
    baseProfileId: BASE_PROFILE_IDS.FOOT_FORMED,
    movementProfileId: MOVEMENT_PROFILE_IDS.MEDIUM_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.MEDIUM_INFANTRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.MEDIUM_INFANTRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.MEDIUM_INFANTRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.MEDIUM_FOOT,
    defaultAbilities: ['swordsmen'],
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN],
    keywords: ['foot', 'formed-foot', 'medium-infantry', 'swordsmen'],
    sourceRefs: ['docs/rules/melee.md', 'docs/rules/units-and-bases.md', 'docs/rules/open-verification.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'medium-infantry',
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
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
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.HEAVY_INFANTRY],
    keywords: ['foot', 'heavy-infantry', 'control-anchor'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md', 'docs/rules/units-and-bases.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'heavy-infantry',
      inOpenTerrain: true,
      chargeWeight: 'heavy',
    },
    verificationStatus: 'provisional-anchor',
  }),
  [UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN]: createUnitProfile({
    id: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    label: 'Heavy Infantry Spearmen',
    troopFamily: 'heavy-infantry-spearmen',
    baseProfileId: BASE_PROFILE_IDS.FOOT_FORMED,
    movementProfileId: MOVEMENT_PROFILE_IDS.HEAVY_FOOT,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.HEAVY_INFANTRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.HEAVY_INFANTRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.HEAVY_INFANTRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.HEAVY_FOOT,
    defaultAbilities: ['spearmen'],
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN],
    keywords: ['foot', 'formed-foot', 'heavy-infantry', 'spearmen'],
    sourceRefs: ['docs/rules/melee.md', 'docs/rules/units-and-bases.md', 'docs/rules/open-verification.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'heavy-infantry',
      inOpenTerrain: true,
      chargeWeight: 'heavy',
    },
    verificationStatus: 'needs-source-check',
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
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.CAVALRY],
    keywords: ['mounted', 'cavalry', 'evade-capable'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/movement.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'cavalry',
      hasImpact: false,
      hasImpetuous: false,
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
  }),
  [UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS]: createUnitProfile({
    id: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
    label: 'Medium Cavalry Impetuous',
    troopFamily: 'medium-cavalry-impetuous',
    baseProfileId: BASE_PROFILE_IDS.MOUNTED,
    movementProfileId: MOVEMENT_PROFILE_IDS.MOUNTED,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.CAVALRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.CAVALRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.CAVALRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.CAVALRY,
    defaultAbilities: ['impetuous'],
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS],
    keywords: ['mounted', 'cavalry', 'medium-cavalry', 'impetuous', 'evade-capable'],
    sourceRefs: ['docs/rules/melee.md', 'docs/rules/charge.md', 'docs/rules/open-verification.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'cavalry',
      hasImpact: false,
      hasImpetuous: true,
      inOpenTerrain: true,
    },
    verificationStatus: 'needs-source-check',
  }),
  [UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT]: createUnitProfile({
    id: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
    label: 'Heavy Cavalry Impact',
    troopFamily: 'heavy-cavalry-impact',
    baseProfileId: BASE_PROFILE_IDS.MOUNTED,
    movementProfileId: MOVEMENT_PROFILE_IDS.MOUNTED,
    chargeReactionCapabilityId: CHARGE_REACTION_CAPABILITY_IDS.CAVALRY_DEFAULT,
    evadeProfileId: EVADE_PROFILE_IDS.CAVALRY_DEFAULT,
    shootingProfileId: SHOOTING_PROFILE_IDS.NONE,
    combatProfileId: COMBAT_PROFILE_IDS.CAVALRY_DEFAULT,
    visualProfileId: VISUAL_PROFILE_IDS.CAVALRY,
    defaultAbilities: ['impact'],
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT],
    keywords: ['mounted', 'cavalry', 'heavy-cavalry', 'impact', 'evade-capable'],
    sourceRefs: ['docs/rules/melee.md', 'docs/rules/charge.md', 'docs/rules/open-verification.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
    defaultChargeReactionCapability: {
      family: 'cavalry',
      hasImpact: true,
      hasImpetuous: false,
      inOpenTerrain: true,
      chargeWeight: 'heavy',
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
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.CAVALRY_BOW],
    keywords: ['mounted', 'cavalry-bow', 'evade-capable', 'missile'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/shooting.md', 'docs/source/Ancient_Period.md', 'docs/source/Classic_Period.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
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
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.PIKE],
    keywords: ['foot', 'pike', 'conformation-anchor'],
    sourceRefs: ['docs/rules/movement.md', 'docs/rules/units-and-bases.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
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
    defaultCohesion: DEFAULT_COHESION_BY_PROFILE_ID[UNIT_PROFILE_IDS.ELEPHANT],
    keywords: ['elephant', 'special-target-anchor'],
    sourceRefs: ['docs/rules/charge.md', 'docs/rules/units-and-bases.md', P22_UNIT_CHARACTERISTICS_SOURCE_REF],
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

export function getMaxCohesionForProfile(profileId) {
  return Number.isFinite(DEFAULT_COHESION_BY_PROFILE_ID[profileId])
    ? DEFAULT_COHESION_BY_PROFILE_ID[profileId]
    : null;
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

export function getMaxCohesionForUnit(unit) {
  if (Number.isFinite(unit?.maxCohesion)) {
    return Number(unit.maxCohesion);
  }

  const profile = getUnitProfileForUnit(unit);
  return Number.isFinite(profile?.defaultCohesion)
    ? Number(profile.defaultCohesion)
    : null;
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