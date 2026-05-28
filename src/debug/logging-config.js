export const LOG_LEVELS = Object.freeze({
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
});

export const LOG_LEVEL_ORDER = Object.freeze([
  LOG_LEVELS.ERROR,
  LOG_LEVELS.WARN,
  LOG_LEVELS.INFO,
  LOG_LEVELS.DEBUG,
  LOG_LEVELS.TRACE,
]);

export const LOG_AREAS = Object.freeze({
  ACTION: 'action',
  STATE: 'state',
  SETUP: 'setup',
  COMMAND: 'command',
  MOVEMENT: 'movement',
  ZOC: 'zoc',
  CHARGE: 'charge',
  CONTACT: 'contact',
  REACTION: 'reaction',
  EVADE: 'evade',
  CONFORMATION: 'conformation',
  SHOOTING: 'shooting',
  MELEE: 'melee',
  ROUT: 'rout',
  TERRAIN: 'terrain',
  VISIBILITY: 'visibility',
  ARMY_BUILDER: 'army-builder',
  REPLAY: 'replay',
  UI: 'ui',
  PERF: 'perf',
  NETWORK: 'network',
  AI: 'ai',
  ALL: 'all',
});

export const LOG_AREA_VALUES = Object.freeze(Object.values(LOG_AREAS));

export const DEFAULT_LOG_FILTERS = Object.freeze({
  level: LOG_LEVELS.INFO,
  areas: Object.freeze([LOG_AREAS.ALL]),
});

const LOG_LEVEL_SET = new Set(LOG_LEVEL_ORDER);
const LOG_AREA_SET = new Set(LOG_AREA_VALUES);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function normalizeLogLevel(level, fallback = null) {
  const normalizedLevel = normalizeString(level);
  return LOG_LEVEL_SET.has(normalizedLevel) ? normalizedLevel : fallback;
}

export function normalizeLogArea(area, fallback = null) {
  const normalizedArea = normalizeString(area);
  return LOG_AREA_SET.has(normalizedArea) ? normalizedArea : fallback;
}

export function getLogLevelRank(level) {
  return LOG_LEVEL_ORDER.indexOf(normalizeLogLevel(level, ''));
}

export function parseLogAreas(value, fallback = DEFAULT_LOG_FILTERS.areas) {
  if (Array.isArray(value)) {
    const areas = value.map((area) => normalizeLogArea(area)).filter(Boolean);
    return areas.length > 0 ? Array.from(new Set(areas)) : [...fallback];
  }

  const normalizedValue = typeof value === 'string' ? value : '';
  const areas = normalizedValue
    .split(',')
    .map((area) => normalizeLogArea(area))
    .filter(Boolean);

  return areas.length > 0 ? Array.from(new Set(areas)) : [...fallback];
}

function getSearchParamValue(searchParams, key) {
  if (!searchParams) {
    return null;
  }

  if (typeof URLSearchParams !== 'undefined' && searchParams instanceof URLSearchParams) {
    return searchParams.get(key);
  }

  if (typeof searchParams.get === 'function') {
    return searchParams.get(key);
  }

  if (typeof searchParams === 'string') {
    try {
      return new URLSearchParams(searchParams.startsWith('?') ? searchParams.slice(1) : searchParams).get(key);
    } catch {
      return null;
    }
  }

  return searchParams[key] ?? null;
}

function getStorageValue(storage, key) {
  if (!storage) {
    return null;
  }

  try {
    if (typeof storage.getItem === 'function') {
      return storage.getItem(key);
    }

    return storage[key] ?? null;
  } catch {
    return null;
  }
}

export function parseLogFilters({ searchParams = null, storage = null, defaults = DEFAULT_LOG_FILTERS } = {}) {
  const defaultLevel = normalizeLogLevel(defaults?.level, DEFAULT_LOG_FILTERS.level);
  const defaultAreas = parseLogAreas(defaults?.areas, DEFAULT_LOG_FILTERS.areas);
  const rawLevel = getSearchParamValue(searchParams, 'level')
    ?? getStorageValue(storage, 'adg-debug-level')
    ?? defaultLevel;
  const rawAreas = getSearchParamValue(searchParams, 'log')
    ?? getStorageValue(storage, 'adg-debug-areas')
    ?? defaultAreas;

  return {
    level: normalizeLogLevel(rawLevel, defaultLevel),
    areas: parseLogAreas(rawAreas, defaultAreas),
  };
}

export function shouldLog({ level = LOG_LEVELS.INFO, area = LOG_AREAS.ACTION, filters = DEFAULT_LOG_FILTERS } = {}) {
  const normalizedLevel = normalizeLogLevel(level);
  const normalizedArea = normalizeLogArea(area);
  if (!normalizedLevel || !normalizedArea) {
    return false;
  }

  const filterLevel = normalizeLogLevel(filters?.level, DEFAULT_LOG_FILTERS.level);
  const filterAreas = parseLogAreas(filters?.areas, DEFAULT_LOG_FILTERS.areas);
  const eventRank = getLogLevelRank(normalizedLevel);
  const filterRank = getLogLevelRank(filterLevel);

  return eventRank >= 0
    && filterRank >= 0
    && eventRank <= filterRank
    && (filterAreas.includes(LOG_AREAS.ALL) || filterAreas.includes(normalizedArea));
}

export function cloneLogValue(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') {
      return null;
    }

    return Number.isNaN(value) ? null : value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => cloneLogValue(entry, seen));
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => typeof entryValue !== 'function' && typeof entryValue !== 'symbol')
      .map(([key, entryValue]) => [key, cloneLogValue(entryValue, seen)]),
  );
}

export function summarizeLogValue(value, options = {}, seen = new WeakSet(), depth = 0) {
  const maxArrayItems = Number.isInteger(options.maxArrayItems) ? options.maxArrayItems : 40;
  const maxStringLength = Number.isInteger(options.maxStringLength) ? options.maxStringLength : 2000;
  const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 8;

  if (typeof value === 'string') {
    return value.length > maxStringLength
      ? `${value.slice(0, maxStringLength)}...[truncated ${value.length - maxStringLength} chars]`
      : value;
  }

  if (value === null || typeof value !== 'object') {
    return cloneLogValue(value);
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  if (depth >= maxDepth) {
    return '[MaxDepth]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const summarized = value
      .slice(0, maxArrayItems)
      .map((entry) => summarizeLogValue(entry, options, seen, depth + 1));
    if (value.length > maxArrayItems) {
      summarized.push({
        truncated: true,
        omittedCount: value.length - maxArrayItems,
      });
    }
    return summarized;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => typeof entryValue !== 'function' && typeof entryValue !== 'symbol')
      .map(([key, entryValue]) => [key, summarizeLogValue(entryValue, options, seen, depth + 1)]),
  );
}

export function createRuleLogEvent(overrides = {}, metadata = {}) {
  const timestamp = typeof overrides.timestamp === 'string'
    ? overrides.timestamp
    : metadata.now ?? new Date().toISOString();
  const level = normalizeLogLevel(overrides.level, LOG_LEVELS.INFO);
  const area = normalizeLogArea(overrides.area, LOG_AREAS.ACTION);

  return {
    timestamp,
    sessionId: typeof overrides.sessionId === 'string' ? overrides.sessionId : metadata.sessionId ?? null,
    level,
    area,
    eventType: typeof overrides.eventType === 'string' ? overrides.eventType : overrides.kind ?? 'event',
    actionType: typeof overrides.actionType === 'string' ? overrides.actionType : overrides.action?.type ?? null,
    phase: overrides.phase ?? null,
    unitIds: Array.isArray(overrides.unitIds) ? cloneLogValue(overrides.unitIds) : [],
    ruleId: overrides.ruleId ?? null,
    sourceStatus: overrides.sourceStatus ?? null,
    message: typeof overrides.message === 'string' ? overrides.message : '',
    input: summarizeLogValue(overrides.input ?? null),
    decision: summarizeLogValue(overrides.decision ?? null),
    candidates: summarizeLogValue(overrides.candidates ?? []),
    diagnostics: summarizeLogValue(overrides.diagnostics ?? []),
    timings: summarizeLogValue(overrides.timings ?? null),
    stateSummary: summarizeLogValue(overrides.stateSummary ?? null),
  };
}