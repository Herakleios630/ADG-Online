import { resolveMeleeCombatFactorBinding } from '../../data/melee-combat-factors.js';
import { getUnitProfileForUnit } from '../../data/unit-profiles.js';

export const MELEE_V2_BASE_CF_LOOKUP_STATUSES = {
  RESOLVED: 'resolved',
  SOURCE_OPEN: 'source-open',
};

export const MELEE_V2_BASE_CF_LOOKUP_REASON_CODES = {
  PROFILE_LOOKUP_SOURCE_OPEN: 'melee.v2.base-cf-profile-lookup-source-open',
  BINDING_SOURCE_OPEN: 'melee.v2.base-cf-binding-source-open',
};

function createLookupDiagnostic(code, message, context = {}) {
  return {
    code,
    message,
    ...context,
  };
}

function resolveProfileIds({
  unit,
  opponentUnit,
  unitProfileId,
  opponentProfileId,
} = {}) {
  const resolvedUnitProfileId = typeof unitProfileId === 'string' && unitProfileId.trim().length > 0
    ? unitProfileId.trim()
    : null;
  const resolvedOpponentProfileId = typeof opponentProfileId === 'string' && opponentProfileId.trim().length > 0
    ? opponentProfileId.trim()
    : null;

  if (resolvedUnitProfileId || resolvedOpponentProfileId) {
    return {
      profileId: resolvedUnitProfileId,
      opponentProfileId: resolvedOpponentProfileId,
      diagnostics: [],
    };
  }

  try {
    const profile = getUnitProfileForUnit(unit);
    const opponentProfile = opponentUnit ? getUnitProfileForUnit(opponentUnit) : null;
    return {
      profileId: profile?.id ?? null,
      opponentProfileId: opponentProfile?.id ?? null,
      diagnostics: [],
    };
  } catch (error) {
    return {
      profileId: null,
      opponentProfileId: null,
      diagnostics: [createLookupDiagnostic(
        MELEE_V2_BASE_CF_LOOKUP_REASON_CODES.PROFILE_LOOKUP_SOURCE_OPEN,
        error?.message ?? 'Unknown profile lookup failure.',
        {
          unitId: unit?.id ?? null,
          opponentUnitId: opponentUnit?.id ?? null,
        },
      )],
    };
  }
}

export function resolveV2BaseCombatFactorLookup({
  unit,
  opponentUnit,
  unitProfileId,
  opponentProfileId,
} = {}) {
  const profileResolution = resolveProfileIds({
    unit,
    opponentUnit,
    unitProfileId,
    opponentProfileId,
  });

  if (profileResolution.diagnostics.length > 0 || !profileResolution.profileId) {
    return {
      status: MELEE_V2_BASE_CF_LOOKUP_STATUSES.SOURCE_OPEN,
      value: null,
      sourceStatus: 'source-open',
      profileId: profileResolution.profileId,
      opponentProfileId: profileResolution.opponentProfileId,
      provenanceLabel: 'Profile lookup unresolved',
      sourceRefs: [],
      deferredReason: 'Profile lookup is unresolved for this lookup input.',
      diagnostics: profileResolution.diagnostics,
    };
  }

  const binding = resolveMeleeCombatFactorBinding({
    unit,
    opponentUnit,
    unitProfileId: profileResolution.profileId,
    opponentProfileId: profileResolution.opponentProfileId,
  });

  if (!binding?.resolved || !Number.isFinite(binding.resolved.value)) {
    return {
      status: MELEE_V2_BASE_CF_LOOKUP_STATUSES.SOURCE_OPEN,
      value: null,
      sourceStatus: 'source-open',
      profileId: profileResolution.profileId,
      opponentProfileId: profileResolution.opponentProfileId,
      provenanceLabel: binding?.provenanceLabel ?? 'Profile binding unresolved',
      sourceRefs: Array.isArray(binding?.sourceRefs) ? binding.sourceRefs : [],
      deferredReason: binding?.deferredReason
        ?? 'No source-closed p.22 base combat-factor binding exists for this profile lane yet.',
      diagnostics: [createLookupDiagnostic(
        MELEE_V2_BASE_CF_LOOKUP_REASON_CODES.BINDING_SOURCE_OPEN,
        binding?.deferredReason
          ?? 'No source-closed p.22 base combat-factor binding exists for this profile lane yet.',
        {
          profileId: profileResolution.profileId,
          opponentProfileId: profileResolution.opponentProfileId,
        },
      )],
    };
  }

  return {
    status: MELEE_V2_BASE_CF_LOOKUP_STATUSES.RESOLVED,
    value: Number(binding.resolved.value),
    sourceStatus: binding.resolved.sourceStatus ?? 'verified',
    profileId: profileResolution.profileId,
    opponentProfileId: profileResolution.opponentProfileId,
    provenanceLabel: binding.resolved.provenanceLabel ?? 'Profile binding',
    sourceRefs: Array.isArray(binding.resolved.sourceRefs) ? binding.resolved.sourceRefs : [],
    deferredReason: null,
    diagnostics: [],
  };
}
