import test from 'node:test';
import assert from 'node:assert/strict';

import { BATTLEFIELD_PROFILE_IDS } from '../data/battlefield-profiles.js';
import { CHARGE_DRILL_SCENARIO_ID } from '../data/charge-drill-scenarios.js';
import { CONFORM_DRILL_SCENARIO_ID, CONFORM_DRILL_SUPPORT_STATUSES } from '../data/conform-drill-scenarios.js';
import {
  CHARGE_BRANCH_DISTANCE_OUTCOMES,
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_HANDOFF_STATUSES,
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_REACTION_DECISION_TYPES,
  CHARGE_REACTION_REQUEST_TYPES,
  CHARGE_TARGET_CANDIDATE_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createChargeBranchRollResult,
  getChargeTargetCandidateByUnitId,
  resolveIsolatedSingleUnitEvadePlan,
} from '../engine/charge/index.js';
import { COMMAND_CP_REASON_CODES } from '../engine/command/index.js';
import { degreesToRadians } from '../engine/geometry/index.js';
import { getWheelAngleRadiansForDistanceUd } from '../engine/movement/wheel.js';
import {
  ACTION_TYPES,
  BATTLE_PHASE_IDS,
  COMMAND_PLAYER_IDS,
  OVERLAY_MODES,
  SCREEN_IDS,
  SETUP_STEP_IDS,
  SETUP_VIEW_MODES,
  applyAdjustedChargeDistanceToReactionRequests,
  createSecondaryTargetReactionRequests,
  createInitialAppState,
  reduceAppState,
} from './p0-state.js';
import {
  getSlideQualifiedMovementDistanceUd,
  hasUnitFinishedMovementPhase,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from './p0-movement.js';
import { getMovementPreviewAdvanceDistanceUd, getMovementPreviewResolvedDistanceUd } from '../engine/movement/index.js';
import { MOVEMENT_SLIDE_SIDES } from './p0-slide.js';
import { beginShootingPhaseState } from './p0-shooting.js';
import { resolveEffectiveCommandMenuBranch } from './p0-state-ui-helpers.js';

function startNewGame(state = createInitialAppState()) {
  return reduceAppState(state, { type: ACTION_TYPES.START_NEW_GAME });
}

function advanceToBattlefield(state = createInitialAppState()) {
  const nextState = startNewGame(state);

  return {
    ...nextState,
    game: {
      ...nextState.game,
      setup: {
        ...nextState.game.setup,
        isActive: false,
      },
      commandContext: {
        ...nextState.game.commandContext,
        currentPhaseId: BATTLE_PHASE_IDS.MOVEMENT,
        activePlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
      },
    },
  };
}

function startDirectBattle(state = createInitialAppState()) {
  return reduceAppState(state, { type: ACTION_TYPES.START_DIRECT_BATTLE });
}

function startChargeDrillBattle(state = createInitialAppState()) {
  return reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
}

function startConformDrillBattle(state = createInitialAppState()) {
  return reduceAppState(state, { type: ACTION_TYPES.START_CONFORM_DRILL_BATTLE });
}

function prepareConformDrillE1NoEvadeHandoff() {
  let state = startConformDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'conform-drill-cfd-e1-b1-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'conform-drill-cfd-e1-a1-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.NO_EVADE,
  });

  return state;
}

function selectTestUnit(state) {
  const withActiveCorps = state.game.commandContext.currentPhaseId === BATTLE_PHASE_IDS.MOVEMENT
    && state.game.commandContext.activePlayerId === COMMAND_PLAYER_IDS.PLAYER_ONE
    && !state.game.commandContext.activeCorpsId
    ? reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' })
    : state;

  return reduceAppState(withActiveCorps, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
}

function completeSetupToBattle(state = startNewGame()) {
  let nextState = state;

  while (nextState.game.setup.currentStepId !== SETUP_STEP_IDS.READY) {
    nextState = reduceAppState(nextState, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  return reduceAppState(nextState, { type: ACTION_TYPES.COMPLETE_SETUP });
}

function exhaustCurrentPlayerCorps(state) {
  const corpsIds = ['corps-1', 'corps-2', 'corps-3'];
  let nextState = state;

  corpsIds.forEach((corpsId, index) => {
    nextState = reduceAppState(nextState, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId });
    nextState = reduceAppState(nextState, { type: ACTION_TYPES.REQUEST_NEXT_CORPS });

    if (index < corpsIds.length - 1) {
      nextState = reduceAppState(nextState, { type: ACTION_TYPES.CONFIRM_NEXT_CORPS });
    }
  });

  return nextState;
}

test('new game defaults to 200 points', () => {
  const state = createInitialAppState();

  assert.equal(state.shell.newGame.points, 200);
  assert.equal(state.shell.currentScreen, SCREEN_IDS.MAIN_MENU);
  assert.equal(state.game.battlefieldProfileId, BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
});

test('starting a new game enters the battlefield setup flow', () => {
  const state = startNewGame();

  assert.equal(state.shell.currentScreen, SCREEN_IDS.BATTLEFIELD);
  assert.equal(state.game.setup.isActive, true);
  assert.equal(state.game.setup.currentStepId, SETUP_STEP_IDS.FORMAT);
  assert.equal(state.game.setupViewMode, 'canonical');
});

test('locking the current setup step marks it as fixed', () => {
  let state = startNewGame();

  state = reduceAppState(state, { type: ACTION_TYPES.LOCK_CURRENT_SETUP_STEP });

  assert.deepEqual(state.game.setup.lockedStepIds, [SETUP_STEP_IDS.FORMAT]);
});

test('direct battle start skips setup and enters the battlefield movement phase', () => {
  const state = startDirectBattle();

  assert.equal(state.shell.currentScreen, SCREEN_IDS.BATTLEFIELD);
  assert.equal(state.game.setup.isActive, false);
  assert.equal(state.game.phaseTracker.mode, 'battle');
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.MOVEMENT);
  assert.equal(state.game.round?.dialog?.type, 'round-start');
});

test('charge drill battle start loads the dedicated scenario with stable fixture anchors', () => {
  const state = startChargeDrillBattle();

  assert.equal(state.shell.currentScreen, SCREEN_IDS.BATTLEFIELD);
  assert.equal(state.game.setup.isActive, false);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.MOVEMENT);
  assert.equal(state.game.scenarioId, CHARGE_DRILL_SCENARIO_ID);
  assert.equal(state.game.scenarioLabel, 'Charge Drill');
  assert.equal(state.game.units.every((unit) => unit.fixtureTag === CHARGE_DRILL_SCENARIO_ID), true);
  assert.equal(state.game.units.some((unit) => unit.id === 'charge-drill-p1-front-charger'), true);
  assert.equal(state.game.units.some((unit) => unit.id === 'charge-drill-p2-flank-target'), true);
  assert.equal(state.game.units.some((unit) => unit.id === 'charge-drill-p1-zoc-charger'), true);
  assert.equal(state.game.units.some((unit) => unit.id === 'charge-drill-p2-double-blocked-target'), true);
  assert.equal(state.game.setup.terrain.placeholders.some((placeholder) => placeholder.id === 'charge-drill-future-terrain'), true);
  assert.equal(state.game.setup.setupObjects.placeholders.some((placeholder) => placeholder.id === 'charge-drill-future-obstacle'), true);
  assert.equal(state.game.selectedUnitId, null);
});

test('conform drill battle start loads source-backed example lanes without setup', () => {
  const state = startConformDrillBattle();

  assert.equal(state.shell.currentScreen, SCREEN_IDS.BATTLEFIELD);
  assert.equal(state.game.setup.isActive, false);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.MOVEMENT);
  assert.equal(state.game.scenarioId, CONFORM_DRILL_SCENARIO_ID);
  assert.equal(state.game.scenarioLabel, 'Conform Drill');
  assert.equal(state.game.units.every((unit) => unit.fixtureTag === CONFORM_DRILL_SCENARIO_ID), true);
  assert.equal(state.game.units.some((unit) => unit.id === 'conform-drill-cfd-e1-b1-charger'), true);
  assert.equal(state.game.units.some((unit) => unit.scenarioExampleId === 'rv2-p53-shifting-units-a'), true);
  assert.equal(state.game.units.some((unit) => unit.scenarioSupportStatus === CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED), true);
  assert.equal(state.game.setup.terrain.placeholders.length, 0);
  assert.equal(state.game.setup.setupObjects.placeholders.some((placeholder) => placeholder.id.startsWith('conform-drill-')), false);
  assert.equal(state.game.selectedUnitId, null);
});

test('conform drill CFD-E1 no-evade handoff exposes live shifting conformation plan', () => {
  const state = prepareConformDrillE1NoEvadeHandoff();

  const conformationPlan = state.game.chargePreview.conformationPlan;
  const candidate = conformationPlan.candidates[0];
  const shiftStep = conformationPlan.shiftingPlan?.steps[0];

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF);
  assert.equal(conformationPlan.status, 'ready');
  assert.equal(candidate?.status, 'complete');
  assert.equal(candidate?.contactSide, 'front');
  assert.equal(candidate?.finalPose?.xUd, 6.4);
  assert.equal(candidate?.finalPose?.yUd, 12.35);
  assert.equal(conformationPlan.shiftingPlan?.status, 'ready');
  assert.equal(shiftStep?.unitId, 'conform-drill-cfd-e1-b2-shifted-neighbor');
  assert.equal(shiftStep?.direction, 'rear');
  assert.equal(shiftStep?.distanceUd, 0.755);
  assert.equal(conformationPlan.shiftingPlan?.lockEffects[0]?.movedOrRalliedLock, true);
});

test('confirming conform drill CFD-E1 applies conformation and completes the charge movement', () => {
  const readyState = prepareConformDrillE1NoEvadeHandoff();
  const candidate = readyState.game.chargePreview.conformationPlan.candidates[0];
  const shiftStep = readyState.game.chargePreview.conformationPlan.shiftingPlan.steps[0];

  const state = reduceAppState(readyState, { type: ACTION_TYPES.CONFIRM_CHARGE_CONFORMATION });
  const charger = state.game.units.find((unit) => unit.id === 'conform-drill-cfd-e1-b1-charger');
  const target = state.game.units.find((unit) => unit.id === 'conform-drill-cfd-e1-a1-target');
  const shiftedNeighbor = state.game.units.find((unit) => unit.id === 'conform-drill-cfd-e1-b2-shifted-neighbor');

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.IDLE);
  assert.equal(charger.xUd, candidate.finalPose.xUd);
  assert.equal(charger.yUd, candidate.finalPose.yUd);
  assert.equal(charger.rotationRadians, candidate.finalPose.rotationRadians);
  assert.equal(charger.stayedThisMovementPhase, true);
  assert.equal(charger.moveCountThisSequence, 1);
  assert.equal(charger.hasChargedThisSequence, true);
  assert.equal(charger.cannotShootThisSequence, true);
  assert.equal(hasUnitFinishedMovementPhase(charger), true);
  assert.equal(charger.meleePending, true);
  assert.equal(charger.meleePendingOpponentId, target.id);
  assert.equal(charger.conformationApplied.status, 'applied');
  assert.equal(charger.conformationApplied.candidateStatus, 'complete');
  assert.equal(target.meleePending, true);
  assert.equal(target.meleePendingOpponentId, charger.id);
  assert.equal(shiftedNeighbor.xUd, shiftStep.toPose.xUd);
  assert.equal(shiftedNeighbor.yUd, shiftStep.toPose.yUd);
  assert.equal(shiftedNeighbor.movementOrRallyLockedByConformation, true);
  assert.equal(hasUnitFinishedMovementPhase(shiftedNeighbor), true);
  assert.equal(shiftedNeighbor.lastConformationShift.unitId, shiftedNeighbor.id);
  assert.equal(state.game.lastChargeCompletion.conformationPlan.status, 'applied');
  assert.equal(state.game.lastChargeCompletion.appliedConformation.shiftingPlan.status, 'ready');
});

test('conformation confirmation ignores non-ready source-open or blocked plans', () => {
  const readyState = prepareConformDrillE1NoEvadeHandoff();
  const incompleteState = {
    ...readyState,
    game: {
      ...readyState.game,
      chargePreview: {
        ...readyState.game.chargePreview,
        conformationPlan: {
          ...readyState.game.chargePreview.conformationPlan,
          candidates: readyState.game.chargePreview.conformationPlan.candidates.map((candidate) => ({
            ...candidate,
            status: 'incomplete',
          })),
        },
      },
    },
  };
  const sourceOpenState = {
    ...readyState,
    game: {
      ...readyState.game,
      chargePreview: {
        ...readyState.game.chargePreview,
        conformationPlan: {
          ...readyState.game.chargePreview.conformationPlan,
          status: 'source-open',
        },
      },
    },
  };
  const blockedState = {
    ...readyState,
    game: {
      ...readyState.game,
      chargePreview: {
        ...readyState.game.chargePreview,
        conformationPlan: {
          ...readyState.game.chargePreview.conformationPlan,
          status: 'blocked',
        },
      },
    },
  };

  assert.equal(reduceAppState(incompleteState, { type: ACTION_TYPES.CONFIRM_CHARGE_CONFORMATION }), incompleteState);
  assert.equal(reduceAppState(sourceOpenState, { type: ACTION_TYPES.CONFIRM_CHARGE_CONFORMATION }), sourceOpenState);
  assert.equal(reduceAppState(blockedState, { type: ACTION_TYPES.CONFIRM_CHARGE_CONFORMATION }), blockedState);
});

test('charge drill battle can open charge targeting for the front charger without dragging setup units first', () => {
  let state = startChargeDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.TARGETING);
  assert.equal(state.game.chargePreview.intent?.unitId, 'charge-drill-p1-front-charger');
  assert.equal(state.game.chargePreview.targetCandidates.length, state.game.units.length - 1);
  assert.equal(state.game.chargePreview.targetCandidates.some((candidate) => candidate.unitId === 'charge-drill-p2-front-target'), true);
  assert.equal(state.game.chargePreview.targetCandidates.some((candidate) => candidate.unitId === 'charge-drill-p2-out-of-range-target'), true);
});

test('round begin opens corps selection and selecting a corps closes the popup', () => {
  let state = startDirectBattle();

  assert.equal(state.game.round.dialog.type, 'round-start');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.MOVEMENT);

  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  assert.equal(state.game.round.dialog.type, 'corps-selection');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-1');
  assert.equal(state.game.round.dialog.type, null);
});

test('requesting the next corps spends the active corps and can branch into shooting', () => {
  let state = startDirectBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });

  state = reduceAppState(state, { type: ACTION_TYPES.REQUEST_NEXT_CORPS });
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-1')?.status, 'spent');
  assert.equal(state.game.round.dialog.type, 'next-corps-prompt');

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_NEXT_CORPS });
  assert.equal(state.game.round.dialog.type, 'corps-selection');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-2' });
  state = reduceAppState(state, { type: ACTION_TYPES.REQUEST_NEXT_CORPS });
  state = reduceAppState(state, { type: ACTION_TYPES.SKIP_REMAINING_CORPS });

  assert.equal(state.game.round.roundPhase, 'shooting');
  assert.equal(state.game.round.dialog.type, 'phase-announce');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.SHOOTING);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.SHOOTING);
  assert.equal(state.game.shooting.status, 'active');
  assert.equal(state.game.shooting.phaseId, BATTLE_PHASE_IDS.SHOOTING);
  assert.equal(state.game.shooting.actingPlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.deepEqual(state.game.shooting.targetedUnitIds, []);
});

test('round begin resets stale shooting phase tracking for the next corps-movement sequence', () => {
  let state = startDirectBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.REQUEST_NEXT_CORPS });
  state = reduceAppState(state, { type: ACTION_TYPES.SKIP_REMAINING_CORPS });

  state = {
    ...state,
    game: {
      ...state.game,
      shooting: {
        ...state.game.shooting,
        targetedUnitIds: ['enemy-unit-1'],
        declaredShots: [{ shooterUnitId: 'test-unit-1', targetUnitId: 'enemy-unit-1' }],
      },
      round: {
        ...state.game.round,
        turnPlayerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
        roundPhase: 'corps-movement',
        dialog: { type: 'player-switch', phaseLabel: null },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });

  assert.equal(state.game.shooting.status, 'idle');
  assert.equal(state.game.shooting.actingPlayerId, null);
  assert.deepEqual(state.game.shooting.targetedUnitIds, []);
  assert.deepEqual(state.game.shooting.declaredShots, []);
});

test('round flow switches to player two and then starts a fresh next round', () => {
  let state = startDirectBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  state = exhaustCurrentPlayerCorps(state);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.roundPhase, 'combat');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.MELEE);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.roundPhase, 'rout-pursuit');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.CLEANUP);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.roundPhase, 'victory-check');
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.VICTORY);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  assert.equal(state.game.round.turnPlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.equal(state.game.round.dialog.type, 'player-switch');
  assert.equal(state.game.round.roundPhase, 'corps-movement');

  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  assert.equal(state.game.round.dialog.type, 'corps-selection');
  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.ok(state.game.commandContext.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-1');
  assert.equal(state.game.commandContext.commander.unitId, 'test-unit-2');

  state = exhaustCurrentPlayerCorps(state);
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });

  assert.equal(state.game.round.roundNumber, 2);
  assert.equal(state.game.round.turnPlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.round.dialog.type, 'round-start');
  assert.ok(state.game.commandContext.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));
});

test('selecting a unit from a non-active corps is ignored', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c2-mi-1' });

  assert.equal(state.game.selectedUnitId, null);
});

test('command context initializes as a placeholder skeleton', () => {
  const state = createInitialAppState();

  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
  assert.equal(state.game.commandContext.sourceStatus, 'placeholder');
  assert.equal(state.game.commandContext.commandPoints.available, null);
  assert.equal(state.game.commandContext.inCommand.status, 'placeholder');
});

test('command context remains JSON-serializable', () => {
  const state = completeSetupToBattle();
  const serialized = JSON.stringify(state.game.commandContext);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(parsed.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
  assert.equal(parsed.sourceStatus, 'placeholder');
  assert.equal(parsed.corpsActivation.corps.length, 3);
  assert.ok(parsed.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));
  assert.equal(parsed.commandPoints.spent, 0);
  assert.equal(parsed.commandPoints.free, 0);
  assert.deepEqual(parsed.commandPoints.ledger, []);
  assert.equal(parsed.commander.attachedUnitId, null);
  assert.equal(parsed.inCommand.unitId, null);
});

test('command context activates, completes, and resets corps lifecycle deterministically', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.ok(state.game.commandContext.corpsActivation.corps.every((corps) => corps.status === 'not-yet-activated'));

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-2');
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-2').status, 'active');
  assert.equal(state.game.commandContext.corpsActivation.activationHistory.at(-1).status, 'active');

  state = reduceAppState(state, {
    type: ACTION_TYPES.COMPLETE_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-2').status, 'spent');
  assert.equal(state.game.commandContext.corpsActivation.activationHistory.at(-1).status, 'spent');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  assert.equal(state.game.commandContext.activeCorpsId, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.COMMAND,
  });
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-2').status, 'spent');
  assert.ok(state.game.commandContext.corpsActivation.corps.some((corps) => corps.status === 'not-yet-activated'));
});

test('corps activation generates a deterministic placeholder CP snapshot and roll log', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });

  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.lastRoll, 4);
  assert.equal(state.game.commandContext.commandPoints.free, 1);
  assert.equal(state.game.commandContext.commandPoints.ledger.length, 2);
  assert.equal(state.game.commandContext.corpsActivation.corps.find((corps) => corps.corpsId === 'corps-1').activationRoll, 4);
  assert.equal(state.game.commandContext.corpsActivation.activationHistory.at(-1).activationRoll, 4);

  state = reduceAppState(state, {
    type: ACTION_TYPES.COMPLETE_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });

  assert.equal(state.game.commandContext.commandPoints.available, null);
  assert.equal(state.game.commandContext.commandPoints.lastRoll, null);
  assert.deepEqual(state.game.commandContext.commandPoints.ledger, []);
});

test('active corps selection resolves the active commander snapshot', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });

  assert.equal(state.game.commandContext.commander.unitId, 'test-unit-1');
  assert.equal(state.game.commandContext.commander.quality, 'brilliant');
  assert.equal(state.game.commandContext.commander.rangeUd, 8);
  assert.match(state.game.commandContext.commander.label, /brilliant/i);
});

test('selected unit receives an in-command snapshot against the active corps commander', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commandContext.inCommand.status, 'in-command');
  assert.equal(state.game.commandContext.inCommand.unitId, 'p1-c1-cav-1');
  assert.ok(state.game.commandContext.inCommand.distanceUd < state.game.commandContext.inCommand.commandRangeUd);
});

test('selected unit becomes out of command when moved beyond strict command range', () => {
  let state = completeSetupToBattle();

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'p1-c1-cav-1'
          ? { ...unit, xUd: 18, yUd: unit.yUd }
          : unit
      )),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commandContext.inCommand.status, 'out-of-command');
  assert.ok(state.game.commandContext.inCommand.distanceUd > state.game.commandContext.inCommand.commandRangeUd);
});

test('commander-engaged diagnostic toggle produces a reproducible blocked order case', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_COMMANDER_ENGAGED_DIAGNOSTIC,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.commandContext.commander.engagedInCombat, true);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
  assert.match(
    state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'commander-engaged')?.text ?? '',
    /engaged in combat/i,
  );

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_COMMANDER_ENGAGED_DIAGNOSTIC,
    isActive: false,
  });

  assert.equal(state.game.commandContext.commander.engagedInCombat, false);
});

test('selected commander uses attach targeting, then confirms attachment and follows the host move', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.commandContext.commandPoints.free, 1);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.commandMenu.activeBranch, 'attach');
  assert.equal(state.game.commanderFreeMovePreview.status, 'targeting');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');
  assert.equal(state.game.commanderFreeMovePreview.targetUnitId, 'p1-c1-cav-1');

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  assert.equal(state.game.commandMenu.activeBranch, null);

  const attachedHost = state.game.units.find((unit) => unit.id === 'p1-c1-cav-1');
  const attachedCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.equal(attachedHost?.attachedCommanderId, 'test-unit-1');
  assert.equal(attachedCommander?.attachedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.commandContext.commander.attachedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.commandContext.commandPoints.free, 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.DETACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.units.find((unit) => unit.id === 'p1-c1-cav-1')?.attachedCommanderId, 'test-unit-1');
  assert.equal(state.game.units.find((unit) => unit.id === 'test-unit-1')?.attachedUnitId, 'p1-c1-cav-1');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const movedHost = state.game.units.find((unit) => unit.id === 'p1-c1-cav-1');
  const movedCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(movedHost);
  assert.ok(movedCommander);
  assert.equal(Number(Math.abs(movedHost.yUd - movedCommander.yUd).toFixed(3)), Number(((movedHost.depthUd / 2) + (movedCommander.depthUd / 2)).toFixed(3)));
});

test('attached commanders are released automatically when the player turn ends', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      round: {
        ...state.game.round,
        turnPlayerId: 'player-1',
        roundPhase: 'victory-check',
        dialog: { type: 'phase-announce', phaseLabel: 'Siegbedingungen' },
      },
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_ROUND_PHASE });

  assert.equal(state.game.units.find((unit) => unit.id === 'p1-c1-cav-1')?.attachedCommanderId, null);
  assert.equal(state.game.units.find((unit) => unit.id === 'test-unit-1')?.attachedUnitId, null);
});

test('resetting an attached commander clears the host attachment relation as well', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESET_TEST_UNITS,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.units.find((unit) => unit.id === 'test-unit-1')?.attachedUnitId, null);
  assert.equal(state.game.units.find((unit) => unit.id === 'p1-c1-cav-1')?.attachedCommanderId, null);
  assert.equal(state.game.commandContext.commander.attachedUnitId, null);
});

test('resetting a moved host restores its attached commander to the pre-attach position', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });

  const initialCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(initialCommander);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialCommander.xUd + 2).toFixed(3)),
    yUd: initialCommander.yUd,
    dragOriginXUd: initialCommander.xUd,
    dragOriginYUd: initialCommander.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'move');

  const preAttachCommander = {
    xUd: Number(state.game.commanderFreeMovePreview.xUd),
    yUd: Number(state.game.commanderFreeMovePreview.yUd),
    advanceUsedUd: Number(state.game.commanderFreeMovePreview.nextSpentUd),
  };
  assert.equal(preAttachCommander.advanceUsedUd, 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const afterHostMoveCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(afterHostMoveCommander);
  assert.notEqual(afterHostMoveCommander.yUd, preAttachCommander.yUd);

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESET_TEST_UNITS,
    unitId: 'p1-c1-cav-1',
  });

  const resetCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  const resetHost = state.game.units.find((unit) => unit.id === 'p1-c1-cav-1');
  assert.ok(resetCommander);
  assert.ok(resetHost);
  assert.equal(resetCommander.attachedUnitId, null);
  assert.equal(resetHost.attachedCommanderId, null);
  assert.equal(resetCommander.xUd, preAttachCommander.xUd);
  assert.equal(resetCommander.yUd, preAttachCommander.yUd);
  assert.equal(resetCommander.advanceUsedUd, preAttachCommander.advanceUsedUd);
});

test('attach targeting still accepts a host when only the host footprint touches the remaining commander radius', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'test-unit-1',
  });

  const initialCommander = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(initialCommander);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialCommander.xUd + 4.2).toFixed(3)),
    yUd: initialCommander.yUd,
    dragOriginXUd: initialCommander.xUd,
    dragOriginYUd: initialCommander.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 4.2);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'p1-c1-cav-1'
          ? {
              ...unit,
              xUd: Number((state.game.commanderFreeMovePreview.xUd + 1.3).toFixed(3)),
              yUd: state.game.commanderFreeMovePreview.yUd,
            }
          : unit
      )),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.targetUnitId, 'p1-c1-cav-1');
  assert.ok(Number(state.game.commanderFreeMovePreview.nextSpentUd) <= 5);
});

test('movement keeps the in-command snapshot frozen from order start across chained commands', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.orderCommandSnapshot.status, 'in-command');
  assert.equal(state.game.movement.orderCommandSnapshot.unitId, 'p1-c1-cav-1');

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.orderCommandSnapshot.status, 'in-command');
  assert.match(state.game.movement.orderCommandSnapshot.label, /In command at/);
});

test('a later move rechecks command status with a fresh order snapshot', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  assert.equal(state.game.movement.orderCommandSnapshot, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-2',
  });

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.orderCommandSnapshot.status, 'out-of-command');
  assert.match(state.game.movement.orderCommandSnapshot.label, /Out of command at 9\.00 UD\./);
});

test('confirm advance spends CP for the frozen order snapshot, including the out-of-command surcharge', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  assert.equal(state.game.commandContext.commandPoints.available, 2);
  assert.equal(state.game.commandContext.commandPoints.spent, 2);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-2).reasonCode, 'base-order');
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, 'out-of-command');
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'p1-c1-cav-1');

test('included commander host unit can optionally spend the free CP on its movement order', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c3-hi-1',
  });

  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.free, 1);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).amount, -1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'p1-c3-hi-1');
});
});

test('movement preview blocks confirmation when the current order costs more CP than remain', () => {
  let state = completeSetupToBattle();
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        commandPoints: {
          ...state.game.commandContext.commandPoints,
          available: 1,
          label: '1 CP available',
        },
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          distanceUd: 9,
          commandRangeUd: 8,
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const cpDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-point-cost');
  assert.ok(cpDiagnostic);
  assert.equal(cpDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(state.game.commandContext.commandPoints.available, 1);
});

test('P6 command fixture includes three corps per player with requested compositions', () => {
  const state = createInitialAppState();
  const fixtureUnits = state.game.units.filter((unit) => unit.fixtureTag === 'p6-command-fixture');

  assert.equal(fixtureUnits.length, 20);

  for (const owner of [COMMAND_PLAYER_IDS.PLAYER_ONE, COMMAND_PLAYER_IDS.PLAYER_TWO]) {
    const ownerUnits = fixtureUnits.filter((unit) => unit.owner === owner);
    const ownerCorpsIds = new Set(ownerUnits.map((unit) => unit.corpsId));

    assert.equal(ownerUnits.length, 10);
    assert.equal(ownerCorpsIds.size, 3);

    const corpsOneUnits = ownerUnits.filter((unit) => unit.corpsId.endsWith('corps-1'));
    assert.equal(corpsOneUnits.filter((unit) => unit.troopType === 'general').length, 1);
    assert.equal(corpsOneUnits.filter((unit) => unit.troopType === 'cavalry').length, 2);

    const corpsTwoUnits = ownerUnits.filter((unit) => unit.corpsId.endsWith('corps-2'));
    assert.equal(corpsTwoUnits.filter((unit) => unit.troopType === 'general').length, 1);
    assert.equal(corpsTwoUnits.filter((unit) => unit.troopType === 'medium-infantry').length, 2);

    const corpsThreeUnits = ownerUnits.filter((unit) => unit.corpsId.endsWith('corps-3'));
    assert.equal(corpsThreeUnits.filter((unit) => unit.troopType === 'heavy-infantry').length, 4);
    assert.equal(corpsThreeUnits.filter((unit) => unit.hasIncludedCommander).length, 1);
  }
});

test('P6 command fixture uses requested commander qualities, ranges, and base dimensions', () => {
  const state = createInitialAppState();
  const fixtureUnits = state.game.units.filter((unit) => unit.fixtureTag === 'p6-command-fixture');

  const brilliantCommanders = fixtureUnits.filter((unit) => unit.commanderQuality === 'brilliant');
  const competentCommanders = fixtureUnits.filter((unit) => unit.commanderQuality === 'competent');
  const ordinaryCommanders = fixtureUnits.filter((unit) => unit.commanderQuality === 'ordinary');

  assert.equal(brilliantCommanders.length, 2);
  assert.equal(competentCommanders.length, 2);
  assert.equal(ordinaryCommanders.length, 2);

  assert.ok(brilliantCommanders.every((unit) => unit.commandRangeUd === 8));
  assert.ok(competentCommanders.every((unit) => unit.commandRangeUd === 6));
  assert.ok(ordinaryCommanders.every((unit) => unit.commandRangeUd === 4));

  const generals = fixtureUnits.filter((unit) => unit.troopType === 'general');
  const mediumInfantry = fixtureUnits.filter((unit) => unit.troopType === 'medium-infantry');
  const cavalry = fixtureUnits.filter((unit) => unit.troopType === 'cavalry');
  const heavyInfantry = fixtureUnits.filter((unit) => unit.troopType === 'heavy-infantry');

  assert.ok(generals.every((unit) => unit.baseShape === 'circle' && unit.widthUd === 1 && unit.depthUd === 1));
  assert.ok(mediumInfantry.every((unit) => unit.baseShape === 'square' && unit.widthUd === 1 && unit.depthUd === 1));
  assert.ok(cavalry.every((unit) => unit.baseShape === 'rectangle' && unit.widthUd === 1 && unit.depthUd === 0.75));
  assert.ok(heavyInfantry.every((unit) => unit.baseShape === 'rectangle' && unit.widthUd === 1 && unit.depthUd === 0.75));
});

test('P6 command fixture corps are placed side-by-side in each player zone orientation', () => {
  const state = createInitialAppState();
  const fixtureUnits = state.game.units.filter((unit) => unit.fixtureTag === 'p6-command-fixture');

  const playerOneUnits = fixtureUnits.filter((unit) => unit.owner === COMMAND_PLAYER_IDS.PLAYER_ONE);
  const playerTwoUnits = fixtureUnits.filter((unit) => unit.owner === COMMAND_PLAYER_IDS.PLAYER_TWO);

  const playerOneCorpsCenters = new Set(
    playerOneUnits
      .filter((unit) => unit.isCommander)
      .map((unit) => Number(unit.xUd.toFixed(2))),
  );

  const playerTwoCorpsCenters = new Set(
    playerTwoUnits
      .filter((unit) => unit.isCommander)
      .map((unit) => Number(unit.xUd.toFixed(2))),
  );

  assert.equal(playerOneCorpsCenters.size, 2);
  assert.equal(playerTwoCorpsCenters.size, 2);

  assert.ok(playerOneUnits.every((unit) => unit.yUd >= 17));
  assert.ok(playerTwoUnits.every((unit) => (
    unit.id === 'test-unit-3'
      ? unit.yUd <= 13
      : unit.id === 'test-unit-4'
        ? unit.yUd <= 8.5
        : unit.yUd <= 3
  )));
  assert.ok(playerOneUnits.every((unit) => unit.facing === 'north' && unit.rotationRadians === 0));
  assert.ok(playerTwoUnits.every((unit) => unit.facing === 'south' && unit.rotationRadians === Math.PI));
});

test('movement state initializes as a serializable placeholder spine', () => {
  const state = createInitialAppState();
  const serialized = JSON.stringify(state.game.movement);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.selectedCommandId, null);
  assert.equal(parsed.draft, null);
  assert.equal(parsed.preview.status, MOVEMENT_PREVIEW_STATUSES.IDLE);
  assert.equal(parsed.preview.sourceStatus, MOVEMENT_SOURCE_STATUSES.PLACEHOLDER);
  assert.equal(parsed.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.IDLE);
});

test('charge preview state initializes as a serializable placeholder spine', () => {
  const state = createInitialAppState();

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.IDLE);
  assert.equal(state.game.chargePreview.intent, null);
  assert.deepEqual(state.game.chargePreview.targetCandidates, []);
  assert.deepEqual(state.game.chargePreview.startManoeuvreOptions, []);
  assert.deepEqual(state.game.chargePreview.pathSegments, []);
  assert.deepEqual(state.game.chargePreview.contactEvents, []);
  assert.deepEqual(state.game.chargePreview.reactionRequests, []);
  assert.equal(state.game.chargePreview.conformationPlan.status, 'idle');
  assert.doesNotThrow(() => JSON.stringify(state.game.chargePreview));
});

test('starting charge preview captures a reducer-owned targeting state for the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.TARGETING);
  assert.equal(state.game.chargePreview.intent?.unitId, 'test-unit-1');
  assert.equal(state.game.chargePreview.intent?.targetUnitId, null);
  assert.equal(state.game.chargePreview.targetCandidates.some((candidate) => candidate.unitId === 'test-unit-3' && candidate.status === 'eligible'), true);
  assert.equal(state.game.chargePreview.targetCandidates.some((candidate) => candidate.unitId === 'test-unit-4' && candidate.status === 'blocked'), true);
  assert.equal(state.game.chargePreview.targetCandidates.some((candidate) => candidate.unitId === 'p1-c1-cav-1' && candidate.status === 'blocked'), true);
  assert.equal(state.game.chargePreview.intent?.startPose?.xUd, state.game.units.find((unit) => unit.id === 'test-unit-1')?.xUd);
  assert.equal(state.game.movement.selectedCommandId, null);
});

test('charge target selection immediately readies a direct legal none-start charge', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.READY);
  assert.equal(state.game.chargePreview.startManoeuvreOptions.length, 3);
  assert.equal(state.game.chargePreview.intent?.targetUnitId, 'test-unit-3');
  assert.equal(state.game.chargePreview.intent?.targetSnapshot?.unitId, 'test-unit-3');
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.type, 'none');
  assert.equal(state.game.chargePreview.pathSegments.length, 1);
  assert.equal(state.game.chargePreview.contactEvents.length, 1);
  assert.equal(state.game.chargePreview.contactEvents[0]?.defenderId, 'test-unit-3');
  assert.deepEqual(state.game.chargePreview.contactEvents[0]?.contactSnapshot?.chargerStartPose, state.game.chargePreview.intent?.startPose);
  assert.equal(state.game.chargePreview.contactEvents[0]?.contactSnapshot?.frozenDirectionRadians, state.game.chargePreview.intent?.frozenDirectionRadians);
  assert.equal(state.game.chargePreview.contactEvents[0]?.classification?.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT);
  assert.equal(state.game.chargePreview.pathSegments[0].rotationRadians, state.game.units.find((unit) => unit.id === 'test-unit-1')?.rotationRadians);
  assert.equal(state.game.chargePreview.intent?.frozenDirectionRadians, state.game.units.find((unit) => unit.id === 'test-unit-1')?.rotationRadians);
  assert.equal(state.game.chargePreview.reactionRequests[0]?.type, CHARGE_REACTION_REQUEST_TYPES.NONE);
  assert.equal(state.game.chargePreview.conformationPlan.status, 'ready');
  assert.equal(state.game.chargePreview.conformationPlan.candidates[0]?.status, 'complete');
  assert.equal(state.game.movement.preview.status, 'idle');
});

test('charge start manoeuvre selection freezes a guide direction in reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.READY);
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.type, 'none');
  assert.equal(state.game.chargePreview.intent?.frozenDirectionRadians, state.game.chargePreview.pathSegments[0]?.rotationRadians);
  assert.equal(Number.isFinite(state.game.chargePreview.intent?.frozenDirectionRadians), true);
  assert.equal(state.game.chargePreview.pathSegments.length, 1);
  assert.equal(state.game.chargePreview.reactionRequests.length, 1);
  assert.equal(state.game.chargePreview.reactionRequests[0]?.type, 'none');
  assert.equal(state.game.chargePreview.conformationPlan.status, 'ready');
  assert.equal(state.game.chargePreview.conformationPlan.candidates[0]?.status, 'complete');
});

test('charge start manoeuvre selection keeps the declaration ready until direction confirmation opens the reaction gate', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.READY);
  assert.equal(state.game.chargePreview.reactionRequests.length, 1);
  assert.equal(state.game.chargePreview.reactionRequests[0]?.type, 'may-evade');
  assert.equal(state.game.chargePreview.reactionRequests[0]?.status, 'pending');
  assert.equal(state.game.chargePreview.reactionRequests[0]?.unitId, 'test-unit-3');
  assert.deepEqual(state.game.chargePreview.reactionRequests[0]?.chargePathSnapshot, state.game.chargePreview.pathSegments);
  assert.deepEqual(
    state.game.chargePreview.reactionRequests[0]?.contactSnapshot,
    state.game.chargePreview.contactEvents[0]?.contactSnapshot,
  );

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.REACTION_PENDING);
  assert.equal(state.game.chargePreview.declarationSnapshot?.targetUnitId, 'test-unit-3');
  assert.deepEqual(state.game.chargePreview.declarationSnapshot?.pathSegments, state.game.chargePreview.pathSegments);
  assert.deepEqual(state.game.chargePreview.declarationSnapshot?.contactEvent, state.game.chargePreview.contactEvents[0]);
});

test('rear-or-flank charge contact selection stores the chosen legal side for the current defender', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        contactEvents: [
          {
            ...state.game.chargePreview.contactEvents[0],
            defenderId: 'test-unit-4',
            classification: {
              type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
              flankSide: 'right',
            },
          },
        ],
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_CONTACT_SIDE,
    defenderId: 'test-unit-4',
    side: 'right',
  });

  assert.deepEqual(state.game.chargePreview.selectedContactSide, {
    defenderId: 'test-unit-4',
    side: 'right',
  });
});

test('rear-or-flank charge contact selection toggles off when the selected side is clicked again', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        selectedContactSide: {
          defenderId: 'test-unit-4',
          side: 'right',
        },
        contactEvents: [
          {
            ...state.game.chargePreview.contactEvents[0],
            defenderId: 'test-unit-4',
            classification: {
              type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
              flankSide: 'right',
            },
          },
        ],
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_CONTACT_SIDE,
    defenderId: 'test-unit-4',
    side: 'right',
  });

  assert.equal(state.game.chargePreview.selectedContactSide, null);
});

test('charge drag preview updates the start ghost without recomputing charge contact or target legality until release', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-zoc-charger' });

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'charge-drill-p2-zoc-target',
  });

  const beforePreviewCandidate = getChargeTargetCandidateByUnitId(
    state.game.chargePreview.targetCandidates,
    'charge-drill-p2-zoc-target',
  );

  state = reduceAppState(state, {
    type: ACTION_TYPES.PREVIEW_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'shift-slide',
    slideSide: 'left',
    distanceUd: 1,
  });

  const duringDragCandidate = getChargeTargetCandidateByUnitId(
    state.game.chargePreview.targetCandidates,
    'charge-drill-p2-zoc-target',
  );

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING);
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.type, 'shift-slide');
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.slideSide, 'left');
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.slideDistanceUd, 1);
  assert.equal(beforePreviewCandidate?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.equal(duringDragCandidate?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.deepEqual(state.game.chargePreview.contactEvents, []);
  assert.equal(state.game.chargePreview.pathSegments.some((segment) => segment.kind === 'charge-direction-guide'), true);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'shift-slide',
    slideSide: 'left',
    distanceUd: 1,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.READY);
  assert.equal(
    getChargeTargetCandidateByUnitId(state.game.chargePreview.targetCandidates, 'charge-drill-p2-zoc-target')?.status,
    CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE,
  );
  assert.equal(state.game.chargePreview.contactEvents[0]?.defenderId, 'charge-drill-p2-zoc-target');
  assert.equal(state.game.chargePreview.reactionRequests[0]?.type, 'may-evade');
});

test('charge slide start updates the charge-owned start pose and reevaluates target reachability without activating normal movement preview state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'shift-slide',
    slideSide: 'right',
    distanceUd: 1,
  });

  const selectedTargetCandidate = getChargeTargetCandidateByUnitId(
    state.game.chargePreview.targetCandidates,
    'test-unit-3',
  );

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING);
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.type, 'shift-slide');
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.slideSide, 'right');
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.slideDistanceUd, 1);
  assert.equal(selectedTargetCandidate?.status, 'blocked');
  assert.notEqual(state.game.chargePreview.intent?.startPose?.xUd, state.game.units.find((unit) => unit.id === 'test-unit-1')?.xUd);
  assert.equal(state.game.movement.preview.status, 'idle');
});

test('charge wheel start updates the charge-owned start pose and forward bearing without activating normal movement preview state', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'right',
    angleRadians: Math.PI / 6,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.READY);
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.type, 'wheel');
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.pivotSide, 'right');
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.wheelAngleRadians, Math.PI / 6);
  assert.notEqual(state.game.chargePreview.intent?.frozenDirectionRadians, state.game.units.find((unit) => unit.id === 'p1-c1-cav-1')?.rotationRadians);
  assert.equal(state.game.movement.preview.status, 'idle');
});

test('charge start manoeuvre keeps the preview visible but blocked when the edited start pose turns the target unreachable', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'charge-drill-p2-front-target',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'right',
    angleRadians: Math.PI / 2,
  });

  const selectedTargetCandidate = getChargeTargetCandidateByUnitId(
    state.game.chargePreview.targetCandidates,
    'charge-drill-p2-front-target',
  );

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING);
  assert.equal(state.game.chargePreview.intent?.startManoeuvre?.type, 'wheel');
  assert.equal(selectedTargetCandidate?.status, 'blocked');
  assert.match(state.game.chargePreview.diagnostics.map((entry) => entry.text).join(' '), /blockiert|kein gerader Advance-Korridor|nicht erreichbar/);
  assert.equal(state.game.chargePreview.pathSegments.some((segment) => segment.kind === 'charge-direction-guide'), true);
});

test('charge target selection keeps the current straight tunnel blocked when it crosses foreign zoc', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-zoc-charger' });

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  assert.equal(
    getChargeTargetCandidateByUnitId(state.game.chargePreview.targetCandidates, 'charge-drill-p2-zoc-target')?.status,
    CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE,
  );

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'charge-drill-p2-zoc-target',
  });
  const selectedTargetCandidate = getChargeTargetCandidateByUnitId(
    state.game.chargePreview.targetCandidates,
    'charge-drill-p2-zoc-target',
  );

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING);
  assert.equal(selectedTargetCandidate?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(selectedTargetCandidate?.reason ?? '', /ZoC/);
  assert.match(state.game.chargePreview.diagnostics.map((entry) => entry.text).join(' '), /ZoC/);
  assert.deepEqual(state.game.chargePreview.contactEvents, []);
});

test('charge start slide can make a zoc-blocked straight tunnel reaction-pending by avoiding foreign zoc', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-zoc-charger' });

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'charge-drill-p2-zoc-target',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'shift-slide',
    slideSide: 'left',
    distanceUd: 1,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.READY);
  assert.equal(
    getChargeTargetCandidateByUnitId(state.game.chargePreview.targetCandidates, 'charge-drill-p2-zoc-target')?.status,
    CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE,
  );
  assert.deepEqual(state.game.chargePreview.contactEvents[0]?.contactSnapshot?.chargerStartPose, state.game.chargePreview.intent?.startPose);
  assert.equal(state.game.chargePreview.contactEvents[0]?.contactSnapshot?.chargerOriginPose?.xUd, state.game.units.find((unit) => unit.id === 'charge-drill-p1-zoc-charger')?.xUd);
  assert.equal(state.game.chargePreview.contactEvents[0]?.classification?.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT);
  assert.equal(state.game.chargePreview.reactionRequests[0]?.type, 'may-evade');
});

test('direction confirmation records a no-evade handoff for informational reactions', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.NO_EVADE,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF);
  assert.equal(state.game.chargePreview.handoffStatus, CHARGE_HANDOFF_STATUSES.NO_EVADE);
  assert.equal(state.game.chargePreview.reactionDecision?.type, CHARGE_REACTION_DECISION_TYPES.NO_EVADE);
  assert.equal(state.game.chargePreview.reactionDecision?.requestType, CHARGE_REACTION_REQUEST_TYPES.NONE);
  assert.equal(state.game.chargePreview.reactionDecision?.handoffStatus, CHARGE_HANDOFF_STATUSES.NO_EVADE);
});

test('direction confirmation records an evade-required handoff when the defender chooses to evade', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED);
  assert.equal(state.game.chargePreview.handoffStatus, CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED);
  assert.equal(state.game.chargePreview.reactionDecision?.type, CHARGE_REACTION_DECISION_TYPES.EVADE);
  assert.equal(state.game.chargePreview.reactionDecision?.requestType, CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE);
});

test('evade-required handoff creates and resolves a deterministic branch distance roll in state', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.reason, CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.actingPlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.chargingUnitId, 'test-unit-1');
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.targetUnitId, 'test-unit-3');
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 1,
  });

  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.dieRoll, 1);
  assert.equal(
    state.game.chargePreview.branchDistanceRoll?.result?.distanceOutcome,
    CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_MINUS_ONE,
  );
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.modifierUd, -1);
  assert.equal(state.game.chargePreview.evadePlan?.reactingUnitId, 'test-unit-3');
  assert.equal(state.game.chargePreview.evadePlan?.contactType, CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT);
  assert.equal(state.game.chargePreview.evadePlan?.distanceUd, 3);
  assert.equal(state.game.chargePreview.evadePlan?.endPose?.xUd, 5);
  assert.equal(state.game.chargePreview.evadePlan?.endPose?.yUd, 10);
  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadeMove?.finalPose?.yUd, 10);
  assert.equal(state.game.units.find((unit) => unit.id === 'test-unit-3')?.yUd, 10);
});

test('charge drill front-target evade commits the repaired late-slide path before adjusted charge', () => {
  let state = startChargeDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadePlan?.choiceRequired, false);
  assert.deepEqual(state.game.chargePreview.evadePlan?.diagnostics ?? [], []);
  assert.deepEqual(
    state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target')
      ? {
          xUd: state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target').xUd,
          yUd: state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target').yUd,
          rotationRadians: state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target').rotationRadians,
        }
      : null,
    {
      xUd: state.game.chargePreview.evadeMove?.finalPose?.xUd,
      yUd: state.game.chargePreview.evadeMove?.finalPose?.yUd,
      rotationRadians: state.game.chargePreview.evadeMove?.finalPose?.rotationRadians,
    },
  );

  const adjustedChargeState = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    adjustedChargeState.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE,
  );
  assert.equal(
    adjustedChargeState.game.chargePreview.branchDistanceRoll?.history?.[0]?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
  );
});

test('charge drill evade-blocker flank lane keeps adjusted charge blocked until the evade choice handoff is resolved', () => {
  let state = startChargeDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-evade-blocker-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-flank-target' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'left',
    angleRadians: 0.6277694966173915,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED);
  assert.equal(state.game.chargePreview.evadeChoiceHandoff?.status, 'pending');

  const blockedState = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    blockedState.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
  );
  assert.equal(blockedState.game.chargePreview.branchDistanceRoll?.result?.dieRoll, 6);
});

test('charge drill wheel-charger double-blocker branch distance can be reproduced reducer-only for hotspot probing', (t) => {
  let state = startChargeDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-wheel-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-double-blocker' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'left',
    angleRadians: Math.PI / 6,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.READY);
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  const startedAtMs = Date.now();
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  const elapsedMs = Date.now() - startedAtMs;
  t.diagnostic(`wheel double-blocker reducer-only roll 6 took ${elapsedMs}ms`);

  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.dieRoll, 6);
  assert.equal(state.game.chargePreview.evadeChoiceHandoff?.status, 'pending');
  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED);
  assert.equal(state.game.chargePreview.evadeMove?.avoidanceCandidates?.length, 2);
  assert.equal(state.game.chargePreview.evadePlan?.choiceKind, 'initial-branch');
  assert.deepEqual(
    state.game.chargePreview.evadeMove?.avoidanceCandidates?.map((candidate) => candidate.id),
    ['branch-current-orientation', 'branch-direction-wheel'],
  );
  assert.equal(state.game.setupViewMode, SETUP_VIEW_MODES.HOTSEAT_HANDOFF);
});

test('charge drill wheel-charger double-blocker initial current-orientation branch commits after the explicit branch choice', () => {
  let state = startChargeDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-wheel-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-double-blocker' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'left',
    angleRadians: Math.PI / 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
    choice: { candidateId: 'branch-current-orientation' },
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadeMove?.choiceRequired, false);
  assert.equal(state.game.chargePreview.evadePlan?.choiceKind, 'none');
  assert.deepEqual(
    state.game.chargePreview.evadeMove?.avoidanceCandidates?.map((candidate) => candidate.id),
    ['slide-left-1.000'],
  );
  assert.equal(state.game.chargePreview.evadeMove?.finalPose?.xUd, 10.8);
  assert.equal(state.game.chargePreview.evadeMove?.finalPose?.yUd, 9.6);
});

test('charge drill wheel-charger double-blocker initial direction-wheel branch selects a slide-root wheel-back bypass', () => {
  let state = startChargeDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-wheel-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-double-blocker' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'left',
    angleRadians: Math.PI / 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
    choice: { candidateId: 'branch-direction-wheel' },
  });

  const selectedCandidate = state.game.chargePreview.evadeMove?.avoidanceCandidates?.[0] ?? null;
  const selectedBranchAnalysis = state.game.chargePreview.evadeMove?.decisionTrace?.find((entry) => entry.stage === 'selected-branch-analysis') ?? null;
  const selectedCandidateAnalysis = selectedBranchAnalysis?.selectedCandidateAnalysis ?? null;

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadeMove?.choiceRequired, false);
  assert.equal(state.game.chargePreview.evadePlan?.choiceKind, 'none');
  assert.equal(state.game.chargePreview.evadeMove?.avoidanceCandidates?.length, 1);
  assert.equal(selectedCandidate?.analysis?.generationSource, 'wayfinding-v2-pattern');
  assert.equal(selectedCandidate?.analysis?.wayfindingV2Used, true);
  assert.equal(selectedCandidate?.analysis?.wayfindingPatternId, 'slide-left-straight->wheel-right-0.262-straight-wheel-left-0.262');
  assert.equal(selectedCandidate?.analysis?.wayfindingReasonCodes?.includes('recursive-hard-conflict-chain'), true);
  assert.deepEqual(selectedCandidate?.avoidanceSteps?.map((step) => step.type), ['direction-wheel', 'slide', 'obstacle-wheel', 'obstacle-wheel']);
  assert.equal(selectedCandidateAnalysis?.branchRankingPolicy, 'direction-wheel-branch-retention');
  assert.equal(selectedCandidateAnalysis?.generationSource, 'wayfinding-v2-pattern');
  assert.equal(selectedCandidateAnalysis?.branchRankingReasonCodes?.includes('prefer-slide-first-corridor-bypass'), true);
  assert.equal(selectedCandidateAnalysis?.branchRankingReasonCodes?.includes('prefer-lower-manoeuvre-ud-spend'), true);
  assert.equal(selectedCandidateAnalysis?.branchRankingReasonCodes?.includes('prefer-more-reserve-after-first-later-step'), true);
  assert.equal(selectedCandidateAnalysis?.branchRankingCorridorScore?.firstLaterStepType, 'slide');
  assert.equal(selectedCandidateAnalysis?.branchRankingCorridorScore?.laterSlideCount, 1);
  assert.equal(selectedCandidateAnalysis?.branchRankingCorridorScore?.maxLateralDeviationUd <= 0.3, true);
  assert.equal(selectedCandidate?.analysis?.wayfindingReasonCodes?.includes('wheel-arc-swept-check-sampled'), true);
  assert.equal(selectedCandidateAnalysis?.laterWheelCount <= 2, true);
  assert.equal(selectedCandidateAnalysis?.laterSlideCount, 1);
  assert.equal(selectedCandidateAnalysis?.firstLaterStepType, 'slide');
});

test('evade avoidance slide choice commits the selected candidate before adjusted charge distance', () => {
  let state = startChargeDrillBattle();
  const slideChoicePlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
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
  const slideCandidate = slideChoicePlan.avoidanceCandidates.find((candidate) => candidate.type === 'slide') ?? null;

  assert.ok(slideCandidate);
  assert.equal(slideChoicePlan.choiceRequired, true);

  state = {
    ...state,
    game: {
      ...state.game,
      setupViewMode: SETUP_VIEW_MODES.HOTSEAT_HANDOFF,
      chargePreview: {
        ...state.game.chargePreview,
        status: CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED,
        branchDistanceRoll: {
          claim: { reason: CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE },
          result: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
        },
        evadePlan: {
          ...slideChoicePlan,
          choiceRequired: true,
          sourceStatus: 'needs-source-check',
        },
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          reactingUnitId: slideChoicePlan.reactingUnitId,
          finalPose: slideChoicePlan.endPose,
          avoidanceCandidates: slideChoicePlan.avoidanceCandidates,
          status: EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED,
          choiceRequired: true,
        },
        evadeChoiceHandoff: {
          ...state.game.chargePreview.evadeChoiceHandoff,
          status: 'pending',
          nextViewMode: SETUP_VIEW_MODES.PLAYER_TWO,
          returnViewMode: SETUP_VIEW_MODES.CANONICAL,
        },
      },
      units: state.game.units.map((unit) => (
        unit.id === 'charge-drill-p2-front-target'
          ? {
              ...unit,
              xUd: 10,
              yUd: 10,
              rotationRadians: 0,
              widthUd: 1,
              depthUd: 0.75,
              baseShape: 'rectangle',
            }
          : unit
      )),
    },
  };

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED);
  assert.equal(state.game.chargePreview.evadeMove?.avoidanceCandidates.length >= 1, true);
  assert.equal(state.game.chargePreview.evadeChoiceHandoff?.status, 'pending');
  assert.equal(state.game.setupViewMode, SETUP_VIEW_MODES.HOTSEAT_HANDOFF);
  assert.equal(state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target')?.xUd, 10);

  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });

  assert.equal(state.game.chargePreview.evadeChoiceHandoff?.status, 'acknowledged');
  assert.equal(state.game.setupViewMode, SETUP_VIEW_MODES.PLAYER_TWO);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
    choice: { candidateId: slideCandidate.id },
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadeMove?.choiceRequired, false);
  assert.equal(state.game.chargePreview.evadeChoiceHandoff?.status, 'idle');
  assert.equal(state.game.chargePreview.evadeMove?.avoidanceSteps[0]?.type, 'slide');
  assert.equal(state.game.chargePreview.evadeMove?.finalPose?.xUd, slideCandidate.endPose?.xUd);
  assert.equal(state.game.chargePreview.evadeMove?.finalPose?.yUd, slideCandidate.endPose?.yUd);
  assert.equal(state.game.setupViewMode, SETUP_VIEW_MODES.CANONICAL);
  assert.equal(state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target')?.xUd, slideCandidate.endPose?.xUd);
  assert.equal(state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target')?.yUd, slideCandidate.endPose?.yUd);

  const adjustedChargeState = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    adjustedChargeState.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE,
  );
});

test('table-exit evade stays source-open before adjusted charge distance in the current subset', () => {
  let state = startChargeDrillBattle();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'charge-drill-p1-front-charger') {
          return { ...unit, yUd: 5 };
        }

        if (unit.id === 'charge-drill-p2-front-target') {
          return { ...unit, yUd: 1 };
        }

        return unit;
      }),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(state.game.chargePreview.evadeMove?.tableExit, null);
  assert.equal(state.game.chargePreview.evadeMove?.diagnostics?.[0]?.code, 'charge.evade.table-edge');
  assert.equal(state.game.units.some((unit) => unit.id === 'charge-drill-p2-front-target'), true);

  const adjustedChargeState = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    adjustedChargeState.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
  );
});

test('charge drill table-exit lane stays source-open after the evade turnaround points at the north edge', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-table-exit-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-table-exit-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.SOURCE_OPEN);
  assert.equal(state.game.chargePreview.evadeMove?.autoCommit, false);
  assert.equal(state.game.chargePreview.evadeMove?.tableExit, null);
  assert.equal(state.game.chargePreview.evadeMove?.diagnostics?.[0]?.code, 'charge.evade.table-edge');
  assert.equal(state.game.units.some((unit) => unit.id === 'charge-drill-p2-table-exit-target'), true);

  const adjustedChargeState = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    adjustedChargeState.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
  );
});

test('charge drill light-troop lane applies the end-half-turn hook after the evade move commits', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-light-troop-hook-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-light-troop-hook-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
    choice: { candidateId: 'final-overlap-slide-left-0.876000' },
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadeMove?.autoCommit, true);
  assert.equal(state.game.chargePreview.evadeMove?.endHalfTurnHook?.available, true);
  assert.equal(state.game.chargePreview.evadeMove?.endHalfTurnHook?.applied, true);
  assert.equal(state.game.chargePreview.evadeMove?.endHalfTurnHook?.reason, 'light-troop-end-half-turn');
  assert.equal(state.game.chargePreview.evadeMove?.pathSegments.some((segment) => segment.kind === 'evade-end-half-turn'), true);
  assert.equal(state.game.chargePreview.evadeMove?.pathSegments.at(-1)?.kind, 'evade-end-half-turn');
  assert.equal(state.game.chargePreview.evadeMove?.cannotShootHook, true);
  assert.equal(state.game.units.some((unit) => unit.id === 'charge-drill-p2-light-troop-hook-target'), true);
  assert.equal(state.game.units.find((unit) => unit.id === 'charge-drill-p2-light-troop-hook-target')?.rotationRadians, Math.PI);

  const adjustedChargeState = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    adjustedChargeState.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE,
  );
});

test('round begin clears after-evade flags for the active player only', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-light-troop-hook-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-light-troop-hook-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
    choice: { candidateId: 'final-overlap-slide-left-0.876000' },
  });

  const evaderBeforeReset = state.game.units.find((unit) => unit.id === 'charge-drill-p2-light-troop-hook-target');
  assert.equal(evaderBeforeReset?.hasEvadedThisSequence, true);
  assert.equal(evaderBeforeReset?.cannotShootThisSequence, true);
  assert.equal(evaderBeforeReset?.evadeCountThisPhase, 1);

  state = {
    ...state,
    game: {
      ...state.game,
      round: {
        ...state.game.round,
        turnPlayerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
        roundPhase: 'corps-movement',
        dialog: {
          type: 'round-start',
          phaseLabel: null,
        },
      },
      units: state.game.units.map((unit) => (
        unit.id === 'charge-drill-p1-light-troop-hook-charger'
          ? {
              ...unit,
              moveCountThisSequence: 2,
              hasChargedThisSequence: true,
              hasEvadedThisSequence: true,
              cannotShootThisSequence: true,
              evadeCountThisPhase: 2,
            }
          : unit
      )),
    },
  };

  const resetState = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  const evaderAfterReset = resetState.game.units.find((unit) => unit.id === 'charge-drill-p2-light-troop-hook-target');
  const playerOneUnitAfterReset = resetState.game.units.find((unit) => unit.id === 'charge-drill-p1-light-troop-hook-charger');

  assert.equal(evaderAfterReset?.hasEvadedThisSequence, false);
  assert.equal(evaderAfterReset?.cannotShootThisSequence, false);
  assert.equal(evaderAfterReset?.moveCountThisSequence, 0);
  assert.equal(evaderAfterReset?.hasChargedThisSequence, false);
  assert.equal(evaderAfterReset?.evadeCountThisPhase, 0);
  assert.equal(playerOneUnitAfterReset?.moveCountThisSequence, 2);
  assert.equal(playerOneUnitAfterReset?.hasChargedThisSequence, true);
  assert.equal(playerOneUnitAfterReset?.hasEvadedThisSequence, true);
  assert.equal(playerOneUnitAfterReset?.cannotShootThisSequence, true);
  assert.equal(playerOneUnitAfterReset?.evadeCountThisPhase, 2);
});

test('former obstacle-wheel rear-contact scenario now resolves as blocked after sampled arc safety checks', () => {
  const obstacleWheelPlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
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
  assert.equal(obstacleWheelPlan.choiceRequired, false);
  assert.equal(obstacleWheelPlan.sourceStatus, 'needs-source-check');
  assert.equal(obstacleWheelPlan.endPose, null);
  assert.equal(obstacleWheelPlan.avoidanceCandidates.length, 0);
  assert.equal(obstacleWheelPlan.diagnostics.some((entry) => entry.code === 'charge.evade.blocked'), true);
});

test('evade avoidance chained direction-wheel-slide choice commits both steps before adjusted charge distance', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });

  const chainedPlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
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
  const selectedCandidate = chainedPlan.avoidanceCandidates.find((candidate) => candidate.id === 'direction-wheel-left-1.571-slide-right-1.000') ?? null;

  assert.ok(selectedCandidate);

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...chainedPlan,
          choiceRequired: true,
          sourceStatus: 'needs-source-check',
        },
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          reactingUnitId: chainedPlan.reactingUnitId,
          finalPose: chainedPlan.endPose,
          avoidanceCandidates: chainedPlan.avoidanceCandidates,
          status: EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED,
          choiceRequired: true,
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
    choice: { candidateId: 'direction-wheel-left-1.571-slide-right-1.000' },
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadeMove?.choiceRequired, false);
  assert.deepEqual(state.game.chargePreview.evadeMove?.avoidanceSteps.map((step) => step.type), ['direction-wheel', 'slide']);
  assert.equal(state.game.chargePreview.evadeMove?.avoidanceSteps[0]?.pivotSide, 'left');
  assert.equal(state.game.chargePreview.evadeMove?.avoidanceSteps[1]?.side, 'right');
  assert.deepEqual(state.game.chargePreview.evadeMove?.finalPose, selectedCandidate?.endPose);
  assert.equal(state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target')?.xUd, selectedCandidate?.endPose?.xUd);
  assert.equal(state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target')?.yUd, selectedCandidate?.endPose?.yUd);

  const adjustedChargeState = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    adjustedChargeState.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE,
  );
});

test('evade avoidance node preview advances one tree level without committing movement', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });

  const chainedPlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
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

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...chainedPlan,
          choiceRequired: true,
          sourceStatus: 'needs-source-check',
        },
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          reactingUnitId: chainedPlan.reactingUnitId,
          finalPose: chainedPlan.endPose,
          avoidanceCandidates: chainedPlan.avoidanceCandidates,
          choicePathStepIds: [],
          status: EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED,
          choiceRequired: true,
        },
        evadeChoiceHandoff: {
          ...state.game.chargePreview.evadeChoiceHandoff,
          status: 'acknowledged',
        },
      },
    },
  };

  const unitPoseBeforeNodePreview = state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target');

  state = reduceAppState(state, {
    type: ACTION_TYPES.PREVIEW_EVADE_AVOIDANCE_NODE,
    stepId: 'direction-wheel-left-1.571',
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED);
  assert.deepEqual(state.game.chargePreview.evadeMove?.choicePathStepIds, ['direction-wheel-left-1.571']);
  assert.deepEqual(
    state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target')
      ? {
          xUd: state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target').xUd,
          yUd: state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target').yUd,
          rotationRadians: state.game.units.find((unit) => unit.id === 'charge-drill-p2-front-target').rotationRadians,
        }
      : null,
    unitPoseBeforeNodePreview
      ? {
          xUd: unitPoseBeforeNodePreview.xUd,
          yUd: unitPoseBeforeNodePreview.yUd,
          rotationRadians: unitPoseBeforeNodePreview.rotationRadians,
        }
      : null,
  );

  state = reduceAppState(state, { type: ACTION_TYPES.RESET_EVADE_AVOIDANCE_PATH });

  assert.deepEqual(state.game.chargePreview.evadeMove?.choicePathStepIds, []);
});

test('adjusted charge distance roll archives evade roll history and uses charger movement with heavy infantry never-reduce', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-1'
          ? { ...unit, troopType: 'heavy-infantry' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  assert.equal(
    state.game.chargePreview.branchDistanceRoll?.history?.[0]?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
  );
  assert.equal(
    state.game.chargePreview.branchDistanceRoll?.claim?.reason,
    CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE,
  );
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 1,
  });

  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.dieRoll, 1);
  assert.equal(
    state.game.chargePreview.branchDistanceRoll?.result?.distanceOutcome,
    CHARGE_BRANCH_DISTANCE_OUTCOMES.MOVEMENT_MINUS_ONE,
  );
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.baseDistanceUd, 3);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.modifierUd, 0);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.resolvedDistanceUd, 3);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.neverReduce, true);
  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED);
  assert.equal(state.game.chargePreview.reactionRequests[0]?.adjustedChargeDistanceUd, 3);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.chargingUnitId, 'test-unit-1');
  assert.equal(state.game.chargePreview.chargeMovementPlan?.distanceUd, 3);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.startPose?.xUd, 5);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.startPose?.yUd, 17);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.endPose?.xUd, 5);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.endPose?.yUd, 14);
  assert.deepEqual(state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents ?? [], []);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.contactState?.diagnostics?.length ?? 0, 0);
  assert.equal(state.game.chargePreview.reactionRequests[0]?.caughtByCharger, false);
});

test('impetuous full-evade follow-through commits the charger when no continuation pause or contact remains', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-1') {
          return { ...unit, hasImpetuous: true };
        }

        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });

  const charger = state.game.units.find((unit) => unit.id === 'test-unit-1');

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.IDLE);
  assert.equal(charger.xUd, 5);
  assert.equal(charger.yUd, 13);
  assert.equal(charger.stayedThisMovementPhase, true);
  assert.equal(charger.advanceUsedUd, 4);
  assert.equal(hasUnitFinishedMovementPhase(charger), true);
  assert.equal(state.game.lastChargeCompletion.chargeMovementPlan.continuationChoice.required, false);
  assert.equal(state.game.lastChargeCompletion.chargeMovementPlan.continuationChoice.selectedOption, 'continue');
  assert.equal(state.game.lastChargeCompletion.chargeMovementPlan.endPose.yUd, 13);
  assert.equal(state.game.lastChargeCompletion.followThroughResolution.status, 'none');
});

test('adjusted charge distance roll marks the primary evader as caught when follow-through contact reaches the evaded end pose', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? {
            ...unit,
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          }
          : unit
      )),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          },
        },
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          finalPose: {
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 2,
  });

  assert.equal(state.game.chargePreview.reactionRequests[0]?.caughtByCharger, true);
  assert.equal(state.game.chargePreview.followThroughResolution?.status, 'caught-evader');
  assert.equal(state.game.chargePreview.followThroughResolution?.defenderId, 'test-unit-3');
  assert.equal(state.game.chargePreview.followThroughResolution?.combatPosture, 'rear-attack');
  assert.deepEqual(state.game.chargePreview.followThroughResolution?.cohesionLoss, {
    amount: 1,
    reason: 'caught-evader',
    exceptionStatus: 'light-charger-check-pending',
  });
  assert.equal(state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0]?.defenderId, 'test-unit-3');
  assert.equal(state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0]?.type, 'target-contact');
  assert.equal(
    state.game.chargePreview.chargeMovementPlan?.endPose?.yUd,
    state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0]?.contactSnapshot?.chargerContactPose?.yUd,
  );
  assert.notEqual(state.game.chargePreview.chargeMovementPlan?.endPose?.yUd, 15);
});

test('adjusted charge distance roll preserves a reducer-owned secondary target pause when follow-through hits another enemy first', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });

  assert.equal(state.game.chargePreview.reactionRequests.length, 2);
  assert.equal(state.game.chargePreview.reactionRequests[0]?.caughtByCharger, false);
  assert.equal(state.game.chargePreview.reactionRequests[1]?.unitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.reactionRequests[1]?.status, 'pending');
  assert.equal(state.game.chargePreview.reactionRequests[1]?.contactSnapshot?.defenderPose?.yUd, 15);
  assert.equal(state.game.chargePreview.followThroughResolution?.status, 'secondary-target');
  assert.equal(state.game.chargePreview.followThroughResolution?.defenderId, 'test-unit-4');
  assert.equal(state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0]?.type, 'earlier-enemy-contact');
  assert.equal(state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0]?.defenderId, 'test-unit-4');
});

test('charge drill unit 17 commits its edge-clearing slide and can expose unit 18 as the adjusted charge secondary target', () => {
  let state = startChargeDrillBattle();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'p1-corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-lane-blocker' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'charge-drill-p2-earlier-contact',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.evadeMove?.reactingUnitId, 'charge-drill-p2-earlier-contact');
  assert.deepEqual(state.game.chargePreview.evadeMove?.diagnostics, []);
  assert.deepEqual(
    state.game.chargePreview.evadeMove?.avoidanceCandidates?.map((candidate) => candidate.id),
    ['slide-left-1.000'],
  );
  assert.equal(state.game.chargePreview.evadeMove?.finalPose?.xUd, 8.3);
  assert.equal(state.game.chargePreview.evadeMove?.finalPose?.yUd, 9.6);
  assert.equal(
    state.game.units.find((unit) => unit.id === 'charge-drill-p2-earlier-contact')?.xUd,
    8.3,
  );

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  assert.equal(state.game.chargePreview.followThroughResolution?.status, 'secondary-target');
  assert.equal(state.game.chargePreview.followThroughResolution?.defenderId, 'charge-drill-p2-blocked-target');
  assert.deepEqual(
    state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.map((event) => event.defenderId),
    ['charge-drill-p2-blocked-target'],
  );
  assert.deepEqual(
    state.game.chargePreview.reactionRequests?.map((request) => [request.unitId, request.status]),
    [
      ['charge-drill-p2-earlier-contact', 'complete'],
      ['charge-drill-p2-blocked-target', 'pending'],
    ],
  );
});

test('secondary target queue keeps one pending request when duplicate earlier contacts reference the same defender', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });

  const firstSecondaryEvent = state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0];
  assert.ok(firstSecondaryEvent);

  const queuedRequests = createSecondaryTargetReactionRequests(
    state.game,
    state.game.chargePreview,
    {
      ...state.game.chargePreview.chargeMovementPlan,
      contactState: {
        ...state.game.chargePreview.chargeMovementPlan.contactState,
        contactEvents: [
          firstSecondaryEvent,
          {
            ...firstSecondaryEvent,
            type: 'earlier-enemy-contact',
          },
        ],
      },
    },
  ).filter((request) => request?.unitId === 'test-unit-4');

  assert.equal(queuedRequests.length, 1);
  assert.equal(queuedRequests[0]?.status, 'pending');
  assert.equal(queuedRequests[0]?.contactEventIndex, 0);
});

test('secondary target pause can record a later reaction decision without resuming the recursive chain', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.NO_EVADE,
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF);
  assert.equal(state.game.chargePreview.reactionRequests[1]?.status, 'complete');
  assert.equal(state.game.chargePreview.secondaryReactionDecision?.type, CHARGE_REACTION_DECISION_TYPES.NO_EVADE);
  assert.equal(state.game.chargePreview.secondaryReactionDecision?.unitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.secondaryReactionDecision?.handoffStatus, CHARGE_HANDOFF_STATUSES.NO_EVADE);
  assert.equal(state.game.chargePreview.handoffStatus, CHARGE_HANDOFF_STATUSES.NO_EVADE);
  assert.equal(state.game.chargePreview.intent?.targetUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.declarationSnapshot?.targetUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.followThroughResolution?.selectedTargetId, 'test-unit-4');
  assert.equal(state.game.chargePreview.followThroughResolution?.status, 'secondary-target');
  assert.equal(state.game.chargePreview.conformationPlan.status, CHARGE_PREVIEW_STATUSES.READY);
  assert.equal(state.game.chargePreview.conformationPlan.principalOpponentId, 'test-unit-4');
});

test('secondary target evade decision creates its own evade-distance claim and resolves a second evade plan without dropping the paused follow-through state', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  assert.equal(state.game.chargePreview.secondaryReactionDecision?.type, CHARGE_REACTION_DECISION_TYPES.EVADE);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.reason, CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE);
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.targetUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.reactingUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.followThroughResolution?.status, 'secondary-target');

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 5,
  });

  assert.equal(state.game.chargePreview.evadePlan?.reactingUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.intent?.targetUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.declarationSnapshot?.targetUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.followThroughResolution?.selectedTargetId, 'test-unit-4');
  assert.equal(state.game.chargePreview.branchDistanceRoll?.result?.claim?.targetUnitId, 'test-unit-4');
  assert.equal(state.game.chargePreview.followThroughResolution?.status, 'secondary-target');
  assert.equal(state.game.chargePreview.reactionRequests[1]?.status, 'complete');
});

test('secondary target reaction uses the next pending queued request and its own contact event snapshot', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        if (unit.id === 'p2-c2-mi-1') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 14,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });

  const firstSecondaryEvent = state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0];
  assert.ok(firstSecondaryEvent);

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        reactionRequests: [
          ...(state.game.chargePreview.reactionRequests.slice(0, 1)),
          {
            ...state.game.chargePreview.reactionRequests[1],
            status: 'complete',
          },
          {
            ...state.game.chargePreview.reactionRequests[1],
            unitId: 'p2-c2-mi-1',
            status: 'pending',
            contactEventIndex: 1,
            contactSnapshot: {
              ...firstSecondaryEvent.contactSnapshot,
              chargerContactPose: {
                ...firstSecondaryEvent.contactSnapshot.chargerContactPose,
                yUd: 14.875,
              },
              defenderPose: {
                ...firstSecondaryEvent.contactSnapshot.defenderPose,
                yUd: 14,
              },
            },
          },
        ],
        chargeMovementPlan: {
          ...state.game.chargePreview.chargeMovementPlan,
          contactState: {
            ...state.game.chargePreview.chargeMovementPlan.contactState,
            contactEvents: [
              firstSecondaryEvent,
              {
                ...firstSecondaryEvent,
                defenderId: 'p2-c2-mi-1',
                pose: {
                  ...firstSecondaryEvent.pose,
                  yUd: 14.875,
                },
                contactSnapshot: {
                  ...firstSecondaryEvent.contactSnapshot,
                  chargerContactPose: {
                    ...firstSecondaryEvent.contactSnapshot.chargerContactPose,
                    yUd: 14.875,
                  },
                  defenderPose: {
                    ...firstSecondaryEvent.contactSnapshot.defenderPose,
                    yUd: 14,
                  },
                },
              },
            ],
          },
        },
        followThroughResolution: {
          ...state.game.chargePreview.followThroughResolution,
          defenderId: 'p2-c2-mi-1',
          selectedTargetId: 'p2-c2-mi-1',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  assert.equal(state.game.chargePreview.secondaryReactionDecision?.unitId, 'p2-c2-mi-1');
  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.targetUnitId, 'p2-c2-mi-1');
  assert.equal(state.game.chargePreview.declarationSnapshot?.targetUnitId, 'p2-c2-mi-1');
  assert.equal(state.game.chargePreview.declarationSnapshot?.contactEvent?.defenderId, 'p2-c2-mi-1');
  assert.equal(state.game.chargePreview.declarationSnapshot?.contactEvent?.contactSnapshot?.defenderPose?.yUd, 14);
  assert.equal(state.game.chargePreview.reactionRequests[2]?.status, 'complete');
});

test('adjusted charge recompute does not requeue a defender that already completed a secondary reaction', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-4'
          ? {
              ...unit,
              owner: 'player-2',
              xUd: 5,
              yUd: 15,
              rotationRadians: Math.PI,
              chargeReactionProfile: 'may-evade',
            }
          : unit
      )),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  const firstSecondaryEvent = state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0];
  assert.ok(firstSecondaryEvent);

  const recomputedRequests = applyAdjustedChargeDistanceToReactionRequests(
    state.game,
    state.game.chargePreview,
    state.game.chargePreview.reactionRequests,
    createChargeBranchRollResult({
      claim: state.game.chargePreview.branchDistanceRoll.claim,
      dieRoll: 5,
      totalDistanceUd: 5,
      resolvedDistanceUd: 5,
      outcome: CHARGE_BRANCH_DISTANCE_OUTCOMES.FULL_DISTANCE,
    }),
    {
      ...state.game.chargePreview.chargeMovementPlan,
      contactState: {
        ...state.game.chargePreview.chargeMovementPlan.contactState,
        contactEvents: [
          {
            ...firstSecondaryEvent,
            defenderId: 'test-unit-4',
            type: 'earlier-enemy-contact',
          },
          {
            ...firstSecondaryEvent,
            defenderId: 'test-unit-4',
            type: 'earlier-enemy-contact',
          },
        ],
      },
    },
  ).filter((request) => request?.unitId === 'test-unit-4');

  assert.equal(recomputedRequests.length, 1);
  assert.equal(recomputedRequests[0]?.status, 'complete');
});

test('adjusted charge queues later earlier-enemy contacts behind the first secondary evade target', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        if (unit.id === 'p2-c2-mi-1') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 14,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          finalPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });

  assert.deepEqual(
    state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.map((event) => event.defenderId),
    ['test-unit-4', 'p2-c2-mi-1'],
  );
  assert.deepEqual(
    state.game.chargePreview.reactionRequests.map((request) => request.unitId),
    ['test-unit-3', 'test-unit-4', 'p2-c2-mi-1'],
  );
  assert.equal(state.game.chargePreview.reactionRequests[1]?.status, 'pending');
  assert.equal(state.game.chargePreview.reactionRequests[2]?.status, 'pending');
});

test('secondary evade reuses the original adjusted charge roll instead of asking for a second adjusted roll', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        if (unit.id === 'p2-c2-mi-1') {
          return {
            ...unit,
            owner: 'player-2',
            xUd: 5,
            yUd: 14,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });

  const firstSecondaryEvent = state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0];
  assert.ok(firstSecondaryEvent);

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        reactionRequests: [
          ...(state.game.chargePreview.reactionRequests.slice(0, 1)),
          {
            ...state.game.chargePreview.reactionRequests[1],
            status: 'complete',
          },
          {
            ...state.game.chargePreview.reactionRequests[1],
            unitId: 'p2-c2-mi-1',
            status: 'pending',
            contactEventIndex: 1,
            contactSnapshot: {
              ...firstSecondaryEvent.contactSnapshot,
              chargerContactPose: {
                ...firstSecondaryEvent.contactSnapshot.chargerContactPose,
                yUd: 14.875,
              },
              defenderPose: {
                ...firstSecondaryEvent.contactSnapshot.defenderPose,
                yUd: 14,
              },
            },
          },
        ],
        chargeMovementPlan: {
          ...state.game.chargePreview.chargeMovementPlan,
          contactState: {
            ...state.game.chargePreview.chargeMovementPlan.contactState,
            contactEvents: [
              firstSecondaryEvent,
              {
                ...firstSecondaryEvent,
                defenderId: 'p2-c2-mi-1',
                pose: {
                  ...firstSecondaryEvent.pose,
                  yUd: 14.875,
                },
                contactSnapshot: {
                  ...firstSecondaryEvent.contactSnapshot,
                  chargerContactPose: {
                    ...firstSecondaryEvent.contactSnapshot.chargerContactPose,
                    yUd: 14.875,
                  },
                  defenderPose: {
                    ...firstSecondaryEvent.contactSnapshot.defenderPose,
                    yUd: 14,
                  },
                },
              },
            ],
          },
        },
        followThroughResolution: {
          ...state.game.chargePreview.followThroughResolution,
          defenderId: 'p2-c2-mi-1',
          selectedTargetId: 'p2-c2-mi-1',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  assert.deepEqual(
    state.game.chargePreview.branchDistanceRoll?.history?.map((entry) => entry.result?.claim?.reason ?? entry.claim?.reason ?? null),
    [CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE, CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE],
  );

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 5,
  });

  assert.equal(state.game.chargePreview.branchDistanceRoll?.claim?.reason, CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE);
  assert.equal(state.game.chargePreview.evadePlan?.reactingUnitId, 'p2-c2-mi-1');
  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.distanceUd, 4);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.contactState?.contactEvents?.[0]?.defenderId, 'test-unit-4');
  assert.equal(state.game.chargePreview.followThroughResolution?.status, 'secondary-target');
  assert.equal(state.game.chargePreview.followThroughResolution?.defenderId, 'test-unit-4');
});

test('non-impetuous adjusted charge follow-through exposes a stop or continue choice and can stop at the minimum distance', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-3',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'none',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 4,
  });

  assert.equal(state.game.chargePreview.chargeMovementPlan?.distanceUd, 4);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.continuationChoice?.required, true);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.continuationChoice?.selectedOption, null);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.continuationChoice?.minimumDistanceUd, 2);
  assert.equal(state.game.chargePreview.chargeMovementPlan?.continuationChoice?.maximumDistanceUd, 4);

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE,
    option: 'stop',
  });

  const charger = state.game.units.find((unit) => unit.id === 'test-unit-1');

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.IDLE);
  assert.equal(charger.xUd, 5);
  assert.equal(charger.yUd, 15);
  assert.equal(charger.stayedThisMovementPhase, true);
  assert.equal(charger.advanceUsedUd, 2);
  assert.equal(hasUnitFinishedMovementPhase(charger), true);
  assert.equal(state.game.lastChargeCompletion.chargeMovementPlan.continuationChoice.selectedOption, 'stop');
  assert.equal(state.game.lastChargeCompletion.chargeMovementPlan.distanceUd, 2);
  assert.equal(state.game.lastChargeCompletion.chargeMovementPlan.endPose.xUd, 5);
  assert.equal(state.game.lastChargeCompletion.chargeMovementPlan.endPose.yUd, 15);
});

test('charge targeting defers pure zoc drill path work and opens manoeuvre selection with the current tunnel blocked', () => {
  let state = startChargeDrillBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-pure-zoc-charger' });

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });

  const deferredPureZocTargetCandidate = getChargeTargetCandidateByUnitId(
    state.game.chargePreview.targetCandidates,
    'charge-drill-p2-pure-zoc-target',
  );

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.TARGETING);
  assert.equal(deferredPureZocTargetCandidate?.status, CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE);
  assert.match(deferredPureZocTargetCandidate?.reason ?? '', /Grundreichweite|nach Zielauswahl/);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'charge-drill-p2-pure-zoc-target',
  });

  const pureZocTargetCandidate = getChargeTargetCandidateByUnitId(
    state.game.chargePreview.targetCandidates,
    'charge-drill-p2-pure-zoc-target',
  );

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING);
  assert.equal(pureZocTargetCandidate?.status, CHARGE_TARGET_CANDIDATE_STATUSES.BLOCKED);
  assert.match(pureZocTargetCandidate?.reason ?? '', /ZoC/);
  assert.match(pureZocTargetCandidate?.reason ?? '', /charge-drill-p2-pure-zoc-sentry/);

  const unchangedState = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  assert.equal(unchangedState.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING);
});

test('blocked charge targets leave the preview in targeting state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.TARGETING);
  assert.equal(state.game.chargePreview.intent?.targetUnitId, null);
});

test('out-of-range enemy charge targets leave the preview in targeting state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'test-unit-4',
  });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.TARGETING);
  assert.equal(state.game.chargePreview.intent?.targetUnitId, null);
});

test('pending charge preview blocks switching to another unit until canceled', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  assert.equal(state.game.selectedUnitId, 'test-unit-1');
  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.TARGETING);

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.IDLE);
});

test('canceling charge preview after a committed evade restores the evader pose and flags', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  const originalTarget = state.game.units.find((unit) => unit.id === 'test-unit-3');

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  const committedTarget = state.game.units.find((unit) => unit.id === 'test-unit-3');
  assert.notDeepEqual(committedTarget, originalTarget);
  assert.equal(committedTarget?.hasEvadedThisSequence, true);
  assert.equal(state.game.chargePreview.unitRollbackSnapshot.length > 0, true);

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_CHARGE_PREVIEW });

  const restoredTarget = state.game.units.find((unit) => unit.id === 'test-unit-3');
  assert.deepEqual(restoredTarget, originalTarget);
  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.IDLE);
});

test('units that already finished movement this phase cannot start charge preview', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });

  assert.equal(state.game.chargePreview.status, CHARGE_PREVIEW_STATUSES.IDLE);
});

test('movement draft and preview store declarative serializable command data after setup', () => {
  let state = selectTestUnit(completeSetupToBattle());

  // P5-06: movement commands require active phase = movement.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.MOVEMENT });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_MOVEMENT_COMMAND,
    commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_DRAFT,
    draft: {
      commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      unitId: 'test-unit-1',
      segments: [
        {
          commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
          unitId: 'test-unit-1',
          startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
          endPose: { xUd: 10, yUd: 8, rotationRadians: 0 },
          distance: { requestedUd: 2, resolvedUd: 2, measurementMode: 'front-edge' },
        },
      ],
      sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
    },
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_PREVIEW,
    preview: {
      status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
      segments: state.game.movement.draft.segments,
      explanations: ['Preview only. No legality checks yet.'],
      sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
    },
  });

  assert.equal(state.game.movement.selectedCommandId, MOVEMENT_COMMAND_IDS.ADVANCE);
  assert.equal(state.game.movement.draft.unitId, 'test-unit-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments[0].endPose.yUd, 8);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
});

test('movement draft state resets during setup and when clearing or changing selection', () => {
  let state = selectTestUnit(startNewGame());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_MOVEMENT_COMMAND,
    commandId: MOVEMENT_COMMAND_IDS.WHEEL,
  });
  assert.equal(state.game.movement.selectedCommandId, null);

  state = selectTestUnit(completeSetupToBattle());
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_DRAFT,
    draft: {
      commandId: MOVEMENT_COMMAND_IDS.SLIDE,
      unitId: 'test-unit-1',
      segments: [],
    },
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CLEAR_MOVEMENT_DRAFT });

  assert.equal(state.game.movement.selectedCommandId, null);
  assert.equal(state.game.movement.draft, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MOVEMENT_DRAFT,
    draft: {
      commandId: MOVEMENT_COMMAND_IDS.SLIDE,
      unitId: 'test-unit-1',
      segments: [],
    },
  });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });

  assert.equal(state.game.movement.selectedCommandId, null);
  assert.equal(state.game.movement.draft, null);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.IDLE);
});

test('cancel movement preview clears command ui state without resetting the unit', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_MOVEMENT_PREVIEW });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.slideModeActive, false);
  assert.equal(state.game.wheelModeActive, false);
  assert.equal(state.game.commandMenu.activeBranch, null);
  assert.equal(state.game.movement.selectedCommandId, null);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.IDLE);
});

test('command menu branch tracks movement and charge entry deterministically', () => {
  let state = selectTestUnit(advanceToBattlefield());

  assert.equal(state.game.commandMenu.activeBranch, null);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  assert.equal(state.game.commandMenu.activeBranch, 'move');

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_MOVEMENT_PREVIEW });
  assert.equal(state.game.commandMenu.activeBranch, null);

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  assert.equal(state.game.commandMenu.activeBranch, 'charge');

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_CHARGE_PREVIEW });
  assert.equal(state.game.commandMenu.activeBranch, null);
});

test('command menu branch tracks reducer-owned shooting declaration previews', () => {
  let state = startChargeDrillBattle();

  state = {
    ...state,
    game: beginShootingPhaseState({
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        currentPhaseId: BATTLE_PHASE_IDS.SHOOTING,
        activePlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
      },
      phaseTracker: {
        ...state.game.phaseTracker,
        currentBattlePhaseId: BATTLE_PHASE_IDS.SHOOTING,
      },
    }),
  };
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'charge-drill-p1-cavalry-bow-charger',
  });

  assert.equal(state.game.commandMenu.activeBranch, null);
  assert.equal(state.game.shooting.preview.status !== 'idle', true);
  assert.equal(resolveEffectiveCommandMenuBranch(state.game, state.game.units.find((unit) => unit.id === state.game.selectedUnitId)), 'shoot');

  state = reduceAppState(state, {
    type: ACTION_TYPES.CANCEL_SHOOTING_DECLARATION_PREVIEW,
  });
  assert.equal(state.game.commandMenu.activeBranch, null);
});

test('shooting procedure selection can switch to another unresolved shooter and deselect cleanly', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-drill-p1-light-foot-shooter',
  });

  assert.equal(state.game.selectedUnitId, 'shooting-drill-p1-light-foot-shooter');
  assert.equal(state.game.shooting.preview.shooterUnitId, 'shooting-drill-p1-light-foot-shooter');
  assert.equal(state.game.shooting.procedure.selectableUnitIds.includes('shooting-drill-p1-light-foot-support'), true);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-drill-p1-light-foot-support',
  });

  assert.equal(state.game.selectedUnitId, 'shooting-drill-p1-light-foot-support');
  assert.equal(state.game.shooting.preview.shooterUnitId, 'shooting-drill-p1-light-foot-support');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });

  assert.equal(state.game.selectedUnitId, null);
  assert.equal(state.game.shooting.preview.status, 'idle');
  assert.equal(state.game.shooting.preview.shooterUnitId, null);
});

test('shooting preview clears on phase switch so movement root actions return', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-drill-p1-light-foot-shooter',
  });

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
  assert.equal(resolveEffectiveCommandMenuBranch(state.game, selectedUnit), 'shoot');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });

  const movementSelectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId);
  assert.equal(state.game.shooting.preview.status, 'idle');
  assert.equal(resolveEffectiveCommandMenuBranch(state.game, movementSelectedUnit), null);
});

test('shooting completion hands off from player one into player two shooting before melee', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'shooting-drill-p1-mounted-bow-anchor' || unit.id === 'shooting-drill-p2-mounted-bow-shooter'
          ? { ...unit, cannotShootThisSequence: true }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_SHOOTING_PHASE_PROCEDURE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-drill-p1-light-foot-shooter',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_DECLARATION_TARGET,
    targetUnitId: 'shooting-drill-p2-front-target',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_DECLARATION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_PROTECTION,
    resolvedTargetProtectionValue: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_SHOOTER_DIE,
    dieRoll: 5,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_TARGET_DIE,
    dieRoll: 3,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_RESOLUTION });

  assert.equal(state.game.round.dialog.type, 'shooting-sequence-handoff');
  assert.equal(state.game.shooting.handoff.status, 'pending');
  assert.equal(state.game.shooting.handoff.kind, 'next-player');
  assert.equal(state.game.shooting.handoff.nextPlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_SEQUENCE_HANDOFF });

  assert.equal(state.game.shooting.actingPlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.equal(state.game.round.roundPhase, 'shooting');
  assert.equal(state.game.round.dialog.type, 'phase-announce');

  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_SHOOTING_PHASE_PROCEDURE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-drill-p2-light-foot-shooter',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_DECLARATION_TARGET,
    targetUnitId: 'shooting-drill-p1-front-target',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_DECLARATION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_PROTECTION,
    resolvedTargetProtectionValue: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_SHOOTER_DIE,
    dieRoll: 5,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_TARGET_DIE,
    dieRoll: 3,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_RESOLUTION });

  assert.equal(state.game.round.dialog.type, 'shooting-sequence-handoff');
  assert.equal(state.game.shooting.handoff.kind, 'melee');

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_SEQUENCE_HANDOFF });

  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.MELEE);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.MELEE);
  assert.equal(state.game.round.roundPhase, 'combat');
  assert.equal(state.game.round.dialog, null);
});

test('shooting completion hands off from the current round active player into the passive player sequence', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });

  state = {
    ...state,
    game: beginShootingPhaseState({
      ...state.game,
      round: {
        ...state.game.round,
        turnPlayerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
        roundPhase: 'shooting',
        dialog: { type: null, phaseLabel: null },
      },
      commandContext: {
        ...state.game.commandContext,
        activePlayerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
        currentPhaseId: BATTLE_PHASE_IDS.SHOOTING,
      },
      units: state.game.units.map((unit) => (
        unit.id === 'shooting-drill-p2-light-foot-support' || unit.id === 'shooting-drill-p2-mounted-bow-shooter'
          ? { ...unit, cannotShootThisSequence: true }
          : unit
      )),
    }, {
      phaseId: BATTLE_PHASE_IDS.SHOOTING,
      actingPlayerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
    }),
  };
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_SHOOTING_PHASE_PROCEDURE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-drill-p2-light-foot-shooter',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_DECLARATION_TARGET,
    targetUnitId: 'shooting-drill-p1-front-target',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_DECLARATION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_PROTECTION,
    resolvedTargetProtectionValue: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_SHOOTER_DIE,
    dieRoll: 5,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_TARGET_DIE,
    dieRoll: 3,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_RESOLUTION });

  assert.equal(state.game.round.dialog.type, 'shooting-sequence-handoff');
  assert.equal(state.game.shooting.handoff.kind, 'next-player');
  assert.equal(state.game.shooting.handoff.nextPlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
});

test('confirming a pending shooting handoff starts the next player sequence under the shooting phase announce', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });

  state = {
    ...state,
    game: {
      ...state.game,
      shooting: {
        ...state.game.shooting,
        handoff: {
          status: 'pending',
          kind: 'next-player',
          nextPlayerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
        },
      },
      round: {
        ...state.game.round,
        dialog: {
          type: 'shooting-sequence-handoff',
          phaseLabel: null,
        },
      },
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_SEQUENCE_HANDOFF });

  assert.equal(state.game.shooting.actingPlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.equal(state.game.round.roundPhase, 'shooting');
  assert.equal(state.game.round.dialog.type, 'phase-announce');
  assert.equal(state.game.shooting.handoff.status, 'idle');
});

test('page 58 shooting LOS example lets either bowman be the main shooter on B with the other supporting', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_SHOOTING_LOS_EXAMPLE_BATTLE });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-los-example-a1',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DECLARATION_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_DECLARATION });

  assert.equal(state.game.shooting.declaredShots[0]?.mainShooterUnitId, 'shooting-los-example-a1');
  assert.equal(state.game.shooting.declaredShots[0]?.targetUnitId, 'shooting-los-example-b');
  assert.deepEqual(state.game.shooting.declaredShots[0]?.supportingUnitIds, ['shooting-los-example-a2']);

  state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_SHOOTING_LOS_EXAMPLE_BATTLE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'shooting-los-example-a2',
  });
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DECLARATION_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_DECLARATION });

  assert.equal(state.game.shooting.declaredShots[0]?.mainShooterUnitId, 'shooting-los-example-a2');
  assert.equal(state.game.shooting.declaredShots[0]?.targetUnitId, 'shooting-los-example-b');
  assert.deepEqual(state.game.shooting.declaredShots[0]?.supportingUnitIds, ['shooting-los-example-a1']);
});

test('pending movement preview blocks deselection and switching to another unit until cancel', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-2' });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_MOVEMENT_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });
  assert.equal(state.game.selectedUnitId, null);
});

test('changing active corps does not bypass pending movement order atomicity', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'p1-c1-cav-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });

  assert.equal(state.game.commandContext.activeCorpsId, 'corps-1');
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.orderCommandSnapshot.unitId, 'p1-c1-cav-1');
});

test('pending commander free move preview also blocks deselection and switching until canceled', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: null });
  assert.equal(state.game.selectedUnitId, 'test-unit-1');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  assert.equal(state.game.selectedUnitId, 'test-unit-1');

  state = reduceAppState(state, { type: ACTION_TYPES.CANCEL_COMMANDER_FREE_MOVE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-1');
});

test('movement validation snapshot reports missing active corps as placeholder during preview', () => {
  let state = reduceAppState(advanceToBattlefield(), { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const commandContextDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-context');
  assert.ok(commandContextDiagnostic);
  assert.equal(commandContextDiagnostic.status, 'placeholder');

  const commandLegalityDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-legality');
  assert.ok(commandLegalityDiagnostic);
  assert.equal(commandLegalityDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('confirm advance is blocked when no active corps is selected even if preview exists', () => {
  let state = reduceAppState(advanceToBattlefield(), { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
});

test('movement validation blocks confirmation when the selected unit falls outside the active corps', () => {
  let state = advanceToBattlefield();
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'p1-c2-mi-1');
  assert.ok(initialUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      selectedUnitId: 'p1-c2-mi-1',
      commandContext: {
        ...state.game.commandContext,
        activeCorpsId: 'corps-1',
        currentPhaseId: BATTLE_PHASE_IDS.MOVEMENT,
        activePlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'wrong-corps',
          unitId: 'p1-c2-mi-1',
          corpsId: 'corps-2',
          label: 'Selected unit is outside the active corps.',
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const commandLegalityDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-legality');
  assert.ok(commandLegalityDiagnostic);
  assert.equal(commandLegalityDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_ADVANCE,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'p1-c2-mi-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
});

test('movement confirmation is blocked for source-sensitive difficult manoeuvre cases in the current P6 subset', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              isCataphract: true,
            }
          : unit
      )),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const difficultDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'difficult-manoeuvre');
  assert.ok(difficultDiagnostic);
  assert.equal(difficultDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('movement confirmation is blocked when the active commander is marked as engaged in combat', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        commander: {
          ...state.game.commandContext.commander,
          engagedInCombat: true,
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const engagedDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'commander-engaged');
  assert.ok(engagedDiagnostic);
  assert.equal(engagedDiagnostic.status, 'blocked');

  const commandPointDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'command-point-cost');
  assert.ok(commandPointDiagnostic);
  assert.equal(commandPointDiagnostic.status, 'blocked');

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('wheel preview stores left-side wheel state without mutating the unit first', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.LEFT,
    angleRadians: Math.PI / 4,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.rotationRadians, 0);
  assert.equal(state.game.wheelModeActive, true);
  assert.equal(state.game.wheelPivotSide, MOVEMENT_PIVOT_SIDES.LEFT);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments[0].maneuver.pivotSide, MOVEMENT_PIVOT_SIDES.LEFT);
});

test('confirm wheel updates unit pose through reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_WHEEL });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.xUd.toFixed(3)), Number(initialUnit.xUd.toFixed(3)));
  assert.equal(Number(unit.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(Number(unit.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));
  assert.equal(unit.advanceUsedUd, 1.5);
  assert.equal(state.game.wheelModeActive, false);
});

test('wheel preview is blocked during setup and resets advance mode when selected', () => {
  let state = selectTestUnit(startNewGame());

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });

  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.wheelModeActive, false);
  assert.equal(state.game.movement.selectedCommandId, null);
});

test('wheel preview rejects battlefield overflow and blocks confirmation', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              xUd: 0.7,
              yUd: 0.7,
              widthUd: 2,
              depthUd: 1,
            }
          : unit,
      ),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.LEFT,
    angleRadians: Math.PI / 2,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.REJECTED);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
});

test('wheel preview stores the chosen fixed pivot side and linear P4 distance fact', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 4,
  });

  assert.equal(state.game.wheelPivotSide, MOVEMENT_PIVOT_SIDES.RIGHT);
  assert.equal(Number(state.game.movement.preview.segments[0].distance.resolvedUd.toFixed(3)), 0.75);
});

test('setup visibility mode can switch to hotseat handoff', () => {
  let state = startNewGame();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SETUP_VIEW_MODE,
    viewMode: 'hotseat-handoff',
  });

  assert.equal(state.game.setupViewMode, 'hotseat-handoff');
});

test('command context can change active player, corps, and battle phase after setup', () => {
  let state = completeSetupToBattle();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_PLAYER,
    playerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });

  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_TWO);
  assert.equal(state.game.commandContext.activeCorpsId, 'corps-2');
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.MOVEMENT);
  assert.equal(state.game.phaseTracker.currentBattlePhaseId, BATTLE_PHASE_IDS.MOVEMENT);
});

test('command context ignores player, corps, and phase changes during setup', () => {
  let state = startNewGame();

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_PLAYER,
    playerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-2',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
    phaseId: BATTLE_PHASE_IDS.MOVEMENT,
  });

  assert.equal(state.game.commandContext.activePlayerId, COMMAND_PLAYER_IDS.PLAYER_ONE);
  assert.equal(state.game.commandContext.activeCorpsId, null);
  assert.equal(state.game.commandContext.currentPhaseId, BATTLE_PHASE_IDS.COMMAND);
});

test('setup step navigation advances, rewinds, and locks serializable state', () => {
  let state = startNewGame();

  state = reduceAppState(state, { type: ACTION_TYPES.LOCK_CURRENT_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.GO_TO_PREVIOUS_SETUP_STEP });

  assert.deepEqual(state.game.setup.lockedStepIds, [SETUP_STEP_IDS.FORMAT]);
  assert.equal(state.game.setup.currentStepId, SETUP_STEP_IDS.REGION);
});

test('terrain placeholders can be added, selected, updated, locked, and removed during terrain setup', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-1',
      terrainType: 'hill',
      label: 'Hill',
      pose: { xUd: 8, yUd: 8 },
      footprint: { widthUd: 4, depthUd: 2, rotationRadians: 0 },
    },
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
    patch: {
      pose: { xUd: 10, yUd: 9 },
    },
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.LOCK_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
  });

  let placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === 'terrain-1');
  assert.ok(placeholder);
  assert.equal(state.game.setup.terrain.selectedPlaceholderId, 'terrain-1');
  assert.equal(placeholder.pose.xUd, 10);
  assert.equal(placeholder.pose.yUd, 9);
  assert.equal(placeholder.lockState, 'locked');

  state = reduceAppState(state, {
    type: ACTION_TYPES.REMOVE_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
  });

  placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === 'terrain-1');
  assert.equal(placeholder, undefined);
  assert.equal(state.game.setup.terrain.selectedPlaceholderId, null);
});

test('terrain placeholders reject full-footprint placements outside the battlefield', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-outside',
      pose: { xUd: 29, yUd: 19 },
      footprint: { widthUd: 4, depthUd: 4, rotationRadians: 0 },
    },
  });

  assert.equal(state.game.setup.terrain.placeholders.length, 0);
  assert.equal(state.game.setup.terrain.validation.activeSource, 'attempted-placeholder');
  assert.ok(
    state.game.setup.terrain.validation.activeResults.some(
      (result) => result.id === 'battlefield-bounds' && result.ok === false,
    ),
  );
});

test('standard-200 setup starts with two mandatory camp placeholders', () => {
  const state = startNewGame();
  const camps = state.game.setup.setupObjects.placeholders;
  const playerOneCamp = camps.find((setupObject) => setupObject.id === 'camp-player-1');
  const playerTwoCamp = camps.find((setupObject) => setupObject.id === 'camp-player-2');

  assert.equal(camps.length, 2);
  assert.deepEqual(
    camps.map((setupObject) => setupObject.id),
    ['camp-player-1', 'camp-player-2'],
  );
  assert.ok(playerOneCamp);
  assert.ok(playerTwoCamp);
  assert.equal(playerOneCamp.pose.yUd, 18.2);
  assert.equal(playerTwoCamp.pose.yUd, 1.8);
});

test('setup objects can be selected, moved in camps step, and stay inside the battlefield', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.CAMPS) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_SETUP_OBJECT,
    setupObjectId: 'camp-player-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_SETUP_OBJECT,
    setupObjectId: 'camp-player-1',
    patch: {
      pose: { xUd: 7, yUd: 17 },
    },
  });

  const camp = state.game.setup.setupObjects.placeholders.find((setupObject) => setupObject.id === 'camp-player-1');
  assert.ok(camp);
  assert.equal(state.game.setup.setupObjects.selectedObjectId, 'camp-player-1');
  assert.equal(camp.pose.xUd, 7);
  assert.equal(camp.pose.yUd, 17);

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_SETUP_OBJECT,
    setupObjectId: 'camp-player-1',
    patch: {
      pose: { xUd: 29.8, yUd: 19.8 },
    },
  });

  const stillValidCamp = state.game.setup.setupObjects.placeholders.find((setupObject) => setupObject.id === 'camp-player-1');
  assert.ok(stillValidCamp);
  assert.equal(stillValidCamp.pose.xUd, 7);
  assert.equal(stillValidCamp.pose.yUd, 17);
});

test('camp step can add related public setup-object placeholders', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.CAMPS) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_SETUP_OBJECT,
    setupObject: {
      id: 'fortification-1',
      family: 'fortification',
      type: 'fortification',
      label: 'Fortification',
      pose: { xUd: 10, yUd: 16 },
      footprint: { widthUd: 3, depthUd: 0.8, rotationRadians: 0 },
    },
  });

  assert.ok(state.game.setup.setupObjects.placeholders.some((setupObject) => setupObject.id === 'fortification-1'));
  assert.equal(state.game.setup.setupObjects.selectedObjectId, 'fortification-1');
});

test('battle plan stores owner-private corps assignments by field', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.BATTLE_PLAN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_BATTLE_PLAN_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
    corpsId: 'corps-1',
    fieldId: 'left',
  });

  assert.equal(state.game.setup.battlePlan.visibilityScope, 'owner-only');
  assert.equal(state.game.setup.battlePlan.selectedCorpsId, 'corps-1');
  assert.deepEqual(state.game.setup.battlePlan.fieldAssignments.left, ['corps-1']);
});

test('battle plan reassigns corps from one field to another', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.BATTLE_PLAN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
    corpsId: 'corps-2',
    fieldId: 'center',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
    corpsId: 'corps-2',
    fieldId: 'flank-march',
  });

  assert.deepEqual(state.game.setup.battlePlan.fieldAssignments.center, []);
  assert.deepEqual(state.game.setup.battlePlan.fieldAssignments['flank-march'], ['corps-2']);
});

test('ambush markers keep public shell state separate from private contents', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.AMBUSHES) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  assert.equal(state.game.setup.ambushMarkers.markers.length, 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_AMBUSH_MARKER,
    markerId: 'ambush-marker-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_AMBUSH_MARKER_CONTENTS,
    markerId: 'ambush-marker-1',
    privateContents: {
      notes: 'LH behind wood',
    },
  });

  const marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === 'ambush-marker-1');
  assert.ok(marker);
  assert.equal(state.game.setup.ambushMarkers.visibilityScope, 'owner-only');
  assert.equal(state.game.setup.ambushMarkers.selectedMarkerId, 'ambush-marker-1');
  assert.equal(marker.publicShell.label, 'Marker I');
  assert.equal(marker.privateContents.notes, 'LH behind wood');
});

test('ambush marker shell can move inside battlefield but rejects out-of-bounds updates', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.AMBUSHES) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_AMBUSH_MARKER,
    markerId: 'ambush-marker-2',
    patch: {
      pose: { xUd: 11, yUd: 12 },
    },
  });

  let marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === 'ambush-marker-2');
  assert.ok(marker);
  assert.equal(marker.pose.xUd, 11);
  assert.equal(marker.pose.yUd, 12);

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_AMBUSH_MARKER,
    markerId: 'ambush-marker-2',
    patch: {
      pose: { xUd: 29.8, yUd: 19.8 },
    },
  });

  marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === 'ambush-marker-2');
  assert.ok(marker);
  assert.equal(marker.pose.xUd, 11);
  assert.equal(marker.pose.yUd, 12);
});

test('adding an ambush marker auto-selects it for immediate notes editing', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.AMBUSHES) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_AMBUSH_MARKER,
  });

  assert.equal(state.game.setup.ambushMarkers.markers.length, 1);
  assert.equal(state.game.setup.ambushMarkers.selectedMarkerId, 'ambush-marker-1');
});

test('terrain validation tracks source-check warnings for selected road placeholders', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-road',
      terrainType: 'road',
      label: 'Road',
      pose: { xUd: 9, yUd: 8 },
      footprint: { widthUd: 5, depthUd: 1, rotationRadians: 0 },
    },
  });

  assert.ok(
    state.game.setup.terrain.validation.activeResults.some(
      (result) => result.id === 'road-river-source-check' && result.sourceStatus === 'needs-source-check',
    ),
  );
  assert.equal(state.game.setup.terrain.validation.activeSummary.errorCount, 0);
});

test('terrain update keeps last valid placeholder state when an invalid move is attempted', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.TERRAIN) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
    placeholder: {
      id: 'terrain-1',
      pose: { xUd: 8, yUd: 8 },
      footprint: { widthUd: 4, depthUd: 2, rotationRadians: 0 },
    },
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.UPDATE_TERRAIN_PLACEHOLDER,
    placeholderId: 'terrain-1',
    patch: {
      pose: { xUd: 29, yUd: 19 },
    },
  });

  const placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === 'terrain-1');
  assert.ok(placeholder);
  assert.equal(placeholder.pose.xUd, 8);
  assert.equal(placeholder.pose.yUd, 8);
  assert.equal(state.game.setup.terrain.validation.activeSource, 'attempted-placeholder');
  assert.ok(
    state.game.setup.terrain.validation.activeResults.some(
      (result) => result.id === 'battlefield-bounds' && result.ok === false,
    ),
  );
});

test('unit placement is blocked before the deployment setup step', () => {
  let state = selectTestUnit(startNewGame());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 14,
    yUd: 12,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.xUd, initialUnit.xUd);
  assert.equal(unit.yUd, initialUnit.yUd);
});

test('unit placement is allowed during deployment setup step', () => {
  let state = selectTestUnit(startNewGame());

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.DEPLOYMENT) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 14,
    yUd: 12,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.xUd, 14);
  assert.equal(unit.yUd, 12);
  assert.equal(state.game.setup.deployment.visiblePlaceholders[0].pose.xUd, 14);
  assert.equal(state.game.setup.deployment.visiblePlaceholders[0].pose.yUd, 12);
});

test('non-included general drag creates a ghost preview and only moves on confirm', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  const targetXUd = Number((initialGeneral.xUd + 3).toFixed(3));
  const targetYUd = Number((initialGeneral.yUd - 4).toFixed(3));
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: targetXUd,
    yUd: targetYUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
  });

  const previewGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(previewGeneral);
  assert.equal(previewGeneral.xUd, initialGeneral.xUd);
  assert.equal(previewGeneral.yUd, initialGeneral.yUd);
  assert.equal(previewGeneral.advanceUsedUd, 0);
  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.unitId, 'test-unit-1');
  assert.equal(state.game.commanderFreeMovePreview.xUd, targetXUd);
  assert.equal(state.game.commanderFreeMovePreview.yUd, targetYUd);
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 5);

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  const movedGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(movedGeneral);
  assert.equal(movedGeneral.xUd, targetXUd);
  assert.equal(movedGeneral.yUd, targetYUd);
  assert.equal(movedGeneral.advanceUsedUd, 5);
  assert.equal(state.game.commanderFreeMovePreview.status, 'idle');
  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).amount, -1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'test-unit-1');
});

test('free commander split drag spends the free CP only once when the move starts', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);

  const afterFirstConfirm = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(afterFirstConfirm);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((afterFirstConfirm.xUd + 3).toFixed(3)),
    yUd: afterFirstConfirm.yUd,
    dragOriginXUd: afterFirstConfirm.xUd,
    dragOriginYUd: afterFirstConfirm.yUd,
    maxDistanceUd: 3,
    dragSpentUdAtStart: 2,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);
});

test('commander attach targeting uses the current unconfirmed ghost position and remaining budget', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'move');
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'test-unit-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'targeting');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');
  assert.equal(state.game.commanderFreeMovePreview.xUd, Number((initialGeneral.xUd + 2).toFixed(3)));
  assert.equal(state.game.commanderFreeMovePreview.nextSpentUd, 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.ATTACH_COMMANDER,
    unitId: 'p1-c1-cav-1',
  });

  assert.equal(state.game.commanderFreeMovePreview.status, 'ready');
  assert.equal(state.game.commanderFreeMovePreview.mode, 'attach');
  assert.equal(state.game.commanderFreeMovePreview.targetUnitId, 'p1-c1-cav-1');
  assert.ok(Number(state.game.commanderFreeMovePreview.nextSpentUd) > 2);
  assert.ok(Number(state.game.commanderFreeMovePreview.nextSpentUd) <= 5);
});

test('non-included general free drag is blocked beyond 5 UD', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 5.2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
  });

  const blockedGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(blockedGeneral);
  assert.equal(blockedGeneral.xUd, initialGeneral.xUd);
  assert.equal(blockedGeneral.yUd, initialGeneral.yUd);
  assert.equal(blockedGeneral.advanceUsedUd, 0);
});

test('confirming a general free drag ends that commander movement for the phase', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: initialGeneral.yUd,
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  const afterFirstConfirm = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(afterFirstConfirm);
  assert.equal(Number(afterFirstConfirm.advanceUsedUd.toFixed(3)), 2);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((afterFirstConfirm.xUd + 3).toFixed(3)),
    yUd: afterFirstConfirm.yUd,
    dragOriginXUd: afterFirstConfirm.xUd,
    dragOriginYUd: afterFirstConfirm.yUd,
    maxDistanceUd: 3,
    dragSpentUdAtStart: 2,
  });

  const unchangedAfterSecondAttempt = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unchangedAfterSecondAttempt);
  assert.equal(unchangedAfterSecondAttempt.xUd, afterFirstConfirm.xUd);
  assert.equal(unchangedAfterSecondAttempt.yUd, afterFirstConfirm.yUd);
  assert.equal(unchangedAfterSecondAttempt.advanceUsedUd, afterFirstConfirm.advanceUsedUd);
  assert.equal(state.game.commanderFreeMovePreview.status, 'idle');
});

test('stay action marks a selected unit as stayed during movement phase', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.MARK_UNIT_STAY,
    unitId: 'test-unit-1',
  });

  const stayedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(stayedUnit);
  assert.equal(stayedUnit.stayedThisMovementPhase, true);
  assert.equal(stayedUnit.advanceUsedUd, 5);
});

test('non-included general free drag reset restores the drag-start position and refreshes budget', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const initialGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialGeneral);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((initialGeneral.xUd + 2).toFixed(3)),
    yUd: Number((initialGeneral.yUd - 1).toFixed(3)),
    dragOriginXUd: initialGeneral.xUd,
    dragOriginYUd: initialGeneral.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE,
  });

  const movedGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(movedGeneral);
  assert.ok((movedGeneral.advanceUsedUd ?? 0) > 0);

  state = reduceAppState(state, {
    type: ACTION_TYPES.RESET_COMMANDER_FREE_MOVE,
    unitId: 'test-unit-1',
  });

  const resetGeneral = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(resetGeneral);
  assert.equal(resetGeneral.xUd, initialGeneral.xUd);
  assert.equal(resetGeneral.yUd, initialGeneral.yUd);
  assert.equal(resetGeneral.advanceUsedUd, 0);
  assert.equal(resetGeneral.commanderMovePhaseStartXUd, null);
  assert.equal(resetGeneral.commanderMovePhaseStartYUd, null);
  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).reasonCode, COMMAND_CP_REASON_CODES.FREE_CP);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).amount, 1);
  assert.equal(state.game.commandContext.commandPoints.ledger.at(-1).unitId, 'test-unit-1');
});

test('reset test units only resets the selected unit to the completed setup baseline', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.DEPLOYMENT) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 14,
    yUd: 12,
  });

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.READY) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, { type: ACTION_TYPES.COMPLETE_SETUP });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.MOVEMENT });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const movedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  const otherUnitBeforeReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(movedUnit);
  assert.ok(otherUnitBeforeReset);
  assert.notEqual(movedUnit.yUd, 12);

  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS });

  const resetUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  const otherUnitAfterReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(resetUnit);
  assert.ok(otherUnitAfterReset);
  assert.equal(resetUnit.xUd, 14);
  assert.equal(resetUnit.yUd, 12);
  assert.equal(resetUnit.advanceUsedUd, 0);
  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(otherUnitAfterReset.xUd, otherUnitBeforeReset.xUd);
  assert.equal(otherUnitAfterReset.yUd, otherUnitBeforeReset.yUd);
});

test('reset test units leaves non-selected moved units untouched', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const movedCavalry = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(movedCavalry);

  state = reduceAppState(state, { type: ACTION_TYPES.MARK_UNIT_STAY, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-2' });
  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS });

  const cavalryAfterOtherReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  const selectedAfterReset = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-2');
  assert.ok(cavalryAfterOtherReset);
  assert.ok(selectedAfterReset);
  assert.equal(cavalryAfterOtherReset.xUd, movedCavalry.xUd);
  assert.equal(cavalryAfterOtherReset.yUd, movedCavalry.yUd);
  assert.equal(selectedAfterReset.advanceUsedUd, 0);
});

test('after movement is confirmed the same unit stays selectable for reset but cannot receive more movement commands', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 1);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-2' });
  assert.equal(state.game.selectedUnitId, 'p1-c1-cav-2');

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  const beforeRetry = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(beforeRetry);
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const afterRetry = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(afterRetry);
  assert.equal(afterRetry.yUd, beforeRetry.yUd);
  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 1);

  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS, unitId: 'p1-c1-cav-1' });
  const resetUnit = state.game.units.find((candidate) => candidate.id === 'p1-c1-cav-1');
  assert.ok(resetUnit);
  assert.equal(resetUnit.advanceUsedUd, 0);
});

test('reset test units refunds a free CP consumed by the selected unit movement order', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  assert.equal(state.game.commandContext.commandPoints.available, 3);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 0);

  state = reduceAppState(state, { type: ACTION_TYPES.RESET_TEST_UNITS });

  assert.equal(state.game.commandContext.commandPoints.available, 4);
  assert.equal(state.game.commandContext.commandPoints.spent, 0);
  assert.equal(state.game.commandContext.commandPoints.free, 1);
});

test('included general host unit cannot use commander free drag movement', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-1' });

  const initialUnit = state.game.units.find((candidate) => candidate.id === 'p1-c3-hi-1');
  assert.ok(initialUnit);
  assert.equal(initialUnit.hasIncludedCommander, true);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'p1-c3-hi-1',
    xUd: Number((initialUnit.xUd + 1).toFixed(3)),
    yUd: initialUnit.yUd,
    dragOriginXUd: initialUnit.xUd,
    dragOriginYUd: initialUnit.yUd,
    maxDistanceUd: 5,
  });

  const unchangedUnit = state.game.units.find((candidate) => candidate.id === 'p1-c3-hi-1');
  assert.ok(unchangedUnit);
  assert.equal(unchangedUnit.xUd, initialUnit.xUd);
  assert.equal(unchangedUnit.yUd, initialUnit.yUd);
});

test('starting a new game creates explicit deployment zones and visible deployment placeholders', () => {
  const state = startNewGame();

  assert.equal(state.game.setup.deployment.zones.length, 2);
  assert.equal(state.game.setup.deployment.visiblePlaceholders.length, 2);
  assert.deepEqual(
    state.game.setup.deployment.visiblePlaceholders.map((placeholder) => placeholder.unitId),
    ['test-unit-1', 'test-unit-2'],
  );
  assert.equal(state.game.setup.deployment.sourceStatus, 'needs-source-check');
});

test('ready setup step can transition into battle mode', () => {
  let state = startNewGame();

  while (state.game.setup.currentStepId !== SETUP_STEP_IDS.READY) {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  state = reduceAppState(state, { type: ACTION_TYPES.COMPLETE_SETUP });

  assert.equal(state.game.setup.isActive, false);
  assert.equal(state.game.phaseTracker.mode, 'battle');
  assert.ok(state.game.setup.lockedStepIds.includes(SETUP_STEP_IDS.READY));
});

test('overlay cycle follows the configured order', () => {
  let state = advanceToBattlefield();
  const seenModes = [];

  for (let index = 0; index < OVERLAY_MODES.length; index += 1) {
    state = reduceAppState(state, { type: ACTION_TYPES.CYCLE_OVERLAY_MODE });
    seenModes.push(state.game.overlayMode);
  }

  assert.deepEqual(seenModes, ['Aufstellungszonen', 'Sektoren', 'Beides', 'Aus']);
});

test('advance preview clamps to the 4 UD P0 limit', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advancePreviewUd, 4);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
});

test('setup flow blocks advance-mode interaction', () => {
  let state = selectTestUnit(startNewGame());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(unit.advanceUsedUd, 0);
});

test('confirm advance updates unit position through reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1.5,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd - 1.5);
  assert.equal(unit.advanceUsedUd, 1.5);
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(state.game.advanceModeActive, false);
});

test('advance preview stores movement preview data without mutating the unit first', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, initialUnit.yUd);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments[0].endPose.yUd, initialUnit.yUd - 2);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
});

test('advance preview follows rotated facing before confirmation', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              rotationRadians: degreesToRadians(90),
            }
          : unit,
      ),
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2,
  });

  assert.equal(Number(state.game.movement.preview.segments[0].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 2).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.yUd.toFixed(3)), Number(initialUnit.yUd.toFixed(3)));
});

test('advance preview rejects full-footprint battlefield overflow', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: 1,
    yUd: 0.6,
  });
  state = {
    ...state,
    game: {
      ...state.game,
      setup: {
        ...state.game.setup,
        isActive: false,
      },
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-1'
          ? {
              ...unit,
              xUd: 1,
              yUd: 0.6,
            }
          : unit,
      ),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.REJECTED);
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
  assert.equal(unit.yUd, 0.6);
});

test('confirming movement blocks later advance previews for the same unit in the same phase', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1.56,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advanceModeActive, false);
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.IDLE);
});

test('wheel preview clamps to the remaining shared movement budget', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) =>
        unit.id === 'test-unit-2'
          ? {
              ...unit,
              yUd: 1,
            }
          : unit,
      ),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 3.5,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });

  assert.equal(Number(state.game.movement.preview.segments[1].distance.resolvedUd.toFixed(3)), 0.5);
  assert.equal(Number(state.game.wheelPreviewAngleRadians.toFixed(3)), Number((Math.PI / 6).toFixed(3)));
});

test('medium infantry advance preview clamps to the approved 3 UD subset budget', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c2-mi-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advancePreviewUd, 3);
  assert.equal(Number(state.game.movement.preview.segments[0].distance.resolvedUd.toFixed(3)), 3);
});

test('heavy infantry advance preview clamps to 2 UD when an enemy starts within 4 UD', () => {
  let state = advanceToBattlefield();

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'p1-c3-hi-2') {
          return {
            ...unit,
            xUd: 10,
            yUd: 10,
          };
        }

        if (unit.id === 'p2-c2-mi-1') {
          return {
            ...unit,
            xUd: 10,
            yUd: 6,
          };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-2' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 9,
  });

  assert.equal(state.game.advancePreviewUd, 2);
  assert.equal(Number(state.game.movement.preview.segments[0].distance.resolvedUd.toFixed(3)), 2);
});

test('advance preview keeps the wheeled ghost rotation before confirmation', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(Number(state.game.movement.preview.segments[1].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[1].endPose.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[1].endPose.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));
});

test('switching from advance preview to wheel preserves the chained ghost pose', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments.length, 1);
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(state.game.wheelModeActive, true);
});

test('mixed movement chain confirms from the final preview pose and budget', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: Math.PI / 2,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(state.game.movement.preview.segments.length, 3);
  assert.equal(Number(getMovementPreviewResolvedDistanceUd(state.game.movement.preview).toFixed(3)), 3.5);
  assert.equal(Number(state.game.movement.preview.segments[2].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[2].endPose.yUd.toFixed(3)), Number((initialUnit.yUd - 2).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[2].endPose.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(unit.yUd.toFixed(3)), Number((initialUnit.yUd - 2).toFixed(3)));
  assert.equal(Number(unit.rotationRadians.toFixed(3)), Number((Math.PI / 2).toFixed(3)));
  assert.equal(Number(unit.advanceUsedUd.toFixed(3)), 3.5);
});

test('slide preview moves laterally and stays blocked without 1 UD forward in the chain', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(state.game.movement.preview.segments[0].endPose.yUd.toFixed(3)), Number(initialUnit.yUd.toFixed(3)));
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);
  assert.equal(Number(getMovementPreviewAdvanceDistanceUd(state.game.movement.preview).toFixed(3)), 0);
});

test('slide stays blocked until the chained move reaches at least 1 UD of advance or wheel movement', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.LEFT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 0.9,
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
  assert.equal(Number(getSlideQualifiedMovementDistanceUd(state.game.movement.preview).toFixed(3)), 1);
});

test('slide also stays blocked when the chained wheel distance is below 1 UD', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: getWheelAngleRadiansForDistanceUd(0.9),
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE,
    pivotSide: MOVEMENT_PIVOT_SIDES.RIGHT,
    angleRadians: getWheelAngleRadiansForDistanceUd(1),
  });

  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
});

test('slide is free but confirm applies the chained lateral move', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const initialUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(initialUnit);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.xUd.toFixed(3)), Number((initialUnit.xUd + 1).toFixed(3)));
  assert.equal(Number(unit.yUd.toFixed(3)), Number((initialUnit.yUd - 1).toFixed(3)));
  assert.equal(Number(unit.advanceUsedUd.toFixed(3)), 1);
  assert.equal(unit.slideUsedThisMovementPhase, true);
});

test('a unit can only use one slide per movement phase', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE,
    slideSide: MOVEMENT_SLIDE_SIDES.RIGHT,
    distanceUd: 1,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const usedSlideUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(usedSlideUnit);
  assert.equal(usedSlideUnit.slideUsedThisMovementPhase, true);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SLIDE_MODE,
    isActive: true,
  });

  assert.equal(state.game.slideModeActive, false);
  assert.equal(state.game.movement.selectedCommandId, null);
});

test('zoc subset legality allows confirmation when advance closes on most-threatening enemy without contact', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-2') {
          return { ...unit, xUd: selectedUnit.xUd, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        if (unit.id === 'test-unit-3') {
          return { ...unit, xUd: selectedUnit.xUd - 1, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        if (unit.id === 'test-unit-4') {
          return { ...unit, xUd: selectedUnit.xUd + 1, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1.9,
  });

  const zocDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'zoc-subset-legality');
  assert.ok(zocDiagnostic);
  assert.equal(zocDiagnostic.status, 'verified');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(Number(unit.yUd.toFixed(3)), Number((selectedUnit.yUd - 1.9).toFixed(3)));
  assert.equal(unit.advanceUsedUd, 1.9);
});

test('zoc subset legality still blocks confirmation when path would create contact with most-threatening enemy', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-2') {
          return { ...unit, xUd: selectedUnit.xUd, yUd: selectedUnit.yUd - 3, rotationRadians: Math.PI };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
    corpsId: 'corps-1',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 2.4,
  });

  const zocDiagnostic = state.game.movement.validationSnapshot.diagnostics.find((entry) => entry.id === 'zoc-subset-legality');
  assert.ok(zocDiagnostic);
  assert.equal(zocDiagnostic.status, 'blocked');
  assert.equal(state.game.movement.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.BLOCKED);

  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(unit);
  assert.equal(unit.yUd, selectedUnit.yUd);
  assert.equal(unit.advanceUsedUd, 0);
});

test('debug mode requires a selected unit and initializes a debug unit pose', () => {
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  assert.equal(state.game.debug.isActive, false);

  state = selectTestUnit(state);
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);
  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });

  assert.equal(state.game.debug.isActive, true);
  assert.equal(state.game.debug.showFacingGeometryOverlay, false);
  assert.equal(state.game.debug.unitPose.xUd, selectedUnit.xUd + 2);
  assert.equal(state.game.debug.unitPose.yUd, selectedUnit.yUd);
  assert.equal(state.game.debug.unitPose.rotationRadians, 0);
  assert.equal(state.game.debug.unitDimensions.widthUd, 1);
  assert.equal(state.game.debug.unitDimensions.depthUd, 1);
});

test('facing geometry overlay only toggles while debug mode is active', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_FACING_GEOMETRY_OVERLAY });
  assert.equal(state.game.debug.showFacingGeometryOverlay, false);

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_FACING_GEOMETRY_OVERLAY });
  assert.equal(state.game.debug.showFacingGeometryOverlay, true);

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  assert.equal(state.game.debug.isActive, false);
  assert.equal(state.game.debug.showFacingGeometryOverlay, false);
});

test('debug unit pose updates stay in serializable reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_DEBUG_UNIT_POSITION,
    xUd: 15.25,
    yUd: 6.5,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_DEBUG_UNIT_ROTATION,
    rotationRadians: Math.PI / 3,
  });

  assert.deepEqual(state.game.debug.unitPose, {
    xUd: 15.25,
    yUd: 6.5,
    rotationRadians: Math.PI / 3,
  });
  assert.equal(state.game.selectedUnitId, 'test-unit-1');
});

test('debug unit rotation is normalized in reducer state', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_DEBUG_UNIT_ROTATION,
    rotationRadians: -(Math.PI / 2),
  });

  assert.equal(state.game.debug.unitPose.rotationRadians, Math.PI * 1.5);
});

test('selected unit rotation is debug-only and normalized for overlay inspection', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SELECTED_UNIT_ROTATION,
    rotationRadians: Math.PI / 2,
  });
  assert.equal(state.game.units[0].rotationRadians, 0);

  state = reduceAppState(state, { type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_SELECTED_UNIT_ROTATION,
    rotationRadians: -(Math.PI / 2),
  });

  assert.equal(state.game.units[0].rotationRadians, Math.PI * 1.5);
});

// P5-06: Owner and phase enforcement for movement commands

test('advance mode is blocked when the active player does not own the selected unit', () => {
  // Player-1 owns test-unit-1; player-2 is set as active player → advance must be blocked.
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ACTIVE_PLAYER,
    playerId: COMMAND_PLAYER_IDS.PLAYER_TWO,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_MODE,
    isActive: true,
  });

  assert.equal(state.game.advanceModeActive, false);
});

test('advance preview distance is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  // Activate advance while player-1 is active (allowed).
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  assert.equal(state.game.advanceModeActive, true);

  // Switch to player-2 (wrong owner) and attempt to set a preview distance.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });

  // State should be unchanged (unit not moved, preview stays at 0).
  assert.equal(state.game.advancePreviewUd, 0);
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').yUd, selectedUnit.yUd);
});

test('confirm advance is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });
  assert.equal(state.game.advancePreviewUd, 2);

  // Switch to player-2 and attempt to confirm.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  // Unit must not have moved.
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').yUd, selectedUnit.yUd);
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').advanceUsedUd, 0);
});

test('advance mode is blocked when the active phase is not movement', () => {
  let state = selectTestUnit(advanceToBattlefield());

  // Switch to command phase (wrong phase).
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.COMMAND });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });

  assert.equal(state.game.advanceModeActive, false);
});

test('confirm advance is blocked when the active phase is not movement', () => {
  let state = selectTestUnit(advanceToBattlefield());
  const selectedUnit = state.game.units.find((candidate) => candidate.id === 'test-unit-1');
  assert.ok(selectedUnit);

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });

  // Switch to command phase and try to confirm.
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE, phaseId: BATTLE_PHASE_IDS.COMMAND });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').yUd, selectedUnit.yUd);
  assert.equal(state.game.units.find((u) => u.id === 'test-unit-1').advanceUsedUd, 0);
});

test('player-2 can advance their own unit when active player is player-2 and phase is movement', () => {
  // Select test-unit-2 (player-2) and set up correct context.
  let state = advanceToBattlefield();

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-2' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 2 });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const unit2 = state.game.units.find((u) => u.id === 'test-unit-2');
  assert.ok(unit2.advanceUsedUd > 0, 'player-2 unit should have moved');
});

test('wheel mode is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_WHEEL_MODE, isActive: true });

  assert.equal(state.game.wheelModeActive, false);
});

test('slide mode is blocked when the active player does not own the selected unit', () => {
  let state = selectTestUnit(advanceToBattlefield());

  state = reduceAppState(state, { type: ACTION_TYPES.SET_ACTIVE_PLAYER, playerId: COMMAND_PLAYER_IDS.PLAYER_TWO });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_SLIDE_MODE, isActive: true });

  assert.equal(state.game.slideModeActive, false);
});


