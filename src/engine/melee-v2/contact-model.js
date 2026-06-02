import { buildV2FlankRearModifierLane } from './modifier-pipeline.js';

export const MELEE_V2_CONTACT_MODEL_VERSION = 'v2';

export const MELEE_V2_CONTACT_ORIGINS = {
  CHARGE_CONTACT: 'charge-contact',
  MOVE_TO_SUPPORT_CONTACT: 'move-to-support-contact',
  PURSUIT_CONTACT: 'pursuit-contact',
  ALREADY_IN_CONTACT_CONFORM: 'already-in-contact-conform',
  UNKNOWN_ORIGIN: 'unknown-origin',
};

const KNOWN_CONTACT_ORIGINS = new Set(Object.values(MELEE_V2_CONTACT_ORIGINS));

function createUnitMap(gameState) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  return new Map(units.map((unit) => [unit?.id, unit]));
}

function toNormalizedText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function resolveAttackContactType(attackerUnit) {
  const explicitType = toNormalizedText(attackerUnit?.meleeContactEvidence?.contactType);
  const classifiedType = toNormalizedText(attackerUnit?.meleeContactEvidence?.contactClassification?.type);
  const contactType = explicitType || classifiedType;

  return contactType.length > 0 ? contactType : null;
}

function resolveExplicitContactOrigin(attackerUnit, defenderUnitId) {
  const evidenceCandidates = [
    attackerUnit?.meleeContactEvidence,
    attackerUnit?.conformationApplied,
  ].filter((entry) => entry && typeof entry === 'object');

  for (const evidence of evidenceCandidates) {
    const principalOpponentId = String(evidence?.principalOpponentId ?? '').trim();
    if (principalOpponentId.length > 0 && principalOpponentId !== defenderUnitId) {
      continue;
    }

    const explicitOrigin = toNormalizedText(evidence?.contactOrigin);
    if (KNOWN_CONTACT_ORIGINS.has(explicitOrigin)) {
      return {
        contactOrigin: explicitOrigin,
        sourceStatus: 'verified',
        diagnostics: [],
      };
    }
  }

  return null;
}

function resolveInferredContactOrigin(attackerUnit) {
  if (!attackerUnit || typeof attackerUnit !== 'object') {
    return {
      contactOrigin: MELEE_V2_CONTACT_ORIGINS.UNKNOWN_ORIGIN,
      sourceStatus: 'source-open',
      diagnostics: [],
    };
  }

  const contactRole = toNormalizedText(attackerUnit?.meleeContactEvidence?.contactRole);
  const triggerFamily = toNormalizedText(
    attackerUnit?.meleeContactEvidence?.meleeTriggerBridge?.triggerFamily
      ?? attackerUnit?.conformationApplied?.meleeTriggerBridge?.triggerFamily,
  );
  const hasChargeSignal = attackerUnit.hasChargedThisSequence === true;
  const hasMovementConformationSignal = triggerFamily === 'movement-conformation';

  if (hasMovementConformationSignal && hasChargeSignal) {
    return {
      contactOrigin: MELEE_V2_CONTACT_ORIGINS.UNKNOWN_ORIGIN,
      sourceStatus: 'source-open',
      diagnostics: [
        {
          code: 'melee.v2.contact-origin-ambiguous-charge-vs-movement-conformation',
          severity: 'warning',
          sourceStatus: 'source-open',
        },
      ],
    };
  }

  if (hasMovementConformationSignal) {
    return {
      contactOrigin: MELEE_V2_CONTACT_ORIGINS.MOVE_TO_SUPPORT_CONTACT,
      sourceStatus: 'verified',
      diagnostics: [],
    };
  }

  if (hasChargeSignal) {
    return {
      contactOrigin: MELEE_V2_CONTACT_ORIGINS.CHARGE_CONTACT,
      sourceStatus: 'verified',
      diagnostics: [],
    };
  }

  if (contactRole === 'simple-support' || contactRole === 'melee-support') {
    return {
      contactOrigin: MELEE_V2_CONTACT_ORIGINS.MOVE_TO_SUPPORT_CONTACT,
      sourceStatus: 'source-open',
      diagnostics: [],
    };
  }

  if (attackerUnit.engagedInMelee === true && attackerUnit.conformationApplied) {
    return {
      contactOrigin: MELEE_V2_CONTACT_ORIGINS.ALREADY_IN_CONTACT_CONFORM,
      sourceStatus: 'source-open',
      diagnostics: [],
    };
  }

  return {
    contactOrigin: MELEE_V2_CONTACT_ORIGINS.UNKNOWN_ORIGIN,
    sourceStatus: 'source-open',
    diagnostics: [],
  };
}

function resolveContactOrigin(attackerUnit, defenderUnitId) {
  const explicit = resolveExplicitContactOrigin(attackerUnit, defenderUnitId);
  if (explicit) {
    return explicit;
  }

  return resolveInferredContactOrigin(attackerUnit);
}

export function createMeleeV2ContactModel({ gameState, presentation = null } = {}) {
  const unitById = createUnitMap(gameState);
  const eligibleEntries = Array.isArray(presentation?.eligibleEntries)
    ? presentation.eligibleEntries
    : [];

  const contacts = eligibleEntries.map((entry) => {
    const attackerUnit = unitById.get(entry?.attackerUnitId) ?? null;
    const defenderUnit = unitById.get(entry?.defenderUnitId) ?? null;
    const attackContactType = resolveAttackContactType(attackerUnit);
    const contactOriginResolution = resolveContactOrigin(attackerUnit, defenderUnit?.id ?? null);
    const flankRearLane = buildV2FlankRearModifierLane({
      attackerUnit,
      defenderUnitId: defenderUnit?.id ?? null,
    });
    const flankRearBranch = flankRearLane?.branch ?? null;
    const flankRearDiagnostics = Array.isArray(flankRearLane?.diagnostics)
      ? flankRearLane.diagnostics
      : [];
    const flankRearSourceStatus = flankRearBranch?.sourceStatus ?? 'verified';
    const isContactTypeVerified = typeof attackContactType === 'string'
      && attackContactType.length > 0
      && attackContactType !== 'rear-or-flank';
    const sourceStatus = isContactTypeVerified
      && contactOriginResolution.sourceStatus === 'verified'
      && flankRearSourceStatus === 'verified'
      ? 'verified'
      : 'source-open';

    return {
      meleeId: entry?.id ?? null,
      attackerUnitId: attackerUnit?.id ?? null,
      defenderUnitId: defenderUnit?.id ?? null,
      attackContactType,
      contactOrigin: contactOriginResolution.contactOrigin,
      contactOriginSourceStatus: contactOriginResolution.sourceStatus,
      contactOriginDiagnostics: Array.isArray(contactOriginResolution.diagnostics)
        ? contactOriginResolution.diagnostics
        : [],
      flankRearBranch,
      flankRearDiagnostics,
      flankRearSourceStatus,
      sourceStatus,
    };
  });

  const sourceOpenContacts = contacts.filter((contact) => contact?.sourceStatus !== 'verified').length;

  return {
    version: MELEE_V2_CONTACT_MODEL_VERSION,
    sourceStatus: sourceOpenContacts > 0 ? 'source-open' : 'verified',
    contacts,
    sourceOpenContacts,
  };
}
