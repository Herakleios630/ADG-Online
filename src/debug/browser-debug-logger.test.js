import assert from 'node:assert/strict';
import test from 'node:test';
import { CHARGE_BRANCH_TRACE_EVENTS, LOG_AREAS, LOG_LEVELS } from './debug-log-contract.js';
import { createBrowserDebugLogger } from './browser-debug-logger.js';

function createLocalStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

function createFakeAppRoot() {
  return {
    querySelectorAll() {
      return { length: 0 };
    },
  };
}

function createChargeState(overrides = {}) {
  return {
    shell: { currentScreen: 'battlefield' },
    game: {
      selectedUnitId: 'unit-1',
      commandContext: {
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        currentPhaseId: 'charge',
      },
      chargePreview: {
        status: 'declared',
        ...overrides,
      },
      units: [{ id: 'unit-1' }],
    },
  };
}

function installFakeBrowser({ search = '?debug=1&log=charge&level=debug', storage = {} } = {}) {
  const posted = [];
  const originalWindow = globalThis.window;
  const originalPerformance = globalThis.performance;
  const originalFetch = globalThis.fetch;

  globalThis.window = {
    location: {
      search,
      href: `http://localhost:5173/${search}`,
    },
    localStorage: createLocalStorage(storage),
    navigator: { userAgent: 'node-test' },
    innerWidth: 1200,
    innerHeight: 800,
    devicePixelRatio: 1,
    addEventListener() {},
  };
  globalThis.performance = {
    now: () => 100,
    memory: null,
  };
  globalThis.fetch = async (_endpoint, options) => {
    posted.push(JSON.parse(options.body));
    return { ok: true };
  };

  return {
    posted,
    cleanup() {
      globalThis.window = originalWindow;
      globalThis.performance = originalPerformance;
      globalThis.fetch = originalFetch;
    },
  };
}

test('browser logger filters records by URL area and level before writing memory or JSONL payloads', () => {
  const fakeBrowser = installFakeBrowser({ search: '?debug=1&log=charge&level=debug' });
  try {
    const logger = createBrowserDebugLogger({
      app: createFakeAppRoot(),
      getState: () => createChargeState(),
    });

    const chargeEntry = logger.record('action-start', {
      action: { type: 'game/declare-charge' },
    });
    const perfEntry = logger.record('long-task', {
      durationMs: 75,
    });
    const traceEntry = logger.record('action-complete', {
      level: LOG_LEVELS.TRACE,
      action: { type: 'game/declare-charge' },
    });

    assert.equal(chargeEntry.area, LOG_AREAS.CHARGE);
    assert.equal(chargeEntry.level, LOG_LEVELS.INFO);
    assert.equal(perfEntry, null);
    assert.equal(traceEntry, null);
    assert.equal(globalThis.window.__ADG_DEBUG_LOG__.length, 2);
    assert.equal(globalThis.window.__ADG_DEBUG_LOG__[1].kind, 'charge.trace-summary');
    assert.equal(fakeBrowser.posted.length, 2);
    assert.equal(fakeBrowser.posted[0].area, LOG_AREAS.CHARGE);
    assert.equal(fakeBrowser.posted[0].level, LOG_LEVELS.INFO);
  } finally {
    fakeBrowser.cleanup();
  }
});

test('browser logger global helpers update filters and preserve getLog compatibility', () => {
  const fakeBrowser = installFakeBrowser({ search: '?debug=1&log=charge&level=debug' });
  try {
    const logger = createBrowserDebugLogger({
      app: createFakeAppRoot(),
      getState: () => createChargeState({
        evadeMove: {
          status: 'choice-required',
          choiceRequired: true,
          avoidanceCandidates: [{ id: 'left' }],
        },
      }),
    });
    logger.installGlobalHooks();

    assert.deepEqual(globalThis.window.__ADG_DEBUG__.getFilters(), {
      level: LOG_LEVELS.DEBUG,
      areas: [LOG_AREAS.CHARGE],
    });

    globalThis.window.__ADG_DEBUG__.setFilters({ areas: [LOG_AREAS.EVADE], level: LOG_LEVELS.TRACE });
    const entry = globalThis.window.__ADG_DEBUG__.record('action-complete', {
      level: LOG_LEVELS.TRACE,
      action: { type: 'game/resolve-evade-choice' },
    });

    assert.equal(entry.area, LOG_AREAS.EVADE);
    assert.equal(entry.level, LOG_LEVELS.TRACE);
    assert.deepEqual(globalThis.window.__ADG_DEBUG__.getFilters(), {
      level: LOG_LEVELS.TRACE,
      areas: [LOG_AREAS.EVADE],
    });
    assert.equal(globalThis.window.localStorage.getItem('adg-debug-level'), LOG_LEVELS.TRACE);
    assert.equal(globalThis.window.localStorage.getItem('adg-debug-areas'), LOG_AREAS.EVADE);
    assert.equal(globalThis.window.__ADG_DEBUG__.getLog().includes(entry), true);
    assert.equal(globalThis.window.__ADG_DEBUG__.getLog().at(-1).kind, 'evade.trace-summary');
    assert.equal(typeof globalThis.window.__ADG_DEBUG__.repro.export, 'function');
    assert.equal(globalThis.window.__ADG_DEBUG__.repro.getSummary().eventCount, 0);
  } finally {
    fakeBrowser.cleanup();
  }
});

test('browser logger emits matching rule trace summaries even when the parent action area is filtered', () => {
  const fakeBrowser = installFakeBrowser({ search: '?debug=1&log=contact&level=debug' });
  try {
    const logger = createBrowserDebugLogger({
      app: createFakeAppRoot(),
      getState: () => createChargeState({
        status: 'ready',
        contactEvents: [{ defenderId: 'target-1', type: 'target-contact', guideDistanceUd: 4 }],
        contactDecisionTrace: [{ stage: 'return-terminal', clippedGuideDistanceUd: 4 }],
      }),
    });

    const entry = logger.record('action-complete', {
      action: { type: 'game/resolve-charge-branch-distance' },
    });
    const log = globalThis.window.__ADG_DEBUG_LOG__;

    assert.equal(entry, null);
    assert.equal(log.length, 1);
    assert.equal(log[0].kind, 'contact.trace-summary');
    assert.equal(log[0].area, LOG_AREAS.CONTACT);
    assert.equal(log[0].details.ruleEvent.decision.clippedGuideDistanceUd, 4);
  } finally {
    fakeBrowser.cleanup();
  }
});

test('browser logger bounds memory rings and exposes summary and clear helpers', () => {
  const fakeBrowser = installFakeBrowser({ search: '?debug=1&log=ui&level=debug' });
  try {
    const logger = createBrowserDebugLogger({
      app: createFakeAppRoot(),
      getState: () => createChargeState({ status: 'idle' }),
    });
    logger.installGlobalHooks();

    for (let index = 0; index < 175; index += 1) {
      logger.record('ui-smoke', {
        area: LOG_AREAS.UI,
        level: LOG_LEVELS.DEBUG,
        index,
        payload: 'x'.repeat(5000),
      });
    }

    const summary = globalThis.window.__ADG_DEBUG__.getLogSummary();
    assert.equal(summary.entryCount, 150);
    assert.equal(summary.maxEntries, 150);
    assert.equal(summary.approxBytes <= summary.maxBytes, true);
    assert.equal(summary.byArea.ui, 150);

    globalThis.window.__ADG_DEBUG__.clearLog();
    assert.equal(globalThis.window.__ADG_DEBUG__.getLog().length, 0);
    assert.equal(globalThis.window.__ADG_PERF_LOG__.length, 0);
  } finally {
    fakeBrowser.cleanup();
  }
});

test('browser logger emits movement trace summaries for charge-start wheel previews', () => {
  const fakeBrowser = installFakeBrowser({ search: '?debug=1&log=movement&level=debug' });
  try {
    const logger = createBrowserDebugLogger({
      app: createFakeAppRoot(),
      getState: () => createChargeState({
        status: 'manoeuvre-selecting',
        intent: {
          unitId: 'unit-9',
          targetUnitId: 'unit-19',
          startManoeuvre: {
            type: 'wheel',
            pivotSide: 'right',
            wheelAngleRadians: Math.PI / 6,
            spentBudgetUd: 0.5,
          },
        },
      }),
    });

    const entry = logger.record('action-reduced', {
      action: { type: 'game/preview-charge-start-manoeuvre', manoeuvreType: 'wheel', pivotSide: 'right', angleRadians: Math.PI / 6 },
    });
    const log = globalThis.window.__ADG_DEBUG_LOG__;

    assert.equal(entry, null);
    assert.equal(log.length, 1);
    assert.equal(log[0].kind, 'movement.trace-summary');
    assert.equal(log[0].area, LOG_AREAS.MOVEMENT);
    assert.equal(log[0].details.ruleEvent.decision.chargeStartManoeuvre.pivotSide, 'right');
    assert.equal(log[0].details.ruleEvent.decision.chargeStartManoeuvre.wheelAngleRadians, Math.PI / 6);
  } finally {
    fakeBrowser.cleanup();
  }
});

test('browser logger emits bounded timestamped charge-branch trace events for JSONL persistence', () => {
  const fakeBrowser = installFakeBrowser({ search: '?debug=1&log=charge,ui,perf&level=debug' });
  const originalNow = globalThis.performance.now;
  let nowMs = 120;
  globalThis.performance.now = () => {
    nowMs += 7;
    return nowMs;
  };

  let state = createChargeState({
    status: 'evade-required',
    intent: {
      unitId: 'charge-drill-p1-evade-blocker-charger',
      targetUnitId: 'charge-drill-p2-flank-target',
    },
    branchDistanceRoll: {
      claim: { reason: 'evade-distance' },
      result: null,
    },
  });
  state.game.setupViewMode = 'canonical';
  state.game.units = [
    {
      id: 'charge-drill-p1-evade-blocker-charger',
      owner: 'player-1',
      corpsId: 'corps-1',
      scenarioLabel: 'P1 Evade Blocker Charger',
      scenarioRole: 'charger',
      scenarioLaneId: 'flank-lane',
    },
    {
      id: 'charge-drill-p2-flank-target',
      owner: 'player-2',
      corpsId: 'corps-1',
      scenarioLabel: 'P2 Flank Target',
      scenarioRole: 'target',
      scenarioLaneId: 'flank-lane',
    },
  ];

  try {
    const logger = createBrowserDebugLogger({
      app: createFakeAppRoot(),
      getState: () => state,
    });
    const action = { type: 'game/resolve-charge-branch-distance', dieRoll: 6 };
    const context = logger.startChargeBranchTrace(action, state);

    logger.recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.REDUCER_START, { stage: 'reducer-start' });
    state = {
      ...state,
      game: {
        ...state.game,
        setupViewMode: 'hotseat-handoff',
        chargePreview: {
          ...state.game.chargePreview,
          branchDistanceRoll: {
            claim: { reason: 'evade-distance' },
            result: { reason: 'evade-distance', rawRoll: 6 },
          },
          evadeChoiceHandoff: { status: 'pending' },
          evadeMove: {
            status: 'choice-required',
            choiceRequired: true,
            avoidanceCandidates: [{ id: 'left' }, { id: 'path' }],
            pathSegments: [{ kind: 'evade-straight' }],
            decisionTrace: [{ stage: 'choice-required' }],
          },
        },
      },
    };
    logger.recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.REDUCED, { stage: 'reducer-end', durationMs: 3.5 });
    logger.recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.RENDER_START, { stage: 'render-start' });
    logger.recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.RENDERED, { stage: 'render-end', durationMs: 8.25 });
    logger.recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_MOUNTED, {
      stage: 'handoff-overlay-mounted-check',
      overlay: { mounted: true, visible: true },
    });
    logger.recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.NEXT_FRAME, { stage: 'first-animation-frame-after-render' });
    logger.recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_VISIBLE, {
      stage: 'handoff-overlay-visible-check',
      overlay: { mounted: true, visible: true, rect: { width: 1200, height: 800 } },
    });

    const traceEntries = globalThis.window.__ADG_DEBUG_LOG__.filter((entry) => entry.details?.traceId === context.traceId);
    assert.deepEqual(traceEntries.map((entry) => entry.kind), [
      CHARGE_BRANCH_TRACE_EVENTS.CLICK,
      CHARGE_BRANCH_TRACE_EVENTS.REDUCER_START,
      CHARGE_BRANCH_TRACE_EVENTS.REDUCED,
      CHARGE_BRANCH_TRACE_EVENTS.RENDER_START,
      CHARGE_BRANCH_TRACE_EVENTS.RENDERED,
      CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_MOUNTED,
      CHARGE_BRANCH_TRACE_EVENTS.NEXT_FRAME,
      CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_VISIBLE,
    ]);
    assert.equal(new Set(traceEntries.map((entry) => entry.details.traceId)).size, 1);
    assert.equal(traceEntries.every((entry) => typeof entry.timestampIso === 'string'), true);
    assert.equal(traceEntries.every((entry) => Number.isFinite(entry.nowMs)), true);
    assert.equal(traceEntries.every((entry) => typeof entry.details.timestampIso === 'string'), true);
    assert.equal(traceEntries.every((entry) => Number.isFinite(entry.details.nowMs)), true);
    assert.equal(traceEntries.at(-1).details.stateContext.setupViewMode, 'hotseat-handoff');
    assert.equal(traceEntries.at(-1).details.stateContext.evadeCandidateCount, 2);
    assert.equal(traceEntries.at(-1).details.stateContext.chargeTargetUnit.scenarioLaneId, 'flank-lane');
    assert.equal(traceEntries.at(-1).details.viewport.width, 1200);
    assert.equal(traceEntries.at(-1).details.viewport.devicePixelRatio, 1);
    assert.equal(fakeBrowser.posted.filter((entry) => entry.details?.traceId === context.traceId).length, traceEntries.length);
  } finally {
    globalThis.performance.now = originalNow;
    fakeBrowser.cleanup();
  }
});