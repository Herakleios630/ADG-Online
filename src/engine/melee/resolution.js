import { resolveV2BaseCombatFactorLookup } from '../melee-v2/factor-lookup.js';
import { MELEE_V2_MODIFIER_LANE_OWNERSHIP } from '../melee-v2/modifier-pipeline.js';

export const MELEE_RESOLUTION_STATUSES = {
  RESOLVED: 'resolved',
  INVALID: 'invalid',
  SOURCE_OPEN: 'source-open',
};

export const MELEE_RESOLUTION_REASON_CODES = {
  UNIT_PAIR_REQUIRED: 'unit-pair-required',
  INVALID_DIE_ROLL: 'invalid-die-roll',
  COMBAT_FACTOR_DEFERRED: 'combat-factor-deferred',
  COMBAT_FACTOR_SOURCE_OPEN: 'combat-factor-source-open',
  COMBAT_FACTOR_PROFILE_DEFERRED: 'combat-factor-profile-deferred',
  MODIFIER_SOURCE_OPEN: 'modifier-source-open',
  PROFILE_LOOKUP_SOURCE_OPEN: 'profile-lookup-source-open',
  FIRST_CONTACT_ABILITY_CONTINUING_SOURCE_OPEN: 'first-contact-ability-continuing-source-open',
};

export const MELEE_MODIFIER_STAGES = {
  SUPPORT: 'support',
  SITUATION: 'situation',
  TERRAIN: 'terrain',
  DIE: 'die',
  FINAL_RESULT: 'final-result',
};

export const MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS = {
  BASE: 'base',
  SUPPORT: 'support',
  FLANK_REAR: 'flankRear',
  DISORDER: 'disorder',
  DIE: 'die',
  FINAL: 'final',
};

const MELEE_ROUND_STATES = {
  FIRST_CONTACT: 'first-contact',
  CONTINUING: 'continuing',
};

const FLANK_REAR_CANCELLATION_FAMILIES = {
  REAR_CONTACT_FORMED: 'rear-contact-formed',
  FLANK_CONTACT_FORMED: 'flank-contact-formed',
};

function createDiagnostic(code, message, context = {}) {
  return {
    code,
    message,
    ...context,
  };
}

function createBreakdownEntry(entry, stage) {
  const appliesInRoundStateValues = Array.isArray(entry?.appliesInRoundState)
    ? entry.appliesInRoundState
    : entry?.appliesInRoundState == null
      ? []
      : [entry.appliesInRoundState];
  const appliesInRoundState = [...new Set(
    appliesInRoundStateValues
      .map((value) => String(value ?? '').trim().toLowerCase())
      .filter((value) => value === MELEE_ROUND_STATES.FIRST_CONTACT || value === MELEE_ROUND_STATES.CONTINUING),
  )];

  return {
    code: entry?.code ?? null,
    label: entry?.label ?? stage,
    stage,
    value: Number.isFinite(entry?.value) ? Number(entry.value) : 0,
    sourceStatus: entry?.sourceStatus ?? 'verified',
    appliesInRoundState,
    ...(entry?.laneOwnership != null ? { laneOwnership: entry.laneOwnership } : {}),
  };
}

function normalizeModifierEntries(entries = []) {
  return Array.isArray(entries)
    ? entries.map((entry) => {
      const stage = Object.values(MELEE_MODIFIER_STAGES).includes(entry?.stage)
        ? entry.stage
        : MELEE_MODIFIER_STAGES.SITUATION;
      return createBreakdownEntry(entry, stage);
    })
    : [];
}

function normalizeMeleeRoundState(meleeRoundState) {
  return meleeRoundState === MELEE_ROUND_STATES.CONTINUING
    ? MELEE_ROUND_STATES.CONTINUING
    : MELEE_ROUND_STATES.FIRST_CONTACT;
}

function isFirstContactOnlyAbilityEntry(entry) {
  const appliesInRoundState = Array.isArray(entry?.appliesInRoundState)
    ? entry.appliesInRoundState
    : [];

  return appliesInRoundState.includes(MELEE_ROUND_STATES.FIRST_CONTACT)
    && !appliesInRoundState.includes(MELEE_ROUND_STATES.CONTINUING);
}

function gateFirstContactSensitiveEntries(entries = [], { side, meleeRoundState } = {}) {
  const diagnostics = [];
  const allowedEntries = [];

  for (const entry of entries) {
    if (meleeRoundState === MELEE_ROUND_STATES.CONTINUING && isFirstContactOnlyAbilityEntry(entry)) {
      diagnostics.push(createDiagnostic(
        MELEE_RESOLUTION_REASON_CODES.FIRST_CONTACT_ABILITY_CONTINUING_SOURCE_OPEN,
        `First-contact-only ability '${entry.label ?? entry.code ?? 'unknown'}' for side '${side}' is unresolved for continuing rounds and remains source-open.`,
        {
          side,
          meleeRoundState,
          modifierCode: entry.code,
          sourceStatus: entry.sourceStatus ?? 'needs-source-check',
        },
      ));
      continue;
    }

    allowedEntries.push(entry);
  }

  return {
    entries: allowedEntries,
    diagnostics,
  };
}

function groupEntriesByStage(entries) {
  const byStage = {
    [MELEE_MODIFIER_STAGES.SUPPORT]: [],
    [MELEE_MODIFIER_STAGES.SITUATION]: [],
    [MELEE_MODIFIER_STAGES.TERRAIN]: [],
    [MELEE_MODIFIER_STAGES.DIE]: [],
    [MELEE_MODIFIER_STAGES.FINAL_RESULT]: [],
  };

  for (const entry of entries) {
    byStage[entry.stage].push(entry);
  }

  return byStage;
}

function sumStage(entries) {
  return entries.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);
}

function isFlankRearToZeroEntry(entry) {
  return String(entry?.code ?? '').startsWith('melee.branch.flank-rear.defender-factor-to-zero.');
}

function isDisorderEntry(entry) {
  const code = String(entry?.code ?? '').toLowerCase();
  const label = String(entry?.label ?? '').toLowerCase();
  return code.includes('disorder') || label.includes('disorder');
}

function buildCombatFactorStageLedgerSide({
  combatFactor,
  entriesByStage,
  dieRoll,
} = {}) {
  const supportEntries = Array.isArray(entriesByStage?.[MELEE_MODIFIER_STAGES.SUPPORT])
    ? entriesByStage[MELEE_MODIFIER_STAGES.SUPPORT]
    : [];
  const situationEntries = Array.isArray(entriesByStage?.[MELEE_MODIFIER_STAGES.SITUATION])
    ? entriesByStage[MELEE_MODIFIER_STAGES.SITUATION]
    : [];
  const terrainEntries = Array.isArray(entriesByStage?.[MELEE_MODIFIER_STAGES.TERRAIN])
    ? entriesByStage[MELEE_MODIFIER_STAGES.TERRAIN]
    : [];
  const dieEntries = Array.isArray(entriesByStage?.[MELEE_MODIFIER_STAGES.DIE])
    ? entriesByStage[MELEE_MODIFIER_STAGES.DIE]
    : [];
  const finalResultEntries = Array.isArray(entriesByStage?.[MELEE_MODIFIER_STAGES.FINAL_RESULT])
    ? entriesByStage[MELEE_MODIFIER_STAGES.FINAL_RESULT]
    : [];

  const flankRearToZeroInSituation = sumStage(situationEntries.filter(isFlankRearToZeroEntry));
  const disorderFromSituation = sumStage(situationEntries.filter(isDisorderEntry));
  const disorderFromTerrain = sumStage(terrainEntries.filter(isDisorderEntry));

  const base = Number(combatFactor ?? 0) + flankRearToZeroInSituation;
  const support = sumStage(supportEntries);
  const flankRear = 0;
  const disorder = disorderFromSituation + disorderFromTerrain;
  const die = Number(dieRoll ?? 0);
  const final = base + support + flankRear + disorder + die;

  const residualSituation = sumStage(situationEntries) - flankRearToZeroInSituation - disorderFromSituation;
  const residualTerrain = sumStage(terrainEntries) - disorderFromTerrain;
  const residualDie = sumStage(dieEntries);
  const residualFinalResult = sumStage(finalResultEntries);
  const residualModifierSum = residualSituation + residualTerrain + residualDie + residualFinalResult;

  // Non-ledger residual entries: any entry that contributes to residualModifierSum
  // must carry an explicit laneOwnership tag; untagged non-zero entries are hidden lanes.
  const residualCandidates = [
    ...situationEntries.filter((e) => !isFlankRearToZeroEntry(e) && !isDisorderEntry(e)),
    ...terrainEntries.filter((e) => !isDisorderEntry(e)),
    ...dieEntries,
    ...finalResultEntries,
  ];
  const unownedNonZeroResiduals = residualCandidates.filter(
    (e) => e.laneOwnership == null && Number(e.value ?? 0) !== 0,
  );

  return {
    [MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.BASE]: base,
    [MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.SUPPORT]: support,
    [MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FLANK_REAR]: flankRear,
    [MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.DISORDER]: disorder,
    [MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.DIE]: die,
    [MELEE_COMBAT_FACTOR_STAGE_LEDGER_KEYS.FINAL]: final,
    invariants: {
      flankRearHardZero: flankRear === 0,
      finalMatchesStageSum: final === (base + support + flankRear + disorder + die),
      hiddenPostStageModifierLaneAbsent: residualModifierSum === 0,
      allNonLedgerEntriesOwned: unownedNonZeroResiduals.length === 0,
    },
    residualModifierSum,
    residualModifierBreakdown: {
      situation: residualSituation,
      terrain: residualTerrain,
      die: residualDie,
      finalResult: residualFinalResult,
    },
  };
}

function buildCombatFactorStageLedger({
  attackerCombatFactor,
  defenderCombatFactor,
  attackerEntriesByStage,
  defenderEntriesByStage,
  attackerDieRoll,
  defenderDieRoll,
} = {}) {
  return {
    attacker: buildCombatFactorStageLedgerSide({
      combatFactor: attackerCombatFactor,
      entriesByStage: attackerEntriesByStage,
      dieRoll: attackerDieRoll,
    }),
    defender: buildCombatFactorStageLedgerSide({
      combatFactor: defenderCombatFactor,
      entriesByStage: defenderEntriesByStage,
      dieRoll: defenderDieRoll,
    }),
  };
}

function resolveCombatFactor({
  side,
  unit,
  combatFactorValue,
  combatFactorSourceStatus,
  combatFactorProvenance = null,
} = {}) {
  if (!Number.isFinite(combatFactorValue)) {
    return {
      status: MELEE_RESOLUTION_STATUSES.SOURCE_OPEN,
      value: null,
      diagnostics: [createDiagnostic(
        MELEE_RESOLUTION_REASON_CODES.COMBAT_FACTOR_DEFERRED,
        `Combat factor for side '${side}' is not source-closed in this slice without an explicit verified value.`,
        {
          side,
          unitId: unit?.id ?? null,
          profileId: unit?.profileId ?? null,
        },
      )],
    };
  }

  if (combatFactorSourceStatus !== 'verified' && combatFactorSourceStatus !== 'debug-fallback') {
    return {
      status: MELEE_RESOLUTION_STATUSES.SOURCE_OPEN,
      value: null,
      diagnostics: [createDiagnostic(
        MELEE_RESOLUTION_REASON_CODES.COMBAT_FACTOR_SOURCE_OPEN,
        `Combat factor for side '${side}' is present but not source-verified.`,
        {
          side,
          unitId: unit?.id ?? null,
          sourceStatus: combatFactorSourceStatus,
        },
      )],
    };
  }

  return {
    status: MELEE_RESOLUTION_STATUSES.RESOLVED,
    value: Number(combatFactorValue),
    sourceStatus: combatFactorSourceStatus,
    provenance: combatFactorProvenance,
    diagnostics: [],
  };
}

function resolveExplicitCombatFactorFromUnit(unit) {
  if (!unit || typeof unit !== 'object') {
    return null;
  }

  const valueCandidates = [
    unit.meleeCombatFactorValue,
    unit.combatFactorValue,
    unit.meleeCombatFactor?.value,
  ];
  const sourceStatusCandidates = [
    unit.meleeCombatFactorSourceStatus,
    unit.combatFactorSourceStatus,
    unit.meleeCombatFactor?.sourceStatus,
  ];

  const explicitValue = valueCandidates.find((candidate) => Number.isFinite(candidate));
  if (!Number.isFinite(explicitValue)) {
    return null;
  }

  return {
    value: Number(explicitValue),
    sourceStatus: sourceStatusCandidates.find((candidate) => typeof candidate === 'string') ?? 'source-open',
    source: 'unit-explicit',
  };
}

function resolveProfileBoundCombatFactor(unit, opponentUnit, side) {
  if (!unit || typeof unit !== 'object') {
    return {
      resolved: null,
      diagnostics: [],
    };
  }

  const lookup = resolveV2BaseCombatFactorLookup({
    unit,
    opponentUnit,
  });

  const hasProfileLookupFailure = Array.isArray(lookup?.diagnostics)
    && lookup.diagnostics.some((entry) => entry?.code === 'melee.v2.base-cf-profile-lookup-source-open');

  if (hasProfileLookupFailure) {
    return {
      resolved: null,
      diagnostics: [createDiagnostic(
        MELEE_RESOLUTION_REASON_CODES.PROFILE_LOOKUP_SOURCE_OPEN,
        `Profile lookup for side '${side}' is source-open in the current slice: ${lookup.diagnostics[0]?.message ?? 'unknown profile lookup failure'}`,
        {
          side,
          unitId: unit?.id ?? null,
          profileId: lookup?.profileId ?? null,
          opponentProfileId: lookup?.opponentProfileId ?? null,
          sourceRefs: Array.isArray(lookup?.sourceRefs) ? lookup.sourceRefs : [],
        },
      )],
    };
  }

  if (lookup?.status !== 'resolved' || !Number.isFinite(lookup?.value)) {
    return {
      resolved: null,
      diagnostics: [createDiagnostic(
        MELEE_RESOLUTION_REASON_CODES.COMBAT_FACTOR_PROFILE_DEFERRED,
        lookup?.deferredReason
          ?? `Combat profile binding for side '${side}' is still source-open in the current MINI-12B lookup slice.`,
        {
          side,
          unitId: unit?.id ?? null,
          profileId: lookup?.profileId ?? null,
          opponentProfileId: lookup?.opponentProfileId ?? null,
          provenanceLabel: lookup?.provenanceLabel ?? null,
          sourceRefs: Array.isArray(lookup?.sourceRefs) ? lookup.sourceRefs : [],
        },
      )],
    };
  }

  return {
    resolved: {
      value: Number(lookup.value),
      sourceStatus: lookup.sourceStatus ?? 'verified',
      source: 'profile-binding',
      provenanceLabel: lookup.provenanceLabel ?? 'Profile binding',
      sourceRefs: Array.isArray(lookup.sourceRefs) ? lookup.sourceRefs : [],
    },
    diagnostics: [],
  };
}

function resolveCombatFactorInput({
  side,
  unit,
  opponentUnit,
  explicitValue,
  explicitSourceStatus,
  debugOverrideEnabled = false,
} = {}) {
  if (debugOverrideEnabled && Number.isFinite(explicitValue)) {
    return {
      resolved: {
        value: Number(explicitValue),
        sourceStatus: explicitSourceStatus ?? 'debug-fallback',
        source: 'debug-fallback',
        provenanceLabel: 'Debug override',
        sourceRefs: [],
      },
      diagnostics: [],
    };
  }

  const unitExplicit = resolveExplicitCombatFactorFromUnit(unit);
  if (unitExplicit) {
    return {
      resolved: unitExplicit,
      diagnostics: [],
    };
  }

  return resolveProfileBoundCombatFactor(unit, opponentUnit, side);
}

export function resolveMeleeCombatFactorPreview({
  attackerUnit,
  defenderUnit,
  attackerCombatFactorValue,
  defenderCombatFactorValue,
  attackerCombatFactorSourceStatus,
  defenderCombatFactorSourceStatus,
  combatFactorDebugOverrideEnabled = false,
} = {}) {
  const attacker = resolveCombatFactorInput({
    side: 'attacker',
    unit: attackerUnit,
    opponentUnit: defenderUnit,
    explicitValue: attackerCombatFactorValue,
    explicitSourceStatus: attackerCombatFactorSourceStatus,
    debugOverrideEnabled: combatFactorDebugOverrideEnabled === true,
  });
  const defender = resolveCombatFactorInput({
    side: 'defender',
    unit: defenderUnit,
    opponentUnit: attackerUnit,
    explicitValue: defenderCombatFactorValue,
    explicitSourceStatus: defenderCombatFactorSourceStatus,
    debugOverrideEnabled: combatFactorDebugOverrideEnabled === true,
  });

  return {
    attacker: {
      value: attacker.resolved?.value ?? null,
      sourceStatus: attacker.resolved?.sourceStatus ?? 'source-open',
      provenance: attacker.resolved?.source ?? 'deferred',
      provenanceLabel: attacker.resolved?.provenanceLabel ?? 'Source-open binding',
      diagnostics: attacker.diagnostics,
    },
    defender: {
      value: defender.resolved?.value ?? null,
      sourceStatus: defender.resolved?.sourceStatus ?? 'source-open',
      provenance: defender.resolved?.source ?? 'deferred',
      provenanceLabel: defender.resolved?.provenanceLabel ?? 'Source-open binding',
      diagnostics: defender.diagnostics,
    },
  };
}

function validateDieRoll(value, side) {
  if (!Number.isInteger(value) || value < 1 || value > 6) {
    return createDiagnostic(
      MELEE_RESOLUTION_REASON_CODES.INVALID_DIE_ROLL,
      `Die roll for side '${side}' must be an integer from 1 to 6.`,
      { side, value },
    );
  }

  return null;
}

function normalizeQuality(quality) {
  return String(quality ?? '').trim().toLowerCase();
}

function createDerivedModifierEntry({
  code,
  label,
  stage,
  value,
  sourceStatus = 'verified',
  laneOwnership = null,
}) {
  return {
    code,
    label,
    stage,
    value,
    sourceStatus,
    ...(laneOwnership != null ? { laneOwnership } : {}),
  };
}

function createDerivedModifierEntries({
  side,
  dieRoll,
  modifierContext,
  unit = null,
} = {}) {
  if (!modifierContext || typeof modifierContext !== 'object') {
    return [];
  }

  const entries = [];
  const sourceStatus = typeof modifierContext.sourceStatus === 'string'
    ? modifierContext.sourceStatus
    : 'source-open';
  const quality = normalizeQuality(modifierContext.quality);

  if (quality === 'elite' && dieRoll <= 3) {
    entries.push(createDerivedModifierEntry({
      code: `melee.quality.elite.${side}`,
      label: 'Elite quality die modifier',
      stage: MELEE_MODIFIER_STAGES.DIE,
      value: 1,
      sourceStatus,
      laneOwnership: MELEE_V2_MODIFIER_LANE_OWNERSHIP.ADDITIVE,
    }));
  }

  if (quality === 'mediocre' && dieRoll >= 4) {
    entries.push(createDerivedModifierEntry({
      code: `melee.quality.mediocre.${side}`,
      label: 'Mediocre quality die modifier',
      stage: MELEE_MODIFIER_STAGES.DIE,
      value: -1,
      sourceStatus,
      laneOwnership: MELEE_V2_MODIFIER_LANE_OWNERSHIP.ADDITIVE,
    }));
  }

  const flankRearBranch = modifierContext.flankRearBranch && typeof modifierContext.flankRearBranch === 'object'
    ? modifierContext.flankRearBranch
    : null;
  const attackContactType = String(flankRearBranch?.attackContactType ?? '').trim().toLowerCase();
  const cancellationFamily = String(flankRearBranch?.cancellationFamily ?? '').trim().toLowerCase();
  const cancellationSourceStatus = typeof flankRearBranch?.sourceStatus === 'string'
    ? flankRearBranch.sourceStatus
    : 'source-open';
  const cancellationFamilyIsSupported = cancellationFamily === FLANK_REAR_CANCELLATION_FAMILIES.REAR_CONTACT_FORMED
    || cancellationFamily === FLANK_REAR_CANCELLATION_FAMILIES.FLANK_CONTACT_FORMED;
  const cancellationFamilyMatchesContact = (
    cancellationFamily === FLANK_REAR_CANCELLATION_FAMILIES.REAR_CONTACT_FORMED && attackContactType === 'rear'
  ) || (
    cancellationFamily === FLANK_REAR_CANCELLATION_FAMILIES.FLANK_CONTACT_FORMED && attackContactType === 'flank'
  );
  const cancellationRequested = flankRearBranch?.cancelAttackSituationBonus === true;
  const flankRearCancellationEnabled = cancellationRequested
    && cancellationSourceStatus === 'verified'
    && cancellationFamilyIsSupported
    && cancellationFamilyMatchesContact;
  const branchSourceVerified = cancellationSourceStatus === 'verified';
  const branchAttackerSituationBonus = Number(flankRearBranch?.attackerSituationBonus ?? 0);
  const branchOwnershipAttackerUnitId = String(flankRearBranch?.ownershipAttackerUnitId ?? '').trim();
  const resolvedUnitId = String(unit?.id ?? '').trim();
  const branchOwnerMatchesResolvedAttacker = branchOwnershipAttackerUnitId.length === 0
    || (resolvedUnitId.length > 0 && branchOwnershipAttackerUnitId === resolvedUnitId);
  const shouldApplyAttackerSituationBonus = side === 'attacker'
    && modifierContext.flankOrRearAttack === true
    && !flankRearCancellationEnabled
    && branchSourceVerified
    && branchOwnerMatchesResolvedAttacker
    && Number.isFinite(branchAttackerSituationBonus)
    && branchAttackerSituationBonus > 0;

  if (shouldApplyAttackerSituationBonus) {
    entries.push(createDerivedModifierEntry({
      code: `melee.situation.flank-or-rear.${side}`,
      label: 'Flank or rear situation bonus',
      stage: MELEE_MODIFIER_STAGES.SITUATION,
      value: branchAttackerSituationBonus,
      sourceStatus,
      laneOwnership: MELEE_V2_MODIFIER_LANE_OWNERSHIP.BRANCH,
    }));
  }

  if (modifierContext.flankOrRearAttack === true && cancellationRequested && !flankRearCancellationEnabled) {
    entries.push(createDerivedModifierEntry({
      code: `melee.branch.flank-rear.cancellation.${side}`,
      label: 'Flank/rear cancellation branch remains source-open',
      stage: MELEE_MODIFIER_STAGES.SITUATION,
      value: 0,
      sourceStatus: cancellationSourceStatus === 'verified'
        ? 'needs-source-check'
        : cancellationSourceStatus,
      laneOwnership: MELEE_V2_MODIFIER_LANE_OWNERSHIP.BRANCH,
    }));
  }

  if (modifierContext.heightAdvantage === true) {
    entries.push(createDerivedModifierEntry({
      code: `melee.situation.height-advantage.${side}`,
      label: 'Height advantage modifier',
      stage: MELEE_MODIFIER_STAGES.SITUATION,
      value: 1,
      sourceStatus,
      laneOwnership: MELEE_V2_MODIFIER_LANE_OWNERSHIP.ADDITIVE,
    }));
  }

  let commanderParticipation = 'legacy';
  let applyCommanderBonus = modifierContext.engagedCommander === true;

  if (modifierContext.engagedCommander && typeof modifierContext.engagedCommander === 'object') {
    const commanderState = modifierContext.engagedCommander;
    const commanderStatus = String(commanderState.status ?? '').trim().toLowerCase();
    const commanderSupportOnly = commanderState.supportOnly === true || commanderStatus === 'support-only';
    const commanderParticipationRaw = String(commanderState.participation ?? '').trim().toLowerCase();

    commanderParticipation = commanderParticipationRaw || 'none';
    applyCommanderBonus = !commanderSupportOnly
      && commanderStatus === 'engaged-main-unit'
      && (commanderParticipation === 'attached' || commanderParticipation === 'included');
  }

  if (applyCommanderBonus) {
    const commanderEntrySourceStatus = typeof modifierContext.engagedCommander?.sourceStatus === 'string'
      ? modifierContext.engagedCommander.sourceStatus
      : sourceStatus;
    entries.push(createDerivedModifierEntry({
      code: `melee.situation.engaged-commander.${commanderParticipation}.${side}`,
      label: commanderParticipation === 'included'
        ? 'Engaged included commander modifier'
        : commanderParticipation === 'attached'
          ? 'Engaged attached commander modifier'
          : 'Engaged commander modifier',
      stage: MELEE_MODIFIER_STAGES.SITUATION,
      value: 1,
      sourceStatus: commanderEntrySourceStatus,
      laneOwnership: MELEE_V2_MODIFIER_LANE_OWNERSHIP.ADDITIVE,
    }));
  }

  return entries;
}

function createFlankRearToZeroEntries({
  branchSide,
  targetSide,
  branchContext,
  targetCombatFactor,
} = {}) {
  if (!branchContext || typeof branchContext !== 'object') {
    return [];
  }

  if (branchContext.applyDefenderCombatFactorToZero !== true) {
    return [];
  }

  const sourceStatus = typeof branchContext.sourceStatus === 'string'
    ? branchContext.sourceStatus
    : 'source-open';

  return [createDerivedModifierEntry({
    code: `melee.branch.flank-rear.defender-factor-to-zero.${branchSide}.vs.${targetSide}`,
    label: 'Flank/rear defender combat-factor-to-zero branch',
    stage: MELEE_MODIFIER_STAGES.SITUATION,
    value: Number.isFinite(targetCombatFactor) ? -Number(targetCombatFactor) : 0,
    sourceStatus,
    laneOwnership: MELEE_V2_MODIFIER_LANE_OWNERSHIP.BRANCH,
  })];
}

function mapDifferenceToLoss(difference) {
  if (difference <= 0) {
    return {
      cohesionLoss: 0,
      isRout: false,
    };
  }

  if (difference <= 2) {
    return {
      cohesionLoss: 1,
      isRout: false,
    };
  }

  if (difference <= 4) {
    return {
      cohesionLoss: 2,
      isRout: false,
    };
  }

  if (difference <= 6) {
    return {
      cohesionLoss: 3,
      isRout: false,
    };
  }

  return {
    cohesionLoss: 0,
    isRout: true,
  };
}

function collectSourceOpenDiagnostics(modifierEntries = [], side) {
  return modifierEntries
    .filter((entry) => entry.sourceStatus !== 'verified')
    .map((entry) => createDiagnostic(
      MELEE_RESOLUTION_REASON_CODES.MODIFIER_SOURCE_OPEN,
      `Modifier '${entry.label}' for side '${side}' is not source-verified.`,
      {
        side,
        stage: entry.stage,
        sourceStatus: entry.sourceStatus,
        modifierCode: entry.code,
      },
    ));
}

export function resolveMeleeOutcome({
  attackerUnit,
  defenderUnit,
  attackerDieRoll,
  defenderDieRoll,
  attackerCombatFactorValue,
  defenderCombatFactorValue,
  attackerCombatFactorSourceStatus = 'verified',
  defenderCombatFactorSourceStatus = 'verified',
  attackerModifierEntries = [],
  defenderModifierEntries = [],
  attackerModifierContext = null,
  defenderModifierContext = null,
  meleeRoundState = MELEE_ROUND_STATES.FIRST_CONTACT,
  combatFactorDebugOverrideEnabled = false,
} = {}) {
  if (!attackerUnit || !defenderUnit) {
    return {
      status: MELEE_RESOLUTION_STATUSES.INVALID,
      result: null,
      breakdown: null,
      diagnostics: [createDiagnostic(
        MELEE_RESOLUTION_REASON_CODES.UNIT_PAIR_REQUIRED,
        'Both attacker and defender units are required for melee resolution.',
      )],
    };
  }

  const diagnostics = [];
  const resolvedRoundState = normalizeMeleeRoundState(meleeRoundState);
  const attackerDieDiagnostic = validateDieRoll(attackerDieRoll, 'attacker');
  const defenderDieDiagnostic = validateDieRoll(defenderDieRoll, 'defender');
  if (attackerDieDiagnostic) {
    diagnostics.push(attackerDieDiagnostic);
  }
  if (defenderDieDiagnostic) {
    diagnostics.push(defenderDieDiagnostic);
  }

  if (diagnostics.length > 0) {
    return {
      status: MELEE_RESOLUTION_STATUSES.INVALID,
      result: null,
      breakdown: null,
      diagnostics,
    };
  }

  const attackerFactorInput = resolveCombatFactorInput({
    side: 'attacker',
    unit: attackerUnit,
    opponentUnit: defenderUnit,
    explicitValue: attackerCombatFactorValue,
    explicitSourceStatus: attackerCombatFactorSourceStatus,
    debugOverrideEnabled: combatFactorDebugOverrideEnabled === true,
  });
  const defenderFactorInput = resolveCombatFactorInput({
    side: 'defender',
    unit: defenderUnit,
    opponentUnit: attackerUnit,
    explicitValue: defenderCombatFactorValue,
    explicitSourceStatus: defenderCombatFactorSourceStatus,
    debugOverrideEnabled: combatFactorDebugOverrideEnabled === true,
  });

  diagnostics.push(...attackerFactorInput.diagnostics, ...defenderFactorInput.diagnostics);

  const attackerFactor = resolveCombatFactor({
    side: 'attacker',
    unit: attackerUnit,
    combatFactorValue: attackerFactorInput.resolved?.value,
    combatFactorSourceStatus: attackerFactorInput.resolved?.sourceStatus,
    combatFactorProvenance: attackerFactorInput.resolved?.provenanceLabel ?? attackerFactorInput.resolved?.source,
  });
  const defenderFactor = resolveCombatFactor({
    side: 'defender',
    unit: defenderUnit,
    combatFactorValue: defenderFactorInput.resolved?.value,
    combatFactorSourceStatus: defenderFactorInput.resolved?.sourceStatus,
    combatFactorProvenance: defenderFactorInput.resolved?.provenanceLabel ?? defenderFactorInput.resolved?.source,
  });

  const derivedAttackerEntries = createDerivedModifierEntries({
    side: 'attacker',
    dieRoll: attackerDieRoll,
    modifierContext: attackerModifierContext,
    unit: attackerUnit,
  });
  const derivedDefenderEntries = createDerivedModifierEntries({
    side: 'defender',
    dieRoll: defenderDieRoll,
    modifierContext: defenderModifierContext,
    unit: defenderUnit,
  });
  const attackerToZeroEntries = createFlankRearToZeroEntries({
    branchSide: 'attacker',
    targetSide: 'defender',
    branchContext: attackerModifierContext?.flankRearBranch,
    targetCombatFactor: defenderFactor.value,
  });
  const defenderToZeroEntries = createFlankRearToZeroEntries({
    branchSide: 'defender',
    targetSide: 'attacker',
    branchContext: defenderModifierContext?.flankRearBranch,
    targetCombatFactor: attackerFactor.value,
  });

  const normalizedAttackerEntries = normalizeModifierEntries([
    ...defenderToZeroEntries,
    ...derivedAttackerEntries,
    ...(Array.isArray(attackerModifierEntries) ? attackerModifierEntries : []),
  ]);
  const normalizedDefenderEntries = normalizeModifierEntries([
    ...attackerToZeroEntries,
    ...derivedDefenderEntries,
    ...(Array.isArray(defenderModifierEntries) ? defenderModifierEntries : []),
  ]);
  const attackerTimingGate = gateFirstContactSensitiveEntries(normalizedAttackerEntries, {
    side: 'attacker',
    meleeRoundState: resolvedRoundState,
  });
  const defenderTimingGate = gateFirstContactSensitiveEntries(normalizedDefenderEntries, {
    side: 'defender',
    meleeRoundState: resolvedRoundState,
  });
  diagnostics.push(...attackerFactor.diagnostics, ...defenderFactor.diagnostics);
  diagnostics.push(...attackerTimingGate.diagnostics, ...defenderTimingGate.diagnostics);
  diagnostics.push(...collectSourceOpenDiagnostics(attackerTimingGate.entries, 'attacker'));
  diagnostics.push(...collectSourceOpenDiagnostics(defenderTimingGate.entries, 'defender'));

  if (diagnostics.length > 0) {
    return {
      status: MELEE_RESOLUTION_STATUSES.SOURCE_OPEN,
      result: null,
      breakdown: null,
      diagnostics,
    };
  }

  const attackerByStage = groupEntriesByStage(attackerTimingGate.entries);
  const defenderByStage = groupEntriesByStage(defenderTimingGate.entries);

  const attackerPreDieTotal = attackerFactor.value
    + sumStage(attackerByStage[MELEE_MODIFIER_STAGES.SUPPORT])
    + sumStage(attackerByStage[MELEE_MODIFIER_STAGES.SITUATION])
    + sumStage(attackerByStage[MELEE_MODIFIER_STAGES.TERRAIN]);
  const defenderPreDieTotal = defenderFactor.value
    + sumStage(defenderByStage[MELEE_MODIFIER_STAGES.SUPPORT])
    + sumStage(defenderByStage[MELEE_MODIFIER_STAGES.SITUATION])
    + sumStage(defenderByStage[MELEE_MODIFIER_STAGES.TERRAIN]);

  const differential = attackerPreDieTotal - defenderPreDieTotal;
  const attackerDifferentialBonus = differential > 0 ? differential : 0;
  const defenderDifferentialBonus = differential < 0 ? Math.abs(differential) : 0;

  const attackerFinalTotal = attackerDieRoll
    + sumStage(attackerByStage[MELEE_MODIFIER_STAGES.DIE])
    + attackerDifferentialBonus
    + sumStage(attackerByStage[MELEE_MODIFIER_STAGES.FINAL_RESULT]);
  const defenderFinalTotal = defenderDieRoll
    + sumStage(defenderByStage[MELEE_MODIFIER_STAGES.DIE])
    + defenderDifferentialBonus
    + sumStage(defenderByStage[MELEE_MODIFIER_STAGES.FINAL_RESULT]);

  const winnerSide = attackerFinalTotal === defenderFinalTotal
    ? null
    : attackerFinalTotal > defenderFinalTotal ? 'attacker' : 'defender';
  const loserSide = winnerSide === null ? null : winnerSide === 'attacker' ? 'defender' : 'attacker';
  const resultDifference = Math.abs(attackerFinalTotal - defenderFinalTotal);
  const loss = mapDifferenceToLoss(resultDifference);
  const stageLedger = buildCombatFactorStageLedger({
    attackerCombatFactor: attackerFactor.value,
    defenderCombatFactor: defenderFactor.value,
    attackerEntriesByStage: attackerByStage,
    defenderEntriesByStage: defenderByStage,
    attackerDieRoll,
    defenderDieRoll,
  });

  return {
    status: MELEE_RESOLUTION_STATUSES.RESOLVED,
    diagnostics,
    breakdown: {
      attacker: {
        combatFactor: attackerFactor.value,
        combatFactorSourceStatus: attackerFactor.sourceStatus,
        combatFactorProvenance: attackerFactor.provenance,
        stages: attackerByStage,
        preDieTotal: attackerPreDieTotal,
        dieRoll: attackerDieRoll,
        differentialBonus: attackerDifferentialBonus,
        finalTotal: attackerFinalTotal,
        stageLedger: stageLedger.attacker,
      },
      defender: {
        combatFactor: defenderFactor.value,
        combatFactorSourceStatus: defenderFactor.sourceStatus,
        combatFactorProvenance: defenderFactor.provenance,
        stages: defenderByStage,
        preDieTotal: defenderPreDieTotal,
        dieRoll: defenderDieRoll,
        differentialBonus: defenderDifferentialBonus,
        finalTotal: defenderFinalTotal,
        stageLedger: stageLedger.defender,
      },
      differential,
    },
    result: {
      winnerSide,
      loserSide,
      difference: resultDifference,
      cohesionLoss: winnerSide ? loss.cohesionLoss : 0,
      rout: winnerSide ? loss.isRout : false,
    },
  };
}