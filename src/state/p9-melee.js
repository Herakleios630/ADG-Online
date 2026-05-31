import {
  classifyMeleeContactUnit,
  resolveMeleeSupportAssignments,
  summarizeMeleeContactRoles,
} from '../engine/melee/roles.js';
import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  classifyChargeContact,
} from '../engine/charge/classification.js';
import { getFootprintCommandRangeMeasurement } from '../engine/command/range.js';
import {
  dotProduct,
  getUnitBaseGeometry,
  normalizeAngleRadians,
  worldPointToLocalPoint,
} from '../engine/geometry/index.js';
import {
  MELEE_MODIFIER_STAGES,
  MELEE_RESOLUTION_STATUSES,
  resolveMeleeCombatFactorPreview,
  resolveMeleeOutcome,
} from '../engine/melee/resolution.js';
import {
  BASE_PROFILE_IDS,
  getResolvedAbilityIdsForUnit,
  getUnitProfileForUnit,
} from '../data/unit-profiles.js';

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

const MELEE_ROUND_STATES = {
  FIRST_CONTACT: 'first-contact',
  CONTINUING: 'continuing',
};

const COMMANDER_PERSISTENCE_OPEN_VERIFICATION_IDS = [
  'command.commander-attach-detach-legality',
  'command.commander-detach-combat-lock-timing',
];

const MELEE_CONTACT_EPSILON_UD = 1e-4;
const MELEE_SUPPORT_ALIGN_EPSILON_UD = 0.15;
const MELEE_SUPPORT_ROTATION_EPSILON = 0.08;
const MELEE_IMMEDIATE_EFFECT_TYPES = {
  MULTIPLE_ATTACK: 'multiple-attack-immediate',
};

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function hasFullConformationEvidence(evidence, normalizedRelationship) {
  if (!evidence || typeof evidence !== 'object') {
    return false;
  }

  return evidence.fullConformation === true
    || evidence.fullyConformed === true
    || normalizeText(evidence.conformationState) === 'full'
    || normalizeText(evidence.contactClassification?.conformation) === 'full'
    || normalizedRelationship.includes('fully-conformed');
}

function parseExplicitFormedTroopEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    return null;
  }

  if (typeof evidence.formedTroop === 'boolean') {
    return {
      isFormed: evidence.formedTroop,
      source: 'evidence-formedTroop',
      sourceStatus: 'verified',
    };
  }

  const explicitFormationValue = normalizeText(
    evidence.attackerTroopFormation
      ?? evidence.attackerFormation
      ?? evidence.troopFormation,
  );

  if (['formed', 'fully-formed', 'full'].includes(explicitFormationValue)) {
    return {
      isFormed: true,
      source: 'evidence-formation',
      sourceStatus: 'verified',
    };
  }

  if (['unformed', 'not-formed', 'broken'].includes(explicitFormationValue)) {
    return {
      isFormed: false,
      source: 'evidence-formation',
      sourceStatus: 'verified',
    };
  }

  if (['unknown', 'unclear', 'unresolved', 'needs-source-check'].includes(explicitFormationValue)) {
    return {
      isFormed: null,
      source: 'evidence-formation',
      sourceStatus: 'needs-source-check',
    };
  }

  return null;
}

function resolveTroopClassForFlankRear(attackerUnit) {
  if (!attackerUnit || typeof attackerUnit !== 'object') {
    return {
      troopClass: 'unknown',
      sourceStatus: 'needs-source-check',
      diagnostics: [],
    };
  }

  let profile = null;
  let resolvedAbilityIds = [];
  try {
    profile = getUnitProfileForUnit(attackerUnit);
    resolvedAbilityIds = getResolvedAbilityIdsForUnit(attackerUnit);
  } catch (error) {
    return {
      troopClass: 'unknown',
      sourceStatus: 'needs-source-check',
      diagnostics: [{
        code: 'melee.flank-rear.profile-source-open',
        message: `Flank/rear troop-class lookup for unit '${attackerUnit.id ?? 'unknown'}' is source-open: ${error.message}`,
        attackerUnitId: attackerUnit.id ?? null,
        sourceStatus: 'needs-source-check',
      }],
    };
  }

  const isLightByBase = profile?.baseProfileId === BASE_PROFILE_IDS.FOOT_LIGHT;
  const isLightByAbility = resolvedAbilityIds.includes('light-troops');
  if (isLightByBase || isLightByAbility) {
    return {
      troopClass: 'light',
      sourceStatus: 'verified',
      diagnostics: [],
    };
  }

  const isFormedByBaseProfile = profile?.baseProfileId === BASE_PROFILE_IDS.FOOT_FORMED
    || profile?.baseProfileId === BASE_PROFILE_IDS.FOOT_DEEP
    || profile?.baseProfileId === BASE_PROFILE_IDS.MOUNTED
    || profile?.baseProfileId === BASE_PROFILE_IDS.ELEPHANT;

  return {
    troopClass: 'formed-non-light',
    sourceStatus: 'verified',
    formedTroop: {
      isFormed: isFormedByBaseProfile ? true : null,
      sourceStatus: isFormedByBaseProfile ? 'verified' : 'needs-source-check',
      source: 'profile-base',
    },
    diagnostics: [],
  };
}

function resolveContactEvidenceForOpponent(unit, opponentUnitId) {
  if (!unit || !opponentUnitId) {
    return null;
  }

  const evidenceCandidates = [unit.meleeContactEvidence, unit.conformationApplied]
    .filter((entry) => entry && typeof entry === 'object');
  for (const evidence of evidenceCandidates) {
    const principalOpponentId = String(evidence.principalOpponentId ?? '').trim();
    if (principalOpponentId.length === 0 || principalOpponentId === opponentUnitId) {
      return evidence;
    }
  }

  return null;
}

function resolveMovementConformationTriggerBridge(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    return null;
  }

  const bridge = evidence.meleeTriggerBridge;
  return bridge && typeof bridge === 'object' ? bridge : null;
}

function getUnitContactEvidenceEntries(unit) {
  if (!unit || typeof unit !== 'object') {
    return [];
  }

  return [unit.meleeContactEvidence, unit.conformationApplied]
    .filter((entry) => entry && typeof entry === 'object');
}

function getDefenderFrontEngagementEvidence({ allUnits, defenderUnit, attackerUnitId } = {}) {
  if (!defenderUnit?.id) {
    return {
      sourceClosed: false,
      mirroredPendingFrontDetected: false,
    };
  }

  const units = Array.isArray(allUnits) ? allUnits : [];
  let mirroredPendingFrontDetected = false;
  for (const candidate of units) {
    if (!candidate || candidate.id === attackerUnitId || candidate.owner === defenderUnit.owner) {
      continue;
    }

    const evidenceEntries = getUnitContactEvidenceEntries(candidate);
    for (const evidence of evidenceEntries) {
      const principalOpponentId = String(evidence.principalOpponentId ?? '').trim();
      if (principalOpponentId.length > 0 && principalOpponentId !== defenderUnit.id) {
        continue;
      }

      const evidenceSourceStatus = typeof evidence.sourceStatus === 'string'
        ? evidence.sourceStatus
        : 'needs-source-check';
      if (evidenceSourceStatus !== 'verified') {
        continue;
      }

      const classificationType = normalizeText(evidence.contactClassification?.type);
      const contactSide = normalizeText(evidence.contactSide);
      if (classificationType === 'front' || contactSide === 'front') {
        return {
          sourceClosed: true,
          mirroredPendingFrontDetected,
        };
      }
    }

    const hasMirroredPendingFront = candidate.engagedInMelee === true
      && candidate.meleePendingOpponentId === defenderUnit.id
      && isFrontToFrontContact(candidate, defenderUnit);
    if (hasMirroredPendingFront) {
      mirroredPendingFrontDetected = true;
    }
  }

  return {
    sourceClosed: false,
    mirroredPendingFrontDetected,
  };
}

function resolveMultipleAttackImmediateTriggerFromEvidence({ attackerUnit, defenderUnit } = {}) {
  if (!attackerUnit || !defenderUnit) {
    return null;
  }

  const evidence = resolveContactEvidenceForOpponent(attackerUnit, defenderUnit.id);
  const bridge = resolveMovementConformationTriggerBridge(evidence);
  const trigger = bridge?.immediateMultipleAttackTrigger;
  if (!trigger || typeof trigger !== 'object') {
    return null;
  }

  return {
    type: typeof trigger.type === 'string' ? trigger.type : 'multiple-attack-immediate',
    source: typeof trigger.source === 'string' ? trigger.source : 'movement-conformation',
    sourceStatus: typeof trigger.sourceStatus === 'string' ? trigger.sourceStatus : 'needs-source-check',
    cohesionLoss: Number.isFinite(Number(trigger.cohesionLoss)) ? Number(trigger.cohesionLoss) : null,
  };
}

function getFlankRearModifierContribution({ attackerUnit, defenderUnit, side, allUnits = [] } = {}) {
  if (!attackerUnit || !defenderUnit) {
    return {
      modifierContext: {},
      diagnostics: [],
    };
  }

  const evidence = resolveContactEvidenceForOpponent(attackerUnit, defenderUnit.id);
  if (!evidence) {
    return {
      modifierContext: {},
      diagnostics: [],
    };
  }

  const triggerBridge = resolveMovementConformationTriggerBridge(evidence);

  const classificationType = normalizeText(evidence.contactClassification?.type);
  const contactSide = normalizeText(evidence.contactSide);
  const relationship = normalizeText(evidence.contactRelationship);
  const bridgeSourceStatus = typeof triggerBridge?.sourceStatus === 'string'
    ? triggerBridge.sourceStatus
    : null;
  const evidenceSourceStatus = bridgeSourceStatus ?? (typeof evidence.sourceStatus === 'string'
    ? evidence.sourceStatus
    : 'needs-source-check');
  const bridgeAttackContactType = normalizeText(triggerBridge?.attackContactType);
  const isAmbiguousFlankRear = classificationType === 'rear-or-flank';
  const isRear = !isAmbiguousFlankRear && (
    bridgeAttackContactType === 'rear'
    || classificationType === 'rear'
    || contactSide === 'rear'
    || relationship.includes('rear')
  );
  const isFlank = !isAmbiguousFlankRear && !isRear && (
    bridgeAttackContactType === 'flank'
    || classificationType === 'flank'
    || contactSide === 'left'
    || contactSide === 'right'
    || relationship.includes('flank')
  );

  if (!isRear && !isFlank && !isAmbiguousFlankRear) {
    return {
      modifierContext: {},
      diagnostics: [],
    };
  }

  const diagnostics = [];
  if (isAmbiguousFlankRear) {
    diagnostics.push({
      code: 'melee.flank-rear.branch-source-open-ambiguous',
      message: `Flank/rear branch for side '${side}' remains ambiguous for unit '${attackerUnit.id}' against '${defenderUnit.id}'.`,
      side,
      attackerUnitId: attackerUnit.id,
      defenderUnitId: defenderUnit.id,
      sourceStatus: 'needs-source-check',
    });
  }

  const explicitToZero = triggerBridge?.defenderFactorToZeroEligible === true
    || evidence.applyDefenderCombatFactorToZero === true
    || evidence.defenderFactorToZeroEligible === true;
  const explicitCancellation = evidence.cancelAttackSituationBonus === true;
  const explicitCancellationFamily = normalizeText(triggerBridge?.cancellationFamilyHint ?? evidence.cancellationFamily) || null;
  const requiresDefenderFrontEngagementForToZero = triggerBridge?.requiresDefenderFrontEngagementForToZero === true;
  const defenderFrontEngagementEvidence = requiresDefenderFrontEngagementForToZero
    ? getDefenderFrontEngagementEvidence({
      allUnits,
      defenderUnit,
      attackerUnitId: attackerUnit.id,
    })
    : {
      sourceClosed: true,
      mirroredPendingFrontDetected: false,
    };
  const defenderFrontEngagedClosed = defenderFrontEngagementEvidence.sourceClosed === true;
  const bridgeConformationClosed = evidenceSourceStatus === 'verified'
    && (bridgeAttackContactType === 'flank' || bridgeAttackContactType === 'rear');
  const conformationClosed = hasFullConformationEvidence(evidence, relationship) || bridgeConformationClosed;
  const troopClassResolution = resolveTroopClassForFlankRear(attackerUnit);
  diagnostics.push(...troopClassResolution.diagnostics);
  const explicitFormedTroop = parseExplicitFormedTroopEvidence(evidence);

  const formedTroopResolution = explicitFormedTroop
    ? {
        isFormed: explicitFormedTroop.isFormed,
        sourceStatus: evidenceSourceStatus === 'verified'
          ? explicitFormedTroop.sourceStatus
          : 'needs-source-check',
        source: explicitFormedTroop.source,
      }
    : {
        isFormed: troopClassResolution.formedTroop?.isFormed ?? null,
        sourceStatus: troopClassResolution.formedTroop?.sourceStatus ?? 'needs-source-check',
        source: troopClassResolution.formedTroop?.source ?? 'unknown',
      };

  const troopClassClosed = troopClassResolution.sourceStatus === 'verified';
  const attackerIsFormedNonLight = troopClassResolution.troopClass === 'formed-non-light';
  const formedTroopClosed = formedTroopResolution.sourceStatus === 'verified' && formedTroopResolution.isFormed === true;
  const contactTypeClosed = isRear || isFlank;
  const inferredCancellationFamily = explicitCancellation
    && explicitCancellationFamily == null
    && evidenceSourceStatus === 'verified'
    && formedTroopClosed
    && contactTypeClosed
    && conformationClosed
    ? isRear
      ? 'rear-contact-formed'
      : isFlank
        ? 'flank-contact-formed'
        : null
    : null;
  const cancellationFamily = explicitCancellationFamily ?? inferredCancellationFamily;
  const toZeroClosed = explicitToZero
    && evidenceSourceStatus === 'verified'
    && troopClassClosed
    && attackerIsFormedNonLight
    && formedTroopClosed
    && contactTypeClosed
    && conformationClosed
    && defenderFrontEngagedClosed;

  if (explicitToZero && !toZeroClosed) {
    diagnostics.push({
      code: 'melee.flank-rear.to-zero-branch-source-open',
      message: `Flank/rear to-zero branch for side '${side}' remains source-open due to incomplete preconditions.`,
      side,
      attackerUnitId: attackerUnit.id,
      defenderUnitId: defenderUnit.id,
      sourceStatus: 'needs-source-check',
      reasons: {
        evidenceSourceClosed: evidenceSourceStatus === 'verified',
        attackerTroopClass: troopClassResolution.troopClass,
        attackerFormedTroop: formedTroopResolution.isFormed,
        formedTroopSourceStatus: formedTroopResolution.sourceStatus,
        contactTypeClosed,
        conformationClosed,
        defenderFrontEngagedClosed,
      },
    });
  }

  if (explicitToZero && requiresDefenderFrontEngagementForToZero && !defenderFrontEngagedClosed) {
    diagnostics.push({
      code: 'melee.flank-rear.to-zero-front-engagement-source-open',
      message: `Flank/rear to-zero branch for side '${side}' requires source-closed front engagement on defender '${defenderUnit.id}'.`,
      side,
      attackerUnitId: attackerUnit.id,
      defenderUnitId: defenderUnit.id,
      sourceStatus: 'needs-source-check',
    });
  }

  if (explicitToZero && requiresDefenderFrontEngagementForToZero && defenderFrontEngagementEvidence.mirroredPendingFrontDetected === true) {
    diagnostics.push({
      code: 'melee.flank-rear.to-zero-front-engagement-mirrored-pending-nonclosing',
      message: `Mirrored pending front contact exists on defender '${defenderUnit.id}', but it is treated as non-closing evidence for source-closed to-zero gating.`,
      side,
      attackerUnitId: attackerUnit.id,
      defenderUnitId: defenderUnit.id,
      sourceStatus: 'needs-source-check',
    });
  }

  if (explicitCancellation && cancellationFamily == null) {
    diagnostics.push({
      code: 'melee.flank-rear.cancellation-family-source-open',
      message: `Flank/rear cancellation branch for side '${side}' remains source-open because cancellation family is not source-anchored.`,
      side,
      attackerUnitId: attackerUnit.id,
      defenderUnitId: defenderUnit.id,
      sourceStatus: 'needs-source-check',
    });
  }

  const branchSourceStatus = isAmbiguousFlankRear
    ? 'needs-source-check'
    : (explicitToZero && !toZeroClosed)
      ? 'needs-source-check'
      : (explicitCancellation && cancellationFamily == null)
        ? 'needs-source-check'
        : evidenceSourceStatus;

  return {
    modifierContext: {
      sourceStatus: evidenceSourceStatus,
      flankOrRearAttack: true,
      flankRearBranch: {
        attackContactType: isAmbiguousFlankRear ? 'rear-or-flank' : isRear ? 'rear' : isFlank ? 'flank' : 'rear-or-flank',
        evidenceContactSide: contactSide || null,
        evidenceContactRelationship: relationship || null,
        hasFullConformationEvidence: conformationClosed,
        attackerTroopClass: troopClassResolution.troopClass,
        attackerFormedTroop: formedTroopResolution.isFormed,
        formedTroopSourceStatus: formedTroopResolution.sourceStatus,
        applyDefenderCombatFactorToZero: toZeroClosed,
        cancelAttackSituationBonus: explicitCancellation,
        cancellationFamily,
        requiresDefenderFrontEngagementForToZero,
        defenderFrontEngagedSourceClosed: defenderFrontEngagedClosed,
        sourceStatus: isAmbiguousFlankRear
          ? 'needs-source-check'
          : branchSourceStatus,
      },
    },
    diagnostics,
  };
}

function resolveDefenderCentricToZeroAggregation({
  gameState,
  attackerUnit,
  defenderUnit,
  allUnits = [],
  additionalAttackerUnits = [],
} = {}) {
  if (!attackerUnit?.id || !defenderUnit?.id) {
    return {
      modifierContext: {},
      diagnostics: [],
    };
  }

  const sameDefenderEntries = getEligibleMeleeEntries(gameState)
    .filter((entry) => entry?.defenderUnitId === defenderUnit.id)
    .sort((left, right) => String(left?.attackerUnitId ?? '').localeCompare(String(right?.attackerUnitId ?? '')));

  const groupedCandidates = [
    attackerUnit,
    ...(Array.isArray(additionalAttackerUnits) ? additionalAttackerUnits : []),
  ]
    .filter((unit) => unit?.id)
    .map((unit) => ({
      attackerUnit: unit,
      meleeId: `${unit.id}__${defenderUnit.id}`,
    }));

  const entryCandidates = sameDefenderEntries.map((entry) => {
    const candidateAttacker = entry?.resolutionInput?.attackerUnit
      ?? allUnits.find((unit) => unit?.id === entry?.attackerUnitId)
      ?? null;
    return {
      attackerUnit: candidateAttacker,
      meleeId: entry?.id ?? `${candidateAttacker?.id ?? 'unknown'}__${defenderUnit.id}`,
    };
  });

  const candidatePool = [...groupedCandidates, ...entryCandidates]
    .filter((candidate) => candidate?.attackerUnit?.id)
    .filter((candidate, index, source) => source.findIndex((other) => other.attackerUnit.id === candidate.attackerUnit.id) === index)
    .sort((left, right) => String(left?.attackerUnit?.id ?? '').localeCompare(String(right?.attackerUnit?.id ?? '')));

  let sourceClosedOwner = null;
  for (const candidate of candidatePool) {
    const candidateAttacker = candidate?.attackerUnit ?? null;
    if (!candidateAttacker?.id) {
      continue;
    }

    const candidateContribution = getFlankRearModifierContribution({
      attackerUnit: candidateAttacker,
      defenderUnit,
      side: 'attacker',
      allUnits,
    });
    const candidateBranch = candidateContribution?.modifierContext?.flankRearBranch ?? null;
    if (candidateBranch?.applyDefenderCombatFactorToZero === true && candidateBranch?.sourceStatus === 'verified') {
      sourceClosedOwner = {
        meleeId: candidate.meleeId,
        attackerUnitId: candidateAttacker.id,
        branch: candidateBranch,
      };
      break;
    }
  }

  if (!sourceClosedOwner) {
    return {
      modifierContext: {},
      diagnostics: [],
    };
  }

  const ownershipFromDifferentAttacker = sourceClosedOwner.attackerUnitId !== attackerUnit.id;
  return {
    modifierContext: {
      flankRearBranch: {
        ...sourceClosedOwner.branch,
        applyDefenderCombatFactorToZero: true,
        sourceStatus: 'verified',
        inheritedDefenderToZeroFromBranch: ownershipFromDifferentAttacker,
        ownershipSource: 'defender-centric-aggregation',
        ownershipMeleeId: sourceClosedOwner.meleeId,
        ownershipAttackerUnitId: sourceClosedOwner.attackerUnitId,
        ownershipAttackContactType: sourceClosedOwner.branch?.attackContactType ?? null,
      },
    },
    diagnostics: ownershipFromDifferentAttacker
      ? [{
          code: 'melee.flank-rear.to-zero-defender-aggregation-applied',
          message: `Defender-centric to-zero aggregation applied from '${sourceClosedOwner.attackerUnitId}' to current pair attacker '${attackerUnit.id}' against defender '${defenderUnit.id}'.`,
          attackerUnitId: attackerUnit.id,
          defenderUnitId: defenderUnit.id,
          ownershipAttackerUnitId: sourceClosedOwner.attackerUnitId,
          ownershipMeleeId: sourceClosedOwner.meleeId,
          sourceStatus: 'verified',
        }]
      : [],
  };
}

function sortContactsByDistanceThenId(attacker, left, right) {
  const leftDistance = getFootprintCommandRangeMeasurement(attacker, left)?.distanceUd ?? Number.POSITIVE_INFINITY;
  const rightDistance = getFootprintCommandRangeMeasurement(attacker, right)?.distanceUd ?? Number.POSITIVE_INFINITY;
  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }
  return String(left?.id ?? '').localeCompare(String(right?.id ?? ''));
}

function getPoseSnapshot(unit) {
  return {
    xUd: unit?.xUd,
    yUd: unit?.yUd,
    rotationRadians: unit?.rotationRadians ?? 0,
  };
}

function isDirectContact(leftUnit, rightUnit) {
  const contactMeasurement = getFootprintCommandRangeMeasurement(leftUnit, rightUnit);
  return Number.isFinite(contactMeasurement?.distanceUd)
    && contactMeasurement.distanceUd <= MELEE_CONTACT_EPSILON_UD;
}

function isFrontToFrontContact(leftUnit, rightUnit) {
  if (!isDirectContact(leftUnit, rightUnit)) {
    return false;
  }

  const leftToRight = classifyChargeContact({
    chargerUnit: leftUnit,
    defenderUnit: rightUnit,
    contactSnapshot: {
      chargerStartPose: getPoseSnapshot(leftUnit),
      defenderPose: getPoseSnapshot(rightUnit),
    },
  });
  const rightToLeft = classifyChargeContact({
    chargerUnit: rightUnit,
    defenderUnit: leftUnit,
    contactSnapshot: {
      chargerStartPose: getPoseSnapshot(rightUnit),
      defenderPose: getPoseSnapshot(leftUnit),
    },
  });

  return leftToRight.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT
    && rightToLeft.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT;
}

function isClassifiedMeleeContact(attackerUnit, defenderUnit) {
  if (!isDirectContact(attackerUnit, defenderUnit)) {
    return false;
  }

  const attackerToDefender = classifyChargeContact({
    chargerUnit: attackerUnit,
    defenderUnit,
    contactSnapshot: {
      chargerStartPose: getPoseSnapshot(attackerUnit),
      defenderPose: getPoseSnapshot(defenderUnit),
    },
  });
  const defenderToAttacker = classifyChargeContact({
    chargerUnit: defenderUnit,
    defenderUnit: attackerUnit,
    contactSnapshot: {
      chargerStartPose: getPoseSnapshot(defenderUnit),
      defenderPose: getPoseSnapshot(attackerUnit),
    },
  });

  return attackerToDefender.type !== CHARGE_CONTACT_CLASSIFICATION_TYPES.UNCLASSIFIED
    || defenderToAttacker.type !== CHARGE_CONTACT_CLASSIFICATION_TYPES.UNCLASSIFIED;
}

function getUnitPrincipalOpponentId(unit) {
  const evidence = unit?.meleeContactEvidence && typeof unit.meleeContactEvidence === 'object'
    ? unit.meleeContactEvidence
    : unit?.conformationApplied && typeof unit.conformationApplied === 'object'
      ? unit.conformationApplied
      : null;
  return evidence?.principalOpponentId ?? unit?.meleePendingOpponentId ?? null;
}

function isRoleAwareMainAttackerCandidate(attackerUnit, defenderUnit, { requireGeometryContact = true } = {}) {
  if (!attackerUnit || !defenderUnit) {
    return false;
  }

  if (requireGeometryContact && !isClassifiedMeleeContact(attackerUnit, defenderUnit)) {
    return false;
  }

  const classification = classifyMeleeContactUnit(attackerUnit);
  const explicitOpponentId = classification?.opponentUnitId ?? getUnitPrincipalOpponentId(attackerUnit) ?? null;
  if (explicitOpponentId && explicitOpponentId !== defenderUnit.id) {
    return false;
  }

  if (classification?.role === 'simple-support' || classification?.role === 'melee-support') {
    return false;
  }

  if (classification?.role === 'main-unit') {
    return true;
  }

  // Geometry-only contacts can lack explicit role evidence; keep them as provisional main attackers.
  return classification?.role === 'non-contact' || classification?.role === 'source-open';
}

function selectPrimaryAttackerForDefender(attackers = [], defender = null) {
  const orderedAttackers = Array.isArray(attackers) ? [...attackers] : [];
  if (!defender || orderedAttackers.length === 0) {
    return null;
  }

  const frontAttacker = orderedAttackers.find((attacker) => isFrontToFrontContact(attacker, defender));
  if (frontAttacker) {
    return frontAttacker;
  }

  const evidenceMainAttacker = orderedAttackers.find((attacker) => {
    const classification = classifyMeleeContactUnit(attacker);
    return classification?.role === 'main-unit'
      && classification?.opponentUnitId === defender.id;
  });
  if (evidenceMainAttacker) {
    return evidenceMainAttacker;
  }

  return orderedAttackers[0] ?? null;
}

function createCombatGroupEntry({
  attackerUnit,
  defenderUnit,
  allUnits,
  additionalAttackers = [],
} = {}) {
  if (!attackerUnit || !defenderUnit) {
    return null;
  }

  const groupedAttackers = [
    attackerUnit,
    ...(Array.isArray(additionalAttackers) ? additionalAttackers.filter((unit) => unit?.id !== attackerUnit.id) : []),
  ];
  const groupedAttackerIds = groupedAttackers
    .map((unit) => unit?.id)
    .filter(Boolean);

  return {
    id: `${attackerUnit.id}__${defenderUnit.id}`,
    attackerUnitId: attackerUnit.id,
    defenderUnitId: defenderUnit.id,
    combatGroupId: String(defenderUnit.id),
    combatGroupAttackerUnitIds: groupedAttackerIds,
    label: `${attackerUnit.scenarioLabel ?? attackerUnit.id} vs ${defenderUnit.scenarioLabel ?? defenderUnit.id}`,
    allUnits,
    resolutionInput: {
      attackerUnit,
      defenderUnit,
      additionalAttackerUnits: groupedAttackers.slice(1),
      combatGroupAttackerUnitIds: groupedAttackerIds,
      attackerDieRoll: 4,
      defenderDieRoll: 4,
    },
  };
}

function areParallelFacing(leftUnit, rightUnit) {
  const angleDelta = normalizeAngleRadians((leftUnit?.rotationRadians ?? 0) - (rightUnit?.rotationRadians ?? 0));
  return Math.abs(angleDelta) <= MELEE_SUPPORT_ROTATION_EPSILON;
}

function isFlankToFlankSupport(supportUnit, mainUnit) {
  if (!isDirectContact(supportUnit, mainUnit) || !areParallelFacing(supportUnit, mainUnit)) {
    return false;
  }

  const mainFrame = {
    center: { x: Number(mainUnit.xUd), y: Number(mainUnit.yUd) },
    widthUd: Number(mainUnit.widthUd),
    depthUd: Number(mainUnit.depthUd),
    rotationRadians: Number(mainUnit.rotationRadians ?? 0),
  };
  const supportCenterLocal = worldPointToLocalPoint(mainFrame, {
    x: Number(supportUnit.xUd),
    y: Number(supportUnit.yUd),
  });

  const expectedFlankOffset = (Number(mainUnit.widthUd) + Number(supportUnit.widthUd)) / 2;
  const flankOffsetMatches = Math.abs(Math.abs(supportCenterLocal.x) - expectedFlankOffset) <= MELEE_SUPPORT_ALIGN_EPSILON_UD;
  const mainGeometry = getUnitBaseGeometry({
    center: { x: Number(mainUnit.xUd), y: Number(mainUnit.yUd) },
    widthUd: Number(mainUnit.widthUd),
    depthUd: Number(mainUnit.depthUd),
    rotationRadians: Number(mainUnit.rotationRadians ?? 0),
  });
  const supportGeometry = getUnitBaseGeometry({
    center: { x: Number(supportUnit.xUd), y: Number(supportUnit.yUd) },
    widthUd: Number(supportUnit.widthUd),
    depthUd: Number(supportUnit.depthUd),
    rotationRadians: Number(supportUnit.rotationRadians ?? 0),
  });
  const mainFrontProjection = (
    dotProduct(mainGeometry.frontEdge.start, mainGeometry.forwardAxis)
    + dotProduct(mainGeometry.frontEdge.end, mainGeometry.forwardAxis)
  ) / 2;
  const supportFrontProjection = (
    dotProduct(supportGeometry.frontEdge.start, mainGeometry.forwardAxis)
    + dotProduct(supportGeometry.frontEdge.end, mainGeometry.forwardAxis)
  ) / 2;
  const frontEdgeAlignment = Math.abs(mainFrontProjection - supportFrontProjection) <= MELEE_SUPPORT_ALIGN_EPSILON_UD;

  return flankOffsetMatches && frontEdgeAlignment;
}

function getMainMeleeUnitIds(eligibleEntries) {
  const ids = new Set();
  for (const entry of eligibleEntries) {
    ids.add(entry.attackerUnitId);
    ids.add(entry.defenderUnitId);
  }
  return ids;
}

function getSupportUnitIds(units, mainUnitIds) {
  const allUnits = Array.isArray(units) ? units : [];
  const mainUnitsById = new Map(
    allUnits
      .filter((unit) => mainUnitIds.has(unit.id))
      .map((unit) => [unit.id, unit]),
  );
  const supportIds = new Set();
  const assignedIds = new Set();

  for (const mainUnit of mainUnitsById.values()) {
    const roleAssignments = resolveMeleeSupportAssignments({
      units: allUnits,
      mainUnitId: mainUnit.id,
      ownerId: mainUnit.owner,
    });
    for (const supportId of [...roleAssignments.simpleSupportUnitIds, ...roleAssignments.meleeSupportUnitIds]) {
      supportIds.add(supportId);
      assignedIds.add(supportId);
    }
  }

  for (const unit of allUnits) {
    if (!unit || mainUnitIds.has(unit.id) || assignedIds.has(unit.id)) {
      continue;
    }

    const supportsAnyMain = [...mainUnitsById.values()].some((mainUnit) => (
      unit.owner === mainUnit.owner && isFlankToFlankSupport(unit, mainUnit)
    ));
    if (supportsAnyMain) {
      supportIds.add(unit.id);
    }
  }

  return supportIds;
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

function getSupportAssignmentsForMain(units, mainUnit) {
  if (!mainUnit) {
    return {
      entries: [],
      diagnostics: [],
    };
  }

  const allUnits = Array.isArray(units) ? units : [];
  const roleAssignments = resolveMeleeSupportAssignments({
    units: allUnits,
    mainUnitId: mainUnit.id,
    ownerId: mainUnit.owner,
  });
  const roleEntries = roleAssignments.selected.map((selection) => ({
    unit: selection.unit,
    role: selection.classification.role,
    classification: selection.classification,
    sourceStatus: selection.sourceStatus,
    hasCompetition: selection.hasCompetition,
  }));
  if (roleEntries.length > 0) {
    return {
      entries: roleEntries,
      diagnostics: roleAssignments.diagnostics,
    };
  }

  // Geometry fallback stays explicit source-open until support evidence families are fully closed.
  const fallbackEntries = allUnits
    .filter((unit) => (
      unit
      && unit.id !== mainUnit.id
      && unit.owner === mainUnit.owner
      && isFlankToFlankSupport(unit, mainUnit)
    ))
    .map((unit) => ({
      unit,
      role: 'simple-support',
      sourceStatus: 'needs-source-check',
      hasCompetition: false,
    }));

  const fallbackDiagnostics = fallbackEntries.length > 0
    ? [{
        code: 'melee.support.source-open.geometry-fallback',
        message: `Geometry fallback support assignment is active for main unit '${mainUnit.id}'.`,
      }]
    : [];

  return {
    entries: fallbackEntries,
    diagnostics: [...roleAssignments.diagnostics, ...fallbackDiagnostics],
  };
}

function getCombatGroupMeleeSupportAssignments({ units = [], attackerMainUnit = null, defenderMainUnit = null } = {}) {
  if (!attackerMainUnit || !defenderMainUnit) {
    return {
      entries: [],
      diagnostics: [],
    };
  }

  const allUnits = Array.isArray(units) ? units : [];
  const entries = allUnits
    .filter((unit) => unit && unit.id !== attackerMainUnit.id && unit.id !== defenderMainUnit.id)
    .filter((unit) => unit.owner === attackerMainUnit.owner)
    .map((unit) => ({ unit, classification: classifyMeleeContactUnit(unit) }))
    .filter(({ classification }) => (
      classification?.role === 'melee-support'
      && classification?.opponentUnitId === defenderMainUnit.id
    ))
    .sort((left, right) => String(left?.unit?.id ?? '').localeCompare(String(right?.unit?.id ?? '')))
    .map(({ unit, classification }) => ({
      unit,
      role: 'melee-support',
      classification,
      sourceStatus: classification?.sourceStatus ?? 'verified',
      hasCompetition: false,
    }));

  return {
    entries,
    diagnostics: [],
  };
}

function createSupportModifierEntries(assignments, side, opponentMainUnit = null) {
  const entries = Array.isArray(assignments?.entries) ? assignments.entries : [];
  const meleeSupportSides = new Set(entries
    .filter((entry) => entry?.role === 'melee-support')
    .map((entry) => String(entry?.classification?.contactSide ?? '').trim().toLowerCase())
    .filter(Boolean));
  const displacedSimpleSupports = entries.filter((entry) => {
    const contactSide = String(entry?.classification?.contactSide ?? '').trim().toLowerCase();
    return entry?.role === 'simple-support' && meleeSupportSides.has(contactSide);
  });
  const effectiveEntries = entries.filter((entry) => {
    const contactSide = String(entry?.classification?.contactSide ?? '').trim().toLowerCase();
    return !(entry?.role === 'simple-support' && meleeSupportSides.has(contactSide));
  });

  return {
    includedEntries: effectiveEntries,
    entries: effectiveEntries.map((entry) => {
    const supportFactorPreview = resolveMeleeCombatFactorPreview({
      attackerUnit: entry?.unit ?? null,
      defenderUnit: opponentMainUnit ?? null,
    });
    const supportCombatFactorValue = Number.isFinite(supportFactorPreview?.attacker?.value)
      ? Number(supportFactorPreview.attacker.value)
      : 0;
    const meleeSupportValue = supportCombatFactorValue + 1;
    const sourceStatus = entry?.role === 'melee-support'
      && (entry?.sourceStatus !== 'verified' || supportFactorPreview?.attacker?.sourceStatus !== 'verified')
      ? 'needs-source-check'
      : entry?.sourceStatus ?? 'needs-source-check';

    return {
      code: `melee.support.${entry.role}.${side}`,
      label: entry.role === 'melee-support'
        ? 'Melee support bonus (combat factor +1)'
        : 'Simple support bonus',
      stage: MELEE_MODIFIER_STAGES.SUPPORT,
      value: entry.role === 'melee-support' ? meleeSupportValue : 1,
      sourceStatus,
    };
    }),
    diagnostics: displacedSimpleSupports.map((entry) => ({
      code: 'melee.support.simple-support-displaced-by-melee-support',
      message: `Simple support '${entry?.unit?.id ?? 'unknown'}' on side '${String(entry?.classification?.contactSide ?? '').trim().toLowerCase() || 'unspecified'}' is not counted because melee support occupies the same side support slot.`,
      side,
      supportUnitId: entry?.unit?.id ?? null,
      supportRole: 'simple-support',
      displacedByRole: 'melee-support',
      contactSide: String(entry?.classification?.contactSide ?? '').trim().toLowerCase() || null,
      sourceStatus: 'verified',
    })),
  };
}

function createSupportPresentationEntry(entry, opponentMainUnit) {
  const supportFactorPreview = resolveMeleeCombatFactorPreview({
    attackerUnit: entry?.unit ?? null,
    defenderUnit: opponentMainUnit ?? null,
  });

  return {
    id: entry.unit.id,
    label: entry.unit.scenarioLabel ?? entry.unit.id,
    role: entry.role,
    sourceStatus: entry.sourceStatus,
    combatFactorValue: supportFactorPreview.attacker.value,
    combatFactorSourceStatus: supportFactorPreview.attacker.sourceStatus,
    combatFactorProvenanceLabel: supportFactorPreview.attacker.provenanceLabel,
  };
}

function createGroupedAttackerSupportModifierEntries(additionalAttackerUnits = [], defenderUnit = null, side = 'attacker') {
  const groupedAttackers = Array.isArray(additionalAttackerUnits)
    ? additionalAttackerUnits.filter((unit) => unit && typeof unit === 'object')
    : [];

  const groupedMeleeSupporters = groupedAttackers.filter((unit) => {
    const classification = classifyMeleeContactUnit(unit);
    return classification?.role === 'melee-support'
      && (!classification?.opponentUnitId || classification.opponentUnitId === defenderUnit?.id);
  });

  return groupedMeleeSupporters.map((unit) => {
    const supportFactorPreview = resolveMeleeCombatFactorPreview({
      attackerUnit: unit,
      defenderUnit,
    });
    const supportCombatFactorValue = Number.isFinite(supportFactorPreview?.attacker?.value)
      ? Number(supportFactorPreview.attacker.value)
      : 0;

    return {
      code: `melee.support.grouped-melee-support.${side}.${unit.id}`,
      label: `Grouped melee support (${unit.scenarioLabel ?? unit.id})`,
      stage: MELEE_MODIFIER_STAGES.SUPPORT,
      value: supportCombatFactorValue + 1,
      sourceStatus: supportFactorPreview?.attacker?.sourceStatus === 'verified' ? 'verified' : 'needs-source-check',
    };
  });
}

function createGroupedAttackerSupportPresentationEntries(additionalAttackerUnits = [], defenderUnit = null) {
  const groupedAttackers = Array.isArray(additionalAttackerUnits)
    ? additionalAttackerUnits.filter((unit) => unit && typeof unit === 'object')
    : [];

  const groupedMeleeSupporters = groupedAttackers.filter((unit) => {
    const classification = classifyMeleeContactUnit(unit);
    return classification?.role === 'melee-support'
      && (!classification?.opponentUnitId || classification.opponentUnitId === defenderUnit?.id);
  });

  return groupedMeleeSupporters.map((unit) => {
    const supportFactorPreview = resolveMeleeCombatFactorPreview({
      attackerUnit: unit,
      defenderUnit,
    });
    return {
      id: unit.id,
      label: unit.scenarioLabel ?? unit.id,
      role: 'melee-support',
      sourceStatus: supportFactorPreview?.attacker?.sourceStatus === 'verified' ? 'verified' : 'needs-source-check',
      combatFactorValue: supportFactorPreview.attacker.value,
      combatFactorSourceStatus: supportFactorPreview.attacker.sourceStatus,
      combatFactorProvenanceLabel: supportFactorPreview.attacker.provenanceLabel,
    };
  });
}

function createAdditionalMainAttackerContributionGuard(additionalAttackerUnits = [], defenderUnit = null) {
  const groupedAttackers = Array.isArray(additionalAttackerUnits)
    ? additionalAttackerUnits.filter((unit) => unit && typeof unit === 'object')
    : [];

  const unresolvedMainAttackers = groupedAttackers.filter((unit) => {
    const classification = classifyMeleeContactUnit(unit);
    if (classification?.role === 'simple-support' || classification?.role === 'melee-support') {
      return false;
    }

    return !classification?.opponentUnitId || classification.opponentUnitId === defenderUnit?.id;
  });

  if (unresolvedMainAttackers.length === 0) {
    return {
      entries: [],
      diagnostics: [],
    };
  }

  return {
    entries: [{
      code: 'melee.combat-group.additional-main-attacker-contribution-source-open',
      label: 'Additional combat-group main attacker contribution remains source-open',
      stage: MELEE_MODIFIER_STAGES.SITUATION,
      value: 0,
      sourceStatus: 'needs-source-check',
    }],
    diagnostics: [{
      code: 'melee.combat-group.additional-main-attacker-contribution-source-open',
      message: 'Outside support-role contexts, additional grouped main-attacker contribution semantics remain source-open and require Lead / Phase Steward source-risk triage before verified closure. Support-role contacts are resolved through role model and support caps, without a separate lane in this slice.',
      defenderUnitId: defenderUnit?.id ?? null,
      additionalAttackerUnitIds: unresolvedMainAttackers.map((unit) => unit.id),
      sourceStatus: 'needs-source-check',
      openVerificationId: 'melee.main-unit-support-multiple-attack-and-modifiers',
      reviewerHandoffRequired: true,
    }],
  };
}

function summarizeDerivedBranch(branchContext = null) {
  if (!branchContext || typeof branchContext !== 'object') {
    return null;
  }

  return {
    attackContactType: branchContext.attackContactType ?? null,
    applyDefenderCombatFactorToZero: branchContext.applyDefenderCombatFactorToZero === true,
    sourceStatus: branchContext.sourceStatus ?? 'needs-source-check',
    inheritedDefenderToZeroFromBranch: branchContext.inheritedDefenderToZeroFromBranch === true,
    ownershipSource: branchContext.ownershipSource ?? null,
    ownershipAttackerUnitId: branchContext.ownershipAttackerUnitId ?? null,
    ownershipMeleeId: branchContext.ownershipMeleeId ?? null,
    ownershipAttackContactType: branchContext.ownershipAttackContactType ?? null,
    hasFullConformationEvidence: branchContext.hasFullConformationEvidence === true,
    defenderFrontEngagedSourceClosed: branchContext.defenderFrontEngagedSourceClosed === true,
    attackerTroopClass: branchContext.attackerTroopClass ?? null,
    attackerFormedTroop: branchContext.attackerFormedTroop,
    formedTroopSourceStatus: branchContext.formedTroopSourceStatus ?? null,
    requiresDefenderFrontEngagementForToZero: branchContext.requiresDefenderFrontEngagementForToZero === true,
  };
}

function createDraftFactorPresentation(draft, units) {
  const input = draft?.resolutionInput ?? {};
  const attackerUnit = input.attackerUnit ?? null;
  const defenderUnit = input.defenderUnit ?? null;
  const attackerSupportAssignments = getSupportAssignmentsForMain(units, attackerUnit);
  const defenderSupportAssignments = getSupportAssignmentsForMain(units, defenderUnit);
  const factorPreview = resolveMeleeCombatFactorPreview({
    attackerUnit,
    defenderUnit,
    attackerCombatFactorValue: input.attackerCombatFactorValue,
    defenderCombatFactorValue: input.defenderCombatFactorValue,
    attackerCombatFactorSourceStatus: input.attackerCombatFactorSourceStatus,
    defenderCombatFactorSourceStatus: input.defenderCombatFactorSourceStatus,
    combatFactorDebugOverrideEnabled: input.combatFactorDebugOverrideEnabled === true,
  });

  return {
    attackerSupportUnits: [
      ...attackerSupportAssignments.entries
        .map((entry) => createSupportPresentationEntry(entry, defenderUnit)),
      ...createGroupedAttackerSupportPresentationEntries(input.additionalAttackerUnits, defenderUnit),
    ],
    defenderSupportUnits: defenderSupportAssignments.entries
      .map((entry) => createSupportPresentationEntry(entry, attackerUnit)),
    attackerModifierStages: groupModifierEntriesByStage(input.attackerModifierEntries),
    defenderModifierStages: groupModifierEntriesByStage(input.defenderModifierEntries),
    attackerCombatFactorValue: factorPreview.attacker.value,
    defenderCombatFactorValue: factorPreview.defender.value,
    attackerCombatFactorSourceStatus: factorPreview.attacker.sourceStatus,
    defenderCombatFactorSourceStatus: factorPreview.defender.sourceStatus,
    attackerCombatFactorProvenanceLabel: factorPreview.attacker.provenanceLabel,
    defenderCombatFactorProvenanceLabel: factorPreview.defender.provenanceLabel,
    combatFactorDebugOverrideEnabled: input.combatFactorDebugOverrideEnabled === true,
    attackerDerivedBranch: summarizeDerivedBranch(input.attackerModifierContext?.flankRearBranch),
    defenderDerivedBranch: summarizeDerivedBranch(input.defenderModifierContext?.flankRearBranch),
    supportDiagnostics: [
      ...(attackerSupportAssignments.diagnostics ?? []),
      ...(defenderSupportAssignments.diagnostics ?? []),
    ],
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
    roundStateByMeleeId: overrides.roundStateByMeleeId && typeof overrides.roundStateByMeleeId === 'object'
      ? { ...overrides.roundStateByMeleeId }
      : {},
    commanderRoundStateByMeleeId: overrides.commanderRoundStateByMeleeId && typeof overrides.commanderRoundStateByMeleeId === 'object'
      ? { ...overrides.commanderRoundStateByMeleeId }
      : {},
    batchSummary: overrides.batchSummary ?? null,
  };
}

export function getMeleeRolePresentation({ gameState, unitIds = null } = {}) {
  const units = Array.isArray(gameState?.game?.units) ? gameState.game.units : [];
  const selectedUnits = Array.isArray(unitIds)
    ? units.filter((unit) => unitIds.includes(unit.id))
    : units;

  const roleSummary = summarizeMeleeContactRoles(selectedUnits);

  return {
    entries: roleSummary.entries,
    counts: roleSummary.counts,
    mainUnitIds: roleSummary.mainUnitIds,
    simpleSupportUnitIds: roleSummary.simpleSupportUnitIds,
    meleeSupportUnitIds: roleSummary.meleeSupportUnitIds,
    allEntries: selectedUnits.map((unit) => classifyMeleeContactUnit(unit)),
  };
}

function getEligibleMeleeEntries(gameState) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  const activePlayerId = gameState?.commandContext?.activePlayerId ?? null;
  const hasGeometry = (unit) => Number.isFinite(unit?.xUd)
    && Number.isFinite(unit?.yUd)
    && Number.isFinite(unit?.widthUd)
    && Number.isFinite(unit?.depthUd);
  const useGeometryEligibility = units.every((unit) => hasGeometry(unit));

  if (!useGeometryEligibility) {
    const unitsById = new Map(units.map((unit) => [unit.id, unit]));
    const attackersByDefenderId = new Map();

    for (const attacker of units) {
      if (!attacker || attacker.owner !== activePlayerId || !attacker.engagedInMelee) {
        continue;
      }

      const defenderId = getUnitPrincipalOpponentId(attacker);
      const defender = defenderId ? unitsById.get(defenderId) : null;
      if (!defender) {
        continue;
      }

      if (!isRoleAwareMainAttackerCandidate(attacker, defender, { requireGeometryContact: false })) {
        continue;
      }

      if (!attackersByDefenderId.has(defender.id)) {
        attackersByDefenderId.set(defender.id, []);
      }
      attackersByDefenderId.get(defender.id).push(attacker);
    }

    const legacyGroups = [];
    for (const [defenderId, attackers] of attackersByDefenderId.entries()) {
      const defender = unitsById.get(defenderId);
      if (!defender || !Array.isArray(attackers) || attackers.length === 0) {
        continue;
      }

      const orderedAttackers = [...attackers].sort((left, right) => String(left?.id ?? '').localeCompare(String(right?.id ?? '')));
      const primaryAttacker = selectPrimaryAttackerForDefender(orderedAttackers, defender);
      if (!primaryAttacker) {
        continue;
      }

      const groupedEntry = createCombatGroupEntry({
        attackerUnit: primaryAttacker,
        defenderUnit: defender,
        allUnits: units,
        additionalAttackers: orderedAttackers.filter((attacker) => attacker.id !== primaryAttacker.id),
      });
      if (groupedEntry) {
        legacyGroups.push(groupedEntry);
      }
    }

    return legacyGroups;
  }

  const activeUnits = units.filter((unit) => unit?.owner === activePlayerId);
  const enemyUnits = units.filter((unit) => unit?.owner && unit.owner !== activePlayerId);
  const entries = [];
  const attackersByDefenderId = new Map();

  for (const attacker of activeUnits) {
    const classifiedContactCandidates = enemyUnits
      .filter((defender) => isRoleAwareMainAttackerCandidate(attacker, defender, { requireGeometryContact: true }))
      .sort((left, right) => sortContactsByDistanceThenId(attacker, left, right));

    for (const defender of classifiedContactCandidates) {
      if (!attackersByDefenderId.has(defender.id)) {
        attackersByDefenderId.set(defender.id, []);
      }
      attackersByDefenderId.get(defender.id).push(attacker);
    }
  }

  for (const [defenderId, attackers] of attackersByDefenderId.entries()) {
    const defender = enemyUnits.find((unit) => unit?.id === defenderId) ?? null;
    if (!defender || !Array.isArray(attackers) || attackers.length === 0) {
      continue;
    }

    const orderedAttackers = [...new Map(attackers.map((attacker) => [attacker.id, attacker])).values()]
      .sort((left, right) => sortContactsByDistanceThenId(defender, left, right));
    const primaryAttacker = selectPrimaryAttackerForDefender(orderedAttackers, defender);
    if (!primaryAttacker) {
      continue;
    }

    const groupedEntry = createCombatGroupEntry({
      attackerUnit: primaryAttacker,
      defenderUnit: defender,
      allUnits: units,
      additionalAttackers: orderedAttackers.filter((attacker) => attacker.id !== primaryAttacker.id),
    });
    if (groupedEntry) {
      entries.push(groupedEntry);
    }
  }

  return entries;
}

export function getMeleeProcedurePresentation(gameState) {
  const meleeState = gameState?.melee ?? createInitialMeleeState();
  const allUnits = Array.isArray(gameState?.units) ? gameState.units : [];
  const eligibleEntries = getEligibleMeleeEntries(gameState);
  const eligibleById = new Map(eligibleEntries.map((entry) => [entry.id, entry]));
  const roleCounts = summarizeMeleeContactRoles(allUnits).counts;
  const mainUnitIds = getMainMeleeUnitIds(eligibleEntries);
  const supportUnitIds = getSupportUnitIds(allUnits, mainUnitIds);
  const queueSelectionIds = Array.isArray(meleeState.queueSelectionIds)
    ? meleeState.queueSelectionIds.filter((id) => eligibleById.has(id))
    : [];
  const resolvedMeleeIds = Array.isArray(meleeState.resolvedMeleeIds) ? meleeState.resolvedMeleeIds : [];

  return {
    status: meleeState.status,
    eligibleEntries,
    queueSelectionIds,
    queue: Array.isArray(meleeState.queue) ? meleeState.queue : [],
    batchPreview: meleeState.batchPreview,
    batchApplicationPlan: meleeState.batchApplicationPlan,
    diagnostics: Array.isArray(meleeState.diagnostics) ? meleeState.diagnostics : [],
    resolutionDraft: meleeState.resolutionDraft
      ? {
          ...meleeState.resolutionDraft,
          factorPresentation: createDraftFactorPresentation(meleeState.resolutionDraft, allUnits),
        }
      : null,
    resolvedEntriesByMeleeId: meleeState.resolvedEntriesByMeleeId ?? {},
    resolvedMeleeIds,
    batchSummary: meleeState.batchSummary,
    overview: {
      eligibleMelees: eligibleEntries.length,
      selectedMelees: queueSelectionIds.length,
      resolvedMelees: resolvedMeleeIds.length,
      unresolvedMelees: Math.max(0, queueSelectionIds.length - resolvedMeleeIds.length),
      previewedMelees: Array.isArray(meleeState.batchPreview?.resolvedEntries)
        ? meleeState.batchPreview.resolvedEntries.length
        : 0,
      sourceOpenPreviews: Array.isArray(meleeState.batchPreview?.resolvedEntries)
        ? meleeState.batchPreview.resolvedEntries.filter((entry) => entry?.resolution?.status === MELEE_RESOLUTION_STATUSES.SOURCE_OPEN).length
        : 0,
      mainUnits: mainUnitIds.size > 0 ? mainUnitIds.size : roleCounts.mainUnits,
      supportUnits: supportUnitIds.size,
    },
    involvedUnitIds: [...new Set([...mainUnitIds, ...supportUnitIds])],
  };
}

export function beginMeleePhaseState(gameState, overrides = {}) {
  return {
    ...gameState,
    melee: createInitialMeleeState({
      ...gameState?.melee,
      status: MELEE_PROCEDURE_STATUSES.ANNOUNCED,
      phaseId: overrides.phaseId ?? 'melee',
      actingPlayerId: overrides.actingPlayerId ?? gameState?.commandContext?.activePlayerId ?? null,
    }),
  };
}

export function acknowledgeMeleePhaseProcedure(gameState) {
  const eligibleEntries = getEligibleMeleeEntries(gameState);
  const queueSelectionIds = eligibleEntries.map((entry) => entry.id);

  return {
    ...gameState,
    melee: createInitialMeleeState({
      ...gameState?.melee,
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      queueSelectionIds,
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
  };
}

export function setMeleeProcedureDialogOpen(gameState, isDialogOpen) {
  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      isDialogOpen: Boolean(isDialogOpen),
    },
  };
}

export function toggleMeleeQueueSelection(gameState, meleeId) {
  if (typeof meleeId !== 'string' || meleeId.length === 0) {
    return gameState;
  }

  const presentation = getMeleeProcedurePresentation(gameState);
  const selected = new Set(presentation.queueSelectionIds);
  if (selected.has(meleeId)) {
    selected.delete(meleeId);
  } else {
    selected.add(meleeId);
  }

  const queueSelectionIds = presentation.eligibleEntries
    .map((entry) => entry.id)
    .filter((entryId) => selected.has(entryId));

  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      queueSelectionIds,
      queue: [],
      batchPreview: null,
      batchApplicationPlan: null,
      isDialogOpen: gameState.melee?.isDialogOpen ?? false,
    },
  };
}

export function moveMeleeQueueSelection(gameState, meleeId, direction) {
  if (typeof meleeId !== 'string' || (direction !== 'up' && direction !== 'down')) {
    return gameState;
  }

  const currentSelection = Array.isArray(gameState?.melee?.queueSelectionIds)
    ? [...gameState.melee.queueSelectionIds]
    : [];
  const currentIndex = currentSelection.indexOf(meleeId);
  if (currentIndex === -1) {
    return gameState;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= currentSelection.length) {
    return gameState;
  }

  const temp = currentSelection[targetIndex];
  currentSelection[targetIndex] = currentSelection[currentIndex];
  currentSelection[currentIndex] = temp;

  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      queueSelectionIds: currentSelection,
      queue: [],
      batchPreview: null,
      batchApplicationPlan: null,
      isDialogOpen: gameState.melee?.isDialogOpen ?? false,
    },
  };
}

export function previewMeleeBatch(gameState) {
  const presentation = getMeleeProcedurePresentation(gameState);
  const batchQueue = createMeleeBatchQueue({
    eligibleMelees: presentation.eligibleEntries,
    selectedMeleeIds: presentation.queueSelectionIds,
  });
  const batchPreview = resolveMeleeBatchPreview({ queue: batchQueue.queue });

  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.PREVIEW_READY,
      queue: batchQueue.queue,
      batchPreview,
      batchApplicationPlan: null,
      diagnostics: [...batchQueue.diagnostics],
    },
  };
}

function getMeleeEntryById(gameState, meleeId) {
  if (!meleeId) {
    return null;
  }

  return getEligibleMeleeEntries(gameState).find((entry) => entry.id === meleeId) ?? null;
}

function getMeleeEntryByUnitId(gameState, unitId) {
  return getMeleeEntriesByUnitId(gameState, unitId)[0] ?? null;
}

function resolveMeleeLookupUnitId(gameState, unitId) {
  if (!unitId) {
    return null;
  }

  const allUnits = Array.isArray(gameState?.units) ? gameState.units : [];
  const unit = allUnits.find((candidate) => candidate?.id === unitId) ?? null;
  if (unit?.isCommander === true && unit?.attachedUnitId) {
    return unit.attachedUnitId;
  }

  return unitId;
}

function getMeleeEntriesByUnitId(gameState, unitId) {
  const lookupUnitId = resolveMeleeLookupUnitId(gameState, unitId);
  if (!lookupUnitId) {
    return [];
  }

  return getEligibleMeleeEntries(gameState)
    .filter((entry) => (
      entry.attackerUnitId === lookupUnitId
      || entry.defenderUnitId === lookupUnitId
      || (Array.isArray(entry.combatGroupAttackerUnitIds) && entry.combatGroupAttackerUnitIds.includes(lookupUnitId))
    ));
}

function getCommanderContributionFromState({
  gameState,
  mainUnit,
  supportAssignments,
  side,
} = {}) {
  if (!mainUnit) {
    return {
      modifierContext: {
        sourceStatus: 'verified',
        engagedCommander: {
          status: 'not-engaged',
          participation: 'none',
          supportOnly: false,
          sourceStatus: 'verified',
        },
      },
      diagnostics: [],
    };
  }

  const allUnits = Array.isArray(gameState?.units) ? gameState.units : [];
  const commandCommander = gameState?.commandContext?.commander ?? null;
  const diagnostics = [];
  const supportEntries = Array.isArray(supportAssignments?.entries) ? supportAssignments.entries : [];
  const supportCommanderUnitIds = supportEntries
    .map((entry) => entry?.unit)
    .filter(Boolean)
    .filter((unit) => (
      unit.hasIncludedCommander
      || Boolean(unit.attachedCommanderId)
      || (unit.isCommander && !unit.hasIncludedCommander)
    ))
    .map((unit) => unit.id);

  let participation = 'none';
  let status = 'not-engaged';
  let sourceStatus = 'verified';
  let provenance = 'none';

  if (mainUnit.hasIncludedCommander === true) {
    participation = 'included';
    status = 'engaged-main-unit';
    provenance = 'unit.hasIncludedCommander';
  }

  if (participation === 'none' && mainUnit.attachedCommanderId) {
    const attachedCommander = allUnits.find((unit) => unit?.id === mainUnit.attachedCommanderId) ?? null;
    if (!attachedCommander || attachedCommander.isCommander !== true) {
      status = 'not-engaged';
      sourceStatus = 'needs-source-check';
      provenance = 'unit.attachedCommanderId';
      diagnostics.push({
        code: 'melee.commander.attached-unit-link-source-open',
        message: `Main unit '${mainUnit.id}' references attached commander '${mainUnit.attachedCommanderId}', but the commander unit is missing or invalid.`,
        side,
        mainUnitId: mainUnit.id,
        commanderUnitId: mainUnit.attachedCommanderId,
        sourceStatus,
      });
    } else {
      participation = 'attached';
      status = 'engaged-main-unit';
      provenance = 'unit.attachedCommanderId';
      if (attachedCommander.attachedUnitId && attachedCommander.attachedUnitId !== mainUnit.id) {
        sourceStatus = 'needs-source-check';
        diagnostics.push({
          code: 'melee.commander.reverse-link-source-open',
          message: `Commander '${attachedCommander.id}' is linked to '${attachedCommander.attachedUnitId}', not '${mainUnit.id}'.`,
          side,
          mainUnitId: mainUnit.id,
          commanderUnitId: attachedCommander.id,
          attachedUnitId: attachedCommander.attachedUnitId,
          sourceStatus,
        });
      }
    }
  }

  if (participation === 'none' && commandCommander?.attachedUnitId === mainUnit.id) {
    participation = commandCommander.unitId === mainUnit.id || mainUnit.hasIncludedCommander === true
      ? 'included'
      : 'attached';
    status = commandCommander.engagedInCombat === true ? 'engaged-main-unit' : 'not-engaged';
    sourceStatus = typeof commandCommander.sourceStatus === 'string'
      ? commandCommander.sourceStatus
      : 'needs-source-check';
    provenance = 'command-context';
  }

  const supportOnly = participation === 'none' && supportCommanderUnitIds.length > 0;
  if (supportOnly) {
    status = 'support-only';
    provenance = 'support-role-only';
  }

  return {
    modifierContext: {
      sourceStatus,
      engagedCommander: {
        status,
        participation,
        supportOnly,
        supportCommanderUnitIds,
        sourceStatus,
        provenance,
      },
    },
    diagnostics,
  };
}

export function getMeleeUnitStatus(gameState, unitId) {
  const presentation = getMeleeProcedurePresentation(gameState);
  const lookupUnitId = resolveMeleeLookupUnitId(gameState, unitId);
  const involvedIds = new Set(Array.isArray(presentation?.involvedUnitIds) ? presentation.involvedUnitIds : []);
  if (!lookupUnitId || !involvedIds.has(lookupUnitId)) {
    return 'non-melee';
  }

  const entry = getMeleeEntryByUnitId(gameState, unitId);
  if (!entry) {
    return 'pending';
  }

  const resolvedMeleeIds = new Set(
    Array.isArray(gameState?.melee?.resolvedMeleeIds) ? gameState.melee.resolvedMeleeIds : [],
  );
  return resolvedMeleeIds.has(entry.id) ? 'resolved' : 'pending';
}

function createInitialResolutionDraft(gameState, entry, previousDraft = null) {
  const previousInput = previousDraft?.resolutionInput ?? {};
  const input = entry?.resolutionInput ?? {};
  const attackerUnit = input.attackerUnit ?? null;
  const defenderUnit = input.defenderUnit ?? null;
  const allUnits = Array.isArray(entry?.allUnits) ? entry.allUnits : [];
  const attackerMainSupportAssignments = getSupportAssignmentsForMain(allUnits, attackerUnit);
  const attackerCombatGroupSupportAssignments = getCombatGroupMeleeSupportAssignments({
    units: allUnits,
    attackerMainUnit: attackerUnit,
    defenderMainUnit: defenderUnit,
  });
  const attackerSupportAssignments = {
    entries: [
      ...(attackerMainSupportAssignments.entries ?? []),
      ...(attackerCombatGroupSupportAssignments.entries ?? []),
    ],
    diagnostics: [
      ...(attackerMainSupportAssignments.diagnostics ?? []),
      ...(attackerCombatGroupSupportAssignments.diagnostics ?? []),
    ],
  };
  const defenderSupportAssignments = getSupportAssignmentsForMain(allUnits, defenderUnit);
  const attackerFlankRearContribution = getFlankRearModifierContribution({
    attackerUnit,
    defenderUnit,
    side: 'attacker',
    allUnits,
  });
  const defenderFlankRearContribution = getFlankRearModifierContribution({
    attackerUnit: defenderUnit,
    defenderUnit: attackerUnit,
    side: 'defender',
    allUnits,
  });
  const defenderCentricToZeroAggregation = resolveDefenderCentricToZeroAggregation({
    gameState,
    attackerUnit,
    defenderUnit,
    allUnits,
    additionalAttackerUnits: input.additionalAttackerUnits,
  });
  const multipleAttackImmediateTrigger = resolveMultipleAttackImmediateTriggerFromEvidence({
    attackerUnit,
    defenderUnit,
  });
  const attackerCommanderContribution = getCommanderContributionFromState({
    gameState,
    mainUnit: attackerUnit,
    supportAssignments: attackerSupportAssignments,
    side: 'attacker',
  });
  const defenderCommanderContribution = getCommanderContributionFromState({
    gameState,
    mainUnit: defenderUnit,
    supportAssignments: defenderSupportAssignments,
    side: 'defender',
  });
  const additionalMainAttackerContributionGuard = createAdditionalMainAttackerContributionGuard(
    input.additionalAttackerUnits,
    defenderUnit,
  );
  const attackerSupportBuild = createSupportModifierEntries(attackerSupportAssignments, 'attacker', defenderUnit);
  const defenderSupportBuild = createSupportModifierEntries(defenderSupportAssignments, 'defender', attackerUnit);
  const attackerSupportModifierEntries = [
    ...attackerSupportBuild.entries,
    ...additionalMainAttackerContributionGuard.entries,
  ];
  const defenderSupportModifierEntries = defenderSupportBuild.entries;
  const attackerExistingEntries = Array.isArray(previousInput.attackerModifierEntries)
    ? previousInput.attackerModifierEntries.filter((modifier) => modifier?.stage !== MELEE_MODIFIER_STAGES.SUPPORT)
    : [];
  const defenderExistingEntries = Array.isArray(previousInput.defenderModifierEntries)
    ? previousInput.defenderModifierEntries.filter((modifier) => modifier?.stage !== MELEE_MODIFIER_STAGES.SUPPORT)
    : [];
  const attackerExistingContext = previousInput.attackerModifierContext && typeof previousInput.attackerModifierContext === 'object'
    ? previousInput.attackerModifierContext
    : {};
  const defenderExistingContext = previousInput.defenderModifierContext && typeof previousInput.defenderModifierContext === 'object'
    ? previousInput.defenderModifierContext
    : {};
  const meleeId = entry?.id ?? null;
  const storedRoundState = meleeId ? gameState?.melee?.roundStateByMeleeId?.[meleeId] : null;
  const roundState = Object.values(MELEE_ROUND_STATES).includes(storedRoundState)
    ? storedRoundState
    : MELEE_ROUND_STATES.FIRST_CONTACT;
  const priorCommanderState = meleeId ? gameState?.melee?.commanderRoundStateByMeleeId?.[meleeId] ?? null : null;
  const continuingRoundDiagnostics = [];

  if (roundState === MELEE_ROUND_STATES.CONTINUING) {
    continuingRoundDiagnostics.push({
      code: 'melee.commander.continuing-round-persistence-source-open',
      message: `Continuing-round commander persistence for melee '${meleeId}' remains source-open; no detach/combat-lock enforcement was applied in this slice.`,
      meleeId,
      sourceStatus: 'needs-source-check',
      openVerificationIds: COMMANDER_PERSISTENCE_OPEN_VERIFICATION_IDS,
      reviewerHandoffRequired: true,
    });

    const attackerPriorParticipation = priorCommanderState?.attacker?.participation ?? 'none';
    const defenderPriorParticipation = priorCommanderState?.defender?.participation ?? 'none';
    const attackerCurrentParticipation = attackerCommanderContribution.modifierContext.engagedCommander?.participation ?? 'none';
    const defenderCurrentParticipation = defenderCommanderContribution.modifierContext.engagedCommander?.participation ?? 'none';
    if (
      attackerPriorParticipation !== attackerCurrentParticipation
      || defenderPriorParticipation !== defenderCurrentParticipation
    ) {
      continuingRoundDiagnostics.push({
        code: 'melee.commander.continuing-round-detach-lock-ambiguity',
        message: `Commander participation changed in continuing melee '${meleeId}' (attacker ${attackerPriorParticipation} -> ${attackerCurrentParticipation}, defender ${defenderPriorParticipation} -> ${defenderCurrentParticipation}); wording ambiguity requires immediate Reviewer / Rules Agent handoff before enforcement.`,
        meleeId,
        sourceStatus: 'needs-source-check',
        openVerificationIds: COMMANDER_PERSISTENCE_OPEN_VERIFICATION_IDS,
        reviewerHandoffRequired: true,
      });
    }
  }

  return {
    meleeId,
    attackerUnitId: attackerUnit?.id ?? null,
    defenderUnitId: defenderUnit?.id ?? null,
    attackerLabel: attackerUnit?.scenarioLabel ?? attackerUnit?.id ?? 'Attacker',
    defenderLabel: defenderUnit?.scenarioLabel ?? defenderUnit?.id ?? 'Defender',
    resolutionInput: {
      ...input,
      attackerDieRoll: Number(previousInput.attackerDieRoll ?? input.attackerDieRoll ?? 4),
      defenderDieRoll: Number(previousInput.defenderDieRoll ?? input.defenderDieRoll ?? 4),
      attackerCombatFactorValue: Number.isFinite(previousInput.attackerCombatFactorValue)
        ? Number(previousInput.attackerCombatFactorValue)
        : null,
      defenderCombatFactorValue: Number.isFinite(previousInput.defenderCombatFactorValue)
        ? Number(previousInput.defenderCombatFactorValue)
        : null,
      attackerModifierEntries: [...attackerSupportModifierEntries, ...attackerExistingEntries],
      defenderModifierEntries: [...defenderSupportModifierEntries, ...defenderExistingEntries],
      attackerCombatFactorSourceStatus: previousInput.attackerCombatFactorSourceStatus ?? null,
      defenderCombatFactorSourceStatus: previousInput.defenderCombatFactorSourceStatus ?? null,
      combatFactorDebugOverrideEnabled: previousInput.combatFactorDebugOverrideEnabled === true,
      multipleAttackImmediateTrigger: previousInput.multipleAttackImmediateTrigger
        ?? input.multipleAttackImmediateTrigger
        ?? multipleAttackImmediateTrigger,
      meleeRoundState: roundState,
      attackerModifierContext: {
        ...attackerExistingContext,
        ...attackerFlankRearContribution.modifierContext,
        flankRearBranch: {
          ...(attackerFlankRearContribution.modifierContext?.flankRearBranch ?? {}),
          ...(defenderCentricToZeroAggregation.modifierContext?.flankRearBranch ?? {}),
        },
        ...attackerCommanderContribution.modifierContext,
        engagedCommander: attackerCommanderContribution.modifierContext.engagedCommander,
      },
      defenderModifierContext: {
        ...defenderExistingContext,
        ...defenderFlankRearContribution.modifierContext,
        ...defenderCommanderContribution.modifierContext,
        engagedCommander: defenderCommanderContribution.modifierContext.engagedCommander,
      },
    },
    diagnostics: [
      ...attackerFlankRearContribution.diagnostics,
      ...defenderFlankRearContribution.diagnostics,
      ...defenderCentricToZeroAggregation.diagnostics,
      ...(attackerSupportBuild.diagnostics ?? []),
      ...(defenderSupportBuild.diagnostics ?? []),
      ...additionalMainAttackerContributionGuard.diagnostics,
      ...attackerCommanderContribution.diagnostics,
      ...defenderCommanderContribution.diagnostics,
      ...continuingRoundDiagnostics,
    ],
  };
}

export function startMeleeResolutionDraft(gameState, { unitId = null, meleeId = null } = {}) {
  const entryCandidates = meleeId
    ? [getMeleeEntryById(gameState, meleeId)].filter(Boolean)
    : getMeleeEntriesByUnitId(gameState, unitId);
  const entry = entryCandidates[0] ?? null;
  if (!entry) {
    return gameState;
  }

  const diagnostics = Array.isArray(gameState?.melee?.diagnostics) ? [...gameState.melee.diagnostics] : [];
  if (!meleeId && entryCandidates.length > 1) {
    diagnostics.push({
      code: 'melee-selection-ambiguous-for-unit',
      message: `Unit '${unitId}' belongs to multiple contact-graph entries; deterministic first entry selected.`,
      unitId,
      selectedMeleeId: entry.id,
      candidateMeleeIds: entryCandidates.map((candidate) => candidate.id),
      sourceStatus: 'needs-source-check',
    });
  }

  const resolutionDraft = createInitialResolutionDraft(gameState, entry, gameState?.melee?.resolutionDraft);
  diagnostics.push(...(Array.isArray(resolutionDraft?.diagnostics) ? resolutionDraft.diagnostics : []));

  return {
    ...gameState,
    selectedUnitId: entry.attackerUnitId,
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      resolutionDraft,
      diagnostics,
      isDialogOpen: false,
    },
  };
}

export function cancelMeleeResolutionDraft(gameState) {
  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      resolutionDraft: null,
    },
  };
}

export function setMeleeResolutionDraftValue(gameState, key, value) {
  const draft = gameState?.melee?.resolutionDraft;
  if (!draft?.resolutionInput || !Object.prototype.hasOwnProperty.call(draft.resolutionInput, key)) {
    return gameState;
  }

  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      resolutionDraft: {
        ...draft,
        resolutionInput: {
          ...draft.resolutionInput,
          [key]: value,
        },
      },
    },
  };
}

export function confirmMeleeResolutionDraft(gameState) {
  const draft = gameState?.melee?.resolutionDraft;
  if (!draft?.meleeId || !draft.resolutionInput) {
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
    [draft.meleeId]: MELEE_ROUND_STATES.CONTINUING,
  };
  const commanderRoundStateByMeleeId = {
    ...(gameState?.melee?.commanderRoundStateByMeleeId ?? {}),
    [draft.meleeId]: {
      attacker: draft?.resolutionInput?.attackerModifierContext?.engagedCommander ?? {
        participation: 'none',
        status: 'not-engaged',
      },
      defender: draft?.resolutionInput?.defenderModifierContext?.engagedCommander ?? {
        participation: 'none',
        status: 'not-engaged',
      },
    },
  };

  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.ACTIVE,
      resolvedEntriesByMeleeId,
      resolvedMeleeIds,
      roundStateByMeleeId,
      commanderRoundStateByMeleeId,
      resolutionDraft: null,
      batchPreview: null,
      batchApplicationPlan: null,
    },
  };
}

export function canApplyResolvedMeleeBatch(gameState) {
  const selectedMeleeIds = Array.isArray(gameState?.melee?.queueSelectionIds)
    ? gameState.melee.queueSelectionIds
    : [];
  const resolvedMeleeIds = new Set(Array.isArray(gameState?.melee?.resolvedMeleeIds) ? gameState.melee.resolvedMeleeIds : []);
  return selectedMeleeIds.length > 0 && selectedMeleeIds.every((meleeId) => resolvedMeleeIds.has(meleeId));
}

export function acknowledgeMeleeBatchSummary(gameState) {
  return {
    ...gameState,
    melee: {
      ...gameState.melee,
      batchSummary: null,
    },
  };
}

function applyMeleeBatchPlanToUnits(units = [], plan = null) {
  const cohesionLossByUnitId = plan?.effects?.cohesionLossByUnitId ?? {};
  const routedUnitIds = new Set(Array.isArray(plan?.effects?.routedUnitIds) ? plan.effects.routedUnitIds : []);

  return (Array.isArray(units) ? units : []).map((unit) => {
    const loss = Number(cohesionLossByUnitId[unit.id] ?? 0);
    if (loss <= 0 && !routedUnitIds.has(unit.id)) {
      return unit;
    }

    return {
      ...unit,
      meleeCohesionLossTotal: Number(unit.meleeCohesionLossTotal ?? 0) + loss,
      meleeRouted: routedUnitIds.has(unit.id) ? true : Boolean(unit.meleeRouted),
    };
  });
}

export function applyMeleeBatch(gameState) {
  const selectedMeleeIds = Array.isArray(gameState?.melee?.queueSelectionIds)
    ? gameState.melee.queueSelectionIds
    : [];
  const resolvedEntriesByMeleeId = gameState?.melee?.resolvedEntriesByMeleeId ?? {};
  const resolvedEntries = selectedMeleeIds
    .map((meleeId) => resolvedEntriesByMeleeId[meleeId])
    .filter(Boolean);

  if (resolvedEntries.length === 0 && !gameState?.melee?.batchPreview) {
    return gameState;
  }

  const batchPreview = resolvedEntries.length > 0
    ? {
        queue: selectedMeleeIds.map((meleeId) => ({ id: meleeId })),
        resolvedEntries,
        hasSourceOpenResolution: resolvedEntries.some(
          (entry) => entry?.resolution?.status === MELEE_RESOLUTION_STATUSES.SOURCE_OPEN,
        ),
      }
    : gameState.melee.batchPreview;

  const batchApplicationPlan = buildMeleeBatchApplicationPlan({
    batchPreview,
  });

  const cohesionLossCount = Object.values(batchApplicationPlan.effects?.cohesionLossByUnitId ?? {})
    .reduce((sum, value) => sum + Number(value ?? 0), 0);
  const routedCount = Array.isArray(batchApplicationPlan.effects?.routedUnitIds)
    ? batchApplicationPlan.effects.routedUnitIds.length
    : 0;

  return {
    ...gameState,
    units: applyMeleeBatchPlanToUnits(gameState.units, batchApplicationPlan),
    melee: {
      ...gameState.melee,
      status: MELEE_PROCEDURE_STATUSES.APPLIED,
      batchPreview,
      batchApplicationPlan,
      batchSummary: {
        isOpen: true,
        resolvedMelees: resolvedEntries.length,
        cohesionLossCount,
        routedCount,
      },
    },
  };
}

export function createMeleeBatchQueue({
  eligibleMelees = [],
  selectedMeleeIds = [],
} = {}) {
  const eligibleById = new Map(
    (Array.isArray(eligibleMelees) ? eligibleMelees : [])
      .filter((entry) => typeof entry?.id === 'string')
      .map((entry) => [entry.id, entry]),
  );

  const queue = [];
  const diagnostics = [];

  for (const meleeId of Array.isArray(selectedMeleeIds) ? selectedMeleeIds : []) {
    if (!eligibleById.has(meleeId)) {
      diagnostics.push({
        code: 'melee-queue-id-not-eligible',
        message: `Selected melee '${meleeId}' is not eligible in the current queue slice.`,
        meleeId,
      });
      continue;
    }

    const entry = eligibleById.get(meleeId);
    queue.push({
      ...entry,
      id: meleeId,
    });
  }

  return {
    queue,
    diagnostics,
  };
}

export function resolveMeleeBatchPreview({
  queue = [],
  resolveMelee = resolveMeleeOutcome,
} = {}) {
  const queuedEntries = Array.isArray(queue) ? queue : [];
  const queueWithIndices = queuedEntries.map((entry, index) => ({ entry, index }));
  const multipleAttackGroups = new Map();
  for (const { entry, index } of queueWithIndices) {
    const defenderUnitId = entry?.resolutionInput?.defenderUnit?.id ?? entry?.defenderUnitId ?? null;
    if (!defenderUnitId) {
      continue;
    }
    if (!multipleAttackGroups.has(defenderUnitId)) {
      multipleAttackGroups.set(defenderUnitId, []);
    }
    multipleAttackGroups.get(defenderUnitId).push({ entry, index });
  }

  const immediateEffects = [];
  const diagnostics = [];
  for (const [defenderUnitId, groupEntries] of multipleAttackGroups.entries()) {
    if (groupEntries.length <= 1) {
      continue;
    }

    const sortedGroup = [...groupEntries].sort((left, right) => left.index - right.index);
    const attackerUnitIds = sortedGroup
      .map(({ entry }) => entry?.resolutionInput?.attackerUnit?.id ?? entry?.attackerUnitId ?? null)
      .filter(Boolean);
    const explicitLossCandidates = sortedGroup
      .map(({ entry }) => Number(entry?.resolutionInput?.multipleAttackImmediateCohesionLoss))
      .filter((value) => Number.isFinite(value) && value >= 0);
    const bridgeTriggers = sortedGroup
      .map(({ entry }) => entry?.resolutionInput?.multipleAttackImmediateTrigger)
      .filter((trigger) => trigger && typeof trigger === 'object');
    const verifiedBridgeLossCandidates = bridgeTriggers
      .filter((trigger) => trigger?.sourceStatus === 'verified')
      .map((trigger) => Number(trigger?.cohesionLoss))
      .filter((value) => Number.isFinite(value) && value >= 0);
    explicitLossCandidates.push(...verifiedBridgeLossCandidates);
    if (explicitLossCandidates.length === 0) {
      diagnostics.push({
        code: 'melee-multiple-attack-immediate-source-open',
        message: `Defender '${defenderUnitId}' has ${sortedGroup.length} simultaneous contacts, but the immediate multiple-attack trigger must come from the contact-generation phase instead of being derived in the melee preview.`,
        defenderUnitId,
        contactCount: sortedGroup.length,
        triggerSourceStatuses: bridgeTriggers
          .map((trigger) => trigger?.sourceStatus)
          .filter((status) => typeof status === 'string'),
      });
      continue;
    }

    const explicitLoss = Math.max(...explicitLossCandidates);

    immediateEffects.push({
      type: MELEE_IMMEDIATE_EFFECT_TYPES.MULTIPLE_ATTACK,
      timing: 'pre-resolution',
      defenderUnitId,
      attackerUnitIds,
      contactCount: sortedGroup.length,
      cohesionLoss: Number(explicitLoss),
      sourceStatus: 'verified',
      status: 'resolved',
    });
  }

  const resolvedEntries = queuedEntries.map((entry, index) => {
    const payload = entry?.resolutionInput ?? {};
    const resolution = resolveMelee(payload);

    return {
      queueIndex: index,
      meleeId: entry?.id ?? `melee-${index + 1}`,
      attackerUnitId: payload?.attackerUnit?.id ?? null,
      defenderUnitId: payload?.defenderUnit?.id ?? null,
      resolution,
      applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.PENDING_SIMULTANEOUS_BATCH,
    };
  });

  return {
    queue: queuedEntries,
    immediateEffects,
    diagnostics,
    resolvedEntries,
    hasSourceOpenResolution: resolvedEntries.some(
      (entry) => entry?.resolution?.status === MELEE_RESOLUTION_STATUSES.SOURCE_OPEN,
    ) || immediateEffects.some((entry) => entry?.status === 'source-open'),
  };
}

export function buildMeleeBatchApplicationPlan({
  batchPreview = null,
} = {}) {
  const immediateEffects = Array.isArray(batchPreview?.immediateEffects)
    ? batchPreview.immediateEffects
    : [];
  const resolvedEntries = Array.isArray(batchPreview?.resolvedEntries)
    ? batchPreview.resolvedEntries
    : [];

  const cohesionLossByUnitId = new Map();
  const routedUnitIds = new Set();

  for (const effect of immediateEffects) {
    if (effect?.type !== MELEE_IMMEDIATE_EFFECT_TYPES.MULTIPLE_ATTACK || effect?.status !== 'resolved') {
      continue;
    }

    const defenderUnitId = effect?.defenderUnitId ?? null;
    const cohesionLoss = Number(effect?.cohesionLoss ?? 0);
    if (!defenderUnitId || cohesionLoss <= 0) {
      continue;
    }

    cohesionLossByUnitId.set(
      defenderUnitId,
      Number(cohesionLossByUnitId.get(defenderUnitId) ?? 0) + cohesionLoss,
    );
  }

  for (const entry of resolvedEntries) {
    if (entry?.resolution?.status !== MELEE_RESOLUTION_STATUSES.RESOLVED) {
      continue;
    }

    const winnerSide = entry.resolution.result?.winnerSide ?? null;
    const loserUnitId = winnerSide === 'attacker'
      ? entry.defenderUnitId
      : winnerSide === 'defender'
        ? entry.attackerUnitId
        : null;

    if (!loserUnitId) {
      continue;
    }

    const cohesionLoss = Number(entry.resolution.result?.cohesionLoss ?? 0);
    if (cohesionLoss > 0) {
      cohesionLossByUnitId.set(
        loserUnitId,
        Number(cohesionLossByUnitId.get(loserUnitId) ?? 0) + cohesionLoss,
      );
    }

    if (entry.resolution.result?.rout === true) {
      routedUnitIds.add(loserUnitId);
    }
  }

  return {
    applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.APPLIED_AT_BATCH_END,
    effects: {
      cohesionLossByUnitId: Object.fromEntries(cohesionLossByUnitId.entries()),
      routedUnitIds: [...routedUnitIds],
    },
    appliedImmediateEffects: immediateEffects.map((effect) => ({
      ...effect,
      applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.APPLIED_AT_BATCH_END,
    })),
    appliedEntries: resolvedEntries.map((entry) => ({
      meleeId: entry.meleeId,
      applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.APPLIED_AT_BATCH_END,
    })),
  };
}

export function toggleMeleeResolutionCombatFactorDebugOverride(gameState) {
  const draft = gameState?.melee?.resolutionDraft;
  if (!draft?.resolutionInput) {
    return gameState;
  }

  const nextEnabled = draft.resolutionInput.combatFactorDebugOverrideEnabled !== true;
  return {
    ...gameState,
    melee: {
      ...gameState.melee,
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
  };
}