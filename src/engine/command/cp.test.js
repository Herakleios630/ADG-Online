import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COMMAND_CP_REASON_CODES,
  COMMAND_CP_SOURCE_STATUS,
  createCommandPointState,
  generateCommandPoints,
  getCommandPointCostBreakdown,
  refundCommandPointsForUnit,
  refundFreeCommandPoint,
  spendCommandPoints,
  spendFreeCommandPoint,
} from './index.js';

test('command point generation follows the current P6 formula anchor deterministically', () => {
  const state = generateCommandPoints({ dieRoll: 5, commanderValue: 2, freeCp: 1 });

  assert.equal(state.available, 5);
  assert.equal(state.spent, 0);
  assert.equal(state.free, 1);
  assert.equal(state.lastRoll, 5);
  assert.equal(state.ledger.length, 2);
  assert.equal(state.ledger[0].reasonCode, COMMAND_CP_REASON_CODES.ACTIVATION_ROLL);
  assert.equal(state.sourceStatus, COMMAND_CP_SOURCE_STATUS);
});

test('command point cost breakdown composes approved P6 surcharges additively', () => {
  const breakdown = getCommandPointCostBreakdown({
    inCommand: false,
    difficultManoeuvre: true,
    commanderEngaged: true,
  });

  assert.equal(breakdown.totalCost, 4);
  assert.deepEqual(
    breakdown.components.map((entry) => entry.reasonCode),
    [
      COMMAND_CP_REASON_CODES.BASE_ORDER,
      COMMAND_CP_REASON_CODES.OUT_OF_COMMAND,
      COMMAND_CP_REASON_CODES.DIFFICULT_MANOEUVRE,
      COMMAND_CP_REASON_CODES.COMMANDER_ENGAGED,
    ],
  );
});

test('command point cost breakdown can assign the free CP to the base order cost', () => {
  const breakdown = getCommandPointCostBreakdown({
    inCommand: false,
    useFreeCommandPoint: true,
  });

  assert.equal(breakdown.totalCost, 2);
  assert.equal(breakdown.usesFreeCommandPoint, true);
  assert.equal(breakdown.freeCommandPointDelta, -1);
  assert.deepEqual(
    breakdown.components.map((entry) => [entry.reasonCode, entry.amount]),
    [
      [COMMAND_CP_REASON_CODES.FREE_CP, -1],
      [COMMAND_CP_REASON_CODES.OUT_OF_COMMAND, 1],
    ],
  );
});

test('spending command points appends auditable ledger entries and reduces availability', () => {
  const initialState = createCommandPointState({
    available: 4,
    spent: 0,
    free: 1,
    lastRoll: 4,
    ledger: [],
  });
  const spendResult = spendCommandPoints(
    initialState,
    getCommandPointCostBreakdown({ inCommand: true, difficultManoeuvre: true }),
    { unitId: 'p1-c1-cav-1' },
  );

  assert.equal(spendResult.ok, true);
  assert.equal(spendResult.nextState.available, 2);
  assert.equal(spendResult.nextState.spent, 2);
  assert.equal(spendResult.nextState.ledger.length, 2);
  assert.ok(spendResult.nextState.ledger.every((entry) => entry.unitId === 'p1-c1-cav-1'));
});

test('insufficient command points return a deterministic failure without mutating state', () => {
  const initialState = createCommandPointState({ available: 1, spent: 0, free: 1, ledger: [] });
  const spendResult = spendCommandPoints(
    initialState,
    getCommandPointCostBreakdown({ inCommand: false, difficultManoeuvre: true }),
  );

  assert.equal(spendResult.ok, false);
  assert.equal(spendResult.shortage, 2);
  assert.equal(spendResult.nextState, initialState);
});

test('spending and refunding the free commander CP updates availability and ledger deterministically', () => {
  const initialState = createCommandPointState({
    available: 4,
    spent: 0,
    free: 1,
    lastRoll: 4,
    ledger: [],
  });

  const spendResult = spendFreeCommandPoint(initialState, { unitId: 'test-unit-1' });

  assert.equal(spendResult.ok, true);
  assert.equal(spendResult.nextState.available, 3);
  assert.equal(spendResult.nextState.spent, 0);
  assert.equal(spendResult.nextState.free, 0);
  assert.equal(spendResult.nextState.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(spendResult.nextState.ledger.at(-1).amount, -1);
  assert.equal(spendResult.nextState.ledger.at(-1).unitId, 'test-unit-1');

  const refundResult = refundFreeCommandPoint(spendResult.nextState, { unitId: 'test-unit-1' });

  assert.equal(refundResult.ok, true);
  assert.equal(refundResult.nextState.available, 4);
  assert.equal(refundResult.nextState.spent, 0);
  assert.equal(refundResult.nextState.free, 1);
  assert.equal(refundResult.nextState.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(refundResult.nextState.ledger.at(-1).amount, 1);
  assert.equal(refundResult.nextState.ledger.at(-1).unitId, 'test-unit-1');
});

test('generic command-point spending can consume the free CP for a commander-led order', () => {
  const initialState = createCommandPointState({
    available: 4,
    spent: 0,
    free: 1,
    lastRoll: 4,
    ledger: [],
  });

  const spendResult = spendCommandPoints(
    initialState,
    getCommandPointCostBreakdown({ inCommand: true, useFreeCommandPoint: true }),
    { unitId: 'p1-c3-hi-1' },
  );

  assert.equal(spendResult.ok, true);
  assert.equal(spendResult.nextState.available, 3);
  assert.equal(spendResult.nextState.spent, 0);
  assert.equal(spendResult.nextState.free, 0);
  assert.equal(spendResult.nextState.ledger[0].reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(spendResult.nextState.ledger[0].amount, -1);
});

test('refunding command points for one unit restores only that unit ledger usage', () => {
  const state = createCommandPointState({
    available: 1,
    spent: 2,
    free: 0,
    lastRoll: 4,
    ledger: [
      { reasonCode: COMMAND_CP_REASON_CODES.BASE_ORDER, amount: 1, note: '', unitId: 'unit-a', sourceStatus: COMMAND_CP_SOURCE_STATUS },
      { reasonCode: COMMAND_CP_REASON_CODES.OUT_OF_COMMAND, amount: 1, note: '', unitId: 'unit-a', sourceStatus: COMMAND_CP_SOURCE_STATUS },
      { reasonCode: COMMAND_CP_REASON_CODES.FREE_CP, amount: -1, note: '', unitId: 'unit-b', sourceStatus: COMMAND_CP_SOURCE_STATUS },
    ],
  });

  const refundA = refundCommandPointsForUnit(state, 'unit-a');
  assert.equal(refundA.ok, true);
  assert.equal(refundA.refunded, true);
  assert.equal(refundA.nextState.available, 3);
  assert.equal(refundA.nextState.spent, 0);
  assert.equal(refundA.nextState.free, 0);

  const refundB = refundCommandPointsForUnit(refundA.nextState, 'unit-b');
  assert.equal(refundB.ok, true);
  assert.equal(refundB.refunded, true);
  assert.equal(refundB.nextState.available, 4);
  assert.equal(refundB.nextState.spent, 0);
  assert.equal(refundB.nextState.free, 1);
});