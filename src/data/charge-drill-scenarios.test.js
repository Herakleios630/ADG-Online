import test from 'node:test';
import assert from 'node:assert/strict';

import { getFootprintCommandRangeMeasurement } from '../engine/command/range.js';
import { CHARGE_DRILL_SCENARIO_ID, createChargeDrillScenario, createChargeDrillUnit } from './charge-drill-scenarios.js';
import { UNIT_PROFILE_IDS } from './unit-profiles.js';

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
  const frontCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-front-charger');
  const commander = scenario.units.find((unit) => unit.id === 'charge-drill-p1-general');
  const tableExitCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-table-exit-charger');
  const tableExitTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-table-exit-target');
  const lightTroopHookCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-light-troop-hook-charger');
  const lightTroopHookTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-light-troop-hook-target');
  const cavalryBowCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-cavalry-bow-charger');
  const cavalryBowTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-cavalry-bow-target');
  const heavyInfantryCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-heavy-infantry-charger');
  const heavyInfantryTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-heavy-infantry-target');
  const pikeTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-pike-target');
  const elephantTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-elephant-target');
  const newPlayerOneFamilyAnchors = scenario.units.filter((unit) => (
    unit.id === 'charge-drill-p1-cavalry-bow-charger'
    || unit.id === 'charge-drill-p1-heavy-infantry-charger'
    || unit.id === 'charge-drill-p1-pike-charger'
    || unit.id === 'charge-drill-p1-elephant-charger'
  ));
  const newPlayerTwoFamilyAnchors = scenario.units.filter((unit) => (
    unit.id === 'charge-drill-p2-cavalry-bow-target'
    || unit.id === 'charge-drill-p2-heavy-infantry-target'
    || unit.id === 'charge-drill-p2-pike-target'
    || unit.id === 'charge-drill-p2-elephant-target'
  ));

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
  assert.ok(scenarioRoles.has('table-exit-charger'));
  assert.ok(scenarioRoles.has('table-exit-target'));
  assert.ok(scenarioRoles.has('light-troop-hook-charger'));
  assert.ok(scenarioRoles.has('light-troop-hook-target'));
  assert.ok(scenarioRoles.has('cavalry-bow-charger'));
  assert.ok(scenarioRoles.has('cavalry-bow-target'));
  assert.ok(scenarioRoles.has('heavy-infantry-charger'));
  assert.ok(scenarioRoles.has('heavy-infantry-target'));
  assert.ok(scenarioRoles.has('pike-charger'));
  assert.ok(scenarioRoles.has('pike-target'));
  assert.ok(scenarioRoles.has('elephant-charger'));
  assert.ok(scenarioRoles.has('elephant-target'));
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
  assert.equal(tableExitCharger?.xUd, tableExitTarget?.xUd);
  assert.equal(tableExitCharger?.yUd > tableExitTarget?.yUd, true);
  assert.equal(tableExitTarget?.facing, 'south');
  assert.equal(tableExitTarget?.rotationRadians, Math.PI);
  assert.equal(tableExitTarget?.yUd < 2, true);
  assert.equal(lightTroopHookCharger?.xUd, lightTroopHookTarget?.xUd);
  assert.equal(lightTroopHookCharger?.yUd > lightTroopHookTarget?.yUd, true);
  assert.equal(lightTroopHookTarget?.facing, 'south');
  assert.equal(lightTroopHookTarget?.rotationRadians, Math.PI);
  assert.equal(lightTroopHookTarget?.depthUd, 0.5);
  assert.equal(lightTroopHookTarget?.baseShape, 'rectangle');
  assert.equal(lightTroopHookTarget?.profileId, UNIT_PROFILE_IDS.LIGHT_INFANTRY);
  assert.match(lightTroopHookTarget?.scenarioOverrideReason ?? '', /scenario-light-troop-hook-target/i);
  assert.equal(lightTroopHookTarget?.chargeReactionCapability?.family, 'light-infantry');
  assert.equal(cavalryBowCharger?.profileId, UNIT_PROFILE_IDS.CAVALRY_BOW);
  assert.equal(cavalryBowTarget?.profileId, UNIT_PROFILE_IDS.CAVALRY_BOW);
  assert.equal(cavalryBowCharger?.chargeReactionCapability?.hasBow, true);
  assert.equal(cavalryBowTarget?.chargeReactionCapability?.hasBow, true);
  assert.equal(cavalryBowCharger?.baseShape, 'rectangle');
  assert.equal(cavalryBowTarget?.baseShape, 'rectangle');
  assert.equal(cavalryBowTarget?.yUd > 5, true);
  assert.equal(cavalryBowCharger?.yUd < cavalryBowTarget?.yUd, true);
  assert.equal(cavalryBowCharger?.facing, 'south');
  assert.equal(cavalryBowTarget?.facing, 'north');
  assert.equal(heavyInfantryCharger?.chargeReactionCapability?.chargeWeight, 'heavy');
  assert.equal(heavyInfantryTarget?.profileId, UNIT_PROFILE_IDS.HEAVY_INFANTRY);
  assert.equal(heavyInfantryTarget?.chargeReactionCapability?.chargeWeight, 'heavy');
  assert.equal(heavyInfantryTarget?.baseShape, 'square');
  assert.equal(pikeTarget?.profileId, UNIT_PROFILE_IDS.PIKE);
  assert.equal(pikeTarget?.chargeReactionCapability?.family, 'pike');
  assert.equal(pikeTarget?.depthUd, 1);
  assert.equal(elephantTarget?.profileId, UNIT_PROFILE_IDS.ELEPHANT);
  assert.equal(elephantTarget?.chargeReactionCapability?.family, 'elephant');
  assert.equal(elephantTarget?.baseShape, 'square');
  assert.equal(newPlayerOneFamilyAnchors.every((unit) => unit.corpsId === 'p1-corps-2'), true);
  assert.equal(newPlayerTwoFamilyAnchors.every((unit) => unit.corpsId === 'p2-corps-2'), true);
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
  assert.equal(frontTarget?.profileId, UNIT_PROFILE_IDS.CAVALRY);
  assert.equal(frontTarget?.chargeReactionCapability?.family, 'cavalry');
  assert.equal(frontTarget?.chargeReactionCapability?.hasImpact, false);
  assert.equal(frontTarget?.chargeReactionCapability?.chargeWeight, null);
  assert.equal(frontCharger?.chargeReactionCapability?.chargeWeight, null);
  assert.equal(zocCharger?.profileId, UNIT_PROFILE_IDS.CAVALRY);
  assert.equal(zocSentry?.chargeReactionCapability?.family, 'medium-infantry');
  assert.equal(zocSentry?.profileId, UNIT_PROFILE_IDS.MEDIUM_INFANTRY);
  assert.equal(commander?.visualProfileId, 'vp-commander');
  assert.equal(scenario.units.every((unit) => unit.troopType === 'general' || unit.profileId != null), true);
  assert.equal(scenario.units.every((unit) => unit.visualProfileId != null), true);
  assert.equal(scenario.units.every((unit) => unit.chargeReactionCapability != null), true);
  assert.equal(
    scenario.units
      .filter((unit) => unit.scenarioOverrideReason != null)
      .map((unit) => unit.id)
      .includes('charge-drill-p2-light-troop-hook-target'),
    true,
  );
});

test('charge drill unit factory derives fixture footprint defaults from profile ids', () => {
  const unit = createChargeDrillUnit({
    id: 'derived-footprint-unit',
    owner: 'player-2',
    corpsId: 'test-corps',
    xUd: 1,
    yUd: 1,
    facing: 'south',
    rotationRadians: Math.PI,
    troopType: 'cavalry',
    profileId: UNIT_PROFILE_IDS.CAVALRY_BOW,
    scenarioRole: 'derived-footprint-test',
    scenarioLabel: 'Derived Footprint Test',
  });

  assert.equal(unit.widthUd, 1);
  assert.equal(unit.depthUd, 0.75);
  assert.equal(unit.baseShape, 'rectangle');
  assert.equal(unit.chargeReactionCapability.family, 'cavalry');
  assert.equal(unit.chargeReactionCapability.hasBow, true);
});