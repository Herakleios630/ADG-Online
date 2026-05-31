export const MELEE_V2_MODIFIER_PIPELINE_VERSION = 'v2';

export const MELEE_V2_MODIFIER_LANE_OWNERSHIP = {
  BRANCH: 'branch',
  ADDITIVE: 'additive',
  LEDGER_STAGE: 'ledger-stage',
};

export const MELEE_V2_CANCELLATION_FAMILIES = {
  REAR_CONTACT_FORMED: 'rear-contact-formed',
  FLANK_CONTACT_FORMED: 'flank-contact-formed',
};

export function resolveV2ModifierStageSourceStatus(entries = []) {
  const stageEntries = Array.isArray(entries) ? entries : [];
  return stageEntries.every((entry) => entry?.sourceStatus === 'verified')
    ? 'verified'
    : 'source-open';
}

export function summarizeV2ModifierStage(entries = []) {
  const stageEntries = Array.isArray(entries) ? entries : [];
  const total = stageEntries.reduce(
    (sum, entry) => sum + Number(entry?.value ?? 0),
    0,
  );

  return {
    count: stageEntries.length,
    total,
    sourceStatus: resolveV2ModifierStageSourceStatus(stageEntries),
  };
}

function toNormalizedText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function resolveRelevantEvidence(attackerUnit, defenderUnitId) {
  const candidates = [
    attackerUnit?.meleeContactEvidence,
    attackerUnit?.conformationApplied,
  ].filter((entry) => entry && typeof entry === 'object');

  for (const evidence of candidates) {
    const principalOpponentId = String(evidence?.principalOpponentId ?? '').trim();
    if (principalOpponentId.length > 0 && principalOpponentId !== defenderUnitId) {
      continue;
    }

    return evidence;
  }

  return null;
}

function resolveAttackContactType(evidence) {
  const explicitType = toNormalizedText(evidence?.contactType);
  const classifiedType = toNormalizedText(evidence?.contactClassification?.type);
  const contactType = explicitType || classifiedType;

  if (contactType === 'flank' || contactType === 'rear' || contactType === 'rear-or-flank') {
    return contactType;
  }

  return null;
}

function expectedCancellationFamilyForContactType(attackContactType) {
  if (attackContactType === 'rear') {
    return MELEE_V2_CANCELLATION_FAMILIES.REAR_CONTACT_FORMED;
  }

  if (attackContactType === 'flank') {
    return MELEE_V2_CANCELLATION_FAMILIES.FLANK_CONTACT_FORMED;
  }

  return null;
}

export function buildV2FlankRearModifierLane({ attackerUnit, defenderUnitId } = {}) {
  const evidence = resolveRelevantEvidence(attackerUnit, defenderUnitId);
  const attackContactType = resolveAttackContactType(evidence);

  if (!attackContactType) {
    return {
      branch: null,
      diagnostics: [],
    };
  }

  const triggerBridge = evidence?.meleeTriggerBridge && typeof evidence.meleeTriggerBridge === 'object'
    ? evidence.meleeTriggerBridge
    : null;
  const evidenceSourceStatus = toNormalizedText(
    triggerBridge?.sourceStatus
      ?? evidence?.sourceStatus
      ?? 'source-open',
  );
  const cancellationRequested = triggerBridge?.cancelAttackSituationBonus === true
    || evidence?.cancelAttackSituationBonus === true;
  const cancellationFamily = toNormalizedText(
    triggerBridge?.cancellationFamilyHint
      ?? evidence?.cancellationFamily,
  ) || null;
  const expectedFamily = expectedCancellationFamilyForContactType(attackContactType);
  const diagnostics = [];

  if (attackContactType === 'rear-or-flank') {
    diagnostics.push({
      code: 'melee.v2.branch.flank-rear-ambiguous-contact-type',
      severity: 'warning',
      sourceStatus: 'source-open',
    });
  }

  if (cancellationRequested && !cancellationFamily) {
    diagnostics.push({
      code: 'melee.v2.branch.cancellation-family-missing',
      severity: 'warning',
      sourceStatus: 'source-open',
    });
  }

  if (cancellationFamily && expectedFamily && cancellationFamily !== expectedFamily) {
    diagnostics.push({
      code: 'melee.v2.branch.cancellation-family-contact-mismatch',
      severity: 'warning',
      sourceStatus: 'source-open',
      cancellationFamily,
      attackContactType,
    });
  }

  const cancellationFamilySourceStatus = cancellationFamily && cancellationFamily === expectedFamily && evidenceSourceStatus === 'verified'
    ? 'verified'
    : 'source-open';
  const sourceStatus = diagnostics.length === 0 && evidenceSourceStatus === 'verified'
    ? 'verified'
    : 'source-open';

  return {
    branch: {
      attackContactType,
      sourceStatus,
      cancellationRequested,
      cancelAttackSituationBonus: cancellationRequested,
      cancellationFamily,
      cancellationFamilySourceStatus,
      cancellationApplies: cancellationRequested === true
        && cancellationFamily != null
        && cancellationFamily === expectedFamily
        && cancellationFamilySourceStatus === 'verified',
      defenderFactorToZeroEligible: triggerBridge?.defenderFactorToZeroEligible === true,
      applyDefenderCombatFactorToZero: triggerBridge?.defenderFactorToZeroEligible === true,
      requiresDefenderFrontEngagementForToZero: triggerBridge?.requiresDefenderFrontEngagementForToZero === true,
    },
    diagnostics,
  };
}
