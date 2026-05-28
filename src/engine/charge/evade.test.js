import test from 'node:test';
import assert from 'node:assert/strict';

import { createChargeDrillScenario } from '../../data/charge-drill-scenarios.js';

import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
} from './classification.js';
import { CHARGE_CONTACT_EVENT_TYPES } from './contact.js';

import {
  CHARGE_BRANCH_DISTANCE_OUTCOMES,
  CHARGE_BRANCH_ROLL_REASONS,
  EVADE_CHOICE_KINDS,
  EVADE_INITIAL_BRANCH_IDS,
  createChargeBranchRollResult,
  createChargeBranchRollClaim,
  resolveAdjustedChargeFollowThroughContactState,
  resolveAdjustedChargeFollowThroughPlan,
  evaluateSimpleBlockedEvade,
  resolveIsolatedSingleUnitEvadePlan,
  resolveAdjustedChargeDistanceRoll,
  resolveEvadeDistanceRoll,
} from './evade.js';
import { detectNextHardEvadeConflict, getDirectionWheelCandidates } from './evade-solver.js';

test('createChargeBranchRollClaim preserves replay-relevant identifiers', () => {
  const claim = createChargeBranchRollClaim({
    reason: CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
    actingPlayerId: 'player-2',
    reactingUnitId: 'target-1',
    chargingUnitId: 'charger-1',
    targetUnitId: 'target-1',
    actionLogToken: 'token-1',
  });

  assert.deepEqual(claim, {
    reason: CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
    actingPlayerId: 'player-2',
    reactingUnitId: 'target-1',
    chargingUnitId: 'charger-1',
    targetUnitId: 'target-1',
    declarationSnapshot: null,
    actionLogToken: 'token-1',
  });
});

test('evade distance roll maps 1 to movement minus 1 UD', () => {
  const result = resolveEvadeDistanceRoll({ dieRoll: 1, baseDistanceUd: 4 });

  assert.equal(result.distanceOutcome, CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_MINUS_ONE);
  assert.equal(result.modifierUd, -1);
  assert.equal(result.resolvedDistanceUd, 3);
});

test('evade distance roll maps 2 through 5 to normal movement', () => {
  for (const dieRoll of [2, 3, 4, 5]) {
    const result = resolveEvadeDistanceRoll({ dieRoll, baseDistanceUd: 4 });

    assert.equal(result.distanceOutcome, CHARGE_BRANCH_DISTANCE_OUTCOMES.NORMAL_MOVEMENT);
    assert.equal(result.modifierUd, 0);
    assert.equal(result.resolvedDistanceUd, 4);
  }
});

test('evade distance roll maps 6 to movement plus 1 UD', () => {
  const result = resolveEvadeDistanceRoll({ dieRoll: 6, baseDistanceUd: 4 });

  assert.equal(result.distanceOutcome, CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_PLUS_ONE);
  assert.equal(result.modifierUd, 1);
  assert.equal(result.resolvedDistanceUd, 5);
});

test('adjusted charge distance honors never reduce for heavy infantry style cases', () => {
  const result = resolveAdjustedChargeDistanceRoll({
    dieRoll: 1,
    baseDistanceUd: 3,
    neverReduce: true,
  });

  assert.equal(result.distanceOutcome, CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_MINUS_ONE);
  assert.equal(result.modifierUd, 0);
  assert.equal(result.resolvedDistanceUd, 3);
  assert.equal(result.neverReduce, true);
});

test('charge branch roll resolution rejects non-d6 inputs', () => {
  assert.throws(
    () => resolveAdjustedChargeDistanceRoll({ dieRoll: 0, baseDistanceUd: 4 }),
    /D6 roll from 1 to 6/i,
  );
});

test('isolated evade plan half-turns and moves straight for front contact', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.contactType, CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT);
  assert.equal(plan.reorientedPose.rotationRadians, Math.PI);
  assert.equal(plan.endPose.xUd, 10);
  assert.equal(plan.endPose.yUd, 14);
});

test('isolated evade plan applies a light-troop end half-turn hook after movement', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: {
      id: 'light-defender',
      xUd: 10,
      yUd: 10,
      rotationRadians: 0,
      chargeReactionCapability: { family: 'light-infantry' },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.reorientedPose.rotationRadians, Math.PI);
  assert.equal(plan.endPose.xUd, 10);
  assert.equal(plan.endPose.yUd, 14);
  assert.equal(plan.endPose.rotationRadians, 0);
  assert.equal(plan.endHalfTurnHook?.available, true);
  assert.equal(plan.endHalfTurnHook?.applied, true);
  assert.equal(plan.endHalfTurnHook?.reason, 'light-troop-end-half-turn');
  assert.deepEqual(plan.pathSegments.map((segment) => segment.kind), ['evade-straight', 'evade-end-half-turn']);
  assert.equal(plan.pathSegments[0]?.distanceUd, 4);
  assert.equal(plan.pathSegments[1]?.distanceUd, 0);
});

test('isolated evade plan applies a light-troop end half-turn hook from profile-backed default abilities', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: {
      id: 'profile-light-defender',
      xUd: 10,
      yUd: 10,
      rotationRadians: 0,
      profileId: 'light-infantry',
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.endHalfTurnHook?.available, true);
  assert.equal(plan.endHalfTurnHook?.applied, true);
  assert.equal(plan.endHalfTurnHook?.reason, 'light-troop-end-half-turn');
  assert.deepEqual(plan.pathSegments.map((segment) => segment.kind), ['evade-straight', 'evade-end-half-turn']);
});

test('charge drill light-troop hook lane keeps the fixture half-turn hook in the scenario itself', () => {
  const scenario = createChargeDrillScenario();
  const reactingUnit = scenario.units.find((unit) => unit.id === 'charge-drill-p2-light-troop-hook-target');

  assert.ok(reactingUnit);

  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit,
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: {
        xUd: reactingUnit.xUd,
        yUd: reactingUnit.yUd,
        rotationRadians: reactingUnit.rotationRadians,
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: scenario.battlefield,
    units: scenario.units.filter((unit) => unit.id !== reactingUnit.id),
  });

  assert.equal(plan.sourceStatus, 'verified');
  assert.equal(plan.endHalfTurnHook?.available, true);
  assert.equal(plan.endHalfTurnHook?.applied, true);
  assert.equal(plan.endHalfTurnHook?.reason, 'light-troop-end-half-turn');
  assert.deepEqual(plan.pathSegments.map((segment) => segment.kind), ['evade-straight', 'evade-end-half-turn']);
});

test('charge drill cavalry bow lane stays a mounted evade lane without the light-troop half-turn hook', () => {
  const scenario = createChargeDrillScenario();
  const reactingUnit = scenario.units.find((unit) => unit.id === 'charge-drill-p2-cavalry-bow-target');

  assert.ok(reactingUnit);

  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit,
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: {
        xUd: reactingUnit.xUd,
        yUd: reactingUnit.yUd,
        rotationRadians: reactingUnit.rotationRadians,
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: scenario.battlefield,
    units: scenario.units.filter((unit) => unit.id !== reactingUnit.id),
  });

  assert.equal(plan.sourceStatus, 'verified');
  assert.equal(plan.endHalfTurnHook?.available ?? false, false);
  assert.equal(plan.endHalfTurnHook?.applied ?? false, false);
  assert.equal(plan.pathSegments.map((segment) => segment.kind).includes('evade-end-half-turn'), false);
  assert.equal(reactingUnit.chargeReactionCapability?.hasBow, true);
});

test('isolated evade plan quarter-turns away from a right-flank contact', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.contactType, CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK);
  assert.equal(Number(plan.reorientedPose.rotationRadians.toFixed(3)), Number((Math.PI * 1.5).toFixed(3)));
  assert.equal(plan.endPose.xUd, 6);
  assert.equal(plan.endPose.yUd, 10);
});

test('isolated evade plan keeps facing and moves forward for rear contact', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.contactType, CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR);
  assert.equal(plan.reorientedPose.rotationRadians, 0);
  assert.equal(plan.endPose.xUd, 10);
  assert.equal(plan.endPose.yUd, 6);
});

test('isolated evade plan uses selected rear-or-flank side to resolve the supported turn', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    selectedContactSide: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR,
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.contactType, CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR);
  assert.equal(plan.endPose.yUd, 6);
});

test('isolated evade plan leaves table-edge exits source-open in the current P7A subset', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 1, yUd: 1, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 1, yUd: 1, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 6, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
  });

  assert.equal(plan.sourceStatus, 'needs-source-check');
  assert.equal(plan.diagnostics[0]?.code, 'charge.evade.table-edge');
  assert.equal(plan.endPose, null);
  assert.equal(plan.tableExit, null);
  assert.deepEqual(plan.avoidanceCandidates, []);
});

test('isolated evade plan flags overlapping end poses as needs-source-check in the current subset', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'blocker', xUd: 10, yUd: 6, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.sourceStatus, 'needs-source-check');
  assert.equal(plan.diagnostics[0]?.code, 'charge.evade.final-overlap');
});

test('isolated evade plan allows exact edge-to-edge end contact without interpenetration diagnostics', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'touching-blocker', xUd: 10, yUd: 5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.sourceStatus, 'verified');
  assert.deepEqual(plan.diagnostics, []);
  assert.equal(plan.endPose?.xUd, 10);
  assert.equal(plan.endPose?.yUd, 6);
});

test('isolated evade plan applies the single legal slide and deducts it from remaining evade distance', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'left-overlap', xUd: 9.5, yUd: 6, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.sourceStatus, 'verified');
  assert.equal(plan.avoidanceSteps.length, 1);
  assert.equal(plan.avoidanceSteps[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps[0]?.side, 'right');
  assert.equal(plan.spentAvoidanceUd > 0, true);
  assert.equal(Number(plan.remainingDistanceUd?.toFixed(3)), 0.497);
  assert.equal(plan.endPose.xUd > 10, true);
  assert.equal(plan.diagnostics.length, 0);
  assert.deepEqual(plan.pathSegments.map((segment) => segment.kind), ['evade-straight', 'evade-slide', 'evade-straight']);
  assert.match(plan.avoidanceCandidates[0]?.id ?? '', /^final-overlap-slide-right-0\.50097/);
  assert.equal(Number(plan.avoidanceCandidates[0]?.intermediatePose?.xUd?.toFixed(3)), Number(plan.avoidanceSteps[0]?.endPose?.xUd?.toFixed(3)));
  assert.equal(Number(plan.avoidanceCandidates[0]?.intermediatePose?.yUd?.toFixed(3)), Number(plan.avoidanceSteps[0]?.endPose?.yUd?.toFixed(3)));
  assert.notEqual(Number(plan.avoidanceCandidates[0]?.intermediatePose?.yUd?.toFixed(3)), Number(plan.endPose?.yUd?.toFixed(3)));
  assert.equal(Number(plan.avoidanceSteps[0]?.distanceUd?.toFixed(3)), 0.501);
  assert.equal(Number(plan.avoidanceSteps[0]?.startPose?.yUd?.toFixed(3)), 6.998);
  assert.equal(Number(plan.pathSegments[0]?.endPose?.yUd?.toFixed(3)), 6.998);
  assert.equal(plan.pathSegments[1]?.xUd, 10);
  assert.equal(Number(plan.pathSegments[2]?.xUd?.toFixed(3)), 10.501);
});

test('isolated evade plan resolves the exact front drill overlap with a late left slide', () => {
  const scenario = createChargeDrillScenario();
  const reactingUnit = scenario.units.find((unit) => unit.id === 'charge-drill-p2-front-target');

  assert.ok(reactingUnit);

  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit,
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: {
        xUd: reactingUnit.xUd,
        yUd: reactingUnit.yUd,
        rotationRadians: reactingUnit.rotationRadians,
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 6, baseDistanceUd: 4 }),
    battlefieldProfile: scenario.battlefield,
    units: scenario.units.filter((unit) => !['charge-drill-p2-front-target', 'charge-drill-p1-front-charger'].includes(unit.id)),
  });

  assert.equal(plan.sourceStatus, 'verified');
  assert.equal(plan.choiceRequired, false);
  assert.deepEqual(plan.diagnostics, []);
  assert.equal(plan.avoidanceCandidates.length, 1);
  assert.equal(plan.avoidanceCandidates[0]?.type, 'slide');
  assert.equal(plan.avoidanceCandidates[0]?.side, 'left');
  assert.equal(plan.avoidanceSteps[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps[0]?.side, 'left');
  assert.equal(Number(plan.avoidanceSteps[0]?.distanceUd?.toFixed(3)), 0.948);
  assert.equal(Number(plan.endPose?.xUd?.toFixed(3)), 5.052);
  assert.equal(Number(plan.endPose?.yUd?.toFixed(3)), 8.948);
});

test('isolated evade plan accepts a 1 UD later slide that exactly clears a path blocker edge', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 9.3, yUd: 13.6, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: { xUd: 9.3, yUd: 13.6, rotationRadians: Math.PI },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 6, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'path-blocker', xUd: 9.3, yUd: 11.1, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
    ],
  });

  assert.equal(plan.sourceStatus, 'verified');
  assert.equal(plan.choiceRequired, false);
  assert.deepEqual(plan.diagnostics, []);
  assert.equal(plan.avoidanceCandidates.length, 1);
  assert.equal(plan.avoidanceCandidates[0]?.id, 'slide-left-1.000');
  assert.deepEqual(plan.avoidanceCandidates[0]?.blockerUnitIds, ['path-blocker']);
  assert.deepEqual(plan.avoidanceSteps.map((step) => step.type), ['slide']);
  assert.equal(plan.avoidanceSteps[0]?.distanceUd, 1);
  assert.equal(plan.endPose.xUd, 8.3);
  assert.equal(plan.endPose.yUd, 9.6);
});

test('isolated evade plan leaves an actual final overlap unresolved when remaining distance cannot clear the blocker', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 1, baseDistanceUd: 4.1 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'center-blocker', xUd: 10, yUd: 6.2, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'right-lane-blocker', xUd: 10.8, yUd: 6.2, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.sourceStatus, 'needs-source-check');
  assert.equal(plan.choiceRequired, false);
  assert.deepEqual(plan.avoidanceCandidates, []);
  assert.equal(plan.diagnostics[0]?.code, 'charge.evade.final-overlap');
  assert.equal(plan.endPose, null);
});

test('isolated evade plan applies a single legal direct-blocker clearance slide before the straight evade move', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'front-blocker', xUd: 10.2, yUd: 8.9, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'right-blocker', xUd: 11, yUd: 8.9, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.sourceStatus, 'verified');
  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.avoidanceSteps.length, 1);
  assert.equal(plan.avoidanceSteps[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps[0]?.side, 'left');
  assert.equal(plan.spentAvoidanceUd, 0.8);
  assert.equal(plan.remainingDistanceUd, Number((plan.distanceUd - plan.spentAvoidanceUd).toFixed(3)));
  assert.equal(plan.endPose.xUd < 10, true);
  assert.equal(plan.endPose.yUd, 6.8);
  assert.equal(plan.diagnostics.length, 0);
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type.includes('direction-wheel')), false);
  assert.deepEqual(plan.pathSegments.map((segment) => segment.kind), ['evade-slide', 'evade-straight']);
});

test('isolated evade plan auto-selects one no-wheel slide when both direct-blocker clearance slides remain legal', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'front-blocker', xUd: 10, yUd: 8.9, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.avoidanceCandidates.length, 1);
  assert.equal(plan.avoidanceCandidates[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps.length, 1);
  assert.equal(plan.sourceStatus, 'verified');
});

test('isolated evade plan keeps only the best candidate inside one initial branch', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      chargerStartPose: { xUd: 10, yUd: 14, rotationRadians: Math.PI },
      chargerContactPose: { xUd: 10, yUd: 10.875, rotationRadians: Math.PI },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'front-blocker', xUd: 10, yUd: 8.9, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'left-deeper-blocker', xUd: 8.6, yUd: 6.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.avoidanceCandidates.length, 1);
  assert.equal(plan.avoidanceCandidates[0]?.id, 'direct-slide-right-1.000');
  assert.equal(plan.endPose?.xUd, 11);
  assert.equal(plan.endPose?.yUd, 7);
});

test('isolated evade plan blocks the former obstacle-wheel lane after sampled arc safety rejects the bypass', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'front-blocker', xUd: 9.5, yUd: 8.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'left-obstacle', xUd: 7, yUd: 6.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'right-obstacle', xUd: 10.5, yUd: 6.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.sourceStatus, 'needs-source-check');
  assert.equal(plan.endPose, null);
  assert.equal(plan.avoidanceCandidates.length, 0);
  assert.equal(plan.avoidanceSteps.length, 0);
  assert.equal(plan.diagnostics.some((entry) => entry.code === 'charge.evade.blocked'), true);
});

test('isolated evade plan resolves the drill double-blocker evade with a slide', () => {
  const scenario = createChargeDrillScenario();
  const reactingUnit = scenario.units.find((unit) => unit.id === 'charge-drill-p2-double-blocker');

  assert.ok(reactingUnit);

  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit,
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: {
        xUd: reactingUnit.xUd,
        yUd: reactingUnit.yUd,
        rotationRadians: reactingUnit.rotationRadians,
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 6, baseDistanceUd: 4 }),
    battlefieldProfile: scenario.battlefield,
    units: scenario.units.filter((unit) => unit.id !== reactingUnit.id),
  });

  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.avoidanceCandidates.length >= 1, true);
  assert.equal(plan.avoidanceCandidates[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps[0]?.type, 'slide');
});

test('isolated evade plan does not treat the live post-slide flank contact as an immediate overlap', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'unit-20', xUd: 11.8, yUd: 13.6, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 11.8, yUd: 13.6, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      {
        id: 'charge-drill-p2-flank-target',
        xUd: 11.075,
        yUd: 12.725,
        widthUd: 1,
        depthUd: 0.75,
        baseShape: 'rectangle',
        rotationRadians: Math.PI * 1.5,
      },
    ],
  });

  const firstEncounter = plan.decisionTrace.find((entry) => entry.stage === 'path-avoidance-encounter') ?? null;

  assert.ok(firstEncounter);
  assert.equal(firstEncounter?.firstOverlap?.travelledDistanceUd > 0, true);
  assert.equal(plan.avoidanceCandidates[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps[0]?.type, 'slide');
});

test('isolated evade plan prefers the direct slide in the live-like unit 20 blocker geometry', () => {
  const scenario = createChargeDrillScenario();
  const reactingUnit = scenario.units.find((unit) => unit.id === 'charge-drill-p2-double-blocker');
  const flankTarget = scenario.units.find((unit) => unit.id === 'charge-drill-p2-flank-target');

  assert.ok(reactingUnit);
  assert.ok(flankTarget);

  reactingUnit.xUd = 11.8;
  reactingUnit.yUd = 13.6;
  reactingUnit.rotationRadians = Math.PI;
  flankTarget.xUd = 11.075;
  flankTarget.yUd = 12.725;
  flankTarget.rotationRadians = Math.PI * 1.5;

  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit,
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    contactSnapshot: {
      defenderPose: {
        xUd: reactingUnit.xUd,
        yUd: reactingUnit.yUd,
        rotationRadians: reactingUnit.rotationRadians,
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 6, baseDistanceUd: 4 }),
    battlefieldProfile: scenario.battlefield,
    units: scenario.units.filter((unit) => unit.id !== reactingUnit.id),
  });

  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.avoidanceCandidates[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps.length, 2);
  assert.equal(plan.avoidanceSteps[0]?.type, 'slide');
  assert.equal(plan.avoidanceSteps[0]?.distanceUd < 1, true);
  assert.equal(plan.avoidanceSteps[1]?.type, 'slide');
  assert.equal(plan.avoidanceSteps.some((step) => step.type === 'obstacle-wheel'), false);
});

test('isolated evade plan offers an optional direction wheel to match the charge direction', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
  });

  const directionWheelCandidate = plan.avoidanceCandidates.find((candidate) => candidate.type === 'direction-wheel') ?? null;

  assert.equal(plan.choiceRequired, true);
  assert.ok(directionWheelCandidate);
  assert.equal(directionWheelCandidate?.pivotSide, 'left');
  assert.equal(Number(directionWheelCandidate?.angleRadians?.toFixed(3)), Number((Math.PI / 2).toFixed(3)));
  assert.equal(directionWheelCandidate?.remainingDistanceUd, 2.5);
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type === 'straight'), true);
});

test('evade wayfinding v2 hard-conflict detection reports the next swept-path unit blocker conservatively', () => {
  const conflict = detectNextHardEvadeConflict({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
    startPose: { xUd: 10, yUd: 10, rotationRadians: Math.PI },
    distanceUd: 4,
    units: [
      { id: 'front-blocker', xUd: 10, yUd: 12, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'far-blocker', xUd: 10, yUd: 14, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
    ignoredUnitIds: ['defender'],
  });

  assert.equal(conflict?.type, 'hard-unit-conflict');
  assert.equal(conflict?.blockerKind, 'unit-conservative-hard-blocker');
  assert.deepEqual(conflict?.blockerUnitIds, ['front-blocker']);
  assert.equal(conflict?.friendlyInterpenetrationPolicy, 'conservative-block-unless-source-locked');
  assert.equal(Number.isFinite(conflict?.travelledDistanceUd), true);
  assert.equal(Number.isFinite(conflict?.manoeuvreTravelledDistanceUd), true);
  assert.equal((conflict?.manoeuvreTravelledDistanceUd ?? Infinity) < (conflict?.travelledDistanceUd ?? -Infinity), true);
  assert.ok(conflict?.manoeuvrePose);
});

test('isolated evade plan can defer the initial wheel-versus-current-orientation choice before solving branches', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    deferInitialBranchChoice: true,
  });

  assert.equal(plan.choiceRequired, true);
  assert.equal(plan.choiceKind, EVADE_CHOICE_KINDS.INITIAL_BRANCH);
  assert.deepEqual(
    plan.avoidanceCandidates.map((candidate) => candidate.id),
    [EVADE_INITIAL_BRANCH_IDS.CURRENT_ORIENTATION, EVADE_INITIAL_BRANCH_IDS.DIRECTION_WHEEL],
  );
  assert.equal(plan.endPose, null);
});

test('isolated evade plan removes the straight option when the straight path crosses a friendly unit', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'friendly-blocker', xUd: 8, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.choiceRequired, true);
  assert.equal(plan.sourceStatus, 'needs-source-check');
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type === 'slide'), true);
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type === 'direction-wheel'), true);
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type === 'straight'), false);
  assert.deepEqual(plan.avoidanceSteps, []);
});

test('isolated evade plan can offer a direction wheel followed by a later slide around a new blocker', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'friendly-blocker', xUd: 9.25, yUd: 11, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  const chainedCandidate = plan.avoidanceCandidates.find((candidate) => candidate.type === 'direction-wheel-slide') ?? null;

  assert.equal(plan.choiceRequired, true);
  assert.ok(chainedCandidate);
  assert.deepEqual(chainedCandidate?.avoidanceSteps.map((step) => step.type), ['direction-wheel', 'slide']);
  assert.equal(chainedCandidate?.pivotSide, null);
  assert.equal(chainedCandidate?.side, 'right');
  assert.equal(Number(chainedCandidate?.distanceUd?.toFixed(3)), 1);
  assert.deepEqual(chainedCandidate?.blockerUnitIds, ['friendly-blocker']);
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type === 'straight'), true);
});

test('isolated evade plan records bounded selected-branch analysis for explicit branch comparison', () => {
  const sharedInput = {
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      chargerStartPose: { xUd: 14, yUd: 10, rotationRadians: Math.PI },
      chargerContactPose: { xUd: 10.875, yUd: 10, rotationRadians: Math.PI },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'friendly-blocker', xUd: 9.25, yUd: 11, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  };

  const currentOrientationPlan = resolveIsolatedSingleUnitEvadePlan({
    ...sharedInput,
    selectedInitialBranch: EVADE_INITIAL_BRANCH_IDS.CURRENT_ORIENTATION,
  });
  const directionWheelPlan = resolveIsolatedSingleUnitEvadePlan({
    ...sharedInput,
    selectedInitialBranch: EVADE_INITIAL_BRANCH_IDS.DIRECTION_WHEEL,
  });

  const currentOrientationAnalysis = currentOrientationPlan.decisionTrace.find((entry) => entry.stage === 'selected-branch-analysis') ?? null;
  const directionWheelAnalysis = directionWheelPlan.decisionTrace.find((entry) => entry.stage === 'selected-branch-analysis') ?? null;
  const directionWheelRanking = directionWheelPlan.decisionTrace.find((entry) => entry.stage === 'direction-wheel-branch-ranked') ?? null;

  assert.ok(currentOrientationAnalysis);
  assert.ok(directionWheelAnalysis);
  assert.equal(currentOrientationAnalysis?.selectedInitialBranch, EVADE_INITIAL_BRANCH_IDS.CURRENT_ORIENTATION);
  assert.equal(directionWheelAnalysis?.selectedInitialBranch, EVADE_INITIAL_BRANCH_IDS.DIRECTION_WHEEL);
  assert.equal(directionWheelAnalysis?.candidateCounts?.directionWheel >= 1, true);
  assert.equal(directionWheelAnalysis?.selectedCandidateAnalysis?.branchKey, 'direction-wheel');
  assert.equal(directionWheelAnalysis?.selectedCandidateAnalysis?.firstLaterStepType, 'slide');
  assert.equal(directionWheelAnalysis?.selectedCandidateAnalysis?.branchRankingPolicy, 'direction-wheel-branch-retention');
  assert.equal(directionWheelAnalysis?.selectedCandidateAnalysis?.branchRankingReasonCodes.includes('prefer-more-reserve-after-first-later-step'), true);
  assert.equal(directionWheelAnalysis?.selectedCandidateAnalysis?.branchRankingCorridorScore?.firstLaterStepType, 'slide');
  assert.equal(directionWheelAnalysis?.selectedCandidateAnalysis?.branchRankingCandidateCount >= 1, true);
  assert.equal(Number.isFinite(directionWheelAnalysis?.selectedCandidateAnalysis?.firstLaterRemainingDistanceUd), true);
  assert.equal(Number.isFinite(directionWheelAnalysis?.stageTimingsMs?.directionWheelMs), true);
  assert.ok(directionWheelRanking);
  assert.equal(directionWheelRanking?.selectedCandidateAnalysis?.branchRankingPolicy, 'direction-wheel-branch-retention');
  assert.equal(directionWheelRanking?.preRankCandidateCount >= directionWheelRanking?.candidateCount, true);
});

test('direction-wheel solver can select a slide-root wheel-back bypass that returns toward the flee corridor', () => {
  const scenario = createChargeDrillScenario();
  const reactingUnit = scenario.units.find((unit) => unit.id === 'charge-drill-p2-double-blocker');

  assert.ok(reactingUnit);

  const decisionTrace = [];
  const candidates = getDirectionWheelCandidates({
    reactingUnit,
    reorientedPose: { xUd: reactingUnit.xUd, yUd: reactingUnit.yUd, rotationRadians: 0 },
    distanceUd: 5,
    chargeDirectionRadians: Math.PI * 2 - Math.PI / 6,
    battlefieldProfile: scenario.battlefield,
    units: scenario.units.filter((unit) => unit.id !== reactingUnit.id),
    ignoredUnitIds: [reactingUnit.id],
    branchReferencePose: { xUd: 14, yUd: 17, rotationRadians: 0 },
    decisionTrace,
  });

  const candidate = candidates[0] ?? null;
  const rootWayfindingTrace = decisionTrace.find((entry) => entry.stage === 'wayfinding-v2-patterns' && entry.recursionDepth === 0) ?? null;
  const recursiveWayfindingTrace = decisionTrace.find((entry) => entry.stage === 'wayfinding-v2-patterns' && entry.recursionDepth === 1) ?? null;

  assert.equal(candidates.length, 1);
  assert.equal(candidate?.analysis?.generationSource, 'wayfinding-v2-pattern');
  assert.equal(candidate?.analysis?.wayfindingV2Used, true);
  assert.equal(candidate?.analysis?.wayfindingPatternId, 'slide-left-straight->wheel-right-0.262-straight-wheel-left-0.262');
  assert.deepEqual(candidate?.avoidanceSteps.map((step) => step.type), ['direction-wheel', 'slide', 'obstacle-wheel', 'obstacle-wheel']);
  assert.equal(candidate?.avoidanceSteps.filter((step) => step.type === 'obstacle-wheel').length, 2);
  assert.equal(candidate?.avoidanceSteps.some((step) => step.type === 'slide'), true);
  assert.equal(candidate?.analysis?.wayfindingReasonCodes?.includes('recursive-hard-conflict-chain'), true);
  assert.equal(candidate?.analysis?.wayfindingReasonCodes?.includes('wheel-arc-swept-check-sampled'), true);
  assert.equal(candidate?.analysis?.branchRankingReasonCodes?.includes('prefer-slide-first-corridor-bypass'), true);
  assert.equal(candidate?.analysis?.branchRankingReasonCodes?.includes('prefer-lower-manoeuvre-ud-spend'), true);
  assert.equal(candidate?.analysis?.branchRankingReasonCodes?.includes('prefer-more-reserve-after-first-later-step'), true);
  assert.equal(candidate?.analysis?.branchRankingCorridorScore?.firstLaterStepType, 'slide');
  assert.equal(candidate?.analysis?.branchRankingCorridorScore?.laterSlideCount, 1);
  assert.equal(candidate?.analysis?.branchRankingCorridorScore?.maxLateralDeviationUd <= 0.3, true);
  assert.equal(rootWayfindingTrace?.acceptedCandidateCount >= 1, true);
  assert.equal(rootWayfindingTrace?.conflict?.friendlyInterpenetrationPolicy, 'conservative-block-unless-source-locked');
  assert.equal(Boolean(recursiveWayfindingTrace?.conflict || recursiveWayfindingTrace?.reason === 'no-hard-conflict'), true);
});

test('evade wayfinding treats impassable hard blockers as V2 conflicts', () => {
  const decisionTrace = [];
  const candidates = getDirectionWheelCandidates({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    reorientedPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    distanceUd: 4,
    chargeDirectionRadians: Math.PI / 6,
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [{
      id: 'terrain:impassable-rock',
      xUd: 11,
      yUd: 8,
      widthUd: 1.2,
      depthUd: 1,
      baseShape: 'rectangle',
      rotationRadians: 0,
      evadeHardBlockerKind: 'impassable-terrain-hard-blocker',
    }],
    ignoredUnitIds: ['defender'],
    branchReferencePose: { xUd: 10, yUd: 9.125, rotationRadians: 0 },
    decisionTrace,
  });

  const wayfindingTrace = decisionTrace.find((entry) => entry.stage === 'wayfinding-v2-patterns') ?? null;

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.analysis?.wayfindingV2Used, true);
  assert.equal(wayfindingTrace?.conflict?.blockerKind, 'impassable-terrain-hard-blocker');
  assert.deepEqual(wayfindingTrace?.conflict?.blockerUnitIds, ['terrain:impassable-rock']);
});

test('direction-wheel solver prefers an accepted wheel-back realignment over a one-way wheel-out when no slide lane exists', () => {
  const decisionTrace = [];
  const candidates = getDirectionWheelCandidates({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    reorientedPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    distanceUd: 5,
    chargeDirectionRadians: Math.PI * 1.75,
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'front-left-blocker', xUd: 8, yUd: 6, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'slide-lane-blocker', xUd: 5.75, yUd: 7.5, widthUd: 1.5, depthUd: 1.5, baseShape: 'rectangle', rotationRadians: 0 },
    ],
    ignoredUnitIds: ['defender'],
    branchReferencePose: { xUd: 14, yUd: 10, rotationRadians: 0 },
    decisionTrace,
  });

  const candidate = candidates[0] ?? null;
  const rootWayfindingTrace = decisionTrace.find((entry) => entry.stage === 'wayfinding-v2-patterns' && entry.recursionDepth === 0) ?? null;
  const rankedTrace = decisionTrace.find((entry) => entry.stage === 'direction-wheel-branch-ranked') ?? null;

  assert.equal(candidates.length, 1);
  assert.equal(candidate?.analysis?.generationSource, 'wayfinding-v2-pattern');
  assert.equal(candidate?.analysis?.wayfindingPatternId, 'wheel-left-0.785-straight-wheel-right-0.785');
  assert.deepEqual(candidate?.avoidanceSteps.map((step) => step.type), ['direction-wheel', 'obstacle-wheel', 'obstacle-wheel']);
  assert.equal(candidate?.analysis?.wayfindingReasonCodes?.includes('realignment-wheel-back'), true);
  assert.equal(rootWayfindingTrace?.patternCandidates?.some((pattern) => pattern.patternId === 'wheel-left-0.785-straight' && pattern.status === 'accepted'), true);
  assert.equal(rootWayfindingTrace?.patternCandidates?.some((pattern) => pattern.patternId === 'wheel-left-0.785-straight-wheel-right-0.785' && pattern.status === 'accepted'), true);
  assert.equal(rootWayfindingTrace?.patternCandidates?.some((pattern) => pattern.patternId === 'slide-left-straight' && pattern.status === 'accepted'), false);
  assert.equal(rootWayfindingTrace?.patternCandidates?.some((pattern) => pattern.patternId === 'slide-right-straight' && pattern.status === 'accepted'), false);
  assert.equal(rankedTrace?.selectedCandidateId, candidate?.id ?? null);
});

test('isolated evade plan keeps all simultaneous encounter blockers on later wheel-slide candidates', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'blocker-a', xUd: 9.25, yUd: 11, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'blocker-b', xUd: 9.4, yUd: 11.2, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  const chainedCandidate = plan.avoidanceCandidates.find((candidate) => candidate.type === 'direction-wheel-slide') ?? null;

  assert.ok(chainedCandidate);
  assert.deepEqual(chainedCandidate?.blockerUnitIds, ['blocker-a', 'blocker-b']);
  assert.equal(Number(chainedCandidate?.distanceUd?.toFixed(3)), 1);
});

test('isolated evade plan auto-selects the farther no-wheel slide when the alternatives are not a clear 50/50', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      chargerStartPose: { xUd: 10, yUd: 14, rotationRadians: Math.PI },
      chargerContactPose: { xUd: 10, yUd: 10.875, rotationRadians: Math.PI },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'front-blocker', xUd: 9.5, yUd: 8.9, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.avoidanceCandidates.length, 1);
  assert.equal(plan.avoidanceCandidates[0]?.id, 'direct-slide-right-0.500');
  assert.equal(plan.avoidanceSteps[0]?.side, 'right');
  assert.equal(plan.endPose?.xUd, 10.5);
  assert.equal(plan.endPose?.yUd, 6.5);
});

test('isolated evade plan can resolve the former obstacle-wheel drill with a refined slide below the coarse 0.25 UD grid', () => {
  const plan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'blocker-a', xUd: 7.5, yUd: 9, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'blocker-b', xUd: 7, yUd: 9.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  const refinedSlideCandidate = plan.avoidanceCandidates.find((candidate) => candidate.type === 'slide') ?? null;

  assert.ok(refinedSlideCandidate);
  assert.equal(Number(refinedSlideCandidate?.distanceUd?.toFixed(3)), 0.5);
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type === 'obstacle-wheel'), false);
  assert.equal(Number.isFinite(refinedSlideCandidate?.endPose?.xUd), true);
  assert.equal(Number.isFinite(refinedSlideCandidate?.endPose?.yUd), true);
});

test('simple blocked evade uses the exact shorter slide distance for an off-centre blocker', () => {
  const evaluation = evaluateSimpleBlockedEvade({
    reorientedUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, rotationRadians: Math.PI },
    units: [
      { id: 'front-blocker', xUd: 10.2, yUd: 11.1, widthUd: 1, depthUd: 1, rotationRadians: 0 },
    ],
  });

  assert.equal(evaluation.isBlocked, false);
  assert.deepEqual(evaluation.clearanceSlides, [
    { side: 'right', distanceUd: 0.8 },
  ]);
});

test('simple blocked evade reports blocked when directly-ahead blockers cannot be cleared within 1 UD', () => {
  const evaluation = evaluateSimpleBlockedEvade({
    reorientedUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, rotationRadians: Math.PI },
    units: [
      { id: 'front-blocker', xUd: 10, yUd: 11.1, widthUd: 1, depthUd: 1, rotationRadians: 0 },
      { id: 'left-blocker', xUd: 9, yUd: 11.1, widthUd: 1, depthUd: 1, rotationRadians: 0 },
      { id: 'right-blocker', xUd: 11, yUd: 11.1, widthUd: 1, depthUd: 1, rotationRadians: 0 },
    ],
  });

  assert.equal(evaluation.isBlocked, true);
  assert.deepEqual(evaluation.clearanceSlides, []);
  assert.deepEqual(evaluation.blockerUnitIds, ['front-blocker']);
});

test('simple blocked evade stays clear when a slide of 1 UD or less opens a lane', () => {
  const evaluation = evaluateSimpleBlockedEvade({
    reorientedUnit: { id: 'defender', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, rotationRadians: Math.PI },
    units: [
      { id: 'front-blocker', xUd: 10.2, yUd: 11.1, widthUd: 1, depthUd: 1, rotationRadians: 0 },
    ],
  });

  assert.equal(evaluation.isBlocked, false);
  assert.equal(evaluation.clearanceSlides.length > 0, true);
});

test('adjusted charge follow-through plan moves straight from the frozen charge start pose', () => {
  const plan = resolveAdjustedChargeFollowThroughPlan({
    chargingUnit: { id: 'charger', xUd: 5, yUd: 17, rotationRadians: 0 },
    declarationSnapshot: {
      frozenDirectionRadians: 0,
      contactEvent: {
        contactSnapshot: {
          chargerStartPose: { xUd: 5, yUd: 17, rotationRadians: 0 },
          chargerContactPose: { xUd: 5, yUd: 13.75, rotationRadians: 0 },
        },
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.chargingUnitId, 'charger');
  assert.equal(plan.startPose?.xUd, 5);
  assert.equal(plan.startPose?.yUd, 17);
  assert.equal(plan.distanceUd, 4);
  assert.equal(plan.endPose?.xUd, 5);
  assert.equal(plan.endPose?.yUd, 13);
});

test('adjusted charge follow-through marks impetuous chargers as forced to continue the full distance', () => {
  const plan = resolveAdjustedChargeFollowThroughPlan({
    chargingUnit: {
      id: 'charger',
      troopType: 'cavalry',
      xUd: 5,
      yUd: 17,
      rotationRadians: 0,
      chargeReactionCapability: {
        family: 'cavalry',
        hasImpetuous: true,
      },
    },
    declarationSnapshot: {
      frozenDirectionRadians: 0,
      contactEvent: {
        contactSnapshot: {
          chargerStartPose: { xUd: 5, yUd: 17, rotationRadians: 0 },
          chargerContactPose: { xUd: 5, yUd: 13.75, rotationRadians: 0 },
        },
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
  });

  assert.equal(plan.continuationChoice?.required, false);
  assert.equal(plan.continuationChoice?.isImpetuous, true);
  assert.equal(plan.continuationChoice?.selectedOption, 'continue');
  assert.equal(plan.continuationChoice?.minimumDistanceUd, 2);
  assert.equal(plan.continuationChoice?.maximumDistanceUd, 4);
  assert.equal(plan.distanceUd, 4);
});

test('adjusted charge follow-through contact state can detect a caught evader on the straight continuation', () => {
  const contactState = resolveAdjustedChargeFollowThroughContactState({
    chargingUnit: {
      id: 'charger',
      owner: 'player-1',
      troopType: 'cavalry',
      xUd: 5,
      yUd: 17,
      widthUd: 1,
      depthUd: 0.75,
      baseShape: 'rectangle',
      rotationRadians: 0,
    },
    declarationSnapshot: {
      frozenDirectionRadians: 0,
      contactEvent: {
        contactSnapshot: {
          chargerStartPose: { xUd: 5, yUd: 17, rotationRadians: 0 },
          chargerContactPose: { xUd: 5, yUd: 13.75, rotationRadians: 0 },
        },
      },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 2 }),
    evadePlan: {
      reactingUnitId: 'target',
      endPose: { xUd: 5, yUd: 15, rotationRadians: Math.PI },
    },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      {
        id: 'charger',
        owner: 'player-1',
        troopType: 'cavalry',
        xUd: 5,
        yUd: 17,
        widthUd: 1,
        depthUd: 0.75,
        baseShape: 'rectangle',
        rotationRadians: 0,
      },
      {
        id: 'target',
        owner: 'player-2',
        troopType: 'cavalry',
        xUd: 5,
        yUd: 13,
        widthUd: 1,
        depthUd: 0.75,
        baseShape: 'rectangle',
        rotationRadians: Math.PI,
      },
    ],
  });

  assert.equal(contactState?.contactEvents?.length, 1);
  assert.equal(contactState?.contactEvents?.[0]?.type, CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT);
  assert.equal(contactState?.contactEvents?.[0]?.defenderId, 'target');
  assert.ok((contactState?.contactEvents?.[0]?.guideDistanceUd ?? 0) <= 2);
});






