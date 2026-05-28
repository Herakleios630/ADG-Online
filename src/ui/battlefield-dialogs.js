import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_REACTION_REQUEST_TYPES,
} from '../engine/charge/index.js';
import {
  getShootingDeclarationPresentation,
  getShootingProcedurePresentation,
  getShootingResolutionPresentation,
} from '../state/p0-shooting.js';
import { SETUP_STEP_DEFINITIONS } from '../state/p0-state.js';
import { getAvailableCorpsForPlayer, ROUND_DIALOG_TYPES } from '../state/p0-round.js';
import { escapeHtml } from './battlefield-render-helpers.js';

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

function renderRollPips(value) {
  const activePips = new Set(getRollPipPattern(value));

  return `
    <span class="battlefield-command-roll-pips" aria-hidden="true">
      ${Array.from({ length: 9 }, (_, index) => `
        <span class="battlefield-command-roll-pip ${activePips.has(index) ? 'is-filled' : ''}"></span>
      `).join('')}
    </span>
  `;
}

function formatRoundCorpsLabel(corpsId) {
  const match = String(corpsId ?? '').match(/corps-(\d+)/i);
  return match ? `Corps ${match[1]}` : escapeHtml(String(corpsId ?? 'Corps'));
}

function getSetupGuideStepContent(state) {
  const stepId = state.game.setup.currentStepId;
  const currentIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === stepId);
  const stepNumber = currentIndex === -1 ? '?' : currentIndex + 1;
  const isReadyStep = stepId === 'ready';

  const base = {
    stepNumber,
    badge: 'Setup Flow',
    sourceStatus: 'needs-source-check',
    helper: 'Die Schrittfuehrung ist jetzt als End-UX-Hook eingebaut. Offizielle Legality-Checks bleiben bis zur Source-Pruefung klar markiert.',
    primaryAction: isReadyStep ? 'complete-setup' : 'setup-next',
    primaryLabel: isReadyStep ? 'In die Schlacht' : 'Weiter zum naechsten Schritt',
  };

  switch (stepId) {
    case 'format':
      return {
        ...base,
        title: 'Initiative, Rollen und Format vorbereiten',
        body: 'Langfristig sollen hier Initiativewurf, Angreifer/Verteidiger und Profilstart dialoggefuehrt starten. Aktuell dient dieser Schritt als gefuehrter Einstieg vor der Regions- und Terrainphase.',
        checklist: [
          'Initiative und Rollen sind fachlich noch placeholder.',
          'Spielprofil bleibt Standard-200 als aktueller Zielpfad.',
        ],
      };
    case 'region':
      return {
        ...base,
        title: 'Region und Pflichtgelaende festlegen',
        body: 'Hier sollte spaeter die Region bestimmt werden und daraus das Pflichtgelaende des Verteidigers folgen. Solange die Regionstabellen noch nicht source-verifiziert sind, bleibt dieser Schritt ein gefuehrter Platzhalter.',
        checklist: [
          'Verteidiger bestimmt spaeter Region und Pflichtgelaende.',
          'Exakte Terrainquoten bleiben bis Source-Check offen.',
        ],
      };
    case 'terrain':
      return {
        ...base,
        title: 'Terrain auswaehlen und platzieren',
        body: 'Nutze links die Terrain-Palette und platziere sichtbare Placeholder auf dem Feld. Dieser Schritt bildet jetzt bereits die spaetere Platzierungsreihenfolge als Untersequenz ab, auch wenn Quoten und einzelne Sonderregeln noch nicht final erzwungen werden.',
        checklist: [
          'Pflichtgelaende des Verteidigers zuerst.',
          'Danach restliches Terrain in der vorgesehenen Reihenfolge.',
        ],
        substeps: [
          '1. Verteidiger platziert Pflichtgelaende.',
          '2. Falls vorhanden: Fluss oder Kueste wird als frueher Sonderfall gesetzt.',
          '3. Verteidiger versucht gegebenenfalls ein Dorf zu platzieren.',
          '4. Beide Spieler platzieren restliches Gelaende abwechselnd.',
          '5. Die Strasse folgt zuletzt.',
        ],
      };
    case 'terrain-adjustment':
      return {
        ...base,
        title: 'Terrain anpassen',
        body: 'Dieser Schritt ist der Hook fuer die spaetere Adjustment-Sequenz mit Wurf, erlaubter Aktion und Bestätigung je Gelaendeteil. Aktuell kannst du Placeholder bewegen und die Diagnosen links zur Orientierung nutzen.',
        checklist: [
          'Angreifer passt zuerst an, dann Verteidiger.',
          'Offizielle Wurf- und Entfernen-Regeln sind noch nicht final erzwungen.',
        ],
      };
    case 'camps':
      return {
        ...base,
        title: 'Camps und Befestigungen setzen',
        body: 'Pflicht-Camps und weitere Setup-Objekte koennen bereits als echte Placeholder auf dem Tisch liegen. Spaeter wird dieser Schritt Defender-first und dann Attacker-first streng dialoggefuehrt.',
        checklist: [
          'Camp in eigener Zone und offenem Gelaende.',
          'Fortifications und Obstacles folgen spaeter mit offizieller Legalitaet.',
        ],
      };
    case 'battle-plan':
      return {
        ...base,
        title: 'Battle Plan verdeckt festlegen',
        body: 'Ordne die Corps links, mitte, rechts oder Flank March auf dem privaten Board zu. Dieser Schritt ist als Hotseat-sicherer Handover-Hook gedacht und bleibt owner-private.',
        checklist: [
          'Corps-Slots getrennt von echten Battlefield-Sektoren behandeln.',
          `Aktuelle Privacy-Ansicht: ${escapeHtml(state.game.setupViewMode)}.`,
        ],
      };
    case 'ambushes':
      return {
        ...base,
        title: 'Ambush Marker setzen',
        body: 'Lege Marker und private Inhalte an. Der sichtbare Marker bleibt oeffentlich, der Inhalt privat. So bleibt der Schritt spaeter fuer Hotseat und Multiplayer verwendbar.',
        checklist: [
          'Verteidiger zuerst, dann Angreifer.',
          'Exakte Markeranzahl und Terrainbedingungen bleiben source-blocked.',
        ],
      };
    case 'deployment':
      return {
        ...base,
        title: 'Armeen corpsweise deployen',
        body: 'Die sichtbaren Deployment-Placeholder sind jetzt der End-UX-Hook fuer spaetere corpsweise Aufstellung. Die aktuelle Version zeigt schon Footprints und Non-Overlap-Hooks, aber noch keine voll offizielle Deployment-Legalitaet.',
        checklist: [
          'Verteidiger beginnt, danach abwechselnd corpsweise.',
          'Schwere und leichte Truppen-Zonen folgen spaeter mit strenger Regelpruefung.',
        ],
      };
    case 'ready':
      return {
        ...base,
        title: 'Setup abschliessen und Spiel starten',
        body: 'Wenn Terrain, Battle Plan, Ambushes und Deployment vorbereitet sind, wechselst du mit diesem Schritt in die Schlacht. Direkt danach sollte der Rundenstart-Dialog erscheinen.',
        checklist: [
          'Dismounting, Flank March und Unreliable sollen spaeter als eigene End-Hooks folgen.',
          'Mit In die Schlacht endet das Setup und die Round-Flow-Dialoge uebernehmen.',
        ],
      };
    default:
      return {
        ...base,
        title: 'Setup-Schritt',
        body: 'Dieser Setup-Schritt hat bereits einen Guide-Hook, aber noch keine spezifische Schrittbeschreibung.',
        checklist: [],
        substeps: [],
      };
  }
}

export function renderSetupGuideDialog(state) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const content = getSetupGuideStepContent(state);
  const currentStepId = state.game.setup.currentStepId;
  const isLocked = state.game.setup.lockedStepIds.includes(currentStepId);
  const isDismissed = state.game.setup.dismissedGuideStepIds.includes(currentStepId);

  if (isDismissed) {
    return '';
  }

  return `
    <div class="battlefield-setup-guide-overlay" data-setup-guide-overlay>
      <div class="battlefield-setup-guide-dialog" role="dialog" aria-labelledby="setup-guide-title" aria-modal="false">
        <div class="battlefield-setup-guide-header">
          <span class="battlefield-round-dialog-tag">${content.badge}</span>
          <span class="battlefield-round-dialog-tag is-muted">Schritt ${content.stepNumber}</span>
        </div>
        <strong id="setup-guide-title">${escapeHtml(content.title)}</strong>
        <span class="muted-copy">${escapeHtml(content.body)}</span>
        <div class="battlefield-setup-guide-meta">
          <span><strong>Status:</strong> ${isLocked ? 'fixiert' : 'offen'}</span>
          <span><strong>Quelle:</strong> ${escapeHtml(content.sourceStatus)}</span>
        </div>
        ${content.checklist.length ? `
          <ul class="battlefield-setup-guide-list">
            ${content.checklist.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}
          </ul>
        ` : ''}
        ${content.substeps?.length ? `
          <div class="battlefield-setup-guide-substeps">
            <strong>Untersequenz</strong>
            <ol class="battlefield-setup-guide-sequence-list">
              ${content.substeps.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}
            </ol>
          </div>
        ` : ''}
        <span class="muted-copy">${escapeHtml(content.helper)}</span>
        <div class="battlefield-round-dialog-actions">
          <button class="shell-button battlefield-round-dialog-button" type="button" data-action="dismiss-setup-guide">OK</button>
        </div>
      </div>
    </div>
  `;
}

export function renderRoundDialog(state) {
  const round = state.game.round;
  const dialogType = round?.dialog?.type ?? null;

  if (!round || !dialogType) {
    return '';
  }

  if (dialogType === ROUND_DIALOG_TYPES.CORPS_SELECTION) {
    const availableCorps = getAvailableCorpsForPlayer(
      state.game.commandContext.corpsActivation,
      round.turnPlayerId,
    );

    return `
      <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay data-automation-role="active-modal" data-active-modal-id="round-corps-selection" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-automation-id='select-active-corps-corps-1']" data-automation-id="round-corps-selection-dialog">
        <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
          <div class="battlefield-round-dialog-header">
            <span class="battlefield-round-dialog-tag">Rundenfolge</span>
          </div>
          <strong id="round-dialog-title">Bitte erstes Corps fuer Aktivierung waehlen</strong>
          <span class="muted-copy">Waehle eines der noch nicht aktivierten Corps des aktuellen Spielers.</span>
          <div class="battlefield-round-dialog-corps-grid">
            ${availableCorps.map((entry, index) => `
              <button class="shell-button battlefield-round-dialog-button" type="button" data-action="select-active-corps" data-corps-id="${entry.corpsId}" data-testid="round-corps-${entry.corpsId}" data-automation-id="select-active-corps-${entry.corpsId}" aria-label="${formatRoundCorpsLabel(entry.corpsId)} auswaehlen" ${index === 0 ? 'autofocus' : ''}>
                ${formatRoundCorpsLabel(entry.corpsId)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  if (dialogType === ROUND_DIALOG_TYPES.NEXT_CORPS_PROMPT) {
    return `
      <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay data-automation-role="active-modal" data-active-modal-id="round-next-corps" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='confirm-next-corps']">
        <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
          <div class="battlefield-round-dialog-header">
            <span class="battlefield-round-dialog-tag">Rundenfolge</span>
          </div>
          <strong id="round-dialog-title">Naechstes Corps?</strong>
          <span class="muted-copy">Soll ein weiteres Corps dieses Spielers aktiviert werden?</span>
          <div class="battlefield-round-dialog-actions">
            <button class="shell-button battlefield-round-dialog-button" type="button" data-action="confirm-next-corps">Ja</button>
            <button class="ghost-button battlefield-round-dialog-button" type="button" data-action="skip-remaining-corps">Nein</button>
          </div>
        </div>
      </div>
    `;
  }

  if (dialogType === ROUND_DIALOG_TYPES.PHASE_ANNOUNCE) {
    if (round.roundPhase === 'shooting') {
      const shootingProcedure = getShootingProcedurePresentation(state.game);
      const overview = shootingProcedure.overview ?? {
        totalRangedUnits: 0,
        eligibleUnits: 0,
        blockedUnits: 0,
        sourceOpenUnits: 0,
        completedUnits: 0,
      };

      return `
        <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay data-automation-role="active-modal" data-active-modal-id="round-phase-announce" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='acknowledge-shooting-phase-procedure']" data-automation-id="shooting-phase-dialog">
          <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
            <div class="battlefield-round-dialog-header">
              <span class="battlefield-round-dialog-tag">Schiessphase</span>
            </div>
            <strong id="round-dialog-title">Gefuehrte Shooting Procedure</strong>
            <span class="muted-copy">Alle schuetzenden Einheiten der aktiven Seite werden reducer-owned nacheinander besucht. Gruen bedeutet Entscheidung abgeschlossen; Resultate bleiben bis zur simultanen Anwendung isoliert.</span>
            <ul class="battlefield-setup-guide-list" data-testid="shooting-phase-overview-list">
              <li><strong>Ranged units:</strong> ${overview.totalRangedUnits}</li>
              <li><strong>Can shoot now:</strong> ${overview.eligibleUnits}</li>
              <li><strong>Currently blocked:</strong> ${overview.blockedUnits}</li>
              <li><strong>Source-open:</strong> ${overview.sourceOpenUnits}</li>
            </ul>
            <div class="battlefield-round-dialog-actions">
              <button class="shell-button battlefield-round-dialog-button" type="button" data-action="acknowledge-shooting-phase-procedure">Procedure starten</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay data-automation-role="active-modal" data-active-modal-id="round-phase-announce" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='advance-round-phase']">
        <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
          <div class="battlefield-round-dialog-header">
            <span class="battlefield-round-dialog-tag">Rundenfolge</span>
          </div>
          <strong id="round-dialog-title">${escapeHtml(round.dialog.phaseLabel ?? 'Naechste Phase')}</strong>
          <span class="muted-copy">Diese Phase ist aktuell noch ein Platzhalter. Mit Weiter springst du direkt zur naechsten Phase.</span>
          <div class="battlefield-round-dialog-actions">
            <button class="shell-button battlefield-round-dialog-button" type="button" data-action="advance-round-phase">Weiter</button>
          </div>
        </div>
      </div>
    `;
  }

  if (dialogType === ROUND_DIALOG_TYPES.SHOOTING_SEQUENCE_HANDOFF) {
    const handoff = state.game.shooting?.handoff ?? { status: 'idle', kind: null, nextPlayerId: null };
    const isNextPlayerHandoff = handoff.kind === 'next-player';
    const title = isNextPlayerHandoff
      ? 'Alle Schuetzen haben geschossen'
      : 'Weiter mit Nahkampfphase';
    const copy = isNextPlayerHandoff
      ? 'Abgabe an naechsten Spieler?'
      : 'Die zweite Shooting-Sequenz ist abgeschlossen. Mit Bestaetigen wechselst du direkt in die Nahkampfphase.';

    return `
      <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay data-automation-role="active-modal" data-active-modal-id="shooting-sequence-handoff" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='confirm-shooting-sequence-handoff']" data-automation-id="shooting-sequence-handoff-dialog">
        <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
          <div class="battlefield-round-dialog-header">
            <span class="battlefield-round-dialog-tag">Schiessphase</span>
          </div>
          <strong id="round-dialog-title">${escapeHtml(title)}</strong>
          <span class="muted-copy">${escapeHtml(copy)}</span>
          <div class="battlefield-round-dialog-actions">
            <button class="shell-button battlefield-round-dialog-button" type="button" data-action="confirm-shooting-sequence-handoff">${isNextPlayerHandoff ? 'Ja' : 'Weiter'}</button>
            ${isNextPlayerHandoff ? '<button class="ghost-button battlefield-round-dialog-button" type="button" data-action="dismiss-shooting-sequence-handoff">Nein</button>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  const title = dialogType === ROUND_DIALOG_TYPES.PLAYER_SWITCH
    ? `${round.turnPlayerId === 'player-2' ? 'Spieler 2' : 'Spieler 1'} ist dran`
    : `Runde ${round.roundNumber}`;
  const copy = dialogType === ROUND_DIALOG_TYPES.PLAYER_SWITCH
    ? 'Der naechste Spieler beginnt jetzt mit seiner Corps-Aktivierung.'
    : 'Beginne die Runde und waehle danach das erste Corps fuer die Aktivierung.';

  return `
    <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay data-automation-role="active-modal" data-active-modal-id="round-begin" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-automation-id='round-begin']" data-automation-id="round-begin-dialog">
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">Rundenfolge</span>
        </div>
        <strong id="round-dialog-title">${escapeHtml(title)}</strong>
        <span class="muted-copy">${copy}</span>
        <div class="battlefield-round-dialog-actions">
          <button class="shell-button battlefield-round-dialog-button" type="button" data-action="round-begin" data-testid="round-begin-button" data-automation-id="round-begin" aria-label="Runde beginnen" autofocus>Beginnen</button>
        </div>
      </div>
    </div>
  `;
}

export function renderShootingResolutionDialog(state) {
  if (state.game.commandContext.currentPhaseId !== 'shooting' || !state.game.selectedUnitId) {
    return '';
  }

  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) ?? null;
  if (!selectedUnit) {
    return '';
  }

  const declarationPresentation = getShootingDeclarationPresentation({ gameState: state.game, selectedUnit });
  const resolutionPresentation = getShootingResolutionPresentation({ gameState: state.game, selectedUnit });
  if (!resolutionPresentation.resolutionDraftActive && !resolutionPresentation.hasDeclaredShotToResolve) {
    return '';
  }

  const targetLabel = declarationPresentation.selectedTargetCandidate?.targetUnit?.scenarioLabel
    ?? resolutionPresentation.whyItems.find((item) => item.label === 'Declared target')?.value
    ?? 'Unbekanntes Ziel';
  const supportingShooters = resolutionPresentation.supportingShooters ?? declarationPresentation.supportingShooters ?? [];
  const supportBonus = declarationPresentation.declaredShotGroup?.supportBonus ?? resolutionPresentation.declaredShotGroup?.supportBonus ?? 0;

  return `
    <div class="battlefield-round-dialog-overlay" data-shooting-resolution-dialog-overlay data-automation-role="active-modal" data-active-modal-id="shooting-resolution" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='confirm-shooting-resolution']" data-automation-id="shooting-resolution-dialog">
      <div class="battlefield-round-dialog battlefield-shooting-dialog" role="dialog" aria-modal="true" aria-labelledby="shooting-resolution-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">Schiessen</span>
          <span class="battlefield-round-dialog-tag is-muted">${escapeHtml(selectedUnit.scenarioLabel ?? selectedUnit.id)}</span>
        </div>
        <strong id="shooting-resolution-dialog-title">Schuss auf ${escapeHtml(targetLabel)}</strong>
        <span class="muted-copy">Trage hier Schutz und Wuerfel ein und bestaetige den Schuss mit OK.</span>
        <div class="battlefield-shooting-dialog-grid">
          <label class="battlefield-command-free-cp-toggle" data-testid="shooting-protection-input-row">
            <span>Verified protection</span>
            <select data-action="set-shooting-resolution-protection" aria-label="Verified protection value">
              <option value="" ${Number.isFinite(resolutionPresentation.resolutionDraft?.resolvedTargetProtectionValue) ? '' : 'selected'}>choose</option>
              ${[0, 1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}" ${resolutionPresentation.resolutionDraft?.resolvedTargetProtectionValue === value ? 'selected' : ''}>${value}</option>`).join('')}
            </select>
          </label>
          <label class="battlefield-command-free-cp-toggle" data-testid="shooting-shooter-die-input-row">
            <span>Shooter D6</span>
            <select data-action="set-shooting-resolution-shooter-die" aria-label="Shooter D6 value">
              ${[1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}" ${resolutionPresentation.resolutionDraft?.shooterDieRoll === value ? 'selected' : ''}>${value}</option>`).join('')}
            </select>
          </label>
          <label class="battlefield-command-free-cp-toggle" data-testid="shooting-target-die-input-row">
            <span>Target D6</span>
            <select data-action="set-shooting-resolution-target-die" aria-label="Target D6 value">
              ${[1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}" ${resolutionPresentation.resolutionDraft?.targetDieRoll === value ? 'selected' : ''}>${value}</option>`).join('')}
            </select>
          </label>
        </div>
        ${supportingShooters.length > 0 ? `
          <div class="battlefield-command-diagnostics battlefield-command-why-card" data-testid="shooting-dialog-support-card">
            <strong>Support Fire</strong>
            <ul>
              <li><strong>Bonus:</strong> +${supportBonus}</li>
              ${supportingShooters.map((supporter) => `
                <li><strong>${escapeHtml(supporter.label ?? supporter.id)}:</strong> ${escapeHtml(supporter.supportValueLabel)}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        ${resolutionPresentation.resolutionPreview?.result ? `
          <div class="battlefield-command-diagnostics battlefield-command-why-card" data-testid="shooting-resolution-preview-card">
            <strong>Preview</strong>
            <ul>
              <li><strong>Shooter:</strong> ${resolutionPresentation.resolutionPreview.result.shooterTotal}</li>
              <li><strong>Target:</strong> ${resolutionPresentation.resolutionPreview.result.targetTotal}</li>
              <li><strong>Cohesion:</strong> ${resolutionPresentation.resolutionPreview.result.cohesionLoss}</li>
            </ul>
          </div>
        ` : ''}
        <div class="battlefield-round-dialog-actions">
          <button class="shell-button battlefield-round-dialog-button" type="button" data-action="confirm-shooting-resolution" ${resolutionPresentation.canConfirmShootingResolution ? '' : 'disabled'}>OK</button>
        </div>
      </div>
    </div>
  `;
}

function getChargeReactionUnitLabel(state, unitId) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  return unit?.scenarioLabel ?? unit?.id ?? 'Unbekanntes Ziel';
}

function getPendingSecondaryChargeReactionRequest(preview) {
  return Array.isArray(preview?.reactionRequests)
    ? preview.reactionRequests.find((request, index) => index > 0 && request?.status === 'pending') ?? null
    : null;
}

function getPendingChargeReactionDialogConfig(preview) {
  if (preview?.status === CHARGE_PREVIEW_STATUSES.REACTION_PENDING) {
    return {
      request: preview.declarationSnapshot?.reactionRequests?.[0] ?? preview.reactionRequests?.[0] ?? null,
      resolveAction: 'resolve-charge-reaction',
      tag: 'Charge-Reaktion',
      titlePrefix: 'Reaktion des Ziels',
      bodyPrefix: 'reagiert jetzt auf die bestaetigte Charge-Deklaration.',
    };
  }

  const pendingSecondaryRequest = getPendingSecondaryChargeReactionRequest(preview);

  if (
    preview?.status === CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    && preview?.followThroughResolution?.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET
    && pendingSecondaryRequest
  ) {
    return {
      request: pendingSecondaryRequest,
      resolveAction: 'resolve-secondary-charge-reaction',
      tag: 'Sekundaerziel-Reaktion',
      titlePrefix: 'Reaktion des Sekundaerziels',
      bodyPrefix: 'reagiert jetzt auf den pausierten Follow-Through-Kontakt.',
    };
  }

  return null;
}

export function renderChargeReactionDialog(state) {
  const preview = state.game.chargePreview;
  const dialogConfig = getPendingChargeReactionDialogConfig(preview);
  if (!dialogConfig) {
    return '';
  }

  const request = dialogConfig.request;
  if (!request) {
    return '';
  }

  const targetLabel = escapeHtml(getChargeReactionUnitLabel(state, request.unitId));
  const diagnosticsText = escapeHtml((request.diagnostics ?? []).map((entry) => entry.text).filter(Boolean).join(' '));

  let title = dialogConfig.titlePrefix;
  let body = `${targetLabel} ${dialogConfig.bodyPrefix}`;
  let actions = '';

  if (request.type === CHARGE_REACTION_REQUEST_TYPES.NONE) {
    title = 'Keine Ausweichreaktion';
    body = `${targetLabel} hat in diesem P7-Schnitt keine Ausweichreaktion. Mit Weiter wird der No-Evade-Handoff festgehalten.`;
    actions = `<button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="no-evade">Weiter</button>`;
  } else if (request.type === CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE) {
    title = 'Ausweichen blockiert';
    body = `${targetLabel} darf nicht ausweichen. Mit Weiter wird der blockierte No-Evade-Handoff festgehalten.`;
    actions = `<button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="blocked-no-evade">Weiter</button>`;
  } else if (request.type === CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE) {
    title = 'Reaktion: Ausweichen moeglich';
    body = `${targetLabel} darf jetzt ausweichen oder stehenbleiben.`;
    actions = `
      <button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="evade">Ausweichen</button>
      <button class="ghost-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="no-evade">Nicht ausweichen</button>
    `;
  } else if (request.type === CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE) {
    title = 'Reaktion: Ausweichen erforderlich';
    body = `${targetLabel} muss in diesem P7-Schnitt ausweichen. Mit Bestaetigen wird der explizite P7A-Handoff gesetzt.`;
    actions = `<button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="forced-evade">Ausweichen bestaetigen</button>`;
  } else {
    title = 'Quellenpruefung erforderlich';
    body = `${targetLabel} braucht vor der Reaktionsaufloesung noch eine Quellenpruefung. Die Charge darf von hier nur abgebrochen werden.`;
    actions = '<button class="ghost-button battlefield-round-dialog-button" type="button" data-action="cancel-charge-preview">Charge abbrechen</button>';
  }

  return `
    <div class="battlefield-round-dialog-overlay" data-charge-reaction-dialog-overlay data-automation-role="active-modal" data-active-modal-id="charge-reaction" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='resolve-charge-reaction'], [data-action='resolve-secondary-charge-reaction']">
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="charge-reaction-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">${dialogConfig.tag}</span>
        </div>
        <strong id="charge-reaction-dialog-title">${escapeHtml(title)}</strong>
        <span class="muted-copy">${escapeHtml(body)}</span>
        ${diagnosticsText ? `<span class="muted-copy">${diagnosticsText}</span>` : ''}
        <div class="battlefield-round-dialog-actions">
          ${actions}
        </div>
      </div>
    </div>
  `;
}

export function renderChargeBranchDistanceDialog(state) {
  const preview = state.game.chargePreview;
  const claim = preview?.branchDistanceRoll?.claim ?? null;
  const result = preview?.branchDistanceRoll?.result ?? null;
  if (!claim || result) {
    return '';
  }

  const targetLabel = escapeHtml(getChargeReactionUnitLabel(state, claim.targetUnitId));
  const chargerLabel = escapeHtml(getChargeReactionUnitLabel(state, claim.chargingUnitId));
  const isAdjustedChargeDistance = claim.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE;
  const title = isAdjustedChargeDistance ? 'Adjusted Charge-Distanz bestimmen' : 'Ausweichdistanz bestimmen';
  const tag = isAdjustedChargeDistance ? 'P7A Charge-Folgezug' : 'P7A Evade-Distanz';
  const body = isAdjustedChargeDistance
    ? `${chargerLabel} folgt jetzt allen initialen Ausweichern mit der angepassten Charge. Waehle den deterministischen D6-Wert fuer die erste Follow-Through-Distanz.`
    : `${targetLabel} weicht der bestaetigten Charge von ${chargerLabel} aus. Waehle den deterministischen D6-Wert fuer die erste Evade-Distanz.`;

  return `
    <div class="battlefield-round-dialog-overlay" data-charge-branch-distance-dialog-overlay data-automation-role="active-modal" data-active-modal-id="charge-branch-distance" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='resolve-charge-branch-distance']">
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="charge-branch-distance-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">${tag}</span>
        </div>
        <strong id="charge-branch-distance-dialog-title">${title}</strong>
        <span class="muted-copy">${body}</span>
        <div class="battlefield-branch-roll-grid">
          ${Array.from({ length: 6 }, (_, index) => {
            const dieRoll = index + 1;
            return `
              <button
                class="battlefield-command-roll-die battlefield-command-roll-die-button"
                type="button"
                data-action="resolve-charge-branch-distance"
                data-die-roll="${dieRoll}"
                data-roll-value="${dieRoll}"
              >
                ${renderRollPips(dieRoll)}
                <span class="battlefield-command-roll-die-label">D6</span>
                <span class="battlefield-command-roll-die-value">${dieRoll}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderEvadeChoiceHandoffDialog(state) {
  const handoff = state.game.chargePreview?.evadeChoiceHandoff ?? null;
  if (handoff?.status !== 'pending') {
    return '';
  }

  const reactingPlayerLabel = handoff.reactingPlayerId === 'player-2' ? 'Spieler B' : 'Spieler A';
  const targetLabel = escapeHtml(handoff.targetLabel ?? handoff.reactingUnitId ?? 'das Ziel');
  const prompt = escapeHtml(handoff.prompt ?? `${reactingPlayerLabel} waehlt jetzt den Ausweichzug fuer ${targetLabel}.`);

  return `
    <div class="battlefield-round-dialog-overlay" data-evade-choice-handoff-dialog-overlay data-automation-role="active-modal" data-active-modal-id="evade-choice-handoff" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='acknowledge-evade-choice-handoff']">
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="evade-choice-handoff-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">Hotseat Handoff</span>
        </div>
        <strong id="evade-choice-handoff-dialog-title">${reactingPlayerLabel} uebernimmt den Ausweichzug</strong>
        <span class="muted-copy">${prompt}</span>
        <span class="muted-copy">Mit OK schaltest du auf ${reactingPlayerLabel} um und oeffnest erst dann die Ausweichwahl fuer ${targetLabel}.</span>
        <div class="battlefield-round-dialog-actions">
          <button class="shell-button battlefield-round-dialog-button" type="button" data-action="acknowledge-evade-choice-handoff">OK</button>
        </div>
      </div>
    </div>
  `;
}

export function renderEvadeInitialBranchChoiceDialog(state) {
  const chargePreview = state.game.chargePreview ?? null;
  const evadeMove = chargePreview?.evadeMove ?? null;
  const evadePlan = chargePreview?.evadePlan ?? null;
  if (
    chargePreview?.evadeChoiceHandoff?.status !== 'acknowledged'
    || evadeMove?.status !== 'choice-required'
    || evadePlan?.choiceKind !== 'initial-branch'
  ) {
    return '';
  }

  const candidates = Array.isArray(evadeMove?.avoidanceCandidates) ? evadeMove.avoidanceCandidates : [];
  if (candidates.length === 0) {
    return '';
  }

  return `
    <div class="battlefield-round-dialog-overlay" data-evade-initial-branch-dialog-overlay data-automation-role="active-modal" data-active-modal-id="evade-initial-branch" data-active-modal-priority="100" data-active-modal-next-action-selector="[data-action='select-evade-avoidance-choice']">
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="evade-initial-branch-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">Evade Branch</span>
        </div>
        <strong id="evade-initial-branch-dialog-title">Wheel oder aktuelle Orientierung?</strong>
        <span class="muted-copy">Der Charge-Winkel weicht von der aktuellen Evade-Orientierung ab. Waehle zuerst, ob das Ziel per Direction-Wheel an die Charge-Richtung anpasst oder den Ausweichzug in aktueller Orientierung beginnt.</span>
        <div class="battlefield-round-dialog-actions">
          ${candidates.map((candidate) => `
            <button class="${candidate.type === 'initial-branch-direction-wheel' ? 'shell-button' : 'ghost-button'} battlefield-round-dialog-button" type="button" data-action="select-evade-avoidance-choice" data-candidate-id="${candidate.id ?? ''}" data-side="${candidate.side ?? ''}" data-distance-ud="${candidate.distanceUd ?? candidate.spentDistanceUd ?? 0}">
              ${escapeHtml(candidate.type === 'initial-branch-direction-wheel' ? 'Wheel' : 'Aktuelle Orientierung')}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}