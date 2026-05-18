import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../data/battlefield-profiles.js';
import {
  createAmbushMarker,
  createAmbushMarkerDraft,
  createInitialAmbushMarkersState,
  isAmbushMarkerWithinBattlefield,
} from '../engine/setup/ambush-markers.js';
import {
  assignCorpsToBattlePlanField,
  createInitialBattlePlanState,
} from '../engine/setup/battle-plan.js';
import {
  createInitialDeploymentSetupState,
  createVisibleDeploymentPlaceholder,
  doDeploymentPlaceholdersOverlap,
  isDeploymentPlaceholderWithinBattlefield,
} from '../engine/setup/deployment-placeholders.js';
import {
  createSetupObjectPlaceholder,
  createMandatoryCampPlaceholders,
  isSetupObjectWithinBattlefield,
} from '../engine/setup/setup-objects.js';
import {
  createTerrainPlaceholder,
  isTerrainPlaceholderWithinBattlefield,
} from '../engine/setup/terrain-placeholders.js';
import {
  createTerrainValidationSnapshot,
  hasBlockingTerrainValidationErrors,
  validateTerrainPlaceholder,
} from '../engine/setup/terrain-validation.js';
import { SETUP_VIEW_MODES } from '../engine/visibility/setup-view.js';

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

export function isUnitPlacementStep(stepId) {
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

export function createInitialSetupState(
  isActive = false,
  units = [],
  battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM),
) {
  return {
    isActive,
    currentStepId: SETUP_STEP_IDS.FORMAT,
    lockedStepIds: [],
    dismissedGuideStepIds: [],
    terrain: createTerrainSetupState([], null, battlefieldProfile),
    setupObjects: createSetupObjectsState(createMandatoryCampPlaceholders(), null),
    battlePlan: createBattlePlanSetupState(),
    ambushMarkers: createAmbushMarkersSetupState(),
    deployment: createDeploymentSetupState(units, battlefieldProfile),
  };
}

export function reduceGoToPreviousSetupStep(state) {
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
}

export function reduceAdvanceSetupStep(state) {
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
}

export function reduceDismissCurrentSetupGuide(state) {
  if (!state.game.setup.isActive) {
    return state;
  }

  const currentStepId = state.game.setup.currentStepId;
  if (state.game.setup.dismissedGuideStepIds.includes(currentStepId)) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      setup: {
        ...state.game.setup,
        dismissedGuideStepIds: [...state.game.setup.dismissedGuideStepIds, currentStepId],
      },
    },
  };
}

export function reduceLockCurrentSetupStep(state) {
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
}

export function reduceCompleteSetup(state) {
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
}

export function reduceSetSetupViewMode(state, viewMode) {
  return {
    ...state,
    game: {
      ...state.game,
      setupViewMode: viewMode,
    },
  };
}

export function reduceAddTerrainPlaceholder(state, placeholderDraft) {
  if (!state.game.setup.isActive || !isTerrainPlacementStep(state.game.setup.currentStepId)) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const placeholder = createTerrainPlaceholder(placeholderDraft);
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

export function reduceUpdateTerrainPlaceholder(state, placeholderId, patch) {
  if (!state.game.setup.isActive || !isTerrainPlacementStep(state.game.setup.currentStepId)) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  let rejectedCandidate = null;
  const nextPlaceholders = state.game.setup.terrain.placeholders.map((placeholder) => {
    if (placeholder.id !== placeholderId) {
      return placeholder;
    }

    const candidate = createTerrainPlaceholder({
      ...placeholder,
      ...patch,
      footprint: {
        ...placeholder.footprint,
        ...patch?.footprint,
      },
      pose: {
        ...placeholder.pose,
        ...patch?.pose,
      },
    });

    const candidateResults = validateTerrainPlaceholder(candidate, battlefieldProfile, state.game.setup.terrain.placeholders);
    if (hasBlockingTerrainValidationErrors(candidateResults) || !isTerrainPlaceholderWithinBattlefield(candidate, battlefieldProfile)) {
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

export function reduceSelectTerrainPlaceholder(state, placeholderId) {
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
          placeholderId,
          getBattlefieldProfile(state.game.battlefieldProfileId),
        ),
      },
    },
  };
}

export function reduceLockTerrainPlaceholder(state, placeholderId) {
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
            placeholder.id === placeholderId
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
}

export function reduceRemoveTerrainPlaceholder(state, placeholderId) {
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
          state.game.setup.terrain.placeholders.filter((placeholder) => placeholder.id !== placeholderId),
          state.game.setup.terrain.selectedPlaceholderId === placeholderId
            ? null
            : state.game.setup.terrain.selectedPlaceholderId,
          getBattlefieldProfile(state.game.battlefieldProfileId),
        ),
      },
    },
  };
}

export function reduceAddSetupObject(state, setupObjectDraft) {
  if (!state.game.setup.isActive || !isSetupObjectPlacementStep(state.game.setup.currentStepId)) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const setupObject = createSetupObjectPlaceholder(setupObjectDraft);
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

export function reduceUpdateSetupObject(state, setupObjectId, patch) {
  if (!state.game.setup.isActive || !isSetupObjectPlacementStep(state.game.setup.currentStepId)) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const nextSetupObjects = state.game.setup.setupObjects.placeholders.map((setupObject) => {
    if (setupObject.id !== setupObjectId) {
      return setupObject;
    }

    const candidate = createSetupObjectPlaceholder({
      ...setupObject,
      ...patch,
      footprint: {
        ...setupObject.footprint,
        ...patch?.footprint,
      },
      pose: {
        ...setupObject.pose,
        ...patch?.pose,
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

export function reduceSelectSetupObject(state, setupObjectId) {
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
          setupObjectId,
        ),
      },
    },
  };
}

export function reduceRemoveSetupObject(state, setupObjectId) {
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
          state.game.setup.setupObjects.placeholders.filter((setupObject) => setupObject.id !== setupObjectId),
          state.game.setup.setupObjects.selectedObjectId === setupObjectId
            ? null
            : state.game.setup.setupObjects.selectedObjectId,
        ),
      },
    },
  };
}

export function reduceSelectBattlePlanCorps(state, corpsId) {
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
          selectedCorpsId: corpsId,
        },
      },
    },
  };
}

export function reduceAssignBattlePlanCorps(state, corpsId, fieldId) {
  if (!state.game.setup.isActive || state.game.setup.currentStepId !== SETUP_STEP_IDS.BATTLE_PLAN || !corpsId || !fieldId) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      setup: {
        ...state.game.setup,
        battlePlan: assignCorpsToBattlePlanField(state.game.setup.battlePlan, corpsId, fieldId),
      },
    },
  };
}

export function reduceAddAmbushMarker(state, markerDraft) {
  if (!state.game.setup.isActive || !isAmbushPlacementStep(state.game.setup.currentStepId)) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const existingCount = state.game.setup.ambushMarkers.markers.length;
  const marker = createAmbushMarkerDraft(markerDraft, existingCount);
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

export function reduceSelectAmbushMarker(state, markerId) {
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
          selectedMarkerId: markerId,
        },
      },
    },
  };
}

export function reduceUpdateAmbushMarker(state, markerId, patch) {
  if (!state.game.setup.isActive || !isAmbushPlacementStep(state.game.setup.currentStepId)) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const nextMarkers = state.game.setup.ambushMarkers.markers.map((marker) => {
    if (marker.id !== markerId) {
      return marker;
    }

    const candidate = createAmbushMarker({
      ...marker,
      ...patch,
      footprint: {
        ...marker.footprint,
        ...patch?.footprint,
      },
      pose: {
        ...marker.pose,
        ...patch?.pose,
      },
      publicShell: {
        ...marker.publicShell,
        ...patch?.publicShell,
      },
      privateContents: {
        ...marker.privateContents,
        ...patch?.privateContents,
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

export function reduceUpdateAmbushMarkerContents(state, markerId, privateContents) {
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
            marker.id === markerId
              ? {
                  ...marker,
                  privateContents: {
                    ...marker.privateContents,
                    ...privateContents,
                  },
                }
              : marker,
          ),
        },
      },
    },
  };
}

export function reduceSetUnitPositionInSetup(state, unitId, xUd, yUd) {
  if (!state.game.setup.isActive || !isUnitPlacementStep(state.game.setup.currentStepId)) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const nextUnits = state.game.units.map((unit) =>
    unit.id === unitId
      ? {
          ...unit,
          xUd,
          yUd,
        }
      : unit,
  );
  const nextVisiblePlaceholders = state.game.setup.deployment.visiblePlaceholders.map((placeholder) =>
    placeholder.unitId === unitId
      ? createVisibleDeploymentPlaceholder({
          ...placeholder,
          pose: { xUd, yUd },
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

export { SETUP_VIEW_MODES };