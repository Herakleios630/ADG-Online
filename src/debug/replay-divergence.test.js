import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReplayCheckpointFromState,
  compareReplayCheckpoints,
} from './replay-divergence.js';

function createState(overrides = {}) {
  return {
    shell: {
      currentScreen: 'battlefield',
      ...(overrides.shell ?? {}),
    },
    game: {
      selectedUnitId: 'unit-1',
      commandContext: {
        activePlayerId: 'player-1',
        activeCorpsId: 'corps-1',
        currentPhaseId: 'movement',
        ...(overrides.game?.commandContext ?? {}),
      },
      chargePreview: {
        status: 'idle',
        intent: {
          unitId: null,
          targetUnitId: null,
          startManoeuvre: null,
          ...(overrides.game?.chargePreview?.intent ?? {}),
        },
        branchDistanceRoll: {
          claim: null,
          result: null,
          ...(overrides.game?.chargePreview?.branchDistanceRoll ?? {}),
        },
        ...(overrides.game?.chargePreview ?? {}),
      },
      movement: {
        preview: {
          segments: [],
          ...(overrides.game?.movement?.preview ?? {}),
        },
        ...(overrides.game?.movement ?? {}),
      },
      ...(overrides.game ?? {}),
    },
  };
}

test('buildReplayCheckpointFromState captures bounded semantic replay facts', () => {
  const checkpoint = buildReplayCheckpointFromState(createState({
    game: {
      chargePreview: {
        status: 'targeting',
        intent: {
          unitId: 'unit-1',
          targetUnitId: 'unit-2',
        },
        branchDistanceRoll: {
          result: { rawRoll: 6 },
        },
      },
      movement: {
        preview: {
          segments: [{
            commandId: 'wheel',
            maneuver: { angleRadians: 0.12, pivotSide: 'left' },
            distance: { resolvedUd: 0.5521 },
          }],
        },
      },
    },
  }), {
    getActiveModalId: () => 'charge-reaction-dialog',
  });

  assert.equal(checkpoint.chargeStatus, 'targeting');
  assert.equal(checkpoint.branchRollValue, 6);
  assert.equal(checkpoint.activeModalId, 'charge-reaction-dialog');
  assert.equal(checkpoint.movement.previewSegmentCount, 1);
  assert.equal(checkpoint.movement.lastSegment.angleRadians, 0.12);
});

test('buildReplayCheckpointFromState reads branch roll values from dieRoll when rawRoll is absent', () => {
  const checkpoint = buildReplayCheckpointFromState(createState({
    game: {
      chargePreview: {
        branchDistanceRoll: {
          result: { dieRoll: 6 },
        },
      },
    },
  }));

  assert.equal(checkpoint.branchRollValue, 6);
});

test('buildReplayCheckpointFromState derives slide side from the engine measurement mode', () => {
  const checkpoint = buildReplayCheckpointFromState(createState({
    game: {
      movement: {
        preview: {
          segments: [{
            commandId: 'slide',
            distance: {
              resolvedUd: 0.7399,
              measurementMode: 'left-flank-offset',
            },
          }],
        },
      },
    },
  }));

  assert.equal(checkpoint.movement.lastSegment.side, 'left');
});

test('buildReplayCheckpointFromState normalizes the empty charge-start manoeuvre sentinel to null', () => {
  const checkpoint = buildReplayCheckpointFromState(createState({
    game: {
      chargePreview: {
        intent: {
          startManoeuvre: {
            type: 'none',
            pivotSide: null,
            wheelAngleRadians: 0,
            slideSide: null,
            slideDistanceUd: 0,
            spentBudgetUd: 0,
          },
        },
      },
    },
  }));

  assert.equal(checkpoint.chargeStartManoeuvre, null);
});

test('compareReplayCheckpoints reports first-class bounded movement drift', () => {
  const comparison = compareReplayCheckpoints({
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.5521,
      lastSegment: {
        commandId: 'wheel',
        angleRadians: 0.12,
        pivotSide: 'left',
      },
    },
  }, {
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.5521,
      lastSegment: {
        commandId: 'wheel',
        angleRadians: 0.22,
        pivotSide: 'left',
      },
    },
  });

  assert.equal(comparison.ok, false);
  assert.equal(comparison.ownerClass, 'engine-movement-geometry');
  assert.equal(comparison.mismatches[0].path, 'movement.lastSegment.angleRadians');
});

test('compareReplayCheckpoints tolerates a single bounded rounding step on movement distances', () => {
  const comparison = compareReplayCheckpoints({
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.4372,
      lastSegment: {
        commandId: 'wheel',
        distanceUd: 0.4372,
        angleRadians: 0.4579,
        pivotSide: 'right',
      },
    },
  }, {
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.4373,
      lastSegment: {
        commandId: 'wheel',
        distanceUd: 0.4373,
        angleRadians: 0.4579,
        pivotSide: 'right',
      },
    },
  });

  assert.equal(comparison.ok, true);
  assert.deepEqual(comparison.mismatches, []);
});

test('compareReplayCheckpoints still reports larger movement distance drift', () => {
  const comparison = compareReplayCheckpoints({
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.4372,
      lastSegment: {
        commandId: 'wheel',
        distanceUd: 0.4372,
        angleRadians: 0.4579,
        pivotSide: 'right',
      },
    },
  }, {
    movement: {
      previewSegmentCount: 1,
      totalDistanceUd: 0.4374,
      lastSegment: {
        commandId: 'wheel',
        distanceUd: 0.4374,
        angleRadians: 0.4579,
        pivotSide: 'right',
      },
    },
  });

  assert.equal(comparison.ok, false);
  assert.equal(comparison.ownerClass, 'engine-movement-geometry');
  assert.deepEqual(comparison.mismatches.map((mismatch) => mismatch.path), [
    'movement.totalDistanceUd',
    'movement.lastSegment.distanceUd',
  ]);
});

test('compareReplayCheckpoints classifies active modal drift as ui-selector-hitbox', () => {
  const comparison = compareReplayCheckpoints({ activeModalId: 'round-dialog' }, { activeModalId: null });

  assert.equal(comparison.ok, false);
  assert.equal(comparison.ownerClass, 'ui-selector-hitbox');
  assert.equal(comparison.mismatches[0].path, 'activeModalId');
});