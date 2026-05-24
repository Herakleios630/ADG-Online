import test from 'node:test';
import assert from 'node:assert/strict';

import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../data/battlefield-profiles.js';
import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
  CHARGE_REACTION_DECISION_TYPES,
  createChargeBranchRollResult,
  resolveIsolatedSingleUnitEvadePlan,
} from '../engine/charge/index.js';
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

function selectTestUnit(state) {
  const withActiveCorps = state.game.commandContext.currentPhaseId === BATTLE_PHASE_IDS.MOVEMENT
    && state.game.commandContext.activePlayerId === 'player-1'
    && !state.game.commandContext.activeCorpsId
    ? reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' })
    : state;

  return reduceAppState(withActiveCorps, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
}

function getWheelHandleMarkup(html, cornerSide) {
  const handleMarkup = [...html.matchAll(/<button[\s\S]*?<\/button>/g)]
    .map((match) => match[0])
    .find((markup) => markup.includes('data-wheel-handle') && markup.includes(`data-corner-side="${cornerSide}"`));

  assert.ok(handleMarkup, `expected ${cornerSide} wheel handle to render`);

  return handleMarkup;
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

test('charge drill battle renders the scenario units and future terrain hook in battle view', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"/);
  assert.match(html, /data-unit-id="charge-drill-p2-front-target"/);
  assert.match(html, /data-unit-id="charge-drill-p1-evade-zoc-charger"/);
  assert.match(html, /data-unit-id="charge-drill-p2-evade-zoc-target"/);
  assert.match(html, /data-unit-id="charge-drill-p1-evade-blocker-charger"/);
  assert.match(html, /data-unit-id="charge-drill-p2-evade-blocker-target"/);
  assert.match(html, /Future Charge Terrain Hook/);
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

test('charge targeting renders eligible enemy and blocked friendly highlights from reducer-owned candidates', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-test-unit-3[\s\S]*?is-charge-target-eligible/);
  assert.match(html, /data-unit-id="test-unit-3"[\s\S]*?data-charge-target-status="eligible"/);
  assert.match(html, /erreichbar via/);
  assert.match(html, /class="battlefield-unit-token for-test-unit-4[\s\S]*?is-charge-target-blocked/);
  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-target-status="blocked"/);
  assert.match(html, /nicht erreichbar|ausserhalb der Reichweite/);
  assert.match(html, /class="battlefield-unit-token for-p1-c1-cav-1[\s\S]*?is-charge-target-blocked/);
  assert.match(html, /data-unit-id="p1-c1-cav-1"[\s\S]*?data-charge-target-status="blocked"/);
  assert.match(html, /Nur feindliche Einheiten koennen als Charge-Ziel ausgewaehlt werden/);
});

test('selected charge target is marked on the battlefield after target selection', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-test-unit-3[\s\S]*?is-charge-target-selected/);
  assert.match(html, /data-unit-id="test-unit-3"[\s\S]*?data-charge-contact-classification="front"/);
  assert.match(html, /data-unit-id="test-unit-3"[\s\S]*?data-charge-contact-side="front" data-charge-contact-state="attacked"/);
  assert.match(html, /data-unit-id="test-unit-3"[\s\S]*?data-charge-contact-side="rear" data-charge-contact-state="not-attacked"/);
  assert.doesNotMatch(html, /<button[^>]*class="[^"]*for-test-unit-3[^"]*is-charge-target-selected[^"]*"[^>]*disabled/);
  assert.doesNotMatch(html, /class="battlefield-unit-token for-test-unit-3[\s\S]*?is-charge-target-eligible/);
  assert.doesNotMatch(html, /class="battlefield-unit-token for-p1-c1-cav-1[\s\S]*?is-charge-target-blocked/);
});

test('battlefield renders the charge reaction dialog after direction confirmation', () => {
  let state = advanceToBattlefield();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade', scenarioLabel: 'Ziel Test 3' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-reaction-dialog-overlay/);
  assert.match(html, /Charge-Reaktion/);
  assert.match(html, /Ausweichen/);
  assert.match(html, /Nicht ausweichen/);
  assert.match(html, /Ziel Test 3/);
});

test('battlefield renders a secondary target reaction dialog after follow-through pauses on another enemy', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            scenarioLabel: 'Sekundaerziel Test 4',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 4 });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-reaction-dialog-overlay/);
  assert.match(html, /Sekundaerziel-Reaktion/);
  assert.match(html, /Sekundaerziel Test 4/);
  assert.match(html, /data-action="resolve-secondary-charge-reaction"/);
  assert.match(html, /Weiter/);
});

test('battlefield renders an evade-distance D6 dialog after a secondary target chooses to evade', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            scenarioLabel: 'Sekundaerziel Test 4',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
            chargeReactionProfile: 'may-evade',
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 4 });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-branch-distance-dialog-overlay/);
  assert.match(html, /Ausweichdistanz bestimmen/);
  assert.match(html, /Sekundaerziel Test 4/);
  assert.match(html, /data-action="resolve-charge-branch-distance"/);
});

test('battlefield marks the reanchored secondary defender as the selected charge target after secondary no-evade', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return { ...unit, chargeReactionProfile: 'may-evade' };
        }

        return unit;
      }),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 6 });
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            scenarioLabel: 'Sekundaerziel Test 4',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        evadePlan: {
          ...state.game.chargePreview.evadePlan,
          endPose: {
            xUd: 5,
            yUd: 12,
            rotationRadians: Math.PI,
          },
        },
      },
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, { type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE, dieRoll: 4 });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.NO_EVADE,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(
    html,
    /<button[^>]*class="battlefield-unit-token[^"]*is-charge-target-selected[^"]*"[^>]*data-unit-id="test-unit-4"/,
  );
  assert.doesNotMatch(
    html,
    /<button[^>]*class="battlefield-unit-token[^"]*is-charge-target-selected[^"]*"[^>]*data-unit-id="test-unit-3"/,
  );
});

test('battlefield renders blocked evade requests instead of evade actions', () => {
  let state = advanceToBattlefield();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-3') {
          return {
            ...unit,
            chargeReactionProfile: 'blocked-evade',
            scenarioLabel: 'Ziel Test 3',
          };
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

  const html = renderBattlefieldScreen(state);

  assert.match(html, /Ausweichen blockiert/);
  assert.match(html, /data-decision-type="blocked-no-evade"/);
  assert.doesNotMatch(html, /data-decision-type="evade"/);
});

test('battlefield renders the current evade plan corridor and ghost after the evade-distance roll resolves', () => {
  let state = advanceToBattlefield();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 1,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-preview-reorientation/);
  assert.match(html, /data-evade-contact-type="front"/);
  assert.match(html, /data-evade-preview-corridor/);
  assert.match(html, /data-evade-preview-ghost/);
  assert.match(html, /data-evade-source-status="verified"/);
});

test('battlefield renders a hotseat handoff popup before a defender-side evade choice', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-choice-handoff-dialog-overlay/);
  assert.match(html, /Spieler B uebernimmt den Ausweichzug/);
  assert.match(html, /data-action="acknowledge-evade-choice-handoff"/);
  assert.doesNotMatch(html, /data-action="select-evade-avoidance-choice"/);
});

test('battlefield renders evade candidate ghosts after the defender handoff is acknowledged', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-candidate-ghost/);
  assert.match(html, /data-candidate-id="final-overlap-slide-left-1\.000"/);
  assert.match(html, /data-candidate-id="final-overlap-slide-right-1\.000"/);
});

test('battlefield renders wheel-style evade candidate ghosts from generic candidate state', () => {
  const obstacleWheelPlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'front-blocker', xUd: 9.5, yUd: 8.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'left-obstacle', xUd: 7, yUd: 6.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
      { id: 'right-obstacle', xUd: 10.5, yUd: 6.5, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        evadePlan: obstacleWheelPlan,
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          status: 'choice-required',
          reactingUnitId: 'charge-drill-p2-front-target',
          avoidanceCandidates: obstacleWheelPlan.avoidanceCandidates,
        },
        evadeChoiceHandoff: {
          ...state.game.chargePreview.evadeChoiceHandoff,
          status: 'acknowledged',
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-candidate-ghost/);
  assert.match(html, /data-evade-candidate-type="obstacle-wheel"/);
  assert.match(html, /data-candidate-id="obstacle-wheel-right-1\.571"/);
});

test('battlefield renders intermediate trail ghosts for chained evade candidates', () => {
  const chainedPlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'friendly-blocker', xUd: 8.5, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        evadePlan: chainedPlan,
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          status: 'choice-required',
          reactingUnitId: 'charge-drill-p2-front-target',
          avoidanceCandidates: chainedPlan.avoidanceCandidates,
        },
        evadeChoiceHandoff: {
          ...state.game.chargePreview.evadeChoiceHandoff,
          status: 'acknowledged',
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-candidate-handle/);
  assert.match(html, /data-evade-handle-kind="direction-wheel"/);
  assert.match(html, /data-evade-node-depth="0"/);
  assert.match(html, /data-evade-candidate-trail/);
  assert.match(html, /data-candidate-id="direct-slide-left-1\.000"/);
  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571-slide-left-0\.500"/);
  assert.match(html, /data-evade-step-index="0"/);
  assert.match(html, /data-evade-step-index="1"/);
  assert.match(html, />WL<|>WR</);
});

test('battlefield renders only the next evade choice-tree level after selecting a node', () => {
  const chainedPlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'friendly-blocker', xUd: 8.5, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        evadePlan: chainedPlan,
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          status: 'choice-required',
          reactingUnitId: 'charge-drill-p2-front-target',
          avoidanceCandidates: chainedPlan.avoidanceCandidates,
          choicePathStepIds: ['direction-wheel-left-1.571'],
        },
        evadeChoiceHandoff: {
          ...state.game.chargePreview.evadeChoiceHandoff,
          status: 'acknowledged',
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-node-depth="1"/);
  assert.match(html, /data-step-id="slide-left-0\.500"/);
  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571-slide-left-0\.500"/);
  assert.doesNotMatch(html, /data-evade-candidate-ghost[\s\S]*data-candidate-id="direct-slide-left-1\.000"/);
});

test('battlefield renders chained direction-wheel-slide evade candidate ghosts from generic candidate state', () => {
  const chainedPlan = resolveIsolatedSingleUnitEvadePlan({
    reactingUnit: { id: 'charge-drill-p2-front-target', xUd: 10, yUd: 10, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    contactSnapshot: {
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    chargeDirectionRadians: Math.PI,
    distanceRollResult: createChargeBranchRollResult({ dieRoll: 4, baseDistanceUd: 4 }),
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [
      { id: 'friendly-blocker', xUd: 8.5, yUd: 10, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
    ],
  });
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        evadePlan: chainedPlan,
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          status: 'choice-required',
          reactingUnitId: 'charge-drill-p2-front-target',
          avoidanceCandidates: chainedPlan.avoidanceCandidates,
        },
        evadeChoiceHandoff: {
          ...state.game.chargePreview.evadeChoiceHandoff,
          status: 'acknowledged',
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-candidate-ghost/);
  assert.match(html, /data-evade-candidate-type="direction-wheel-slide"/);
  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571-slide-left-0\.500"/);
  assert.match(html, /Direction-Wheel links/);
  assert.match(html, /dann links sliden/);
});

test('battlefield renders a manual D6 dialog while the evade-distance roll is pending', () => {
  let state = advanceToBattlefield();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-branch-distance-dialog-overlay/);
  assert.match(html, /Ausweichdistanz bestimmen/);
  assert.match(html, /data-action="resolve-charge-branch-distance"/);
  assert.match(html, /data-die-roll="1"/);
  assert.match(html, /data-die-roll="6"/);
});

test('battlefield renders a manual D6 dialog while the adjusted charge distance roll is pending', () => {
  let state = advanceToBattlefield();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-branch-distance-dialog-overlay/);
  assert.match(html, /Adjusted Charge-Distanz bestimmen/);
  assert.match(html, /angepassten Charge/i);
  assert.match(html, /data-action="resolve-charge-branch-distance"/);
});

test('battlefield renders the adjusted-charge follow-up button after the evade-distance roll resolves', () => {
  let state = advanceToBattlefield();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /Adjusted Charge wuerfeln/);
  assert.match(html, /data-action="start-adjusted-charge-distance-roll"/);
});

test('battlefield renders the current adjusted charge follow-through after the second roll resolves', () => {
  let state = advanceToBattlefield();
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'test-unit-3'
          ? { ...unit, chargeReactionProfile: 'may-evade' }
          : unit
      )),
    },
  };

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE, manoeuvreType: 'none' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 2,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-follow-through-corridor/);
  assert.match(html, /data-charge-follow-through-ghost/);
  assert.match(html, /data-charge-follow-through-source-status="verified"/);
});

test('charge side overlays attach to the actual earlier-contact defender instead of only the selected target', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        contactEvents: [
          {
            ...state.game.chargePreview.contactEvents[0],
            defenderId: 'test-unit-4',
            classification: {
              type: 'rear-or-flank',
              flankSide: 'right',
            },
          },
        ],
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-contact-classification="rear-or-flank"/);
  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-contact-side="rear" data-charge-contact-state="possible" data-charge-contact-side-selectable="true"/);
  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-contact-side="right" data-charge-contact-state="possible" data-charge-contact-side-selectable="true"/);
  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-contact-side="left" data-charge-contact-state="not-attacked"/);
  assert.match(html, /data-unit-id="test-unit-3"[\s\S]*?data-charge-contact-classification="none"/);
});

test('rear-or-flank overlays render the reducer-selected side as attacked', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        selectedContactSide: {
          defenderId: 'test-unit-4',
          side: 'right',
        },
        contactEvents: [
          {
            ...state.game.chargePreview.contactEvents[0],
            defenderId: 'test-unit-4',
            classification: {
              type: 'rear-or-flank',
              flankSide: 'right',
            },
          },
        ],
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-selected-charge-contact-side="right"/);
  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-contact-side="right" data-charge-contact-state="attacked" data-charge-contact-side-selectable="true"/);
  assert.match(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-contact-side="rear" data-charge-contact-state="not-attacked"/);
  assert.doesNotMatch(html, /data-unit-id="test-unit-4"[\s\S]*?data-charge-contact-side="right" data-charge-contact-state="possible"/);
});

test('selected charge target renders a provisional frozen charge guide on the battlefield', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-preview-corridor/);
  assert.match(html, /data-charge-preview-ghost/);
  assert.match(html, /data-charge-start-type="none"/);
});

test('active charge preview renders enemy zoc bands even away from the selected charger', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-zoc-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /battlefield-zoc-band/);
  assert.match(html, /data-enemy-id="charge-drill-p2-front-target"/);
  assert.match(html, /data-enemy-id="charge-drill-p2-zoc-sentry"/);
});

test('selected charge target surfaces the current tunnel zoc blocker reason', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-zoc-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SET_CHARGE_TARGET,
    targetUnitId: 'charge-drill-p2-zoc-target',
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-charge-drill-p2-zoc-target[^"]*is-charge-target-blocked[^"]*is-charge-target-selected/);
  assert.match(html, /data-unit-id="charge-drill-p2-zoc-target"[\s\S]*?data-selected-charge-target-current-status="blocked"/);
  assert.match(html, /title="[^"]*ZoC[^"]*charge-drill-p2-zoc-sentry/);
  assert.match(html, /<strong>charge\.target\.path-feasibility:<\/strong> blocked - [^<]*ZoC/);
});

test('charge corridor render uses unit width as corridor width and remaining UD as forward height', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });

  const html = renderBattlefieldScreen(state);
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const selectedUnit = state.game.units.find((unit) => unit.id === 'p1-c1-cav-1');
  const chargeGuide = state.game.chargePreview.pathSegments.find((segment) => segment.kind === 'charge-direction-guide');

  assert.ok(selectedUnit);
  assert.ok(chargeGuide);

  const expectedWidth = `${(selectedUnit.widthUd / battlefieldProfile.widthUd) * 100}%`;
  const expectedHeight = `${((chargeGuide?.distanceUd ?? 0) / battlefieldProfile.heightUd) * 100}%`;

  assert.match(html, new RegExp(`data-charge-preview-corridor[\\s\\S]*?width:${expectedWidth.replaceAll('.', '\\.')}`));
  assert.match(html, new RegExp(`data-charge-preview-corridor[\\s\\S]*?height:${expectedHeight.replaceAll('.', '\\.')}`));
});

test('charge slide start renders a draggable charge-start ghost handle on the battlefield', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'shift-slide',
    slideSide: 'right',
    distanceUd: 1,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-slide-preview-handle/);
  assert.match(html, /data-charge-start-type="shift-slide"/);
});

test('charge wheel start renders battlefield wheel handles from charge-owned state', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'p1-c1-cav-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'test-unit-3' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'right',
    angleRadians: Math.PI / 6,
  });

  const html = renderBattlefieldScreen(state);
  const leftHandleMarkup = getWheelHandleMarkup(html, 'left');
  const rightHandleMarkup = getWheelHandleMarkup(html, 'right');

  assert.match(html, /data-wheel-handle/);
  assert.match(html, /data-charge-start-type="wheel"/);
  assert.match(leftHandleMarkup, /is-active/);
  assert.doesNotMatch(rightHandleMarkup, /is-active/);
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