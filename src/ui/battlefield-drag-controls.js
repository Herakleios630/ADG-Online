import { ACTION_TYPES } from '../state/p0-state.js';
import { clampBattlefieldPointUd, getBattlefieldPointUd } from './battlefield-coordinate.js';

const battlefieldDebugDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  footprint: null,
  battlefieldProfile: null,
  suppressSurfaceClick: null,
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
  suppressSurfaceClick: null,
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
  suppressSurfaceClick: null,
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
  suppressSurfaceClick: null,
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
  suppressSurfaceClick: null,
};

function suppressSurfaceClick(callback) {
  if (typeof callback === 'function') {
    callback();
  }
}

function stopBattlefieldDebugDragSession() {
  battlefieldDebugDragSession.active = false;
  battlefieldDebugDragSession.dispatch = null;
  battlefieldDebugDragSession.surfaceRect = null;
  battlefieldDebugDragSession.footprint = null;
  battlefieldDebugDragSession.battlefieldProfile = null;
  battlefieldDebugDragSession.suppressSurfaceClick = null;
}

function stopBattlefieldUnitDragSession() {
  battlefieldUnitDragSession.active = false;
  battlefieldUnitDragSession.dispatch = null;
  battlefieldUnitDragSession.surfaceRect = null;
  battlefieldUnitDragSession.battlefieldProfile = null;
  battlefieldUnitDragSession.unitId = null;
  battlefieldUnitDragSession.footprint = null;
  battlefieldUnitDragSession.suppressSurfaceClick = null;
}

function stopBattlefieldTerrainDragSession() {
  battlefieldTerrainDragSession.active = false;
  battlefieldTerrainDragSession.dispatch = null;
  battlefieldTerrainDragSession.surfaceRect = null;
  battlefieldTerrainDragSession.battlefieldProfile = null;
  battlefieldTerrainDragSession.placeholderId = null;
  battlefieldTerrainDragSession.suppressSurfaceClick = null;
}

function stopBattlefieldSetupObjectDragSession() {
  battlefieldSetupObjectDragSession.active = false;
  battlefieldSetupObjectDragSession.dispatch = null;
  battlefieldSetupObjectDragSession.surfaceRect = null;
  battlefieldSetupObjectDragSession.battlefieldProfile = null;
  battlefieldSetupObjectDragSession.setupObjectId = null;
  battlefieldSetupObjectDragSession.suppressSurfaceClick = null;
}

function stopBattlefieldAmbushMarkerDragSession() {
  battlefieldAmbushMarkerDragSession.active = false;
  battlefieldAmbushMarkerDragSession.dispatch = null;
  battlefieldAmbushMarkerDragSession.surfaceRect = null;
  battlefieldAmbushMarkerDragSession.battlefieldProfile = null;
  battlefieldAmbushMarkerDragSession.markerId = null;
  battlefieldAmbushMarkerDragSession.suppressSurfaceClick = null;
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

  suppressSurfaceClick(battlefieldDebugDragSession.suppressSurfaceClick);
  stopBattlefieldDebugDragSession();
}

function handleBattlefieldUnitDragEnd() {
  if (!battlefieldUnitDragSession.active) {
    return;
  }

  suppressSurfaceClick(battlefieldUnitDragSession.suppressSurfaceClick);
  stopBattlefieldUnitDragSession();
}

function handleBattlefieldTerrainDragEnd() {
  if (!battlefieldTerrainDragSession.active) {
    return;
  }

  suppressSurfaceClick(battlefieldTerrainDragSession.suppressSurfaceClick);
  stopBattlefieldTerrainDragSession();
}

function handleBattlefieldSetupObjectDragEnd() {
  if (!battlefieldSetupObjectDragSession.active) {
    return;
  }

  suppressSurfaceClick(battlefieldSetupObjectDragSession.suppressSurfaceClick);
  stopBattlefieldSetupObjectDragSession();
}

function handleBattlefieldAmbushMarkerDragEnd() {
  if (!battlefieldAmbushMarkerDragSession.active) {
    return;
  }

  suppressSurfaceClick(battlefieldAmbushMarkerDragSession.suppressSurfaceClick);
  stopBattlefieldAmbushMarkerDragSession();
}

if (typeof window !== 'undefined') {
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
}

function getSurfaceRect(surface) {
  return surface.getBoundingClientRect();
}

export function startBattlefieldTerrainDrag({
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  placeholderId,
  onSuppressNextSurfaceClick,
}) {
  battlefieldTerrainDragSession.active = true;
  battlefieldTerrainDragSession.dispatch = dispatch;
  battlefieldTerrainDragSession.surfaceRect = getSurfaceRect(battlefieldSurface);
  battlefieldTerrainDragSession.zoom = state.game.viewport.zoom;
  battlefieldTerrainDragSession.panX = state.game.viewport.panX;
  battlefieldTerrainDragSession.panY = state.game.viewport.panY;
  battlefieldTerrainDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldTerrainDragSession.placeholderId = placeholderId;
  battlefieldTerrainDragSession.suppressSurfaceClick = onSuppressNextSurfaceClick;
}

export function startBattlefieldSetupObjectDrag({
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  setupObjectId,
  onSuppressNextSurfaceClick,
}) {
  battlefieldSetupObjectDragSession.active = true;
  battlefieldSetupObjectDragSession.dispatch = dispatch;
  battlefieldSetupObjectDragSession.surfaceRect = getSurfaceRect(battlefieldSurface);
  battlefieldSetupObjectDragSession.zoom = state.game.viewport.zoom;
  battlefieldSetupObjectDragSession.panX = state.game.viewport.panX;
  battlefieldSetupObjectDragSession.panY = state.game.viewport.panY;
  battlefieldSetupObjectDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldSetupObjectDragSession.setupObjectId = setupObjectId;
  battlefieldSetupObjectDragSession.suppressSurfaceClick = onSuppressNextSurfaceClick;
}

export function startBattlefieldAmbushMarkerDrag({
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  markerId,
  onSuppressNextSurfaceClick,
}) {
  battlefieldAmbushMarkerDragSession.active = true;
  battlefieldAmbushMarkerDragSession.dispatch = dispatch;
  battlefieldAmbushMarkerDragSession.surfaceRect = getSurfaceRect(battlefieldSurface);
  battlefieldAmbushMarkerDragSession.zoom = state.game.viewport.zoom;
  battlefieldAmbushMarkerDragSession.panX = state.game.viewport.panX;
  battlefieldAmbushMarkerDragSession.panY = state.game.viewport.panY;
  battlefieldAmbushMarkerDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldAmbushMarkerDragSession.markerId = markerId;
  battlefieldAmbushMarkerDragSession.suppressSurfaceClick = onSuppressNextSurfaceClick;
}

export function startBattlefieldUnitDrag({
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  unitId,
  unit,
  onSuppressNextSurfaceClick,
}) {
  battlefieldUnitDragSession.active = true;
  battlefieldUnitDragSession.dispatch = dispatch;
  battlefieldUnitDragSession.surfaceRect = getSurfaceRect(battlefieldSurface);
  battlefieldUnitDragSession.zoom = state.game.viewport.zoom;
  battlefieldUnitDragSession.panX = state.game.viewport.panX;
  battlefieldUnitDragSession.panY = state.game.viewport.panY;
  battlefieldUnitDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldUnitDragSession.unitId = unitId;
  battlefieldUnitDragSession.footprint = unit
    ? {
        widthUd: unit.widthUd,
        depthUd: unit.depthUd,
        rotationRadians: unit.rotationRadians ?? 0,
      }
    : null;
  battlefieldUnitDragSession.suppressSurfaceClick = onSuppressNextSurfaceClick;
}

export function startBattlefieldDebugDrag({
  battlefieldSurface,
  state,
  dispatch,
  battlefieldProfile,
  onSuppressNextSurfaceClick,
}) {
  battlefieldDebugDragSession.active = true;
  battlefieldDebugDragSession.dispatch = dispatch;
  battlefieldDebugDragSession.surfaceRect = getSurfaceRect(battlefieldSurface);
  battlefieldDebugDragSession.zoom = state.game.viewport.zoom;
  battlefieldDebugDragSession.panX = state.game.viewport.panX;
  battlefieldDebugDragSession.panY = state.game.viewport.panY;
  battlefieldDebugDragSession.battlefieldProfile = battlefieldProfile;
  battlefieldDebugDragSession.footprint = {
    widthUd: state.game.debug.unitDimensions.widthUd,
    depthUd: state.game.debug.unitDimensions.depthUd,
    rotationRadians: state.game.debug.unitPose.rotationRadians,
  };
  battlefieldDebugDragSession.suppressSurfaceClick = onSuppressNextSurfaceClick;
}