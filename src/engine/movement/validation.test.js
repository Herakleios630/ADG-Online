import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMovementValidationSnapshot, MOVEMENT_VALIDATION_STATUSES } from './validation.js';
import { createMovementPreview, createMovementSegment, MOVEMENT_COMMAND_IDS, MOVEMENT_PREVIEW_STATUSES } from './model.js';

test('movement validation marks missing command context as placeholder while keeping geometry checks visible', () => {
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

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: { id: 'test-unit-1' },
    selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    preview,
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'movement',
      activeCorpsId: null,
    },
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.VALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'command-context').status, 'placeholder');
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'battlefield-bounds').status, 'verified');
});

test('movement validation marks battlefield bounds rejection as blocked', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.REJECTED,
    diagnostics: [{ id: 'battlefield-bounds', message: 'blocked' }],
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 1, yUd: 0.6, rotationRadians: 0 },
      endPose: { xUd: 1, yUd: -0.4, rotationRadians: 0 },
      distance: { requestedUd: 1, resolvedUd: 1, measurementMode: 'front-edge' },
    })],
  });

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: { id: 'test-unit-1' },
    selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    preview,
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'movement',
      activeCorpsId: 'player-1-corps-placeholder',
    },
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.INVALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'battlefield-bounds').status, 'blocked');
});