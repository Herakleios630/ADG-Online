import {
  CHARGE_BRANCH_TRACE_EVENTS,
  DEBUG_LOG_ENDPOINT,
  DEFAULT_LOG_FILTERS,
  LOG_AREAS,
  LOG_LEVELS,
  MAX_BROWSER_DEBUG_LOG_BYTES,
  MAX_DEBUG_LOG_ENTRY_BYTES,
  MAX_LOG_ARRAY_ITEMS,
  MAX_LOG_STRING_LENGTH,
  normalizeLogArea,
  normalizeLogLevel,
  parseLogAreas,
  parseLogFilters,
  shouldLog,
  summarizeLogValue,
} from './debug-log-contract.js';
import {
  clearBrowserReproLog,
  disableBrowserReproRecorder,
  enableBrowserReproRecorder,
  exportBrowserReproLog,
  getBrowserReproLog,
  getBrowserReproSummary,
  isReproRecorderEnabled,
  resetBrowserReproRecorderSession,
} from './browser-repro-recorder.js';
import { replayCanonical } from './canonical-replay-executor.js';
import { buildRuleLogEventsFromDebugState } from './rule-logging.js';

const MAX_MEMORY_LOG_ENTRIES = 150;
const MAX_PERF_LOG_ENTRIES = 100;
const LONG_TASK_THRESHOLD_MS = 50;
const LONG_TASK_LOG_INTERVAL_MS = 1000;
const CHARGE_BRANCH_TRACE_EVENT_SET = new Set(Object.values(CHARGE_BRANCH_TRACE_EVENTS));

function safeNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function roundMs(value) {
  return Number(Number(value ?? 0).toFixed(2));
}

function getApproxJsonByteLength(value) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return MAX_DEBUG_LOG_ENTRY_BYTES;
  }
}

function shrinkDebugEntry(entry) {
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
    level: summarizedEntry.level ?? LOG_LEVELS.WARN,
    area: summarizedEntry.area ?? LOG_AREAS.UI,
    source: summarizedEntry.source ?? 'browser',
    kind: summarizedEntry.kind ?? 'event',
    sessionId: summarizedEntry.sessionId ?? null,
    sequence: summarizedEntry.sequence ?? null,
    action: summarizedEntry.action ?? null,
    page: summarizedEntry.page ?? null,
    details: {
      truncated: true,
      reason: 'debug-log-entry-size-limit',
      originalApproxBytes: getApproxJsonByteLength(summarizedEntry),
      maxBytes: MAX_DEBUG_LOG_ENTRY_BYTES,
    },
  };
}

function getViewportSnapshot() {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio ?? 1,
  };
}

function getDebugFlag() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1'
      || params.get('perf') === '1'
      || window.localStorage?.getItem('adg-debug-log') === '1'
      || window.localStorage?.getItem('adg-perf-log') === '1';
  } catch {
    return false;
  }
}

function getConsoleDebugFlag() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debugConsole') === '1'
      || window.localStorage?.getItem('adg-debug-console') === '1';
  } catch {
    return false;
  }
}

function readLogFiltersFromBrowser() {
  if (typeof window === 'undefined') {
    return DEFAULT_LOG_FILTERS;
  }

  try {
    return parseLogFilters({
      searchParams: window.location?.search ?? '',
      storage: window.localStorage,
    });
  } catch {
    return DEFAULT_LOG_FILTERS;
  }
}

function persistLogFilters(filters) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage?.setItem('adg-debug-level', filters.level);
    window.localStorage?.setItem('adg-debug-areas', filters.areas.join(','));
  } catch {
    // Local storage is only a convenience for repeated browser checks.
  }
}

function summarizeAction(action) {
  if (!action || typeof action !== 'object') {
    return { type: 'unknown' };
  }

  return {
    type: action.type ?? 'unknown',
    unitId: action.unitId ?? null,
    targetUnitId: action.targetUnitId ?? null,
    decisionType: action.decisionType ?? null,
    dieRoll: Number.isFinite(action.dieRoll) ? action.dieRoll : null,
    manoeuvreType: action.manoeuvreType ?? null,
    option: action.option ?? null,
    candidateId: action.candidateId ?? null,
    stepId: action.stepId ?? null,
  };
}

export function summarizeStateForDebug(state) {
  const chargePreview = state?.game?.chargePreview ?? null;
  const evadeMove = chargePreview?.evadeMove ?? null;
  const branchDistanceRoll = chargePreview?.branchDistanceRoll ?? null;
  const movementPreview = state?.game?.movement?.preview ?? null;
  const lastMovementPreviewSegment = Array.isArray(movementPreview?.segments) && movementPreview.segments.length > 0
    ? movementPreview.segments[movementPreview.segments.length - 1]
    : null;
  const contactDecisionTrace = Array.isArray(chargePreview?.chargeMovementPlan?.contactState?.decisionTrace)
    ? chargePreview.chargeMovementPlan.contactState.decisionTrace
    : Array.isArray(chargePreview?.contactDecisionTrace)
      ? chargePreview.contactDecisionTrace
      : [];
  const evadeDecisionTrace = Array.isArray(evadeMove?.decisionTrace) && evadeMove.decisionTrace.length > 0
    ? evadeMove.decisionTrace
    : Array.isArray(chargePreview?.evadePlan?.decisionTrace)
      ? chargePreview.evadePlan.decisionTrace
      : [];

  return {
    screen: state?.shell?.currentScreen ?? 'unknown',
    selectedUnitId: state?.game?.selectedUnitId ?? null,
    activePlayerId: state?.game?.commandContext?.activePlayerId ?? null,
    activeCorpsId: state?.game?.commandContext?.activeCorpsId ?? null,
    battlePhase: state?.game?.commandContext?.currentPhaseId ?? null,
    chargeStatus: chargePreview?.status ?? 'none',
    chargeIntentUnitId: chargePreview?.intent?.unitId ?? null,
    chargeTargetId: chargePreview?.intent?.targetUnitId ?? null,
    reactionDecision: chargePreview?.reactionDecision?.decisionType ?? null,
    branchRollReason: branchDistanceRoll?.claim?.reason ?? branchDistanceRoll?.result?.reason ?? null,
    branchRollValue: branchDistanceRoll?.result?.rawRoll ?? null,
    evadePlanStatus: chargePreview?.evadePlan?.sourceStatus ?? null,
    evadeMoveStatus: evadeMove?.status ?? 'none',
    evadeMoveSourceStatus: evadeMove?.sourceStatus ?? null,
    evadeChoiceRequired: Boolean(evadeMove?.choiceRequired),
    evadeCandidateCount: Array.isArray(evadeMove?.avoidanceCandidates) ? evadeMove.avoidanceCandidates.length : 0,
    evadeChoicePathStepIds: Array.isArray(evadeMove?.choicePathStepIds) ? evadeMove.choicePathStepIds : [],
    evadeDecisionTrace,
    contactEvents: Array.isArray(chargePreview?.contactEvents)
      ? chargePreview.contactEvents.map((event) => ({
        type: event?.type ?? null,
        defenderId: event?.defenderId ?? null,
        selectedTargetId: event?.selectedTargetId ?? null,
        classificationType: event?.classification?.type ?? null,
        guideDistanceUd: Number.isFinite(event?.guideDistanceUd) ? event.guideDistanceUd : null,
      }))
      : [],
    contactDecisionTrace,
    reactionRequests: Array.isArray(chargePreview?.reactionRequests)
      ? chargePreview.reactionRequests.map((request) => ({
        unitId: request?.unitId ?? null,
        type: request?.type ?? null,
        status: request?.status ?? null,
        contactEventIndex: Number.isInteger(request?.contactEventIndex) ? request.contactEventIndex : null,
        decisionTrace: Array.isArray(request?.decisionTrace) ? request.decisionTrace : [],
      }))
      : [],
    followThroughStatus: chargePreview?.followThroughResolution?.status ?? 'none',
    movement: {
      selectedCommandId: state?.game?.movement?.selectedCommandId ?? null,
      wheelModeActive: Boolean(state?.game?.wheelModeActive),
      wheelPivotSide: state?.game?.wheelPivotSide ?? null,
      wheelPreviewAngleRadians: Number.isFinite(state?.game?.wheelPreviewAngleRadians)
        ? state.game.wheelPreviewAngleRadians
        : null,
      previewStatus: movementPreview?.status ?? 'idle',
      previewSegmentCount: Array.isArray(movementPreview?.segments) ? movementPreview.segments.length : 0,
      lastPreviewSegment: lastMovementPreviewSegment
        ? {
          commandId: lastMovementPreviewSegment.commandId ?? null,
          kind: lastMovementPreviewSegment.kind ?? null,
          pivotSide: lastMovementPreviewSegment.maneuver?.pivotSide ?? lastMovementPreviewSegment.pivotSide ?? null,
          angleRadians: Number.isFinite(lastMovementPreviewSegment.maneuver?.angleRadians)
            ? lastMovementPreviewSegment.maneuver.angleRadians
            : Number.isFinite(lastMovementPreviewSegment.angleRadians)
              ? lastMovementPreviewSegment.angleRadians
              : null,
          distanceUd: Number.isFinite(lastMovementPreviewSegment.distance?.resolvedUd)
            ? lastMovementPreviewSegment.distance.resolvedUd
            : Number.isFinite(lastMovementPreviewSegment.distanceUd)
              ? lastMovementPreviewSegment.distanceUd
              : null,
          startPose: lastMovementPreviewSegment.startPose ?? null,
          endPose: lastMovementPreviewSegment.endPose ?? null,
        }
        : null,
      confirmationStatus: state?.game?.movement?.confirmation?.status ?? null,
      validationStatus: state?.game?.movement?.validationSnapshot?.status ?? null,
    },
    unitCount: Array.isArray(state?.game?.units) ? state.game.units.length : 0,
    chargeStartManoeuvre: chargePreview?.intent?.startManoeuvre
      ? {
        type: chargePreview.intent.startManoeuvre?.type ?? null,
        pivotSide: chargePreview.intent.startManoeuvre?.pivotSide ?? null,
        wheelAngleRadians: Number.isFinite(chargePreview.intent.startManoeuvre?.wheelAngleRadians)
          ? chargePreview.intent.startManoeuvre.wheelAngleRadians
          : null,
        slideSide: chargePreview.intent.startManoeuvre?.slideSide ?? null,
        slideDistanceUd: Number.isFinite(chargePreview.intent.startManoeuvre?.slideDistanceUd)
          ? chargePreview.intent.startManoeuvre.slideDistanceUd
          : null,
        spentBudgetUd: Number.isFinite(chargePreview.intent.startManoeuvre?.spentBudgetUd)
          ? chargePreview.intent.startManoeuvre.spentBudgetUd
          : null,
      }
      : null,
  };
}

export function getOverlayCountsForDebug(root) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return null;
  }

  return {
    evadePreview: root.querySelectorAll('[data-evade-preview-corridor], [data-evade-preview-ghost], [data-evade-preview-reorientation]').length,
    evadeChoices: root.querySelectorAll('[data-evade-candidate-ghost], [data-evade-candidate-trail], [data-evade-candidate-handle]').length,
    followThrough: root.querySelectorAll('[data-charge-follow-through-corridor], [data-charge-follow-through-ghost], [data-charge-follow-through-minimum-corridor], [data-charge-follow-through-minimum-ghost], [data-charge-follow-through-minimum-badge]').length,
    zocBands: root.querySelectorAll('.battlefield-zoc-band').length,
    dialogs: root.querySelectorAll('[data-charge-branch-distance-dialog-overlay], [data-charge-reaction-dialog-overlay], [data-evade-choice-handoff-dialog-overlay], [data-round-dialog-overlay]').length,
    buttons: root.querySelectorAll('button').length,
  };
}

function getTraceUnitContext(state, unitId) {
  if (!unitId || !Array.isArray(state?.game?.units)) {
    return null;
  }

  const unit = state.game.units.find((candidate) => candidate.id === unitId) ?? null;
  if (!unit) {
    return { unitId };
  }

  return {
    unitId: unit.id,
    owner: unit.owner ?? null,
    corpsId: unit.corpsId ?? null,
    scenarioLabel: unit.scenarioLabel ?? null,
    scenarioRole: unit.scenarioRole ?? null,
    scenarioLaneId: unit.scenarioLaneId ?? null,
    scenarioExampleId: unit.scenarioExampleId ?? null,
  };
}

function summarizeChargeBranchTraceState(state) {
  const chargePreview = state?.game?.chargePreview ?? null;
  const branchDistanceRoll = chargePreview?.branchDistanceRoll ?? null;
  const evadeMove = chargePreview?.evadeMove ?? null;
  const intent = chargePreview?.intent ?? null;
  const selectedUnitId = state?.game?.selectedUnitId ?? null;
  const chargeIntentUnitId = intent?.unitId ?? null;
  const chargeTargetId = intent?.targetUnitId ?? null;

  return {
    screen: state?.shell?.currentScreen ?? 'unknown',
    setupViewMode: state?.game?.setupViewMode ?? null,
    selectedUnitId,
    selectedUnit: getTraceUnitContext(state, selectedUnitId),
    activePlayerId: state?.game?.commandContext?.activePlayerId ?? null,
    activeCorpsId: state?.game?.commandContext?.activeCorpsId ?? null,
    battlePhase: state?.game?.commandContext?.currentPhaseId ?? null,
    chargeStatus: chargePreview?.status ?? 'none',
    chargeIntentUnitId,
    chargeIntentUnit: getTraceUnitContext(state, chargeIntentUnitId),
    chargeTargetId,
    chargeTargetUnit: getTraceUnitContext(state, chargeTargetId),
    branchRollReason: branchDistanceRoll?.claim?.reason ?? branchDistanceRoll?.result?.reason ?? null,
    branchRollValue: branchDistanceRoll?.result?.rawRoll ?? null,
    evadeChoiceHandoffStatus: chargePreview?.evadeChoiceHandoff?.status ?? null,
    evadeMoveStatus: evadeMove?.status ?? 'none',
    evadeChoiceRequired: Boolean(evadeMove?.choiceRequired),
    evadeCandidateCount: Array.isArray(evadeMove?.avoidanceCandidates) ? evadeMove.avoidanceCandidates.length : 0,
    evadeChoicePathStepCount: Array.isArray(evadeMove?.choicePathStepIds) ? evadeMove.choicePathStepIds.length : 0,
    evadeDecisionTraceCount: Array.isArray(evadeMove?.decisionTrace) ? evadeMove.decisionTrace.length : 0,
    evadePathSegmentCount: Array.isArray(evadeMove?.pathSegments) ? evadeMove.pathSegments.length : 0,
  };
}

function getChargeBranchTraceArea(kind) {
  switch (kind) {
    case CHARGE_BRANCH_TRACE_EVENTS.CLICK:
    case CHARGE_BRANCH_TRACE_EVENTS.RENDER_START:
    case CHARGE_BRANCH_TRACE_EVENTS.RENDERED:
    case CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_MOUNTED:
      return LOG_AREAS.UI;
    case CHARGE_BRANCH_TRACE_EVENTS.NEXT_FRAME:
    case CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_VISIBLE:
      return LOG_AREAS.PERF;
    case CHARGE_BRANCH_TRACE_EVENTS.REDUCER_START:
    case CHARGE_BRANCH_TRACE_EVENTS.REDUCED:
    default:
      return LOG_AREAS.CHARGE;
  }
}

function isChargeBranchTraceEvent(kind) {
  return CHARGE_BRANCH_TRACE_EVENT_SET.has(kind);
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    name: 'NonError',
    message: String(error),
    stack: null,
  };
}

function createSessionId() {
  const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `adg-debug-${Date.now()}-${randomPart}`;
}

function createConsoleEntrySummary(entry) {
  return {
    kind: entry?.kind ?? null,
    sequence: entry?.sequence ?? null,
    action: entry?.action ?? null,
    state: entry?.state ?? null,
    overlays: entry?.overlays ?? null,
    performance: entry?.performance ?? null,
    details: {
      reduceMs: entry?.details?.reduceMs ?? null,
      renderMs: entry?.details?.renderMs ?? null,
      totalMs: entry?.details?.totalMs ?? null,
      durationMs: entry?.details?.durationMs ?? null,
      error: entry?.details?.error ?? null,
    },
  };
}

function createMemoryLogSummary(logEntries) {
  const entries = Array.isArray(logEntries) ? logEntries : [];
  const approxBytes = entries.reduce((total, entry) => total + getApproxJsonByteLength(entry), 0);
  const byArea = entries.reduce((counts, entry) => ({
    ...counts,
    [entry.area ?? 'unknown']: (counts[entry.area ?? 'unknown'] ?? 0) + 1,
  }), {});
  const byLevel = entries.reduce((counts, entry) => ({
    ...counts,
    [entry.level ?? 'unknown']: (counts[entry.level ?? 'unknown'] ?? 0) + 1,
  }), {});

  return {
    entryCount: entries.length,
    approxBytes,
    maxEntries: MAX_MEMORY_LOG_ENTRIES,
    maxBytes: MAX_BROWSER_DEBUG_LOG_BYTES,
    firstTimestamp: entries[0]?.timestamp ?? null,
    lastTimestamp: entries.at(-1)?.timestamp ?? null,
    byArea,
    byLevel,
  };
}

function inferDebugArea(kind, details = {}, stateSummary = null) {
  const explicitArea = normalizeLogArea(details.area);
  if (explicitArea) {
    return explicitArea;
  }

  if (kind === 'long-task') {
    return LOG_AREAS.PERF;
  }

  if (kind === 'error') {
    return LOG_AREAS.UI;
  }

  const actionType = typeof details?.action?.type === 'string' ? details.action.type : '';
  const decisionType = typeof details?.action?.decisionType === 'string' ? details.action.decisionType : '';
  const combined = `${actionType} ${decisionType}`.toLowerCase();
  const hasEvadeState = stateSummary?.evadeMoveStatus !== 'none'
    || stateSummary?.evadeChoiceRequired === true
    || Number(stateSummary?.evadeCandidateCount ?? 0) > 0
    || Array.isArray(stateSummary?.evadeDecisionTrace) && stateSummary.evadeDecisionTrace.length > 0;

  if (combined.includes('evade') || hasEvadeState) {
    return LOG_AREAS.EVADE;
  }

  if (combined.includes('reaction') || stateSummary?.reactionDecision) {
    return LOG_AREAS.REACTION;
  }

  const chargeStatus = stateSummary?.chargeStatus ?? 'none';
  if (combined.includes('charge') || (chargeStatus !== 'none' && chargeStatus !== 'idle')) {
    return LOG_AREAS.CHARGE;
  }

  if (combined.includes('move') || combined.includes('movement')) {
    return LOG_AREAS.MOVEMENT;
  }

  return kind?.startsWith('action-') ? LOG_AREAS.ACTION : LOG_AREAS.UI;
}

function inferDebugLevel(kind, details = {}) {
  const explicitLevel = normalizeLogLevel(details.level);
  if (explicitLevel) {
    return explicitLevel;
  }

  return kind === 'error' ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
}

export function createBrowserDebugLogger({ app, getState, dispatchAction = null, endpoint = DEBUG_LOG_ENDPOINT } = {}) {
  const sessionId = createSessionId();
  let sequence = 0;
  let chargeBranchTraceSequence = 0;
  let installed = false;
  let lastLongTaskLogMs = 0;
  let filters = readLogFiltersFromBrowser();

  function isEnabled() {
    return getDebugFlag();
  }

  function getFilters() {
    return {
      level: filters.level,
      areas: [...filters.areas],
    };
  }

  function setFilters(nextFilters = {}) {
    filters = parseLogFilters({
      defaults: {
        level: normalizeLogLevel(nextFilters.level, filters.level),
        areas: nextFilters.areas ? parseLogAreas(nextFilters.areas, filters.areas) : filters.areas,
      },
    });
    persistLogFilters(filters);
    return getFilters();
  }

  function enableArea(area) {
    const normalizedArea = normalizeLogArea(area);
    if (!normalizedArea) {
      return getFilters();
    }

    const areas = filters.areas.includes(LOG_AREAS.ALL)
      ? [normalizedArea]
      : Array.from(new Set([...filters.areas, normalizedArea]));
    return setFilters({ areas });
  }

  function disableArea(area) {
    const normalizedArea = normalizeLogArea(area);
    if (!normalizedArea) {
      return getFilters();
    }

    const areas = filters.areas.filter((filterArea) => filterArea !== normalizedArea);
    return setFilters({ areas: areas.length > 0 ? areas : [LOG_AREAS.ALL] });
  }

  function setLevel(level) {
    const normalizedLevel = normalizeLogLevel(level);
    if (!normalizedLevel) {
      return getFilters();
    }

    return setFilters({ level: normalizedLevel });
  }

  function writeToMemory(entry) {
    if (typeof window === 'undefined') {
      return;
    }

    const debugLog = Array.isArray(window.__ADG_DEBUG_LOG__) ? window.__ADG_DEBUG_LOG__ : [];
    debugLog.push(entry);
    while (debugLog.length > MAX_MEMORY_LOG_ENTRIES || createMemoryLogSummary(debugLog).approxBytes > MAX_BROWSER_DEBUG_LOG_BYTES) {
      debugLog.shift();
    }
    window.__ADG_DEBUG_LOG__ = debugLog;

    const perfLog = Array.isArray(window.__ADG_PERF_LOG__) ? window.__ADG_PERF_LOG__ : [];
    if (entry.kind?.startsWith('action-') || entry.kind === 'long-task' || isChargeBranchTraceEvent(entry.kind)) {
      perfLog.push(entry);
      if (perfLog.length > MAX_PERF_LOG_ENTRIES) {
        perfLog.shift();
      }
      window.__ADG_PERF_LOG__ = perfLog;
    }
  }

  function postToServer(entry, options = {}) {
    if (typeof window === 'undefined') {
      return;
    }

    const body = JSON.stringify(entry);

    if (options.sync && typeof XMLHttpRequest !== 'undefined') {
      try {
        const request = new XMLHttpRequest();
        request.open('POST', endpoint, false);
        request.setRequestHeader('content-type', 'application/json');
        request.send(body);
        return;
      } catch {
        // Fall through to async transports.
      }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon(endpoint, blob)) {
          return;
        }
      } catch {
        // Fall through to fetch.
      }
    }

    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Debug logging must never break gameplay.
    }
  }

  function record(kind, details = {}, options = {}) {
    if (!isEnabled()) {
      return null;
    }

    const state = typeof getState === 'function' ? getState() : null;
    const stateSummary = summarizeStateForDebug(state);
    const level = normalizeLogLevel(options.level ?? details.level, inferDebugLevel(kind, details));
    const area = normalizeLogArea(options.area ?? details.area, inferDebugArea(kind, details, stateSummary));
    const ruleEvents = options.ruleEvents !== false
      ? buildRuleLogEventsFromDebugState({
        kind,
        action: details?.action ?? null,
        stateSummary,
        metadata: { sessionId },
      })
      : [];
    const parentShouldLog = shouldLog({ level, area, filters });
    if (!parentShouldLog && ruleEvents.length === 0) {
      return null;
    }

    let entry = parentShouldLog ? {
      timestamp: new Date().toISOString(),
      level,
      area,
      source: 'browser',
      kind,
      sessionId,
      sequence: ++sequence,
      action: details?.action ?? null,
      page: typeof window !== 'undefined'
        ? {
            href: window.location.href,
            userAgent: window.navigator?.userAgent ?? null,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
              devicePixelRatio: window.devicePixelRatio ?? 1,
            },
          }
        : null,
      state: stateSummary,
      overlays: getOverlayCountsForDebug(app),
      performance: {
        nowMs: roundMs(safeNow()),
        memory: typeof performance !== 'undefined' && performance.memory
          ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            }
          : null,
      },
      details,
    } : null;

    if (entry) {
      entry = shrinkDebugEntry(entry);
      writeToMemory(entry);
      if (options.console === true || (options.console !== false && getConsoleDebugFlag())) {
        console.debug('[ADG DEBUG]', createConsoleEntrySummary(entry));
      }
      postToServer(entry, { sync: Boolean(options.sync) });
    }
    ruleEvents.forEach((ruleEvent) => {
      record(ruleEvent.eventType, {
        level: ruleEvent.level,
        area: ruleEvent.area,
        ruleEvent,
        action: details?.action ?? null,
      }, {
        ruleEvents: false,
      });
    });
    return entry;
  }

  function recordLightweight(kind, details = {}, options = {}) {
    if (!isEnabled()) {
      return null;
    }

    const timestampIso = new Date().toISOString();
    const nowMs = roundMs(safeNow());
    const level = normalizeLogLevel(options.level ?? details.level, LOG_LEVELS.DEBUG);
    const area = normalizeLogArea(options.area ?? details.area, LOG_AREAS.UI);
    if (!shouldLog({ level, area, filters })) {
      return null;
    }

    let entry = {
      timestamp: timestampIso,
      timestampIso,
      nowMs,
      level,
      area,
      source: 'browser',
      kind,
      sessionId,
      sequence: ++sequence,
      action: details?.action ?? null,
      page: typeof window !== 'undefined'
        ? {
            href: window.location.href,
            userAgent: window.navigator?.userAgent ?? null,
            viewport: getViewportSnapshot(),
          }
        : null,
      state: null,
      overlays: null,
      performance: {
        nowMs,
        memory: typeof performance !== 'undefined' && performance.memory
          ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            }
          : null,
      },
      details: {
        ...details,
        timestampIso,
        nowMs,
        viewport: getViewportSnapshot(),
      },
    };

    entry = shrinkDebugEntry(entry);
    writeToMemory(entry);
    if (options.console === true || (options.console !== false && getConsoleDebugFlag())) {
      console.debug('[ADG DEBUG]', createConsoleEntrySummary(entry));
    }
    postToServer(entry, { sync: Boolean(options.sync) });
    return entry;
  }

  function startChargeBranchTrace(action, stateBefore) {
    if (!isEnabled()) {
      return null;
    }

    chargeBranchTraceSequence += 1;
    const context = {
      traceId: `${sessionId}:charge-branch-${chargeBranchTraceSequence}`,
      action: summarizeAction(action),
      startMs: safeNow(),
      startedAtIso: new Date().toISOString(),
    };

    recordChargeBranchTrace(context, CHARGE_BRANCH_TRACE_EVENTS.CLICK, {
      stage: 'click-received',
      stateContext: summarizeChargeBranchTraceState(stateBefore),
    }, { area: LOG_AREAS.UI });

    return context;
  }

  function recordChargeBranchTrace(context, kind, details = {}, options = {}) {
    if (!context || !isChargeBranchTraceEvent(kind)) {
      return null;
    }

    const timestampMs = safeNow();
    const state = typeof getState === 'function' ? getState() : null;
    return recordLightweight(kind, {
      traceId: context.traceId,
      traceStartedAtIso: context.startedAtIso,
      traceStartMs: roundMs(context.startMs),
      elapsedMs: roundMs(timestampMs - context.startMs),
      action: context.action,
      stateContext: details.stateContext ?? summarizeChargeBranchTraceState(state),
      ...details,
    }, {
      level: options.level ?? LOG_LEVELS.DEBUG,
      area: options.area ?? getChargeBranchTraceArea(kind),
      console: options.console,
      sync: options.sync,
    });
  }

  function startAction(action, stateBefore) {
    const context = {
      action: summarizeAction(action),
      startMs: safeNow(),
      reduceEndMs: null,
      renderEndMs: null,
    };

    record('action-start', {
      action: context.action,
      stateBefore: summarizeStateForDebug(stateBefore),
    });

    return context;
  }

  function markReduced(context, stateAfterReduce, options = {}) {
    if (!context) {
      return;
    }

    context.reduceEndMs = Number.isFinite(options.timestampMs) ? options.timestampMs : safeNow();
    record('action-reduced', {
      action: context.action,
      reduceMs: roundMs(context.reduceEndMs - context.startMs),
      stateAfterReduce: summarizeStateForDebug(stateAfterReduce),
    });
  }

  function completeAction(context, stateAfterRender, options = {}) {
    if (!context) {
      return;
    }

    context.renderEndMs = Number.isFinite(options.timestampMs) ? options.timestampMs : safeNow();
    const reduceMs = context.reduceEndMs ? context.reduceEndMs - context.startMs : 0;
    const renderMs = context.reduceEndMs ? context.renderEndMs - context.reduceEndMs : context.renderEndMs - context.startMs;
    record('action-complete', {
      action: context.action,
      reduceMs: roundMs(reduceMs),
      renderMs: roundMs(renderMs),
      totalMs: roundMs(context.renderEndMs - context.startMs),
      stateAfterRender: summarizeStateForDebug(stateAfterRender),
    });
  }

  function recordError(error, details = {}) {
    record('error', {
      ...details,
      error: serializeError(error),
    }, { sync: true });
  }

  function installGlobalHooks() {
    if (installed || typeof window === 'undefined') {
      return;
    }

    installed = true;

    window.__ADG_DEBUG__ = {
      sessionId,
      record,
      getFilters,
      setFilters,
      enableArea,
      disableArea,
      setLevel,
      recordChargeBranchTrace,
      repro: {
        isEnabled: isReproRecorderEnabled,
        enable: enableBrowserReproRecorder,
        disable: disableBrowserReproRecorder,
        getLog: getBrowserReproLog,
        getSummary: getBrowserReproSummary,
        clear: clearBrowserReproLog,
        resetSession: resetBrowserReproRecorderSession,
        export: exportBrowserReproLog,
        replayCanonical: (exportedOrEvents) => replayCanonical(exportedOrEvents, {
          dispatchAction,
          getState,
        }),
      },
      getLog: () => window.__ADG_DEBUG_LOG__ ?? [],
      getLogSummary: () => createMemoryLogSummary(window.__ADG_DEBUG_LOG__ ?? []),
      clearLog: () => {
        window.__ADG_DEBUG_LOG__ = [];
        window.__ADG_PERF_LOG__ = [];
      },
      downloadLog: () => {
        const log = window.__ADG_DEBUG_LOG__ ?? [];
        const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `adg-debug-${sessionId}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
      },
      copyLogSummary: async () => {
        const summary = createMemoryLogSummary(window.__ADG_DEBUG_LOG__ ?? []);
        const text = JSON.stringify(summary, null, 2);
        if (window.navigator?.clipboard?.writeText) {
          await window.navigator.clipboard.writeText(text);
        }
        return summary;
      },
      enable: () => window.localStorage?.setItem('adg-debug-log', '1'),
      disable: () => window.localStorage?.removeItem('adg-debug-log'),
    };

    if (isReproRecorderEnabled()) {
      resetBrowserReproRecorderSession();
    }

    window.addEventListener('error', (event) => {
      recordError(event.error ?? event.message, {
        type: 'window-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      recordError(event.reason, { type: 'unhandled-rejection' });
    });

    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration >= LONG_TASK_THRESHOLD_MS) {
              const nowMs = safeNow();
              if (nowMs - lastLongTaskLogMs < LONG_TASK_LOG_INTERVAL_MS) {
                return;
              }
              lastLongTaskLogMs = nowMs;
              record('long-task', {
                name: entry.name,
                durationMs: roundMs(entry.duration),
                startTimeMs: roundMs(entry.startTime),
              });
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        // Long task observation is best-effort only.
      }
    }

    record('debug-session-start', {
      endpoint,
      enabledBy: typeof window !== 'undefined' ? window.location.search : '',
    });
  }

  return {
    isEnabled,
    getFilters,
    setFilters,
    enableArea,
    disableArea,
    setLevel,
    record,
    recordLightweight,
    startChargeBranchTrace,
    recordChargeBranchTrace,
    startAction,
    markReduced,
    completeAction,
    recordError,
    installGlobalHooks,
  };
}
