import { getMaxCohesionForUnit } from '../data/unit-profiles.js';

// === Status constants ===

export const COHESION_ACCOUNT_STATUSES = {
  GOOD_ORDER: 'good-order',
  DISORDERED: 'disordered',
  ROUTED_PENDING_REMOVAL: 'routed-pending-removal',
  REMOVED: 'removed',
};

// === Lane keys (source split) ===

export const COHESION_ACCOUNT_LANE_KEYS = {
  SHOOTING: 'shooting',
  MELEE_COMBAT_RESULT: 'meleeCombatResult',
  MELEE_MULTIPLE_ATTACK_IMMEDIATE: 'meleeMultipleAttackImmediate',
  ROUT_CASCADE: 'routCascade',
};

// === Factory helpers ===

export function createEmptyCohesionLaneTotals() {
  return {
    [COHESION_ACCOUNT_LANE_KEYS.SHOOTING]: 0,
    [COHESION_ACCOUNT_LANE_KEYS.MELEE_COMBAT_RESULT]: 0,
    [COHESION_ACCOUNT_LANE_KEYS.MELEE_MULTIPLE_ATTACK_IMMEDIATE]: 0,
    [COHESION_ACCOUNT_LANE_KEYS.ROUT_CASCADE]: 0,
  };
}

export function normalizeCohesionLaneTotals(value) {
  const base = createEmptyCohesionLaneTotals();
  if (!value || typeof value !== 'object') {
    return base;
  }

  for (const key of Object.keys(base)) {
    const normalizedValue = Number(value[key] ?? 0);
    base[key] = normalizedValue > 0 ? normalizedValue : 0;
  }

  return base;
}

export function sumCohesionLaneTotals(value) {
  return Object.values(normalizeCohesionLaneTotals(value))
    .reduce((sum, laneValue) => sum + Number(laneValue ?? 0), 0);
}

// === Status derivation ===

export function deriveCohesionAccountStatus({ remainingCohesion, maxCohesion, removed = false } = {}) {
  if (removed) {
    return COHESION_ACCOUNT_STATUSES.REMOVED;
  }

  if (!Number.isFinite(maxCohesion)) {
    return COHESION_ACCOUNT_STATUSES.GOOD_ORDER;
  }

  if (Number(remainingCohesion ?? 0) <= 0) {
    return COHESION_ACCOUNT_STATUSES.ROUTED_PENDING_REMOVAL;
  }

  if (Number(remainingCohesion ?? 0) < Number(maxCohesion)) {
    return COHESION_ACCOUNT_STATUSES.DISORDERED;
  }

  return COHESION_ACCOUNT_STATUSES.GOOD_ORDER;
}

// === Unit-level account normalization ===

export function getNormalizedCohesionAccountForUnit(unit) {
  let maxCohesion = null;
  try {
    maxCohesion = getMaxCohesionForUnit(unit);
  } catch {
    return null;
  }

  if (!Number.isFinite(maxCohesion)) {
    return null;
  }

  const persistedAccount = unit?.cohesionAccount && typeof unit.cohesionAccount === 'object'
    ? unit.cohesionAccount
    : null;
  const committedBySource = normalizeCohesionLaneTotals(persistedAccount?.committedBySource);
  const pendingBySource = normalizeCohesionLaneTotals(persistedAccount?.pendingBySource);
  const remainingCohesion = Number.isFinite(persistedAccount?.remainingCohesion)
    ? Math.max(0, Math.min(Number(persistedAccount.remainingCohesion), Number(maxCohesion)))
    : Math.max(0, Number(maxCohesion) - sumCohesionLaneTotals(committedBySource));
  const removed = persistedAccount?.status === COHESION_ACCOUNT_STATUSES.REMOVED;

  return {
    maxCohesion: Number(maxCohesion),
    remainingCohesion,
    status: deriveCohesionAccountStatus({ remainingCohesion, maxCohesion, removed }),
    pendingBySource,
    committedBySource,
    committedHistory: Array.isArray(persistedAccount?.committedHistory)
      ? [...persistedAccount.committedHistory]
      : [],
  };
}

export function createCommittedCohesionHistoryEntry({ source, delta, reason }) {
  return {
    source,
    delta,
    reason,
  };
}
