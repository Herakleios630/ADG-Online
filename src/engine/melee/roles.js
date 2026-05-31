export const MELEE_CONTACT_ROLE_STATUSES = {
  MAIN_UNIT: 'main-unit',
  SIMPLE_SUPPORT: 'simple-support',
  MELEE_SUPPORT: 'melee-support',
  SOURCE_OPEN: 'source-open',
  NON_CONTACT: 'non-contact',
};

export const MELEE_CONTACT_ROLE_LABELS = {
  [MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT]: 'main unit',
  [MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT]: 'simple support',
  [MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT]: 'melee support',
  [MELEE_CONTACT_ROLE_STATUSES.SOURCE_OPEN]: 'source-open',
  [MELEE_CONTACT_ROLE_STATUSES.NON_CONTACT]: 'non-contact',
};

function isSupportRole(role) {
  return role === MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT
    || role === MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT;
}

function createDiagnostic(code, message) {
  return { code, message };
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
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

function isCornerOnlyRelationship(relationship) {
  const text = normalizeText(relationship);
  if (!text.includes('corner')) {
    return false;
  }

  return text.includes('corner-only') || text === 'corner-contact';
}

function getClassificationType(contactEvidence) {
  return normalizeText(contactEvidence?.contactClassification?.type);
}

function hasActionableContactEvidence(contactEvidence) {
  if (!contactEvidence || typeof contactEvidence !== 'object') {
    return false;
  }

  return Boolean(
    contactEvidence.contactRelationship
    || contactEvidence.contactSide
    || contactEvidence.contactRole
    || contactEvidence.principalOpponentId
    || contactEvidence.contactClassification,
  );
}

function getSupportKindFromFlags(unit) {
  if (!Boolean(unit?.inMeleeSupport || unit?.providesOnlySimpleSupport)) {
    return null;
  }

  return Boolean(unit?.inMeleeSupport) && !Boolean(unit?.providesOnlySimpleSupport)
    ? 'melee'
    : 'simple';
}

function getResolvedSupportKind(unit, contactEvidence) {
  const explicitRole = normalizeText(contactEvidence?.contactRole);
  if (explicitRole === 'melee-support') {
    return 'melee';
  }
  if (explicitRole === 'simple-support') {
    return 'simple';
  }

  const relationship = normalizeText(contactEvidence?.contactRelationship);
  if (relationship.includes('support') && relationship.includes('rear')) {
    return 'melee';
  }
  if (relationship.includes('support')) {
    return 'simple';
  }

  return getSupportKindFromFlags(unit);
}

function hasMainContactFlags(unit) {
  return Boolean(unit?.engagedInMelee) || Boolean(unit?.meleePending);
}

function hasSupportFlags(unit) {
  return Boolean(unit?.inMeleeSupport) || Boolean(unit?.providesOnlySimpleSupport);
}

function classifyRoleFromEvidence(unit, contactEvidence) {
  const diagnostics = [];
  if (!contactEvidence) {
    if (hasMainContactFlags(unit) || hasSupportFlags(unit)) {
      diagnostics.push(createDiagnostic(
        'melee.contact.source-open.missing-evidence',
        'Unit carries melee/support flags but has no contact evidence snapshot.',
      ));
      return { role: MELEE_CONTACT_ROLE_STATUSES.SOURCE_OPEN, supportKind: null, diagnostics };
    }

    return { role: MELEE_CONTACT_ROLE_STATUSES.NON_CONTACT, supportKind: null, diagnostics };
  }

  if (!hasActionableContactEvidence(contactEvidence)) {
    if (hasMainContactFlags(unit) || hasSupportFlags(unit)) {
      diagnostics.push(createDiagnostic(
        'melee.contact.source-open.insufficient-evidence',
        'Unit carries melee/support flags but only non-geometric contact metadata is present.',
      ));
      return { role: MELEE_CONTACT_ROLE_STATUSES.SOURCE_OPEN, supportKind: null, diagnostics };
    }

    return { role: MELEE_CONTACT_ROLE_STATUSES.NON_CONTACT, supportKind: null, diagnostics };
  }

  if (isCornerOnlyRelationship(contactEvidence.contactRelationship)) {
    diagnostics.push(createDiagnostic(
      'melee.contact.non-contact.corner-only',
      'Corner-only contact does not count as melee contact.',
    ));
    return { role: MELEE_CONTACT_ROLE_STATUSES.NON_CONTACT, supportKind: null, diagnostics };
  }

  const classificationType = getClassificationType(contactEvidence);
  if (classificationType === 'rear-or-flank') {
    diagnostics.push(createDiagnostic(
      'melee.contact.source-open.rear-or-flank-ambiguous',
      'Rear-or-flank ambiguity remains unresolved for role classification (most-in-front/side selection).',
    ));
    return { role: MELEE_CONTACT_ROLE_STATUSES.SOURCE_OPEN, supportKind: null, diagnostics };
  }

  const explicitRole = normalizeText(contactEvidence.contactRole);
  if (explicitRole === 'main-unit' || explicitRole === 'main') {
    return { role: MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT, supportKind: null, diagnostics };
  }
  if (explicitRole === 'simple-support') {
    return { role: MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT, supportKind: 'simple', diagnostics };
  }
  if (explicitRole === 'melee-support') {
    return { role: MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT, supportKind: 'melee', diagnostics };
  }

  const supportKind = getResolvedSupportKind(unit, contactEvidence);
  if (supportKind === 'melee') {
    return { role: MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT, supportKind, diagnostics };
  }
  if (supportKind === 'simple') {
    return { role: MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT, supportKind, diagnostics };
  }

  if (hasMainContactFlags(unit) || normalizeText(contactEvidence?.contactRelationship).includes('front-edge-to')) {
    return { role: MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT, supportKind: null, diagnostics };
  }

  diagnostics.push(createDiagnostic(
    'melee.contact.source-open.unresolved-role',
    'Contact evidence is present but does not resolve to a verified main/support role.',
  ));
  return { role: MELEE_CONTACT_ROLE_STATUSES.SOURCE_OPEN, supportKind: null, diagnostics };
}

export function classifyMeleeContactUnit(unit) {
  const contactEvidence = resolveContactEvidence(unit);
  const classification = classifyRoleFromEvidence(unit, contactEvidence);
  const role = classification.role;

  return {
    unitId: unit?.id ?? null,
    label: unit?.scenarioLabel ?? unit?.id ?? 'Unknown unit',
    role,
    roleLabel: MELEE_CONTACT_ROLE_LABELS[role],
    supportKind: classification.supportKind,
    sourceStatus: role === MELEE_CONTACT_ROLE_STATUSES.SOURCE_OPEN ? 'needs-source-check' : 'verified',
    diagnostics: classification.diagnostics,
    opponentUnitId: contactEvidence?.principalOpponentId ?? unit?.meleePendingOpponentId ?? null,
    contactSide: contactEvidence?.contactSide ?? null,
    contactRelationship: contactEvidence?.contactRelationship ?? null,
    contactEvidence,
  };
}

export function summarizeMeleeContactRoles(units = []) {
  const entries = Array.isArray(units)
    ? units.map((unit) => classifyMeleeContactUnit(unit)).filter((entry) => entry.role !== MELEE_CONTACT_ROLE_STATUSES.NON_CONTACT)
    : [];

  return {
    entries,
    counts: {
      mainUnits: entries.filter((entry) => entry.role === MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT).length,
      simpleSupportUnits: entries.filter((entry) => entry.role === MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT).length,
      meleeSupportUnits: entries.filter((entry) => entry.role === MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT).length,
    },
    mainUnitIds: entries.filter((entry) => entry.role === MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT).map((entry) => entry.unitId),
    simpleSupportUnitIds: entries.filter((entry) => entry.role === MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT).map((entry) => entry.unitId),
    meleeSupportUnitIds: entries.filter((entry) => entry.role === MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT).map((entry) => entry.unitId),
  };
}

export function resolveMeleeSupportAssignments({
  units = [],
  mainUnitId = null,
  ownerId = null,
} = {}) {
  const allUnits = Array.isArray(units) ? units : [];
  const mainUnit = allUnits.find((unit) => unit?.id === mainUnitId) ?? null;
  if (!mainUnit || !mainUnitId) {
    return {
      selected: [],
      simpleSupportUnitIds: [],
      meleeSupportUnitIds: [],
      diagnostics: [createDiagnostic(
        'melee.support.source-open.missing-main-unit',
        'Support assignment requires a valid main unit id.',
      )],
    };
  }

  const constrainedOwnerId = ownerId ?? mainUnit.owner ?? null;
  const candidates = allUnits
    .filter((unit) => unit && unit.id !== mainUnitId && (constrainedOwnerId == null || unit.owner === constrainedOwnerId))
    .map((unit) => ({ unit, classification: classifyMeleeContactUnit(unit) }))
    .filter(({ classification }) => (
      isSupportRole(classification.role)
      && classification.opponentUnitId === mainUnitId
    ));

  const buckets = new Map();
  for (const candidate of candidates) {
    const sideKey = normalizeText(candidate.classification.contactSide) || 'unspecified';
    const roleKey = candidate.classification.role;
    const bucketKey = `${roleKey}:${sideKey}`;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey).push(candidate);
  }

  const selected = [];
  const diagnostics = [];

  for (const [bucketKey, bucketEntries] of buckets.entries()) {
    const ordered = [...bucketEntries].sort((left, right) => String(left.unit.id).localeCompare(String(right.unit.id)));
    const selectedEntry = ordered[0];
    const hasCompetition = ordered.length > 1;
    selected.push({
      ...selectedEntry,
      sourceStatus: hasCompetition ? 'needs-source-check' : 'verified',
      hasCompetition,
    });

    if (hasCompetition) {
      const [roleKey, sideKey] = bucketKey.split(':');
      diagnostics.push(createDiagnostic(
        'melee.support.source-open.competing-candidates',
        `Multiple ${roleKey} candidates exist on side '${sideKey}' for main unit '${mainUnitId}'. Deterministic fallback selected one candidate and kept source-open status.`,
      ));
    }
  }

  return {
    selected,
    simpleSupportUnitIds: selected
      .filter((entry) => entry.classification.role === MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT)
      .map((entry) => entry.unit.id),
    meleeSupportUnitIds: selected
      .filter((entry) => entry.classification.role === MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT)
      .map((entry) => entry.unit.id),
    diagnostics,
  };
}