import fs from 'node:fs';
import path from 'node:path';
import {
  DEBUG_LOG_ENDPOINT,
  DEFAULT_DEBUG_LOG_DIR,
  DEFAULT_DEBUG_LOG_FILE,
  LOG_AREAS,
  LOG_LEVELS,
  MAX_DEBUG_LOG_ENTRY_BYTES,
  MAX_DEBUG_LOG_FILE_BYTES,
  MAX_LOG_ARRAY_ITEMS,
  MAX_LOG_STRING_LENGTH,
  createRuleLogEvent,
  normalizeLogArea,
  normalizeLogLevel,
  summarizeLogValue,
} from './debug-log-contract.js';
import {
  BROWSER_REPRO_LOG_ENDPOINT,
  DEFAULT_BROWSER_REPRO_LOG_FILE,
  MAX_BROWSER_REPRO_PERSISTED_SESSIONS,
} from './browser-repro-contract.js';

function getApproxJsonByteLength(value) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return MAX_DEBUG_LOG_ENTRY_BYTES;
  }
}

function shrinkDebugLogEntry(entry) {
  const summarizedEntry = summarizeLogValue(entry, {
    maxArrayItems: MAX_LOG_ARRAY_ITEMS,
    maxStringLength: MAX_LOG_STRING_LENGTH,
  });

  if (getApproxJsonByteLength(summarizedEntry) <= MAX_DEBUG_LOG_ENTRY_BYTES) {
    return summarizedEntry;
  }

  return {
    timestamp: summarizedEntry.timestamp ?? new Date().toISOString(),
    timestampIso: summarizedEntry.timestampIso ?? summarizedEntry.timestamp ?? new Date().toISOString(),
    nowMs: Number.isFinite(summarizedEntry.nowMs) ? summarizedEntry.nowMs : null,
    receivedAt: summarizedEntry.receivedAt ?? new Date().toISOString(),
    level: summarizedEntry.level ?? LOG_LEVELS.WARN,
    area: summarizedEntry.area ?? LOG_AREAS.UI,
    source: summarizedEntry.source ?? 'browser',
    kind: summarizedEntry.kind ?? 'event',
    sessionId: summarizedEntry.sessionId ?? null,
    sequence: summarizedEntry.sequence ?? null,
    action: summarizedEntry.action ?? null,
    details: {
      truncated: true,
      reason: 'debug-log-entry-size-limit',
      originalApproxBytes: getApproxJsonByteLength(summarizedEntry),
      maxBytes: MAX_DEBUG_LOG_ENTRY_BYTES,
    },
  };
}

function rotateDebugLogFileIfNeeded(targetFile, serializedEntry, maxFileBytes) {
  if (!fs.existsSync(targetFile)) {
    return null;
  }

  const currentSize = fs.statSync(targetFile).size;
  if (currentSize + Buffer.byteLength(serializedEntry, 'utf8') <= maxFileBytes) {
    return null;
  }

  const parsedPath = path.parse(targetFile);
  const rotatedFile = path.join(parsedPath.dir, `${parsedPath.name}.previous${parsedPath.ext}`);
  if (fs.existsSync(rotatedFile)) {
    fs.rmSync(rotatedFile, { force: true });
  }
  fs.renameSync(targetFile, rotatedFile);
  return rotatedFile;
}

function trimBrowserReproLogFileToRecentSessions(targetFile, maxPersistedSessions = MAX_BROWSER_REPRO_PERSISTED_SESSIONS) {
  if (!fs.existsSync(targetFile) || maxPersistedSessions < 1) {
    return;
  }

  const rawContent = fs.readFileSync(targetFile, 'utf8');
  const lines = rawContent.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return;
  }

  const parsedLines = lines.map((line) => {
    try {
      const entry = JSON.parse(line);
      const sessionId = entry?.sessionId
        ?? entry?.details?.reproEvent?.sessionId
        ?? '__legacy__';
      const kind = entry?.kind ?? entry?.details?.reproEvent?.kind ?? null;
      const reproAction = entry?.details?.reproEvent?.action ?? null;
      const actionType = entry?.action?.type ?? null;
      const isMeaningful = kind !== 'session-start'
        && (typeof reproAction === 'string' || typeof actionType === 'string');
      return { line, sessionId, isMeaningful };
    } catch {
      return { line, sessionId: '__legacy__', isMeaningful: true };
    }
  });

  const sessionSummaries = [];
  const sessionSummaryById = new Map();
  for (const parsedLine of parsedLines) {
    if (!sessionSummaryById.has(parsedLine.sessionId)) {
      const summary = {
        sessionId: parsedLine.sessionId,
        isMeaningful: false,
      };
      sessionSummaryById.set(parsedLine.sessionId, summary);
      sessionSummaries.push(summary);
    }

    const summary = sessionSummaryById.get(parsedLine.sessionId);
    summary.isMeaningful = summary.isMeaningful || parsedLine.isMeaningful;
  }

  if (sessionSummaries.length <= maxPersistedSessions) {
    return;
  }

  const retainedMeaningfulIds = sessionSummaries
    .filter((summary) => summary.isMeaningful)
    .slice(-maxPersistedSessions)
    .map((summary) => summary.sessionId);
  const retainedSessionIds = new Set(retainedMeaningfulIds);

  if (retainedSessionIds.size < maxPersistedSessions) {
    sessionSummaries
      .filter((summary) => !summary.isMeaningful)
      .slice(-(maxPersistedSessions - retainedSessionIds.size))
      .forEach((summary) => retainedSessionIds.add(summary.sessionId));
  }

  const trimmedLines = parsedLines
    .filter((parsedLine) => retainedSessionIds.has(parsedLine.sessionId))
    .map((parsedLine) => parsedLine.line);

  fs.writeFileSync(targetFile, `${trimmedLines.join('\n')}\n`, 'utf8');
}

export function normalizeDebugLogEntry(payload, metadata = {}) {
  const now = metadata.now ?? new Date().toISOString();
  const timestamp = typeof payload?.timestamp === 'string' ? payload.timestamp : now;
  const timestampIso = typeof payload?.timestampIso === 'string'
    ? payload.timestampIso
    : typeof payload?.details?.timestampIso === 'string'
      ? payload.details.timestampIso
      : timestamp;
  const nowMs = Number.isFinite(payload?.nowMs)
    ? payload.nowMs
    : Number.isFinite(payload?.details?.nowMs)
      ? payload.details.nowMs
      : Number.isFinite(payload?.performance?.nowMs)
        ? payload.performance.nowMs
        : null;
  const source = typeof payload?.source === 'string' ? payload.source : 'browser';
  const kind = typeof payload?.kind === 'string' ? payload.kind : 'event';
  const ruleEvent = createRuleLogEvent({
    ...payload?.ruleEvent,
    timestamp,
    sessionId: typeof payload?.sessionId === 'string' ? payload.sessionId : null,
    level: payload?.level ?? payload?.ruleEvent?.level ?? LOG_LEVELS.INFO,
    area: payload?.area ?? payload?.ruleEvent?.area ?? LOG_AREAS.UI,
    eventType: kind,
    actionType: payload?.action?.type,
    input: payload?.ruleEvent?.input ?? payload?.input ?? null,
    decision: payload?.ruleEvent?.decision ?? payload?.decision ?? null,
    candidates: payload?.ruleEvent?.candidates ?? payload?.candidates ?? [],
    diagnostics: payload?.ruleEvent?.diagnostics ?? payload?.diagnostics ?? [],
    timings: payload?.ruleEvent?.timings ?? payload?.timings ?? null,
    stateSummary: payload?.ruleEvent?.stateSummary ?? payload?.state ?? null,
  }, { now });

  return {
    timestamp,
    timestampIso,
    nowMs,
    receivedAt: now,
    level: normalizeLogLevel(payload?.level ?? ruleEvent.level, LOG_LEVELS.INFO),
    area: normalizeLogArea(payload?.area ?? ruleEvent.area, LOG_AREAS.UI),
    source,
    kind,
    sessionId: typeof payload?.sessionId === 'string' ? payload.sessionId : null,
    sequence: Number.isFinite(payload?.sequence) ? payload.sequence : null,
    ruleEvent,
    page: typeof payload?.page === 'object' && payload.page !== null ? payload.page : null,
    action: typeof payload?.action === 'object' && payload.action !== null ? payload.action : null,
    state: typeof payload?.state === 'object' && payload.state !== null ? payload.state : null,
    performance: typeof payload?.performance === 'object' && payload.performance !== null ? payload.performance : null,
    overlays: typeof payload?.overlays === 'object' && payload.overlays !== null ? payload.overlays : null,
    error: typeof payload?.error === 'object' && payload.error !== null ? payload.error : null,
    details: typeof payload?.details === 'object' && payload.details !== null ? payload.details : {},
  };
}

export function normalizeBrowserReproLogEntry(payload, metadata = {}) {
  const now = metadata.now ?? new Date().toISOString();
  const timestamp = typeof payload?.timestamp === 'string'
    ? payload.timestamp
    : typeof payload?.details?.reproEvent?.timestamp === 'string'
      ? payload.details.reproEvent.timestamp
      : now;
  const timestampIso = typeof payload?.timestampIso === 'string'
    ? payload.timestampIso
    : typeof payload?.details?.reproEvent?.timestamp === 'string'
      ? payload.details.reproEvent.timestamp
      : timestamp;
  const nowMs = Number.isFinite(payload?.nowMs)
    ? payload.nowMs
    : Number.isFinite(payload?.details?.reproEvent?.nowMs)
      ? payload.details.reproEvent.nowMs
      : null;

  return {
    timestamp,
    timestampIso,
    nowMs,
    receivedAt: now,
    level: normalizeLogLevel(payload?.level, LOG_LEVELS.DEBUG),
    area: normalizeLogArea(payload?.area, LOG_AREAS.ACTION),
    source: typeof payload?.source === 'string' ? payload.source : 'browser-repro',
    kind: typeof payload?.kind === 'string' ? payload.kind : 'browser-repro-event',
    sessionId: typeof payload?.sessionId === 'string'
      ? payload.sessionId
      : typeof payload?.details?.reproEvent?.sessionId === 'string'
        ? payload.details.reproEvent.sessionId
        : null,
    sequence: Number.isFinite(payload?.details?.reproEvent?.sequence)
      ? payload.details.reproEvent.sequence
      : Number.isFinite(payload?.sequence)
        ? payload.sequence
        : null,
    action: typeof payload?.action === 'object' && payload.action !== null ? payload.action : null,
    page: typeof payload?.page === 'object' && payload.page !== null ? payload.page : null,
    state: typeof payload?.state === 'object' && payload.state !== null ? payload.state : null,
    performance: null,
    overlays: null,
    error: null,
    details: typeof payload?.details === 'object' && payload.details !== null ? payload.details : {},
  };
}

export function appendDebugLogEntry({
  rootDir,
  entry,
  logDir = DEFAULT_DEBUG_LOG_DIR,
  logFile = DEFAULT_DEBUG_LOG_FILE,
  maxFileBytes = MAX_DEBUG_LOG_FILE_BYTES,
} = {}) {
  const targetDir = path.join(rootDir, logDir);
  fs.mkdirSync(targetDir, { recursive: true });

  const targetFile = path.join(targetDir, logFile);
  const boundedEntry = shrinkDebugLogEntry(entry);
  const serializedEntry = `${JSON.stringify(boundedEntry)}\n`;
  rotateDebugLogFileIfNeeded(targetFile, serializedEntry, maxFileBytes);
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      fs.appendFileSync(targetFile, serializedEntry, 'utf8');
      if (logFile === DEFAULT_BROWSER_REPRO_LOG_FILE) {
        trimBrowserReproLogFileToRecentSessions(targetFile);
      }
      return targetFile;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Debug log payload exceeded 1 MB.'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function clearDebugLogFiles(targetFile) {
  if (fs.existsSync(targetFile)) {
    fs.rmSync(targetFile, { force: true });
  }

  const parsedPath = path.parse(targetFile);
  const rotatedFile = path.join(parsedPath.dir, `${parsedPath.name}.previous${parsedPath.ext}`);
  if (fs.existsSync(rotatedFile)) {
    fs.rmSync(rotatedFile, { force: true });
  }
}

export function createDebugLogMiddleware({
  rootDir,
  endpoint = DEBUG_LOG_ENDPOINT,
  logDir = DEFAULT_DEBUG_LOG_DIR,
  logFile = DEFAULT_DEBUG_LOG_FILE,
  normalizeEntry = normalizeDebugLogEntry,
} = {}) {
  if (!rootDir) {
    throw new Error('createDebugLogMiddleware requires rootDir.');
  }

  return async function debugLogMiddleware(request, response, next) {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    if (requestUrl.pathname !== endpoint) {
      next();
      return;
    }

    if (request.method === 'GET') {
      const targetFile = path.join(rootDir, logDir, logFile);
      sendJson(response, 200, {
        ok: true,
        endpoint,
        logFile: targetFile,
        exists: fs.existsSync(targetFile),
        maxEntryBytes: MAX_DEBUG_LOG_ENTRY_BYTES,
        maxFileBytes: MAX_DEBUG_LOG_FILE_BYTES,
      });
      return;
    }

    if (request.method === 'DELETE') {
      const targetFile = path.join(rootDir, logDir, logFile);
      clearDebugLogFiles(targetFile);
      sendJson(response, 200, { ok: true, logFile: targetFile, cleared: true });
      return;
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, { ok: false, error: 'Method not allowed.' });
      return;
    }

    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      const entry = normalizeEntry(payload);
      const targetFile = appendDebugLogEntry({ rootDir, entry, logDir, logFile });
      sendJson(response, 200, { ok: true, logFile: targetFile });
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

export function createAdgDebugLogPlugin(options = {}) {
  return {
    name: 'adg-debug-log-plugin',
    configureServer(server) {
      server.middlewares.use(createDebugLogMiddleware({
        rootDir: server.config.root,
        ...options,
      }));
      server.middlewares.use(createDebugLogMiddleware({
        rootDir: server.config.root,
        endpoint: BROWSER_REPRO_LOG_ENDPOINT,
        logDir: options.logDir ?? DEFAULT_DEBUG_LOG_DIR,
        logFile: DEFAULT_BROWSER_REPRO_LOG_FILE,
        normalizeEntry: normalizeBrowserReproLogEntry,
      }));
    },
  };
}
