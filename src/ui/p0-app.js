import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { getRotatedRectangleBounds } from '../engine/geometry/index.js';
import { ACTION_TYPES, SCREEN_IDS } from '../state/p0-state.js';
import { renderBattlefieldScreen } from './p0-battlefield.js';

const KEY_BINDING_ROWS = [
  {
    id: 'overlayCycle',
    label: 'Overlay umschalten',
    defaultKey: 'V',
  },
];

function getPlayerAccent(state) {
  return state.shell.settings.playerColor;
}

function formatBindingValue(value) {
  return value || 'Nicht belegt';
}

function normalizeKeyInput(key) {
  if (!key) {
    return '';
  }

  if (key === ' ') {
    return 'Space';
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  return key;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const battlefieldPanSession = {
  active: false,
  dispatch: null,
  surface: null,
  container: null,
  zoom: 1,
  startMouseX: 0,
  startMouseY: 0,
  startPanX: 0,
  startPanY: 0,
  currentPanX: 0,
  currentPanY: 0,
};

const battlefieldAdvanceDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  startMouseY: 0,
  startPreviewUd: 0,
  maxAdvanceUd: 4,
  battlefieldProfile: null,
};

const battlefieldDebugDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  footprint: null,
  battlefieldProfile: null,
};

const battlefieldUnitDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  battlefieldProfile: null,
  unitId: null,
  footprint: null,
};

const battlefieldTerrainDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  battlefieldProfile: null,
  placeholderId: null,
  footprint: null,
};

const battlefieldSetupObjectDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  battlefieldProfile: null,
  setupObjectId: null,
};

const battlefieldAmbushMarkerDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  battlefieldProfile: null,
  markerId: null,
};

let suppressNextBattlefieldSurfaceClick = false;

const battlefieldOverlayHotkeyContext = {
  currentScreen: SCREEN_IDS.MAIN_MENU,
  primary: '',
  secondary: '',
  dispatch: null,
};

const battlefieldUiMemory = {
  panelScrollTopById: {},
  openStateByPersistId: {},
};

function captureBattlefieldUiMemory(container) {
  container.querySelectorAll('[data-panel-id]').forEach((panel) => {
    battlefieldUiMemory.panelScrollTopById[panel.dataset.panelId] = panel.scrollTop;
  });

  container.querySelectorAll('[data-persist-id]').forEach((details) => {
    battlefieldUiMemory.openStateByPersistId[details.dataset.persistId] = details.open;
  });
}

function restoreBattlefieldUiMemory(container) {
  container.querySelectorAll('[data-panel-id]').forEach((panel) => {
    const scrollTop = battlefieldUiMemory.panelScrollTopById[panel.dataset.panelId];
    if (typeof scrollTop === 'number') {
      panel.scrollTop = scrollTop;
    }
  });

  container.querySelectorAll('[data-persist-id]').forEach((details) => {
    const isOpen = battlefieldUiMemory.openStateByPersistId[details.dataset.persistId];
    if (typeof isOpen === 'boolean') {
      details.open = isOpen;
    }
  });
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.matches('input, textarea, select, [contenteditable="true"]');
}

function matchesOverlayHotkey(eventKey, bindingValue) {
  if (!bindingValue) {
    return false;
  }

  return normalizeKeyInput(eventKey) === bindingValue;
}

function clampViewportPan(surface, zoom, panX, panY) {
  const rect = surface.getBoundingClientRect();
  const maxPanX = Math.max(0, rect.width * (zoom - 1));
  const maxPanY = Math.max(0, rect.height * (zoom - 1));

  return {
    panX: clamp(panX, 0, maxPanX),
    panY: clamp(panY, 0, maxPanY),
  };
}

function stopBattlefieldPanSession() {
  if (battlefieldPanSession.surface) {
    battlefieldPanSession.surface.classList.remove('is-panning');
  }

  battlefieldPanSession.active = false;
  battlefieldPanSession.dispatch = null;
  battlefieldPanSession.surface = null;
  battlefieldPanSession.container = null;
}

function syncBattlefieldMinimapBox(container, surface, zoom, panX, panY) {
  const minimapViewport = container.querySelector('[data-battlefield-minimap-viewport]');
  if (!surface || !minimapViewport) {
    return;
  }

  const rect = surface.getBoundingClientRect();
  const worldWidth = rect.width * zoom;
  const worldHeight = rect.height * zoom;
  const visibleWidthPercent = 100 / zoom;
  const visibleHeightPercent = 100 / zoom;
  const leftPercent = worldWidth > 0 ? (panX / worldWidth) * 100 : 0;
  const topPercent = worldHeight > 0 ? (panY / worldHeight) * 100 : 0;

  minimapViewport.style.left = `${leftPercent}%`;
  minimapViewport.style.top = `${topPercent}%`;
  minimapViewport.style.width = `${visibleWidthPercent}%`;
  minimapViewport.style.height = `${visibleHeightPercent}%`;
}

function handleBattlefieldPanMove(event) {
  if (!battlefieldPanSession.active || !battlefieldPanSession.surface || !battlefieldPanSession.dispatch) {
    return;
  }

  const nextPan = clampViewportPan(
    battlefieldPanSession.surface,
    battlefieldPanSession.zoom,
    battlefieldPanSession.startPanX - (event.clientX - battlefieldPanSession.startMouseX),
    battlefieldPanSession.startPanY - (event.clientY - battlefieldPanSession.startMouseY),
  );

  battlefieldPanSession.currentPanX = nextPan.panX;
  battlefieldPanSession.currentPanY = nextPan.panY;

  const world = battlefieldPanSession.surface.querySelector('[data-battlefield-world]');
  if (world) {
    world.style.setProperty('--viewport-pan-x', `${nextPan.panX}px`);
    world.style.setProperty('--viewport-pan-y', `${nextPan.panY}px`);
  }

  if (battlefieldPanSession.container) {
    syncBattlefieldMinimapBox(
      battlefieldPanSession.container,
      battlefieldPanSession.surface,
      battlefieldPanSession.zoom,
      nextPan.panX,
      nextPan.panY,
    );
  }
}

function handleBattlefieldPanEnd() {
  if (battlefieldPanSession.active && battlefieldPanSession.dispatch) {
    battlefieldPanSession.dispatch({
      type: ACTION_TYPES.SET_BATTLEFIELD_VIEWPORT,
      viewport: {
        panX: battlefieldPanSession.currentPanX,
        panY: battlefieldPanSession.currentPanY,
      },
    });
  }

  stopBattlefieldPanSession();
}

function stopBattlefieldAdvanceDragSession() {
  battlefieldAdvanceDragSession.active = false;
  battlefieldAdvanceDragSession.dispatch = null;
  battlefieldAdvanceDragSession.surfaceRect = null;
  battlefieldAdvanceDragSession.battlefieldProfile = null;
}

function clampBattlefieldPointUd(surfaceRect, zoom, panX, panY, clientX, clientY, battlefieldProfile, footprint = null) {
  const worldX = clientX - surfaceRect.left + panX;
  const worldY = clientY - surfaceRect.top + panY;
  const rawXUd = (worldX / (surfaceRect.width * zoom)) * battlefieldProfile.widthUd;
  const rawYUd = (worldY / (surfaceRect.height * zoom)) * battlefieldProfile.heightUd;

  if (!footprint) {
    return {
      xUd: clamp(rawXUd, 0, battlefieldProfile.widthUd),
      yUd: clamp(rawYUd, 0, battlefieldProfile.heightUd),
    };
  }

  const footprintBounds = getRotatedRectangleBounds({
    center: { x: 0, y: 0 },
    widthUd: footprint.widthUd,
    depthUd: footprint.depthUd,
    rotationRadians: footprint.rotationRadians,
  });
  const minCenterX = -footprintBounds.minX;
  const maxCenterX = battlefieldProfile.widthUd - footprintBounds.maxX;
  const minCenterY = -footprintBounds.minY;
  const maxCenterY = battlefieldProfile.heightUd - footprintBounds.maxY;

  return {
    xUd: clamp(rawXUd, minCenterX, maxCenterX),
    yUd: clamp(rawYUd, minCenterY, maxCenterY),
  };
}

function getBattlefieldPointUd(surfaceRect, zoom, panX, panY, clientX, clientY, battlefieldProfile) {
  const worldX = clientX - surfaceRect.left + panX;
  const worldY = clientY - surfaceRect.top + panY;

  return {
    xUd: (worldX / (surfaceRect.width * zoom)) * battlefieldProfile.widthUd,
    yUd: (worldY / (surfaceRect.height * zoom)) * battlefieldProfile.heightUd,
  };
}

function clampBattlefieldCenterToFootprint(xUd, yUd, battlefieldProfile, footprint) {
  if (!footprint) {
    return {
      xUd: clamp(xUd, 0, battlefieldProfile.widthUd),
      yUd: clamp(yUd, 0, battlefieldProfile.heightUd),
    };
  }

  const footprintBounds = getRotatedRectangleBounds({
    center: { x: 0, y: 0 },
    widthUd: footprint.widthUd,
    depthUd: footprint.depthUd,
    rotationRadians: footprint.rotationRadians,
  });

  return {
    xUd: clamp(xUd, -footprintBounds.minX, battlefieldProfile.widthUd - footprintBounds.maxX),
    yUd: clamp(yUd, -footprintBounds.minY, battlefieldProfile.heightUd - footprintBounds.maxY),
  };
}

function stopBattlefieldDebugDragSession() {
  battlefieldDebugDragSession.active = false;
  battlefieldDebugDragSession.dispatch = null;
  battlefieldDebugDragSession.surfaceRect = null;
  battlefieldDebugDragSession.footprint = null;
  battlefieldDebugDragSession.battlefieldProfile = null;
}

function stopBattlefieldUnitDragSession() {
  battlefieldUnitDragSession.active = false;
  battlefieldUnitDragSession.dispatch = null;
  battlefieldUnitDragSession.surfaceRect = null;
  battlefieldUnitDragSession.battlefieldProfile = null;
  battlefieldUnitDragSession.unitId = null;
  battlefieldUnitDragSession.footprint = null;
}

function stopBattlefieldTerrainDragSession() {
  battlefieldTerrainDragSession.active = false;
  battlefieldTerrainDragSession.dispatch = null;
  battlefieldTerrainDragSession.surfaceRect = null;
  battlefieldTerrainDragSession.battlefieldProfile = null;
  battlefieldTerrainDragSession.placeholderId = null;
  battlefieldTerrainDragSession.footprint = null;
}

function stopBattlefieldSetupObjectDragSession() {
  battlefieldSetupObjectDragSession.active = false;
  battlefieldSetupObjectDragSession.dispatch = null;
  battlefieldSetupObjectDragSession.surfaceRect = null;
  battlefieldSetupObjectDragSession.battlefieldProfile = null;
  battlefieldSetupObjectDragSession.setupObjectId = null;
}

function stopBattlefieldAmbushMarkerDragSession() {
  battlefieldAmbushMarkerDragSession.active = false;
  battlefieldAmbushMarkerDragSession.dispatch = null;
  battlefieldAmbushMarkerDragSession.surfaceRect = null;
  battlefieldAmbushMarkerDragSession.battlefieldProfile = null;
  battlefieldAmbushMarkerDragSession.markerId = null;
}

function handleBattlefieldDebugDragMove(event) {
  if (
    !battlefieldDebugDragSession.active
    || !battlefieldDebugDragSession.dispatch
    || !battlefieldDebugDragSession.surfaceRect
  ) {
    return;
  }

  const pointUd = clampBattlefieldPointUd(
    battlefieldDebugDragSession.surfaceRect,
    battlefieldDebugDragSession.zoom,
    battlefieldDebugDragSession.panX,
    battlefieldDebugDragSession.panY,
    event.clientX,
    event.clientY,
    battlefieldDebugDragSession.battlefieldProfile,
    battlefieldDebugDragSession.footprint,
  );

  battlefieldDebugDragSession.dispatch({
    type: ACTION_TYPES.SET_DEBUG_UNIT_POSITION,
    xUd: Number(pointUd.xUd.toFixed(3)),
    yUd: Number(pointUd.yUd.toFixed(3)),
  });
}

function handleBattlefieldUnitDragMove(event) {
  if (
    !battlefieldUnitDragSession.active
    || !battlefieldUnitDragSession.dispatch
    || !battlefieldUnitDragSession.surfaceRect
    || !battlefieldUnitDragSession.unitId
  ) {
    return;
  }

  const pointUd = clampBattlefieldPointUd(
    battlefieldUnitDragSession.surfaceRect,
    battlefieldUnitDragSession.zoom,
    battlefieldUnitDragSession.panX,
    battlefieldUnitDragSession.panY,
    event.clientX,
    event.clientY,
    battlefieldUnitDragSession.battlefieldProfile,
    battlefieldUnitDragSession.footprint,
  );

  battlefieldUnitDragSession.dispatch({
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: battlefieldUnitDragSession.unitId,
    xUd: Number(pointUd.xUd.toFixed(3)),
    yUd: Number(pointUd.yUd.toFixed(3)),
  });
}

function handleBattlefieldTerrainDragMove(event) {
  if (
    !battlefieldTerrainDragSession.active
    || !battlefieldTerrainDragSession.dispatch
    || !battlefieldTerrainDragSession.surfaceRect
    || !battlefieldTerrainDragSession.placeholderId
  ) {
    return;
  }

  const pointUd = getBattlefieldPointUd(
    battlefieldTerrainDragSession.surfaceRect,
    battlefieldTerrainDragSession.zoom,
    battlefieldTerrainDragSession.panX,
    battlefieldTerrainDragSession.panY,
    event.clientX,
    event.clientY,
    battlefieldTerrainDragSession.battlefieldProfile,
  );

  battlefieldTerrainDragSession.dispatch({
    type: ACTION_TYPES.UPDATE_TERRAIN_PLACEHOLDER,
    placeholderId: battlefieldTerrainDragSession.placeholderId,
    patch: {
      pose: {
        xUd: Number(pointUd.xUd.toFixed(3)),
        yUd: Number(pointUd.yUd.toFixed(3)),
      },
    },
  });
}

function handleBattlefieldSetupObjectDragMove(event) {
  if (
    !battlefieldSetupObjectDragSession.active
    || !battlefieldSetupObjectDragSession.dispatch
    || !battlefieldSetupObjectDragSession.surfaceRect
    || !battlefieldSetupObjectDragSession.setupObjectId
  ) {
    return;
  }

  const pointUd = getBattlefieldPointUd(
    battlefieldSetupObjectDragSession.surfaceRect,
    battlefieldSetupObjectDragSession.zoom,
    battlefieldSetupObjectDragSession.panX,
    battlefieldSetupObjectDragSession.panY,
    event.clientX,
    event.clientY,
    battlefieldSetupObjectDragSession.battlefieldProfile,
  );

  battlefieldSetupObjectDragSession.dispatch({
    type: ACTION_TYPES.UPDATE_SETUP_OBJECT,
    setupObjectId: battlefieldSetupObjectDragSession.setupObjectId,
    patch: {
      pose: {
        xUd: Number(pointUd.xUd.toFixed(3)),
        yUd: Number(pointUd.yUd.toFixed(3)),
      },
    },
  });
}

function handleBattlefieldAmbushMarkerDragMove(event) {
  if (
    !battlefieldAmbushMarkerDragSession.active
    || !battlefieldAmbushMarkerDragSession.dispatch
    || !battlefieldAmbushMarkerDragSession.surfaceRect
    || !battlefieldAmbushMarkerDragSession.markerId
  ) {
    return;
  }

  const pointUd = getBattlefieldPointUd(
    battlefieldAmbushMarkerDragSession.surfaceRect,
    battlefieldAmbushMarkerDragSession.zoom,
    battlefieldAmbushMarkerDragSession.panX,
    battlefieldAmbushMarkerDragSession.panY,
    event.clientX,
    event.clientY,
    battlefieldAmbushMarkerDragSession.battlefieldProfile,
  );

  battlefieldAmbushMarkerDragSession.dispatch({
    type: ACTION_TYPES.UPDATE_AMBUSH_MARKER,
    markerId: battlefieldAmbushMarkerDragSession.markerId,
    patch: {
      pose: {
        xUd: Number(pointUd.xUd.toFixed(3)),
        yUd: Number(pointUd.yUd.toFixed(3)),
      },
    },
  });
}

function handleBattlefieldDebugDragEnd() {
  if (!battlefieldDebugDragSession.active) {
    return;
  }

  suppressNextBattlefieldSurfaceClick = true;
  stopBattlefieldDebugDragSession();
}

function handleBattlefieldUnitDragEnd() {
  if (!battlefieldUnitDragSession.active) {
    return;
  }

  suppressNextBattlefieldSurfaceClick = true;
  stopBattlefieldUnitDragSession();
}

function handleBattlefieldTerrainDragEnd() {
  if (!battlefieldTerrainDragSession.active) {
    return;
  }

  suppressNextBattlefieldSurfaceClick = true;
  stopBattlefieldTerrainDragSession();
}

function handleBattlefieldSetupObjectDragEnd() {
  if (!battlefieldSetupObjectDragSession.active) {
    return;
  }

  suppressNextBattlefieldSurfaceClick = true;
  stopBattlefieldSetupObjectDragSession();
}

function handleBattlefieldAmbushMarkerDragEnd() {
  if (!battlefieldAmbushMarkerDragSession.active) {
    return;
  }

  suppressNextBattlefieldSurfaceClick = true;
  stopBattlefieldAmbushMarkerDragSession();
}

function handleBattlefieldAdvanceDragMove(event) {
  if (!battlefieldAdvanceDragSession.active || !battlefieldAdvanceDragSession.dispatch || !battlefieldAdvanceDragSession.surfaceRect) {
    return;
  }

  const pixelsPerUd = (battlefieldAdvanceDragSession.surfaceRect.height * battlefieldAdvanceDragSession.zoom)
    / battlefieldAdvanceDragSession.battlefieldProfile.heightUd;
  if (!pixelsPerUd) {
    return;
  }

  const deltaUd = -(event.clientY - battlefieldAdvanceDragSession.startMouseY) / pixelsPerUd;
  battlefieldAdvanceDragSession.dispatch({
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: clamp(
      battlefieldAdvanceDragSession.startPreviewUd + deltaUd,
      0,
      battlefieldAdvanceDragSession.maxAdvanceUd,
    ),
  });
}

function handleBattlefieldAdvanceDragEnd() {
  if (!battlefieldAdvanceDragSession.active) {
    return;
  }

  suppressNextBattlefieldSurfaceClick = true;
  stopBattlefieldAdvanceDragSession();
}

window.addEventListener('mousemove', handleBattlefieldPanMove);
window.addEventListener('mouseup', handleBattlefieldPanEnd);
window.addEventListener('mousemove', handleBattlefieldAdvanceDragMove);
window.addEventListener('mouseup', handleBattlefieldAdvanceDragEnd);
window.addEventListener('mousemove', handleBattlefieldDebugDragMove);
window.addEventListener('mouseup', handleBattlefieldDebugDragEnd);
window.addEventListener('mousemove', handleBattlefieldUnitDragMove);
window.addEventListener('mouseup', handleBattlefieldUnitDragEnd);
window.addEventListener('mousemove', handleBattlefieldTerrainDragMove);
window.addEventListener('mouseup', handleBattlefieldTerrainDragEnd);
window.addEventListener('mousemove', handleBattlefieldSetupObjectDragMove);
window.addEventListener('mouseup', handleBattlefieldSetupObjectDragEnd);
window.addEventListener('mousemove', handleBattlefieldAmbushMarkerDragMove);
window.addEventListener('mouseup', handleBattlefieldAmbushMarkerDragEnd);
window.addEventListener('keydown', (event) => {
  if (
    event.repeat
    || battlefieldOverlayHotkeyContext.currentScreen !== SCREEN_IDS.BATTLEFIELD
    || !battlefieldOverlayHotkeyContext.dispatch
    || event.altKey
    || event.metaKey
    || isEditableTarget(event.target)
  ) {
    return;
  }

  const normalizedKey = normalizeKeyInput(event.key);

  if (!event.ctrlKey && normalizedKey === 'H') {
    event.preventDefault();
    battlefieldOverlayHotkeyContext.dispatch({ type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
    return;
  }

  if (!event.ctrlKey && normalizedKey === 'F') {
    event.preventDefault();
    battlefieldOverlayHotkeyContext.dispatch({ type: ACTION_TYPES.TOGGLE_FACING_GEOMETRY_OVERLAY });
    return;
  }

  const matchesPrimary = matchesOverlayHotkey(event.key, battlefieldOverlayHotkeyContext.primary);
  const matchesSecondary = matchesOverlayHotkey(event.key, battlefieldOverlayHotkeyContext.secondary);
  if (!matchesPrimary && !matchesSecondary) {
    return;
  }

  event.preventDefault();
  battlefieldOverlayHotkeyContext.dispatch({ type: ACTION_TYPES.CYCLE_OVERLAY_MODE });
});

function syncBattlefieldMinimap(container, state) {
  const surface = container.querySelector('[data-battlefield-surface]');
  if (!surface) {
    return;
  }

  syncBattlefieldMinimapBox(container, surface, state.game.viewport.zoom, state.game.viewport.panX, state.game.viewport.panY);
}

function attachBattlefieldViewportControls(container, state, dispatch) {
  const surface = container.querySelector('[data-battlefield-surface]');
  if (!surface) {
    return;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;

  syncBattlefieldMinimap(container, state);

  surface.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();

      if (event.ctrlKey && event.shiftKey && state.game.debug.isActive) {
        if (!selectedUnit) {
          return;
        }

        const rotationStepRadians = (Math.PI / 180) * 15;
        const rotationDelta = event.deltaY < 0 ? rotationStepRadians : -rotationStepRadians;
        dispatch({
          type: ACTION_TYPES.SET_SELECTED_UNIT_ROTATION,
          rotationRadians: (selectedUnit.rotationRadians ?? 0) + rotationDelta,
        });
        return;
      }

      if (event.ctrlKey && state.game.debug.isActive) {
        const rotationStepRadians = (Math.PI / 180) * 15;
        const rotationDelta = event.deltaY < 0 ? rotationStepRadians : -rotationStepRadians;
        const nextRotationRadians = state.game.debug.unitPose.rotationRadians + rotationDelta;
        const clampedCenter = clampBattlefieldCenterToFootprint(
          state.game.debug.unitPose.xUd,
          state.game.debug.unitPose.yUd,
          battlefieldProfile,
          {
            widthUd: state.game.debug.unitDimensions.widthUd,
            depthUd: state.game.debug.unitDimensions.depthUd,
            rotationRadians: nextRotationRadians,
          },
        );

        dispatch({
          type: ACTION_TYPES.SET_DEBUG_UNIT_POSITION,
          xUd: Number(clampedCenter.xUd.toFixed(3)),
          yUd: Number(clampedCenter.yUd.toFixed(3)),
        });
        dispatch({
          type: ACTION_TYPES.SET_DEBUG_UNIT_ROTATION,
          rotationRadians: nextRotationRadians,
        });
        return;
      }

      const currentZoom = state.game.viewport.zoom;
      const zoomDelta = event.deltaY < 0 ? 0.12 : -0.12;
      const nextZoom = clamp(Number((currentZoom + zoomDelta).toFixed(2)), 1, 3);
      const rect = surface.getBoundingClientRect();
      const currentWorldWidth = rect.width * currentZoom;
      const currentWorldHeight = rect.height * currentZoom;
      const centerRatioX = currentWorldWidth > 0 ? (state.game.viewport.panX + rect.width / 2) / currentWorldWidth : 0.5;
      const centerRatioY = currentWorldHeight > 0 ? (state.game.viewport.panY + rect.height / 2) / currentWorldHeight : 0.5;
      const nextPanX = centerRatioX * (rect.width * nextZoom) - rect.width / 2;
      const nextPanY = centerRatioY * (rect.height * nextZoom) - rect.height / 2;
      const clampedPan = clampViewportPan(surface, nextZoom, nextPanX, nextPanY);

      if (nextZoom !== currentZoom) {
        dispatch({
          type: ACTION_TYPES.SET_BATTLEFIELD_VIEWPORT,
          viewport: {
            zoom: nextZoom,
            panX: clampedPan.panX,
            panY: clampedPan.panY,
          },
        });
      }
    },
    { passive: false },
  );

  surface.addEventListener('mousedown', (event) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    stopBattlefieldPanSession();
    battlefieldPanSession.active = true;
    battlefieldPanSession.dispatch = dispatch;
    battlefieldPanSession.surface = surface;
    battlefieldPanSession.container = container;
    battlefieldPanSession.zoom = state.game.viewport.zoom;
    battlefieldPanSession.startMouseX = event.clientX;
    battlefieldPanSession.startMouseY = event.clientY;
    battlefieldPanSession.startPanX = state.game.viewport.panX;
    battlefieldPanSession.startPanY = state.game.viewport.panY;
    battlefieldPanSession.currentPanX = state.game.viewport.panX;
    battlefieldPanSession.currentPanY = state.game.viewport.panY;
    surface.classList.add('is-panning');
  });

  surface.addEventListener('auxclick', (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });
}

function renderMainMenu() {
  return `
    <section class="shell-card">
      <div class="status-strip">
        <span class="status-pill">P0 Shell</span>
        <span class="status-pill">Standard 200 als Default</span>
        <span class="status-pill">Deterministische Menuefuehrung</span>
      </div>
      <h1 class="hero-title">AdG Online</h1>
      <p class="hero-copy">Produkt-Shell fuer den ersten spielbaren Ablauf: Hauptmenue, neues Spiel, Optionen, Lade-Platzhalter und erster Uebergang zum Schlachtfeld.</p>
      <div class="menu-grid">
        <button class="shell-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.NEW_GAME}">Neues Spiel</button>
        <button class="shell-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.LOAD_GAME}">Spiel Laden</button>
        <button class="shell-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.OPTIONS}">Optionen</button>
      </div>
    </section>
  `;
}

function renderNewGame(state) {
  const { mode, points } = state.shell.newGame;
  return `
    <section class="shell-card section-stack">
      <div>
        <h1>Neues Spiel</h1>
        <p class="muted-copy">P0 aktiviert nur den Singleplayer-Startpfad. Multiplayer bleibt sichtbar, aber absichtlich deaktiviert.</p>
      </div>
      <div class="summary-banner">
        <strong>Aktuelle Auswahl:</strong> ${mode === 'singleplayer' ? 'Singleplayer' : mode} / ${points} Punkte
      </div>
      <div>
        <h2 class="section-title">Spielmodus</h2>
        <div class="choice-grid">
          <button class="shell-button ${mode === 'singleplayer' ? 'is-active' : ''}" type="button" data-action="set-mode" data-mode="singleplayer" aria-pressed="${mode === 'singleplayer'}">Singleplayer</button>
          <button class="shell-button" type="button" disabled>Multiplayer (spaeter)</button>
        </div>
      </div>
      <div>
        <h2 class="section-title">Punkteformat</h2>
        <div class="choice-grid">
        ${[100, 200, 300]
          .map(
            (value) => `
              <button class="shell-button ${points === value ? 'is-active' : ''}" type="button" data-action="set-points" data-points="${value}" aria-pressed="${points === value}">${value}</button>
            `,
          )
          .join('')}
        </div>
        <p class="muted-copy">200 bleibt das P0-Default fuer den spaeteren Standard-200-Pfad.</p>
      </div>
      <div class="shell-card">
        <h3>Erster P0-Handoff</h3>
        <p class="muted-copy">Der Start geht jetzt zuerst in den P3-Setup-Rahmen auf dem Schlachtfeld. Armeeauswahl, Aufbau und offizielle Deployment-Validierung folgen weiterhin erst in spaeteren Phasen.</p>
      </div>
      <div class="screen-actions">
        <button class="shell-button is-active" type="button" data-action="start-new-game">Zum Setup</button>
        <button class="ghost-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.MAIN_MENU}">Zurueck</button>
      </div>
    </section>
  `;
}

function renderOptions(state) {
  const { settings, settingsDraft } = state.shell;
  const activeColor = settings.playerColor;
  const draftColor = settingsDraft.playerColor;
  const activeOverlayPrimary = settings.keyBindings.overlayCycle.primary;
  const draftKeyBindings = settingsDraft.keyBindings;
  return `
    <section class="shell-card section-stack">
      <h1>Optionen</h1>
      <p class="muted-copy">Diese Einstellungen beeinflussen nur Darstellung und Bedienung der Shell, niemals die Regel-Logik.</p>
      <div class="summary-banner">
        <strong>Aktive Shell-Einstellungen:</strong> Spielerfarbe ${activeColor.toUpperCase()} / Overlay-Taste ${formatBindingValue(activeOverlayPrimary)} / Massstab-Overlay ${settings.showScaleOverlay ? 'an' : 'aus'}
      </div>
      <div class="field-label">
        Spielerfarbe
        <div class="color-picker-row">
          <div class="color-display-pill">
            <span class="color-swatch large" style="background:${draftColor}"></span>
          </div>
          <button class="shell-button color-picker-button" type="button" data-action="open-color-picker">Farbe aendern</button>
        </div>
        <input class="native-color-input" type="color" value="${draftColor}" data-setting="player-color-draft" />
      </div>
      <section class="section-stack keyboard-card">
        <div>
          <h2 class="section-title">Schlachtfeld</h2>
        </div>
        <label class="toggle-row">
          <input type="checkbox" data-setting="scale-overlay-toggle" ${settingsDraft.showScaleOverlay ? 'checked' : ''} />
          <span>Massstab unten rechts als Overlay anzeigen</span>
        </label>
      </section>
      <section class="section-stack keyboard-card">
        <div>
          <h2 class="section-title">Tastaturbelegung</h2>
          <p class="muted-copy">In die Zelle klicken und danach die neue Taste druecken. Die Aenderung wird erst mit Speichern uebernommen.</p>
        </div>
        <div class="binding-table-wrap">
          <table class="binding-table">
            <thead>
              <tr>
                <th>Funktion</th>
                <th>Standard Taste</th>
                <th>Alternative</th>
              </tr>
            </thead>
            <tbody>
              ${KEY_BINDING_ROWS.map(
                (binding) => `
                  <tr>
                    <td>${binding.label}</td>
                    <td>
                      <button
                        class="binding-key ${draftKeyBindings[binding.id].primary ? 'is-filled' : ''}"
                        type="button"
                        data-action="capture-binding"
                        data-binding-id="${binding.id}"
                        data-binding-slot="primary"
                      >${formatBindingValue(draftKeyBindings[binding.id].primary)}</button>
                    </td>
                    <td>
                      <button
                        class="binding-key ${draftKeyBindings[binding.id].secondary ? 'is-filled' : ''}"
                        type="button"
                        data-action="capture-binding"
                        data-binding-id="${binding.id}"
                        data-binding-slot="secondary"
                      >${formatBindingValue(draftKeyBindings[binding.id].secondary)}</button>
                    </td>
                  </tr>
                `,
              ).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <p class="muted-copy">Einstellungen gelten nur fuer diese Sitzung.</p>
      <div class="screen-actions">
        <button class="shell-button is-active" type="button" data-action="save-settings">Speichern</button>
        <button class="ghost-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.MAIN_MENU}">Zurueck</button>
      </div>
    </section>
  `;
}

function renderLoadGame() {
  return `
    <section class="shell-card section-stack">
      <h1>Spiel Laden</h1>
      <p class="muted-copy">Save/Load kommt in einer spaeteren Phase. P0 prueft hier nur, dass die Produkt-Shell einen echten, navigierbaren Platzhalter besitzt.</p>
      <div class="summary-banner">
        Spaeter kommen Match-Wiederaufnahme, gespeicherte Shell-Einstellungen und echte Kampflaststaende hinzu.
      </div>
      <div class="placeholder-list" aria-label="P0 Lade-Platzhalter">
        <div class="placeholder-item">
          <strong>Keine Speicherstaende in P0</strong>
          <span>Diese Phase prueft nur Menuefluss und Ruecknavigation.</span>
        </div>
        <div class="placeholder-item is-disabled">
          <strong>Match fortsetzen</strong>
          <span>Kommt in spaeterer Phase mit echter Spielstandsstruktur.</span>
        </div>
      </div>
      <div class="screen-actions">
        <button class="ghost-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.MAIN_MENU}">Zurueck</button>
      </div>
    </section>
  `;
}

function renderScreen(state) {
  switch (state.shell.currentScreen) {
    case SCREEN_IDS.NEW_GAME:
      return renderNewGame(state);
    case SCREEN_IDS.OPTIONS:
      return renderOptions(state);
    case SCREEN_IDS.LOAD_GAME:
      return renderLoadGame(state);
    case SCREEN_IDS.BATTLEFIELD:
      return renderBattlefieldScreen(state);
    case SCREEN_IDS.MAIN_MENU:
    default:
      return renderMainMenu(state);
  }
}

export function renderApp(container, state, dispatch) {
  const playerAccent = getPlayerAccent(state);
  const showStateSnapshot = state.shell.currentScreen !== SCREEN_IDS.BATTLEFIELD;
  const shouldPreserveBattlefieldUi = state.shell.currentScreen === SCREEN_IDS.BATTLEFIELD;
  battlefieldOverlayHotkeyContext.currentScreen = state.shell.currentScreen;
  battlefieldOverlayHotkeyContext.primary = state.shell.settings.keyBindings.overlayCycle.primary;
  battlefieldOverlayHotkeyContext.secondary = state.shell.settings.keyBindings.overlayCycle.secondary;
  battlefieldOverlayHotkeyContext.dispatch = dispatch;

  if (shouldPreserveBattlefieldUi) {
    captureBattlefieldUiMemory(container);
  }

  container.innerHTML = `
    <main class="app-shell" style="--player-accent:${playerAccent}">
      <div class="shell-layout">
        ${renderScreen(state)}
        ${showStateSnapshot ? `
          <section class="shell-card">
            <h2>P0 State Snapshot</h2>
            <pre class="state-snapshot">${JSON.stringify(state, null, 2)}</pre>
          </section>
        ` : ''}
      </div>
    </main>
  `;

  if (shouldPreserveBattlefieldUi) {
    restoreBattlefieldUiMemory(container);
  }

  container.querySelectorAll('[data-action="navigate"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.NAVIGATE, screenId: button.dataset.screen });
    });
  });

  container.querySelectorAll('[data-action="set-mode"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SET_NEW_GAME_MODE, mode: button.dataset.mode });
    });
  });

  container.querySelectorAll('[data-action="set-points"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SET_NEW_GAME_POINTS, points: Number(button.dataset.points) });
    });
  });

  const openColorPickerButton = container.querySelector('[data-action="open-color-picker"]');
  const playerColorDraftInput = container.querySelector('[data-setting="player-color-draft"]');
  if (openColorPickerButton && playerColorDraftInput) {
    openColorPickerButton.addEventListener('click', () => {
      playerColorDraftInput.click();
    });
  }

  if (playerColorDraftInput) {
    playerColorDraftInput.addEventListener('change', (event) => {
      dispatch({ type: ACTION_TYPES.SET_PLAYER_COLOR_DRAFT, playerColorDraft: event.target.value });
    });
  }

  const scaleOverlayToggle = container.querySelector('[data-setting="scale-overlay-toggle"]');
  if (scaleOverlayToggle) {
    scaleOverlayToggle.addEventListener('change', (event) => {
      dispatch({ type: ACTION_TYPES.SET_SCALE_OVERLAY_DRAFT, showScaleOverlay: event.target.checked });
    });
  }

  container.querySelectorAll('[data-action="capture-binding"]').forEach((button) => {
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        return;
      }

      event.preventDefault();
      dispatch({
        type: ACTION_TYPES.SET_KEY_BINDING_DRAFT,
        bindingId: button.dataset.bindingId,
        slot: button.dataset.bindingSlot,
        keyValue: normalizeKeyInput(event.key),
      });
    });
  });

  const saveSettingsButton = container.querySelector('[data-action="save-settings"]');
  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SAVE_SETTINGS });
    });
  }

  const startNewGameButton = container.querySelector('[data-action="start-new-game"]');
  if (startNewGameButton) {
    startNewGameButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.START_NEW_GAME });
    });
  }

  const setupPreviousButton = container.querySelector('[data-action="setup-previous"]');
  if (setupPreviousButton) {
    setupPreviousButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.GO_TO_PREVIOUS_SETUP_STEP });
    });
  }

  const setupLockButton = container.querySelector('[data-action="setup-lock"]');
  if (setupLockButton) {
    setupLockButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.LOCK_CURRENT_SETUP_STEP });
    });
  }

  const setupNextButton = container.querySelector('[data-action="setup-next"]');
  if (setupNextButton) {
    setupNextButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.ADVANCE_SETUP_STEP });
    });
  }

  const completeSetupButton = container.querySelector('[data-action="complete-setup"]');
  if (completeSetupButton) {
    completeSetupButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.COMPLETE_SETUP });
    });
  }

  const battlefieldSurface = container.querySelector('[data-battlefield-surface]');
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
  const selectedTerrainPlaceholder = state.game.setup.terrain.placeholders.find(
    (placeholder) => placeholder.id === state.game.setup.terrain.selectedPlaceholderId,
  ) || null;
  const selectedSetupObject = state.game.setup.setupObjects.placeholders.find(
    (setupObject) => setupObject.id === state.game.setup.setupObjects.selectedObjectId,
  ) || null;
  const remainingAdvanceBudgetUd = selectedUnit ? Math.max(0, 4 - (selectedUnit.advanceUsedUd ?? 0)) : 4;
  const maxAdvanceUd = selectedUnit ? Math.min(remainingAdvanceBudgetUd, selectedUnit.yUd) : 4;
  const canDragUnitsInSetup = state.game.setup.isActive
    && (state.game.setup.currentStepId === 'deployment' || state.game.setup.currentStepId === 'ready');
  const isTerrainPlacementStep = state.game.setup.isActive
    && (state.game.setup.currentStepId === 'terrain' || state.game.setup.currentStepId === 'terrain-adjustment');
  const isCampPlacementStep = state.game.setup.isActive && state.game.setup.currentStepId === 'camps';
  const isAmbushPlacementStep = state.game.setup.isActive && state.game.setup.currentStepId === 'ambushes';
  const canEditOwnerPrivateSetup = state.game.setupViewMode === 'canonical' || state.game.setupViewMode === 'player-one-view';

  container.querySelectorAll('[data-action="set-setup-view-mode"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.SET_SETUP_VIEW_MODE,
        viewMode: button.dataset.viewMode,
      });
    });
  });

  container.querySelectorAll('[data-action="add-terrain-placeholder"]').forEach((button, index) => {
    button.addEventListener('click', () => {
      const existingCount = state.game.setup.terrain.placeholders.length;
      dispatch({
        type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
        placeholder: {
          id: `terrain-${Date.now()}-${index}`,
          terrainType: button.dataset.terrainType,
          label: button.dataset.terrainLabel,
          shapeModel: button.dataset.terrainShape,
          pose: {
            xUd: 6 + Math.min(existingCount, 4) * 2.5,
            yUd: 6 + Math.min(existingCount, 3) * 1.8,
          },
          footprint: {
            widthUd: Number(button.dataset.terrainWidthUd),
            depthUd: Number(button.dataset.terrainDepthUd),
            rotationRadians: 0,
          },
        },
      });
    });
  });

  container.querySelectorAll('[data-action="add-setup-object"]').forEach((button, index) => {
    button.addEventListener('click', () => {
      const existingCount = state.game.setup.setupObjects.placeholders.length;
      dispatch({
        type: ACTION_TYPES.ADD_SETUP_OBJECT,
        setupObject: {
          id: `setup-object-${Date.now()}-${index}`,
          family: button.dataset.setupObjectFamily,
          type: button.dataset.setupObjectType,
          label: button.dataset.setupObjectLabel,
          owner: 'public',
          pose: {
            xUd: 8 + Math.min(existingCount, 4) * 2.1,
            yUd: 15 + Math.min(existingCount, 3) * 1.1,
          },
          footprint: {
            widthUd: Number(button.dataset.setupObjectWidthUd),
            depthUd: Number(button.dataset.setupObjectDepthUd),
            rotationRadians: 0,
          },
        },
      });
    });
  });

  container.querySelectorAll('[data-action="add-ambush-marker"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.ADD_AMBUSH_MARKER,
      });
    });
  });

  container.querySelectorAll('[data-action="select-terrain-placeholder"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER, placeholderId: button.dataset.terrainPlaceholderId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !isTerrainPlacementStep) {
        return;
      }

      const placeholderId = button.dataset.terrainPlaceholderId;
      const placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === placeholderId);
      if (!placeholder) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      battlefieldTerrainDragSession.active = true;
      battlefieldTerrainDragSession.dispatch = dispatch;
      battlefieldTerrainDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
      battlefieldTerrainDragSession.zoom = state.game.viewport.zoom;
      battlefieldTerrainDragSession.panX = state.game.viewport.panX;
      battlefieldTerrainDragSession.panY = state.game.viewport.panY;
      battlefieldTerrainDragSession.battlefieldProfile = battlefieldProfile;
      battlefieldTerrainDragSession.placeholderId = placeholderId;
      battlefieldTerrainDragSession.footprint = {
        widthUd: placeholder.footprint.widthUd,
        depthUd: placeholder.footprint.depthUd,
        rotationRadians: placeholder.footprint.rotationRadians,
      };
      dispatch({ type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER, placeholderId });
    });
  });

  container.querySelectorAll('[data-action="select-setup-object"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_SETUP_OBJECT, setupObjectId: button.dataset.setupObjectId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !isCampPlacementStep) {
        return;
      }

      const setupObjectId = button.dataset.setupObjectId;
      const setupObject = state.game.setup.setupObjects.placeholders.find((candidate) => candidate.id === setupObjectId);
      if (!setupObject) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      battlefieldSetupObjectDragSession.active = true;
      battlefieldSetupObjectDragSession.dispatch = dispatch;
      battlefieldSetupObjectDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
      battlefieldSetupObjectDragSession.zoom = state.game.viewport.zoom;
      battlefieldSetupObjectDragSession.panX = state.game.viewport.panX;
      battlefieldSetupObjectDragSession.panY = state.game.viewport.panY;
      battlefieldSetupObjectDragSession.battlefieldProfile = battlefieldProfile;
      battlefieldSetupObjectDragSession.setupObjectId = setupObjectId;
      dispatch({ type: ACTION_TYPES.SELECT_SETUP_OBJECT, setupObjectId });
    });
  });

  container.querySelectorAll('[data-action="select-battle-plan-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_BATTLE_PLAN_CORPS, corpsId: button.dataset.corpsId });
    });
  });

  container.querySelectorAll('[data-action="assign-battle-plan-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
        corpsId: state.game.setup.battlePlan.selectedCorpsId,
        fieldId: button.dataset.fieldId,
      });
    });
  });

  container.querySelectorAll('[data-action="select-ambush-marker"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!canEditOwnerPrivateSetup) {
        return;
      }

      dispatch({ type: ACTION_TYPES.SELECT_AMBUSH_MARKER, markerId: button.dataset.markerId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !isAmbushPlacementStep || !canEditOwnerPrivateSetup) {
        return;
      }

      const markerId = button.dataset.markerId;
      const marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === markerId);
      if (!marker) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      battlefieldAmbushMarkerDragSession.active = true;
      battlefieldAmbushMarkerDragSession.dispatch = dispatch;
      battlefieldAmbushMarkerDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
      battlefieldAmbushMarkerDragSession.zoom = state.game.viewport.zoom;
      battlefieldAmbushMarkerDragSession.panX = state.game.viewport.panX;
      battlefieldAmbushMarkerDragSession.panY = state.game.viewport.panY;
      battlefieldAmbushMarkerDragSession.battlefieldProfile = battlefieldProfile;
      battlefieldAmbushMarkerDragSession.markerId = markerId;
      dispatch({ type: ACTION_TYPES.SELECT_AMBUSH_MARKER, markerId });
    });
  });

  container.querySelectorAll('[data-action="edit-ambush-notes"]').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      dispatch({
        type: ACTION_TYPES.UPDATE_AMBUSH_MARKER_CONTENTS,
        markerId: textarea.dataset.markerId,
        privateContents: {
          notes: textarea.value,
        },
      });
    });
  });

  const toggleAdvanceModeButton = container.querySelector('[data-action="toggle-advance-mode"]');
  if (toggleAdvanceModeButton) {
    toggleAdvanceModeButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: !state.game.advanceModeActive });
    });
  }

  container.querySelectorAll('[data-action="select-unit"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_UNIT, unitId: button.dataset.unitId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface) {
        return;
      }

      if (canDragUnitsInSetup && state.game.selectedUnitId === button.dataset.unitId) {
        event.preventDefault();
        suppressNextBattlefieldSurfaceClick = true;
        battlefieldUnitDragSession.active = true;
        battlefieldUnitDragSession.dispatch = dispatch;
        battlefieldUnitDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
        battlefieldUnitDragSession.zoom = state.game.viewport.zoom;
        battlefieldUnitDragSession.panX = state.game.viewport.panX;
        battlefieldUnitDragSession.panY = state.game.viewport.panY;
        battlefieldUnitDragSession.battlefieldProfile = battlefieldProfile;
        battlefieldUnitDragSession.unitId = button.dataset.unitId;
        battlefieldUnitDragSession.footprint = selectedUnit
          ? {
              widthUd: selectedUnit.widthUd,
              depthUd: selectedUnit.depthUd,
              rotationRadians: selectedUnit.rotationRadians ?? 0,
            }
          : null;
        return;
      }

      if (
        !state.game.advanceModeActive
        || state.game.selectedUnitId !== button.dataset.unitId
      ) {
        return;
      }

      event.preventDefault();
      suppressNextBattlefieldSurfaceClick = true;
      battlefieldAdvanceDragSession.active = true;
      battlefieldAdvanceDragSession.dispatch = dispatch;
      battlefieldAdvanceDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
      battlefieldAdvanceDragSession.zoom = state.game.viewport.zoom;
      battlefieldAdvanceDragSession.battlefieldProfile = battlefieldProfile;
      battlefieldAdvanceDragSession.startMouseY = event.clientY;
      battlefieldAdvanceDragSession.startPreviewUd = state.game.advancePreviewUd;
      battlefieldAdvanceDragSession.maxAdvanceUd = maxAdvanceUd;
    });
  });

  container.querySelectorAll('[data-debug-unit]').forEach((debugUnit) => {
    debugUnit.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !state.game.debug.isActive) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      battlefieldDebugDragSession.active = true;
      battlefieldDebugDragSession.dispatch = dispatch;
      battlefieldDebugDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
      battlefieldDebugDragSession.zoom = state.game.viewport.zoom;
      battlefieldDebugDragSession.panX = state.game.viewport.panX;
      battlefieldDebugDragSession.panY = state.game.viewport.panY;
      battlefieldDebugDragSession.battlefieldProfile = battlefieldProfile;
      battlefieldDebugDragSession.footprint = {
        widthUd: state.game.debug.unitDimensions.widthUd,
        depthUd: state.game.debug.unitDimensions.depthUd,
        rotationRadians: state.game.debug.unitPose.rotationRadians,
      };
    });
  });

  if (battlefieldSurface) {
    battlefieldSurface.addEventListener('click', (event) => {
      if (suppressNextBattlefieldSurfaceClick) {
        suppressNextBattlefieldSurfaceClick = false;
        return;
      }

      if (
        event.target.closest('[data-action="select-unit"]')
        || event.target.closest('[data-debug-unit]')
        || event.target.closest('[data-action="select-terrain-placeholder"]')
        || event.target.closest('[data-action="select-setup-object"]')
      ) {
        return;
      }

      dispatch({ type: ACTION_TYPES.SELECT_UNIT, unitId: null });
      if (selectedTerrainPlaceholder) {
        dispatch({ type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER, placeholderId: null });
      }
      if (selectedSetupObject) {
        dispatch({ type: ACTION_TYPES.SELECT_SETUP_OBJECT, setupObjectId: null });
      }
    });
  }

  const confirmAdvanceButton = container.querySelector('[data-action="confirm-advance"]');
  if (confirmAdvanceButton) {
    confirmAdvanceButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.CONFIRM_ADVANCE });
    });
  }

  const resetTestUnitsButton = container.querySelector('[data-action="reset-test-units"]');
  if (resetTestUnitsButton) {
    resetTestUnitsButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.RESET_TEST_UNITS });
    });
  }

  attachBattlefieldViewportControls(container, state, dispatch);
}