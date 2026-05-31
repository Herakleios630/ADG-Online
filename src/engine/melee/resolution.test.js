import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIT_PROFILE_IDS, getResolvedAbilityIdsForUnit } from '../../data/unit-profiles.js';
import { createP9V2Mini11BPair11vs12FixtureRows } from '../../data/melee-drill-scenarios.js';
import { createP9V2Mini12GCoreLaneGoldRows } from '../../data/melee-drill-scenarios.js';

import {
  MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS,
  MELEE_MODIFIER_STAGES,
  MELEE_RESOLUTION_REASON_CODES,
  MELEE_RESOLUTION_STATUSES,
  resolveMeleeOutcome,
} from './resolution.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit-1',
    profileId: overrides.profileId ?? UNIT_PROFILE_IDS.LIGHT_INFANTRY,
    meleeCombatFactorValue: overrides.meleeCombatFactorValue,
    meleeCombatFactorSourceStatus: overrides.meleeCombatFactorSourceStatus,
  };
}

test('P9-02 resolves a deterministic melee pipeline with staged modifiers and loss table mapping', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker' }),
    defenderUnit: createUnit({ id: 'defender' }),
    attackerDieRoll: 4,
    defenderDieRoll: 2,
    combatFactorDebugOverrideEnabled: true,
    attackerCombatFactorValue: 6,
    defenderCombatFactorValue: 5,
    attackerModifierEntries: [
      { code: 'support-a', label: 'Support', stage: MELEE_MODIFIER_STAGES.SUPPORT, value: 1, sourceStatus: 'verified' },
      { code: 'situation-a', label: 'Flank bonus', stage: MELEE_MODIFIER_STAGES.SITUATION, value: 1, sourceStatus: 'verified' },
      { code: 'terrain-a', label: 'Terrain penalty', stage: MELEE_MODIFIER_STAGES.TERRAIN, value: -1, sourceStatus: 'verified' },
      { code: 'die-a', label: 'Quality', stage: MELEE_MODIFIER_STAGES.DIE, value: 1, sourceStatus: 'verified' },
      { code: 'final-a', label: 'Final result ability', stage: MELEE_MODIFIER_STAGES.FINAL_RESULT, value: 1, sourceStatus: 'verified' },
    ],
    defenderModifierEntries: [
      { code: 'support-d', label: 'Support', stage: MELEE_MODIFIER_STAGES.SUPPORT, value: 0, sourceStatus: 'verified' },
      { code: 'die-d', label: 'Quality', stage: MELEE_MODIFIER_STAGES.DIE, value: 0, sourceStatus: 'verified' },
    ],
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.differential, 2);
  assert.equal(resolution.breakdown.attacker.finalTotal, 8);
  assert.equal(resolution.breakdown.defender.finalTotal, 2);
  assert.equal(resolution.result.winnerSide, 'attacker');
  assert.equal(resolution.result.loserSide, 'defender');
  assert.equal(resolution.result.difference, 6);
  assert.equal(resolution.result.cohesionLoss, 3);
  assert.equal(resolution.result.rout, false);
});

test('P9-02 maps a 7+ final difference to rout', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker' }),
    defenderUnit: createUnit({ id: 'defender' }),
    attackerDieRoll: 6,
    defenderDieRoll: 1,
    combatFactorDebugOverrideEnabled: true,
    attackerCombatFactorValue: 7,
    defenderCombatFactorValue: 2,
    attackerModifierEntries: [
      { code: 'support-a', label: 'Support', stage: MELEE_MODIFIER_STAGES.SUPPORT, value: 1, sourceStatus: 'verified' },
    ],
    defenderModifierEntries: [],
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.result.winnerSide, 'attacker');
  assert.equal(resolution.result.rout, true);
  assert.equal(resolution.result.cohesionLoss, 0);
});

test('P9-02 binds combat factors from unit-owned melee combat values without resolver overrides', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 6, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 4, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.attacker.combatFactor, 6);
  assert.equal(resolution.breakdown.defender.combatFactor, 4);
  assert.equal(resolution.result.winnerSide, 'attacker');
});

test('P9-02 uses resolver override before unit explicit combat factor values', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 2, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 6, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    combatFactorDebugOverrideEnabled: true,
    attackerCombatFactorValue: 7,
    attackerCombatFactorSourceStatus: 'verified',
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.attacker.combatFactor, 7);
  assert.equal(resolution.breakdown.defender.combatFactor, 6);
  assert.equal(resolution.result.winnerSide, 'attacker');
});

test('P9-03L binds medium swordsmen and heavy spearmen from p.22 without manual factor input', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({
      id: 'attacker-swordsmen',
      profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
    }),
    defenderUnit: createUnit({
      id: 'defender-spearmen',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.attacker.combatFactor, 1);
  assert.equal(resolution.breakdown.defender.combatFactor, 1);
  assert.equal(resolution.breakdown.attacker.combatFactorSourceStatus, 'verified');
  assert.match(resolution.breakdown.attacker.combatFactorProvenance, /medium swordsmen/i);
});

test('P9-03T closes representative cavalry-vs-cavalry lane from p.22 mounted Cv row', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({
      id: 'attacker-cavalry',
      profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
    }),
    defenderUnit: createUnit({
      id: 'defender-cavalry',
      profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
    }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.attacker.combatFactor, 1);
  assert.equal(resolution.breakdown.defender.combatFactor, 1);
  assert.match(resolution.breakdown.attacker.combatFactorProvenance, /Cv row/i);
});

test('P9-03T keeps mounted lanes source-open when flank-or-rear evidence is required', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({
      id: 'attacker-cavalry',
      profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
    }),
    defenderUnit: createUnit({
      id: 'defender-heavy-spearmen',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(
    resolution.diagnostics.some((diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.COMBAT_FACTOR_PROFILE_DEFERRED),
    true,
  );
});

test('P9-03L uses manual factor values only when debug override is enabled', () => {
  const withoutDebug = resolveMeleeOutcome({
    attackerUnit: createUnit({
      id: 'attacker-swordsmen',
      profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
    }),
    defenderUnit: createUnit({
      id: 'defender-spearmen',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerCombatFactorValue: 7,
    defenderCombatFactorValue: 3,
  });
  const withDebug = resolveMeleeOutcome({
    attackerUnit: createUnit({
      id: 'attacker-swordsmen',
      profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
    }),
    defenderUnit: createUnit({
      id: 'defender-spearmen',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    combatFactorDebugOverrideEnabled: true,
    attackerCombatFactorValue: 7,
    defenderCombatFactorValue: 3,
    attackerCombatFactorSourceStatus: 'debug-fallback',
    defenderCombatFactorSourceStatus: 'debug-fallback',
  });

  assert.equal(withoutDebug.breakdown.attacker.combatFactor, 1);
  assert.equal(withDebug.breakdown.attacker.combatFactor, 7);
  assert.equal(withDebug.breakdown.attacker.combatFactorSourceStatus, 'debug-fallback');
});

test('P9-02 keeps unit explicit combat factor source-open when source status is missing', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 6 }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 4, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(resolution.result, null);
  assert.equal(
    resolution.diagnostics.some((diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.COMBAT_FACTOR_SOURCE_OPEN),
    true,
  );
});

test('P9-02 keeps combat factor source-open when no verified explicit factor is provided', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker' }),
    defenderUnit: createUnit({ id: 'defender' }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
    attackerCombatFactorValue: null,
    defenderCombatFactorValue: 4,
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(resolution.result, null);
  assert.equal(
    resolution.diagnostics.some((diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.COMBAT_FACTOR_DEFERRED),
    true,
  );
  assert.equal(
    resolution.diagnostics.some((diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.COMBAT_FACTOR_PROFILE_DEFERRED),
    true,
  );
});

test('P9-02 keeps unverified modifiers source-open instead of applying guessed values', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker' }),
    defenderUnit: createUnit({ id: 'defender' }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
    attackerCombatFactorValue: 5,
    defenderCombatFactorValue: 4,
    attackerModifierEntries: [
      { code: 'ability-a', label: 'Furious charge', stage: MELEE_MODIFIER_STAGES.FINAL_RESULT, value: 1, sourceStatus: 'needs-source-check' },
    ],
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(resolution.result, null);
  assert.equal(
    resolution.diagnostics.some((diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.MODIFIER_SOURCE_OPEN),
    true,
  );
});

test('P9-02 derives quality, flank/rear, height, and engaged-commander modifiers from context', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 2,
    defenderDieRoll: 4,
    attackerModifierContext: {
      quality: 'elite',
      flankOrRearAttack: true,
      heightAdvantage: true,
      engagedCommander: true,
      sourceStatus: 'verified',
    },
    defenderModifierContext: {
      quality: 'mediocre',
      sourceStatus: 'verified',
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.attacker.stages.die.length, 1);
  assert.equal(resolution.breakdown.defender.stages.die.length, 1);
  assert.equal(resolution.breakdown.attacker.stages.situation.length, 3);
  const situationValues = resolution.breakdown.attacker.stages.situation
    .map((entry) => Number(entry?.value ?? 0))
    .sort((left, right) => left - right);
  assert.deepEqual(situationValues, [0, 1, 1]);
  assert.equal(resolution.result.winnerSide, 'attacker');
});

test('P9V2-MINI-11A keeps flank/rear non-additive in final numeric resolution', () => {
  const withFlankMarker = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
    },
  });

  const withoutFlankMarker = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: false,
    },
  });

  assert.equal(withFlankMarker.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(withoutFlankMarker.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(withFlankMarker.breakdown?.attacker?.preDieTotal, withoutFlankMarker.breakdown?.attacker?.preDieTotal);
  assert.equal(withFlankMarker.breakdown?.attacker?.finalTotal, withoutFlankMarker.breakdown?.attacker?.finalTotal);
  assert.equal(withFlankMarker.breakdown?.attacker?.stageLedger?.flankRear, 0);
});

test('P9-02 keeps derived modifier context source-open when source status is missing', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 2,
    defenderDieRoll: 4,
    attackerModifierContext: {
      quality: 'elite',
      flankOrRearAttack: true,
      heightAdvantage: true,
      engagedCommander: true,
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(resolution.result, null);
  assert.equal(
    resolution.diagnostics.some((diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.MODIFIER_SOURCE_OPEN),
    true,
  );
});

test('P9-03N applies attached/included commander bonus and excludes support-only commander state', () => {
  const attachedCommanderResolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      engagedCommander: {
        status: 'engaged-main-unit',
        participation: 'attached',
        supportOnly: false,
        sourceStatus: 'verified',
      },
    },
  });

  const includedCommanderResolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      engagedCommander: {
        status: 'engaged-main-unit',
        participation: 'included',
        supportOnly: false,
        sourceStatus: 'verified',
      },
    },
  });

  const supportOnlyResolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      engagedCommander: {
        status: 'support-only',
        participation: 'none',
        supportOnly: true,
        sourceStatus: 'verified',
      },
    },
  });

  assert.equal(attachedCommanderResolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(includedCommanderResolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(supportOnlyResolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(attachedCommanderResolution.result?.winnerSide, 'attacker');
  assert.equal(includedCommanderResolution.result?.winnerSide, 'attacker');
  assert.equal(supportOnlyResolution.result?.winnerSide, null);
  assert.equal(attachedCommanderResolution.breakdown.attacker.stages.situation.length, 1);
  assert.equal(includedCommanderResolution.breakdown.attacker.stages.situation.length, 1);
  assert.equal(supportOnlyResolution.breakdown.attacker.stages.situation.length, 0);
});

test('P9-03R representative profile abilities can drive deterministic source-closed modifier lanes', () => {
  const attackerUnit = createUnit({
    id: 'attacker-impetuous',
    profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
    meleeCombatFactorValue: 5,
    meleeCombatFactorSourceStatus: 'verified',
  });
  const defenderUnit = createUnit({
    id: 'defender-impact',
    profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
    meleeCombatFactorValue: 5,
    meleeCombatFactorSourceStatus: 'verified',
  });

  const attackerAbilities = getResolvedAbilityIdsForUnit(attackerUnit);
  const defenderAbilities = getResolvedAbilityIdsForUnit(defenderUnit);

  const resolution = resolveMeleeOutcome({
    attackerUnit,
    defenderUnit,
    attackerDieRoll: 4,
    defenderDieRoll: 3,
    attackerModifierEntries: attackerAbilities.includes('impetuous')
      ? [{ code: 'impetuous-a', label: 'Impetuous', stage: MELEE_MODIFIER_STAGES.DIE, value: 1, sourceStatus: 'verified' }]
      : [],
    defenderModifierEntries: defenderAbilities.includes('impact')
      ? [{ code: 'impact-d', label: 'Impact', stage: MELEE_MODIFIER_STAGES.SITUATION, value: 1, sourceStatus: 'verified' }]
      : [],
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.attacker.stages.die.length, 1);
  assert.equal(resolution.breakdown.defender.stages.situation.length, 1);
  assert.equal(resolution.result.winnerSide, 'attacker');
});

test('P9-03V first-contact allows impact and furious-charge timing entries when source-closed', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({
      id: 'attacker-impetuous',
      profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
      meleeCombatFactorValue: 5,
      meleeCombatFactorSourceStatus: 'verified',
    }),
    defenderUnit: createUnit({
      id: 'defender-impact',
      profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
      meleeCombatFactorValue: 5,
      meleeCombatFactorSourceStatus: 'verified',
    }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
    meleeRoundState: 'first-contact',
    attackerModifierEntries: [
      {
        code: 'furious-charge-a',
        label: 'Furious charge',
        stage: MELEE_MODIFIER_STAGES.FINAL_RESULT,
        value: 1,
        sourceStatus: 'verified',
        appliesInRoundState: ['first-contact'],
      },
    ],
    defenderModifierEntries: [
      {
        code: 'impact-d',
        label: 'Impact',
        stage: MELEE_MODIFIER_STAGES.SITUATION,
        value: 1,
        sourceStatus: 'verified',
        appliesInRoundState: ['first-contact'],
      },
    ],
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(resolution.breakdown.attacker.stages[MELEE_MODIFIER_STAGES.FINAL_RESULT].length, 1);
  assert.equal(resolution.breakdown.defender.stages[MELEE_MODIFIER_STAGES.SITUATION].length, 1);
});

test('P9-03V continuing keeps impact and furious-charge lanes source-open without detach/combat-lock enforcement', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({
      id: 'attacker-impetuous',
      profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
      meleeCombatFactorValue: 5,
      meleeCombatFactorSourceStatus: 'verified',
    }),
    defenderUnit: createUnit({
      id: 'defender-impact',
      profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
      meleeCombatFactorValue: 5,
      meleeCombatFactorSourceStatus: 'verified',
    }),
    attackerDieRoll: 4,
    defenderDieRoll: 3,
    meleeRoundState: 'continuing',
    attackerModifierEntries: [
      {
        code: 'furious-charge-a',
        label: 'Furious charge',
        stage: MELEE_MODIFIER_STAGES.FINAL_RESULT,
        value: 1,
        sourceStatus: 'verified',
        appliesInRoundState: ['first-contact'],
      },
    ],
    defenderModifierEntries: [
      {
        code: 'impact-d',
        label: 'Impact',
        stage: MELEE_MODIFIER_STAGES.SITUATION,
        value: 1,
        sourceStatus: 'verified',
        appliesInRoundState: ['first-contact'],
      },
    ],
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(
    resolution.diagnostics.some(
      (diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.FIRST_CONTACT_ABILITY_CONTINUING_SOURCE_OPEN,
    ),
    true,
  );
  assert.equal(resolution.result, null);
});

test('P9-03O applies source-closed flank/rear defender-factor-to-zero branch deterministically', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
      flankRearBranch: {
        applyDefenderCombatFactorToZero: true,
        sourceStatus: 'verified',
      },
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(
    resolution.breakdown.defender.stages.situation.some(
      (entry) => String(entry?.code ?? '').includes('defender-factor-to-zero'),
    ),
    true,
  );
  assert.equal(resolution.breakdown.defender.preDieTotal, 0);
  assert.equal(resolution.result.winnerSide, 'attacker');
});

test('P9V2-MINI-11A stage ledger enforces flankRear hard-zero and final sum invariant', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 6, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 3,
    defenderDieRoll: 2,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: false,
      flankRearBranch: {
        applyDefenderCombatFactorToZero: true,
        sourceStatus: 'verified',
      },
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);

  const attackerLedger = resolution.breakdown?.attacker?.stageLedger;
  const defenderLedger = resolution.breakdown?.defender?.stageLedger;

  assert.ok(attackerLedger);
  assert.ok(defenderLedger);

  assert.equal(defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.BASE], 0);
  assert.equal(attackerLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FLANK_REAR], 0);
  assert.equal(defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FLANK_REAR], 0);

  assert.equal(attackerLedger.invariants?.flankRearHardZero, true);
  assert.equal(defenderLedger.invariants?.flankRearHardZero, true);
  assert.equal(attackerLedger.invariants?.finalMatchesStageSum, true);
  assert.equal(defenderLedger.invariants?.finalMatchesStageSum, true);
  assert.equal(attackerLedger.invariants?.hiddenPostStageModifierLaneAbsent, true);
  assert.equal(defenderLedger.invariants?.hiddenPostStageModifierLaneAbsent, true);

  const attackerExpected = attackerLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.BASE]
    + attackerLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.SUPPORT]
    + attackerLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FLANK_REAR]
    + attackerLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.DISORDER]
    + attackerLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.DIE];
  const defenderExpected = defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.BASE]
    + defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.SUPPORT]
    + defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FLANK_REAR]
    + defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.DISORDER]
    + defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.DIE];

  assert.equal(attackerLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FINAL], attackerExpected);
  assert.equal(defenderLedger[MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FINAL], defenderExpected);
});

test('P9V2-MINI-11B pair 11/12 keeps strict stage parity under identical participants and dice', () => {
  const [pair11, pair12] = createP9V2Mini11BPair11vs12FixtureRows();
  const row11 = resolveMeleeOutcome(pair11?.resolutionInput ?? {});
  const row12 = resolveMeleeOutcome(pair12?.resolutionInput ?? {});

  assert.equal(row11.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(row12.status, MELEE_RESOLUTION_STATUSES.RESOLVED);

  const row11Attacker = row11.breakdown?.attacker?.stageLedger;
  const row11Defender = row11.breakdown?.defender?.stageLedger;
  const row12Attacker = row12.breakdown?.attacker?.stageLedger;
  const row12Defender = row12.breakdown?.defender?.stageLedger;

  assert.ok(row11Attacker);
  assert.ok(row11Defender);
  assert.ok(row12Attacker);
  assert.ok(row12Defender);

  const parityKeys = ['base', 'support', 'flankRear', 'disorder', 'die', 'final'];
  for (const key of parityKeys) {
    assert.equal(row11Attacker?.[key], row12Attacker?.[key], `attacker parity failed for ${key}`);
    assert.equal(row11Defender?.[key], row12Defender?.[key], `defender parity failed for ${key}`);
  }

  assert.equal(row11Attacker?.flankRear, 0);
  assert.equal(row12Attacker?.flankRear, 0);
  assert.equal(row11Defender?.flankRear, 0);
  assert.equal(row12Defender?.flankRear, 0);
});

test('P9V2-MINI-12G source-closed gold rows match exact stage-ledger and result values', () => {
  const rows = createP9V2Mini12GCoreLaneGoldRows().filter((row) => row?.expected?.status === 'resolved');

  assert.equal(rows.length, 13);

  for (const row of rows) {
    const resolution = resolveMeleeOutcome(row?.resolutionInput ?? {});
    const expected = row?.expected ?? {};

    assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED, `expected resolved status for ${row?.rowId}`);

    const attackerLedger = resolution.breakdown?.attacker?.stageLedger;
    const defenderLedger = resolution.breakdown?.defender?.stageLedger;
    assert.ok(attackerLedger, `missing attacker stage ledger for ${row?.rowId}`);
    assert.ok(defenderLedger, `missing defender stage ledger for ${row?.rowId}`);

    assert.equal(attackerLedger?.base, expected?.attacker?.base, `attacker base mismatch for ${row?.rowId}`);
    assert.equal(attackerLedger?.support, expected?.attacker?.support, `attacker support mismatch for ${row?.rowId}`);
    assert.equal(attackerLedger?.flankRear, expected?.attacker?.flankRear, `attacker flankRear mismatch for ${row?.rowId}`);
    assert.equal(attackerLedger?.disorder, expected?.attacker?.disorder, `attacker disorder mismatch for ${row?.rowId}`);
    assert.equal(attackerLedger?.die, expected?.attacker?.die, `attacker die mismatch for ${row?.rowId}`);
    assert.equal(attackerLedger?.final, expected?.attacker?.final, `attacker final mismatch for ${row?.rowId}`);

    assert.equal(defenderLedger?.base, expected?.defender?.base, `defender base mismatch for ${row?.rowId}`);
    assert.equal(defenderLedger?.support, expected?.defender?.support, `defender support mismatch for ${row?.rowId}`);
    assert.equal(defenderLedger?.flankRear, expected?.defender?.flankRear, `defender flankRear mismatch for ${row?.rowId}`);
    assert.equal(defenderLedger?.disorder, expected?.defender?.disorder, `defender disorder mismatch for ${row?.rowId}`);
    assert.equal(defenderLedger?.die, expected?.defender?.die, `defender die mismatch for ${row?.rowId}`);
    assert.equal(defenderLedger?.final, expected?.defender?.final, `defender final mismatch for ${row?.rowId}`);

    assert.equal(attackerLedger?.invariants?.flankRearHardZero, true, `attacker flankRearHardZero invariant mismatch for ${row?.rowId}`);
    assert.equal(defenderLedger?.invariants?.flankRearHardZero, true, `defender flankRearHardZero invariant mismatch for ${row?.rowId}`);
    assert.equal(resolution.result?.winnerSide ?? null, expected?.winnerSide ?? null, `winner mismatch for ${row?.rowId}`);
    assert.equal(resolution.result?.difference ?? 0, expected?.difference ?? 0, `difference mismatch for ${row?.rowId}`);
  }
});

test('P9V2-MINI-12G source-open gold rows keep required diagnostic codes explicit', () => {
  const rows = createP9V2Mini12GCoreLaneGoldRows().filter((row) => row?.expected?.status === 'source-open');

  assert.equal(rows.length, 3);

  for (const row of rows) {
    const resolution = resolveMeleeOutcome(row?.resolutionInput ?? {});
    const expectedCodes = Array.isArray(row?.expected?.diagnosticCodes) ? row.expected.diagnosticCodes : [];
    const actualCodes = Array.isArray(resolution?.diagnostics)
      ? resolution.diagnostics.map((diagnostic) => diagnostic?.code).filter(Boolean)
      : [];

    assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN, `expected source-open status for ${row?.rowId}`);
    for (const code of expectedCodes) {
      assert.equal(actualCodes.includes(code), true, `missing diagnostic ${code} for ${row?.rowId}`);
    }
    assert.equal(resolution.result, null, `source-open row should not produce result for ${row?.rowId}`);
  }
});

test('P9-03O keeps unresolved flank/rear to-zero branch source-open instead of silently applying it', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
      flankRearBranch: {
        applyDefenderCombatFactorToZero: true,
        sourceStatus: 'needs-source-check',
      },
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(
    resolution.diagnostics.some(
      (diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.MODIFIER_SOURCE_OPEN,
    ),
    true,
  );
  assert.equal(resolution.result, null);
});

test('P9-03O branch cancellation can suppress generic flank/rear +1 situation bonus', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
      flankRearBranch: {
        attackContactType: 'rear',
        cancelAttackSituationBonus: true,
        cancellationFamily: 'rear-contact-formed',
        sourceStatus: 'verified',
      },
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  assert.equal(
    resolution.breakdown.attacker.stages.situation.some(
      (entry) => String(entry?.code ?? '').includes('flank-or-rear'),
    ),
    false,
  );
  assert.equal(resolution.result.winnerSide, null);
});

test('P9-03O keeps cancellation branch source-open when cancellation family is unresolved', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
      flankRearBranch: {
        cancelAttackSituationBonus: true,
        cancellationFamily: 'unresolved-family',
        sourceStatus: 'verified',
      },
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(
    resolution.diagnostics.some(
      (diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.MODIFIER_SOURCE_OPEN,
    ),
    true,
  );
  assert.equal(resolution.result, null);
});

test('P9-03O keeps cancellation source-open when family does not match attack contact type', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
      flankRearBranch: {
        attackContactType: 'flank',
        cancelAttackSituationBonus: true,
        cancellationFamily: 'rear-contact-formed',
        sourceStatus: 'verified',
      },
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(
    resolution.breakdown,
    null,
  );
  assert.equal(
    resolution.diagnostics.some(
      (diagnostic) => diagnostic.code === MELEE_RESOLUTION_REASON_CODES.MODIFIER_SOURCE_OPEN,
    ),
    true,
  );
  assert.equal(resolution.result, null);
});

test('P9V2-MINI-12D derived branch entries carry laneOwnership=branch in situation stage', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  const situationEntries = resolution.breakdown.attacker.stages[MELEE_MODIFIER_STAGES.SITUATION];
  const branchEntries = situationEntries.filter((e) => e.laneOwnership === 'branch');
  assert.ok(branchEntries.length > 0, 'Expected at least one branch-tagged situation entry from flankOrRearAttack context');
  assert.ok(
    branchEntries.every((e) => e.laneOwnership === 'branch'),
    'All flank/rear derived situation entries must carry laneOwnership=branch',
  );
});

test('P9V2-MINI-12D derived additive entries carry laneOwnership=additive in die and situation stages', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 2,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      quality: 'elite',
      heightAdvantage: true,
      engagedCommander: {
        status: 'engaged-main-unit',
        participation: 'attached',
        supportOnly: false,
        sourceStatus: 'verified',
      },
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  const situationEntries = resolution.breakdown.attacker.stages[MELEE_MODIFIER_STAGES.SITUATION];
  const dieEntries = resolution.breakdown.attacker.stages[MELEE_MODIFIER_STAGES.DIE];
  const additiveInSituation = situationEntries.filter((e) => e.laneOwnership === 'additive');
  const additiveInDie = dieEntries.filter((e) => e.laneOwnership === 'additive');
  assert.ok(additiveInSituation.length >= 2, 'Expected height advantage and commander as additive situation entries');
  assert.ok(additiveInDie.length >= 1, 'Expected elite quality die modifier as additive die entry');
});

test('P9V2-MINI-12D residual guard allNonLedgerEntriesOwned is false for untagged non-zero situation entry', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierEntries: [
      { code: 'unowned-bonus', label: 'Unknown bonus', stage: MELEE_MODIFIER_STAGES.SITUATION, value: 1, sourceStatus: 'verified' },
    ],
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  const attackerLedger = resolution.breakdown?.attacker?.stageLedger;
  assert.equal(
    attackerLedger?.invariants?.allNonLedgerEntriesOwned,
    false,
    'Invariant must be false when an untagged non-zero situation entry is present',
  );
  assert.ok(
    attackerLedger?.residualModifierSum !== 0,
    'residualModifierSum must be non-zero for the untagged entry',
  );
});

test('P9V2-MINI-12D residual guard allNonLedgerEntriesOwned is true when all non-ledger entries are explicitly owned', () => {
  const resolution = resolveMeleeOutcome({
    attackerUnit: createUnit({ id: 'attacker', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    defenderUnit: createUnit({ id: 'defender', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' }),
    attackerDieRoll: 2,
    defenderDieRoll: 4,
    attackerModifierContext: {
      sourceStatus: 'verified',
      quality: 'elite',
      heightAdvantage: true,
    },
  });

  assert.equal(resolution.status, MELEE_RESOLUTION_STATUSES.RESOLVED);
  const attackerLedger = resolution.breakdown?.attacker?.stageLedger;
  assert.equal(
    attackerLedger?.invariants?.allNonLedgerEntriesOwned,
    true,
    'Invariant must be true when all non-ledger entries carry explicit laneOwnership',
  );
  assert.ok(
    attackerLedger?.residualModifierSum !== 0,
    'residualModifierSum is non-zero but all entries are owned (additive)',
  );
});