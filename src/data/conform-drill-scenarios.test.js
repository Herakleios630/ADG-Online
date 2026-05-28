import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONFORM_DRILL_LANE_IDS,
  CONFORM_DRILL_SCENARIO_ID,
  CONFORM_DRILL_SUPPORT_STATUSES,
  createConformDrillScenario,
  createConformDrillUnit,
} from './conform-drill-scenarios.js';
import { UNIT_PROFILE_IDS } from './unit-profiles.js';

test('conform drill scenario exposes stable source example lanes and honest support statuses', () => {
  const scenario = createConformDrillScenario();
  const laneIds = scenario.lanes.map((lane) => lane.id);
  const unitIds = scenario.units.map((unit) => unit.id);
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));

  assert.equal(scenario.id, CONFORM_DRILL_SCENARIO_ID);
  assert.equal(scenario.label, 'Conform Drill');
  assert.deepEqual(laneIds, ['CFD-E1', 'CFD-E2', 'CFD-E3', 'CFD-E4']);
  assert.equal(new Set(unitIds).size, unitIds.length);
  assert.equal(scenario.terrainPlaceholders.length, 0);
  assert.equal(scenario.setupObjects.length, 0);
  assert.deepEqual(
    scenario.lanes.map((lane) => lane.sourceExampleId),
    [
      'rv2-p53-shifting-units-a',
      'rv2-p53-incomplete-conformation-a',
      'rv2-p53-conformation-terrain-a',
      'rv2-p53-incomplete-flank-conforming-a',
    ],
  );
  assert.equal(scenario.lanes.find((lane) => lane.id === 'CFD-E1')?.supportStatus, CONFORM_DRILL_SUPPORT_STATUSES.SUPPORTED);
  assert.equal(scenario.lanes.filter((lane) => lane.supportStatus === CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED).length, 3);
  assert.equal(scenario.lanes.every((lane) => lane.caption.length > 0), true);
  assert.equal(scenario.lanes.filter((lane) => lane.supportStatus === CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED).every((lane) => lane.blocker?.length > 0), true);
  assert.equal(scenario.units.every((unit) => unit.fixtureTag === CONFORM_DRILL_SCENARIO_ID), true);
  assert.equal(scenario.units.every((unit) => unit.scenarioExampleId?.startsWith('rv2-p53-')), true);
  assert.equal(scenario.units.every((unit) => unit.scenarioLaneId?.startsWith('CFD-E')), true);
  assert.equal(scenario.units.every((unit) => unit.chargeReactionCapability != null), true);
  assert.deepEqual(
    scenario.units
      .filter((unit) => unit.scenarioLaneId === CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION)
      .map((unit) => unit.scenarioRole),
    [
      'cfd-e2-b1-reference',
      'cfd-e2-b2-reference',
      'cfd-e2-b3-reference',
      'cfd-e2-a1-reference',
      'cfd-e2-a2-reference',
      'cfd-e2-a3-reference',
    ],
  );

  assert.equal(unitsById.get('conform-drill-cfd-e1-b1-charger')?.scenarioLaneId, CONFORM_DRILL_LANE_IDS.SHIFTING_UNITS);
  assert.equal(unitsById.get('conform-drill-cfd-e1-a1-target')?.scenarioSupportStatus, CONFORM_DRILL_SUPPORT_STATUSES.SUPPORTED);
  assert.equal(unitsById.get('conform-drill-cfd-e1-b2-shifted-neighbor')?.owner, 'player-1');
  assert.equal(unitsById.get('conform-drill-cfd-e1-b2-shifted-neighbor')?.xUd, 7.4);
  assert.equal(unitsById.get('conform-drill-cfd-e1-b2-shifted-neighbor')?.yUd, 12.35);
  assert.equal(unitsById.get('conform-drill-cfd-e2-reference-anchor')?.scenarioSupportStatus, CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED);
  assert.equal(unitsById.get('conform-drill-cfd-e2-reference-anchor')?.scenarioBlocker, 'Requires multi-unit in-contact and support-network-aware conformation.');
  assert.equal(unitsById.get('conform-drill-cfd-e2-a3-reference')?.owner, 'player-2');
  assert.equal(unitsById.get('conform-drill-cfd-e2-a3-reference')?.scenarioExampleId, 'rv2-p53-incomplete-conformation-a');
  assert.equal(unitsById.get('conform-drill-cfd-e3-reference-anchor')?.scenarioExampleId, 'rv2-p53-conformation-terrain-a');
  assert.equal(unitsById.get('conform-drill-cfd-e4-reference-anchor')?.scenarioExampleCaption, 'Incomplete flank conforming');
});

test('conform drill unit factory derives profile footprint and source metadata', () => {
  const unit = createConformDrillUnit({
    id: 'conform-drill-derived-footprint',
    owner: 'player-2',
    corpsId: 'p2-corps-1',
    xUd: 1,
    yUd: 1,
    facing: 'south',
    rotationRadians: Math.PI,
    troopType: 'heavy-infantry',
    profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
    laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
    scenarioRole: 'derived-footprint-test',
    scenarioLabel: 'Derived Footprint Test',
  });

  assert.equal(unit.widthUd, 1);
  assert.equal(unit.depthUd, 1);
  assert.equal(unit.baseShape, 'square');
  assert.equal(unit.fixtureTag, CONFORM_DRILL_SCENARIO_ID);
  assert.equal(unit.scenarioExampleId, 'rv2-p53-incomplete-conformation-a');
  assert.equal(unit.scenarioSupportStatus, CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED);
  assert.equal(unit.chargeReactionCapability?.chargeWeight, 'heavy');
});