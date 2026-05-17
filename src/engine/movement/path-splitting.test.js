import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMovementPreview,
  createMovementSegment,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_PREVIEW_STATUSES,
} from './model.js';
import {
  evaluateZocTransitionsForMovementPreview,
  splitMovementPreviewIntoPathSamples,
  splitMovementSegmentIntoPoseSamples,
} from './path-splitting.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit',
    owner: overrides.owner ?? 'player-1',
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 10,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 1,
    rotationRadians: overrides.rotationRadians ?? 0,
  };
}

test('segment splitting returns deterministic interpolated samples including endpoints', () => {
  const segment = createMovementSegment({
    commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    unitId: 'test-unit-1',
    startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    endPose: { xUd: 10, yUd: 8, rotationRadians: 0 },
    distance: { requestedUd: 2, resolvedUd: 2, measurementMode: 'forward-axis' },
  });

  const samples = splitMovementSegmentIntoPoseSamples(segment, { samplesPerUd: 2 });

  assert.equal(samples.length, 5);
  assert.equal(samples[0].pose.yUd, 10);
  assert.equal(samples[samples.length - 1].pose.yUd, 8);
  assert.equal(Number(samples[2].pose.yUd.toFixed(3)), 9);
});

test('preview splitting chains segments and avoids duplicate starts after first segment', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [
      createMovementSegment({
        commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
        unitId: 'test-unit-1',
        startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
        endPose: { xUd: 10, yUd: 9, rotationRadians: 0 },
        distance: { requestedUd: 1, resolvedUd: 1, measurementMode: 'forward-axis' },
      }),
      createMovementSegment({
        commandId: MOVEMENT_COMMAND_IDS.WHEEL,
        unitId: 'test-unit-1',
        startPose: { xUd: 10, yUd: 9, rotationRadians: 0 },
        endPose: { xUd: 10.5, yUd: 8.5, rotationRadians: Math.PI / 2 },
        maneuver: { pivotSide: 'right', angleRadians: Math.PI / 2 },
        distance: { requestedUd: 1.5, resolvedUd: 1.5, measurementMode: 'p4-linear-90deg-equals-1.5ud' },
      }),
    ],
  });

  const samples = splitMovementPreviewIntoPathSamples(preview, { samplesPerUd: 2 });

  assert.ok(samples.length > 0);
  assert.equal(samples[0].pose.yUd, 10);
  const firstSegmentLast = samples.filter((sample) => sample.segmentIndex === 0).slice(-1)[0];
  const secondSegmentFirst = samples.find((sample) => sample.segmentIndex === 1);
  assert.notEqual(firstSegmentLast.pose.yUd, secondSegmentFirst.pose.yUd);
  assert.ok(secondSegmentFirst.ratio > 0);
});

test('zoc transition analysis reports entering enemy zoc during an advance path', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [
      createMovementSegment({
        commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
        unitId: 'test-unit-1',
        startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
        endPose: { xUd: 10, yUd: 6, rotationRadians: 0 },
        distance: { requestedUd: 4, resolvedUd: 4, measurementMode: 'forward-axis' },
      }),
    ],
  });
  const movingUnit = createUnit({ id: 'test-unit-1', owner: 'player-1', xUd: 10, yUd: 10 });
  const enemyUnits = [createUnit({ id: 'test-unit-2', owner: 'player-2', xUd: 10, yUd: 7 })];

  const analysis = evaluateZocTransitionsForMovementPreview({
    preview,
    movingUnit,
    enemyUnits,
    samplesPerUd: 4,
  });

  assert.equal(analysis.startsInEnemyZoc, false);
  assert.equal(analysis.encountersEnemyZoc, true);
  assert.ok(analysis.transitions.some((transition) => transition.fromInEnemyZoc === false && transition.toInEnemyZoc === true));
});
