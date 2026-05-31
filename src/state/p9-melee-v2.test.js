import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  acknowledgeMeleePhaseProcedure,
  acknowledgeMeleeResolutionResult,
  beginMeleePhaseState,
  cancelMeleeResolutionDraft,
  createInitialMeleeState,
  canApplyResolvedMeleeBatch,
  applyMeleeBatch,
  getMeleeCommanderPresence,
  getMeleeUnitParticipation,
  getMeleeParticipationByUnitId,
  getMeleeProcedurePresentation,
  getMeleeUnitStatus,
  confirmMeleeResolutionDraft,
  MELEE_V2_ENGINE_VERSION,
  MELEE_V2_LIFECYCLE_STATUSES,
  setMeleeResolutionDraftValue,
  setMeleeResolutionDraftCommanderEngaged,
  startMeleeResolutionDraft,
} from './p9-melee-v2.js';
import {
  createMeleeCommanderPresenceScenario,
  createMeleeDrillScenario,
  createP9V2Mini11BPair11vs12FixtureRows,
} from '../data/melee-drill-scenarios.js';
import {
  resolveMeleeOutcome,
  MELEE_MODIFIER_STAGES,
} from '../engine/melee/resolution.js';
import {
  createMeleeV2ContactModel,
  MELEE_V2_CONTACT_ORIGINS,
} from '../engine/melee-v2/contact-model.js';
import {
  buildV2ActiveFightSet,
  buildV2MeleeBatchApplicationPlan,
  buildV2MeleeBatchPreview,
} from '../engine/melee-v2/resolution.js';
import { createInitialAppState } from './p0-battle-start.js';
import { ACTION_TYPES, reduceAppState } from './p0-state.js';

test('p9 melee v2 initial state marks engine version and source-open status', () => {
  const meleeState = createInitialMeleeState();

  assert.equal(meleeState.engineVersion, MELEE_V2_ENGINE_VERSION);
  assert.equal(meleeState.sourceStatus, 'source-open');
  assert.equal(meleeState.v2.contactModelVersion, 'v2');
  assert.equal(meleeState.v2.roleAssignmentVersion, 'v2');
});

test('p9v2-06A has no V1 state-flow delegation calls in active runtime file', () => {
  const source = readFileSync(new URL('./p9-melee-v2.js', import.meta.url), 'utf8');

  const forbiddenTokens = [
    'acknowledgeMeleePhaseProcedureV1',
    'beginMeleePhaseStateV1',
    'startMeleeResolutionDraftV1',
    'confirmMeleeResolutionDraftV1',
    'cancelMeleeResolutionDraftV1',
    'toggleMeleeQueueSelectionV1',
    'moveMeleeQueueSelectionV1',
    'setMeleeProcedureDialogOpenV1',
    'setMeleeResolutionDraftValueV1',
    'toggleMeleeResolutionCombatFactorDebugOverrideV1',
    'acknowledgeMeleeBatchSummaryV1',
    'previewMeleeBatchV1',
  ];

  for (const token of forbiddenTokens) {
    assert.equal(
      source.includes(token),
      false,
      `Forbidden V1 delegation token found in p9-melee-v2.js: ${token}`,
    );
  }
});

test('p9 melee v2 begin and acknowledge keep runtime on v2 state', () => {
  const appState = createInitialAppState();
  const begun = beginMeleePhaseState(appState.game, {
    phaseId: 'melee',
    actingPlayerId: 'player-1',
  });
  const acknowledged = acknowledgeMeleePhaseProcedure(begun);

  assert.equal(begun.melee?.engineVersion, MELEE_V2_ENGINE_VERSION);
  assert.equal(acknowledged.melee?.engineVersion, MELEE_V2_ENGINE_VERSION);
  assert.ok(['verified', 'source-open'].includes(acknowledged.melee?.v2?.contactModelSourceStatus));
  assert.ok(['verified', 'source-open'].includes(acknowledged.melee?.v2?.roleAssignmentSourceStatus));
});

test('p9v2 participation status separates main defenders, support participants, and non-melee units', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p1-frontline-a'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p1-frontline-b'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p1-flank-c'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case1-main-a'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case2-main-a'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p2-frontline-a'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p2-frontline-b'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p2-frontline-c-flanked'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case1-main-d'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case2-main-d'), 'main-defender-pending');

  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p1-support-a'), 'support-participant');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case1-simple-left'), 'support-participant');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case1-side-melee'), 'support-participant');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case2-flank-left'), 'support-participant');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case2-flank-right'), 'support-participant');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case2-rear'), 'support-participant');

  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case2-simple-left'), 'non-melee');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-case2-simple-right'), 'non-melee');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p1-frontline-c-gap'), 'non-melee');
  assert.equal(getMeleeUnitStatus(state, 'melee-drill-p2-frontline-c-gap'), 'non-melee');
});

test('p9v2-12 canonical participation selector keeps status and selectability aligned', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const participationByUnitId = getMeleeParticipationByUnitId(state);

  assert.equal(
    participationByUnitId.get('melee-drill-case1-main-a')?.isSelectableInBattlefield,
    true,
  );
  assert.equal(
    participationByUnitId.get('melee-drill-case1-main-d')?.isSelectableInBattlefield,
    true,
  );
  assert.equal(
    participationByUnitId.get('melee-drill-case1-main-d')?.canStartResolutionDraft,
    true,
  );
  assert.equal(
    participationByUnitId.get('melee-drill-case2-rear')?.isSupportParticipant,
    true,
  );
  assert.equal(
    participationByUnitId.get('melee-drill-case2-rear')?.isSelectableInBattlefield,
    false,
  );
  assert.equal(
    participationByUnitId.get('melee-drill-p1-frontline-c-gap')?.isNonMelee,
    true,
  );
  assert.equal(
    participationByUnitId.get('melee-drill-case1-main-a')?.commanderPresence?.status,
    'none',
  );
});

test('p9v2-13 attached commander maps to host main participation and draft eligibility', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));

  const attachedCommanderStatus = getMeleeUnitStatus(state, 'melee-commander-attached-a');
  const attachedCommanderParticipation = getMeleeUnitParticipation(state, 'melee-commander-attached-a');

  assert.equal(attachedCommanderStatus, 'main-defender-pending');
  assert.equal(attachedCommanderParticipation.isSelectableInBattlefield, true);
  assert.equal(attachedCommanderParticipation.canStartResolutionDraft, true);
  assert.equal(attachedCommanderParticipation.commanderPresence?.status, 'attached');
  assert.equal(attachedCommanderParticipation.commanderPresence?.commanderUnitId, 'melee-commander-attached-a');
  assert.equal(attachedCommanderParticipation.commanderPresence?.hostUnitId, 'melee-commander-attached-main-a');
});

test('p9v2-13 attached commander stays source-open when host link is asymmetric', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: [
      {
        id: 'melee-commander-asymmetric-main-a',
        owner: 'player-1',
        corpsId: 'p1-corps-9',
        profileId: 'heavy-infantry-spearmen',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-asymmetric-main-d',
        attachedCommanderId: 'melee-commander-asymmetric-a',
      },
      {
        id: 'melee-commander-asymmetric-a',
        owner: 'player-1',
        corpsId: 'p1-corps-9',
        profileId: 'commander',
        isCommander: true,
        attachedUnitId: 'melee-commander-some-other-main',
      },
      {
        id: 'melee-commander-asymmetric-main-d',
        owner: 'player-2',
        corpsId: 'p2-corps-9',
        profileId: 'medium-infantry-swordsmen',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-asymmetric-main-a',
      },
    ],
  }));

  const commanderPresence = getMeleeCommanderPresence(state, 'melee-commander-asymmetric-main-a');
  const commanderParticipation = getMeleeUnitParticipation(state, 'melee-commander-asymmetric-main-a');
  const presentation = getMeleeProcedurePresentation(state);
  const contactModel = createMeleeV2ContactModel({
    gameState: state,
    presentation,
  });
  const activeFightSet = buildV2ActiveFightSet({
    contactModel,
    eligibleEntries: presentation.eligibleEntries,
  });
  const asymmetricEntry = activeFightSet.entries.find(
    (entry) => entry?.attackerUnitId === 'melee-commander-asymmetric-main-a',
  );

  assert.equal(commanderPresence.status, 'attached');
  assert.equal(commanderPresence.sourceStatus, 'source-open');
  assert.equal(commanderParticipation.commanderPresence?.sourceStatus, 'source-open');
  assert.equal(asymmetricEntry?.v2AttackerCommanderPresence?.status, 'attached');
  assert.equal(asymmetricEntry?.v2AttackerCommanderPresence?.sourceStatus, 'source-open');
  assert.equal(activeFightSet.sourceStatus, 'source-open');
});

test('p9v2-13 included and support-only commander lanes stay distinct in canonical participation model', () => {
  const state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));

  const includedMainParticipation = getMeleeUnitParticipation(state, 'melee-commander-included-main-a');
  const supportOnlyCommanderParticipation = getMeleeUnitParticipation(state, 'melee-commander-support-only-a');
  const supportOnlyCommanderPresence = getMeleeCommanderPresence(state, 'melee-commander-support-only-a');

  assert.equal(includedMainParticipation.commanderPresence?.status, 'included');
  assert.equal(includedMainParticipation.canStartResolutionDraft, true);
  assert.equal(supportOnlyCommanderParticipation.isSupportParticipant, true);
  assert.equal(supportOnlyCommanderParticipation.isSelectableInBattlefield, false);
  assert.equal(supportOnlyCommanderParticipation.canStartResolutionDraft, false);
  assert.equal(supportOnlyCommanderPresence.status, 'support-only');
});

test('p9v2-14D optional commander toggle updates draft payload and resolved totals on first-contact lanes', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-commander-attached-main-a__melee-commander-attached-main-d',
  });
  const beforeToggleCommander = drafted.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;

  assert.equal(beforeToggleCommander?.isToggleVisible, true);
  assert.equal(beforeToggleCommander?.isToggleLocked, false);
  assert.equal(beforeToggleCommander?.isEngaged, false);

  const toggled = setMeleeResolutionDraftCommanderEngaged(drafted, 'attacker', true);
  const toggledInput = toggled.melee?.resolutionDraft?.resolutionInput;
  const afterToggleCommander = toggledInput?.attackerModifierContext?.engagedCommander;

  assert.equal(afterToggleCommander?.isEngaged, true);
  assert.equal(afterToggleCommander?.status, 'engaged-main-unit');
  assert.equal(afterToggleCommander?.participation, 'attached');

  const closedInput = {
    ...toggledInput,
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierEntries: (Array.isArray(toggledInput?.attackerModifierEntries) ? toggledInput.attackerModifierEntries : [])
      .map((entry) => ({ ...entry, sourceStatus: 'verified' })),
    defenderModifierEntries: (Array.isArray(toggledInput?.defenderModifierEntries) ? toggledInput.defenderModifierEntries : [])
      .map((entry) => ({ ...entry, sourceStatus: 'verified' })),
    attackerModifierContext: {
      ...(toggledInput?.attackerModifierContext ?? {}),
      sourceStatus: 'verified',
      flankOrRearAttack: false,
      flankRearBranch: null,
      engagedCommander: {
        ...(toggledInput?.attackerModifierContext?.engagedCommander ?? {}),
        sourceStatus: 'verified',
        status: 'engaged-main-unit',
        isEngaged: true,
      },
    },
    defenderModifierContext: {
      ...(toggledInput?.defenderModifierContext ?? {}),
      sourceStatus: 'verified',
      flankOrRearAttack: false,
      flankRearBranch: null,
      engagedCommander: {
        ...(toggledInput?.defenderModifierContext?.engagedCommander ?? {}),
        sourceStatus: 'verified',
        status: 'none',
        isEngaged: false,
      },
    },
  };
  const withCommander = resolveMeleeOutcome(closedInput);
  const withoutCommander = resolveMeleeOutcome({
    ...closedInput,
    attackerModifierContext: {
      ...(closedInput?.attackerModifierContext ?? {}),
      engagedCommander: {
        ...(closedInput?.attackerModifierContext?.engagedCommander ?? {}),
        status: 'none',
        isEngaged: false,
      },
    },
  });

  assert.equal(withCommander.status, 'resolved');
  assert.equal(withoutCommander.status, 'resolved');
  assert.notEqual(withCommander.breakdown?.attacker?.preDieTotal, withoutCommander.breakdown?.attacker?.preDieTotal);
});

test('p9v2-14D continuing rounds auto-lock commander toggle only when commander previously fought', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-commander-attached-main-a__melee-commander-attached-main-d',
  });
  const withCommanderEngaged = setMeleeResolutionDraftCommanderEngaged(drafted, 'attacker', true);
  const confirmedRoundOne = confirmMeleeResolutionDraft(withCommanderEngaged);
  const reopenedContinuing = startMeleeResolutionDraft(confirmedRoundOne, {
    meleeId: 'melee-commander-attached-main-a__melee-commander-attached-main-d',
  });
  const lockedCommander = reopenedContinuing.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;

  assert.equal(lockedCommander?.isToggleVisible, true);
  assert.equal(lockedCommander?.isToggleLocked, true);
  assert.equal(lockedCommander?.isEngaged, true);
  assert.equal(lockedCommander?.status, 'engaged-main-unit');

  const attemptedOff = setMeleeResolutionDraftCommanderEngaged(reopenedContinuing, 'attacker', false);
  const stillLockedCommander = attemptedOff.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;

  assert.equal(stillLockedCommander?.isToggleLocked, true);
  assert.equal(stillLockedCommander?.isEngaged, true);
});

test('p9v2-14D continuing rounds keep commander toggle optional when prior engaged is false', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-commander-attached-main-a__melee-commander-attached-main-d',
  });
  const confirmedRoundOne = confirmMeleeResolutionDraft(drafted);
  const reopenedContinuing = startMeleeResolutionDraft(confirmedRoundOne, {
    meleeId: 'melee-commander-attached-main-a__melee-commander-attached-main-d',
  });
  const commanderState = reopenedContinuing.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;

  assert.equal(commanderState?.isToggleVisible, true);
  assert.equal(commanderState?.isToggleLocked, false);
  assert.equal(commanderState?.isEngaged, false);
  assert.equal(reopenedContinuing.melee?.resolutionDraft?.resolutionInput?.meleeRoundState, 'continuing');

  const toggledOn = setMeleeResolutionDraftCommanderEngaged(reopenedContinuing, 'attacker', true);
  const toggledCommander = toggledOn.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;
  assert.equal(toggledCommander?.isToggleLocked, false);
  assert.equal(toggledCommander?.isEngaged, true);
});

test('p9v2-14D confirm persists commander engagement history and hydrates round-state and lock for next draft', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-commander-attached-main-a__melee-commander-attached-main-d',
  });
  const withCommanderEngaged = setMeleeResolutionDraftCommanderEngaged(drafted, 'attacker', true);
  const confirmed = confirmMeleeResolutionDraft(withCommanderEngaged);

  assert.equal(
    confirmed.melee?.roundStateByMeleeId?.['melee-commander-attached-main-a__melee-commander-attached-main-d'],
    'continuing',
  );
  assert.equal(
    confirmed.melee?.commanderEngagementHistoryByMeleeId?.['melee-commander-attached-main-a__melee-commander-attached-main-d']?.attacker,
    true,
  );

  const reopened = startMeleeResolutionDraft(confirmed, {
    meleeId: 'melee-commander-attached-main-a__melee-commander-attached-main-d',
  });
  const persistedInput = reopened.melee?.resolutionDraft?.resolutionInput;
  const commanderState = persistedInput?.attackerModifierContext?.engagedCommander;

  assert.equal(persistedInput?.meleeRoundState, 'continuing');
  assert.equal(commanderState?.priorEngaged, true);
  assert.equal(commanderState?.isToggleLocked, true);
  assert.equal(commanderState?.isEngaged, true);
});

test('p9v2-14D continuing source-open commander lanes emit explicit lock diagnostics', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState({
      roundStateByMeleeId: {
        'melee-commander-asymmetric-main-a__melee-commander-asymmetric-main-d': 'continuing',
      },
      commanderEngagementHistoryByMeleeId: {
        'melee-commander-asymmetric-main-a__melee-commander-asymmetric-main-d': {
          attacker: true,
          defender: false,
        },
      },
    }),
    units: [
      {
        id: 'melee-commander-asymmetric-main-a',
        owner: 'player-1',
        corpsId: 'p1-corps-9',
        profileId: 'heavy-infantry-spearmen',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-asymmetric-main-d',
        attachedCommanderId: 'melee-commander-asymmetric-a',
      },
      {
        id: 'melee-commander-asymmetric-a',
        owner: 'player-1',
        corpsId: 'p1-corps-9',
        profileId: 'commander',
        isCommander: true,
        attachedUnitId: 'melee-commander-some-other-main',
      },
      {
        id: 'melee-commander-asymmetric-main-d',
        owner: 'player-2',
        corpsId: 'p2-corps-9',
        profileId: 'medium-infantry-swordsmen',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-asymmetric-main-a',
      },
    ],
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-commander-asymmetric-main-a__melee-commander-asymmetric-main-d',
  });
  const diagnostics = Array.isArray(drafted.melee?.resolutionDraft?.diagnostics)
    ? drafted.melee.resolutionDraft.diagnostics
    : [];

  const sourceOpenLockDiagnostic = diagnostics.find(
    (entry) => entry?.code === 'melee.v2.commander-continuing-lock-source-open' && entry?.side === 'attacker',
  );
  assert.ok(sourceOpenLockDiagnostic);
  assert.equal(sourceOpenLockDiagnostic?.sourceStatus, 'source-open');
});

test('p9v2-14D support-only commander lanes do not expose a commander toggle in draft payload', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-commander-support-main-a__melee-commander-support-main-d',
  });
  const attackerCommander = drafted.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;
  const defenderCommander = drafted.melee?.resolutionDraft?.resolutionInput?.defenderModifierContext?.engagedCommander;

  assert.equal(getMeleeCommanderPresence(baseState, 'melee-commander-support-only-a').status, 'support-only');
  assert.equal(attackerCommander?.isToggleVisible, false);
  assert.equal(defenderCommander?.isToggleVisible, false);
});

test('p9v2-14 melee confirm keeps a result preview open until it is acknowledged', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const presentation = getMeleeProcedurePresentation(baseState);
  const entry = presentation.eligibleEntries.find((candidate) => candidate?.id === 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a');
  assert.ok(entry);

  const confirmedState = confirmMeleeResolutionDraft({
    ...baseState,
    melee: {
      ...baseState.melee,
      resolutionDraft: {
        meleeId: entry.id,
        attackerUnitId: entry.attackerUnitId,
        defenderUnitId: entry.defenderUnitId,
        attackerLabel: entry.resolutionInput?.attackerUnit?.scenarioLabel ?? 'Attacker',
        defenderLabel: entry.resolutionInput?.defenderUnit?.scenarioLabel ?? 'Defender',
        allUnits: Array.isArray(entry.allUnits) ? [...entry.allUnits] : [],
        resolutionInput: {
          ...entry.resolutionInput,
          attackerDieRoll: 6,
          defenderDieRoll: 1,
        },
        diagnostics: [],
      },
    },
  });

  assert.equal(confirmedState.melee?.resolutionDraft?.meleeId, entry.id);
  assert.equal(confirmedState.melee?.resolutionDraft?.resolutionPreview?.meleeId, entry.id);
  assert.equal(confirmedState.melee?.resolutionDraft?.resolutionPreview?.attackerDieRoll, 6);
  assert.equal(confirmedState.melee?.resolutionDraft?.resolutionPreview?.defenderDieRoll, 1);
  assert.equal(confirmedState.melee?.resolutionDraft?.resolutionPreview?.sourceStatus, 'verified');

  const acknowledgedState = acknowledgeMeleeResolutionResult(confirmedState);

  assert.equal(acknowledgedState.melee?.resolutionDraft, null);
  assert.equal(acknowledgedState.melee?.resolutionPreview, null);
});

test('p9v2-14A opening or canceling a new draft clears stale root resolution preview', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const stateWithStalePreview = {
    ...baseState,
    melee: {
      ...baseState.melee,
      resolutionPreview: {
        meleeId: 'stale-melee',
        attackerUnitId: 'stale-attacker',
        defenderUnitId: 'stale-defender',
        attackerLabel: 'Stale attacker',
        defenderLabel: 'Stale defender',
        attackerDieRoll: 6,
        defenderDieRoll: 1,
        status: 'resolved',
        result: {
          winnerSide: 'attacker',
          loserSide: 'defender',
          difference: 5,
          cohesionLoss: 2,
          rout: false,
        },
        diagnostics: [],
        sourceStatus: 'verified',
      },
    },
  };

  const openedState = startMeleeResolutionDraft(stateWithStalePreview, {
    meleeId: 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a',
  });

  assert.ok(openedState.melee?.resolutionDraft);
  assert.equal(openedState.melee?.resolutionPreview, null);

  const canceledState = cancelMeleeResolutionDraft(stateWithStalePreview);

  assert.equal(canceledState.melee?.resolutionDraft, null);
  assert.equal(canceledState.melee?.resolutionPreview, null);
});

test('p9v2-14C draft hydration wires support, flank/rear, and commander metadata into confirm payload', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });
  const input = drafted.melee?.resolutionDraft?.resolutionInput;

  assert.ok(input);
  assert.ok(Array.isArray(input.attackerModifierEntries));
  assert.equal(
    input.attackerModifierEntries.some((entry) => entry?.stage === MELEE_MODIFIER_STAGES.SUPPORT),
    true,
  );
  assert.equal(
    Array.isArray(input.additionalAttackerUnits)
      && input.additionalAttackerUnits.some((unit) => unit?.id === 'melee-drill-case1-side-melee'),
    true,
  );
  assert.ok(input.attackerModifierContext);
  assert.equal(input.attackerModifierContext?.flankOrRearAttack, true);
  assert.equal(input.attackerModifierContext?.flankRearBranch?.attackContactType, 'flank');
  assert.equal(input.attackerModifierContext?.flankRearBranch?.applyDefenderCombatFactorToZero, true);
  assert.equal(input.attackerModifierContext?.flankRearBranch?.cancelAttackSituationBonus, false);
  assert.equal(input.attackerModifierContext?.flankRearBranch?.ownershipAttackerUnitId, 'melee-drill-case1-side-melee');
  assert.equal(input.attackerModifierContext?.flankRearBranch?.inheritedDefenderToZeroFromBranch, true);
  assert.ok(input.attackerModifierContext?.engagedCommander);
  assert.ok(input.defenderModifierContext?.engagedCommander);

  const flankDrafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-p1-flank-c__melee-drill-p2-frontline-c-flanked',
  });
  const flankInput = flankDrafted.melee?.resolutionDraft?.resolutionInput;

  assert.ok(flankInput?.attackerModifierContext);
  assert.equal(flankInput.attackerModifierContext?.flankOrRearAttack, true);
  assert.ok(
    ['flank', 'rear', 'rear-or-flank'].includes(
      String(flankInput.attackerModifierContext?.flankRearBranch?.attackContactType ?? '').toLowerCase(),
    ),
  );
});

test('p9v2-14C1 case1 draft modifier sums match resolved factor recap', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });
  const draftPresentation = getMeleeProcedurePresentation(drafted);
  const factorPresentation = draftPresentation?.resolutionDraft?.factorPresentation;

  const sumStages = (stages = {}) => {
    const support = Array.isArray(stages?.[MELEE_MODIFIER_STAGES.SUPPORT]) ? stages[MELEE_MODIFIER_STAGES.SUPPORT] : [];
    const situation = Array.isArray(stages?.[MELEE_MODIFIER_STAGES.SITUATION]) ? stages[MELEE_MODIFIER_STAGES.SITUATION] : [];
    const terrain = Array.isArray(stages?.[MELEE_MODIFIER_STAGES.TERRAIN]) ? stages[MELEE_MODIFIER_STAGES.TERRAIN] : [];
    return [...support, ...situation, ...terrain].reduce((sum, entry) => sum + (Number(entry?.value) || 0), 0);
  };

  const draftAttackerModifierSum = sumStages(factorPresentation?.attackerModifierStages ?? {});
  const draftDefenderModifierSum = sumStages(factorPresentation?.defenderModifierStages ?? {});

  const withDice = setMeleeResolutionDraftValue(
    setMeleeResolutionDraftValue(drafted, 'attackerDieRoll', 3),
    'defenderDieRoll',
    2,
  );
  const confirmed = confirmMeleeResolutionDraft(withDice);
  const resolvedPresentation = getMeleeProcedurePresentation(confirmed);
  const factorRecap = resolvedPresentation?.resolutionDraft?.resolutionPreview?.factorRecap;

  assert.equal(draftAttackerModifierSum, factorRecap?.attacker?.modifierSum);
  assert.equal(draftDefenderModifierSum, factorRecap?.defender?.modifierSum);
});

test('p9v2-14C3 case2 draft exposes flank/rear branch candidates while keeping single deterministic owner', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-case2-main-a__melee-drill-case2-main-d',
  });
  const factorPresentation = getMeleeProcedurePresentation(drafted)?.resolutionDraft?.factorPresentation;
  const branch = factorPresentation?.attackerDerivedBranch ?? null;
  const candidates = Array.isArray(branch?.branchCandidates) ? branch.branchCandidates : [];
  const candidateIds = candidates.map((candidate) => candidate?.attackerUnitId).filter(Boolean).sort();
  const ownerCandidates = candidates.filter((candidate) => candidate?.isOwner === true);

  assert.deepEqual(candidateIds, [
    'melee-drill-case2-flank-left',
    'melee-drill-case2-flank-right',
    'melee-drill-case2-main-a',
    'melee-drill-case2-rear',
  ]);
  assert.equal(ownerCandidates.length, 1);
  assert.equal(ownerCandidates[0]?.attackerUnitId, branch?.ownershipAttackerUnitId);
});

test('p9v2-14C4 case2 draft modifier sums match resolved factor recap', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-case2-main-a__melee-drill-case2-main-d',
  });
  const draftPresentation = getMeleeProcedurePresentation(drafted);
  const factorPresentation = draftPresentation?.resolutionDraft?.factorPresentation;

  const sumStages = (stages = {}) => {
    const support = Array.isArray(stages?.[MELEE_MODIFIER_STAGES.SUPPORT]) ? stages[MELEE_MODIFIER_STAGES.SUPPORT] : [];
    const situation = Array.isArray(stages?.[MELEE_MODIFIER_STAGES.SITUATION]) ? stages[MELEE_MODIFIER_STAGES.SITUATION] : [];
    const terrain = Array.isArray(stages?.[MELEE_MODIFIER_STAGES.TERRAIN]) ? stages[MELEE_MODIFIER_STAGES.TERRAIN] : [];
    return [...support, ...situation, ...terrain].reduce((sum, entry) => sum + (Number(entry?.value) || 0), 0);
  };

  const draftAttackerModifierSum = sumStages(factorPresentation?.attackerModifierStages ?? {});
  const draftDefenderModifierSum = sumStages(factorPresentation?.defenderModifierStages ?? {});

  const withDice = setMeleeResolutionDraftValue(
    setMeleeResolutionDraftValue(drafted, 'attackerDieRoll', 3),
    'defenderDieRoll',
    2,
  );
  const confirmed = confirmMeleeResolutionDraft(withDice);
  const resolvedPresentation = getMeleeProcedurePresentation(confirmed);
  const factorRecap = resolvedPresentation?.resolutionDraft?.resolutionPreview?.factorRecap;

  assert.equal(draftAttackerModifierSum, factorRecap?.attacker?.modifierSum);
  assert.equal(draftDefenderModifierSum, factorRecap?.defender?.modifierSum);
});

test('p9v2-mini-11A resolution preview exposes stage ledger invariants', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });
  const withDice = setMeleeResolutionDraftValue(
    setMeleeResolutionDraftValue(drafted, 'attackerDieRoll', 3),
    'defenderDieRoll',
    2,
  );
  const confirmed = confirmMeleeResolutionDraft(withDice);
  const resolvedPresentation = getMeleeProcedurePresentation(confirmed);
  const attackerLedger = resolvedPresentation?.resolutionDraft?.resolutionPreview?.factorRecap?.attacker?.stageLedger;
  const defenderLedger = resolvedPresentation?.resolutionDraft?.resolutionPreview?.factorRecap?.defender?.stageLedger;

  assert.ok(attackerLedger);
  assert.ok(defenderLedger);

  assert.equal(attackerLedger.invariants?.flankRearHardZero, true);
  assert.equal(defenderLedger.invariants?.flankRearHardZero, true);
  assert.equal(attackerLedger.invariants?.finalMatchesStageSum, true);
  assert.equal(defenderLedger.invariants?.finalMatchesStageSum, true);

  const attackerExpected = Number(attackerLedger?.base ?? 0)
    + Number(attackerLedger?.support ?? 0)
    + Number(attackerLedger?.flankRear ?? 0)
    + Number(attackerLedger?.disorder ?? 0)
    + Number(attackerLedger?.die ?? 0);
  const defenderExpected = Number(defenderLedger?.base ?? 0)
    + Number(defenderLedger?.support ?? 0)
    + Number(defenderLedger?.flankRear ?? 0)
    + Number(defenderLedger?.disorder ?? 0)
    + Number(defenderLedger?.die ?? 0);

  assert.equal(attackerLedger?.final, attackerExpected);
  assert.equal(defenderLedger?.final, defenderExpected);
});

test('p9v2-mini-11A factor recap derives base and sums from stage ledger values', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });
  const withDice = setMeleeResolutionDraftValue(
    setMeleeResolutionDraftValue(drafted, 'attackerDieRoll', 3),
    'defenderDieRoll',
    2,
  );
  const confirmed = confirmMeleeResolutionDraft(withDice);
  const recap = getMeleeProcedurePresentation(confirmed)?.resolutionDraft?.resolutionPreview?.factorRecap;

  assert.ok(recap?.attacker?.stageLedger);
  assert.ok(recap?.defender?.stageLedger);
  assert.equal(recap?.attacker?.baseCombatFactor, recap?.attacker?.stageLedger?.base);
  assert.equal(recap?.defender?.baseCombatFactor, recap?.defender?.stageLedger?.base);

  const attackerModifierExpected = Number(recap?.attacker?.stageLedger?.support ?? 0)
    + Number(recap?.attacker?.stageLedger?.flankRear ?? 0)
    + Number(recap?.attacker?.stageLedger?.disorder ?? 0)
    + Number(recap?.attacker?.stageLedger?.residualModifierBreakdown?.situation ?? 0)
    + Number(recap?.attacker?.stageLedger?.residualModifierBreakdown?.terrain ?? 0);
  const defenderModifierExpected = Number(recap?.defender?.stageLedger?.support ?? 0)
    + Number(recap?.defender?.stageLedger?.flankRear ?? 0)
    + Number(recap?.defender?.stageLedger?.disorder ?? 0)
    + Number(recap?.defender?.stageLedger?.residualModifierBreakdown?.situation ?? 0)
    + Number(recap?.defender?.stageLedger?.residualModifierBreakdown?.terrain ?? 0);

  assert.equal(recap?.attacker?.modifierSum, attackerModifierExpected);
  assert.equal(recap?.defender?.modifierSum, defenderModifierExpected);
  assert.equal(recap?.defender?.stageLedger?.base, 0);
});

test('p9v2-mini-11A batch application plan separates multiple-attack and combat-result cohesion channels', () => {
  const batchPreview = {
    immediateEffects: [
      {
        type: 'multiple-attack-immediate',
        status: 'resolved',
        defenderUnitId: 'u-defender',
        cohesionLoss: 1,
      },
    ],
    resolvedEntries: [
      {
        meleeId: 'm1',
        attackerUnitId: 'u-attacker',
        defenderUnitId: 'u-defender',
        resolution: {
          status: 'resolved',
          result: {
            winnerSide: 'attacker',
            cohesionLoss: 2,
            rout: false,
          },
          breakdown: {
            attacker: {
              stageLedger: {
                base: 5,
                support: 0,
                flankRear: 0,
                disorder: 0,
                die: 4,
                final: 9,
              },
            },
          },
        },
      },
    ],
  };

  const plan = buildV2MeleeBatchApplicationPlan({ batchPreview });

  assert.equal(plan.effects?.multipleAttackImmediateByUnitId?.['u-defender'], 1);
  assert.equal(plan.effects?.combatResultCohesionByUnitId?.['u-defender'], 2);
  assert.equal(typeof plan.effects?.cohesionLossByUnitId, 'undefined');
  assert.equal(batchPreview.resolvedEntries[0]?.resolution?.breakdown?.attacker?.stageLedger?.final, 9);
});

test('p9v2-mini-11B pair 11/12 keeps arithmetic parity while immediate cohesion stays event-only', () => {
  const [pair11, pair12] = createP9V2Mini11BPair11vs12FixtureRows();
  const resolved11 = resolveMeleeOutcome(pair11?.resolutionInput ?? {});
  const resolved12 = resolveMeleeOutcome(pair12?.resolutionInput ?? {});

  assert.equal(resolved11.status, 'resolved');
  assert.equal(resolved12.status, 'resolved');

  const plan11 = buildV2MeleeBatchApplicationPlan({
    batchPreview: {
      immediateEffects: [],
      resolvedEntries: [
        {
          meleeId: 'p9v2-mini-11b-pair-11',
          attackerUnitId: pair11?.resolutionInput?.attackerUnit?.id,
          defenderUnitId: pair11?.resolutionInput?.defenderUnit?.id,
          resolution: resolved11,
        },
      ],
    },
  });
  const plan12 = buildV2MeleeBatchApplicationPlan({
    batchPreview: {
      immediateEffects: [pair12?.immediateMultipleAttackEvent],
      resolvedEntries: [
        {
          meleeId: 'p9v2-mini-11b-pair-12',
          attackerUnitId: pair12?.resolutionInput?.attackerUnit?.id,
          defenderUnitId: pair12?.resolutionInput?.defenderUnit?.id,
          resolution: resolved12,
        },
      ],
    },
  });

  assert.equal(
    pair12?.immediateMultipleAttackEvent?.precondition?.defenderAlreadyInMeleeOrSupport,
    true,
  );
  assert.equal(
    pair12?.immediateMultipleAttackEvent?.precondition?.newQualifyingFlankRearContact,
    true,
  );
  assert.equal(pair12?.immediateMultipleAttackEvent?.capPerDefenderPerSequencePhase, 1);

  const defenderUnitId = pair12?.resolutionInput?.defenderUnit?.id;
  assert.equal(plan11.effects?.multipleAttackImmediateByUnitId?.[defenderUnitId], undefined);
  assert.equal(plan12.effects?.multipleAttackImmediateByUnitId?.[defenderUnitId], 1);

  const parityKeys = ['base', 'support', 'flankRear', 'disorder', 'die', 'final'];
  for (const key of parityKeys) {
    assert.equal(
      resolved11.breakdown?.attacker?.stageLedger?.[key],
      resolved12.breakdown?.attacker?.stageLedger?.[key],
      `attacker parity failed for ${key}`,
    );
    assert.equal(
      resolved11.breakdown?.defender?.stageLedger?.[key],
      resolved12.breakdown?.defender?.stageLedger?.[key],
      `defender parity failed for ${key}`,
    );
  }
});

test('p9v2-mini-11C pair 15/16 keeps pending-versus-committed stage parity for one resolved draft', () => {
  let state = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const selectedMeleeIds = Array.isArray(state?.melee?.queueSelectionIds)
    ? [...state.melee.queueSelectionIds]
    : [];
  assert.ok(selectedMeleeIds.length > 0);

  const pair15MeleeId = selectedMeleeIds[0];
  for (const meleeId of selectedMeleeIds) {
    state = startMeleeResolutionDraft(state, { meleeId });
    if (meleeId === pair15MeleeId) {
      state = setMeleeResolutionDraftValue(state, 'attackerDieRoll', 5);
      state = setMeleeResolutionDraftValue(state, 'defenderDieRoll', 3);
    }
    state = confirmMeleeResolutionDraft(state);
  }

  assert.equal(state?.melee?.v2?.lifecycleStatus, MELEE_V2_LIFECYCLE_STATUSES.RESOLVED_PENDING_APPLY);

  const pair15PendingEntry = state?.melee?.v2?.pendingResolvedEntriesByMeleeId?.[pair15MeleeId];
  assert.ok(pair15PendingEntry);

  const parityKeys = ['base', 'support', 'flankRear', 'disorder', 'die', 'final'];
  const pendingAttackerLedger = pair15PendingEntry?.resolution?.breakdown?.attacker?.stageLedger ?? {};
  const pendingDefenderLedger = pair15PendingEntry?.resolution?.breakdown?.defender?.stageLedger ?? {};

  state = applyMeleeBatch(state);

  assert.equal(state?.melee?.v2?.lifecycleStatus, MELEE_V2_LIFECYCLE_STATUSES.COMPLETE);
  const pair16CommittedEntry = state?.melee?.v2?.committedResolvedEntriesByMeleeId?.[pair15MeleeId];
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

  assert.equal(typeof state?.melee?.batchApplicationPlan?.effects?.cohesionLossByUnitId, 'undefined');
  assert.equal(
    typeof state?.melee?.batchApplicationPlan?.effects?.multipleAttackImmediateByUnitId,
    'object',
  );
  assert.equal(
    typeof state?.melee?.batchApplicationPlan?.effects?.combatResultCohesionByUnitId,
    'object',
  );
});

test('p9v2-14C resolved totals differ when verified support/flank/commander modifier lanes are present versus absent', () => {
  const baseState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeDrillScenario().units,
  }));

  const drafted = startMeleeResolutionDraft(baseState, {
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });
  const input = drafted.melee?.resolutionDraft?.resolutionInput;
  assert.ok(input);
  assert.equal(input.attackerModifierContext?.flankRearBranch?.applyDefenderCombatFactorToZero, true);

  const closedInputWithModifiers = {
    ...input,
    attackerDieRoll: 4,
    defenderDieRoll: 4,
    attackerModifierEntries: (Array.isArray(input.attackerModifierEntries) ? input.attackerModifierEntries : [])
      .map((entry) => ({ ...entry, sourceStatus: 'verified' })),
    defenderModifierEntries: (Array.isArray(input.defenderModifierEntries) ? input.defenderModifierEntries : [])
      .map((entry) => ({ ...entry, sourceStatus: 'verified' })),
    attackerModifierContext: {
      ...(input.attackerModifierContext ?? {}),
      sourceStatus: 'verified',
      flankOrRearAttack: true,
      flankRearBranch: {
        ...(input.attackerModifierContext?.flankRearBranch ?? {}),
        sourceStatus: 'verified',
        applyDefenderCombatFactorToZero: true,
      },
      engagedCommander: {
        ...(input.attackerModifierContext?.engagedCommander ?? { status: 'none' }),
        sourceStatus: 'verified',
      },
    },
    defenderModifierContext: {
      ...(input.defenderModifierContext ?? {}),
      sourceStatus: 'verified',
      flankOrRearAttack: false,
      flankRearBranch: null,
      engagedCommander: {
        ...(input.defenderModifierContext?.engagedCommander ?? { status: 'none' }),
        sourceStatus: 'verified',
      },
    },
  };
  const closedInputWithoutModifiers = {
    ...closedInputWithModifiers,
    attackerModifierEntries: [],
    defenderModifierEntries: [],
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: false,
      flankRearBranch: null,
      engagedCommander: {
        status: 'none',
        sourceStatus: 'verified',
      },
    },
    defenderModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: false,
      flankRearBranch: null,
      engagedCommander: {
        status: 'none',
        sourceStatus: 'verified',
      },
    },
  };

  const withModifiers = resolveMeleeOutcome(closedInputWithModifiers);
  const withoutModifiers = resolveMeleeOutcome(closedInputWithoutModifiers);

  assert.equal(withModifiers.status, 'resolved');
  assert.equal(withoutModifiers.status, 'resolved');
  assert.equal(
    withModifiers.breakdown?.defender?.stages?.situation?.some(
      (entry) => String(entry?.code ?? '').includes('defender-factor-to-zero'),
    ),
    true,
  );
  assert.notEqual(withModifiers.breakdown?.attacker?.preDieTotal, withoutModifiers.breakdown?.attacker?.preDieTotal);
  assert.notEqual(withModifiers.breakdown?.attacker?.finalTotal, withoutModifiers.breakdown?.attacker?.finalTotal);
});

test('p9v2-13 active fight set carries commander presence metadata for representative lanes', () => {
  const gameState = acknowledgeMeleePhaseProcedure(beginMeleePhaseState({
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    melee: createInitialMeleeState(),
    units: createMeleeCommanderPresenceScenario().units,
  }));
  const presentation = getMeleeProcedurePresentation(gameState);
  const contactModel = createMeleeV2ContactModel({
    gameState,
    presentation,
  });
  const activeFightSet = buildV2ActiveFightSet({
    contactModel,
    eligibleEntries: presentation.eligibleEntries,
  });

  const includedEntry = activeFightSet.entries.find(
    (entry) => entry?.attackerUnitId === 'melee-commander-included-main-a',
  );
  const attachedEntry = activeFightSet.entries.find(
    (entry) => entry?.attackerUnitId === 'melee-commander-attached-main-a',
  );

  assert.equal(includedEntry?.v2AttackerCommanderPresence?.status, 'included');
  assert.equal(attachedEntry?.v2AttackerCommanderPresence?.status, 'attached');
  assert.equal(attachedEntry?.v2AttackerCommanderPresence?.commanderUnitId, 'melee-commander-attached-a');
});

test('p9v2 keeps origin-only lanes clickable when unit is otherwise a main fight candidate', () => {
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
        meleeContactEvidence: {
          principalOpponentId: 'main-d',
          contactOrigin: 'move-to-support-contact',
        },
      },
      {
        id: 'main-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
      },
    ],
  }));

  assert.equal(getMeleeUnitStatus(state, 'main-a'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'main-d'), 'main-defender-pending');
});

test('p9v2 keeps simple support active when melee support is not from the same fight anchor', () => {
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
        rotationRadians: 0,
        meleeContactEvidence: {
          principalOpponentId: 'main-d',
          contactSide: 'front',
          contactClassification: { type: 'front' },
        },
      },
      {
        id: 'main-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
        rotationRadians: Math.PI,
      },
      {
        id: 'simple-left',
        owner: 'player-1',
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          principalOpponentId: 'main-a',
          contactRole: 'simple-support',
          contactSide: 'left',
          contactClassification: { type: 'flank' },
        },
      },
      {
        id: 'simple-right',
        owner: 'player-1',
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          principalOpponentId: 'main-a',
          contactRole: 'simple-support',
          contactSide: 'right',
          contactClassification: { type: 'flank' },
        },
      },
      {
        id: 'melee-left',
        owner: 'player-1',
        inMeleeSupport: true,
        meleeContactEvidence: {
          principalOpponentId: 'other-d',
          contactRole: 'melee-support',
          contactSide: 'left',
          contactClassification: { type: 'flank' },
        },
      },
      {
        id: 'other-a',
        owner: 'player-1',
        engagedInMelee: true,
        meleePendingOpponentId: 'other-d',
        rotationRadians: 0,
        meleeContactEvidence: {
          principalOpponentId: 'other-d',
          contactSide: 'front',
          contactClassification: { type: 'front' },
        },
      },
      {
        id: 'other-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'other-a',
        rotationRadians: Math.PI,
      },
    ],
  }));

  assert.equal(getMeleeUnitStatus(state, 'main-a'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'main-d'), 'main-defender-pending');
  assert.equal(getMeleeUnitStatus(state, 'melee-left'), 'support-participant');
  assert.equal(getMeleeUnitStatus(state, 'simple-left'), 'support-participant');
  assert.equal(getMeleeUnitStatus(state, 'simple-right'), 'support-participant');
});

test('p9v2 displaces only within same fight cluster and canonical side', () => {
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
        rotationRadians: 0,
        meleeContactEvidence: {
          principalOpponentId: 'main-d',
          contactSide: 'front',
          contactClassification: { type: 'front' },
        },
      },
      {
        id: 'main-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'main-a',
        rotationRadians: Math.PI,
      },
      {
        id: 'simple-left-main',
        owner: 'player-1',
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          principalOpponentId: 'main-a',
          contactRole: 'simple-support',
          contactSide: 'left',
          contactClassification: { type: 'flank' },
        },
      },
      {
        id: 'simple-right-main',
        owner: 'player-1',
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          principalOpponentId: 'main-a',
          contactRole: 'simple-support',
          contactSide: 'right',
          contactClassification: { type: 'flank' },
        },
      },
      {
        id: 'melee-right-same-fight',
        owner: 'player-1',
        inMeleeSupport: true,
        meleeContactEvidence: {
          principalOpponentId: 'main-d',
          contactRole: 'melee-support',
          contactSide: 'right',
          contactClassification: { type: 'flank' },
        },
      },
      {
        id: 'other-a',
        owner: 'player-1',
        engagedInMelee: true,
        meleePendingOpponentId: 'other-d',
        rotationRadians: 0,
        meleeContactEvidence: {
          principalOpponentId: 'other-d',
          contactSide: 'front',
          contactClassification: { type: 'front' },
        },
      },
      {
        id: 'other-d',
        owner: 'player-2',
        engagedInMelee: true,
        meleePendingOpponentId: 'other-a',
        rotationRadians: Math.PI,
      },
      {
        id: 'melee-left-other-fight',
        owner: 'player-1',
        inMeleeSupport: true,
        meleeContactEvidence: {
          principalOpponentId: 'other-d',
          contactRole: 'melee-support',
          contactSide: 'left',
          contactClassification: { type: 'flank' },
        },
      },
    ],
  }));

  assert.equal(getMeleeUnitStatus(state, 'simple-left-main'), 'non-melee');
  assert.equal(getMeleeUnitStatus(state, 'simple-right-main'), 'support-participant');
});

test('p9v2-02 melee procedure presentation exposes v2 decision seam and explicit source-open fallback diagnostics', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const presentation = getMeleeProcedurePresentation(state.game);
  const seamDiagnostic = presentation.diagnostics.find(
    (entry) => entry?.code === 'melee.v2.contact-role-fallback-source-open',
  );

  assert.equal(presentation.v2?.decisionLaneOwner, 'v2-contact-role-seam');
  assert.equal(typeof presentation.v2?.wrapperFallbackUsed, 'boolean');
  assert.ok(Array.isArray(presentation.v2?.sourceOpenUnitIds));
  assert.ok(Number(presentation.overview?.sourceOpenUnits ?? 0) >= 0);
  assert.ok(seamDiagnostic);
  assert.equal(seamDiagnostic?.sourceStatus, 'source-open');
});

test('p9v2-02 main-attacker prioritization surfaces explicit diagnostics for multi-attacker defender groups', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const presentation = getMeleeProcedurePresentation(state.game);
  const prioritizationDiagnostics = presentation.diagnostics.filter(
    (entry) => entry?.code === 'melee.v2.main-attacker-priority-applied'
      || entry?.code === 'melee.v2.main-attacker-priority-fallback'
      || entry?.code === 'melee.v2.main-attacker-priority-no-conflict',
  );

  assert.ok(prioritizationDiagnostics.length >= 1);
  assert.ok(
    prioritizationDiagnostics.some((entry) => entry?.selectedMeleeId)
      || prioritizationDiagnostics.some((entry) => entry?.code === 'melee.v2.main-attacker-priority-no-conflict'),
  );
});

test('p9v2-06 unresolved branch presentation stays source-open instead of disappearing', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a',
  });

  const presentation = getMeleeProcedurePresentation(state.game);
  const factorPresentation = presentation.resolutionDraft?.factorPresentation;

  assert.equal(factorPresentation?.attackerDerivedBranch?.sourceStatus, 'source-open');
  assert.equal(factorPresentation?.defenderDerivedBranch?.sourceStatus, 'source-open');
  assert.equal(factorPresentation?.attackerDerivedBranch?.attackContactType, 'unknown');
  assert.equal(factorPresentation?.defenderDerivedBranch?.attackContactType, 'unknown');
});

test('p9v2-03 tracks lifecycle status transitions and separates pending versus committed results', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  assert.equal(state.game.melee?.v2?.lifecycleStatus, MELEE_V2_LIFECYCLE_STATUSES.IDLE);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  assert.equal(state.game.melee?.v2?.lifecycleStatus, MELEE_V2_LIFECYCLE_STATUSES.SELECTING);
  assert.deepEqual(state.game.melee?.v2?.committedMeleeIds, []);

  const selectedMeleeIds = Array.isArray(state.game.melee?.queueSelectionIds)
    ? [...state.game.melee.queueSelectionIds]
    : [];
  assert.ok(selectedMeleeIds.length > 0);

  for (const meleeId of selectedMeleeIds) {
    state = reduceAppState(state, {
      type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
      meleeId,
    });
    state = reduceAppState(state, {
      type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
    });
  }

  assert.equal(state.game.melee?.v2?.lifecycleStatus, MELEE_V2_LIFECYCLE_STATUSES.RESOLVED_PENDING_APPLY);
  assert.ok(Array.isArray(state.game.melee?.v2?.pendingMeleeIds));
  assert.ok(state.game.melee.v2.pendingMeleeIds.length > 0);
  assert.equal(state.game.melee?.v2?.committedMeleeIds?.length ?? 0, 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  assert.equal(state.game.melee?.v2?.lifecycleStatus, MELEE_V2_LIFECYCLE_STATUSES.COMPLETE);
  assert.equal(state.game.melee?.v2?.pendingMeleeIds?.length ?? 0, 0);
  assert.ok((state.game.melee?.v2?.committedMeleeIds?.length ?? 0) > 0);
});

test('p9v2-04 preview queue is wired to v2 contact graph and apply stays blocked while required fights are unresolved', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.PREVIEW_MELEE_BATCH,
  });

  assert.equal(state.game.melee?.status, 'preview-ready');
  assert.equal(state.game.melee?.v2?.queueSource, 'v2-contact-graph');
  assert.equal(state.game.melee?.v2?.resolutionVersion, 'v2');
  assert.ok(Array.isArray(state.game.melee?.batchPreview?.unresolvedMeleeIds));
  assert.ok((state.game.melee?.batchPreview?.unresolvedMeleeIds?.length ?? 0) > 0);

  const beforeApply = state;
  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  assert.equal(state.game.melee?.status, beforeApply.game.melee?.status);
  assert.equal(
    state.game.melee?.diagnostics?.some(
      (entry) => entry?.code === 'melee.v2.apply-blocked-unresolved-required-fights',
    ),
    true,
  );

  const selectedMeleeIds = Array.isArray(state.game.melee?.queueSelectionIds)
    ? [...state.game.melee.queueSelectionIds]
    : [];
  for (const meleeId of selectedMeleeIds) {
    state = reduceAppState(state, {
      type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
      meleeId,
    });
    state = reduceAppState(state, {
      type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
    });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.PREVIEW_MELEE_BATCH,
  });

  assert.equal(state.game.melee?.batchPreview?.isReadyForApply, true);
  assert.equal(state.game.melee?.batchPreview?.unresolvedMeleeIds?.length ?? 0, 0);
});

test('p9v2-04 source-status aggregation uses worst-case propagation for active fights and batch previews', () => {
  const activeFightSet = buildV2ActiveFightSet({
    contactModel: {
      contacts: [
        {
          meleeId: 'm1',
          sourceStatus: 'source-open',
          attackContactType: 'flank',
        },
      ],
    },
    eligibleEntries: [
      {
        id: 'm1',
        attackerUnitId: 'a1',
        defenderUnitId: 'd1',
      },
    ],
  });

  assert.equal(activeFightSet.sourceStatus, 'source-open');

  const preview = buildV2MeleeBatchPreview({
    queue: [
      {
        id: 'm1',
        v2ContactSourceStatus: 'verified',
      },
    ],
    resolvedEntriesByMeleeId: {
      m1: {
        meleeId: 'm1',
        resolution: {
          status: 'source-open',
        },
      },
    },
  });

  assert.equal(preview.batchPreview.hasSourceOpenResolution, true);
  assert.equal(preview.batchPreview.unresolvedMeleeIds.length, 0);
  assert.equal(preview.batchPreview.sourceStatus, 'source-open');
});

test('p9v2-10 resolved drafts can apply even when source-open lanes remain explicit', () => {
  const scenario = createMeleeDrillScenario();
  const meleeId = 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a';
  const gameState = {
    commandContext: {
      activePlayerId: 'player-1',
      currentPhaseId: 'melee',
    },
    units: scenario.units,
    melee: createInitialMeleeState({
      status: 'active',
      queueSelectionIds: [meleeId],
      resolvedMeleeIds: [meleeId],
      resolvedEntriesByMeleeId: {
        [meleeId]: {
          meleeId,
          attackerUnitId: 'melee-drill-p1-frontline-a',
          defenderUnitId: 'melee-drill-p2-frontline-a',
          resolution: {
            status: 'source-open',
          },
          applicationStatus: 'pending-simultaneous-batch',
        },
      },
    }),
  };

  assert.equal(canApplyResolvedMeleeBatch(gameState), true);

  const applied = applyMeleeBatch(gameState);
  assert.equal(applied.melee?.status, 'applied');
  assert.equal(applied.melee?.batchSummary?.isOpen, true);
  assert.equal(Number(applied.melee?.batchSummary?.resolvedMelees ?? 0), 1);
});

test('p9v2-05 contact origin classifies movement support contact without mislabeling it as charge', () => {
  const model = createMeleeV2ContactModel({
    gameState: {
      units: [
        {
          id: 'a1',
          hasChargedThisSequence: false,
          meleeContactEvidence: {
            contactType: 'front',
            contactRole: 'simple-support',
            meleeTriggerBridge: {
              triggerFamily: 'movement-conformation',
            },
          },
        },
        {
          id: 'd1',
        },
      ],
    },
    presentation: {
      eligibleEntries: [
        {
          id: 'm1',
          attackerUnitId: 'a1',
          defenderUnitId: 'd1',
        },
      ],
    },
  });

  assert.equal(model.contacts.length, 1);
  assert.equal(model.contacts[0].contactOrigin, MELEE_V2_CONTACT_ORIGINS.MOVE_TO_SUPPORT_CONTACT);
  assert.notEqual(model.contacts[0].contactOrigin, MELEE_V2_CONTACT_ORIGINS.CHARGE_CONTACT);
  assert.equal(model.contacts[0].contactOriginSourceStatus, 'verified');
});

test('p9v2-05 unknown contact origin keeps contact source-open even with verified attack contact type', () => {
  const model = createMeleeV2ContactModel({
    gameState: {
      units: [
        {
          id: 'a1',
          hasChargedThisSequence: false,
          meleeContactEvidence: {
            contactType: 'front',
          },
        },
        {
          id: 'd1',
        },
      ],
    },
    presentation: {
      eligibleEntries: [
        {
          id: 'm1',
          attackerUnitId: 'a1',
          defenderUnitId: 'd1',
        },
      ],
    },
  });

  assert.equal(model.contacts.length, 1);
  assert.equal(model.contacts[0].contactOrigin, MELEE_V2_CONTACT_ORIGINS.UNKNOWN_ORIGIN);
  assert.equal(model.contacts[0].sourceStatus, 'source-open');

  const activeFightSet = buildV2ActiveFightSet({
    contactModel: model,
    eligibleEntries: [
      {
        id: 'm1',
        attackerUnitId: 'a1',
        defenderUnitId: 'd1',
      },
    ],
  });

  assert.equal(activeFightSet.sourceStatus, 'source-open');

  const preview = buildV2MeleeBatchPreview({
    queue: activeFightSet.entries,
    resolvedEntriesByMeleeId: {
      m1: {
        meleeId: 'm1',
        resolution: {
          status: 'resolved',
        },
      },
    },
  });

  assert.equal(preview.batchPreview.hasSourceOpenQueueOrigins, true);
  assert.equal(preview.batchPreview.sourceStatus, 'source-open');
});

test('p9v2-05 applied batch summary exposes contact origins from v2 queue', () => {
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const selectedMeleeIds = Array.isArray(state.game.melee?.queueSelectionIds)
    ? [...state.game.melee.queueSelectionIds]
    : [];

  for (const meleeId of selectedMeleeIds) {
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

  assert.equal(state.game.melee?.status, 'applied');
  assert.equal(state.game.melee?.batchSummary?.isOpen, true);
  assert.ok(Array.isArray(state.game.melee?.batchSummary?.contactOrigins));
  assert.ok((state.game.melee?.batchSummary?.contactOrigins?.length ?? 0) > 0);
});

test('p9v2-05 explicit contact origin from unit evidence is preferred over heuristics', () => {
  const model = createMeleeV2ContactModel({
    gameState: {
      units: [
        {
          id: 'a1',
          hasChargedThisSequence: true,
          meleeContactEvidence: {
            principalOpponentId: 'd1',
            contactType: 'front',
            contactOrigin: MELEE_V2_CONTACT_ORIGINS.PURSUIT_CONTACT,
            meleeTriggerBridge: {
              triggerFamily: 'movement-conformation',
            },
          },
        },
        {
          id: 'd1',
        },
      ],
    },
    presentation: {
      eligibleEntries: [
        {
          id: 'm1',
          attackerUnitId: 'a1',
          defenderUnitId: 'd1',
        },
      ],
    },
  });

  assert.equal(model.contacts.length, 1);
  assert.equal(model.contacts[0].contactOrigin, MELEE_V2_CONTACT_ORIGINS.PURSUIT_CONTACT);
  assert.equal(model.contacts[0].contactOriginSourceStatus, 'verified');
  assert.equal(model.contacts[0].sourceStatus, 'verified');
});

test('p9v2-05 ambiguous charge and movement-conformation signals do not auto-verify charge origin', () => {
  const model = createMeleeV2ContactModel({
    gameState: {
      units: [
        {
          id: 'a1',
          hasChargedThisSequence: true,
          meleeContactEvidence: {
            contactType: 'front',
            contactRole: 'simple-support',
            meleeTriggerBridge: {
              triggerFamily: 'movement-conformation',
            },
          },
        },
        {
          id: 'd1',
        },
      ],
    },
    presentation: {
      eligibleEntries: [
        {
          id: 'm1',
          attackerUnitId: 'a1',
          defenderUnitId: 'd1',
        },
      ],
    },
  });

  assert.equal(model.contacts.length, 1);
  assert.equal(model.contacts[0].contactOrigin, MELEE_V2_CONTACT_ORIGINS.UNKNOWN_ORIGIN);
  assert.equal(model.contacts[0].contactOriginSourceStatus, 'source-open');
  assert.equal(model.contacts[0].sourceStatus, 'source-open');
  assert.equal(
    model.contacts[0].contactOriginDiagnostics.some(
      (entry) => entry?.code === 'melee.v2.contact-origin-ambiguous-charge-vs-movement-conformation',
    ),
    true,
  );
});

test('p9v2-11 verified flank branch keeps active fight and preview source status verified', () => {
  const model = createMeleeV2ContactModel({
    gameState: {
      units: [
        {
          id: 'a1',
          meleeContactEvidence: {
            principalOpponentId: 'd1',
            sourceStatus: 'verified',
            contactType: 'flank',
            contactOrigin: MELEE_V2_CONTACT_ORIGINS.CHARGE_CONTACT,
            meleeTriggerBridge: {
              sourceStatus: 'verified',
              cancellationFamilyHint: 'flank-contact-formed',
              cancelAttackSituationBonus: true,
              defenderFactorToZeroEligible: true,
            },
          },
        },
        {
          id: 'd1',
        },
      ],
    },
    presentation: {
      eligibleEntries: [
        {
          id: 'm1',
          attackerUnitId: 'a1',
          defenderUnitId: 'd1',
        },
      ],
    },
  });

  assert.equal(model.contacts.length, 1);
  assert.equal(model.contacts[0].flankRearBranch?.attackContactType, 'flank');
  assert.equal(model.contacts[0].flankRearBranch?.cancellationApplies, true);
  assert.equal(model.contacts[0].flankRearSourceStatus, 'verified');

  const activeFightSet = buildV2ActiveFightSet({
    contactModel: model,
    eligibleEntries: [
      {
        id: 'm1',
        attackerUnitId: 'a1',
        defenderUnitId: 'd1',
      },
    ],
  });

  assert.equal(activeFightSet.sourceStatus, 'verified');

  const preview = buildV2MeleeBatchPreview({
    queue: activeFightSet.entries,
    resolvedEntriesByMeleeId: {
      m1: {
        meleeId: 'm1',
        resolution: {
          status: 'resolved',
        },
      },
    },
  });

  assert.equal(preview.batchPreview.hasSourceOpenQueueFlankRearBranches, false);
  assert.equal(preview.batchPreview.sourceStatus, 'verified');
});

test('p9v2-11 ambiguous rear-or-flank branch remains source-open through active fight and preview', () => {
  const model = createMeleeV2ContactModel({
    gameState: {
      units: [
        {
          id: 'a1',
          meleeContactEvidence: {
            principalOpponentId: 'd1',
            sourceStatus: 'verified',
            contactType: 'rear-or-flank',
          },
        },
        {
          id: 'd1',
        },
      ],
    },
    presentation: {
      eligibleEntries: [
        {
          id: 'm1',
          attackerUnitId: 'a1',
          defenderUnitId: 'd1',
        },
      ],
    },
  });

  assert.equal(model.contacts.length, 1);
  assert.equal(model.contacts[0].flankRearSourceStatus, 'source-open');
  assert.equal(
    model.contacts[0].flankRearDiagnostics.some(
      (entry) => entry?.code === 'melee.v2.branch.flank-rear-ambiguous-contact-type',
    ),
    true,
  );

  const activeFightSet = buildV2ActiveFightSet({
    contactModel: model,
    eligibleEntries: [
      {
        id: 'm1',
        attackerUnitId: 'a1',
        defenderUnitId: 'd1',
      },
    ],
  });
  assert.equal(activeFightSet.sourceStatus, 'source-open');

  const preview = buildV2MeleeBatchPreview({
    queue: activeFightSet.entries,
    resolvedEntriesByMeleeId: {
      m1: {
        meleeId: 'm1',
        resolution: {
          status: 'resolved',
        },
      },
    },
  });

  assert.equal(preview.batchPreview.hasSourceOpenQueueFlankRearBranches, true);
  assert.equal(preview.batchPreview.sourceStatus, 'source-open');

  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const units = [
    {
      id: 'a1',
      owner: 'player-1',
      engagedInMelee: true,
      meleePendingOpponentId: 'd1',
      meleeContactEvidence: {
        principalOpponentId: 'd1',
        sourceStatus: 'verified',
        contactType: 'rear-or-flank',
      },
    },
    {
      id: 'd1',
      owner: 'player-2',
      engagedInMelee: true,
      meleePendingOpponentId: 'a1',
    },
  ];

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        activePlayerId: 'player-1',
        currentPhaseId: 'melee',
      },
      units,
      melee: createInitialMeleeState({
        status: 'active',
        queueSelectionIds: ['a1__d1'],
      }),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.PREVIEW_MELEE_BATCH,
  });

  assert.equal(
    state.game.melee?.diagnostics?.some(
      (entry) => entry?.code === 'melee.v2.branch.flank-rear-ambiguous-contact-type',
    ),
    true,
  );
});

test('p9v2-11 cancellation request without family hint stays source-open', () => {
  const model = createMeleeV2ContactModel({
    gameState: {
      units: [
        {
          id: 'a1',
          meleeContactEvidence: {
            principalOpponentId: 'd1',
            sourceStatus: 'verified',
            contactType: 'rear',
            contactOrigin: MELEE_V2_CONTACT_ORIGINS.CHARGE_CONTACT,
            meleeTriggerBridge: {
              sourceStatus: 'verified',
              cancelAttackSituationBonus: true,
            },
          },
        },
        {
          id: 'd1',
        },
      ],
    },
    presentation: {
      eligibleEntries: [
        {
          id: 'm1',
          attackerUnitId: 'a1',
          defenderUnitId: 'd1',
        },
      ],
    },
  });

  assert.equal(model.contacts.length, 1);
  assert.equal(model.contacts[0].flankRearSourceStatus, 'source-open');
  assert.equal(
    model.contacts[0].flankRearDiagnostics.some(
      (entry) => entry?.code === 'melee.v2.branch.cancellation-family-missing',
    ),
    true,
  );
  assert.equal(model.contacts[0].sourceStatus, 'source-open');

  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const units = [
    {
      id: 'a1',
      owner: 'player-1',
      engagedInMelee: true,
      meleePendingOpponentId: 'd1',
      meleeContactEvidence: {
        principalOpponentId: 'd1',
        sourceStatus: 'verified',
        contactType: 'rear',
        contactOrigin: MELEE_V2_CONTACT_ORIGINS.CHARGE_CONTACT,
        meleeTriggerBridge: {
          sourceStatus: 'verified',
          cancelAttackSituationBonus: true,
        },
      },
    },
    {
      id: 'd1',
      owner: 'player-2',
      engagedInMelee: true,
      meleePendingOpponentId: 'a1',
    },
  ];

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        activePlayerId: 'player-1',
        currentPhaseId: 'melee',
      },
      units,
      melee: createInitialMeleeState({
        status: 'active',
        queueSelectionIds: ['a1__d1'],
      }),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.PREVIEW_MELEE_BATCH,
  });

  assert.equal(
    state.game.melee?.diagnostics?.some(
      (entry) => entry?.code === 'melee.v2.branch.cancellation-family-missing',
    ),
    true,
  );
});
