import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { createInitialChargePreview } from '../engine/charge/index.js';
import { createStandardDirectBattleFixtureUnits, getDeploymentSeedUnits } from './p0-fixtures.js';
import {
  createInitialCommandMenuState,
  createInitialCommanderFreeMovePreview,
  createInitialDebugState,
  createInitialPhaseTracker,
  createInitialSettings,
  createInitialViewport,
  createUnitInitialPositionMap,
  cloneSettings,
} from './p0-state-initializers.js';
import { createInitialAdvanceState } from './p0-advance.js';
import { createInitialCommandContextState } from './p0-command-context.js';
import { createInitialMovementState } from './p0-movement.js';
import { createInitialMeleeState } from './p9-melee-v2.js';
import { createInitialRoundState } from './p0-round.js';
import { createInitialShootingState } from './p0-shooting.js';
import { createInitialSetupState, SETUP_VIEW_MODES } from './p0-setup.js';
import { createInitialSlideState } from './p0-slide.js';
import { createInitialWheelState } from './p0-wheel.js';

const BATTLEFIELD_SCREEN_ID = 'battlefield';

export function createScenarioSetupState({ setupIsActive, units, battlefieldProfile, terrainPlaceholders = [], setupObjects = [] }) {
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

export function createBattleStartGameState(state, { setupIsActive, currentBattlePhaseId, scenario = null }) {
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const sourceUnits = scenario?.units ?? state.game.units;
  const initialUnitPositions = createUnitInitialPositionMap(sourceUnits);
  const nextUnits = sourceUnits.map((unit) => ({
    ...unit,
    xUd: initialUnitPositions[unit.id]?.xUd ?? unit.xUd,
    yUd: initialUnitPositions[unit.id]?.yUd ?? unit.yUd,
    rotationRadians: initialUnitPositions[unit.id]?.rotationRadians ?? unit.rotationRadians ?? 0,
    advanceUsedUd: 0,
    moveCountThisSequence: 0,
    slideUsedThisMovementPhase: false,
    stayedThisMovementPhase: false,
    commanderMovePhaseStartXUd: null,
    commanderMovePhaseStartYUd: null,
    hasChargedThisSequence: false,
    hasEvadedThisSequence: false,
    hasDisengagedThisSequence: false,
    retreatedOutOfZocThisSequence: false,
    cannotShootThisSequence: false,
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
      currentScreen: BATTLEFIELD_SCREEN_ID,
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
      commandMenu: createInitialCommandMenuState(),
      movement: createInitialMovementState(),
      shooting: createInitialShootingState(),
      melee: createInitialMeleeState(),
      chargePreview: createInitialChargePreview(),
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
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
      currentScreen: 'main-menu',
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
      commandContext: createInitialCommandContextState('command', initialSetupState.battlePlan.corpsCards),
      commandMenu: createInitialCommandMenuState(),
      movement: createInitialMovementState(),
      shooting: createInitialShootingState(),
      melee: createInitialMeleeState(),
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