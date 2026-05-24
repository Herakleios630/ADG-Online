import { BATTLEFIELD_PROFILE_IDS } from './src/data/battlefield-profiles.js';
import { ACTION_TYPES, BATTLE_PHASE_IDS, createInitialAppState, reduceAppState } from './src/state/p0-state.js';
import { renderBattlefieldScreen } from './src/ui/p0-battlefield.js';

function advanceToBattlefield(state = createInitialAppState()) {
  const nextState = reduceAppState(state, { type: ACTION_TYPES.START_NEW_GAME });
  return {
    ...nextState,
    game: {
      ...nextState.game,
      setup: { ...nextState.game.setup, isActive: false },
      commandContext: { ...nextState.game.commandContext, currentPhaseId: BATTLE_PHASE_IDS.MOVEMENT },
    },
  };
}

let state = advanceToBattlefield();
state = {
  ...state,
  game: {
    ...state.game,
    units: state.game.units.map((unit) => {
      if (unit.id === 'test-unit-3') {
        return {
          ...unit,
          chargeReactionProfile: null,
          chargeReactionCapability: { family: 'cavalry', hasImpact: false, hasImpetuous: false },
          scenarioLabel: 'Ziel Test 3',
        };
      }
      if (unit.id === 'p1-c1-cav-1') {
        return { ...unit, xUd: 5.9, yUd: 13.3, widthUd: 1, depthUd: 1, rotationRadians: 0 };
      }
      return unit;
    }),
  },
};

state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });

const chargePreview = state.game.chargePreview;
const reactionRequests = state.game.chargeReactionHandoff?.requests || [];
const firstRequest = reactionRequests[0];

console.log('--- RESULTS ---');
console.log('1) chargePreview status:', chargePreview?.status);
console.log('2) first reaction request type:', firstRequest?.type);
console.log('   diagnostics:', JSON.stringify(firstRequest?.diagnostics));

const html = renderBattlefieldScreen(state);
const hasBlockedEvade = html.includes('Ausweichen blockiert');
const hasEvade = html.includes('>Ausweichen<');
const hasNoEvade = html.includes('>Nicht ausweichen<');

console.log('3) html content checks:');
console.log('   "Ausweichen blockiert":', hasBlockedEvade);
console.log('   "Ausweichen":', hasEvade);
console.log('   "Nicht ausweichen":', hasNoEvade);
