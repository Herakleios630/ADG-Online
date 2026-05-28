export const CANONICAL_REPLAY_SCHEMA = 'adg-canonical-replay-v1';
export const CANONICAL_REPLAY_EVENT_SCHEMA = 'adg-canonical-replay-event-v1';
export const CANONICAL_REPLAY_SCHEMA_VERSION = 1;

export const CANONICAL_REPLAY_EVENT_STATUSES = Object.freeze({
  SUPPORTED: 'supported',
  UNSUPPORTED: 'unsupported',
});

export const CANONICAL_REPLAY_EVENT_TYPES = Object.freeze({
  NAVIGATION: 'navigation',
  START_SCENARIO: 'start-scenario',
  ROUND_BEGIN: 'round-begin',
  SELECT_ACTIVE_CORPS: 'select-active-corps',
  SELECT_UNIT: 'select-unit',
  START_CHARGE_PREVIEW: 'start-charge-preview',
  SET_CHARGE_TARGET: 'set-charge-target',
  TOGGLE_MOVEMENT_MODE: 'toggle-movement-mode',
  COMMIT_MOVEMENT_SEGMENT: 'commit-movement-segment',
  CONFIRM_MOVEMENT: 'confirm-movement',
  RESOLVE_CHARGE_REACTION: 'resolve-charge-reaction',
  RESOLVE_CHARGE_BRANCH_DISTANCE: 'resolve-charge-branch-distance',
  ACKNOWLEDGE_EVADE_CHOICE_HANDOFF: 'acknowledge-evade-choice-handoff',
  SELECT_EVADE_AVOIDANCE_CHOICE: 'select-evade-avoidance-choice',
  START_ADJUSTED_CHARGE_DISTANCE_ROLL: 'start-adjusted-charge-distance-roll',
  RESOLVE_CHARGE_CONTINUATION_CHOICE: 'resolve-charge-continuation-choice',
});

const ACTION_TYPE_BY_REPRO_ACTION = Object.freeze({
  navigate: 'game/navigate',
  'start-direct-battle': 'game/start-direct-battle',
  'start-charge-drill-battle': 'game/start-charge-drill-battle',
  'start-conform-drill-battle': 'game/start-conform-drill-battle',
  'round-begin': 'game/round-begin',
  'select-active-corps': 'game/select-active-corps',
  'select-unit': 'game/select-unit',
  'start-charge-preview': 'game/start-charge-preview',
  'set-charge-target': 'game/set-charge-target',
  'toggle-advance-mode': 'game/toggle-advance-mode',
  'toggle-slide-mode': 'game/toggle-slide-mode',
  'toggle-wheel-mode': 'game/toggle-wheel-mode',
  'confirm-movement': 'game/confirm-movement',
  'resolve-charge-reaction': 'game/resolve-charge-reaction',
  'resolve-secondary-charge-reaction': 'game/resolve-secondary-charge-reaction',
  'resolve-charge-branch-distance': 'game/resolve-charge-branch-distance',
  'acknowledge-evade-choice-handoff': 'game/acknowledge-evade-choice-handoff',
  'select-evade-avoidance-choice': 'game/select-evade-avoidance-choice',
  'start-adjusted-charge-distance-roll': 'game/start-adjusted-charge-distance-roll',
  'resolve-charge-continuation-choice': 'game/resolve-charge-continuation-choice',
});

const START_SCENARIO_ACTIONS = new Set([
  'start-direct-battle',
  'start-charge-drill-battle',
  'start-conform-drill-battle',
]);

const MOVEMENT_MODE_ACTIONS = new Set([
  'toggle-advance-mode',
  'toggle-slide-mode',
  'toggle-wheel-mode',
]);

const MOVEMENT_COMMIT_ACTIONS = new Set([
  'commit-advance-drag-preview',
  'commit-slide-drag-preview',
  'commit-charge-slide-drag-preview',
  'commit-wheel-drag-preview',
  'commit-charge-wheel-drag-preview',
]);

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toRoundedNumber(value, digits = 4) {
  const number = toFiniteNumber(value);
  return number == null ? null : Number(number.toFixed(digits));
}

function normalizeSide(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'left' || normalized === 'right' ? normalized : null;
}

function normalizePivotSide(value) {
  return normalizeSide(value);
}

function normalizeChargeStartCheckpoint(chargeStart = null) {
  if (!chargeStart || typeof chargeStart !== 'object') {
    return null;
  }

  const normalized = {
    type: chargeStart.type ?? null,
    pivotSide: chargeStart.pivotSide ?? null,
    wheelAngleRadians: toRoundedNumber(chargeStart.angleRadians),
    slideSide: null,
    slideDistanceUd: null,
    spentBudgetUd: toRoundedNumber(chargeStart.distanceUd),
  };

  if (
    normalized.wheelAngleRadians === 0
    && normalized.slideDistanceUd == null
    && normalized.spentBudgetUd === 0
  ) {
    return null;
  }

  return normalized;
}

function cloneBounded(value) {
  if (value == null) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
}

function getBrowserReproEvent(entry = null) {
  return entry?.details?.reproEvent ?? entry;
}

function isCanonicalReplaySourceEvent(event = null) {
  return Boolean(event) && event.kind !== 'session-start';
}

function createReplayRunId(events = []) {
  const firstEvent = events[0] ?? null;
  const timestampToken = String(firstEvent?.timestamp ?? 'unknown').replaceAll(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  const sequenceToken = Number.isFinite(firstEvent?.sequence) ? firstEvent.sequence : 0;
  return `replay-${timestampToken || 'unknown'}-${sequenceToken}-${events.length}`;
}

function createUnsupportedProjection({ event, replayRunId, reason, details = {} }) {
  return {
    schema: CANONICAL_REPLAY_EVENT_SCHEMA,
    schemaVersion: CANONICAL_REPLAY_SCHEMA_VERSION,
    replayRunId,
    sourceSequence: Number.isFinite(event?.sequence) ? event.sequence : null,
    sourceKind: event?.kind ?? null,
    sourceAction: event?.action ?? null,
    status: CANONICAL_REPLAY_EVENT_STATUSES.UNSUPPORTED,
    eventType: null,
    action: null,
    semantic: null,
    checkpoint: createSemanticCheckpoint(event),
    diagnostics: [{ code: 'canonical-replay.unsupported-event', reason, details: cloneBounded(details) }],
  };
}

function createSupportedProjection({ event, replayRunId, eventType, actionType, payload = {}, semantic = null }) {
  return {
    schema: CANONICAL_REPLAY_EVENT_SCHEMA,
    schemaVersion: CANONICAL_REPLAY_SCHEMA_VERSION,
    replayRunId,
    sourceSequence: Number.isFinite(event?.sequence) ? event.sequence : null,
    sourceKind: event?.kind ?? null,
    sourceAction: event?.action ?? null,
    status: CANONICAL_REPLAY_EVENT_STATUSES.SUPPORTED,
    eventType,
    action: {
      type: actionType,
      payload: cloneBounded(payload),
    },
    semantic: cloneBounded(semantic),
    checkpoint: createSemanticCheckpoint(event),
    diagnostics: [],
  };
}

function createSemanticCheckpoint(event = null) {
  return {
    selectedUnitId: event?.state?.selectedUnitId ?? null,
    activePlayerId: event?.state?.activePlayerId ?? null,
    activeCorpsId: event?.state?.activeCorpsId ?? null,
    battlePhase: event?.state?.battlePhase ?? null,
    chargeStatus: event?.state?.chargeStatus ?? null,
    chargeIntentUnitId: event?.state?.chargeIntentUnitId ?? null,
    chargeTargetId: event?.state?.chargeTargetId ?? null,
    activeModalId: event?.activeModal?.id ?? null,
    branchRollValue: Number.isFinite(event?.state?.branchRollValue) ? event.state.branchRollValue : null,
    chargeStartManoeuvre: normalizeChargeStartCheckpoint(event?.movement?.chargeStart),
    movement: event?.movement
      ? {
          selectedCommandId: event.movement.selectedCommandId ?? null,
          previewStatus: event.movement.previewStatus ?? null,
          previewSegmentCount: event.movement.previewSegmentCount ?? null,
          totalDistanceUd: toRoundedNumber(event.movement.totalDistanceUd),
          lastSegment: event.movement.lastSegment ?? null,
          chargeStart: event.movement.chargeStart ?? null,
        }
      : null,
  };
}

function carryForwardCheckpointFacts(eventProjection, previousProjection = null) {
  const previousBranchRollValue = Number.isFinite(previousProjection?.checkpoint?.branchRollValue)
    ? previousProjection.checkpoint.branchRollValue
    : (previousProjection?.eventType === CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE
        && Number.isFinite(previousProjection?.action?.payload?.dieRoll)
      ? previousProjection.action.payload.dieRoll
      : null);
  const canCarryForwardBranchRoll = eventProjection?.eventType === CANONICAL_REPLAY_EVENT_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF
    || eventProjection?.eventType === CANONICAL_REPLAY_EVENT_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE
    || eventProjection?.eventType === CANONICAL_REPLAY_EVENT_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL
    || eventProjection?.eventType === CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE;

  if (
    !canCarryForwardBranchRoll
    || !eventProjection?.checkpoint
    || Number.isFinite(eventProjection.checkpoint.branchRollValue)
    || !Number.isFinite(previousBranchRollValue)
  ) {
    return eventProjection;
  }

  return {
    ...eventProjection,
    checkpoint: {
      ...eventProjection.checkpoint,
      branchRollValue: previousBranchRollValue,
    },
  };
}

function projectSimpleAction(event, replayRunId, eventType, payload = {}) {
  return createSupportedProjection({
    event,
    replayRunId,
    eventType,
    actionType: ACTION_TYPE_BY_REPRO_ACTION[event.action],
    payload,
  });
}

function projectMovementCommit(event, replayRunId) {
  const movement = event?.movement ?? null;
  const dataset = event?.dataset ?? {};
  const lastSegment = movement?.lastSegment ?? null;
  const chargeStart = movement?.chargeStart ?? null;
  const isChargeStart = String(event?.action ?? '').includes('charge') || Boolean(chargeStart);
  const commandId = lastSegment?.commandId ?? movement?.selectedCommandId ?? chargeStart?.type ?? null;
  const distanceUd = toRoundedNumber(lastSegment?.distanceUd ?? dataset.distanceUd ?? chargeStart?.distanceUd);
  const angleRadians = toRoundedNumber(lastSegment?.angleRadians ?? dataset.angleRadians ?? chargeStart?.angleRadians);
  const pivotSide = normalizePivotSide(lastSegment?.pivotSide ?? dataset.pivotSide ?? chargeStart?.pivotSide);
  const side = normalizeSide(lastSegment?.side ?? dataset.side ?? movement?.slidePreviewSide);

  if (!commandId) {
    return createUnsupportedProjection({
      event,
      replayRunId,
      reason: 'movement-commit-missing-command',
      details: { action: event?.action ?? null },
    });
  }

  if (isChargeStart) {
    if (commandId === 'wheel') {
      return createSupportedProjection({
        event,
        replayRunId,
        eventType: CANONICAL_REPLAY_EVENT_TYPES.COMMIT_MOVEMENT_SEGMENT,
        actionType: 'game/replay-commit-movement-segment',
        payload: {
          unitId: dataset.unitId ?? event?.state?.selectedUnitId ?? event?.state?.chargeIntentUnitId ?? null,
          commandId,
          distanceUd,
          angleRadians,
          pivotSide,
          side,
          totalDistanceUd: toRoundedNumber(movement?.totalDistanceUd),
          scope: 'charge-start',
        },
        semantic: {
          movementCommit: {
            commandId,
            distanceUd,
            angleRadians,
            pivotSide,
            side,
            totalDistanceUd: toRoundedNumber(movement?.totalDistanceUd),
            chargeStart: cloneBounded(chargeStart),
          },
        },
      });
    }

    return createUnsupportedProjection({
      event,
      replayRunId,
      reason: 'charge-start-manoeuvre-not-supported',
      details: {
        action: event?.action ?? null,
        commandId,
        chargeStart: cloneBounded(chargeStart),
      },
    });
  }

  return createSupportedProjection({
    event,
    replayRunId,
    eventType: CANONICAL_REPLAY_EVENT_TYPES.COMMIT_MOVEMENT_SEGMENT,
    actionType: 'game/replay-commit-movement-segment',
    payload: {
      unitId: dataset.unitId ?? event?.state?.selectedUnitId ?? event?.state?.chargeIntentUnitId ?? null,
      commandId,
      segmentIndex: Number.isFinite(movement?.previewSegmentCount) ? Math.max(0, movement.previewSegmentCount - 1) : null,
      basePose: null,
      basePoseHash: null,
      distanceUd,
      angleRadians,
      pivotSide,
      side,
      totalDistanceUd: toRoundedNumber(movement?.totalDistanceUd),
      scope: 'normal-movement',
    },
    semantic: {
      movementCommit: {
        commandId,
        distanceUd,
        angleRadians,
        pivotSide,
        side,
        totalDistanceUd: toRoundedNumber(movement?.totalDistanceUd),
        chargeStart: cloneBounded(chargeStart),
      },
    },
  });
}

function projectConfirmMovement(event, replayRunId) {
  const movement = event?.movement ?? null;
  return createSupportedProjection({
    event,
    replayRunId,
    eventType: CANONICAL_REPLAY_EVENT_TYPES.CONFIRM_MOVEMENT,
    actionType: ACTION_TYPE_BY_REPRO_ACTION[event.action],
    payload: {
      unitId: event?.state?.selectedUnitId ?? null,
      expectedSegmentCount: Number.isFinite(movement?.previewSegmentCount) ? movement.previewSegmentCount : null,
      expectedTotalDistanceUd: toRoundedNumber(movement?.totalDistanceUd),
      lastSegment: cloneBounded(movement?.lastSegment ?? null),
    },
  });
}

function isChargeTargetSelectionEvent(event, dataset) {
  return event?.state?.chargeStatus === 'targeting'
    && event?.state?.chargeIntentUnitId != null
    && event?.state?.chargeIntentUnitId === event?.state?.selectedUnitId
    && dataset?.unitId != null
    && dataset.unitId !== event.state.selectedUnitId;
}

export function projectBrowserReproEventToCanonicalReplay(entry, { replayRunId = null } = {}) {
  const event = getBrowserReproEvent(entry);
  const effectiveReplayRunId = replayRunId ?? createReplayRunId(event ? [event] : []);
  const action = event?.action ?? null;
  const dataset = event?.dataset ?? {};

  if (!event || !action) {
    return createUnsupportedProjection({
      event,
      replayRunId: effectiveReplayRunId,
      reason: 'missing-browser-repro-action',
    });
  }

  if (START_SCENARIO_ACTIONS.has(action)) {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.START_SCENARIO, {
      scenarioAction: action,
    });
  }

  if (action === 'navigate') {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.NAVIGATION, {
      screenId: dataset.screen ?? null,
    });
  }

  if (action === 'round-begin') {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.ROUND_BEGIN);
  }

  if (action === 'select-active-corps') {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.SELECT_ACTIVE_CORPS, {
      corpsId: dataset.corpsId ?? null,
    });
  }

  if (action === 'select-unit') {
    if (isChargeTargetSelectionEvent(event, dataset)) {
      return createSupportedProjection({
        event,
        replayRunId: effectiveReplayRunId,
        eventType: CANONICAL_REPLAY_EVENT_TYPES.SET_CHARGE_TARGET,
        actionType: ACTION_TYPE_BY_REPRO_ACTION['set-charge-target'],
        payload: {
          targetUnitId: dataset.unitId ?? null,
        },
      });
    }

    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.SELECT_UNIT, {
      unitId: dataset.unitId ?? null,
    });
  }

  if (action === 'start-charge-preview') {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.START_CHARGE_PREVIEW, {
      unitId: event?.state?.selectedUnitId ?? dataset.unitId ?? null,
    });
  }

  if (action === 'set-charge-target') {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.SET_CHARGE_TARGET, {
      targetUnitId: dataset.targetUnitId ?? event?.state?.chargeTargetId ?? null,
    });
  }

  if (MOVEMENT_MODE_ACTIONS.has(action)) {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.TOGGLE_MOVEMENT_MODE, {
      mode: action.replace(/^toggle-/, '').replace(/-mode$/, ''),
      unitId: event?.state?.selectedUnitId ?? null,
    });
  }

  if (MOVEMENT_COMMIT_ACTIONS.has(action)) {
    return projectMovementCommit(event, effectiveReplayRunId);
  }

  if (action === 'confirm-movement') {
    return projectConfirmMovement(event, effectiveReplayRunId);
  }

  if (action === 'resolve-charge-reaction' || action === 'resolve-secondary-charge-reaction') {
    return createSupportedProjection({
      event,
      replayRunId: effectiveReplayRunId,
      eventType: CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_REACTION,
      actionType: ACTION_TYPE_BY_REPRO_ACTION[action],
      payload: { decisionType: dataset.decisionType ?? null },
    });
  }

  if (action === 'resolve-charge-branch-distance') {
    return createSupportedProjection({
      event,
      replayRunId: effectiveReplayRunId,
      eventType: CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
      actionType: ACTION_TYPE_BY_REPRO_ACTION[action],
      payload: { dieRoll: toFiniteNumber(dataset.dieRoll ?? dataset.rollValue) },
    });
  }

  if (action === 'acknowledge-evade-choice-handoff') {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF);
  }

  if (action === 'select-evade-avoidance-choice') {
    return createSupportedProjection({
      event,
      replayRunId: effectiveReplayRunId,
      eventType: CANONICAL_REPLAY_EVENT_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
      actionType: ACTION_TYPE_BY_REPRO_ACTION[action],
      payload: {
        candidateId: dataset.candidateId ?? null,
        side: normalizeSide(dataset.side),
        distanceUd: toRoundedNumber(dataset.distanceUd),
      },
    });
  }

  if (action === 'start-adjusted-charge-distance-roll') {
    return projectSimpleAction(event, effectiveReplayRunId, CANONICAL_REPLAY_EVENT_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL);
  }

  if (action === 'resolve-charge-continuation-choice') {
    return createSupportedProjection({
      event,
      replayRunId: effectiveReplayRunId,
      eventType: CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE,
      actionType: ACTION_TYPE_BY_REPRO_ACTION[action],
      payload: { option: dataset.option ?? null },
    });
  }

  return createUnsupportedProjection({
    event,
    replayRunId: effectiveReplayRunId,
    reason: 'unsupported-browser-repro-action',
    details: { action },
  });
}

export function projectBrowserReproEventsToCanonicalReplay(entries = [], options = {}) {
  const sourceEvents = (Array.isArray(entries) ? entries : [])
    .map(getBrowserReproEvent)
    .filter(isCanonicalReplaySourceEvent);
  const replayRunId = options.replayRunId ?? createReplayRunId(sourceEvents);
  const events = [];
  sourceEvents.forEach((event) => {
    const projectedEvent = projectBrowserReproEventToCanonicalReplay(event, { replayRunId });
    events.push(carryForwardCheckpointFacts(projectedEvent, events.at(-1) ?? null));
  });
  const supportedCount = events.filter((event) => event.status === CANONICAL_REPLAY_EVENT_STATUSES.SUPPORTED).length;
  const unsupportedCount = events.length - supportedCount;

  return {
    schema: CANONICAL_REPLAY_SCHEMA,
    schemaVersion: CANONICAL_REPLAY_SCHEMA_VERSION,
    replayRunId,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    sourceSchema: 'adg-browser-repro-v1',
    summary: {
      sourceEventCount: sourceEvents.length,
      canonicalEventCount: events.length,
      supportedCount,
      unsupportedCount,
      isFullyReplayable: unsupportedCount === 0,
    },
    events,
  };
}