import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BATTLEFIELD_PROFILE_IDS,
  getBattlefieldProfile,
} from '../../data/battlefield-profiles.js';

import { CHARGE_CONTACT_CLASSIFICATION_TYPES } from './classification.js';
import { buildChargeStartSelectionResult, CHARGE_START_MANOEUVRE_TYPES } from './path.js';
import { CHARGE_CONTACT_EVENT_TYPES, resolveChargeContactState } from './contact.js';

const BATTLEFIELD_PROFILE = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

test('charge contact state clips the straight guide to the selected target contact', () => {
  const charger = {
    id: 'charger',
    owner: 'player-1',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 17,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: 0,
  };
  const target = {
    id: 'target',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 13,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const startResult = buildChargeStartSelectionResult({
    selectedUnit: charger,
    targetSnapshot: { unitId: target.id, xUd: target.xUd, yUd: target.yUd },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const contactState = resolveChargeContactState({
    selectedUnit: charger,
    targetUnit: target,
    pathSegments: startResult.pathSegments,
    battlefieldProfile: BATTLEFIELD_PROFILE,
    units: [charger, target],
  });

  assert.equal(contactState.contactEvents.length, 1);
  assert.equal(contactState.contactEvents[0].type, CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT);
  assert.equal(contactState.contactEvents[0].defenderId, 'target');
  assert.ok(contactState.contactEvents[0].guideDistanceUd > 0);
  assert.ok(contactState.contactEvents[0].guideDistanceUd < startResult.pathSegments[0].distanceUd);
  assert.deepEqual(contactState.contactEvents[0].contactSnapshot?.chargerOriginPose, {
    xUd: charger.xUd,
    yUd: charger.yUd,
    rotationRadians: charger.rotationRadians,
  });
  assert.deepEqual(contactState.contactEvents[0].contactSnapshot?.chargerStartPose, startResult.startPose);
  assert.deepEqual(contactState.contactEvents[0].contactSnapshot?.defenderPose, {
    xUd: target.xUd,
    yUd: target.yUd,
    rotationRadians: target.rotationRadians,
  });
  assert.equal(contactState.contactEvents[0].classification?.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT);
  assert.equal(
    contactState.pathSegments.find((segment) => segment.kind === 'charge-direction-guide')?.distanceUd,
    contactState.contactEvents[0].guideDistanceUd,
  );
});

test('charge contact state reports an earlier enemy contact before the selected target', () => {
  const charger = {
    id: 'charger',
    owner: 'player-1',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 17,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: 0,
  };
  const earlierEnemy = {
    id: 'earlier-enemy',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 14.9,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const target = {
    id: 'target',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 13,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const startResult = buildChargeStartSelectionResult({
    selectedUnit: charger,
    targetSnapshot: { unitId: target.id, xUd: target.xUd, yUd: target.yUd },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const contactState = resolveChargeContactState({
    selectedUnit: charger,
    targetUnit: target,
    pathSegments: startResult.pathSegments,
    battlefieldProfile: BATTLEFIELD_PROFILE,
    units: [charger, earlierEnemy, target],
  });

  assert.equal(contactState.contactEvents.length, 1);
  assert.equal(contactState.contactEvents[0].type, CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT);
  assert.equal(contactState.contactEvents[0].defenderId, 'earlier-enemy');
  assert.match(contactState.diagnostics[0]?.text ?? '', /earlier-enemy/);
  assert.ok(contactState.contactEvents[0].guideDistanceUd < startResult.pathSegments[0].distanceUd);
  assert.equal(contactState.contactEvents[0].contactSnapshot?.selectedTargetPose?.yUd, target.yUd);
  assert.equal(contactState.contactEvents[0].contactSnapshot?.defenderPose?.yUd, earlierEnemy.yUd);
  assert.equal(contactState.contactEvents[0].classification?.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT);
});

test('charge contact state refines first touch instead of stopping at the next coarse path sample', () => {
  const charger = {
    id: 'charger',
    owner: 'player-1',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 17,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: 0,
  };
  const target = {
    id: 'target',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 13.047,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const startResult = buildChargeStartSelectionResult({
    selectedUnit: charger,
    targetSnapshot: { unitId: target.id, xUd: target.xUd, yUd: target.yUd },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const contactState = resolveChargeContactState({
    selectedUnit: charger,
    targetUnit: target,
    pathSegments: startResult.pathSegments,
    battlefieldProfile: BATTLEFIELD_PROFILE,
    units: [charger, target],
  });

  assert.equal(contactState.contactEvents.length, 1);
  assert.equal(contactState.contactEvents[0].type, CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT);
  assert.ok(Math.abs(contactState.contactEvents[0].guideDistanceUd - 3.203) < 0.02);
  assert.ok(contactState.contactEvents[0].guideDistanceUd < 3.25);
});

test('charge contact state reports a friendly blocker before the selected target', () => {
  const charger = {
    id: 'charger',
    owner: 'player-1',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 17,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: 0,
  };
  const friendlyBlocker = {
    id: 'friendly-blocker',
    owner: 'player-1',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 14.9,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: 0,
  };
  const target = {
    id: 'target',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 13,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const startResult = buildChargeStartSelectionResult({
    selectedUnit: charger,
    targetSnapshot: { unitId: target.id, xUd: target.xUd, yUd: target.yUd },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const contactState = resolveChargeContactState({
    selectedUnit: charger,
    targetUnit: target,
    pathSegments: startResult.pathSegments,
    battlefieldProfile: BATTLEFIELD_PROFILE,
    units: [charger, friendlyBlocker, target],
  });

  assert.equal(contactState.contactEvents.length, 1);
  assert.equal(contactState.contactEvents[0].type, CHARGE_CONTACT_EVENT_TYPES.FRIENDLY_BLOCKER);
  assert.equal(contactState.contactEvents[0].defenderId, 'friendly-blocker');
  assert.match(contactState.diagnostics[0]?.text ?? '', /eigenen Blocker/);
  assert.ok(contactState.contactEvents[0].guideDistanceUd < startResult.pathSegments[0].distanceUd);
});

test('charge contact state reports battlefield edge when the straight path ends before any contact', () => {
  const charger = {
    id: 'charger',
    owner: 'player-1',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 1.4,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: 0,
  };
  const target = {
    id: 'target',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 10,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const startResult = buildChargeStartSelectionResult({
    selectedUnit: charger,
    targetSnapshot: { unitId: target.id, xUd: target.xUd, yUd: target.yUd },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const contactState = resolveChargeContactState({
    selectedUnit: charger,
    targetUnit: target,
    pathSegments: startResult.pathSegments,
    battlefieldProfile: BATTLEFIELD_PROFILE,
    units: [charger, target],
  });

  assert.deepEqual(contactState.contactEvents, []);
  assert.match(contactState.diagnostics[0]?.text ?? '', /Spielfeldkante/);
  assert.ok(
    (contactState.pathSegments.find((segment) => segment.kind === 'charge-direction-guide')?.distanceUd ?? 0)
      < (startResult.pathSegments[0]?.distanceUd ?? 0),
  );
});

test('charge contact state resolves equal-distance overlaps deterministically by contact priority and defender id', () => {
  const charger = {
    id: 'charger',
    owner: 'player-1',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 17,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: 0,
  };
  const blockerA = {
    id: 'alpha-enemy',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 4.5,
    yUd: 13,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const blockerB = {
    id: 'beta-enemy',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5.5,
    yUd: 13,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const target = {
    id: 'target',
    owner: 'player-2',
    troopType: 'cavalry',
    xUd: 5,
    yUd: 12,
    widthUd: 1,
    depthUd: 0.75,
    baseShape: 'rectangle',
    rotationRadians: Math.PI,
  };
  const startResult = buildChargeStartSelectionResult({
    selectedUnit: charger,
    targetSnapshot: { unitId: target.id, xUd: target.xUd, yUd: target.yUd },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile: BATTLEFIELD_PROFILE,
  });

  const contactState = resolveChargeContactState({
    selectedUnit: charger,
    targetUnit: target,
    pathSegments: startResult.pathSegments,
    battlefieldProfile: BATTLEFIELD_PROFILE,
    units: [charger, blockerB, target, blockerA],
  });

  assert.equal(contactState.contactEvents.length, 1);
  assert.equal(contactState.contactEvents[0].type, CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT);
  assert.equal(contactState.contactEvents[0].defenderId, 'alpha-enemy');
});