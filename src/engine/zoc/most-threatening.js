import { getEnemyZocContacts, ZOC_SOURCE_STATUSES } from './geometry.js';

const MOST_THREATENING_EPSILON = 1e-9;

export const MOST_THREATENING_STATUSES = {
  NONE: 'none',
  SELECTED: 'selected',
};

const MOST_THREATENING_SOURCE_REFS = ['zoc.most-threatening-priority-and-tie-breaks'];

function normalizeSourceStatus(sourceStatus) {
  return Object.values(ZOC_SOURCE_STATUSES).includes(sourceStatus)
    ? sourceStatus
    : ZOC_SOURCE_STATUSES.NEEDS_SOURCE_CHECK;
}

function getInZocSamples(contact) {
  if (!Array.isArray(contact?.sampledPoints)) {
    return [];
  }

  return contact.sampledPoints.filter((sample) => sample?.isInZoc);
}

function getCoverageCount(contact) {
  if (Array.isArray(contact?.matchingPointIds) && contact.matchingPointIds.length > 0) {
    return contact.matchingPointIds.length;
  }

  return getInZocSamples(contact).length;
}

function getNearestFrontDistanceUd(contact) {
  const inZocSamples = getInZocSamples(contact);

  if (inZocSamples.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const minY = Number.isFinite(contact?.localBounds?.minY) ? contact.localBounds.minY : 0;
  return Math.min(
    ...inZocSamples.map((sample) => {
      const localY = Number.isFinite(sample?.localPoint?.y) ? sample.localPoint.y : Number.POSITIVE_INFINITY;
      return localY - minY;
    }),
  );
}

function getNearestLateralOffsetUd(contact) {
  const inZocSamples = getInZocSamples(contact);

  if (inZocSamples.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(
    ...inZocSamples.map((sample) => {
      const localX = Number.isFinite(sample?.localPoint?.x) ? sample.localPoint.x : Number.POSITIVE_INFINITY;
      return Math.abs(localX);
    }),
  );
}

function compareCandidates(left, right) {
  if (left.metrics.nearestFrontDistanceUd !== right.metrics.nearestFrontDistanceUd) {
    return left.metrics.nearestFrontDistanceUd - right.metrics.nearestFrontDistanceUd;
  }

  if (left.metrics.coverageCount !== right.metrics.coverageCount) {
    return right.metrics.coverageCount - left.metrics.coverageCount;
  }

  if (left.metrics.nearestLateralOffsetUd !== right.metrics.nearestLateralOffsetUd) {
    return left.metrics.nearestLateralOffsetUd - right.metrics.nearestLateralOffsetUd;
  }

  return String(left.enemyUnitId).localeCompare(String(right.enemyUnitId));
}

function metricsAreTied(left, right) {
  const frontDelta = Math.abs(left.metrics.nearestFrontDistanceUd - right.metrics.nearestFrontDistanceUd);
  const lateralDelta = Math.abs(left.metrics.nearestLateralOffsetUd - right.metrics.nearestLateralOffsetUd);

  return frontDelta <= MOST_THREATENING_EPSILON
    && left.metrics.coverageCount === right.metrics.coverageCount
    && lateralDelta <= MOST_THREATENING_EPSILON;
}

function createCandidate(contact) {
  const sourceStatus = normalizeSourceStatus(contact?.sourceStatus);

  return {
    enemyUnitId: contact?.enemyUnitId ?? null,
    targetUnitId: contact?.targetUnitId ?? null,
    metrics: {
      nearestFrontDistanceUd: getNearestFrontDistanceUd(contact),
      coverageCount: getCoverageCount(contact),
      nearestLateralOffsetUd: getNearestLateralOffsetUd(contact),
    },
    sourceStatus,
    sourceRefs: Array.isArray(contact?.sourceRefs) && contact.sourceRefs.length > 0
      ? contact.sourceRefs
      : MOST_THREATENING_SOURCE_REFS,
    contact,
  };
}

export function rankEnemyZocThreatCandidates(zocContacts) {
  if (!Array.isArray(zocContacts)) {
    return [];
  }

  return zocContacts
    .map((contact) => createCandidate(contact))
    .filter((candidate) => candidate.enemyUnitId !== null && Number.isFinite(candidate.metrics.nearestFrontDistanceUd))
    .sort(compareCandidates)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
}

export function selectMostThreateningEnemy(zocContacts) {
  const candidates = rankEnemyZocThreatCandidates(zocContacts);

  if (candidates.length === 0) {
    return {
      status: MOST_THREATENING_STATUSES.NONE,
      mostThreateningEnemyId: null,
      selected: null,
      candidates: [],
      sourceStatus: ZOC_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      sourceRefs: MOST_THREATENING_SOURCE_REFS,
      explanation: ['No enemy ZOC candidates available for most-threatening selection.'],
      unresolvedRuleRefs: ['zoc.most-threatening-priority-and-tie-breaks'],
    };
  }

  const selected = candidates[0];
  const runnerUp = candidates[1] ?? null;
  const unresolvedTieBreak = runnerUp ? metricsAreTied(selected, runnerUp) : false;

  return {
    status: MOST_THREATENING_STATUSES.SELECTED,
    mostThreateningEnemyId: selected.enemyUnitId,
    selected,
    candidates,
    sourceStatus: unresolvedTieBreak
      ? ZOC_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
      : selected.sourceStatus,
    sourceRefs: MOST_THREATENING_SOURCE_REFS,
    explanation: [
      'Applied P5 subset ranking: nearest front distance, then front coverage, then lateral alignment, then deterministic enemy id.',
      unresolvedTieBreak
        ? 'Top candidates remain tied on implemented metrics; deeper tie-break interpretation remains needs-source-check.'
        : `Selected enemy ${selected.enemyUnitId} as most threatening under current P5 subset metrics.`,
    ],
    unresolvedRuleRefs: unresolvedTieBreak
      ? ['zoc.most-threatening-priority-and-tie-breaks']
      : [],
  };
}

export function selectMostThreateningEnemyForUnit(enemyUnits, targetUnit, options = {}) {
  const zocContacts = getEnemyZocContacts(enemyUnits, targetUnit, options);
  const selection = selectMostThreateningEnemy(zocContacts);

  return {
    ...selection,
    targetUnitId: targetUnit?.id ?? null,
    zocContacts,
  };
}