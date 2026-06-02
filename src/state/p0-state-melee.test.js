import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTION_TYPES, createInitialAppState, reduceAppState } from './p0-state.js';
import { MELEE_V2_ENGINE_VERSION } from './p9-melee-v2.js';

test('start melee drill battle enters melee phase with announce dialog', () => {
  const state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  assert.equal(state.game.phaseTracker.currentBattlePhaseId, 'melee');
  assert.equal(state.game.commandContext.currentPhaseId, 'melee');
  assert.equal(state.game.round?.roundPhase, 'combat');
  assert.equal(state.game.round?.dialog?.type, 'phase-announce');
  assert.equal(state.game.melee?.status, 'announced');
  assert.equal(state.game.melee?.engineVersion, MELEE_V2_ENGINE_VERSION);
});

test('acknowledge melee phase procedure starts queue and closes announce dialog', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  assert.equal(state.game.melee?.status, 'active');
  assert.equal(state.game.melee?.engineVersion, MELEE_V2_ENGINE_VERSION);
  assert.equal(state.game.round?.dialog, null);
  assert.equal(state.game.melee?.isDialogOpen, false);
  assert.ok(Array.isArray(state.game.melee?.queueSelectionIds));
  assert.ok(state.game.melee.queueSelectionIds.length > 0);
  assert.deepEqual(state.game.melee.queueSelectionIds, [
    'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a',
    'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b',
    'melee-drill-p1-flank-c__melee-drill-p2-frontline-c-flanked',
    'melee-drill-case1-main-a__melee-drill-case1-main-d',
    'melee-drill-case2-main-a__melee-drill-case2-main-d',
  ]);

  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a',
  });

  assert.equal(state.game.melee?.resolutionDraft?.meleeId, 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a');

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });

  assert.deepEqual(state.game.melee?.resolvedMeleeIds, ['melee-drill-p1-frontline-a__melee-drill-p2-frontline-a']);

  for (const meleeId of state.game.melee.queueSelectionIds.slice(1)) {
    state = reduceAppState(state, {
      type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
      meleeId,
    });
    state = reduceAppState(state, {
      type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
    });
  }

  assert.equal(state.game.melee?.resolvedMeleeIds.length, state.game.melee?.queueSelectionIds.length);

  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  assert.equal(state.game.melee?.status, 'applied');
  assert.equal(state.game.melee?.engineVersion, MELEE_V2_ENGINE_VERSION);
  assert.equal(state.game.melee?.batchSummary?.isOpen, true);
  assert.equal(Number(state.game.melee?.batchSummary?.resolvedMelees ?? 0), state.game.melee?.queueSelectionIds?.length ?? 0);
});

test('selecting a pending melee main unit starts draft from battlefield-first flow', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-case1-main-a',
  });

  assert.equal(state.game.selectedUnitId, 'melee-drill-case1-main-a');
  assert.equal(state.game.melee?.resolutionDraft?.meleeId, 'melee-drill-case1-main-a__melee-drill-case1-main-d');
});

test('selecting attacker or defender pending main unit opens the same melee draft', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const expectedMeleeId = 'melee-drill-case1-main-a__melee-drill-case1-main-d';

  const attackerSelected = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-case1-main-a',
  });
  assert.equal(attackerSelected.game.melee?.resolutionDraft?.meleeId, expectedMeleeId);

  const defenderSelected = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-case1-main-d',
  });
  assert.equal(defenderSelected.game.melee?.resolutionDraft?.meleeId, expectedMeleeId);
});

test('selecting attached commander opens the host main-unit melee draft', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-p1-commander-b',
  });

  assert.equal(state.game.selectedUnitId, 'melee-drill-p1-frontline-b');
  assert.equal(state.game.melee?.resolutionDraft?.meleeId, 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b');
});

test('continuing commander lock in reducer flow is gated by prior engagement history', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const meleeId = 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b';

  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_RESOLUTION_RESULT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId,
  });

  let attackerCommander = state.game.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;
  assert.equal(state.game.melee?.resolutionDraft?.resolutionInput?.meleeRoundState, 'continuing');
  assert.equal(attackerCommander?.isToggleLocked, false);
  assert.equal(attackerCommander?.isEngaged, false);

  state = reduceAppState(state, {
    type: ACTION_TYPES.CANCEL_MELEE_RESOLUTION_DRAFT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.TOGGLE_MELEE_RESOLUTION_ATTACKER_COMMANDER_ENGAGED,
    isEngaged: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_RESOLUTION_RESULT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId,
  });

  attackerCommander = state.game.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;
  assert.equal(attackerCommander?.isToggleLocked, true);
  assert.equal(attackerCommander?.isEngaged, true);
});

test('apply melee batch remains blocked until all selected fights are resolved', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const firstMeleeId = state.game.melee?.queueSelectionIds?.[0] ?? null;
  assert.ok(firstMeleeId);

  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: firstMeleeId,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });

  const beforeBlockedApply = state;
  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  assert.equal(state.game.melee?.status, beforeBlockedApply.game.melee?.status);
  assert.equal(
    state.game.melee?.diagnostics?.some(
      (entry) => entry?.code === 'melee.v2.apply-blocked-unresolved-required-fights',
    ),
    true,
  );
  assert.notEqual(state.game.melee?.status, 'applied');
});

test('p9v2-mini-11C reducer flow keeps pair 15/16 arithmetic identical across pending to committed transition', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const selectedMeleeIds = Array.isArray(state.game.melee?.queueSelectionIds)
    ? [...state.game.melee.queueSelectionIds]
    : [];
  assert.ok(selectedMeleeIds.length > 0);

  const pair15MeleeId = selectedMeleeIds[0];
  for (const meleeId of selectedMeleeIds) {
    state = reduceAppState(state, {
      type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
      meleeId,
    });
    state = reduceAppState(state, {
      type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
    });
  }

  const pair15PendingEntry = state.game.melee?.v2?.pendingResolvedEntriesByMeleeId?.[pair15MeleeId];
  assert.ok(pair15PendingEntry);

  const parityKeys = ['base', 'support', 'flankRear', 'disorder', 'die', 'final'];
  const pendingAttackerLedger = pair15PendingEntry?.resolution?.breakdown?.attacker?.stageLedger ?? {};
  const pendingDefenderLedger = pair15PendingEntry?.resolution?.breakdown?.defender?.stageLedger ?? {};

  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  assert.equal(state.game.melee?.v2?.pendingMeleeIds?.length ?? 0, 0);
  assert.ok((state.game.melee?.v2?.committedMeleeIds?.length ?? 0) > 0);

  const pair16CommittedEntry = state.game.melee?.v2?.committedResolvedEntriesByMeleeId?.[pair15MeleeId];
  assert.ok(pair16CommittedEntry);

  const committedAttackerLedger = pair16CommittedEntry?.resolution?.breakdown?.attacker?.stageLedger ?? {};
  const committedDefenderLedger = pair16CommittedEntry?.resolution?.breakdown?.defender?.stageLedger ?? {};

  for (const key of parityKeys) {
    assert.equal(
      pendingAttackerLedger[key],
      committedAttackerLedger[key],
      `attacker pending/committed parity failed for ${key}`,
    );
    assert.equal(
      pendingDefenderLedger[key],
      committedDefenderLedger[key],
      `defender pending/committed parity failed for ${key}`,
    );
  }

  assert.equal(typeof state.game.melee?.batchApplicationPlan?.effects?.cohesionLossByUnitId, 'undefined');
  assert.equal(typeof state.game.melee?.batchApplicationPlan?.effects?.multipleAttackImmediateByUnitId, 'object');
  assert.equal(typeof state.game.melee?.batchApplicationPlan?.effects?.combatResultCohesionByUnitId, 'object');
});

test('apply melee batch writes shared cohesion accounts onto affected units', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  for (const meleeId of state.game.melee.queueSelectionIds) {
    state = reduceAppState(state, {
      type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
      meleeId,
    });
    state = reduceAppState(state, {
      type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
    });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  const affectedUnit = state.game.units.find((unit) => {
    const account = unit?.cohesionAccount;
    return account && Number(account.remainingCohesion ?? account.maxCohesion) < Number(account.maxCohesion ?? 0);
  });

  assert.ok(affectedUnit);
  assert.equal(typeof affectedUnit.cohesionAccount.status, 'string');
  assert.equal(affectedUnit.cohesionAccount.pendingBySource.meleeCombatResult, 0);
  assert.equal(affectedUnit.cohesionAccount.pendingBySource.meleeMultipleAttackImmediate, 0);
  assert.equal(Array.isArray(affectedUnit.cohesionAccount.committedHistory), true);
});
