import {
  getResolvedAbilityIdsForUnit,
} from '../../data/unit-profiles.js';
import {
  SHOOTING_SOURCE_STATUSES,
  createShotResolutionRecord,
  createShootingRollClaim,
  createShootingRollResult,
} from './model.js';
import { SHOOTING_SUPPORT_STATUSES } from './support.js';

export const SHOOTING_RESOLUTION_STATUSES = {
  RESOLVED: 'resolved',
  INVALID: 'invalid',
  SOURCE_OPEN: 'source-open',
};

export const SHOOTING_RESOLUTION_REASON_CODES = {
  DECLARED_SHOT_GROUP_REQUIRED: 'declared-shot-group-required',
  DECLARED_SHOT_GROUP_INVALID: 'declared-shot-group-invalid',
  DECLARED_SHOT_GROUP_SOURCE_OPEN: 'declared-shot-group-source-open',
  BASIC_PROTECTION_OVERRIDE: 'basic-protection-override',
  BASIC_PROTECTION_DEFERRED: 'basic-protection-deferred',
  TARGET_PROTECTION_SOURCE_OPEN: 'target-protection-source-open',
  ADDITIONAL_MODIFIER_DEFERRED: 'additional-modifier-deferred',
  SUPPORT_BONUS_APPLIED: 'support-bonus-applied',
};

function createDiagnostic(code, message, context = {}) {
  return {
    code,
    message,
    ...context,
  };
}

function createBreakdownEntry(code, label, value, sourceStatus, context = {}) {
  return {
    code,
    label,
    value,
    sourceStatus,
    ...context,
  };
}

function resolveTargetProtection({
  targetUnit,
  resolvedTargetProtectionValue = null,
  resolvedTargetProtectionSourceStatus = SHOOTING_SOURCE_STATUSES.VERIFIED,
} = {}) {
  if (Number.isFinite(resolvedTargetProtectionValue)) {
    if (resolvedTargetProtectionSourceStatus !== SHOOTING_SOURCE_STATUSES.VERIFIED) {
      return {
        status: SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN,
        targetProtectionValue: null,
        breakdown: [],
        diagnostics: [createDiagnostic(
          SHOOTING_RESOLUTION_REASON_CODES.TARGET_PROTECTION_SOURCE_OPEN,
          'Explicit target protection input is present but is not source-verified.',
          {
            targetUnitId: targetUnit?.id ?? null,
            sourceStatus: resolvedTargetProtectionSourceStatus,
          },
        )],
      };
    }

    return {
      status: SHOOTING_RESOLUTION_STATUSES.RESOLVED,
      targetProtectionValue: Number(resolvedTargetProtectionValue),
      breakdown: [createBreakdownEntry(
        SHOOTING_RESOLUTION_REASON_CODES.BASIC_PROTECTION_OVERRIDE,
        'Explicit target protection override',
        Number(resolvedTargetProtectionValue),
        SHOOTING_SOURCE_STATUSES.VERIFIED,
        { targetUnitId: targetUnit?.id ?? null },
      )],
      diagnostics: [],
    };
  }

  if (!targetUnit || typeof targetUnit !== 'object') {
    return {
      status: SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN,
      targetProtectionValue: null,
      breakdown: [],
      diagnostics: [createDiagnostic(
        SHOOTING_RESOLUTION_REASON_CODES.BASIC_PROTECTION_DEFERRED,
        'Target protection cannot be resolved for this shot without either a verified target unit or a verified explicit protection value.',
      )],
    };
  }

  const abilityIds = new Set(getResolvedAbilityIdsForUnit(targetUnit));

  return {
    status: SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN,
    targetProtectionValue: null,
    breakdown: [],
    diagnostics: [createDiagnostic(
      SHOOTING_RESOLUTION_REASON_CODES.BASIC_PROTECTION_DEFERRED,
      `Basic target protection for unit '${targetUnit.id ?? 'unknown-unit'}' is not source-closed in the current P8-07 subset and cannot be inferred from current ability tags alone.`,
      {
        targetUnitId: targetUnit.id ?? null,
        profileId: targetUnit.profileId ?? null,
        abilityIds: [...abilityIds],
      },
    )],
  };
}

export function resolveCombinedShotOutcome({
  declaredShotGroup,
  targetUnit = null,
  actingPlayerId = null,
  phase = null,
  shooterDieRoll,
  targetDieRoll,
  simultaneousGroupId = null,
  actionLogToken = null,
  requestedModifierIds = [],
  resolvedTargetProtectionValue = null,
  resolvedTargetProtectionSourceStatus = SHOOTING_SOURCE_STATUSES.VERIFIED,
} = {}) {
  if (!declaredShotGroup || typeof declaredShotGroup !== 'object') {
    return {
      status: SHOOTING_RESOLUTION_STATUSES.INVALID,
      claim: null,
      result: null,
      record: null,
      shooterModifierBreakdown: [],
      targetProtectionBreakdown: [],
      diagnostics: [createDiagnostic(
        SHOOTING_RESOLUTION_REASON_CODES.DECLARED_SHOT_GROUP_REQUIRED,
        'A declared shot group is required before shooting can be resolved.',
      )],
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    };
  }

  if (declaredShotGroup.status === SHOOTING_SUPPORT_STATUSES.INVALID) {
    return {
      status: SHOOTING_RESOLUTION_STATUSES.INVALID,
      claim: null,
      result: null,
      record: null,
      shooterModifierBreakdown: [],
      targetProtectionBreakdown: [],
      diagnostics: [createDiagnostic(
        SHOOTING_RESOLUTION_REASON_CODES.DECLARED_SHOT_GROUP_INVALID,
        'Only ready combined-shot groups can enter the P8-07 resolver.',
        {
          targetUnitId: declaredShotGroup.targetUnitId ?? null,
          mainShooterUnitId: declaredShotGroup.mainShooterUnitId ?? null,
        },
      )],
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    };
  }

  if (
    declaredShotGroup.status === SHOOTING_SUPPORT_STATUSES.SOURCE_OPEN
    || declaredShotGroup.sourceStatus !== SHOOTING_SOURCE_STATUSES.VERIFIED
  ) {
    return {
      status: SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN,
      claim: null,
      result: null,
      record: null,
      shooterModifierBreakdown: [],
      targetProtectionBreakdown: [],
      diagnostics: [createDiagnostic(
        SHOOTING_RESOLUTION_REASON_CODES.DECLARED_SHOT_GROUP_SOURCE_OPEN,
        'Source-open combined-shot groups stay diagnostic-only and cannot be fully resolved in the supported P8-07 subset.',
        {
          targetUnitId: declaredShotGroup.targetUnitId ?? null,
          mainShooterUnitId: declaredShotGroup.mainShooterUnitId ?? null,
        },
      )],
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    };
  }

  const diagnostics = [];

  if (Array.isArray(requestedModifierIds) && requestedModifierIds.length > 0) {
    diagnostics.push(createDiagnostic(
      SHOOTING_RESOLUTION_REASON_CODES.ADDITIONAL_MODIFIER_DEFERRED,
      'Additional shooting modifier families remain source-open in the current P8-07 subset.',
      { requestedModifierIds: [...requestedModifierIds] },
    ));
  }

  const targetProtection = resolveTargetProtection({
    targetUnit,
    resolvedTargetProtectionValue,
    resolvedTargetProtectionSourceStatus,
  });
  diagnostics.push(...targetProtection.diagnostics);

  if (diagnostics.length > 0) {
    return {
      status: SHOOTING_RESOLUTION_STATUSES.SOURCE_OPEN,
      claim: null,
      result: null,
      record: null,
      shooterModifierBreakdown: [],
      targetProtectionBreakdown: targetProtection.breakdown,
      diagnostics,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    };
  }

  const shooterModifierBreakdown = [];
  const supportBonus = Number.isFinite(declaredShotGroup.supportBonus) ? Number(declaredShotGroup.supportBonus) : 0;

  if (supportBonus > 0) {
    shooterModifierBreakdown.push(createBreakdownEntry(
      SHOOTING_RESOLUTION_REASON_CODES.SUPPORT_BONUS_APPLIED,
      'Combined-shot support bonus',
      supportBonus,
      SHOOTING_SOURCE_STATUSES.VERIFIED,
      {
        mainShooterUnitId: declaredShotGroup.mainShooterUnitId ?? null,
        supportingUnitIds: Array.isArray(declaredShotGroup.supportingUnitIds) ? [...declaredShotGroup.supportingUnitIds] : [],
      },
    ));
  }

  const shooterModifierTotal = shooterModifierBreakdown.reduce((sum, entry) => sum + entry.value, 0);
  const targetProtectionValue = targetProtection.targetProtectionValue;
  const claim = createShootingRollClaim({
    reason: 'shooting-resolution',
    actingPlayerId,
    shooterUnitId: declaredShotGroup.mainShooterUnitId ?? null,
    targetUnitId: declaredShotGroup.targetUnitId ?? targetUnit?.id ?? null,
    phase,
    declarationSnapshot: declaredShotGroup.declarationSnapshot ?? declaredShotGroup,
    actionLogToken,
    simultaneousGroupId,
  });
  const result = createShootingRollResult({
    claim,
    shooterDieRoll,
    targetDieRoll,
    shooterModifierTotal,
    targetProtectionValue,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
  });
  const record = createShotResolutionRecord({
    claim,
    result,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
  });

  return {
    status: SHOOTING_RESOLUTION_STATUSES.RESOLVED,
    claim,
    result,
    record,
    shooterModifierBreakdown,
    targetProtectionBreakdown: targetProtection.breakdown,
    diagnostics,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
  };
}