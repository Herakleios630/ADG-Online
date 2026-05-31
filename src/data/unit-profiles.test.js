import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE_PROFILE_IDS,
  BASE_PROFILES,
  SHOOTING_PROFILE_IDS,
  UNIT_PROFILE_IDS,
  UNIT_PROFILES,
  VISUAL_PROFILES,
  getChargeReactionCapabilityForUnit,
  getAllUnitProfiles,
  getBaseProfile,
  getDefaultFootprintForProfile,
  getResolvedAbilityIdsForUnit,
  getShootingProfileForUnit,
  getUnitProfile,
  getUnitProfileForUnit,
  getVisualProfile,
  getVisualProfileForUnit,
} from './unit-profiles.js';

const REQUIRED_PROFILE_IDS = [
  UNIT_PROFILE_IDS.COMMANDER,
  UNIT_PROFILE_IDS.LIGHT_INFANTRY,
  UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
  UNIT_PROFILE_IDS.MEDIUM_INFANTRY,
  UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
  UNIT_PROFILE_IDS.HEAVY_INFANTRY,
  UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
  UNIT_PROFILE_IDS.CAVALRY,
  UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
  UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
  UNIT_PROFILE_IDS.CAVALRY_BOW,
  UNIT_PROFILE_IDS.PIKE,
  UNIT_PROFILE_IDS.ELEPHANT,
];

test('unit profiles expose the required UCD-01 representative ids and fields', () => {
  const profiles = getAllUnitProfiles();

  assert.equal(profiles.length, REQUIRED_PROFILE_IDS.length);

  for (const profileId of REQUIRED_PROFILE_IDS) {
    const profile = getUnitProfile(profileId);

    assert.equal(profile.id, profileId);
    assert.equal(typeof profile.label, 'string');
    assert.equal(typeof profile.troopFamily, 'string');
    assert.equal(typeof profile.baseProfileId, 'string');
    assert.equal(typeof profile.movementProfileId, 'string');
    assert.equal(typeof profile.chargeReactionCapabilityId, 'string');
    assert.equal(typeof profile.evadeProfileId, 'string');
    assert.equal(typeof profile.shootingProfileId, 'string');
    assert.equal(typeof profile.combatProfileId, 'string');
    assert.equal(typeof profile.visualProfileId, 'string');
    assert.ok(BASE_PROFILES[profile.baseProfileId]);
    assert.ok(VISUAL_PROFILES[profile.visualProfileId]);
    assert.equal(Array.isArray(profile.defaultAbilities), true);
    assert.equal(Array.isArray(profile.keywords), true);
    assert.equal(Array.isArray(profile.sourceRefs), true);
    assert.equal(profile.sourceRefs.length > 0, true);
    assert.equal(typeof profile.verificationStatus, 'string');
  }
});

test('unit profiles remain serializable plain data', () => {
  const profiles = getAllUnitProfiles();
  const serialized = JSON.parse(JSON.stringify(profiles));

  assert.deepEqual(serialized, profiles);
});

test('lookup by unit requires an explicit profile id', () => {
  const cavalryProfile = getUnitProfileForUnit({
    id: 'test-cavalry',
    profileId: UNIT_PROFILE_IDS.CAVALRY,
  });

  assert.equal(cavalryProfile.id, UNIT_PROFILE_IDS.CAVALRY);
  assert.equal(cavalryProfile.troopFamily, 'cavalry');

  assert.throws(
    () => getUnitProfileForUnit({ id: 'missing-profile' }),
    /missing profileId/,
  );
});

test('profile-backed charge reaction capability derives from profile defaults and selected abilities', () => {
  const cavalryCapability = getChargeReactionCapabilityForUnit({
    id: 'cavalry-unit',
    profileId: UNIT_PROFILE_IDS.CAVALRY,
  });
  assert.equal(cavalryCapability.family, 'cavalry');
  assert.equal(cavalryCapability.hasImpact, false);
  assert.equal(cavalryCapability.hasImpetuous, false);

  const cavalryBowCapability = getChargeReactionCapabilityForUnit({
    id: 'cavalry-bow-unit',
    profileId: UNIT_PROFILE_IDS.CAVALRY_BOW,
  });
  assert.equal(cavalryBowCapability.family, 'cavalry');
  assert.equal(cavalryBowCapability.hasBow, true);

  const impetuousCavalryCapability = getChargeReactionCapabilityForUnit({
    id: 'impetuous-cavalry-unit',
    profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
  });
  assert.equal(impetuousCavalryCapability.hasImpetuous, true);

  const impactCavalryCapability = getChargeReactionCapabilityForUnit({
    id: 'impact-cavalry-unit',
    profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
  });
  assert.equal(impactCavalryCapability.hasImpact, true);

  const selectedAbilityCapability = getChargeReactionCapabilityForUnit({
    id: 'selected-ability-unit',
    profileId: UNIT_PROFILE_IDS.CAVALRY,
    selectedAbilityIds: ['impact'],
  });
  assert.equal(selectedAbilityCapability.hasImpact, true);
});

test('explicit charge reaction capability override still wins over profile defaults', () => {
  const capability = getChargeReactionCapabilityForUnit({
    id: 'override-unit',
    profileId: UNIT_PROFILE_IDS.CAVALRY,
    chargeReactionCapability: {
      family: 'light-cavalry',
      hasImpact: true,
    },
  });

  assert.deepEqual(capability, {
    family: 'light-cavalry',
    hasImpact: true,
  });
});

test('resolved ability ids combine profile defaults with selected ability ids', () => {
  const lightInfantryAbilities = getResolvedAbilityIdsForUnit({
    id: 'light-foot',
    profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY,
  });
  assert.deepEqual(lightInfantryAbilities, ['light-troops']);

  const cavalryAbilities = getResolvedAbilityIdsForUnit({
    id: 'cavalry-bow-upgrade',
    profileId: UNIT_PROFILE_IDS.CAVALRY_BOW,
    selectedAbilityIds: ['impact'],
  });
  assert.deepEqual(cavalryAbilities, ['bow', 'impact']);

  const taxonomyAbilities = getResolvedAbilityIdsForUnit({
    id: 'taxonomy-impetuous',
    profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
  });
  assert.deepEqual(taxonomyAbilities, ['impetuous']);
});

test('shooting profile lookup is profile-backed for the P8-01 first subset', () => {
  const lightMissileProfile = getShootingProfileForUnit({
    id: 'light-foot-shooter',
    profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY,
  });
  assert.equal(lightMissileProfile.id, SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT);
  assert.equal(lightMissileProfile.canShoot, true);
  assert.equal(lightMissileProfile.rangeUd, 2);
  assert.equal(lightMissileProfile.supportCountsAsLightTroops, true);

  const mountedBowProfile = getShootingProfileForUnit({
    id: 'mounted-bow-shooter',
    profileId: UNIT_PROFILE_IDS.CAVALRY_BOW,
  });
  assert.equal(mountedBowProfile.id, SHOOTING_PROFILE_IDS.MOUNTED_BOW);
  assert.equal(mountedBowProfile.canShoot, true);
  assert.equal(mountedBowProfile.rangeUd, 2);
  assert.equal(mountedBowProfile.deferredRuleIds.includes('light-cavalry-360-zone'), true);

  const nonShooterProfile = getShootingProfileForUnit({
    id: 'formed-foot-non-shooter',
    profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
  });
  assert.equal(nonShooterProfile.id, SHOOTING_PROFILE_IDS.NONE);
  assert.equal(nonShooterProfile.canShoot, false);
});

test('explicit shooting profile overrides are validated through the shared shooting table', () => {
  const explicitProfile = getShootingProfileForUnit({
    id: 'explicit-shooter',
    profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
  });
  assert.equal(explicitProfile.id, SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT);

  assert.throws(
    () => getShootingProfileForUnit({
      id: 'unknown-shooter',
      profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY,
      shootingProfileId: 'sp-unknown',
    }),
    /Unknown shooting profile id 'sp-unknown'\./,
  );
});

test('unknown unit profile ids fail loudly instead of silently defaulting', () => {
  assert.throws(
    () => getUnitProfile('unknown-profile'),
    /Unknown unit profile id 'unknown-profile'\./,
  );

  assert.throws(
    () => getUnitProfile(''),
    /Unit profile id is required\./,
  );

  assert.throws(
    () => getChargeReactionCapabilityForUnit({ id: 'unknown-capability-unit', profileId: 'unknown-profile' }),
    /Unknown unit profile id 'unknown-profile'\./,
  );

  assert.throws(
    () => getResolvedAbilityIdsForUnit({ id: 'unknown-abilities-unit', profileId: 'unknown-profile' }),
    /Unknown unit profile id 'unknown-profile'\./,
  );
});

test('profile verification states preserve the UCD-00 caveats', () => {
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.COMMANDER].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.LIGHT_INFANTRY].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.MEDIUM_INFANTRY].verificationStatus, 'provisional-anchor');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.HEAVY_INFANTRY].verificationStatus, 'provisional-anchor');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.CAVALRY].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN].verificationStatus, 'needs-source-check');
  assert.equal(UNIT_PROFILES[UNIT_PROFILE_IDS.CAVALRY_BOW].verificationStatus, 'provisional-anchor');
});

test('base profiles expose fixture footprint defaults without closing source verification', () => {
  const mountedBase = getBaseProfile(BASE_PROFILE_IDS.MOUNTED);
  assert.equal(mountedBase.widthUd, 1);
  assert.equal(mountedBase.depthUd, 0.75);
  assert.equal(mountedBase.shape, 'rectangle');
  assert.equal(mountedBase.sourceStatus, 'needs-source-check');

  const lightFootFootprint = getDefaultFootprintForProfile(UNIT_PROFILE_IDS.LIGHT_INFANTRY);
  assert.deepEqual(lightFootFootprint, {
    widthUd: 1,
    depthUd: 0.5,
    baseShape: 'square',
  });

  assert.throws(
    () => getBaseProfile('unknown-base-profile'),
    /Unknown base profile id 'unknown-base-profile'\./,
  );
});

test('visual profiles are inert descriptors for later rendering work', () => {
  const cavalryBowVisual = getVisualProfile(UNIT_PROFILES[UNIT_PROFILE_IDS.CAVALRY_BOW].visualProfileId);
  assert.deepEqual(cavalryBowVisual, {
    id: 'vp-cavalry-bow',
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
  });

  const commanderVisual = getVisualProfile('vp-commander');
  assert.deepEqual(commanderVisual, {
    id: 'vp-commander',
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
  });

  assert.throws(
    () => getVisualProfile('unknown-visual-profile'),
    /Unknown visual profile id 'unknown-visual-profile'\./,
  );
});

test('visual profile lookup for a unit prefers explicit visualProfileId and otherwise falls back to profile data', () => {
  const cavalryBowVisual = getVisualProfileForUnit({
    id: 'cavalry-bow-unit',
    profileId: UNIT_PROFILE_IDS.CAVALRY_BOW,
  });
  assert.equal(cavalryBowVisual.id, 'vp-cavalry-bow');
  assert.equal(cavalryBowVisual.renderFamily, 'mounted-bow');

  const commanderVisual = getVisualProfileForUnit({
    id: 'commander-unit',
    visualProfileId: 'vp-commander',
  });
  assert.equal(commanderVisual.id, 'vp-commander');
  assert.equal(commanderVisual.facingMarker, 'front-chevron');

  const shallowLightFootVisual = getVisualProfileForUnit({
    id: 'light-foot-unit',
    profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY,
    depthUd: 0.5,
  });
  assert.equal(shallowLightFootVisual.id, 'vp-light-foot');
  assert.equal(shallowLightFootVisual.baseDepthHint, 'full');

  assert.throws(
    () => getVisualProfileForUnit(null),
    /Unit data is required to resolve a visual profile\./,
  );
});