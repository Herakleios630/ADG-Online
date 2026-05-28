import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_REPLAY_EVENT_STATUSES,
  CANONICAL_REPLAY_EVENT_TYPES,
  CANONICAL_REPLAY_SCHEMA,
  projectBrowserReproEventToCanonicalReplay,
  projectBrowserReproEventsToCanonicalReplay,
} from './canonical-replay-contract.js';

function createBrowserReproEvent(overrides = {}) {
  return {
    timestamp: '2026-05-27T12:00:00.000Z',
    nowMs: 12.5,
    sequence: overrides.sequence ?? 1,
    kind: overrides.kind ?? 'button-click',
    action: overrides.action ?? 'round-begin',
    automationId: overrides.automationId ?? null,
    dataset: overrides.dataset ?? { action: overrides.action ?? 'round-begin' },
    activeModal: overrides.activeModal ?? null,
    state: {
      selectedUnitId: 'unit-9',
      activePlayerId: 'player-1',
      activeCorpsId: 'corps-1',
      battlePhase: 'movement',
      chargeStatus: 'idle',
      chargeIntentUnitId: null,
      chargeTargetId: null,
      ...(overrides.state ?? {}),
    },
    movement: overrides.movement ?? null,
    page: { href: 'http://127.0.0.1:4175/?recordClicks=1' },
  };
}

test('projectBrowserReproEventsToCanonicalReplay projects LOG-10 action flow with a replay correlation id', () => {
  const replay = projectBrowserReproEventsToCanonicalReplay([
    createBrowserReproEvent({ sequence: 1, action: 'start-charge-drill-battle', dataset: { action: 'start-charge-drill-battle' } }),
    createBrowserReproEvent({ sequence: 2, action: 'round-begin', dataset: { action: 'round-begin' } }),
    createBrowserReproEvent({ sequence: 3, action: 'select-active-corps', dataset: { action: 'select-active-corps', corpsId: 'corps-1' } }),
    createBrowserReproEvent({ sequence: 4, action: 'select-unit', dataset: { action: 'select-unit', unitId: 'unit-9' } }),
    createBrowserReproEvent({ sequence: 5, action: 'start-charge-preview', dataset: { action: 'start-charge-preview' } }),
    createBrowserReproEvent({ sequence: 6, action: 'set-charge-target', dataset: { action: 'set-charge-target', targetUnitId: 'unit-19' } }),
    createBrowserReproEvent({ sequence: 7, action: 'resolve-charge-reaction', dataset: { action: 'resolve-charge-reaction', decisionType: 'evade' } }),
    createBrowserReproEvent({ sequence: 8, action: 'resolve-charge-branch-distance', dataset: { action: 'resolve-charge-branch-distance', dieRoll: '6' } }),
    createBrowserReproEvent({ sequence: 9, action: 'acknowledge-evade-choice-handoff', dataset: { action: 'acknowledge-evade-choice-handoff' } }),
    createBrowserReproEvent({ sequence: 10, action: 'select-evade-avoidance-choice', dataset: { action: 'select-evade-avoidance-choice', candidateId: 'branch-direction-wheel' } }),
    createBrowserReproEvent({ sequence: 11, action: 'start-adjusted-charge-distance-roll', dataset: { action: 'start-adjusted-charge-distance-roll' } }),
    createBrowserReproEvent({ sequence: 12, action: 'resolve-charge-continuation-choice', dataset: { action: 'resolve-charge-continuation-choice', option: 'stop' } }),
  ], { replayRunId: 'run-1', generatedAt: '2026-05-27T12:00:01.000Z' });

  assert.equal(replay.schema, CANONICAL_REPLAY_SCHEMA);
  assert.equal(replay.replayRunId, 'run-1');
  assert.equal(replay.summary.supportedCount, 12);
  assert.equal(replay.summary.unsupportedCount, 0);
  assert.deepEqual(replay.events.map((event) => event.eventType), [
    CANONICAL_REPLAY_EVENT_TYPES.START_SCENARIO,
    CANONICAL_REPLAY_EVENT_TYPES.ROUND_BEGIN,
    CANONICAL_REPLAY_EVENT_TYPES.SELECT_ACTIVE_CORPS,
    CANONICAL_REPLAY_EVENT_TYPES.SELECT_UNIT,
    CANONICAL_REPLAY_EVENT_TYPES.START_CHARGE_PREVIEW,
    CANONICAL_REPLAY_EVENT_TYPES.SET_CHARGE_TARGET,
    CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_REACTION,
    CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    CANONICAL_REPLAY_EVENT_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF,
    CANONICAL_REPLAY_EVENT_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
    CANONICAL_REPLAY_EVENT_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL,
    CANONICAL_REPLAY_EVENT_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE,
  ]);
  assert.equal(replay.events[2].action.payload.corpsId, 'corps-1');
  assert.equal(replay.events[7].action.payload.dieRoll, 6);
  assert.equal(replay.events[9].action.payload.candidateId, 'branch-direction-wheel');
  assert.equal(replay.events[11].action.payload.option, 'stop');
});

test('projectBrowserReproEventToCanonicalReplay preserves semantic wheel, advance, and slide movement commits', () => {
  const wheel = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'commit-wheel-drag-preview',
    kind: 'wheel-action',
    dataset: { action: 'commit-wheel-drag-preview', unitId: 'unit-9', pivotSide: 'left' },
    movement: {
      selectedCommandId: 'wheel',
      previewStatus: 'accepted',
      previewSegmentCount: 1,
      totalDistanceUd: 0.6895,
      lastSegment: { commandId: 'wheel', distanceUd: 0.6895, angleRadians: 0.722, pivotSide: 'left', side: null },
    },
  }), { replayRunId: 'run-2' });
  const advance = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'commit-advance-drag-preview',
    dataset: { action: 'commit-advance-drag-preview', unitId: 'unit-9' },
    movement: {
      selectedCommandId: 'advance',
      previewStatus: 'accepted',
      previewSegmentCount: 2,
      totalDistanceUd: 2.0796,
      lastSegment: { commandId: 'advance', distanceUd: 1.3901, angleRadians: null, pivotSide: null, side: null },
    },
  }), { replayRunId: 'run-2' });
  const slide = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'commit-slide-drag-preview',
    kind: 'slide-action',
    dataset: { action: 'commit-slide-drag-preview', unitId: 'unit-9', side: 'LEFT' },
    movement: {
      selectedCommandId: 'slide',
      previewStatus: 'accepted',
      previewSegmentCount: 3,
      totalDistanceUd: 2.6626,
      lastSegment: { commandId: 'slide', distanceUd: 0.583, angleRadians: null, pivotSide: null, side: 'left' },
    },
  }), { replayRunId: 'run-2' });

  assert.equal(wheel.eventType, CANONICAL_REPLAY_EVENT_TYPES.COMMIT_MOVEMENT_SEGMENT);
  assert.equal(wheel.action.payload.commandId, 'wheel');
  assert.equal(wheel.action.payload.angleRadians, 0.722);
  assert.equal(wheel.action.payload.pivotSide, 'left');
  assert.equal(wheel.action.payload.scope, 'normal-movement');
  assert.equal(advance.action.payload.commandId, 'advance');
  assert.equal(advance.action.payload.distanceUd, 1.3901);
  assert.equal(slide.action.payload.commandId, 'slide');
  assert.equal(slide.action.payload.side, 'left');
});

test('projectBrowserReproEventToCanonicalReplay maps select-unit during charge targeting to set-charge-target', () => {
  const targetedSelection = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'select-unit',
    kind: 'unit-selection',
    dataset: { action: 'select-unit', unitId: 'enemy-2' },
    state: {
      selectedUnitId: 'charger-1',
      chargeStatus: 'targeting',
      chargeIntentUnitId: 'charger-1',
      chargeTargetId: null,
    },
  }), { replayRunId: 'run-charge-targeting' });

  assert.equal(targetedSelection.eventType, CANONICAL_REPLAY_EVENT_TYPES.SET_CHARGE_TARGET);
  assert.equal(targetedSelection.action.type, 'game/set-charge-target');
  assert.equal(targetedSelection.action.payload.targetUnitId, 'enemy-2');
});

test('projectBrowserReproEventToCanonicalReplay preserves semantic charge-start wheel commits for replay', () => {
  const chargeStart = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'commit-charge-wheel-drag-preview',
    kind: 'wheel-action',
    dataset: { action: 'commit-charge-wheel-drag-preview', unitId: 'unit-9', pivotSide: 'right' },
    movement: {
      selectedCommandId: null,
      previewStatus: 'idle',
      previewSegmentCount: 0,
      totalDistanceUd: null,
      lastSegment: null,
      chargeStart: { type: 'wheel', pivotSide: 'right', angleRadians: 0.5811, distanceUd: 0.5549 },
    },
  }), { replayRunId: 'run-2' });

  assert.equal(chargeStart.status, CANONICAL_REPLAY_EVENT_STATUSES.SUPPORTED);
  assert.equal(chargeStart.eventType, CANONICAL_REPLAY_EVENT_TYPES.COMMIT_MOVEMENT_SEGMENT);
  assert.equal(chargeStart.action.type, 'game/replay-commit-movement-segment');
  assert.equal(chargeStart.action.payload.scope, 'charge-start');
  assert.equal(chargeStart.action.payload.commandId, 'wheel');
  assert.equal(chargeStart.action.payload.pivotSide, 'right');
  assert.equal(chargeStart.action.payload.angleRadians, 0.5811);
  assert.equal(chargeStart.checkpoint.chargeStartManoeuvre.type, 'wheel');
  assert.equal(chargeStart.checkpoint.chargeStartManoeuvre.pivotSide, 'right');
  assert.equal(chargeStart.checkpoint.chargeStartManoeuvre.wheelAngleRadians, 0.5811);
  assert.equal(chargeStart.checkpoint.chargeStartManoeuvre.spentBudgetUd, 0.5549);
});

test('projectBrowserReproEventToCanonicalReplay normalizes zero-budget charge-start wheel checkpoints to null', () => {
  const chargeStart = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'toggle-wheel-mode',
    kind: 'wheel-action',
    dataset: { action: 'toggle-wheel-mode', unitId: 'unit-9' },
    state: {
      selectedUnitId: 'unit-9',
      chargeStatus: 'manoeuvre-selecting',
      chargeIntentUnitId: 'unit-9',
      chargeTargetId: 'enemy-2',
    },
    movement: {
      selectedCommandId: null,
      previewStatus: 'idle',
      previewSegmentCount: 0,
      totalDistanceUd: 0,
      lastSegment: null,
      chargeStart: { type: 'wheel', pivotSide: 'left', angleRadians: 0, distanceUd: 0 },
    },
  }), { replayRunId: 'run-zero-charge-start' });

  assert.equal(chargeStart.checkpoint.chargeStartManoeuvre, null);
});

test('projectBrowserReproEventToCanonicalReplay carries bounded branch roll values into checkpoints', () => {
  const handoff = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'acknowledge-evade-choice-handoff',
    dataset: { action: 'acknowledge-evade-choice-handoff' },
    state: {
      branchRollValue: 6,
      chargeStatus: 'evade-required',
    },
  }), { replayRunId: 'run-branch-roll-checkpoint' });

  assert.equal(handoff.checkpoint.branchRollValue, 6);
});

test('projectBrowserReproEventsToCanonicalReplay carries forward branch roll values for evade handoff checkpoints in older logs', () => {
  const replay = projectBrowserReproEventsToCanonicalReplay([
    createBrowserReproEvent({
      sequence: 1,
      action: 'resolve-charge-branch-distance',
      dataset: { action: 'resolve-charge-branch-distance', dieRoll: 6 },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: 6,
      },
    }),
    createBrowserReproEvent({
      sequence: 2,
      action: 'acknowledge-evade-choice-handoff',
      dataset: { action: 'acknowledge-evade-choice-handoff' },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: null,
      },
    }),
  ], { replayRunId: 'run-branch-roll-carry-forward' });

  assert.equal(replay.events[1].checkpoint.branchRollValue, 6);
});

test('projectBrowserReproEventsToCanonicalReplay carries forward branch roll values for evade choice checkpoints in older logs', () => {
  const replay = projectBrowserReproEventsToCanonicalReplay([
    createBrowserReproEvent({
      sequence: 1,
      action: 'resolve-charge-branch-distance',
      dataset: { action: 'resolve-charge-branch-distance', dieRoll: 6 },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: 6,
      },
    }),
    createBrowserReproEvent({
      sequence: 2,
      action: 'select-evade-avoidance-choice',
      dataset: { action: 'select-evade-avoidance-choice', candidateId: 'candidate-1' },
      activeModal: { id: 'evade-initial-branch' },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: null,
      },
    }),
  ], { replayRunId: 'run-evade-choice-branch-roll-carry-forward' });

  assert.equal(replay.events[1].checkpoint.branchRollValue, 6);
});

test('projectBrowserReproEventsToCanonicalReplay carries forward branch roll values for adjusted charge distance roll checkpoints in older logs', () => {
  const replay = projectBrowserReproEventsToCanonicalReplay([
    createBrowserReproEvent({
      sequence: 1,
      action: 'resolve-charge-branch-distance',
      dataset: { action: 'resolve-charge-branch-distance', dieRoll: 6 },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: 6,
      },
    }),
    createBrowserReproEvent({
      sequence: 2,
      action: 'start-adjusted-charge-distance-roll',
      dataset: { action: 'start-adjusted-charge-distance-roll' },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: null,
      },
    }),
  ], { replayRunId: 'run-adjusted-charge-roll-branch-roll-carry-forward' });

  assert.equal(replay.events[1].checkpoint.branchRollValue, 6);
});

test('projectBrowserReproEventsToCanonicalReplay carries forward branch roll values for charge continuation checkpoints in older logs', () => {
  const replay = projectBrowserReproEventsToCanonicalReplay([
    createBrowserReproEvent({
      sequence: 1,
      action: 'resolve-charge-branch-distance',
      dataset: { action: 'resolve-charge-branch-distance', dieRoll: 6 },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: 6,
      },
    }),
    createBrowserReproEvent({
      sequence: 2,
      action: 'resolve-charge-continuation-choice',
      dataset: { action: 'resolve-charge-continuation-choice', option: 'follow-through' },
      state: {
        chargeStatus: 'evade-required',
        branchRollValue: null,
      },
    }),
  ], { replayRunId: 'run-charge-continuation-branch-roll-carry-forward' });

  assert.equal(replay.events[1].checkpoint.branchRollValue, 6);
});

test('projectBrowserReproEventToCanonicalReplay keeps charge-start slide commits unsupported while bounded slide parameters are absent', () => {
  const chargeStart = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'commit-charge-slide-drag-preview',
    kind: 'slide-action',
    dataset: { action: 'commit-charge-slide-drag-preview', unitId: 'unit-9' },
    movement: {
      selectedCommandId: null,
      previewStatus: 'idle',
      previewSegmentCount: 0,
      totalDistanceUd: null,
      lastSegment: null,
      chargeStart: { type: 'shift-slide', pivotSide: null, angleRadians: null, distanceUd: null },
    },
  }), { replayRunId: 'run-2' });

  assert.equal(chargeStart.status, CANONICAL_REPLAY_EVENT_STATUSES.UNSUPPORTED);
  assert.equal(chargeStart.diagnostics[0].reason, 'charge-start-manoeuvre-not-supported');
});

test('projectBrowserReproEventToCanonicalReplay marks unsupported UI-only entries instead of faking replay', () => {
  const unsupported = projectBrowserReproEventToCanonicalReplay(createBrowserReproEvent({
    action: 'dismiss-setup-guide',
    dataset: { action: 'dismiss-setup-guide' },
  }), { replayRunId: 'run-3' });

  assert.equal(unsupported.status, CANONICAL_REPLAY_EVENT_STATUSES.UNSUPPORTED);
  assert.equal(unsupported.eventType, null);
  assert.equal(unsupported.action, null);
  assert.equal(unsupported.diagnostics[0].reason, 'unsupported-browser-repro-action');
  assert.equal(unsupported.checkpoint.selectedUnitId, 'unit-9');
});