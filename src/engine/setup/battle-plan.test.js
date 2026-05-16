import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assignCorpsToBattlePlanField,
  BATTLE_PLAN_FIELD_IDS,
  createInitialBattlePlanState,
} from './battle-plan.js';

test('initial battle plan state has three placeholder corps cards', () => {
  const battlePlan = createInitialBattlePlanState();

  assert.equal(battlePlan.visibilityScope, 'owner-only');
  assert.equal(battlePlan.corpsCards.length, 3);
  assert.deepEqual(battlePlan.fieldAssignments[BATTLE_PLAN_FIELD_IDS.LEFT], []);
});

test('assigning corps to a battle plan field stores owner-private assignment', () => {
  const battlePlan = assignCorpsToBattlePlanField(
    createInitialBattlePlanState(),
    'corps-1',
    BATTLE_PLAN_FIELD_IDS.LEFT,
  );

  assert.deepEqual(battlePlan.fieldAssignments[BATTLE_PLAN_FIELD_IDS.LEFT], ['corps-1']);
  assert.equal(battlePlan.corpsCards.find((corpsCard) => corpsCard.id === 'corps-1')?.assignmentFieldId, BATTLE_PLAN_FIELD_IDS.LEFT);
});

test('moving corps between battle plan fields removes the old assignment', () => {
  const firstAssignment = assignCorpsToBattlePlanField(
    createInitialBattlePlanState(),
    'corps-1',
    BATTLE_PLAN_FIELD_IDS.LEFT,
  );
  const movedAssignment = assignCorpsToBattlePlanField(
    firstAssignment,
    'corps-1',
    BATTLE_PLAN_FIELD_IDS.FLANK_MARCH,
  );

  assert.deepEqual(movedAssignment.fieldAssignments[BATTLE_PLAN_FIELD_IDS.LEFT], []);
  assert.deepEqual(movedAssignment.fieldAssignments[BATTLE_PLAN_FIELD_IDS.FLANK_MARCH], ['corps-1']);
});