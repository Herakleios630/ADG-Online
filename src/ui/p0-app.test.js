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
  assert.match(container.innerHTML, /data-action="start-melee-drill-battle"/);
  assert.match(container.innerHTML, /data-automation-id="start-melee-drill-battle"/);
  assert.match(container.innerHTML, /Melee Drill/);
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

test('melee drill opens dedicated melee phase dialog before queue controls', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };
  const container = createFakeContainer();
  const state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  const { renderApp } = await import('./p0-app.js');

  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-automation-id="melee-phase-dialog"/);
  assert.match(container.innerHTML, /data-action="acknowledge-melee-phase-procedure"/);
  assert.match(container.innerHTML, /Main units in melee:\s*<\/strong>\s*\d+/);
  assert.match(container.innerHTML, /Support units:\s*<\/strong>\s*\d+/);
  assert.match(container.innerHTML, /Combat groups:\s*<\/strong>\s*\d+/);
});

test('melee pair click opens resolution popup with bound factor breakdown and debug-gated factor controls', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };
  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-p1-frontline-a',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-automation-id="melee-resolution-dialog"/);
  assert.doesNotMatch(container.innerHTML, /data-action="set-melee-resolution-attacker-factor"/);
  assert.match(container.innerHTML, /data-action="toggle-melee-resolution-debug-factor-override"/);
  assert.doesNotMatch(container.innerHTML, /data-action="set-melee-resolution-defender-die"/);
  assert.match(container.innerHTML, /data-action="confirm-melee-resolution-draft"/);
  assert.match(container.innerHTML, /Wuerfeln/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-factor-breakdown-list"/);
  assert.match(container.innerHTML, /Attacker base combat factor:\s*<\/strong>\s*1 \(verified; p\.22 medium swordsmen row:/);
  assert.match(container.innerHTML, /Attacker support units:\s*<\/strong>\s*\d+/);
  assert.match(container.innerHTML, /Defender support units:\s*<\/strong>\s*0/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-attacker-support-participants"/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-defender-support-participants"/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-attacker-branch-list"/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-defender-branch-list"/);
  assert.match(container.innerHTML, /Attacker bonuses\/maluses/);
  assert.match(container.innerHTML, /Defender bonuses\/maluses/);
  assert.match(container.innerHTML, /data-testid="melee-v2-contact-source-status">source-open/);
  assert.match(container.innerHTML, /data-testid="melee-v2-role-source-status">source-open/);

  state = {
    ...state,
    game: {
      ...state.game,
      melee: {
        ...state.game.melee,
        resolutionDraft: {
          ...state.game.melee.resolutionDraft,
          resolutionPreview: {
            meleeId: 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a',
            attackerUnitId: 'melee-drill-p1-frontline-a',
            defenderUnitId: 'melee-drill-p2-frontline-a',
            attackerLabel: 'P1 Swordsmen A',
            defenderLabel: 'P2 Swordsmen A',
            attackerDieRoll: 6,
            defenderDieRoll: 1,
            status: 'resolved',
            result: {
              winnerSide: 'attacker',
              loserSide: 'defender',
              difference: 3,
              cohesionLoss: 1,
              rout: false,
            },
            diagnostics: [],
            factorRecap: {
              attacker: {
                baseCombatFactor: 1,
                modifierSum: 2,
                finalTotal: 8,
              },
              defender: {
                baseCombatFactor: 1,
                modifierSum: 0,
                finalTotal: 3,
              },
            },
            sourceStatus: 'verified',
          },
        },
      },
    },
  };

  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-testid="melee-dialog-result-card"/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-result-list"/);
  assert.match(container.innerHTML, /data-action="acknowledge-melee-resolution-result"/);
  assert.doesNotMatch(container.innerHTML, /data-action="cancel-melee-resolution-draft"/);
  assert.match(container.innerHTML, /OK/);
  assert.match(container.innerHTML, /Attacker D6:/);
  assert.match(container.innerHTML, /Attacker factors:<\/strong>\s*base\s*1,\s*modifiers\s*2,\s*final\s*8/);
  assert.match(container.innerHTML, /Defender factors:<\/strong>\s*base\s*1,\s*modifiers\s*0,\s*final\s*3/);
});

test('melee resolution popup shows concrete support and flank-branch detail rows for supported flank cases', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /Combat group attackers:\s*2/);
  assert.match(container.innerHTML, /Support Case 1 Simple Left/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-attacker-support-participants"/);
  assert.match(container.innerHTML, /simple support/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-attacker-branch-list"/);
  assert.match(container.innerHTML, /Branch to zero:<\/strong>\s*yes/);
  assert.match(container.innerHTML, /Branch owner attacker:<\/strong>\s*melee-drill-case1-side-melee/);
});

test('melee case1 pre-roll modifier sum matches post-roll factor recap modifier sum', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /Attacker bonuses\/maluses[\s\S]*?Modifier sum:\s*\+1/);
  assert.match(container.innerHTML, /Defender bonuses\/maluses[\s\S]*?Modifier sum:\s*0/);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MELEE_RESOLUTION_DRAFT_VALUE,
    field: 'attackerDieRoll',
    value: 3,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_MELEE_RESOLUTION_DRAFT_VALUE,
    field: 'defenderDieRoll',
    value: 2,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /Attacker factors:<\/strong>\s*base\s*1,\s*modifiers\s*1,\s*final\s*6/);
  assert.match(container.innerHTML, /Defender factors:<\/strong>\s*base\s*0,\s*modifiers\s*0,\s*final\s*4/);
});

test('melee case1 dialog shows explicit mixed-status wording for verified lanes with source-open seam status', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-case1-main-a__melee-drill-case1-main-d',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-testid="melee-v2-contact-source-status">source-open/);
  assert.match(container.innerHTML, /data-testid="melee-v2-mixed-status-note"/);
  assert.match(container.innerHTML, /Mixed status note:[\s\S]*verified[\s\S]*source-open/);
});

test('melee case2 dialog shows branch candidates while keeping one deterministic owner', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-case2-main-a__melee-drill-case2-main-d',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /Branch candidates:<\/strong>/);
  assert.match(container.innerHTML, /Support Case 2 Flank Attack Right/);
  assert.match(container.innerHTML, /Support Case 2 Flank Attack Left/);
  assert.match(container.innerHTML, /Support Case 2 Rear Attack/);
  assert.match(container.innerHTML, /Support Case 2 Main A/);
  assert.match(container.innerHTML, /Support Case 2 Flank Attack Right \(owner\)/);
  assert.match(container.innerHTML, /Branch owner attacker:<\/strong>\s*melee-drill-case2-flank-left/);
});

test('melee draft shows optional attacker commander toggle and reflects user engagement choice', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-testid="melee-attacker-commander-toggle-row"/);
  assert.match(container.innerHTML, /data-action="toggle-melee-resolution-attacker-commander-engaged"/);
  assert.match(container.innerHTML, /Optional Mitkaempfen before roll/);

  state = reduceAppState(state, {
    type: ACTION_TYPES.TOGGLE_MELEE_RESOLUTION_ATTACKER_COMMANDER_ENGAGED,
    isEngaged: true,
  });
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-action="toggle-melee-resolution-attacker-commander-engaged"[^>]*checked/);
});

test('melee draft locks commander toggle ON in continuing rounds only after prior commander engagement', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.TOGGLE_MELEE_RESOLUTION_ATTACKER_COMMANDER_ENGAGED,
    isEngaged: true,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_RESOLUTION_RESULT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-testid="melee-attacker-commander-toggle-row"/);
  assert.match(container.innerHTML, /data-action="toggle-melee-resolution-attacker-commander-engaged"[^>]*checked[^>]*disabled/);
  assert.match(container.innerHTML, /Continuing round: commander already fought in this melee, so participation stays ON/);
});

test('melee draft keeps commander toggle optional in continuing rounds when prior commander engagement is false', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_RESOLUTION_RESULT,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-testid="melee-attacker-commander-toggle-row"/);
  assert.match(container.innerHTML, /data-action="toggle-melee-resolution-attacker-commander-engaged"/);
  assert.doesNotMatch(container.innerHTML, /data-action="toggle-melee-resolution-attacker-commander-engaged"[^>]*disabled/);
  assert.match(container.innerHTML, /Optional Mitkaempfen before roll/);
  assert.doesNotMatch(container.innerHTML, /commander already fought in this melee/);
});

test('melee draft shows source-open note for continuing commander lock uncertainty', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-b__melee-drill-p2-frontline-b',
  });

  const attackerCommander = state.game.melee?.resolutionDraft?.resolutionInput?.attackerModifierContext?.engagedCommander;
  state = {
    ...state,
    game: {
      ...state.game,
      melee: {
        ...state.game.melee,
        resolutionDraft: {
          ...state.game.melee.resolutionDraft,
          resolutionInput: {
            ...state.game.melee.resolutionDraft.resolutionInput,
            meleeRoundState: 'continuing',
            attackerModifierContext: {
              ...state.game.melee.resolutionDraft.resolutionInput.attackerModifierContext,
              engagedCommander: {
                ...attackerCommander,
                sourceStatus: 'source-open',
                meleeRoundState: 'continuing',
                isToggleVisible: true,
                isToggleLocked: true,
                isEngaged: true,
              },
            },
          },
        },
      },
    },
  };

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-testid="melee-commander-continuing-source-open-note"/);
  assert.match(container.innerHTML, /Source-open: continuing commander lock timing remains under open verification/);
});

test('melee result dialog renders resolved tie as Tie instead of source-open', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-p1-frontline-a',
  });

  state = {
    ...state,
    game: {
      ...state.game,
      melee: {
        ...state.game.melee,
        resolutionDraft: {
          ...state.game.melee.resolutionDraft,
          resolutionPreview: {
            meleeId: 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a',
            attackerUnitId: 'melee-drill-p1-frontline-a',
            defenderUnitId: 'melee-drill-p2-frontline-a',
            attackerLabel: 'P1 Swordsmen A',
            defenderLabel: 'P2 Swordsmen A',
            attackerDieRoll: 4,
            defenderDieRoll: 4,
            status: 'resolved',
            result: {
              winnerSide: null,
              loserSide: null,
              difference: 0,
              cohesionLoss: 0,
              rout: false,
            },
            diagnostics: [],
            sourceStatus: 'verified',
          },
        },
      },
    },
  };

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /<strong>Winner:<\/strong>\s*Tie/);
  assert.match(container.innerHTML, /<strong>Rout:<\/strong>\s*no/);
  assert.match(container.innerHTML, /<strong>Source status:<\/strong>\s*verified/);
});

test('melee resolution popup shows flank branch visibility rows for flank attackers', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-flank-c__melee-drill-p2-frontline-c-flanked',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-testid="melee-dialog-attacker-branch-list"/);
  assert.match(container.innerHTML, /data-testid="melee-dialog-defender-branch-list"/);
  assert.match(container.innerHTML, /Attacker flank\/rear branch/);
  assert.match(container.innerHTML, /flank/);
});

test('melee resolution popup keeps unresolved branch rows visible as source-open placeholders', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-p1-frontline-a',
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-automation-id="melee-resolution-dialog"/);
  assert.match(container.innerHTML, /Attacker flank\/rear branch/);
  assert.match(container.innerHTML, /Defender flank\/rear branch/);
  assert.match(container.innerHTML, /unknown \(source-open\)/);
});

test('melee resolution popup preserves needs-source-check branch labels exactly', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };

  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: 'melee-drill-p1-frontline-a__melee-drill-p2-frontline-a',
  });

  state = {
    ...state,
    game: {
      ...state.game,
      melee: {
        ...state.game.melee,
        resolutionDraft: {
          ...state.game.melee.resolutionDraft,
          resolutionInput: {
            ...state.game.melee.resolutionDraft.resolutionInput,
            attackerUnit: {
              ...state.game.melee.resolutionDraft.resolutionInput.attackerUnit,
              meleeContactEvidence: {
                ...state.game.melee.resolutionDraft.resolutionInput.attackerUnit.meleeContactEvidence,
                meleeTriggerBridge: {
                  triggerFamily: 'movement-conformation',
                  sourceStatus: 'needs-source-check',
                  attackContactType: 'flank',
                },
              },
            },
          },
        },
      },
    },
  };

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /Attacker flank\/rear branch:/);
  assert.match(container.innerHTML, /needs-source-check/);
  assert.doesNotMatch(container.innerHTML, /Attacker flank\/rear branch:.*source-open/);
});

test('melee resolution popup shows factor selects only after debug override opt-in', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };
  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_UNIT,
    unitId: 'melee-drill-p1-frontline-a',
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.TOGGLE_MELEE_RESOLUTION_DEBUG_FACTOR_OVERRIDE,
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-action="set-melee-resolution-attacker-factor"/);
  assert.match(container.innerHTML, /data-action="set-melee-resolution-defender-factor"/);
  assert.match(container.innerHTML, /Disable debug override/);
});

test('melee batch apply stays blocked while source-open drafts remain unresolved', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };
  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });
  const selectedMeleeIds = Array.isArray(state.game.melee?.queueSelectionIds)
    ? [...state.game.melee.queueSelectionIds]
    : [];
  assert.ok(selectedMeleeIds.length > 0);

  const firstMeleeId = selectedMeleeIds[0] ?? null;
  assert.ok(firstMeleeId);
  state = reduceAppState(state, {
    type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
    meleeId: firstMeleeId,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
  });

  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.doesNotMatch(container.innerHTML, /data-automation-id="melee-summary-dialog"/);
  assert.equal(state.game.melee?.status, 'active');
  assert.equal(state.game.melee?.batchSummary, null);
});

test('melee batch summary keeps source-open visible after apply', async () => {
  globalThis.window = globalThis.window ?? {
    addEventListener() {},
    removeEventListener() {},
  };
  const container = createFakeContainer();
  let state = reduceAppState(createInitialAppState(), {
    type: ACTION_TYPES.START_MELEE_DRILL_BATTLE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.ACKNOWLEDGE_MELEE_PHASE_PROCEDURE,
  });

  const selectedMeleeIds = Array.isArray(state.game.melee?.queueSelectionIds)
    ? [...state.game.melee.queueSelectionIds]
    : [];
  assert.ok(selectedMeleeIds.length > 0);

  for (const meleeId of selectedMeleeIds) {
    state = reduceAppState(state, {
      type: ACTION_TYPES.START_MELEE_RESOLUTION_DRAFT,
      meleeId,
    });
    state = reduceAppState(state, {
      type: ACTION_TYPES.CONFIRM_MELEE_RESOLUTION_DRAFT,
    });
  }

  state = reduceAppState(state, {
    type: ACTION_TYPES.APPLY_MELEE_BATCH,
  });

  const { renderApp } = await import('./p0-app.js');
  renderApp(container, state, () => {});

  assert.match(container.innerHTML, /data-automation-id="melee-summary-dialog"/);
  assert.match(container.innerHTML, /data-testid="melee-summary-source-status">source-open/);
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