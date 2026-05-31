import test from 'node:test';
import assert from 'node:assert/strict';

import { createMeleeDrillScenario } from '../data/melee-drill-scenarios.js';
import { UNIT_PROFILE_IDS } from '../data/unit-profiles.js';
import { MELEE_CONTACT_ROLE_STATUSES } from '../engine/melee/roles.js';
import {
  acknowledgeMeleePhaseProcedure,
  canApplyResolvedMeleeBatch,
  confirmMeleeResolutionDraft,
  applyMeleeBatch,
  beginMeleePhaseState,
  createInitialMeleeState,
  MELEE_BATCH_APPLICATION_STATUSES,
  MELEE_PROCEDURE_STATUSES,
  buildMeleeBatchApplicationPlan,
  createMeleeBatchQueue,
  getMeleeRolePresentation,
  getMeleeProcedurePresentation,
  previewMeleeBatch,
  startMeleeResolutionDraft,
  resolveMeleeBatchPreview,
  getMeleeUnitStatus,
} from './p9-melee.js';

function createGameState(units) {
  return {
    game: {
      units,
    },
  };
}

function createContactEvidence(overrides = {}) {
  return {
    principalOpponentId: overrides.principalOpponentId ?? 'enemy-1',
    contactSide: overrides.contactSide ?? 'front',
    contactRelationship: overrides.contactRelationship ?? 'front-edge-to-front-edge',
    contactClassification: overrides.contactClassification ?? { type: 'front' },
    contactRole: overrides.contactRole,
    sourceStatus: overrides.sourceStatus ?? 'verified',
    ...overrides,
  };
}

test('melee role presentation stays stable for static fixture coordinates', () => {
  const scenario = createMeleeDrillScenario();
  const presentation = getMeleeRolePresentation({
    gameState: createGameState(scenario.units),
  });

  assert.equal(presentation.entries.length, 12);
  assert.equal(presentation.counts.mainUnits, 7);
  assert.equal(presentation.counts.simpleSupportUnits, 3);
  assert.equal(presentation.counts.meleeSupportUnits, 0);
});

test('getMeleeRolePresentation exposes the contact roles for the active melee slice', () => {
  const presentation = getMeleeRolePresentation({
    gameState: createGameState([
      {
        id: 'main',
        scenarioLabel: 'Main',
        engagedInMelee: true,
        meleePendingOpponentId: 'enemy',
        conformationApplied: createContactEvidence({
          principalOpponentId: 'enemy',
          contactSide: 'front',
          contactRelationship: 'front-edge-to-front-edge',
          contactClassification: { type: 'front' },
        }),
      },
      {
        id: 'simple',
        scenarioLabel: 'Simple',
        providesOnlySimpleSupport: true,
        meleeContactEvidence: createContactEvidence({
          contactRole: 'simple-support',
          contactSide: 'left',
          contactRelationship: 'support-front-corner',
          contactClassification: { type: 'flank' },
        }),
      },
      {
        id: 'melee',
        scenarioLabel: 'Melee',
        inMeleeSupport: true,
        meleeContactEvidence: createContactEvidence({
          contactRole: 'melee-support',
          contactSide: 'rear',
          contactRelationship: 'support-rear-fully-conformed',
          contactClassification: { type: 'rear' },
        }),
      },
    ]),
  });

  assert.deepEqual(presentation.mainUnitIds, ['main']);
  assert.deepEqual(presentation.simpleSupportUnitIds, ['simple']);
  assert.deepEqual(presentation.meleeSupportUnitIds, ['melee']);
  assert.equal(presentation.counts.mainUnits, 1);
  assert.equal(presentation.counts.simpleSupportUnits, 1);
  assert.equal(presentation.counts.meleeSupportUnits, 1);
  assert.equal(presentation.entries[0]?.role, MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT);
});

test('P9-03P draft builds distinct simple-support and melee-support stage entries', () => {
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        scenarioLabel: 'Main attacker',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
        scenarioLabel: 'Main defender',
      },
      {
        id: 'simple-s',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        scenarioLabel: 'Simple support',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'melee-s',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        scenarioLabel: 'Melee support',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'rear',
          contactRole: 'melee-support',
        }),
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(gameState, { unitId: 'main-a' });
  const draftInput = withDraft.melee?.resolutionDraft?.resolutionInput;
  const supportEntries = Array.isArray(draftInput?.attackerModifierEntries)
    ? draftInput.attackerModifierEntries.filter((entry) => entry.stage === 'support')
    : [];
  const presentation = getMeleeProcedurePresentation(withDraft);

  assert.equal(supportEntries.length, 2);
  assert.equal(supportEntries.some((entry) => entry.code.includes('simple-support')), true);
  assert.equal(supportEntries.some((entry) => entry.code.includes('melee-support')), true);
  assert.equal(supportEntries.find((entry) => entry.code.includes('simple-support'))?.value, 1);
  assert.equal(supportEntries.find((entry) => entry.code.includes('melee-support'))?.value, 2);
  assert.equal(
    presentation.resolutionDraft?.factorPresentation?.attackerSupportUnits.some((unit) => unit.role === 'simple-support'),
    true,
  );
  assert.equal(
    presentation.resolutionDraft?.factorPresentation?.attackerSupportUnits.some((unit) => unit.role === 'melee-support'),
    true,
  );
});

test('P9-03N derives included commander participation from main-unit state', () => {
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        scenarioLabel: 'Main attacker',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        hasIncludedCommander: true,
        meleeCombatFactorValue: 5,
        meleeCombatFactorSourceStatus: 'verified',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        scenarioLabel: 'Main defender',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
        meleeCombatFactorValue: 5,
        meleeCombatFactorSourceStatus: 'verified',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(gameState, { unitId: 'main-a' });
  const commanderState = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;

  assert.equal(commanderState?.status, 'engaged-main-unit');
  assert.equal(commanderState?.participation, 'included');
  assert.equal(commanderState?.supportOnly, false);
});

test('P9-03N keeps melee-support commander as support-only and excludes main-unit commander bonus', () => {
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
      commander: {
        unitId: 'support-cmd',
        attachedUnitId: 'support-cmd',
        engagedInCombat: true,
        sourceStatus: 'verified',
      },
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        scenarioLabel: 'Main attacker',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeCombatFactorValue: 5,
        meleeCombatFactorSourceStatus: 'verified',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        scenarioLabel: 'Main defender',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
        meleeCombatFactorValue: 5,
        meleeCombatFactorSourceStatus: 'verified',
      },
      {
        id: 'support-cmd',
        owner: 'player-1',
        scenarioLabel: 'Support commander',
        hasIncludedCommander: true,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'left',
          contactRole: 'melee-support',
        }),
      },
    ],
  }));

  const draftState = startMeleeResolutionDraft(gameState, { unitId: 'main-a' });
  const commanderState = draftState.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;
  const confirmed = confirmMeleeResolutionDraft(draftState);
  const attackerSituationEntries = confirmed.melee?.resolvedEntriesByMeleeId?.['main-a__main-d']?.resolution?.breakdown?.attacker?.stages?.situation ?? [];

  assert.equal(commanderState?.status, 'support-only');
  assert.equal(commanderState?.supportOnly, true);
  assert.equal(attackerSituationEntries.some((entry) => String(entry?.code ?? '').includes('engaged-commander')), false);
});

test('P9-03N resolves attached commander selection to the host melee entry in drill lane', () => {
  const scenario = createMeleeDrillScenario();
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: scenario.units,
  }));

  const hostDraftState = startMeleeResolutionDraft(gameState, { unitId: 'melee-drill-p1-frontline-b' });
  const commanderDraftState = startMeleeResolutionDraft(gameState, { unitId: 'melee-drill-p1-commander-b' });
  const hostMeleeId = hostDraftState.melee?.resolutionDraft?.meleeId;
  const commanderMeleeId = commanderDraftState.melee?.resolutionDraft?.meleeId;
  const commanderState = commanderDraftState.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;

  assert.equal(commanderMeleeId, hostMeleeId);
  assert.equal(commanderState?.status, 'engaged-main-unit');
  assert.equal(commanderState?.participation, 'attached');
  assert.equal(commanderState?.supportOnly, false);
});

test('P9-03N reports attached commander drill token with host melee status', () => {
  const scenario = createMeleeDrillScenario();
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: scenario.units,
  }));

  const resolvedState = confirmMeleeResolutionDraft(
    startMeleeResolutionDraft(gameState, { unitId: 'melee-drill-p1-frontline-b' }),
  );

  assert.equal(getMeleeUnitStatus(gameState, 'melee-drill-p1-frontline-b'), 'pending');
  assert.equal(getMeleeUnitStatus(gameState, 'melee-drill-p1-commander-b'), 'pending');
  assert.equal(getMeleeUnitStatus(resolvedState, 'melee-drill-p1-frontline-b'), 'resolved');
  assert.equal(getMeleeUnitStatus(resolvedState, 'melee-drill-p1-commander-b'), 'resolved');
});

test('P9-03V records continuing round-state and commander snapshot after first resolution', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        scenarioLabel: 'Main attacker',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        attachedCommanderId: 'cmd-a',
      },
      {
        id: 'cmd-a',
        owner: 'player-1',
        isCommander: true,
        attachedUnitId: 'main-a',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        scenarioLabel: 'Main defender',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const resolved = confirmMeleeResolutionDraft(startMeleeResolutionDraft(state, { unitId: 'main-a' }));
  const meleeId = 'main-a__main-d';

  assert.equal(resolved.melee?.roundStateByMeleeId?.[meleeId], 'continuing');
  assert.equal(resolved.melee?.commanderRoundStateByMeleeId?.[meleeId]?.attacker?.participation, 'attached');
  assert.equal(resolved.melee?.commanderRoundStateByMeleeId?.[meleeId]?.defender?.participation, 'none');
});

test('P9-03V continuing-round draft emits source-open commander persistence diagnostics', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState({
      roundStateByMeleeId: {
        'main-a__main-d': 'continuing',
      },
      commanderRoundStateByMeleeId: {
        'main-a__main-d': {
          attacker: { participation: 'attached', status: 'engaged-main-unit' },
          defender: { participation: 'none', status: 'not-engaged' },
        },
      },
    }),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        scenarioLabel: 'Main attacker',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        attachedCommanderId: 'cmd-a',
      },
      {
        id: 'cmd-a',
        owner: 'player-1',
        isCommander: true,
        attachedUnitId: 'main-a',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        scenarioLabel: 'Main defender',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const draft = withDraft.melee?.resolutionDraft;
  const persistenceDiagnostic = draft?.diagnostics?.find(
    (entry) => entry?.code === 'melee.commander.continuing-round-persistence-source-open',
  );

  assert.equal(draft?.resolutionInput?.meleeRoundState, 'continuing');
  assert.equal(Boolean(persistenceDiagnostic), true);
  assert.deepEqual(
    persistenceDiagnostic?.openVerificationIds,
    ['command.commander-attach-detach-legality', 'command.commander-detach-combat-lock-timing'],
  );
  assert.equal(persistenceDiagnostic?.reviewerHandoffRequired, true);
});

test('P9-03V continuing-round commander participation deltas emit detach-lock ambiguity diagnostics', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState({
      roundStateByMeleeId: {
        'main-a__main-d': 'continuing',
      },
      commanderRoundStateByMeleeId: {
        'main-a__main-d': {
          attacker: { participation: 'attached', status: 'engaged-main-unit' },
          defender: { participation: 'none', status: 'not-engaged' },
        },
      },
    }),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        scenarioLabel: 'Main attacker',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        scenarioLabel: 'Main defender',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const ambiguityDiagnostic = withDraft.melee?.resolutionDraft?.diagnostics?.find(
    (entry) => entry?.code === 'melee.commander.continuing-round-detach-lock-ambiguity',
  );

  assert.equal(Boolean(ambiguityDiagnostic), true);
  assert.equal(ambiguityDiagnostic?.reviewerHandoffRequired, true);
  assert.deepEqual(
    ambiguityDiagnostic?.openVerificationIds,
    ['command.commander-attach-detach-legality', 'command.commander-detach-combat-lock-timing'],
  );
});

test('P9-03V round-state flow transitions from first-contact to continuing across draft cycles', () => {
  const initialState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const firstDraft = startMeleeResolutionDraft(initialState, { unitId: 'main-a' });
  assert.equal(firstDraft.melee?.resolutionDraft?.resolutionInput?.meleeRoundState, 'first-contact');

  const afterFirstConfirm = confirmMeleeResolutionDraft(firstDraft);
  const secondDraft = startMeleeResolutionDraft(afterFirstConfirm, { unitId: 'main-a' });

  assert.equal(secondDraft.melee?.resolutionDraft?.resolutionInput?.meleeRoundState, 'continuing');
  assert.equal(
    secondDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.commander.continuing-round-persistence-source-open',
    ),
    true,
  );
});

test('P9-03O derives flank branch context from contact evidence into draft modifier context', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'left',
          contactRelationship: 'flank-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'flank' },
          sourceStatus: 'verified',
          defenderFactorToZeroEligible: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankOrRearAttack, true);
  assert.equal(flankBranch?.attackContactType, 'flank');
  assert.equal(flankBranch?.sourceStatus, 'verified');
  assert.equal(flankBranch?.hasFullConformationEvidence, true);
  assert.equal(flankBranch?.attackerTroopClass, 'formed-non-light');
  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, true);
});

test('P9-03O attached commander selection keeps host-unit flank branch troop class (no commander profile leakage)', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        attachedCommanderId: 'cmd-a',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'left',
          contactRelationship: 'flank-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'flank' },
          sourceStatus: 'verified',
          defenderFactorToZeroEligible: true,
        }),
      },
      {
        id: 'cmd-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.COMMANDER,
        isCommander: true,
        attachedUnitId: 'main-a',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'cmd-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(withDraft.melee?.resolutionDraft?.attackerUnitId, 'main-a');
  assert.equal(flankBranch?.attackerTroopClass, 'formed-non-light');
  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, true);
});

test('P9-03O keeps to-zero branch source-open when conformation evidence is incomplete', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'left',
          contactRelationship: 'flank-edge-to-front-edge',
          contactClassification: { type: 'flank' },
          sourceStatus: 'verified',
          defenderFactorToZeroEligible: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, false);
  assert.equal(flankBranch?.sourceStatus, 'needs-source-check');
  assert.equal(
    withDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.to-zero-branch-source-open',
    ),
    true,
  );
});

test('P9-03O keeps to-zero branch source-open for light troop attackers even with explicit eligibility flag', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'rear',
          contactRelationship: 'rear-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'rear' },
          sourceStatus: 'verified',
          defenderFactorToZeroEligible: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(flankBranch?.attackerTroopClass, 'light');
  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, false);
  assert.equal(flankBranch?.sourceStatus, 'needs-source-check');
});

test('P9-03O blocks to-zero for non-light attackers when formed-troop evidence is explicitly unformed', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'rear',
          contactRelationship: 'rear-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'rear' },
          sourceStatus: 'verified',
          attackerTroopFormation: 'unformed',
          defenderFactorToZeroEligible: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(flankBranch?.attackerTroopClass, 'formed-non-light');
  assert.equal(flankBranch?.attackerFormedTroop, false);
  assert.equal(flankBranch?.formedTroopSourceStatus, 'verified');
  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, false);
  assert.equal(flankBranch?.sourceStatus, 'needs-source-check');
  assert.equal(
    withDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.to-zero-branch-source-open',
    ),
    true,
  );
});

test('P9-03O blocks to-zero when formed-troop evidence is unknown and keeps branch source-open', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'rear',
          contactRelationship: 'rear-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'rear' },
          sourceStatus: 'verified',
          attackerTroopFormation: 'unknown',
          defenderFactorToZeroEligible: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(flankBranch?.attackerTroopClass, 'formed-non-light');
  assert.equal(flankBranch?.attackerFormedTroop, null);
  assert.equal(flankBranch?.formedTroopSourceStatus, 'needs-source-check');
  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, false);
  assert.equal(flankBranch?.sourceStatus, 'needs-source-check');
  assert.equal(
    withDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.to-zero-branch-source-open',
    ),
    true,
  );
});

test('P9-03O infers formed cancellation family from source-closed rear contact evidence', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'rear',
          contactRelationship: 'rear-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'rear' },
          sourceStatus: 'verified',
          cancelAttackSituationBonus: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(flankBranch?.cancelAttackSituationBonus, true);
  assert.equal(flankBranch?.attackContactType, 'rear');
  assert.equal(flankBranch?.cancellationFamily, 'rear-contact-formed');
  assert.equal(flankBranch?.sourceStatus, 'verified');
  assert.equal(
    withDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.cancellation-family-source-open',
    ),
    false,
  );
});

test('P9-03O keeps cancellation family source-open when conformation evidence is incomplete', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'left',
          contactRelationship: 'flank-edge-to-front-edge',
          contactClassification: { type: 'flank' },
          sourceStatus: 'verified',
          cancelAttackSituationBonus: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(flankBranch?.cancelAttackSituationBonus, true);
  assert.equal(flankBranch?.attackContactType, 'flank');
  assert.equal(flankBranch?.cancellationFamily, null);
  assert.equal(flankBranch?.sourceStatus, 'needs-source-check');
  assert.equal(
    withDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.cancellation-family-source-open',
    ),
    true,
  );
});

test('P9-03O keeps cancellation family source-open when formed proof is unknown', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactSide: 'rear',
          contactRelationship: 'rear-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'rear' },
          sourceStatus: 'verified',
          attackerTroopFormation: 'unknown',
          cancelAttackSituationBonus: true,
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(flankBranch?.cancelAttackSituationBonus, true);
  assert.equal(flankBranch?.attackerFormedTroop, null);
  assert.equal(flankBranch?.formedTroopSourceStatus, 'needs-source-check');
  assert.equal(flankBranch?.cancellationFamily, null);
  assert.equal(flankBranch?.sourceStatus, 'needs-source-check');
  assert.equal(
    withDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.cancellation-family-source-open',
    ),
    true,
  );
});

test('P9-03O keeps rear-or-flank ambiguity as source-open branch diagnostic in draft context', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-d',
          contactRelationship: 'front-edge-to-rear-or-flank-edge',
          contactClassification: { type: 'rear-or-flank' },
          sourceStatus: 'needs-source-check',
        }),
      },
      {
        id: 'main-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankOrRearAttack, true);
  assert.equal(flankBranch?.attackContactType, 'rear-or-flank');
  assert.equal(flankBranch?.sourceStatus, 'needs-source-check');
  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, false);
  assert.equal(
    withDraft.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.branch-source-open-ambiguous',
    ),
    true,
  );
});

test('melee drill support case 1 keeps correct alignment behavior with +2 support and side-unit factor contribution', () => {
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'case1-main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'case1-main-d',
        xUd: 40,
        yUd: 20,
        rotationRadians: 0,
      },
      {
        id: 'case1-main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'case1-main-a',
        xUd: 40,
        yUd: 19,
        rotationRadians: Math.PI,
      },
      {
        id: 'case1-simple-left',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 39,
        yUd: 19.75,
        rotationRadians: 0,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'case1-main-a',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'case1-side-melee',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 41,
        yUd: 20.25,
        rotationRadians: 0,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'case1-main-a',
          contactSide: 'right',
          contactRole: 'melee-support',
        }),
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(gameState, { unitId: 'case1-main-a' });
  const draftInput = withDraft.melee?.resolutionDraft?.resolutionInput;
  const presentation = getMeleeProcedurePresentation(withDraft);
  const supportEntries = Array.isArray(draftInput?.attackerModifierEntries)
    ? draftInput.attackerModifierEntries.filter((entry) => entry.stage === 'support')
    : [];
  const attackerSupportUnits = presentation.resolutionDraft?.factorPresentation?.attackerSupportUnits ?? [];
  const sideSupportUnit = attackerSupportUnits.find((unit) => unit.id === 'case1-side-melee');

  assert.equal(supportEntries.length, 2);
  assert.equal(supportEntries.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0), 3);
  assert.equal(attackerSupportUnits.length, 2);
  assert.equal(sideSupportUnit?.combatFactorValue, 1);
  assert.equal(sideSupportUnit?.combatFactorSourceStatus, 'verified');
});

test('melee drill support case 2 replaces simple support with flank/rear melee support for +3 and includes flank/rear factors', () => {
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'case2-main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'case2-main-d',
        xUd: 52,
        yUd: 20,
        rotationRadians: 0,
      },
      {
        id: 'case2-main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'case2-main-a',
        xUd: 52,
        yUd: 19,
        rotationRadians: Math.PI,
      },
      {
        id: 'case2-simple-left',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 51,
        yUd: 19.75,
        rotationRadians: 0,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'case2-main-a',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'case2-simple-right',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 53,
        yUd: 19.75,
        rotationRadians: 0,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'case2-main-a',
          contactSide: 'right',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'case2-flank-left',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 51,
        yUd: 20.25,
        rotationRadians: 0,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'case2-main-a',
          contactSide: 'left',
          contactRole: 'melee-support',
        }),
      },
      {
        id: 'case2-flank-right',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
        xUd: 53,
        yUd: 20.25,
        rotationRadians: 0,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'case2-main-a',
          contactSide: 'right',
          contactRole: 'melee-support',
        }),
      },
      {
        id: 'case2-rear',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 52,
        yUd: 20.9,
        rotationRadians: 0,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'case2-main-a',
          contactSide: 'rear',
          contactRole: 'melee-support',
        }),
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(gameState, { unitId: 'case2-main-a' });
  const draftInput = withDraft.melee?.resolutionDraft?.resolutionInput;
  const presentation = getMeleeProcedurePresentation(withDraft);
  const supportEntries = Array.isArray(draftInput?.attackerModifierEntries)
    ? draftInput.attackerModifierEntries.filter((entry) => entry.stage === 'support')
    : [];
  const attackerSupportUnits = presentation.resolutionDraft?.factorPresentation?.attackerSupportUnits ?? [];
  const supportIds = attackerSupportUnits.map((unit) => unit.id).sort();

  assert.equal(supportEntries.length, 3);
  assert.equal(supportEntries.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0), 6);
  assert.equal(supportEntries.some((entry) => entry.code.includes('simple-support')), false);
  assert.equal(supportIds.includes('case2-flank-left'), true);
  assert.equal(supportIds.includes('case2-flank-right'), true);
  assert.equal(supportIds.includes('case2-rear'), true);
  const meleeSupportUnits = attackerSupportUnits.filter((unit) => unit.role === 'melee-support');
  assert.equal(meleeSupportUnits.length, 3);
  assert.equal(meleeSupportUnits.every((unit) => Number(unit.combatFactorValue) + 1 === 2), true);
  assert.equal(meleeSupportUnits.every((unit) => unit.combatFactorSourceStatus === 'verified'), true);
});

test('P9-03 grouped melee excludes same-side simple support from grouped support conversion', () => {
  const scenario = createMeleeDrillScenario();
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: scenario.units,
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'melee-drill-case2-flank-right' });
  const draftInput = withDraft.melee?.resolutionDraft?.resolutionInput;
  const attackerSupportEntries = Array.isArray(draftInput?.attackerModifierEntries)
    ? draftInput.attackerModifierEntries.filter((entry) => entry.stage === 'support')
    : [];
  const attackerSupportUnits = getMeleeProcedurePresentation(withDraft)
    .resolutionDraft?.factorPresentation?.attackerSupportUnits ?? [];

  assert.equal(attackerSupportEntries.some((entry) => entry.code.includes('simple-support')), false);
  assert.equal(attackerSupportEntries.some((entry) => entry.code.includes('grouped-melee-support')), false);
  assert.equal(attackerSupportUnits.some((unit) => unit.id === 'melee-drill-case2-simple-left'), false);
  assert.equal(attackerSupportUnits.some((unit) => unit.id === 'melee-drill-case2-simple-right'), false);
});

test('P9-03 grouped melee excludes geometric-contact simple support that targets a different opponent', () => {
  const scenario = createMeleeDrillScenario();
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: scenario.units,
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'melee-drill-case2-flank-right' });
  const additionalAttackerIds = (withDraft.melee?.resolutionDraft?.resolutionInput?.additionalAttackerUnits ?? [])
    .map((unit) => unit.id)
    .sort();

  assert.equal(additionalAttackerIds.includes('melee-drill-case2-simple-left'), false);
  assert.equal(additionalAttackerIds.includes('melee-drill-case2-simple-right'), false);
});

test('P9-03 support caps displace same-side simple support when flank melee support exists', () => {
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
      {
        id: 'simple-left',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'simple-right',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'right',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'melee-left',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'left',
          contactRole: 'melee-support',
        }),
      },
      {
        id: 'melee-right',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'right',
          contactRole: 'melee-support',
        }),
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(gameState, { unitId: 'main-a' });
  const draftInput = withDraft.melee?.resolutionDraft?.resolutionInput;
  const supportEntries = Array.isArray(draftInput?.attackerModifierEntries)
    ? draftInput.attackerModifierEntries.filter((entry) => entry.stage === 'support')
    : [];
  const displacementDiagnostics = (withDraft.melee?.resolutionDraft?.diagnostics ?? [])
    .filter((entry) => entry?.code === 'melee.support.simple-support-displaced-by-melee-support');

  assert.equal(supportEntries.some((entry) => String(entry?.code ?? '').includes('simple-support')), false);
  assert.equal(displacementDiagnostics.length, 2);
  assert.equal(
    displacementDiagnostics.some((entry) => entry?.supportUnitId === 'simple-left' && entry?.contactSide === 'left'),
    true,
  );
  assert.equal(
    displacementDiagnostics.some((entry) => entry?.supportUnitId === 'simple-right' && entry?.contactSide === 'right'),
    true,
  );
});

test('P9-03 support-context grouped resolution does not open separate additional-main-attacker path', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'main-a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-d',
      },
      {
        id: 'main-d',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
      {
        id: 'simple-left',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'simple-right',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'right',
          contactRole: 'simple-support',
        }),
      },
      {
        id: 'melee-left',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'left',
          contactRole: 'melee-support',
        }),
      },
      {
        id: 'melee-right',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main-a',
          contactSide: 'right',
          contactRole: 'melee-support',
        }),
      },
    ],
  }));

  const withDraft = startMeleeResolutionDraft(state, { unitId: 'main-a' });
  const draftInput = withDraft.melee?.resolutionDraft?.resolutionInput;
  const attackerSituationEntries = Array.isArray(draftInput?.attackerModifierEntries)
    ? draftInput.attackerModifierEntries.filter((entry) => entry.stage === 'situation')
    : [];
  const sourceOpenGuardDiagnostics = (withDraft.melee?.resolutionDraft?.diagnostics ?? [])
    .filter((entry) => entry?.code === 'melee.combat-group.additional-main-attacker-contribution-source-open');

  assert.equal(
    attackerSituationEntries.some((entry) => entry?.code === 'melee.combat-group.additional-main-attacker-contribution-source-open'),
    false,
  );
  assert.equal(sourceOpenGuardDiagnostics.length, 0);
});

test('P9-03 creates a melee batch queue in active-player selected order', () => {
  const batchQueue = createMeleeBatchQueue({
    eligibleMelees: [
      { id: 'melee-a' },
      { id: 'melee-b' },
      { id: 'melee-c' },
    ],
    selectedMeleeIds: ['melee-c', 'melee-a'],
  });

  assert.deepEqual(batchQueue.queue.map((entry) => entry.id), ['melee-c', 'melee-a']);
  assert.equal(batchQueue.diagnostics.length, 0);
});

test('P9-03M combat-group queue collapses multiple attackers on one defender into one grouped resolution', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'a-left', owner: 'player-1', xUd: 23.125, yUd: 10.875, widthUd: 1, depthUd: 0.75, rotationRadians: Math.PI / 2 },
      { id: 'a-right', owner: 'player-1', xUd: 24.875, yUd: 10.875, widthUd: 1, depthUd: 0.75, rotationRadians: (Math.PI * 3) / 2 },
      { id: 'd-main', owner: 'player-2', xUd: 24, yUd: 11, widthUd: 1, depthUd: 1, rotationRadians: Math.PI },
    ],
  }));

  const presentation = getMeleeProcedurePresentation(state);
  assert.equal(presentation.overview.eligibleMelees, 1);
  assert.deepEqual(presentation.queueSelectionIds, ['a-left__d-main']);
  assert.deepEqual(presentation.eligibleEntries[0]?.combatGroupAttackerUnitIds, ['a-left', 'a-right']);
});

test('P9-03 keeps queued melee previews pending until simultaneous batch apply', () => {
  const preview = resolveMeleeBatchPreview({
    queue: [
      {
        id: 'melee-1',
        resolutionInput: {
          attackerUnit: { id: 'a1' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 4,
          defenderDieRoll: 3,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 6,
          defenderCombatFactorValue: 4,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
      {
        id: 'melee-2',
        resolutionInput: {
          attackerUnit: { id: 'a2' },
          defenderUnit: { id: 'd2' },
          attackerDieRoll: 3,
          defenderDieRoll: 3,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 4,
          defenderCombatFactorValue: 4,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
    ],
  });

  assert.equal(preview.resolvedEntries.length, 2);
  assert.equal(preview.resolvedEntries[0]?.applicationStatus, MELEE_BATCH_APPLICATION_STATUSES.PENDING_SIMULTANEOUS_BATCH);
  assert.equal(preview.resolvedEntries[1]?.applicationStatus, MELEE_BATCH_APPLICATION_STATUSES.PENDING_SIMULTANEOUS_BATCH);
});

test('P9-03 applies cohesion/rout effects only as one batch-end plan', () => {
  const preview = resolveMeleeBatchPreview({
    queue: [
      {
        id: 'melee-1',
        resolutionInput: {
          attackerUnit: { id: 'a1' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 5,
          defenderDieRoll: 2,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 6,
          defenderCombatFactorValue: 4,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
      {
        id: 'melee-2',
        resolutionInput: {
          attackerUnit: { id: 'a2' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 6,
          defenderDieRoll: 1,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 8,
          defenderCombatFactorValue: 2,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
    ],
  });

  const plan = buildMeleeBatchApplicationPlan({ batchPreview: preview });

  assert.equal(plan.applicationStatus, MELEE_BATCH_APPLICATION_STATUSES.APPLIED_AT_BATCH_END);
  assert.equal(plan.effects.cohesionLossByUnitId.d1, 3);
  assert.deepEqual(plan.effects.routedUnitIds, ['d1']);
  assert.equal(plan.appliedEntries.length, 2);
});

test('P9-03M does not invent immediate multiple-attack loss from queue multiplicity alone', () => {
  const preview = resolveMeleeBatchPreview({
    queue: [
      {
        id: 'melee-1',
        resolutionInput: {
          attackerUnit: { id: 'a1' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 5,
          defenderDieRoll: 2,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 6,
          defenderCombatFactorValue: 4,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
      {
        id: 'melee-2',
        resolutionInput: {
          attackerUnit: { id: 'a2' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 6,
          defenderDieRoll: 1,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 8,
          defenderCombatFactorValue: 2,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
    ],
  });

  assert.equal(preview.immediateEffects.length, 0);
  assert.equal(preview.diagnostics[0]?.code, 'melee-multiple-attack-immediate-source-open');

  const resolvedPreview = resolveMeleeBatchPreview({
    queue: [
      {
        id: 'melee-1',
        resolutionInput: {
          attackerUnit: { id: 'a1' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 5,
          defenderDieRoll: 2,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 6,
          defenderCombatFactorValue: 4,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
          multipleAttackImmediateCohesionLoss: 1,
        },
      },
      {
        id: 'melee-2',
        resolutionInput: {
          attackerUnit: { id: 'a2' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 6,
          defenderDieRoll: 1,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 8,
          defenderCombatFactorValue: 2,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
    ],
  });

  const immediateEffect = resolvedPreview.immediateEffects?.[0] ?? null;
  assert.equal(immediateEffect?.type, 'multiple-attack-immediate');
  assert.equal(immediateEffect?.status, 'resolved');
  assert.equal(immediateEffect?.cohesionLoss, 1);

  const plan = buildMeleeBatchApplicationPlan({ batchPreview: resolvedPreview });
  assert.equal(plan.effects.cohesionLossByUnitId.d1, 4);
});

test('melee procedure acknowledge seeds selection from eligible active-player contacts', () => {
  const gameState = beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'a', owner: 'player-1', engagedInMelee: true, meleePendingOpponentId: 'x' },
      { id: 'b', owner: 'player-1', engagedInMelee: true, meleePendingOpponentId: 'y' },
      { id: 'x', owner: 'player-2', engagedInMelee: true, meleePendingOpponentId: 'a' },
      { id: 'y', owner: 'player-2', engagedInMelee: true, meleePendingOpponentId: 'b' },
    ],
  });

  const nextState = acknowledgeMeleePhaseProcedure(gameState);
  const presentation = getMeleeProcedurePresentation(nextState);

  assert.equal(nextState.melee.status, MELEE_PROCEDURE_STATUSES.ACTIVE);
  assert.deepEqual(presentation.queueSelectionIds, ['a__x', 'b__y']);
});

test('melee preview/apply keeps source-open outcomes and marks affected units', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'a',
        owner: 'player-1',
        engagedInMelee: true,
        meleePendingOpponentId: 'x',
        meleeCombatFactorValue: 8,
        meleeCombatFactorSourceStatus: 'verified',
      },
      {
        id: 'x',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'a',
      },
    ],
  }));

  const previewState = previewMeleeBatch(baseState);
  assert.equal(previewState.melee.status, MELEE_PROCEDURE_STATUSES.PREVIEW_READY);
  assert.equal(previewState.melee.batchPreview?.resolvedEntries.length, 1);
  assert.equal(previewState.melee.batchPreview?.resolvedEntries[0]?.resolution?.status, 'source-open');

  const appliedState = applyMeleeBatch(previewState);
  assert.equal(appliedState.melee.status, MELEE_PROCEDURE_STATUSES.APPLIED);
  assert.ok(appliedState.melee.batchApplicationPlan);
});

test('melee unit status switches from pending to resolved after pair confirmation', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'a', owner: 'player-1', engagedInMelee: true, meleePendingOpponentId: 'x', meleeCombatFactorValue: 6, meleeCombatFactorSourceStatus: 'verified' },
      { id: 'x', owner: 'player-2', engagedInMelee: true, meleePendingOpponentId: 'a', meleeCombatFactorValue: 5, meleeCombatFactorSourceStatus: 'verified' },
      { id: 'r', owner: 'player-1', engagedInMelee: false, meleePendingOpponentId: null },
    ],
  }));

  assert.equal(getMeleeUnitStatus(baseState, 'a'), 'pending');
  assert.equal(getMeleeUnitStatus(baseState, 'x'), 'pending');
  assert.equal(getMeleeUnitStatus(baseState, 'r'), 'non-melee');

  const confirmed = confirmMeleeResolutionDraft(startMeleeResolutionDraft(baseState, { unitId: 'a' }));
  assert.equal(getMeleeUnitStatus(confirmed, 'a'), 'resolved');
  assert.equal(getMeleeUnitStatus(confirmed, 'x'), 'resolved');
});

test('melee batch apply readiness requires all selected pairs resolved', () => {
  let state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'a', owner: 'player-1', engagedInMelee: true, meleePendingOpponentId: 'x' },
      { id: 'b', owner: 'player-1', engagedInMelee: true, meleePendingOpponentId: 'y' },
      { id: 'x', owner: 'player-2', engagedInMelee: true, meleePendingOpponentId: 'a' },
      { id: 'y', owner: 'player-2', engagedInMelee: true, meleePendingOpponentId: 'b' },
    ],
  }));

  assert.equal(canApplyResolvedMeleeBatch(state), false);
  state = confirmMeleeResolutionDraft(startMeleeResolutionDraft(state, { unitId: 'a' }));
  assert.equal(canApplyResolvedMeleeBatch(state), false);
  state = confirmMeleeResolutionDraft(startMeleeResolutionDraft(state, { unitId: 'b' }));
  assert.equal(canApplyResolvedMeleeBatch(state), true);
});

test('geometry-derived melee presentation counts flank support and keeps non-involved units out', () => {
  const gameState = beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'a1', owner: 'player-1', xUd: 12, yUd: 12, widthUd: 1, depthUd: 1, rotationRadians: 0 },
      { id: 'a2', owner: 'player-1', xUd: 18, yUd: 12, widthUd: 1, depthUd: 0.75, rotationRadians: 0 },
      { id: 's1', owner: 'player-1', xUd: 13, yUd: 11.75, widthUd: 1, depthUd: 0.5, rotationRadians: 0 },
      { id: 'e1', owner: 'player-2', xUd: 12, yUd: 11, widthUd: 1, depthUd: 1, rotationRadians: Math.PI },
      { id: 'e2', owner: 'player-2', xUd: 18, yUd: 11.25, widthUd: 1, depthUd: 0.75, rotationRadians: Math.PI },
      { id: 'x1', owner: 'player-1', xUd: 6, yUd: 6, widthUd: 1, depthUd: 0.5, rotationRadians: 0 },
      { id: 'x2', owner: 'player-2', xUd: 6, yUd: 4, widthUd: 1, depthUd: 0.5, rotationRadians: Math.PI },
    ],
  });

  const activeState = acknowledgeMeleePhaseProcedure(gameState);
  const presentation = getMeleeProcedurePresentation(activeState);

  assert.equal(presentation.overview.mainUnits, 4);
  assert.equal(presentation.overview.supportUnits, 1);
  assert.equal(presentation.overview.eligibleMelees, 2);
  assert.equal(getMeleeUnitStatus(activeState, 's1'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 'x1'), 'non-melee');
});

test('melee unit involvement keeps both sides active and greys only uninvolved units', () => {
  const gameState = beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'a1', owner: 'player-1', xUd: 12, yUd: 12, widthUd: 1, depthUd: 1, rotationRadians: 0 },
      { id: 'e1', owner: 'player-2', xUd: 12, yUd: 11, widthUd: 1, depthUd: 1, rotationRadians: Math.PI },
      { id: 's1', owner: 'player-1', xUd: 13, yUd: 11.75, widthUd: 1, depthUd: 0.5, rotationRadians: 0 },
      { id: 's2', owner: 'player-2', xUd: 13, yUd: 11.25, widthUd: 1, depthUd: 0.5, rotationRadians: Math.PI },
      { id: 'r1', owner: 'player-1', xUd: 6, yUd: 6, widthUd: 1, depthUd: 0.5, rotationRadians: 0 },
      { id: 'r2', owner: 'player-2', xUd: 6, yUd: 4, widthUd: 1, depthUd: 0.5, rotationRadians: Math.PI },
    ],
  });

  const activeState = acknowledgeMeleePhaseProcedure(gameState);

  assert.equal(getMeleeUnitStatus(activeState, 'a1'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 'e1'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 's1'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 's2'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 'r1'), 'non-melee');
  assert.equal(getMeleeUnitStatus(activeState, 'r2'), 'non-melee');
});

test('P9-03L melee draft presentation shows bound infantry factors without debug override', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'a',
        owner: 'player-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'x',
      },
      {
        id: 'x',
        owner: 'player-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
        engagedInMelee: true,
        meleePendingOpponentId: 'a',
      },
    ],
  }));

  const draftState = startMeleeResolutionDraft(baseState, { unitId: 'a' });
  const presentation = getMeleeProcedurePresentation(draftState);

  assert.equal(presentation.resolutionDraft?.factorPresentation?.combatFactorDebugOverrideEnabled, false);
  assert.equal(presentation.resolutionDraft?.factorPresentation?.attackerCombatFactorValue, 1);
  assert.equal(presentation.resolutionDraft?.factorPresentation?.defenderCombatFactorValue, 1);
  assert.equal(presentation.resolutionDraft?.factorPresentation?.attackerCombatFactorSourceStatus, 'verified');
});

test('flank-contact pair is included in eligible melee queue and participation status', () => {
  const gameState = beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'p1-flank', owner: 'player-1', xUd: 23, yUd: 10.5, widthUd: 1, depthUd: 1, rotationRadians: Math.PI / 2 },
      { id: 'p2-flanked', owner: 'player-2', xUd: 24, yUd: 11, widthUd: 1, depthUd: 1, rotationRadians: Math.PI },
      { id: 'reserve', owner: 'player-1', xUd: 6, yUd: 6, widthUd: 1, depthUd: 0.5, rotationRadians: 0 },
    ],
  });

  const activeState = acknowledgeMeleePhaseProcedure(gameState);
  const presentation = getMeleeProcedurePresentation(activeState);

  assert.equal(presentation.overview.eligibleMelees, 1);
  assert.deepEqual(presentation.queueSelectionIds, ['p1-flank__p2-flanked']);
  assert.equal(getMeleeUnitStatus(activeState, 'p1-flank'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 'p2-flanked'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 'reserve'), 'non-melee');
});

test('conform-style legal cavalry contact keeps both units as melee participants', () => {
  const gameState = beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      { id: 'cfd-b1', owner: 'player-1', xUd: 6, yUd: 12.35, widthUd: 1, depthUd: 0.75, rotationRadians: 0 },
      { id: 'cfd-a1', owner: 'player-2', xUd: 6, yUd: 11.6, widthUd: 1, depthUd: 0.75, rotationRadians: Math.PI },
      { id: 'cfd-r', owner: 'player-2', xUd: 20, yUd: 5, widthUd: 1, depthUd: 0.75, rotationRadians: Math.PI },
    ],
  });

  const activeState = acknowledgeMeleePhaseProcedure(gameState);
  const presentation = getMeleeProcedurePresentation(activeState);

  assert.equal(presentation.overview.eligibleMelees, 1);
  assert.equal(getMeleeUnitStatus(activeState, 'cfd-b1'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 'cfd-a1'), 'pending');
  assert.equal(getMeleeUnitStatus(activeState, 'cfd-r'), 'non-melee');
});

test('P9-03OA requires source-closed front engagement before to-zero closes from movement bridge evidence', () => {
  const baseUnits = [
    {
      id: 'flank-a',
      owner: 'player-1',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      engagedInMelee: true,
      meleePendingOpponentId: 'main-d',
      meleeContactEvidence: createContactEvidence({
        principalOpponentId: 'main-d',
        contactSide: 'left',
        contactRelationship: 'flank-edge-to-front-edge-fully-conformed',
        contactClassification: { type: 'flank' },
        sourceStatus: 'verified',
        meleeTriggerBridge: {
          triggerFamily: 'movement-conformation',
          sourceStatus: 'verified',
          attackContactType: 'flank',
          defenderFactorToZeroEligible: true,
          requiresDefenderFrontEngagementForToZero: true,
          cancellationFamilyHint: 'flank-contact-formed',
        },
      }),
    },
    {
      id: 'main-d',
      owner: 'player-2',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      engagedInMelee: true,
      meleePendingOpponentId: 'flank-a',
    },
  ];

  const withoutFrontEngagement = startMeleeResolutionDraft(
    acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
      commandContext: {
        activePlayerId: 'player-1',
        currentPhaseId: 'melee',
      },
      melee: createInitialMeleeState(),
      units: baseUnits,
    })),
    { unitId: 'flank-a' },
  );

  const withoutFrontBranch = withoutFrontEngagement.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;
  assert.equal(withoutFrontBranch?.applyDefenderCombatFactorToZero, false);
  assert.equal(withoutFrontBranch?.defenderFrontEngagedSourceClosed, false);
  assert.equal(
    withoutFrontEngagement.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.to-zero-front-engagement-source-open',
    ),
    true,
  );

  const withMirroredPendingFrontOnly = startMeleeResolutionDraft(
    acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
      commandContext: {
        activePlayerId: 'player-1',
        currentPhaseId: 'melee',
      },
      melee: createInitialMeleeState(),
      units: [
        {
          ...baseUnits[0],
          xUd: 10,
          yUd: 10,
          widthUd: 1,
          depthUd: 1,
          rotationRadians: Math.PI / 2,
        },
        {
          ...baseUnits[1],
          xUd: 10,
          yUd: 9,
          widthUd: 1,
          depthUd: 1,
          rotationRadians: Math.PI,
        },
        {
          id: 'front-a-mirrored-only',
          owner: 'player-1',
          profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
          engagedInMelee: true,
          meleePendingOpponentId: 'main-d',
          xUd: 10,
          yUd: 8,
          widthUd: 1,
          depthUd: 1,
          rotationRadians: 0,
        },
      ],
    })),
    { unitId: 'flank-a' },
  );

  const withMirroredPendingFrontOnlyBranch = withMirroredPendingFrontOnly.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;
  assert.equal(withMirroredPendingFrontOnlyBranch?.applyDefenderCombatFactorToZero, false);
  assert.equal(withMirroredPendingFrontOnlyBranch?.defenderFrontEngagedSourceClosed, false);
  assert.equal(
    withMirroredPendingFrontOnly.melee?.resolutionDraft?.diagnostics?.some(
      (entry) => entry?.code === 'melee.flank-rear.to-zero-front-engagement-source-open',
    ),
    true,
  );

  const withFrontEngagement = startMeleeResolutionDraft(
    acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
      commandContext: {
        activePlayerId: 'player-1',
        currentPhaseId: 'melee',
      },
      melee: createInitialMeleeState(),
      units: [
        ...baseUnits,
        {
          id: 'front-a',
          owner: 'player-1',
          profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
          engagedInMelee: true,
          meleePendingOpponentId: 'main-d',
          meleeContactEvidence: createContactEvidence({
            principalOpponentId: 'main-d',
            contactSide: 'front',
            contactRelationship: 'front-edge-to-front-edge-fully-conformed',
            contactClassification: { type: 'front' },
            sourceStatus: 'verified',
          }),
        },
      ],
    })),
    { unitId: 'flank-a' },
  );

  const withFrontBranch = withFrontEngagement.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;
  assert.equal(withFrontBranch?.applyDefenderCombatFactorToZero, true);
  assert.equal(withFrontBranch?.defenderFrontEngagedSourceClosed, true);
  assert.equal(withFrontBranch?.sourceStatus, 'verified');
});

test('P9-03OA drill acceptance indices 14, 19, 20, 21, 8 enforce expected to-zero outcomes', () => {
  const scenario = createMeleeDrillScenario();
  const activeState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: scenario.units,
  }));

  const fixtureIndexToUnitId = {
    14: scenario.units[13]?.id,
    19: scenario.units[18]?.id,
    20: scenario.units[19]?.id,
    21: scenario.units[20]?.id,
    8: scenario.units[7]?.id,
  };

  const expectedToZeroByFixtureIndex = {
    14: true,
    19: true,
    20: true,
    21: true,
    8: false,
  };

  for (const [fixtureIndexText, unitId] of Object.entries(fixtureIndexToUnitId)) {
    assert.equal(typeof unitId, 'string');
    const withDraft = startMeleeResolutionDraft(activeState, { unitId });
    const flankBranch = withDraft.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.flankRearBranch;
    const fixtureIndex = Number(fixtureIndexText);

    assert.equal(Boolean(flankBranch?.flankOrRearAttack ?? true), true);
    assert.equal(flankBranch?.applyDefenderCombatFactorToZero, expectedToZeroByFixtureIndex[fixtureIndex]);
    assert.equal(flankBranch?.requiresDefenderFrontEngagementForToZero, true);
  }
});

test('P9-03OA front combat-group inherits defender to-zero ownership from grouped flank attacker', () => {
  const scenario = createMeleeDrillScenario();
  let state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: scenario.units,
  }));

  state = startMeleeResolutionDraft(state, { unitId: 'melee-drill-case1-main-a' });
  const draft = state.melee?.resolutionDraft;
  const flankBranch = draft?.resolutionInput?.attackerModifierContext?.flankRearBranch;

  assert.equal(draft?.meleeId, 'melee-drill-case1-main-a__melee-drill-case1-main-d');
  assert.equal(flankBranch?.applyDefenderCombatFactorToZero, true);
  assert.equal(flankBranch?.inheritedDefenderToZeroFromBranch, true);
  assert.equal(flankBranch?.ownershipAttackerUnitId, 'melee-drill-case1-side-melee');
  assert.equal(flankBranch?.ownershipMeleeId, 'melee-drill-case1-side-melee__melee-drill-case1-main-d');
  assert.equal(flankBranch?.sourceStatus, 'verified');

  state = confirmMeleeResolutionDraft(state);
  const resolution = state.melee?.resolvedEntriesByMeleeId?.['melee-drill-case1-main-a__melee-drill-case1-main-d']?.resolution;

  assert.equal(resolution?.status, 'source-open');
  assert.equal(Array.isArray(resolution?.diagnostics), true);
  assert.equal(resolution?.breakdown, null);
});

test('P9-03OA resolves immediate multiple-attack effect from verified trigger objects', () => {
  const preview = resolveMeleeBatchPreview({
    queue: [
      {
        id: 'melee-1',
        resolutionInput: {
          attackerUnit: { id: 'a1' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 5,
          defenderDieRoll: 2,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 6,
          defenderCombatFactorValue: 4,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
          multipleAttackImmediateTrigger: {
            type: 'multiple-attack-immediate',
            source: 'movement-conformation',
            sourceStatus: 'verified',
            cohesionLoss: 1,
          },
        },
      },
      {
        id: 'melee-2',
        resolutionInput: {
          attackerUnit: { id: 'a2' },
          defenderUnit: { id: 'd1' },
          attackerDieRoll: 6,
          defenderDieRoll: 1,
          combatFactorDebugOverrideEnabled: true,
          attackerCombatFactorValue: 8,
          defenderCombatFactorValue: 2,
          attackerCombatFactorSourceStatus: 'verified',
          defenderCombatFactorSourceStatus: 'verified',
        },
      },
    ],
  });

  assert.equal(preview.immediateEffects.length, 1);
  assert.equal(preview.immediateEffects[0]?.status, 'resolved');
  assert.equal(preview.immediateEffects[0]?.cohesionLoss, 1);
  assert.equal(preview.immediateEffects[0]?.defenderUnitId, 'd1');
});