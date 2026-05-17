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

test('movement validation can allow advance in enemy zoc when closing on most-threatening enemy without contact', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 8.1, rotationRadians: 0 },
      distance: { requestedUd: 1.9, resolvedUd: 1.9, measurementMode: 'forward-axis' },
    })],
  });

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      xUd: 10,
      yUd: 10,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
    },
    selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    preview,
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'movement',
      activeCorpsId: 'corps-1',
    },
    units: [
      {
        id: 'test-unit-1',
        owner: 'player-1',
        xUd: 10,
        yUd: 10,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: 0,
      },
      {
        id: 'test-unit-2',
        owner: 'player-2',
        xUd: 10,
        yUd: 7,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: Math.PI,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.VALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'zoc-subset-legality').status, 'verified');
  assert.equal(snapshot.zoc.contactMode, 'enters');
  assert.equal(snapshot.zoc.mostThreateningEnemyId, 'test-unit-2');
  assert.equal(snapshot.zoc.relaxationCandidate, true);
  assert.equal(snapshot.zoc.legalSubsetApplied, true);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'zoc-relaxation-candidate').status, 'needs-source-check');
});

test('movement validation blocks zoc-constrained advance when path would create contact with most-threatening enemy', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 7.6, rotationRadians: 0 },
      distance: { requestedUd: 2.4, resolvedUd: 2.4, measurementMode: 'forward-axis' },
    })],
  });

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      xUd: 10,
      yUd: 10,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
    },
    selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    preview,
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'movement',
      activeCorpsId: 'corps-1',
    },
    units: [
      {
        id: 'test-unit-1',
        owner: 'player-1',
        xUd: 10,
        yUd: 10,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: 0,
      },
      {
        id: 'test-unit-2',
        owner: 'player-2',
        xUd: 10,
        yUd: 7,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: Math.PI,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.INVALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'zoc-subset-legality').status, 'blocked');
  assert.equal(snapshot.zoc.relaxationCandidate, true);
  assert.equal(snapshot.zoc.legalSubsetApplied, false);
});

test('movement validation keeps zoc subset legality verified when no enemy zoc contact exists', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 9.5, rotationRadians: 0 },
      distance: { requestedUd: 0.5, resolvedUd: 0.5, measurementMode: 'forward-axis' },
    })],
  });

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      xUd: 10,
      yUd: 10,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
    },
    selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    preview,
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'movement',
      activeCorpsId: 'corps-1',
    },
    units: [
      {
        id: 'test-unit-1',
        owner: 'player-1',
        xUd: 10,
        yUd: 10,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: 0,
      },
      {
        id: 'test-unit-2',
        owner: 'player-2',
        xUd: 10,
        yUd: 7,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: 0,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.VALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'zoc-subset-legality').status, 'verified');
});