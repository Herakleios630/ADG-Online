import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHOOTING_LOS_EXAMPLE_SCENARIO_ID,
  SHOOTING_LOS_EXAMPLE_SOURCE_ID,
  createShootingDrillScenario,
  createShootingLosExampleScenario,
} from './shooting-drill-scenarios.js';

test('shooting drill scenario includes mirrored shooting lanes, support pairs, and south-facing player-two shooters', () => {
  const scenario = createShootingDrillScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));

  assert.ok(unitsById.has('shooting-drill-p1-light-foot-support'));
  assert.ok(unitsById.has('shooting-drill-p2-light-foot-shooter'));
  assert.ok(unitsById.has('shooting-drill-p2-light-foot-support'));
  assert.ok(unitsById.has('shooting-drill-p2-mounted-bow-shooter'));
  assert.ok(unitsById.has('shooting-drill-p1-front-target'));
  assert.ok(unitsById.has('shooting-drill-p1-mounted-bow-alt-target'));
  assert.ok(unitsById.has('shooting-drill-p2-alt-target'));

  assert.equal(unitsById.get('shooting-drill-p2-light-foot-shooter')?.facing, 'south');
  assert.equal(unitsById.get('shooting-drill-p2-light-foot-shooter')?.rotationRadians, Math.PI);
  assert.equal(unitsById.get('shooting-drill-p2-light-foot-support')?.facing, 'south');
  assert.equal(unitsById.get('shooting-drill-p2-mounted-bow-shooter')?.rotationRadians, Math.PI);

  assert.match(scenario.description, /support/i);
  assert.match(scenario.description, /priority/i);
});

test('page 58 LOS example scenario exposes the bound source roles and metadata', () => {
  const scenario = createShootingLosExampleScenario();
  const unitsByRole = new Map(scenario.units.map((unit) => [unit.scenarioRole, unit]));

  assert.equal(scenario.id, SHOOTING_LOS_EXAMPLE_SCENARIO_ID);
  assert.match(scenario.label, /p\.58/i);
  assert.match(scenario.description, /B blocks C1/i);
  assert.match(scenario.description, /D is nearer to A1/i);

  assert.deepEqual([...unitsByRole.keys()].sort(), ['A1', 'A2', 'B', 'C1', 'C2', 'D']);
  assert.equal(unitsByRole.get('A1')?.scenarioExampleId, SHOOTING_LOS_EXAMPLE_SOURCE_ID);
  assert.equal(unitsByRole.get('A2')?.scenarioLaneId, 'RV2-P58');
  assert.match(unitsByRole.get('C1')?.scenarioBlocker ?? '', /B blocks line of sight/i);
  assert.equal(unitsByRole.get('D')?.owner, 'player-2');
});