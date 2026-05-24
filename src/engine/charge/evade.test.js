import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
} from './classification.js';
import { CHARGE_CONTACT_EVENT_TYPES } from './contact.js';

import {
  CHARGE_BRANCH_DISTANCE_OUTCOMES,
  CHARGE_BRANCH_ROLL_REASONS,
  createChargeBranchRollResult,
  createChargeBranchRollClaim,
  resolveAdjustedChargeFollowThroughContactState,
  resolveAdjustedChargeFollowThroughPlan,
  evaluateSimpleBlockedEvade,
  resolveIsolatedSingleUnitEvadePlan,
  resolveAdjustedChargeDistanceRoll,
  resolveEvadeDistanceRoll,
} from './evade.js';

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

test('isolated evade plan flags table-edge exits as needs-source-check in the current subset', () => {
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
  assert.equal(plan.diagnostics[0]?.code, 'charge.evade.interpenetration');
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
  assert.equal(plan.remainingDistanceUd, Number((plan.distanceUd - plan.spentAvoidanceUd).toFixed(3)));
  assert.equal(plan.endPose.xUd > 10, true);
  assert.equal(plan.diagnostics.length, 0);
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

test('isolated evade plan offers obstacle-wheel choices when direct blockers leave no legal slide lane', () => {
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

  const obstacleWheelCandidates = plan.avoidanceCandidates.filter((candidate) => candidate.type === 'obstacle-wheel');

  assert.equal(plan.choiceRequired, false);
  assert.equal(plan.sourceStatus, 'verified');
  assert.equal(obstacleWheelCandidates.length, 1);
  assert.equal(obstacleWheelCandidates[0]?.pivotSide, 'right');
  assert.equal(obstacleWheelCandidates[0]?.spentDistanceUd, 1.5);
  assert.equal(obstacleWheelCandidates[0]?.remainingDistanceUd, 2.5);
  assert.equal(obstacleWheelCandidates[0]?.blockerUnitIds.includes('front-blocker'), true);
  assert.equal(plan.avoidanceSteps[0]?.type, 'obstacle-wheel');
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
      { id: 'friendly-blocker', xUd: 8.5, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });

  const chainedCandidate = plan.avoidanceCandidates.find((candidate) => candidate.type === 'direction-wheel-slide') ?? null;

  assert.equal(plan.choiceRequired, true);
  assert.ok(chainedCandidate);
  assert.deepEqual(chainedCandidate?.avoidanceSteps.map((step) => step.type), ['direction-wheel', 'slide']);
  assert.equal(chainedCandidate?.pivotSide, null);
  assert.equal(chainedCandidate?.side, 'left');
  assert.equal(Number(chainedCandidate?.distanceUd?.toFixed(3)) > 0, true);
  assert.equal(Number(chainedCandidate?.distanceUd?.toFixed(3)) < 1, true);
  assert.equal(plan.avoidanceCandidates.some((candidate) => candidate.type === 'direction-wheel'), false);
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

test('isolated evade plan can build a later path with multiple obstacle wheels when one wheel is not enough', () => {
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

  const multiWheelCandidate = plan.avoidanceCandidates.find((candidate) => (
    candidate.avoidanceSteps?.filter((step) => step.type === 'obstacle-wheel').length ?? 0
  ) >= 2) ?? null;

  assert.ok(multiWheelCandidate);
  assert.equal(multiWheelCandidate?.type, 'obstacle-wheel');
  assert.equal(multiWheelCandidate?.avoidanceSteps.length >= 3, true);
  assert.equal(Number.isFinite(multiWheelCandidate?.endPose?.xUd), true);
  assert.equal(Number.isFinite(multiWheelCandidate?.endPose?.yUd), true);
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


