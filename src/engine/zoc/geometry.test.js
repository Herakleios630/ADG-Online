import test from 'node:test';
import assert from 'node:assert/strict';

import { degreesToRadians } from '../geometry/index.js';
import {
  evaluatePointInEnemyFrontZoc,
  evaluateUnitFootprintInEnemyZoc,
  getEnemyZocBandLocalBounds,
  getEnemyZocContacts,
  ZOC_DEFAULT_FRONT_RANGE_UD,
} from './geometry.js';

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

test('enemy zoc local bounds derive from front edge and range', () => {
  const enemyUnit = createUnit({ id: 'enemy-a', widthUd: 4, depthUd: 2 });
  const zone = getEnemyZocBandLocalBounds(enemyUnit);

  assert.equal(zone.enemyUnitId, 'enemy-a');
  assert.equal(zone.rangeUd, ZOC_DEFAULT_FRONT_RANGE_UD);
  assert.equal(zone.localBounds.minX, -2);
  assert.equal(zone.localBounds.maxX, 2);
  assert.equal(zone.localBounds.minY, 1);
  assert.equal(zone.localBounds.maxY, 2);
  assert.equal(zone.sourceStatus, 'needs-source-check');
});

test('point evaluation detects direct front entry and excludes rear points', () => {
  const enemyUnit = createUnit({ id: 'enemy-a', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const frontPointResult = evaluatePointInEnemyFrontZoc(enemyUnit, { x: 10, y: 9 });
  const rearPointResult = evaluatePointInEnemyFrontZoc(enemyUnit, { x: 10, y: 11 });

  assert.equal(frontPointResult.isInZoc, true);
  assert.equal(frontPointResult.inXBand, true);
  assert.equal(frontPointResult.aheadOfFront, true);
  assert.equal(frontPointResult.withinRange, true);

  assert.equal(rearPointResult.isInZoc, false);
  assert.equal(rearPointResult.aheadOfFront, false);
});

test('footprint evaluation is footprint-aware and can detect corner entry with center outside band', () => {
  const enemyUnit = createUnit({ id: 'enemy-a', owner: 'player-2', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1 });
  const targetUnit = createUnit({
    id: 'target-a',
    owner: 'player-1',
    xUd: 11.7,
    yUd: 8.9,
    widthUd: 2,
    depthUd: 1,
    rotationRadians: degreesToRadians(0),
  });

  const result = evaluateUnitFootprintInEnemyZoc(enemyUnit, targetUnit);
  const centerSample = result.sampledPoints.find((sample) => sample.id === 'center');

  assert.ok(centerSample);
  assert.equal(centerSample.isInZoc, false);
  assert.equal(result.isInEnemyZoc, true);
  assert.ok(result.matchingPointIds.includes('front-left') || result.matchingPointIds.includes('rear-left'));
  assert.equal(result.exceptionHooks.sourceStatus, 'needs-source-check');
});

test('enemy zoc contacts filter same-owner units and return deterministic order', () => {
  const targetUnit = createUnit({ id: 'target-a', owner: 'player-1', xUd: 10, yUd: 9, widthUd: 2, depthUd: 1 });
  const enemyUnits = [
    createUnit({ id: 'enemy-b', owner: 'player-2', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1 }),
    createUnit({ id: 'enemy-a', owner: 'player-2', xUd: 10, yUd: 10.2, widthUd: 2, depthUd: 1 }),
    createUnit({ id: 'friendly', owner: 'player-1', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1 }),
  ];

  const contacts = getEnemyZocContacts(enemyUnits, targetUnit);

  assert.deepEqual(
    contacts.map((contact) => contact.enemyUnitId),
    ['enemy-a', 'enemy-b'],
  );
  assert.ok(contacts.every((contact) => contact.isInEnemyZoc));
});