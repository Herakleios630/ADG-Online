import test from 'node:test';
import assert from 'node:assert/strict';

import { createShootingLosExampleScenario } from '../../data/shooting-drill-scenarios.js';
import {
  SHOOTING_LOS_REASON_CODES,
  SHOOTING_LOS_STATUSES,
  evaluateLineOfSight,
} from './line-of-sight.js';
import { SHOOTING_SOURCE_STATUSES } from './index.js';

function createRectangleUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit-1',
    xUd: Number(overrides.xUd ?? 10),
    yUd: Number(overrides.yUd ?? 10),
    widthUd: Number(overrides.widthUd ?? 1),
    depthUd: Number(overrides.depthUd ?? 1),
    rotationRadians: Number(overrides.rotationRadians ?? 0),
    baseShape: 'rectangle',
  };
}

function createCircleUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'circle-1',
    xUd: Number(overrides.xUd ?? 10),
    yUd: Number(overrides.yUd ?? 10),
    widthUd: Number(overrides.widthUd ?? 1),
    depthUd: Number(overrides.depthUd ?? overrides.widthUd ?? 1),
    rotationRadians: Number(overrides.rotationRadians ?? 0),
    baseShape: 'circle',
  };
}

test('P8-05 line of sight is visible when one target-edge point is clear from both shooting corners', () => {
  const result = evaluateLineOfSight({
    shooterUnit: createRectangleUnit({ id: 'shooter' }),
    targetUnit: createRectangleUnit({ id: 'target', xUd: 10, yUd: 7 }),
    blockerUnits: [],
  });

  assert.equal(result.status, SHOOTING_LOS_STATUSES.VISIBLE);
  assert.equal(result.hasLineOfSight, true);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_LOS_REASON_CODES.TARGET_POINT_VISIBLE);
});

test('P8-05 line of sight is blocked when another unit closes every current target-edge candidate', () => {
  const result = evaluateLineOfSight({
    shooterUnit: createRectangleUnit({ id: 'shooter' }),
    targetUnit: createRectangleUnit({ id: 'target', xUd: 10, yUd: 7 }),
    blockerUnits: [createRectangleUnit({ id: 'blocker', xUd: 10, yUd: 8.5, widthUd: 2.5, depthUd: 0.75 })],
  });

  assert.equal(result.status, SHOOTING_LOS_STATUSES.BLOCKED);
  assert.equal(result.hasLineOfSight, false);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_LOS_REASON_CODES.BLOCKED_BY_UNIT);
});

test('P8-05 line of sight can still see around a partial blocker to another target-edge point', () => {
  const result = evaluateLineOfSight({
    shooterUnit: createRectangleUnit({ id: 'shooter' }),
    targetUnit: createRectangleUnit({ id: 'target', xUd: 10, yUd: 7, widthUd: 2 }),
    blockerUnits: [createCircleUnit({ id: 'blocker', xUd: 9.25, yUd: 8.5, widthUd: 0.5 })],
  });

  assert.equal(result.status, SHOOTING_LOS_STATUSES.VISIBLE);
  assert.equal(result.hasLineOfSight, true);
});

test('P8-05 line of sight keeps terrain and ambush blockers source-open instead of pretending they are solved', () => {
  const result = evaluateLineOfSight({
    shooterUnit: createRectangleUnit({ id: 'shooter' }),
    targetUnit: createRectangleUnit({ id: 'target', xUd: 10, yUd: 7 }),
    blockerUnits: [],
    terrainBlockers: [{ id: 'wood-1' }],
    ambushBlocksSight: true,
  });

  assert.equal(result.status, SHOOTING_LOS_STATUSES.VISIBLE);
  assert.equal(result.hasLineOfSight, true);
  assert.equal(result.sourceStatus, SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_LOS_REASON_CODES.TERRAIN_BLOCKERS_DEFERRED), true);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_LOS_REASON_CODES.AMBUSH_BLOCKERS_DEFERRED), true);
});

test('P8-09 page 58 example keeps C1 blocked by B while A2 can still see C2', () => {
  const scenario = createShootingLosExampleScenario();
  const unitsByRole = new Map(scenario.units.map((unit) => [unit.scenarioRole, unit]));

  const a1ToC1 = evaluateLineOfSight({
    shooterUnit: unitsByRole.get('A1'),
    targetUnit: unitsByRole.get('C1'),
    blockerUnits: scenario.units,
  });
  const a2ToC1 = evaluateLineOfSight({
    shooterUnit: unitsByRole.get('A2'),
    targetUnit: unitsByRole.get('C1'),
    blockerUnits: scenario.units,
  });
  const a2ToC2 = evaluateLineOfSight({
    shooterUnit: unitsByRole.get('A2'),
    targetUnit: unitsByRole.get('C2'),
    blockerUnits: scenario.units,
  });

  assert.equal(a1ToC1.status, SHOOTING_LOS_STATUSES.BLOCKED);
  assert.equal(a1ToC1.hasLineOfSight, false);
  assert.equal(a1ToC1.diagnostics[0]?.code, SHOOTING_LOS_REASON_CODES.BLOCKED_BY_UNIT);

  assert.equal(a2ToC1.status, SHOOTING_LOS_STATUSES.BLOCKED);
  assert.equal(a2ToC1.hasLineOfSight, false);
  assert.equal(a2ToC1.diagnostics[0]?.code, SHOOTING_LOS_REASON_CODES.BLOCKED_BY_UNIT);

  assert.equal(a2ToC2.status, SHOOTING_LOS_STATUSES.VISIBLE);
  assert.equal(a2ToC2.hasLineOfSight, true);
  assert.equal(a2ToC2.diagnostics[0]?.code, SHOOTING_LOS_REASON_CODES.TARGET_POINT_VISIBLE);
});