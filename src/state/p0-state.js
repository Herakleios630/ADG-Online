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
  createInitialAdvanceState,
  reduceConfirmAdvance,
  reduceSetAdvanceMode,
  reduceSetAdvancePreviewDistance,
} from './p0-advance.js';
import {
  COMMAND_PLAYER_IDS,
  createInitialCommandContextState,
  reduceSelectActiveCorps,
  reduceSetActiveBattlePhase,
  reduceSetActivePlayer,
} from './p0-command-context.js';
import {
  createInitialMovementState,
  isMovementCommandAllowed,
  reduceClearMovementDraft,
  reduceSelectMovementCommand,
  reduceSetMovementDraft,
  reduceSetMovementPreview,
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
import { normalizeAngleRadians } from '../engine/geometry/index.js';
import {
  createInitialSetupState,
  reduceAddAmbushMarker,
  reduceAddSetupObject,
  reduceAddTerrainPlaceholder,
  reduceAdvanceSetupStep,
  reduceAssignBattlePlanCorps,
  reduceCompleteSetup,
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
  GO_TO_PREVIOUS_SETUP_STEP: 'game/go-to-previous-setup-step',
  ADVANCE_SETUP_STEP: 'game/advance-setup-step',
  LOCK_CURRENT_SETUP_STEP: 'game/lock-current-setup-step',
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
  CLEAR_MOVEMENT_DRAFT: 'game/clear-movement-draft',
  CANCEL_MOVEMENT_PREVIEW: 'game/cancel-movement-preview',
  RESET_TEST_UNITS: 'game/reset-test-units',
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

function resetMovementCommandUi(gameState) {
  return {
    ...gameState,
    movement: createInitialMovementState(),
    ...createInitialAdvanceState(),
    ...createInitialSlideState(),
    ...createInitialWheelState(),
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

function getDeploymentSeedUnits(units) {
  return units.filter((unit) => DEPLOYMENT_SEED_UNIT_IDS.includes(unit.id));
}

export function createInitialAppState() {
  const initialSettings = createInitialSettings();
  const initialUnits = [
    {
      id: 'test-unit-1',
      owner: 'player-1',
      xUd: 10,
      yUd: 10,
      facing: 'north',
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
      advanceUsedUd: 0,
      slideUsedThisMovementPhase: false,
    },
    {
      id: 'test-unit-2',
      owner: 'player-2',
      xUd: 10,
      yUd: 3,
      facing: 'south',
      widthUd: 1,
      depthUd: 1,
      rotationRadians: Math.PI,
      advanceUsedUd: 0,
      slideUsedThisMovementPhase: false,
    },
    {
      id: 'test-unit-3',
      owner: 'player-2',
      xUd: 9,
      yUd: 3,
      facing: 'south',
      widthUd: 1,
      depthUd: 1,
      rotationRadians: Math.PI,
      advanceUsedUd: 0,
      slideUsedThisMovementPhase: false,
    },
    {
      id: 'test-unit-4',
      owner: 'player-2',
      xUd: 11,
      yUd: 3,
      facing: 'south',
      widthUd: 1,
      depthUd: 1,
      rotationRadians: Math.PI,
      advanceUsedUd: 0,
      slideUsedThisMovementPhase: false,
    },
  ];
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
      commandContext: createInitialCommandContextState(BATTLE_PHASE_IDS.COMMAND),
      movement: createInitialMovementState(),
      ...createInitialAdvanceState(),
      ...createInitialSlideState(),
      ...createInitialWheelState(),
      initialUnitPositions: {
        'test-unit-1': {
          xUd: 10,
          yUd: 10,
          rotationRadians: 0,
        },
        'test-unit-2': {
          xUd: 10,
          yUd: 3,
          rotationRadians: Math.PI,
        },
        'test-unit-3': {
          xUd: 9,
          yUd: 3,
          rotationRadians: Math.PI,
        },
        'test-unit-4': {
          xUd: 11,
          yUd: 3,
          rotationRadians: Math.PI,
        },
      },
      selectedUnitId: null,
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
      {
        const nextUnits = state.game.units.map((unit) => ({
          ...unit,
          xUd: state.game.initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
          yUd: state.game.initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
          rotationRadians: state.game.initialUnitPositions[unit.id]?.rotationRadians ?? unit.rotationRadians ?? 0,
          advanceUsedUd: 0,
          slideUsedThisMovementPhase: false,
        }));
        const nextSelectedUnit = nextUnits.find((unit) => unit.id === state.game.selectedUnitId) || null;

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
          phaseTracker: createInitialPhaseTracker(),
          setup: createInitialSetupState(
            true,
            getDeploymentSeedUnits(nextUnits),
            getBattlefieldProfile(state.game.battlefieldProfileId),
          ),
          setupViewMode: SETUP_VIEW_MODES.CANONICAL,
          viewport: createInitialViewport(),
          commandContext: createInitialCommandContextState(BATTLE_PHASE_IDS.COMMAND),
          movement: createInitialMovementState(),
          ...createInitialAdvanceState(),
          ...createInitialSlideState(),
          ...createInitialWheelState(),
          debug: createInitialDebugState(nextSelectedUnit ?? nextUnits[0] ?? null),
          units: nextUnits,
        },
      };
      }

    case ACTION_TYPES.GO_TO_PREVIOUS_SETUP_STEP:
      return reduceGoToPreviousSetupStep(state);

    case ACTION_TYPES.ADVANCE_SETUP_STEP:
      return reduceAdvanceSetupStep(state);

    case ACTION_TYPES.LOCK_CURRENT_SETUP_STEP:
      return reduceLockCurrentSetupStep(state);

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
            commandContext: {
              ...nextState.game.commandContext,
              currentPhaseId: nextState.game.phaseTracker.currentBattlePhaseId,
            },
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
            units: action.phaseId === BATTLE_PHASE_IDS.MOVEMENT
              ? nextGameState.units.map((unit) => ({
                  ...unit,
                  slideUsedThisMovementPhase: false,
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
      return {
        ...state,
        game: reduceSelectActiveCorps(state.game, action.corpsId),
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
      return {
        ...state,
        game: {
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
        },
      };

    case ACTION_TYPES.SET_UNIT_POSITION:
      return reduceSetUnitPositionInSetup(state, action.unitId, action.xUd, action.yUd);

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
        game: reduceConfirmAdvance(state.game, selectedUnit),
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
        game: reduceConfirmSlide(state.game, selectedUnit),
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
        game: reduceConfirmWheel(state.game, selectedUnit),
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

    case ACTION_TYPES.RESET_TEST_UNITS:
      {
        const nextUnits = state.game.units.map((unit) => ({
          ...unit,
          xUd: state.game.initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
          yUd: state.game.initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
          rotationRadians: state.game.initialUnitPositions[unit.id]?.rotationRadians ?? unit.rotationRadians ?? 0,
          advanceUsedUd: 0,
          slideUsedThisMovementPhase: false,
        }));
        const nextSelectedUnit = nextUnits.find((unit) => unit.id === state.game.selectedUnitId) || nextUnits[0] || null;

      return {
        ...state,
        game: {
          ...state.game,
          movement: createInitialMovementState(),
          ...createInitialAdvanceState(),
          ...createInitialSlideState(),
          ...createInitialWheelState(),
          debug: createInitialDebugState(nextSelectedUnit),
          units: nextUnits,
        },
      };
      }

    default:
      return state;
  }
}