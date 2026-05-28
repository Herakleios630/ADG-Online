import { createInitialChargePreview } from '../engine/charge/index.js';
import { createInitialAdvanceState } from './p0-advance.js';
import { toCorpsSlotId } from './p0-corps-slot.js';
import { reduceSelectActiveCorps as reduceSelectActiveCorpsContext } from './p0-command-context.js';
import { createInitialMovementState } from './p0-movement.js';
import { createInitialSlideState } from './p0-slide.js';
import { createInitialWheelState } from './p0-wheel.js';

const OPTIONS_SCREEN_ID = 'options';
const MAIN_MENU_SCREEN_ID = 'main-menu';
const OVERLAY_MODES = ['Aus', 'Aufstellungszonen', 'Sektoren', 'Beides'];
const BATTLEFIELD_VIEWPORT_LIMITS = {
  zoomMin: 1,
  zoomMax: 3,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getSelectedUnit(state) {
  return state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
}

export function isUnitSelectableInCurrentCorps(state, unit) {
  if (!unit || unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  if (!activeCorpsSlotId) {
    return true;
  }

  return toCorpsSlotId(unit.corpsId) === activeCorpsSlotId;
}

function getNextOverlayMode(currentMode) {
  const currentIndex = OVERLAY_MODES.indexOf(currentMode);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % OVERLAY_MODES.length;
  return OVERLAY_MODES[nextIndex];
}

function sanitizeViewport(viewport) {
  return {
    zoom: clamp(viewport.zoom ?? 1, BATTLEFIELD_VIEWPORT_LIMITS.zoomMin, BATTLEFIELD_VIEWPORT_LIMITS.zoomMax),
    panX: Number.isFinite(viewport.panX) ? viewport.panX : 0,
    panY: Number.isFinite(viewport.panY) ? viewport.panY : 0,
  };
}

export function reduceNavigate(state, screenId, cloneSettings) {
  return {
    ...state,
    shell: {
      ...state.shell,
      currentScreen: screenId,
      settingsDraft:
        screenId === OPTIONS_SCREEN_ID
          ? cloneSettings(state.shell.settings)
          : state.shell.settingsDraft,
    },
  };
}

export function reduceSetPlayerColorDraft(state, playerColorDraft) {
  return {
    ...state,
    shell: {
      ...state.shell,
      settingsDraft: {
        ...state.shell.settingsDraft,
        playerColor: playerColorDraft,
      },
    },
  };
}

export function reduceSetKeyBindingDraft(state, bindingId, slot, keyValue) {
  return {
    ...state,
    shell: {
      ...state.shell,
      settingsDraft: {
        ...state.shell.settingsDraft,
        keyBindings: {
          ...state.shell.settingsDraft.keyBindings,
          [bindingId]: {
            ...state.shell.settingsDraft.keyBindings[bindingId],
            [slot]: keyValue,
          },
        },
      },
    },
  };
}

export function reduceSetScaleOverlayDraft(state, showScaleOverlay) {
  return {
    ...state,
    shell: {
      ...state.shell,
      settingsDraft: {
        ...state.shell.settingsDraft,
        showScaleOverlay,
      },
    },
  };
}

export function reduceSaveSettings(state, cloneSettings) {
  return {
    ...state,
    shell: {
      ...state.shell,
      currentScreen: MAIN_MENU_SCREEN_ID,
      settings: cloneSettings(state.shell.settingsDraft),
    },
  };
}

export function reduceSetNewGameMode(state, mode) {
  return {
    ...state,
    shell: {
      ...state.shell,
      newGame: {
        ...state.shell.newGame,
        mode,
      },
    },
  };
}

export function reduceSetNewGamePoints(state, points) {
  return {
    ...state,
    shell: {
      ...state.shell,
      newGame: {
        ...state.shell.newGame,
        points,
      },
    },
  };
}

export function reduceSetBattlefieldViewport(state, viewportPatch) {
  return {
    ...state,
    game: {
      ...state.game,
      viewport: sanitizeViewport({
        ...state.game.viewport,
        ...viewportPatch,
      }),
    },
  };
}

export function reduceSelectActiveCorpsState(state, corpsId, createInitialCommanderFreeMovePreview) {
  const nextState = {
    ...state,
    game: reduceSelectActiveCorpsContext(state.game, corpsId),
  };
  const selectedUnit = getSelectedUnit(nextState);

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

export function reduceCycleOverlayMode(state) {
  return {
    ...state,
    game: {
      ...state.game,
      overlayMode: getNextOverlayMode(state.game.overlayMode),
    },
  };
}