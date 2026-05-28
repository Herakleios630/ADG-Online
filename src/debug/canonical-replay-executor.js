import { ACTION_TYPES } from '../state/p0-state.js';
import {
  CANONICAL_REPLAY_EVENT_STATUSES,
  CANONICAL_REPLAY_EVENT_TYPES,
} from './canonical-replay-contract.js';
import {
  buildReplayCheckpointFromState,
  compareReplayActionOutcome,
  compareReplayCheckpoints,
} from './replay-divergence.js';

export const CANONICAL_REPLAY_EXECUTOR_STATUSES = Object.freeze({
  OK: 'ok',
  BLOCKED: 'blocked',
  DRIFT: 'drift',
  ERROR: 'error',
});

function getReplayEvents(input) {
  if (Array.isArray(input)) {
    return input;
  }

  if (Array.isArray(input?.events)) {
    return input.events;
  }

  if (Array.isArray(input?.canonicalReplay?.events)) {
    return input.canonicalReplay.events;
  }

  return [];
}

function getReplayRunId(input) {
  return input?.replayRunId ?? input?.canonicalReplay?.replayRunId ?? null;
}

function createBlockedStep(event, reason, details = {}) {
  return {
    sourceSequence: event?.sourceSequence ?? null,
    sourceAction: event?.sourceAction ?? null,
    eventType: event?.eventType ?? null,
    status: CANONICAL_REPLAY_EXECUTOR_STATUSES.BLOCKED,
    reason,
    details,
    dispatchedActions: [],
  };
}

function createAction(type, payload = {}) {
  return {
    type,
    ...Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)),
  };
}

function getScenarioAction(event) {
  switch (event?.action?.payload?.scenarioAction ?? event?.sourceAction) {
    case 'start-direct-battle':
      return createAction(ACTION_TYPES.START_DIRECT_BATTLE);
    case 'start-charge-drill-battle':
      return createAction(ACTION_TYPES.START_CHARGE_DRILL_BATTLE);
    case 'start-conform-drill-battle':
      return createAction(ACTION_TYPES.START_CONFORM_DRILL_BATTLE);
    default:
      return null;
  }
}

function getMovementCommitActions(event) {
  const payload = event?.action?.payload ?? {};
  const scope = payload.scope ?? 'normal-movement';

  if (scope === 'charge-start') {
    if (payload.commandId === 'wheel') {
      return [createAction(ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, {
        manoeuvreType: 'wheel',
        pivotSide: payload.pivotSide,
        angleRadians: payload.angleRadians,
      })];
    }

    return [];
  }

  if (scope !== 'normal-movement') {
    return [];
  }

  switch (payload.commandId) {
    case 'advance':
      return [createAction(ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, { distanceUd: payload.distanceUd })];
    case 'slide':
      return [createAction(ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE, {
        distanceUd: payload.distanceUd,
        slideSide: payload.side,
      })];
    case 'wheel':
      return [createAction(ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE, {
        angleRadians: payload.angleRadians,
        pivotSide: payload.pivotSide,
      })];
    default:
      return [];
  }
}

function getReplayStateMovementCommandId(replayState) {
  const previewSegments = replayState?.game?.movement?.preview?.segments;
  const lastPreviewSegment = Array.isArray(previewSegments) && previewSegments.length > 0
    ? previewSegments[previewSegments.length - 1]
    : null;

  return replayState?.game?.movement?.selectedCommandId
    ?? lastPreviewSegment?.commandId
    ?? null;
}

function getConfirmMovementActions(event, replayState = null) {
  const selectedUnitId = replayState?.game?.selectedUnitId ?? null;
  const chargePreview = replayState?.game?.chargePreview ?? null;
  const commanderFreeMovePreview = replayState?.game?.commanderFreeMovePreview ?? null;

  if (chargePreview?.status === 'ready' && chargePreview?.intent?.unitId === selectedUnitId) {
    return [createAction(ACTION_TYPES.CONFIRM_CHARGE_DIRECTION)];
  }

  if (chargePreview?.status === 'no-evade-handoff' && chargePreview?.intent?.unitId === selectedUnitId) {
    return [createAction(ACTION_TYPES.CONFIRM_CHARGE_CONFORMATION)];
  }

  if (commanderFreeMovePreview?.status === 'ready') {
    return [createAction(ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE)];
  }

  const commandId = event?.action?.payload?.lastSegment?.commandId
    ?? getReplayStateMovementCommandId(replayState);

  switch (commandId) {
    case 'wheel':
      return [createAction(ACTION_TYPES.CONFIRM_WHEEL)];
    case 'slide':
      return [createAction(ACTION_TYPES.CONFIRM_SLIDE)];
    case 'advance':
      return [createAction(ACTION_TYPES.CONFIRM_ADVANCE)];
    default:
      return [];
  }
}

function getChargeReactionActionType(event) {
  const canonicalActionType = event?.action?.type ?? null;
  const sourceAction = event?.sourceAction ?? null;

  if (
    canonicalActionType === ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION
    || sourceAction === 'resolve-secondary-charge-reaction'
  ) {
    return ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION;
  }

  return ACTION_TYPES.RESOLVE_CHARGE_REACTION;
}

export function getReplayActionsForCanonicalEvent(event, replayState = null) {
  if (!event || event.status !== CANONICAL_REPLAY_EVENT_STATUSES.SUPPORTED) {
    return [];
  }

  const payload = event.action?.payload ?? {};

  switch (event.eventType) {
    case CANONICAL_REPLAY_EVENT_TYPES.NAVIGATION:
      return [createAction(ACTION_TYPES.NAVIGATE, { screenId: payload.screenId })];
    case CANONICAL_REPLAY_EVENT_TYPES.START_SCENARIO: {
      const scenarioAction = getScenarioAction(event);
      return scenarioAction ? [scenarioAction] : [];
    }
    case CANONICAL_REPLAY_EVENT_TYPES.ROUND_BEGIN:
      return [createAction(ACTION_TYPES.ROUND_BEGIN)];
    case CANONICAL_REPLAY_EVENT_TYPES.SELECT_ACTIVE_CORPS:
      return [createAction(ACTION_TYPES.SELECT_ACTIVE_CORPS, { corpsId: payload.corpsId })];
    case CANONICAL_REPLAY_EVENT_TYPES.SELECT_UNIT:
      return [createAction(ACTION_TYPES.SELECT_UNIT, { unitId: payload.unitId })];
    case CANONICAL_REPLAY_EVENT_TYPES.START_CHARGE_PREVIEW:
      return [createAction(ACTION_TYPES.START_CHARGE_PREVIEW, { unitId: payload.unitId })];
    case CANONICAL_REPLAY_EVENT_TYPES.SET_CHARGE_TARGET:
      return [createAction(ACTION_TYPES.SET_CHARGE_TARGET, { targetUnitId: payload.targetUnitId })];
    case CANONICAL_REPLAY_EVENT_TYPES.TOGGLE_MOVEMENT_MODE:
      return getMovementModeActions(payload.mode);
    case CANONICAL_REPLAY_EVENT_TYPES.COMMIT_MOVEMENT_SEGMENT:
      return getMovementCommitActions(event);
    case CANONICAL_REPLAY_EVENT_TYPES.CONFIRM_MOVEMENT:
      return getConfirmMovementActions(event, replayState);
    case CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_REACTION:
      return [createAction(getChargeReactionActionType(event), { decisionType: payload.decisionType })];
    case CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE:
      return [createAction(ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, { dieRoll: payload.dieRoll })];
    case CANONICAL_REPLAY_EVENT_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF:
      return [createAction(ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF)];
    case CANONICAL_REPLAY_EVENT_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE:
      return [createAction(ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE, {
        choice: {
          candidateId: payload.candidateId,
          side: payload.side,
          distanceUd: payload.distanceUd,
        },
      })];
    case CANONICAL_REPLAY_EVENT_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL:
      return [createAction(ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL)];
    case CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE:
      return [createAction(ACTION_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE, { option: payload.option })];
    default:
      return [];
  }
}

function getMovementModeActions(mode) {
  switch (mode) {
    case 'advance':
      return [createAction(ACTION_TYPES.SET_ADVANCE_MODE, { isActive: true })];
    case 'slide':
      return [createAction(ACTION_TYPES.SET_SLIDE_MODE, { isActive: true })];
    case 'wheel':
      return [createAction(ACTION_TYPES.SET_WHEEL_MODE, { isActive: true })];
    default:
      return [];
  }
}

function executeAction(action, context) {
  if (typeof context.dispatchAction === 'function') {
    context.dispatchAction(action);
    return typeof context.getState === 'function' ? context.getState() : context.currentState;
  }

  if (typeof context.reduceState === 'function') {
    context.currentState = context.reduceState(context.currentState, action);
    return context.currentState;
  }

  throw new Error('Canonical replay executor requires dispatchAction or reduceState.');
}

function getCurrentReplayCheckpoint(context) {
  if (typeof context.getReplayCheckpoint === 'function') {
    return context.getReplayCheckpoint();
  }

  if (typeof context.getState === 'function') {
    return buildReplayCheckpointFromState(context.getState(), {
      getActiveModalId: context.getActiveModalId,
    });
  }

  if (context.currentState) {
    return buildReplayCheckpointFromState(context.currentState, {
      getActiveModalId: context.getActiveModalId,
    });
  }

  return null;
}

function getDeferredModalPrecheckId(eventType) {
  switch (eventType) {
    case CANONICAL_REPLAY_EVENT_TYPES.ROUND_BEGIN:
      return 'round-begin';
    case CANONICAL_REPLAY_EVENT_TYPES.SELECT_ACTIVE_CORPS:
      return 'round-corps-selection';
    default:
      return null;
  }
}

function shouldDeferStartupModalPrecheck(event, checkpointComparison) {
  const expectedModalId = getDeferredModalPrecheckId(event?.eventType ?? null);
  if (!Array.isArray(checkpointComparison?.mismatches) || checkpointComparison.mismatches.length !== 1) {
    return false;
  }

  const [mismatch] = checkpointComparison.mismatches;
  if (
    expectedModalId
    && mismatch?.path === 'activeModalId'
    && mismatch?.expected === expectedModalId
    && mismatch?.actual == null
  ) {
    return true;
  }

  if (mismatch?.path !== 'activeModalId' || mismatch?.actual != null) {
    return false;
  }

  if (
    event?.eventType === CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_REACTION
    && mismatch?.expected === 'charge-reaction'
    && checkpointComparison?.actual?.chargeStatus === 'reaction-pending'
  ) {
    return true;
  }

  if (
    event?.eventType === CANONICAL_REPLAY_EVENT_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF
    && mismatch?.expected === 'evade-choice-handoff'
    && checkpointComparison?.actual?.chargeStatus === 'evade-required'
  ) {
    return true;
  }

  if (
    event?.eventType === CANONICAL_REPLAY_EVENT_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE
    && mismatch?.expected === 'evade-initial-branch'
    && checkpointComparison?.actual?.chargeStatus === 'evade-required'
  ) {
    return true;
  }

  return event?.eventType === CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE
    && mismatch?.expected === 'charge-branch-distance'
    && checkpointComparison?.actual?.chargeStatus === 'evade-required';
}

function shouldDeferPostActionModalCheck(event, checkpointComparison) {
  if (event?.eventType !== CANONICAL_REPLAY_EVENT_TYPES.CONFIRM_MOVEMENT) {
    return false;
  }

  if (!Array.isArray(checkpointComparison?.mismatches) || checkpointComparison.mismatches.length !== 1) {
    return false;
  }

  const [mismatch] = checkpointComparison.mismatches;
  return mismatch?.path === 'activeModalId'
    && mismatch?.expected === 'charge-reaction'
    && mismatch?.actual == null
    && checkpointComparison?.actual?.chargeStatus === 'reaction-pending';
}

function usesPostActionCheckpoint(event) {
  return event?.eventType === CANONICAL_REPLAY_EVENT_TYPES.COMMIT_MOVEMENT_SEGMENT
    || event?.eventType === CANONICAL_REPLAY_EVENT_TYPES.CONFIRM_MOVEMENT;
}

export function replayCanonical(input, options = {}) {
  const events = getReplayEvents(input);
  const context = {
    dispatchAction: options.dispatchAction,
    reduceState: options.reduceState,
    getState: options.getState,
    getReplayCheckpoint: options.getReplayCheckpoint,
    getActiveModalId: options.getActiveModalId,
    currentState: options.initialState,
  };
  const steps = [];

  if (events.length === 0) {
    return {
      status: CANONICAL_REPLAY_EXECUTOR_STATUSES.BLOCKED,
      ok: false,
      replayRunId: getReplayRunId(input),
      reason: 'canonical-replay-empty',
      steps,
      finalState: context.currentState,
    };
  }

  for (const event of events) {
    if (event?.status !== CANONICAL_REPLAY_EVENT_STATUSES.SUPPORTED) {
      const step = createBlockedStep(event, 'unsupported-canonical-event');
      steps.push(step);
      return createReplayResult(input, steps, context.currentState, step.reason);
    }

    if (!usesPostActionCheckpoint(event)) {
      const currentCheckpoint = getCurrentReplayCheckpoint(context);
      const checkpointComparison = compareReplayCheckpoints(event.checkpoint ?? null, currentCheckpoint);
      if (!checkpointComparison.ok) {
        if (shouldDeferStartupModalPrecheck(event, checkpointComparison)) {
          // Startup dialogs can lag one render tick behind their preceding replayed dispatch in live browser replay.
        } else {
          steps.push({
            sourceSequence: event.sourceSequence ?? null,
            sourceAction: event.sourceAction ?? null,
            eventType: event.eventType ?? null,
            status: CANONICAL_REPLAY_EXECUTOR_STATUSES.DRIFT,
            reason: 'semantic-checkpoint-drift',
            comparisonPhase: 'pre-action',
            ownerClass: checkpointComparison.ownerClass,
            expectedCheckpoint: checkpointComparison.expected,
            actualCheckpoint: checkpointComparison.actual,
            expectedHash: checkpointComparison.expectedHash,
            actualHash: checkpointComparison.actualHash,
            mismatches: checkpointComparison.mismatches,
            dispatchedActions: [],
          });
          return createReplayResult(input, steps, context.currentState, 'semantic-checkpoint-drift');
        }
      }
    }

    const replayStateForActionMapping = typeof context.getState === 'function'
      ? context.getState()
      : context.currentState;
    const actions = getReplayActionsForCanonicalEvent(event, replayStateForActionMapping);
    if (actions.length === 0 && event.eventType !== CANONICAL_REPLAY_EVENT_TYPES.CONFIRM_MOVEMENT) {
      const step = createBlockedStep(event, 'no-executor-action-mapping');
      steps.push(step);
      return createReplayResult(input, steps, context.currentState, step.reason);
    }

    try {
      actions.forEach((action) => executeAction(action, context));
      const actualCheckpoint = getCurrentReplayCheckpoint(context);
      const outcomeComparison = compareReplayActionOutcome(event, actualCheckpoint);
      if (!outcomeComparison.ok) {
        if (shouldDeferPostActionModalCheck(event, outcomeComparison)) {
          steps.push({
            sourceSequence: event.sourceSequence ?? null,
            sourceAction: event.sourceAction ?? null,
            eventType: event.eventType ?? null,
            status: CANONICAL_REPLAY_EXECUTOR_STATUSES.OK,
            dispatchedActions: actions.map((action) => action.type),
          });
          continue;
        }

        steps.push({
          sourceSequence: event.sourceSequence ?? null,
          sourceAction: event.sourceAction ?? null,
          eventType: event.eventType ?? null,
          status: CANONICAL_REPLAY_EXECUTOR_STATUSES.DRIFT,
          reason: 'semantic-checkpoint-drift',
          comparisonPhase: 'post-action',
          ownerClass: outcomeComparison.ownerClass,
          expectedCheckpoint: outcomeComparison.expected,
          actualCheckpoint: outcomeComparison.actual,
          expectedHash: outcomeComparison.expectedHash,
          actualHash: outcomeComparison.actualHash,
          mismatches: outcomeComparison.mismatches,
          dispatchedActions: actions.map((action) => action.type),
        });
        return createReplayResult(input, steps, context.currentState, 'semantic-checkpoint-drift');
      }
      steps.push({
        sourceSequence: event.sourceSequence ?? null,
        sourceAction: event.sourceAction ?? null,
        eventType: event.eventType ?? null,
        status: CANONICAL_REPLAY_EXECUTOR_STATUSES.OK,
        comparisonPhase: 'post-action',
        expectedCheckpoint: outcomeComparison.expected,
        actualCheckpoint: outcomeComparison.actual,
        expectedHash: outcomeComparison.expectedHash,
        actualHash: outcomeComparison.actualHash,
        dispatchedActions: actions.map((action) => action.type),
      });
    } catch (error) {
      steps.push({
        sourceSequence: event.sourceSequence ?? null,
        sourceAction: event.sourceAction ?? null,
        eventType: event.eventType ?? null,
        status: CANONICAL_REPLAY_EXECUTOR_STATUSES.ERROR,
        reason: 'executor-action-failed',
        error: error instanceof Error ? error.message : String(error),
        dispatchedActions: actions.map((action) => action.type),
      });
      return createReplayResult(input, steps, context.currentState, 'executor-action-failed');
    }
  }

  return createReplayResult(input, steps, context.currentState);
}

function createReplayResult(input, steps, finalState, blockedReason = null) {
  const blockedStep = steps.find((step) => step.status !== CANONICAL_REPLAY_EXECUTOR_STATUSES.OK) ?? null;
  const status = blockedStep
    ? blockedStep.status
    : CANONICAL_REPLAY_EXECUTOR_STATUSES.OK;

  return {
    status,
    ok: status === CANONICAL_REPLAY_EXECUTOR_STATUSES.OK,
    replayRunId: getReplayRunId(input),
    reason: blockedReason,
    summary: {
      sourceEventCount: getReplayEvents(input).length,
      replayedEventCount: steps.filter((step) => step.status === CANONICAL_REPLAY_EXECUTOR_STATUSES.OK).length,
      dispatchedActionCount: steps.reduce((total, step) => total + step.dispatchedActions.length, 0),
    },
    steps,
    finalState,
  };
}