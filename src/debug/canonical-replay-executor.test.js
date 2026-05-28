import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialAppState, reduceAppState } from '../state/p0-state.js';
import {
  CANONICAL_REPLAY_EXECUTOR_STATUSES,
  getReplayActionsForCanonicalEvent,
  replayCanonical,
} from './canonical-replay-executor.js';
import { buildReplayCheckpointFromState } from './replay-divergence.js';

function getUnit(state, unitId) {
  return state.game.units.find((unit) => unit.id === unitId) ?? null;
}

function usesPostActionCheckpoint(event) {
  return event?.eventType === 'commit-movement-segment'
    || event?.eventType === 'confirm-movement';
}

test('replayCanonical drives supported Charge Drill movement through existing reducer actions', () => {
  const unitId = 'charge-drill-p1-front-charger';
  let recordedState = createInitialAppState();
  const canonicalEvents = [];

  function recordCanonicalEvent(event) {
    const supportedEvent = {
      ...event,
      status: 'supported',
    };
    const replayActions = getReplayActionsForCanonicalEvent(supportedEvent);
    const checkpointBeforeActions = buildReplayCheckpointFromState(recordedState);

    replayActions.forEach((action) => {
      recordedState = reduceAppState(recordedState, action);
    });

    canonicalEvents.push({
      ...supportedEvent,
      checkpoint: usesPostActionCheckpoint(supportedEvent)
        ? buildReplayCheckpointFromState(recordedState)
        : checkpointBeforeActions,
    });
  }

  recordCanonicalEvent({
    sourceSequence: 1,
    sourceAction: 'start-charge-drill-battle',
    eventType: 'start-scenario',
    action: { type: 'game/start-charge-drill-battle', payload: { scenarioAction: 'start-charge-drill-battle' } },
  });
  recordCanonicalEvent({
    sourceSequence: 2,
    sourceAction: 'round-begin',
    eventType: 'round-begin',
    action: { type: 'round/begin', payload: {} },
  });
  recordCanonicalEvent({
    sourceSequence: 3,
    sourceAction: 'select-active-corps',
    eventType: 'select-active-corps',
    action: { type: 'game/select-active-corps', payload: { corpsId: 'corps-1' } },
  });
  recordCanonicalEvent({
    sourceSequence: 4,
    sourceAction: 'select-unit',
    eventType: 'select-unit',
    action: { type: 'game/select-unit', payload: { unitId: 'charge-drill-p1-front-charger' } },
  });
  recordCanonicalEvent({
    sourceSequence: 5,
    sourceAction: 'toggle-wheel-mode',
    eventType: 'toggle-movement-mode',
    action: { type: 'game/toggle-wheel-mode', payload: { mode: 'wheel' } },
  });
  recordCanonicalEvent({
    sourceSequence: 6,
    sourceAction: 'commit-wheel-drag-preview',
    eventType: 'commit-movement-segment',
    action: { type: 'game/replay-commit-movement-segment', payload: { scope: 'normal-movement', commandId: 'wheel', angleRadians: 0.12, pivotSide: 'left', distanceUd: 0.5521 } },
  });
  recordCanonicalEvent({
    sourceSequence: 7,
    sourceAction: 'toggle-advance-mode',
    eventType: 'toggle-movement-mode',
    action: { type: 'game/toggle-advance-mode', payload: { mode: 'advance' } },
  });
  recordCanonicalEvent({
    sourceSequence: 8,
    sourceAction: 'commit-advance-drag-preview',
    eventType: 'commit-movement-segment',
    action: { type: 'game/replay-commit-movement-segment', payload: { scope: 'normal-movement', commandId: 'advance', distanceUd: 1.3961 } },
  });
  recordCanonicalEvent({
    sourceSequence: 9,
    sourceAction: 'confirm-movement',
    eventType: 'confirm-movement',
    action: {
      type: 'game/confirm-movement',
      payload: {
        lastSegment: {
          commandId: 'advance',
        },
      },
    },
  });

  const canonicalReplay = {
    replayRunId: 'replay-supported-movement',
    events: canonicalEvents,
  };

  const result = replayCanonical(canonicalReplay, {
    initialState: createInitialAppState(),
    reduceState: reduceAppState,
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.summary.replayedEventCount, 9);
  assert.equal(result.summary.dispatchedActionCount, 9);
  assert.equal(result.steps.some((step) => step.dispatchedActions.includes('game/replay-commit-movement-segment')), false);

  const finalUnit = getUnit(result.finalState, unitId);
  assert.ok(finalUnit);
  assert.notEqual(finalUnit.xUd, 6);
  assert.notEqual(finalUnit.yUd, 18.25);
  assert.equal(finalUnit.rotationRadians, -0.12);
  assert.equal(result.finalState.game.selectedUnitId, unitId);
  assert.equal(result.finalState.game.movement.preview.status, 'idle');
});

test('getReplayActionsForCanonicalEvent maps slide commits to preview-only actions', () => {
  const actions = getReplayActionsForCanonicalEvent({
    status: 'supported',
    eventType: 'commit-movement-segment',
    action: {
      payload: {
        scope: 'normal-movement',
        commandId: 'slide',
        distanceUd: 0.4315,
        side: 'left',
      },
    },
  });

  assert.deepEqual(actions, [
    { type: 'game/set-slide-preview-distance', distanceUd: 0.4315, slideSide: 'left' },
  ]);
});

test('getReplayActionsForCanonicalEvent maps charge-start wheel commits to charge-start manoeuvre selection', () => {
  const actions = getReplayActionsForCanonicalEvent({
    status: 'supported',
    eventType: 'commit-movement-segment',
    action: {
      payload: {
        scope: 'charge-start',
        commandId: 'wheel',
        pivotSide: 'right',
        angleRadians: 0.5811,
      },
    },
  });

  assert.deepEqual(actions, [
    { type: 'game/select-charge-start-manoeuvre', manoeuvreType: 'wheel', pivotSide: 'right', angleRadians: 0.5811 },
  ]);
});

test('getReplayActionsForCanonicalEvent maps confirm-movement to the matching final movement confirm action', () => {
  const actions = getReplayActionsForCanonicalEvent({
    status: 'supported',
    eventType: 'confirm-movement',
    action: {
      payload: {
        lastSegment: {
          commandId: 'wheel',
        },
      },
    },
  });

  assert.deepEqual(actions, [
    { type: 'game/confirm-wheel' },
  ]);
});

test('getReplayActionsForCanonicalEvent maps confirm-movement to charge direction confirmation when charge preview is ready', () => {
  const actions = getReplayActionsForCanonicalEvent({
    status: 'supported',
    eventType: 'confirm-movement',
    action: {
      payload: {
        lastSegment: null,
      },
    },
  }, {
    game: {
      selectedUnitId: 'charger-1',
      chargePreview: {
        status: 'ready',
        intent: {
          unitId: 'charger-1',
        },
      },
    },
  });

  assert.deepEqual(actions, [
    { type: 'game/confirm-charge-direction' },
  ]);
});

test('getReplayActionsForCanonicalEvent falls back to the replay state for confirm-movement when the payload no longer carries the last segment', () => {
  const actions = getReplayActionsForCanonicalEvent({
    status: 'supported',
    eventType: 'confirm-movement',
    action: {
      payload: {
        lastSegment: null,
      },
    },
  }, {
    game: {
      movement: {
        selectedCommandId: 'slide',
        preview: {
          segments: [{
            commandId: 'slide',
          }],
        },
      },
    },
  });

  assert.deepEqual(actions, [
    { type: 'game/confirm-slide' },
  ]);
});

test('replayCanonical preserves secondary charge reaction dispatch semantics', () => {
  const dispatchedActions = [];
  const result = replayCanonical({
    replayRunId: 'replay-secondary-reaction',
    events: [
      {
        sourceSequence: 1,
        sourceAction: 'resolve-secondary-charge-reaction',
        status: 'supported',
        eventType: 'resolve-charge-reaction',
        action: {
          type: 'game/resolve-secondary-charge-reaction',
          payload: {
            decisionType: 'evade',
          },
        },
      },
    ],
  }, {
    dispatchAction: (action) => {
      dispatchedActions.push(action);
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(dispatchedActions, [
    { type: 'game/resolve-secondary-charge-reaction', decisionType: 'evade' },
  ]);
});

test('replayCanonical blocks unsupported canonical events without dispatching shortcuts', () => {
  const result = replayCanonical({
    replayRunId: 'replay-test-unsupported',
    events: [
      {
        sourceSequence: 1,
        sourceAction: 'unsupported-ui-only-action',
        status: 'unsupported',
        eventType: null,
      },
    ],
  }, {
    initialState: createInitialAppState(),
    reduceState: reduceAppState,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.BLOCKED);
  assert.equal(result.reason, 'unsupported-canonical-event');
  assert.deepEqual(result.steps[0].dispatchedActions, []);
});

test('replayCanonical reports drift on wheel angle mismatch', () => {
  const expectedCheckpoint = {
    selectedUnitId: 'unit-1',
    activePlayerId: 'player-1',
    activeCorpsId: 'corps-1',
    battlePhase: 'movement',
    chargeStatus: 'idle',
    chargeIntentUnitId: null,
    chargeTargetId: null,
    activeModalId: null,
    branchRollValue: null,
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.5521,
      lastSegment: {
        commandId: 'wheel',
        angleRadians: 0.12,
        pivotSide: 'left',
        side: null,
        distanceUd: 0.5521,
      },
    },
    chargeStartManoeuvre: null,
  };
  const currentCheckpoint = {
    ...expectedCheckpoint,
    movement: {
      ...expectedCheckpoint.movement,
      lastSegment: {
        ...expectedCheckpoint.movement.lastSegment,
        angleRadians: 0.22,
      },
    },
  };

  const result = replayCanonical({
    replayRunId: 'replay-drift-wheel',
    events: [{
      sourceSequence: 1,
      sourceAction: 'commit-wheel-drag-preview',
      status: 'supported',
      eventType: 'commit-movement-segment',
      action: {
        type: 'game/replay-commit-movement-segment',
        payload: {
          scope: 'normal-movement',
          commandId: 'wheel',
          angleRadians: 0.12,
          pivotSide: 'left',
          distanceUd: 0.5521,
        },
      },
      checkpoint: expectedCheckpoint,
    }],
  }, {
    dispatchAction: () => {},
    getReplayCheckpoint: () => currentCheckpoint,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.DRIFT);
  assert.equal(result.reason, 'semantic-checkpoint-drift');
  assert.equal(result.steps[0].comparisonPhase, 'post-action');
  assert.equal(result.steps[0].ownerClass, 'engine-movement-geometry');
  assert.equal(result.steps[0].mismatches[0].path, 'movement.lastSegment.angleRadians');
});

test('replayCanonical reports drift on slide side mismatch', () => {
  const expectedCheckpoint = {
    selectedUnitId: 'unit-1',
    activePlayerId: 'player-1',
    activeCorpsId: 'corps-1',
    battlePhase: 'movement',
    chargeStatus: 'idle',
    chargeIntentUnitId: null,
    chargeTargetId: null,
    activeModalId: null,
    branchRollValue: null,
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.4315,
      lastSegment: {
        commandId: 'slide',
        distanceUd: 0.4315,
        side: 'left',
      },
    },
    chargeStartManoeuvre: null,
  };
  const result = replayCanonical({
    replayRunId: 'replay-drift-slide-side',
    events: [{
      sourceSequence: 1,
      sourceAction: 'commit-slide-drag-preview',
      status: 'supported',
      eventType: 'commit-movement-segment',
      action: {
        type: 'game/replay-commit-movement-segment',
        payload: {
          scope: 'normal-movement',
          commandId: 'slide',
          distanceUd: 0.4315,
          side: 'left',
        },
      },
      checkpoint: expectedCheckpoint,
    }],
  }, {
    dispatchAction: () => {},
    getReplayCheckpoint: () => ({
      ...expectedCheckpoint,
      movement: {
        ...expectedCheckpoint.movement,
        lastSegment: {
          ...expectedCheckpoint.movement.lastSegment,
          side: 'right',
        },
      },
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.DRIFT);
  assert.equal(result.steps[0].comparisonPhase, 'post-action');
  assert.equal(result.steps[0].mismatches[0].path, 'movement.lastSegment.side');
});

test('replayCanonical compares confirm-movement against the post-action checkpoint', () => {
  const result = replayCanonical({
    replayRunId: 'replay-confirm-movement-post-checkpoint',
    events: [{
      sourceSequence: 1,
      sourceAction: 'confirm-movement',
      status: 'supported',
      eventType: 'confirm-movement',
      action: {
        type: 'game/confirm-movement',
        payload: {},
      },
      checkpoint: {
        selectedUnitId: 'unit-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'idle',
        chargeIntentUnitId: null,
        chargeTargetId: null,
        activeModalId: null,
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: null,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      },
    }],
  }, {
    dispatchAction: () => {},
    getReplayCheckpoint: () => ({
      selectedUnitId: 'unit-1',
      activePlayerId: 'player-1',
      activeCorpsId: 'corps-1',
      battlePhase: 'movement',
      chargeStatus: 'idle',
      chargeIntentUnitId: null,
      chargeTargetId: null,
      activeModalId: null,
      branchRollValue: null,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: null,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
});

test('replayCanonical uses getState fallback for confirm-movement in live dispatch mode', () => {
  const canonicalEvents = [];
  let recordedState = createInitialAppState();

  function recordCanonicalEvent(event) {
    const supportedEvent = {
      ...event,
      status: 'supported',
    };
    const replayActions = getReplayActionsForCanonicalEvent(supportedEvent, recordedState);
    const checkpointBeforeActions = buildReplayCheckpointFromState(recordedState);

    replayActions.forEach((action) => {
      recordedState = reduceAppState(recordedState, action);
    });

    canonicalEvents.push({
      ...supportedEvent,
      checkpoint: usesPostActionCheckpoint(supportedEvent)
        ? buildReplayCheckpointFromState(recordedState)
        : checkpointBeforeActions,
    });
  }

  recordCanonicalEvent({
    sourceSequence: 1,
    sourceAction: 'start-charge-drill-battle',
    eventType: 'start-scenario',
    action: { type: 'game/start-charge-drill-battle', payload: { scenarioAction: 'start-charge-drill-battle' } },
  });
  recordCanonicalEvent({
    sourceSequence: 2,
    sourceAction: 'round-begin',
    eventType: 'round-begin',
    action: { type: 'round/begin', payload: {} },
  });
  recordCanonicalEvent({
    sourceSequence: 3,
    sourceAction: 'select-active-corps',
    eventType: 'select-active-corps',
    action: { type: 'game/select-active-corps', payload: { corpsId: 'corps-1' } },
  });
  recordCanonicalEvent({
    sourceSequence: 4,
    sourceAction: 'select-unit',
    eventType: 'select-unit',
    action: { type: 'game/select-unit', payload: { unitId: 'charge-drill-p1-front-charger' } },
  });
  recordCanonicalEvent({
    sourceSequence: 5,
    sourceAction: 'toggle-wheel-mode',
    eventType: 'toggle-movement-mode',
    action: { type: 'game/toggle-wheel-mode', payload: { mode: 'wheel' } },
  });
  recordCanonicalEvent({
    sourceSequence: 6,
    sourceAction: 'commit-wheel-drag-preview',
    eventType: 'commit-movement-segment',
    action: {
      type: 'game/replay-commit-movement-segment',
      payload: { scope: 'normal-movement', commandId: 'wheel', angleRadians: 0.12, pivotSide: 'left', distanceUd: 0.5521 },
    },
  });
  recordCanonicalEvent({
    sourceSequence: 7,
    sourceAction: 'confirm-movement',
    eventType: 'confirm-movement',
    action: {
      type: 'game/confirm-movement',
      payload: { lastSegment: null },
    },
  });

  let currentState = createInitialAppState();
  const result = replayCanonical({
    replayRunId: 'replay-confirm-movement-live-dispatch-fallback',
    events: canonicalEvents,
  }, {
    dispatchAction: (action) => {
      currentState = reduceAppState(currentState, action);
    },
    getState: () => currentState,
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.steps.some((step) => step.sourceSequence === 7 && step.dispatchedActions.includes('game/confirm-wheel')), true);
});

test('replayCanonical reports drift on die roll mismatch', () => {
  let checkpointCallCount = 0;
  const result = replayCanonical({
    replayRunId: 'replay-drift-roll',
    events: [{
      sourceSequence: 1,
      sourceAction: 'resolve-charge-branch-distance',
      status: 'supported',
      eventType: 'resolve-charge-branch-distance',
      action: {
        type: 'game/resolve-charge-branch-distance',
        payload: { dieRoll: 6 },
      },
      checkpoint: {
        selectedUnitId: 'unit-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'reacting',
        chargeIntentUnitId: 'unit-1',
        chargeTargetId: 'unit-2',
        activeModalId: null,
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: null,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      },
    }],
  }, {
    dispatchAction: () => {},
    getReplayCheckpoint: () => {
      checkpointCallCount += 1;
      return {
        selectedUnitId: 'unit-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'reacting',
        chargeIntentUnitId: 'unit-1',
        chargeTargetId: 'unit-2',
        activeModalId: null,
        branchRollValue: checkpointCallCount === 1 ? null : 5,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: null,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      };
    },
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.DRIFT);
  assert.equal(result.steps[0].comparisonPhase, 'post-action');
  assert.equal(result.steps[0].mismatches[0].path, 'branchRollValue');
});

test('replayCanonical reports drift on active modal mismatch', () => {
  const result = replayCanonical({
    replayRunId: 'replay-drift-modal',
    events: [{
      sourceSequence: 1,
      sourceAction: 'round-begin',
      status: 'supported',
      eventType: 'round-begin',
      action: {
        type: 'round/begin',
        payload: {},
      },
      checkpoint: {
        selectedUnitId: null,
        activePlayerId: 'player-1',
        activeCorpsId: null,
        battlePhase: 'movement',
        chargeStatus: 'idle',
        chargeIntentUnitId: null,
        chargeTargetId: null,
        activeModalId: 'corps-selection',
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: null,
          lastSegment: null,
        },
      },
    }],
  }, {
    dispatchAction: () => {},
    getReplayCheckpoint: () => ({
      selectedUnitId: null,
      activePlayerId: 'player-1',
      activeCorpsId: null,
      battlePhase: 'movement',
      chargeStatus: 'idle',
      chargeIntentUnitId: null,
      chargeTargetId: null,
      activeModalId: null,
      branchRollValue: null,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: null,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.DRIFT);
  assert.equal(result.steps[0].ownerClass, 'ui-selector-hitbox');
  assert.equal(result.steps[0].mismatches[0].path, 'activeModalId');
});

test('replayCanonical defers round-begin modal precheck drift when only the dialog render lags', () => {
  const dispatchedActions = [];
  const result = replayCanonical({
    replayRunId: 'replay-round-begin-modal-lag',
    events: [{
      sourceSequence: 1,
      sourceAction: 'round-begin',
      status: 'supported',
      eventType: 'round-begin',
      action: {
        type: 'round/begin',
        payload: {},
      },
      checkpoint: {
        selectedUnitId: null,
        activePlayerId: 'player-1',
        activeCorpsId: null,
        battlePhase: 'movement',
        chargeStatus: 'idle',
        chargeIntentUnitId: null,
        chargeTargetId: null,
        activeModalId: 'round-begin',
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: null,
          lastSegment: null,
        },
      },
    }],
  }, {
    dispatchAction: (action) => {
      dispatchedActions.push(action);
    },
    getReplayCheckpoint: () => ({
      selectedUnitId: null,
      activePlayerId: 'player-1',
      activeCorpsId: null,
      battlePhase: 'movement',
      chargeStatus: 'idle',
      chargeIntentUnitId: null,
      chargeTargetId: null,
      activeModalId: null,
      branchRollValue: null,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: null,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(dispatchedActions, [
    { type: 'round/begin' },
  ]);
});

test('replayCanonical defers corps-selection modal precheck drift when only the startup dialog render lags', () => {
  const dispatchedActions = [];
  const result = replayCanonical({
    replayRunId: 'replay-corps-selection-modal-lag',
    events: [{
      sourceSequence: 1,
      sourceAction: 'select-active-corps',
      status: 'supported',
      eventType: 'select-active-corps',
      action: {
        type: 'game/select-active-corps',
        payload: { corpsId: 'corps-1' },
      },
      checkpoint: {
        selectedUnitId: null,
        activePlayerId: 'player-1',
        activeCorpsId: null,
        battlePhase: 'movement',
        chargeStatus: 'idle',
        chargeIntentUnitId: null,
        chargeTargetId: null,
        activeModalId: 'round-corps-selection',
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: null,
          lastSegment: null,
        },
      },
    }],
  }, {
    dispatchAction: (action) => {
      dispatchedActions.push(action);
    },
    getReplayCheckpoint: () => ({
      selectedUnitId: null,
      activePlayerId: 'player-1',
      activeCorpsId: null,
      battlePhase: 'movement',
      chargeStatus: 'idle',
      chargeIntentUnitId: null,
      chargeTargetId: null,
      activeModalId: null,
      branchRollValue: null,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: null,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(dispatchedActions, [
    { type: 'game/select-active-corps', corpsId: 'corps-1' },
  ]);
});

test('replayCanonical defers charge reaction modal post-check drift when only the dialog render lags', () => {
  let currentState = {
    game: {
      selectedUnitId: 'charger-1',
      chargePreview: {
        status: 'ready',
        intent: {
          unitId: 'charger-1',
        },
      },
    },
  };

  const result = replayCanonical({
    replayRunId: 'replay-charge-reaction-modal-lag',
    events: [{
      sourceSequence: 1,
      sourceAction: 'confirm-movement',
      status: 'supported',
      eventType: 'confirm-movement',
      action: {
        type: 'game/confirm-movement',
        payload: {
          lastSegment: null,
        },
      },
      checkpoint: {
        selectedUnitId: 'charger-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'reaction-pending',
        chargeIntentUnitId: 'charger-1',
        chargeTargetId: 'target-1',
        activeModalId: 'charge-reaction',
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: 0,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      },
    }],
  }, {
    dispatchAction: () => {
      currentState = {
        game: {
          selectedUnitId: 'charger-1',
          chargePreview: {
            status: 'reaction-pending',
            intent: {
              unitId: 'charger-1',
              targetUnitId: 'target-1',
            },
          },
        },
      };
    },
    getState: () => currentState,
    getReplayCheckpoint: () => ({
      selectedUnitId: 'charger-1',
      activePlayerId: 'player-1',
      activeCorpsId: 'corps-1',
      battlePhase: 'movement',
      chargeStatus: 'reaction-pending',
      chargeIntentUnitId: 'charger-1',
      chargeTargetId: 'target-1',
      activeModalId: null,
      branchRollValue: null,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: 0,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(result.steps[0].dispatchedActions, [
    'game/confirm-charge-direction',
  ]);
});

test('replayCanonical defers charge reaction modal precheck drift when only the dialog render lags', () => {
  const dispatchedActions = [];
  const result = replayCanonical({
    replayRunId: 'replay-charge-reaction-precheck-modal-lag',
    events: [{
      sourceSequence: 1,
      sourceAction: 'resolve-charge-reaction',
      status: 'supported',
      eventType: 'resolve-charge-reaction',
      action: {
        type: 'game/resolve-charge-reaction',
        payload: { decisionType: 'evade' },
      },
      checkpoint: {
        selectedUnitId: 'charger-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'reaction-pending',
        chargeIntentUnitId: 'charger-1',
        chargeTargetId: 'target-1',
        activeModalId: 'charge-reaction',
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: 0,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      },
    }],
  }, {
    dispatchAction: (action) => {
      dispatchedActions.push(action);
    },
    getReplayCheckpoint: () => ({
      selectedUnitId: 'charger-1',
      activePlayerId: 'player-1',
      activeCorpsId: 'corps-1',
      battlePhase: 'movement',
      chargeStatus: 'reaction-pending',
      chargeIntentUnitId: 'charger-1',
      chargeTargetId: 'target-1',
      activeModalId: null,
      branchRollValue: null,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: 0,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(dispatchedActions, [
    { type: 'game/resolve-charge-reaction', decisionType: 'evade' },
  ]);
});

test('replayCanonical defers charge branch distance modal precheck drift when only the dialog render lags', () => {
  const dispatchedActions = [];
  let currentCheckpoint = {
    selectedUnitId: 'charger-1',
    activePlayerId: 'player-1',
    activeCorpsId: 'corps-1',
    battlePhase: 'movement',
    chargeStatus: 'evade-required',
    chargeIntentUnitId: 'charger-1',
    chargeTargetId: 'target-1',
    activeModalId: null,
    branchRollValue: null,
    movement: {
      previewSegmentCount: 0,
      totalDistanceUd: 0,
      lastSegment: null,
    },
    chargeStartManoeuvre: null,
  };
  const result = replayCanonical({
    replayRunId: 'replay-charge-branch-distance-modal-lag',
    events: [{
      sourceSequence: 1,
      sourceAction: 'resolve-charge-branch-distance',
      status: 'supported',
      eventType: 'resolve-charge-branch-distance',
      action: {
        type: 'game/resolve-charge-branch-distance',
        payload: { dieRoll: 4 },
      },
      checkpoint: {
        selectedUnitId: 'charger-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'evade-required',
        chargeIntentUnitId: 'charger-1',
        chargeTargetId: 'target-1',
        activeModalId: 'charge-branch-distance',
        branchRollValue: null,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: 0,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      },
    }],
  }, {
    dispatchAction: (action) => {
      dispatchedActions.push(action);
      currentCheckpoint = {
        ...currentCheckpoint,
        branchRollValue: action.dieRoll,
      };
    },
    getReplayCheckpoint: () => currentCheckpoint,
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(dispatchedActions, [
    { type: 'game/resolve-charge-branch-distance', dieRoll: 4 },
  ]);
});

test('replayCanonical defers evade choice handoff modal precheck drift when only the dialog render lags', () => {
  const dispatchedActions = [];
  const result = replayCanonical({
    replayRunId: 'replay-evade-choice-handoff-modal-lag',
    events: [{
      sourceSequence: 1,
      sourceAction: 'acknowledge-evade-choice-handoff',
      status: 'supported',
      eventType: 'acknowledge-evade-choice-handoff',
      action: {
        type: 'game/acknowledge-evade-choice-handoff',
        payload: {},
      },
      checkpoint: {
        selectedUnitId: 'charger-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'evade-required',
        chargeIntentUnitId: 'charger-1',
        chargeTargetId: 'target-1',
        activeModalId: 'evade-choice-handoff',
        branchRollValue: 6,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: 0,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      },
    }],
  }, {
    dispatchAction: (action) => {
      dispatchedActions.push(action);
    },
    getReplayCheckpoint: () => ({
      selectedUnitId: 'charger-1',
      activePlayerId: 'player-1',
      activeCorpsId: 'corps-1',
      battlePhase: 'movement',
      chargeStatus: 'evade-required',
      chargeIntentUnitId: 'charger-1',
      chargeTargetId: 'target-1',
      activeModalId: null,
      branchRollValue: 6,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: 0,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(dispatchedActions, [
    { type: 'game/acknowledge-evade-choice-handoff' },
  ]);
});

test('replayCanonical defers evade initial branch modal precheck drift when only the dialog render lags', () => {
  const dispatchedActions = [];
  const result = replayCanonical({
    replayRunId: 'replay-evade-initial-branch-modal-lag',
    events: [{
      sourceSequence: 1,
      sourceAction: 'select-evade-avoidance-choice',
      status: 'supported',
      eventType: 'select-evade-avoidance-choice',
      action: {
        type: 'game/select-evade-avoidance-choice',
        payload: {
          candidateId: 'candidate-1',
          side: 'left',
          distanceUd: 2,
        },
      },
      checkpoint: {
        selectedUnitId: 'charger-1',
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        battlePhase: 'movement',
        chargeStatus: 'evade-required',
        chargeIntentUnitId: 'charger-1',
        chargeTargetId: 'target-1',
        activeModalId: 'evade-initial-branch',
        branchRollValue: 6,
        movement: {
          previewSegmentCount: 0,
          totalDistanceUd: 0,
          lastSegment: null,
        },
        chargeStartManoeuvre: null,
      },
    }],
  }, {
    dispatchAction: (action) => {
      dispatchedActions.push(action);
    },
    getReplayCheckpoint: () => ({
      selectedUnitId: 'charger-1',
      activePlayerId: 'player-1',
      activeCorpsId: 'corps-1',
      battlePhase: 'movement',
      chargeStatus: 'evade-required',
      chargeIntentUnitId: 'charger-1',
      chargeTargetId: 'target-1',
      activeModalId: null,
      branchRollValue: 6,
      movement: {
        previewSegmentCount: 0,
        totalDistanceUd: 0,
        lastSegment: null,
      },
      chargeStartManoeuvre: null,
    }),
  });

  assert.equal(result.status, CANONICAL_REPLAY_EXECUTOR_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(dispatchedActions, [
    {
      type: 'game/select-evade-avoidance-choice',
      choice: {
        candidateId: 'candidate-1',
        side: 'left',
        distanceUd: 2,
      },
    },
  ]);
});