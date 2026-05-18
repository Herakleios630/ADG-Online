export const SCREEN_IDS = {
  MAIN_MENU: 'main-menu',
  NEW_GAME: 'new-game',
  OPTIONS: 'options',
  LOAD_GAME: 'load-game',
  BATTLEFIELD: 'battlefield',
};

import { BATTLEFIELD_PROFILE_IDS } from '../data/battlefield-profiles.js';
import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
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
  isMovementCommandAllowed,
  reduceClearMovementDraft,
  reduceSetUseFreeCommandPointForOrder,
  reduceSelectMovementCommand,
  reduceSetMovementDraft,
  reduceSetMovementPreview,
  withMovementValidationSnapshot,
} from './p0-movement.js';
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

function createBattleStartGameState(state, { setupIsActive, currentBattlePhaseId }) {
  const nextUnits = state.game.units.map((unit) => ({
    ...unit,
    xUd: state.game.initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
    yUd: state.game.initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
    rotationRadians: state.game.initialUnitPositions[unit.id]?.rotationRadians ?? unit.rotationRadians ?? 0,
    advanceUsedUd: 0,
    slideUsedThisMovementPhase: false,
    commanderMovePhaseStartXUd: null,
    commanderMovePhaseStartYUd: null,
  }));
  const setupState = createInitialSetupState(
    setupIsActive,
    getDeploymentSeedUnits(nextUnits),
    getBattlefieldProfile(state.game.battlefieldProfileId),
  );

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
      ...createInitialAdvanceState(),
      ...createInitialSlideState(),
      ...createInitialWheelState(),
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

function isUnitSelectionLockedByPendingMove(gameState, nextUnitId) {
  if (nextUnitId === gameState.selectedUnitId) {
    return false;
  }

  const hasPendingMovementPreview = Array.isArray(gameState.movement?.preview?.segments)
    && gameState.movement.preview.segments.length > 0;
  const hasPendingCommanderPreview = gameState.commanderFreeMovePreview?.status === 'targeting'
    || gameState.commanderFreeMovePreview?.status === 'ready';

  return hasPendingMovementPreview || hasPendingCommanderPreview;
}

function resetMovementCommandUi(gameState) {
  return {
    ...gameState,
    movement: createInitialMovementState(),
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

export function createInitialAppState() {
  const initialSettings = createInitialSettings();
  const p6CommandFixtureUnits = [
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
  ];

  const initialUnits = p6CommandFixtureUnits;
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
      phaseTracker: createInitialPhaseTracker(),
      setup: createInitialSetupState(
        false,
        getDeploymentSeedUnits(initialUnits),
        getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM),
      ),
      setupViewMode: SETUP_VIEW_MODES.CANONICAL,
      overlayMode: 'Aus',
      viewport: createInitialViewport(),
      commandContext: createInitialCommandContextState(BATTLE_PHASE_IDS.COMMAND, createInitialSetupState(
        false,
        getDeploymentSeedUnits(initialUnits),
        getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM),
      ).battlePlan.corpsCards),
      movement: createInitialMovementState(),
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
