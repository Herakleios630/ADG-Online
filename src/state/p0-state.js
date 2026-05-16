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
  createAmbushMarker,
  createAmbushMarkerDraft,
  createInitialAmbushMarkersState,
  isAmbushMarkerWithinBattlefield,
} from '../engine/setup/ambush-markers.js';
import {
  createTerrainPlaceholder,
  isTerrainPlaceholderWithinBattlefield,
} from '../engine/setup/terrain-placeholders.js';
import {
  createMandatoryCampPlaceholders,
  createSetupObjectPlaceholder,
  isSetupObjectWithinBattlefield,
} from '../engine/setup/setup-objects.js';
import {
  createInitialDeploymentSetupState,
  createVisibleDeploymentPlaceholder,
  doDeploymentPlaceholdersOverlap,
  isDeploymentPlaceholderWithinBattlefield,
} from '../engine/setup/deployment-placeholders.js';
import {
  assignCorpsToBattlePlanField,
  createInitialBattlePlanState,
} from '../engine/setup/battle-plan.js';
import { SETUP_VIEW_MODES } from '../engine/visibility/setup-view.js';
import {
  createTerrainValidationSnapshot,
  hasBlockingTerrainValidationErrors,
  validateTerrainPlaceholder,
} from '../engine/setup/terrain-validation.js';
import { normalizeAngleRadians } from '../engine/geometry/index.js';

export const SETUP_STEP_IDS = {
  FORMAT: 'format',
  REGION: 'region',
  TERRAIN: 'terrain',
  TERRAIN_ADJUSTMENT: 'terrain-adjustment',
  CAMPS: 'camps',
  BATTLE_PLAN: 'battle-plan',
  AMBUSHES: 'ambushes',
  DEPLOYMENT: 'deployment',
  READY: 'ready',
};

export const SETUP_STEP_DEFINITIONS = [
  { id: SETUP_STEP_IDS.FORMAT, label: 'Formatprofil' },
  { id: SETUP_STEP_IDS.REGION, label: 'Region' },
  { id: SETUP_STEP_IDS.TERRAIN, label: 'Gelaende' },
  { id: SETUP_STEP_IDS.TERRAIN_ADJUSTMENT, label: 'Anpassung' },
  { id: SETUP_STEP_IDS.CAMPS, label: 'Camps' },
  { id: SETUP_STEP_IDS.BATTLE_PLAN, label: 'Battle Plan' },
  { id: SETUP_STEP_IDS.AMBUSHES, label: 'Ambushes' },
  { id: SETUP_STEP_IDS.DEPLOYMENT, label: 'Aufstellung' },
  { id: SETUP_STEP_IDS.READY, label: 'Bereit' },
];

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
  SET_ADVANCE_MODE: 'game/set-advance-mode',
  SET_ADVANCE_PREVIEW_DISTANCE: 'game/set-advance-preview-distance',
  CONFIRM_ADVANCE: 'game/confirm-advance',
  RESET_TEST_UNITS: 'game/reset-test-units',
};

const P0_ADVANCE_LIMIT_UD = 4;

function getSetupStepIndex(stepId) {
  return SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === stepId);
}

function getNextSetupStepId(stepId) {
  const currentIndex = getSetupStepIndex(stepId);
  if (currentIndex === -1 || currentIndex >= SETUP_STEP_DEFINITIONS.length - 1) {
    return stepId;
  }

  return SETUP_STEP_DEFINITIONS[currentIndex + 1].id;
}

function getPreviousSetupStepId(stepId) {
  const currentIndex = getSetupStepIndex(stepId);
  if (currentIndex <= 0) {
    return stepId;
  }

  return SETUP_STEP_DEFINITIONS[currentIndex - 1].id;
}

function isUnitPlacementStep(stepId) {
  return stepId === SETUP_STEP_IDS.DEPLOYMENT || stepId === SETUP_STEP_IDS.READY;
}

function isTerrainPlacementStep(stepId) {
  return stepId === SETUP_STEP_IDS.TERRAIN || stepId === SETUP_STEP_IDS.TERRAIN_ADJUSTMENT;
}

function isSetupObjectPlacementStep(stepId) {
  return stepId === SETUP_STEP_IDS.CAMPS;
}

function isAmbushPlacementStep(stepId) {
  return stepId === SETUP_STEP_IDS.AMBUSHES;
}

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

function clampAdvanceDistance(value, maxDistance = P0_ADVANCE_LIMIT_UD) {
  return clamp(value, 0, maxDistance);
}

function getSelectedUnit(state) {
  return state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
}

function getRemainingAdvanceBudgetUd(unit) {
  return clamp(P0_ADVANCE_LIMIT_UD - (unit.advanceUsedUd ?? 0), 0, P0_ADVANCE_LIMIT_UD);
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

function createTerrainSetupState(placeholders, selectedPlaceholderId, battlefieldProfile, candidatePlaceholder = null) {
  return {
    placeholders,
    selectedPlaceholderId,
    validation: createTerrainValidationSnapshot({
      placeholders,
      selectedPlaceholderId,
      battlefieldProfile,
      candidatePlaceholder,
    }),
  };
}

function createSetupObjectsState(placeholders, selectedObjectId) {
  return {
    placeholders,
    selectedObjectId,
  };
}

function createBattlePlanSetupState() {
  return createInitialBattlePlanState();
}

function createAmbushMarkersSetupState() {
  return createInitialAmbushMarkersState();
}

function createDeploymentSetupState(units, battlefieldProfile) {
  const deploymentState = createInitialDeploymentSetupState(units, battlefieldProfile);
  const overlapPairs = [];

  for (let leftIndex = 0; leftIndex < deploymentState.visiblePlaceholders.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < deploymentState.visiblePlaceholders.length; rightIndex += 1) {
      const left = deploymentState.visiblePlaceholders[leftIndex];
      const right = deploymentState.visiblePlaceholders[rightIndex];

      if (doDeploymentPlaceholdersOverlap(left, right)) {
        overlapPairs.push([left.id, right.id]);
      }
    }
  }

  return {
    ...deploymentState,
    overlapPairs,
  };
}

function createInitialSetupState(
  isActive = false,
  units = [],
  battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM),
) {
  return {
    isActive,
    currentStepId: SETUP_STEP_IDS.FORMAT,
    lockedStepIds: [],
    terrain: createTerrainSetupState([], null, battlefieldProfile),
    setupObjects: createSetupObjectsState(createMandatoryCampPlaceholders(), null),
    battlePlan: createBattlePlanSetupState(),
    ambushMarkers: createAmbushMarkersSetupState(),
    deployment: createDeploymentSetupState(units, battlefieldProfile),
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
      setup: createInitialSetupState(false, initialUnits, getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM)),
      setupViewMode: SETUP_VIEW_MODES.CANONICAL,
      overlayMode: 'Aus',
      viewport: createInitialViewport(),
      advanceModeActive: false,
      advancePreviewUd: 0,
      initialUnitPositions: {
        'test-unit-1': {
          xUd: 10,
          yUd: 10,
          rotationRadians: 0,
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
          setup: createInitialSetupState(true, nextUnits, getBattlefieldProfile(state.game.battlefieldProfileId)),
          setupViewMode: SETUP_VIEW_MODES.CANONICAL,
          viewport: createInitialViewport(),
          advanceModeActive: false,
          advancePreviewUd: 0,
          debug: createInitialDebugState(nextSelectedUnit ?? nextUnits[0] ?? null),
          units: nextUnits,
        },
      };
      }

    case ACTION_TYPES.GO_TO_PREVIOUS_SETUP_STEP:
      if (!state.game.setup.isActive) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            currentStepId: getPreviousSetupStepId(state.game.setup.currentStepId),
          },
        },
      };

    case ACTION_TYPES.ADVANCE_SETUP_STEP:
      if (!state.game.setup.isActive) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            currentStepId: getNextSetupStepId(state.game.setup.currentStepId),
          },
        },
      };

    case ACTION_TYPES.LOCK_CURRENT_SETUP_STEP:
      if (!state.game.setup.isActive || state.game.setup.lockedStepIds.includes(state.game.setup.currentStepId)) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            lockedStepIds: [...state.game.setup.lockedStepIds, state.game.setup.currentStepId],
          },
        },
      };

    case ACTION_TYPES.COMPLETE_SETUP:
      if (!state.game.setup.isActive || state.game.setup.currentStepId !== SETUP_STEP_IDS.READY) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          phaseTracker: {
            ...state.game.phaseTracker,
            mode: 'battle',
          },
          setup: {
            ...state.game.setup,
            isActive: false,
            lockedStepIds: state.game.setup.lockedStepIds.includes(SETUP_STEP_IDS.READY)
              ? state.game.setup.lockedStepIds
              : [...state.game.setup.lockedStepIds, SETUP_STEP_IDS.READY],
          },
        },
      };

    case ACTION_TYPES.SET_SETUP_VIEW_MODE:
      return {
        ...state,
        game: {
          ...state.game,
          setupViewMode: action.viewMode,
        },
      };

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

    case ACTION_TYPES.CYCLE_OVERLAY_MODE:
      return {
        ...state,
        game: {
          ...state.game,
          overlayMode: getNextOverlayMode(state.game.overlayMode),
        },
      };

    case ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER:
      if (!state.game.setup.isActive || !isTerrainPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      {
        const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
        const placeholder = createTerrainPlaceholder(action.placeholder);
        const placeholderResults = validateTerrainPlaceholder(
          placeholder,
          battlefieldProfile,
          [...state.game.setup.terrain.placeholders, placeholder],
        );

        if (hasBlockingTerrainValidationErrors(placeholderResults) || !isTerrainPlaceholderWithinBattlefield(placeholder, battlefieldProfile)) {
          return {
            ...state,
            game: {
              ...state.game,
              setup: {
                ...state.game.setup,
                terrain: createTerrainSetupState(
                  state.game.setup.terrain.placeholders,
                  state.game.setup.terrain.selectedPlaceholderId,
                  battlefieldProfile,
                  placeholder,
                ),
              },
            },
          };
        }

        return {
          ...state,
          game: {
            ...state.game,
            setup: {
              ...state.game.setup,
              terrain: createTerrainSetupState(
                [...state.game.setup.terrain.placeholders, placeholder],
                placeholder.id,
                battlefieldProfile,
              ),
            },
          },
        };
      }

    case ACTION_TYPES.UPDATE_TERRAIN_PLACEHOLDER:
      if (!state.game.setup.isActive || !isTerrainPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      {
        const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
        let rejectedCandidate = null;
        const nextPlaceholders = state.game.setup.terrain.placeholders.map((placeholder) => {
          if (placeholder.id !== action.placeholderId) {
            return placeholder;
          }

          const candidate = createTerrainPlaceholder({
            ...placeholder,
            ...action.patch,
            footprint: {
              ...placeholder.footprint,
              ...action.patch?.footprint,
            },
            pose: {
              ...placeholder.pose,
              ...action.patch?.pose,
            },
          });

          const candidateResults = validateTerrainPlaceholder(candidate, battlefieldProfile, state.game.setup.terrain.placeholders);
          if (
            hasBlockingTerrainValidationErrors(candidateResults)
            || !isTerrainPlaceholderWithinBattlefield(candidate, battlefieldProfile)
          ) {
            rejectedCandidate = candidate;
            return placeholder;
          }

          return candidate;
        });

        return {
          ...state,
          game: {
            ...state.game,
            setup: {
              ...state.game.setup,
              terrain: createTerrainSetupState(
                nextPlaceholders,
                state.game.setup.terrain.selectedPlaceholderId,
                battlefieldProfile,
                rejectedCandidate,
              ),
            },
          },
        };
      }

    case ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER:
      if (!state.game.setup.isActive) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            terrain: createTerrainSetupState(
              state.game.setup.terrain.placeholders,
              action.placeholderId,
              getBattlefieldProfile(state.game.battlefieldProfileId),
            ),
          },
        },
      };

    case ACTION_TYPES.LOCK_TERRAIN_PLACEHOLDER:
      if (!state.game.setup.isActive || !isTerrainPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            terrain: createTerrainSetupState(
              state.game.setup.terrain.placeholders.map((placeholder) =>
                placeholder.id === action.placeholderId
                  ? {
                      ...placeholder,
                      lockState: 'locked',
                    }
                  : placeholder,
              ),
              state.game.setup.terrain.selectedPlaceholderId,
              getBattlefieldProfile(state.game.battlefieldProfileId),
            ),
          },
        },
      };

    case ACTION_TYPES.REMOVE_TERRAIN_PLACEHOLDER:
      if (!state.game.setup.isActive || !isTerrainPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            terrain: createTerrainSetupState(
              state.game.setup.terrain.placeholders.filter((placeholder) => placeholder.id !== action.placeholderId),
              state.game.setup.terrain.selectedPlaceholderId === action.placeholderId
                ? null
                : state.game.setup.terrain.selectedPlaceholderId,
              getBattlefieldProfile(state.game.battlefieldProfileId),
            ),
          },
        },
      };

    case ACTION_TYPES.ADD_SETUP_OBJECT:
      if (!state.game.setup.isActive || !isSetupObjectPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      {
        const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
        const setupObject = createSetupObjectPlaceholder(action.setupObject);
        if (!isSetupObjectWithinBattlefield(setupObject, battlefieldProfile)) {
          return state;
        }

        return {
          ...state,
          game: {
            ...state.game,
            setup: {
              ...state.game.setup,
              setupObjects: createSetupObjectsState(
                [...state.game.setup.setupObjects.placeholders, setupObject],
                setupObject.id,
              ),
            },
          },
        };
      }

    case ACTION_TYPES.UPDATE_SETUP_OBJECT:
      if (!state.game.setup.isActive || !isSetupObjectPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      {
        const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
        const nextSetupObjects = state.game.setup.setupObjects.placeholders.map((setupObject) => {
          if (setupObject.id !== action.setupObjectId) {
            return setupObject;
          }

          const candidate = createSetupObjectPlaceholder({
            ...setupObject,
            ...action.patch,
            footprint: {
              ...setupObject.footprint,
              ...action.patch?.footprint,
            },
            pose: {
              ...setupObject.pose,
              ...action.patch?.pose,
            },
          });

          return isSetupObjectWithinBattlefield(candidate, battlefieldProfile) ? candidate : setupObject;
        });

        return {
          ...state,
          game: {
            ...state.game,
            setup: {
              ...state.game.setup,
              setupObjects: createSetupObjectsState(
                nextSetupObjects,
                state.game.setup.setupObjects.selectedObjectId,
              ),
            },
          },
        };
      }

    case ACTION_TYPES.SELECT_SETUP_OBJECT:
      if (!state.game.setup.isActive) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            setupObjects: createSetupObjectsState(
              state.game.setup.setupObjects.placeholders,
              action.setupObjectId,
            ),
          },
        },
      };

    case ACTION_TYPES.REMOVE_SETUP_OBJECT:
      if (!state.game.setup.isActive || !isSetupObjectPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            setupObjects: createSetupObjectsState(
              state.game.setup.setupObjects.placeholders.filter((setupObject) => setupObject.id !== action.setupObjectId),
              state.game.setup.setupObjects.selectedObjectId === action.setupObjectId
                ? null
                : state.game.setup.setupObjects.selectedObjectId,
            ),
          },
        },
      };

    case ACTION_TYPES.SELECT_BATTLE_PLAN_CORPS:
      if (!state.game.setup.isActive || state.game.setup.currentStepId !== SETUP_STEP_IDS.BATTLE_PLAN) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            battlePlan: {
              ...state.game.setup.battlePlan,
              selectedCorpsId: action.corpsId,
            },
          },
        },
      };

    case ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS:
      if (
        !state.game.setup.isActive
        || state.game.setup.currentStepId !== SETUP_STEP_IDS.BATTLE_PLAN
        || !action.corpsId
        || !action.fieldId
      ) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            battlePlan: assignCorpsToBattlePlanField(state.game.setup.battlePlan, action.corpsId, action.fieldId),
          },
        },
      };

    case ACTION_TYPES.ADD_AMBUSH_MARKER:
      if (!state.game.setup.isActive || !isAmbushPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      {
        const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
        const existingCount = state.game.setup.ambushMarkers.markers.length;
        const marker = createAmbushMarkerDraft(action.marker, existingCount);
        if (!isAmbushMarkerWithinBattlefield(marker, battlefieldProfile)) {
          return state;
        }

        return {
          ...state,
          game: {
            ...state.game,
            setup: {
              ...state.game.setup,
              ambushMarkers: {
                ...state.game.setup.ambushMarkers,
                markers: [...state.game.setup.ambushMarkers.markers, marker],
                selectedMarkerId: marker.id,
              },
            },
          },
        };
      }

    case ACTION_TYPES.SELECT_AMBUSH_MARKER:
      if (!state.game.setup.isActive || !isAmbushPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            ambushMarkers: {
              ...state.game.setup.ambushMarkers,
              selectedMarkerId: action.markerId,
            },
          },
        },
      };

    case ACTION_TYPES.UPDATE_AMBUSH_MARKER:
      if (!state.game.setup.isActive || !isAmbushPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      {
        const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
        const nextMarkers = state.game.setup.ambushMarkers.markers.map((marker) => {
          if (marker.id !== action.markerId) {
            return marker;
          }

          const candidate = createAmbushMarker({
            ...marker,
            ...action.patch,
            footprint: {
              ...marker.footprint,
              ...action.patch?.footprint,
            },
            pose: {
              ...marker.pose,
              ...action.patch?.pose,
            },
            publicShell: {
              ...marker.publicShell,
              ...action.patch?.publicShell,
            },
            privateContents: {
              ...marker.privateContents,
              ...action.patch?.privateContents,
            },
          });

          return isAmbushMarkerWithinBattlefield(candidate, battlefieldProfile) ? candidate : marker;
        });

        return {
          ...state,
          game: {
            ...state.game,
            setup: {
              ...state.game.setup,
              ambushMarkers: {
                ...state.game.setup.ambushMarkers,
                markers: nextMarkers,
              },
            },
          },
        };
      }

    case ACTION_TYPES.UPDATE_AMBUSH_MARKER_CONTENTS:
      if (!state.game.setup.isActive || !isAmbushPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      return {
        ...state,
        game: {
          ...state.game,
          setup: {
            ...state.game.setup,
            ambushMarkers: {
              ...state.game.setup.ambushMarkers,
              markers: state.game.setup.ambushMarkers.markers.map((marker) =>
                marker.id === action.markerId
                  ? {
                      ...marker,
                      privateContents: {
                        ...marker.privateContents,
                        ...action.privateContents,
                      },
                    }
                  : marker,
              ),
            },
          },
        },
      };

    case ACTION_TYPES.SELECT_UNIT:
      return {
        ...state,
        game: {
          ...state.game,
          selectedUnitId: action.unitId,
          advanceModeActive: action.unitId ? state.game.advanceModeActive : false,
          advancePreviewUd: 0,
          debug: action.unitId
            ? state.game.debug
            : {
                ...state.game.debug,
                isActive: false,
                showFacingGeometryOverlay: false,
              },
        },
      };

    case ACTION_TYPES.SET_UNIT_POSITION:
      if (!state.game.setup.isActive || !isUnitPlacementStep(state.game.setup.currentStepId)) {
        return state;
      }

      {
        const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
        const nextUnits = state.game.units.map((unit) =>
          unit.id === action.unitId
            ? {
                ...unit,
                xUd: action.xUd,
                yUd: action.yUd,
              }
            : unit,
        );
        const nextVisiblePlaceholders = state.game.setup.deployment.visiblePlaceholders.map((placeholder) =>
          placeholder.unitId === action.unitId
            ? createVisibleDeploymentPlaceholder({
                ...placeholder,
                pose: { xUd: action.xUd, yUd: action.yUd },
              })
            : placeholder,
        );

        if (nextVisiblePlaceholders.some((placeholder) => !isDeploymentPlaceholderWithinBattlefield(placeholder, battlefieldProfile))) {
          return state;
        }

        const overlapPairs = [];
        for (let leftIndex = 0; leftIndex < nextVisiblePlaceholders.length; leftIndex += 1) {
          for (let rightIndex = leftIndex + 1; rightIndex < nextVisiblePlaceholders.length; rightIndex += 1) {
            const left = nextVisiblePlaceholders[leftIndex];
            const right = nextVisiblePlaceholders[rightIndex];

            if (doDeploymentPlaceholdersOverlap(left, right)) {
              overlapPairs.push([left.id, right.id]);
            }
          }
        }

      return {
        ...state,
        game: {
          ...state.game,
          units: nextUnits,
          setup: {
            ...state.game.setup,
            deployment: {
              ...state.game.setup.deployment,
              visiblePlaceholders: nextVisiblePlaceholders,
              overlapPairs,
            },
          },
        },
      };
      }

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
      if (state.game.setup.isActive) {
        return {
          ...state,
          game: {
            ...state.game,
            advanceModeActive: false,
            advancePreviewUd: 0,
          },
        };
      }

      return {
        ...state,
        game: {
          ...state.game,
          advanceModeActive: Boolean(action.isActive) && Boolean(state.game.selectedUnitId),
          advancePreviewUd: action.isActive ? state.game.advancePreviewUd : 0,
        },
      };

    case ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE: {
      if (state.game.setup.isActive) {
        return state;
      }

      const selectedUnit = getSelectedUnit(state);
      const maxDistance = selectedUnit
        ? Math.min(getRemainingAdvanceBudgetUd(selectedUnit), selectedUnit.yUd)
        : P0_ADVANCE_LIMIT_UD;
      return {
        ...state,
        game: {
          ...state.game,
          advancePreviewUd: clampAdvanceDistance(action.distanceUd, maxDistance),
        },
      };
    }

    case ACTION_TYPES.CONFIRM_ADVANCE: {
      if (state.game.setup.isActive) {
        return state;
      }

      const selectedUnit = getSelectedUnit(state);
      if (!selectedUnit || state.game.advancePreviewUd <= 0) {
        return state;
      }

      const distanceUd = clampAdvanceDistance(
        state.game.advancePreviewUd,
        Math.min(getRemainingAdvanceBudgetUd(selectedUnit), selectedUnit.yUd),
      );
      return {
        ...state,
        game: {
          ...state.game,
          advanceModeActive: false,
          advancePreviewUd: 0,
          units: state.game.units.map((unit) =>
            unit.id === selectedUnit.id
              ? {
                  ...unit,
                  yUd: Math.max(0, unit.yUd - distanceUd),
                  advanceUsedUd: (unit.advanceUsedUd ?? 0) + distanceUd,
                }
              : unit,
          ),
        },
      };
    }

    case ACTION_TYPES.RESET_TEST_UNITS:
      {
        const nextUnits = state.game.units.map((unit) => ({
          ...unit,
          xUd: state.game.initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
          yUd: state.game.initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
          rotationRadians: state.game.initialUnitPositions[unit.id]?.rotationRadians ?? unit.rotationRadians ?? 0,
          advanceUsedUd: 0,
        }));
        const nextSelectedUnit = nextUnits.find((unit) => unit.id === state.game.selectedUnitId) || nextUnits[0] || null;

      return {
        ...state,
        game: {
          ...state.game,
          advanceModeActive: false,
          advancePreviewUd: 0,
          debug: createInitialDebugState(nextSelectedUnit),
          units: nextUnits,
        },
      };
      }

    default:
      return state;
  }
}