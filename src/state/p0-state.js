export const SCREEN_IDS = {
  MAIN_MENU: 'main-menu',
  NEW_GAME: 'new-game',
  OPTIONS: 'options',
  LOAD_GAME: 'load-game',
  BATTLEFIELD: 'battlefield',
};

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
  SET_BATTLEFIELD_VIEWPORT: 'game/set-battlefield-viewport',
  CYCLE_OVERLAY_MODE: 'game/cycle-overlay-mode',
  SELECT_UNIT: 'game/select-unit',
  SET_ADVANCE_MODE: 'game/set-advance-mode',
  SET_ADVANCE_PREVIEW_DISTANCE: 'game/set-advance-preview-distance',
  CONFIRM_ADVANCE: 'game/confirm-advance',
  RESET_TEST_UNITS: 'game/reset-test-units',
};

const P0_ADVANCE_LIMIT_UD = 4;

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

function createInitialViewport() {
  return {
    zoom: 1,
    panX: 0,
    panY: 0,
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
      battlefieldProfileId: 'standard-120x80',
      overlayMode: 'Aus',
      viewport: createInitialViewport(),
      advanceModeActive: false,
      advancePreviewUd: 0,
      initialUnitPositions: {
        'test-unit-1': {
          xUd: 10,
          yUd: 10,
        },
      },
      selectedUnitId: null,
      units: [
        {
          id: 'test-unit-1',
          owner: 'player-1',
          xUd: 10,
          yUd: 10,
          facing: 'north',
          widthUd: 1,
          depthUd: 0.5,
          advanceUsedUd: 0,
        },
      ],
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
          viewport: createInitialViewport(),
          advanceModeActive: false,
          advancePreviewUd: 0,
          units: state.game.units.map((unit) => ({
            ...unit,
            xUd: state.game.initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
            yUd: state.game.initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
            advanceUsedUd: 0,
          })),
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

    case ACTION_TYPES.SELECT_UNIT:
      return {
        ...state,
        game: {
          ...state.game,
          selectedUnitId: action.unitId,
          advanceModeActive: action.unitId ? state.game.advanceModeActive : false,
          advancePreviewUd: 0,
        },
      };

    case ACTION_TYPES.SET_ADVANCE_MODE:
      return {
        ...state,
        game: {
          ...state.game,
          advanceModeActive: Boolean(action.isActive) && Boolean(state.game.selectedUnitId),
          advancePreviewUd: action.isActive ? state.game.advancePreviewUd : 0,
        },
      };

    case ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE: {
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
      return {
        ...state,
        game: {
          ...state.game,
          advanceModeActive: false,
          advancePreviewUd: 0,
          units: state.game.units.map((unit) => ({
            ...unit,
            xUd: state.game.initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
            yUd: state.game.initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
            advanceUsedUd: 0,
          })),
        },
      };

    default:
      return state;
  }
}