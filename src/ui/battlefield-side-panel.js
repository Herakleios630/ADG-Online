import { convertUdToCm } from '../data/battlefield-profiles.js';
import { getSetupViewModeLabel, SETUP_VIEW_MODES } from '../engine/visibility/setup-view.js';
import { BATTLE_PHASE_DEFINITIONS, COMMAND_PLAYER_IDS, SETUP_STEP_DEFINITIONS } from '../state/p0-state.js';

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatRotationDegrees(radians) {
  const degrees = (radians * 180) / Math.PI;
  return `${Math.round(degrees)} Grad`;
}

function renderCollapsibleCard({ title, summary, body, className = '', isOpen = true, persistId = '' }) {
  return `
    <details class="battlefield-collapsible-card ${className}" ${isOpen ? 'open' : ''} ${persistId ? `data-persist-id="${persistId}"` : ''}>
      <summary class="battlefield-collapsible-summary">
        <strong>${title}</strong>
        <span>${summary}</span>
      </summary>
      <div class="battlefield-collapsible-body">
        ${body}
      </div>
    </details>
  `;
}

function renderPhaseTracker(state) {
  const isSetupActive = state.game.setup.isActive;
  const currentSetupStepId = state.game.setup.currentStepId;
  const currentBattlePhaseId = state.game.phaseTracker.currentBattlePhaseId;
  const isReadyStep = currentSetupStepId === SETUP_STEP_DEFINITIONS[SETUP_STEP_DEFINITIONS.length - 1].id;

  return `
    <div class="battlefield-placeholder-card battlefield-phase-tracker-card ${isSetupActive ? 'is-setup-active' : ''}">
      <div class="battlefield-phase-tracker-header">
        <strong>Phasenliste</strong>
        <span>${isSetupActive ? 'Pre Battle' : 'Waehrend der Schlacht'}</span>
      </div>
      ${isSetupActive ? `
        <div class="battlefield-phase-tracker-section">
          <span class="battlefield-phase-tracker-title">Setup</span>
          <ol class="battlefield-phase-list" aria-label="Setup-Phasen">
            ${SETUP_STEP_DEFINITIONS.map((step) => {
              const isCurrent = currentSetupStepId === step.id;
              const isLocked = state.game.setup.lockedStepIds.includes(step.id);
              return `
                <li class="battlefield-phase-item ${isCurrent ? 'is-current' : ''} ${isLocked ? 'is-locked' : ''}">
                  <span class="battlefield-phase-item-label">${step.label}</span>
                  <span class="battlefield-phase-item-state">${isLocked ? 'fixiert' : isCurrent ? 'aktiv' : 'offen'}</span>
                </li>
              `;
            }).join('')}
          </ol>
        </div>
      ` : `
        <div class="battlefield-phase-tracker-section">
          <span class="battlefield-phase-tracker-title">Battle</span>
          <ol class="battlefield-phase-list battlefield-phase-list-battle" aria-label="Battle-Phasen">
            ${BATTLE_PHASE_DEFINITIONS.map((phase) => `
              <li class="battlefield-phase-item ${currentBattlePhaseId === phase.id ? 'is-current' : ''}">
                <span class="battlefield-phase-item-label">${phase.label}</span>
                <span class="battlefield-phase-item-state">${currentBattlePhaseId === phase.id ? 'aktiv' : 'spaeter'}</span>
              </li>
            `).join('')}
          </ol>
        </div>
      `}
      ${isSetupActive ? `
        <div class="battlefield-inline-actions battlefield-phase-tracker-actions">
          <button class="ghost-button" type="button" data-action="setup-previous" ${currentSetupStepId === SETUP_STEP_DEFINITIONS[0].id ? 'disabled' : ''}>Zurueck</button>
          <button class="ghost-button" type="button" data-action="setup-lock">Schritt fixieren</button>
          ${isReadyStep
            ? '<button class="shell-button is-active" type="button" data-action="complete-setup">In die Schlacht</button>'
            : '<button class="shell-button is-active" type="button" data-action="setup-next">Weiter</button>'}
        </div>
      ` : ''}
      <span class="muted-copy">P3-02 bildet nur Reihenfolge und Sperrstatus ab. Offizielle Setup-Validierung folgt spaeter pro Schritt.</span>
    </div>
  `;
}

function renderSetupViewModeCard(state) {
  const currentMode = state.game.setupViewMode;

  return renderCollapsibleCard({
    title: 'Privacy View',
    summary: getSetupViewModeLabel(currentMode),
    className: 'battlefield-placeholder-card battlefield-setup-view-card',
    isOpen: false,
    persistId: 'setup-view-card',
    body: `
      <span class="muted-copy">P3-10 rendert denselben kanonischen Setup-State als Viewer-Projektion statt private Daten direkt in jede Ansicht zu schreiben.</span>
      <div class="battlefield-setup-view-grid">
        ${Object.values(SETUP_VIEW_MODES).map((viewMode) => `
          <button
            class="shell-button battlefield-setup-view-button ${currentMode === viewMode ? 'is-active' : ''}"
            type="button"
            data-action="set-setup-view-mode"
            data-view-mode="${viewMode}"
          >${getSetupViewModeLabel(viewMode)}</button>
        `).join('')}
      </div>
    `,
  });
}

function renderCommandContextCard(state) {
  const { commandContext } = state.game;
  const activeCorpsCard = state.game.setup.battlePlan.corpsCards.find(
    (corpsCard) => corpsCard.id === commandContext.activeCorpsId,
  ) || null;
  const isBattleActive = !state.game.setup.isActive;
  const activePhaseLabel = BATTLE_PHASE_DEFINITIONS.find((phase) => phase.id === commandContext.currentPhaseId)?.label ?? commandContext.currentPhaseId;
  const activePlayerLabel = commandContext.activePlayerId === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'Player 2' : 'Player 1';

  return renderCollapsibleCard({
    title: 'Command Context',
    summary: `${activePhaseLabel} / ${activeCorpsCard?.label ?? 'kein Corps'}`,
    className: 'battlefield-placeholder-card battlefield-command-context-card',
    isOpen: true,
    persistId: 'command-context-card',
    body: `
      <span class="muted-copy">P4-03 legt nur das serialisierbare Command-Context-Skeleton an. Keine CP-, In-Command- oder Bewegungslegalitaet wird hier schon behauptet.</span>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Aktiver Spieler:</strong> ${activePlayerLabel}</span>
        <span><strong>Aktive Phase:</strong> ${activePhaseLabel}</span>
        <span><strong>Source:</strong> ${commandContext.sourceStatus}</span>
      </div>
      <div class="battlefield-setup-view-grid">
        <button
          class="shell-button battlefield-setup-view-button ${commandContext.activePlayerId === COMMAND_PLAYER_IDS.PLAYER_ONE ? 'is-active' : ''}"
          type="button"
          data-action="set-active-player"
          data-player-id="${COMMAND_PLAYER_IDS.PLAYER_ONE}"
          ${isBattleActive ? '' : 'disabled'}
        >Player 1</button>
        <button
          class="shell-button battlefield-setup-view-button ${commandContext.activePlayerId === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'is-active' : ''}"
          type="button"
          data-action="set-active-player"
          data-player-id="${COMMAND_PLAYER_IDS.PLAYER_TWO}"
          ${isBattleActive ? '' : 'disabled'}
        >Player 2</button>
      </div>
      <div class="battlefield-setup-view-grid">
        ${BATTLE_PHASE_DEFINITIONS.filter((phase) => phase.id === 'command' || phase.id === 'movement').map((phase) => `
          <button
            class="shell-button battlefield-setup-view-button ${commandContext.currentPhaseId === phase.id ? 'is-active' : ''}"
            type="button"
            data-action="set-active-battle-phase"
            data-phase-id="${phase.id}"
            ${isBattleActive ? '' : 'disabled'}
          >${phase.label}</button>
        `).join('')}
      </div>
      <div class="battlefield-battle-plan-corps-grid">
        ${state.game.setup.battlePlan.corpsCards.map((corpsCard) => `
          <button
            class="battlefield-battle-plan-corps-card ${commandContext.activeCorpsId === corpsCard.id ? 'is-selected' : ''}"
            type="button"
            data-action="select-active-corps"
            data-corps-id="${corpsCard.id}"
            ${isBattleActive ? '' : 'disabled'}
          >
            <strong>${corpsCard.label}</strong>
            <span>${corpsCard.assignmentFieldId ? `Battle Plan: ${corpsCard.assignmentFieldId}` : 'Noch keine Battle-Plan-Zuordnung'}</span>
          </button>
        `).join('')}
      </div>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Commander:</strong> ${commandContext.commander.label}</span>
        <span><strong>CP:</strong> ${commandContext.commandPoints.label}</span>
        <span><strong>In Command:</strong> ${commandContext.inCommand.label}</span>
      </div>
      ${isBattleActive ? '' : '<span class="muted-copy">Aktivierung bleibt bis nach dem Setup deaktiviert. Die Battle-Phase-Karte hier ist nur der P4-03-Hook.</span>'}
    `,
  });
}

export function renderBattlefieldRightPanel({
  state,
  battlefieldProfile,
  showScaleOverlay,
  unitStyle,
  isDeploymentSetupStep,
  overlayHotkey,
  testUnit,
  selectedUnit,
  selectedUnitRotationRadians,
  facingRelationship,
}) {
  return `
    <aside class="battlefield-side-panel battlefield-side-panel-right" data-panel-id="right">
      ${showScaleOverlay ? `
        ${renderCollapsibleCard({
          title: 'Minimap',
          summary: `${battlefieldProfile.widthUd} UD x ${battlefieldProfile.heightUd} UD`,
          className: 'battlefield-minimap-card',
          isOpen: true,
          persistId: 'minimap-card',
          body: `
            <div class="battlefield-minimap" data-battlefield-minimap>
              <div class="battlefield-minimap-unit" style="${unitStyle}"></div>
              <div class="battlefield-minimap-viewport" data-battlefield-minimap-viewport></div>
            </div>
            <div class="battlefield-minimap-meta">
              <strong>1 UD = ${battlefieldProfile.udInCm} cm</strong>
              <span>${battlefieldProfile.widthUd} UD x ${battlefieldProfile.heightUd} UD</span>
              <span>${battlefieldProfile.widthCm} cm x ${battlefieldProfile.heightCm} cm</span>
              <span>Setup Overlay: ${isDeploymentSetupStep ? `${state.game.overlayMode} + Deployment-Zonen` : state.game.overlayMode}</span>
              <span>Overlay-Taste ${overlayHotkey}</span>
              <span>Marker ${formatLengthUd(testUnit.widthUd)} UD x ${formatLengthUd(testUnit.depthUd)} UD / ${formatLengthUd(convertUdToCm(testUnit.widthUd, battlefieldProfile))} cm x ${formatLengthUd(convertUdToCm(testUnit.depthUd, battlefieldProfile))} cm</span>
            </div>
          `,
        })}
      ` : ''}
      ${renderSetupViewModeCard(state)}
      ${renderCommandContextCard(state)}
      ${renderPhaseTracker(state)}
      ${renderCollapsibleCard({
        title: 'Debug Status',
        summary: state.game.debug.isActive ? 'an' : 'aus',
        className: `battlefield-placeholder-card battlefield-debug-card ${state.game.debug.isActive ? 'is-selected' : ''}`,
        isOpen: false,
        persistId: 'debug-card',
        body: `
          <span>Debug-Modus: ${state.game.debug.isActive ? 'an (H)' : 'aus (H)'}</span>
          <span>Facing-Overlay: ${state.game.debug.showFacingGeometryOverlay ? 'an (F)' : 'aus (F)'}</span>
          <span>Referenz: ${selectedUnit ? selectedUnit.id : 'keine Einheit ausgewaehlt'}</span>
          ${state.game.debug.isActive ? `
            <span>Debug-Position: ${formatLengthUd(state.game.debug.unitPose.xUd)} / ${formatLengthUd(state.game.debug.unitPose.yUd)} UD</span>
            <span>Debug-Rotation: ${formatRotationDegrees(state.game.debug.unitPose.rotationRadians)}</span>
            <span>Referenz-Rotation: ${formatRotationDegrees(selectedUnitRotationRadians)}</span>
            <span class="muted-copy">Ctrl + Mausrad dreht Debug, Ctrl + Shift + Mausrad dreht die Referenz.</span>
            ${facingRelationship ? `<span>Beziehung: ${facingRelationship.primaryLabel === 'front' ? 'Front' : facingRelationship.primaryLabel === 'flank' ? 'Flanke' : facingRelationship.primaryLabel === 'leftFlank' ? 'Linke Flanke' : facingRelationship.primaryLabel === 'rightFlank' ? 'Rechte Flanke' : facingRelationship.primaryLabel === 'rear' ? 'Ruecken' : facingRelationship.primaryLabel === 'boundary' ? 'Grenze' : facingRelationship.primaryLabel === 'ambiguous' ? 'Mehrdeutig' : 'Unklar'}</span>` : ''}
          ` : ''}
          <span class="muted-copy">Facing-Linien und Label sind reine Geometrie-Ausgaben, keine offiziellen Regelurteile.</span>
        `,
      })}
      ${renderCollapsibleCard({
        title: 'Ausgewaehlte Einheit',
        summary: selectedUnit ? selectedUnit.id : 'keine Auswahl',
        className: `battlefield-placeholder-card battlefield-unit-info-card ${selectedUnit ? 'is-selected' : ''}`,
        isOpen: false,
        persistId: 'selected-unit-card',
        body: selectedUnit ? `
          <span>ID: ${selectedUnit.id}</span>
          <span>Typ: Medium Infantry Teststand</span>
          <span>Front: ${selectedUnit.facing}</span>
          <span>Groesse: ${formatLengthUd(selectedUnit.widthUd)} UD x ${formatLengthUd(selectedUnit.depthUd)} UD</span>
        ` : `
          <span>Keine Einheit ausgewaehlt</span>
          <span>Klicke den Teststand auf dem Schlachtfeld an.</span>
        `,
      })}
      ${renderCollapsibleCard({
        title: 'Kampfprotokoll / Wuerfel',
        summary: 'spaeter',
        className: 'battlefield-placeholder-card battlefield-placeholder-card-log',
        isOpen: false,
        persistId: 'battle-log-card',
        body: '<span>spaeter</span>',
      })}
    </aside>
  `;
}