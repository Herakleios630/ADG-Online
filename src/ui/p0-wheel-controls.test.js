import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTION_TYPES, MOVEMENT_PIVOT_SIDES } from '../state/p0-state.js';

const EXPECTED_PROJECTED_WHEEL_ANGLE = (3 / 8) * (Math.PI / 2);

test('wheel drag follows the visible movement of the dragged front corner', async () => {
  const previousWindow = globalThis.window;
  const listeners = new Map();

  globalThis.window = {
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
  };

  const { tryStartBattlefieldWheelDrag, stopBattlefieldWheelDragSession } = await import('./p0-wheel-controls.js');

  const dispatches = [];
  const battlefieldSurface = {
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 100, height: 100 };
    },
  };
  const selectedUnit = {
    id: 'unit-1',
    xUd: 50,
    yUd: 50,
    widthUd: 2,
    depthUd: 1,
    rotationRadians: 0,
  };
  const state = {
    game: {
      wheelModeActive: true,
      selectedUnitId: selectedUnit.id,
      viewport: { zoom: 1 },
      chargePreview: { status: 'idle', intent: null },
      movement: { preview: { status: 'idle', segments: [] } },
    },
  };

  try {
    const leftWheelStarted = tryStartBattlefieldWheelDrag({
      event: {
        button: 0,
        clientX: 51,
        clientY: 49.5,
        preventDefault() {},
      },
      battlefieldSurface,
      state,
      dispatch(action) {
        dispatches.push(action);
      },
      battlefieldProfile: { widthUd: 100, heightUd: 100 },
      unitId: selectedUnit.id,
      selectedUnit,
      cornerSide: MOVEMENT_PIVOT_SIDES.RIGHT,
      onSuppressNextSurfaceClick() {},
    });

    assert.equal(leftWheelStarted, true);

    const mousemove = listeners.get('mousemove');
    assert.equal(typeof mousemove, 'function');

    mousemove({
      clientX: 50.5,
      clientY: 48.5,
    });

    const leftWheelPreview = dispatches.find((action) => action.type === ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE);
    assert.ok(leftWheelPreview);
    assert.equal(leftWheelPreview.pivotSide, MOVEMENT_PIVOT_SIDES.LEFT);
    assert.ok(leftWheelPreview.angleRadians > 0);
    assert.ok(Math.abs(leftWheelPreview.angleRadians - EXPECTED_PROJECTED_WHEEL_ANGLE) < 1e-9);

    stopBattlefieldWheelDragSession();
    dispatches.length = 0;

    const rightWheelStarted = tryStartBattlefieldWheelDrag({
      event: {
        button: 0,
        clientX: 49,
        clientY: 49.5,
        preventDefault() {},
      },
      battlefieldSurface,
      state,
      dispatch(action) {
        dispatches.push(action);
      },
      battlefieldProfile: { widthUd: 100, heightUd: 100 },
      unitId: selectedUnit.id,
      selectedUnit,
      cornerSide: MOVEMENT_PIVOT_SIDES.LEFT,
      onSuppressNextSurfaceClick() {},
    });

    assert.equal(rightWheelStarted, true);

    mousemove({
      clientX: 49.5,
      clientY: 48.5,
    });

    const rightWheelPreview = dispatches.find((action) => action.type === ACTION_TYPES.SET_WHEEL_PREVIEW_ANGLE);
    assert.ok(rightWheelPreview);
    assert.equal(rightWheelPreview.pivotSide, MOVEMENT_PIVOT_SIDES.RIGHT);
    assert.ok(rightWheelPreview.angleRadians > 0);
    assert.ok(Math.abs(rightWheelPreview.angleRadians - EXPECTED_PROJECTED_WHEEL_ANGLE) < 1e-9);
  } finally {
    stopBattlefieldWheelDragSession();
    globalThis.window = previousWindow;
  }
});

test('charge wheel button arms charge wheel with the left pivot by default', async () => {
  const previousWindow = globalThis.window;
  const listeners = new Map();

  globalThis.window = {
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
  };

  const { bindWheelActionButtons } = await import('./p0-wheel-controls.js');

  const dispatches = [];
  const wheelButton = {
    addEventListener(type, callback) {
      if (type === 'click') {
        this.click = callback;
      }
    },
  };
  const container = {
    querySelector(selector) {
      if (selector === '[data-action="toggle-wheel-mode"]') {
        return wheelButton;
      }

      return null;
    },
  };
  const state = {
    game: {
      selectedUnitId: 'unit-1',
      chargePreview: {
        status: 'manoeuvre-selecting',
        intent: {
          unitId: 'unit-1',
          startManoeuvre: {
            type: 'none',
          },
        },
      },
      commanderFreeMovePreview: { status: 'idle', mode: null, unitId: null },
      movement: { selectedCommandId: null },
      wheelModeActive: false,
    },
  };

  try {
    bindWheelActionButtons({
      container,
      dispatch(action) {
        dispatches.push(action);
      },
      state,
    });

    wheelButton.click();

    assert.deepEqual(dispatches[0], {
      type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
      manoeuvreType: 'wheel',
      pivotSide: MOVEMENT_PIVOT_SIDES.LEFT,
      angleRadians: 0,
    });
  } finally {
    globalThis.window = previousWindow;
  }
});