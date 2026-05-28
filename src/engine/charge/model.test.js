import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_REACTION_REQUEST_TYPES,
  EVADE_CHOICE_HANDOFF_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createChargeBranchDistanceState,
  createChargeConformationPlan,
  createEvadeChoiceHandoff,
  createEvadeMoveResolution,
  createChargeFollowThroughResolution,
  createChargeIntent,
  createChargeReactionRequest,
  createInitialChargePreview,
} from './index.js';

test('charge preview model initializes as a serializable placeholder spine', () => {
  const preview = createInitialChargePreview();

  assert.equal(preview.status, CHARGE_PREVIEW_STATUSES.IDLE);
  assert.equal(preview.intent, null);
  assert.deepEqual(preview.unitRollbackSnapshot, []);
  assert.deepEqual(preview.pathSegments, []);
  assert.deepEqual(preview.contactEvents, []);
  assert.deepEqual(preview.reactionRequests, []);
  assert.equal(preview.secondaryReactionDecision, null);
  assert.deepEqual(preview.branchDistanceRoll, createChargeBranchDistanceState());
  assert.equal(preview.evadePlan, null);
  assert.deepEqual(preview.evadeMove, createEvadeMoveResolution());
  assert.deepEqual(preview.evadeChoiceHandoff, createEvadeChoiceHandoff());
  assert.deepEqual(preview.followThroughResolution, createChargeFollowThroughResolution());
  assert.deepEqual(preview.conformationPlan, createChargeConformationPlan());
  assert.deepEqual(preview.diagnostics, []);
  assert.doesNotThrow(() => JSON.stringify(preview));
});

test('charge branch distance state keeps serializable history and active claim slots', () => {
  const state = createChargeBranchDistanceState({
    history: [{ claim: { reason: 'evade-distance' }, result: { dieRoll: 6 } }],
    claim: { reason: 'adjusted-charge-distance' },
  });

  assert.deepEqual(state.history, [{ claim: { reason: 'evade-distance' }, result: { dieRoll: 6 } }]);
  assert.deepEqual(state.claim, { reason: 'adjusted-charge-distance' });
  assert.equal(state.result, null);
  assert.doesNotThrow(() => JSON.stringify(state));
});

test('charge intent and reaction helpers keep explicit placeholder fields', () => {
  const intent = createChargeIntent({
    unitId: 'u-1',
    frozenDirectionRadians: Math.PI / 2,
  });
  const reaction = createChargeReactionRequest({
    type: CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE,
    unitId: 'u-2',
  });

  assert.equal(intent.unitId, 'u-1');
  assert.equal(intent.targetUnitId, null);
  assert.equal(intent.startPose, null);
  assert.equal(Number(intent.frozenDirectionRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));

  assert.equal(reaction.type, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
  assert.equal(reaction.unitId, 'u-2');
  assert.equal(reaction.status, 'idle');
  assert.deepEqual(reaction.diagnostics, []);
});

test('follow-through resolution helper preserves serializable caught-versus-secondary state', () => {
  const resolution = createChargeFollowThroughResolution({
    status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET,
    defenderId: 'u-3',
    selectedTargetId: 'u-2',
    contactType: 'earlier-enemy-contact',
  });

  assert.equal(resolution.status, CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET);
  assert.equal(resolution.defenderId, 'u-3');
  assert.equal(resolution.selectedTargetId, 'u-2');
  assert.equal(resolution.contactType, 'earlier-enemy-contact');
  assert.doesNotThrow(() => JSON.stringify(resolution));
});

test('follow-through resolution helper preserves caught-evader posture and cohesion hooks', () => {
  const resolution = createChargeFollowThroughResolution({
    status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.CAUGHT_EVADER,
    defenderId: 'u-3',
    combatPosture: CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES.REAR_ATTACK,
    cohesionLoss: {
      amount: 1,
      reason: 'caught-evader',
      exceptionStatus: 'light-charger-check-pending',
    },
  });

  assert.equal(resolution.combatPosture, CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES.REAR_ATTACK);
  assert.deepEqual(resolution.cohesionLoss, {
    amount: 1,
    reason: 'caught-evader',
    exceptionStatus: 'light-charger-check-pending',
  });
  assert.doesNotThrow(() => JSON.stringify(resolution));
});

test('evade move resolution preserves committed replay facts', () => {
  const resolution = createEvadeMoveResolution({
    status: EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED,
    reactingUnitId: 'target-1',
    actingPlayerId: 'player-2',
    declarationSnapshot: { targetUnitId: 'target-1' },
    startPose: { xUd: 5, yUd: 13, rotationRadians: Math.PI },
    reorientedPose: { xUd: 5, yUd: 13, rotationRadians: 0 },
    finalPose: { xUd: 5, yUd: 9, rotationRadians: 0 },
    distanceUd: 4,
    remainingDistanceUd: 4,
    rollResult: { dieRoll: 4 },
    autoCommit: true,
    notice: 'Evade committed.',
    tableExit: { exitsTable: true, removeFromPlay: true },
    endHalfTurnHook: { available: true, applied: true, reason: 'light-troop-end-half-turn' },
    cannotShootHook: true,
    repeatEvadeHook: { increment: 1 },
    sourceStatus: 'verified',
  });

  assert.equal(resolution.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(resolution.reactingUnitId, 'target-1');
  assert.equal(resolution.finalPose?.yUd, 9);
  assert.equal(resolution.autoCommit, true);
  assert.equal(resolution.tableExit?.exitsTable, true);
  assert.equal(resolution.endHalfTurnHook?.applied, true);
  assert.equal(resolution.cannotShootHook, true);
  assert.deepEqual(resolution.repeatEvadeHook, { increment: 1 });
  assert.doesNotThrow(() => JSON.stringify(resolution));
});

test('evade choice handoff preserves serializable hotseat handoff facts', () => {
  const handoff = createEvadeChoiceHandoff({
    status: EVADE_CHOICE_HANDOFF_STATUSES.PENDING,
    reactingUnitId: 'target-1',
    reactingPlayerId: 'player-2',
    targetLabel: 'P2 Front Target',
    prompt: 'Bitte Spieler B den Ausweichzug machen.',
    nextViewMode: 'player-two-view',
    returnViewMode: 'canonical',
  });

  assert.equal(handoff.status, EVADE_CHOICE_HANDOFF_STATUSES.PENDING);
  assert.equal(handoff.reactingPlayerId, 'player-2');
  assert.equal(handoff.nextViewMode, 'player-two-view');
  assert.equal(handoff.returnViewMode, 'canonical');
  assert.doesNotThrow(() => JSON.stringify(handoff));
});