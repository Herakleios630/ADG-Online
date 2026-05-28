import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BATTLEFIELD_PROFILE_IDS,
  getBattlefieldProfile,
} from '../../data/battlefield-profiles.js';
import { createChargeDrillScenario } from '../../data/charge-drill-scenarios.js';

import {
  CHARGE_PATH_FAMILY_IDS,
  CHARGE_TARGET_CANDIDATE_STATUSES,
  CHARGE_TARGET_PATH_FEASIBILITY_STATUSES,
  CHARGE_TARGET_SOURCE_STATUSES,
  getChargeTargetCandidateByUnitId,
  getChargeTargetCandidates,
} from './declaration.js';

const BATTLEFIELD_PROFILE = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

const UNITS = [
  { id: 'charger', owner: 'player-1', troopType: 'cavalry', xUd: 5, yUd: 17, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
  { id: 'friendly', owner: 'player-1', troopType: 'cavalry', xUd: 3.9, yUd: 17, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
  { id: 'enemy-1', owner: 'player-2', troopType: 'cavalry', xUd: 5, yUd: 13, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
  { id: 'enemy-2', owner: 'player-2', troopType: 'cavalry', xUd: 4.5, yUd: 8.5, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
];

test('charge declaration classifies friendly units as blocked, near enemies as eligible, and distant enemies as blocked', () => {
  const candidates = getChargeTargetCandidates({ units: UNITS, chargingUnitId: 'charger', battlefieldProfile: BATTLEFIELD_PROFILE });

  assert.equal(candidates.length, 3);
  assert.deepEqual(
    candidates.map((candidate) => [candidate.unitId, candidate.status]),
    [
      ['friendly', CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED],
      ['enemy-1', CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE],
      ['enemy-2', CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED],
    ],
  );
  assert.equal(getChargeTargetCandidateByUnitId(candidates, 'friendly')?.reason, 'Nur feindliche Einheiten koennen als Charge-Ziel ausgewaehlt werden.');
  assert.equal(getChargeTargetCandidateByUnitId(candidates, 'enemy-1')?.sourceStatus, CHARGE_TARGET_SOURCE_STATUSES.VERIFIED);
  assert.equal(getChargeTargetCandidateByUnitId(candidates, 'enemy-1')?.maxChargeRangeUd, 4);
  assert.match(getChargeTargetCandidateByUnitId(candidates, 'enemy-2')?.reason ?? '', /nicht erreichbar|ausserhalb der Reichweite/);
});

test('charge declaration reports a concrete blocker reason when a friendly unit closes the path', () => {
  const candidates = getChargeTargetCandidates({
    units: [
      ...UNITS,
      { id: 'friendly-blocker', owner: 'player-1', troopType: 'medium-infantry', xUd: 5, yUd: 15.8, widthUd: 1, depthUd: 1, baseShape: 'square', rotationRadians: 0 },
    ],
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const blockedTarget = getChargeTargetCandidateByUnitId(candidates, 'enemy-1');
  assert.equal(blockedTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(blockedTarget?.reason ?? '', /friendly-blocker|blockiert/);
});

test('charge declaration can reevaluate target reachability from a current charge-start pose with advance-only budget', () => {
  const candidates = getChargeTargetCandidates({
    units: UNITS,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    chargeContext: {
      startPose: {
        xUd: 5,
        yUd: 17,
        rotationRadians: 0,
      },
      remainingChargeRangeUd: 4,
      allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
    },
  });

  assert.equal(getChargeTargetCandidateByUnitId(candidates, 'enemy-1')?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
});

test('charge declaration can defer expensive path feasibility for broad target highlighting', () => {
  const candidates = getChargeTargetCandidates({
    units: UNITS,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    deferPathFeasibility: true,
  });

  const nearEnemy = getChargeTargetCandidateByUnitId(candidates, 'enemy-1');
  const farEnemy = getChargeTargetCandidateByUnitId(candidates, 'enemy-2');

  assert.equal(nearEnemy?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
  assert.equal(nearEnemy?.pathFeasibilityStatus, CHARGE_TARGET_PATH_FEASIBILITY_STATUSES.DEFERRED);
  assert.match(nearEnemy?.reason ?? '', /Grundreichweite|nach Zielauswahl/);
  assert.equal(farEnemy?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.equal(farEnemy?.pathFeasibilityStatus, CHARGE_TARGET_PATH_FEASIBILITY_STATUSES.EVALUATED);
});

test('charge declaration can evaluate only a requested target id', () => {
  const candidates = getChargeTargetCandidates({
    units: UNITS,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    targetUnitIds: ['enemy-1'],
  });

  assert.deepEqual(candidates.map((candidate) => candidate.unitId), ['enemy-1']);
  assert.equal(candidates[0]?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
});

test('charge declaration blocks a previously legal target when the current charge-start pose turns the advance lane away', () => {
  const candidates = getChargeTargetCandidates({
    units: UNITS,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    chargeContext: {
      startPose: {
        xUd: 5,
        yUd: 17,
        rotationRadians: Math.PI / 2,
      },
      remainingChargeRangeUd: 4,
      allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
    },
  });

  const turnedAwayTarget = getChargeTargetCandidateByUnitId(candidates, 'enemy-1');
  assert.equal(turnedAwayTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(turnedAwayTarget?.reason ?? '', /nicht erreichbar|kein gerader Advance-Korridor/);
});

test('charge declaration reports earlier enemy contact as a distinct blocked reason', () => {
  const units = [
    { id: 'charger', owner: 'player-1', troopType: 'cavalry', xUd: 5, yUd: 17, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    { id: 'earlier-enemy', owner: 'player-2', troopType: 'cavalry', xUd: 5, yUd: 14.9, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
    { id: 'selected-target', owner: 'player-2', troopType: 'cavalry', xUd: 5, yUd: 13, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
  ];
  const candidates = getChargeTargetCandidates({
    units,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const blockedTarget = getChargeTargetCandidateByUnitId(candidates, 'selected-target');
  assert.equal(blockedTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(blockedTarget?.reason ?? '', /frueher|zuerst|andere Feindeinheit|earlier/i);
});

test('charge declaration prefers a concrete blocker reason over generic no-contact across path families', () => {
  const units = [
    { id: 'charger', owner: 'player-1', troopType: 'cavalry', xUd: 5, yUd: 17, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    { id: 'friendly-blocker', owner: 'player-1', troopType: 'medium-infantry', xUd: 6, yUd: 15, widthUd: 1, depthUd: 1, baseShape: 'square', rotationRadians: 0 },
    { id: 'selected-target', owner: 'player-2', troopType: 'cavalry', xUd: 6, yUd: 13, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
  ];

  const candidates = getChargeTargetCandidates({
    units,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const blockedTarget = getChargeTargetCandidateByUnitId(candidates, 'selected-target');
  assert.equal(blockedTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(blockedTarget?.reason ?? '', /friendly-blocker|blockiert/);
  assert.doesNotMatch(blockedTarget?.reason ?? '', /kein gerader Advance-Korridor/);
});

test('charge declaration reports a target as blocked when the legal lane only crosses enemy zoc', () => {
  const units = [
    { id: 'charger', owner: 'player-1', troopType: 'cavalry', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    { id: 'zoc-sentry', owner: 'player-2', troopType: 'medium-infantry', xUd: 11.5, yUd: 8, widthUd: 1.5, depthUd: 1, baseShape: 'square', rotationRadians: -Math.PI / 2 },
    { id: 'selected-target', owner: 'player-2', troopType: 'cavalry', xUd: 10, yUd: 6, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
  ];

  const candidates = getChargeTargetCandidates({
    units,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    chargeContext: {
      startPose: {
        xUd: 10,
        yUd: 10,
        rotationRadians: 0,
      },
      remainingChargeRangeUd: 4,
      allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
    },
  });

  const zocBlockedTarget = getChargeTargetCandidateByUnitId(candidates, 'selected-target');
  assert.equal(zocBlockedTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(zocBlockedTarget?.reason ?? '', /ZoC/);
  assert.match(zocBlockedTarget?.reason ?? '', /zoc-sentry/);
});

test('charge declaration keeps foreign zoc as the blocker when the path later hits that non-target enemy', () => {
  const units = [
    { id: 'charger', owner: 'player-1', troopType: 'cavalry', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    { id: 'zoc-sentry', owner: 'player-2', troopType: 'cavalry', xUd: 10, yUd: 7.6, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
    { id: 'selected-target', owner: 'player-2', troopType: 'cavalry', xUd: 10, yUd: 6, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
  ];

  const candidates = getChargeTargetCandidates({
    units,
    chargingUnitId: 'charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    chargeContext: {
      startPose: {
        xUd: 10,
        yUd: 10,
        rotationRadians: 0,
      },
      remainingChargeRangeUd: 4,
      allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
    },
  });

  const zocBlockedTarget = getChargeTargetCandidateByUnitId(candidates, 'selected-target');
  assert.equal(zocBlockedTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(zocBlockedTarget?.reason ?? '', /ZoC/);
  assert.match(zocBlockedTarget?.reason ?? '', /zoc-sentry/);
  assert.doesNotMatch(zocBlockedTarget?.reason ?? '', /trifft zoc-sentry/);
});

test('charge declaration can find the dedicated drill zoc target when an alternate start path avoids foreign zoc', () => {
  const scenario = createChargeDrillScenario();
  const candidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-zoc-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const zocTarget = getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-zoc-target');
  assert.equal(zocTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
  assert.match(zocTarget?.reason ?? '', /Slide|Wheel|Advance/);
});

test('charge declaration blocks the dedicated drill zoc target for the current straight tunnel', () => {
  const scenario = createChargeDrillScenario();
  const zocCharger = scenario.units.find((unit) => unit.id === 'charge-drill-p1-zoc-charger');
  assert.ok(zocCharger);
  const candidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-zoc-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    chargeContext: {
      startPose: {
        xUd: zocCharger.xUd,
        yUd: zocCharger.yUd,
        rotationRadians: zocCharger.rotationRadians,
      },
      remainingChargeRangeUd: 4,
      allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
    },
  });

  const zocBlockedTarget = getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-zoc-target');
  assert.equal(zocBlockedTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(zocBlockedTarget?.reason ?? '', /ZoC/);
  assert.match(zocBlockedTarget?.reason ?? '', /charge-drill-p2-zoc-sentry/);
});

test('charge declaration keeps the pure drill zoc target blocked under full family search', () => {
  const scenario = createChargeDrillScenario();
  const candidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-pure-zoc-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const pureZocBlockedTarget = getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-pure-zoc-target');
  assert.equal(pureZocBlockedTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(pureZocBlockedTarget?.reason ?? '', /ZoC/);
  assert.match(pureZocBlockedTarget?.reason ?? '', /charge-drill-p2-pure-zoc-sentry/);
});

test('charge declaration keeps the evade-zoc drill target legal before the later blocked-evade reaction check', () => {
  const scenario = createChargeDrillScenario();
  const candidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-evade-zoc-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    chargeContext: {
      startPose: {
        xUd: 2,
        yUd: 17,
        rotationRadians: 0,
      },
      remainingChargeRangeUd: 4,
      allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
    },
  });

  const evadeZocTarget = getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-evade-zoc-target');
  assert.equal(evadeZocTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
  assert.doesNotMatch(evadeZocTarget?.reason ?? '', /ZoC|blockiert|charge-drill-p1-evade-zoc-sentry/);
});

test('charge declaration keeps the evade-blocker drill target legal before the later blocked-evade reaction check', () => {
  const scenario = createChargeDrillScenario();
  const candidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-evade-blocker-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
    chargeContext: {
      startPose: {
        xUd: 17.75,
        yUd: 17,
        rotationRadians: 0,
      },
      remainingChargeRangeUd: 4,
      allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
    },
  });

  const evadeBlockerTarget = getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-evade-blocker-target');
  assert.equal(evadeBlockerTarget?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
  assert.doesNotMatch(evadeBlockerTarget?.reason ?? '', /ZoC|blockiert|charge-drill-p1-evade-blocker/);
});

test('charge declaration classifies the main drill anchors with stable blocked and eligible buckets', () => {
  const scenario = createChargeDrillScenario();
  const candidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-front-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  assert.equal(getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-front-target')?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
  assert.equal(getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-out-of-range-target')?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);

  const blockedByForeignZoc = getChargeTargetCandidateByUnitId(candidates, 'charge-drill-p2-earlier-contact');
  assert.equal(blockedByForeignZoc?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(blockedByForeignZoc?.reason ?? '', /ZoC/);
  assert.match(blockedByForeignZoc?.reason ?? '', /charge-drill-p2-front-target/);
});

test('charge drill keeps blocker priorities stable across range, friendly blocker, and zoc anchors', () => {
  const scenario = createChargeDrillScenario();

  const frontChargerCandidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-front-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });
  const doubleBlockedCandidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-double-blocked-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });
  const pureZocCandidates = getChargeTargetCandidates({
    units: scenario.units,
    chargingUnitId: 'charge-drill-p1-pure-zoc-charger',
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  assert.match(
    getChargeTargetCandidateByUnitId(frontChargerCandidates, 'charge-drill-p2-out-of-range-target')?.reason ?? '',
    /ausserhalb der Reichweite/,
  );
  assert.match(
    getChargeTargetCandidateByUnitId(doubleBlockedCandidates, 'charge-drill-p2-double-blocker')?.reason ?? '',
    /charge-drill-p1-double-blocker/,
  );
  assert.doesNotMatch(
    getChargeTargetCandidateByUnitId(doubleBlockedCandidates, 'charge-drill-p2-double-blocker')?.reason ?? '',
    /ZoC/,
  );
  assert.match(
    getChargeTargetCandidateByUnitId(pureZocCandidates, 'charge-drill-p2-pure-zoc-target')?.reason ?? '',
    /ZoC/,
  );
  assert.match(
    getChargeTargetCandidateByUnitId(pureZocCandidates, 'charge-drill-p2-pure-zoc-target')?.reason ?? '',
    /charge-drill-p2-pure-zoc-sentry/,
  );
});

test('charge declaration returns no candidates when the charging unit is missing', () => {
  assert.deepEqual(getChargeTargetCandidates({ units: UNITS, chargingUnitId: 'missing', battlefieldProfile: BATTLEFIELD_PROFILE }), []);
  assert.equal(getChargeTargetCandidateByUnitId([], 'enemy-1'), null);
});
