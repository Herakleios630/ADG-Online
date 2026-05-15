function formatBindingValue(value) {
  return value || 'Nicht belegt';
}

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderSectorOverlay() {
  return `
    <div class="battlefield-overlay-layer battlefield-overlay-layer-sectors" aria-hidden="true">
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-left"></span>
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-right"></span>
      <span class="battlefield-sector-line battlefield-sector-line-horizontal"></span>
    </div>
  `;
}

function renderDeploymentOverlay() {
  return `
    <div class="battlefield-overlay-layer battlefield-overlay-layer-deployment" aria-hidden="true">
      <span class="battlefield-deployment-band battlefield-deployment-band-light battlefield-deployment-band-top"></span>
      <span class="battlefield-deployment-band battlefield-deployment-band-light battlefield-deployment-band-bottom"></span>
      <span class="battlefield-deployment-band battlefield-deployment-band-main battlefield-deployment-band-top"></span>
      <span class="battlefield-deployment-band battlefield-deployment-band-main battlefield-deployment-band-bottom"></span>
    </div>
  `;
}

export function renderBattlefieldScreen(state) {
  const overlayHotkey = formatBindingValue(state.shell.settings.keyBindings.overlayCycle.primary);
  const showScaleOverlay = state.shell.settings.showScaleOverlay;
  const viewport = state.game.viewport;
  const testUnit = state.game.units[0];
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
  const advanceModeActive = state.game.advanceModeActive && Boolean(selectedUnit);
  const advancePreviewUd = selectedUnit ? state.game.advancePreviewUd : 0;
  const remainingAdvanceBudgetUd = selectedUnit ? Math.max(0, 4 - (selectedUnit.advanceUsedUd ?? 0)) : 4;
  const maxAdvanceUd = selectedUnit ? Math.min(remainingAdvanceBudgetUd, selectedUnit.yUd) : 4;
  const previewUnitYUd = selectedUnit ? Math.max(0, selectedUnit.yUd - advancePreviewUd) : 0;
  const selectedUnitFrontYUd = selectedUnit ? Math.max(0, selectedUnit.yUd - selectedUnit.depthUd / 2) : 0;
  const showDeploymentOverlay = state.game.overlayMode === 'Aufstellungszonen' || state.game.overlayMode === 'Beides';
  const showSectorOverlay = state.game.overlayMode === 'Sektoren' || state.game.overlayMode === 'Beides';
  const unitStyle = [
    `left:${(testUnit.xUd / 30) * 100}%`,
    `top:${(testUnit.yUd / 20) * 100}%`,
    `width:${(testUnit.widthUd / 30) * 100}%`,
    `height:${(testUnit.depthUd / 20) * 100}%`,
  ].join(';');
  const worldStyle = [
    `--viewport-zoom:${viewport.zoom}`,
    `--viewport-pan-x:${viewport.panX}px`,
    `--viewport-pan-y:${viewport.panY}px`,
  ].join(';');
  const previewUnitStyle = selectedUnit
    ? [
        `left:${(selectedUnit.xUd / 30) * 100}%`,
        `top:${(previewUnitYUd / 20) * 100}%`,
        `width:${(selectedUnit.widthUd / 30) * 100}%`,
        `height:${(selectedUnit.depthUd / 20) * 100}%`,
      ].join(';')
    : '';
  const advanceReachStyle = selectedUnit
    ? [
        `left:${(selectedUnit.xUd / 30) * 100}%`,
        `top:${((selectedUnitFrontYUd - maxAdvanceUd) / 20) * 100}%`,
        `width:${(selectedUnit.widthUd / 30) * 100}%`,
        `height:${(maxAdvanceUd / 20) * 100}%`,
      ].join(';')
    : '';

  return `
    <section class="battlefield-shell">
      <div class="battlefield-stage">
        <aside class="battlefield-side-panel battlefield-side-panel-left">
          <button class="ghost-button battlefield-back-button" type="button" data-action="navigate" data-screen="main-menu">Zurueck zum Menue</button>
          <div class="battlefield-placeholder-card">
            <strong>Befehle</strong>
            ${selectedUnit ? `
              <span>Distanz: ${formatLengthUd(advancePreviewUd)} UD / ${formatLengthUd(advancePreviewUd * 4)} cm</span>
              <span>Restbudget: ${formatLengthUd(remainingAdvanceBudgetUd)} UD / ${formatLengthUd(remainingAdvanceBudgetUd * 4)} cm</span>
              <span class="muted-copy">Advance zieht die Einheit frei vorwaerts innerhalb des verbleibenden P0-Budgets von maximal ${formatLengthUd(maxAdvanceUd)} UD.</span>
            ` : `
              <span>Waehle zuerst die Testeinheit aus.</span>
            `}
          </div>
          <div class="battlefield-command-grid">
            <button class="shell-button battlefield-command-button ${advanceModeActive ? 'is-active' : ''}" type="button" data-action="toggle-advance-mode" ${selectedUnit && maxAdvanceUd > 0 ? '' : 'disabled'}>Advance</button>
            <span class="battlefield-command-slot"></span>
            <span class="battlefield-command-slot"></span>
            <span class="battlefield-command-slot"></span>
            <span class="battlefield-command-slot"></span>
            <span class="battlefield-command-slot"></span>
          </div>
          <div class="battlefield-command-actions">
            <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-advance" aria-label="Bestaetigen" title="Bestaetigen" ${!advanceModeActive || advancePreviewUd <= 0 ? 'disabled' : ''}>
              <span aria-hidden="true">&#10003;</span>
            </button>
            <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="reset-test-units" aria-label="Zuruecksetzen" title="Zuruecksetzen" ${!advanceModeActive ? 'disabled' : ''}>
              <span aria-hidden="true">&#10005;</span>
            </button>
          </div>
        </aside>
        <div class="battlefield-center-column">
          <div class="battlefield-surface" data-battlefield-surface>
            <div class="battlefield-world" style="${worldStyle}" data-battlefield-world>
              ${showDeploymentOverlay ? renderDeploymentOverlay() : ''}
              ${showSectorOverlay ? renderSectorOverlay() : ''}
              ${advanceModeActive ? `<div class="battlefield-advance-reach" aria-hidden="true" style="${advanceReachStyle}"></div>` : ''}
              ${selectedUnit && advancePreviewUd > 0 ? `<div class="battlefield-unit-preview" aria-hidden="true" style="${previewUnitStyle}"></div>` : ''}
              <button
                class="battlefield-unit-token ${state.game.selectedUnitId === testUnit.id ? 'is-selected' : ''} ${advanceModeActive && state.game.selectedUnitId === testUnit.id ? 'is-advance-ready' : ''}"
                type="button"
                aria-pressed="${state.game.selectedUnitId === testUnit.id}"
                data-action="select-unit"
                data-unit-id="${testUnit.id}"
                title="Testeinheit auswaehlen"
                style="--token-color:${state.shell.settings.playerColor};${unitStyle}"
              ></button>
            </div>
          </div>
        </div>
        <aside class="battlefield-side-panel battlefield-side-panel-right">
          ${showScaleOverlay ? `
            <aside class="battlefield-minimap-card">
              <div class="battlefield-minimap" data-battlefield-minimap>
                <div class="battlefield-minimap-unit" style="${unitStyle}"></div>
                <div class="battlefield-minimap-viewport" data-battlefield-minimap-viewport></div>
              </div>
              <div class="battlefield-minimap-meta">
                <strong>1 UD = 4 cm</strong>
                <span>30 UD x 20 UD</span>
                <span>120 cm x 80 cm</span>
                <span>P0 Visual Guide: ${state.game.overlayMode}</span>
                <span>Overlay-Taste ${overlayHotkey}</span>
                <span>Marker ${formatLengthUd(testUnit.widthUd)} UD x ${formatLengthUd(testUnit.depthUd)} UD</span>
              </div>
            </aside>
          ` : ''}
          <div class="battlefield-placeholder-card battlefield-unit-info-card ${selectedUnit ? 'is-selected' : ''}">
            <strong>Ausgewaehlte Einheit</strong>
            ${selectedUnit ? `
              <span>ID: ${selectedUnit.id}</span>
              <span>Typ: Medium Infantry Teststand</span>
              <span>Front: ${selectedUnit.facing}</span>
              <span>Groesse: ${formatLengthUd(selectedUnit.widthUd)} UD x ${formatLengthUd(selectedUnit.depthUd)} UD</span>
            ` : `
              <span>Keine Einheit ausgewaehlt</span>
              <span>Klicke den Teststand auf dem Schlachtfeld an.</span>
            `}
          </div>
          <div class="battlefield-placeholder-card battlefield-placeholder-card-log">
            <strong>Kampfprotokoll / Wuerfel</strong>
            <span>spaeter</span>
          </div>
        </aside>
      </div>
    </section>
  `;
}