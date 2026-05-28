import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  appendDebugLogEntry,
  createDebugLogMiddleware,
  normalizeBrowserReproLogEntry,
  normalizeDebugLogEntry,
} from './vite-debug-log-plugin.js';
import { DEFAULT_DEBUG_LOG_FILE } from './debug-log-contract.js';
import { DEFAULT_BROWSER_REPRO_LOG_FILE } from './browser-repro-contract.js';

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'adg-debug-log-'));
}

test('normalizeDebugLogEntry preserves action, state, performance, overlays, and details', () => {
  const entry = normalizeDebugLogEntry({
    timestamp: '2026-05-24T12:00:00.000Z',
    timestampIso: '2026-05-24T12:00:00.123Z',
    nowMs: 321.45,
    level: 'debug',
    area: 'evade',
    source: 'browser',
    kind: 'action-complete',
    sessionId: 'session-1',
    sequence: 7,
    page: { href: 'http://localhost:5175/?debug=1' },
    action: { type: 'game/resolve-charge-branch-distance', dieRoll: 6 },
    state: { chargeStatus: 'evade-required' },
    performance: { reduceMs: 1, renderMs: 200 },
    overlays: { zocBands: 14, evadePreview: 3 },
    details: { note: 'evade roll' },
  }, { now: '2026-05-24T12:00:01.000Z' });

  assert.equal(entry.timestamp, '2026-05-24T12:00:00.000Z');
  assert.equal(entry.timestampIso, '2026-05-24T12:00:00.123Z');
  assert.equal(entry.nowMs, 321.45);
  assert.equal(entry.receivedAt, '2026-05-24T12:00:01.000Z');
  assert.equal(entry.level, 'debug');
  assert.equal(entry.area, 'evade');
  assert.equal(entry.kind, 'action-complete');
  assert.equal(entry.ruleEvent.eventType, 'action-complete');
  assert.equal(entry.ruleEvent.actionType, 'game/resolve-charge-branch-distance');
  assert.equal(entry.ruleEvent.stateSummary.chargeStatus, 'evade-required');
  assert.equal(entry.action.type, 'game/resolve-charge-branch-distance');
  assert.equal(entry.action.dieRoll, 6);
  assert.equal(entry.state.chargeStatus, 'evade-required');
  assert.equal(entry.performance.renderMs, 200);
  assert.equal(entry.overlays.zocBands, 14);
  assert.equal(entry.details.note, 'evade roll');
});

test('appendDebugLogEntry writes JSONL into the local logs directory', () => {
  const rootDir = createTempRoot();
  const entry = normalizeDebugLogEntry({
    kind: 'action-start',
    action: { type: 'game/resolve-charge-branch-distance', dieRoll: 6 },
  }, { now: '2026-05-24T12:00:02.000Z' });

  const logFile = appendDebugLogEntry({ rootDir, entry });
  assert.equal(path.basename(logFile), DEFAULT_DEBUG_LOG_FILE);
  assert.equal(path.basename(path.dirname(logFile)), 'logs');

  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.kind, 'action-start');
  assert.equal(parsed.action.type, 'game/resolve-charge-branch-distance');
  assert.equal(parsed.action.dieRoll, 6);
});

test('appendDebugLogEntry shrinks oversized entries before writing JSONL', () => {
  const rootDir = createTempRoot();
  const entry = normalizeDebugLogEntry({
    kind: 'trace-heavy',
    details: Object.fromEntries(
      Array.from({ length: 10000 }, (_, index) => [`key-${index}`, `value-${index}`]),
    ),
  }, { now: '2026-05-24T12:00:03.000Z' });

  const logFile = appendDebugLogEntry({ rootDir, entry });
  const parsed = JSON.parse(fs.readFileSync(logFile, 'utf8').trim());

  assert.equal(parsed.details.truncated, true);
  assert.equal(parsed.details.reason, 'debug-log-entry-size-limit');
});

test('appendDebugLogEntry rotates the current JSONL file before it exceeds the configured size', () => {
  const rootDir = createTempRoot();
  const firstEntry = normalizeDebugLogEntry({
    kind: 'first-large-entry',
    details: { note: 'a'.repeat(2000) },
  }, { now: '2026-05-24T12:00:04.000Z' });
  const secondEntry = normalizeDebugLogEntry({
    kind: 'second-large-entry',
    details: { note: 'b'.repeat(2000) },
  }, { now: '2026-05-24T12:00:05.000Z' });

  const logFile = appendDebugLogEntry({ rootDir, entry: firstEntry, maxFileBytes: 2500 });
  appendDebugLogEntry({ rootDir, entry: secondEntry, maxFileBytes: 2500 });

  const rotatedFile = path.join(path.dirname(logFile), 'adg-debug-current.previous.jsonl');
  assert.equal(fs.existsSync(rotatedFile), true);
  assert.match(fs.readFileSync(rotatedFile, 'utf8'), /first-large-entry/);
  assert.match(fs.readFileSync(logFile, 'utf8'), /second-large-entry/);
});

test('normalizeBrowserReproLogEntry preserves bounded repro event payloads for a separate JSONL sink', () => {
  const entry = normalizeBrowserReproLogEntry({
    source: 'browser-repro',
    kind: 'button-click',
    action: { type: 'browser-repro/round-begin', automationId: 'round-begin' },
    state: { screen: 'battlefield', chargeStatus: 'idle' },
    page: { href: 'http://localhost:4175/?recordClicks=1' },
    details: {
      reproEvent: {
        timestamp: '2026-05-27T12:00:00.000Z',
        nowMs: 123.45,
        sequence: 4,
        sessionId: 'session-4',
        action: 'round-begin',
        automationId: 'round-begin',
      },
    },
  }, { now: '2026-05-27T12:00:01.000Z' });

  assert.equal(entry.timestamp, '2026-05-27T12:00:00.000Z');
  assert.equal(entry.nowMs, 123.45);
  assert.equal(entry.sequence, 4);
  assert.equal(entry.sessionId, 'session-4');
  assert.equal(entry.source, 'browser-repro');
  assert.equal(entry.kind, 'button-click');
  assert.equal(entry.action.type, 'browser-repro/round-begin');
  assert.equal(entry.details.reproEvent.automationId, 'round-begin');
});

test('appendDebugLogEntry can write browser repro entries into a dedicated JSONL file', () => {
  const rootDir = createTempRoot();
  const entry = normalizeBrowserReproLogEntry({
    source: 'browser-repro',
    kind: 'button-click',
    action: { type: 'browser-repro/select-active-corps', automationId: 'select-active-corps-corps-1' },
    details: {
      reproEvent: {
        timestamp: '2026-05-27T12:00:00.000Z',
        sequence: 1,
      },
    },
  }, { now: '2026-05-27T12:00:01.000Z' });

  const logFile = appendDebugLogEntry({ rootDir, entry, logFile: DEFAULT_BROWSER_REPRO_LOG_FILE });
  assert.equal(path.basename(logFile), DEFAULT_BROWSER_REPRO_LOG_FILE);

  const parsed = JSON.parse(fs.readFileSync(logFile, 'utf8').trim());
  assert.equal(parsed.source, 'browser-repro');
  assert.equal(parsed.action.type, 'browser-repro/select-active-corps');
});

test('appendDebugLogEntry keeps only the latest five persisted browser repro sessions', () => {
  const rootDir = createTempRoot();

  for (let index = 1; index <= 6; index += 1) {
    appendDebugLogEntry({
      rootDir,
      logFile: DEFAULT_BROWSER_REPRO_LOG_FILE,
      entry: normalizeBrowserReproLogEntry({
        source: 'browser-repro',
        kind: index === 1 ? 'session-start' : 'button-click',
        sessionId: `session-${index}`,
        details: {
          reproEvent: {
            timestamp: `2026-05-27T12:00:0${index}.000Z`,
            sequence: 1,
            sessionId: `session-${index}`,
          },
        },
      }, { now: `2026-05-27T12:00:0${index}.500Z` }),
    });
  }

  const logFile = path.join(rootDir, 'logs', DEFAULT_BROWSER_REPRO_LOG_FILE);
  const parsedLines = fs.readFileSync(logFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.deepEqual(parsedLines.map((entry) => entry.sessionId), [
    'session-2',
    'session-3',
    'session-4',
    'session-5',
    'session-6',
  ]);
});

test('appendDebugLogEntry does not let empty session-start tabs evict the last meaningful repro session', () => {
  const rootDir = createTempRoot();

  appendDebugLogEntry({
    rootDir,
    logFile: DEFAULT_BROWSER_REPRO_LOG_FILE,
    entry: normalizeBrowserReproLogEntry({
      source: 'browser-repro',
      kind: 'button-click',
      action: { type: 'browser-repro/start-charge-drill-battle', automationId: 'start-charge-drill-battle' },
      details: {
        reproEvent: {
          timestamp: '2026-05-27T12:00:00.000Z',
          sequence: 2,
          sessionId: 'meaningful-session',
          action: 'start-charge-drill-battle',
        },
      },
    }, { now: '2026-05-27T12:00:00.500Z' }),
  });

  for (let index = 1; index <= 5; index += 1) {
    appendDebugLogEntry({
      rootDir,
      logFile: DEFAULT_BROWSER_REPRO_LOG_FILE,
      entry: normalizeBrowserReproLogEntry({
        source: 'browser-repro',
        kind: 'session-start',
        details: {
          reproEvent: {
            timestamp: `2026-05-27T12:00:1${index}.000Z`,
            sequence: 1,
            sessionId: `empty-session-${index}`,
          },
        },
      }, { now: `2026-05-27T12:00:1${index}.500Z` }),
    });
  }

  const logFile = path.join(rootDir, 'logs', DEFAULT_BROWSER_REPRO_LOG_FILE);
  const parsedLines = fs.readFileSync(logFile, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.deepEqual([...new Set(parsedLines.map((entry) => entry.sessionId))], [
    'meaningful-session',
    'empty-session-2',
    'empty-session-3',
    'empty-session-4',
    'empty-session-5',
  ]);
});

test('createDebugLogMiddleware clears the dedicated repro sink on DELETE', async () => {
  const rootDir = createTempRoot();
  const targetFile = path.join(rootDir, 'logs', DEFAULT_BROWSER_REPRO_LOG_FILE);
  const rotatedFile = path.join(rootDir, 'logs', 'adg-browser-repro-current.previous.jsonl');
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, '{"source":"browser-repro"}\n');
  fs.writeFileSync(rotatedFile, '{"source":"browser-repro"}\n');

  const middleware = createDebugLogMiddleware({
    rootDir,
    endpoint: '/__adg-debug/repro',
    logFile: DEFAULT_BROWSER_REPRO_LOG_FILE,
    normalizeEntry: normalizeBrowserReproLogEntry,
  });

  const request = { method: 'DELETE', url: '/__adg-debug/repro' };
  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value) {
      this.body = value;
    },
  };

  await middleware(request, response, () => {
    throw new Error('DELETE repro middleware should not call next().');
  });

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).cleared, true);
  assert.equal(fs.existsSync(targetFile), false);
  assert.equal(fs.existsSync(rotatedFile), false);
});
