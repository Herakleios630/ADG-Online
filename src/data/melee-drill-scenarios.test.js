import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMeleeCommanderPresenceScenario,
  createMeleeDrillScenario,
  createP9V2Mini11BPair11vs12FixtureRows,
  createMeleeV2DrillScenarioPayload,
  MELEE_DRILL_SCENARIO_ID,
  MELEE_PLACEMENT_RESULT_STATUSES,
  resolveMeleeDrillPlacementIntent,
} from './melee-drill-scenarios.js';
import { UNIT_PROFILE_IDS } from './unit-profiles.js';
import { getFootprintCommandRangeMeasurement } from '../engine/command/range.js';
import { classifyChargeContact } from '../engine/charge/classification.js';
import { getUnitBaseGeometry, worldPointToLocalPoint } from '../engine/geometry/index.js';
import { validateMeleeContactEvidenceGeometry } from '../engine/melee/contact-geometry.js';

function getResolvedUnitGeometryInAnchorFrame({ resolution, anchorUnit, unit }) {
  const resolvedUnit = {
    ...unit,
    xUd: resolution.pose.xUd,
    yUd: resolution.pose.yUd,
    rotationRadians: resolution.pose.rotationRadians,
  };
  const resolvedGeometry = getUnitBaseGeometry({
    center: { x: resolvedUnit.xUd, y: resolvedUnit.yUd },
    widthUd: resolvedUnit.widthUd,
    depthUd: resolvedUnit.depthUd,
    rotationRadians: resolvedUnit.rotationRadians,
  });
  const anchorFrame = {
    center: { x: anchorUnit.xUd, y: anchorUnit.yUd },
    widthUd: anchorUnit.widthUd,
    depthUd: anchorUnit.depthUd,
    rotationRadians: anchorUnit.rotationRadians ?? 0,
  };

  const mapPoint = (point) => worldPointToLocalPoint(anchorFrame, point);
  return {
    corners: {
      frontLeft: mapPoint(resolvedGeometry.corners.frontLeft),
      frontRight: mapPoint(resolvedGeometry.corners.frontRight),
      rearLeft: mapPoint(resolvedGeometry.corners.rearLeft),
      rearRight: mapPoint(resolvedGeometry.corners.rearRight),
    },
    frontEdge: {
      start: mapPoint(resolvedGeometry.frontEdge.start),
      end: mapPoint(resolvedGeometry.frontEdge.end),
    },
    leftEdge: {
      start: mapPoint(resolvedGeometry.leftFlankEdge.start),
      end: mapPoint(resolvedGeometry.leftFlankEdge.end),
    },
    rightEdge: {
      start: mapPoint(resolvedGeometry.rightFlankEdge.start),
      end: mapPoint(resolvedGeometry.rightFlankEdge.end),
    },
  };
}

function pointDistanceToSegment(point, segmentStart, segmentEnd) {
  const px = Number(point?.x ?? 0);
  const py = Number(point?.y ?? 0);
  const x1 = Number(segmentStart?.x ?? 0);
  const y1 = Number(segmentStart?.y ?? 0);
  const x2 = Number(segmentEnd?.x ?? 0);
  const y2 = Number(segmentEnd?.y ?? 0);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared <= Number.EPSILON) {
    return Math.hypot(px - x1, py - y1);
  }

  const tRaw = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, tRaw));
  const projectionX = x1 + t * dx;
  const projectionY = y1 + t * dy;
  return Math.hypot(px - projectionX, py - projectionY);
}

test('melee drill scenario includes simultaneous contacts and mirrored pending opponents', () => {
  const scenario = createMeleeDrillScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));
  const frontlineA = unitsById.get('melee-drill-p1-frontline-a');
  const frontlineB = unitsById.get('melee-drill-p1-frontline-b');
  const attachedCommanderB = unitsById.get('melee-drill-p1-commander-b');
  const defenderA = unitsById.get('melee-drill-p2-frontline-a');
  const defenderB = unitsById.get('melee-drill-p2-frontline-b');
  const flankingA = unitsById.get('melee-drill-p1-flank-c');
  const flankedB = unitsById.get('melee-drill-p2-frontline-c-flanked');
  const supportA = unitsById.get('melee-drill-p1-support-a');
  const supportCase1MainA = unitsById.get('melee-drill-case1-main-a');
  const supportCase1MainD = unitsById.get('melee-drill-case1-main-d');
  const supportCase2MainA = unitsById.get('melee-drill-case2-main-a');
  const supportCase2MainD = unitsById.get('melee-drill-case2-main-d');
  const supportCase2Rear = unitsById.get('melee-drill-case2-rear');
  const supportCase2FlankLeft = unitsById.get('melee-drill-case2-flank-left');
  const supportCase2FlankRight = unitsById.get('melee-drill-case2-flank-right');

  assert.equal(scenario.id, MELEE_DRILL_SCENARIO_ID);
  assert.match(scenario.label, /Melee Drill/i);
  assert.match(scenario.description, /queue ordering/i);

  assert.equal(supportA?.owner, frontlineA?.owner);
  assert.equal(supportA?.rotationRadians, frontlineA?.rotationRadians);
  assert.equal(frontlineB?.attachedCommanderId, 'melee-drill-p1-commander-b');
  assert.equal(attachedCommanderB?.attachedUnitId, 'melee-drill-p1-frontline-b');
  assert.equal(attachedCommanderB?.isCommander, true);
  assert.equal(attachedCommanderB?.profileId, UNIT_PROFILE_IDS.COMMANDER);
  assert.notEqual(attachedCommanderB?.profileId, UNIT_PROFILE_IDS.LIGHT_INFANTRY);
  assert.notEqual(attachedCommanderB?.profileId, UNIT_PROFILE_IDS.CAVALRY);
  assert.equal(attachedCommanderB?.troopType, 'general');
  assert.equal(attachedCommanderB?.scenarioTroopFamily, 'general');
  assert.equal(attachedCommanderB?.scenarioMeleeTraits?.includes('commander-only'), true);
  assert.equal(
    Math.abs((attachedCommanderB?.yUd ?? 0) - (frontlineB?.yUd ?? 0)),
    ((attachedCommanderB?.depthUd ?? 0) + (frontlineB?.depthUd ?? 0)) / 2,
  );
  assert.equal(getFootprintCommandRangeMeasurement(frontlineB, attachedCommanderB)?.distanceUd, 0);

  assert.equal(unitsById.get('melee-drill-p2-frontline-a')?.rotationRadians, Math.PI);
  assert.equal(unitsById.get('melee-drill-p2-frontline-b')?.facing, 'south');

  assert.equal(frontlineA?.profileId, UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN);
  assert.equal(frontlineB?.profileId, UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN);
  assert.equal(defenderA?.profileId, UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN);
  assert.equal(defenderB?.profileId, UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN);
  assert.equal(supportA?.profileId, UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN);
  assert.equal(flankingA?.profileId, UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS);
  assert.equal(flankedB?.profileId, UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT);
  assert.equal(supportA?.scenarioMeleeTraits?.includes('javelin'), true);
  assert.equal(flankingA?.scenarioMeleeTraits?.includes('impetuous'), true);
  assert.equal(flankedB?.scenarioMeleeTraits?.includes('impact'), true);

  const representativeProfileIds = new Set(scenario.units.map((unit) => unit.profileId));
  assert.equal(representativeProfileIds.has(UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN), true);
  assert.equal(representativeProfileIds.has(UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN), true);
  assert.equal(representativeProfileIds.has(UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN), true);
  assert.equal(representativeProfileIds.has(UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS), true);
  assert.equal(representativeProfileIds.has(UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT), true);

  assert.equal(supportCase1MainA?.rotationRadians, 0);
  assert.equal(supportCase1MainD?.rotationRadians, Math.PI);
  assert.equal(supportCase2MainA?.rotationRadians, 0);
  assert.equal(supportCase2MainD?.rotationRadians, Math.PI);
  assert.equal(unitsById.get('melee-drill-case1-side-melee')?.facing, 'west');
  assert.ok(Math.abs((unitsById.get('melee-drill-case1-side-melee')?.rotationRadians ?? 0) - (Math.PI * 3) / 2) <= 1e-6);
  assert.equal(unitsById.get('melee-drill-case2-flank-left')?.facing, 'east');
  assert.equal(unitsById.get('melee-drill-case2-flank-right')?.facing, 'west');
  assert.equal(unitsById.get('melee-drill-case1-main-a')?.meleeContactEvidence?.contactSide, 'front');
  assert.equal(unitsById.get('melee-drill-case1-main-a')?.meleeContactEvidence?.sourceStatus, 'verified');
  assert.equal(unitsById.get('melee-drill-case2-main-a')?.meleeContactEvidence?.contactSide, 'front');
  assert.equal(unitsById.get('melee-drill-case2-main-a')?.meleeContactEvidence?.sourceStatus, 'verified');
  assert.equal(unitsById.get('melee-drill-case2-rear')?.meleeContactEvidence?.contactRelationship, 'rear-edge-to-front-edge');

  assert.equal(frontlineA?.xUd, defenderA?.xUd);
  assert.equal(frontlineB?.xUd, defenderB?.xUd);
  assert.equal(Math.abs((frontlineA?.yUd ?? 0) - (defenderA?.yUd ?? 0)), ((frontlineA?.depthUd ?? 0) + (defenderA?.depthUd ?? 0)) / 2);
  assert.equal(Math.abs((frontlineB?.yUd ?? 0) - (defenderB?.yUd ?? 0)), ((frontlineB?.depthUd ?? 0) + (defenderB?.depthUd ?? 0)) / 2);
  assert.equal(Math.abs((supportA?.xUd ?? 0) - (frontlineA?.xUd ?? 0)), ((supportA?.widthUd ?? 0) + (frontlineA?.widthUd ?? 0)) / 2);
  assert.equal(
    Math.abs((supportA?.yUd ?? 0) - (frontlineA?.yUd ?? 0)),
    Math.abs(((frontlineA?.depthUd ?? 0) - (supportA?.depthUd ?? 0)) / 2),
  );

  const flankContactDistance = getFootprintCommandRangeMeasurement(flankingA, flankedB)?.distanceUd ?? Number.POSITIVE_INFINITY;
  assert.ok(flankContactDistance <= 1e-4);
  const flankingGeometry = getUnitBaseGeometry({
    center: { x: flankingA?.xUd ?? 0, y: flankingA?.yUd ?? 0 },
    widthUd: flankingA?.widthUd ?? 0,
    depthUd: flankingA?.depthUd ?? 0,
    rotationRadians: flankingA?.rotationRadians ?? 0,
  });
  const flankedFrame = {
    center: { x: flankedB?.xUd ?? 0, y: flankedB?.yUd ?? 0 },
    widthUd: flankedB?.widthUd ?? 0,
    depthUd: flankedB?.depthUd ?? 0,
    rotationRadians: flankedB?.rotationRadians ?? 0,
  };
  const attackerFrontLocal = [
    worldPointToLocalPoint(flankedFrame, flankingGeometry.frontEdge.start),
    worldPointToLocalPoint(flankedFrame, flankingGeometry.frontEdge.end),
  ];
  const halfWidth = Number(flankedB?.widthUd ?? 0) / 2;
  const halfDepth = Number(flankedB?.depthUd ?? 0) / 2;
  const localXs = attackerFrontLocal.map((point) => point.x);
  const localYs = attackerFrontLocal.map((point) => point.y);
  assert.ok(Math.abs(localXs[0] - localXs[1]) <= 1e-6);
  assert.ok(localYs.some((yValue) => Math.abs(Math.abs(yValue) - halfDepth) <= 0.2));
  assert.ok(localYs.some((yValue) => Math.abs(yValue) > halfDepth + 1e-6));

  const flankClassification = classifyChargeContact({
    chargerUnit: flankingA,
    defenderUnit: flankedB,
    contactSnapshot: {
      chargerStartPose: {
        xUd: flankingA?.xUd,
        yUd: flankingA?.yUd,
        rotationRadians: flankingA?.rotationRadians,
      },
      defenderPose: {
        xUd: flankedB?.xUd,
        yUd: flankedB?.yUd,
        rotationRadians: flankedB?.rotationRadians,
      },
    },
  });
  assert.notEqual(flankClassification.type, 'unclassified');

  const nonContactA = unitsById.get('melee-drill-p1-frontline-c-gap');
  const nonContactB = unitsById.get('melee-drill-p2-frontline-c-gap');
  const nonContactDistance = getFootprintCommandRangeMeasurement(nonContactA, nonContactB)?.distanceUd ?? 0;
  assert.ok(nonContactDistance > 0.2);
});

test('P9-03OA drill acceptance units include movement/conformation trigger bridge metadata', () => {
  const scenario = createMeleeDrillScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));
  const expectedBridgeByUnitId = {
    'melee-drill-p1-flank-c': 'flank',
    'melee-drill-case1-side-melee': 'flank',
    'melee-drill-case2-flank-left': 'flank',
    'melee-drill-case2-flank-right': 'flank',
    'melee-drill-case2-rear': 'rear',
  };

  for (const [unitId, attackContactType] of Object.entries(expectedBridgeByUnitId)) {
    const bridge = unitsById.get(unitId)?.meleeContactEvidence?.meleeTriggerBridge ?? null;
    assert.equal(bridge?.triggerFamily, 'movement-conformation');
    assert.equal(bridge?.attackContactType, attackContactType);
    assert.equal(bridge?.sourceStatus, 'verified');
    assert.equal(bridge?.defenderFactorToZeroEligible, true);
    assert.equal(bridge?.requiresDefenderFrontEngagementForToZero, true);
  }
});

test('p9v2-05 melee drill assigns explicit contact origins for the requested 11 units', () => {
  const scenario = createMeleeDrillScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));

  const expectedOriginsByUnitId = {
    'melee-drill-p1-frontline-a': 'charge-contact',
    'melee-drill-p1-frontline-b': 'charge-contact',
    'melee-drill-p1-support-a': 'move-to-support-contact',
    'melee-drill-p1-flank-c': 'charge-contact',
    'melee-drill-case1-main-a': 'charge-contact',
    'melee-drill-case1-simple-left': 'move-to-support-contact',
    'melee-drill-case1-side-melee': 'charge-contact',
    'melee-drill-case2-main-a': 'charge-contact',
    'melee-drill-case2-simple-left': 'move-to-support-contact',
    'melee-drill-case2-simple-right': 'move-to-support-contact',
    'melee-drill-case2-flank-left': 'charge-contact',
    'melee-drill-case2-flank-right': 'charge-contact',
    'melee-drill-case2-rear': 'charge-contact',
  };

  for (const [unitId, expectedOrigin] of Object.entries(expectedOriginsByUnitId)) {
    const unit = unitsById.get(unitId);
    assert.ok(unit);
    assert.equal(unit?.meleeContactEvidence?.contactOrigin, expectedOrigin);
  }

  assert.equal(unitsById.get('melee-drill-p1-frontline-a')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-p1-frontline-b')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-p1-support-a')?.hasChargedThisSequence, false);
  assert.equal(unitsById.get('melee-drill-p1-flank-c')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-case1-main-a')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-case1-simple-left')?.hasChargedThisSequence, false);
  assert.equal(unitsById.get('melee-drill-case1-side-melee')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-case2-main-a')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-case2-simple-left')?.hasChargedThisSequence, false);
  assert.equal(unitsById.get('melee-drill-case2-simple-right')?.hasChargedThisSequence, false);
  assert.equal(unitsById.get('melee-drill-case2-flank-left')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-case2-flank-right')?.hasChargedThisSequence, true);
  assert.equal(unitsById.get('melee-drill-case2-rear')?.hasChargedThisSequence, true);
});

test('p9v2-02 drill scenario payload contract provides deterministic intent ids and source-status metadata', () => {
  const payload = createMeleeV2DrillScenarioPayload(createMeleeDrillScenario());

  assert.equal(payload.scenarioId, MELEE_DRILL_SCENARIO_ID);
  assert.equal(payload.payloadVersion, 'v2-drill-1');
  assert.ok(Array.isArray(payload.entries));
  assert.ok(payload.entries.length > 0);
  assert.ok(payload.entries.every((entry) => typeof entry.intentId === 'string' && entry.intentId.includes('::')));
  assert.ok(payload.entries.every((entry) => entry.roundStateSeed === 'first-contact'));
  assert.ok(['verified', 'source-open'].includes(payload.sourceStatus));
});

test('p9v2-02 drill scenario payload keeps stable ordering across repeated builds', () => {
  const first = createMeleeV2DrillScenarioPayload(createMeleeDrillScenario());
  const second = createMeleeV2DrillScenarioPayload(createMeleeDrillScenario());

  assert.deepEqual(
    first.entries.map((entry) => entry.intentId),
    second.entries.map((entry) => entry.intentId),
  );
});

test('p9v2-mini-11B pair 11/12 fixture rows stay deterministic with parity-safe arithmetic payloads', () => {
  const rows = createP9V2Mini11BPair11vs12FixtureRows();

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.pairId, '11');
  assert.equal(rows[1]?.pairId, '12');

  assert.deepEqual(rows[0]?.selectedParticipants, rows[1]?.selectedParticipants);
  assert.deepEqual(rows[0]?.fixedDice, rows[1]?.fixedDice);
  assert.deepEqual(rows[0]?.resolutionInput, rows[1]?.resolutionInput);

  assert.equal(rows[0]?.immediateMultipleAttackEvent?.type, 'multiple-attack-immediate');
  assert.equal(rows[0]?.immediateMultipleAttackEvent?.capPerDefenderPerSequencePhase, 1);
  assert.equal(rows[0]?.immediateMultipleAttackEvent?.precondition?.defenderAlreadyInMeleeOrSupport, true);
  assert.equal(rows[0]?.immediateMultipleAttackEvent?.precondition?.newQualifyingFlankRearContact, true);
  assert.equal(rows[0]?.immediateMultipleAttackEvent?.precondition?.triggerContactType, 'flank');
  assert.deepEqual(rows[0]?.immediateMultipleAttackEvent, rows[1]?.immediateMultipleAttackEvent);
});

test('melee drill static coordinates keep expected side and corner contact checks for support and attack lanes', () => {
  const scenario = createMeleeDrillScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));

  const mainA = unitsById.get('melee-drill-case2-main-a');
  const simpleLeft = unitsById.get('melee-drill-case2-simple-left');
  const flankRight = unitsById.get('melee-drill-case2-flank-right');
  const rear = unitsById.get('melee-drill-case2-rear');
  const defenderMain = unitsById.get('melee-drill-case2-main-d');

  const mainFrame = {
    center: { x: mainA?.xUd ?? 0, y: mainA?.yUd ?? 0 },
    widthUd: mainA?.widthUd ?? 0,
    depthUd: mainA?.depthUd ?? 0,
    rotationRadians: mainA?.rotationRadians ?? 0,
  };
  const mainGeometry = getUnitBaseGeometry(mainFrame);
  const halfMainWidth = Number(mainA?.widthUd ?? 0) / 2;
  const halfMainDepth = Number(mainA?.depthUd ?? 0) / 2;

  const simpleLeftGeometry = getUnitBaseGeometry({
    center: { x: simpleLeft?.xUd ?? 0, y: simpleLeft?.yUd ?? 0 },
    widthUd: simpleLeft?.widthUd ?? 0,
    depthUd: simpleLeft?.depthUd ?? 0,
    rotationRadians: simpleLeft?.rotationRadians ?? 0,
  });
  const simpleFrontRightInMainLocal = worldPointToLocalPoint(mainFrame, simpleLeftGeometry.corners.frontRight);
  assert.ok(Math.abs(simpleFrontRightInMainLocal.x + halfMainWidth) <= 1e-6);
  assert.ok(Math.abs(simpleFrontRightInMainLocal.y - halfMainDepth) <= 1e-6);

  const flankDistance = getFootprintCommandRangeMeasurement(flankRight, mainA)?.distanceUd ?? Number.POSITIVE_INFINITY;
  assert.ok(flankDistance <= 1e-4);
  const flankAttackDistanceToDefender = getFootprintCommandRangeMeasurement(flankRight, defenderMain)?.distanceUd ?? Number.POSITIVE_INFINITY;
  assert.ok(flankAttackDistanceToDefender <= 1e-4);

  const rearGeometry = getUnitBaseGeometry({
    center: { x: rear?.xUd ?? 0, y: rear?.yUd ?? 0 },
    widthUd: rear?.widthUd ?? 0,
    depthUd: rear?.depthUd ?? 0,
    rotationRadians: rear?.rotationRadians ?? 0,
  });
  const defenderFrame = {
    center: { x: defenderMain?.xUd ?? 0, y: defenderMain?.yUd ?? 0 },
    widthUd: defenderMain?.widthUd ?? 0,
    depthUd: defenderMain?.depthUd ?? 0,
    rotationRadians: defenderMain?.rotationRadians ?? 0,
  };
  const halfDefenderWidth = Number(defenderMain?.widthUd ?? 0) / 2;
  const halfDefenderDepth = Number(defenderMain?.depthUd ?? 0) / 2;
  const rearFrontLeftInDefenderLocal = worldPointToLocalPoint(defenderFrame, rearGeometry.corners.frontLeft);
  assert.ok(Math.abs(rearFrontLeftInDefenderLocal.x + halfDefenderWidth) <= 1e-6);
  assert.ok(Math.abs(rearFrontLeftInDefenderLocal.y + halfDefenderDepth) <= 1e-6);

  const defenderGeometry = getUnitBaseGeometry({
    center: { x: defenderMain?.xUd ?? 0, y: defenderMain?.yUd ?? 0 },
    widthUd: defenderMain?.widthUd ?? 0,
    depthUd: defenderMain?.depthUd ?? 0,
    rotationRadians: defenderMain?.rotationRadians ?? 0,
  });
  const defenderFrontRightInMainLocal = worldPointToLocalPoint(mainFrame, defenderGeometry.corners.frontRight);
  assert.ok(Math.abs(defenderFrontRightInMainLocal.x + halfMainWidth) <= 1e-6);
  assert.ok(Math.abs(defenderFrontRightInMainLocal.y - halfMainDepth) <= 1e-6);
  assert.equal(defenderMain?.rotationRadians, Math.PI);
});

test('melee drill contact evidence geometry stays valid for all declared relationships', () => {
  const scenario = createMeleeDrillScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));

  for (const unit of scenario.units) {
    if (!unit?.meleeContactEvidence?.contactRelationship) {
      continue;
    }

    const opponentId = unit.meleeContactEvidence.principalOpponentId ?? unit.meleePendingOpponentId;
    const opponentUnit = unitsById.get(opponentId);
    const validation = validateMeleeContactEvidenceGeometry({
      unit,
      opponentUnit,
      contactEvidence: unit.meleeContactEvidence,
    });

    assert.notEqual(validation.status, 'invalid', `${unit.id} failed ${validation.relationship}: ${validation.firstFailCode}`);
  }
});

test('contact geometry validator flags invalid rear-edge-to-front-edge placement', () => {
  const scenario = createMeleeDrillScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));
  const originalRearAttacker = unitsById.get('melee-drill-case2-rear');
  const defender = unitsById.get('melee-drill-case2-main-d');
  const brokenRearAttacker = {
    ...originalRearAttacker,
    yUd: Number(originalRearAttacker?.yUd ?? 0) + 1,
  };

  const validation = validateMeleeContactEvidenceGeometry({
    unit: brokenRearAttacker,
    opponentUnit: defender,
    contactEvidence: brokenRearAttacker.meleeContactEvidence,
  });

  assert.equal(validation.status, 'invalid');
  assert.equal(validation.firstFailCode, 'unit-front-on-opponent-rear');
});

test('placement bridge returns deterministic blocked reason for non-simple anchor-front-enemy selection', () => {
  const anchorUnit = {
    id: 'anchor',
    owner: 'p1',
    xUd: 10,
    yUd: 10,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: 0,
  };
  const unit = {
    id: 'unit',
    owner: 'p1',
    xUd: 0,
    yUd: 0,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: 0,
  };
  const enemyA = {
    id: 'enemy-a',
    owner: 'p2',
    xUd: 10,
    yUd: 9,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: Math.PI,
    meleeContactEvidence: {
      principalOpponentId: 'anchor',
      contactSide: 'front',
    },
  };
  const enemyB = {
    id: 'enemy-b',
    owner: 'p2',
    xUd: 11,
    yUd: 9,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: Math.PI,
    meleeContactEvidence: {
      principalOpponentId: 'anchor',
      contactSide: 'front',
    },
  };

  const noFrontEnemyResolution = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'simple-support-flank-left',
    refMode: 'anchor-front-enemy',
    units: [unit, anchorUnit],
  });
  assert.equal(noFrontEnemyResolution.status, MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED);
  assert.equal(noFrontEnemyResolution.blockedReason, 'non-simple-front-enemy-selection-deferred-post-p16');

  const multiFrontEnemyResolution = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'simple-support-flank-left',
    refMode: 'anchor-front-enemy',
    units: [unit, anchorUnit, enemyA, enemyB],
  });
  assert.equal(multiFrontEnemyResolution.status, MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED);
  assert.equal(multiFrontEnemyResolution.blockedReason, 'non-simple-front-enemy-selection-deferred-post-p16');
});

test('P9-03Z routes all declared V1 tokens and keeps unknown tokens blocked', () => {
  const anchorUnit = {
    id: 'anchor',
    owner: 'p1',
    xUd: 10,
    yUd: 10,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: 0,
    facing: 'north',
  };
  const unit = {
    id: 'unit',
    owner: 'p1',
    xUd: 0,
    yUd: 0,
    widthUd: 1,
    depthUd: 0.75,
    rotationRadians: 0,
    facing: 'north',
  };

  const supportedTokens = [
    'simple-support-left',
    'simple-support-right',
    'flank-attack-left',
    'flank-attack-right',
    'rear-attack',
    'front-attack-full',
    'front-attack-left-offset',
    'front-attack-right-offset',
  ];

  for (const token of supportedTokens) {
    const resolution = resolveMeleeDrillPlacementIntent({
      unit,
      anchorUnit,
      patternToken: token,
      refMode: 'anchor',
      units: [unit, anchorUnit],
    });
    assert.equal(resolution.status, MELEE_PLACEMENT_RESULT_STATUSES.EXACT, token);
  }

  const unknownTokenResolution = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'unknown-pattern-token',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });
  assert.equal(unknownTokenResolution.status, MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED);
  assert.equal(unknownTokenResolution.blockedReason, 'pattern-token-not-routed');
});

test('P9-03Z corrected flank attack formulas satisfy catalog corner and side locks', () => {
  const epsilon = 1e-6;
  const anchorUnit = {
    id: 'anchor',
    owner: 'p1',
    xUd: 20,
    yUd: 10,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: 0,
    facing: 'north',
  };
  const unit = {
    id: 'unit',
    owner: 'p2',
    xUd: 0,
    yUd: 0,
    widthUd: 1,
    depthUd: 0.75,
    rotationRadians: 0,
    facing: 'north',
  };
  const halfAnchorWidth = anchorUnit.widthUd / 2;
  const halfAnchorDepth = anchorUnit.depthUd / 2;

  const leftResolution = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'flank-attack-left',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });
  const rightResolution = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'flank-attack-right',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });

  assert.equal(leftResolution.status, MELEE_PLACEMENT_RESULT_STATUSES.EXACT);
  assert.equal(rightResolution.status, MELEE_PLACEMENT_RESULT_STATUSES.EXACT);

  const leftGeometry = getResolvedUnitGeometryInAnchorFrame({
    resolution: leftResolution,
    anchorUnit,
    unit,
  });
  const rightGeometry = getResolvedUnitGeometryInAnchorFrame({
    resolution: rightResolution,
    anchorUnit,
    unit,
  });

  assert.ok(Math.abs(leftGeometry.frontEdge.start.x + halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(leftGeometry.frontEdge.end.x + halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(leftGeometry.corners.frontLeft.x + halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(leftGeometry.corners.frontLeft.y - halfAnchorDepth) <= epsilon);

  assert.ok(Math.abs(rightGeometry.frontEdge.start.x - halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(rightGeometry.frontEdge.end.x - halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(rightGeometry.corners.frontRight.x - halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(rightGeometry.corners.frontRight.y - halfAnchorDepth) <= epsilon);
});

test('P9-03Z flank-support variants are distinct from plain support and have deterministic endpoint locks', () => {
  const epsilon = 1e-6;
  const anchorUnit = {
    id: 'anchor',
    owner: 'p1',
    xUd: 10,
    yUd: 10,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: 0,
    facing: 'north',
  };
  const unit = {
    id: 'unit',
    owner: 'p1',
    xUd: 0,
    yUd: 0,
    widthUd: 1,
    depthUd: 0.75,
    rotationRadians: 0,
    facing: 'north',
  };
  const halfAnchorWidth = anchorUnit.widthUd / 2;
  const halfAnchorDepth = anchorUnit.depthUd / 2;

  const simpleLeft = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'simple-support-left',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });
  const flankLeft = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'simple-support-flank-left',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });
  const flankRight = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'simple-support-flank-right',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });

  assert.equal(simpleLeft.status, MELEE_PLACEMENT_RESULT_STATUSES.EXACT);
  assert.equal(flankLeft.status, MELEE_PLACEMENT_RESULT_STATUSES.NEEDS_SOURCE_CHECK);
  assert.equal(flankRight.status, MELEE_PLACEMENT_RESULT_STATUSES.NEEDS_SOURCE_CHECK);
  assert.notEqual(simpleLeft.pose.yUd, flankLeft.pose.yUd);

  const flankLeftGeometry = getResolvedUnitGeometryInAnchorFrame({
    resolution: flankLeft,
    anchorUnit,
    unit,
  });
  const flankRightGeometry = getResolvedUnitGeometryInAnchorFrame({
    resolution: flankRight,
    anchorUnit,
    unit,
  });

  assert.ok(Math.abs(flankLeftGeometry.rightEdge.start.x + halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(flankLeftGeometry.rightEdge.end.x + halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(flankLeftGeometry.corners.rearRight.x + halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(flankLeftGeometry.corners.rearRight.y - halfAnchorDepth) <= epsilon);

  assert.ok(Math.abs(flankRightGeometry.leftEdge.start.x - halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(flankRightGeometry.leftEdge.end.x - halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(flankRightGeometry.corners.rearLeft.x - halfAnchorWidth) <= epsilon);
  assert.ok(Math.abs(flankRightGeometry.corners.rearLeft.y - halfAnchorDepth) <= epsilon);
});

test('P9-03Z routes offset front-contact tokens with front-line constraint checks', () => {
  const epsilon = 1e-6;
  const anchorUnit = {
    id: 'anchor',
    owner: 'p1',
    xUd: 10,
    yUd: 10,
    widthUd: 1,
    depthUd: 1,
    rotationRadians: 0,
    facing: 'north',
  };
  const unit = {
    id: 'unit',
    owner: 'p2',
    xUd: 0,
    yUd: 0,
    widthUd: 1,
    depthUd: 0.75,
    rotationRadians: 0,
    facing: 'north',
  };
  const halfAnchorDepth = anchorUnit.depthUd / 2;
  const anchorFrontLeft = { x: -anchorUnit.widthUd / 2, y: halfAnchorDepth };
  const anchorFrontRight = { x: anchorUnit.widthUd / 2, y: halfAnchorDepth };

  const leftOffset = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'front-attack-left-offset',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });
  const rightOffset = resolveMeleeDrillPlacementIntent({
    unit,
    anchorUnit,
    patternToken: 'front-attack-right-offset',
    refMode: 'anchor',
    units: [unit, anchorUnit],
  });

  assert.equal(leftOffset.status, MELEE_PLACEMENT_RESULT_STATUSES.EXACT);
  assert.equal(rightOffset.status, MELEE_PLACEMENT_RESULT_STATUSES.EXACT);

  const leftGeometry = getResolvedUnitGeometryInAnchorFrame({
    resolution: leftOffset,
    anchorUnit,
    unit,
  });
  const rightGeometry = getResolvedUnitGeometryInAnchorFrame({
    resolution: rightOffset,
    anchorUnit,
    unit,
  });

  assert.ok(Math.abs(leftGeometry.frontEdge.start.y - halfAnchorDepth) <= epsilon);
  assert.ok(Math.abs(leftGeometry.frontEdge.end.y - halfAnchorDepth) <= epsilon);
  assert.ok(Math.abs(rightGeometry.frontEdge.start.y - halfAnchorDepth) <= epsilon);
  assert.ok(Math.abs(rightGeometry.frontEdge.end.y - halfAnchorDepth) <= epsilon);

  assert.ok(pointDistanceToSegment(anchorFrontLeft, leftGeometry.frontEdge.start, leftGeometry.frontEdge.end) <= epsilon);
  assert.ok(pointDistanceToSegment(anchorFrontRight, rightGeometry.frontEdge.start, rightGeometry.frontEdge.end) <= epsilon);
});

test('p9v2-13 commander presence drill exposes attached, included, and support-only lanes', () => {
  const scenario = createMeleeCommanderPresenceScenario();
  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));

  const includedMain = unitsById.get('melee-commander-included-main-a');
  const attachedMain = unitsById.get('melee-commander-attached-main-a');
  const attachedCommander = unitsById.get('melee-commander-attached-a');
  const supportOnlyCommander = unitsById.get('melee-commander-support-only-a');

  assert.equal(scenario.id, 'melee-commander-presence-drill');
  assert.equal(includedMain?.hasIncludedCommander, true);
  assert.equal(attachedMain?.attachedCommanderId, 'melee-commander-attached-a');
  assert.equal(attachedCommander?.attachedUnitId, 'melee-commander-attached-main-a');
  assert.equal(attachedCommander?.isCommander, true);
  assert.equal(supportOnlyCommander?.isCommander, true);
  assert.equal(supportOnlyCommander?.meleeContactEvidence?.contactRole, 'simple-support');
});
