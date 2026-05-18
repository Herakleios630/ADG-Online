import test from 'node:test';
import assert from 'node:assert/strict';

import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { ACTION_TYPES, BATTLE_PHASE_IDS, createInitialAppState, reduceAppState } from '../state/p0-state.js';
import { renderBattlefieldScreen } from './p0-battlefield.js';

function advanceToBattlefield(state = createInitialAppState()) {
  const nextState = reduceAppState(state, { type: ACTION_TYPES.START_NEW_GAME });

  return {
    ...nextState,
    game: {
      ...nextState.game,
      setup: {
        ...nextState.game.setup,
        isActive: false,
      },
      commandContext: {
        ...nextState.game.commandContext,
        currentPhaseId: BATTLE_PHASE_IDS.MOVEMENT,
      },
    },
  };
}

function completeSetupToBattle(state = createInitialAppState()) {
  let nextState = reduceAppState(state, { type: ACTION_TYPES.START_NEW_GAME });

  while (nextState.game.setup.currentStepId !== 'ready') {
    nextState = reduceAppState(nextState, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  return reduceAppState(nextState, { type: ACTION_TYPES.COMPLETE_SETUP });
}

test('setup flow renders a visible guide dialog for the current setup step', () => {
  const state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_NEW_GAME });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-setup-guide-overlay/);
  assert.match(html, /Initiative, Rollen und Format vorbereiten/);
  assert.match(html, /data-action="dismiss-setup-guide"/);
  assert.doesNotMatch(html, /Weiter zum naechsten Schritt/);
});

test('dismissing the current setup guide hides the popup until the next step', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_NEW_GAME });
  state = reduceAppState(state, { type: ACTION_TYPES.DISMISS_CURRENT_SETUP_GUIDE });

  const dismissedHtml = renderBattlefieldScreen(state);

  assert.doesNotMatch(dismissedHtml, /data-setup-guide-overlay/);
  assert.match(dismissedHtml, /data-action="setup-next"/);

  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });

  const nextStepHtml = renderBattlefieldScreen(state);

  assert.match(nextStepHtml, /data-setup-guide-overlay/);
  assert.match(nextStepHtml, /Region und Pflichtgelaende festlegen/);
});

test('setup next action lives in the left command card during setup', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_NEW_GAME });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-action="setup-next"/);
  assert.match(html, /Naechster Schritt/);
  assert.doesNotMatch(html, /data-action="setup-previous"/);
  assert.doesNotMatch(html, /data-action="setup-lock"/);
  assert.ok(html.indexOf('data-action="setup-next"') < html.indexOf('battlefield-terrain-palette-card'));
});

test('terrain setup step renders the explicit placement subsequence in the guide', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_NEW_GAME });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /Terrain auswaehlen und platzieren/);
  assert.match(html, /Untersequenz/);
  assert.match(html, /Verteidiger platziert Pflichtgelaende/);
  assert.match(html, /Die Strasse folgt zuletzt/);
});

test('completed setup transitions to the round start dialog', () => {
  const state = completeSetupToBattle();

  const html = renderBattlefieldScreen(state);

  assert.doesNotMatch(html, /data-setup-guide-overlay/);
  assert.doesNotMatch(html, /Deployment Foundation/);
  assert.match(html, /data-round-dialog-overlay/);
  assert.match(html, /Runde 1/);
  assert.match(html, /data-action="round-begin"/);
});

test('deployment foundation card renders collapsed during setup deployment step', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_NEW_GAME });

  while (state.game.setup.currentStepId !== 'deployment') {
    state = reduceAppState(state, { type: ACTION_TYPES.ADVANCE_SETUP_STEP });
  }

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<details class="battlefield-collapsible-card battlefield-placeholder-card battlefield-deployment-card">/);
  assert.match(html, /Deployment Foundation/);
});

test('commander ghost preview renders as a circle with the exact unit base size', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const selectedUnit = state.game.units.find((unit) => unit.id === 'test-unit-1');

  assert.ok(selectedUnit);
  assert.equal(selectedUnit.isCommander, true);
  assert.equal(selectedUnit.baseShape, 'circle');

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((selectedUnit.xUd + 3).toFixed(3)),
    yUd: Number((selectedUnit.yUd - 4).toFixed(3)),
    dragOriginXUd: selectedUnit.xUd,
    dragOriginYUd: selectedUnit.yUd,
    maxDistanceUd: 5,
  });

  const html = renderBattlefieldScreen(state);
  const expectedWidth = `${(selectedUnit.widthUd / battlefieldProfile.widthUd) * 100}%`;
  const expectedHeight = `${(selectedUnit.depthUd / battlefieldProfile.heightUd) * 100}%`;

  assert.match(html, /class="battlefield-unit-preview is-circle-base"/);
  assert.match(html, new RegExp(`width:${expectedWidth.replaceAll('.', '\\.')}`));
  assert.match(html, new RegExp(`height:${expectedHeight.replaceAll('.', '\\.')}`));
});

test('inactive corps units render as disabled battlefield tokens', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-p1-c2-mi-1[\s\S]*?disabled[\s\S]*?data-unit-id="p1-c2-mi-1"/);
  assert.match(html, /class="battlefield-unit-token for-p1-c3-hi-1[\s\S]*?disabled[\s\S]*?data-unit-id="p1-c3-hi-1"/);
});

test('active corps tokens render pending and done status classes while keeping selected emphasis', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.MARK_UNIT_STAY, unitId: 'p1-c1-cav-1' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-2[\s\S]*?is-active-corps-unit[\s\S]*?is-corps-unit-pending[\s\S]*?data-unit-id="p1-c1-cav-2"/);
  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-1[\s\S]*?is-active-corps-unit[\s\S]*?is-corps-unit-done[\s\S]*?is-selected[\s\S]*?data-unit-id="p1-c1-cav-1"/);
});

test('a finished selected unit remains selectable but only exposes reset, not new movement commands', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: true });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE, distanceUd: 1 });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-1[\s\S]*?is-corps-unit-done[\s\S]*?is-selected[\s\S]*?data-unit-id="p1-c1-cav-1"/);
  assert.match(html, /data-action="reset-test-units"/);
  assert.match(html, /Diese Einheit ist fuer die aktuelle Movement-Phase bereits beendet/);
  assert.match(html, /data-action="toggle-advance-mode" disabled/);
  assert.match(html, /data-action="toggle-wheel-mode" disabled/);
  assert.match(html, /data-action="toggle-slide-mode" disabled/);
});

test('active corps token shows a red mandatory hook badge for unresolved mandatory movement', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'p1-c1-cav-2'
          ? {
              ...unit,
              mandatoryMovementPending: true,
            }
          : unit
      )),
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-2[\s\S]*?is-corps-unit-mandatory[\s\S]*?data-unit-id="p1-c1-cav-2"/);
  assert.match(html, /for-p1-c1-cav-2[\s\S]*?battlefield-unit-status-badge is-mandatory/);
});

test('spent corps tokens remain visibly marked on the battlefield after corps completion', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.COMPLETE_ACTIVE_CORPS });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-2' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-1[\s\S]*?is-spent-corps-unit[\s\S]*?disabled[\s\S]*?data-unit-id="p1-c1-cav-1"/);
  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-2[\s\S]*?is-spent-corps-unit[\s\S]*?disabled[\s\S]*?data-unit-id="p1-c1-cav-2"/);
});

test('selected unit renders a green or orange command link to the active commander', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  let html = renderBattlefieldScreen(state);

  assert.match(html, /battlefield-command-link is-in-command/);
  assert.match(html, /data-commander-id="test-unit-1"/);
  assert.match(html, /data-unit-id="p1-c1-cav-1"/);

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        inCommand: {
          ...state.game.commandContext.inCommand,
          status: 'out-of-command',
          label: 'Out of command at 9.00 UD.',
        },
      },
    },
  };

  html = renderBattlefieldScreen(state);

  assert.match(html, /battlefield-command-link is-out-of-command/);
});

test('active commander renders a visible command range ring with label', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /battlefield-command-range-ring has-range is-active-commander-ring/);
  assert.match(html, /data-range-commander-id="test-unit-1"/);
  assert.match(html, /battlefield-command-range-ring-label">8 UD</);
});

test('selected commander attach mode renders a remaining-radius ring and eligible host highlights', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.ATTACH_COMMANDER, unitId: 'test-unit-1' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /battlefield-command-range-ring has-range is-attach-preview-ring/);
  assert.match(html, /Attach 5 UD/);
  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-1[\s\S]*?is-attach-target/);
  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-2[\s\S]*?is-attach-target/);
});

test('command context card renders corps activation progress from command state', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.COMPLETE_ACTIVE_CORPS });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-2' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<strong>Corps offen:<\/strong> 1/);
  assert.match(html, /<strong>Corps aktiv:<\/strong> 1/);
  assert.match(html, /<strong>Corps verbraucht:<\/strong> 1/);
  assert.match(html, /data-corps-activation-status="spent"[\s\S]*?Status: spent/);
  assert.match(html, /data-corps-activation-status="active"[\s\S]*?Status: active/);
  assert.match(html, /data-corps-activation-status="not-yet-activated"[\s\S]*?Status: not-yet-activated/);
});

test('command context card renders cp summary and recent ledger entries for the active corps', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<strong>Kommandeurprofil<\/strong>/);
  assert.match(html, /<strong>Qualitaet:<\/strong> brilliant/);
  assert.match(html, /<strong>Reichweite:<\/strong> 8 UD \/ 32 cm/);
  assert.match(html, /<strong>Aktivierungswurf<\/strong>/);
  assert.match(html, /class="battlefield-command-roll-die" data-roll-value="4"/);
  assert.match(html, /battlefield-command-roll-pips/);
  assert.match(html, /<strong>Wurf-CP:<\/strong> 3/);
  assert.match(html, /<strong>Free-CP Start:<\/strong> 1/);
  assert.match(html, /<strong>Formel:<\/strong> \(4 Wurf \+ 2 Generalwert\) \/ 2 = 3/);
  assert.match(html, /<strong>CP Bilanz<\/strong>/);
  assert.match(html, /Aktivierung/);
  assert.match(html, /Normal verfuegbar/);
  assert.match(html, /Free verfuegbar/);
  assert.match(html, /Verbraucht/);
  assert.match(html, /<strong>CP verfuegbar gesamt:<\/strong> 3/);
  assert.match(html, /<strong>CP verfuegbar normal\/free:<\/strong> 2 \/ 1/);
  assert.match(html, /<strong>CP verbraucht normal\/free:<\/strong> 1 \/ 0/);
  assert.match(html, /<strong>Letzter Wurf:<\/strong> 4/);
  assert.match(html, /<strong>CP Ledger<\/strong>/);
  assert.match(html, /<strong>activation-roll:<\/strong> \+3 CP/);
  assert.match(html, /<strong>free-cp:<\/strong> \+1 CP/);
  assert.match(html, /<strong>base-order:<\/strong> \+1 CP \(p1-c1-cav-1\)/);
});

test('command context card renders current order CP preview before confirmation', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<strong>Aktueller Befehl<\/strong>/);
  assert.match(html, /<strong>Gesamtkosten:<\/strong> 1 CP/);
  assert.match(html, /<strong>Freier CP:<\/strong> nein/);
  assert.match(html, /<strong>base-order:<\/strong> \+1 CP/);
});

test('command context card reflects free CP assignment in the current order preview', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<strong>Aktueller Befehl<\/strong>/);
  assert.match(html, /<strong>Gesamtkosten:<\/strong> 1 CP/);
  assert.match(html, /<strong>Freier CP:<\/strong> ja/);
  assert.match(html, /<strong>free-cp:<\/strong> -1 CP/);
});

test('command context card reflects free CP consumption after moving the free commander', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  const general = state.game.units.find((unit) => unit.id === 'test-unit-1');
  assert.ok(general);

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_UNIT_POSITION,
    unitId: 'test-unit-1',
    xUd: Number((general.xUd + 2).toFixed(3)),
    yUd: general.yUd,
    dragOriginXUd: general.xUd,
    dragOriginYUd: general.yUd,
    maxDistanceUd: 5,
    dragSpentUdAtStart: 0,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_COMMANDER_FREE_MOVE });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<strong>CP verfuegbar gesamt:<\/strong> 3/);
  assert.match(html, /<strong>CP verfuegbar normal\/free:<\/strong> 3 \/ 0/);
  assert.match(html, /<strong>CP verbraucht normal\/free:<\/strong> 0 \/ 1/);
  assert.match(html, /<strong>free-cp:<\/strong> -1 CP \(test-unit-1\)/);
});

test('command context card reflects optional free CP use for an included commander host unit move', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c3-hi-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER, isActive: true });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_ADVANCE });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<strong>CP verfuegbar gesamt:<\/strong> 3/);
  assert.match(html, /<strong>CP verfuegbar normal\/free:<\/strong> 3 \/ 0/);
  assert.match(html, /<strong>CP verbraucht normal\/free:<\/strong> 0 \/ 1/);
  assert.match(html, /<strong>free-cp:<\/strong> -1 CP \(p1-c3-hi-1\)/);
});

test('command context card renders blocked order diagnostics for commander-engaged movement state', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });

  state = {
    ...state,
    game: {
      ...state.game,
      commandContext: {
        ...state.game.commandContext,
        commander: {
          ...state.game.commandContext.commander,
          engagedInCombat: true,
        },
      },
    },
  };

  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: 1,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /<strong>Order Diagnostics<\/strong>/);
  assert.match(html, /<strong>Commander engaged:<\/strong> blocked - Active commander is marked as engaged in combat\./);
  assert.match(html, /<strong>Command points:<\/strong> blocked - Command-point cost check stays blocked because the active commander is marked as engaged in combat/);
});