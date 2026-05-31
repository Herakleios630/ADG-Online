import { UNIT_PROFILE_IDS } from './unit-profiles.js';

const P22_SOURCE_REF = 'docs/source/rules-v2-examples/rv2-p22-unit-characteristics-tables-a.png';
const ERRATA_SOURCE_REF = 'docs/rules/errata.md';

function createResolvedBinding(value, provenanceLabel) {
  return {
    resolved: {
      value,
      sourceStatus: 'verified',
      provenanceLabel,
      sourceRefs: [P22_SOURCE_REF, ERRATA_SOURCE_REF],
    },
  };
}

function createDeferredBinding(deferredReason, provenanceLabel) {
  return {
    resolved: null,
    deferredReason,
    provenanceLabel,
    sourceRefs: [P22_SOURCE_REF, ERRATA_SOURCE_REF],
  };
}

function isLightInfantryProfile(profileId) {
  return profileId === UNIT_PROFILE_IDS.LIGHT_INFANTRY
    || profileId === UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN;
}

function isRepresentativeMountedCvProfile(profileId) {
  return profileId === UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS
    || profileId === UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT;
}

export function resolveMeleeCombatFactorBinding({
  unitProfileId,
  opponentProfileId,
} = {}) {
  switch (unitProfileId) {
    case UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN:
      return createResolvedBinding(
        1,
        'p.22 medium swordsmen row: +1 vs all except cataphracts, heavy chariots, and knights',
      );

    case UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN:
      if (isLightInfantryProfile(opponentProfileId)) {
        return createDeferredBinding(
          'Heavy spearmen receive +2 versus LMI only in open terrain, and terrain closure is not yet wired into P9-03L.',
          'p.22 heavy spearmen row: terrain-dependent LMI lane remains open',
        );
      }
      return createResolvedBinding(
        1,
        'p.22 heavy spearmen row: otherwise +1 vs all',
      );

    case UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN:
      return createDeferredBinding(
        'The representative LI javelin profile is not yet source-closed against the p.22 javelinmen row taxonomy.',
        'p.22 javelin-family lane deferred pending javelinmen vs LI taxonomy closure',
      );

    case UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS:
    case UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT:
      if (isRepresentativeMountedCvProfile(opponentProfileId)) {
        return createResolvedBinding(
          1,
          'p.22 mounted Cv row: +1 vs mounted (representative cavalry-vs-cavalry lane)',
        );
      }

      if (opponentProfileId === UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN) {
        return createResolvedBinding(
          1,
          'p.22 mounted Cv row: +1 vs MI (representative medium swordsmen lane)',
        );
      }

      if (opponentProfileId === UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN) {
        return createResolvedBinding(
          1,
          'p.22 mounted Cv row: +1 vs LMI (first-contact bonus lanes remain conditional)',
        );
      }

      return createDeferredBinding(
        'Mounted Cv lanes that require flank-or-rear evidence, first-contact ability timing, or non-representative mounted families remain open in P9-03T.',
        'p.22 mounted Cv row partially closed; conditional mounted lanes remain source-open',
      );

    default:
      return createDeferredBinding(
        'No p.22 combat-factor binding exists yet for this representative profile.',
        'No bound p.22 row yet for this representative profile',
      );
  }
}