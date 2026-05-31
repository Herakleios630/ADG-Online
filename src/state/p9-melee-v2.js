import { createMeleeV2ContactModel, MELEE_V2_CONTACT_MODEL_VERSION } from '../engine/melee-v2/contact-model.js';
import { assignMeleeV2Roles, MELEE_V2_ROLE_ASSIGNMENT_VERSION } from '../engine/melee-v2/role-assignment.js';
import {
  buildV2ActiveFightSet,
  buildV2MeleeBatchApplicationPlan,
  buildV2MeleeBatchPreview,
  buildV2MeleeBatchQueue,
  MELEE_V2_RESOLUTION_VERSION,
} from '../engine/melee-v2/resolution.js';
import {
  MELEE_MODIFIER_STAGES,
  MELEE_RESOLUTION_STATUSES,
  resolveMeleeCombatFactorPreview,
  resolveMeleeOutcome,
} from '../engine/melee/resolution.js';
import {
  classifyMeleeContactUnit,
  resolveMeleeSupportAssignments,
  summarizeMeleeContactRoles,
} from '../engine/melee/roles.js';
import { buildV2FlankRearModifierLane } from '../engine/melee-v2/modifier-pipeline.js';
import { getFootprintCommandRangeMeasurement } from '../engine/command/range.js';

export const MELEE_BATCH_APPLICATION_STATUSES = {
  PENDING_SIMULTANEOUS_BATCH: 'pending-simultaneous-batch',
  APPLIED_AT_BATCH_END: 'applied-at-batch-end',
};

export const MELEE_PROCEDURE_STATUSES = {
  IDLE: 'idle',
  ANNOUNCED: 'announced',
  ACTIVE: 'active',
  PREVIEW_READY: 'preview-ready',
  APPLIED: 'applied',
};

export const MELEE_V2_ENGINE_VERSION = 'v2';
export const MELEE_V2_LIFECYCLE_STATUSES = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  RESOLVED_PENDING_APPLY: 'resolved-pending-apply',
  COMPLETE: 'complete',
};

export const MELEE_V2_PARTICIPATION_STATUSES = {
  MAIN_DEFENDER_PENDING: 'main-defender-pending',
  MAIN_DEFENDER_RESOLVED: 'main-defender-resolved',
  SUPPORT_PARTICIPANT: 'support-participant',
  NON_MELEE: 'non-melee',
};

export const MELEE_V2_COMMANDER_PRESENCE_STATUSES = {
  INCLUDED: 'included',
  ATTACHED: 'attached',
  SUPPORT_ONLY: 'support-only',
  NONE: 'none',
};

function deriveV2LifecycleStatus(meleeState) {
  const queueSelectionIds = Array.isArray(meleeState?.queueSelectionIds)
    ? meleeState.queueSelectionIds
    : [];
  const resolvedMeleeIds = Array.isArray(meleeState?.resolvedMeleeIds)
    ? meleeState.resolvedMeleeIds
    : [];

  if (meleeState?.status === MELEE_PROCEDURE_STATUSES.APPLIED) {
    return MELEE_V2_LIFECYCLE_STATUSES.COMPLETE;
  }

  if (meleeState?.status === MELEE_PROCEDURE_STATUSES.ACTIVE || meleeState?.status === MELEE_PROCEDURE_STATUSES.PREVIEW_READY) {
    if (queueSelectionIds.length > 0 && resolvedMeleeIds.length >= queueSelectionIds.length) {
      return MELEE_V2_LIFECYCLE_STATUSES.RESOLVED_PENDING_APPLY;
    }
    return MELEE_V2_LIFECYCLE_STATUSES.SELECTING;
  }

  return MELEE_V2_LIFECYCLE_STATUSES.IDLE;
}

function deriveOutcomeBuckets(meleeState, lifecycleStatus) {
  const resolvedEntriesByMeleeId = meleeState?.resolvedEntriesByMeleeId
    && typeof meleeState.resolvedEntriesByMeleeId === 'object'
      ? meleeState.resolvedEntriesByMeleeId
      : {};

  const pendingResolvedEntriesByMeleeId = lifecycleStatus === MELEE_V2_LIFECYCLE_STATUSES.COMPLETE
    ? {}
    : { ...resolvedEntriesByMeleeId };
  const committedResolvedEntriesByMeleeId = lifecycleStatus === MELEE_V2_LIFECYCLE_STATUSES.COMPLETE
    ? { ...resolvedEntriesByMeleeId }
    : {};

  return {
    pendingResolvedEntriesByMeleeId,
    committedResolvedEntriesByMeleeId,
    pendingMeleeIds: Object.keys(pendingResolvedEntriesByMeleeId),
    committedMeleeIds: Object.keys(committedResolvedEntriesByMeleeId),
  };
}

function createUnitMap(gameState) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  return new Map(units.map((unit) => [unit?.id, unit]));
}

function normalizePersistedRoundStateMap(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [meleeId, roundState]) => {
    if (typeof meleeId !== 'string' || meleeId.length === 0) {
      return accumulator;
    }

    accumulator[meleeId] = normalizeMeleeRoundStateForDraft(roundState);
    return accumulator;
  }, {});
}

function normalizePersistedCommanderEngagementHistoryMap(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [meleeId, history]) => {
    if (typeof meleeId !== 'string' || meleeId.length === 0 || !history || typeof history !== 'object') {
      return accumulator;
    }

    accumulator[meleeId] = {
      attacker: history.attacker === true,
      defender: history.defender === true,
    };
    return accumulator;
  }, {});
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeMeleeSourceStatus(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'verified' || normalized === 'needs-source-check') {
    return normalized;
  }

  return 'source-open';
}

function resolvePrincipalOpponentId(unit, allUnits = []) {
  const evidence = unit?.meleeContactEvidence && typeof unit.meleeContactEvidence === 'object'
    ? unit.meleeContactEvidence
    : unit?.conformationApplied && typeof unit.conformationApplied === 'object'
      ? unit.conformationApplied
      : null;
  const explicitOpponentId = evidence?.principalOpponentId ?? unit?.meleePendingOpponentId ?? null;
  if (explicitOpponentId) {
    return explicitOpponentId;
  }

  return null;
}

function resolveGeometryOpponentId(unit, allUnits = []) {
  if (!unit || !Array.isArray(allUnits)) {
    return null;
  }

  const enemyCandidates = allUnits
    .filter((candidate) => candidate && candidate.id !== unit.id && candidate.owner !== unit.owner)
    .map((candidate) => ({
      candidate,
      distanceUd: Number(getFootprintCommandRangeMeasurement(unit, candidate)?.distanceUd ?? Number.POSITIVE_INFINITY),
    }))
    .filter((entry) => Number.isFinite(entry.distanceUd) && entry.distanceUd <= 1e-4)
    .sort((left, right) => {
      if (left.distanceUd !== right.distanceUd) {
        return left.distanceUd - right.distanceUd;
      }

      return String(left.candidate.id).localeCompare(String(right.candidate.id));
    });

  return enemyCandidates[0]?.candidate?.id ?? null;
}

function resolveAttackContactType(unit) {
  const evidence = resolveContactEvidence(unit);

  const explicitType = normalizeText(evidence?.contactType);
  if (explicitType) {
    return explicitType;
  }

  return normalizeText(evidence?.contactClassification?.type);
}

function hasConformedContact(unit) {
  const evidence = resolveContactEvidence(unit);
  const relationship = normalizeText(evidence?.contactRelationship);

  return unit?.conformationApplied === true || relationship.includes('fully-conformed');
}

function resolveContactEvidence(unit) {
  if (unit?.meleeContactEvidence && typeof unit.meleeContactEvidence === 'object') {
    return unit.meleeContactEvidence;
  }

  if (unit?.conformationApplied && typeof unit.conformationApplied === 'object') {
    return unit.conformationApplied;
  }

  return null;
}

function resolveNormalizedContactRole(unit) {
  const evidence = resolveContactEvidence(unit);
  const explicitRole = normalizeText(evidence?.contactRole ?? unit?.contactRole);
  if (explicitRole === 'simple-support' || explicitRole === 'melee-support' || explicitRole === 'main-unit' || explicitRole === 'main') {
    return explicitRole;
  }

  if (Boolean(unit?.inMeleeSupport) && !Boolean(unit?.providesOnlySimpleSupport)) {
    return 'melee-support';
  }

  if (Boolean(unit?.providesOnlySimpleSupport) || Boolean(unit?.inMeleeSupport)) {
    return 'simple-support';
  }

  return null;
}

function hasActionableMeleeEvidence(unit) {
  const evidence = resolveContactEvidence(unit);
  if (!evidence || typeof evidence !== 'object') {
    return false;
  }

  return Boolean(
    evidence.principalOpponentId
    || evidence.contactRole
    || evidence.contactSide
    || evidence.contactRelationship
    || evidence.contactType
    || evidence.contactClassification,
  );
}

function isMainCandidateByContactOrigin(unit) {
  const contactOrigin = normalizeText(resolveContactEvidence(unit)?.contactOrigin);
  return contactOrigin === 'charge-contact' || contactOrigin === 'pursuit-contact';
}

function isSupportRole(unit) {
  const contactRole = resolveNormalizedContactRole(unit);
  return contactRole === 'simple-support' || contactRole === 'melee-support';
}

function normalizeRotationDeltaRadians(value) {
  const radians = Number(value ?? 0);
  return Math.atan2(Math.sin(radians), Math.cos(radians));
}

function invertSupportSide(side) {
  if (side === 'left') {
    return 'right';
  }

  if (side === 'right') {
    return 'left';
  }

  return null;
}

function getFightEntryByAnchorUnitId(eligibleEntries, anchorUnitId) {
  if (!anchorUnitId) {
    return null;
  }

  return eligibleEntries.find((entry) => (
    entry?.attackerUnitId === anchorUnitId
    || entry?.defenderUnitId === anchorUnitId
    || (Array.isArray(entry?.combatGroupAttackerUnitIds) && entry.combatGroupAttackerUnitIds.includes(anchorUnitId))
  )) ?? null;
}

function normalizeSupportSideForFight({
  supportSide,
  supportOpponentId,
  attackerMainUnit,
  defenderMainUnit,
}) {
  if (supportSide !== 'left' && supportSide !== 'right') {
    return null;
  }

  const attackerMainId = String(attackerMainUnit?.id ?? '').trim();
  const defenderMainId = String(defenderMainUnit?.id ?? '').trim();
  if (!attackerMainId || !defenderMainId) {
    return null;
  }

  if (supportOpponentId === defenderMainId) {
    return supportSide;
  }

  if (supportOpponentId === attackerMainId) {
    const attackerRotation = Number(attackerMainUnit?.rotationRadians ?? 0);
    const defenderRotation = Number(defenderMainUnit?.rotationRadians ?? 0);
    const delta = Math.abs(normalizeRotationDeltaRadians(attackerRotation - defenderRotation));
    const opposedFacingThresholdRadians = (Math.PI * 2) / 3;
    if (delta >= opposedFacingThresholdRadians) {
      return invertSupportSide(supportSide);
    }

    return supportSide;
  }

  return null;
}

function isDisplacedSimpleSupportUnit(gameState, supportUnit) {
  if (resolveNormalizedContactRole(supportUnit) !== 'simple-support') {
    return false;
  }

  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  const unitsById = new Map(units.map((unit) => [unit?.id, unit]));
  const supportEvidence = resolveContactEvidence(supportUnit);
  const supportSide = normalizeText(supportEvidence?.contactSide);
  if (supportSide !== 'left' && supportSide !== 'right') {
    return false;
  }

  const anchorMainUnitId = String(
    supportEvidence?.principalOpponentId
      ?? supportUnit?.meleePendingOpponentId
      ?? '',
  ).trim();
  if (!anchorMainUnitId) {
    return false;
  }

  const eligibleEntries = getV2EligibleEntries(gameState);
  const anchorEntry = getFightEntryByAnchorUnitId(eligibleEntries, anchorMainUnitId);
  const attackerMainUnit = unitsById.get(anchorEntry?.attackerUnitId) ?? null;
  const defenderMainUnit = unitsById.get(anchorEntry?.defenderUnitId) ?? null;
  if (!anchorEntry || !attackerMainUnit || !defenderMainUnit) {
    return false;
  }

  const canonicalSupportSide = normalizeSupportSideForFight({
    supportSide,
    supportOpponentId: anchorMainUnitId,
    attackerMainUnit,
    defenderMainUnit,
  });
  if (!canonicalSupportSide) {
    return false;
  }

  return units.some((unit) => {
    if (!unit || unit.id === supportUnit.id || unit.owner !== supportUnit.owner) {
      return false;
    }

    if (resolveNormalizedContactRole(unit) !== 'melee-support') {
      return false;
    }

    const unitEvidence = resolveContactEvidence(unit);
    const unitPrincipalOpponentId = String(
      unitEvidence?.principalOpponentId
        ?? unit?.meleePendingOpponentId
        ?? '',
    ).trim();
    if (!unitPrincipalOpponentId) {
      return false;
    }

    const unitEntry = getFightEntryByAnchorUnitId(eligibleEntries, unitPrincipalOpponentId);
    if (!unitEntry || unitEntry.id !== anchorEntry.id) {
      return false;
    }

    const unitSupportSide = normalizeText(unitEvidence?.contactSide);
    const canonicalUnitSide = normalizeSupportSideForFight({
      supportSide: unitSupportSide,
      supportOpponentId: unitPrincipalOpponentId,
      attackerMainUnit,
      defenderMainUnit,
    });

    return canonicalUnitSide != null && canonicalUnitSide === canonicalSupportSide;
  });
}

function choosePrimaryAttackerForDefender(candidates = []) {
  const entries = Array.isArray(candidates) ? [...candidates] : [];
  if (entries.length === 0) {
    return null;
  }

  const primaryCandidates = entries.some((candidate) => candidate?.isSupportRole !== true)
    ? entries.filter((candidate) => candidate?.isSupportRole !== true)
    : entries;

  const frontCandidates = primaryCandidates.filter((candidate) => candidate.contactType === 'front');
  const flankRearCandidates = primaryCandidates.filter((candidate) => candidate.contactType === 'flank' || candidate.contactType === 'rear');
  const flankRearConformed = flankRearCandidates.filter((candidate) => candidate.conformationApplied === true);

  if (frontCandidates.length > 0 && flankRearConformed.length > 0) {
    return [...flankRearConformed].sort((left, right) => String(left.attackerUnit.id).localeCompare(String(right.attackerUnit.id)))[0];
  }

  if (frontCandidates.length > 0 && flankRearCandidates.length >= 2) {
    return [...flankRearCandidates].sort((left, right) => String(left.attackerUnit.id).localeCompare(String(right.attackerUnit.id)))[0];
  }

  if (frontCandidates.length > 0) {
    return [...frontCandidates].sort((left, right) => String(left.attackerUnit.id).localeCompare(String(right.attackerUnit.id)))[0];
  }

  if (flankRearCandidates.length > 0) {
    return [...flankRearCandidates].sort((left, right) => String(left.attackerUnit.id).localeCompare(String(right.attackerUnit.id)))[0];
  }

  return [...primaryCandidates].sort((left, right) => String(left.attackerUnit.id).localeCompare(String(right.attackerUnit.id)))[0];
}

function getV2EligibleEntries(gameState) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  const activePlayerId = gameState?.commandContext?.activePlayerId ?? null;
  const unitById = new Map(units.map((unit) => [unit?.id, unit]));
  const unitOrderById = new Map(units.map((unit, index) => [unit?.id, index]));
  const byDefender = new Map();

  for (const attackerUnit of units) {
    if (!attackerUnit || attackerUnit.owner !== activePlayerId) {
      continue;
    }

    const contactType = resolveAttackContactType(attackerUnit);
    const attackerIsSupportRole = isSupportRole(attackerUnit);

    if (!(
      attackerUnit.engagedInMelee === true
      || attackerUnit.hasChargedThisSequence === true
      || hasActionableMeleeEvidence(attackerUnit)
      || isMainCandidateByContactOrigin(attackerUnit)
      || attackerUnit.conformationApplied
    )) {
      continue;
    }

    if (attackerIsSupportRole && contactType !== 'flank' && contactType !== 'rear' && contactType !== 'rear-or-flank') {
      continue;
    }

    const defenderUnitId = resolvePrincipalOpponentId(attackerUnit, units)
      ?? resolveGeometryOpponentId(attackerUnit, units);
    const defenderUnit = defenderUnitId ? unitById.get(defenderUnitId) ?? null : null;
    if (!defenderUnit || defenderUnit.owner === attackerUnit.owner) {
      continue;
    }

    if (!byDefender.has(defenderUnit.id)) {
      byDefender.set(defenderUnit.id, []);
    }

    byDefender.get(defenderUnit.id).push({
      attackerUnit,
      defenderUnit,
      contactType,
      conformationApplied: hasConformedContact(attackerUnit),
      isSupportRole: attackerIsSupportRole,
    });
  }

  const eligibleEntries = [];
  for (const [defenderUnitId, candidates] of byDefender.entries()) {
    const selected = choosePrimaryAttackerForDefender(candidates);
    if (!selected) {
      continue;
    }

    const groupedAttackers = candidates
      .map((candidate) => candidate.attackerUnit)
      .filter((unit) => unit?.id !== selected.attackerUnit?.id)
      .sort((left, right) => String(left?.id ?? '').localeCompare(String(right?.id ?? '')));

    eligibleEntries.push({
      id: `${selected.attackerUnit.id}__${defenderUnitId}`,
      attackerUnitId: selected.attackerUnit.id,
      defenderUnitId,
      combatGroupId: String(defenderUnitId),
      combatGroupAttackerUnitIds: [
        selected.attackerUnit.id,
        ...groupedAttackers.map((unit) => unit.id),
      ],
      label: `${selected.attackerUnit.scenarioLabel ?? selected.attackerUnit.id} vs ${selected.defenderUnit.scenarioLabel ?? selected.defenderUnit.id}`,
      allUnits: units,
      resolutionInput: {
        attackerUnit: selected.attackerUnit,
        defenderUnit: selected.defenderUnit,
        additionalAttackerUnits: groupedAttackers,
        combatGroupAttackerUnitIds: [
          selected.attackerUnit.id,
          ...groupedAttackers.map((unit) => unit.id),
        ],
        attackerDieRoll: 4,
        defenderDieRoll: 4,
      },
    });
  }

  return eligibleEntries.sort((left, right) => {
    const leftOrder = Number.isFinite(unitOrderById.get(left?.attackerUnitId)) ? unitOrderById.get(left.attackerUnitId) : Number.POSITIVE_INFINITY;
    const rightOrder = Number.isFinite(unitOrderById.get(right?.attackerUnitId)) ? unitOrderById.get(right.attackerUnitId) : Number.POSITIVE_INFINITY;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return String(left?.id ?? '').localeCompare(String(right?.id ?? ''));
  });
}

function groupModifierEntriesByStage(entries = []) {
  const grouped = {
    [MELEE_MODIFIER_STAGES.SUPPORT]: [],
    [MELEE_MODIFIER_STAGES.SITUATION]: [],
    [MELEE_MODIFIER_STAGES.TERRAIN]: [],
    [MELEE_MODIFIER_STAGES.DIE]: [],
    [MELEE_MODIFIER_STAGES.FINAL_RESULT]: [],
  };

  for (const entry of Array.isArray(entries) ? entries : []) {
    const stage = Object.values(MELEE_MODIFIER_STAGES).includes(entry?.stage)
      ? entry.stage
      : MELEE_MODIFIER_STAGES.SITUATION;
    grouped[stage].push(entry);
  }

  return grouped;
}

function filterToZeroStageEntries(groupedStages = {}) {
  const filtered = {
    [MELEE_MODIFIER_STAGES.SUPPORT]: [],
    [MELEE_MODIFIER_STAGES.SITUATION]: [],
    [MELEE_MODIFIER_STAGES.TERRAIN]: [],
    [MELEE_MODIFIER_STAGES.DIE]: [],
    [MELEE_MODIFIER_STAGES.FINAL_RESULT]: [],
  };

  for (const stage of Object.values(MELEE_MODIFIER_STAGES)) {
    const entries = Array.isArray(groupedStages?.[stage]) ? groupedStages[stage] : [];
    filtered[stage] = entries.filter((entry) => !String(entry?.code ?? '').startsWith('melee.branch.flank-rear.defender-factor-to-zero.'));
  }

  return filtered;
}

function buildDraftDerivedModifierStages(input = {}) {
  const preview = resolveMeleeOutcome({
    ...input,
    attackerDieRoll: Number(input.attackerDieRoll ?? 4),
    defenderDieRoll: Number(input.defenderDieRoll ?? 4),
  });

  if (preview?.status !== MELEE_RESOLUTION_STATUSES.RESOLVED) {
    return {
      attackerModifierStages: groupModifierEntriesByStage(input.attackerModifierEntries),
      defenderModifierStages: groupModifierEntriesByStage(input.defenderModifierEntries),
    };
  }

  return {
    attackerModifierStages: filterToZeroStageEntries(preview?.breakdown?.attacker?.stages ?? {}),
    defenderModifierStages: filterToZeroStageEntries(preview?.breakdown?.defender?.stages ?? {}),
  };
}

function createDraftFactorPresentation(draft) {
  const input = draft?.resolutionInput ?? {};
  const allUnits = Array.isArray(draft?.allUnits) ? draft.allUnits : [];
  const derivedModifierStages = buildDraftDerivedModifierStages(input);
  const factorPreview = resolveMeleeCombatFactorPreview({
    attackerUnit: input.attackerUnit ?? null,
    defenderUnit: input.defenderUnit ?? null,
    attackerCombatFactorValue: input.attackerCombatFactorValue,
    defenderCombatFactorValue: input.defenderCombatFactorValue,
    attackerCombatFactorSourceStatus: input.attackerCombatFactorSourceStatus,
    defenderCombatFactorSourceStatus: input.defenderCombatFactorSourceStatus,
    combatFactorDebugOverrideEnabled: input.combatFactorDebugOverrideEnabled === true,
  });

  const createSupportPresentationEntry = (entry) => ({
    id: entry?.unit?.id ?? null,
    label: entry?.unit?.scenarioLabel ?? entry?.unit?.id ?? 'Support unit',
    role: entry?.classification?.role ?? 'source-open',
    roleLabel: entry?.classification?.roleLabel ?? entry?.classification?.role ?? 'source-open',
    supportKind: entry?.classification?.supportKind ?? null,
    contactSide: entry?.classification?.contactSide ?? null,
    contactRelationship: entry?.classification?.contactRelationship ?? null,
    sourceStatus: entry?.sourceStatus ?? entry?.classification?.sourceStatus ?? 'needs-source-check',
  });

  const unitById = new Map(allUnits.map((unit) => [unit?.id, unit]));

  const createBranchCandidates = (candidateIds = [], ownerAttackerUnitId = null) => {
    const uniqueIds = [...new Set(
      (Array.isArray(candidateIds) ? candidateIds : [])
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0),
    )];

    return uniqueIds.map((attackerUnitId) => {
      const attackerUnit = unitById.get(attackerUnitId) ?? null;
      return {
        attackerUnitId,
        label: attackerUnit?.scenarioLabel ?? attackerUnitId,
        isOwner: attackerUnitId === ownerAttackerUnitId,
      };
    });
  };

  const createBranchPresentation = (unit, side, branchFromContext = null) => {
    if (branchFromContext && typeof branchFromContext === 'object') {
      const ownershipAttackerUnitId = branchFromContext.ownershipAttackerUnitId ?? null;
      return {
        side,
        label: side === 'attacker' ? 'Attacker flank/rear branch' : 'Defender flank/rear branch',
        attackContactType: branchFromContext.attackContactType ?? null,
        sourceStatus: branchFromContext.sourceStatus ?? 'source-open',
        applyDefenderCombatFactorToZero: branchFromContext.applyDefenderCombatFactorToZero === true,
        requiresDefenderFrontEngagementForToZero: branchFromContext.requiresDefenderFrontEngagementForToZero === true,
        cancellationFamily: branchFromContext.cancellationFamily ?? null,
        ownershipAttackerUnitId,
        ownershipMeleeId: branchFromContext.ownershipMeleeId ?? null,
        inheritedDefenderToZeroFromBranch: branchFromContext.inheritedDefenderToZeroFromBranch === true,
        immediateMultipleAttackTrigger: branchFromContext.immediateMultipleAttackTrigger ?? null,
        branchCandidates: createBranchCandidates(
          branchFromContext.allCandidateAttackerUnitIds,
          ownershipAttackerUnitId,
        ),
      };
    }

    const evidence = unit?.meleeContactEvidence && typeof unit.meleeContactEvidence === 'object'
      ? unit.meleeContactEvidence
      : unit?.conformationApplied && typeof unit.conformationApplied === 'object'
        ? unit.conformationApplied
        : null;
    const triggerBridge = evidence?.meleeTriggerBridge && typeof evidence.meleeTriggerBridge === 'object'
      ? evidence.meleeTriggerBridge
      : null;
    const attackContactType = normalizeText(
      triggerBridge?.attackContactType
        ?? evidence?.contactClassification?.type
        ?? evidence?.contactType,
    );

    if (!triggerBridge && attackContactType !== 'flank' && attackContactType !== 'rear' && attackContactType !== 'rear-or-flank') {
      return {
        side,
        label: side === 'attacker' ? 'Attacker flank/rear branch' : 'Defender flank/rear branch',
        attackContactType: 'unknown',
        sourceStatus: 'source-open',
        applyDefenderCombatFactorToZero: false,
        requiresDefenderFrontEngagementForToZero: false,
        cancellationFamily: null,
        ownershipAttackerUnitId: null,
        ownershipMeleeId: null,
        inheritedDefenderToZeroFromBranch: false,
        immediateMultipleAttackTrigger: null,
        branchCandidates: [],
      };
    }

    const ownershipAttackerUnitId = triggerBridge?.ownershipAttackerUnitId ?? null;

    return {
      side,
      label: side === 'attacker' ? 'Attacker flank/rear branch' : 'Defender flank/rear branch',
      attackContactType: attackContactType || null,
      sourceStatus: triggerBridge?.sourceStatus
        ?? evidence?.sourceStatus
        ?? 'source-open',
      applyDefenderCombatFactorToZero: triggerBridge?.defenderFactorToZeroEligible === true,
      requiresDefenderFrontEngagementForToZero: triggerBridge?.requiresDefenderFrontEngagementForToZero === true,
      cancellationFamily: triggerBridge?.cancellationFamilyHint ?? null,
      ownershipAttackerUnitId,
      ownershipMeleeId: triggerBridge?.ownershipMeleeId ?? null,
      inheritedDefenderToZeroFromBranch: triggerBridge?.inheritedDefenderToZeroFromBranch === true,
      immediateMultipleAttackTrigger: triggerBridge?.immediateMultipleAttackTrigger ?? null,
      branchCandidates: [],
    };
  };

  const attackerSupportAssignments = resolveMeleeSupportAssignments({
    units: allUnits,
    mainUnitId: input.attackerUnit?.id ?? null,
    ownerId: input.attackerUnit?.owner ?? null,
  });
  const defenderSupportAssignments = resolveMeleeSupportAssignments({
    units: allUnits,
    mainUnitId: input.defenderUnit?.id ?? null,
    ownerId: input.defenderUnit?.owner ?? null,
  });

  return {
    attackerSupportUnits: Array.isArray(attackerSupportAssignments.selected)
      ? attackerSupportAssignments.selected.map(createSupportPresentationEntry)
      : [],
    defenderSupportUnits: Array.isArray(defenderSupportAssignments.selected)
      ? defenderSupportAssignments.selected.map(createSupportPresentationEntry)
      : [],
    attackerModifierStages: derivedModifierStages.attackerModifierStages,
    defenderModifierStages: derivedModifierStages.defenderModifierStages,
    attackerCombatFactorValue: factorPreview.attacker.value,
    defenderCombatFactorValue: factorPreview.defender.value,
    attackerCombatFactorSourceStatus: factorPreview.attacker.sourceStatus,
    defenderCombatFactorSourceStatus: factorPreview.defender.sourceStatus,
    attackerCombatFactorProvenanceLabel: factorPreview.attacker.provenanceLabel,
    defenderCombatFactorProvenanceLabel: factorPreview.defender.provenanceLabel,
    combatFactorDebugOverrideEnabled: input.combatFactorDebugOverrideEnabled === true,
    attackerDerivedBranch: createBranchPresentation(
      input.attackerUnit,
      'attacker',
      input.attackerModifierContext?.flankRearBranch ?? null,
    ),
    defenderDerivedBranch: createBranchPresentation(
      input.defenderUnit,
      'defender',
      input.defenderModifierContext?.flankRearBranch ?? null,
    ),
    supportDiagnostics: [
      ...(Array.isArray(attackerSupportAssignments.diagnostics) ? attackerSupportAssignments.diagnostics : []),
      ...(Array.isArray(defenderSupportAssignments.diagnostics) ? defenderSupportAssignments.diagnostics : []),
    ],
  };
}

function getBaseV2ProcedurePresentation(gameState) {
  const meleeState = gameState?.melee ?? createInitialMeleeState();
  const allUnits = Array.isArray(gameState?.units) ? gameState.units : [];
  const eligibleEntries = getV2EligibleEntries(gameState);
  const eligibleById = new Map(eligibleEntries.map((entry) => [entry.id, entry]));
  const queueSelectionIds = (Array.isArray(meleeState?.queueSelectionIds) ? meleeState.queueSelectionIds : [])
    .filter((id) => eligibleById.has(id));
  const resolvedMeleeIds = Array.isArray(meleeState?.resolvedMeleeIds) ? meleeState.resolvedMeleeIds : [];
  const mainUnitIds = new Set();
  const roleSummary = summarizeMeleeContactRoles(allUnits);
  for (const entry of eligibleEntries) {
    mainUnitIds.add(entry.attackerUnitId);
    mainUnitIds.add(entry.defenderUnitId);
  }

  return {
    status: meleeState.status,
    eligibleEntries,
    queueSelectionIds,
    queue: Array.isArray(meleeState?.queue) ? meleeState.queue : [],
    batchPreview: meleeState.batchPreview ?? null,
    batchApplicationPlan: meleeState.batchApplicationPlan ?? null,
    diagnostics: Array.isArray(meleeState?.diagnostics) ? meleeState.diagnostics : [],
    resolutionDraft: meleeState.resolutionDraft
      ? {
          ...meleeState.resolutionDraft,
          factorPresentation: createDraftFactorPresentation(meleeState.resolutionDraft),
        }
      : null,
    resolvedEntriesByMeleeId: meleeState.resolvedEntriesByMeleeId ?? {},
    resolvedMeleeIds,
    batchSummary: meleeState.batchSummary ?? null,
    overview: {
      eligibleMelees: eligibleEntries.length,
      selectedMelees: queueSelectionIds.length,
      resolvedMelees: resolvedMeleeIds.length,
      unresolvedMelees: Math.max(0, queueSelectionIds.length - resolvedMeleeIds.length),
      previewedMelees: Array.isArray(meleeState?.batchPreview?.resolvedEntries)
        ? meleeState.batchPreview.resolvedEntries.length
        : 0,
      sourceOpenPreviews: Array.isArray(meleeState?.batchPreview?.resolvedEntries)
        ? meleeState.batchPreview.resolvedEntries.filter((entry) => entry?.resolution?.status === MELEE_RESOLUTION_STATUSES.SOURCE_OPEN).length
        : 0,
      mainUnits: mainUnitIds.size,
      supportUnits: roleSummary.counts.simpleSupportUnits + roleSummary.counts.meleeSupportUnits,
      sourceOpenUnits: roleSummary.entries.filter((entry) => entry?.sourceStatus !== 'verified').length,
    },
    involvedUnitIds: [...mainUnitIds],
  };
}

function chooseMainAttackerCandidate({ candidates, unitById, contactByMeleeId }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return {
      selectedMeleeId: null,
      reason: 'no-candidates',
      usedFallback: true,
      sourceStatus: 'source-open',
    };
  }

  const withEvidence = candidates.map((entry) => {
    const attackerUnit = unitById.get(entry?.attackerUnitId) ?? null;
    const contact = contactByMeleeId.get(entry?.id) ?? null;
    const contactType = contact?.attackContactType ?? null;
    const conformationApplied = attackerUnit?.conformationApplied === true;
    return {
      entry,
      contactType,
      conformationApplied,
    };
  });

  const frontConformed = withEvidence
    .filter((candidate) => candidate.contactType === 'front' && candidate.conformationApplied)
    .sort((left, right) => String(left.entry?.id ?? '').localeCompare(String(right.entry?.id ?? '')));
  if (frontConformed.length > 0) {
    return {
      selectedMeleeId: frontConformed[0].entry.id,
      reason: 'front-main-priority-conformed',
      usedFallback: false,
      sourceStatus: 'verified',
    };
  }

  const frontAny = withEvidence
    .filter((candidate) => candidate.contactType === 'front')
    .sort((left, right) => String(left.entry?.id ?? '').localeCompare(String(right.entry?.id ?? '')));
  const flankRearConformed = withEvidence
    .filter((candidate) => (candidate.contactType === 'flank' || candidate.contactType === 'rear') && candidate.conformationApplied)
    .sort((left, right) => String(left.entry?.id ?? '').localeCompare(String(right.entry?.id ?? '')));

  if (frontAny.length > 0 && flankRearConformed.length > 0) {
    return {
      selectedMeleeId: flankRearConformed[0].entry.id,
      reason: 'front-not-fully-conformed-exception',
      usedFallback: false,
      sourceStatus: 'source-open',
    };
  }

  if (frontAny.length > 0) {
    return {
      selectedMeleeId: frontAny[0].entry.id,
      reason: 'front-main-priority-unverified-conformation',
      usedFallback: false,
      sourceStatus: 'source-open',
    };
  }

  const flankRearAny = withEvidence
    .filter((candidate) => candidate.contactType === 'flank' || candidate.contactType === 'rear')
    .sort((left, right) => String(left.entry?.id ?? '').localeCompare(String(right.entry?.id ?? '')));
  if (flankRearAny.length > 0) {
    return {
      selectedMeleeId: flankRearAny[0].entry.id,
      reason: 'only-flank-rear-attackers',
      usedFallback: false,
      sourceStatus: 'source-open',
    };
  }

  const fallback = [...withEvidence].sort((left, right) => String(left.entry?.id ?? '').localeCompare(String(right.entry?.id ?? '')))[0];
  return {
    selectedMeleeId: fallback?.entry?.id ?? null,
    reason: 'fallback-lexicographic-default',
    usedFallback: true,
    sourceStatus: 'source-open',
  };
}

function applyV2MainAttackerPrioritization({ gameState, basePresentation, seam }) {
  const queueSelectionIds = Array.isArray(gameState?.melee?.queueSelectionIds)
    ? gameState.melee.queueSelectionIds
    : [];
  const eligibleEntries = Array.isArray(basePresentation?.eligibleEntries)
    ? basePresentation.eligibleEntries
    : [];
  const entryById = new Map(eligibleEntries.map((entry) => [entry?.id, entry]));
  const unitById = createUnitMap(gameState);
  const contactByMeleeId = new Map((seam?.contactModel?.contacts ?? []).map((contact) => [contact?.meleeId, contact]));

  const byDefender = new Map();
  for (const entry of eligibleEntries) {
    const defenderId = entry?.defenderUnitId ?? null;
    if (!defenderId) {
      continue;
    }
    if (!byDefender.has(defenderId)) {
      byDefender.set(defenderId, []);
    }
    byDefender.get(defenderId).push(entry);
  }

  const selectedByDefender = new Map();
  const prioritizationDiagnostics = [];
  for (const [defenderUnitId, candidates] of byDefender.entries()) {
    if (!Array.isArray(candidates) || candidates.length <= 1) {
      continue;
    }
    const selection = chooseMainAttackerCandidate({
      candidates,
      unitById,
      contactByMeleeId,
    });
    if (!selection.selectedMeleeId) {
      continue;
    }
    selectedByDefender.set(defenderUnitId, selection.selectedMeleeId);
    prioritizationDiagnostics.push({
      code: selection.usedFallback
        ? 'melee.v2.main-attacker-priority-fallback'
        : 'melee.v2.main-attacker-priority-applied',
      severity: selection.usedFallback ? 'warning' : 'info',
      sourceStatus: selection.sourceStatus,
      defenderUnitId,
      selectedMeleeId: selection.selectedMeleeId,
      reason: selection.reason,
    });
  }

  if (prioritizationDiagnostics.length === 0) {
    prioritizationDiagnostics.push({
      code: 'melee.v2.main-attacker-priority-no-conflict',
      severity: 'info',
      sourceStatus: 'verified',
      message: 'No multi-attacker defender group detected; V2 main-attacker prioritization seam remains active but did not need arbitration.',
    });
  }

  const indexedQueue = queueSelectionIds.map((id, index) => ({ id, index, entry: entryById.get(id) ?? null }));
  indexedQueue.sort((left, right) => {
    const leftDefender = left.entry?.defenderUnitId ?? null;
    const rightDefender = right.entry?.defenderUnitId ?? null;
    const leftPreferred = leftDefender && selectedByDefender.get(leftDefender) === left.id ? 0 : 1;
    const rightPreferred = rightDefender && selectedByDefender.get(rightDefender) === right.id ? 0 : 1;
    if (leftPreferred !== rightPreferred) {
      return leftPreferred - rightPreferred;
    }
    return left.index - right.index;
  });

  return {
    queueSelectionIds: indexedQueue.map((item) => item.id),
    prioritizationDiagnostics,
  };
}

export function getMeleeProcedurePresentation(gameState) {
  const basePresentation = getBaseV2ProcedurePresentation(gameState);
  const seam = getV2DecisionSeam({ gameState, basePresentation });
  const prioritized = applyV2MainAttackerPrioritization({
    gameState,
    basePresentation,
    seam,
  });
  const seamDiagnostics = seam.wrapperFallbackUsed
    ? [{
        code: 'melee.v2.contact-role-fallback-source-open',
        severity: 'warning',
        sourceStatus: 'source-open',
        sourceOpenUnitIds: seam.sourceOpenUnitIds,
      }]
    : [{
        code: 'melee.v2.contact-role-seam-source-closed',
        severity: 'info',
        sourceStatus: 'verified',
      }];

  return {
    ...basePresentation,
    queueSelectionIds: prioritized.queueSelectionIds,
    diagnostics: [
      ...(Array.isArray(basePresentation.diagnostics) ? basePresentation.diagnostics : []),
      ...seamDiagnostics,
      ...(Array.isArray(prioritized.prioritizationDiagnostics) ? prioritized.prioritizationDiagnostics : []),
      ...(Array.isArray(seam.contactModel?.diagnostics) ? seam.contactModel.diagnostics : []),
      ...(Array.isArray(seam.roleAssignments?.diagnostics) ? seam.roleAssignments.diagnostics : []),
    ],
    v2: {
      decisionLaneOwner: seam.decisionLaneOwner,
      wrapperFallbackUsed: seam.wrapperFallbackUsed,
      sourceOpenUnitIds: seam.sourceOpenUnitIds,
      contactModelSourceStatus: seam.contactModel.sourceStatus,
      roleAssignmentSourceStatus: seam.roleAssignments.sourceStatus,
    },
  };
}

function getV2DecisionSeam({ gameState, basePresentation }) {
  const contactModel = createMeleeV2ContactModel({ gameState, presentation: basePresentation });
  const roleAssignments = assignMeleeV2Roles({ contactModel, gameState });
  const sourceOpenUnitIds = new Set();

  for (const contact of contactModel.contacts ?? []) {
    if (contact?.sourceStatus !== 'verified') {
      if (contact.attackerUnitId) {
        sourceOpenUnitIds.add(contact.attackerUnitId);
      }
      if (contact.defenderUnitId) {
        sourceOpenUnitIds.add(contact.defenderUnitId);
      }
    }
  }

  for (const assignment of roleAssignments.assignments ?? []) {
    if (assignment?.sourceStatus !== 'verified' && assignment.attackerUnitId) {
      sourceOpenUnitIds.add(assignment.attackerUnitId);
    }
  }

  const wrapperFallbackUsed = sourceOpenUnitIds.size > 0;

  return {
    contactModel,
    roleAssignments,
    sourceOpenUnitIds: [...sourceOpenUnitIds],
    wrapperFallbackUsed,
    decisionLaneOwner: 'v2-contact-role-seam',
  };
}

function getV2BatchRuntime({ gameState, basePresentation }) {
  const seam = getV2DecisionSeam({ gameState, basePresentation });
  const activeFightSet = buildV2ActiveFightSet({
    contactModel: seam.contactModel,
    eligibleEntries: basePresentation?.eligibleEntries,
  });
  const queueSelectionIds = Array.isArray(gameState?.melee?.queueSelectionIds)
    ? gameState.melee.queueSelectionIds
    : [];
  const queueBuild = buildV2MeleeBatchQueue({
    activeFightSet,
    selectedMeleeIds: queueSelectionIds,
  });
  const previewBuild = buildV2MeleeBatchPreview({
    queue: queueBuild.queue,
    resolvedEntriesByMeleeId: gameState?.melee?.resolvedEntriesByMeleeId,
  });

  return {
    seam,
    activeFightSet,
    queueBuild,
    previewBuild,
  };
}

function withV2MeleeState(gameState) {
  if (!gameState || typeof gameState !== 'object') {
    return gameState;
  }

  const meleeState = gameState.melee && typeof gameState.melee === 'object'
    ? gameState.melee
    : createInitialMeleeState();

  const basePresentation = getMeleeProcedurePresentation(gameState);
  const seam = getV2DecisionSeam({ gameState, basePresentation });
  const lifecycleStatus = deriveV2LifecycleStatus(meleeState);
  const outcomeBuckets = deriveOutcomeBuckets(meleeState, lifecycleStatus);

  return {
    ...gameState,
    melee: {
      ...meleeState,
      engineVersion: MELEE_V2_ENGINE_VERSION,
      sourceStatus: meleeState.sourceStatus ?? 'source-open',
      v2: {
        ...(meleeState.v2 ?? {}),
        contactModelVersion: MELEE_V2_CONTACT_MODEL_VERSION,
        roleAssignmentVersion: MELEE_V2_ROLE_ASSIGNMENT_VERSION,
        contactModelSourceStatus: seam.contactModel.sourceStatus,
        roleAssignmentSourceStatus: seam.roleAssignments.sourceStatus,
        decisionLaneOwner: seam.decisionLaneOwner,
        wrapperFallbackUsed: seam.wrapperFallbackUsed,
        sourceOpenUnitIds: seam.sourceOpenUnitIds,
        sourceOpenUnitCount: seam.sourceOpenUnitIds.length,
        lifecycleStatus,
        pendingResolvedEntriesByMeleeId: outcomeBuckets.pendingResolvedEntriesByMeleeId,
        committedResolvedEntriesByMeleeId: outcomeBuckets.committedResolvedEntriesByMeleeId,
        pendingMeleeIds: outcomeBuckets.pendingMeleeIds,
        committedMeleeIds: outcomeBuckets.committedMeleeIds,
      },
    },
  };
}

export function createInitialMeleeState(overrides = {}) {
  return {
    status: overrides.status ?? MELEE_PROCEDURE_STATUSES.IDLE,
    phaseId: overrides.phaseId ?? 'melee',
    actingPlayerId: overrides.actingPlayerId ?? null,
    queueSelectionIds: Array.isArray(overrides.queueSelectionIds) ? [...overrides.queueSelectionIds] : [],
    queue: Array.isArray(overrides.queue) ? [...overrides.queue] : [],
    batchPreview: overrides.batchPreview ?? null,
    batchApplicationPlan: overrides.batchApplicationPlan ?? null,
    diagnostics: Array.isArray(overrides.diagnostics) ? [...overrides.diagnostics] : [],
    isDialogOpen: overrides.isDialogOpen ?? false,
    resolutionDraft: overrides.resolutionDraft ?? null,
    resolvedEntriesByMeleeId: overrides.resolvedEntriesByMeleeId ?? {},
    resolvedMeleeIds: Array.isArray(overrides.resolvedMeleeIds) ? [...overrides.resolvedMeleeIds] : [],
    roundStateByMeleeId: normalizePersistedRoundStateMap(overrides.roundStateByMeleeId),
    commanderEngagementHistoryByMeleeId: normalizePersistedCommanderEngagementHistoryMap(
      overrides.commanderEngagementHistoryByMeleeId,
    ),
    batchSummary: overrides.batchSummary ?? null,
    resolutionPreview: overrides.resolutionPreview ?? null,
    engineVersion: MELEE_V2_ENGINE_VERSION,
    sourceStatus: overrides.sourceStatus ?? 'source-open',
    v2: {
      ...(overrides.v2 ?? {}),
      contactModelVersion: MELEE_V2_CONTACT_MODEL_VERSION,
      roleAssignmentVersion: MELEE_V2_ROLE_ASSIGNMENT_VERSION,
      contactModelSourceStatus: 'source-open',
      roleAssignmentSourceStatus: 'source-open',
      lifecycleStatus: MELEE_V2_LIFECYCLE_STATUSES.IDLE,
      pendingResolvedEntriesByMeleeId: {},
      committedResolvedEntriesByMeleeId: {},
      pendingMeleeIds: [],
      committedMeleeIds: [],
    },
  };
}

export function getMeleeRolePresentation(gameState) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  return summarizeMeleeContactRoles(units);
}

function getEligibleEntriesFromPresentation(gameState) {
  const presentation = getMeleeProcedurePresentation(gameState);
  return Array.isArray(presentation?.eligibleEntries) ? presentation.eligibleEntries : [];
}

function resolveLookupUnitId(gameState, unitId) {
  if (!unitId) {
    return null;
  }

  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  const selectedUnit = units.find((unit) => unit?.id === unitId) ?? null;
  if (selectedUnit?.isCommander === true && selectedUnit?.attachedUnitId) {
    return selectedUnit.attachedUnitId;
  }

  return unitId;
}

function hasReciprocalCommanderLink(hostUnit, commanderUnit) {
  return Boolean(hostUnit?.id && commanderUnit?.id)
    && hostUnit.attachedCommanderId === commanderUnit.id
    && commanderUnit.attachedUnitId === hostUnit.id;
}

function resolveDraftEntry(gameState, { meleeId = null, unitId = null } = {}) {
  const basePresentation = getBaseV2ProcedurePresentation(gameState);
  const runtime = getV2BatchRuntime({ gameState, basePresentation });
  const activeEntries = Array.isArray(runtime?.activeFightSet?.entries)
    ? runtime.activeFightSet.entries
    : [];
  const eligibleEntries = getEligibleEntriesFromPresentation(gameState);
  const allEntries = activeEntries.length > 0 ? activeEntries : eligibleEntries;
  if (meleeId) {
    return allEntries.find((entry) => entry?.id === meleeId) ?? null;
  }

  const lookupUnitId = resolveLookupUnitId(gameState, unitId);
  if (!lookupUnitId) {
    return null;
  }

  return allEntries.find((entry) => (
    entry?.attackerUnitId === lookupUnitId
    || entry?.defenderUnitId === lookupUnitId
    || (Array.isArray(entry?.combatGroupAttackerUnitIds) && entry.combatGroupAttackerUnitIds.includes(lookupUnitId))
  )) ?? null;
}

function normalizeSupportSide(side) {
  const normalized = String(side ?? '').trim().toLowerCase();
  return normalized || 'unspecified';
}

function normalizeMeleeRoundStateForDraft(value) {
  return String(value ?? '').trim().toLowerCase() === 'continuing'
    ? 'continuing'
    : 'first-contact';
}

function createSupportModifierEntries(assignments, side, opponentMainUnit = null) {
  const selected = Array.isArray(assignments?.selected)
    ? assignments.selected
    : [];
  const meleeSupportSides = new Set(
    selected
      .filter((entry) => entry?.classification?.role === 'melee-support')
      .map((entry) => normalizeSupportSide(entry?.classification?.contactSide)),
  );
  const displacedSimpleSupports = selected.filter((entry) => (
    entry?.classification?.role === 'simple-support'
      && meleeSupportSides.has(normalizeSupportSide(entry?.classification?.contactSide))
  ));
  const effectiveEntries = selected.filter((entry) => !(
    entry?.classification?.role === 'simple-support'
      && meleeSupportSides.has(normalizeSupportSide(entry?.classification?.contactSide))
  ));

  const entries = effectiveEntries.map((entry) => {
    const role = String(entry?.classification?.role ?? '').trim().toLowerCase();
    const supportFactorPreview = resolveMeleeCombatFactorPreview({
      attackerUnit: entry?.unit ?? null,
      defenderUnit: opponentMainUnit ?? null,
    });
    const supportCombatFactorValue = Number.isFinite(supportFactorPreview?.attacker?.value)
      ? Number(supportFactorPreview.attacker.value)
      : 0;
    const sourceStatus = role === 'melee-support'
      ? (entry?.sourceStatus === 'verified' && supportFactorPreview?.attacker?.sourceStatus === 'verified'
          ? 'verified'
          : 'needs-source-check')
      : (entry?.sourceStatus === 'verified' ? 'verified' : 'needs-source-check');

    return {
      code: `melee.v2.support.${role}.${side}.${entry?.unit?.id ?? 'unknown'}`,
      label: role === 'melee-support'
        ? 'Melee support bonus (combat factor +1)'
        : 'Simple support bonus',
      stage: MELEE_MODIFIER_STAGES.SUPPORT,
      value: role === 'melee-support' ? supportCombatFactorValue + 1 : 1,
      sourceStatus,
    };
  });

  const diagnostics = displacedSimpleSupports.map((entry) => ({
    code: 'melee.support.simple-support-displaced-by-melee-support',
    severity: 'info',
    message: `Simple support '${entry?.unit?.id ?? 'unknown'}' on side '${normalizeSupportSide(entry?.classification?.contactSide)}' is not counted because melee support occupies the same side support slot.`,
    side,
    supportUnitId: entry?.unit?.id ?? null,
    supportRole: 'simple-support',
    displacedByRole: 'melee-support',
    contactSide: normalizeSupportSide(entry?.classification?.contactSide),
    sourceStatus: 'verified',
  }));

  return {
    entries,
    diagnostics,
  };
}

function createDraftModifierContext({
  branch = null,
  branchSourceStatus = null,
  commanderPresence = null,
} = {}) {
  const branchContext = branch && typeof branch === 'object'
    ? {
        ...branch,
        sourceStatus: branchSourceStatus ?? branch.sourceStatus ?? 'source-open',
      }
    : null;
  const attackContactType = normalizeText(branchContext?.attackContactType);
  const flankOrRearAttack = attackContactType === 'flank'
    || attackContactType === 'rear'
    || attackContactType === 'rear-or-flank';

  return {
    sourceStatus: flankOrRearAttack
      ? (branchContext?.sourceStatus ?? 'source-open')
      : (commanderPresence?.sourceStatus ?? 'verified'),
    flankOrRearAttack,
    flankRearBranch: branchContext,
    engagedCommander: commanderPresence ?? {
      status: 'none',
      sourceStatus: 'verified',
      commanderUnitId: null,
      hostUnitId: null,
    },
  };
}

function createCommanderDraftEngagementState({
  commanderPresence = null,
  meleeRoundState = 'first-contact',
  requestedEngaged = null,
  priorEngaged = false,
} = {}) {
  const presence = commanderPresence && typeof commanderPresence === 'object'
    ? commanderPresence
    : {
        status: 'none',
        sourceStatus: 'verified',
        commanderUnitId: null,
        hostUnitId: null,
      };
  const status = String(presence.status ?? 'none').trim().toLowerCase();
  const participationHint = String(presence.participation ?? '').trim().toLowerCase();
  const hasPresenceParticipationHint = participationHint === MELEE_V2_COMMANDER_PRESENCE_STATUSES.ATTACHED
    || participationHint === MELEE_V2_COMMANDER_PRESENCE_STATUSES.INCLUDED
    || participationHint === MELEE_V2_COMMANDER_PRESENCE_STATUSES.SUPPORT_ONLY;
  const normalizedPresenceStatus = (status === 'none'
      || status === 'engaged-main-unit'
      || status === 'support-only-main-unit')
    && hasPresenceParticipationHint
    ? participationHint
    : status;
  const normalizedRoundState = normalizeMeleeRoundStateForDraft(meleeRoundState);
  const hasPriorEngaged = priorEngaged === true;
  const isEligibleOptional = normalizedPresenceStatus === MELEE_V2_COMMANDER_PRESENCE_STATUSES.ATTACHED
    || normalizedPresenceStatus === MELEE_V2_COMMANDER_PRESENCE_STATUSES.INCLUDED;
  const isContinuingLocked = isEligibleOptional
    && normalizedRoundState === 'continuing'
    && hasPriorEngaged;
  const isEngaged = isEligibleOptional
    ? (isContinuingLocked ? true : requestedEngaged === true)
    : false;

  if (normalizedPresenceStatus === MELEE_V2_COMMANDER_PRESENCE_STATUSES.SUPPORT_ONLY) {
    return {
      status: 'support-only',
      participation: 'support-only',
      supportOnly: true,
      sourceStatus: presence.sourceStatus ?? 'verified',
      commanderUnitId: presence.commanderUnitId ?? null,
      hostUnitId: presence.hostUnitId ?? null,
      isEngaged: false,
      isToggleVisible: false,
      isToggleLocked: true,
      toggleLockReason: 'support-only-commander-lane',
    };
  }

  return {
    status: isEngaged ? 'engaged-main-unit' : 'none',
    participation: isEligibleOptional ? normalizedPresenceStatus : 'none',
    supportOnly: false,
    sourceStatus: presence.sourceStatus ?? 'verified',
    commanderUnitId: presence.commanderUnitId ?? null,
    hostUnitId: presence.hostUnitId ?? null,
    isEngaged,
    isToggleVisible: isEligibleOptional,
    isToggleLocked: isContinuingLocked,
    priorEngaged: hasPriorEngaged,
    meleeRoundState: normalizedRoundState,
    toggleLockReason: isContinuingLocked ? 'continuing-round-auto-lock' : null,
  };
}

function createCommanderContinuingSourceOpenDiagnostics({
  meleeId = null,
  side = 'attacker',
  commanderEngagement = null,
  meleeRoundState = 'first-contact',
} = {}) {
  const normalizedRoundState = normalizeMeleeRoundStateForDraft(meleeRoundState);
  if (normalizedRoundState !== 'continuing') {
    return [];
  }

  if (!commanderEngagement || commanderEngagement.isToggleVisible !== true) {
    return [];
  }

  if (normalizeMeleeSourceStatus(commanderEngagement.sourceStatus) === 'verified') {
    return [];
  }

  return [{
    code: 'melee.v2.commander-continuing-lock-source-open',
    severity: 'info',
    sourceStatus: 'source-open',
    meleeId,
    side,
    priorEngaged: commanderEngagement.priorEngaged === true,
    isToggleLocked: commanderEngagement.isToggleLocked === true,
    relatedOpenVerificationIds: [
      'command.commander-attach-detach-legality',
      'command.commander-detach-combat-lock-timing',
    ],
  }];
}

function normalizeBranchForResolver(branch = null, fallbackSourceStatus = null) {
  if (!branch || typeof branch !== 'object') {
    return null;
  }

  const sourceStatus = branch.sourceStatus ?? fallbackSourceStatus ?? 'source-open';
  const cancelAttackSituationBonus = branch.cancelAttackSituationBonus === true
    || branch.cancellationRequested === true;
  const applyDefenderCombatFactorToZero = branch.applyDefenderCombatFactorToZero === true
    || (branch.defenderFactorToZeroEligible === true && sourceStatus === 'verified');

  return {
    ...branch,
    sourceStatus,
    cancelAttackSituationBonus,
    applyDefenderCombatFactorToZero,
  };
}

function resolveDefenderCentricBranchAggregation(entry, baseInput) {
  const allUnits = Array.isArray(entry?.allUnits) ? entry.allUnits : [];
  const defenderMainUnitId = String(baseInput?.defenderUnit?.id ?? '').trim();
  if (!defenderMainUnitId) {
    return null;
  }

  const groupedAttackerUnits = [
    baseInput?.attackerUnit ?? null,
    ...(Array.isArray(baseInput?.additionalAttackerUnits) ? baseInput.additionalAttackerUnits : []),
  ].filter((unit) => unit?.id);
  if (groupedAttackerUnits.length === 0) {
    return null;
  }

  const ownershipCandidates = groupedAttackerUnits
    .map((attackerUnit) => {
      const lane = buildV2FlankRearModifierLane({
        attackerUnit,
        defenderUnitId: defenderMainUnitId,
      });
      return {
        attackerUnit,
        branch: normalizeBranchForResolver(lane?.branch ?? null),
      };
    })
    .filter((candidate) => candidate?.branch?.applyDefenderCombatFactorToZero === true)
    .sort((left, right) => String(left?.attackerUnit?.id ?? '').localeCompare(String(right?.attackerUnit?.id ?? '')));

  const owner = ownershipCandidates[0] ?? null;
  if (!owner) {
    return null;
  }

  const mainAttackerUnitId = String(baseInput?.attackerUnit?.id ?? '').trim();
  const inherited = owner.attackerUnit.id !== mainAttackerUnitId;

  return {
    ...owner.branch,
    sourceStatus: owner.branch?.sourceStatus ?? 'verified',
    applyDefenderCombatFactorToZero: true,
    inheritedDefenderToZeroFromBranch: inherited,
    ownershipSource: 'defender-centric-aggregation',
    ownershipMeleeId: `${owner.attackerUnit.id}__${defenderMainUnitId}`,
    ownershipAttackerUnitId: owner.attackerUnit.id,
    ownershipAttackContactType: owner.branch?.attackContactType ?? null,
    allCandidateAttackerUnitIds: groupedAttackerUnits.map((unit) => unit.id),
  };
}

function createHydratedResolutionInput(entry) {
  const baseInput = {
    ...(entry?.resolutionInput ?? {}),
  };
  const allUnits = Array.isArray(entry?.allUnits)
    ? entry.allUnits
    : [];
  const attackerMainUnit = baseInput.attackerUnit ?? null;
  const defenderMainUnit = baseInput.defenderUnit ?? null;
  const attackerSupportAssignments = resolveMeleeSupportAssignments({
    units: allUnits,
    mainUnitId: attackerMainUnit?.id ?? null,
    ownerId: attackerMainUnit?.owner ?? null,
  });
  const defenderSupportAssignments = resolveMeleeSupportAssignments({
    units: allUnits,
    mainUnitId: defenderMainUnit?.id ?? null,
    ownerId: defenderMainUnit?.owner ?? null,
  });
  const attackerSupportModifierEntries = createSupportModifierEntries(
    attackerSupportAssignments,
    'attacker',
    defenderMainUnit,
  );
  const defenderSupportModifierEntries = createSupportModifierEntries(
    defenderSupportAssignments,
    'defender',
    attackerMainUnit,
  );

  const attackerModifierEntries = Array.isArray(baseInput.attackerModifierEntries)
    && baseInput.attackerModifierEntries.length > 0
    ? [...baseInput.attackerModifierEntries]
    : attackerSupportModifierEntries.entries;
  const defenderModifierEntries = Array.isArray(baseInput.defenderModifierEntries)
    && baseInput.defenderModifierEntries.length > 0
    ? [...baseInput.defenderModifierEntries]
    : defenderSupportModifierEntries.entries;
  const persistedRoundState = normalizeMeleeRoundStateForDraft(entry?.persistedRoundState);
  const meleeRoundState = normalizeMeleeRoundStateForDraft(baseInput.meleeRoundState ?? persistedRoundState);
  const priorCommanderEngagement = entry?.priorCommanderEngagement
    && typeof entry.priorCommanderEngagement === 'object'
    ? entry.priorCommanderEngagement
    : {};
  const attackerCommanderPresence = entry?.v2AttackerCommanderPresence
    ?? baseInput?.attackerModifierContext?.engagedCommander
    ?? null;
  const defenderCommanderPresence = entry?.v2DefenderCommanderPresence
    ?? baseInput?.defenderModifierContext?.engagedCommander
    ?? null;
  const attackerCommanderEngagement = createCommanderDraftEngagementState({
    commanderPresence: attackerCommanderPresence,
    meleeRoundState,
    requestedEngaged: baseInput.attackerCommanderEngaged,
    priorEngaged: priorCommanderEngagement.attacker === true,
  });
  const defenderCommanderEngagement = createCommanderDraftEngagementState({
    commanderPresence: defenderCommanderPresence,
    meleeRoundState,
    requestedEngaged: baseInput.defenderCommanderEngaged,
    priorEngaged: priorCommanderEngagement.defender === true,
  });
  const aggregatedBranch = resolveDefenderCentricBranchAggregation(entry, baseInput);
  const attackerBranch = normalizeBranchForResolver(
    aggregatedBranch
      ?? entry?.v2FlankRearBranch
      ?? baseInput?.attackerModifierContext?.flankRearBranch
      ?? null,
    entry?.v2FlankRearSourceStatus,
  );
  const defenderBranch = normalizeBranchForResolver(
    baseInput?.defenderModifierContext?.flankRearBranch ?? null,
    baseInput?.defenderModifierContext?.flankRearBranch?.sourceStatus ?? null,
  );

  return {
    resolutionInput: {
      ...baseInput,
      attackerDieRoll: Number(baseInput.attackerDieRoll ?? 4),
      defenderDieRoll: Number(baseInput.defenderDieRoll ?? 4),
      attackerModifierEntries,
      defenderModifierEntries,
      attackerModifierContext: createDraftModifierContext({
        branch: attackerBranch,
        branchSourceStatus: entry?.v2FlankRearSourceStatus,
        commanderPresence: attackerCommanderEngagement,
      }),
      defenderModifierContext: createDraftModifierContext({
        branch: defenderBranch,
        branchSourceStatus: baseInput?.defenderModifierContext?.flankRearBranch?.sourceStatus ?? null,
        commanderPresence: defenderCommanderEngagement,
      }),
      meleeRoundState,
      attackerCommanderEngaged: attackerCommanderEngagement.isEngaged === true,
      defenderCommanderEngaged: defenderCommanderEngagement.isEngaged === true,
      combatFactorDebugOverrideEnabled: baseInput.combatFactorDebugOverrideEnabled === true,
    },
    diagnostics: [
      ...(Array.isArray(entry?.v2FlankRearDiagnostics) ? entry.v2FlankRearDiagnostics : []),
      ...(Array.isArray(attackerSupportAssignments?.diagnostics) ? attackerSupportAssignments.diagnostics : []),
      ...(Array.isArray(defenderSupportAssignments?.diagnostics) ? defenderSupportAssignments.diagnostics : []),
      ...attackerSupportModifierEntries.diagnostics,
      ...defenderSupportModifierEntries.diagnostics,
      ...(aggregatedBranch?.inheritedDefenderToZeroFromBranch === true
        ? [{
            code: 'melee.flank-rear.to-zero-defender-aggregation-applied',
            severity: 'info',
            sourceStatus: 'verified',
            attackerUnitId: baseInput?.attackerUnit?.id ?? null,
            defenderUnitId: baseInput?.defenderUnit?.id ?? null,
            ownershipAttackerUnitId: aggregatedBranch.ownershipAttackerUnitId,
            ownershipMeleeId: aggregatedBranch.ownershipMeleeId,
          }]
        : []),
      ...createCommanderContinuingSourceOpenDiagnostics({
        meleeId: entry?.id ?? null,
        side: 'attacker',
        commanderEngagement: attackerCommanderEngagement,
        meleeRoundState,
      }),
      ...createCommanderContinuingSourceOpenDiagnostics({
        meleeId: entry?.id ?? null,
        side: 'defender',
        commanderEngagement: defenderCommanderEngagement,
        meleeRoundState,
      }),
    ],
  };
}

function createV2ResolutionDraft(entry, {
  persistedRoundState = 'first-contact',
  priorCommanderEngagement = null,
} = {}) {
  const resolutionInputSeed = {
    ...(entry?.resolutionInput ?? {}),
    meleeRoundState: normalizeMeleeRoundStateForDraft(entry?.resolutionInput?.meleeRoundState ?? persistedRoundState),
  };
  const hydrated = createHydratedResolutionInput({
    ...entry,
    resolutionInput: resolutionInputSeed,
    persistedRoundState,
    priorCommanderEngagement,
  });
  const resolutionInput = hydrated.resolutionInput;

  return {
    meleeId: entry?.id ?? null,
    attackerUnitId: entry?.attackerUnitId ?? null,
    defenderUnitId: entry?.defenderUnitId ?? null,
    attackerLabel: entry?.resolutionInput?.attackerUnit?.scenarioLabel
      ?? entry?.resolutionInput?.attackerUnit?.id
      ?? 'Attacker',
    defenderLabel: entry?.resolutionInput?.defenderUnit?.scenarioLabel
      ?? entry?.resolutionInput?.defenderUnit?.id
      ?? 'Defender',
    allUnits: Array.isArray(entry?.allUnits) ? [...entry.allUnits] : [],
    persistedRoundState: normalizeMeleeRoundStateForDraft(persistedRoundState),
    priorCommanderEngagement: {
      attacker: priorCommanderEngagement?.attacker === true,
      defender: priorCommanderEngagement?.defender === true,
    },
    resolutionInput,
    diagnostics: hydrated.diagnostics,
  };
}

function createMeleeResolutionPreview(entry, resolution) {
  const attackerBreakdown = resolution?.breakdown?.attacker ?? null;
  const defenderBreakdown = resolution?.breakdown?.defender ?? null;
  const attackerStageLedger = attackerBreakdown?.stageLedger ?? null;
  const defenderStageLedger = defenderBreakdown?.stageLedger ?? null;

  const toNumberOrNull = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const deriveLedgerModifierSum = (ledger) => {
    if (!ledger || typeof ledger !== 'object') {
      return null;
    }

    const support = Number(ledger.support ?? 0);
    const flankRear = Number(ledger.flankRear ?? 0);
    const disorder = Number(ledger.disorder ?? 0);
    const residualSituation = Number(ledger?.residualModifierBreakdown?.situation ?? 0);
    const residualTerrain = Number(ledger?.residualModifierBreakdown?.terrain ?? 0);

    return support + flankRear + disorder + residualSituation + residualTerrain;
  };

  const deriveLedgerFinalTotal = (ledger, differentialBonus) => {
    if (!ledger || typeof ledger !== 'object') {
      return null;
    }

    const stageFinal = Number(ledger.final ?? 0);
    const residual = Number(ledger.residualModifierSum ?? 0);
    const differential = Number(differentialBonus ?? 0);
    return stageFinal + residual + differential;
  };

  return {
    meleeId: entry?.meleeId ?? entry?.id ?? null,
    attackerUnitId: entry?.attackerUnitId ?? null,
    defenderUnitId: entry?.defenderUnitId ?? null,
    attackerLabel: entry?.resolutionInput?.attackerUnit?.scenarioLabel
      ?? entry?.resolutionInput?.attackerUnit?.id
      ?? 'Attacker',
    defenderLabel: entry?.resolutionInput?.defenderUnit?.scenarioLabel
      ?? entry?.resolutionInput?.defenderUnit?.id
      ?? 'Defender',
    attackerDieRoll: Number(entry?.resolutionInput?.attackerDieRoll ?? 0),
    defenderDieRoll: Number(entry?.resolutionInput?.defenderDieRoll ?? 0),
    status: resolution?.status ?? 'source-open',
    result: resolution?.result ?? null,
    diagnostics: Array.isArray(resolution?.diagnostics) ? [...resolution.diagnostics] : [],
    factorRecap: {
      attacker: {
        baseCombatFactor: toNumberOrNull(attackerStageLedger?.base),
        modifierSum: deriveLedgerModifierSum(attackerStageLedger),
        finalTotal: deriveLedgerFinalTotal(attackerStageLedger, attackerBreakdown?.differentialBonus),
        stageLedger: attackerStageLedger,
      },
      defender: {
        baseCombatFactor: toNumberOrNull(defenderStageLedger?.base),
        modifierSum: deriveLedgerModifierSum(defenderStageLedger),
        finalTotal: deriveLedgerFinalTotal(defenderStageLedger, defenderBreakdown?.differentialBonus),
        stageLedger: defenderStageLedger,
      },
    },
    sourceStatus: resolution?.status === MELEE_RESOLUTION_STATUSES.RESOLVED
      ? 'verified'
      : 'source-open',
  };
}

export function getMeleeUnitStatus(gameState, unitId) {
  const lookupUnitId = resolveLookupUnitId(gameState, unitId);
  if (!lookupUnitId) {
    return MELEE_V2_PARTICIPATION_STATUSES.NON_MELEE;
  }

  const allUnits = Array.isArray(gameState?.units) ? gameState.units : [];
  const lookupUnit = allUnits.find((unit) => unit?.id === lookupUnitId) ?? null;
  const contactRole = resolveNormalizedContactRole(lookupUnit);
  if (contactRole === 'simple-support' || contactRole === 'melee-support') {
    if (contactRole === 'simple-support' && isDisplacedSimpleSupportUnit(gameState, lookupUnit)) {
      return 'non-melee';
    }

    return MELEE_V2_PARTICIPATION_STATUSES.SUPPORT_PARTICIPANT;
  }

  const presentation = getMeleeProcedurePresentation(gameState);
  const eligibleEntry = Array.isArray(presentation?.eligibleEntries)
    ? presentation.eligibleEntries.find((entry) => (
      entry?.attackerUnitId === lookupUnitId
      || entry?.defenderUnitId === lookupUnitId
      || (Array.isArray(entry?.combatGroupAttackerUnitIds) && entry.combatGroupAttackerUnitIds.includes(lookupUnitId))
    ))
    : null;

  if (!eligibleEntry) {
    return MELEE_V2_PARTICIPATION_STATUSES.NON_MELEE;
  }

  const resolvedMeleeIds = new Set(Array.isArray(gameState?.melee?.resolvedMeleeIds) ? gameState.melee.resolvedMeleeIds : []);
  return resolvedMeleeIds.has(eligibleEntry.id)
    ? MELEE_V2_PARTICIPATION_STATUSES.MAIN_DEFENDER_RESOLVED
    : MELEE_V2_PARTICIPATION_STATUSES.MAIN_DEFENDER_PENDING;
}

export function getMeleeCommanderPresence(gameState, unitId) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  const selectedUnit = units.find((unit) => unit?.id === unitId) ?? null;
  const lookupUnitId = resolveLookupUnitId(gameState, unitId);
  const lookupUnit = units.find((unit) => unit?.id === lookupUnitId) ?? null;

  if (!lookupUnit) {
    return {
      status: MELEE_V2_COMMANDER_PRESENCE_STATUSES.NONE,
      sourceStatus: 'verified',
      commanderUnitId: null,
      hostUnitId: null,
    };
  }

  if (lookupUnit.hasIncludedCommander === true) {
    return {
      status: MELEE_V2_COMMANDER_PRESENCE_STATUSES.INCLUDED,
      sourceStatus: 'verified',
      commanderUnitId: lookupUnit.id,
      hostUnitId: lookupUnit.id,
    };
  }

  const attachedCommanderId = String(lookupUnit.attachedCommanderId ?? '').trim();
  if (attachedCommanderId.length > 0) {
    const attachedCommanderUnit = units.find((unit) => unit?.id === attachedCommanderId) ?? null;
    return {
      status: MELEE_V2_COMMANDER_PRESENCE_STATUSES.ATTACHED,
      sourceStatus: attachedCommanderUnit?.isCommander === true && hasReciprocalCommanderLink(lookupUnit, attachedCommanderUnit)
        ? 'verified'
        : 'source-open',
      commanderUnitId: attachedCommanderId,
      hostUnitId: lookupUnit.id,
    };
  }

  const reverseAttachedCommander = units.find((unit) => (
    unit?.isCommander === true
    && String(unit?.attachedUnitId ?? '').trim() === lookupUnit.id
  )) ?? null;
  if (reverseAttachedCommander) {
    return {
      status: MELEE_V2_COMMANDER_PRESENCE_STATUSES.ATTACHED,
      sourceStatus: hasReciprocalCommanderLink(lookupUnit, reverseAttachedCommander)
        ? 'verified'
        : 'source-open',
      commanderUnitId: reverseAttachedCommander.id,
      hostUnitId: lookupUnit.id,
    };
  }

  const supportRole = resolveNormalizedContactRole(selectedUnit ?? lookupUnit);
  if ((selectedUnit ?? lookupUnit)?.isCommander === true
    && (supportRole === 'simple-support' || supportRole === 'melee-support')) {
    return {
      status: MELEE_V2_COMMANDER_PRESENCE_STATUSES.SUPPORT_ONLY,
      sourceStatus: 'verified',
      commanderUnitId: (selectedUnit ?? lookupUnit).id,
      hostUnitId: lookupUnit.id,
    };
  }

  return {
    status: MELEE_V2_COMMANDER_PRESENCE_STATUSES.NONE,
    sourceStatus: 'verified',
    commanderUnitId: null,
    hostUnitId: lookupUnit.id,
  };
}

export function getMeleeUnitParticipation(gameState, unitId) {
  const status = getMeleeUnitStatus(gameState, unitId);
  const isMainDefenderPending = status === MELEE_V2_PARTICIPATION_STATUSES.MAIN_DEFENDER_PENDING;
  const isMainDefenderResolved = status === MELEE_V2_PARTICIPATION_STATUSES.MAIN_DEFENDER_RESOLVED;
  const isMainParticipant = isMainDefenderPending || isMainDefenderResolved;
  const isSupportParticipant = status === MELEE_V2_PARTICIPATION_STATUSES.SUPPORT_PARTICIPANT;
  const commanderPresence = getMeleeCommanderPresence(gameState, unitId);

  return {
    status,
    commanderPresence,
    isMainDefenderPending,
    isMainDefenderResolved,
    isMainParticipant,
    isSupportParticipant,
    isNonMelee: status === MELEE_V2_PARTICIPATION_STATUSES.NON_MELEE,
    isSelectableInBattlefield: isMainParticipant,
    canStartResolutionDraft: isMainDefenderPending,
  };
}

export function getMeleeParticipationByUnitId(gameState) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  const participationByUnitId = new Map();

  for (const unit of units) {
    if (!unit?.id) {
      continue;
    }

    participationByUnitId.set(unit.id, getMeleeUnitParticipation(gameState, unit.id));
  }

  return participationByUnitId;
}

export function beginMeleePhaseState(gameState, overrides = {}) {
  return withV2MeleeState({
    ...gameState,
    melee: createInitialMeleeState({
      ...gameState?.melee,
      status: MELEE_PROCEDURE_STATUSES.ANNOUNCED,
      phaseId: overrides.phaseId ?? 'melee',
      actingPlayerId: overrides.actingPlayerId ?? gameState?.commandContext?.activePlayerId ?? null,
    }),
  });
}

export function acknowledgeMeleePhaseProcedure(gameState) {
  const eligibleEntries = getEligibleEntriesFromPresentation(gameState);
  const acknowledgedState = withV2MeleeState({
    ...gameState,
    melee: createInitialMeleeState({
      ...gameState?.melee,
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      queueSelectionIds: eligibleEntries.map((entry) => entry.id),
      queue: [],
      batchPreview: null,
      batchApplicationPlan: null,
      diagnostics: [],
      isDialogOpen: false,
      resolutionDraft: null,
      resolvedEntriesByMeleeId: {},
      resolvedMeleeIds: [],
      batchSummary: null,
    }),
  });
  const basePresentation = getBaseV2ProcedurePresentation(acknowledgedState);
  const seam = getV2DecisionSeam({ gameState: acknowledgedState, basePresentation });
  const prioritization = applyV2MainAttackerPrioritization({
    gameState: acknowledgedState,
    basePresentation,
    seam,
  });

  return withV2MeleeState({
    ...acknowledgedState,
    melee: {
      ...acknowledgedState.melee,
      queueSelectionIds: prioritization.queueSelectionIds,
      v2: {
        ...(acknowledgedState.melee?.v2 ?? {}),
        prioritizationDiagnostics: prioritization.prioritizationDiagnostics,
      },
    },
  });
}

export function setMeleeProcedureDialogOpen(gameState, isDialogOpen) {
  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      isDialogOpen: Boolean(isDialogOpen),
    },
  });
}

export function toggleMeleeQueueSelection(gameState, meleeId) {
  if (typeof meleeId !== 'string' || meleeId.length === 0) {
    return gameState;
  }

  const eligibleEntries = getEligibleEntriesFromPresentation(gameState);
  const selected = new Set(Array.isArray(gameState?.melee?.queueSelectionIds)
    ? gameState.melee.queueSelectionIds
    : []);
  if (selected.has(meleeId)) {
    selected.delete(meleeId);
  } else {
    selected.add(meleeId);
  }

  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      queueSelectionIds: eligibleEntries
        .map((entry) => entry.id)
        .filter((entryId) => selected.has(entryId)),
      queue: [],
      batchPreview: null,
      batchApplicationPlan: null,
      isDialogOpen: gameState?.melee?.isDialogOpen ?? false,
    },
  });
}

export function moveMeleeQueueSelection(gameState, meleeId, direction) {
  if (typeof meleeId !== 'string' || (direction !== 'up' && direction !== 'down')) {
    return gameState;
  }

  const queueSelectionIds = Array.isArray(gameState?.melee?.queueSelectionIds)
    ? [...gameState.melee.queueSelectionIds]
    : [];
  const currentIndex = queueSelectionIds.indexOf(meleeId);
  if (currentIndex === -1) {
    return gameState;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= queueSelectionIds.length) {
    return gameState;
  }

  const temp = queueSelectionIds[targetIndex];
  queueSelectionIds[targetIndex] = queueSelectionIds[currentIndex];
  queueSelectionIds[currentIndex] = temp;

  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      queueSelectionIds,
      queue: [],
      batchPreview: null,
      batchApplicationPlan: null,
      isDialogOpen: gameState?.melee?.isDialogOpen ?? false,
    },
  });
}

export function previewMeleeBatch(gameState) {
  const basePresentation = getBaseV2ProcedurePresentation(gameState);
  const runtime = getV2BatchRuntime({ gameState, basePresentation });
  const diagnostics = [
    ...(Array.isArray(gameState?.melee?.diagnostics) ? gameState.melee.diagnostics : []),
    ...(runtime.activeFightSet.diagnostics ?? []),
    ...(runtime.queueBuild.diagnostics ?? []),
    ...(runtime.previewBuild.diagnostics ?? []),
  ];

  return withV2MeleeState({
    ...gameState,
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.PREVIEW_READY,
      queue: runtime.queueBuild.queue,
      batchPreview: runtime.previewBuild.batchPreview,
      batchApplicationPlan: null,
      diagnostics,
      v2: {
        ...(gameState?.melee?.v2 ?? {}),
        queueSource: 'v2-contact-graph',
        activeFightCount: runtime.activeFightSet.entries.length,
        unresolvedMeleeIds: runtime.previewBuild.batchPreview?.unresolvedMeleeIds ?? [],
        resolutionVersion: MELEE_V2_RESOLUTION_VERSION,
      },
    },
  });
}

export function startMeleeResolutionDraft(gameState, { unitId = null, meleeId = null } = {}) {
  const entry = resolveDraftEntry(gameState, { meleeId, unitId });
  if (!entry) {
    return gameState;
  }

  const persistedRoundStateByMeleeId = gameState?.melee?.roundStateByMeleeId
    && typeof gameState.melee.roundStateByMeleeId === 'object'
      ? gameState.melee.roundStateByMeleeId
      : {};
  const persistedCommanderHistoryByMeleeId = gameState?.melee?.commanderEngagementHistoryByMeleeId
    && typeof gameState.melee.commanderEngagementHistoryByMeleeId === 'object'
      ? gameState.melee.commanderEngagementHistoryByMeleeId
      : {};
  const persistedRoundState = normalizeMeleeRoundStateForDraft(
    persistedRoundStateByMeleeId[entry.id] ?? 'first-contact',
  );
  const priorCommanderEngagement = persistedCommanderHistoryByMeleeId[entry.id]
    && typeof persistedCommanderHistoryByMeleeId[entry.id] === 'object'
      ? persistedCommanderHistoryByMeleeId[entry.id]
      : {};

  return withV2MeleeState({
    ...gameState,
    selectedUnitId: entry.attackerUnitId,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      resolutionDraft: createV2ResolutionDraft(entry, {
        persistedRoundState,
        priorCommanderEngagement,
      }),
      resolutionPreview: null,
      isDialogOpen: false,
    },
  });
}

export function cancelMeleeResolutionDraft(gameState) {
  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      resolutionDraft: null,
      resolutionPreview: null,
    },
  });
}

export function setMeleeResolutionDraftValue(gameState, key, value) {
  const draft = gameState?.melee?.resolutionDraft;
  if (!draft?.resolutionInput || !Object.prototype.hasOwnProperty.call(draft.resolutionInput, key)) {
    return gameState;
  }

  const nextDraftInput = {
    ...draft.resolutionInput,
    [key]: value,
  };
  const shouldRehydrateDraftInput = key === 'meleeRoundState'
    || key === 'attackerCommanderEngaged'
    || key === 'defenderCommanderEngaged';
  const hydrated = shouldRehydrateDraftInput
    ? createHydratedResolutionInput({
        ...draft,
        allUnits: Array.isArray(draft?.allUnits) ? draft.allUnits : [],
        persistedRoundState: draft?.persistedRoundState ?? 'first-contact',
        priorCommanderEngagement: draft?.priorCommanderEngagement ?? null,
        resolutionInput: nextDraftInput,
      })
    : null;

  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      resolutionDraft: {
        ...draft,
        resolutionInput: hydrated?.resolutionInput ?? nextDraftInput,
        diagnostics: hydrated?.diagnostics ?? draft.diagnostics,
      },
    },
  });
}

export function setMeleeResolutionDraftCommanderEngaged(gameState, side, isEngaged) {
  const normalizedSide = String(side ?? '').trim().toLowerCase();
  if (normalizedSide !== 'attacker' && normalizedSide !== 'defender') {
    return gameState;
  }

  const key = normalizedSide === 'attacker'
    ? 'attackerCommanderEngaged'
    : 'defenderCommanderEngaged';
  return setMeleeResolutionDraftValue(gameState, key, isEngaged === true);
}

export function confirmMeleeResolutionDraft(gameState) {
  const draft = gameState?.melee?.resolutionDraft;
  if (!draft?.meleeId || !draft?.resolutionInput) {
    return gameState;
  }

  const resolution = resolveMeleeOutcome(draft.resolutionInput);
  const resolvedEntriesByMeleeId = {
    ...(gameState?.melee?.resolvedEntriesByMeleeId ?? {}),
    [draft.meleeId]: {
      meleeId: draft.meleeId,
      attackerUnitId: draft.attackerUnitId,
      defenderUnitId: draft.defenderUnitId,
      resolution,
      applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.PENDING_SIMULTANEOUS_BATCH,
    },
  };

  const resolvedMeleeIds = Array.from(new Set([
    ...(Array.isArray(gameState?.melee?.resolvedMeleeIds) ? gameState.melee.resolvedMeleeIds : []),
    draft.meleeId,
  ]));
  const roundStateByMeleeId = {
    ...(gameState?.melee?.roundStateByMeleeId ?? {}),
    [draft.meleeId]: 'continuing',
  };
  const existingCommanderHistory = gameState?.melee?.commanderEngagementHistoryByMeleeId
    && typeof gameState.melee.commanderEngagementHistoryByMeleeId === 'object'
      ? gameState.melee.commanderEngagementHistoryByMeleeId
      : {};
  const priorCommanderHistoryForMelee = existingCommanderHistory[draft.meleeId]
    && typeof existingCommanderHistory[draft.meleeId] === 'object'
      ? existingCommanderHistory[draft.meleeId]
      : {};
  const commanderEngagementHistoryByMeleeId = {
    ...existingCommanderHistory,
    [draft.meleeId]: {
      attacker: priorCommanderHistoryForMelee.attacker === true
        || draft.resolutionInput.attackerCommanderEngaged === true,
      defender: priorCommanderHistoryForMelee.defender === true
        || draft.resolutionInput.defenderCommanderEngaged === true,
    },
  };

  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      resolutionPreview: createMeleeResolutionPreview(draft, resolution),
      resolvedEntriesByMeleeId,
      resolvedMeleeIds,
      roundStateByMeleeId,
      commanderEngagementHistoryByMeleeId,
      resolutionDraft: {
        ...draft,
        resolutionPreview: createMeleeResolutionPreview(draft, resolution),
      },
      batchPreview: null,
      batchApplicationPlan: null,
    },
  });
}

export function acknowledgeMeleeResolutionResult(gameState) {
  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      resolutionDraft: null,
      resolutionPreview: null,
    },
  });
}

export function canApplyResolvedMeleeBatch(gameState) {
  const basePresentation = getBaseV2ProcedurePresentation(gameState);
  const runtime = getV2BatchRuntime({ gameState, basePresentation });
  return runtime.previewBuild.batchPreview?.isReadyForApply === true;
}

export function acknowledgeMeleeBatchSummary(gameState) {
  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      batchSummary: null,
    },
  });
}

function applyV2MeleeBatchPlanToUnits(units = [], batchApplicationPlan = null) {
  const multipleAttackImmediateByUnitId = batchApplicationPlan?.effects?.multipleAttackImmediateByUnitId ?? {};
  const combatResultCohesionByUnitId = batchApplicationPlan?.effects?.combatResultCohesionByUnitId ?? {};
  const routedUnitIds = new Set(Array.isArray(batchApplicationPlan?.effects?.routedUnitIds)
    ? batchApplicationPlan.effects.routedUnitIds
    : []);

  return (Array.isArray(units) ? units : []).map((unit) => {
    const immediateLoss = Number(multipleAttackImmediateByUnitId[unit?.id] ?? 0);
    const combatLoss = Number(combatResultCohesionByUnitId[unit?.id] ?? 0);
    const loss = immediateLoss + combatLoss;
    if (loss <= 0 && !routedUnitIds.has(unit?.id)) {
      return unit;
    }

    return {
      ...unit,
      meleeCohesionLossTotal: Number(unit?.meleeCohesionLossTotal ?? 0) + loss,
      meleeRouted: routedUnitIds.has(unit?.id) ? true : Boolean(unit?.meleeRouted),
    };
  });
}

export function applyMeleeBatch(gameState) {
  if (!canApplyResolvedMeleeBatch(gameState)) {
    return withV2MeleeState({
      ...gameState,
      melee: {
        ...gameState.melee,
        diagnostics: [
          ...(Array.isArray(gameState?.melee?.diagnostics) ? gameState.melee.diagnostics : []),
          {
            code: 'melee.v2.apply-blocked-unresolved-required-fights',
            severity: 'warning',
            sourceStatus: 'source-open',
          },
        ],
      },
    });
  }

  const basePresentation = getBaseV2ProcedurePresentation(gameState);
  const runtime = getV2BatchRuntime({ gameState, basePresentation });
  const batchPreview = runtime.previewBuild.batchPreview;
  const batchApplicationPlan = buildV2MeleeBatchApplicationPlan({ batchPreview });
  const immediateCohesionLossCount = Object.values(batchApplicationPlan?.effects?.multipleAttackImmediateByUnitId ?? {})
    .reduce((sum, value) => sum + Number(value ?? 0), 0);
  const combatResultCohesionLossCount = Object.values(batchApplicationPlan?.effects?.combatResultCohesionByUnitId ?? {})
    .reduce((sum, value) => sum + Number(value ?? 0), 0);
  const cohesionLossCount = immediateCohesionLossCount + combatResultCohesionLossCount;
  const routedCount = Array.isArray(batchApplicationPlan?.effects?.routedUnitIds)
    ? batchApplicationPlan.effects.routedUnitIds.length
    : 0;
  const contactOrigins = [...new Set(
    (Array.isArray(batchPreview?.queue) ? batchPreview.queue : [])
      .map((entry) => entry?.v2ContactOrigin ?? 'unknown-origin'),
  )];

  return withV2MeleeState({
    ...gameState,
    units: applyV2MeleeBatchPlanToUnits(gameState?.units, batchApplicationPlan),
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.APPLIED,
      queue: runtime.queueBuild.queue,
      batchPreview,
      batchApplicationPlan,
      batchSummary: {
        isOpen: true,
        resolvedMelees: Array.isArray(batchPreview?.resolvedEntries) ? batchPreview.resolvedEntries.length : 0,
        cohesionLossCount,
        immediateCohesionLossCount,
        combatResultCohesionLossCount,
        routedCount,
        batchSummarySourceStatus: batchPreview?.sourceStatus ?? 'source-open',
        contactOrigins,
      },
      diagnostics: [
        ...(Array.isArray(gameState?.melee?.diagnostics) ? gameState.melee.diagnostics : []),
        ...(runtime.activeFightSet.diagnostics ?? []),
        ...(runtime.queueBuild.diagnostics ?? []),
        ...(runtime.previewBuild.diagnostics ?? []),
      ],
      v2: {
        ...(gameState?.melee?.v2 ?? {}),
        queueSource: 'v2-contact-graph',
        activeFightCount: runtime.activeFightSet.entries.length,
        unresolvedMeleeIds: runtime.previewBuild.batchPreview?.unresolvedMeleeIds ?? [],
        resolutionVersion: MELEE_V2_RESOLUTION_VERSION,
      },
    },
  });
}

export function toggleMeleeResolutionCombatFactorDebugOverride(gameState) {
  const draft = gameState?.melee?.resolutionDraft;
  if (!draft?.resolutionInput) {
    return gameState;
  }

  const nextEnabled = draft.resolutionInput.combatFactorDebugOverrideEnabled !== true;

  return withV2MeleeState({
    ...gameState,
    melee: {
      ...(gameState?.melee ?? createInitialMeleeState()),
      resolutionDraft: {
        ...draft,
        resolutionInput: {
          ...draft.resolutionInput,
          combatFactorDebugOverrideEnabled: nextEnabled,
          attackerCombatFactorSourceStatus: nextEnabled ? 'debug-fallback' : null,
          defenderCombatFactorSourceStatus: nextEnabled ? 'debug-fallback' : null,
        },
      },
    },
  });
}
