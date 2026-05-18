import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyCurrentMovementManoeuvre, DIFFICULT_MANOEUVRE_RESULTS } from './manoeuvre-classification.js';
import { createMovementPreview, createMovementSegment, MOVEMENT_COMMAND_IDS, MOVEMENT_PREVIEW_STATUSES } from './model.js';

test('difficult manoeuvre classifier stays conservative for the current P6 subset movement commands', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 9, rotationRadians: 0 },
      distance: { requestedUd: 1, resolvedUd: 1, measurementMode: 'front-edge' },
    })],
  });

  const classification = classifyCurrentMovementManoeuvre({
    selectedUnit: { id: 'test-unit-1', troopType: 'cavalry' },
    selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    preview,
  });

  assert.equal(classification.active, true);
  assert.equal(classification.result, DIFFICULT_MANOEUVRE_RESULTS.NO);
  assert.match(classification.text, /does not classify this preview as a difficult manoeuvre/i);
});

test('difficult manoeuvre classifier escalates special troop cases to needs-source-check', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 9, rotationRadians: 0 },
      distance: { requestedUd: 1, resolvedUd: 1, measurementMode: 'front-edge' },
    })],
  });

  const classification = classifyCurrentMovementManoeuvre({
    selectedUnit: { id: 'test-unit-1', troopType: 'heavy-infantry', isUnmanoeuvrable: true },
    selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    preview,
  });

  assert.equal(classification.active, true);
  assert.equal(classification.result, DIFFICULT_MANOEUVRE_RESULTS.NEEDS_SOURCE_CHECK);
  assert.deepEqual(classification.triggers, ['special-troop-trait']);
});

test('difficult manoeuvre classifier can carry an explicit preview marker forward for later CP integration', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.WHEEL,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 9, rotationRadians: 0.2 },
      maneuver: { pivotSide: 'left', angleRadians: 0.2 },
      distance: { requestedUd: 0.5, resolvedUd: 0.5, measurementMode: 'outer-corner' },
      diagnostics: [{ id: 'difficult-manoeuvre', message: 'future source-backed flag' }],
    })],
  });

  const classification = classifyCurrentMovementManoeuvre({
    selectedUnit: { id: 'test-unit-1', troopType: 'cavalry' },
    selectedCommandId: MOVEMENT_COMMAND_IDS.WHEEL,
    preview,
  });

  assert.equal(classification.result, DIFFICULT_MANOEUVRE_RESULTS.YES);
  assert.deepEqual(classification.triggers, ['explicit-preview-marker']);
});