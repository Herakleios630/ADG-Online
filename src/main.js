import './styles/p0.css';
import { CHARGE_BRANCH_TRACE_EVENTS, LOG_AREAS } from './debug/debug-log-contract.js';
import { createBrowserDebugLogger } from './debug/browser-debug-logger.js';
import { ACTION_TYPES, createInitialAppState, reduceAppState } from './state/p0-state.js';
import { renderApp } from './ui/p0-app.js';

const EVADE_HANDOFF_OVERLAY_SELECTOR = '[data-evade-choice-handoff-dialog-overlay]';

const app = document.querySelector('#app');
let currentState = createInitialAppState();
const debugLogger = createBrowserDebugLogger({
  app,
  getState: () => currentState,
  dispatchAction: (action) => dispatch(action),
});
debugLogger.installGlobalHooks();

function schedulePostRenderDebugLogging(callback) {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      callback();
    });
    return;
  }

  setTimeout(callback, 0);
}

function getTimestampMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function isChargeBranchDistanceAction(action) {
  return action?.type === ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE;
}

function getEvadeHandoffOverlaySnapshot() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return {
      mounted: false,
      visible: false,
      reason: 'no-document',
    };
  }

  const overlay = document.querySelector(EVADE_HANDOFF_OVERLAY_SELECTOR);
  if (!overlay) {
    return {
      mounted: false,
      visible: false,
      selector: EVADE_HANDOFF_OVERLAY_SELECTOR,
    };
  }

  const rect = overlay.getBoundingClientRect();
  const style = window.getComputedStyle(overlay);
  const visible = rect.width > 0
    && rect.height > 0
    && style.display !== 'none'
    && style.visibility !== 'hidden'
    && style.opacity !== '0';

  return {
    mounted: true,
    visible,
    selector: EVADE_HANDOFF_OVERLAY_SELECTOR,
    rect: {
      x: Number(rect.x.toFixed(2)),
      y: Number(rect.y.toFixed(2)),
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
    },
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
  };
}

function dispatch(action) {
  const chargeBranchTrace = isChargeBranchDistanceAction(action)
    ? debugLogger.startChargeBranchTrace(action, currentState)
    : null;
  const debugAction = debugLogger.startAction(action, currentState);

  try {
    const reducerStartedAtMs = getTimestampMs();
    debugLogger.recordChargeBranchTrace(chargeBranchTrace, CHARGE_BRANCH_TRACE_EVENTS.REDUCER_START, {
      stage: 'reducer-start',
    }, { area: LOG_AREAS.CHARGE });
    currentState = reduceAppState(currentState, action);
    const reducedAtMs = getTimestampMs();
    debugLogger.recordChargeBranchTrace(chargeBranchTrace, CHARGE_BRANCH_TRACE_EVENTS.REDUCED, {
      stage: 'reducer-end',
      durationMs: Number((reducedAtMs - reducerStartedAtMs).toFixed(2)),
    }, { area: LOG_AREAS.CHARGE });
    debugLogger.recordChargeBranchTrace(chargeBranchTrace, CHARGE_BRANCH_TRACE_EVENTS.RENDER_START, {
      stage: 'render-start',
    }, { area: LOG_AREAS.UI });
    const renderStartedAtMs = getTimestampMs();
    renderApp(app, currentState, dispatch);
    const renderCompletedAtMs = getTimestampMs();
    debugLogger.recordChargeBranchTrace(chargeBranchTrace, CHARGE_BRANCH_TRACE_EVENTS.RENDERED, {
      stage: 'render-end',
      durationMs: Number((renderCompletedAtMs - renderStartedAtMs).toFixed(2)),
    }, { area: LOG_AREAS.UI });
    debugLogger.recordChargeBranchTrace(chargeBranchTrace, CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_MOUNTED, {
      stage: 'handoff-overlay-mounted-check',
      overlay: getEvadeHandoffOverlaySnapshot(),
    }, { area: LOG_AREAS.UI });
    schedulePostRenderDebugLogging(() => {
      const frameAtMs = getTimestampMs();
      debugLogger.recordChargeBranchTrace(chargeBranchTrace, CHARGE_BRANCH_TRACE_EVENTS.NEXT_FRAME, {
        stage: 'first-animation-frame-after-render',
        renderToFrameMs: Number((frameAtMs - renderCompletedAtMs).toFixed(2)),
      }, { area: LOG_AREAS.PERF });
      debugLogger.recordChargeBranchTrace(chargeBranchTrace, CHARGE_BRANCH_TRACE_EVENTS.HANDOFF_VISIBLE, {
        stage: 'handoff-overlay-visible-check',
        renderToVisibleCheckMs: Number((getTimestampMs() - renderCompletedAtMs).toFixed(2)),
        overlay: getEvadeHandoffOverlaySnapshot(),
      }, { area: LOG_AREAS.PERF });
    });
    schedulePostRenderDebugLogging(() => {
      try {
        debugLogger.markReduced(debugAction, currentState, { timestampMs: reducedAtMs });
        debugLogger.completeAction(debugAction, currentState, { timestampMs: renderCompletedAtMs });
      } catch (error) {
        debugLogger.recordError(error, {
          action,
          phase: 'post-render-debug-logging',
        });
      }
    });
  } catch (error) {
    debugLogger.recordError(error, {
      action,
      phase: 'dispatch',
    });
    throw error;
  }
}

renderApp(app, currentState, dispatch);
