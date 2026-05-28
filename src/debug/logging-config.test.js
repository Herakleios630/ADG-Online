import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_LOG_FILTERS,
  LOG_AREAS,
  LOG_LEVELS,
  createRuleLogEvent,
  parseLogAreas,
  parseLogFilters,
  shouldLog,
} from './logging-config.js';

test('parseLogFilters reads URL filters and ignores malformed values safely', () => {
  const filters = parseLogFilters({
    searchParams: '?debug=1&log=charge,evade,unknown&level=trace',
  });

  assert.equal(filters.level, LOG_LEVELS.TRACE);
  assert.deepEqual(filters.areas, [LOG_AREAS.CHARGE, LOG_AREAS.EVADE]);

  const fallbackFilters = parseLogFilters({
    searchParams: '?log=unknown&level=nope',
  });

  assert.equal(fallbackFilters.level, DEFAULT_LOG_FILTERS.level);
  assert.deepEqual(fallbackFilters.areas, DEFAULT_LOG_FILTERS.areas);
});

test('parseLogFilters can read local storage style values', () => {
  const filters = parseLogFilters({
    storage: {
      getItem(key) {
        return {
          'adg-debug-level': 'debug',
          'adg-debug-areas': 'movement,zoc',
        }[key] ?? null;
      },
    },
  });

  assert.equal(filters.level, LOG_LEVELS.DEBUG);
  assert.deepEqual(filters.areas, [LOG_AREAS.MOVEMENT, LOG_AREAS.ZOC]);
});

test('parseLogAreas dedupes known areas and preserves all as a normal filter value', () => {
  assert.deepEqual(
    parseLogAreas('charge,charge,all,evade'),
    [LOG_AREAS.CHARGE, LOG_AREAS.ALL, LOG_AREAS.EVADE],
  );
});

test('shouldLog honors level thresholds and area filters', () => {
  const filters = { level: LOG_LEVELS.DEBUG, areas: [LOG_AREAS.CHARGE, LOG_AREAS.EVADE] };

  assert.equal(shouldLog({ level: LOG_LEVELS.ERROR, area: LOG_AREAS.CHARGE, filters }), true);
  assert.equal(shouldLog({ level: LOG_LEVELS.INFO, area: LOG_AREAS.EVADE, filters }), true);
  assert.equal(shouldLog({ level: LOG_LEVELS.DEBUG, area: LOG_AREAS.CHARGE, filters }), true);
  assert.equal(shouldLog({ level: LOG_LEVELS.TRACE, area: LOG_AREAS.CHARGE, filters }), false);
  assert.equal(shouldLog({ level: LOG_LEVELS.INFO, area: LOG_AREAS.MOVEMENT, filters }), false);
});

test('shouldLog supports all areas and rejects unknown level or area values', () => {
  const filters = { level: LOG_LEVELS.WARN, areas: [LOG_AREAS.ALL] };

  assert.equal(shouldLog({ level: LOG_LEVELS.ERROR, area: LOG_AREAS.UI, filters }), true);
  assert.equal(shouldLog({ level: LOG_LEVELS.WARN, area: LOG_AREAS.PERF, filters }), true);
  assert.equal(shouldLog({ level: LOG_LEVELS.INFO, area: LOG_AREAS.PERF, filters }), false);
  assert.equal(shouldLog({ level: 'verbose', area: LOG_AREAS.PERF, filters }), false);
  assert.equal(shouldLog({ level: LOG_LEVELS.ERROR, area: 'bad-area', filters }), false);
});

test('createRuleLogEvent normalizes the shared event shape and strips unserializable values', () => {
  const circular = { id: 'loop' };
  circular.self = circular;
  const event = createRuleLogEvent({
    level: 'TRACE',
    area: 'evade',
    eventType: 'candidate-selected',
    action: { type: 'game/resolve-charge-branch-distance' },
    phase: 'charge',
    unitIds: ['unit-20'],
    ruleId: 'charge.evade.path-avoidance',
    sourceStatus: 'verified',
    message: 'Selected evade candidate.',
    input: { circular, skipMe: () => {} },
    decision: { candidateId: 'slide-left-1.000' },
    candidates: [{ id: 'slide-left-1.000' }],
    diagnostics: [{ code: 'ok' }],
    timings: { reduceMs: 3.25 },
    stateSummary: { chargeStatus: 'evade-required' },
  }, { now: '2026-05-25T12:00:00.000Z', sessionId: 'session-1' });

  assert.equal(event.timestamp, '2026-05-25T12:00:00.000Z');
  assert.equal(event.sessionId, 'session-1');
  assert.equal(event.level, LOG_LEVELS.TRACE);
  assert.equal(event.area, LOG_AREAS.EVADE);
  assert.equal(event.actionType, 'game/resolve-charge-branch-distance');
  assert.equal(event.input.circular.self, '[Circular]');
  assert.equal('skipMe' in event.input, false);
  assert.doesNotThrow(() => JSON.stringify(event));
});

test('createRuleLogEvent truncates large candidate arrays for trace safety', () => {
  const event = createRuleLogEvent({
    level: LOG_LEVELS.TRACE,
    area: LOG_AREAS.EVADE,
    candidates: Array.from({ length: 45 }, (_, index) => ({ id: `candidate-${index}` })),
  });

  assert.equal(event.candidates.length, 41);
  assert.deepEqual(event.candidates.at(-1), {
    truncated: true,
    omittedCount: 5,
  });
});