import { convertUdToCm } from '../data/battlefield-profiles.js';
import { getSetupViewModeLabel, SETUP_VIEW_MODES } from '../engine/visibility/setup-view.js';
import { COMMAND_CP_REASON_CODES } from '../engine/command/index.js';
import { BATTLE_PHASE_DEFINITIONS, COMMAND_PLAYER_IDS, SETUP_STEP_DEFINITIONS } from '../state/p0-state.js';
import { getCurrentOrderCommandPointCostBreakdown } from '../state/p0-movement.js';

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatRotationDegrees(radians) {
  const degrees = (radians * 180) / Math.PI;
  return `${Math.round(degrees)} Grad`;
}

function getCommanderQualityCpValue(quality) {
  const values = {
    ordinary: 0,
    competent: 1,
    brilliant: 2,
  };

  return values[String(quality ?? '').toLowerCase()] ?? null;
}

function getRollPipPattern(value) {
  const patterns = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return patterns[value] ?? [];
}

function renderActivationRollPips(lastRoll) {
  const activePips = new Set(getRollPipPattern(lastRoll));

  return `
    <span class="battlefield-command-roll-pips" aria-hidden="true">
      ${Array.from({ length: 9 }, (_, index) => `
        <span class="battlefield-command-roll-pip ${activePips.has(index) ? 'is-filled' : ''}"></span>
      `).join('')}
    </span>
  `;
}

function renderCommandPointBalance(commandPoints) {
  const ledgerEntries = Array.isArray(commandPoints?.ledger) ? commandPoints.ledger : [];
  const available = Number.isInteger(commandPoints?.available) ? commandPoints.available : null;
  const spent = Number.isInteger(commandPoints?.spent) ? commandPoints.spent : 0;
  const free = Number.isInteger(commandPoints?.free) ? commandPoints.free : 0;
  if (available == null) {
    return '';
  }

  const rolledCp = Number(ledgerEntries.find((entry) => entry.reasonCode === COMMAND_CP_REASON_CODES.ACTIVATION_ROLL)?.amount ?? 0);
  const startingFreeCp = Number(ledgerEntries.find((entry) => (
    entry.reasonCode === COMMAND_CP_REASON_CODES.FREE_CP
    && entry.amount > 0
    && !entry.unitId
  ))?.amount ?? 0);
  const activationTotal = Math.max(0, rolledCp + startingFreeCp);
  const normalAvailable = Math.max(0, available - free);
  const freeSpent = Math.max(0, startingFreeCp - free);
  const balanceMax = Math.max(activationTotal, available + spent, 1);
  const rows = [
    { label: 'Aktivierung', value: activationTotal, className: 'is-activation' },
    { label: 'Normal verfuegbar', value: normalAvailable, className: 'is-available' },
    { label: 'Free verfuegbar', value: free, className: 'is-free' },
    { label: 'Verbraucht', value: spent + freeSpent, className: 'is-spent' },
  ];

  return `
    <div class="battlefield-command-balance">
      <strong>CP Bilanz</strong>
      <div class="battlefield-command-balance-grid">
        ${rows.map((row) => `
          <div class="battlefield-command-balance-row">
            <span class="battlefield-command-balance-label">${row.label}</span>
            <span class="battlefield-command-balance-track">
              <span class="battlefield-command-balance-fill ${row.className}" style="width:${(row.value / balanceMax) * 100}%"></span>
            </span>
            <span class="battlefield-command-balance-value">${row.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderActivationRollPreview(commandPoints, commander) {
  const lastRoll = Number.isInteger(commandPoints?.lastRoll) ? commandPoints.lastRoll : null;
  if (lastRoll == null) {
    return '';
  }

  const ledgerEntries = Array.isArray(commandPoints?.ledger) ? commandPoints.ledger : [];
  const rolledCpEntry = ledgerEntries.find((entry) => entry.reasonCode === COMMAND_CP_REASON_CODES.ACTIVATION_ROLL) || null;
  const freeCpEntry = ledgerEntries.find((entry) => (
    entry.reasonCode === COMMAND_CP_REASON_CODES.FREE_CP
    && entry.amount > 0
    && !entry.unitId
  )) || null;
  const commanderValue = getCommanderQualityCpValue(commander?.quality);
  const formulaText = rolledCpEntry && commanderValue != null
    ? `(${lastRoll} Wurf + ${commanderValue} Generalwert) / 2 = ${rolledCpEntry.amount}${((lastRoll + commanderValue) / 2) % 1 !== 0 ? ' (aufgerundet)' : ''}`
    : null;

  return `
    <div class="battlefield-command-roll-card">
      <strong>Aktivierungswurf</strong>
      <div class="battlefield-command-roll-grid">
        <div class="battlefield-command-roll-die" data-roll-value="${lastRoll}">
          ${renderActivationRollPips(lastRoll)}
          <span class="battlefield-command-roll-die-label">D6</span>
          <span class="battlefield-command-roll-die-value">${lastRoll}</span>
        </div>
        <div class="battlefield-command-roll-breakdown">
          <span><strong>Wurf-CP:</strong> ${rolledCpEntry ? rolledCpEntry.amount : 'offen'}</span>
          <span><strong>Free-CP Start:</strong> ${freeCpEntry ? freeCpEntry.amount : 'offen'}</span>
          ${formulaText ? `<span><strong>Formel:</strong> ${formulaText}</span>` : ''}
          <span><strong>Quelle:</strong> ${commandPoints.sourceStatus}</span>
        </div>
      </div>
    </div>
  `;
}

function renderCommandPointDetails(commandPoints, commander) {
  const ledgerEntries = Array.isArray(commandPoints?.ledger) ? commandPoints.ledger : [];
  const recentEntries = ledgerEntries.slice(-4).reverse();
  const available = Number.isInteger(commandPoints?.available) ? commandPoints.available : null;
  const spent = Number.isInteger(commandPoints?.spent) ? commandPoints.spent : 0;
  const free = Number.isInteger(commandPoints?.free) ? commandPoints.free : 0;
  const lastRoll = Number.isInteger(commandPoints?.lastRoll) ? commandPoints.lastRoll : null;
  const freeCapacity = available == null ? null : 1;
  const normalAvailable = available == null ? null : Math.max(0, available - free);
  const freeSpent = freeCapacity == null ? null : Math.max(0, freeCapacity - free);

  return `
    ${renderActivationRollPreview(commandPoints, commander)}
    ${renderCommandPointBalance(commandPoints)}
    <div class="battlefield-battle-plan-owner-meta">
      <span><strong>CP verfuegbar gesamt:</strong> ${available == null ? 'offen' : available}</span>
      <span><strong>CP verfuegbar normal/free:</strong> ${normalAvailable == null ? 'offen / offen' : `${normalAvailable} / ${free}`}</span>
      <span><strong>CP verbraucht normal/free:</strong> ${freeSpent == null ? `${spent} / offen` : `${spent} / ${freeSpent}`}</span>
      <span><strong>Letzter Wurf:</strong> ${lastRoll == null ? 'offen' : lastRoll}</span>
    </div>
    ${recentEntries.length ? `
      <div class="battlefield-command-diagnostics">
        <strong>CP Ledger</strong>
        <ul>
          ${recentEntries.map((entry) => `
            <li>
              <strong>${entry.reasonCode}:</strong> ${entry.amount > 0 ? '+' : ''}${entry.amount} CP${entry.unitId ? ` (${entry.unitId})` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : '<span class="muted-copy">Noch keine CP-Ledger-Eintraege fuer das aktive Corps.</span>'}
  `;
}

function renderCurrentOrderDiagnostics(movementState) {
  const diagnostics = Array.isArray(movementState?.validationSnapshot?.diagnostics)
    ? movementState.validationSnapshot.diagnostics.filter((entry) => (
      entry.id === 'command-legality'
      || entry.id === 'commander-engaged'
      || entry.id === 'command-point-cost'
      || entry.id === 'difficult-manoeuvre'
    ))
    : [];

  const visibleDiagnostics = diagnostics.filter((entry) => entry.status !== 'verified' || entry.id === 'command-point-cost');
  if (!visibleDiagnostics.length) {
    return '';
  }

  return `
    <div class="battlefield-command-diagnostics">
      <strong>Order Diagnostics</strong>
      <ul>
        ${visibleDiagnostics.map((entry) => `
          <li>
            <strong>${entry.label}:</strong> ${entry.status} - ${entry.text}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderCurrentOrderCostPreview(gameState) {
  const movementState = gameState?.movement;
  if (
    !movementState?.selectedCommandId
    || movementState.preview?.status !== 'accepted'
    || !Array.isArray(movementState.preview?.segments)
    || movementState.preview.segments.length === 0
  ) {
    return '';
  }

  const costBreakdown = getCurrentOrderCommandPointCostBreakdown(gameState, movementState);
  if (!costBreakdown) {
    return '';
  }

  return `
    <div class="battlefield-command-diagnostics">
      <strong>Aktueller Befehl</strong>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Gesamtkosten:</strong> ${costBreakdown.totalCost} CP</span>
        <span><strong>Freier CP:</strong> ${costBreakdown.usesFreeCommandPoint ? 'ja' : 'nein'}</span>
      </div>
      <ul>
        ${(costBreakdown.components ?? []).map((entry) => `
          <li>
            <strong>${entry.reasonCode}:</strong> ${entry.amount > 0 ? '+' : ''}${entry.amount} CP
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function renderCommanderProfile(commandContext) {
  const quality = commandContext?.commander?.quality ?? null;
  const rangeUd = Number.isFinite(commandContext?.commander?.rangeUd) ? commandContext.commander.rangeUd : null;
  if (!quality && rangeUd == null) {
    return '';
  }

  return `
    <div class="battlefield-command-commander-profile">
      <strong>Kommandeurprofil</strong>
      <div class="battlefield-command-commander-profile-grid">
        <span><strong>Qualitaet:</strong> ${quality ?? 'offen'}</span>
        <span><strong>Reichweite:</strong> ${rangeUd == null ? 'offen' : `${rangeUd} UD / ${convertUdToCm(rangeUd)} cm`}</span>
      </div>
    </div>
  `;
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
  const corpsActivation = commandContext.corpsActivation?.corps ?? [];
  const notYetActivatedCount = corpsActivation.filter((entry) => entry.status === 'not-yet-activated').length;
  const activeCount = corpsActivation.filter((entry) => entry.status === 'active').length;
  const spentCount = corpsActivation.filter((entry) => entry.status === 'spent').length;

  return renderCollapsibleCard({
    title: 'Command Context',
    summary: `${activePhaseLabel} / ${activeCorpsCard?.label ?? 'kein Corps'}`,
    className: 'battlefield-placeholder-card battlefield-command-context-card',
    isOpen: true,
    persistId: 'command-context-card',
    body: `
      <span class="muted-copy">Der Command Context zeigt jetzt aktives Corps, aufgeloesten Kommandeur und einen ersten In-Command-Snapshot fuer die selektierte Einheit. CP-Auswuerfelung und echte Bewegungs-Kostenpruefung bleiben noch P6-Folgearbeit.</span>
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
      ${renderCommanderProfile(commandContext)}
      ${renderCommandPointDetails(commandContext.commandPoints, commandContext.commander)}
      ${renderCurrentOrderCostPreview(state.game)}
      ${renderCurrentOrderDiagnostics(state.game.movement)}
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Corps offen:</strong> ${notYetActivatedCount}</span>
        <span><strong>Corps aktiv:</strong> ${activeCount}</span>
        <span><strong>Corps verbraucht:</strong> ${spentCount}</span>
      </div>
      <div class="battlefield-battle-plan-corps-grid">
        ${corpsActivation.map((entry) => `
          <div class="battlefield-battle-plan-corps-card ${entry.status === 'active' ? 'is-selected' : ''}" data-corps-activation-status="${entry.status}">
            <strong>${entry.label}</strong>
            <span>Status: ${entry.status}</span>
          </div>
        `).join('')}
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