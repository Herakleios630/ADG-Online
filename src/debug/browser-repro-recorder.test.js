import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createReproEvent,
  inferReproEventKind,
  isBrowserReproRecordingEnabled,
} from './browser-repro-contract.js';
import {
  clearPersistedBrowserReproLog,
  clearBrowserReproLog,
  exportBrowserReproLog,
  getActiveModalDescriptor,
  getBrowserReproSummary,
  recordBrowserReproActionClick,
  recordBrowserReproDataset,
  resetBrowserReproRecorderSession,
} from './browser-repro-recorder.js';

function installFakeBrowser(search = '?recordClicks=1') {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalPerformance = globalThis.performance;
  const originalFetch = globalThis.fetch;
  const storage = new Map();
  const posted = [];
  const requests = [];

  globalThis.window = {
    location: { search, href: `http://localhost:5173/${search}` },
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
    },
    innerWidth: 1000,
    innerHeight: 700,
    devicePixelRatio: 1,
  };
  globalThis.performance = { now: () => 42.25 };
  globalThis.fetch = async (url, options = {}) => {
    requests.push({
      url,
      method: options.method ?? 'GET',
      hasBody: typeof options.body === 'string',
    });
    if (typeof options.body === 'string') {
      posted.push(JSON.parse(options.body));
    }
    return { ok: true };
  };

  return {
    posted,
    requests,
    cleanup() {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
      globalThis.performance = originalPerformance;
      globalThis.fetch = originalFetch;
    },
    setDocument(documentLike) {
      globalThis.document = documentLike;
    },
  };
}

test('isBrowserReproRecordingEnabled accepts query param and storage gate', () => {
  assert.equal(isBrowserReproRecordingEnabled({ search: '?recordClicks=1' }, null), true);
  assert.equal(isBrowserReproRecordingEnabled({ search: '?debug=1' }, { getItem: () => '1' }), true);
  assert.equal(isBrowserReproRecordingEnabled({ search: '?debug=1' }, { getItem: () => null }), false);
});

test('createReproEvent sanitizes datasets and classifies key browser actions', () => {
  const event = createReproEvent({
    sequence: 1,
    timestampIso: '2026-05-27T12:00:00.000Z',
    dataset: {
      action: 'resolve-charge-branch-distance',
      dieRoll: '6',
      secret: 'must-not-survive',
      automationId: 'roll-6',
    },
    state: {
      shell: { currentScreen: 'battlefield' },
      game: { selectedUnitId: 'unit-3', chargePreview: { status: 'evade-required' } },
    },
  });

  assert.equal(event.kind, 'roll-selection');
  assert.equal(event.dataset.dieRoll, '6');
  assert.equal(event.dataset.secret, undefined);
  assert.equal(event.state.screen, 'battlefield');
  assert.equal(inferReproEventKind({ action: 'acknowledge-evade-choice-handoff' }), 'handoff-acknowledgement');
  assert.equal(inferReproEventKind({ action: 'select-evade-avoidance-choice', candidateId: 'branch-direction-wheel' }), 'branch-selection');
});

test('recordBrowserReproActionClick records bounded ordered events with active modal metadata', () => {
  const browser = installFakeBrowser();
  try {
    clearBrowserReproLog();
    const activeModal = {
      dataset: {
        activeModalId: 'round-begin',
        automationId: 'round-begin-dialog',
        activeModalPriority: '100',
        activeModalNextActionSelector: '[data-automation-id="round-begin"]',
      },
    };
    const root = { querySelector: () => activeModal };
    browser.setDocument(root);

    const entry = recordBrowserReproActionClick({
      root,
      actionTarget: {
        dataset: {
          action: 'round-begin',
          automationId: 'round-begin',
        },
      },
      state: { shell: { currentScreen: 'battlefield' }, game: { chargePreview: { status: 'idle' } } },
    });

    assert.equal(entry.sequence, 1);
    assert.match(entry.sessionId, /^browser-repro-/);
    assert.equal(entry.kind, 'button-click');
    assert.equal(entry.activeModal.id, 'round-begin');
    assert.equal(getActiveModalDescriptor(root).nextActionSelector, '[data-automation-id="round-begin"]');
    assert.equal(browser.posted.length, 1);
    assert.equal(browser.posted[0].source, 'browser-repro');
    assert.equal(browser.posted[0].action.type, 'browser-repro/round-begin');

    const exported = exportBrowserReproLog();
    assert.equal(exported.schema, 'adg-browser-repro-v1');
    assert.equal(exported.events.length, 1);
    assert.equal(exported.canonicalReplay.schema, 'adg-canonical-replay-v1');
    assert.equal(exported.canonicalReplay.summary.supportedCount, 1);
    assert.equal(exported.canonicalReplay.events[0].eventType, 'round-begin');
    assert.equal(getBrowserReproSummary().eventCount, 1);
  } finally {
    browser.cleanup();
  }
});

test('recordBrowserReproActionClick captures exact movement metrics for confirm-movement and charge-start wheel context', () => {
  const browser = installFakeBrowser();
  try {
    clearBrowserReproLog();

    const entry = recordBrowserReproActionClick({
      actionTarget: {
        dataset: {
          action: 'confirm-movement',
        },
      },
      state: {
        shell: { currentScreen: 'battlefield' },
        game: {
          selectedUnitId: 'charge-drill-p1-wheel-charger',
          advancePreviewUd: 1.25,
          slidePreviewUd: 0.5,
          slidePreviewSide: 'left',
          wheelPreviewAngleRadians: Math.PI / 6,
          wheelPivotSide: 'left',
          movement: {
            selectedCommandId: 'wheel',
            preview: {
              status: 'accepted',
              segments: [
                {
                  commandId: 'advance',
                  distance: { resolvedUd: 1.25 },
                },
                {
                  commandId: 'wheel',
                  distance: { resolvedUd: 0.5 },
                  maneuver: {
                    pivotSide: 'left',
                    angleRadians: Math.PI / 6,
                  },
                },
              ],
            },
          },
          chargePreview: {
            status: 'ready',
            intent: {
              unitId: 'charge-drill-p1-wheel-charger',
              startManoeuvre: {
                type: 'wheel',
                pivotSide: 'left',
                wheelAngleRadians: Math.PI / 6,
              },
            },
          },
        },
      },
    });

    assert.equal(entry.movement.selectedCommandId, 'wheel');
    assert.equal(entry.movement.previewStatus, 'accepted');
    assert.equal(entry.movement.previewSegmentCount, 2);
    assert.equal(entry.movement.totalDistanceUd, 1.75);
    assert.equal(entry.movement.wheelPreviewDistanceUd, 0.5);
    assert.equal(entry.movement.lastSegment.commandId, 'wheel');
    assert.equal(entry.movement.lastSegment.distanceUd, 0.5);
    assert.equal(entry.movement.lastSegment.angleRadians, Number((Math.PI / 6).toFixed(4)));
    assert.equal(entry.movement.lastSegment.side, null);
    assert.equal(entry.movement.chargeStart.type, 'wheel');
    assert.equal(entry.movement.chargeStart.distanceUd, 0.5);
    assert.equal(browser.posted[0].movement.totalDistanceUd, 1.75);
  } finally {
    browser.cleanup();
  }
});

test('recordBrowserReproActionClick preserves slide direction in movement summaries and reset clears persisted logs', () => {
  const browser = installFakeBrowser();
  try {
    clearBrowserReproLog();

    const slideEntry = recordBrowserReproActionClick({
      actionTarget: {
        dataset: {
          action: 'toggle-advance-mode',
          automationId: 'toggle-advance-mode',
        },
      },
      state: {
        shell: { currentScreen: 'battlefield' },
        game: {
          movement: {
            selectedCommandId: 'advance',
            preview: {
              status: 'accepted',
              segments: [
                {
                  commandId: 'slide',
                  distance: {
                    resolvedUd: 1,
                    measurementMode: 'slide-right-free-lateral',
                  },
                  maneuver: {},
                },
              ],
            },
          },
        },
      },
    });

    assert.equal(slideEntry.movement.lastSegment.commandId, 'slide');
    assert.equal(slideEntry.movement.lastSegment.side, 'right');

    const sessionStart = resetBrowserReproRecorderSession();
    assert.equal(sessionStart.kind, 'session-start');
    assert.equal(sessionStart.action, null);
    assert.equal(sessionStart.sequence, 1);
    assert.equal(browser.requests.at(-1).method, 'POST');

    clearPersistedBrowserReproLog();
    const deleteRequest = browser.requests.at(-1);
    assert.equal(deleteRequest.url, '/__adg-debug/repro');
    assert.equal(deleteRequest.method, 'DELETE');
    assert.equal(deleteRequest.hasBody, false);
  } finally {
    browser.cleanup();
  }
});

test('resetBrowserReproRecorderSession adds a session marker that canonical export ignores', () => {
  const browser = installFakeBrowser();
  try {
    const sessionStart = resetBrowserReproRecorderSession();
    assert.equal(sessionStart.kind, 'session-start');

    const entry = recordBrowserReproDataset({
      dataset: {
        action: 'round-begin',
        automationId: 'round-begin',
      },
      state: { shell: { currentScreen: 'battlefield' }, game: { chargePreview: { status: 'idle' } } },
    });

    assert.equal(entry.sequence, 2);
    assert.equal(entry.sessionId, sessionStart.sessionId);

    const exported = exportBrowserReproLog();
    assert.equal(exported.summary.eventCount, 2);
    assert.equal(exported.summary.sessionCount, 1);
    assert.equal(exported.canonicalReplay.summary.sourceEventCount, 1);
    assert.equal(exported.canonicalReplay.summary.supportedCount, 1);
  } finally {
    browser.cleanup();
  }
});

test('recordBrowserReproDataset records explicit drag checkpoints with current movement state', () => {
  const browser = installFakeBrowser();
  try {
    clearBrowserReproLog();

    const entry = recordBrowserReproDataset({
      dataset: {
        action: 'commit-wheel-drag-preview',
        automationId: 'wheel-preview-handle',
        unitId: 'charge-drill-p1-evade-blocker-charger',
        pivotSide: 'left',
      },
      state: {
        shell: { currentScreen: 'battlefield' },
        game: {
          selectedUnitId: 'charge-drill-p1-evade-blocker-charger',
          wheelPreviewAngleRadians: Math.PI / 6,
          wheelPivotSide: 'left',
          movement: {
            selectedCommandId: 'wheel',
            preview: {
              status: 'accepted',
              segments: [
                {
                  commandId: 'wheel',
                  distance: { resolvedUd: 0.5 },
                  maneuver: {
                    pivotSide: 'left',
                    angleRadians: Math.PI / 6,
                  },
                },
              ],
            },
          },
        },
      },
    });

    assert.equal(entry.kind, 'wheel-action');
    assert.equal(entry.action, 'commit-wheel-drag-preview');
    assert.equal(entry.dataset.pivotSide, 'left');
    assert.equal(entry.movement.lastSegment.commandId, 'wheel');
    assert.equal(entry.movement.lastSegment.angleRadians, Number((Math.PI / 6).toFixed(4)));
    assert.equal(browser.posted[0].action.type, 'browser-repro/commit-wheel-drag-preview');
  } finally {
    browser.cleanup();
  }
});
