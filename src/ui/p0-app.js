import { bindAdvanceActionButtons, stopBattlefieldAdvanceDragSession, tryStartBattlefieldAdvanceDrag } from './p0-advance-controls.js';
import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { bindSlideActionButtons, stopBattlefieldSlideDragSession, tryStartBattlefieldSlideDrag } from './p0-slide-controls.js';
import {
  ACTION_TYPES,
  SCREEN_IDS,
} from '../state/p0-state.js';
import { getRemainingAdvanceBudgetUd } from '../state/p0-advance.js';
import { bindWheelActionButtons, stopBattlefieldWheelDragSession, tryStartBattlefieldWheelDrag } from './p0-wheel-controls.js';
import {
  clampBattlefieldCenterToFootprint,
} from './battlefield-coordinate.js';
import {
  startBattlefieldAmbushMarkerDrag,
  startBattlefieldDebugDrag,
  startBattlefieldSetupObjectDrag,
  startBattlefieldTerrainDrag,
  startBattlefieldUnitDrag,
} from './battlefield-drag-controls.js';
import { renderBattlefieldScreen } from './p0-battlefield.js';

const KEY_BINDING_ROWS = [
  {
    id: 'overlayCycle',
    label: 'Overlay umschalten',
    defaultKey: 'V',
  },
];

function getPlayerAccent(state) {
  return state.shell.settings.playerColor;
}

function formatBindingValue(value) {
  return value || 'Nicht belegt';
}

function normalizeKeyInput(key) {
  if (!key) {
    return '';
  }

  if (key === ' ') {
    return 'Space';
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  return key;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toCorpsSlotId(corpsId) {
  const raw = String(corpsId ?? '').toLowerCase();
  if (!raw) {
    return null;
  }

  const normalized = raw.replaceAll('_', '-');
  const match = normalized.match(/corps-(\d+)/);
  return match ? `corps-${match[1]}` : null;
}

const battlefieldPanSession = {
  active: false,
  dispatch: null,
  surface: null,
  container: null,
  zoom: 1,
  startMouseX: 0,
  startMouseY: 0,
  startPanX: 0,
  startPanY: 0,
  currentPanX: 0,
  currentPanY: 0,
};

let suppressNextBattlefieldSurfaceClick = false;

const battlefieldOverlayHotkeyContext = {
  currentScreen: SCREEN_IDS.MAIN_MENU,
  primary: '',
  secondary: '',
  dispatch: null,
};

const battlefieldUiMemory = {
  panelScrollTopById: {},
  openStateByPersistId: {},
};

function captureBattlefieldUiMemory(container) {
  container.querySelectorAll('[data-panel-id]').forEach((panel) => {
    battlefieldUiMemory.panelScrollTopById[panel.dataset.panelId] = panel.scrollTop;
  });

  container.querySelectorAll('[data-persist-id]').forEach((details) => {
    battlefieldUiMemory.openStateByPersistId[details.dataset.persistId] = details.open;
  });
}

function restoreBattlefieldUiMemory(container) {
  container.querySelectorAll('[data-panel-id]').forEach((panel) => {
    const scrollTop = battlefieldUiMemory.panelScrollTopById[panel.dataset.panelId];
    if (typeof scrollTop === 'number') {
      panel.scrollTop = scrollTop;
    }
  });

  container.querySelectorAll('[data-persist-id]').forEach((details) => {
    const isOpen = battlefieldUiMemory.openStateByPersistId[details.dataset.persistId];
    if (typeof isOpen === 'boolean') {
      details.open = isOpen;
    }
  });
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.matches('input, textarea, select, [contenteditable="true"]');
}

function matchesOverlayHotkey(eventKey, bindingValue) {
  if (!bindingValue) {
    return false;
  }

  return normalizeKeyInput(eventKey) === bindingValue;
}

function getClosestTargetMatch(target, selector) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest(selector);
}

function clampViewportPan(surface, zoom, panX, panY) {
  const rect = surface.getBoundingClientRect();
  const maxPanX = Math.max(0, rect.width * (zoom - 1));
  const maxPanY = Math.max(0, rect.height * (zoom - 1));

  return {
    panX: clamp(panX, 0, maxPanX),
    panY: clamp(panY, 0, maxPanY),
  };
}

function stopBattlefieldPanSession() {
  if (battlefieldPanSession.surface) {
    battlefieldPanSession.surface.classList.remove('is-panning');
  }

  battlefieldPanSession.active = false;
  battlefieldPanSession.dispatch = null;
  battlefieldPanSession.surface = null;
  battlefieldPanSession.container = null;
}

function syncBattlefieldMinimapBox(container, surface, zoom, panX, panY) {
  const minimapViewport = container.querySelector('[data-battlefield-minimap-viewport]');
  if (!surface || !minimapViewport) {
    return;
  }

  const rect = surface.getBoundingClientRect();
  const worldWidth = rect.width * zoom;
  const worldHeight = rect.height * zoom;
  const visibleWidthPercent = 100 / zoom;
  const visibleHeightPercent = 100 / zoom;
  const leftPercent = worldWidth > 0 ? (panX / worldWidth) * 100 : 0;
  const topPercent = worldHeight > 0 ? (panY / worldHeight) * 100 : 0;

  minimapViewport.style.left = `${leftPercent}%`;
  minimapViewport.style.top = `${topPercent}%`;
  minimapViewport.style.width = `${visibleWidthPercent}%`;
  minimapViewport.style.height = `${visibleHeightPercent}%`;
}

function handleBattlefieldPanMove(event) {
  if (!battlefieldPanSession.active || !battlefieldPanSession.surface || !battlefieldPanSession.dispatch) {
    return;
  }

  const nextPan = clampViewportPan(
    battlefieldPanSession.surface,
    battlefieldPanSession.zoom,
    battlefieldPanSession.startPanX - (event.clientX - battlefieldPanSession.startMouseX),
    battlefieldPanSession.startPanY - (event.clientY - battlefieldPanSession.startMouseY),
  );

  battlefieldPanSession.currentPanX = nextPan.panX;
  battlefieldPanSession.currentPanY = nextPan.panY;

  const world = battlefieldPanSession.surface.querySelector('[data-battlefield-world]');
  if (world) {
    world.style.setProperty('--viewport-pan-x', `${nextPan.panX}px`);
    world.style.setProperty('--viewport-pan-y', `${nextPan.panY}px`);
  }

  if (battlefieldPanSession.container) {
    syncBattlefieldMinimapBox(
      battlefieldPanSession.container,
      battlefieldPanSession.surface,
      battlefieldPanSession.zoom,
      nextPan.panX,
      nextPan.panY,
    );
  }
}

function handleBattlefieldPanEnd() {
  if (battlefieldPanSession.active && battlefieldPanSession.dispatch) {
    battlefieldPanSession.dispatch({
      type: ACTION_TYPES.SET_BATTLEFIELD_VIEWPORT,
      viewport: {
        panX: battlefieldPanSession.currentPanX,
        panY: battlefieldPanSession.currentPanY,
      },
    });
  }

  stopBattlefieldPanSession();
}

window.addEventListener('mousemove', handleBattlefieldPanMove);
window.addEventListener('mouseup', handleBattlefieldPanEnd);
window.addEventListener('keydown', (event) => {
  if (
    event.repeat
    || battlefieldOverlayHotkeyContext.currentScreen !== SCREEN_IDS.BATTLEFIELD
    || !battlefieldOverlayHotkeyContext.dispatch
    || event.altKey
    || event.metaKey
    || isEditableTarget(event.target)
  ) {
    return;
  }

  const normalizedKey = normalizeKeyInput(event.key);

  if (!event.ctrlKey && normalizedKey === 'H') {
    event.preventDefault();
    battlefieldOverlayHotkeyContext.dispatch({ type: ACTION_TYPES.TOGGLE_DEBUG_MODE });
    return;
  }

  if (!event.ctrlKey && normalizedKey === 'F') {
    event.preventDefault();
    battlefieldOverlayHotkeyContext.dispatch({ type: ACTION_TYPES.TOGGLE_FACING_GEOMETRY_OVERLAY });
    return;
  }

  const matchesPrimary = matchesOverlayHotkey(event.key, battlefieldOverlayHotkeyContext.primary);
  const matchesSecondary = matchesOverlayHotkey(event.key, battlefieldOverlayHotkeyContext.secondary);
  if (!matchesPrimary && !matchesSecondary) {
    return;
  }

  event.preventDefault();
  battlefieldOverlayHotkeyContext.dispatch({ type: ACTION_TYPES.CYCLE_OVERLAY_MODE });
});

function syncBattlefieldMinimap(container, state) {
  const surface = container.querySelector('[data-battlefield-surface]');
  if (!surface) {
    return;
  }

  syncBattlefieldMinimapBox(container, surface, state.game.viewport.zoom, state.game.viewport.panX, state.game.viewport.panY);
}

function attachBattlefieldViewportControls(container, state, dispatch) {
  const surface = container.querySelector('[data-battlefield-surface]');
  if (!surface) {
    return;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;

  syncBattlefieldMinimap(container, state);

  surface.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();

      if (event.ctrlKey && event.shiftKey && state.game.debug.isActive) {
        if (!selectedUnit) {
          return;
        }

        const rotationStepRadians = (Math.PI / 180) * 15;
        const rotationDelta = event.deltaY < 0 ? rotationStepRadians : -rotationStepRadians;
        dispatch({
          type: ACTION_TYPES.SET_SELECTED_UNIT_ROTATION,
          rotationRadians: (selectedUnit.rotationRadians ?? 0) + rotationDelta,
        });
        return;
      }

      if (event.ctrlKey && state.game.debug.isActive) {
        const rotationStepRadians = (Math.PI / 180) * 15;
        const rotationDelta = event.deltaY < 0 ? rotationStepRadians : -rotationStepRadians;
        const nextRotationRadians = state.game.debug.unitPose.rotationRadians + rotationDelta;
        const clampedCenter = clampBattlefieldCenterToFootprint(
          state.game.debug.unitPose.xUd,
          state.game.debug.unitPose.yUd,
          battlefieldProfile,
          {
            widthUd: state.game.debug.unitDimensions.widthUd,
            depthUd: state.game.debug.unitDimensions.depthUd,
            rotationRadians: nextRotationRadians,
          },
        );

        dispatch({
          type: ACTION_TYPES.SET_DEBUG_UNIT_POSITION,
          xUd: Number(clampedCenter.xUd.toFixed(3)),
          yUd: Number(clampedCenter.yUd.toFixed(3)),
        });
        dispatch({
          type: ACTION_TYPES.SET_DEBUG_UNIT_ROTATION,
          rotationRadians: nextRotationRadians,
        });
        return;
      }

      const currentZoom = state.game.viewport.zoom;
      const zoomDelta = event.deltaY < 0 ? 0.12 : -0.12;
      const nextZoom = clamp(Number((currentZoom + zoomDelta).toFixed(2)), 1, 3);
      const rect = surface.getBoundingClientRect();
      const currentWorldWidth = rect.width * currentZoom;
      const currentWorldHeight = rect.height * currentZoom;
      const centerRatioX = currentWorldWidth > 0 ? (state.game.viewport.panX + rect.width / 2) / currentWorldWidth : 0.5;
      const centerRatioY = currentWorldHeight > 0 ? (state.game.viewport.panY + rect.height / 2) / currentWorldHeight : 0.5;
      const nextPanX = centerRatioX * (rect.width * nextZoom) - rect.width / 2;
      const nextPanY = centerRatioY * (rect.height * nextZoom) - rect.height / 2;
      const clampedPan = clampViewportPan(surface, nextZoom, nextPanX, nextPanY);

      if (nextZoom !== currentZoom) {
        dispatch({
          type: ACTION_TYPES.SET_BATTLEFIELD_VIEWPORT,
          viewport: {
            zoom: nextZoom,
            panX: clampedPan.panX,
            panY: clampedPan.panY,
          },
        });
      }
    },
    { passive: false },
  );

  surface.addEventListener('mousedown', (event) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    stopBattlefieldPanSession();
    battlefieldPanSession.active = true;
    battlefieldPanSession.dispatch = dispatch;
    battlefieldPanSession.surface = surface;
    battlefieldPanSession.container = container;
    battlefieldPanSession.zoom = state.game.viewport.zoom;
    battlefieldPanSession.startMouseX = event.clientX;
    battlefieldPanSession.startMouseY = event.clientY;
    battlefieldPanSession.startPanX = state.game.viewport.panX;
    battlefieldPanSession.startPanY = state.game.viewport.panY;
    battlefieldPanSession.currentPanX = state.game.viewport.panX;
    battlefieldPanSession.currentPanY = state.game.viewport.panY;
    surface.classList.add('is-panning');
  });

  surface.addEventListener('auxclick', (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });
}

function renderMainMenu() {
  return `
    <section class="shell-card">
      <div class="status-strip">
        <span class="status-pill">P0 Shell</span>
        <span class="status-pill">Standard 200 als Default</span>
        <span class="status-pill">Deterministische Menuefuehrung</span>
      </div>
      <h1 class="hero-title">AdG Online</h1>
      <p class="hero-copy">Produkt-Shell fuer den ersten spielbaren Ablauf: Hauptmenue, neues Spiel, Optionen, Lade-Platzhalter und erster Uebergang zum Schlachtfeld.</p>
      <div class="menu-grid">
        <button class="shell-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.NEW_GAME}">Neues Spiel</button>
        <button class="shell-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.LOAD_GAME}">Spiel Laden</button>
        <button class="shell-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.OPTIONS}">Optionen</button>
      </div>
    </section>
  `;
}

function renderNewGame(state) {
  const { mode, points } = state.shell.newGame;
  return `
    <section class="shell-card section-stack">
      <div>
        <h1>Neues Spiel</h1>
        <p class="muted-copy">P0 aktiviert nur den Singleplayer-Startpfad. Multiplayer bleibt sichtbar, aber absichtlich deaktiviert.</p>
      </div>
      <div class="summary-banner">
        <strong>Aktuelle Auswahl:</strong> ${mode === 'singleplayer' ? 'Singleplayer' : mode} / ${points} Punkte
      </div>
      <div>
        <h2 class="section-title">Spielmodus</h2>
        <div class="choice-grid">
          <button class="shell-button ${mode === 'singleplayer' ? 'is-active' : ''}" type="button" data-action="set-mode" data-mode="singleplayer" aria-pressed="${mode === 'singleplayer'}">Singleplayer</button>
          <button class="shell-button" type="button" disabled>Multiplayer (spaeter)</button>
        </div>
      </div>
      <div>
        <h2 class="section-title">Punkteformat</h2>
        <div class="choice-grid">
        ${[100, 200, 300]
          .map(
            (value) => `
              <button class="shell-button ${points === value ? 'is-active' : ''}" type="button" data-action="set-points" data-points="${value}" aria-pressed="${points === value}">${value}</button>
            `,
          )
          .join('')}
        </div>
        <p class="muted-copy">200 bleibt das P0-Default fuer den spaeteren Standard-200-Pfad.</p>
      </div>
      <div class="shell-card">
        <h3>Erster P0-Handoff</h3>
        <p class="muted-copy">Der Start geht jetzt zuerst in den P3-Setup-Rahmen auf dem Schlachtfeld. Armeeauswahl, Aufbau und offizielle Deployment-Validierung folgen weiterhin erst in spaeteren Phasen.</p>
      </div>
      <div class="screen-actions">
        <button class="shell-button is-active" type="button" data-action="start-new-game">Zum Setup</button>
        <button class="shell-button" type="button" data-action="start-direct-battle">Direkt zur Schlacht</button>
        <button class="shell-button" type="button" data-action="start-charge-drill-battle">Charge Drill</button>
        <button class="ghost-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.MAIN_MENU}">Zurueck</button>
      </div>
    </section>
  `;
}

function renderOptions(state) {
  const { settings, settingsDraft } = state.shell;
  const activeColor = settings.playerColor;
  const draftColor = settingsDraft.playerColor;
  const activeOverlayPrimary = settings.keyBindings.overlayCycle.primary;
  const draftKeyBindings = settingsDraft.keyBindings;
  return `
    <section class="shell-card section-stack">
      <h1>Optionen</h1>
      <p class="muted-copy">Diese Einstellungen beeinflussen nur Darstellung und Bedienung der Shell, niemals die Regel-Logik.</p>
      <div class="summary-banner">
        <strong>Aktive Shell-Einstellungen:</strong> Spielerfarbe ${activeColor.toUpperCase()} / Overlay-Taste ${formatBindingValue(activeOverlayPrimary)} / Massstab-Overlay ${settings.showScaleOverlay ? 'an' : 'aus'}
      </div>
      <div class="field-label">
        Spielerfarbe
        <div class="color-picker-row">
          <div class="color-display-pill">
            <span class="color-swatch large" style="background:${draftColor}"></span>
          </div>
          <button class="shell-button color-picker-button" type="button" data-action="open-color-picker">Farbe aendern</button>
        </div>
        <input class="native-color-input" type="color" value="${draftColor}" data-setting="player-color-draft" />
      </div>
      <section class="section-stack keyboard-card">
        <div>
          <h2 class="section-title">Schlachtfeld</h2>
        </div>
        <label class="toggle-row">
          <input type="checkbox" data-setting="scale-overlay-toggle" ${settingsDraft.showScaleOverlay ? 'checked' : ''} />
          <span>Massstab unten rechts als Overlay anzeigen</span>
        </label>
      </section>
      <section class="section-stack keyboard-card">
        <div>
          <h2 class="section-title">Tastaturbelegung</h2>
          <p class="muted-copy">In die Zelle klicken und danach die neue Taste druecken. Die Aenderung wird erst mit Speichern uebernommen.</p>
        </div>
        <div class="binding-table-wrap">
          <table class="binding-table">
            <thead>
              <tr>
                <th>Funktion</th>
                <th>Standard Taste</th>
                <th>Alternative</th>
              </tr>
            </thead>
            <tbody>
              ${KEY_BINDING_ROWS.map(
                (binding) => `
                  <tr>
                    <td>${binding.label}</td>
                    <td>
                      <button
                        class="binding-key ${draftKeyBindings[binding.id].primary ? 'is-filled' : ''}"
                        type="button"
                        data-action="capture-binding"
                        data-binding-id="${binding.id}"
                        data-binding-slot="primary"
                      >${formatBindingValue(draftKeyBindings[binding.id].primary)}</button>
                    </td>
                    <td>
                      <button
                        class="binding-key ${draftKeyBindings[binding.id].secondary ? 'is-filled' : ''}"
                        type="button"
                        data-action="capture-binding"
                        data-binding-id="${binding.id}"
                        data-binding-slot="secondary"
                      >${formatBindingValue(draftKeyBindings[binding.id].secondary)}</button>
                    </td>
                  </tr>
                `,
              ).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <p class="muted-copy">Einstellungen gelten nur fuer diese Sitzung.</p>
      <div class="screen-actions">
        <button class="shell-button is-active" type="button" data-action="save-settings">Speichern</button>
        <button class="ghost-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.MAIN_MENU}">Zurueck</button>
      </div>
    </section>
  `;
}

function renderLoadGame() {
  return `
    <section class="shell-card section-stack">
      <h1>Spiel Laden</h1>
      <p class="muted-copy">Save/Load kommt in einer spaeteren Phase. P0 prueft hier nur, dass die Produkt-Shell einen echten, navigierbaren Platzhalter besitzt.</p>
      <div class="summary-banner">
        Spaeter kommen Match-Wiederaufnahme, gespeicherte Shell-Einstellungen und echte Kampflaststaende hinzu.
      </div>
      <div class="placeholder-list" aria-label="P0 Lade-Platzhalter">
        <div class="placeholder-item">
          <strong>Keine Speicherstaende in P0</strong>
          <span>Diese Phase prueft nur Menuefluss und Ruecknavigation.</span>
        </div>
        <div class="placeholder-item is-disabled">
          <strong>Match fortsetzen</strong>
          <span>Kommt in spaeterer Phase mit echter Spielstandsstruktur.</span>
        </div>
      </div>
      <div class="screen-actions">
        <button class="ghost-button" type="button" data-action="navigate" data-screen="${SCREEN_IDS.MAIN_MENU}">Zurueck</button>
      </div>
    </section>
  `;
}

function renderScreen(state) {
  switch (state.shell.currentScreen) {
    case SCREEN_IDS.NEW_GAME:
      return renderNewGame(state);
    case SCREEN_IDS.OPTIONS:
      return renderOptions(state);
    case SCREEN_IDS.LOAD_GAME:
      return renderLoadGame(state);
    case SCREEN_IDS.BATTLEFIELD:
      return renderBattlefieldScreen(state);
    case SCREEN_IDS.MAIN_MENU:
    default:
      return renderMainMenu(state);
  }
}

export function renderApp(container, state, dispatch) {
  const playerAccent = getPlayerAccent(state);
  const showStateSnapshot = state.shell.currentScreen !== SCREEN_IDS.BATTLEFIELD;
  const shouldPreserveBattlefieldUi = state.shell.currentScreen === SCREEN_IDS.BATTLEFIELD;
  battlefieldOverlayHotkeyContext.currentScreen = state.shell.currentScreen;
  battlefieldOverlayHotkeyContext.primary = state.shell.settings.keyBindings.overlayCycle.primary;
  battlefieldOverlayHotkeyContext.secondary = state.shell.settings.keyBindings.overlayCycle.secondary;
  battlefieldOverlayHotkeyContext.dispatch = dispatch;

  if (shouldPreserveBattlefieldUi) {
    captureBattlefieldUiMemory(container);
  }

  container.innerHTML = `
    <main class="app-shell" style="--player-accent:${playerAccent}">
      <div class="shell-layout">
        ${renderScreen(state)}
        ${showStateSnapshot ? `
          <section class="shell-card">
            <h2>P0 State Snapshot</h2>
            <pre class="state-snapshot">${JSON.stringify(state, null, 2)}</pre>
          </section>
        ` : ''}
      </div>
    </main>
  `;

  if (shouldPreserveBattlefieldUi) {
    restoreBattlefieldUiMemory(container);
  }

  container.querySelectorAll('[data-action="navigate"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.NAVIGATE, screenId: button.dataset.screen });
    });
  });

  container.querySelectorAll('[data-action="set-mode"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SET_NEW_GAME_MODE, mode: button.dataset.mode });
    });
  });

  container.querySelectorAll('[data-action="set-points"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SET_NEW_GAME_POINTS, points: Number(button.dataset.points) });
    });
  });

  const openColorPickerButton = container.querySelector('[data-action="open-color-picker"]');
  const playerColorDraftInput = container.querySelector('[data-setting="player-color-draft"]');
  if (openColorPickerButton && playerColorDraftInput) {
    openColorPickerButton.addEventListener('click', () => {
      playerColorDraftInput.click();
    });
  }

  if (playerColorDraftInput) {
    playerColorDraftInput.addEventListener('change', (event) => {
      dispatch({ type: ACTION_TYPES.SET_PLAYER_COLOR_DRAFT, playerColorDraft: event.target.value });
    });
  }

  const scaleOverlayToggle = container.querySelector('[data-setting="scale-overlay-toggle"]');
  if (scaleOverlayToggle) {
    scaleOverlayToggle.addEventListener('change', (event) => {
      dispatch({ type: ACTION_TYPES.SET_SCALE_OVERLAY_DRAFT, showScaleOverlay: event.target.checked });
    });
  }

  container.querySelectorAll('[data-action="capture-binding"]').forEach((button) => {
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        return;
      }

      event.preventDefault();
      dispatch({
        type: ACTION_TYPES.SET_KEY_BINDING_DRAFT,
        bindingId: button.dataset.bindingId,
        slot: button.dataset.bindingSlot,
        keyValue: normalizeKeyInput(event.key),
      });
    });
  });

  const saveSettingsButton = container.querySelector('[data-action="save-settings"]');
  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SAVE_SETTINGS });
    });
  }

  const startNewGameButton = container.querySelector('[data-action="start-new-game"]');
  if (startNewGameButton) {
    startNewGameButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.START_NEW_GAME });
    });
  }

  const startDirectBattleButton = container.querySelector('[data-action="start-direct-battle"]');
  if (startDirectBattleButton) {
    startDirectBattleButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.START_DIRECT_BATTLE });
    });
  }

  const startChargeDrillBattleButton = container.querySelector('[data-action="start-charge-drill-battle"]');
  if (startChargeDrillBattleButton) {
    startChargeDrillBattleButton.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.START_CHARGE_DRILL_BATTLE });
    });
  }

  container.querySelectorAll('[data-action="setup-previous"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.GO_TO_PREVIOUS_SETUP_STEP });
    });
  });

  container.querySelectorAll('[data-action="setup-lock"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.LOCK_CURRENT_SETUP_STEP });
    });
  });

  container.querySelectorAll('[data-action="dismiss-setup-guide"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.DISMISS_CURRENT_SETUP_GUIDE });
    });
  });

  container.querySelectorAll('[data-action="setup-next"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.ADVANCE_SETUP_STEP });
    });
  });

  container.querySelectorAll('[data-action="complete-setup"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.COMPLETE_SETUP });
    });
  });

  container.querySelectorAll('[data-action="round-begin"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.ROUND_BEGIN });
    });
  });

  container.querySelectorAll('[data-action="request-next-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.REQUEST_NEXT_CORPS });
    });
  });

  container.querySelectorAll('[data-action="confirm-next-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.CONFIRM_NEXT_CORPS });
    });
  });

  container.querySelectorAll('[data-action="skip-remaining-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SKIP_REMAINING_CORPS });
    });
  });

  container.querySelectorAll('[data-action="advance-round-phase"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.ADVANCE_ROUND_PHASE });
    });
  });

  const battlefieldSurface = container.querySelector('[data-battlefield-surface]');
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
  const selectedTerrainPlaceholder = state.game.setup.terrain.placeholders.find(
    (placeholder) => placeholder.id === state.game.setup.terrain.selectedPlaceholderId,
  ) || null;
  const selectedSetupObject = state.game.setup.setupObjects.placeholders.find(
    (setupObject) => setupObject.id === state.game.setup.setupObjects.selectedObjectId,
  ) || null;
  const remainingAdvanceBudgetUd = selectedUnit ? getRemainingAdvanceBudgetUd(selectedUnit, state.game.units) : 4;
  const maxAdvanceUd = selectedUnit ? Math.min(remainingAdvanceBudgetUd, selectedUnit.yUd) : 4;
  const canDragUnitsInSetup = state.game.setup.isActive
    && (state.game.setup.currentStepId === 'deployment' || state.game.setup.currentStepId === 'ready');
  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  const selectedUnitCorpsSlotId = toCorpsSlotId(selectedUnit?.corpsId);
  const selectedCommanderPreview = state.game.commanderFreeMovePreview?.status === 'ready'
    && state.game.commanderFreeMovePreview.mode === 'move'
    && state.game.commanderFreeMovePreview.unitId === selectedUnit?.id
    ? state.game.commanderFreeMovePreview
    : null;
  const hasPendingCommanderPreview = state.game.commanderFreeMovePreview?.status === 'targeting'
    || state.game.commanderFreeMovePreview?.status === 'ready';
  const selectedCommanderSpentUd = Number(selectedCommanderPreview?.nextSpentUd ?? selectedUnit?.advanceUsedUd ?? 0);
  const selectedCommanderRemainingBudgetUd = Math.max(0, 5 - selectedCommanderSpentUd);
  const canDragFreeCommanderInBattle = !state.game.setup.isActive
    && state.game.commandContext.currentPhaseId === 'movement'
    && selectedUnit !== null
    && selectedUnit.isCommander
    && !selectedUnit.hasIncludedCommander
    && !selectedUnit.attachedUnitId
    && selectedCommanderRemainingBudgetUd > 0
    && selectedUnit.owner === state.game.commandContext.activePlayerId
    && Boolean(activeCorpsSlotId && selectedUnitCorpsSlotId && activeCorpsSlotId === selectedUnitCorpsSlotId)
    && !hasPendingCommanderPreview
    && !state.game.advanceModeActive
    && !state.game.slideModeActive
    && !state.game.wheelModeActive;
  const isTerrainPlacementStep = state.game.setup.isActive
    && (state.game.setup.currentStepId === 'terrain' || state.game.setup.currentStepId === 'terrain-adjustment');
  const isCampPlacementStep = state.game.setup.isActive && state.game.setup.currentStepId === 'camps';
  const isAmbushPlacementStep = state.game.setup.isActive && state.game.setup.currentStepId === 'ambushes';
  const canEditOwnerPrivateSetup = state.game.setupViewMode === 'canonical' || state.game.setupViewMode === 'player-one-view';

  container.querySelectorAll('[data-action="set-setup-view-mode"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.SET_SETUP_VIEW_MODE,
        viewMode: button.dataset.viewMode,
      });
    });
  });

  container.querySelectorAll('[data-action="set-active-player"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.SET_ACTIVE_PLAYER,
        playerId: button.dataset.playerId,
      });
    });
  });

  container.querySelectorAll('[data-action="set-active-battle-phase"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.SET_ACTIVE_BATTLE_PHASE,
        phaseId: button.dataset.phaseId,
      });
    });
  });

  const cancelMovementPreviewButton = container.querySelector('[data-action="cancel-movement-preview"]');
  if (cancelMovementPreviewButton) {
    cancelMovementPreviewButton.addEventListener('click', () => {
      const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
      const hasCommanderPreview = Boolean(
        state.game.commanderFreeMovePreview?.status !== 'idle'
          && state.game.commanderFreeMovePreview.unitId === selectedUnit?.id,
      );
      const canResetCommanderFreeMove = Boolean(
        selectedUnit
          && selectedUnit.isCommander
          && !selectedUnit.hasIncludedCommander
          && !state.game.setup.isActive
          && state.game.commandContext.currentPhaseId === 'movement'
          && Number.isFinite(selectedUnit.commanderMovePhaseStartXUd)
          && Number.isFinite(selectedUnit.commanderMovePhaseStartYUd)
          && (selectedUnit.advanceUsedUd ?? 0) > 0,
      );

      stopBattlefieldAdvanceDragSession();
      stopBattlefieldSlideDragSession();
      stopBattlefieldWheelDragSession();

      if (hasCommanderPreview) {
        dispatch({ type: ACTION_TYPES.CANCEL_COMMANDER_FREE_MOVE_PREVIEW });
        return;
      }

      if (canResetCommanderFreeMove) {
        dispatch({
          type: ACTION_TYPES.RESET_COMMANDER_FREE_MOVE,
          unitId: selectedUnit.id,
        });
        return;
      }

      dispatch({ type: ACTION_TYPES.CANCEL_MOVEMENT_PREVIEW });
    });
  }

  const stayButton = container.querySelector('[data-action="mark-unit-stay"]');
  if (stayButton) {
    stayButton.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.MARK_UNIT_STAY,
        unitId: state.game.selectedUnitId,
      });
    });
  }

  const chargePreviewButton = container.querySelector('[data-action="start-charge-preview"]');
  if (chargePreviewButton) {
    chargePreviewButton.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.START_CHARGE_PREVIEW,
        unitId: state.game.selectedUnitId,
      });
    });
  }

  container.querySelectorAll('[data-action="resolve-charge-reaction"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.RESOLVE_CHARGE_REACTION,
        decisionType: button.dataset.decisionType,
      });
    });
  });

  container.querySelectorAll('[data-action="resolve-secondary-charge-reaction"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.RESOLVE_SECONDARY_CHARGE_REACTION,
        decisionType: button.dataset.decisionType,
      });
    });
  });

  container.querySelectorAll('[data-action="resolve-charge-branch-distance"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.RESOLVE_CHARGE_BRANCH_DISTANCE,
        dieRoll: Number(button.dataset.dieRoll),
      });
    });
  });

  container.querySelectorAll('[data-action="acknowledge-evade-choice-handoff"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.ACKNOWLEDGE_EVADE_CHOICE_HANDOFF });
    });
  });

  container.querySelectorAll('[data-action="start-adjusted-charge-distance-roll"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.START_ADJUSTED_CHARGE_DISTANCE_ROLL });
    });
  });

  container.querySelectorAll('[data-action="preview-evade-avoidance-node"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.PREVIEW_EVADE_AVOIDANCE_NODE,
        stepId: button.dataset.stepId || null,
      });
    });
  });

  container.querySelectorAll('[data-action="reset-evade-avoidance-path"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.RESET_EVADE_AVOIDANCE_PATH });
    });
  });

  container.querySelectorAll('[data-action="select-evade-avoidance-choice"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.SELECT_EVADE_AVOIDANCE_CHOICE,
        choice: {
          candidateId: button.dataset.candidateId || null,
          side: button.dataset.side,
          distanceUd: Number(button.dataset.distanceUd),
        },
      });
    });
  });

  container.querySelectorAll('[data-action="resolve-charge-continuation-choice"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.RESOLVE_CHARGE_CONTINUATION_CHOICE,
        option: button.dataset.option,
      });
    });
  });

  container.querySelectorAll('[data-action="cancel-charge-preview"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.CANCEL_CHARGE_PREVIEW });
    });
  });

  const useFreeCommandPointToggle = container.querySelector('[data-action="toggle-use-free-command-point"]');
  if (useFreeCommandPointToggle) {
    useFreeCommandPointToggle.addEventListener('change', (event) => {
      dispatch({
        type: ACTION_TYPES.SET_USE_FREE_COMMAND_POINT_FOR_ORDER,
        isActive: event.target.checked,
      });
    });
  }

  const commanderEngagedDiagnosticToggle = container.querySelector('[data-action="toggle-commander-engaged-diagnostic"]');
  if (commanderEngagedDiagnosticToggle) {
    commanderEngagedDiagnosticToggle.addEventListener('change', (event) => {
      dispatch({
        type: ACTION_TYPES.SET_COMMANDER_ENGAGED_DIAGNOSTIC,
        isActive: event.target.checked,
      });
    });
  }

  const attachCommanderButton = container.querySelector('[data-action="attach-commander"]');
  if (attachCommanderButton) {
    attachCommanderButton.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.ATTACH_COMMANDER,
        unitId: state.game.selectedUnitId,
      });
    });
  }

  container.querySelectorAll('[data-action="select-active-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.SELECT_ACTIVE_CORPS,
        corpsId: button.dataset.corpsId,
      });
    });
  });

  container.querySelectorAll('[data-action="add-terrain-placeholder"]').forEach((button, index) => {
    button.addEventListener('click', () => {
      const existingCount = state.game.setup.terrain.placeholders.length;
      dispatch({
        type: ACTION_TYPES.ADD_TERRAIN_PLACEHOLDER,
        placeholder: {
          id: `terrain-${Date.now()}-${index}`,
          terrainType: button.dataset.terrainType,
          label: button.dataset.terrainLabel,
          shapeModel: button.dataset.terrainShape,
          pose: {
            xUd: 6 + Math.min(existingCount, 4) * 2.5,
            yUd: 6 + Math.min(existingCount, 3) * 1.8,
          },
          footprint: {
            widthUd: Number(button.dataset.terrainWidthUd),
            depthUd: Number(button.dataset.terrainDepthUd),
            rotationRadians: 0,
          },
        },
      });
    });
  });

  container.querySelectorAll('[data-action="add-setup-object"]').forEach((button, index) => {
    button.addEventListener('click', () => {
      const existingCount = state.game.setup.setupObjects.placeholders.length;
      dispatch({
        type: ACTION_TYPES.ADD_SETUP_OBJECT,
        setupObject: {
          id: `setup-object-${Date.now()}-${index}`,
          family: button.dataset.setupObjectFamily,
          type: button.dataset.setupObjectType,
          label: button.dataset.setupObjectLabel,
          owner: 'public',
          pose: {
            xUd: 8 + Math.min(existingCount, 4) * 2.1,
            yUd: 15 + Math.min(existingCount, 3) * 1.1,
          },
          footprint: {
            widthUd: Number(button.dataset.setupObjectWidthUd),
            depthUd: Number(button.dataset.setupObjectDepthUd),
            rotationRadians: 0,
          },
        },
      });
    });
  });

  container.querySelectorAll('[data-action="add-ambush-marker"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.ADD_AMBUSH_MARKER,
      });
    });
  });

  container.querySelectorAll('[data-action="select-terrain-placeholder"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER, placeholderId: button.dataset.terrainPlaceholderId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !isTerrainPlacementStep) {
        return;
      }

      const placeholderId = button.dataset.terrainPlaceholderId;
      const placeholder = state.game.setup.terrain.placeholders.find((candidate) => candidate.id === placeholderId);
      if (!placeholder) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      startBattlefieldTerrainDrag({
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        placeholderId,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      });
      dispatch({ type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER, placeholderId });
    });
  });

  container.querySelectorAll('[data-action="select-setup-object"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_SETUP_OBJECT, setupObjectId: button.dataset.setupObjectId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !isCampPlacementStep) {
        return;
      }

      const setupObjectId = button.dataset.setupObjectId;
      const setupObject = state.game.setup.setupObjects.placeholders.find((candidate) => candidate.id === setupObjectId);
      if (!setupObject) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      startBattlefieldSetupObjectDrag({
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        setupObjectId,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      });
      dispatch({ type: ACTION_TYPES.SELECT_SETUP_OBJECT, setupObjectId });
    });
  });

  container.querySelectorAll('[data-action="select-battle-plan-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_BATTLE_PLAN_CORPS, corpsId: button.dataset.corpsId });
    });
  });

  container.querySelectorAll('[data-action="assign-battle-plan-corps"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({
        type: ACTION_TYPES.ASSIGN_BATTLE_PLAN_CORPS,
        corpsId: state.game.setup.battlePlan.selectedCorpsId,
        fieldId: button.dataset.fieldId,
      });
    });
  });

  container.querySelectorAll('[data-action="select-ambush-marker"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!canEditOwnerPrivateSetup) {
        return;
      }

      dispatch({ type: ACTION_TYPES.SELECT_AMBUSH_MARKER, markerId: button.dataset.markerId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !isAmbushPlacementStep || !canEditOwnerPrivateSetup) {
        return;
      }

      const markerId = button.dataset.markerId;
      const marker = state.game.setup.ambushMarkers.markers.find((candidate) => candidate.id === markerId);
      if (!marker) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      startBattlefieldAmbushMarkerDrag({
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        markerId,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      });
      dispatch({ type: ACTION_TYPES.SELECT_AMBUSH_MARKER, markerId });
    });
  });

  container.querySelectorAll('[data-action="edit-ambush-notes"]').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      dispatch({
        type: ACTION_TYPES.UPDATE_AMBUSH_MARKER_CONTENTS,
        markerId: textarea.dataset.markerId,
        privateContents: {
          notes: textarea.value,
        },
      });
    });
  });

  bindAdvanceActionButtons({ container, dispatch, state });
  bindSlideActionButtons({ container, dispatch, state });
  bindWheelActionButtons({ container, dispatch, state });

  container.querySelectorAll('[data-action="select-unit"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const attachPreviewActive = state.game.commanderFreeMovePreview?.status === 'targeting'
        && state.game.commanderFreeMovePreview?.mode === 'attach'
        && state.game.commanderFreeMovePreview?.unitId === state.game.selectedUnitId;
      const chargeTargetingActive = state.game.chargePreview?.status === 'targeting'
        && state.game.chargePreview?.intent?.unitId === state.game.selectedUnitId;
      const chargeContactSideChoice = getClosestTargetMatch(event.target, '[data-charge-contact-side-selectable]');

      if (chargeContactSideChoice) {
        dispatch({
          type: ACTION_TYPES.SELECT_CHARGE_CONTACT_SIDE,
          defenderId: button.dataset.unitId,
          side: chargeContactSideChoice.dataset.chargeContactSide,
        });
        return;
      }

      if (attachPreviewActive) {
        dispatch({ type: ACTION_TYPES.ATTACH_COMMANDER, unitId: button.dataset.unitId });
        return;
      }

      if (chargeTargetingActive) {
        if (button.dataset.unitId !== state.game.selectedUnitId) {
          dispatch({ type: ACTION_TYPES.SET_CHARGE_TARGET, targetUnitId: button.dataset.unitId });
        }
        return;
      }

      dispatch({ type: ACTION_TYPES.SELECT_UNIT, unitId: button.dataset.unitId });
    });

    button.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface) {
        return;
      }

      if ((canDragUnitsInSetup || canDragFreeCommanderInBattle) && state.game.selectedUnitId === button.dataset.unitId) {
        event.preventDefault();
        suppressNextBattlefieldSurfaceClick = true;
        startBattlefieldUnitDrag({
          battlefieldSurface,
          state,
          dispatch,
          battlefieldProfile,
          unitId: button.dataset.unitId,
          unit: selectedUnit,
          moveBudgetUd: canDragFreeCommanderInBattle ? selectedCommanderRemainingBudgetUd : null,
          dragSpentUdAtStart: canDragFreeCommanderInBattle ? selectedCommanderSpentUd : null,
          dragOrigin: canDragFreeCommanderInBattle
            ? {
                xUd: selectedCommanderPreview?.xUd ?? selectedUnit.xUd,
                yUd: selectedCommanderPreview?.yUd ?? selectedUnit.yUd,
              }
            : null,
          onSuppressNextSurfaceClick: () => {
            suppressNextBattlefieldSurfaceClick = true;
          },
        });
        return;
      }

      if (tryStartBattlefieldAdvanceDrag({
        event,
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        unitId: button.dataset.unitId,
        maxAdvanceUd,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      })) {
        return;
      }

      if (tryStartBattlefieldSlideDrag({
        event,
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        unitId: button.dataset.unitId,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      })) {
        return;
      }

    });
  });

  container.querySelectorAll('[data-advance-preview-handle]').forEach((previewHandle) => {
    previewHandle.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface) {
        return;
      }

      if (tryStartBattlefieldAdvanceDrag({
        event,
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        unitId: previewHandle.dataset.unitId,
        maxAdvanceUd,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      })) {
        return;
      }

    });
  });

  container.querySelectorAll('[data-slide-preview-handle]').forEach((previewHandle) => {
    previewHandle.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface) {
        return;
      }

      if (tryStartBattlefieldSlideDrag({
        event,
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        unitId: previewHandle.dataset.unitId,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      })) {
        return;
      }
    });
  });

  container.querySelectorAll('[data-wheel-handle]').forEach((wheelHandle) => {
    wheelHandle.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface) {
        return;
      }

      if (tryStartBattlefieldWheelDrag({
        event,
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        unitId: wheelHandle.dataset.unitId,
        selectedUnit,
        cornerSide: wheelHandle.dataset.cornerSide,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      })) {
        return;
      }
    });
  });

  container.querySelectorAll('[data-debug-unit]').forEach((debugUnit) => {
    debugUnit.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || !battlefieldSurface || !state.game.debug.isActive) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressNextBattlefieldSurfaceClick = true;
      startBattlefieldDebugDrag({
        battlefieldSurface,
        state,
        dispatch,
        battlefieldProfile,
        onSuppressNextSurfaceClick: () => {
          suppressNextBattlefieldSurfaceClick = true;
        },
      });
    });
  });

  if (battlefieldSurface) {
    battlefieldSurface.addEventListener('click', (event) => {
      if (suppressNextBattlefieldSurfaceClick) {
        suppressNextBattlefieldSurfaceClick = false;
        return;
      }

      if (
        getClosestTargetMatch(event.target, '[data-action="select-unit"]')
        || getClosestTargetMatch(event.target, '[data-advance-preview-handle]')
        || getClosestTargetMatch(event.target, '[data-slide-preview-handle]')
        || getClosestTargetMatch(event.target, '[data-wheel-handle]')
        || getClosestTargetMatch(event.target, '[data-debug-unit]')
        || getClosestTargetMatch(event.target, '[data-action="select-terrain-placeholder"]')
        || getClosestTargetMatch(event.target, '[data-action="select-setup-object"]')
      ) {
        return;
      }

      dispatch({ type: ACTION_TYPES.SELECT_UNIT, unitId: null });
      if (selectedTerrainPlaceholder) {
        dispatch({ type: ACTION_TYPES.SELECT_TERRAIN_PLACEHOLDER, placeholderId: null });
      }
      if (selectedSetupObject) {
        dispatch({ type: ACTION_TYPES.SELECT_SETUP_OBJECT, setupObjectId: null });
      }
    });
  }
  attachBattlefieldViewportControls(container, state, dispatch);
}

