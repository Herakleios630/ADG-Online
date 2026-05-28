import {
  BROWSER_REPRO_EVENT_KINDS,
  BROWSER_REPRO_LOG_ENDPOINT,
  BROWSER_REPRO_LOG_GLOBAL,
  BROWSER_REPRO_STORAGE_KEY,
  MAX_BROWSER_REPRO_EVENTS,
  createReproEvent,
  isBrowserReproRecordingEnabled,
  summarizeReproEvents,
} from './browser-repro-contract.js';
import { projectBrowserReproEventsToCanonicalReplay } from './canonical-replay-contract.js';

let sequence = 0;
let currentSessionId = null;

function createReproSessionId() {
  const randomToken = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `browser-repro-${randomToken}`;
}

function ensureCurrentSessionId() {
  if (!currentSessionId) {
    currentSessionId = createReproSessionId();
  }

  return currentSessionId;
}

function postBrowserReproEvent(event) {
  if (typeof window === 'undefined' || !event) {
    return;
  }

  const payload = JSON.stringify({
    source: 'browser-repro',
    kind: event.kind,
    action: {
      type: event.action ? `browser-repro/${event.action}` : 'browser-repro/event',
      automationId: event.automationId ?? null,
    },
    state: event.state,
    movement: event.movement,
    page: event.page,
    details: {
      reproEvent: event,
    },
  });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(BROWSER_REPRO_LOG_ENDPOINT, blob)) {
        return;
      }
    } catch {
      // Fall through to fetch.
    }
  }

  try {
    fetch(BROWSER_REPRO_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Recorder persistence must stay best-effort only.
  }
}

export function clearPersistedBrowserReproLog() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    fetch(BROWSER_REPRO_LOG_ENDPOINT, {
      method: 'DELETE',
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Best-effort only.
  }
}

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function getBrowserPageSnapshot() {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    href: window.location?.href ?? null,
    viewport: {
      width: window.innerWidth ?? null,
      height: window.innerHeight ?? null,
      devicePixelRatio: window.devicePixelRatio ?? 1,
    },
  };
}

function getGlobalReproLog() {
  if (typeof window === 'undefined') {
    return [];
  }

  const log = Array.isArray(window[BROWSER_REPRO_LOG_GLOBAL]) ? window[BROWSER_REPRO_LOG_GLOBAL] : [];
  window[BROWSER_REPRO_LOG_GLOBAL] = log;
  return log;
}

function writeEvent(event) {
  const log = getGlobalReproLog();
  log.push(event);
  while (log.length > MAX_BROWSER_REPRO_EVENTS) {
    log.shift();
  }
  postBrowserReproEvent(event);
  return event;
}

export function isReproRecorderEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }

  return isBrowserReproRecordingEnabled(window.location, window.localStorage);
}

export function getActiveModalDescriptor(root = null) {
  const container = root ?? (typeof document !== 'undefined' ? document : null);
  const modal = container?.querySelector?.('[data-automation-role="active-modal"]') ?? null;
  if (!modal) {
    return null;
  }

  return {
    id: modal.dataset.activeModalId ?? modal.dataset.automationId ?? null,
    automationId: modal.dataset.automationId ?? null,
    priority: Number.isFinite(Number(modal.dataset.activeModalPriority))
      ? Number(modal.dataset.activeModalPriority)
      : null,
    nextActionSelector: modal.dataset.activeModalNextActionSelector ?? null,
  };
}

export function recordBrowserReproActionClick({ actionTarget, state = null, root = null } = {}) {
  return recordBrowserReproDataset({
    dataset: actionTarget?.dataset,
    state,
    root,
  });
}

export function recordBrowserReproDataset({ dataset = null, state = null, root = null, kind = null } = {}) {
  if (!isReproRecorderEnabled() || !dataset) {
    return null;
  }

  sequence += 1;
  return writeEvent(createReproEvent({
    kind,
    sequence,
    sessionId: ensureCurrentSessionId(),
    timestampIso: new Date().toISOString(),
    nowMs: getNowMs(),
    dataset,
    activeModal: getActiveModalDescriptor(root),
    state,
    page: getBrowserPageSnapshot(),
  }));
}

export function getBrowserReproLog() {
  return [...getGlobalReproLog()];
}

export function getBrowserReproSummary() {
  return summarizeReproEvents(getGlobalReproLog());
}

export function clearBrowserReproLog() {
  if (typeof window !== 'undefined') {
    window[BROWSER_REPRO_LOG_GLOBAL] = [];
  }
  currentSessionId = null;
  sequence = 0;
}

function recordBrowserReproSessionStart() {
  sequence = 1;
  return writeEvent(createReproEvent({
    kind: BROWSER_REPRO_EVENT_KINDS.SESSION_START,
    sequence,
    sessionId: ensureCurrentSessionId(),
    timestampIso: new Date().toISOString(),
    nowMs: getNowMs(),
    dataset: {
      automationId: 'browser-repro-session-start',
      stepId: 'session-start',
    },
    page: getBrowserPageSnapshot(),
  }));
}

export function resetBrowserReproRecorderSession({ clearPersisted = false } = {}) {
  clearBrowserReproLog();
  if (clearPersisted) {
    clearPersistedBrowserReproLog();
  }

  if (!isReproRecorderEnabled()) {
    return null;
  }

  return recordBrowserReproSessionStart();
}

export function enableBrowserReproRecorder() {
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem(BROWSER_REPRO_STORAGE_KEY, '1');
  }
}

export function disableBrowserReproRecorder() {
  if (typeof window !== 'undefined') {
    window.localStorage?.removeItem(BROWSER_REPRO_STORAGE_KEY);
  }
}

export function exportBrowserReproLog() {
  const events = getBrowserReproLog();
  return {
    schema: 'adg-browser-repro-v1',
    exportedAt: new Date().toISOString(),
    summary: getBrowserReproSummary(),
    events,
    canonicalReplay: projectBrowserReproEventsToCanonicalReplay(events),
  };
}
