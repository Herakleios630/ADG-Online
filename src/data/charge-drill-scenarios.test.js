import test from 'node:test';
import assert from 'node:assert/strict';

import { getFootprintCommandRangeMeasurement } from '../engine/command/range.js';
import { CHARGE_DRILL_SCENARIO_ID, createChargeDrillScenario } from './charge-drill-scenarios.js';

test('charge drill scenario exposes stable ids, facings, and case coverage anchors', () => {
  const scenario = createChargeDrillScenario();
  const unitIds = scenario.units.map((unit) => unit.id);
  const scenarioRoles = new Set(scenario.units.map((unit) => unit.scenarioRole));
  const flankTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-flank-target');
  const rearTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-rear-target');
  const zocCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-zoc-charger');
  const slideCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-slide-charger');
  const zocSentry = scenario.units.find((unit) => unit.id === 'charge-drill-p2-zoc-sentry');
  const zocTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-zoc-target');
  const pureZocCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-pure-zoc-charger');
  const pureZocSentry = scenario.units.find((unit) => unit.id === 'charge-drill-p2-pure-zoc-sentry');
  const pureZocTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-pure-zoc-target');
  const evadeZocCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-evade-zoc-charger');
  const evadeZocSentry = scenario.units.find((unit) => unit.id === 'charge-drill-p1-evade-zoc-sentry');
  const evadeZocTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-evade-zoc-target');
  const evadeBlockerCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-evade-blocker-charger');
  const evadeBlockerFront = scenario.units.find((unit) => unit.id === 'charge-drill-p1-evade-blocker-front');
  const evadeBlockerLeft = scenario.units.find((unit) => unit.id === 'charge-drill-p1-evade-blocker-left');
  const evadeBlockerRight = scenario.units.find((unit) => unit.id === 'charge-drill-p1-evade-blocker-right');
  const evadeBlockerTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-evade-blocker-target');
  const frontTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-front-target');

  assert.equal(scenario.id, CHARGE_DRILL_SCENARIO_ID);
  assert.equal(new Set(unitIds).size, unitIds.length);
  assert.ok(scenarioRoles.has('front-charger'));
  assert.ok(scenarioRoles.has('front-target'));
  assert.ok(scenarioRoles.has('out-of-range-target'));
  assert.ok(scenarioRoles.has('path-blocked-target'));
  assert.ok(scenarioRoles.has('earlier-contact-blocker'));
  assert.ok(scenarioRoles.has('flank-target'));
  assert.ok(scenarioRoles.has('rear-target'));
  assert.ok(scenarioRoles.has('zoc-charger'));
  assert.ok(scenarioRoles.has('pure-zoc-charger'));
  assert.ok(scenarioRoles.has('evade-zoc-charger'));
  assert.ok(scenarioRoles.has('evade-zoc-sentry'));
  assert.ok(scenarioRoles.has('evade-blocker-charger'));
  assert.ok(scenarioRoles.has('evade-blocker-front'));
  assert.ok(scenarioRoles.has('evade-blocker-left'));
  assert.ok(scenarioRoles.has('evade-blocker-right'));
  assert.ok(scenarioRoles.has('double-blocked-charger'));
  assert.ok(scenarioRoles.has('double-blocker-friendly'));
  assert.ok(scenarioRoles.has('double-blocker-enemy'));
  assert.ok(scenarioRoles.has('double-blocked-target'));
  assert.ok(scenarioRoles.has('zoc-sentry'));
  assert.ok(scenarioRoles.has('pure-zoc-sentry'));
  assert.ok(scenarioRoles.has('zoc-blocked-target'));
  assert.ok(scenarioRoles.has('pure-zoc-blocked-target'));
  assert.ok(scenarioRoles.has('evade-zoc-blocked-target'));
  assert.ok(scenarioRoles.has('evade-blocker-target'));
  assert.equal(flankTarget?.facing, 'east');
  assert.equal(flankTarget?.rotationRadians, Math.PI / 2);
  assert.equal(rearTarget?.facing, 'north');
  assert.equal(rearTarget?.rotationRadians, 0);
  assert.equal(zocCharger?.xUd > slideCharger?.xUd, true);
  assert.equal(zocSentry?.facing, 'west');
  assert.equal(zocSentry?.rotationRadians, -Math.PI / 2);
  assert.equal(zocSentry?.baseShape, 'square');
  assert.equal(zocSentry?.widthUd, 1);
  assert.equal(zocTarget?.xUd, zocCharger?.xUd);
  assert.equal(pureZocCharger?.xUd < zocCharger?.xUd, true);
  assert.equal(pureZocSentry?.facing, 'west');
  assert.equal(pureZocSentry?.rotationRadians, -Math.PI / 2);
  assert.equal(pureZocSentry?.widthUd, 1);
  assert.equal(pureZocTarget?.xUd < pureZocSentry?.xUd, true);
  assert.equal(pureZocTarget?.xUd > pureZocSentry?.xUd - 1, true);
  assert.equal(pureZocTarget?.yUd < pureZocSentry?.yUd, true);
  assert.equal(evadeZocCharger?.xUd, evadeZocTarget?.xUd);
  assert.equal(evadeZocCharger?.yUd > evadeZocTarget?.yUd, true);
  assert.equal(evadeZocSentry?.owner, 'player-1');
  assert.equal(evadeZocSentry?.facing, 'south');
  assert.equal(evadeZocSentry?.rotationRadians, Math.PI);
  assert.equal(evadeZocSentry?.xUd > evadeZocTarget?.xUd, true);
  assert.equal(evadeZocSentry?.yUd < evadeZocTarget?.yUd, true);
  assert.equal(getFootprintCommandRangeMeasurement(evadeZocSentry, evadeZocTarget).distanceUd > 0, true);
  assert.equal(getFootprintCommandRangeMeasurement(evadeZocSentry, evadeZocCharger).distanceUd > 0, true);
  assert.equal(evadeBlockerCharger?.xUd, evadeBlockerTarget?.xUd);
  assert.equal(evadeBlockerCharger?.yUd > evadeBlockerTarget?.yUd, true);
  assert.equal(evadeBlockerFront?.xUd, evadeBlockerTarget?.xUd);
  assert.equal(evadeBlockerFront?.yUd < evadeBlockerTarget?.yUd, true);
  assert.equal(evadeBlockerLeft?.xUd < evadeBlockerFront?.xUd, true);
  assert.equal(evadeBlockerRight?.xUd > evadeBlockerFront?.xUd, true);
  assert.equal(getFootprintCommandRangeMeasurement(evadeBlockerFront, evadeBlockerTarget).distanceUd > 0, true);
  assert.equal(getFootprintCommandRangeMeasurement(evadeBlockerLeft, evadeBlockerTarget).distanceUd > 0, true);
  assert.equal(getFootprintCommandRangeMeasurement(evadeBlockerRight, evadeBlockerTarget).distanceUd > 0, true);
  assert.equal(getFootprintCommandRangeMeasurement(evadeBlockerFront, evadeBlockerCharger).distanceUd > 0, true);
  assert.equal(scenario.terrainPlaceholders[0]?.id, 'charge-drill-future-terrain');
  assert.equal(scenario.setupObjects[0]?.id, 'charge-drill-future-obstacle');
  assert.deepEqual(
    scenario.units
      .filter((unit) => unit.scenarioRole.startsWith('double-block'))
      .map((unit) => unit.id),
    [
      'charge-drill-p1-double-blocked-charger',
      'charge-drill-p1-double-blocker',
      'charge-drill-p2-double-blocker',
      'charge-drill-p2-double-blocked-target',
    ],
  );
  assert.equal(frontTarget?.chargeReactionProfile, null);
  assert.equal(frontTarget?.chargeReactionCapability?.family, 'cavalry');
  assert.equal(frontTarget?.chargeReactionCapability?.hasImpact, false);
  assert.equal(zocSentry?.chargeReactionCapability?.family, 'medium-infantry');
  assert.equal(scenario.units.every((unit) => unit.chargeReactionCapability != null), true);
});