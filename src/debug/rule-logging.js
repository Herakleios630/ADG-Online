import {
  LOG_AREAS,
  LOG_LEVELS,
  createRuleLogEvent,
} from './debug-log-contract.js';

function isActionComplete(kind) {
  return kind === 'action-complete' || kind === 'action-reduced';
}

function compactTrace(trace) {
  return Array.isArray(trace)
    ? trace.map((entry) => ({
      stage: entry?.stage ?? null,
      branch: entry?.branch ?? null,
      resolvedType: entry?.resolvedType ?? null,
      sourceStatus: entry?.sourceStatus ?? null,
      candidateCount: Number.isFinite(entry?.candidateCount) ? entry.candidateCount : null,
      selectedAvoidanceCandidateId: entry?.selectedAvoidanceCandidateId ?? null,
      clippedGuideDistanceUd: Number.isFinite(entry?.clippedGuideDistanceUd) ? entry.clippedGuideDistanceUd : null,
      diagnostics: Array.isArray(entry?.diagnostics) ? entry.diagnostics : [],
    }))
    : [];
}

function getUnitIds(...ids) {
  return Array.from(new Set(ids.flat().filter(Boolean)));
}

function getLastTraceStage(trace, stage) {
  return Array.isArray(trace) ? trace.findLast((entry) => entry?.stage === stage) ?? null : null;
}

function isChargeRuleAction(actionType) {
  const normalizedActionType = String(actionType ?? '').toLowerCase();
  return normalizedActionType.includes('charge') && !normalizedActionType.includes('charge-drill');
}

function buildChargeEvent({ action, stateSummary, metadata }) {
  const chargeStatus = stateSummary?.chargeStatus ?? 'none';
  const hasActiveChargeState = chargeStatus !== 'none' && chargeStatus !== 'idle';
  if (!hasActiveChargeState && !isChargeRuleAction(action?.type)) {
    return null;
  }

  return createRuleLogEvent({
    level: LOG_LEVELS.DEBUG,
    area: LOG_AREAS.CHARGE,
    eventType: 'charge.trace-summary',
    actionType: action?.type ?? null,
    phase: stateSummary?.battlePhase ?? null,
    unitIds: getUnitIds(stateSummary?.chargeIntentUnitId, stateSummary?.chargeTargetId),
    message: 'Charge debug state summarized from reducer/browser state.',
    decision: {
      chargeStatus: stateSummary?.chargeStatus ?? null,
      reactionDecision: stateSummary?.reactionDecision ?? null,
      branchRollReason: stateSummary?.branchRollReason ?? null,
      branchRollValue: stateSummary?.branchRollValue ?? null,
      followThroughStatus: stateSummary?.followThroughStatus ?? null,
      startManoeuvreType: stateSummary?.chargeStartManoeuvre?.type ?? null,
      startManoeuvrePivotSide: stateSummary?.chargeStartManoeuvre?.pivotSide ?? null,
      startWheelAngleRadians: stateSummary?.chargeStartManoeuvre?.wheelAngleRadians ?? null,
      startSlideSide: stateSummary?.chargeStartManoeuvre?.slideSide ?? null,
      startSlideDistanceUd: stateSummary?.chargeStartManoeuvre?.slideDistanceUd ?? null,
    },
    stateSummary,
  }, metadata);
}

function buildContactEvent({ action, stateSummary, metadata }) {
  const contactEvents = Array.isArray(stateSummary?.contactEvents) ? stateSummary.contactEvents : [];
  const contactDecisionTrace = Array.isArray(stateSummary?.contactDecisionTrace) ? stateSummary.contactDecisionTrace : [];
  if (contactEvents.length === 0 && contactDecisionTrace.length === 0) {
    return null;
  }

  const terminalTrace = getLastTraceStage(contactDecisionTrace, 'return-terminal')
    ?? getLastTraceStage(contactDecisionTrace, 'return-earlier-enemy-sequence')
    ?? getLastTraceStage(contactDecisionTrace, 'return-table-edge')
    ?? getLastTraceStage(contactDecisionTrace, 'return-no-contact');

  return createRuleLogEvent({
    level: LOG_LEVELS.DEBUG,
    area: LOG_AREAS.CONTACT,
    eventType: 'contact.trace-summary',
    actionType: action?.type ?? null,
    phase: stateSummary?.battlePhase ?? null,
    unitIds: getUnitIds(stateSummary?.chargeIntentUnitId, stateSummary?.chargeTargetId, contactEvents.map((event) => event.defenderId)),
    message: 'Charge contact trace summarized for target and secondary-contact debugging.',
    decision: {
      contactEvents,
      terminalStage: terminalTrace?.stage ?? null,
      clippedGuideDistanceUd: terminalTrace?.clippedGuideDistanceUd ?? null,
    },
    candidates: compactTrace(contactDecisionTrace),
    stateSummary,
  }, metadata);
}

function buildReactionEvent({ action, stateSummary, metadata }) {
  const reactionRequests = Array.isArray(stateSummary?.reactionRequests) ? stateSummary.reactionRequests : [];
  if (reactionRequests.length === 0) {
    return null;
  }

  return createRuleLogEvent({
    level: LOG_LEVELS.DEBUG,
    area: LOG_AREAS.REACTION,
    eventType: 'reaction.trace-summary',
    actionType: action?.type ?? null,
    phase: stateSummary?.battlePhase ?? null,
    unitIds: getUnitIds(stateSummary?.chargeIntentUnitId, reactionRequests.map((request) => request.unitId)),
    message: 'Charge reaction requests summarized with capability/profile decision traces.',
    decision: {
      reactionRequests: reactionRequests.map((request) => ({
        unitId: request.unitId,
        type: request.type,
        status: request.status,
        contactEventIndex: request.contactEventIndex,
        resolvedTrace: compactTrace(request.decisionTrace),
      })),
    },
    diagnostics: reactionRequests.flatMap((request) => compactTrace(request.decisionTrace).flatMap((entry) => entry.diagnostics ?? [])),
    stateSummary,
  }, metadata);
}

function buildEvadeEvent({ action, stateSummary, metadata }) {
  const evadeDecisionTrace = Array.isArray(stateSummary?.evadeDecisionTrace) ? stateSummary.evadeDecisionTrace : [];
  const evadeMoveStatus = stateSummary?.evadeMoveStatus ?? 'none';
  const hasEvadeState = evadeMoveStatus !== 'none'
    || stateSummary?.evadeChoiceRequired === true
    || Number(stateSummary?.evadeCandidateCount ?? 0) > 0
    || evadeDecisionTrace.length > 0;
  if (!hasEvadeState) {
    return null;
  }

  const solverBranch = getLastTraceStage(evadeDecisionTrace, 'solver-branch');
  const selectedBranchAnalysis = getLastTraceStage(evadeDecisionTrace, 'selected-branch-analysis');
  const resolution = getLastTraceStage(evadeDecisionTrace, 'resolution');

  return createRuleLogEvent({
    level: LOG_LEVELS.DEBUG,
    area: LOG_AREAS.EVADE,
    eventType: 'evade.trace-summary',
    actionType: action?.type ?? null,
    phase: stateSummary?.battlePhase ?? null,
    unitIds: getUnitIds(stateSummary?.chargeIntentUnitId, stateSummary?.chargeTargetId, stateSummary?.reactionRequests?.map((request) => request.unitId)),
    sourceStatus: stateSummary?.evadeMoveSourceStatus ?? stateSummary?.evadePlanStatus ?? null,
    message: 'Evade decision trace summarized for branch, blocker, candidate, and final-pose debugging.',
    decision: {
      evadeMoveStatus: stateSummary?.evadeMoveStatus ?? null,
      evadeMoveSourceStatus: stateSummary?.evadeMoveSourceStatus ?? null,
      evadePlanStatus: stateSummary?.evadePlanStatus ?? null,
      choiceRequired: Boolean(stateSummary?.evadeChoiceRequired),
      solverBranch: solverBranch?.branch ?? null,
      selectedInitialBranch: selectedBranchAnalysis?.selectedInitialBranch ?? null,
      selectedBranchAnalysis: selectedBranchAnalysis
        ? {
          solverBranch: selectedBranchAnalysis.solverBranch ?? null,
          stageTimingsMs: selectedBranchAnalysis.stageTimingsMs ?? {},
          candidateCounts: selectedBranchAnalysis.candidateCounts ?? {},
          selectedCandidateAnalysis: selectedBranchAnalysis.selectedCandidateAnalysis ?? null,
        }
        : null,
      candidateCount: stateSummary?.evadeCandidateCount ?? null,
      selectedAvoidanceCandidateId: resolution?.selectedAvoidanceCandidateId ?? null,
      selectedAvoidanceType: resolution?.selectedAvoidanceType ?? null,
      pathStepIds: stateSummary?.evadeChoicePathStepIds ?? [],
      tableExit: resolution?.tableExit ?? null,
      endHalfTurnHook: resolution?.endHalfTurnHook ?? null,
      resolvedEndPose: resolution?.resolvedEndPose ?? null,
    },
    candidates: compactTrace(evadeDecisionTrace),
    diagnostics: Array.isArray(resolution?.diagnostics) ? resolution.diagnostics : [],
    stateSummary,
  }, metadata);
}

function buildMovementEvent({ action, stateSummary, metadata }) {
  const actionType = String(action?.type ?? '').toLowerCase();
  const manoeuvreType = String(action?.manoeuvreType ?? stateSummary?.chargeStartManoeuvre?.type ?? '').toLowerCase();
  const isMovementAction = actionType.includes('movement')
    || actionType.includes('wheel')
    || actionType.includes('advance')
    || actionType.includes('slide')
    || manoeuvreType === 'wheel'
    || manoeuvreType === 'shift-slide';
  const movementSummary = stateSummary?.movement ?? null;
  if (!isMovementAction && !movementSummary?.selectedCommandId) {
    return null;
  }

  return createRuleLogEvent({
    level: LOG_LEVELS.DEBUG,
    area: LOG_AREAS.MOVEMENT,
    eventType: 'movement.trace-summary',
    actionType: action?.type ?? null,
    phase: stateSummary?.battlePhase ?? null,
    unitIds: getUnitIds(action?.unitId, stateSummary?.selectedUnitId),
    message: 'Movement preview state summarized for wheel and normalized-pose debugging.',
    input: {
      action,
    },
    decision: {
      ...movementSummary,
      chargeStartManoeuvre: stateSummary?.chargeStartManoeuvre ?? null,
    },
    stateSummary,
  }, metadata);
}

export function buildRuleLogEventsFromDebugState({ kind, action = null, stateSummary = null, metadata = {} } = {}) {
  if (!isActionComplete(kind) || !stateSummary) {
    return [];
  }

  return [
    buildChargeEvent({ action, stateSummary, metadata }),
    buildContactEvent({ action, stateSummary, metadata }),
    buildReactionEvent({ action, stateSummary, metadata }),
    buildEvadeEvent({ action, stateSummary, metadata }),
    buildMovementEvent({ action, stateSummary, metadata }),
  ].filter(Boolean);
}