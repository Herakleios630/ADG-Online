import test from 'node:test';
import assert from 'node:assert/strict';

import { UNIT_PROFILE_IDS } from '../../data/unit-profiles.js';
import {
  MELEE_V2_BASE_CF_LOOKUP_REASON_CODES,
  MELEE_V2_BASE_CF_LOOKUP_STATUSES,
  resolveV2BaseCombatFactorLookup,
} from './factor-lookup.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit-1',
    profileId: overrides.profileId ?? UNIT_PROFILE_IDS.LIGHT_INFANTRY,
  };
}

test('P9V2-MINI-12B resolves source-closed base combat factor bindings with explicit sourceStatus', () => {
  const lookup = resolveV2BaseCombatFactorLookup({
    unit: createUnit({
      id: 'attacker-swordsmen',
      profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
    }),
    opponentUnit: createUnit({
      id: 'defender-spearmen',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    }),
  });

  assert.equal(lookup.status, MELEE_V2_BASE_CF_LOOKUP_STATUSES.RESOLVED);
  assert.equal(lookup.value, 1);
  assert.equal(lookup.sourceStatus, 'verified');
  assert.match(lookup.provenanceLabel, /medium swordsmen/i);
  assert.equal(Array.isArray(lookup.sourceRefs), true);
  assert.equal(lookup.diagnostics.length, 0);
});

test('P9V2-MINI-12B keeps unresolved lanes source-open with explicit deferred reason', () => {
  const lookup = resolveV2BaseCombatFactorLookup({
    unit: createUnit({
      id: 'attacker-spearmen',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    }),
    opponentUnit: createUnit({
      id: 'defender-li-javelin',
      profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
    }),
  });

  assert.equal(lookup.status, MELEE_V2_BASE_CF_LOOKUP_STATUSES.SOURCE_OPEN);
  assert.equal(lookup.value, null);
  assert.equal(lookup.sourceStatus, 'source-open');
  assert.equal(lookup.diagnostics[0]?.code, MELEE_V2_BASE_CF_LOOKUP_REASON_CODES.BINDING_SOURCE_OPEN);
  assert.match(lookup.deferredReason, /terrain/i);
});

test('P9V2-MINI-12B accepts explicit profile ids and returns source-locked binding result', () => {
  const lookup = resolveV2BaseCombatFactorLookup({
    unitProfileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
    opponentProfileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
  });

  assert.equal(lookup.status, MELEE_V2_BASE_CF_LOOKUP_STATUSES.RESOLVED);
  assert.equal(lookup.value, 1);
  assert.equal(lookup.sourceStatus, 'verified');
  assert.match(lookup.provenanceLabel, /Cv row/i);
});

test('P9V2-MINI-12B returns source-open when profile lookup fails from unit payload', () => {
  const lookup = resolveV2BaseCombatFactorLookup({
    unit: {
      id: 'broken-unit',
    },
  });

  assert.equal(lookup.status, MELEE_V2_BASE_CF_LOOKUP_STATUSES.SOURCE_OPEN);
  assert.equal(lookup.value, null);
  assert.equal(lookup.sourceStatus, 'source-open');
  assert.equal(lookup.diagnostics[0]?.code, MELEE_V2_BASE_CF_LOOKUP_REASON_CODES.PROFILE_LOOKUP_SOURCE_OPEN);
});
