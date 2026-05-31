export const SCREEN_IDS = {
  MAIN_MENU: 'main-menu',
  NEW_GAME: 'new-game',
  OPTIONS: 'options',
  LOAD_GAME: 'load-game',
  BATTLEFIELD: 'battlefield',
};

import { BATTLEFIELD_PROFILE_IDS } from '../data/battlefield-profiles.js';
import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { createChargeDrillScenario } from '../data/charge-drill-scenarios.js';
import { createConformDrillScenario } from '../data/conform-drill-scenarios.js';
import { createMeleeDrillScenario } from '../data/melee-drill-scenarios.js';
import {
  createShootingDrillScenario,
  createShootingLosExampleScenario,
} from '../data/shooting-drill-scenarios.js';
import {
  createAdjustedChargeDistanceClaim,
  createChargeBranchDistanceClaim,
  createChargeReactionBranchDistanceClaim,
  createEvadeChoiceHandoffFromMove,
  reanchorChargePreviewToSecondaryTarget,
  resolveChargeBranchDistanceResult,
} from './p0-charge-branch-helpers.js';
import {
  reduceAcknowledgeEvadeChoiceHandoff,
  reduceResolveChargeContinuationChoice,
  reduceSelectEvadeAvoidanceChoice,
  reduceStartAdjustedChargeDistanceRoll,
} from './p0-charge-choice-reducers.js';
import {
  reduceConfirmChargeConformation,
  canConfirmChargeConformation,
} from './p0-charge-conformation-reducers.js';
import {
  reduceConfirmChargeDirection,
  reduceResolveChargeBranchDistance,
  reduceResolveChargeReaction,
  reduceResolveSecondaryChargeReaction,
} from './p0-charge-reaction-reducers.js';
import {
  reduceCancelChargePreview,
  reducePreviewChargeStartManoeuvre,
  reduceSelectChargeContactSide,
  reduceSelectChargeStartManoeuvre,
  reduceSetChargeTarget,
  reduceStartChargePreview,
} from './p0-charge-preview-reducers.js';
import {
  applyCommittedEvadeMoveToUnits,
  isEvadeMoveCommitted,
  reducePreviewEvadeAvoidanceNode,
  reduceResetEvadeAvoidancePath,
} from './p0-evade-move-state-helpers.js';
import {
  chargePreviewRequiresContactSideSelection,
  completeChargeReactionRequests,
  createChargeDirectionSnapshot,
  getChargeContactSideOptions,
  getChargeReactionPreviewState,
  getPrimaryChargeReactionRequest,
  resolveChargeContactSideSelection,
} from './p0-charge-preview-helpers.js';
import {
  canConfirmChargePreviewDirection,
  canStartChargePreview,
  cloneCommandSnapshot,
  createChargeIntentFromUnit,
  createChargeTargetSnapshot,
  getChargePreviewUnavailableReason,
} from './p0-charge-state-helpers.js';
import {
  applyAdjustedChargeDistanceToReactionRequests,
  createSecondaryTargetReactionRequests,
  getLatestAdjustedChargeDistanceResult,
  resolveChargeFollowThroughResolution,
  resolveChargePreviewChargeMovementPlan,
} from './p0-charge-follow-through-helpers.js';
import {
  createEvadeMoveResolutionFromPlan,
  getEvadeChoiceFrontierStepIds,
  resolveChargePreviewEvadePlan,
  resolveEvadePlanAvoidanceChoice,
} from './p0-charge-evade-helpers.js';
import { createStandardDirectBattleFixtureUnits, getDeploymentSeedUnits } from './p0-fixtures.js';
import {
  createBattleStartGameState,
  createInitialAppState,
  createScenarioSetupState,
} from './p0-battle-start.js';
import {
  getSelectedUnit,
  isUnitSelectableInCurrentCorps,
  reduceCycleOverlayMode,
  reduceNavigate,
  reduceSaveSettings,
  reduceSelectActiveCorpsState,
  reduceSetBattlefieldViewport,
  reduceSetKeyBindingDraft,
  reduceSetNewGameMode,
  reduceSetNewGamePoints,
  reduceSetPlayerColorDraft,
  reduceSetScaleOverlayDraft,
} from './p0-shell-reducers.js';
import {
  cloneSettings,
  createInitialCommandMenuState,
  createDebugUnitDimensions,
  createDebugUnitPose,
  createInitialCommanderFreeMovePreview,
  createInitialDebugState,
  createInitialPhaseTracker,
  createInitialSettings,
  createInitialViewport,
  createUnitInitialPositionMap,
} from './p0-state-initializers.js';
import {
  isUnitSelectionLockedByPendingMove,
  reduceSetCommanderEngagedDiagnostic,
  resetMovementCommandUi,
  setActiveCommandMenuBranch,
} from './p0-state-ui-helpers.js';
import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_MOVEMENT_CONTINUATION_DECISIONS,
  buildChargeStartSelectionResult,
  CHARGE_HANDOFF_STATUSES,
  CHARGE_CONTACT_EVENT_TYPES,
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_REACTION_DECISION_TYPES,
  CHARGE_TARGET_CANDIDATE_STATUSES,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_START_MANOEUVRE_TYPES,
  CHARGE_START_OPTION_STATUSES,
  EVADE_CHOICE_HANDOFF_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createChargeBranchDistanceState,
  createChargeDeclarationSnapshot,
  createChargeConformationPlan,
  createChargeFollowThroughResolution,
  createEvadeChoiceHandoff,
  createChargeReactionDecision,
  createInitialChargePreview,
  getChargeReactionDecisionHandoffStatus,
  isChargeReactionDecisionAllowed,
  resolveChargeContactState,
  getChargeTargetCandidateByUnitId,
  getChargeTargetCandidates,
  getChargeStartOptions,
  CHARGE_PATH_FAMILY_IDS,
} from '../engine/charge/index.js';
import {
  getUnitCommandRangeMeasurement,
  refundCommandPointsForUnit,
  spendFreeCommandPoint,
} from '../engine/command/index.js';
import {
  canAttachCommanderToUnit,
  canResetCommanderFreeMove,
  canStartCommanderAttach,
  canUseCommanderFreeMove,
  clearAttachmentRelationsForUnit,
  finalizeCommandAttachmentState,
  getAttachedCommanderPose,
  getCommanderAttachActor,
  getCommanderAttachRemainingUd,
  getSelectedCommanderUnit,
  isUnitFootprintWithinBattlefield,
  syncAttachedCommanderWithHost,
} from './p0-commander-helpers.js';
import {
  reduceAttachCommander,
  reduceCancelCommanderFreeMovePreview,
  reduceConfirmCommanderFreeMove,
  reduceResetCommanderFreeMove,
  reduceSetCommanderPositionInBattle,
} from './p0-commander-reducers.js';
import { reduceMarkUnitStay } from './p0-movement-stay-reducers.js';
import { reduceResetTestUnits } from './p0-reset-reducers.js';
import {
  createInitialAdvanceState,
  getRemainingAdvanceBudgetUd,
  reduceConfirmAdvance,
  reduceSetAdvanceMode,
  reduceSetAdvancePreviewDistance,
} from './p0-advance.js';
import {
  COMMAND_PLAYER_IDS,
  createInitialCommandContextState,
  reduceCompleteActiveCorps,
  reduceSelectActiveCorps,
  reduceSetActiveBattlePhase,
  reduceSetActivePlayer,
  syncCommandContextSnapshots,
} from './p0-command-context.js';
import {
  createInitialMovementState,
  hasUnitFinishedMovementPhase,
  isMovementCommandAllowed,
  reduceClearMovementDraft,
  reduceSetUseFreeCommandPointForOrder,
  reduceSelectMovementCommand,
  reduceSetMovementDraft,
  reduceSetMovementPreview,
  withMovementValidationSnapshot,
} from './p0-movement.js';
import {
  acknowledgeMeleeBatchSummary,
  acknowledgeMeleePhaseProcedure,
  acknowledgeMeleeResolutionResult,
  applyMeleeBatch,
  beginMeleePhaseState,
  cancelMeleeResolutionDraft,
  confirmMeleeResolutionDraft,
  getMeleeUnitParticipation,
  moveMeleeQueueSelection,
  previewMeleeBatch,
  setMeleeProcedureDialogOpen,
  setMeleeResolutionDraftCommanderEngaged,
  setMeleeResolutionDraftValue,
  startMeleeResolutionDraft,
  toggleMeleeResolutionCombatFactorDebugOverride,
  toggleMeleeQueueSelection,
} from './p9-melee-v2.js';
import {
  acknowledgeShootingPhaseProcedure,
  beginShootingPhaseState,
  cancelShootingDeclarationPreview,
  cancelShootingResolutionDraft,
  confirmShootingDeclaration,
  confirmShootingResolution,
  createInitialShootingPreviewState,
  createInitialShootingResolutionDraftState,
  createInitialShootingSequenceHandoffState,
  passShootingProcedureUnit,
  SHOOTING_PROCEDURE_STATUSES,
  SHOOTING_SEQUENCE_HANDOFF_KINDS,
  SHOOTING_SEQUENCE_HANDOFF_STATUSES,
  setShootingResolutionDraftDieRoll,
  setShootingResolutionDraftProtection,
  setShootingDeclarationTarget,
  startShootingResolutionDraft,
  startShootingDeclarationPreview,
} from './p0-shooting.js';
import { getUnitMovementBudgetUd } from '../engine/movement/budget.js';
import {
  createInitialSlideState,
  MOVEMENT_SLIDE_SIDES,
  reduceConfirmSlide,
  reduceSetSlideMode,
  reduceSetSlidePreviewDistance,
} from './p0-slide.js';
import {
  createInitialWheelState,
  MOVEMENT_PIVOT_SIDES,
  reduceConfirmWheel,
  reduceSetWheelMode,
  reduceSetWheelPreviewAngle,
} from './p0-wheel.js';
import {
  getPointDistance,
  normalizeAngleRadians,
} from '../engine/geometry/index.js';
import {
  createInitialSetupState,
    reduceAddAmbushMarker,
  reduceAddSetupObject,
  reduceAddTerrainPlaceholder,
  reduceAdvanceSetupStep,
  reduceAssignBattlePlanCorps,
  reduceCompleteSetup,
  reduceDismissCurrentSetupGuide,
  reduceGoToPreviousSetupStep,
  reduceLockCurrentSetupStep,
  reduceLockTerrainPlaceholder,
  reduceRemoveSetupObject,
  reduceRemoveTerrainPlaceholder,
  reduceSelectAmbushMarker,
  reduceSelectBattlePlanCorps,
  reduceSelectSetupObject,
  reduceSelectTerrainPlaceholder,
  reduceSetSetupViewMode,
  reduceSetUnitPositionInSetup,
  reduceUpdateAmbushMarker,
  reduceUpdateAmbushMarkerContents,
  reduceUpdateSetupObject,
  reduceUpdateTerrainPlaceholder,
  SETUP_STEP_DEFINITIONS,
  SETUP_STEP_IDS,
  SETUP_VIEW_MODES,
} from './p0-setup.js';
import {
  advanceFromShootingToCombat,
  beginShootingSequenceForPlayer,
  ROUND_PHASE_IDS,
  ROUND_PHASE_LABELS,
  ROUND_DIALOG_TYPES,
  createInitialRoundState,
  openShootingSequenceHandoffDialog,
  reduceAdvanceRoundPhase,
  reduceConfirmNextCorps,
  reduceRequestNextCorps,
  reduceRoundBegin,
  reduceSkipRemainingCorps,
} from './p0-round.js';

export { SETUP_STEP_DEFINITIONS, SETUP_STEP_IDS, SETUP_VIEW_MODES };
export { createInitialAppState };
export {
  canConfirmChargePreviewDirection,
  canConfirmChargeConformation,
  canStartChargePreview,
  getChargePreviewUnavailableReason,
};

export const BATTLE_PHASE_IDS = {
  COMMAND: 'command',
  MOVEMENT: 'movement',
  SHOOTING: 'shooting',
  MELEE: 'melee',
  CLEANUP: 'cleanup',
  VICTORY: 'victory',
};

export const BATTLE_PHASE_DEFINITIONS = [
  { id: BATTLE_PHASE_IDS.COMMAND, label: 'Command' },
  { id: BATTLE_PHASE_IDS.MOVEMENT, label: 'Movement' },
  { id: BATTLE_PHASE_IDS.SHOOTING, label: 'Shooting' },
  { id: BATTLE_PHASE_IDS.MELEE, label: 'Melee' },
  { id: BATTLE_PHASE_IDS.CLEANUP, label: 'Cleanup' },
  { id: BATTLE_PHASE_IDS.VICTORY, label: 'Victory' },
];

export const OVERLAY_MODES = ['Aus', 'Aufstellungszonen', 'Sektoren', 'Beides'];

export const ACTION_TYPES = {
  NAVIGATE: 'shell/navigate',
  SET_PLAYER_COLOR_DRAFT: 'shell/set-player-color-draft',
  SET_SCALE_OVERLAY_DRAFT: 'shell/set-scale-overlay-draft',
  SET_KEY_BINDING_DRAFT: 'shell/set-key-binding-draft',
  SAVE_SETTINGS: 'shell/save-settings',
  SET_NEW_GAME_MODE: 'shell/set-new-game-mode',
  SET_NEW_GAME_POINTS: 'shell/set-new-game-points',
  START_NEW_GAME: 'game/start-new-game',
  START_DIRECT_BATTLE: 'game/start-direct-battle',
  START_CHARGE_DRILL_BATTLE: 'game/start-charge-drill-battle',
  START_CONFORM_DRILL_BATTLE: 'game/start-conform-drill-battle',
  START_SHOOTING_DRILL_BATTLE: 'game/start-shooting-drill-battle',
  START_SHOOTING_LOS_EXAMPLE_BATTLE: 'game/start-shooting-los-example-battle',
  START_MELEE_DRILL_BATTLE: 'game/start-melee-drill-battle',
  GO_TO_PREVIOUS_SETUP_STEP: 'game/go-to-previous-setup-step',
  ADVANCE_SETUP_STEP: 'game/advance-setup-step',
  LOCK_CURRENT_SETUP_STEP: 'game/lock-current-setup-step',
  DISMISS_CURRENT_SETUP_GUIDE: 'game/dismiss-current-setup-guide',
  COMPLETE_SETUP: 'game/complete-setup',
  SET_SETUP_VIEW_MODE: 'game/set-setup-view-mode',
  SET_BATTLEFIELD_VIEWPORT: 'game/set-battlefield-viewport',
  CYCLE_OVERLAY_MODE: 'game/cycle-overlay-mode',
  ADD_TERRAIN_PLACEHOLDER: 'game/add-terrain-placeholder',
  UPDATE_TERRAIN_PLACEHOLDER: 'game/update-terrain-placeholder',
  SELECT_TERRAIN_PLACEHOLDER: 'game/select-terrain-placeholder',
  LOCK_TERRAIN_PLACEHOLDER: 'game/lock-terrain-placeholder',
  REMOVE_TERRAIN_PLACEHOLDER: 'game/remove-terrain-placeholder',
  ADD_SETUP_OBJECT: 'game/add-setup-object',
  UPDATE_SETUP_OBJECT: 'game/update-setup-object',
  SELECT_SETUP_OBJECT: 'game/select-setup-object',
  REMOVE_SETUP_OBJECT: 'game/remove-setup-object',
  SELECT_BATTLE_PLAN_CORPS: 'game/select-battle-plan-corps',
  ASSIGN_BATTLE_PLAN_CORPS: 'game/assign-battle-plan-corps',
  ADD_AMBUSH_MARKER: 'game/add-ambush-marker',
  SELECT_AMBUSH_MARKER: 'game/select-ambush-marker',
  UPDATE_AMBUSH_MARKER: 'game/update-ambush-marker',
  UPDATE_AMBUSH_MARKER_CONTENTS: 'game/update-ambush-marker-contents',
  SELECT_UNIT: 'game/select-unit',
  SET_UNIT_POSITION: 'game/set-unit-position',
  TOGGLE_DEBUG_MODE: 'game/toggle-debug-mode',
  TOGGLE_FACING_GEOMETRY_OVERLAY: 'game/toggle-facing-geometry-overlay',
  SET_DEBUG_UNIT_POSITION: 'game/set-debug-unit-position',
  SET_DEBUG_UNIT_ROTATION: 'game/set-debug-unit-rotation',
  SET_SELECTED_UNIT_ROTATION: 'game/set-selected-unit-rotation',
  SET_ACTIVE_BATTLE_PHASE: 'game/set-active-battle-phase',
  SET_ACTIVE_PLAYER: 'game/set-active-player',
  SELECT_ACTIVE_CORPS: 'game/select-active-corps',
  COMPLETE_ACTIVE_CORPS: 'game/complete-active-corps',
  SET_ADVANCE_MODE: 'game/set-advance-mode',
  SET_ADVANCE_PREVIEW_DISTANCE: 'game/set-advance-preview-distance',
  CONFIRM_ADVANCE: 'game/confirm-advance',
  SET_WHEEL_MODE: 'game/set-wheel-mode',
  SET_WHEEL_PREVIEW_ANGLE: 'game/set-wheel-preview-angle',
  CONFIRM_WHEEL: 'game/confirm-wheel',
  SET_SLIDE_MODE: 'game/set-slide-mode',
  SET_SLIDE_PREVIEW_DISTANCE: 'game/set-slide-preview-distance',
  CONFIRM_SLIDE: 'game/confirm-slide',
  SELECT_MOVEMENT_COMMAND: 'game/select-movement-command',
  SET_MOVEMENT_DRAFT: 'game/set-movement-draft',
  SET_MOVEMENT_PREVIEW: 'game/set-movement-preview',
  SET_USE_FREE_COMMAND_POINT_FOR_ORDER: 'game/set-use-free-command-point-for-order',
  SET_COMMANDER_ENGAGED_DIAGNOSTIC: 'game/set-commander-engaged-diagnostic',
  SET_COMMAND_MENU_BRANCH: 'game/set-command-menu-branch',
  OPEN_MELEE_PHASE_PROCEDURE: 'game/open-melee-phase-procedure',
  CLOSE_MELEE_PHASE_PROCEDURE: 'game/close-melee-phase-procedure',
  ACKNOWLEDGE_MELEE_PHASE_PROCEDURE: 'game/acknowledge-melee-phase-procedure',
  TOGGLE_MELEE_QUEUE_SELECTION: 'game/toggle-melee-queue-selection',
  MOVE_MELEE_QUEUE_ENTRY_UP: 'game/move-melee-queue-entry-up',
  MOVE_MELEE_QUEUE_ENTRY_DOWN: 'game/move-melee-queue-entry-down',
  START_MELEE_RESOLUTION_DRAFT: 'game/start-melee-resolution-draft',
  CANCEL_MELEE_RESOLUTION_DRAFT: 'game/cancel-melee-resolution-draft',
  TOGGLE_MELEE_RESOLUTION_DEBUG_FACTOR_OVERRIDE: 'game/toggle-melee-resolution-debug-factor-override',
  SET_MELEE_RESOLUTION_ATTACKER_FACTOR: 'game/set-melee-resolution-attacker-factor',
  SET_MELEE_RESOLUTION_DEFENDER_FACTOR: 'game/set-melee-resolution-defender-factor',
  SET_MELEE_RESOLUTION_ATTACKER_DIE: 'game/set-melee-resolution-attacker-die',
  SET_MELEE_RESOLUTION_DEFENDER_DIE: 'game/set-melee-resolution-defender-die',
  SET_MELEE_RESOLUTION_ROUND_STATE: 'game/set-melee-resolution-round-state',
  TOGGLE_MELEE_RESOLUTION_ATTACKER_COMMANDER_ENGAGED: 'game/toggle-melee-resolution-attacker-commander-engaged',
  TOGGLE_MELEE_RESOLUTION_DEFENDER_COMMANDER_ENGAGED: 'game/toggle-melee-resolution-defender-commander-engaged',
  CONFIRM_MELEE_RESOLUTION_DRAFT: 'game/confirm-melee-resolution-draft',
  ACKNOWLEDGE_MELEE_RESOLUTION_RESULT: 'game/acknowledge-melee-resolution-result',
  PREVIEW_MELEE_BATCH: 'game/preview-melee-batch',
  APPLY_MELEE_BATCH: 'game/apply-melee-batch',
  ACKNOWLEDGE_MELEE_BATCH_SUMMARY: 'game/acknowledge-melee-batch-summary',
  ACKNOWLEDGE_SHOOTING_PHASE_PROCEDURE: 'game/acknowledge-shooting-phase-procedure',
  OPEN_SHOOTING_SEQUENCE_HANDOFF: 'game/open-shooting-sequence-handoff',
  DISMISS_SHOOTING_SEQUENCE_HANDOFF: 'game/dismiss-shooting-sequence-handoff',
  CONFIRM_SHOOTING_SEQUENCE_HANDOFF: 'game/confirm-shooting-sequence-handoff',
  PASS_ACTIVE_SHOOTER: 'game/pass-active-shooter',
  START_SHOOTING_DECLARATION_PREVIEW: 'game/start-shooting-declaration-preview',
  SET_SHOOTING_DECLARATION_TARGET: 'game/set-shooting-declaration-target',
  CONFIRM_SHOOTING_DECLARATION: 'game/confirm-shooting-declaration',
  CANCEL_SHOOTING_DECLARATION_PREVIEW: 'game/cancel-shooting-declaration-preview',
  START_SHOOTING_RESOLUTION_DRAFT: 'game/start-shooting-resolution-draft',
  SET_SHOOTING_RESOLUTION_PROTECTION: 'game/set-shooting-resolution-protection',
  SET_SHOOTING_RESOLUTION_SHOOTER_DIE: 'game/set-shooting-resolution-shooter-die',
  SET_SHOOTING_RESOLUTION_TARGET_DIE: 'game/set-shooting-resolution-target-die',
  CONFIRM_SHOOTING_RESOLUTION: 'game/confirm-shooting-resolution',
  CANCEL_SHOOTING_RESOLUTION_DRAFT: 'game/cancel-shooting-resolution-draft',
  START_CHARGE_PREVIEW: 'game/start-charge-preview',
  SET_CHARGE_TARGET: 'game/set-charge-target',
  PREVIEW_CHARGE_START_MANOEUVRE: 'game/preview-charge-start-manoeuvre',
  SELECT_CHARGE_START_MANOEUVRE: 'game/select-charge-start-manoeuvre',
  SELECT_CHARGE_CONTACT_SIDE: 'game/select-charge-contact-side',
  CONFIRM_CHARGE_DIRECTION: 'game/confirm-charge-direction',
  CONFIRM_CHARGE_CONFORMATION: 'game/confirm-charge-conformation',
  RESOLVE_CHARGE_REACTION: 'game/resolve-charge-reaction',
  RESOLVE_SECONDARY_CHARGE_REACTION: 'game/resolve-secondary-charge-reaction',
  START_ADJUSTED_CHARGE_DISTANCE_ROLL: 'game/start-adjusted-charge-distance-roll',
  RESOLVE_CHARGE_BRANCH_DISTANCE: 'game/resolve-charge-branch-distance',
  PREVIEW_EVADE_AVOIDANCE_NODE: 'game/preview-evade-avoidance-node',
  RESET_EVADE_AVOIDANCE_PATH: 'game/reset-evade-avoidance-path',
  SELECT_EVADE_AVOIDANCE_CHOICE: 'game/select-evade-avoidance-choice',
  ACKNOWLEDGE_EVADE_CHOICE_HANDOFF: 'game/acknowledge-evade-choice-handoff',
  RESOLVE_CHARGE_CONTINUATION_CHOICE: 'game/resolve-charge-continuation-choice',
  CANCEL_CHARGE_PREVIEW: 'game/cancel-charge-preview',
  ATTACH_COMMANDER: 'game/attach-commander',
  DETACH_COMMANDER: 'game/detach-commander',
  CLEAR_MOVEMENT_DRAFT: 'game/clear-movement-draft',
  CANCEL_MOVEMENT_PREVIEW: 'game/cancel-movement-preview',
  CANCEL_COMMANDER_FREE_MOVE_PREVIEW: 'game/cancel-commander-free-move-preview',
  CONFIRM_COMMANDER_FREE_MOVE: 'game/confirm-commander-free-move',
  RESET_COMMANDER_FREE_MOVE: 'game/reset-commander-free-move',
  MARK_UNIT_STAY: 'game/mark-unit-stay',
  RESET_TEST_UNITS: 'game/reset-test-units',
  ROUND_BEGIN: 'round/begin',
  REQUEST_NEXT_CORPS: 'round/request-next-corps',
  CONFIRM_NEXT_CORPS: 'round/confirm-next-corps',
  SKIP_REMAINING_CORPS: 'round/skip-remaining-corps',
  ADVANCE_ROUND_PHASE: 'round/advance-phase',
};
export { COMMAND_PLAYER_IDS };
export { MOVEMENT_PIVOT_SIDES };
export { MOVEMENT_SLIDE_SIDES };

function replaceChargeTargetCandidate(candidates = [], replacement = null) {
  if (!replacement?.unitId) {
    return candidates;
  }

  let replaced = false;
  const nextCandidates = (Array.isArray(candidates) ? candidates : []).map((candidate) => {
    if (candidate?.unitId !== replacement.unitId) {
      return candidate;
    }

    replaced = true;
    return replacement;
  });

  return replaced ? nextCandidates : [...nextCandidates, replacement];
}

export {
  applyAdjustedChargeDistanceToReactionRequests,
  createSecondaryTargetReactionRequests,
};

const COMMANDER_FREE_MOVE_UD = 5;

function getOpposingPlayerId(playerId) {
  return playerId === COMMAND_PLAYER_IDS.PLAYER_ONE
    ? COMMAND_PLAYER_IDS.PLAYER_TWO
    : playerId === COMMAND_PLAYER_IDS.PLAYER_TWO
      ? COMMAND_PLAYER_IDS.PLAYER_ONE
      : null;
}

function setPendingShootingSequenceHandoff(gameState, { kind, nextPlayerId = null } = {}) {
  if (!gameState.round || !kind) {
    return gameState;
  }

  return openShootingSequenceHandoffDialog({
    ...gameState,
    shooting: {
      ...gameState.shooting,
      handoff: createInitialShootingSequenceHandoffState({
        status: SHOOTING_SEQUENCE_HANDOFF_STATUSES.PENDING,
        kind,
        nextPlayerId,
      }),
    },
  });
}

function maybeOpenShootingSequenceHandoff(gameState) {
  if (gameState.commandContext?.currentPhaseId !== BATTLE_PHASE_IDS.SHOOTING) {
    return gameState;
  }

  const handoff = gameState.shooting?.handoff ?? createInitialShootingSequenceHandoffState();
  const procedure = gameState.shooting?.procedure;
  if (
    handoff.status === SHOOTING_SEQUENCE_HANDOFF_STATUSES.PENDING
    || procedure?.status !== SHOOTING_PROCEDURE_STATUSES.COMPLETE
  ) {
    return gameState;
  }

  const actingPlayerId = gameState.shooting?.actingPlayerId
    ?? gameState.commandContext?.activePlayerId
    ?? gameState.round?.turnPlayerId
    ?? null;
  const roundActivePlayerId = gameState.round?.turnPlayerId ?? actingPlayerId;

  if (!actingPlayerId) {
    return gameState;
  }

  const nextPlayerId = getOpposingPlayerId(actingPlayerId);
  if (actingPlayerId === roundActivePlayerId && nextPlayerId) {
    return setPendingShootingSequenceHandoff(gameState, {
      kind: SHOOTING_SEQUENCE_HANDOFF_KINDS.NEXT_PLAYER,
      nextPlayerId,
    });
  }

  return setPendingShootingSequenceHandoff(gameState, {
    kind: SHOOTING_SEQUENCE_HANDOFF_KINDS.MELEE,
  });
}

function dismissShootingSequenceHandoff(gameState) {
  if (!gameState.round) {
    return gameState;
  }

  return {
    ...gameState,
    round: {
      ...gameState.round,
      dialog: null,
    },
  };
}

function confirmShootingSequenceHandoff(gameState) {
  const handoff = gameState.shooting?.handoff ?? createInitialShootingSequenceHandoffState();
  if (handoff.status !== SHOOTING_SEQUENCE_HANDOFF_STATUSES.PENDING) {
    return gameState;
  }

  if (handoff.kind === SHOOTING_SEQUENCE_HANDOFF_KINDS.NEXT_PLAYER && handoff.nextPlayerId) {
    return beginShootingSequenceForPlayer(gameState, handoff.nextPlayerId);
  }

  if (handoff.kind === SHOOTING_SEQUENCE_HANDOFF_KINDS.MELEE) {
    const combatState = advanceFromShootingToCombat({
      ...gameState,
      shooting: {
        ...gameState.shooting,
        handoff: createInitialShootingSequenceHandoffState(),
      },
    });

    return beginMeleePhaseState({
      ...combatState,
      round: {
        ...combatState.round,
        dialog: {
          type: ROUND_DIALOG_TYPES.PHASE_ANNOUNCE,
          phaseLabel: 'Kampf',
        },
      },
    }, {
      phaseId: BATTLE_PHASE_IDS.MELEE,
      actingPlayerId: combatState.round?.turnPlayerId ?? COMMAND_PLAYER_IDS.PLAYER_ONE,
    });
  }

  return gameState;
}
const POSITION_GUARD_EPSILON = 0.0001;

export { canAttachCommanderToUnit, canStartCommanderAttach, getCommanderAttachRemainingUd };

export function canDetachCommanderFromUnit() {
  return false;
}

function reduceDetachCommander(state, targetUnitId) {
  return state;
}

export function reduceAppState(state, action) {
  switch (action.type) {
    case ACTION_TYPES.NAVIGATE:
      return reduceNavigate(state, action.screenId, cloneSettings);

    case ACTION_TYPES.SET_PLAYER_COLOR_DRAFT:
      return reduceSetPlayerColorDraft(state, action.playerColorDraft);

    case ACTION_TYPES.SET_KEY_BINDING_DRAFT:
      return reduceSetKeyBindingDraft(state, action.bindingId, action.slot, action.keyValue);

    case ACTION_TYPES.SET_SCALE_OVERLAY_DRAFT:
      return reduceSetScaleOverlayDraft(state, action.showScaleOverlay);

    case ACTION_TYPES.SAVE_SETTINGS:
      return reduceSaveSettings(state, cloneSettings);

    case ACTION_TYPES.SET_NEW_GAME_MODE:
      return reduceSetNewGameMode(state, action.mode);

    case ACTION_TYPES.SET_NEW_GAME_POINTS:
      return reduceSetNewGamePoints(state, action.points);

    case ACTION_TYPES.START_NEW_GAME:
      return createBattleStartGameState(state, {
        setupIsActive: true,
        currentBattlePhaseId: BATTLE_PHASE_IDS.COMMAND,
      });

    case ACTION_TYPES.START_DIRECT_BATTLE:
      return createBattleStartGameState(state, {
        setupIsActive: false,
        currentBattlePhaseId: BATTLE_PHASE_IDS.MOVEMENT,
      });

    case ACTION_TYPES.START_CHARGE_DRILL_BATTLE:
      return createBattleStartGameState(state, {
        setupIsActive: false,
        currentBattlePhaseId: BATTLE_PHASE_IDS.MOVEMENT,
        scenario: createChargeDrillScenario(),
      });

    case ACTION_TYPES.START_CONFORM_DRILL_BATTLE:
      return createBattleStartGameState(state, {
        setupIsActive: false,
        currentBattlePhaseId: BATTLE_PHASE_IDS.MOVEMENT,
        scenario: createConformDrillScenario(),
      });

    case ACTION_TYPES.START_SHOOTING_DRILL_BATTLE:
      {
        const baseState = createBattleStartGameState(state, {
          setupIsActive: false,
          currentBattlePhaseId: BATTLE_PHASE_IDS.SHOOTING,
          scenario: createShootingDrillScenario(),
        });
        const game = acknowledgeShootingPhaseProcedure(beginShootingPhaseState({
          ...baseState.game,
          round: {
            ...baseState.game.round,
            roundPhase: ROUND_PHASE_IDS.SHOOTING,
            dialog: { type: null, phaseLabel: null },
          },
        }, {
          phaseId: BATTLE_PHASE_IDS.SHOOTING,
          actingPlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
        }));

        return {
          ...baseState,
          game: {
            ...game,
            shooting: {
              ...game.shooting,
              preview: createInitialShootingPreviewState(),
            },
          },
        };
      }

    case ACTION_TYPES.START_SHOOTING_LOS_EXAMPLE_BATTLE:
      {
        const baseState = createBattleStartGameState(state, {
          setupIsActive: false,
          currentBattlePhaseId: BATTLE_PHASE_IDS.SHOOTING,
          scenario: createShootingLosExampleScenario(),
        });
        const game = acknowledgeShootingPhaseProcedure(beginShootingPhaseState({
          ...baseState.game,
          round: {
            ...baseState.game.round,
            roundPhase: ROUND_PHASE_IDS.SHOOTING,
            dialog: { type: null, phaseLabel: null },
          },
        }, {
          phaseId: BATTLE_PHASE_IDS.SHOOTING,
          actingPlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
        }));

        return {
          ...baseState,
          game: {
            ...game,
            shooting: {
              ...game.shooting,
              preview: createInitialShootingPreviewState(),
            },
          },
        };
      }

    case ACTION_TYPES.START_MELEE_DRILL_BATTLE:
      {
        const baseState = createBattleStartGameState(state, {
          setupIsActive: false,
          currentBattlePhaseId: BATTLE_PHASE_IDS.MELEE,
          scenario: createMeleeDrillScenario(),
        });

        return {
          ...baseState,
          game: beginMeleePhaseState({
            ...baseState.game,
            round: {
              ...baseState.game.round,
              roundPhase: ROUND_PHASE_IDS.COMBAT,
              dialog: {
                type: ROUND_DIALOG_TYPES.PHASE_ANNOUNCE,
                phaseLabel: 'Kampf',
              },
            },
          }, {
            phaseId: BATTLE_PHASE_IDS.MELEE,
            actingPlayerId: COMMAND_PLAYER_IDS.PLAYER_ONE,
          }),
        };
      }

    case ACTION_TYPES.GO_TO_PREVIOUS_SETUP_STEP:
      return reduceGoToPreviousSetupStep(state);

    case ACTION_TYPES.ADVANCE_SETUP_STEP:
      return reduceAdvanceSetupStep(state);

    case ACTION_TYPES.LOCK_CURRENT_SETUP_STEP:
      return reduceLockCurrentSetupStep(state);

    case ACTION_TYPES.DISMISS_CURRENT_SETUP_GUIDE:
      return reduceDismissCurrentSetupGuide(state);

    case ACTION_TYPES.COMPLETE_SETUP:
      {
        const nextState = reduceCompleteSetup(state);
        if (nextState === state) {
          return state;
        }

        return {
          ...nextState,
          game: {
            ...nextState.game,
            initialUnitPositions: createUnitInitialPositionMap(nextState.game.units),
            commandContext: {
              ...nextState.game.commandContext,
              currentPhaseId: nextState.game.phaseTracker.currentBattlePhaseId,
            },
            round: createInitialRoundState(),
          },
        };
      }

    case ACTION_TYPES.SET_SETUP_VIEW_MODE:
      return reduceSetSetupViewMode(state, action.viewMode);

    case ACTION_TYPES.SET_BATTLEFIELD_VIEWPORT:
      return reduceSetBattlefieldViewport(state, action.viewport);

    case ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE:
      {
        const nextGameState = reduceSetActiveBattlePhase(state.game, action.phaseId);
        const clearsShootingPreview = action.phaseId !== BATTLE_PHASE_IDS.SHOOTING;
        return {
          ...state,
          game: {
            ...nextGameState,
            chargePreview: createInitialChargePreview(),
            commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
            shooting: clearsShootingPreview
              ? {
                  ...nextGameState.shooting,
                  preview: createInitialShootingPreviewState(),
                  resolutionDraft: createInitialShootingResolutionDraftState(),
                }
              : nextGameState.shooting,
            units: action.phaseId === BATTLE_PHASE_IDS.MOVEMENT
              ? nextGameState.units.map((unit) => ({
                  ...unit,
                  slideUsedThisMovementPhase: false,
                  stayedThisMovementPhase: false,
                }))
              : nextGameState.units,
          },
        };
      }

    case ACTION_TYPES.SET_ACTIVE_PLAYER:
      return {
        ...state,
        game: reduceSetActivePlayer(state.game, action.playerId),
      };

    case ACTION_TYPES.SELECT_ACTIVE_CORPS:
      return reduceSelectActiveCorpsState(state, action.corpsId, createInitialCommanderFreeMovePreview);

    case ACTION_TYPES.COMPLETE_ACTIVE_CORPS:
      return {
        ...state,
        game: reduceCompleteActiveCorps(state.game, action.corpsId),
      };

    case ACTION_TYPES.CYCLE_OVERLAY_MODE:
      return reduceCycleOverlayMode(state);

    case ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER:
      return reduceAddTerrainPlaceholder(state, action.placeholder);

    case ACTION_TYPES.UPDATE_TERRAIN_PLACEHOLDER:
      return reduceUpdateTerrainPlaceholder(state, action.placeholderId, action.patch);

    case ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER:
      return reduceSelectTerrainPlaceholder(state, action.placeholderId);

    case ACTION_TYPES.LOCK_TERRAIN_PLACEHOLDER:
      return reduceLockTerrainPlaceholder(state, action.placeholderId);

    case ACTION_TYPES.REMOVE_TERRAIN_PLACEHOLDER:
      return reduceRemoveTerrainPlaceholder(state, action.placeholderId);

    case ACTION_TYPES.ADD_SETUP_OBJECT:
      return reduceAddSetupObject(state, action.setupObject);

    case ACTION_TYPES.UPDATE_SETUP_OBJECT:
      return reduceUpdateSetupObject(state, action.setupObjectId, action.patch);

    case ACTION_TYPES.SELECT_SETUP_OBJECT:
      return reduceSelectSetupObject(state, action.setupObjectId);

    case ACTION_TYPES.REMOVE_SETUP_OBJECT:
      return reduceRemoveSetupObject(state, action.setupObjectId);

    case ACTION_TYPES.SELECT_BATTLE_PLAN_CORPS:
      return reduceSelectBattlePlanCorps(state, action.corpsId);

    case ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS:
      return reduceAssignBattlePlanCorps(state, action.corpsId, action.fieldId);

    case ACTION_TYPES.ADD_AMBUSH_MARKER:
      return reduceAddAmbushMarker(state, action.marker);

    case ACTION_TYPES.SELECT_AMBUSH_MARKER:
      return reduceSelectAmbushMarker(state, action.markerId);

    case ACTION_TYPES.UPDATE_AMBUSH_MARKER:
      return reduceUpdateAmbushMarker(state, action.markerId, action.patch);

    case ACTION_TYPES.UPDATE_AMBUSH_MARKER_CONTENTS:
      return reduceUpdateAmbushMarkerContents(state, action.markerId, action.privateContents);

    case ACTION_TYPES.SELECT_UNIT:
      if (isUnitSelectionLockedByPendingMove(state.game, action.unitId ?? null)) {
        return state;
      }

      if (action.unitId) {
        const candidateUnit = state.game.units.find((unit) => unit.id === action.unitId) || null;
        const isMeleePhaseSelection = state.game.commandContext?.currentPhaseId === BATTLE_PHASE_IDS.MELEE
          && (candidateUnit?.engagedInMelee || candidateUnit?.meleePendingOpponentId);
        if (!isMeleePhaseSelection && !isUnitSelectableInCurrentCorps(state, candidateUnit)) {
          return state;
        }
      }

      {
        const selectedGame = syncCommandContextSnapshots({
          ...state.game,
          selectedUnitId: action.unitId,
          commandMenu: createInitialCommandMenuState(),
          advanceModeActive: action.unitId ? state.game.advanceModeActive : createInitialAdvanceState().advanceModeActive,
          advancePreviewUd: createInitialAdvanceState().advancePreviewUd,
          slideModeActive: action.unitId ? state.game.slideModeActive : createInitialSlideState().slideModeActive,
          slidePreviewUd: createInitialSlideState().slidePreviewUd,
          slidePreviewSide: action.unitId ? state.game.slidePreviewSide : createInitialSlideState().slidePreviewSide,
          wheelModeActive: action.unitId ? state.game.wheelModeActive : createInitialWheelState().wheelModeActive,
          wheelPivotSide: action.unitId ? state.game.wheelPivotSide : createInitialWheelState().wheelPivotSide,
          wheelPreviewAngleRadians: action.unitId ? state.game.wheelPreviewAngleRadians : createInitialWheelState().wheelPreviewAngleRadians,
          debug: action.unitId
            ? state.game.debug
            : {
                ...state.game.debug,
                isActive: false,
                showFacingGeometryOverlay: false,
              },
          movement: createInitialMovementState(),
          shooting: {
            ...state.game.shooting,
            preview: createInitialShootingPreviewState(),
            resolutionDraft: createInitialShootingResolutionDraftState(),
          },
          chargePreview: createInitialChargePreview(),
          commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
        }, action.unitId);

        let nextGame = selectedGame;
        if (selectedGame.commandContext?.currentPhaseId === BATTLE_PHASE_IDS.SHOOTING && action.unitId) {
          nextGame = startShootingDeclarationPreview(selectedGame, action.unitId);
        }

        if (selectedGame.commandContext?.currentPhaseId === BATTLE_PHASE_IDS.MELEE && action.unitId) {
          const meleeParticipation = getMeleeUnitParticipation(selectedGame, action.unitId);
          if (meleeParticipation.canStartResolutionDraft) {
            nextGame = startMeleeResolutionDraft(nextGame, { unitId: action.unitId });
          }
        }

        return {
          ...state,
          game: nextGame,
        };
      }

    case ACTION_TYPES.SET_UNIT_POSITION:
      if (state.game.setup.isActive) {
        return reduceSetUnitPositionInSetup(state, action.unitId, action.xUd, action.yUd);
      }

      return reduceSetCommanderPositionInBattle(state, action);

    case ACTION_TYPES.TOGGLE_DEBUG_MODE: {
      if (!state.game.selectedUnitId) {
        return state;
      }

      const selectedUnit = getSelectedUnit(state);
      const nextIsActive = !state.game.debug.isActive;

      return {
        ...state,
        game: {
          ...state.game,
          debug: nextIsActive
            ? {
                ...state.game.debug,
                isActive: true,
                showFacingGeometryOverlay: false,
                unitPose: createDebugUnitPose(selectedUnit),
                unitDimensions: createDebugUnitDimensions(selectedUnit),
              }
            : {
                ...state.game.debug,
                isActive: false,
                showFacingGeometryOverlay: false,
              },
        },
      };
    }

    case ACTION_TYPES.TOGGLE_FACING_GEOMETRY_OVERLAY:
      return {
        ...state,
        game: {
          ...state.game,
          debug: {
            ...state.game.debug,
            showFacingGeometryOverlay: state.game.debug.isActive
              ? !state.game.debug.showFacingGeometryOverlay
              : false,
          },
        },
      };

    case ACTION_TYPES.SET_DEBUG_UNIT_POSITION:
      if (!state.game.debug.isActive) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          debug: {
            ...state.game.debug,
            unitPose: {
              ...state.game.debug.unitPose,
              xUd: action.xUd,
              yUd: action.yUd,
            },
          },
        },
      };

    case ACTION_TYPES.SET_DEBUG_UNIT_ROTATION:
      if (!state.game.debug.isActive) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          debug: {
            ...state.game.debug,
            unitPose: {
              ...state.game.debug.unitPose,
              rotationRadians: normalizeAngleRadians(action.rotationRadians),
            },
          },
        },
      };

    case ACTION_TYPES.SET_SELECTED_UNIT_ROTATION:
      if (!state.game.debug.isActive || !state.game.selectedUnitId) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          units: state.game.units.map((unit) =>
            unit.id === state.game.selectedUnitId
              ? {
                  ...unit,
                  rotationRadians: normalizeAngleRadians(action.rotationRadians),
                }
              : unit,
          ),
        },
      };

    case ACTION_TYPES.SET_ADVANCE_MODE:
      if (action.isActive && !isMovementCommandAllowed(state.game)) {
        return state;
      }
      return {
        ...state,
        game: setActiveCommandMenuBranch({
          ...reduceSetAdvanceMode(state.game, action.isActive),
          ...createInitialSlideState(),
        }, action.isActive ? 'move' : null),
      };

    case ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE: {
      if (!isMovementCommandAllowed(state.game)) {
        return state;
      }
      const selectedUnit = getSelectedUnit(state);
      return {
        ...state,
        game: reduceSetAdvancePreviewDistance(
          state.game,
          action.distanceUd,
          selectedUnit,
          getBattlefieldProfile(state.game.battlefieldProfileId),
        ),
      };
    }

    case ACTION_TYPES.CONFIRM_ADVANCE: {
      if (!isMovementCommandAllowed(state.game)) {
        return state;
      }
      const selectedUnit = getSelectedUnit(state);
      return {
        ...state,
        game: syncAttachedCommanderWithHost(reduceConfirmAdvance(state.game, selectedUnit), selectedUnit?.id),
      };
    }

    case ACTION_TYPES.SET_WHEEL_MODE:
      if (action.isActive && !isMovementCommandAllowed(state.game)) {
        return state;
      }
      return {
        ...state,
        game: setActiveCommandMenuBranch({
          ...reduceSetWheelMode(state.game, action.isActive),
          ...createInitialAdvanceState(),
          ...createInitialSlideState(),
        }, action.isActive ? 'move' : null),
      };

    case ACTION_TYPES.SET_SLIDE_MODE:
      if (action.isActive && !isMovementCommandAllowed(state.game)) {
        return state;
      }
      return {
        ...state,
        game: setActiveCommandMenuBranch({
          ...reduceSetSlideMode(state.game, action.isActive),
          ...createInitialAdvanceState(),
          ...createInitialWheelState(),
        }, action.isActive ? 'move' : null),
      };

    case ACTION_TYPES.SET_SLIDE_PREVIEW_DISTANCE: {
      if (!isMovementCommandAllowed(state.game)) {
        return state;
      }
      const selectedUnit = getSelectedUnit(state);
      return {
        ...state,
        game: reduceSetSlidePreviewDistance(
          state.game,
          action.distanceUd,
          action.slideSide,
          selectedUnit,
          getBattlefieldProfile(state.game.battlefieldProfileId),
        ),
      };
    }

    case ACTION_TYPES.CONFIRM_SLIDE: {
      if (!isMovementCommandAllowed(state.game)) {
        return state;
      }
      const selectedUnit = getSelectedUnit(state);
      return {
        ...state,
        game: syncAttachedCommanderWithHost(reduceConfirmSlide(state.game, selectedUnit), selectedUnit?.id),
      };
    }

    case ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE: {
      if (!isMovementCommandAllowed(state.game)) {
        return state;
      }
      const selectedUnit = getSelectedUnit(state);
      return {
        ...state,
        game: reduceSetWheelPreviewAngle(
          state.game,
          action.angleRadians,
          action.pivotSide,
          selectedUnit,
          getBattlefieldProfile(state.game.battlefieldProfileId),
        ),
      };
    }

    case ACTION_TYPES.CONFIRM_WHEEL: {
      if (!isMovementCommandAllowed(state.game)) {
        return state;
      }
      const selectedUnit = getSelectedUnit(state);
      return {
        ...state,
        game: syncAttachedCommanderWithHost(reduceConfirmWheel(state.game, selectedUnit), selectedUnit?.id),
      };
    }

    case ACTION_TYPES.SELECT_MOVEMENT_COMMAND:
      return {
        ...state,
        game: reduceSelectMovementCommand(state.game, action.commandId),
      };

    case ACTION_TYPES.SET_MOVEMENT_DRAFT:
      return {
        ...state,
        game: reduceSetMovementDraft(state.game, action.draft),
      };

    case ACTION_TYPES.SET_MOVEMENT_PREVIEW:
      return {
        ...state,
        game: reduceSetMovementPreview(state.game, action.preview),
      };

    case ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER:
      return {
        ...state,
        game: reduceSetUseFreeCommandPointForOrder(state.game, action.isActive),
      };

    case ACTION_TYPES.SET_COMMANDER_ENGAGED_DIAGNOSTIC:
      return {
        ...state,
        game: reduceSetCommanderEngagedDiagnostic(state.game, action.isActive),
      };

    case ACTION_TYPES.SET_COMMAND_MENU_BRANCH:
      return {
        ...state,
        game: setActiveCommandMenuBranch(state.game, action.branch ?? null),
      };

    case ACTION_TYPES.OPEN_MELEE_PHASE_PROCEDURE:
      if (!state.game.round || state.game.round.roundPhase !== ROUND_PHASE_IDS.COMBAT) {
        return state;
      }

      if (
        state.game.melee?.status === 'active'
        || state.game.melee?.status === 'preview-ready'
        || state.game.melee?.status === 'applied'
      ) {
        return {
          ...state,
          game: setMeleeProcedureDialogOpen(state.game, true),
        };
      }

      return {
        ...state,
        game: {
          ...state.game,
          round: {
            ...state.game.round,
            dialog: {
              type: ROUND_DIALOG_TYPES.PHASE_ANNOUNCE,
              phaseLabel: 'Kampf',
            },
          },
        },
      };

    case ACTION_TYPES.CLOSE_MELEE_PHASE_PROCEDURE:
      return {
        ...state,
        game: setMeleeProcedureDialogOpen(state.game, false),
      };

    case ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE:
      {
        const nextGameState = acknowledgeMeleePhaseProcedure(state.game);
        const nextRound = nextGameState.round?.dialog?.type === ROUND_DIALOG_TYPES.PHASE_ANNOUNCE
          && nextGameState.round?.roundPhase === ROUND_PHASE_IDS.COMBAT
          ? {
              ...nextGameState.round,
              dialog: null,
            }
          : nextGameState.round;

        return {
          ...state,
          game: {
            ...nextGameState,
            round: nextRound,
          },
        };
      }

    case ACTION_TYPES.TOGGLE_MELEE_QUEUE_SELECTION:
      return {
        ...state,
        game: toggleMeleeQueueSelection(state.game, action.meleeId),
      };

    case ACTION_TYPES.MOVE_MELEE_QUEUE_ENTRY_UP:
      return {
        ...state,
        game: moveMeleeQueueSelection(state.game, action.meleeId, 'up'),
      };

    case ACTION_TYPES.MOVE_MELEE_QUEUE_ENTRY_DOWN:
      return {
        ...state,
        game: moveMeleeQueueSelection(state.game, action.meleeId, 'down'),
      };

    case ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT:
      return {
        ...state,
        game: startMeleeResolutionDraft(state.game, {
          unitId: action.unitId ?? null,
          meleeId: action.meleeId ?? null,
        }),
      };

    case ACTION_TYPES.CANCEL_MELEE_RESOLUTION_DRAFT:
      return {
        ...state,
        game: cancelMeleeResolutionDraft(state.game),
      };

    case ACTION_TYPES.TOGGLE_MELEE_RESOLUTION_DEBUG_FACTOR_OVERRIDE:
      return {
        ...state,
        game: toggleMeleeResolutionCombatFactorDebugOverride(state.game),
      };

    case ACTION_TYPES.SET_MELEE_RESOLUTION_ATTACKER_FACTOR:
      return {
        ...state,
        game: setMeleeResolutionDraftValue(state.game, 'attackerCombatFactorValue', Number(action.value)),
      };

    case ACTION_TYPES.SET_MELEE_RESOLUTION_DEFENDER_FACTOR:
      return {
        ...state,
        game: setMeleeResolutionDraftValue(state.game, 'defenderCombatFactorValue', Number(action.value)),
      };

    case ACTION_TYPES.SET_MELEE_RESOLUTION_ATTACKER_DIE:
      return {
        ...state,
        game: setMeleeResolutionDraftValue(state.game, 'attackerDieRoll', Number(action.dieRoll)),
      };

    case ACTION_TYPES.SET_MELEE_RESOLUTION_DEFENDER_DIE:
      return {
        ...state,
        game: setMeleeResolutionDraftValue(state.game, 'defenderDieRoll', Number(action.dieRoll)),
      };

    case ACTION_TYPES.SET_MELEE_RESOLUTION_ROUND_STATE:
      return {
        ...state,
        game: setMeleeResolutionDraftValue(state.game, 'meleeRoundState', action.value),
      };

    case ACTION_TYPES.TOGGLE_MELEE_RESOLUTION_ATTACKER_COMMANDER_ENGAGED:
      return {
        ...state,
        game: setMeleeResolutionDraftCommanderEngaged(state.game, 'attacker', action.isEngaged),
      };

    case ACTION_TYPES.TOGGLE_MELEE_RESOLUTION_DEFENDER_COMMANDER_ENGAGED:
      return {
        ...state,
        game: setMeleeResolutionDraftCommanderEngaged(state.game, 'defender', action.isEngaged),
      };

    case ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT:
      return {
        ...state,
        game: confirmMeleeResolutionDraft(state.game),
      };

    case ACTION_TYPES.ACKNOWLEDGE_MELEE_RESOLUTION_RESULT:
      return {
        ...state,
        game: acknowledgeMeleeResolutionResult(state.game),
      };

    case ACTION_TYPES.PREVIEW_MELEE_BATCH:
      return {
        ...state,
        game: previewMeleeBatch(state.game),
      };

    case ACTION_TYPES.APPLY_MELEE_BATCH:
      return {
        ...state,
        game: applyMeleeBatch(state.game),
      };

    case ACTION_TYPES.ACKNOWLEDGE_MELEE_BATCH_SUMMARY:
      return {
        ...state,
        game: {
          ...acknowledgeMeleeBatchSummary(state.game),
          round: {
            ...state.game.round,
            roundPhase: ROUND_PHASE_IDS.ROUT_PURSUIT,
            dialog: {
              type: ROUND_DIALOG_TYPES.PHASE_ANNOUNCE,
              phaseLabel: ROUND_PHASE_LABELS[ROUND_PHASE_IDS.ROUT_PURSUIT],
            },
          },
          phaseTracker: {
            ...state.game.phaseTracker,
            currentBattlePhaseId: BATTLE_PHASE_IDS.CLEANUP,
          },
          commandContext: {
            ...state.game.commandContext,
            currentPhaseId: BATTLE_PHASE_IDS.CLEANUP,
          },
        },
      };

    case ACTION_TYPES.ACKNOWLEDGE_SHOOTING_PHASE_PROCEDURE:
      {
        const nextGameState = acknowledgeShootingPhaseProcedure(state.game);
        const nextRound = nextGameState.round?.dialog?.type === 'phase-announce'
          && nextGameState.round?.roundPhase === 'shooting'
          ? {
              ...nextGameState.round,
              dialog: { type: null, phaseLabel: null },
            }
          : nextGameState.round;
        const baseGameState = {
          ...nextGameState,
          round: nextRound,
        };

        return {
          ...state,
          game: maybeOpenShootingSequenceHandoff(baseGameState),
        };
      }

    case ACTION_TYPES.OPEN_SHOOTING_SEQUENCE_HANDOFF:
      return {
        ...state,
        game: openShootingSequenceHandoffDialog(state.game),
      };

    case ACTION_TYPES.DISMISS_SHOOTING_SEQUENCE_HANDOFF:
      return {
        ...state,
        game: dismissShootingSequenceHandoff(state.game),
      };

    case ACTION_TYPES.CONFIRM_SHOOTING_SEQUENCE_HANDOFF:
      return {
        ...state,
        game: confirmShootingSequenceHandoff(state.game),
      };

    case ACTION_TYPES.PASS_ACTIVE_SHOOTER:
      return {
        ...state,
        game: maybeOpenShootingSequenceHandoff(
          passShootingProcedureUnit(state.game, action.unitId ?? state.game.shooting?.procedure?.activeShooterUnitId ?? null),
        ),
      };

    case ACTION_TYPES.START_SHOOTING_DECLARATION_PREVIEW:
      return {
        ...state,
        game: startShootingDeclarationPreview(state.game, action.unitId ?? state.game.selectedUnitId),
      };

    case ACTION_TYPES.SET_SHOOTING_DECLARATION_TARGET:
      return {
        ...state,
        game: setShootingDeclarationTarget(state.game, action.targetUnitId),
      };

    case ACTION_TYPES.CONFIRM_SHOOTING_DECLARATION:
      return {
        ...state,
        game: confirmShootingDeclaration(state.game).nextGameState,
      };

    case ACTION_TYPES.CANCEL_SHOOTING_DECLARATION_PREVIEW:
      return {
        ...state,
        game: cancelShootingDeclarationPreview(state.game),
      };

    case ACTION_TYPES.START_SHOOTING_RESOLUTION_DRAFT:
      return {
        ...state,
        game: startShootingResolutionDraft(state.game, action.unitId ?? state.game.selectedUnitId),
      };

    case ACTION_TYPES.SET_SHOOTING_RESOLUTION_PROTECTION:
      return {
        ...state,
        game: setShootingResolutionDraftProtection(state.game, action.resolvedTargetProtectionValue),
      };

    case ACTION_TYPES.SET_SHOOTING_RESOLUTION_SHOOTER_DIE:
      return {
        ...state,
        game: setShootingResolutionDraftDieRoll(state.game, 'shooter', action.dieRoll),
      };

    case ACTION_TYPES.SET_SHOOTING_RESOLUTION_TARGET_DIE:
      return {
        ...state,
        game: setShootingResolutionDraftDieRoll(state.game, 'target', action.dieRoll),
      };

    case ACTION_TYPES.CONFIRM_SHOOTING_RESOLUTION:
      return {
        ...state,
        game: maybeOpenShootingSequenceHandoff(confirmShootingResolution(state.game)),
      };

    case ACTION_TYPES.CANCEL_SHOOTING_RESOLUTION_DRAFT:
      return {
        ...state,
        game: cancelShootingResolutionDraft(state.game),
      };

    case ACTION_TYPES.START_CHARGE_PREVIEW:
      return reduceStartChargePreview(state, action.unitId ?? state.game.selectedUnitId, {
        canStartChargePreview,
        createChargeIntentFromUnit,
        createInitialCommanderFreeMovePreview,
      });

    case ACTION_TYPES.SET_CHARGE_TARGET:
      return reduceSetChargeTarget(state, action.targetUnitId, {
        createChargeTargetSnapshot,
      });

    case ACTION_TYPES.PREVIEW_CHARGE_START_MANOEUVRE:
      return reducePreviewChargeStartManoeuvre(state, action);

    case ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE:
      return reduceSelectChargeStartManoeuvre(state, action);

    case ACTION_TYPES.SELECT_CHARGE_CONTACT_SIDE:
      return reduceSelectChargeContactSide(state, action);

    case ACTION_TYPES.CONFIRM_CHARGE_DIRECTION:
      return reduceConfirmChargeDirection(state, cloneCommandSnapshot);

    case ACTION_TYPES.CONFIRM_CHARGE_CONFORMATION:
      return reduceConfirmChargeConformation(state);

    case ACTION_TYPES.RESOLVE_CHARGE_REACTION:
      return reduceResolveChargeReaction(state, action.decisionType);

    case ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION:
      return reduceResolveSecondaryChargeReaction(state, action.decisionType);

    case ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL:
      return reduceStartAdjustedChargeDistanceRoll(state);

    case ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE:
      return reduceResolveChargeBranchDistance(state, action.dieRoll);

    case ACTION_TYPES.PREVIEW_EVADE_AVOIDANCE_NODE:
      return reducePreviewEvadeAvoidanceNode(state, action.stepId, getEvadeChoiceFrontierStepIds);

    case ACTION_TYPES.RESET_EVADE_AVOIDANCE_PATH:
      return reduceResetEvadeAvoidancePath(state);

    case ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE:
      return reduceSelectEvadeAvoidanceChoice(state, action.choice);

    case ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF:
      return reduceAcknowledgeEvadeChoiceHandoff(state);

    case ACTION_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE:
      return reduceResolveChargeContinuationChoice(state, action.option);

    case ACTION_TYPES.CANCEL_CHARGE_PREVIEW:
      return reduceCancelChargePreview(state);

    case ACTION_TYPES.ATTACH_COMMANDER:
      return reduceAttachCommander(state, action.unitId ?? state.game.selectedUnitId, createInitialCommanderFreeMovePreview);

    case ACTION_TYPES.DETACH_COMMANDER:
      return reduceDetachCommander(state, action.unitId ?? state.game.selectedUnitId);

    case ACTION_TYPES.CLEAR_MOVEMENT_DRAFT:
      return {
        ...state,
        game: reduceClearMovementDraft(state.game),
      };

    case ACTION_TYPES.CANCEL_MOVEMENT_PREVIEW:
      return {
        ...state,
        game: resetMovementCommandUi(state.game),
      };

    case ACTION_TYPES.CANCEL_COMMANDER_FREE_MOVE_PREVIEW:
      return reduceCancelCommanderFreeMovePreview(state, createInitialCommanderFreeMovePreview);

    case ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE:
      return reduceConfirmCommanderFreeMove(state, createInitialCommanderFreeMovePreview);

    case ACTION_TYPES.RESET_COMMANDER_FREE_MOVE:
      return reduceResetCommanderFreeMove(state, action.unitId ?? state.game.selectedUnitId, createInitialCommanderFreeMovePreview);

    case ACTION_TYPES.MARK_UNIT_STAY:
      return reduceMarkUnitStay(state, action.unitId ?? state.game.selectedUnitId, createInitialCommanderFreeMovePreview);

    case ACTION_TYPES.RESET_TEST_UNITS:
      return reduceResetTestUnits(
        state,
        action.unitId ?? state.game.selectedUnitId,
        createInitialCommanderFreeMovePreview,
        createInitialDebugState,
      );

    case ACTION_TYPES.ROUND_BEGIN:
      return reduceRoundAction(state, reduceRoundBegin);

    case ACTION_TYPES.REQUEST_NEXT_CORPS:
      return reduceRoundAction(state, reduceRequestNextCorps);

    case ACTION_TYPES.CONFIRM_NEXT_CORPS:
      return reduceRoundAction(state, reduceConfirmNextCorps);

    case ACTION_TYPES.SKIP_REMAINING_CORPS:
      return reduceRoundAction(state, reduceSkipRemainingCorps);

    case ACTION_TYPES.ADVANCE_ROUND_PHASE:
      return reduceRoundAction(state, reduceAdvanceRoundPhase);

    default:
      return state;
  }
}

function reduceRoundAction(state, reducerFn) {
  if (!state.game.round) return state;
  const nextGameState = reducerFn(state.game);
  if (nextGameState === state.game) return state;
  return { ...state, game: nextGameState };
}

