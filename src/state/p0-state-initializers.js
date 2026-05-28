const COMMAND_PHASE_ID = 'command';

export function createDebugUnitPose(referenceUnit) {
  return {
    xUd: (referenceUnit?.xUd ?? 10) + 2,
    yUd: referenceUnit?.yUd ?? 10,
    rotationRadians: 0,
  };
}

export function createDebugUnitDimensions(referenceUnit) {
  return {
    widthUd: referenceUnit?.widthUd ?? 1,
    depthUd: referenceUnit?.depthUd ?? 1,
  };
}

export function createInitialDebugState(referenceUnit = null) {
  return {
    isActive: false,
    showFacingGeometryOverlay: false,
    unitPose: createDebugUnitPose(referenceUnit),
    unitDimensions: createDebugUnitDimensions(referenceUnit),
  };
}

export function createInitialViewport() {
  return {
    zoom: 1,
    panX: 0,
    panY: 0,
  };
}

export function createInitialPhaseTracker() {
  return {
    mode: 'setup',
    currentBattlePhaseId: COMMAND_PHASE_ID,
  };
}

export function createInitialCommanderFreeMovePreview() {
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

export function createInitialCommandMenuState() {
  return {
    activeBranch: null,
  };
}

export function createInitialSettings() {
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

export function cloneSettings(settings) {
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

export function createUnitInitialPositionMap(units) {
  return units.reduce((positions, unit) => {
    positions[unit.id] = {
      xUd: unit.xUd,
      yUd: unit.yUd,
      rotationRadians: unit.rotationRadians ?? 0,
    };
    return positions;
  }, {});
}