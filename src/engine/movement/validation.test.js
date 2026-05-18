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

test('movement validation surfaces the conservative difficult manoeuvre note without blocking the current subset', () => {
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
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      troopType: 'cavalry',
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
        troopType: 'cavalry',
        xUd: 10,
        yUd: 10,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: 0,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.VALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'difficult-manoeuvre').status, 'verified');
  assert.match(snapshot.diagnostics.find((entry) => entry.id === 'difficult-manoeuvre').text, /does not classify this preview as a difficult manoeuvre/i);
});

test('movement validation blocks source-sensitive difficult manoeuvre cases for the current P6 subset', () => {
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
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      troopType: 'cavalry',
      isCataphract: true,
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
        troopType: 'cavalry',
        isCataphract: true,
        xUd: 10,
        yUd: 10,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: 0,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.INVALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'difficult-manoeuvre').status, 'blocked');
  assert.match(snapshot.diagnostics.find((entry) => entry.id === 'difficult-manoeuvre').text, /source-closed in P6/i);
});

test('movement validation blocks medium infantry previews that exceed the approved P6 subset budget', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 6.75, rotationRadians: 0 },
      distance: { requestedUd: 3.25, resolvedUd: 3.25, measurementMode: 'front-edge' },
    })],
  });

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      troopType: 'medium-infantry',
      widthUd: 1,
      depthUd: 1,
      xUd: 10,
      yUd: 10,
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
        troopType: 'medium-infantry',
        widthUd: 1,
        depthUd: 1,
        xUd: 10,
        yUd: 10,
        rotationRadians: 0,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.INVALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'movement-allowances').status, 'blocked');
  assert.match(snapshot.diagnostics.find((entry) => entry.id === 'movement-allowances').text, /exceeds the approved P6 subset budget of 3\.000 UD/i);
});

test('movement validation grants heavy infantry the operational-zone budget when it starts more than 4 UD from enemies', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 7.5, rotationRadians: 0 },
      distance: { requestedUd: 2.5, resolvedUd: 2.5, measurementMode: 'front-edge' },
    })],
  });

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      troopType: 'heavy-infantry',
      widthUd: 1,
      depthUd: 0.75,
      xUd: 10,
      yUd: 10,
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
        troopType: 'heavy-infantry',
        widthUd: 1,
        depthUd: 0.75,
        xUd: 10,
        yUd: 10,
        rotationRadians: 0,
      },
      {
        id: 'test-unit-2',
        owner: 'player-2',
        troopType: 'cavalry',
        widthUd: 1,
        depthUd: 0.75,
        xUd: 10,
        yUd: 4.5,
        rotationRadians: 0,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.VALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'movement-allowances').status, 'verified');
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'heavy-infantry-operational-zone').status, 'verified');
  assert.match(snapshot.diagnostics.find((entry) => entry.id === 'heavy-infantry-operational-zone').text, /grants the 3 UD operational-zone budget/i);
});

test('movement validation blocks heavy infantry previews beyond 2 UD when an enemy starts within 4 UD', () => {
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [createMovementSegment({
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      endPose: { xUd: 10, yUd: 7.75, rotationRadians: 0 },
      distance: { requestedUd: 2.25, resolvedUd: 2.25, measurementMode: 'front-edge' },
    })],
  });

  const snapshot = buildMovementValidationSnapshot({
    selectedUnit: {
      id: 'test-unit-1',
      owner: 'player-1',
      troopType: 'heavy-infantry',
      widthUd: 1,
      depthUd: 0.75,
      xUd: 10,
      yUd: 10,
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
        troopType: 'heavy-infantry',
        widthUd: 1,
        depthUd: 0.75,
        xUd: 10,
        yUd: 10,
        rotationRadians: 0,
      },
      {
        id: 'test-unit-2',
        owner: 'player-2',
        troopType: 'medium-infantry',
        widthUd: 1,
        depthUd: 1,
        xUd: 10,
        yUd: 5.8,
        rotationRadians: 0,
      },
    ],
  });

  assert.equal(snapshot.status, MOVEMENT_VALIDATION_STATUSES.INVALID);
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'movement-allowances').status, 'blocked');
  assert.equal(snapshot.diagnostics.find((entry) => entry.id === 'heavy-infantry-operational-zone').status, 'blocked');
  assert.match(snapshot.diagnostics.find((entry) => entry.id === 'heavy-infantry-operational-zone').text, /keeps the 2 UD budget/i);
});