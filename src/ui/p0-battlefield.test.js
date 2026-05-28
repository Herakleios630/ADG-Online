import test from 'node:test';
import assert from 'node:assert/strict';

import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { UNIT_PROFILE_IDS } from '../data/unit-profiles.js';
import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
  CHARGE_REACTION_DECISION_TYPES,
  EVADE_CHOICE_HANDOFF_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createChargeBranchRollResult,
  resolveIsolatedSingleUnitEvadePlan,
} from '../engine/charge/index.js';
import { ACTION_TYPES, BATTLE_PHASE_IDS, SETUP_VIEW_MODES, createInitialAppState, reduceAppState } from '../state/p0-state.js';
import { createInitialShootingState } from '../state/p0-shooting.js';
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

function getUnitMarkup(html, unitId) {
  const unitMarkup = [...html.matchAll(/<button[\s\S]*?<\/button>/g)]
    .map((match) => match[0])
    .find((markup) => markup.includes(`data-unit-id="${unitId}"`));

  assert.ok(unitMarkup, `expected markup for unit ${unitId}`);
  return unitMarkup;
}

function createShootingUiShooter(overrides = {}) {
  return {
    id: overrides.id ?? 'shoot-ui-shooter',
    owner: overrides.owner ?? 'player-1',
    corpsId: overrides.corpsId ?? 'corps-1',
    shootingProfileId: overrides.shootingProfileId ?? 'sp-mounted-bow',
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 10,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 0.75,
    rotationRadians: overrides.rotationRadians ?? 0,
    baseShape: overrides.baseShape ?? 'rectangle',
    scenarioLabel: overrides.scenarioLabel ?? 'UI Shooter',
    moveCountThisSequence: 0,
    hasChargedThisSequence: false,
    hasEvadedThisSequence: false,
    hasDisengagedThisSequence: false,
    retreatedOutOfZocThisSequence: false,
    engagedInMelee: false,
    inMeleeSupport: false,
    providesOnlySimpleSupport: false,
  };
}

function createShootingUiTarget(overrides = {}) {
  return {
    id: overrides.id ?? 'shoot-ui-target',
    owner: overrides.owner ?? 'player-2',
    profileId: overrides.profileId ?? UNIT_PROFILE_IDS.LIGHT_INFANTRY,
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 8.5,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 1,
    rotationRadians: overrides.rotationRadians ?? 0,
    baseShape: overrides.baseShape ?? 'square',
    scenarioLabel: overrides.scenarioLabel ?? 'UI Target',
  };
}

function createPendingInitialBranchEvadeChoiceState() {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-wheel-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'charge-drill-p2-double-blocker' });
  state = reduceAppState(state, {
    type: ACTION_TYPES.SELECT_CHARGE_START_MANOEUVRE,
    manoeuvreType: 'wheel',
    pivotSide: 'left',
    angleRadians: Math.PI / 6,
  });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.EVADE,
  });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
    dieRoll: 6,
  });

  assert.equal(state.game.chargePreview.evadeChoiceHandoff?.status, EVADE_CHOICE_HANDOFF_STATUSES.PENDING);
  assert.equal(state.game.chargePreview.evadeMove?.status, EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED);
  assert.deepEqual(
    state.game.chargePreview.evadeMove?.avoidanceCandidates?.map((candidate) => candidate.id),
    ['branch-current-orientation', 'branch-direction-wheel'],
  );

  return state;
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
  assert.match(html, /data-automation-id="round-begin"/);
  assert.match(html, /aria-label="Runde beginnen"/);
});

test('round corps selection exposes stable automation hooks for corps 1', () => {
  let state = completeSetupToBattle();
  state = reduceAppState(state, { type: ACTION_TYPES.ROUND_BEGIN });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-automation-id="round-corps-selection-dialog"/);
  assert.match(html, /data-action="select-active-corps"/);
  assert.match(html, /data-corps-id="corps-1"/);
  assert.match(html, /data-automation-id="select-active-corps-corps-1"/);
  assert.match(html, /aria-label="Corps 1 auswaehlen"/);
});

test('charge drill battle renders the scenario units and future terrain hook in battle view', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"/);
  assert.match(html, /data-automation-id="unit-charge-drill-p1-front-charger"/);
  assert.match(html, /data-unit-y-ud="17"/);
  assert.match(html, /data-unit-id="charge-drill-p2-front-target"/);
  assert.match(html, /data-unit-owner="player-2"/);
  assert.match(html, /data-unit-scenario-label="P2 Front Target"/);
  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"[\s\S]*?data-unit-visual-profile-id="vp-cavalry"/);
  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"[\s\S]*?data-unit-render-family="mounted"/);
  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"[\s\S]*?data-unit-base-silhouette="mounted"/);
  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"[\s\S]*?data-unit-facing-marker="front-wedge"/);
  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"[\s\S]*?<span class="battlefield-unit-visual is-render-family-mounted is-base-mounted is-base-depth-three-quarter is-figures-horsemen is-accent-saddle-cloth is-facing-front-wedge"/);
  assert.match(html, /data-unit-id="charge-drill-p1-general"[\s\S]*?data-unit-visual-profile-id="vp-commander"/);
  assert.match(html, /data-unit-id="charge-drill-p1-general"[\s\S]*?data-unit-render-family="commander"/);
  assert.match(html, /data-unit-id="charge-drill-p1-general"[\s\S]*?data-unit-owner-color-treatment="ring-and-badge"/);
  assert.match(html, /data-unit-id="charge-drill-p1-general"[\s\S]*?<span class="battlefield-unit-visual is-render-family-commander is-base-commander is-base-depth-full is-figures-leader is-accent-command-ring is-facing-front-chevron"/);
  assert.match(html, /data-unit-id="charge-drill-p2-cavalry-bow-target"[\s\S]*?<span class="battlefield-unit-visual-bow-marker"/);
  assert.equal([...getUnitMarkup(html, 'charge-drill-p2-light-troop-hook-target').matchAll(/battlefield-unit-figure-marker/g)].length, 2);
  assert.match(getUnitMarkup(html, 'charge-drill-p2-light-troop-hook-target'), /is-base-depth-full/);
  assert.equal([...getUnitMarkup(html, 'charge-drill-p1-front-charger').matchAll(/battlefield-unit-figure-marker/g)].length, 3);
  assert.equal([...getUnitMarkup(html, 'charge-drill-p2-cavalry-bow-target').matchAll(/battlefield-unit-figure-marker/g)].length, 2);
  assert.equal([...getUnitMarkup(html, 'charge-drill-p1-heavy-infantry-charger').matchAll(/battlefield-unit-figure-marker/g)].length, 8);
  assert.equal([...getUnitMarkup(html, 'charge-drill-p1-pike-charger').matchAll(/battlefield-unit-figure-marker/g)].length, 12);
  assert.equal([...getUnitMarkup(html, 'charge-drill-p1-elephant-charger').matchAll(/battlefield-unit-figure-marker/g)].length, 1);
  assert.match(html, /data-unit-id="charge-drill-p1-evade-zoc-charger"/);
  assert.match(html, /data-unit-id="charge-drill-p2-evade-zoc-target"/);
  assert.match(html, /data-unit-id="charge-drill-p1-evade-blocker-charger"/);
  assert.match(html, /data-unit-id="charge-drill-p2-evade-blocker-target"/);
  assert.match(html, /Future Charge Terrain Hook/);
});

test('conform drill battle renders source example lane anchors and metadata in battle view', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_CONFORM_DRILL_BATTLE });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="conform-drill-cfd-e1-b1-charger"/);
  assert.match(html, /data-automation-id="unit-conform-drill-cfd-e1-b1-charger"/);
  assert.match(html, /data-unit-scenario-label="CFD-E1 B1 Charger - Shifting Units"/);
  assert.match(html, /data-unit-scenario-lane-id="CFD-E1"/);
  assert.match(html, /data-unit-scenario-example-id="rv2-p53-shifting-units-a"/);
  assert.match(html, /data-unit-scenario-support-status="supported"/);
  assert.match(html, /data-unit-id="conform-drill-cfd-e2-reference-anchor"[\s\S]*?data-unit-scenario-support-status="deferred"/);
  assert.match(html, /data-unit-id="conform-drill-cfd-e2-b2-reference"[\s\S]*?data-unit-scenario-role="cfd-e2-b2-reference"/);
  assert.match(html, /data-unit-id="conform-drill-cfd-e2-a3-reference"[\s\S]*?data-unit-scenario-example-id="rv2-p53-incomplete-conformation-a"/);
  assert.match(html, /data-unit-id="conform-drill-cfd-e2-a3-reference"[\s\S]*?data-unit-scenario-blocker="Requires multi-unit in-contact and support-network-aware conformation\."/);
  assert.match(html, /data-unit-id="conform-drill-cfd-e3-reference-anchor"[\s\S]*?data-unit-scenario-example-id="rv2-p53-conformation-terrain-a"/);
  assert.match(html, /data-unit-id="conform-drill-cfd-e4-reference-anchor"[\s\S]*?data-unit-scenario-lane-id="CFD-E4"/);
});

test('shooting drill battle renders direct shooting anchors and shoot-target status metadata', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });

  let html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="shooting-drill-p1-light-foot-shooter"/);
  assert.match(html, /data-unit-id="shooting-drill-p1-light-foot-support"/);
  assert.match(html, /data-unit-id="shooting-drill-p2-light-foot-shooter"/);
  assert.match(html, /data-unit-id="shooting-drill-p2-front-target"/);
  assert.match(html, /data-unit-id="shooting-drill-p2-screened-target"/);
  assert.match(html, /data-unit-id="shooting-drill-p1-front-target"/);
  assert.match(html, /data-unit-id="shooting-drill-p2-screened-target"[\s\S]*?data-unit-scenario-blocker="Current unit-blocker LOS subset keeps this target blocked behind the nearer enemy unit on the mounted-bow lane\."/);
  assert.doesNotMatch(html, /data-round-dialog-overlay/);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'shooting-drill-p1-light-foot-shooter' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_SHOOTING_DECLARATION_TARGET, targetUnitId: 'shooting-drill-p2-front-target' });
  html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="shooting-drill-p2-front-target"[\s\S]*?data-shoot-target-status="eligible"/);
  assert.match(html, /data-unit-id="shooting-drill-p2-front-target"[\s\S]*?data-selected-shoot-target-current-status="eligible"/);
  assert.match(html, /data-shooting-priority-line/);
  assert.match(html, /data-shooting-zone-overlay/);
  assert.match(html, /data-action="confirm-shooting-declaration"/);
});

test('shooting drill battle renders the bounded roll result popup after a declaration is locked', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'shooting-drill-p1-light-foot-shooter' });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_SHOOTING_DECLARATION_TARGET, targetUnitId: 'shooting-drill-p2-front-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_SHOOTING_DECLARATION });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_PROTECTION, resolvedTargetProtectionValue: 1 });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_SHOOTER_DIE, dieRoll: 5 });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_SHOOTING_RESOLUTION_TARGET_DIE, dieRoll: 3 });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-action="set-shooting-resolution-protection"/);
  assert.match(html, /data-action="set-shooting-resolution-shooter-die"/);
  assert.match(html, /data-action="set-shooting-resolution-target-die"/);
  assert.match(html, /data-automation-id="shooting-resolution-dialog"/);
  assert.match(html, />OK</);
  assert.match(html, /data-testid="shooting-resolution-preview-card"/);
});

test('shooting phase announce dialog renders guided procedure counts before the queue starts', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });
  state = {
    ...state,
    game: {
      ...state.game,
      shooting: {
        ...state.game.shooting,
        procedure: {
          ...state.game.shooting.procedure,
          status: 'announced',
          overview: {
            totalRangedUnits: 2,
            eligibleUnits: 1,
            blockedUnits: 1,
            sourceOpenUnits: 0,
            completedUnits: 0,
          },
        },
      },
      round: {
        ...state.game.round,
        roundPhase: 'shooting',
        dialog: {
          type: 'phase-announce',
          phaseLabel: 'Schiessen',
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-automation-id="shooting-phase-dialog"/);
  assert.match(html, /Gefuehrte Shooting Procedure/);
  assert.match(html, /<strong>Ranged units:<\/strong> 2/);
  assert.match(html, /<strong>Can shoot now:<\/strong> 1/);
  assert.match(html, /<strong>Currently blocked:<\/strong> 1/);
  assert.match(html, /data-action="acknowledge-shooting-phase-procedure"/);
});

test('shooting LOS p58 battle renders the source-backed unit roles and target statuses', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_LOS_EXAMPLE_BATTLE });

  let html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="shooting-los-example-a1"/);
  assert.match(html, /data-unit-id="shooting-los-example-a2"/);
  assert.match(html, /data-unit-id="shooting-los-example-b"/);
  assert.match(html, /data-unit-id="shooting-los-example-c1"[\s\S]*?data-unit-scenario-blocker="B blocks line of sight from both bowmen to C1 in the current unit-blocker LOS subset\."/);
  assert.match(html, /data-unit-id="shooting-los-example-a1"[\s\S]*?data-unit-scenario-example-id="rv2-p58-line-of-sight-a"/);

  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'shooting-los-example-a2' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DECLARATION_PREVIEW });
  html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="shooting-los-example-b"[\s\S]*?data-shoot-target-status="eligible"/);
  assert.match(html, /data-unit-id="shooting-los-example-b"[\s\S]*?data-selected-shoot-target-current-status="eligible"/);
  assert.match(html, /data-unit-id="shooting-los-example-c1"[\s\S]*?data-shoot-target-status="blocked"/);
  assert.match(html, /data-unit-id="shooting-los-example-c2"[\s\S]*?data-shoot-target-status="blocked"/);
});

test('shooting command panel exposes pass only after the player selects an unresolved shooter', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'shooting-drill-p1-light-foot-shooter' });
  state = {
    ...state,
    game: {
      ...state.game,
      shooting: {
        ...state.game.shooting,
        procedure: {
          ...state.game.shooting.procedure,
          overview: {
            totalRangedUnits: 3,
            eligibleUnits: 3,
            blockedUnits: 0,
            sourceOpenUnits: 0,
            completedUnits: 0,
          },
        },
      },
    },
  };
  state = reduceAppState(state, { type: ACTION_TYPES.SET_COMMAND_MENU_BRANCH, branch: 'shoot' });

  const html = renderBattlefieldScreen(state);

  assert.doesNotMatch(html, /data-automation-id="shooting-phase-dialog"/);
  assert.match(html, /data-testid="shooting-procedure-overview-card"/);
  assert.match(html, /<strong>Eligible:<\/strong> 3/);
  assert.match(html, /data-action="pass-active-shooter"/);
  assert.match(html, /data-action="deselect-unit"/);
  assert.match(html, />Abwaehlen</);
  assert.match(html, /data-shooting-procedure-status="active"/);
});

test('shooting sequence handoff dialog renders the next-player yes-no prompt', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });
  state = {
    ...state,
    game: {
      ...state.game,
      shooting: {
        ...state.game.shooting,
        handoff: {
          status: 'pending',
          kind: 'next-player',
          nextPlayerId: 'player-2',
        },
      },
      round: {
        ...state.game.round,
        dialog: {
          type: 'shooting-sequence-handoff',
          phaseLabel: null,
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-automation-id="shooting-sequence-handoff-dialog"/);
  assert.match(html, /Alle Schuetzen haben geschossen/);
  assert.match(html, /Abgabe an naechsten Spieler\?/);
  assert.match(html, /data-action="confirm-shooting-sequence-handoff"/);
  assert.match(html, /data-action="dismiss-shooting-sequence-handoff"/);
});

test('shooting sequence handoff dialog renders the melee confirmation prompt', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });
  state = {
    ...state,
    game: {
      ...state.game,
      shooting: {
        ...state.game.shooting,
        handoff: {
          status: 'pending',
          kind: 'melee',
          nextPlayerId: null,
        },
      },
      round: {
        ...state.game.round,
        dialog: {
          type: 'shooting-sequence-handoff',
          phaseLabel: null,
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-automation-id="shooting-sequence-handoff-dialog"/);
  assert.match(html, /Weiter mit Nahkampfphase/);
  assert.match(html, /data-action="confirm-shooting-sequence-handoff"/);
  assert.doesNotMatch(html, /data-action="dismiss-shooting-sequence-handoff"/);
});

test('shooting battlefield renders support lines and support badges from reducer-owned declaration preview data', () => {
  const shooter = createShootingUiShooter({ id: 'support-main', xUd: 10, scenarioLabel: 'Support Main' });
  const supporter = createShootingUiShooter({ id: 'support-wing', xUd: 12, scenarioLabel: 'Support Wing' });
  const target = createShootingUiTarget({ id: 'support-target', xUd: 10, yUd: 8.5, scenarioLabel: 'Support Target' });
  let state = createInitialAppState();

  state = {
    ...state,
    game: {
      ...state.game,
      selectedUnitId: shooter.id,
      setup: {
        ...state.game.setup,
        isActive: false,
      },
      commandContext: {
        ...state.game.commandContext,
        currentPhaseId: BATTLE_PHASE_IDS.SHOOTING,
        activePlayerId: 'player-1',
      },
      commandMenu: {
        ...state.game.commandMenu,
        branch: 'shoot',
      },
      units: [shooter, supporter, target],
      shooting: createInitialShootingState({
        status: 'active',
        phaseId: 'shooting',
        actingPlayerId: 'player-1',
        preview: {
          status: 'ready',
          shooterUnitId: shooter.id,
          targetUnitId: target.id,
        },
        procedure: {
          status: 'active',
          selectableUnitIds: [shooter.id, supporter.id],
          queueUnitIds: [shooter.id, supporter.id],
          unitStatuses: [
            { unitId: shooter.id, status: 'waiting' },
            { unitId: supporter.id, status: 'waiting' },
          ],
          overview: {
            totalRangedUnits: 2,
            eligibleUnits: 2,
            blockedUnits: 0,
            sourceOpenUnits: 0,
            completedUnits: 0,
          },
        },
      }),
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-testid="shooting-support-card"/);
  assert.match(html, /Support Fire/);
  assert.match(html, /Support Wing/);
  assert.match(html, /\+1/);
  assert.match(html, /data-support-shooter-unit-id="support-wing"/);
  assert.match(html, /data-support-target-unit-id="support-target"/);
  assert.match(html, /data-support-shooter-badge="support-wing"/);
});

test('shooting battlefield reuses procedure colors and greys non-ranged friendly units', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_SHOOTING_DRILL_BATTLE });
  state = {
    ...state,
    game: {
      ...state.game,
      units: [
        ...state.game.units,
        {
          ...state.game.units.find((unit) => unit.id === 'shooting-drill-p2-front-target'),
          id: 'shooting-drill-p1-melee-only',
          owner: 'player-1',
          corpsId: 'p1-corps-1',
          xUd: 22,
          yUd: 16,
          scenarioRole: 'melee-only-reference',
          scenarioLabel: 'P1 Melee Only',
        },
      ],
      shooting: {
        ...state.game.shooting,
        procedure: {
          ...state.game.shooting.procedure,
          unitStatuses: [
            { unitId: 'shooting-drill-p1-light-foot-shooter', status: 'active' },
            { unitId: 'shooting-drill-p1-mounted-bow-anchor', status: 'blocked' },
            { unitId: 'shooting-drill-p1-melee-only', status: 'non-ranged' },
          ],
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);
  const activeShooterMarkup = getUnitMarkup(html, 'shooting-drill-p1-light-foot-shooter');
  const blockedShooterMarkup = getUnitMarkup(html, 'shooting-drill-p1-mounted-bow-anchor');
  const meleeOnlyMarkup = getUnitMarkup(html, 'shooting-drill-p1-melee-only');

  assert.match(activeShooterMarkup, /data-shooting-procedure-status="active"/);
  assert.match(blockedShooterMarkup, /is-shooting-procedure-blocked/);
  assert.match(blockedShooterMarkup, /data-shooting-procedure-status="blocked"/);
  assert.match(meleeOnlyMarkup, /is-shooting-procedure-non-ranged/);
  assert.match(meleeOnlyMarkup, /data-shooting-procedure-status="non-ranged"/);
});

test('conform drill CFD-E1 renders live conformation and shifted-neighbor preview after no-evade', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_CONFORM_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'conform-drill-cfd-e1-b1-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_PREVIEW });
  state = reduceAppState(state, { type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: 'conform-drill-cfd-e1-a1-target' });
  state = reduceAppState(state, { type: ACTION_TYPES.CONFIRM_CHARGE_DIRECTION });
  state = reduceAppState(state, {
    type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
    decisionType: CHARGE_REACTION_DECISION_TYPES.NO_EVADE,
  });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-conformation-preview-ghost/);
  assert.match(html, /data-conformation-candidate-id="front-primary"/);
  assert.match(html, /data-conformation-candidate-status="complete"/);
  assert.match(html, /data-conformation-shift-ghost/);
  assert.match(html, /data-shift-unit-id="conform-drill-cfd-e1-b2-shifted-neighbor"/);
  assert.match(html, /data-shift-direction="rear"/);
  assert.match(html, /data-conformation-shift-badge/);
  assert.match(html, /Shift/);
  assert.match(html, /CFD-E1 B2 Shifted Neighbor - Shifting Units: rear 0\.8 UD/);
  assert.match(html, /Shift-Folgen/);
  assert.match(html, /move\/rally lock/);
});

test('battlefield tokens render unique numeric debug labels for each unit', () => {
  let state = createInitialAppState();
  state = reduceAppState(state, { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });

  const html = renderBattlefieldScreen(state);
  const debugLabels = [...html.matchAll(/<span class="battlefield-unit-debug-label" aria-hidden="true">(\d+)<\/span>/g)]
    .map((match) => match[1]);

  assert.equal(debugLabels.length, state.game.units.length);
  assert.equal(new Set(debugLabels).size, state.game.units.length);
  assert.equal(debugLabels[0], '1');
  assert.equal(debugLabels.at(-1), String(state.game.units.length));
  assert.match(html, /battlefield-unit-debug-label" aria-hidden="true">1<\/span>/);
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
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = reduceAppState(state, { type: ACTION_TYPES.MARK_UNIT_STAY, unitId: 'charge-drill-p1-front-charger' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-charge-drill-p1-wheel-charger[\s\S]*?is-active-corps-unit[\s\S]*?is-corps-unit-pending[\s\S]*?data-unit-id="charge-drill-p1-wheel-charger"/);
  assert.match(html, /class="battlefield-unit-token for-charge-drill-p1-front-charger[\s\S]*?is-active-corps-unit[\s\S]*?is-corps-unit-done[\s\S]*?is-selected[\s\S]*?data-unit-id="charge-drill-p1-front-charger"/);
  assert.match(html, /data-unit-id="charge-drill-p1-wheel-charger"[\s\S]*?battlefield-unit-visual-facing" aria-hidden="true" data-front-status="pending"/);
  assert.match(html, /data-unit-id="charge-drill-p1-front-charger"[\s\S]*?battlefield-unit-visual-facing" aria-hidden="true" data-front-status="done"/);
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
  assert.doesNotMatch(html, /data-action="set-command-menu-branch" data-branch="move"/);
  assert.doesNotMatch(html, /data-action="start-charge-preview"/);
  assert.doesNotMatch(html, /data-action="mark-unit-stay"/);
  assert.doesNotMatch(html, /data-action="toggle-advance-mode"/);
  assert.doesNotMatch(html, /data-action="toggle-wheel-mode"/);
  assert.doesNotMatch(html, /data-action="toggle-slide-mode"/);
});

test('active corps token shows a red mandatory hook badge for unresolved mandatory movement', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => (
        unit.id === 'charge-drill-p1-wheel-charger'
          ? {
              ...unit,
              mandatoryMovementPending: true,
            }
          : unit
      )),
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /class="battlefield-unit-token for-charge-drill-p1-wheel-charger[\s\S]*?is-corps-unit-mandatory[\s\S]*?data-unit-id="charge-drill-p1-wheel-charger"/);
  assert.match(html, /for-charge-drill-p1-wheel-charger[\s\S]*?battlefield-unit-status-badge is-mandatory/);
  assert.match(html, /data-unit-id="charge-drill-p1-wheel-charger"[\s\S]*?battlefield-unit-visual-facing" aria-hidden="true" data-front-status="mandatory"/);
});

test('non-active corps tokens keep the neutral front strip without an active-corps status marker', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-unit-id="charge-drill-p1-cavalry-bow-charger"[\s\S]*?battlefield-unit-visual-facing" aria-hidden="true"(?! data-front-status=)/);
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
  assert.match(html, /Grundreichweite|nach Zielauswahl/);
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

test('battlefield renders the first pending secondary reaction dialog even when earlier secondary requests are already complete', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            scenarioLabel: 'Sekundaerziel Alt',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        if (unit.id === 'p2-c2-mi-1') {
          return {
            ...unit,
            owner: 'player-2',
            scenarioLabel: 'Sekundaerziel Offen',
            xUd: 5,
            yUd: 14,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        intent: {
          ...state.game.chargePreview.intent,
          unitId: 'test-unit-1',
          targetUnitId: 'test-unit-4',
        },
        followThroughResolution: {
          ...state.game.chargePreview.followThroughResolution,
          status: 'secondary-target',
          defenderId: 'test-unit-4',
          selectedTargetId: 'test-unit-4',
        },
        reactionRequests: [
          {
            unitId: 'test-unit-3',
            type: 'may-evade',
            status: 'complete',
            contactEventIndex: 0,
          },
          {
            unitId: 'test-unit-4',
            type: 'none',
            status: 'complete',
            contactEventIndex: 1,
          },
          {
            unitId: 'p2-c2-mi-1',
            type: 'may-evade',
            status: 'pending',
            contactEventIndex: 2,
          },
        ],
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /Sekundaerziel-Reaktion/);
  assert.match(html, /Sekundaerziel Offen/);
  assert.doesNotMatch(html, /Sekundaerziel Alt reagiert jetzt/);
  assert.match(html, /data-action="resolve-secondary-charge-reaction"/);
});

test('battlefield keeps the pending secondary reaction dialog visible when a stale secondary reaction decision exists', () => {
  let state = selectTestUnit(advanceToBattlefield());
  state = {
    ...state,
    game: {
      ...state.game,
      units: state.game.units.map((unit) => {
        if (unit.id === 'test-unit-4') {
          return {
            ...unit,
            owner: 'player-2',
            scenarioLabel: 'Sekundaerziel Alt',
            xUd: 5,
            yUd: 15,
            rotationRadians: Math.PI,
          };
        }

        if (unit.id === 'p2-c2-mi-1') {
          return {
            ...unit,
            owner: 'player-2',
            scenarioLabel: 'Sekundaerziel Offen',
            xUd: 5,
            yUd: 14,
            rotationRadians: Math.PI,
          };
        }

        return unit;
      }),
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        intent: {
          ...state.game.chargePreview.intent,
          unitId: 'test-unit-1',
          targetUnitId: 'test-unit-4',
        },
        followThroughResolution: {
          ...state.game.chargePreview.followThroughResolution,
          status: 'secondary-target',
          defenderId: 'test-unit-4',
          selectedTargetId: 'test-unit-4',
        },
        secondaryReactionDecision: {
          unitId: 'test-unit-4',
          type: 'no-evade',
        },
        reactionRequests: [
          {
            unitId: 'test-unit-3',
            type: 'may-evade',
            status: 'complete',
            contactEventIndex: 0,
          },
          {
            unitId: 'test-unit-4',
            type: 'none',
            status: 'complete',
            contactEventIndex: 1,
          },
          {
            unitId: 'p2-c2-mi-1',
            type: 'may-evade',
            status: 'pending',
            contactEventIndex: 2,
          },
        ],
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-reaction-dialog-overlay/);
  assert.match(html, /Sekundaerziel-Reaktion/);
  assert.match(html, /Sekundaerziel Offen/);
  assert.match(html, /data-action="resolve-secondary-charge-reaction"/);
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
  assert.match(html, /data-conformation-preview-ghost/);
  assert.match(html, /data-conformation-preview-badge/);
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

test('battlefield renders conformation shift ghosts separately from the charge-start ghost', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'no-evade-handoff',
        intent: {
          unitId: 'test-unit-1',
          startPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
          startManoeuvre: { type: 'wheel' },
        },
        pathSegments: [{ kind: 'charge-direction-guide', xUd: 10, yUd: 9, rotationRadians: Math.PI, distanceUd: 1 }],
        conformationPlan: {
          status: 'ready',
          sourceStatus: 'verified',
          selectedCandidateId: 'front-primary',
          candidates: [{
            id: 'front-primary',
            status: 'complete',
            sourceStatus: 'verified',
            finalPose: { xUd: 10, yUd: 8, rotationRadians: Math.PI },
          }],
          shiftingPlan: {
            status: 'ready',
            sourceStatus: 'verified',
            steps: [{
              unitId: 'test-unit-2',
              direction: 'rear',
              distanceUd: 1.005,
              toPose: { xUd: 12, yUd: 10.995, rotationRadians: Math.PI },
            }],
            lockEffects: [],
            diagnostics: [],
          },
          diagnostics: [],
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-charge-preview-ghost/);
  assert.match(html, /data-conformation-preview-ghost/);
  assert.match(html, /data-conformation-shift-ghost/);
  assert.match(html, /data-conformation-shift-badge/);
  assert.match(html, /data-shift-unit-id="test-unit-2"/);
});

test('battlefield marks source-open conformation ghosts honestly', () => {
  let state = advanceToBattlefield();
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'test-unit-1' });

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'no-evade-handoff',
        intent: { unitId: 'test-unit-1' },
        conformationPlan: {
          status: 'source-open',
          sourceStatus: 'errata-check',
          selectedCandidateId: null,
          candidates: [{
            id: 'front-primary',
            status: 'incomplete',
            sourceStatus: 'needs-source-check',
            finalPose: { xUd: 10, yUd: 8.8, rotationRadians: Math.PI },
          }],
          shiftingPlan: null,
          diagnostics: [{ code: 'conformation.shift.blocked.unshiftable-unit', message: 'Source open.' }],
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-conformation-preview-ghost/);
  assert.match(html, /data-conformation-source-status="needs-source-check"/);
  assert.match(html, /battlefield-conformation-ghost[^"]*is-source-open/);
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
  assert.match(html, /data-evade-preview-trail/);
  assert.match(html, /data-evade-source-status="verified"/);
});

test('battlefield renders evade preview path trails from explicit evade path segments', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        evadePlan: {
          reactingUnitId: 'charge-drill-p2-front-target',
          contactType: 'front',
          reorientedPose: {
            xUd: 6,
            yUd: 13,
            rotationRadians: 0,
          },
          endPose: {
            xUd: 7,
            yUd: 10,
            rotationRadians: 0,
          },
          pathSegments: [
            {
              kind: 'evade-slide',
              endPose: {
                xUd: 7,
                yUd: 13,
                rotationRadians: 0,
              },
            },
            {
              kind: 'evade-straight',
              xUd: 7,
              yUd: 13,
              rotationRadians: 0,
              distanceUd: 3,
              endPose: {
                xUd: 7,
                yUd: 10,
                rotationRadians: 0,
              },
            },
          ],
          sourceStatus: 'verified',
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);
  const trailMatches = html.match(/data-evade-preview-trail/g) ?? [];

  assert.equal(trailMatches.length, 2);
  assert.match(html, /data-evade-preview-segment-kind="evade-slide"/);
  assert.match(html, /data-evade-preview-segment-kind="evade-straight"/);
});

test('battlefield renders committed evade trails from explicit evade path segments', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });

  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        evadeMove: {
          status: 'committed',
          reactingUnitId: 'charge-drill-p2-front-target',
          sourceStatus: 'verified',
          pathSegments: [
            {
              kind: 'evade-slide',
              endPose: {
                xUd: 7,
                yUd: 13,
                rotationRadians: 0,
              },
            },
            {
              kind: 'evade-straight',
              xUd: 7,
              yUd: 13,
              rotationRadians: 0,
              distanceUd: 3,
              endPose: {
                xUd: 7,
                yUd: 10,
                rotationRadians: 0,
              },
            },
          ],
          finalPose: {
            xUd: 7,
            yUd: 10,
            rotationRadians: 0,
          },
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);
  const trailMatches = html.match(/data-evade-committed-trail/g) ?? [];

  assert.equal(trailMatches.length, 2);
  assert.match(html, /data-evade-committed-corridor/);
  assert.match(html, /data-evade-committed-segment-kind="evade-slide"/);
  assert.match(html, /data-evade-committed-segment-kind="evade-straight"/);
});

test('battlefield renders a hotseat handoff popup before a defender-side evade choice', () => {
  const state = createPendingInitialBranchEvadeChoiceState();

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-choice-handoff-dialog-overlay/);
  assert.match(html, /Spieler B uebernimmt den Ausweichzug/);
  assert.match(html, /data-action="acknowledge-evade-choice-handoff"/);
  assert.doesNotMatch(html, /data-action="select-evade-avoidance-choice"/);
});

test('battlefield renders evade candidate ghosts after the defender handoff is acknowledged', () => {
  let state = createPendingInitialBranchEvadeChoiceState();
  state = reduceAppState(state, { type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-action="select-evade-avoidance-choice"/);
  assert.match(html, /data-candidate-id="branch-current-orientation"/);
  assert.match(html, /data-candidate-id="branch-direction-wheel"/);
  assert.match(html, /Aktuelle Orientierung beibehalten/);
  assert.match(html, /Mit Direction-Wheel anpassen/);
});

test('battlefield renders wheel-style evade candidate ghosts from generic candidate state', () => {
  const obstacleWheelPlan = {
    reactingUnitId: 'charge-drill-p2-front-target',
    reorientedPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    choiceRequired: true,
    sourceStatus: 'needs-source-check',
    avoidanceCandidates: [
      {
        id: 'obstacle-wheel-right-1.570796',
        type: 'obstacle-wheel',
        pivotSide: 'right',
        angleRadians: 1.570796,
        spentDistanceUd: 1.5,
        remainingDistanceUd: 2.5,
        endPose: { xUd: 12.625, yUd: 9.125, rotationRadians: 1.570796 },
        avoidanceSteps: [
          {
            type: 'obstacle-wheel',
            pivotSide: 'right',
            angleRadians: 1.570796,
            spentDistanceUd: 1.5,
            endPose: { xUd: 12.625, yUd: 9.125, rotationRadians: 1.570796 },
          },
        ],
      },
    ],
  };
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
        evadePlan: {
          ...obstacleWheelPlan,
          choiceRequired: true,
          sourceStatus: 'needs-source-check',
        },
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          status: 'choice-required',
          reactingUnitId: 'charge-drill-p2-front-target',
          avoidanceCandidates: obstacleWheelPlan.avoidanceCandidates,
          choiceRequired: true,
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
  assert.match(html, /data-candidate-id="obstacle-wheel-right-1\.570796"/);
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
      { id: 'friendly-blocker', xUd: 9.25, yUd: 11, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
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
        evadePlan: {
          ...chainedPlan,
          choiceRequired: true,
          sourceStatus: 'needs-source-check',
        },
        evadeMove: {
          ...state.game.chargePreview.evadeMove,
          status: 'choice-required',
          reactingUnitId: 'charge-drill-p2-front-target',
          avoidanceCandidates: chainedPlan.avoidanceCandidates,
          choiceRequired: true,
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
  assert.match(html, /data-candidate-id="straight"/);
  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571-slide-right-1\.000"/);
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
      { id: 'friendly-blocker', xUd: 9.25, yUd: 11, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
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
  assert.match(html, /data-step-id="slide-right-1\.000"/);
  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571-slide-right-1\.000"/);
  assert.doesNotMatch(html, /data-evade-candidate-ghost[\s\S]*data-candidate-id="straight"/);
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
      { id: 'friendly-blocker', xUd: 9.25, yUd: 11, widthUd: 1, depthUd: 1, baseShape: 'rectangle', rotationRadians: 0 },
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
  assert.match(html, /data-candidate-id="direction-wheel-left-1\.571-slide-right-1\.000"/);
  assert.match(html, /Direction-Wheel links/);
  assert.match(html, /dann rechts sliden/);
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
  assert.doesNotMatch(html, /battlefield-zoc-band/);
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
  assert.match(html, /data-charge-follow-through-minimum-corridor/);
  assert.match(html, /data-charge-follow-through-minimum-ghost/);
  assert.match(html, /data-charge-follow-through-minimum-badge/);
  assert.match(html, /Stop 2 UD/);
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

test('battlefield renders a committed light-troop end-half-turn badge at the final evade pose', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        intent: {
          unitId: 'charge-drill-p1-front-charger',
          targetUnitId: 'charge-drill-p2-front-target',
        },
        evadeMove: {
          status: 'committed',
          reactingUnitId: 'charge-drill-p2-front-target',
          finalPose: {
            xUd: 6,
            yUd: 9,
            rotationRadians: Math.PI,
          },
          endHalfTurnHook: {
            available: true,
            applied: true,
            reason: 'light-troop-end-half-turn',
          },
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-committed-badge="end-half-turn"/);
  assert.match(html, /LT half-turn/);
});

test('battlefield renders a generic committed table-exit badge fixture without implying the live reducer path', () => {
  let state = reduceAppState(createInitialAppState(), { type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_ACTIVE_CORPS, corpsId: 'corps-1' });
  state = reduceAppState(state, { type: ACTION_TYPES.SELECT_UNIT, unitId: 'charge-drill-p1-front-charger' });
  state = {
    ...state,
    game: {
      ...state.game,
      chargePreview: {
        ...state.game.chargePreview,
        status: 'evade-required',
        intent: {
          unitId: 'charge-drill-p1-front-charger',
          targetUnitId: 'charge-drill-p2-front-target',
        },
        evadeMove: {
          status: 'committed',
          reactingUnitId: 'charge-drill-p2-front-target',
          startPose: {
            xUd: 6,
            yUd: 13,
            rotationRadians: Math.PI,
          },
          tableExit: {
            exitsTable: true,
            removeFromPlay: true,
            exitEdges: ['north'],
          },
        },
      },
    },
  };

  const html = renderBattlefieldScreen(state);

  assert.match(html, /data-evade-committed-badge="table-exit"/);
  assert.match(html, /Exit table/);
});