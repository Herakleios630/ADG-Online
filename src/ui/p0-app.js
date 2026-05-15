import { ACTION_TYPES, SCREEN_IDS } from '../state/p0-state.js';
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

const battlefieldAdvanceDragSession = {
  active: false,
  dispatch: null,
  surfaceRect: null,
  zoom: 1,
  startMouseY: 0,
  startPreviewUd: 0,
  maxAdvanceUd: 4,
};

let suppressNextBattlefieldSurfaceClick = false;

const battlefieldOverlayHotkeyContext = {
  currentScreen: SCREEN_IDS.MAIN_MENU,
  primary: '',
  secondary: '',
  dispatch: null,
};

function matchesOverlayHotkey(eventKey, bindingValue) {
  if (!bindingValue) {
    return false;
  }

  return normalizeKeyInput(eventKey) === bindingValue;
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

function stopBattlefieldAdvanceDragSession() {
  battlefieldAdvanceDragSession.active = false;
  battlefieldAdvanceDragSession.dispatch = null;
  battlefieldAdvanceDragSession.surfaceRect = null;
}

function handleBattlefieldAdvanceDragMove(event) {
  if (!battlefieldAdvanceDragSession.active || !battlefieldAdvanceDragSession.dispatch || !battlefieldAdvanceDragSession.surfaceRect) {
    return;
  }

  const pixelsPerUd = (battlefieldAdvanceDragSession.surfaceRect.height * battlefieldAdvanceDragSession.zoom) / 20;
  if (!pixelsPerUd) {
    return;
  }

  const deltaUd = -(event.clientY - battlefieldAdvanceDragSession.startMouseY) / pixelsPerUd;
  battlefieldAdvanceDragSession.dispatch({
    type: ACTION_TYPES.SET_ADVANCE_PREVIEW_DISTANCE,
    distanceUd: clamp(
      battlefieldAdvanceDragSession.startPreviewUd + deltaUd,
      0,
      battlefieldAdvanceDragSession.maxAdvanceUd,
    ),
  });
}

function handleBattlefieldAdvanceDragEnd() {
  if (!battlefieldAdvanceDragSession.active) {
    return;
  }

  suppressNextBattlefieldSurfaceClick = true;
  stopBattlefieldAdvanceDragSession();
}

window.addEventListener('mousemove', handleBattlefieldPanMove);
window.addEventListener('mouseup', handleBattlefieldPanEnd);
window.addEventListener('mousemove', handleBattlefieldAdvanceDragMove);
window.addEventListener('mouseup', handleBattlefieldAdvanceDragEnd);
window.addEventListener('keydown', (event) => {
  if (event.repeat || battlefieldOverlayHotkeyContext.currentScreen !== SCREEN_IDS.BATTLEFIELD || !battlefieldOverlayHotkeyContext.dispatch) {
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

  syncBattlefieldMinimap(container, state);

  surface.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
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
        <p class="muted-copy">Der Start geht direkt in ein fruehes Schlachtfeld-Placeholder. Armeeauswahl, Aufbau und offizielle Deployment-Validierung folgen erst in spaeteren Phasen.</p>
      </div>
      <div class="screen-actions">
        <button class="shell-button is-active" type="button" data-action="start-new-game">Zum Schlachtfeld</button>
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
  battlefieldOverlayHotkeyContext.currentScreen = state.shell.currentScreen;
  battlefieldOverlayHotkeyContext.primary = state.shell.settings.keyBindings.overlayCycle.primary;
  battlefieldOverlayHotkeyContext.secondary = state.shell.settings.keyBindings.overlayCycle.secondary;
  battlefieldOverlayHotkeyContext.dispatch = dispatch;

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

  const battlefieldSurface = container.querySelector('[data-battlefield-surface]');
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
  const remainingAdvanceBudgetUd = selectedUnit ? Math.max(0, 4 - (selectedUnit.advanceUsedUd ?? 0)) : 4;
  const maxAdvanceUd = selectedUnit ? Math.min(remainingAdvanceBudgetUd, selectedUnit.yUd) : 4;

  const toggleAdvanceModeButton = container.querySelector('[data-action="toggle-advance-mode"]');
  if (toggleAdvanceModeButton) {
    toggleAdvanceModeButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.SET_ADVANCE_MODE, isActive: !state.game.advanceModeActive });
    });
  }

  container.querySelectorAll('[data-action="select-unit"]').forEach((button) => {
    button.addEventListener('click', () => {
      dispatch({ type: ACTION_TYPES.SELECT_UNIT, unitId: button.dataset.unitId });
    });

    button.addEventListener('mousedown', (event) => {
      if (
        event.button !== 0
        || !state.game.advanceModeActive
        || state.game.selectedUnitId !== button.dataset.unitId
        || !battlefieldSurface
      ) {
        return;
      }

      event.preventDefault();
      suppressNextBattlefieldSurfaceClick = true;
      battlefieldAdvanceDragSession.active = true;
      battlefieldAdvanceDragSession.dispatch = dispatch;
      battlefieldAdvanceDragSession.surfaceRect = battlefieldSurface.getBoundingClientRect();
      battlefieldAdvanceDragSession.zoom = state.game.viewport.zoom;
      battlefieldAdvanceDragSession.startMouseY = event.clientY;
      battlefieldAdvanceDragSession.startPreviewUd = state.game.advancePreviewUd;
      battlefieldAdvanceDragSession.maxAdvanceUd = maxAdvanceUd;
    });
  });

  if (battlefieldSurface) {
    battlefieldSurface.addEventListener('click', (event) => {
      if (suppressNextBattlefieldSurfaceClick) {
        suppressNextBattlefieldSurfaceClick = false;
        return;
      }

      if (event.target.closest('[data-action="select-unit"]')) {
        return;
      }

      dispatch({ type: ACTION_TYPES.SELECT_UNIT, unitId: null });
    });
  }

  const confirmAdvanceButton = container.querySelector('[data-action="confirm-advance"]');
  if (confirmAdvanceButton) {
    confirmAdvanceButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.CONFIRM_ADVANCE });
    });
  }

  const resetTestUnitsButton = container.querySelector('[data-action="reset-test-units"]');
  if (resetTestUnitsButton) {
    resetTestUnitsButton.addEventListener('click', () => {
      stopBattlefieldAdvanceDragSession();
      dispatch({ type: ACTION_TYPES.RESET_TEST_UNITS });
    });
  }

  attachBattlefieldViewportControls(container, state, dispatch);
}