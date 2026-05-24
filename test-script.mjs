import { createInitialAppState, reduceAppState, ACTION_TYPES } from './src/state/p0-state.js';

let state = createInitialAppState();

const actions = [
  { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE },
  { type: ACTION_TYPES.ROUND_BEGIN },
  { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' },
  { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-wheel-charger' },
  { type: ACTION_TYPES.START_CHARGE_PREVIEW },
  { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-double-blocker' },
  { 
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, 
    manoeuvreType: 'wheel', 
    pivotSide: 'left', 
    angleRadians: 0 
  }
];

actions.forEach(action => {
  state = reduceAppState(state, action);
});

const cp = state.chargePreview || {};
const movementPreview = (state.movement && state.movement.preview) || {};

console.log(JSON.stringify({
  chargePreviewStatus: cp.status,
  chargePreviewIntentStartPose: cp.intent?.startPose,
  chargePreviewIntentStartManoeuvre: cp.intent?.startManoeuvre,
  wheelModeActive: state.wheelModeActive,
  movementPreviewStatus: movementPreview.status,
  movementPreviewSegmentsLength: movementPreview.segments?.length
}, null, 2));
