import test from 'node:test';
import assert from 'node:assert/strict';

import {
  rankEnemyZocThreatCandidates,
  selectMostThreateningEnemy,
  selectMostThreateningEnemyForUnit,
  MOST_THREATENING_STATUSES,
} from './most-threatening.js';

function createContact(overrides = {}) {
  const enemyUnitId = overrides.enemyUnitId ?? 'enemy-a';
  const frontOffsets = overrides.frontOffsets ?? [0.3];
  const lateralOffsets = overrides.lateralOffsets ?? [0.4];
  const localBounds = {
    minY: overrides.localBounds?.minY ?? 0.5,
    maxY: overrides.localBounds?.maxY ?? 1.5,
  };
  const sampledPoints = frontOffsets.map((frontOffset, index) => ({
    id: `sample-${index + 1}`,
    isInZoc: true,
    localPoint: {
      x: lateralOffsets[index] ?? lateralOffsets[lateralOffsets.length - 1] ?? 0,
      y: localBounds.minY + frontOffset,
    },
  }));

  return {
    enemyUnitId,
    targetUnitId: overrides.targetUnitId ?? 'target',
    sourceStatus: overrides.sourceStatus ?? 'needs-source-check',
    localBounds,
    sampledPoints,
    matchingPointIds: sampledPoints.map((sample) => sample.id),
    isInEnemyZoc: true,
  };
}

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit',
    owner: overrides.owner ?? 'player-1',
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 10,
    widthUd: overrides.widthUd ?? 2,
    depthUd: overrides.depthUd ?? 1,
    rotationRadians: overrides.rotationRadians ?? 0,
  };
}

test('ranking prefers nearest front distance first', () => {
  const candidates = rankEnemyZocThreatCandidates([
    createContact({ enemyUnitId: 'enemy-a', frontOffsets: [0.5], lateralOffsets: [0.2] }),
    createContact({ enemyUnitId: 'enemy-b', frontOffsets: [0.2], lateralOffsets: [0.8] }),
  ]);

  assert.deepEqual(candidates.map((candidate) => candidate.enemyUnitId), ['enemy-b', 'enemy-a']);
  assert.ok(Math.abs(candidates[0].metrics.nearestFrontDistanceUd - 0.2) <= 1e-9);
});

test('ranking uses coverage count when nearest front distance ties', () => {
  const candidates = rankEnemyZocThreatCandidates([
    createContact({ enemyUnitId: 'enemy-a', frontOffsets: [0.2], lateralOffsets: [0.4] }),
    createContact({ enemyUnitId: 'enemy-b', frontOffsets: [0.2, 0.2, 0.25], lateralOffsets: [0.3, 0.2, 0.1] }),
  ]);

  assert.deepEqual(candidates.map((candidate) => candidate.enemyUnitId), ['enemy-b', 'enemy-a']);
  assert.equal(candidates[0].metrics.coverageCount, 3);
});

test('ranking uses lateral alignment when front distance and coverage tie', () => {
  const candidates = rankEnemyZocThreatCandidates([
    createContact({ enemyUnitId: 'enemy-a', frontOffsets: [0.2, 0.2], lateralOffsets: [0.4, 0.35] }),
    createContact({ enemyUnitId: 'enemy-b', frontOffsets: [0.2, 0.2], lateralOffsets: [0.1, 0.2] }),
  ]);

  assert.deepEqual(candidates.map((candidate) => candidate.enemyUnitId), ['enemy-b', 'enemy-a']);
  assert.equal(candidates[0].metrics.nearestLateralOffsetUd, 0.1);
});

test('selector flags unresolved rule reference when top candidates fully tie', () => {
  const selection = selectMostThreateningEnemy([
    createContact({ enemyUnitId: 'enemy-a', frontOffsets: [0.2], lateralOffsets: [0.4] }),
    createContact({ enemyUnitId: 'enemy-b', frontOffsets: [0.2], lateralOffsets: [0.4] }),
  ]);

  assert.equal(selection.status, MOST_THREATENING_STATUSES.SELECTED);
  assert.equal(selection.mostThreateningEnemyId, 'enemy-a');
  assert.equal(selection.sourceStatus, 'needs-source-check');
  assert.ok(selection.unresolvedRuleRefs.includes('zoc.most-threatening-priority-and-tie-breaks'));
});

test('selector can derive most-threatening enemy from geometry-backed contacts', () => {
  const target = createUnit({ id: 'target', owner: 'player-1', xUd: 10, yUd: 8.8, widthUd: 2, depthUd: 1 });
  const enemies = [
    createUnit({ id: 'enemy-far', owner: 'player-2', xUd: 10, yUd: 10.4, widthUd: 2, depthUd: 1 }),
    createUnit({ id: 'enemy-near', owner: 'player-2', xUd: 10, yUd: 9.9, widthUd: 2, depthUd: 1 }),
  ];

  const selection = selectMostThreateningEnemyForUnit(enemies, target);

  assert.equal(selection.status, MOST_THREATENING_STATUSES.SELECTED);
  assert.equal(selection.targetUnitId, 'target');
  assert.equal(selection.mostThreateningEnemyId, 'enemy-near');
  assert.ok(selection.zocContacts.length >= 1);
});

test('selector reports none when no enemy zoc contacts exist', () => {
  const selection = selectMostThreateningEnemyForUnit(
    [createUnit({ id: 'friendly', owner: 'player-1', xUd: 10, yUd: 10 })],
    createUnit({ id: 'target', owner: 'player-1', xUd: 10, yUd: 8 }),
  );

  assert.equal(selection.status, MOST_THREATENING_STATUSES.NONE);
  assert.equal(selection.mostThreateningEnemyId, null);
  assert.equal(selection.candidates.length, 0);
});

test('selector prefers center enemy in a left-center-right support cluster', () => {
  const target = createUnit({ id: 'target', owner: 'player-1', xUd: 10, yUd: 4.4, widthUd: 1, depthUd: 1, rotationRadians: 0 });
  const enemies = [
    createUnit({ id: 'enemy-left', owner: 'player-2', xUd: 9, yUd: 3, widthUd: 1, depthUd: 1, rotationRadians: Math.PI }),
    createUnit({ id: 'enemy-center', owner: 'player-2', xUd: 10, yUd: 3, widthUd: 1, depthUd: 1, rotationRadians: Math.PI }),
    createUnit({ id: 'enemy-right', owner: 'player-2', xUd: 11, yUd: 3, widthUd: 1, depthUd: 1, rotationRadians: Math.PI }),
  ];

  const selection = selectMostThreateningEnemyForUnit(enemies, target);

  assert.equal(selection.status, MOST_THREATENING_STATUSES.SELECTED);
  assert.equal(selection.mostThreateningEnemyId, 'enemy-center');
  assert.ok(selection.candidates.length >= 2);
});