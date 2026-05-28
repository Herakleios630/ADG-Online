import {
  getMovementPreviewResolvedDistanceUd,
  getWheelDistanceUdForAngleRadians,
} from '../engine/movement/index.js';

export const BROWSER_REPRO_QUERY_PARAM = 'recordClicks';
export const BROWSER_REPRO_STORAGE_KEY = 'adg-record-clicks';
export const BROWSER_REPRO_LOG_GLOBAL = '__ADG_BROWSER_REPRO_LOG__';
export const BROWSER_REPRO_LOG_ENDPOINT = '/__adg-debug/repro';
export const DEFAULT_BROWSER_REPRO_LOG_FILE = 'adg-browser-repro-current.jsonl';
export const MAX_BROWSER_REPRO_PERSISTED_SESSIONS = 5;
export const MAX_BROWSER_REPRO_EVENTS = 120;
export const MAX_BROWSER_REPRO_EVENT_BYTES = 16 * 1024;
export const MAX_BROWSER_REPRO_STRING_LENGTH = 240;

export const BROWSER_REPRO_EVENT_KINDS = Object.freeze({
  SESSION_START: 'session-start',
  ACTION_CLICK: 'action-click',
  ACTIVE_MODAL: 'active-modal',
  NAVIGATION: 'navigation',
  BUTTON_CLICK: 'button-click',
  UNIT_SELECTION: 'unit-selection',
  TARGET_SELECTION: 'target-selection',
  ROLL_SELECTION: 'roll-selection',
  HANDOFF_ACKNOWLEDGEMENT: 'handoff-acknowledgement',
  BRANCH_SELECTION: 'branch-selection',
  WHEEL_ACTION: 'wheel-action',
  SLIDE_ACTION: 'slide-action',
});

const DATASET_FIELD_ALLOWLIST = [
  'action',
  'automationId',
  'activeModalId',
  'activeModalNextActionSelector',
  'candidateId',
  'corpsId',
  'decisionType',
  'dieRoll',
  'distanceUd',
  'maneuverType',
  'manoeuvreType',
  'mode',
  'option',
  'pivotSide',
  'points',
  'rollValue',
  'screen',
  'side',
  'stepId',
  'targetUnitId',
  'unitId',
  'viewMode',
];

export function isBrowserReproRecordingEnabled(locationLike = null, storage = null) {
  try {
    const search = typeof locationLike?.search === 'string' ? locationLike.search : '';
    const params = new URLSearchParams(search);
    if (params.get(BROWSER_REPRO_QUERY_PARAM) === '1') {
      return true;
    }

    return storage?.getItem?.(BROWSER_REPRO_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function clampReproString(value) {
  if (value == null) {
    return null;
  }

  const text = String(value);
  return text.length > MAX_BROWSER_REPRO_STRING_LENGTH
    ? `${text.slice(0, MAX_BROWSER_REPRO_STRING_LENGTH)}...`
    : text;
}

export function sanitizeReproDataset(dataset = {}) {
  return DATASET_FIELD_ALLOWLIST.reduce((sanitized, key) => {
    const value = dataset?.[key];
    if (value != null && value !== '') {
      sanitized[key] = clampReproString(value);
    }
    return sanitized;
  }, {});
}

export function inferReproEventKind(dataset = {}) {
  const action = dataset.action ?? null;
  if (action === 'navigate') {
    return BROWSER_REPRO_EVENT_KINDS.NAVIGATION;
  }

  if (action === 'select-unit') {
    return BROWSER_REPRO_EVENT_KINDS.UNIT_SELECTION;
  }

  if (action === 'set-charge-target') {
    return BROWSER_REPRO_EVENT_KINDS.TARGET_SELECTION;
  }

  if (action === 'resolve-charge-branch-distance' || dataset.dieRoll || dataset.rollValue) {
    return BROWSER_REPRO_EVENT_KINDS.ROLL_SELECTION;
  }

  if (action === 'acknowledge-evade-choice-handoff') {
    return BROWSER_REPRO_EVENT_KINDS.HANDOFF_ACKNOWLEDGEMENT;
  }

  if (action === 'select-evade-avoidance-choice' || dataset.candidateId) {
    return BROWSER_REPRO_EVENT_KINDS.BRANCH_SELECTION;
  }

  if (String(action ?? '').toLowerCase().includes('wheel') || dataset.pivotSide) {
    return BROWSER_REPRO_EVENT_KINDS.WHEEL_ACTION;
  }

  if (String(action ?? '').toLowerCase().includes('slide') || dataset.side) {
    return BROWSER_REPRO_EVENT_KINDS.SLIDE_ACTION;
  }

  return BROWSER_REPRO_EVENT_KINDS.BUTTON_CLICK;
}

export function summarizeStateForRepro(state = null) {
  const chargePreview = state?.game?.chargePreview ?? null;
  const branchDistanceRoll = chargePreview?.branchDistanceRoll ?? null;
  return {
    screen: state?.shell?.currentScreen ?? null,
    selectedUnitId: state?.game?.selectedUnitId ?? null,
    activePlayerId: state?.game?.commandContext?.activePlayerId ?? null,
    activeCorpsId: state?.game?.commandContext?.activeCorpsId ?? null,
    battlePhase: state?.game?.commandContext?.currentPhaseId ?? null,
    chargeStatus: chargePreview?.status ?? null,
    chargeIntentUnitId: chargePreview?.intent?.unitId ?? null,
    chargeTargetId: chargePreview?.intent?.targetUnitId ?? null,
    branchRollValue: Number.isFinite(branchDistanceRoll?.result?.rawRoll)
      ? branchDistanceRoll.result.rawRoll
      : (Number.isFinite(branchDistanceRoll?.result?.dieRoll) ? branchDistanceRoll.result.dieRoll : null),
    evadeChoiceHandoffStatus: chargePreview?.evadeChoiceHandoff?.status ?? null,
    evadeMoveStatus: chargePreview?.evadeMove?.status ?? null,
    evadeChoiceKind: chargePreview?.evadePlan?.choiceKind ?? null,
  };
}

export function summarizeMovementForRepro(state = null) {
  const movement = state?.game?.movement ?? null;
  const preview = movement?.preview ?? null;
  const segments = Array.isArray(preview?.segments) ? preview.segments : [];
  const lastSegment = segments.at(-1) ?? null;
  const chargeStartManoeuvre = state?.game?.chargePreview?.intent?.startManoeuvre ?? null;
  const chargeStartWheelAngleRadians = Number.isFinite(chargeStartManoeuvre?.wheelAngleRadians)
    ? Number(chargeStartManoeuvre.wheelAngleRadians.toFixed(4))
    : null;
  const totalDistanceUd = segments.length > 0 && preview?.status === 'accepted'
    ? Number(getMovementPreviewResolvedDistanceUd(preview).toFixed(4))
    : null;
  const lastSegmentSlideSide = typeof lastSegment?.maneuver?.side === 'string'
    ? lastSegment.maneuver.side
    : typeof lastSegment?.distance?.measurementMode === 'string'
      ? lastSegment.distance.measurementMode.match(/^slide-(left|right)-/)?.[1] ?? null
      : null;

  if (
    !movement
    && !chargeStartManoeuvre
    && segments.length === 0
  ) {
    return null;
  }

  return {
    selectedCommandId: movement?.selectedCommandId ?? null,
    previewStatus: preview?.status ?? null,
    previewSegmentCount: segments.length,
    totalDistanceUd,
    advancePreviewUd: Number.isFinite(state?.game?.advancePreviewUd)
      ? Number(state.game.advancePreviewUd.toFixed(4))
      : null,
    slidePreviewUd: Number.isFinite(state?.game?.slidePreviewUd)
      ? Number(state.game.slidePreviewUd.toFixed(4))
      : null,
    slidePreviewSide: state?.game?.slidePreviewSide ?? null,
    wheelPreviewAngleRadians: Number.isFinite(state?.game?.wheelPreviewAngleRadians)
      ? Number(state.game.wheelPreviewAngleRadians.toFixed(4))
      : null,
    wheelPreviewDistanceUd: Number.isFinite(state?.game?.wheelPreviewAngleRadians)
      ? Number(getWheelDistanceUdForAngleRadians(state.game.wheelPreviewAngleRadians).toFixed(4))
      : null,
    wheelPivotSide: state?.game?.wheelPivotSide ?? null,
    lastSegment: lastSegment
      ? {
          commandId: lastSegment.commandId ?? null,
          distanceUd: Number.isFinite(lastSegment.distance?.resolvedUd)
            ? Number(lastSegment.distance.resolvedUd.toFixed(4))
            : null,
          angleRadians: Number.isFinite(lastSegment.maneuver?.angleRadians)
            ? Number(lastSegment.maneuver.angleRadians.toFixed(4))
            : null,
          pivotSide: lastSegment.maneuver?.pivotSide ?? null,
          side: lastSegmentSlideSide,
        }
      : null,
    chargeStart: chargeStartManoeuvre
      ? {
          type: chargeStartManoeuvre.type ?? null,
          pivotSide: chargeStartManoeuvre.pivotSide ?? null,
          angleRadians: chargeStartWheelAngleRadians,
          distanceUd: chargeStartWheelAngleRadians != null
            ? Number(getWheelDistanceUdForAngleRadians(chargeStartWheelAngleRadians).toFixed(4))
            : null,
        }
      : null,
  };
}

export function createReproEvent({
  kind,
  sequence,
  sessionId = null,
  timestampIso,
  nowMs = null,
  dataset = {},
  activeModal = null,
  state = null,
  page = null,
} = {}) {
  const sanitizedDataset = sanitizeReproDataset(dataset);
  const event = {
    timestamp: timestampIso ?? new Date().toISOString(),
    nowMs: Number.isFinite(nowMs) ? Number(nowMs.toFixed(2)) : null,
    sequence: Number.isFinite(sequence) ? sequence : null,
    sessionId: typeof sessionId === 'string' ? sessionId : null,
    kind: kind ?? inferReproEventKind(sanitizedDataset),
    action: sanitizedDataset.action ?? null,
    automationId: sanitizedDataset.automationId ?? null,
    dataset: sanitizedDataset,
    activeModal,
    state: summarizeStateForRepro(state),
    movement: summarizeMovementForRepro(state),
    page,
  };

  const serialized = JSON.stringify(event);
  if (serialized.length <= MAX_BROWSER_REPRO_EVENT_BYTES) {
    return event;
  }

  return {
    timestamp: event.timestamp,
    nowMs: event.nowMs,
    sequence: event.sequence,
    sessionId: event.sessionId,
    kind: event.kind,
    action: event.action,
    automationId: event.automationId,
    dataset: event.dataset,
    activeModal: event.activeModal,
    state: event.state,
    movement: event.movement,
    truncated: true,
    originalApproxBytes: serialized.length,
  };
}

export function summarizeReproEvents(events = []) {
  const entries = Array.isArray(events) ? events : [];
  const sessionIds = [...new Set(entries.map((entry) => entry?.sessionId).filter((value) => typeof value === 'string' && value.length > 0))];
  return {
    eventCount: entries.length,
    sessionCount: sessionIds.length,
    currentSessionId: sessionIds.at(-1) ?? null,
    maxEvents: MAX_BROWSER_REPRO_EVENTS,
    firstTimestamp: entries[0]?.timestamp ?? null,
    lastTimestamp: entries.at(-1)?.timestamp ?? null,
    activeModalId: entries.at(-1)?.activeModal?.id ?? null,
    lastAction: entries.at(-1)?.action ?? null,
    kinds: entries.reduce((counts, entry) => ({
      ...counts,
      [entry.kind ?? 'unknown']: (counts[entry.kind ?? 'unknown'] ?? 0) + 1,
    }), {}),
  };
}
