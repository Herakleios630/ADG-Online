export const MELEE_V2_RESOLUTION_VERSION = 'v2';

const MELEE_BATCH_APPLICATION_STATUSES = {
  PENDING_SIMULTANEOUS_BATCH: 'pending-simultaneous-batch',
  APPLIED_AT_BATCH_END: 'applied-at-batch-end',
};

function isVerifiedSourceStatus(value) {
  return value === 'verified';
}

function dedupeDiagnosticsByCodeAndMeleeId(entries = []) {
  const diagnostics = Array.isArray(entries) ? entries : [];
  const seenKeys = new Set();
  const deduped = [];

  for (const entry of diagnostics) {
    const code = typeof entry?.code === 'string' ? entry.code : 'unknown-code';
    const meleeId = typeof entry?.meleeId === 'string' ? entry.meleeId : 'unknown-melee';
    const key = `${code}::${meleeId}`;
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function toEligibleEntryMap(eligibleEntries = []) {
  return new Map(
    (Array.isArray(eligibleEntries) ? eligibleEntries : [])
      .filter((entry) => typeof entry?.id === 'string')
      .map((entry) => [entry.id, entry]),
  );
}

function hasReciprocalCommanderLink(hostUnit, commanderUnit) {
  return Boolean(hostUnit?.id && commanderUnit?.id)
    && hostUnit.attachedCommanderId === commanderUnit.id
    && commanderUnit.attachedUnitId === hostUnit.id;
}

function resolveCommanderPresenceSnapshot(unit, allUnits = []) {
  if (!unit || typeof unit !== 'object') {
    return {
      status: 'none',
      sourceStatus: 'verified',
      commanderUnitId: null,
      hostUnitId: null,
    };
  }

  const units = Array.isArray(allUnits) ? allUnits : [];
  if (unit.hasIncludedCommander === true) {
    return {
      status: 'included',
      sourceStatus: 'verified',
      commanderUnitId: unit.id,
      hostUnitId: unit.id,
    };
  }

  const attachedCommanderId = String(unit.attachedCommanderId ?? '').trim();
  if (attachedCommanderId.length > 0) {
    const commanderUnit = units.find((entry) => entry?.id === attachedCommanderId) ?? null;
    return {
      status: 'attached',
      sourceStatus: commanderUnit?.isCommander === true && hasReciprocalCommanderLink(unit, commanderUnit)
        ? 'verified'
        : 'source-open',
      commanderUnitId: attachedCommanderId,
      hostUnitId: unit.id,
    };
  }

  if (unit.isCommander === true) {
    const hasSupportRole = typeof unit?.meleeContactEvidence?.contactRole === 'string'
      && (unit.meleeContactEvidence.contactRole === 'simple-support' || unit.meleeContactEvidence.contactRole === 'melee-support');
    if (hasSupportRole) {
      return {
        status: 'support-only',
        sourceStatus: 'verified',
        commanderUnitId: unit.id,
        hostUnitId: unit.id,
      };
    }
  }

  return {
    status: 'none',
    sourceStatus: 'verified',
    commanderUnitId: null,
    hostUnitId: unit.id,
  };
}

export function buildV2ActiveFightSet({
  contactModel = null,
  eligibleEntries = [],
} = {}) {
  const contacts = Array.isArray(contactModel?.contacts) ? contactModel.contacts : [];
  const eligibleById = toEligibleEntryMap(eligibleEntries);
  const entries = [];
  const diagnostics = [];
  const seenMeleeIds = new Set();

  for (const contact of contacts) {
    const meleeId = typeof contact?.meleeId === 'string' ? contact.meleeId : null;
    if (!meleeId || seenMeleeIds.has(meleeId)) {
      continue;
    }

    seenMeleeIds.add(meleeId);

    if (!eligibleById.has(meleeId)) {
      diagnostics.push({
        code: 'melee.v2.active-fight-missing-eligible-entry',
        severity: 'warning',
        sourceStatus: contact?.sourceStatus === 'verified' ? 'verified' : 'source-open',
        meleeId,
      });
      continue;
    }

    const entry = eligibleById.get(meleeId);
    const allUnits = Array.isArray(entry?.allUnits) ? entry.allUnits : [];
    const attackerCommanderPresence = resolveCommanderPresenceSnapshot(entry?.resolutionInput?.attackerUnit ?? null, allUnits);
    const defenderCommanderPresence = resolveCommanderPresenceSnapshot(entry?.resolutionInput?.defenderUnit ?? null, allUnits);
    entries.push({
      ...entry,
      id: meleeId,
      v2ContactSourceStatus: contact?.sourceStatus ?? 'source-open',
      v2AttackContactType: contact?.attackContactType ?? null,
      v2ContactOrigin: contact?.contactOrigin ?? 'unknown-origin',
      v2ContactOriginSourceStatus: contact?.contactOriginSourceStatus ?? 'source-open',
      v2FlankRearBranch: contact?.flankRearBranch ?? null,
      v2FlankRearSourceStatus: contact?.flankRearSourceStatus ?? 'verified',
      v2AttackerCommanderPresence: attackerCommanderPresence,
      v2DefenderCommanderPresence: defenderCommanderPresence,
      v2FlankRearDiagnostics: Array.isArray(contact?.flankRearDiagnostics)
        ? contact.flankRearDiagnostics
        : [],
    });

    const branchDiagnostics = Array.isArray(contact?.flankRearDiagnostics)
      ? contact.flankRearDiagnostics
      : [];
    for (const branchDiagnostic of branchDiagnostics) {
      diagnostics.push({
        ...branchDiagnostic,
        meleeId,
        attackerUnitId: contact?.attackerUnitId ?? null,
        defenderUnitId: contact?.defenderUnitId ?? null,
      });
    }
  }

  const hasSourceOpenEntries = entries.some(
    (entry) => !isVerifiedSourceStatus(entry?.v2ContactSourceStatus),
  );
  const hasSourceOpenContactOrigins = entries.some(
    (entry) => !isVerifiedSourceStatus(entry?.v2ContactOriginSourceStatus),
  );
  const hasSourceOpenFlankRearBranches = entries.some(
    (entry) => !isVerifiedSourceStatus(entry?.v2FlankRearSourceStatus),
  );
  const hasSourceOpenCommanderPresence = entries.some(
    (entry) => !isVerifiedSourceStatus(entry?.v2AttackerCommanderPresence?.sourceStatus)
      || !isVerifiedSourceStatus(entry?.v2DefenderCommanderPresence?.sourceStatus),
  );

  return {
    entries,
    diagnostics: dedupeDiagnosticsByCodeAndMeleeId(diagnostics),
    sourceStatus: diagnostics.length === 0
      && !hasSourceOpenEntries
      && !hasSourceOpenContactOrigins
      && !hasSourceOpenFlankRearBranches
      && !hasSourceOpenCommanderPresence
      ? 'verified'
      : 'source-open',
  };
}

export function buildV2MeleeBatchQueue({
  activeFightSet = null,
  selectedMeleeIds = [],
} = {}) {
  const activeEntries = Array.isArray(activeFightSet?.entries) ? activeFightSet.entries : [];
  const activeById = new Map(activeEntries.map((entry) => [entry.id, entry]));
  const queue = [];
  const diagnostics = [];

  for (const meleeId of Array.isArray(selectedMeleeIds) ? selectedMeleeIds : []) {
    if (!activeById.has(meleeId)) {
      diagnostics.push({
        code: 'melee.v2.queue-id-not-in-active-fight-set',
        severity: 'warning',
        sourceStatus: 'source-open',
        meleeId,
      });
      continue;
    }

    queue.push(activeById.get(meleeId));
  }

  return {
    queue,
    diagnostics,
  };
}

export function buildV2MeleeBatchPreview({
  queue = [],
  resolvedEntriesByMeleeId = {},
} = {}) {
  const resolvedById = resolvedEntriesByMeleeId && typeof resolvedEntriesByMeleeId === 'object'
    ? resolvedEntriesByMeleeId
    : {};
  const queuedEntries = Array.isArray(queue) ? queue : [];

  const resolvedEntries = [];
  const unresolvedMeleeIds = [];

  for (const queueEntry of queuedEntries) {
    const meleeId = typeof queueEntry?.id === 'string' ? queueEntry.id : null;
    if (!meleeId) {
      continue;
    }

    const resolvedEntry = resolvedById[meleeId] ?? null;
    if (resolvedEntry) {
      resolvedEntries.push(resolvedEntry);
    } else {
      unresolvedMeleeIds.push(meleeId);
    }
  }

  const hasSourceOpenResolution = resolvedEntries.some(
    (entry) => entry?.resolution?.status === 'source-open',
  );
  const hasSourceOpenQueueEntries = queuedEntries.some(
    (entry) => !isVerifiedSourceStatus(entry?.v2ContactSourceStatus),
  );
  const hasSourceOpenQueueOrigins = queuedEntries.some(
    (entry) => !isVerifiedSourceStatus(entry?.v2ContactOriginSourceStatus),
  );
  const hasSourceOpenQueueFlankRearBranches = queuedEntries.some(
    (entry) => !isVerifiedSourceStatus(entry?.v2FlankRearSourceStatus),
  );
  const branchDiagnostics = [];
  for (const queueEntry of queuedEntries) {
    const meleeId = typeof queueEntry?.id === 'string' ? queueEntry.id : null;
    if (!meleeId) {
      continue;
    }
    for (const diagnostic of Array.isArray(queueEntry?.v2FlankRearDiagnostics)
      ? queueEntry.v2FlankRearDiagnostics
      : []) {
      branchDiagnostics.push({
        ...diagnostic,
        meleeId,
        attackerUnitId: queueEntry?.attackerUnitId ?? null,
        defenderUnitId: queueEntry?.defenderUnitId ?? null,
      });
    }
  }
  const previewSourceStatus = unresolvedMeleeIds.length === 0
    && !hasSourceOpenResolution
    && !hasSourceOpenQueueEntries
    && !hasSourceOpenQueueOrigins
    && !hasSourceOpenQueueFlankRearBranches
      ? 'verified'
      : 'source-open';

  return {
    batchPreview: {
      queue: queuedEntries,
      resolvedEntries,
      unresolvedMeleeIds,
      hasSourceOpenResolution,
      hasSourceOpenQueueOrigins,
      hasSourceOpenQueueFlankRearBranches,
      isReadyForApply: queuedEntries.length > 0 && unresolvedMeleeIds.length === 0,
      queueSource: 'v2-contact-graph',
      sourceStatus: previewSourceStatus,
    },
    diagnostics: dedupeDiagnosticsByCodeAndMeleeId([
      ...branchDiagnostics,
      ...(unresolvedMeleeIds.length === 0
        ? []
        : [{
            code: 'melee.v2.batch-preview-unresolved-required-fights',
            severity: 'info',
            sourceStatus: 'source-open',
            unresolvedMeleeIds,
          }]),
    ]),
  };
}

export function buildV2MeleeBatchApplicationPlan({
  batchPreview = null,
} = {}) {
  const immediateEffects = Array.isArray(batchPreview?.immediateEffects)
    ? batchPreview.immediateEffects
    : [];
  const resolvedEntries = Array.isArray(batchPreview?.resolvedEntries)
    ? batchPreview.resolvedEntries
    : [];

  const multipleAttackImmediateByUnitId = new Map();
  const combatResultCohesionByUnitId = new Map();
  const routedUnitIds = new Set();

  for (const effect of immediateEffects) {
    if (effect?.type !== 'multiple-attack-immediate' || effect?.status !== 'resolved') {
      continue;
    }

    const defenderUnitId = effect?.defenderUnitId ?? null;
    const cohesionLoss = Number(effect?.cohesionLoss ?? 0);
    if (!defenderUnitId || cohesionLoss <= 0) {
      continue;
    }

    multipleAttackImmediateByUnitId.set(
      defenderUnitId,
      Number(multipleAttackImmediateByUnitId.get(defenderUnitId) ?? 0) + cohesionLoss,
    );
  }

  for (const entry of resolvedEntries) {
    if (entry?.resolution?.status !== 'resolved') {
      continue;
    }

    const winnerSide = entry?.resolution?.result?.winnerSide ?? null;
    const loserUnitId = winnerSide === 'attacker'
      ? entry?.defenderUnitId
      : winnerSide === 'defender'
        ? entry?.attackerUnitId
        : null;

    if (!loserUnitId) {
      continue;
    }

    const cohesionLoss = Number(entry?.resolution?.result?.cohesionLoss ?? 0);
    if (cohesionLoss > 0) {
      combatResultCohesionByUnitId.set(
        loserUnitId,
        Number(combatResultCohesionByUnitId.get(loserUnitId) ?? 0) + cohesionLoss,
      );
    }

    if (entry?.resolution?.result?.rout === true) {
      routedUnitIds.add(loserUnitId);
    }
  }

  return {
    applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.APPLIED_AT_BATCH_END,
    effects: {
      multipleAttackImmediateByUnitId: Object.fromEntries(multipleAttackImmediateByUnitId.entries()),
      combatResultCohesionByUnitId: Object.fromEntries(combatResultCohesionByUnitId.entries()),
      routedUnitIds: [...routedUnitIds],
    },
    appliedImmediateEffects: immediateEffects.map((effect) => ({
      ...effect,
      applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.APPLIED_AT_BATCH_END,
    })),
    appliedEntries: resolvedEntries.map((entry) => ({
      meleeId: entry?.meleeId,
      applicationStatus: MELEE_BATCH_APPLICATION_STATUSES.APPLIED_AT_BATCH_END,
    })),
  };
}
