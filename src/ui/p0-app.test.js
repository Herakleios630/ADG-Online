import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTION_TYPES, SCREEN_IDS, createInitialAppState, reduceAppState } from '../state/p0-state.js';

function createFakeContainer() {
  const listeners = new Map();
  return {
    innerHTML: '',
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
    getListener(type) {
      return listeners.get(type) ?? null;
    },
  };
}

function createFakeActionTarget(dataset) {
  return new ElementStub(dataset);
}

class ElementStub {
  constructor(dataset = {}) {
    this.dataset = dataset;
  }

  closest(selector) {
    if (selector === '[data-action]') {
      return this.dataset.action ? this : null;
    }

    return null;
  }
}

test('new game menu exposes separate drill and source-example automation entries', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };
  const container = createFakeContainer();
  const state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.NAVIGATE,
    screenId: SCREEN_IDS.NEW_GAME,
  });
  const { renderApp } = await import('./p0-app.js');

  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-action="start-conform-drill-battle"/);
  assert.match(container.innerHTML, /data-automation-id="start-conform-drill-battle"/);
  assert.match(container.innerHTML, /Conform Drill/);
  assert.match(container.innerHTML, /data-action="start-charge-drill-battle"/);
  assert.match(container.innerHTML, /data-action="start-shooting-drill-battle"/);
  assert.match(container.innerHTML, /data-automation-id="start-shooting-drill-battle"/);
  assert.match(container.innerHTML, /Shooting Drill/);
  assert.match(container.innerHTML, /data-action="start-shooting-los-example-battle"/);
  assert.match(container.innerHTML, /data-automation-id="start-shooting-los-example-battle"/);
  assert.match(container.innerHTML, /Shooting LoS p\.58/);
});

test('round begin dialog exposes modal-first automation metadata', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };
  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE,
  });
  const { renderApp } = await import('./p0-app.js');

  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-automation-role="active-modal"/);
  assert.match(container.innerHTML, /data-active-modal-id="round-begin"/);
  assert.match(container.innerHTML, /data-active-modal-next-action-selector="\[data-automation-id='round-begin'\]"/);

  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-active-modal-id="round-corps-selection"/);
  assert.match(container.innerHTML, /data-automation-id="select-active-corps-corps-1"/);
});

test('clicking another unresolved shooter during shooting preview dispatches unit selection instead of retargeting', async () => {
  const previousElement = globalThis.Element;
  globalThis.Element = ElementStub;
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  try {
    const container = createFakeContainer();
    const dispatchLog = [];
    let state = reduceAppState(createInitialAppState(), {
      type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE,
    });
    state = reduceAppState(state, {
      type: ACTION_TYPES.SELECT_UNIT,
      unitId: 'shooting-drill-p1-light-foot-shooter',
    });

    const { renderApp } = await import('./p0-app.js');
    renderApp(container, state, (action) => {
      dispatchLog.push(action);
    });

    const clickListener = container.getListener('click');
    assert.equal(typeof clickListener, 'function');

    clickListener({
      target: createFakeActionTarget({
        action: 'select-unit',
        unitId: 'shooting-drill-p1-light-foot-support',
      }),
    });

    assert.deepEqual(dispatchLog, [
      {
        type: ACTION_TYPES.SELECT_UNIT,
        unitId: 'shooting-drill-p1-light-foot-support',
      },
    ]);
  } finally {
    globalThis.Element = previousElement;
  }
});