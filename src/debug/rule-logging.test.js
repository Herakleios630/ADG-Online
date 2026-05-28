import assert from 'node:assert/strict';
import test from 'node:test';
import { LOG_AREAS, LOG_LEVELS } from './debug-log-contract.js';
import { buildRuleLogEventsFromDebugState } from './rule-logging.js';

function createTraceState() {
  return {
    screen: 'battlefield',
    selectedUnitId: 'charger-1',
    activePlayerId: 'player-1',
    activeCorpsId: 'corps-1',
    battlePhase: 'charge',
    chargeStatus: 'evade-required',
    chargeIntentUnitId: 'charger-1',
    chargeTargetId: 'target-1',
    reactionDecision: 'evade',
    branchRollReason: 'evade-distance',
    branchRollValue: 6,
    evadePlanStatus: 'verified',
    evadeMoveStatus: 'choice-required',
    evadeMoveSourceStatus: 'verified',
    evadeChoiceRequired: true,
    evadeCandidateCount: 2,
    evadeChoicePathStepIds: ['wheel-left'],
    evadeDecisionTrace: [
      { stage: 'direct-blocker-clearance-check', blockerUnitIds: ['blocker-1'], isBlocked: false },
      { stage: 'solver-branch', branch: 'path-avoidance', candidateCount: 2 },
      {
        stage: 'selected-branch-analysis',
        selectedInitialBranch: 'branch-direction-wheel',
        solverBranch: 'path-avoidance',
        stageTimingsMs: { directionWheelMs: 14.5, pathAvoidanceMs: 38.2, totalSolveMs: 55.1 },
        candidateCounts: { currentOrientation: 1, directionWheel: 2, pathAvoidance: 2, playerFacingCandidates: 1 },
        selectedCandidateAnalysis: {
          branchKey: 'direction-wheel',
          firstLaterStepType: 'slide',
          firstLaterTriggerDistanceUd: 2.75,
          firstLaterAvailableDistanceUd: 3.5,
        },
      },
      {
        stage: 'resolution',
        selectedAvoidanceCandidateId: 'wheel-left',
        selectedAvoidanceType: 'wheel',
        resolvedEndPose: { xUd: 12, yUd: 9, rotationRadians: 1.57 },
      },
    ],
    contactEvents: [
      {
        type: 'target-contact',
        defenderId: 'target-1',
        selectedTargetId: 'target-1',
        classificationType: 'front',
        guideDistanceUd: 4.25,
      },
    ],
    contactDecisionTrace: [
      { stage: 'sample-contacts', candidateCount: 1 },
      { stage: 'return-terminal', clippedGuideDistanceUd: 4.25 },
    ],
    reactionRequests: [
      {
        unitId: 'target-1',
        type: 'may-evade',
        status: 'pending',
        contactEventIndex: 0,
        decisionTrace: [
          { stage: 'reaction-normalized', sourceStatus: 'capability-data' },
          { stage: 'reaction-resolved', resolvedType: 'may-evade', sourceStatus: 'capability-data' },
        ],
      },
    ],
    followThroughStatus: 'none',
    chargeStartManoeuvre: {
      type: 'wheel',
      pivotSide: 'right',
      wheelAngleRadians: Math.PI / 6,
      spentBudgetUd: 0.5,
    },
    movement: {
      selectedCommandId: null,
      wheelModeActive: false,
      previewStatus: 'idle',
      previewSegmentCount: 0,
    },
    unitCount: 20,
  };
}

test('buildRuleLogEventsFromDebugState creates area-tagged charge trace summaries', () => {
  const events = buildRuleLogEventsFromDebugState({
    kind: 'action-complete',
    action: { type: 'game/resolve-charge-branch-distance', unitId: 'charger-1', targetUnitId: 'target-1' },
    stateSummary: createTraceState(),
    metadata: { now: '2026-05-25T12:00:00.000Z', sessionId: 'session-1' },
  });

  assert.deepEqual(events.map((event) => event.area), [
    LOG_AREAS.CHARGE,
    LOG_AREAS.CONTACT,
    LOG_AREAS.REACTION,
    LOG_AREAS.EVADE,
    LOG_AREAS.MOVEMENT,
  ]);
  assert.equal(events.every((event) => event.level === LOG_LEVELS.DEBUG), true);
  assert.equal(events.find((event) => event.area === LOG_AREAS.CONTACT).decision.clippedGuideDistanceUd, 4.25);
  assert.equal(events.find((event) => event.area === LOG_AREAS.REACTION).decision.reactionRequests[0].type, 'may-evade');
  assert.equal(events.find((event) => event.area === LOG_AREAS.EVADE).decision.solverBranch, 'path-avoidance');
  assert.equal(events.find((event) => event.area === LOG_AREAS.EVADE).decision.selectedInitialBranch, 'branch-direction-wheel');
  assert.equal(events.find((event) => event.area === LOG_AREAS.EVADE).decision.selectedBranchAnalysis.selectedCandidateAnalysis.firstLaterStepType, 'slide');
  assert.equal(events.find((event) => event.area === LOG_AREAS.EVADE).decision.selectedAvoidanceCandidateId, 'wheel-left');
  assert.equal(events.find((event) => event.area === LOG_AREAS.CHARGE).decision.startManoeuvreType, 'wheel');
  assert.equal(events.find((event) => event.area === LOG_AREAS.CHARGE).decision.startWheelAngleRadians, Math.PI / 6);
  assert.equal(events.find((event) => event.area === LOG_AREAS.MOVEMENT).decision.chargeStartManoeuvre.pivotSide, 'right');
});

test('buildRuleLogEventsFromDebugState includes charge-start wheel preview in movement summaries', () => {
  const events = buildRuleLogEventsFromDebugState({
    kind: 'action-reduced',
    action: { type: 'game/preview-charge-start-manoeuvre', manoeuvreType: 'wheel', pivotSide: 'right', angleRadians: Math.PI / 6 },
    stateSummary: {
      screen: 'battlefield',
      selectedUnitId: 'unit-9',
      battlePhase: 'movement',
      chargeStatus: 'manoeuvre-selecting',
      chargeIntentUnitId: 'unit-9',
      chargeTargetId: 'unit-19',
      chargeStartManoeuvre: {
        type: 'wheel',
        pivotSide: 'right',
        wheelAngleRadians: Math.PI / 6,
        spentBudgetUd: 0.5,
      },
      movement: {
        selectedCommandId: null,
        wheelModeActive: false,
        wheelPivotSide: null,
        wheelPreviewAngleRadians: 0,
        previewStatus: 'idle',
        previewSegmentCount: 0,
        lastPreviewSegment: null,
        confirmationStatus: 'idle',
        validationStatus: 'idle',
      },
    },
    metadata: { now: '2026-05-25T12:00:00.000Z' },
  });

  assert.deepEqual(events.map((event) => event.area), [LOG_AREAS.CHARGE, LOG_AREAS.MOVEMENT]);
  assert.equal(events[1].decision.chargeStartManoeuvre.pivotSide, 'right');
  assert.equal(events[1].decision.chargeStartManoeuvre.wheelAngleRadians, Math.PI / 6);
});

test('buildRuleLogEventsFromDebugState includes movement event for wheel preview state', () => {
  const events = buildRuleLogEventsFromDebugState({
    kind: 'action-reduced',
    action: { type: 'game/set-wheel-preview-angle', unitId: 'unit-1', pivotSide: 'left', angleRadians: 0.5 },
    stateSummary: {
      screen: 'battlefield',
      selectedUnitId: 'unit-1',
      battlePhase: 'movement',
      chargeStatus: 'none',
      movement: {
        selectedCommandId: 'wheel',
        wheelModeActive: true,
        wheelPivotSide: 'left',
        wheelPreviewAngleRadians: 0.5,
        previewStatus: 'accepted',
        previewSegmentCount: 1,
        lastPreviewSegment: {
          commandId: 'wheel',
          endPose: { xUd: 10, yUd: 8, rotationRadians: 0.5 },
        },
      },
    },
    metadata: { now: '2026-05-25T12:00:00.000Z' },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].area, LOG_AREAS.MOVEMENT);
  assert.equal(events[0].eventType, 'movement.trace-summary');
  assert.equal(events[0].decision.lastPreviewSegment.endPose.rotationRadians, 0.5);
});

test('buildRuleLogEventsFromDebugState ignores non-action lifecycle entries', () => {
  assert.deepEqual(buildRuleLogEventsFromDebugState({
    kind: 'debug-session-start',
    stateSummary: createTraceState(),
  }), []);
});

test('buildRuleLogEventsFromDebugState does not emit charge summaries for idle non-charge actions', () => {
  assert.deepEqual(buildRuleLogEventsFromDebugState({
    kind: 'action-complete',
    action: { type: 'game/start-charge-drill-battle' },
    stateSummary: {
      screen: 'battlefield',
      selectedUnitId: null,
      battlePhase: 'command',
      chargeStatus: 'idle',
      movement: {
        selectedCommandId: null,
      },
    },
  }), []);
});