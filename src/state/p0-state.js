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
import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_MOVEMENT_CONTINUATION_DECISIONS,
  buildChargeStartSelectionResult,
  CHARGE_HANDOFF_STATUSES,
  CHARGE_CONTACT_EVENT_TYPES,
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_REACTION_DECISION_TYPES,
  CHARGE_REACTION_REQUEST_TYPES,
  CHARGE_TARGET_CANDIDATE_STATUSES,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_START_MANOEUVRE_TYPES,
  CHARGE_START_OPTION_STATUSES,
  EVADE_CHOICE_HANDOFF_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createChargeBranchDistanceState,
  createChargeBranchRollClaim,
  createChargeDeclarationSnapshot,
  createChargeConformationPlan,
  createEvadeChoiceHandoff,
  createChargeFollowThroughResolution,
  createEvadeMoveResolution,
  createEvadePlan,
  createChargeIntent,
  createChargeReactionDecision,
  createChargeReactionRequest,
  createInitialChargePreview,
  getEvadeStepIdPart,
  getChargeReactionDecisionHandoffStatus,
  isChargeReactionDecisionAllowed,
  resolveAdjustedChargeFollowThroughContactState,
  resolveAdjustedChargeFollowThroughPlan,
  resolveIsolatedSingleUnitEvadePlan,
  resolveAdjustedChargeDistanceRoll,
  resolveChargeContactState,
  resolveEvadeDistanceRoll,
  resolveChargeReactionState,
  getChargeTargetCandidateByUnitId,
  getChargeTargetCandidates,
  getChargeStartOptions,
  CHARGE_PATH_FAMILY_IDS,
} from '../engine/charge/index.js';
import {
  getUnitCommandRangeMeasurement,
  refundCommandPointsForUnit,
  refundFreeCommandPoint,
  spendFreeCommandPoint,
} from '../engine/command/index.js';
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
  addVectors,
  getAxesFromRotation,
  getPointDistance,
  getRotatedRectangleBounds,
  normalizeAngleRadians,
  scaleVector,
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
  createInitialRoundState,
  reduceAdvanceRoundPhase,
  reduceConfirmNextCorps,
  reduceRequestNextCorps,
  reduceRoundBegin,
  reduceSkipRemainingCorps,
} from './p0-round.js';

export { SETUP_STEP_DEFINITIONS, SETUP_STEP_IDS, SETUP_VIEW_MODES };

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
  START_CHARGE_PREVIEW: 'game/start-charge-preview',
  SET_CHARGE_TARGET: 'game/set-charge-target',
  PREVIEW_CHARGE_START_MANOEUVRE: 'game/preview-charge-start-manoeuvre',
  SELECT_CHARGE_START_MANOEUVRE: 'game/select-charge-start-manoeuvre',
  SELECT_CHARGE_CONTACT_SIDE: 'game/select-charge-contact-side',
  CONFIRM_CHARGE_DIRECTION: 'game/confirm-charge-direction',
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

function getNextOverlayMode(currentMode) {
  const currentIndex = OVERLAY_MODES.indexOf(currentMode);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % OVERLAY_MODES.length;
  return OVERLAY_MODES[nextIndex];
}

const BATTLEFIELD_VIEWPORT_LIMITS = {
  zoomMin: 1,
  zoomMax: 3,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSelectedUnit(state) {
  return state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
}

function isUnitSelectableInCurrentCorps(state, unit) {
  if (!unit || unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  if (!activeCorpsSlotId) {
    return true;
  }

  return toCorpsSlotId(unit.corpsId) === activeCorpsSlotId;
}

function createScenarioSetupState({ setupIsActive, units, battlefieldProfile, terrainPlaceholders = [], setupObjects = [] }) {
  const baseSetupState = createInitialSetupState(
    setupIsActive,
    getDeploymentSeedUnits(units),
    battlefieldProfile,
  );

  return {
    ...baseSetupState,
    terrain: {
      ...baseSetupState.terrain,
      placeholders: terrainPlaceholders,
      selectedPlaceholderId: terrainPlaceholders[0]?.id ?? null,
    },
    setupObjects: {
      ...baseSetupState.setupObjects,
      placeholders: [...baseSetupState.setupObjects.placeholders, ...setupObjects],
      selectedObjectId: setupObjects[0]?.id ?? null,
    },
  };
}

function createBattleStartGameState(state, { setupIsActive, currentBattlePhaseId, scenario = null }) {
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const sourceUnits = scenario?.units ?? state.game.units;
  const initialUnitPositions = createUnitInitialPositionMap(sourceUnits);
  const nextUnits = sourceUnits.map((unit) => ({
    ...unit,
    xUd: initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
    yUd: initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
    rotationRadians: initialUnitPositions[unit.id]?.rotationRadians ?? unit.rotationRadians ?? 0,
    advanceUsedUd: 0,
    slideUsedThisMovementPhase: false,
    commanderMovePhaseStartXUd: null,
    commanderMovePhaseStartYUd: null,
  }));
  const setupState = createScenarioSetupState({
    setupIsActive,
    units: nextUnits,
    battlefieldProfile,
    terrainPlaceholders: scenario?.terrainPlaceholders ?? state.game.setup.terrain.placeholders,
    setupObjects: scenario?.setupObjects ?? [],
  });

  return {
    ...state,
    shell: {
      ...state.shell,
      currentScreen: SCREEN_IDS.BATTLEFIELD,
    },
    game: {
      ...state.game,
      mode: state.shell.newGame.mode,
      formatId: state.shell.newGame.points === 200 ? 'standard-200' : `p0-${state.shell.newGame.points}`,
      scenarioId: scenario?.id ?? state.game.scenarioId ?? 'standard-direct-battle',
      scenarioLabel: scenario?.label ?? state.game.scenarioLabel ?? null,
      phaseTracker: {
        ...createInitialPhaseTracker(),
        mode: 'battle',
        currentBattlePhaseId,
      },
      setup: setupState,
      setupViewMode: SETUP_VIEW_MODES.CANONICAL,
      viewport: createInitialViewport(),
      commandContext: createInitialCommandContextState(
        currentBattlePhaseId,
        setupState.battlePlan.corpsCards,
      ),
      movement: createInitialMovementState(),
      chargePreview: createInitialChargePreview(),
      ...createInitialAdvanceState(),
      ...createInitialSlideState(),
      ...createInitialWheelState(),
      initialUnitPositions,
      selectedUnitId: null,
      round: setupIsActive ? null : createInitialRoundState(),
      debug: createInitialDebugState(nextUnits[0] ?? null),
      units: nextUnits,
    },
  };
}

function createDebugUnitPose(referenceUnit) {
  return {
    xUd: (referenceUnit?.xUd ?? 10) + 2,
    yUd: referenceUnit?.yUd ?? 10,
    rotationRadians: 0,
  };
}

function createDebugUnitDimensions(referenceUnit) {
  return {
    widthUd: referenceUnit?.widthUd ?? 1,
    depthUd: referenceUnit?.depthUd ?? 1,
  };
}

function createInitialDebugState(referenceUnit = null) {
  return {
    isActive: false,
    showFacingGeometryOverlay: false,
    unitPose: createDebugUnitPose(referenceUnit),
    unitDimensions: createDebugUnitDimensions(referenceUnit),
  };
}

function createInitialViewport() {
  return {
    zoom: 1,
    panX: 0,
    panY: 0,
  };
}

function createInitialPhaseTracker() {
  return {
    mode: 'setup',
    currentBattlePhaseId: BATTLE_PHASE_IDS.COMMAND,
  };
}

function createInitialCommanderFreeMovePreview() {
  return {
    status: 'idle',
    mode: null,
    unitId: null,
    targetUnitId: null,
    xUd: null,
    yUd: null,
    nextSpentUd: null,
    phaseStartXUd: null,
    phaseStartYUd: null,
    attachOriginXUd: null,
    attachOriginYUd: null,
    attachOriginRotationRadians: null,
    attachOriginAdvanceUsedUd: null,
  };
}

function cloneCommandSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }

  return {
    status: snapshot.status ?? 'placeholder',
    unitId: snapshot.unitId ?? null,
    corpsId: snapshot.corpsId ?? null,
    distanceUd: Number.isFinite(snapshot.distanceUd) ? snapshot.distanceUd : null,
    commandRangeUd: Number.isFinite(snapshot.commandRangeUd) ? snapshot.commandRangeUd : null,
    label: snapshot.label ?? '',
    sourceStatus: snapshot.sourceStatus ?? 'placeholder',
  };
}

function createChargeIntentFromUnit(gameState, unit) {
  return createChargeIntent({
    unitId: unit.id,
    startPose: {
      xUd: Number(unit.xUd),
      yUd: Number(unit.yUd),
      rotationRadians: Number(unit.rotationRadians ?? 0),
    },
    commandSnapshot: cloneCommandSnapshot(gameState.commandContext?.inCommand),
  });
}

function createChargeTargetSnapshot(unit) {
  if (!unit) {
    return null;
  }

  return {
    unitId: unit.id,
    owner: unit.owner ?? null,
    corpsId: unit.corpsId ?? null,
    xUd: Number(unit.xUd),
    yUd: Number(unit.yUd),
    rotationRadians: Number(unit.rotationRadians ?? 0),
  };
}

export function getChargePreviewUnavailableReason(state, unit = state.game.units.find((candidate) => candidate.id === state.game.selectedUnitId) || null) {
  if (!unit) {
    return 'Waehle zuerst eine Einheit fuer Charge aus.';
  }

  if (state.game.setup.isActive) {
    return 'Charge bleibt waehrend des Setups gesperrt.';
  }

  if (state.game.commandContext.currentPhaseId !== BATTLE_PHASE_IDS.MOVEMENT) {
    return 'Charge ist nur in der Movement-Phase verfuegbar.';
  }

  if (!isUnitSelectableInCurrentCorps(state, unit)) {
    return 'Charge ist nur fuer Einheiten des aktiven Corps und aktiven Spielers verfuegbar.';
  }

  if (hasUnitFinishedMovementPhase(unit)) {
    return 'Diese Einheit hat ihre Bewegung in dieser Phase bereits beendet und kann nicht mehr chargen.';
  }

  if (state.game.chargePreview?.status && state.game.chargePreview.status !== CHARGE_PREVIEW_STATUSES.IDLE) {
    return 'Eine andere Charge-Vorschau ist noch offen. Erst abschliessen oder abbrechen.';
  }

  const hasPendingMovementPreview = Array.isArray(state.game.movement?.preview?.segments)
    && state.game.movement.preview.segments.length > 0;
  if (hasPendingMovementPreview) {
    return 'Charge kann erst gestartet werden, wenn die laufende Bewegungs-Vorschau bestaetigt oder verworfen wurde.';
  }

  const hasPendingCommanderPreview = state.game.commanderFreeMovePreview?.status === 'targeting'
    || state.game.commanderFreeMovePreview?.status === 'ready';
  if (hasPendingCommanderPreview) {
    return 'Charge kann nicht waehrend einer laufenden Kommandeurs-Vorschau gestartet werden.';
  }

  return null;
}

export function canStartChargePreview(state, unit = state.game.units.find((candidate) => candidate.id === state.game.selectedUnitId) || null) {
  return getChargePreviewUnavailableReason(state, unit) === null;
}

export function canConfirmChargePreviewDirection(preview) {
  return canConfirmChargeDirection(preview);
}

function isUnitSelectionLockedByPendingMove(gameState, nextUnitId) {
  if (nextUnitId === gameState.selectedUnitId) {
    return false;
  }

  const hasPendingMovementPreview = Array.isArray(gameState.movement?.preview?.segments)
    && gameState.movement.preview.segments.length > 0;
  const hasPendingCommanderPreview = gameState.commanderFreeMovePreview?.status === 'targeting'
    || gameState.commanderFreeMovePreview?.status === 'ready';
  const hasPendingChargePreview = gameState.chargePreview?.status
    && gameState.chargePreview.status !== CHARGE_PREVIEW_STATUSES.IDLE;

  return hasPendingMovementPreview || hasPendingCommanderPreview || hasPendingChargePreview;
}

function resetMovementCommandUi(gameState) {
  return {
    ...gameState,
    movement: createInitialMovementState(),
    chargePreview: createInitialChargePreview(),
    commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
    ...createInitialAdvanceState(),
    ...createInitialSlideState(),
    ...createInitialWheelState(),
  };
}

function reduceSetCommanderEngagedDiagnostic(gameState, isEngaged) {
  if (gameState.setup.isActive || !gameState.commandContext?.commander?.unitId) {
    return gameState;
  }

  const nextGameState = syncCommandContextSnapshots({
    ...gameState,
    commandContext: {
      ...gameState.commandContext,
      commander: {
        ...gameState.commandContext.commander,
        engagedInCombat: Boolean(isEngaged),
      },
    },
  });

  return {
    ...nextGameState,
    movement: withMovementValidationSnapshot(nextGameState, nextGameState.movement),
  };
}

function reduceStartChargePreview(state, unitId = state.game.selectedUnitId) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  if (!canStartChargePreview(state, unit)) {
    return state;
  }

  const targetCandidates = getChargeTargetCandidates({
    units: state.game.units,
    chargingUnitId: unit.id,
    battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
  });

  return {
    ...state,
    game: {
      ...state.game,
      movement: createInitialMovementState(),
      chargePreview: createInitialChargePreview({
        status: CHARGE_PREVIEW_STATUSES.TARGETING,
        intent: createChargeIntentFromUnit(state.game, unit),
        targetCandidates,
        conformationPlan: createChargeConformationPlan(),
      }),
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      ...createInitialAdvanceState(),
      ...createInitialSlideState(),
      ...createInitialWheelState(),
    },
  };
}

function reduceSetChargeTarget(state, targetUnitId) {
  const preview = state.game.chargePreview;
  if (preview?.status !== CHARGE_PREVIEW_STATUSES.TARGETING || !preview.intent?.unitId || !targetUnitId) {
    return state;
  }

  const chargingUnit = state.game.units.find((unit) => unit.id === preview.intent.unitId) || null;
  const targetUnit = state.game.units.find((unit) => unit.id === targetUnitId) || null;
  const candidate = getChargeTargetCandidateByUnitId(preview.targetCandidates, targetUnitId);
  if (
    !chargingUnit
    || !targetUnit
    || !candidate
    || candidate.status !== CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE
    || chargingUnit.id === targetUnit.id
    || chargingUnit.owner === targetUnit.owner
  ) {
    return state;
  }

  const defaultStartResult = buildChargeStartSelectionResult({
    selectedUnit: chargingUnit,
    targetSnapshot: createChargeTargetSnapshot(targetUnit),
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
  });
  const remainingChargeRangeUd = Math.max(
    0,
    getUnitMovementBudgetUd({ selectedUnit: chargingUnit, units: state.game.units }) - Number(defaultStartResult?.startManoeuvre?.spentBudgetUd ?? 0),
  );
  const currentStartTargetCandidates = defaultStartResult?.startPose
    ? getChargeTargetCandidates({
        units: state.game.units,
        chargingUnitId: chargingUnit.id,
        battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
        chargeContext: {
          startPose: defaultStartResult.startPose,
          remainingChargeRangeUd,
          allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
        },
      })
    : preview.targetCandidates;
  const currentStartTargetCandidate = getChargeTargetCandidateByUnitId(currentStartTargetCandidates, targetUnit.id);
  const currentPathContactState = resolveChargeContactState({
    selectedUnit: chargingUnit,
    targetUnit,
    pathSegments: defaultStartResult?.pathSegments ?? [],
    battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
    units: state.game.units,
  });
  const useCurrentPathContactState = currentStartTargetCandidate?.status === CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE;
  const nextContactEvents = useCurrentPathContactState ? currentPathContactState.contactEvents : [];
  const nextReactionState = useCurrentPathContactState
    ? getChargeReactionPreviewState({
        selectedUnit: chargingUnit,
        targetUnit,
        pathSegments: currentPathContactState.pathSegments,
        contactEvents: nextContactEvents,
        units: state.game.units,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents)?.side ?? null,
      })
    : { reactionRequests: [], diagnostics: [], hasPendingReaction: false };
  const nextStatus = useCurrentPathContactState
    ? CHARGE_PREVIEW_STATUSES.READY
    : CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING;

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: nextStatus,
        startManoeuvreOptions: getChargeStartOptions({
          selectedUnit: chargingUnit,
          targetSnapshot: createChargeTargetSnapshot(targetUnit),
          battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
        }),
        targetCandidates: currentStartTargetCandidates,
        pathSegments: useCurrentPathContactState
          ? currentPathContactState.pathSegments
          : (defaultStartResult?.pathSegments ?? []),
        contactEvents: nextContactEvents,
        reactionRequests: useCurrentPathContactState ? nextReactionState.reactionRequests : [],
        declarationSnapshot: null,
        reactionDecision: null,
        handoffStatus: CHARGE_HANDOFF_STATUSES.NONE,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents),
        diagnostics: [
          ...(currentStartTargetCandidate?.diagnostics ?? candidate.diagnostics),
          ...(defaultStartResult?.diagnostics ?? []),
          ...(useCurrentPathContactState ? currentPathContactState.diagnostics : []),
          ...(useCurrentPathContactState ? nextReactionState.diagnostics : []),
        ],
        intent: createChargeIntent({
          ...preview.intent,
          targetUnitId: targetUnit.id,
          targetSnapshot: createChargeTargetSnapshot(targetUnit),
          startManoeuvre: defaultStartResult?.startManoeuvre ?? null,
          frozenDirectionRadians: defaultStartResult?.frozenDirectionRadians ?? null,
        }),
      }),
    },
  };
}

function reduceSelectChargeStartManoeuvre(state, action) {
  const preview = state.game.chargePreview;
  const manoeuvreType = action?.manoeuvreType;
  if (
    !manoeuvreType
    || !preview?.intent?.unitId
    || ![CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING, CHARGE_PREVIEW_STATUSES.READY].includes(preview.status)
  ) {
    return state;
  }

  const selectedUnit = state.game.units.find((unit) => unit.id === preview.intent.unitId) || null;
  const option = (preview.startManoeuvreOptions ?? []).find((candidate) => candidate.type === manoeuvreType) || null;
  if (!selectedUnit || !option || option.status !== CHARGE_START_OPTION_STATUSES.AVAILABLE) {
    return state;
  }

  const targetSnapshot = preview.intent?.targetSnapshot ?? null;
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const result = buildChargeStartSelectionResult({
    selectedUnit,
    targetSnapshot,
    manoeuvreType,
    battlefieldProfile,
    slideSide: action?.slideSide,
    slideDistanceUd: action?.distanceUd,
    pivotSide: action?.pivotSide,
    wheelAngleRadians: action?.angleRadians,
  });
  if (!result) {
    return state;
  }

  if (!result.startPose) {
    return {
      ...state,
      game: {
        ...state.game,
        chargePreview: createInitialChargePreview({
          ...preview,
          status: CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING,
          diagnostics: result.diagnostics,
        }),
      },
    };
  }

  const remainingChargeRangeUd = Math.max(
    0,
    getUnitMovementBudgetUd({ selectedUnit, units: state.game.units }) - Number(result.startManoeuvre?.spentBudgetUd ?? 0),
  );
  const targetCandidates = getChargeTargetCandidates({
    units: state.game.units,
    chargingUnitId: selectedUnit.id,
    battlefieldProfile,
    chargeContext: {
      startPose: result.startPose,
      remainingChargeRangeUd,
      allowedPathFamilies: ['advance'],
    },
  });
  const selectedTargetCandidate = getChargeTargetCandidateByUnitId(targetCandidates, targetSnapshot?.unitId);
  const currentPathContactState = resolveChargeContactState({
    selectedUnit,
    targetUnit: state.game.units.find((unit) => unit.id === targetSnapshot?.unitId) || null,
    pathSegments: result.pathSegments,
    battlefieldProfile,
    units: state.game.units,
  });
  const useCurrentPathContactState = selectedTargetCandidate?.status === CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE;
  const nextContactEvents = useCurrentPathContactState ? currentPathContactState.contactEvents : [];
  const nextReactionState = useCurrentPathContactState
    ? getChargeReactionPreviewState({
        selectedUnit,
        targetUnit: state.game.units.find((unit) => unit.id === targetSnapshot?.unitId) || null,
        pathSegments: currentPathContactState.pathSegments,
        contactEvents: nextContactEvents,
        units: state.game.units,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents)?.side ?? null,
      })
    : { reactionRequests: [], diagnostics: [], hasPendingReaction: false };
  const nextStatus = useCurrentPathContactState
    ? CHARGE_PREVIEW_STATUSES.READY
    : CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING;

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: nextStatus,
        targetCandidates,
        pathSegments: useCurrentPathContactState ? currentPathContactState.pathSegments : result.pathSegments,
        contactEvents: nextContactEvents,
        reactionRequests: useCurrentPathContactState ? nextReactionState.reactionRequests : [],
        declarationSnapshot: null,
        reactionDecision: null,
        handoffStatus: CHARGE_HANDOFF_STATUSES.NONE,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents),
        diagnostics: [
          ...(selectedTargetCandidate?.diagnostics ?? []),
          ...result.diagnostics,
          ...(useCurrentPathContactState ? currentPathContactState.diagnostics : []),
          ...(useCurrentPathContactState ? nextReactionState.diagnostics : []),
        ],
        intent: createChargeIntent({
          ...preview.intent,
          startManoeuvre: result.startManoeuvre,
          startPose: result.startPose,
          frozenDirectionRadians: result.frozenDirectionRadians,
        }),
      }),
    },
  };
}

function reducePreviewChargeStartManoeuvre(state, action) {
  const preview = state.game.chargePreview;
  const manoeuvreType = action?.manoeuvreType;
  if (
    !manoeuvreType
    || !preview?.intent?.unitId
    || ![CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING, CHARGE_PREVIEW_STATUSES.READY].includes(preview.status)
  ) {
    return state;
  }

  const selectedUnit = state.game.units.find((unit) => unit.id === preview.intent.unitId) || null;
  const option = (preview.startManoeuvreOptions ?? []).find((candidate) => candidate.type === manoeuvreType) || null;
  if (!selectedUnit || !option || option.status !== CHARGE_START_OPTION_STATUSES.AVAILABLE) {
    return state;
  }

  const result = buildChargeStartSelectionResult({
    selectedUnit,
    targetSnapshot: preview.intent?.targetSnapshot ?? null,
    manoeuvreType,
    battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
    slideSide: action?.slideSide,
    slideDistanceUd: action?.distanceUd,
    pivotSide: action?.pivotSide,
    wheelAngleRadians: action?.angleRadians,
  });
  if (!result) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING,
        pathSegments: result.pathSegments,
        contactEvents: [],
        selectedContactSide: null,
        diagnostics: result.diagnostics,
        intent: createChargeIntent({
          ...preview.intent,
          startManoeuvre: result.startManoeuvre,
          startPose: result.startPose,
          frozenDirectionRadians: result.frozenDirectionRadians,
        }),
      }),
    },
  };
}

function reduceCancelChargePreview(state) {
  if (state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.IDLE) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview(),
    },
  };
}

function getChargeContactSideOptions(classification) {
  if (!classification?.type) {
    return [];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    return ['front'];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    return ['rear'];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK) {
    return classification.flankSide ? [classification.flankSide] : [];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK) {
    return classification.flankSide ? ['rear', classification.flankSide] : ['rear'];
  }

  return [];
}

function resolveChargeContactSideSelection(currentSelection, contactEvents) {
  const primaryContactEvent = Array.isArray(contactEvents) ? (contactEvents[0] ?? null) : null;
  const classification = primaryContactEvent?.classification ?? null;
  if (
    !primaryContactEvent?.defenderId
    || classification?.type !== CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
  ) {
    return null;
  }

  const allowedSides = getChargeContactSideOptions(classification);
  if (
    currentSelection?.defenderId === primaryContactEvent.defenderId
    && allowedSides.includes(currentSelection.side)
  ) {
    return currentSelection;
  }

  return null;
}

function getChargeReactionPreviewState({ selectedUnit, targetUnit, pathSegments, contactEvents, units = [], selectedContactSide = null }) {
  const reactionState = resolveChargeReactionState({
    chargingUnit: selectedUnit,
    targetUnit,
    contactEvents,
    pathSegments,
    units,
    selectedContactSide,
  });
  const hasPendingReaction = reactionState.reactionRequests.some(
    (request) => request.type !== CHARGE_REACTION_REQUEST_TYPES.NONE && request.status === 'pending',
  );

  return {
    ...reactionState,
    hasPendingReaction,
  };
}

function getPrimaryChargeReactionRequest(preview) {
  return Array.isArray(preview?.reactionRequests) ? (preview.reactionRequests[0] ?? null) : null;
}

function chargePreviewRequiresContactSideSelection(preview) {
  const classification = preview?.contactEvents?.[0]?.classification ?? null;
  return classification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
    && !preview?.selectedContactSide?.side;
}

function canConfirmChargeDirection(preview) {
  return preview?.status === CHARGE_PREVIEW_STATUSES.READY
    && Boolean(preview?.intent?.unitId)
    && Boolean(preview?.intent?.targetUnitId)
    && Array.isArray(preview?.pathSegments)
    && preview.pathSegments.length > 0
    && Array.isArray(preview?.contactEvents)
    && preview.contactEvents.length > 0
    && !chargePreviewRequiresContactSideSelection(preview);
}

function createChargeDirectionSnapshot(gameState, preview) {
  return createChargeDeclarationSnapshot({
    unitId: preview.intent?.unitId ?? null,
    targetUnitId: preview.intent?.targetUnitId ?? null,
    targetSnapshot: preview.intent?.targetSnapshot ?? null,
    startPose: preview.intent?.startPose ?? null,
    startManoeuvre: preview.intent?.startManoeuvre ?? null,
    frozenDirectionRadians: preview.intent?.frozenDirectionRadians ?? null,
    commandSnapshot: cloneCommandSnapshot(gameState.commandContext?.inCommand ?? preview.intent?.commandSnapshot),
    selectedContactSide: preview.selectedContactSide ?? null,
    pathSegments: preview.pathSegments,
    contactEvent: preview.contactEvents?.[0] ?? null,
    reactionRequests: preview.reactionRequests,
  });
}

function completeChargeReactionRequests(reactionRequests) {
  return Array.isArray(reactionRequests)
    ? reactionRequests.map((request) => ({
        ...request,
        status: 'complete',
      }))
    : [];
}

function reanchorChargePreviewToSecondaryTarget(preview, gameState, secondaryRequest, secondaryDeclarationSnapshot) {
  if (!secondaryRequest?.unitId || !secondaryDeclarationSnapshot) {
    return preview;
  }

  const secondaryTargetSnapshot = gameState.units.find((unit) => unit.id === secondaryRequest.unitId) ?? null;

  return {
    ...preview,
    intent: preview?.intent
      ? {
          ...preview.intent,
          targetUnitId: secondaryRequest.unitId,
          targetSnapshot: secondaryTargetSnapshot,
        }
      : preview?.intent ?? null,
    declarationSnapshot: secondaryDeclarationSnapshot,
    followThroughResolution: createChargeFollowThroughResolution({
      ...preview?.followThroughResolution,
      selectedTargetId: secondaryRequest.unitId,
    }),
  };
}

function createChargeReactionBranchDistanceClaim(gameState, preview, reactionRequest, handoffStatus, declarationSnapshot) {
  if (handoffStatus !== CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED) {
    return createChargeBranchDistanceState();
  }

  return createChargeBranchDistanceState({
    claim: createChargeBranchRollClaim({
      reason: CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE,
      actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
      reactingUnitId: reactionRequest?.unitId ?? preview.intent?.targetUnitId ?? null,
      chargingUnitId: preview.intent?.unitId ?? null,
      targetUnitId: reactionRequest?.unitId ?? preview.intent?.targetUnitId ?? null,
      declarationSnapshot: declarationSnapshot ?? null,
      actionLogToken: reactionRequest?.actionLogToken ?? null,
    }),
  });
}

function createChargeBranchDistanceClaim(gameState, preview, primaryRequest, handoffStatus) {
  return createChargeReactionBranchDistanceClaim(
    gameState,
    preview,
    primaryRequest,
    handoffStatus,
    preview?.declarationSnapshot ?? null,
  );
}

function createAdjustedChargeDistanceClaim(gameState, preview) {
  const nextHistory = Array.isArray(preview?.branchDistanceRoll?.history)
    ? preview.branchDistanceRoll.history.map((entry) => createChargeBranchDistanceState(entry))
    : [];

  if (preview?.branchDistanceRoll?.claim || preview?.branchDistanceRoll?.result) {
    nextHistory.push(createChargeBranchDistanceState({
      claim: preview?.branchDistanceRoll?.claim ?? null,
      result: preview?.branchDistanceRoll?.result ?? null,
    }));
  }

  return createChargeBranchDistanceState({
    history: nextHistory,
    claim: createChargeBranchRollClaim({
      reason: CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE,
      actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
      reactingUnitId: preview?.reactionDecision?.unitId ?? preview.intent?.targetUnitId ?? null,
      chargingUnitId: preview.intent?.unitId ?? null,
      targetUnitId: preview.intent?.targetUnitId ?? null,
      declarationSnapshot: preview.declarationSnapshot ?? null,
      actionLogToken: preview?.branchDistanceRoll?.claim?.actionLogToken ?? null,
    }),
  });
}

function getChargeBranchDistanceRollBaseUd(gameState, preview) {
  const reason = preview?.branchDistanceRoll?.claim?.reason ?? null;
  const unitId = reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE
    ? preview?.intent?.unitId ?? null
    : preview?.branchDistanceRoll?.claim?.reactingUnitId
      ?? preview?.secondaryReactionDecision?.unitId
      ?? preview?.reactionDecision?.unitId
      ?? preview?.intent?.targetUnitId
      ?? null;
  const targetUnit = gameState.units.find((unit) => unit.id === unitId) ?? null;

  return getUnitMovementBudgetUd({
    selectedUnit: targetUnit,
    units: gameState.units,
  });
}

function shouldNeverReduceChargeBranchDistance(gameState, preview) {
  const reason = preview?.branchDistanceRoll?.claim?.reason ?? null;
  if (reason !== CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
    return false;
  }

  const chargingUnitId = preview?.intent?.unitId ?? null;
  const chargingUnit = gameState.units.find((unit) => unit.id === chargingUnitId) ?? null;
  return String(chargingUnit?.troopType ?? '').toLowerCase() === 'heavy-infantry';
}

function resolveChargeBranchDistanceResult(gameState, preview, dieRoll) {
  const claim = preview?.branchDistanceRoll?.claim ?? null;
  if (!claim) {
    return null;
  }

  const baseDistanceUd = getChargeBranchDistanceRollBaseUd(gameState, preview);
  if (claim.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
    return resolveAdjustedChargeDistanceRoll({
      dieRoll,
      baseDistanceUd,
      claim,
      neverReduce: shouldNeverReduceChargeBranchDistance(gameState, preview),
    });
  }

  return resolveEvadeDistanceRoll({
    dieRoll,
    baseDistanceUd,
    claim,
  });
}

function resolveChargePreviewEvadePlan(gameState, preview, result) {
  if (preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE) {
    return null;
  }

  const reactingUnitId = preview?.branchDistanceRoll?.claim?.reactingUnitId
    ?? preview?.secondaryReactionDecision?.unitId
    ?? preview?.reactionDecision?.unitId
    ?? preview?.intent?.targetUnitId
    ?? null;
  const reactingUnit = gameState.units.find((unit) => unit.id === reactingUnitId) ?? null;
  const primaryContactEvent = preview?.branchDistanceRoll?.claim?.declarationSnapshot?.contactEvent
    ?? preview?.contactEvents?.[0]
    ?? null;

  if (!reactingUnit || !primaryContactEvent?.classification || !primaryContactEvent?.contactSnapshot) {
    return createEvadePlan({ sourceStatus: 'needs-source-check' });
  }

  return resolveIsolatedSingleUnitEvadePlan({
    reactingUnit,
    contactClassification: primaryContactEvent.classification,
    selectedContactSide: preview?.selectedContactSide?.side ?? null,
    contactSnapshot: primaryContactEvent.contactSnapshot,
    chargeDirectionRadians: preview?.branchDistanceRoll?.claim?.declarationSnapshot?.frozenDirectionRadians ?? null,
    distanceRollResult: result,
    battlefieldProfile: getBattlefieldProfile(gameState.battlefieldProfileId),
    units: gameState.units,
    ignoredUnitIds: [reactingUnit.id ?? null, preview?.intent?.unitId ?? null].filter(Boolean),
  });
}

function createEvadeMoveResolutionFromPlan(gameState, preview, evadePlan) {
  if (!evadePlan?.reactingUnitId || !evadePlan?.endPose) {
    return createEvadeMoveResolution({
      status: EVADE_MOVE_RESOLUTION_STATUSES.SOURCE_OPEN,
      reactingUnitId: evadePlan?.reactingUnitId ?? null,
      actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
      declarationSnapshot: preview?.branchDistanceRoll?.claim?.declarationSnapshot ?? null,
      diagnostics: evadePlan?.diagnostics ?? [],
      sourceStatus: evadePlan?.sourceStatus ?? 'needs-source-check',
      notice: 'Evade movement could not be committed because the resolved plan is incomplete.',
    });
  }

  const sourceOpen = evadePlan.sourceStatus === 'needs-source-check'
    || (evadePlan.diagnostics ?? []).some((diagnostic) => diagnostic?.status === 'warn' || diagnostic?.sourceStatus === 'needs-source-check');
  const choiceRequired = Boolean(evadePlan.choiceRequired);

  return createEvadeMoveResolution({
    status: choiceRequired
      ? EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
      : sourceOpen
        ? EVADE_MOVE_RESOLUTION_STATUSES.SOURCE_OPEN
        : EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED,
    reactingUnitId: evadePlan.reactingUnitId,
    actingPlayerId: gameState.commandContext?.activePlayerId ?? null,
    declarationSnapshot: preview?.branchDistanceRoll?.claim?.declarationSnapshot ?? null,
    startPose: evadePlan.startPose,
    reorientedPose: evadePlan.reorientedPose,
    finalPose: evadePlan.endPose,
    distanceUd: evadePlan.distanceUd,
    spentAvoidanceUd: evadePlan.spentAvoidanceUd ?? 0,
    remainingDistanceUd: evadePlan.remainingDistanceUd ?? evadePlan.distanceUd,
    rollResult: evadePlan.rollResult,
    avoidanceSteps: evadePlan.avoidanceSteps ?? [],
    avoidanceCandidates: evadePlan.avoidanceCandidates ?? [],
    choicePathStepIds: [],
    choiceRequired,
    autoCommit: !sourceOpen && !choiceRequired,
    notice: choiceRequired
      ? 'Evade movement requires a defender choice before it can be committed.'
      : sourceOpen
        ? 'Evade movement remains source-open and cannot be committed before adjusted charge distance.'
      : 'Evade movement has no supported player choice and is committed before adjusted charge distance.',
    cannotShootHook: !sourceOpen && !choiceRequired,
    repeatEvadeHook: !sourceOpen && !choiceRequired ? { increment: 1 } : null,
    diagnostics: evadePlan.diagnostics ?? [],
    sourceStatus: evadePlan.sourceStatus,
  });
}

function resolveEvadePlanAvoidanceChoice(evadePlan, choice = {}) {
  const candidates = Array.isArray(evadePlan?.avoidanceCandidates) ? evadePlan.avoidanceCandidates : [];
  const selectedCandidate = candidates.find((candidate) => candidate?.id && candidate.id === choice.candidateId)
    ?? candidates.find((candidate) => (
      candidate?.type === 'slide'
      && candidate.side === choice.side
      && Number(candidate.distanceUd ?? candidate.spentDistanceUd ?? 0) === Number(choice.distanceUd ?? candidate.distanceUd ?? 0)
    ))
    ?? null;

  if (!selectedCandidate?.endPose) {
    return null;
  }

  return createEvadePlan({
    ...evadePlan,
    endPose: selectedCandidate.endPose,
    spentAvoidanceUd: selectedCandidate.spentDistanceUd ?? selectedCandidate.distanceUd ?? 0,
    remainingDistanceUd: selectedCandidate.remainingDistanceUd ?? Math.max(0, Number(evadePlan.distanceUd ?? 0) - Number(selectedCandidate.distanceUd ?? 0)),
    avoidanceSteps: selectedCandidate.type === 'straight'
      ? []
      : (selectedCandidate.avoidanceSteps?.length > 0 ? selectedCandidate.avoidanceSteps : [selectedCandidate]),
    choiceRequired: false,
    diagnostics: [],
    sourceStatus: 'verified',
  });
}

function getEvadeCandidateAvoidanceSteps(candidate) {
  if (Array.isArray(candidate?.avoidanceSteps) && candidate.avoidanceSteps.length > 0) {
    return candidate.avoidanceSteps;
  }

  if (candidate?.type === 'straight') {
    return [];
  }

  return candidate ? [candidate] : [];
}

function doesEvadeCandidateMatchChoicePath(candidate, choicePathStepIds = []) {
  if (!Array.isArray(choicePathStepIds) || choicePathStepIds.length === 0) {
    return true;
  }

  const steps = getEvadeCandidateAvoidanceSteps(candidate);
  if (steps.length < choicePathStepIds.length) {
    return false;
  }

  return choicePathStepIds.every((stepId, index) => getEvadeStepIdPart(steps[index]) === stepId);
}

function getEvadeChoiceFrontierStepIds(candidates = [], choicePathStepIds = []) {
  const nextStepIds = new Set();

  candidates.forEach((candidate) => {
    if (!doesEvadeCandidateMatchChoicePath(candidate, choicePathStepIds)) {
      return;
    }

    const steps = getEvadeCandidateAvoidanceSteps(candidate);
    const nextStep = steps[choicePathStepIds.length] ?? null;
    const nextStepId = getEvadeStepIdPart(nextStep);
    if (nextStepId) {
      nextStepIds.add(nextStepId);
    }
  });

  return nextStepIds;
}

function reducePreviewEvadeAvoidanceNode(state, stepId) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
    || !preview?.branchDistanceRoll?.result
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || !preview?.evadePlan?.choiceRequired
    || preview?.evadeChoiceHandoff?.status !== EVADE_CHOICE_HANDOFF_STATUSES.ACKNOWLEDGED
    || !stepId
  ) {
    return state;
  }

  const currentPathStepIds = Array.isArray(preview.evadeMove?.choicePathStepIds)
    ? preview.evadeMove.choicePathStepIds
    : [];
  const nextFrontierStepIds = getEvadeChoiceFrontierStepIds(preview.evadeMove?.avoidanceCandidates ?? [], currentPathStepIds);

  let nextPathStepIds = currentPathStepIds;
  if (nextFrontierStepIds.has(stepId)) {
    nextPathStepIds = [...currentPathStepIds, stepId];
  } else if (currentPathStepIds[currentPathStepIds.length - 1] === stepId) {
    nextPathStepIds = currentPathStepIds.slice(0, -1);
  } else {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        evadeMove: createEvadeMoveResolution({
          ...preview.evadeMove,
          choicePathStepIds: nextPathStepIds,
        }),
      }),
    },
  };
}

function reduceResetEvadeAvoidancePath(state) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || !Array.isArray(preview?.evadeMove?.choicePathStepIds)
    || preview.evadeMove.choicePathStepIds.length === 0
  ) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        evadeMove: createEvadeMoveResolution({
          ...preview.evadeMove,
          choicePathStepIds: [],
        }),
      }),
    },
  };
}

function getUnitScenarioLabel(gameState, unitId) {
  const unit = gameState?.units?.find((candidate) => candidate.id === unitId) ?? null;
  return unit?.scenarioLabel ?? unit?.id ?? unitId ?? 'unknown unit';
}

function getSetupViewModeForPlayer(playerId) {
  return playerId === COMMAND_PLAYER_IDS.PLAYER_TWO
    ? SETUP_VIEW_MODES.PLAYER_TWO
    : SETUP_VIEW_MODES.PLAYER_ONE;
}

function createEvadeChoiceHandoffFromMove(gameState, evadeMove) {
  if (evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED || !evadeMove?.reactingUnitId) {
    return createEvadeChoiceHandoff();
  }

  const reactingUnit = gameState.units.find((unit) => unit.id === evadeMove.reactingUnitId) ?? null;
  const reactingPlayerId = reactingUnit?.owner ?? null;
  const targetLabel = getUnitScenarioLabel(gameState, evadeMove.reactingUnitId);

  return createEvadeChoiceHandoff({
    status: EVADE_CHOICE_HANDOFF_STATUSES.PENDING,
    reactingUnitId: evadeMove.reactingUnitId,
    reactingPlayerId,
    targetLabel,
    prompt: `${targetLabel} darf ausweichen. Bitte Spieler ${reactingPlayerId === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'B' : 'A'} den Ausweichzug machen.`,
    nextViewMode: getSetupViewModeForPlayer(reactingPlayerId),
    returnViewMode: gameState.setupViewMode ?? SETUP_VIEW_MODES.CANONICAL,
  });
}

function isEvadeMoveCommitted(evadeMove) {
  return evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED
    && Boolean(evadeMove?.reactingUnitId)
    && Boolean(evadeMove?.finalPose);
}

function applyCommittedEvadeMoveToUnits(units = [], evadeMove = null) {
  if (!isEvadeMoveCommitted(evadeMove)) {
    return units;
  }

  return units.map((unit) => {
    if (unit.id !== evadeMove.reactingUnitId) {
      return unit;
    }

    return {
      ...unit,
      xUd: Number(evadeMove.finalPose.xUd ?? unit.xUd ?? 0),
      yUd: Number(evadeMove.finalPose.yUd ?? unit.yUd ?? 0),
      rotationRadians: Number(evadeMove.finalPose.rotationRadians ?? unit.rotationRadians ?? 0),
      hasEvadedThisSequence: true,
      cannotShootThisSequence: Boolean(evadeMove.cannotShootHook),
      evadeCountThisPhase: Number(unit.evadeCountThisPhase ?? 0) + Number(evadeMove.repeatEvadeHook?.increment ?? 0),
    };
  });
}

function resolveChargePreviewChargeMovementPlan(gameState, preview, result) {
  if (preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
    return preview?.chargeMovementPlan ?? null;
  }

  const chargingUnitId = preview?.intent?.unitId ?? null;
  const chargingUnit = gameState.units.find((unit) => unit.id === chargingUnitId) ?? null;
  const declarationSnapshot = preview?.declarationSnapshot ?? null;

  if (!chargingUnit || !declarationSnapshot) {
    return null;
  }

  const contactState = resolveAdjustedChargeFollowThroughContactState({
    chargingUnit,
    declarationSnapshot,
    distanceRollResult: result,
    evadePlan: preview?.evadePlan ?? null,
    evadeMove: preview?.evadeMove ?? null,
    battlefieldProfile: getBattlefieldProfile(gameState.battlefieldProfileId),
    units: gameState.units,
  });

  return resolveAdjustedChargeFollowThroughPlan({
    chargingUnit,
    declarationSnapshot,
    distanceRollResult: result,
    contactState,
  });
}

function createSecondaryTargetReactionRequest(gameState, preview, chargeMovementPlan = null) {
  const firstContactEvent = chargeMovementPlan?.contactState?.contactEvents?.[0] ?? null;
  if (
    firstContactEvent?.type !== CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT
    || !firstContactEvent?.defenderId
  ) {
    return null;
  }

  const chargingUnit = gameState.units.find((unit) => unit.id === preview?.intent?.unitId) ?? null;
  const targetUnit = gameState.units.find((unit) => unit.id === firstContactEvent.defenderId) ?? null;
  if (!chargingUnit || !targetUnit) {
    return createChargeReactionRequest({
      type: CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK,
      unitId: firstContactEvent.defenderId,
      status: 'pending',
      diagnostics: [
        {
          code: 'charge.reaction.secondary-target-pause',
          status: 'needs-source-check',
          text: 'The adjusted charge hit a secondary target, but the secondary reaction request could not be reconstructed safely.',
          sourceStatus: 'needs-source-check',
        },
      ],
      sourceStatus: 'needs-source-check',
      contactEventIndex: 0,
      chargePathSnapshot: chargeMovementPlan?.contactState?.pathSegments ?? [],
      contactSnapshot: firstContactEvent.contactSnapshot ?? null,
    });
  }

  const secondaryReactionState = resolveChargeReactionState({
    chargingUnit,
    targetUnit,
    contactEvents: [firstContactEvent],
    pathSegments: chargeMovementPlan?.contactState?.pathSegments ?? [],
    units: gameState.units,
  });

  return secondaryReactionState.reactionRequests[0]
    ? {
        ...secondaryReactionState.reactionRequests[0],
        status: 'pending',
      }
    : null;
}

function applyAdjustedChargeDistanceToReactionRequests(gameState, preview, reactionRequests, result, chargeMovementPlan = null) {
  if (!Array.isArray(reactionRequests)) {
    return [];
  }

  const firstContactEvent = chargeMovementPlan?.contactState?.contactEvents?.[0] ?? null;

  const nextReactionRequests = reactionRequests.map((request, index) => (
    index === 0
      ? {
          ...request,
          adjustedChargeDistanceUd: result?.resolvedDistanceUd ?? request?.adjustedChargeDistanceUd ?? null,
          caughtByCharger: firstContactEvent?.type === CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT
            && firstContactEvent?.defenderId === request?.unitId,
        }
      : request
  ));

  const secondaryReactionRequest = createSecondaryTargetReactionRequest(gameState, preview, chargeMovementPlan);
  if (
    secondaryReactionRequest
    && !nextReactionRequests.some((request) => request?.unitId === secondaryReactionRequest.unitId)
  ) {
    nextReactionRequests.push(secondaryReactionRequest);
  }

  return nextReactionRequests;
}

function resolveChargeFollowThroughResolution(preview, chargeMovementPlan = null) {
  const firstContactEvent = chargeMovementPlan?.contactState?.contactEvents?.[0] ?? null;
  const primaryRequest = preview?.reactionRequests?.[0] ?? null;
  const activeTargetUnitId = preview?.declarationSnapshot?.targetUnitId
    ?? preview?.intent?.targetUnitId
    ?? preview?.followThroughResolution?.selectedTargetId
    ?? firstContactEvent?.selectedTargetId
    ?? primaryRequest?.unitId
    ?? null;

  if (!firstContactEvent) {
    return createChargeFollowThroughResolution(preview?.followThroughResolution ?? null);
  }

  if (
    firstContactEvent.type === CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT
    && firstContactEvent.defenderId === activeTargetUnitId
  ) {
    return createChargeFollowThroughResolution({
      status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.CAUGHT_EVADER,
      defenderId: firstContactEvent.defenderId,
      selectedTargetId: activeTargetUnitId,
      contactType: firstContactEvent.type,
      combatPosture: CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES.REAR_ATTACK,
      cohesionLoss: {
        amount: 1,
        reason: 'caught-evader',
        exceptionStatus: 'light-charger-check-pending',
      },
    });
  }

  if (firstContactEvent.type === CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT) {
    return createChargeFollowThroughResolution({
      status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET,
      defenderId: firstContactEvent.defenderId,
      selectedTargetId: activeTargetUnitId,
      contactType: firstContactEvent.type,
    });
  }

  if (firstContactEvent.type === CHARGE_CONTACT_EVENT_TYPES.FRIENDLY_BLOCKER) {
    return createChargeFollowThroughResolution({
      status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.FRIENDLY_BLOCKER,
      defenderId: firstContactEvent.defenderId,
      selectedTargetId: activeTargetUnitId,
      contactType: firstContactEvent.type,
    });
  }

  return createChargeFollowThroughResolution();
}

function reduceConfirmChargeDirection(state) {
  const preview = state.game.chargePreview;
  if (!canConfirmChargeDirection(preview)) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: CHARGE_PREVIEW_STATUSES.REACTION_PENDING,
        declarationSnapshot: createChargeDirectionSnapshot(state.game, preview),
        reactionDecision: null,
        handoffStatus: CHARGE_HANDOFF_STATUSES.NONE,
      }),
    },
  };
}

function reduceResolveChargeReaction(state, decisionType) {
  const preview = state.game.chargePreview;
  const declarationSnapshot = preview?.declarationSnapshot ?? null;
  const primaryRequest = declarationSnapshot?.reactionRequests?.[0] ?? getPrimaryChargeReactionRequest(preview);
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.REACTION_PENDING
    || !declarationSnapshot
    || !primaryRequest
    || !decisionType
    || !isChargeReactionDecisionAllowed(primaryRequest.type, decisionType)
  ) {
    return state;
  }

  const handoffStatus = getChargeReactionDecisionHandoffStatus(decisionType);
  const nextStatus = handoffStatus === CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED
    ? CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    : CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF;
  const branchDistanceRoll = createChargeBranchDistanceClaim(state.game, preview, primaryRequest, handoffStatus);

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: nextStatus,
        reactionRequests: completeChargeReactionRequests(preview.reactionRequests),
        reactionDecision: createChargeReactionDecision({
          type: decisionType,
          unitId: primaryRequest.unitId,
          requestType: primaryRequest.type,
          handoffStatus,
          declarationSnapshot,
        }),
        branchDistanceRoll,
        handoffStatus,
      }),
    },
  };
}

function reduceResolveSecondaryChargeReaction(state, decisionType) {
  const preview = state.game.chargePreview;
  const secondaryRequest = Array.isArray(preview?.reactionRequests) ? (preview.reactionRequests[1] ?? null) : null;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.followThroughResolution?.status !== CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET
    || !secondaryRequest
    || secondaryRequest.status !== 'pending'
    || preview?.secondaryReactionDecision
    || !decisionType
    || !isChargeReactionDecisionAllowed(secondaryRequest.type, decisionType)
  ) {
    return state;
  }

  const handoffStatus = getChargeReactionDecisionHandoffStatus(decisionType);
  const nextStatus = handoffStatus === CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED
    ? CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    : CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF;
  const secondaryDeclarationSnapshot = createChargeDeclarationSnapshot({
    unitId: preview?.intent?.unitId ?? null,
    targetUnitId: secondaryRequest.unitId,
    targetSnapshot: state.game.units.find((unit) => unit.id === secondaryRequest.unitId) ?? null,
    startPose: preview?.chargeMovementPlan?.startPose ?? null,
    frozenDirectionRadians: preview?.chargeMovementPlan?.frozenDirectionRadians ?? null,
    pathSegments: preview?.chargeMovementPlan?.contactState?.pathSegments ?? [],
    contactEvent: preview?.chargeMovementPlan?.contactState?.contactEvents?.[0] ?? null,
    reactionRequests: [secondaryRequest],
  });
  const branchDistanceRoll = createChargeReactionBranchDistanceClaim(
    state.game,
    preview,
    secondaryRequest,
    handoffStatus,
    secondaryDeclarationSnapshot,
  );
  const reanchoredPreview = reanchorChargePreviewToSecondaryTarget(
    preview,
    state.game,
    secondaryRequest,
    secondaryDeclarationSnapshot,
  );

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...reanchoredPreview,
        status: nextStatus,
        reactionRequests: preview.reactionRequests.map((request, index) => (
          index === 1
            ? {
                ...request,
                status: 'complete',
              }
            : request
        )),
        secondaryReactionDecision: createChargeReactionDecision({
          type: decisionType,
          unitId: secondaryRequest.unitId,
          requestType: secondaryRequest.type,
          handoffStatus,
          declarationSnapshot: secondaryDeclarationSnapshot,
        }),
        branchDistanceRoll,
        handoffStatus,
      }),
    },
  };
}

function reduceResolveChargeBranchDistance(state, dieRoll) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || !preview?.branchDistanceRoll?.claim
    || preview?.branchDistanceRoll?.result
  ) {
    return state;
  }

  const result = resolveChargeBranchDistanceResult(state.game, preview, dieRoll);
  if (!result) {
    return state;
  }

  const branchReason = preview.branchDistanceRoll.claim.reason;

  if (branchReason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE) {
    const evadePlan = resolveChargePreviewEvadePlan(state.game, preview, result);
    const evadeMove = createEvadeMoveResolutionFromPlan(state.game, preview, evadePlan);
    const nextUnits = applyCommittedEvadeMoveToUnits(state.game.units, evadeMove);
    const evadeChoiceHandoff = createEvadeChoiceHandoffFromMove(state.game, evadeMove);

    return {
      ...state,
      game: {
        ...state.game,
        setupViewMode: evadeChoiceHandoff.status === EVADE_CHOICE_HANDOFF_STATUSES.PENDING
          ? SETUP_VIEW_MODES.HOTSEAT_HANDOFF
          : state.game.setupViewMode,
        units: nextUnits,
        chargePreview: createInitialChargePreview({
          ...preview,
          branchDistanceRoll: createChargeBranchDistanceState({
            history: preview.branchDistanceRoll.history,
            claim: preview.branchDistanceRoll.claim,
            result,
          }),
          evadePlan,
          evadeMove,
          evadeChoiceHandoff,
        }),
      },
    };
  }

  const chargeMovementPlan = resolveChargePreviewChargeMovementPlan(state.game, preview, result);

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        branchDistanceRoll: createChargeBranchDistanceState({
          history: preview.branchDistanceRoll.history,
          claim: preview.branchDistanceRoll.claim,
          result,
        }),
        evadePlan: preview.evadePlan ?? null,
        evadeMove: preview.evadeMove,
        chargeMovementPlan,
        followThroughResolution: resolveChargeFollowThroughResolution(preview, chargeMovementPlan),
        reactionRequests: applyAdjustedChargeDistanceToReactionRequests(state.game, preview, preview.reactionRequests, result, chargeMovementPlan),
      }),
    },
  };
}

function reduceStartAdjustedChargeDistanceRoll(state) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
    || !preview?.branchDistanceRoll?.result
    || !isEvadeMoveCommitted(preview?.evadeMove)
  ) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        branchDistanceRoll: createAdjustedChargeDistanceClaim(state.game, preview),
        followThroughResolution: createChargeFollowThroughResolution(),
      }),
    },
  };
}

function reduceSelectEvadeAvoidanceChoice(state, choice) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
    || !preview?.branchDistanceRoll?.result
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || !preview?.evadePlan?.choiceRequired
  ) {
    return state;
  }

  const evadePlan = resolveEvadePlanAvoidanceChoice(preview.evadePlan, choice);
  if (!evadePlan) {
    return state;
  }

  const evadeMove = createEvadeMoveResolutionFromPlan(state.game, preview, evadePlan);
  const nextUnits = applyCommittedEvadeMoveToUnits(state.game.units, evadeMove);

  return {
    ...state,
    game: {
      ...state.game,
      setupViewMode: preview?.evadeChoiceHandoff?.returnViewMode ?? state.game.setupViewMode,
      units: nextUnits,
      chargePreview: createInitialChargePreview({
        ...preview,
        evadePlan,
        evadeMove,
        evadeChoiceHandoff: createEvadeChoiceHandoff(),
      }),
    },
  };
}

function reduceAcknowledgeEvadeChoiceHandoff(state) {
  const preview = state.game.chargePreview;
  const handoff = preview?.evadeChoiceHandoff ?? null;

  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || handoff?.status !== EVADE_CHOICE_HANDOFF_STATUSES.PENDING
  ) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      setupViewMode: handoff.nextViewMode ?? state.game.setupViewMode,
      chargePreview: createInitialChargePreview({
        ...preview,
        evadeChoiceHandoff: createEvadeChoiceHandoff({
          ...handoff,
          status: EVADE_CHOICE_HANDOFF_STATUSES.ACKNOWLEDGED,
        }),
      }),
    },
  };
}

function reduceResolveChargeContinuationChoice(state, option) {
  const preview = state.game.chargePreview;
  const chargeMovementPlan = preview?.chargeMovementPlan ?? null;
  const continuationChoice = chargeMovementPlan?.continuationChoice ?? null;

  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || !continuationChoice?.required
    || ![CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP, CHARGE_MOVEMENT_CONTINUATION_DECISIONS.CONTINUE].includes(option)
  ) {
    return state;
  }

  const nextChargeMovementPlan = {
    ...chargeMovementPlan,
    distanceUd: option === CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP
      ? continuationChoice.minimumDistanceUd
      : continuationChoice.maximumDistanceUd,
    endPose: option === CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP
      ? continuationChoice.minimumEndPose
      : continuationChoice.maximumEndPose,
    continuationChoice: {
      ...continuationChoice,
      selectedOption: option,
    },
  };

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        chargeMovementPlan: nextChargeMovementPlan,
      }),
    },
  };
}

function reduceSelectChargeContactSide(state, action) {
  const preview = state.game.chargePreview;
  if (!preview || ![CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING, CHARGE_PREVIEW_STATUSES.READY].includes(preview.status)) {
    return state;
  }

  const primaryContactEvent = preview.contactEvents[0] ?? null;
  const classification = primaryContactEvent?.classification ?? null;
  const side = action?.side;
  if (
    !primaryContactEvent?.defenderId
    || action?.defenderId !== primaryContactEvent.defenderId
    || classification?.type !== CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
    || !getChargeContactSideOptions(classification).includes(side)
  ) {
    return state;
  }

  const nextSelectedContactSide = (
    preview.selectedContactSide?.defenderId === primaryContactEvent.defenderId
    && preview.selectedContactSide?.side === side
  )
    ? null
    : {
        defenderId: primaryContactEvent.defenderId,
        side,
      };

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        selectedContactSide: nextSelectedContactSide,
      }),
    },
  };
}

function sanitizeViewport(viewport) {
  return {
    zoom: clamp(viewport.zoom ?? 1, BATTLEFIELD_VIEWPORT_LIMITS.zoomMin, BATTLEFIELD_VIEWPORT_LIMITS.zoomMax),
    panX: Number.isFinite(viewport.panX) ? viewport.panX : 0,
    panY: Number.isFinite(viewport.panY) ? viewport.panY : 0,
  };
}

function createInitialSettings() {
  return {
    playerColor: '#426fbd',
    showScaleOverlay: true,
    keyBindings: {
      overlayCycle: {
        primary: 'V',
        secondary: '',
      },
    },
  };
}

function cloneSettings(settings) {
  return {
    playerColor: settings.playerColor,
    showScaleOverlay: settings.showScaleOverlay,
    keyBindings: {
      overlayCycle: {
        primary: settings.keyBindings.overlayCycle.primary,
        secondary: settings.keyBindings.overlayCycle.secondary,
      },
    },
  };
}

const DEPLOYMENT_SEED_UNIT_IDS = ['test-unit-1', 'test-unit-2'];

const COMMANDER_QUALITY_RANGES_UD = {
  brilliant: 8,
  competent: 6,
  ordinary: 4,
};

const P6_COMMAND_FIXTURE_TAG = 'p6-command-fixture';
const COMMANDER_FREE_MOVE_UD = 5;
const POSITION_GUARD_EPSILON = 0.0001;

const P6_PLAYER_ONE_CORPS_X_POSITIONS = [5, 10, 15];
const P6_PLAYER_TWO_CORPS_X_POSITIONS = [15, 20, 25];

function createUnitInitialPositionMap(units) {
  return units.reduce((positions, unit) => {
    positions[unit.id] = {
      xUd: unit.xUd,
      yUd: unit.yUd,
      rotationRadians: unit.rotationRadians ?? 0,
    };
    return positions;
  }, {});
}

function toCorpsSlotId(corpsId) {
  const raw = String(corpsId ?? '').toLowerCase();
  if (!raw) {
    return null;
  }

  const normalized = raw.replaceAll('_', '-');
  const match = normalized.match(/corps-(\d+)/);
  if (!match) {
    return null;
  }

  return `corps-${match[1]}`;
}

function isUnitFootprintWithinBattlefield(unit, battlefieldProfile) {
  const bounds = getRotatedRectangleBounds({
    center: { x: unit.xUd, y: unit.yUd },
    widthUd: unit.widthUd,
    depthUd: unit.depthUd,
    rotationRadians: unit.rotationRadians ?? 0,
  });

  return bounds.minX >= 0
    && bounds.maxX <= battlefieldProfile.widthUd
    && bounds.minY >= 0
    && bounds.maxY <= battlefieldProfile.heightUd;
}

function isUnitInActiveCorps(gameState, unit) {
  if (!unit) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(gameState.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
  return Boolean(activeCorpsSlotId && unitCorpsSlotId && activeCorpsSlotId === unitCorpsSlotId);
}

function getActiveCommanderUnit(gameState) {
  const commanderId = gameState.commandContext?.commander?.unitId;
  if (!commanderId) {
    return null;
  }

  return gameState.units.find((unit) => unit.id === commanderId) || null;
}

function getSelectedCommanderUnit(gameState) {
  const selectedUnit = gameState.units.find((unit) => unit.id === gameState.selectedUnitId) || null;
  return selectedUnit?.isCommander && !selectedUnit.hasIncludedCommander ? selectedUnit : null;
}

function getCommanderPreviewActor(gameState, commanderUnit = getSelectedCommanderUnit(gameState)) {
  if (!commanderUnit) {
    return null;
  }

  const preview = gameState.commanderFreeMovePreview;
  if (
    preview?.unitId !== commanderUnit.id
    || !Number.isFinite(preview?.xUd)
    || !Number.isFinite(preview?.yUd)
    || !Number.isFinite(preview?.nextSpentUd)
  ) {
    return commanderUnit;
  }

  return {
    ...commanderUnit,
    xUd: Number(preview.xUd),
    yUd: Number(preview.yUd),
    advanceUsedUd: Number(preview.nextSpentUd),
  };
}

function getCommanderAttachActor(gameState, commanderUnit = null) {
  return getCommanderPreviewActor(gameState, commanderUnit ?? getSelectedCommanderUnit(gameState) ?? getActiveCommanderUnit(gameState));
}

function getAttachedCommanderPose(hostUnit, commanderUnit) {
  const { forwardAxis } = getAxesFromRotation(hostUnit.rotationRadians ?? 0);
  const center = addVectors(
    { x: hostUnit.xUd, y: hostUnit.yUd },
    scaleVector(forwardAxis, -((hostUnit.depthUd / 2) + (commanderUnit.depthUd / 2))),
  );

  return {
    xUd: Number(center.x.toFixed(3)),
    yUd: Number(center.y.toFixed(3)),
    rotationRadians: hostUnit.rotationRadians ?? commanderUnit.rotationRadians ?? 0,
  };
}

function finalizeCommandAttachmentState(gameState) {
  const syncedGameState = syncCommandContextSnapshots(gameState);
  return {
    ...syncedGameState,
    movement: withMovementValidationSnapshot(syncedGameState, syncedGameState.movement),
  };
}

function syncAttachedCommanderWithHost(gameState, hostUnitId) {
  const hostUnit = gameState.units.find((unit) => unit.id === hostUnitId) || null;
  if (!hostUnit?.attachedCommanderId) {
    return gameState;
  }

  const commanderUnit = gameState.units.find((unit) => unit.id === hostUnit.attachedCommanderId) || null;
  if (!commanderUnit) {
    return gameState;
  }

  const attachedPose = getAttachedCommanderPose(hostUnit, commanderUnit);
  const nextUnits = gameState.units.map((unit) => (
    unit.id === commanderUnit.id
      ? {
          ...unit,
          xUd: attachedPose.xUd,
          yUd: attachedPose.yUd,
          rotationRadians: attachedPose.rotationRadians,
        }
      : unit
  ));

  return finalizeCommandAttachmentState({
    ...gameState,
    units: nextUnits,
  });
}

function clearAttachmentRelationsForUnit(units, unitId) {
  const unit = units.find((candidate) => candidate.id === unitId) || null;
  if (!unit) {
    return units;
  }

  const attachedHostId = unit.attachedUnitId ?? null;
  const attachedCommanderId = unit.attachedCommanderId ?? null;

  return units.map((candidate) => {
    if (candidate.id === unitId) {
      return {
        ...candidate,
        attachedUnitId: null,
        attachedCommanderId: null,
      };
    }

    if (attachedHostId && candidate.id === attachedHostId) {
      return {
        ...candidate,
        attachedCommanderId: null,
      };
    }

    if (attachedCommanderId && candidate.id === attachedCommanderId) {
      return {
        ...candidate,
        xUd: Number.isFinite(candidate.attachOriginXUd) ? candidate.attachOriginXUd : candidate.xUd,
        yUd: Number.isFinite(candidate.attachOriginYUd) ? candidate.attachOriginYUd : candidate.yUd,
        rotationRadians: Number.isFinite(candidate.attachOriginRotationRadians)
          ? candidate.attachOriginRotationRadians
          : candidate.rotationRadians,
        advanceUsedUd: Number.isFinite(candidate.attachOriginAdvanceUsedUd)
          ? candidate.attachOriginAdvanceUsedUd
          : candidate.advanceUsedUd,
        attachedUnitId: null,
        attachOriginXUd: null,
        attachOriginYUd: null,
        attachOriginRotationRadians: null,
        attachOriginAdvanceUsedUd: null,
      };
    }

    return candidate;
  });
}

export function canAttachCommanderToUnit(
  gameState,
  targetUnit = gameState.units.find((unit) => unit.id === gameState.selectedUnitId) || null,
  commanderUnitOverride = null,
) {
  if (!targetUnit || gameState.setup.isActive || gameState.commandContext.currentPhaseId !== BATTLE_PHASE_IDS.MOVEMENT) {
    return false;
  }

  const commanderUnit = getCommanderAttachActor(gameState, commanderUnitOverride);
  if (!commanderUnit || !commanderUnit.isCommander || commanderUnit.hasIncludedCommander) {
    return false;
  }

  if (commanderUnit.attachedUnitId || targetUnit.id === commanderUnit.id) {
    return false;
  }

  if (targetUnit.isCommander || targetUnit.hasIncludedCommander || targetUnit.attachedCommanderId) {
    return false;
  }

  if (targetUnit.owner !== gameState.commandContext.activePlayerId || commanderUnit.owner !== gameState.commandContext.activePlayerId) {
    return false;
  }

  if (!isUnitInActiveCorps(gameState, targetUnit) || !isUnitInActiveCorps(gameState, commanderUnit)) {
    return false;
  }

  const measurement = getUnitCommandRangeMeasurement(commanderUnit, targetUnit);
  const remainingBudgetUd = COMMANDER_FREE_MOVE_UD - (commanderUnit.advanceUsedUd ?? 0);
  if (!measurement || measurement.distanceUd > remainingBudgetUd + POSITION_GUARD_EPSILON) {
    return false;
  }

  return Boolean(measurement && measurement.distanceUd <= COMMANDER_FREE_MOVE_UD + POSITION_GUARD_EPSILON);
}

export function getCommanderAttachRemainingUd(gameState, commanderUnit = getSelectedCommanderUnit(gameState)) {
  if (!commanderUnit || !commanderUnit.isCommander || commanderUnit.hasIncludedCommander || commanderUnit.attachedUnitId) {
    return 0;
  }

  return Math.max(0, COMMANDER_FREE_MOVE_UD - Number(commanderUnit.advanceUsedUd ?? 0));
}

export function canStartCommanderAttach(gameState, commanderUnit = getSelectedCommanderUnit(gameState)) {
  if (!commanderUnit || gameState.setup.isActive || gameState.commandContext.currentPhaseId !== BATTLE_PHASE_IDS.MOVEMENT) {
    return false;
  }

  const selectedCommander = getSelectedCommanderUnit(gameState);
  const finishedCommander = selectedCommander && selectedCommander.id === commanderUnit.id
    ? selectedCommander
    : commanderUnit;

  if (!commanderUnit || !commanderUnit.isCommander || commanderUnit.hasIncludedCommander) {
    return false;
  }

  if ((finishedCommander?.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON || finishedCommander?.stayedThisMovementPhase) {
    return false;
  }

  if (commanderUnit.attachedUnitId) {
    return false;
  }

  if (!isUnitInActiveCorps(gameState, commanderUnit) || commanderUnit.owner !== gameState.commandContext.activePlayerId) {
    return false;
  }

  if (getCommanderAttachRemainingUd(gameState, commanderUnit) <= POSITION_GUARD_EPSILON) {
    return false;
  }

  const preview = gameState.commanderFreeMovePreview;
  return preview?.status === 'idle'
    || (preview?.unitId === commanderUnit.id && (preview?.mode === 'attach' || preview?.mode === 'move'));
}

export function canDetachCommanderFromUnit() {
  return false;
}

function canUseCommanderFreeMove(state, unit) {
  if (!unit || state.game.setup.isActive) {
    return false;
  }

  if (!unit.isCommander || unit.hasIncludedCommander || unit.attachedUnitId) {
    return false;
  }

  if ((unit.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON || unit.stayedThisMovementPhase) {
    return false;
  }

  if (state.game.commandContext.currentPhaseId !== BATTLE_PHASE_IDS.MOVEMENT) {
    return false;
  }

  if (unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  const remainingBudgetUd = COMMANDER_FREE_MOVE_UD - (unit.advanceUsedUd ?? 0);
  if (remainingBudgetUd <= POSITION_GUARD_EPSILON) {
    return false;
  }

  const isStartingCommanderMove = (unit.advanceUsedUd ?? 0) <= POSITION_GUARD_EPSILON;
  if (isStartingCommanderMove && Number(state.game.commandContext?.commandPoints?.free ?? 0) < 1) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
  return Boolean(activeCorpsSlotId && unitCorpsSlotId && activeCorpsSlotId === unitCorpsSlotId);
}

function reduceSetCommanderPositionInBattle(state, action) {
  if (state.game.selectedUnitId !== action.unitId) {
    return state;
  }

  const unit = state.game.units.find((candidate) => candidate.id === action.unitId) || null;
  if (!unit || !canUseCommanderFreeMove(state, unit)) {
    return state;
  }

  const xUd = Number(action.xUd);
  const yUd = Number(action.yUd);
  if (!Number.isFinite(xUd) || !Number.isFinite(yUd)) {
    return state;
  }

  const currentSpentUd = Number(unit.advanceUsedUd ?? 0);
  const dragSpentUdAtStart = Number.isFinite(action.dragSpentUdAtStart)
    ? Number(action.dragSpentUdAtStart)
    : currentSpentUd;
  const dragOriginXUd = Number.isFinite(action.dragOriginXUd) ? Number(action.dragOriginXUd) : unit.xUd;
  const dragOriginYUd = Number.isFinite(action.dragOriginYUd) ? Number(action.dragOriginYUd) : unit.yUd;
  const maxDistanceUd = Number.isFinite(action.maxDistanceUd)
    ? Number(action.maxDistanceUd)
    : Math.max(0, COMMANDER_FREE_MOVE_UD - dragSpentUdAtStart);
  const distanceUd = getPointDistance(
    { x: dragOriginXUd, y: dragOriginYUd },
    { x: xUd, y: yUd },
  );

  if (distanceUd > maxDistanceUd + POSITION_GUARD_EPSILON) {
    return state;
  }

  const nextSpentUd = dragSpentUdAtStart + distanceUd;
  if (nextSpentUd > COMMANDER_FREE_MOVE_UD + POSITION_GUARD_EPSILON) {
    return state;
  }

  const previewUnit = {
    ...unit,
    xUd,
    yUd,
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  if (!isUnitFootprintWithinBattlefield(previewUnit, battlefieldProfile)) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      commanderFreeMovePreview: {
        status: 'ready',
        mode: 'move',
        unitId: unit.id,
        targetUnitId: null,
        xUd,
        yUd,
        nextSpentUd: Number(nextSpentUd.toFixed(3)),
        phaseStartXUd: Number.isFinite(unit.commanderMovePhaseStartXUd)
          ? unit.commanderMovePhaseStartXUd
          : dragOriginXUd,
        phaseStartYUd: Number.isFinite(unit.commanderMovePhaseStartYUd)
          ? unit.commanderMovePhaseStartYUd
          : dragOriginYUd,
      },
    },
  };
}

function canMarkUnitStay(state, unit) {
  if (!unit || state.game.setup.isActive) {
    return false;
  }

  if (state.game.commandContext.currentPhaseId !== BATTLE_PHASE_IDS.MOVEMENT) {
    return false;
  }

  if (unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  if ((unit.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON || unit.stayedThisMovementPhase) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);

  return Boolean(activeCorpsSlotId && unitCorpsSlotId && activeCorpsSlotId === unitCorpsSlotId);
}

function reduceMarkUnitStay(state, unitId) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  if (!canMarkUnitStay(state, unit)) {
    return state;
  }

  const hasMandatoryMovementPending = Boolean(unit.mandatoryMovementPending ?? unit.mustMoveThisPhase);
  if (hasMandatoryMovementPending) {
    return state;
  }

  const stayBudgetUd = unit.isCommander && !unit.hasIncludedCommander
    ? 5
    : (unit.advanceUsedUd ?? 0) + getRemainingAdvanceBudgetUd(unit, state.game.units);

  return {
    ...state,
    game: {
      ...state.game,
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      movement: createInitialMovementState(),
      units: state.game.units.map((candidate) =>
        candidate.id === unitId
          ? {
              ...candidate,
              advanceUsedUd: stayBudgetUd,
              slideUsedThisMovementPhase: false,
              stayedThisMovementPhase: true,
            }
          : candidate,
      ),
    },
  };
}

function reduceAttachCommander(state, targetUnitId) {
  const selectedCommander = getSelectedCommanderUnit(state.game);
  const commanderUnit = getCommanderAttachActor(state.game, selectedCommander);
  if (!commanderUnit || !canStartCommanderAttach(state.game, commanderUnit)) {
    return state;
  }

  const currentPreview = state.game.commanderFreeMovePreview;
  if (!targetUnitId || targetUnitId === selectedCommander?.id) {
    return {
      ...state,
      game: {
        ...state.game,
        commanderFreeMovePreview: {
          ...createInitialCommanderFreeMovePreview(),
          status: 'targeting',
          mode: 'attach',
          unitId: selectedCommander.id,
          xUd: commanderUnit.xUd,
          yUd: commanderUnit.yUd,
          nextSpentUd: Number(commanderUnit.advanceUsedUd ?? 0),
          phaseStartXUd: Number.isFinite(commanderUnit.commanderMovePhaseStartXUd)
            ? commanderUnit.commanderMovePhaseStartXUd
            : commanderUnit.xUd,
          phaseStartYUd: Number.isFinite(commanderUnit.commanderMovePhaseStartYUd)
            ? commanderUnit.commanderMovePhaseStartYUd
            : commanderUnit.yUd,
          attachOriginXUd: commanderUnit.xUd,
          attachOriginYUd: commanderUnit.yUd,
          attachOriginRotationRadians: commanderUnit.rotationRadians ?? 0,
          attachOriginAdvanceUsedUd: Number(commanderUnit.advanceUsedUd ?? 0),
        },
      },
    };
  }

  if (currentPreview?.status !== 'targeting' || currentPreview.mode !== 'attach' || currentPreview.unitId !== selectedCommander?.id) {
    return state;
  }

  const targetUnit = state.game.units.find((unit) => unit.id === targetUnitId) || null;
  if (!canAttachCommanderToUnit(state.game, targetUnit, commanderUnit)) {
    return state;
  }

  const attachedPose = getAttachedCommanderPose(targetUnit, commanderUnit);
  const previewCommander = {
    ...commanderUnit,
    xUd: attachedPose.xUd,
    yUd: attachedPose.yUd,
    rotationRadians: attachedPose.rotationRadians,
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  if (!isUnitFootprintWithinBattlefield(previewCommander, battlefieldProfile)) {
    return state;
  }

  const measurement = getUnitCommandRangeMeasurement(commanderUnit, targetUnit);
  if (!measurement) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      commanderFreeMovePreview: {
        status: 'ready',
        mode: 'attach',
        unitId: commanderUnit.id,
        targetUnitId: targetUnit.id,
        xUd: attachedPose.xUd,
        yUd: attachedPose.yUd,
        nextSpentUd: Number(((commanderUnit.advanceUsedUd ?? 0) + measurement.distanceUd).toFixed(3)),
        phaseStartXUd: Number.isFinite(commanderUnit.commanderMovePhaseStartXUd)
          ? commanderUnit.commanderMovePhaseStartXUd
          : commanderUnit.xUd,
        phaseStartYUd: Number.isFinite(commanderUnit.commanderMovePhaseStartYUd)
          ? commanderUnit.commanderMovePhaseStartYUd
          : commanderUnit.yUd,
        attachOriginXUd: currentPreview.attachOriginXUd,
        attachOriginYUd: currentPreview.attachOriginYUd,
        attachOriginRotationRadians: currentPreview.attachOriginRotationRadians,
        attachOriginAdvanceUsedUd: currentPreview.attachOriginAdvanceUsedUd,
      },
    },
  };
}

function reduceDetachCommander(state, targetUnitId) {
  return state;
}

function createFixtureUnit({
  id,
  owner,
  corpsId,
  xUd,
  yUd,
  widthUd,
  depthUd,
  facing,
  rotationRadians,
  troopType,
  baseShape,
  isCommander = false,
  commanderQuality = null,
  hasIncludedCommander = false,
}) {
  return {
    id,
    owner,
    corpsId,
    xUd,
    yUd,
    facing,
    widthUd,
    depthUd,
    rotationRadians,
    advanceUsedUd: 0,
    slideUsedThisMovementPhase: false,
    stayedThisMovementPhase: false,
    commanderMovePhaseStartXUd: null,
    commanderMovePhaseStartYUd: null,
    troopType,
    baseShape,
    fixtureTag: P6_COMMAND_FIXTURE_TAG,
    isCommander,
    commanderQuality,
    commandRangeUd: commanderQuality ? COMMANDER_QUALITY_RANGES_UD[commanderQuality] : null,
    hasIncludedCommander,
    attachedUnitId: null,
    attachedCommanderId: null,
    attachOriginXUd: null,
    attachOriginYUd: null,
    attachOriginRotationRadians: null,
    attachOriginAdvanceUsedUd: null,
  };
}

function createP6CorpsFixtureUnitsForPlayer({ owner, yUd, facing, rotationRadians, xPositions }) {
  const playerPrefix = owner === COMMAND_PLAYER_IDS.PLAYER_ONE ? 'p1' : 'p2';

  const corpsOneId = `${playerPrefix}-corps-1`;
  const corpsTwoId = `${playerPrefix}-corps-2`;
  const corpsThreeId = `${playerPrefix}-corps-3`;

  const corpsOneGeneralId = owner === COMMAND_PLAYER_IDS.PLAYER_ONE ? 'test-unit-1' : 'test-unit-2';
  const corpsOneCavalryOneId = owner === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'test-unit-3' : `${playerPrefix}-c1-cav-1`;
  const corpsOneCavalryTwoId = owner === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'test-unit-4' : `${playerPrefix}-c1-cav-2`;

  return [
    createFixtureUnit({
      id: corpsOneGeneralId,
      owner,
      corpsId: corpsOneId,
      xUd: xPositions[0],
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'general',
      baseShape: 'circle',
      isCommander: true,
      commanderQuality: 'brilliant',
    }),
    createFixtureUnit({
      id: corpsOneCavalryOneId,
      owner,
      corpsId: corpsOneId,
      xUd: xPositions[0] - 1.1,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'cavalry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: corpsOneCavalryTwoId,
      owner,
      corpsId: corpsOneId,
      xUd: xPositions[0] + 1.1,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'cavalry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c2-gen`,
      owner,
      corpsId: corpsTwoId,
      xUd: xPositions[1],
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'general',
      baseShape: 'circle',
      isCommander: true,
      commanderQuality: 'competent',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c2-mi-1`,
      owner,
      corpsId: corpsTwoId,
      xUd: xPositions[1] - 1.1,
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'medium-infantry',
      baseShape: 'square',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c2-mi-2`,
      owner,
      corpsId: corpsTwoId,
      xUd: xPositions[1] + 1.1,
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'medium-infantry',
      baseShape: 'square',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-1`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] - 1.65,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
      hasIncludedCommander: true,
      commanderQuality: 'ordinary',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-2`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] - 0.55,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-3`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] + 0.55,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-4`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] + 1.65,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
    }),
  ];
}

function getDeploymentSeedUnits(units) {
  return units.filter((unit) => DEPLOYMENT_SEED_UNIT_IDS.includes(unit.id));
}

function createStandardDirectBattleFixtureUnits() {
  return [
    ...createP6CorpsFixtureUnitsForPlayer({
      owner: COMMAND_PLAYER_IDS.PLAYER_ONE,
      yUd: 17,
      facing: 'north',
      rotationRadians: 0,
      xPositions: P6_PLAYER_ONE_CORPS_X_POSITIONS,
    }),
    ...createP6CorpsFixtureUnitsForPlayer({
      owner: COMMAND_PLAYER_IDS.PLAYER_TWO,
      yUd: 3,
      facing: 'south',
      rotationRadians: Math.PI,
      xPositions: P6_PLAYER_TWO_CORPS_X_POSITIONS,
    }),
  ].map((unit) => {
    if (unit.id === 'test-unit-3') {
      return {
        ...unit,
        xUd: 5,
        yUd: 13,
      };
    }

    if (unit.id === 'test-unit-4') {
      return {
        ...unit,
        xUd: 4.5,
        yUd: 8.5,
      };
    }

    return unit;
  });
}

export function createInitialAppState() {
  const initialSettings = createInitialSettings();
  const initialUnits = createStandardDirectBattleFixtureUnits();
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const initialSetupState = createScenarioSetupState({
    setupIsActive: false,
    units: initialUnits,
    battlefieldProfile,
  });

  return {
    shell: {
      currentScreen: SCREEN_IDS.MAIN_MENU,
      settings: initialSettings,
      settingsDraft: cloneSettings(initialSettings),
      newGame: {
        mode: 'singleplayer',
        points: 200,
      },
    },
    game: {
      mode: 'singleplayer',
      formatId: 'standard-200',
      battlefieldProfileId: BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM,
      scenarioId: 'standard-direct-battle',
      scenarioLabel: null,
      phaseTracker: createInitialPhaseTracker(),
      setup: initialSetupState,
      setupViewMode: SETUP_VIEW_MODES.CANONICAL,
      overlayMode: 'Aus',
      viewport: createInitialViewport(),
      commandContext: createInitialCommandContextState(BATTLE_PHASE_IDS.COMMAND, initialSetupState.battlePlan.corpsCards),
      movement: createInitialMovementState(),
      chargePreview: createInitialChargePreview(),
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      ...createInitialAdvanceState(),
      ...createInitialSlideState(),
      ...createInitialWheelState(),
      initialUnitPositions: createUnitInitialPositionMap(initialUnits),
      selectedUnitId: null,
      round: null,
      debug: createInitialDebugState(initialUnits[0]),
      units: initialUnits,
    },
  };
}

export function reduceAppState(state, action) {
  switch (action.type) {
    case ACTION_TYPES.NAVIGATE:
      return {
        ...state,
        shell: {
          ...state.shell,
          currentScreen: action.screenId,
          settingsDraft:
            action.screenId === SCREEN_IDS.OPTIONS
              ? cloneSettings(state.shell.settings)
              : state.shell.settingsDraft,
        },
      };

    case ACTION_TYPES.SET_PLAYER_COLOR_DRAFT:
      return {
        ...state,
        shell: {
          ...state.shell,
          settingsDraft: {
            ...state.shell.settingsDraft,
            playerColor: action.playerColorDraft,
          },
        },
      };

    case ACTION_TYPES.SET_KEY_BINDING_DRAFT:
      return {
        ...state,
        shell: {
          ...state.shell,
          settingsDraft: {
            ...state.shell.settingsDraft,
            keyBindings: {
              ...state.shell.settingsDraft.keyBindings,
              [action.bindingId]: {
                ...state.shell.settingsDraft.keyBindings[action.bindingId],
                [action.slot]: action.keyValue,
              },
            },
          },
        },
      };

    case ACTION_TYPES.SET_SCALE_OVERLAY_DRAFT:
      return {
        ...state,
        shell: {
          ...state.shell,
          settingsDraft: {
            ...state.shell.settingsDraft,
            showScaleOverlay: action.showScaleOverlay,
          },
        },
      };

    case ACTION_TYPES.SAVE_SETTINGS:
      return {
        ...state,
        shell: {
          ...state.shell,
          currentScreen: SCREEN_IDS.MAIN_MENU,
          settings: cloneSettings(state.shell.settingsDraft),
        },
      };

    case ACTION_TYPES.SET_NEW_GAME_MODE:
      return {
        ...state,
        shell: {
          ...state.shell,
          newGame: {
            ...state.shell.newGame,
            mode: action.mode,
          },
        },
      };

    case ACTION_TYPES.SET_NEW_GAME_POINTS:
      return {
        ...state,
        shell: {
          ...state.shell,
          newGame: {
            ...state.shell.newGame,
            points: action.points,
          },
        },
      };

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
      return {
        ...state,
        game: {
          ...state.game,
          viewport: sanitizeViewport({
            ...state.game.viewport,
            ...action.viewport,
          }),
        },
      };

    case ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE:
      {
        const nextGameState = reduceSetActiveBattlePhase(state.game, action.phaseId);
        return {
          ...state,
          game: {
            ...nextGameState,
            chargePreview: createInitialChargePreview(),
            commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
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
      {
        const nextState = {
          ...state,
          game: reduceSelectActiveCorps(state.game, action.corpsId),
        };
        const selectedUnit = getSelectedUnit(nextState);

        // Close corps-selection dialog if the selection came from it
        const wasFromDialog = nextState.game.round?.dialog?.type === 'corps-selection';
        const stateAfterDialog = wasFromDialog
          ? {
              ...nextState,
              game: {
                ...nextState.game,
                round: {
                  ...nextState.game.round,
                  dialog: { type: null, phaseLabel: null },
                },
              },
            }
          : nextState;

        if (!selectedUnit || isUnitSelectableInCurrentCorps(stateAfterDialog, selectedUnit)) {
          return stateAfterDialog;
        }

        return {
          ...stateAfterDialog,
          game: {
            ...stateAfterDialog.game,
            selectedUnitId: null,
            advanceModeActive: createInitialAdvanceState().advanceModeActive,
            advancePreviewUd: createInitialAdvanceState().advancePreviewUd,
            slideModeActive: createInitialSlideState().slideModeActive,
            slidePreviewUd: createInitialSlideState().slidePreviewUd,
            slidePreviewSide: createInitialSlideState().slidePreviewSide,
            wheelModeActive: createInitialWheelState().wheelModeActive,
            wheelPivotSide: createInitialWheelState().wheelPivotSide,
            wheelPreviewAngleRadians: createInitialWheelState().wheelPreviewAngleRadians,
            debug: {
              ...nextState.game.debug,
              isActive: false,
              showFacingGeometryOverlay: false,
            },
            movement: createInitialMovementState(),
            chargePreview: createInitialChargePreview(),
            commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
          },
        };
      }

    case ACTION_TYPES.COMPLETE_ACTIVE_CORPS:
      return {
        ...state,
        game: reduceCompleteActiveCorps(state.game, action.corpsId),
      };

    case ACTION_TYPES.CYCLE_OVERLAY_MODE:
      return {
        ...state,
        game: {
          ...state.game,
          overlayMode: getNextOverlayMode(state.game.overlayMode),
        },
      };

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
        if (!isUnitSelectableInCurrentCorps(state, candidateUnit)) {
          return state;
        }
      }

      return {
        ...state,
        game: syncCommandContextSnapshots({
          ...state.game,
          selectedUnitId: action.unitId,
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
          chargePreview: createInitialChargePreview(),
          commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
        }, action.unitId),
      };

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
        game: {
          ...reduceSetAdvanceMode(state.game, action.isActive),
          ...createInitialSlideState(),
        },
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
        game: {
          ...reduceSetWheelMode(state.game, action.isActive),
          ...createInitialAdvanceState(),
          ...createInitialSlideState(),
        },
      };

    case ACTION_TYPES.SET_SLIDE_MODE:
      if (action.isActive && !isMovementCommandAllowed(state.game)) {
        return state;
      }
      return {
        ...state,
        game: {
          ...reduceSetSlideMode(state.game, action.isActive),
          ...createInitialAdvanceState(),
          ...createInitialWheelState(),
        },
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

    case ACTION_TYPES.START_CHARGE_PREVIEW:
      return reduceStartChargePreview(state, action.unitId ?? state.game.selectedUnitId);

    case ACTION_TYPES.SET_CHARGE_TARGET:
      return reduceSetChargeTarget(state, action.targetUnitId);

    case ACTION_TYPES.PREVIEW_CHARGE_START_MANOEUVRE:
      return reducePreviewChargeStartManoeuvre(state, action);

    case ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE:
      return reduceSelectChargeStartManoeuvre(state, action);

    case ACTION_TYPES.SELECT_CHARGE_CONTACT_SIDE:
      return reduceSelectChargeContactSide(state, action);

    case ACTION_TYPES.CONFIRM_CHARGE_DIRECTION:
      return reduceConfirmChargeDirection(state);

    case ACTION_TYPES.RESOLVE_CHARGE_REACTION:
      return reduceResolveChargeReaction(state, action.decisionType);

    case ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION:
      return reduceResolveSecondaryChargeReaction(state, action.decisionType);

    case ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL:
      return reduceStartAdjustedChargeDistanceRoll(state);

    case ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE:
      return reduceResolveChargeBranchDistance(state, action.dieRoll);

    case ACTION_TYPES.PREVIEW_EVADE_AVOIDANCE_NODE:
      return reducePreviewEvadeAvoidanceNode(state, action.stepId);

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
      return reduceAttachCommander(state, action.unitId ?? state.game.selectedUnitId);

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
      return reduceCancelCommanderFreeMovePreview(state);

    case ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE:
      return reduceConfirmCommanderFreeMove(state);

    case ACTION_TYPES.RESET_COMMANDER_FREE_MOVE:
      return reduceResetCommanderFreeMove(state, action.unitId ?? state.game.selectedUnitId);

    case ACTION_TYPES.MARK_UNIT_STAY:
      return reduceMarkUnitStay(state, action.unitId ?? state.game.selectedUnitId);

    case ACTION_TYPES.RESET_TEST_UNITS:
      {
        const resetUnitId = action.unitId ?? state.game.selectedUnitId;
        if (!resetUnitId) {
          return state;
        }

        const baselinePose = state.game.initialUnitPositions[resetUnitId];
        if (!baselinePose) {
          return state;
        }

        const detachedUnits = clearAttachmentRelationsForUnit(state.game.units, resetUnitId);
        const nextUnits = detachedUnits.map((unit) => (
          unit.id === resetUnitId
            ? {
                ...unit,
                xUd: baselinePose.xUd,
                yUd: baselinePose.yUd,
                rotationRadians: baselinePose.rotationRadians ?? unit.rotationRadians ?? 0,
                advanceUsedUd: 0,
                slideUsedThisMovementPhase: false,
                stayedThisMovementPhase: false,
                commanderMovePhaseStartXUd: null,
                commanderMovePhaseStartYUd: null,
                attachOriginXUd: null,
                attachOriginYUd: null,
                attachOriginRotationRadians: null,
                attachOriginAdvanceUsedUd: null,
              }
            : unit
        ));
        const nextSelectedUnit = nextUnits.find((unit) => unit.id === state.game.selectedUnitId) || nextUnits[0] || null;
        const refundResult = refundCommandPointsForUnit(state.game.commandContext.commandPoints, resetUnitId);
        const nextGameState = syncCommandContextSnapshots({
          ...state.game,
          commandContext: {
            ...state.game.commandContext,
            commandPoints: refundResult.nextState,
          },
          movement: createInitialMovementState(),
          commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
          ...createInitialAdvanceState(),
          ...createInitialSlideState(),
          ...createInitialWheelState(),
          debug: createInitialDebugState(nextSelectedUnit),
          units: nextUnits,
        }, state.game.selectedUnitId);
        const syncedResetGameState = syncAttachedCommanderWithHost(nextGameState, resetUnitId);

        return {
          ...state,
          game: syncedResetGameState,
        };
      }

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

function reduceCancelCommanderFreeMovePreview(state) {
  if (state.game.commanderFreeMovePreview?.status === 'idle') {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
    },
  };
}

function reduceConfirmCommanderFreeMove(state) {
  const preview = state.game.commanderFreeMovePreview;
  if (preview?.status !== 'ready' || !preview.unitId || !Number.isFinite(preview.xUd) || !Number.isFinite(preview.yUd)) {
    return state;
  }

  const unit = state.game.units.find((candidate) => candidate.id === preview.unitId) || null;
  if (!unit) {
    return state;
  }

  if (preview.mode === 'attach') {
    const targetUnit = state.game.units.find((candidate) => candidate.id === preview.targetUnitId) || null;
    if (!targetUnit || !canAttachCommanderToUnit(state.game, targetUnit, unit)) {
      return state;
    }

    const updatedCommander = {
      ...unit,
      xUd: Number(preview.xUd),
      yUd: Number(preview.yUd),
      rotationRadians: targetUnit.rotationRadians ?? unit.rotationRadians ?? 0,
      attachedUnitId: targetUnit.id,
      attachOriginXUd: Number.isFinite(preview.attachOriginXUd) ? Number(preview.attachOriginXUd) : unit.xUd,
      attachOriginYUd: Number.isFinite(preview.attachOriginYUd) ? Number(preview.attachOriginYUd) : unit.yUd,
      attachOriginRotationRadians: Number.isFinite(preview.attachOriginRotationRadians)
        ? Number(preview.attachOriginRotationRadians)
        : (unit.rotationRadians ?? 0),
      attachOriginAdvanceUsedUd: Number.isFinite(preview.attachOriginAdvanceUsedUd)
        ? Number(preview.attachOriginAdvanceUsedUd)
        : Number(unit.advanceUsedUd ?? 0),
      advanceUsedUd: Number(preview.nextSpentUd ?? unit.advanceUsedUd ?? 0),
      slideUsedThisMovementPhase: false,
      stayedThisMovementPhase: false,
      commanderMovePhaseStartXUd: Number.isFinite(unit.commanderMovePhaseStartXUd)
        ? unit.commanderMovePhaseStartXUd
        : preview.phaseStartXUd,
      commanderMovePhaseStartYUd: Number.isFinite(unit.commanderMovePhaseStartYUd)
        ? unit.commanderMovePhaseStartYUd
        : preview.phaseStartYUd,
    };
    const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
    if (!isUnitFootprintWithinBattlefield(updatedCommander, battlefieldProfile)) {
      return state;
    }

    const isStartingCommanderMove = (unit.advanceUsedUd ?? 0) <= POSITION_GUARD_EPSILON;
    const commandPointSpendResult = isStartingCommanderMove
      ? spendFreeCommandPoint(state.game.commandContext.commandPoints, { unitId: unit.id })
      : { ok: true, nextState: state.game.commandContext.commandPoints };
    if (!commandPointSpendResult.ok) {
      return state;
    }

    const nextUnits = state.game.units.map((candidate) => {
      if (candidate.id === updatedCommander.id) {
        return updatedCommander;
      }

      if (candidate.id === targetUnit.id) {
        return {
          ...candidate,
          attachedCommanderId: unit.id,
        };
      }

      return candidate;
    });

    return {
      ...state,
      game: finalizeCommandAttachmentState({
        ...state.game,
        commandContext: {
          ...state.game.commandContext,
          commandPoints: commandPointSpendResult.nextState,
        },
        commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
        units: nextUnits,
      }),
    };
  }

  if (!canUseCommanderFreeMove(state, unit)) {
    return state;
  }

  const updatedUnit = {
    ...unit,
    xUd: Number(preview.xUd),
    yUd: Number(preview.yUd),
    advanceUsedUd: Number(preview.nextSpentUd ?? unit.advanceUsedUd ?? 0),
    slideUsedThisMovementPhase: false,
    stayedThisMovementPhase: false,
    commanderMovePhaseStartXUd: Number.isFinite(unit.commanderMovePhaseStartXUd)
      ? unit.commanderMovePhaseStartXUd
      : preview.phaseStartXUd,
    commanderMovePhaseStartYUd: Number.isFinite(unit.commanderMovePhaseStartYUd)
      ? unit.commanderMovePhaseStartYUd
      : preview.phaseStartYUd,
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  if (!isUnitFootprintWithinBattlefield(updatedUnit, battlefieldProfile)) {
    return state;
  }

  const isStartingCommanderMove = (unit.advanceUsedUd ?? 0) <= POSITION_GUARD_EPSILON;
  const commandPointSpendResult = isStartingCommanderMove
    ? spendFreeCommandPoint(state.game.commandContext.commandPoints, { unitId: unit.id })
    : { ok: true, nextState: state.game.commandContext.commandPoints };
  if (!commandPointSpendResult.ok) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        commandPoints: commandPointSpendResult.nextState,
      },
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      units: state.game.units.map((candidate) =>
        candidate.id === updatedUnit.id ? updatedUnit : candidate
      ),
    },
  };
}

function canResetCommanderFreeMove(state, unit) {
  if (!unit || state.game.setup.isActive) {
    return false;
  }

  if (!unit.isCommander || unit.hasIncludedCommander || unit.attachedUnitId) {
    return false;
  }

  if (unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
  const hasPhaseStartPose = Number.isFinite(unit.commanderMovePhaseStartXUd)
    && Number.isFinite(unit.commanderMovePhaseStartYUd);
  return Boolean(
    activeCorpsSlotId
      && unitCorpsSlotId
      && activeCorpsSlotId === unitCorpsSlotId
      && hasPhaseStartPose
      && (unit.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON,
  );
}

function reduceResetCommanderFreeMove(state, unitId) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  if (!unit || !canResetCommanderFreeMove(state, unit)) {
    return state;
  }

  const commandPoints = state.game.commandContext.commandPoints;
  const shouldRefundFreeCp = Number(commandPoints?.free ?? 0) < 1;
  const refundResult = shouldRefundFreeCp
    ? refundFreeCommandPoint(commandPoints, { unitId })
    : { ok: true, nextState: commandPoints };
  if (!refundResult.ok) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        commandPoints: refundResult.nextState,
      },
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      units: state.game.units.map((candidate) =>
        candidate.id === unitId
          ? {
              ...candidate,
              xUd: unit.commanderMovePhaseStartXUd,
              yUd: unit.commanderMovePhaseStartYUd,
              advanceUsedUd: 0,
              slideUsedThisMovementPhase: false,
              stayedThisMovementPhase: false,
              commanderMovePhaseStartXUd: null,
              commanderMovePhaseStartYUd: null,
            }
          : candidate
      ),
    },
  };
}
