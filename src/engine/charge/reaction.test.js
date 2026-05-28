import test from 'node:test';
import assert from 'node:assert/strict';

import { createChargeDrillScenario } from '../../data/charge-drill-scenarios.js';

import {
  CHARGE_REACTION_REQUEST_TYPES,
  CHARGE_REACTION_SOURCE_STATUSES,
  resolveChargeReactionState,
} from './index.js';

function createContactEvent(defenderId = 'defender') {
  return {
    defenderId,
    classification: {
      type: 'front',
      flankSide: null,
    },
    contactSnapshot: {
      chargerStartPose: { xUd: 5, yUd: 17, rotationRadians: 0 },
      chargerContactPose: { xUd: 5, yUd: 13.75, rotationRadians: 0 },
      defenderPose: { xUd: 5, yUd: 13, rotationRadians: Math.PI },
      frozenDirectionRadians: 0,
    },
  };
}

const CHARGER = { id: 'charger', owner: 'player-1', troopType: 'cavalry' };
const BASE_TARGET = { id: 'defender', owner: 'player-2', troopType: 'cavalry' };
const PATH_SEGMENTS = [{ commandId: 'charge-guide', xUd: 5, yUd: 17, rotationRadians: 0, distanceUd: 4 }];

function createScenarioContactEvent(chargingUnit, targetUnit) {
  return {
    defenderId: targetUnit.id,
    classification: {
      type: 'front',
      flankSide: null,
    },
    contactSnapshot: {
      chargerStartPose: {
        xUd: chargingUnit.xUd,
        yUd: chargingUnit.yUd,
        rotationRadians: chargingUnit.rotationRadians,
      },
      chargerContactPose: {
        xUd: targetUnit.xUd,
        yUd: targetUnit.yUd + (targetUnit.depthUd ?? 0.75),
        rotationRadians: chargingUnit.rotationRadians,
      },
      defenderPose: {
        xUd: targetUnit.xUd,
        yUd: targetUnit.yUd,
        rotationRadians: targetUnit.rotationRadians,
      },
      frozenDirectionRadians: chargingUnit.rotationRadians,
    },
  };
}

test('reaction state defaults to a complete none request when no explicit defender profile exists', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: BASE_TARGET,
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests.length, 1);
  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NONE);
  assert.equal(result.reactionRequests[0].status, 'complete');
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.DEFAULT_NONE);
});

test('reaction state derives a may-evade request from capability data for supported cavalry', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      chargeReactionCapability: {
        family: 'cavalry',
        hasImpact: false,
        hasImpetuous: false,
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
});

test('reaction state derives a may-evade request from a defender profile when no explicit capability override exists', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      profileId: 'cavalry',
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
});

test('reaction state treats a live engaged defender as unable to evade even when capability is profile-derived', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      profileId: 'cavalry',
      engagedInMelee: true,
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NONE);
  assert.equal(result.reactionRequests[0].status, 'complete');
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
  assert.match(result.diagnostics[0]?.text ?? '', /cannot evade because it is engaged in melee/i);
});

test('explicit defender profile still overrides capability evaluation for testing', () => {
  const result = resolveChargeReactionState({
    chargingUnit: { ...CHARGER, chargeReactionCapability: { chargeWeight: 'heavy' } },
    targetUnit: {
      ...BASE_TARGET,
      chargeReactionProfile: CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE,
      chargeReactionCapability: {
        family: 'light-infantry',
        inOpenTerrain: true,
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE);
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.EXPLICIT_PROFILE);
});

test('reaction state derives a must-evade request for light infantry in open terrain charged by heavy troops', () => {
  const result = resolveChargeReactionState({
    chargingUnit: {
      ...CHARGER,
      chargeReactionCapability: { chargeWeight: 'heavy' },
    },
    targetUnit: {
      ...BASE_TARGET,
      troopType: 'light-infantry',
      chargeReactionCapability: {
        family: 'light-infantry',
        inOpenTerrain: true,
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE);
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
});

test('reaction state derives a must-evade request from profile data for heavy charger versus light infantry defender', () => {
  const result = resolveChargeReactionState({
    chargingUnit: {
      ...CHARGER,
      profileId: 'heavy-infantry',
    },
    targetUnit: {
      ...BASE_TARGET,
      profileId: 'light-infantry',
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE);
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
});

test('reaction state derives a complete none request for non-evade-capable families', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      troopType: 'medium-infantry',
      chargeReactionCapability: {
        family: 'medium-infantry',
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NONE);
  assert.equal(result.reactionRequests[0].status, 'complete');
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
});

test('reaction state derives blocked-evade from capability blocker data', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      chargeReactionCapability: {
        family: 'light-cavalry',
        blockedEvade: 'The evade move is blocked by enemy ZoC after the initial reorientation.',
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE);
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
});

test('reaction state derives blocked-evade when initial reorientation would end inside enemy zoc', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      chargeReactionCapability: {
        family: 'cavalry',
        hasImpact: false,
        hasImpetuous: false,
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
    units: [
      {
        id: 'enemy-zoc-sentry',
        owner: 'player-1',
        xUd: 5.8,
        yUd: 11.5,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: Math.PI,
      },
    ],
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE);
  assert.match(result.reactionRequests[0].diagnostics[0]?.text ?? '', /directly ahead of its reoriented front edge/i);
});

test('reaction state keeps evade available when enemy zoc only reaches the reoriented flank and not the front edge', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      chargeReactionCapability: {
        family: 'cavalry',
        hasImpact: false,
        hasImpetuous: false,
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
    units: [
      {
        id: 'enemy-zoc-flank-sentry',
        owner: 'player-1',
        xUd: 3.75,
        yUd: 13.1,
        widthUd: 1,
        depthUd: 1,
        rotationRadians: Math.PI / 2,
      },
    ],
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
});

test('reaction state derives blocked-evade when a simple blocker ahead cannot be cleared by a 1 UD slide', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      chargeReactionCapability: {
        family: 'cavalry',
        hasImpact: false,
        hasImpetuous: false,
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
    units: [
      { id: 'front-blocker', owner: 'player-1', xUd: 5, yUd: 11.9, widthUd: 1, depthUd: 1, rotationRadians: 0 },
      { id: 'left-blocker', owner: 'player-1', xUd: 4, yUd: 11.9, widthUd: 1, depthUd: 1, rotationRadians: 0 },
      { id: 'right-blocker', owner: 'player-1', xUd: 6, yUd: 11.9, widthUd: 1, depthUd: 1, rotationRadians: 0 },
    ],
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE);
  assert.match(result.reactionRequests[0].diagnostics[0]?.text ?? '', /simple blocker lies less than 1 UD directly ahead/i);
});

test('reaction state keeps evade available when a directly-ahead blocker can be cleared by a slide of 1 UD or less', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      chargeReactionCapability: {
        family: 'cavalry',
        hasImpact: false,
        hasImpetuous: false,
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
    units: [
      { id: 'front-blocker', owner: 'player-1', xUd: 5.2, yUd: 11.9, widthUd: 1, depthUd: 1, rotationRadians: 0 },
    ],
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
});

test('reaction state preserves a pending may-evade request with charge/contact snapshots', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: { ...BASE_TARGET, chargeReactionProfile: CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
  assert.equal(result.reactionRequests[0].status, 'pending');
  assert.deepEqual(result.reactionRequests[0].chargePathSnapshot, PATH_SEGMENTS);
  assert.deepEqual(result.reactionRequests[0].contactSnapshot?.defenderPose, { xUd: 5, yUd: 13, rotationRadians: Math.PI });
});

test('reaction state preserves a pending must-evade request', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: { ...BASE_TARGET, chargeReactionProfile: CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE);
  assert.equal(result.reactionRequests[0].status, 'pending');
});

test('reaction state preserves a pending blocked-evade request instead of silently skipping the pause', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: { ...BASE_TARGET, chargeReactionProfile: CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE);
  assert.equal(result.reactionRequests[0].status, 'pending');
});

test('reaction state escalates invalid defender profiles into needs-source-check requests', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: { ...BASE_TARGET, chargeReactionProfile: 'unknown-profile' },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK);
  assert.equal(result.reactionRequests[0].status, 'pending');
  assert.match(result.diagnostics[0]?.text ?? '', /invalid chargeReactionProfile/i);
});

test('reaction state escalates incomplete capability data into needs-source-check requests', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: { ...BASE_TARGET, chargeReactionCapability: {} },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK);
  assert.equal(result.reactionRequests[0].status, 'pending');
  assert.match(result.diagnostics[0]?.text ?? '', /invalid chargeReactionCapability/i);
});

test('reaction state escalates unknown profile-backed capability resolution into needs-source-check requests', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      profileId: 'unknown-profile',
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK);
  assert.match(result.diagnostics[0]?.text ?? '', /could not derive chargeReactionCapability from profile/i);
});

test('explicit capability override still beats profile-derived capability evaluation', () => {
  const result = resolveChargeReactionState({
    chargingUnit: CHARGER,
    targetUnit: {
      ...BASE_TARGET,
      profileId: 'cavalry',
      chargeReactionCapability: {
        family: 'medium-infantry',
      },
    },
    contactEvents: [createContactEvent()],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NONE);
});

test('charge drill profile-backed lanes cover may and cannot evade categories while keeping the explicit light-troop hook lane', () => {
  const scenario = createChargeDrillScenario();
  const cavalryBowCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-cavalry-bow-charger');
  const cavalryBowTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-cavalry-bow-target');
  const heavyInfantryCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-heavy-infantry-charger');
  const lightTroopHookTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-light-troop-hook-target');
  const pikeTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-pike-target');
  const elephantTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-elephant-target');

  assert.ok(cavalryBowCharger);
  assert.ok(cavalryBowTarget);
  assert.ok(heavyInfantryCharger);
  assert.ok(lightTroopHookTarget);
  assert.ok(pikeTarget);
  assert.ok(elephantTarget);

  const cavalryBowReaction = resolveChargeReactionState({
    chargingUnit: cavalryBowCharger,
    targetUnit: cavalryBowTarget,
    contactEvents: [createScenarioContactEvent(cavalryBowCharger, cavalryBowTarget)],
    pathSegments: PATH_SEGMENTS,
  });
  const lightTroopReaction = resolveChargeReactionState({
    chargingUnit: heavyInfantryCharger,
    targetUnit: lightTroopHookTarget,
    contactEvents: [createScenarioContactEvent(heavyInfantryCharger, lightTroopHookTarget)],
    pathSegments: PATH_SEGMENTS,
  });
  const pikeReaction = resolveChargeReactionState({
    chargingUnit: cavalryBowCharger,
    targetUnit: pikeTarget,
    contactEvents: [createScenarioContactEvent(cavalryBowCharger, pikeTarget)],
    pathSegments: PATH_SEGMENTS,
  });
  const elephantReaction = resolveChargeReactionState({
    chargingUnit: cavalryBowCharger,
    targetUnit: elephantTarget,
    contactEvents: [createScenarioContactEvent(cavalryBowCharger, elephantTarget)],
    pathSegments: PATH_SEGMENTS,
  });

  assert.equal(cavalryBowReaction.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
  assert.equal(cavalryBowReaction.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
  assert.equal(cavalryBowTarget.chargeReactionCapability?.hasBow, true);

  assert.equal(lightTroopReaction.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
  assert.equal(lightTroopReaction.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.EXPLICIT_PROFILE);
  assert.equal(lightTroopHookTarget.chargeReactionCapability?.family, 'light-infantry');

  assert.equal(pikeReaction.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NONE);
  assert.equal(pikeReaction.reactionRequests[0].status, 'complete');
  assert.equal(pikeReaction.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);

  assert.equal(elephantReaction.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.NONE);
  assert.equal(elephantReaction.reactionRequests[0].status, 'complete');
  assert.equal(elephantReaction.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
});

test('charge drill blocked-evade lane remains blocked by the dedicated blocker corridor', () => {
  const scenario = createChargeDrillScenario();
  const charger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-evade-blocker-charger');
  const target = scenario.units.find((unit) => unit.id === 'charge-drill-p2-evade-blocker-target');

  assert.ok(charger);
  assert.ok(target);

  const result = resolveChargeReactionState({
    chargingUnit: charger,
    targetUnit: target,
    contactEvents: [createScenarioContactEvent(charger, target)],
    pathSegments: PATH_SEGMENTS,
    units: scenario.units.filter((unit) => unit.id !== target.id),
  });

  assert.equal(result.reactionRequests[0].type, CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE);
  assert.equal(result.reactionRequests[0].sourceStatus, CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA);
  assert.match(result.reactionRequests[0].diagnostics[0]?.text ?? '', /simple blocker lies less than 1 UD directly ahead/i);
});