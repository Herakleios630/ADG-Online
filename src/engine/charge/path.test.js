import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChargeStartSelectionResult,
  CHARGE_START_MANOEUVRE_TYPES,
  CHARGE_START_OPTION_STATUSES,
  CHARGE_START_SOURCE_STATUSES,
  getChargeStartOptions,
} from './path.js';

const SELECTED_UNIT = {
  id: 'charger',
  xUd: 12,
  yUd: 8,
  troopType: 'cavalry',
  widthUd: 1,
  depthUd: 0.75,
  rotationRadians: Math.PI / 2,
};

test('charge start options expose none, shift-slide, and wheel for a selected target', () => {
  const options = getChargeStartOptions({
    selectedUnit: SELECTED_UNIT,
    targetSnapshot: { unitId: 'defender', xUd: 18, yUd: 2 },
  });

  assert.deepEqual(options.map((option) => option.type), [
    CHARGE_START_MANOEUVRE_TYPES.NONE,
    CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE,
    CHARGE_START_MANOEUVRE_TYPES.WHEEL,
  ]);
  assert.equal(options[0].sourceStatus, CHARGE_START_SOURCE_STATUSES.VERIFIED);
  assert.equal(options[1].sourceStatus, CHARGE_START_SOURCE_STATUSES.VERIFIED);
  assert.equal(options[1].status, CHARGE_START_OPTION_STATUSES.AVAILABLE);
  assert.equal(options[2].status, CHARGE_START_OPTION_STATUSES.AVAILABLE);
});

test('charge start selection keeps the current forward bearing for none and produces a guide segment', () => {
  const result = buildChargeStartSelectionResult({
    selectedUnit: SELECTED_UNIT,
    targetSnapshot: { unitId: 'defender', xUd: 18, yUd: 2 },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
  });

  assert.ok(result);
  assert.equal(result.startManoeuvre.type, CHARGE_START_MANOEUVRE_TYPES.NONE);
  assert.equal(result.frozenDirectionRadians, SELECTED_UNIT.rotationRadians);
  assert.deepEqual(result.startPose, {
    xUd: SELECTED_UNIT.xUd,
    yUd: SELECTED_UNIT.yUd,
    rotationRadians: SELECTED_UNIT.rotationRadians,
  });
  assert.equal(result.pathSegments.length, 1);
  assert.equal(result.pathSegments[0].kind, 'charge-direction-guide');
  assert.equal(result.pathSegments[0].sourceStatus, CHARGE_START_SOURCE_STATUSES.VERIFIED);
  assert.equal(result.pathSegments[0].distanceUd, 4);
});

test('charge start slide changes the start pose laterally while keeping the original forward bearing', () => {
  const result = buildChargeStartSelectionResult({
    selectedUnit: SELECTED_UNIT,
    targetSnapshot: { unitId: 'defender', xUd: 18, yUd: 2 },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE,
    slideSide: 'right',
    slideDistanceUd: 1,
  });

  assert.ok(result);
  assert.equal(result.startManoeuvre.type, CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE);
  assert.equal(result.startManoeuvre.slideSide, 'right');
  assert.equal(result.startManoeuvre.slideDistanceUd, 1);
  assert.notDeepEqual(result.startPose, SELECTED_UNIT);
  assert.equal(result.frozenDirectionRadians, SELECTED_UNIT.rotationRadians);
  assert.equal(result.pathSegments[0].commandId, 'slide');
  assert.equal(result.pathSegments[1].kind, 'charge-direction-guide');
  assert.equal(result.pathSegments[1].distanceUd, 4);
});

test('charge start wheel changes the start pose and forward bearing while spending budget', () => {
  const result = buildChargeStartSelectionResult({
    selectedUnit: SELECTED_UNIT,
    targetSnapshot: { unitId: 'defender', xUd: 18, yUd: 2 },
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.WHEEL,
    pivotSide: 'right',
    wheelAngleRadians: Math.PI / 6,
  });

  assert.ok(result);
  assert.equal(result.startManoeuvre.type, CHARGE_START_MANOEUVRE_TYPES.WHEEL);
  assert.equal(result.startManoeuvre.pivotSide, 'right');
  assert.equal(result.startManoeuvre.wheelAngleRadians, Math.PI / 6);
  assert.ok(result.startManoeuvre.spentBudgetUd > 0);
  assert.notDeepEqual(result.startPose, SELECTED_UNIT);
  assert.notEqual(result.frozenDirectionRadians, SELECTED_UNIT.rotationRadians);
  assert.equal(result.pathSegments[0].commandId, 'wheel');
  assert.equal(result.pathSegments[1].kind, 'charge-direction-guide');
  assert.equal(result.pathSegments[1].distanceUd, 4 - result.startManoeuvre.spentBudgetUd);
});

test('charge start selection rejects unknown manoeuvre types', () => {
  assert.equal(buildChargeStartSelectionResult({ selectedUnit: SELECTED_UNIT, targetSnapshot: { unitId: 'defender', xUd: 18, yUd: 2 }, manoeuvreType: 'half-turn' }), null);
});