import { addVectors, getAxesFromRotation, scaleVector } from '../engine/geometry/index.js';
import {
  getCommittedMovementPreviewSegments,
  getLastCommittedMovementPreviewSegment,
  getMovementPreviewEndPose,
  getMovementPreviewResolvedDistanceUd,
  getMovementPreviewSpentBudgetUd,
} from '../engine/movement/index.js';
import { evaluateMovementBudgetSubset, getUnitMovementBudgetUd } from '../engine/movement/budget.js';
import { getWheelDistanceUdForAngleRadians } from '../engine/movement/wheel.js';
import {
  CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES,
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_MOVEMENT_CONTINUATION_DECISIONS,
  EVADE_MOVE_RESOLUTION_STATUSES,
} from '../engine/charge/index.js';
import { getRemainingAdvanceBudgetUd } from '../state/p0-advance.js';
import { isEvadeMoveReadyForAdjustedCharge } from '../state/p0-evade-move-state-helpers.js';
import { canUseFreeCommandPointForCurrentOrder, doesMovementPreviewContainCommand, getSlideQualifiedMovementDistanceUd } from '../state/p0-movement.js';
import { getMeleeProcedurePresentation } from './melee-v2-adapter.js';
import {
  getShootingDeclarationPresentation,
  getShootingProcedurePresentation,
  getShootingResolutionPresentation,
} from '../state/p0-shooting.js';
import { ROUND_DIALOG_TYPES } from '../state/p0-round.js';
import { hasUnitUsedSlideThisMovementPhase, isSlideAvailableForUnit } from '../state/p0-slide.js';
import { resolveEffectiveCommandMenuBranch } from '../state/p0-state-ui-helpers.js';
import {
  canConfirmChargePreviewDirection,
  canConfirmChargeConformation,
  canStartChargePreview,
  getChargePreviewUnavailableReason,
} from '../state/p0-state.js';

function chargePreviewRequiresContactSideSelection(chargePreview) {
  return chargePreview?.contactEvents?.[0]?.classification?.type === 'rear-or-flank'
    && !chargePreview?.selectedContactSide?.side;
}

function getChargeStatusLabel(status) {
  switch (status) {
    case 'targeting':
      return 'Zielwahl';
    case 'manoeuvre-selecting':
      return 'Startmanoever';
    case 'ready':
      return 'Bereit zur Richtungsbestaetigung';
    case 'reaction-pending':
      return 'Reaktion offen';
    case 'no-evade-handoff':
      return 'No-Evade-Handoff';
    case 'evade-required':
      return 'Evade-Handoff';
    case 'blocked':
      return 'Blockiert';
    case 'rejected':
      return 'Verworfen';
    default:
      return status ?? 'Unbekannt';
  }
}

function getChargeReactionTypeLabel(type) {
  switch (type) {
    case 'none':
      return 'Keine Ausweichreaktion';
    case 'may-evade':
      return 'Darf ausweichen';
    case 'must-evade':
      return 'Muss ausweichen';
    case 'blocked-evade':
      return 'Ausweichen blockiert';
    case 'needs-source-check':
      return 'Quellenpruefung noetig';
    default:
      return type ?? 'Keine';
  }
}

function getChargeHandoffLabel(handoffStatus) {
  switch (handoffStatus) {
    case 'no-evade':
      return 'Weiter ohne Ausweichen';
    case 'blocked-no-evade':
      return 'Blockiertes Ausweichen, weiter ohne Evade';
    case 'evade-required':
      return 'P7A Ausweichen erforderlich';
    default:
      return null;
  }
}

function getUnitScenarioLabel(state, unitId) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) ?? null;
  return unit?.scenarioLabel ?? unit?.id ?? unitId ?? 'unbekannt';
}

function getChargeFollowThroughResolutionLabel(state, chargePreview) {
  const resolution = chargePreview?.followThroughResolution ?? null;
  if (!resolution || resolution.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.NONE) {
    return null;
  }

  if (resolution.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.CAUGHT_EVADER) {
    const postureLabel = resolution.combatPosture === CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES.REAR_ATTACK
      ? 'rear attack'
      : 'caught';
    return `Evader caught (${postureLabel}): ${getUnitScenarioLabel(state, resolution.defenderId)}`;
  }

  if (resolution.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET) {
    return `Secondary target pause: ${getUnitScenarioLabel(state, resolution.defenderId)}`;
  }

  if (resolution.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.FRIENDLY_BLOCKER) {
    return `Friendly blocker: ${getUnitScenarioLabel(state, resolution.defenderId)}`;
  }

  return resolution.status;
}

function getSecondaryChargeReactionLabel(state, chargePreview) {
  const secondaryRequest = Array.isArray(chargePreview?.reactionRequests)
    ? chargePreview.reactionRequests.find((request, index) => index > 0 && request?.status === 'pending') ?? null
    : null;

  if (!secondaryRequest || secondaryRequest.status !== 'pending') {
    return null;
  }

  return `${getUnitScenarioLabel(state, secondaryRequest.unitId)} (${getChargeReactionTypeLabel(secondaryRequest.type)})`;
}

function getSecondaryChargeReactionDecisionLabel(state, chargePreview) {
  const decision = chargePreview?.secondaryReactionDecision ?? null;
  if (!decision?.unitId || !decision?.type) {
    return null;
  }

  return `${getUnitScenarioLabel(state, decision.unitId)} (${decision.type})`;
}

function getChargeContactLabel(contactEvent, selectedContactSide) {
  const classification = contactEvent?.classification ?? null;
  if (!classification?.type) {
    return 'Noch kein Erstkontakt';
  }

  if (classification.type === 'rear-or-flank') {
    return selectedContactSide
      ? `Rear-or-flank, gewaehlt: ${selectedContactSide}`
      : 'Rear-or-flank, Seitenwahl offen';
  }

  return classification.type;
}

function getConformationPlanStatusLabel(conformationPlan) {
  switch (conformationPlan?.status) {
    case 'ready':
      return 'Bereit';
    case 'choice-required':
      return 'Auswahl offen';
    case 'blocked':
      return 'Blockiert';
    case 'source-open':
      return 'Quellenoffen';
    case 'applied':
      return 'Angewendet';
    case 'idle':
    default:
      return 'Keine Vorschau';
  }
}

function getConformationCandidateStatusLabel(candidate) {
  switch (candidate?.status) {
    case 'complete':
      return 'Vollstaendig';
    case 'incomplete':
      return 'Unvollstaendig';
    case 'optional':
      return 'Optional';
    case 'blocked':
      return 'Blockiert';
    case 'needs-source-check':
      return 'Quellenpruefung';
    default:
      return candidate?.status ?? 'Keine';
  }
}

function getSourceStatusLabel(sourceStatus) {
  switch (sourceStatus) {
    case 'verified':
      return 'verifiziert';
    case 'errata-check':
      return 'Errata-Check';
    case 'needs-source-check':
      return 'Quellenpruefung';
    default:
      return sourceStatus ?? 'offen';
  }
}

function getShootingStatusLabel(status) {
  switch (status) {
    case 'targeting':
      return 'Zielwahl';
    case 'ready':
      return 'Bereit';
    case 'blocked':
      return 'Blockiert';
    case 'source-open':
      return 'Quellenoffen';
    case 'idle':
    default:
      return 'Inaktiv';
  }
}

function getShootingResolutionStatusLabel(status) {
  switch (status) {
    case 'resolved':
      return 'Bereit';
    case 'source-open':
      return 'Quellenoffen';
    case 'invalid':
      return 'Ungueltig';
    default:
      return status ?? 'Offen';
  }
}

function getPreferredConformationCandidate(conformationPlan) {
  if (!conformationPlan) {
    return null;
  }

  return (conformationPlan.candidates ?? []).find((candidate) => candidate.id === conformationPlan.selectedCandidateId)
    ?? conformationPlan.candidates?.[0]
    ?? null;
}

function getConformationShiftSummary(state, shiftingPlan) {
  if (!shiftingPlan || shiftingPlan.status === 'none') {
    return null;
  }

  if (shiftingPlan.status === 'ready') {
    const steps = Array.isArray(shiftingPlan.steps) ? shiftingPlan.steps : [];
    if (steps.length === 0) {
      return 'Shift vorbereitet';
    }

    return steps.map((step) => {
      const label = getUnitScenarioLabel(state, step.unitId);
      return `${label}: ${step.direction ?? 'unknown'} ${formatLengthUd(Number(step.distanceUd ?? 0))} UD`;
    }).join('; ');
  }

  return shiftingPlan.diagnostics?.[0]?.message ?? shiftingPlan.status;
}

function getChargeStartLabel(startManoeuvre) {
  if (!startManoeuvre) {
    return 'Noch nicht festgelegt';
  }

  return startManoeuvre.label ?? startManoeuvre.type ?? 'Unbekannt';
}

function getChargePathLabel(pathSegments, contactEvent) {
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    return 'Noch kein Pfad';
  }

  return contactEvent
    ? `${pathSegments.length} Segment(e) bis Erstkontakt`
    : `${pathSegments.length} Segment(e), noch ohne Erstkontakt`;
}

function getPrimaryChargeTargetUnitId(chargePreview) {
  return chargePreview?.reactionDecision?.declarationSnapshot?.targetUnitId
    ?? chargePreview?.intent?.targetUnitId
    ?? null;
}

function buildChargeWhyItems({ state, chargePreview }) {
  if (!chargePreview?.intent?.unitId) {
    return [];
  }

  const snapshot = chargePreview.declarationSnapshot ?? null;
  const referenceTargetUnitId = snapshot?.targetUnitId ?? chargePreview.intent?.targetUnitId ?? null;
  const referenceTarget = state.game.units.find((unit) => unit.id === referenceTargetUnitId) || null;
  const referenceStart = snapshot?.startManoeuvre ?? chargePreview.intent?.startManoeuvre ?? null;
  const referencePath = snapshot?.pathSegments ?? chargePreview.pathSegments ?? [];
  const referenceContact = snapshot?.contactEvent ?? chargePreview.contactEvents?.[0] ?? null;
  const referenceReaction = snapshot?.reactionRequests?.[0] ?? chargePreview.reactionRequests?.[0] ?? null;
  const selectedContactSide = snapshot?.selectedContactSide?.side ?? chargePreview.selectedContactSide?.side ?? null;
  const handoffLabel = getChargeHandoffLabel(chargePreview.handoffStatus);
  const followThroughLabel = getChargeFollowThroughResolutionLabel(state, chargePreview);
  const secondaryReactionLabel = getSecondaryChargeReactionLabel(state, chargePreview);
  const secondaryReactionDecisionLabel = getSecondaryChargeReactionDecisionLabel(state, chargePreview);
  const conformationPlan = chargePreview?.conformationPlan ?? null;
  const selectedConformationCandidate = getPreferredConformationCandidate(conformationPlan);
  const shiftingPlan = conformationPlan?.shiftingPlan ?? null;
  const conformationDiagnostic = conformationPlan?.diagnostics?.[0] ?? selectedConformationCandidate?.diagnostics?.[0] ?? null;
  const shiftingLocks = Array.isArray(shiftingPlan?.lockEffects)
    ? shiftingPlan.lockEffects.map((effect) => {
      const unitLabel = getUnitScenarioLabel(state, effect.unitId);
      return effect.lightTroopsException
        ? `${unitLabel}: Light troops exception`
        : effect.movedOrRalliedLock
          ? `${unitLabel}: move/rally lock`
          : `${unitLabel}: no lock`;
    }).join('; ')
    : null;
  const shiftingSummary = getConformationShiftSummary(state, shiftingPlan);

  return [
    { label: 'Status', value: getChargeStatusLabel(chargePreview.status) },
    { label: 'Ziel', value: referenceTarget?.scenarioLabel ?? referenceTarget?.id ?? referenceTargetUnitId ?? 'Noch keines' },
    { label: 'Start', value: getChargeStartLabel(referenceStart) },
    { label: 'Pfad', value: getChargePathLabel(referencePath, referenceContact) },
    { label: 'Kontakt', value: getChargeContactLabel(referenceContact, selectedContactSide) },
    { label: 'Reaktion', value: getChargeReactionTypeLabel(referenceReaction?.type ?? null) },
    conformationPlan?.status && conformationPlan.status !== 'idle'
      ? { label: 'Konformation', value: getConformationPlanStatusLabel(conformationPlan) }
      : null,
    selectedConformationCandidate
      ? {
        label: 'Konform-Ziel',
        value: `${getConformationCandidateStatusLabel(selectedConformationCandidate)}${selectedConformationCandidate.contactSide ? ` (${selectedConformationCandidate.contactSide})` : ''}`,
      }
      : null,
    conformationPlan?.sourceStatus || selectedConformationCandidate?.sourceStatus
      ? { label: 'Konform-Quelle', value: getSourceStatusLabel(selectedConformationCandidate?.sourceStatus ?? conformationPlan?.sourceStatus) }
      : null,
    shiftingSummary
      ? { label: 'Shift', value: shiftingSummary }
      : null,
    shiftingLocks
      ? { label: 'Shift-Folgen', value: shiftingLocks }
      : null,
    conformationDiagnostic?.message
      ? { label: 'Konform-Hinweis', value: conformationDiagnostic.message }
      : null,
    followThroughLabel ? { label: 'Follow-through', value: followThroughLabel } : null,
    secondaryReactionLabel ? { label: 'Next reaction', value: secondaryReactionLabel } : null,
    secondaryReactionDecisionLabel ? { label: 'Recorded reaction', value: secondaryReactionDecisionLabel } : null,
    handoffLabel ? { label: 'Handoff', value: handoffLabel } : null,
  ].filter(Boolean);
}

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderLeanShootingProcedurePanel({
  selectedUnit,
  helperCopy,
  diagnostics,
  shootingProcedureStatus,
  shootingProcedureOverview,
  shootingSequenceHandoffPending,
  shootingSequenceHandoffKind,
  canOpenShootingSequenceHandoff,
  canPassActiveShooter,
  shootingPreviewActive,
  canConfirmShootingDeclaration,
  hasDeclaredShotToResolve,
  resolutionDraftActive,
  shootDisabledReason,
  shootingWhyItems,
  shootingSupportingShooters,
  shootingSupportTargetUnitId,
  shootingSupportBonus,
  helperSection,
}) {
  const currentTargetLabel = shootingWhyItems.find((item) => item.label === 'Target')?.value
    ?? shootingWhyItems.find((item) => item.label === 'Declared target')?.value
    ?? 'Noch kein Ziel';
  const headline = resolutionDraftActive
    ? 'Schussdialog offen'
    : shootingSequenceHandoffPending
      ? 'Schiessfolge fertig'
    : hasDeclaredShotToResolve
      ? 'Schuss bereit'
      : shootingPreviewActive
        ? 'Schiessen'
        : 'Waehle Schuetzen';
  const copy = resolutionDraftActive
    ? 'Wuerfel, Schutz und Resultat liegen jetzt im Popup.'
    : shootingSequenceHandoffPending
      ? shootingSequenceHandoffKind === 'next-player'
        ? 'Alle eligiblen Schuetzen sind abgeschlossen. Die Abgabe an den naechsten Spieler wartet im Popup.'
        : 'Alle Shooting-Sequenzen sind abgeschlossen. Der Wechsel in die Nahkampfphase wartet im Popup.'
    : hasDeclaredShotToResolve
      ? 'Der Schuss ist gebunden und kann bei Bedarf erneut im Popup geoeffnet werden.'
      : shootingPreviewActive
        ? `Prio-Ziel: ${currentTargetLabel}`
        : 'Waehle eine noch offene Fernkampfeinheit auf dem Feld.';
  const showPrimaryShootButton = shootingPreviewActive && canConfirmShootingDeclaration && !resolutionDraftActive;
  const showPopupFallbackButton = hasDeclaredShotToResolve && !resolutionDraftActive;
  const showHandoffPopupButton = shootingSequenceHandoffPending && canOpenShootingSequenceHandoff && !resolutionDraftActive;

  return `
    <div class="battlefield-placeholder-card battlefield-shooting-procedure-card" data-shooting-procedure-status="${shootingProcedureStatus}">
      <strong>Befehle</strong>
      <div class="battlefield-command-primary">
        <div class="battlefield-shooting-procedure-rail" data-testid="shooting-procedure-rail">
          <div class="battlefield-shooting-procedure-banner" data-testid="shooting-procedure-banner">
            <strong>${headline}</strong>
            <span>${copy}</span>
          </div>
          ${shootingProcedureOverview ? `
            <div class="battlefield-command-diagnostics battlefield-command-why-card" data-testid="shooting-procedure-overview-card">
              <strong>Procedure</strong>
              <ul>
                <li><strong>Ranged:</strong> ${shootingProcedureOverview.totalRangedUnits}</li>
                <li><strong>Eligible:</strong> ${shootingProcedureOverview.eligibleUnits}</li>
                <li><strong>Blocked:</strong> ${shootingProcedureOverview.blockedUnits}</li>
                <li><strong>Done:</strong> ${shootingProcedureOverview.completedUnits}</li>
              </ul>
            </div>
          ` : ''}
          ${shootingSupportingShooters.length > 0 ? `
            <div class="battlefield-command-diagnostics battlefield-command-why-card" data-testid="shooting-support-card" data-support-target-unit-id="${shootingSupportTargetUnitId ?? ''}">
              <strong>Support Fire</strong>
              <ul>
                <li><strong>Bonus:</strong> +${shootingSupportBonus}</li>
                ${shootingSupportingShooters.map((supporter) => `
                  <li><strong>${supporter.label ?? supporter.id}:</strong> ${supporter.supportValueLabel}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="battlefield-command-actions battlefield-command-actions-shooting-lean">
            ${showPrimaryShootButton ? `
              <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-shooting-declaration" aria-label="Schiessen" title="Schuss deklarieren und Popup oeffnen">
                <span>Schiessen</span>
              </button>
            ` : ''}
            ${showPopupFallbackButton ? `
              <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="start-shooting-resolution-draft" aria-label="Schusspopup oeffnen" title="Schusspopup erneut oeffnen">
                <span>Popup oeffnen</span>
              </button>
            ` : ''}
            ${showHandoffPopupButton ? `
              <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="open-shooting-sequence-handoff" aria-label="Phasenpopup oeffnen" title="Schiessphasen-Handoff erneut oeffnen">
                <span>Popup oeffnen</span>
              </button>
            ` : ''}
            ${canPassActiveShooter && !resolutionDraftActive ? `
              <button class="ghost-button battlefield-command-action" type="button" data-action="pass-active-shooter" aria-label="Aktiven Shooter ueberspringen" title="Diesen Shooter ohne Schuss als abgeschlossen markieren">
                <span>Pass</span>
              </button>
            ` : ''}
            ${selectedUnit && !resolutionDraftActive ? `
              <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="deselect-unit" aria-label="Shooter abwaehlen" title="Aktuelle Schuetzenauswahl aufheben">
                <span>Abwaehlen</span>
              </button>
            ` : ''}
          </div>
          ${selectedUnit && shootDisabledReason && !showPrimaryShootButton && !showPopupFallbackButton ? `
            <span class="muted-copy">${shootDisabledReason}</span>
          ` : ''}
        </div>
        ${helperSection}
      </div>
    </div>
  `;
}

function formatAngleDegrees(angleRadians) {
  const degrees = angleRadians * (180 / Math.PI);
  return Number.isInteger(degrees) ? String(degrees) : degrees.toFixed(1);
}

function getEvadeWheelLabel(prefix, pivotSide, angleRadians, spentDistanceUd = null) {
  const pivotLabel = pivotSide === 'left' ? 'links' : 'rechts';
  const angleLabel = formatAngleDegrees(Number(angleRadians ?? 0));
  if (!Number.isFinite(spentDistanceUd)) {
    return `${prefix} ${pivotLabel} (${angleLabel} Grad)`;
  }

  const costLabel = formatLengthUd(Number(spentDistanceUd ?? 0));
  return `${prefix} ${pivotLabel} (${angleLabel} Grad, ${costLabel} UD)`;
}

function getEvadeSlideLabel(side, distanceUd) {
  const sideLabel = side === 'left'
    ? 'links'
    : side === 'right'
      ? 'rechts'
      : side ?? 'unbekannt';

  return `Evade ${sideLabel} sliden (${formatLengthUd(Number(distanceUd ?? 0))} UD)`;
}

function getEvadeAvoidanceStepLabel(step, { includePrefix = true } = {}) {
  if (!step?.type) {
    return '';
  }

  if (step.type === 'direction-wheel') {
    return getEvadeWheelLabel(includePrefix ? 'Evade Direction-Wheel' : 'Direction-Wheel', step?.pivotSide, step?.angleRadians, step?.spentDistanceUd);
  }

  if (step.type === 'obstacle-wheel') {
    return getEvadeWheelLabel(includePrefix ? 'Evade Obstacle-Wheel' : 'Obstacle-Wheel', step?.pivotSide, step?.angleRadians, step?.spentDistanceUd);
  }

  return includePrefix
    ? getEvadeSlideLabel(step?.side, step?.distanceUd ?? step?.spentDistanceUd ?? 0)
    : getEvadeSlideLabel(step?.side, step?.distanceUd ?? step?.spentDistanceUd ?? 0).replace(/^Evade\s+/u, '');
}

function getChainedEvadeChoiceLabel(candidate) {
  const steps = Array.isArray(candidate?.avoidanceSteps) ? candidate.avoidanceSteps.filter(Boolean) : [];
  if (steps.length === 0) {
    return 'Evade ausfuehren';
  }

  return steps
    .map((step, index) => getEvadeAvoidanceStepLabel(step, { includePrefix: index === 0 }))
    .filter(Boolean)
    .join(', dann ');
}

function getChargeBranchDistanceOutcomeLabel(distanceOutcome) {
  switch (distanceOutcome) {
    case 'movement-minus-1-ud':
      return 'Bewegung -1 UD';
    case 'normal-movement':
      return 'Normale Bewegung';
    case 'movement-plus-1-ud':
      return 'Bewegung +1 UD';
    default:
      return distanceOutcome ?? 'offen';
  }
}

function getTableExitEdgeLabel(exitEdges = []) {
  const primaryEdge = Array.isArray(exitEdges) ? exitEdges[0] : null;
  switch (primaryEdge) {
    case 'north':
      return 'Nordkante';
    case 'south':
      return 'Suedkante';
    case 'west':
      return 'Westkante';
    case 'east':
      return 'Ostkante';
    default:
      return 'Tischkante';
  }
}

export function getEvadeAvoidanceChoiceLabel(candidate) {
  if (candidate?.type === 'initial-branch-current-orientation') {
    return 'Aktuelle Orientierung beibehalten';
  }

  if (candidate?.type === 'initial-branch-direction-wheel') {
    return 'Mit Direction-Wheel anpassen';
  }

  if (candidate?.type === 'straight') {
    return 'Evade gerade ausfuehren';
  }

  if ((candidate?.avoidanceSteps?.length ?? 0) > 1) {
    return getChainedEvadeChoiceLabel(candidate);
  }

  if (candidate?.type === 'direction-wheel') {
    return getEvadeWheelLabel('Evade Direction-Wheel', candidate?.pivotSide, candidate?.angleRadians, candidate?.spentDistanceUd);
  }

  if (candidate?.type === 'obstacle-wheel') {
    return getEvadeWheelLabel('Evade Obstacle-Wheel', candidate?.pivotSide, candidate?.angleRadians, candidate?.spentDistanceUd);
  }
  return getEvadeSlideLabel(candidate?.side, candidate?.distanceUd ?? candidate?.spentDistanceUd ?? 0);
}

export function getAdvancePreviewPresentation({ state, selectedUnit, isSetupActive, canDragUnitsInSetup, battlefieldProfile }) {
  const isFreeCommander = Boolean(selectedUnit?.isCommander && !selectedUnit?.hasIncludedCommander && !selectedUnit?.attachedUnitId);
  const commanderAttachPreview = selectedUnit
    && state.game.commanderFreeMovePreview?.unitId === selectedUnit.id
    && state.game.commanderFreeMovePreview?.mode === 'attach'
    ? state.game.commanderFreeMovePreview
    : null;
  const unitMovementBudgetUd = isFreeCommander ? 5 : getUnitMovementBudgetUd({ selectedUnit, units: state.game.units });
  const advanceModeActive = state.game.advanceModeActive && Boolean(selectedUnit);
  const slideModeActive = state.game.slideModeActive && Boolean(selectedUnit);
  const wheelModeActive = state.game.wheelModeActive && Boolean(selectedUnit);
  const advancePreviewUd = selectedUnit ? state.game.advancePreviewUd : 0;
  const slidePreviewUd = selectedUnit ? state.game.slidePreviewUd : 0;
  const wheelPreviewAngleRadians = selectedUnit ? state.game.wheelPreviewAngleRadians : 0;
  const movementPreview = state.game.movement.preview;
  const commanderFreeMovePreview = state.game.commanderFreeMovePreview;
  const chargePreview = state.game.chargePreview;
  const chargeConfirmReady = Boolean(
    chargePreview?.intent?.unitId === selectedUnit?.id
      && canConfirmChargePreviewDirection(chargePreview),
  );
  const committedSegments = getCommittedMovementPreviewSegments(movementPreview);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(movementPreview);
  const baseAdvanceSegments = lastCommittedSegment?.commandId === 'advance' && movementPreview.status === 'accepted'
    ? committedSegments.slice(0, -1)
    : committedSegments;
  const commanderPreviewSpentUd = isFreeCommander
    && commanderFreeMovePreview?.status === 'ready'
    && commanderFreeMovePreview.unitId === selectedUnit?.id
    ? Math.max(0, Number(commanderFreeMovePreview.nextSpentUd ?? selectedUnit?.advanceUsedUd ?? 0))
    : Math.max(0, Number(selectedUnit?.advanceUsedUd ?? 0));
  const previewDistanceUd = isFreeCommander
    ? commanderPreviewSpentUd
    : getMovementPreviewResolvedDistanceUd(movementPreview);
  const previewSpentBudgetUd = getMovementPreviewSpentBudgetUd(movementPreview);
  const slideQualifiedDistanceUd = getSlideQualifiedMovementDistanceUd(movementPreview);
  const previewContainsSlide = doesMovementPreviewContainCommand(movementPreview, 'slide');
  const slideAvailable = selectedUnit ? isSlideAvailableForUnit(selectedUnit, movementPreview) : false;
  const baseAdvancePreviewSpentBudgetUd = getMovementPreviewSpentBudgetUd({
    status: 'accepted',
    segments: baseAdvanceSegments,
  });
  const remainingAdvanceBudgetUd = selectedUnit
    ? isFreeCommander
      ? Math.max(0, unitMovementBudgetUd - commanderPreviewSpentUd)
      : Math.max(0, getRemainingAdvanceBudgetUd(selectedUnit, state.game.units) - previewSpentBudgetUd)
    : unitMovementBudgetUd;
  const maxAdvanceUd = selectedUnit
    ? isFreeCommander
      ? Math.max(0, unitMovementBudgetUd - (selectedUnit.advanceUsedUd ?? 0))
      : Math.max(0, getRemainingAdvanceBudgetUd(selectedUnit, state.game.units) - baseAdvancePreviewSpentBudgetUd)
    : unitMovementBudgetUd;
  const previewUnitPose = getMovementPreviewEndPose(movementPreview, {
    xUd: selectedUnit?.xUd ?? 0,
    yUd: selectedUnit?.yUd ?? 0,
    rotationRadians: selectedUnit?.rotationRadians ?? 0,
  });
  const previewUnitXUd = previewUnitPose.xUd;
  const previewUnitYUd = previewUnitPose.yUd;
  const previewUnitRotationRadians = previewUnitPose.rotationRadians;
  const wheelDistanceUd = wheelModeActive
    ? (lastCommittedSegment?.commandId === 'wheel'
        ? lastCommittedSegment.distance.resolvedUd
        : getWheelDistanceUdForAngleRadians(wheelPreviewAngleRadians))
    : 0;
  const advanceBasePose = getMovementPreviewEndPose({ status: 'accepted', segments: baseAdvanceSegments }, {
    xUd: selectedUnit?.xUd ?? 0,
    yUd: selectedUnit?.yUd ?? 0,
    rotationRadians: selectedUnit?.rotationRadians ?? 0,
  });
  const advanceForwardAxis = getAxesFromRotation(advanceBasePose.rotationRadians).forwardAxis;
  const advanceReachCenter = addVectors(
    { x: advanceBasePose.xUd, y: advanceBasePose.yUd },
    scaleVector(advanceForwardAxis, (selectedUnit?.depthUd ?? 0) / 2 + maxAdvanceUd / 2),
  );
  const previewUnitStyle = selectedUnit
    ? [
        `left:${(previewUnitXUd / battlefieldProfile.widthUd) * 100}%`,
        `top:${(previewUnitYUd / battlefieldProfile.heightUd) * 100}%`,
        `width:${(selectedUnit.widthUd / battlefieldProfile.widthUd) * 100}%`,
        `height:${(selectedUnit.depthUd / battlefieldProfile.heightUd) * 100}%`,
        `--unit-rotation:${previewUnitRotationRadians}rad`,
      ].join(';')
    : '';
  const advanceReachStyle = selectedUnit
    ? [
        `left:${(advanceReachCenter.x / battlefieldProfile.widthUd) * 100}%`,
        `top:${(advanceReachCenter.y / battlefieldProfile.heightUd) * 100}%`,
        `width:${(selectedUnit.widthUd / battlefieldProfile.widthUd) * 100}%`,
        `height:${(maxAdvanceUd / battlefieldProfile.heightUd) * 100}%`,
        `--advance-rotation:${advanceBasePose.rotationRadians}rad`,
      ].join(';')
    : '';
  const movementBudgetSubset = selectedUnit && !isFreeCommander
    ? evaluateMovementBudgetSubset({
        selectedUnit,
        preview: movementPreview,
        units: state.game.units,
      })
    : null;
  let helperCopy = 'Waehle zuerst die Testeinheit aus.';
  if (selectedUnit) {
    if (canDragUnitsInSetup) {
      helperCopy = 'Im Aufstellungsbereich kann die ausgewaehlte Einheit frei gezogen werden. Advance bleibt bis Kampfbeginn gesperrt.';
    } else if (isSetupActive) {
      helperCopy = 'Während des Setups bleiben Advance-Befehle gesperrt.';
    } else if (movementPreview.status === 'rejected') {
      helperCopy = movementPreview.explanations[0] || 'Movement preview is blocked.';
    } else if (slideModeActive) {
      helperCopy = slideQualifiedDistanceUd >= 1
        ? 'Slide aktiv. Ziehe die Einheit oder den aktiven Ghost seitlich bis maximal 1 UD. Der seitliche Anteil ist in dieser P4-Regelannahme kostenlos.'
        : `Slide aktiv. Seitliche Bewegung bis 1 UD ist in dieser P4-Regelannahme kostenlos, aber Confirm bleibt gesperrt, bis die Kette mindestens 1 UD Advance- oder Wheel-Bewegung enthaelt. Aktuell: ${formatLengthUd(slideQualifiedDistanceUd)} UD qualifizierende Bewegung.`;
    } else if (hasUnitUsedSlideThisMovementPhase(selectedUnit)) {
      helperCopy = 'Diese Einheit hat in der aktuellen Movement-Phase bereits ihren einen erlaubten Slide verbraucht.';
    } else if (previewContainsSlide) {
      helperCopy = 'Die aktuelle Bewegungskette enthaelt bereits einen Slide. Ein zweiter Slide ist in derselben Movement-Phase nicht erlaubt.';
    } else if (wheelModeActive) {
      helperCopy = !state.game.wheelPivotSide
        ? 'Wheel-Modus aktiv. Greife eine der beiden vorderen Ecken und ziehe sie nach vorn. Die gegenueberliegende vordere Ecke bleibt fest.'
        : `Wheel ${state.game.wheelPivotSide === 'left' ? 'um die linke feste Ecke' : 'um die rechte feste Ecke'} nutzt fuer P4 die vereinfachte Einzelbasis-Messung: 90 Grad = 1.5 UD. Aktuell: ${formatAngleDegrees(wheelPreviewAngleRadians)} Grad / ${formatLengthUd(wheelDistanceUd)} UD.`;
    } else if (chargePreview?.status !== 'idle' && chargePreview?.intent?.unitId === selectedUnit?.id) {
      if (chargePreview.status === 'targeting') {
        helperCopy = 'Charge aktiv. Waehle jetzt ein gueltiges Ziel fuer diese Einheit aus. Andere Bewegungsbefehle bleiben gesperrt, bis die Charge-Vorschau abgebrochen oder weitergefuehrt wird.';
      } else if (chargePreview.status === 'manoeuvre-selecting') {
        helperCopy = 'Charge-Ziel gesetzt. Der Tunnel bleibt vorwaerts aus der aktuellen Startlage. Nutze Slide oder Wheel als Charge-Startwerkzeug, um die Startpose auszurichten.';
      } else if (chargePreview.status === 'ready') {
        helperCopy = chargePreviewRequiresContactSideSelection(chargePreview)
          ? 'Charge-Deklaration fast bereit. Waehle zuerst die legale Kontaktseite, bevor du die Richtung bestaetigst.'
          : 'Charge-Deklaration bereit. Mit Richtung bestaetigen frierst du Ziel, Startmanoever, Pfad und Kontakt fuer die gegnerische Reaktion ein.';
      } else if (chargePreview.status === 'reaction-pending') {
        helperCopy = 'Charge pausiert im Reaktionsschritt. Die eingefrorene Deklaration wartet jetzt auf die Reaktionsentscheidung des Verteidigers.';
      } else if (chargePreview.status === 'no-evade-handoff') {
        const secondaryReactionDecisionLabel = getSecondaryChargeReactionDecisionLabel(state, chargePreview);
        const hasConformationPreview = chargePreview.conformationPlan?.status && chargePreview.conformationPlan.status !== 'idle';
        helperCopy = secondaryReactionDecisionLabel
          ? hasConformationPreview
            ? `Die Sekundaerziel-Reaktion ist als ${secondaryReactionDecisionLabel} abgeschlossen. Die Charge ist jetzt im No-Evade-Handoff und zeigt die erste Konformationsvorschau fuer das aktuelle Ziel.`
            : `Die Sekundaerziel-Reaktion ist als ${secondaryReactionDecisionLabel} abgeschlossen. Der Geradeaus-Follow-Through wartet jetzt im expliziten No-Evade-Handoff auf den naechsten P7A/P7B-Slice.`
          : hasConformationPreview
            ? 'Reaktion abgeschlossen: kein Ausweichen. Die Charge ist jetzt im No-Evade-Handoff und zeigt die erste Konformationsvorschau.'
            : 'Reaktion abgeschlossen: kein Ausweichen. Die Charge wartet jetzt im expliziten No-Evade-Handoff auf P7A/P7B.';
      } else if (chargePreview.status === 'evade-required') {
        const branchDistanceClaim = chargePreview?.branchDistanceRoll?.claim ?? null;
        const branchDistanceResult = chargePreview?.branchDistanceRoll?.result ?? null;
        const branchClaimTargetsPrimaryReaction = branchDistanceClaim?.targetUnitId === getPrimaryChargeTargetUnitId(chargePreview);
        const continuationChoice = chargePreview?.chargeMovementPlan?.continuationChoice ?? null;
        const followThroughResolution = chargePreview?.followThroughResolution ?? null;
        const evadeMove = chargePreview?.evadeMove ?? null;
        const canStartAdjustedChargeDistanceRoll = Boolean(
          isEvadeMoveReadyForAdjustedCharge(evadeMove)
            && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
            && branchClaimTargetsPrimaryReaction
            && branchDistanceResult
        );
        const secondaryReactionLabel = getSecondaryChargeReactionLabel(state, chargePreview);
        const secondaryReactionDecisionLabel = getSecondaryChargeReactionDecisionLabel(state, chargePreview);

        if (continuationChoice?.required && !continuationChoice?.selectedOption) {
          helperCopy = `Der nicht-impetuose Charger muss jetzt entscheiden: bei ${formatLengthUd(continuationChoice.minimumDistanceUd)} UD Mindestvorlauf stoppen oder bis ${formatLengthUd(continuationChoice.maximumDistanceUd)} UD voll weiterziehen.`;
        } else if (branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE && !branchDistanceResult) {
          helperCopy = 'Ausweichen ist aufgeloest. Jetzt fehlt noch der deterministische D6-Wurf fuer die angepasste Charge-Distanz des Angreifers.';
        } else if (continuationChoice?.isImpetuous && continuationChoice?.selectedOption === CHARGE_MOVEMENT_CONTINUATION_DECISIONS.CONTINUE) {
          helperCopy = `Der impetuose Charger muss source-checked voll weiterziehen und folgt daher automatisch bis ${formatLengthUd(continuationChoice.maximumDistanceUd)} UD der angepassten Charge-Distanz.`;
        } else if (followThroughResolution?.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.CAUGHT_EVADER) {
          helperCopy = `Der Geradeaus-Follow-Through hat den Evader ${getUnitScenarioLabel(state, followThroughResolution.defenderId)} eingeholt. Der spaetere Kampf bleibt als Rear-Attack-Hook markiert; 1 Cohesion Loss bleibt vorgemerkt, waehrend die Light-Charger-Ausnahme erst in einem spaeteren P7A/P9-Slice sauber geschlossen wird.`;
        } else if (followThroughResolution?.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET) {
          helperCopy = `Der Geradeaus-Follow-Through trifft zuerst das Sekundaerziel ${getUnitScenarioLabel(state, followThroughResolution.defenderId)} und pausiert dort. ${secondaryReactionLabel ? `Die naechste pausierte Reaktion ist ${secondaryReactionLabel}.` : (chargePreview.evadePlan && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE && branchDistanceResult && !branchClaimTargetsPrimaryReaction) ? `Die Sekundaerziel-Reaktion ist jetzt als ${secondaryReactionDecisionLabel ?? 'sekundaere Ausweichreaktion'} aufgeloest. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)} fuer ${getUnitScenarioLabel(state, chargePreview.evadePlan?.reactingUnitId)}. Der bereits gewuerfelte adjusted charge wird weiterverwendet und die Kette wird von dort neu geprueft.` : secondaryReactionDecisionLabel ? `Die Sekundaerziel-Reaktion ist bereits als ${secondaryReactionDecisionLabel} erfasst; der bereits gewuerfelte adjusted charge bleibt gueltig und die Kette wird von dort weitergefuehrt.` : 'Die Sekundaerziel-Reaktion bleibt offen.'}`;
        } else if (followThroughResolution?.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.FRIENDLY_BLOCKER) {
          helperCopy = `Der Geradeaus-Follow-Through laeuft in den befreundeten Blocker ${getUnitScenarioLabel(state, followThroughResolution.defenderId)}. Die genaue Folge bleibt im aktuellen P7A-Schnitt noch offen.`;
        } else if (chargePreview.chargeMovementPlan && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE && branchDistanceResult) {
          helperCopy = `Ausweichen ist aufgeloest. Der Geradeaus-Follow-Through des Chargers ist mit ${formatLengthUd(chargePreview.chargeMovementPlan.distanceUd ?? 0)} UD sichtbar und bleibt fuer die naechsten P7A-Schritte eingefroren.`;
        } else if (
          evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
          && chargePreview?.evadeChoiceHandoff?.status === 'pending'
        ) {
          helperCopy = 'Der Evade-Fall braucht zuerst den Hotseat-Handoff. Nach OK uebernimmt Spieler B die Ausweichwahl.';
        } else if (
          evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
          && chargePreview?.evadeChoiceHandoff?.status === 'acknowledged'
        ) {
          helperCopy = 'Spieler B waehlt jetzt nur den initialen Ausweichpfad. Danach optimiert der Solver den restlichen legalen Fluchtweg auf maximale Distanz und erst dann wird Adjusted Charge freigeschaltet.';
        } else if (canStartAdjustedChargeDistanceRoll && evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED) {
          helperCopy = evadeMove?.tableExit?.exitsTable
            ? `Das Ausweichen bleibt vor dem Board-Commit source-open. ${getUnitScenarioLabel(state, evadeMove.reactingUnitId)} verlaesst ueber die ${getTableExitEdgeLabel(evadeMove.tableExit.exitEdges)} den Tisch; die spaetere P10-Abrechnung bleibt nur als Hook vorgemerkt. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)}. Starte jetzt trotzdem den Folgewurf fuer die angepasste Charge-Distanz.`
            : evadeMove?.endHalfTurnHook?.applied
              ? `Das Ausweichen bleibt vor dem Board-Commit source-open. ${getUnitScenarioLabel(state, evadeMove.reactingUnitId)} legt ${formatLengthUd(Number(evadeMove.distanceUd ?? branchDistanceResult.resolvedDistanceUd ?? 0))} UD Evade-Distanz zurueck; der Light-Troop-End-Half-Turn kommt erst danach kostenlos dazu${evadeMove.cannotShootHook ? ' und sperrt spaeteres Schiessen' : ''}. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)}. Starte jetzt den Folgewurf fuer die angepasste Charge-Distanz.`
              : `Das Ausweichen bleibt vor dem Board-Commit source-open. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)}. Starte jetzt den Folgewurf fuer die angepasste Charge-Distanz.`;
        } else if (
          chargePreview.evadePlan
          && evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED
          && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
          && branchDistanceResult
          && branchClaimTargetsPrimaryReaction
        ) {
          helperCopy = evadeMove?.notice ?? 'Ausweichen ist berechnet, aber noch nicht als regelgueltige Board-Bewegung committed; der Adjusted-Charge-Wurf bleibt gesperrt.';
        } else if (
          chargePreview.evadePlan
          && evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED
          && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
          && branchDistanceResult
          && branchClaimTargetsPrimaryReaction
        ) {
          helperCopy = evadeMove?.tableExit?.exitsTable
            ? `Ausweichen ist committed. ${getUnitScenarioLabel(state, evadeMove.reactingUnitId)} verlaesst ueber die ${getTableExitEdgeLabel(evadeMove.tableExit.exitEdges)} den Tisch und wird vor Adjusted Charge aus dem Spiel entfernt; die spaetere P10-Abrechnung bleibt nur als Hook vorgemerkt. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)}.`
            : evadeMove?.endHalfTurnHook?.applied
              ? `Ausweichen ist committed. ${getUnitScenarioLabel(state, evadeMove.reactingUnitId)} legt ${formatLengthUd(Number(evadeMove.distanceUd ?? branchDistanceResult.resolvedDistanceUd ?? 0))} UD Evade-Distanz zurueck; der Light-Troop-End-Half-Turn kommt erst danach kostenlos dazu${evadeMove.cannotShootHook ? ' und sperrt spaeteres Schiessen' : ''}. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)}. Starte jetzt den Folgewurf fuer die angepasste Charge-Distanz.`
              : `Ausweichen ist committed. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)}. Starte jetzt den Folgewurf fuer die angepasste Charge-Distanz.`;
        } else if (chargePreview.evadePlan && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE && branchDistanceResult) {
          helperCopy = `Die Sekundaerziel-Reaktion ist jetzt als ${secondaryReactionDecisionLabel ?? 'sekundaere Ausweichreaktion'} aufgeloest. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)} fuer ${getUnitScenarioLabel(state, chargePreview.evadePlan?.reactingUnitId)}. Der bereits gewuerfelte adjusted charge bleibt gueltig.`;
        } else {
          helperCopy = 'Reaktion abgeschlossen: Ausweichen erforderlich. Die Charge bleibt jetzt explizit fuer P7A blockiert.';
        }
      } else {
        helperCopy = `Charge-Start ${chargePreview.intent?.startManoeuvre?.label ?? 'gesetzt'}. Der Geradeaus-Ghost folgt der aktuell eingefrorenen Vorwaertsrichtung aus der Charge-Startpose.`;
      }
    } else if (commanderAttachPreview?.status === 'targeting') {
      helperCopy = `Attach aktiv. Waehle eine eigene Einheit im markierten Radius von ${formatLengthUd(Math.max(0, 5 - Number(commanderAttachPreview?.nextSpentUd ?? selectedUnit?.advanceUsedUd ?? 0)))} UD. Der General-Ghost wird dann hinter der Einheit vorbereitet.`;
    } else if (commanderAttachPreview?.status === 'ready') {
      helperCopy = 'Attach-Vorschau bereit. Bestaetigen haengt den General an die gewaehte Einheit an; danach bewegt er sich mit ihr mit.';
    } else if (Number(selectedUnit.advanceUsedUd ?? 0) > 0 || Boolean(selectedUnit.slideUsedThisMovementPhase) || Boolean(selectedUnit.stayedThisMovementPhase)) {
      helperCopy = 'Diese Einheit ist fuer die aktuelle Movement-Phase bereits beendet. Du kannst sie noch auswaehlen und bei Bedarf zuruecksetzen, aber keine weiteren Bewegungsbefehle mehr geben.';
    } else if (isFreeCommander) {
      helperCopy = 'General frei ziehen (Ghost) und mit Bestaetigen uebernehmen. Maximal 5 UD pro Movement-Phase.';
    } else if (movementBudgetSubset?.troopType === 'heavy-infantry') {
      helperCopy = `Advance zieht die Einheit innerhalb des aktuellen P6-Budgets von maximal ${formatLengthUd(maxAdvanceUd)} UD. ${movementBudgetSubset.operationalZoneText}`;
    } else {
      helperCopy = `Advance zieht die Einheit innerhalb des aktuellen P6-Budgets von maximal ${formatLengthUd(maxAdvanceUd)} UD fuer ${movementBudgetSubset?.troopType ?? 'diese Einheit'}.`;
    }
  }
  const hasPendingCommanderPreview = Boolean(
    commanderFreeMovePreview?.status !== 'idle'
      && commanderFreeMovePreview.unitId === selectedUnit?.id,
  );
  const hasPendingChargePreview = Boolean(
    chargePreview?.status !== 'idle'
      && chargePreview?.intent?.unitId === selectedUnit?.id,
  );
  const hasPendingMovementPreview = movementPreview.status !== 'idle' && movementPreview.segments.length > 0;
  const selectionLockActive = Boolean(selectedUnit && (hasPendingCommanderPreview || hasPendingMovementPreview || hasPendingChargePreview));
  const selectionLockCopy = selectionLockActive
    ? hasPendingChargePreview
      ? 'Auswahl gesperrt: Diese Einheit hat eine laufende Charge-Vorschau. Erst weiterfuehren oder abbrechen.'
      : 'Auswahl gesperrt: Diese Einheit hat eine laufende, noch nicht bestaetigte Bewegung. Erst bestaetigen, abbrechen oder resetten.'
    : '';
  const chargeConformationConfirmReady = Boolean(
    selectedUnit
      && chargePreview?.intent?.unitId === selectedUnit.id
      && canConfirmChargeConformation(chargePreview)
  );
  const canConfirmMovement = Boolean(
    commanderFreeMovePreview?.status === 'ready'
      && commanderFreeMovePreview.unitId === selectedUnit?.id,
  ) || state.game.movement.confirmation.status === 'ready' || chargeConfirmReady || chargeConformationConfirmReady;
  const canCancelMovement = hasPendingCommanderPreview
    || hasPendingChargePreview
    || Boolean(state.game.movement.selectedCommandId)
    || movementPreview.status !== 'idle'
    || advanceModeActive
    || slideModeActive
    || wheelModeActive;
  const chargePreviewActive = state.game.chargePreview?.status !== 'idle' && state.game.chargePreview?.intent?.unitId === selectedUnit?.id;
  const movementDiagnostics = state.game.movement.validationSnapshot?.diagnostics ?? [];
  const chargeDiagnostics = chargePreviewActive && Array.isArray(chargePreview?.diagnostics)
    ? chargePreview.diagnostics
    : [];
  const diagnostics = chargePreviewActive ? chargeDiagnostics : movementDiagnostics;
  const canMarkStay = Boolean(
    selectedUnit
      && !isSetupActive
      && state.game.commandContext.currentPhaseId === 'movement'
      && state.game.commandContext.activePlayerId === selectedUnit.owner
      && state.game.commandContext.activeCorpsId != null
      && selectedUnit.corpsId != null,
  ) && !Boolean(selectedUnit?.mandatoryMovementPending ?? selectedUnit?.mustMoveThisPhase);
  const canShowMovementButtons = Boolean(selectedUnit && (!selectedUnit.isCommander || selectedUnit.hasIncludedCommander));
  const canUseFreeCommandPoint = Boolean(selectedUnit && canUseFreeCommandPointForCurrentOrder(state.game, selectedUnit));
  const useFreeCommandPoint = Boolean(state.game.movement.useFreeCommandPoint && canUseFreeCommandPoint);
  const chargeStartControlsActive = Boolean(
    chargePreview?.intent?.unitId === selectedUnit?.id
      && (chargePreview?.status === 'manoeuvre-selecting' || chargePreview?.status === 'ready'),
  );
  const chargeStartOptions = chargeStartControlsActive ? chargePreview?.startManoeuvreOptions ?? [] : [];
  const selectedChargeStartType = chargePreview?.intent?.startManoeuvre?.type ?? null;
  const chargeSlideOption = chargeStartOptions.find((option) => option.type === 'shift-slide') || null;
  const chargeWheelOption = chargeStartOptions.find((option) => option.type === 'wheel') || null;
  const canStartCharge = Boolean(selectedUnit && canShowMovementButtons && canStartChargePreview(state, selectedUnit));
  const chargeDisabledReason = selectedUnit
    ? canShowMovementButtons
      ? getChargePreviewUnavailableReason(state, selectedUnit)
      : 'Charge ist fuer frei bewegte Kommandeure in diesem P7-Schnitt noch nicht verfuegbar.'
    : 'Waehle zuerst eine Einheit fuer Charge aus.';
  const branchDistanceClaim = chargePreview?.branchDistanceRoll?.claim ?? null;
  const branchDistanceResult = chargePreview?.branchDistanceRoll?.result ?? null;
  const branchClaimTargetsPrimaryReaction = branchDistanceClaim?.targetUnitId === getPrimaryChargeTargetUnitId(chargePreview);
  const canStartAdjustedChargeDistanceRoll = Boolean(
    chargePreview?.intent?.unitId === selectedUnit?.id
      && chargePreview?.status === 'evade-required'
      && chargePreview?.evadePlan
      && isEvadeMoveReadyForAdjustedCharge(chargePreview?.evadeMove)
      && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
      && branchClaimTargetsPrimaryReaction
      && branchDistanceResult,
  );
  const evadeAvoidanceCandidates = chargePreview?.evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    ? chargePreview.evadeMove.avoidanceCandidates ?? []
    : [];
  const evadeChoicePathStepIds = chargePreview?.evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    ? (chargePreview.evadeMove.choicePathStepIds ?? [])
    : [];
  const canResolveEvadeAvoidanceChoice = Boolean(
    chargePreview?.intent?.unitId === selectedUnit?.id
      && chargePreview?.status === 'evade-required'
      && chargePreview?.evadeChoiceHandoff?.status === 'acknowledged'
      && evadeAvoidanceCandidates.length > 0,
  );
  const continuationChoice = chargePreview?.chargeMovementPlan?.continuationChoice ?? null;
  const canResolveChargeContinuationChoice = Boolean(
    chargePreview?.intent?.unitId === selectedUnit?.id
      && chargePreview?.status === 'evade-required'
      && continuationChoice?.required
      && !continuationChoice?.selectedOption,
  );
  const chargeWhyItems = chargePreviewActive ? buildChargeWhyItems({ state, chargePreview }) : [];
  const shootingPhaseActive = state.game.commandContext.currentPhaseId === 'shooting';
  const meleePhaseActive = state.game.commandContext.currentPhaseId === 'melee';
  const meleeProcedurePresentation = meleePhaseActive
    ? getMeleeProcedurePresentation(state.game)
    : null;
  const shootingPresentation = shootingPhaseActive
    ? getShootingDeclarationPresentation({ gameState: state.game, selectedUnit })
    : null;
  const shootingProcedurePresentation = shootingPhaseActive
    ? getShootingProcedurePresentation(state.game, selectedUnit?.id ?? null)
    : null;
  const shootingResolutionPresentation = shootingPhaseActive
    ? getShootingResolutionPresentation({ gameState: state.game, selectedUnit })
    : null;
  const commandMenuBranch = resolveEffectiveCommandMenuBranch(state.game, selectedUnit);
  const commandMenuLevel = commandMenuBranch ? 'branch' : 'root';
  const shootingFlowActive = Boolean(
    shootingPresentation?.shootingPreviewActive
      || shootingResolutionPresentation?.resolutionDraftActive
      || shootingResolutionPresentation?.hasDeclaredShotToResolve
      || shootingResolutionPresentation?.resolvedShotRecord,
  );
  const effectiveShootingSupporters = shootingPresentation?.supportingShooters?.length
    ? shootingPresentation.supportingShooters
    : shootingResolutionPresentation?.supportingShooters ?? [];
  const effectiveShootingDeclaredShotGroup = shootingPresentation?.declaredShotGroup
    ?? shootingResolutionPresentation?.declaredShotGroup
    ?? null;
  const activeShootingHelperCopy = shootingResolutionPresentation?.resolutionDraftActive
    || shootingResolutionPresentation?.hasDeclaredShotToResolve
    || shootingResolutionPresentation?.resolvedShotRecord
    ? shootingResolutionPresentation?.helperCopy
    : shootingPresentation?.helperCopy;
  const activeShootingDiagnostics = [
    ...(shootingPresentation?.diagnostics ?? []),
    ...(shootingResolutionPresentation?.diagnostics ?? []),
  ];

  return {
    advanceModeActive,
    slideModeActive,
    wheelModeActive,
    wheelPivotSide: state.game.wheelPivotSide,
    advancePreviewUd,
    slidePreviewUd,
    wheelPreviewAngleRadians,
    wheelDistanceUd,
    previewDistanceUd,
    slideAvailable,
    remainingAdvanceBudgetUd,
    maxAdvanceUd,
    previewUnitStyle,
    advanceReachStyle,
    helperCopy: shootingPhaseActive ? activeShootingHelperCopy : helperCopy,
    diagnostics: shootingPhaseActive ? activeShootingDiagnostics : diagnostics,
    canCancelMovement,
    canConfirmMovement,
    selectionLockActive,
    selectionLockCopy,
    canMarkStay,
    canShowMovementButtons,
    canUseFreeCommandPoint,
    useFreeCommandPoint,
    chargePreviewActive,
    chargeStartControlsActive,
    chargeStartOptions,
    selectedChargeStartType,
    canStartCharge,
    chargeDisabledReason,
    canStartAdjustedChargeDistanceRoll,
    canResolveEvadeAvoidanceChoice,
    evadeAvoidanceCandidates,
    evadeChoicePathStepIds,
    canResolveChargeContinuationChoice,
    minimumChargeContinuationDistanceUd: continuationChoice?.minimumDistanceUd ?? 0,
    maximumChargeContinuationDistanceUd: continuationChoice?.maximumDistanceUd ?? 0,
    chargeWhyItems,
    canShowShootingButton: Boolean(selectedUnit) && shootingPhaseActive && !selectedUnit?.isCommander,
    canShowMeleeButton: Boolean(selectedUnit) && meleePhaseActive && !selectedUnit?.isCommander,
    meleeProcedureStatus: meleeProcedurePresentation?.status ?? 'idle',
    meleeProcedureOverview: meleeProcedurePresentation?.overview ?? null,
    meleeSelectionCount: meleeProcedurePresentation?.queueSelectionIds?.length ?? 0,
    shootingProcedureStatus: shootingProcedurePresentation?.status ?? 'idle',
    activeShootingUnitId: shootingProcedurePresentation?.activeShooterUnitId ?? null,
    shootingProcedureOverview: shootingProcedurePresentation?.overview ?? null,
    shootingSequenceHandoffPending: state.game.shooting?.handoff?.status === 'pending',
    shootingSequenceHandoffKind: state.game.shooting?.handoff?.kind ?? null,
    canOpenShootingSequenceHandoff: state.game.shooting?.handoff?.status === 'pending'
      && state.game.round?.dialog?.type !== ROUND_DIALOG_TYPES.SHOOTING_SEQUENCE_HANDOFF,
    canPassActiveShooter: shootingProcedurePresentation?.canPassActiveShooter ?? false,
    isActiveShootingUnit: Boolean(selectedUnit?.id) && shootingProcedurePresentation?.activeShooterUnitId === selectedUnit?.id,
    shootingPreviewActive: shootingPresentation?.shootingPreviewActive ?? false,
    shootingTargetingActive: shootingPresentation?.shootingTargetingActive ?? false,
    canStartShootingDeclaration: shootingPresentation?.canStartShootingDeclaration ?? false,
    canCancelShootingDeclaration: shootingPresentation?.canCancelShootingDeclaration ?? false,
    canConfirmShootingDeclaration: shootingPresentation?.canConfirmShootingDeclaration ?? false,
    hasDeclaredShotToResolve: shootingResolutionPresentation?.hasDeclaredShotToResolve ?? false,
    resolvedShotRecord: shootingResolutionPresentation?.resolvedShotRecord ?? null,
    resolutionDraftActive: shootingResolutionPresentation?.resolutionDraftActive ?? false,
    canStartShootingResolution: shootingResolutionPresentation?.canStartShootingResolution ?? false,
    canConfirmShootingResolution: shootingResolutionPresentation?.canConfirmShootingResolution ?? false,
    shootingResolutionDraft: shootingResolutionPresentation?.resolutionDraft ?? null,
    shootingResolutionPreview: shootingResolutionPresentation?.resolutionPreview ?? null,
    shootDisabledReason: shootingPresentation?.shootDisabledReason ?? '',
    shootingWhyItems: ([...(shootingPresentation?.whyItems ?? []), ...(shootingResolutionPresentation?.whyItems ?? [])]).map((item) => ({
      ...item,
      value: item.label === 'Status'
        ? getShootingStatusLabel(item.value)
        : item.label === 'Resolution'
          ? getShootingResolutionStatusLabel(item.value)
          : item.value,
    })),
    shootingTargetCandidates: shootingPresentation?.targetCandidates ?? [],
            shootingSupportingShooters: effectiveShootingSupporters,
            shootingSupportTargetUnitId: effectiveShootingDeclaredShotGroup?.targetUnitId ?? null,
            shootingSupportBonus: effectiveShootingDeclaredShotGroup?.supportBonus ?? 0,
    shootingFlowActive,
    commandMenuBranch,
    commandMenuLevel,
    confirmActionLabel: chargeConformationConfirmReady ? 'Konformation bestaetigen' : chargeConfirmReady ? 'Richtung bestaetigen' : 'Bewegung beenden',
    confirmActionTitle: chargeConformationConfirmReady ? 'Charge mit aktueller Konformation abschliessen' : chargeConfirmReady ? 'Charge-Deklaration einfrieren und Reaktion oeffnen' : 'Bewegung beenden',
    movementBudgetLabel: isFreeCommander
      ? 'General-Budget'
      : movementBudgetSubset?.troopType === 'heavy-infantry'
        ? `P6-Budget (${movementBudgetSubset.operationalZoneActive ? 'Operational Zone 3 UD' : 'Heavy Infantry 2 UD'})`
        : movementBudgetSubset?.budgetUd != null
          ? `P6-Budget (${formatLengthUd(movementBudgetSubset.budgetUd)} UD)`
          : 'P6-Budget',
  };
}

export function renderAdvanceCommandPanel({
  selectedUnit,
  isSetupActive,
  roundState = null,
  setupStepId = null,
  canIssueMovementCommands = false,
  advanceModeActive,
  slideModeActive,
  wheelModeActive,
  wheelPivotSide,
  advancePreviewUd,
  slidePreviewUd,
  wheelPreviewAngleRadians,
  wheelDistanceUd,
  previewDistanceUd,
  slideAvailable,
  remainingAdvanceBudgetUd,
  maxAdvanceUd,
  helperCopy,
  diagnostics,
  canCancelMovement,
  canConfirmMovement,
  selectionLockActive = false,
  selectionLockCopy = '',
  canMarkStay = false,
  canShowMovementButtons = true,
  canUseFreeCommandPoint = false,
  useFreeCommandPoint = false,
  chargePreviewActive = false,
  chargeStartControlsActive = false,
  chargeStartOptions = [],
  selectedChargeStartType = null,
  canStartCharge = false,
  chargeDisabledReason = '',
  canStartAdjustedChargeDistanceRoll = false,
  canResolveEvadeAvoidanceChoice = false,
  evadeAvoidanceCandidates = [],
  evadeChoicePathStepIds = [],
  canResolveChargeContinuationChoice = false,
  minimumChargeContinuationDistanceUd = 0,
  maximumChargeContinuationDistanceUd = 0,
  chargeWhyItems = [],
  canShowShootingButton = false,
  canShowMeleeButton = false,
  meleeProcedureStatus = 'idle',
  meleeProcedureOverview = null,
  meleeSelectionCount = 0,
  shootingProcedureStatus = 'idle',
  activeShootingUnitId = null,
  shootingProcedureOverview = null,
  shootingSequenceHandoffPending = false,
  shootingSequenceHandoffKind = null,
  canOpenShootingSequenceHandoff = false,
  canPassActiveShooter = false,
  isActiveShootingUnit = false,
  shootingPreviewActive = false,
  shootingTargetingActive = false,
  canStartShootingDeclaration = false,
  canCancelShootingDeclaration = false,
  canConfirmShootingDeclaration = false,
  hasDeclaredShotToResolve = false,
  resolvedShotRecord = null,
  resolutionDraftActive = false,
  canStartShootingResolution = false,
  canConfirmShootingResolution = false,
  shootingResolutionDraft = null,
  shootingResolutionPreview = null,
  shootDisabledReason = '',
  shootingWhyItems = [],
  shootingSupportingShooters = [],
  shootingSupportTargetUnitId = null,
  shootingSupportBonus = 0,
  shootingFlowActive = false,
  commandMenuBranch = null,
  commandMenuLevel = 'root',
  confirmActionLabel = 'Bewegung beenden',
  confirmActionTitle = 'Bewegung beenden',
  canToggleCommanderEngagedDiagnostic = false,
  commanderEngagedDiagnosticActive = false,
  canAttachCommander = false,
  movementBudgetLabel = 'P6-Budget',
}) {
  const chargeSlideOption = chargeStartOptions.find((option) => option.type === 'shift-slide') || null;
  const chargeWheelOption = chargeStartOptions.find((option) => option.type === 'wheel') || null;
  const showAttachCommanderButton = Boolean(
    selectedUnit?.isCommander
      && !selectedUnit?.hasIncludedCommander
      && !selectedUnit?.attachedUnitId,
  );
  const showCommanderBranchGrouping = Boolean(selectedUnit?.isCommander);
  const showUnitBranchGrouping = Boolean(canShowMovementButtons) && !showCommanderBranchGrouping;
  const showShootingBranchGrouping = Boolean(canShowShootingButton) && !showCommanderBranchGrouping;
  const showMeleeBranchGrouping = Boolean(canShowMeleeButton) && !showCommanderBranchGrouping;
  const showLeanShootingPanel = Boolean(
    shootingProcedureStatus !== 'idle'
      || shootingSequenceHandoffPending
      || shootingPreviewActive
      || hasDeclaredShotToResolve
      || resolvedShotRecord
      || resolutionDraftActive
      || shootingProcedureOverview,
  );
  const showRootActions = commandMenuLevel === 'root' && (showUnitBranchGrouping || showCommanderBranchGrouping);
  const showMeleeRootActions = commandMenuLevel === 'root' && showMeleeBranchGrouping;
  const showShootRootActions = commandMenuLevel === 'root' && showShootingBranchGrouping && !showLeanShootingPanel;
  const showUnitRootActions = showUnitBranchGrouping && showRootActions && canIssueMovementCommands;
  const showCommanderRootActions = showCommanderBranchGrouping && showRootActions && (canIssueMovementCommands || canAttachCommander);
  const showMoveBranchActions = commandMenuBranch === 'move';
  const showChargeBranchActions = showUnitBranchGrouping && commandMenuBranch === 'charge';
  const showShootBranchActions = showShootingBranchGrouping && commandMenuBranch === 'shoot';
  const showMeleeBranchActions = showMeleeBranchGrouping && commandMenuBranch === 'melee';
  const canApplyMeleeBatch = Boolean(
    meleeSelectionCount > 0
      && Number(meleeProcedureOverview?.unresolvedMelees ?? meleeSelectionCount) === 0,
  );
  const showAttachBranchActions = showCommanderBranchGrouping && commandMenuBranch === 'attach';
  const showChargeTargetHint = showChargeBranchActions && chargePreviewActive && !chargeStartControlsActive;
  const showShootTargetHint = showShootBranchActions && shootingTargetingActive;
  const showShootProcedureHint = showShootBranchActions && shootingProcedureStatus === 'active' && !shootingPreviewActive && !resolutionDraftActive && !hasDeclaredShotToResolve;
  const showLegacyMovementSurface = !showUnitBranchGrouping && !showCommanderBranchGrouping && !showShootingBranchGrouping;
  const showAdvanceButton = !showCommanderBranchGrouping && canShowMovementButtons && (!showUnitBranchGrouping || showMoveBranchActions);
  const showDirectionButtons = !showCommanderBranchGrouping && canShowMovementButtons && (!showUnitBranchGrouping || showMoveBranchActions || chargeStartControlsActive);
  const showChargeButton = !showCommanderBranchGrouping && canShowMovementButtons && !showUnitBranchGrouping;
  const showBranchBackButton = (showUnitBranchGrouping || showCommanderBranchGrouping || showShootingBranchGrouping || showMeleeBranchGrouping) && commandMenuLevel === 'branch' && !canCancelMovement;
  const showStayButton = showLegacyMovementSurface || showUnitRootActions || showCommanderRootActions;
  const showResetButton = showLegacyMovementSurface || showRootActions;
  const showShootingCommandActions = showShootBranchActions || shootingPreviewActive || resolutionDraftActive;
  const showCommandActions = showLegacyMovementSurface
    || (showMoveBranchActions && (!showCommanderBranchGrouping || canCancelMovement || canConfirmMovement))
    || showChargeBranchActions
    || showAttachBranchActions
    || showMeleeBranchActions
    || showShootingCommandActions
    || chargePreviewActive
    || canStartAdjustedChargeDistanceRoll
    || canResolveEvadeAvoidanceChoice
    || canResolveChargeContinuationChoice;
  const isReadySetupStep = setupStepId === 'ready';
  const setupPrimaryLabel = isReadySetupStep ? 'In die Schlacht' : 'Naechster Schritt';

  if (isSetupActive) {
    return `
      <div class="battlefield-placeholder-card battlefield-setup-primary-card">
        <strong>Befehle</strong>
        <div class="battlefield-command-primary">
          <div class="battlefield-command-round-actions battlefield-command-round-actions-setup-top">
            <button class="shell-button battlefield-command-button" type="button" data-action="${isReadySetupStep ? 'complete-setup' : 'setup-next'}" data-testid="setup-primary-button" data-automation-id="${isReadySetupStep ? 'complete-setup' : 'setup-next'}" aria-label="${setupPrimaryLabel}" autofocus>
              ${setupPrimaryLabel}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const selectedUnitSummary = selectedUnit ? (canShowShootingButton ? `
    <div class="battlefield-command-summary" data-command-menu-level="${commandMenuLevel}" data-command-menu-branch="${commandMenuBranch ?? 'none'}">
      <span>Shooting phase declaration surface</span>
      <span>${resolutionDraftActive ? 'Roll/Result aktiv' : shootingPreviewActive ? 'Zielvorschau aktiv' : hasDeclaredShotToResolve ? 'Deklariert, noch offen' : resolvedShotRecord ? 'Schuss aufgeloest' : 'Noch keine Schussvorschau'}</span>
      <span>${shootingWhyItems.find((item) => item.label === 'Target')?.value ?? shootingWhyItems.find((item) => item.label === 'Declared target')?.value ?? 'Noch kein Ziel gewaehlt'}</span>
    </div>
  ` : canShowMeleeButton ? `
    <div class="battlefield-command-summary" data-command-menu-level="${commandMenuLevel}" data-command-menu-branch="${commandMenuBranch ?? 'none'}">
      <span>Melee phase batch surface</span>
      <span>Status: ${meleeProcedureStatus}</span>
      <span>Queue: ${meleeSelectionCount} / ${meleeProcedureOverview?.eligibleMelees ?? 0}</span>
    </div>
  ` : `
    <div class="battlefield-command-summary" data-command-menu-level="${commandMenuLevel}" data-command-menu-branch="${commandMenuBranch ?? 'none'}">
      <span>Distanz: ${formatLengthUd(wheelModeActive ? wheelDistanceUd : slideModeActive ? slidePreviewUd : advancePreviewUd)} UD / ${formatLengthUd((wheelModeActive ? wheelDistanceUd : slideModeActive ? slidePreviewUd : advancePreviewUd) * 4)} cm</span>
      <span>Preview gesamt: ${formatLengthUd(previewDistanceUd)} UD / ${formatLengthUd(previewDistanceUd * 4)} cm</span>
      <span>${movementBudgetLabel}: ${formatLengthUd(remainingAdvanceBudgetUd)} UD / ${formatLengthUd(remainingAdvanceBudgetUd * 4)} cm verbleibend</span>
    </div>
  `) : '';

  const helperSection = `
    <details class="battlefield-collapsible-card battlefield-command-details">
      <summary class="battlefield-collapsible-summary">
        <strong>Hinweise</strong>
        <span>${selectedUnit ? 'Details' : 'Auswahl'}</span>
      </summary>
      <div class="battlefield-collapsible-body">
        ${selectedUnitSummary}
        <span class="muted-copy">${helperCopy}</span>
        ${selectedUnit && chargeWhyItems.length > 0 ? `
          <div class="battlefield-command-diagnostics battlefield-command-why-card" data-charge-why-card>
            <strong>Charge-Status</strong>
            <ul>
              ${chargeWhyItems.map((item) => `
                <li><strong>${item.label}:</strong> ${item.value}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        ${selectedUnit && shootingWhyItems.length > 0 ? `
          <div class="battlefield-command-diagnostics battlefield-command-why-card" data-shooting-why-card>
            <strong>Shoot-Status</strong>
            <ul>
              ${shootingWhyItems.map((item) => `
                <li><strong>${item.label}:</strong> ${item.value}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        ${selectedUnit ? `
          <div class="battlefield-command-diagnostics">
            <strong>Diagnostics</strong>
            <ul>
              ${diagnostics.map((item) => `
                <li><strong>${item.label ?? item.code ?? 'diagnostic'}:</strong> ${item.status} - ${item.text}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </details>
  `;

  if (showLeanShootingPanel) {
    return renderLeanShootingProcedurePanel({
      selectedUnit,
      helperCopy,
      diagnostics,
      shootingProcedureStatus,
      shootingProcedureOverview,
      shootingSequenceHandoffPending,
      shootingSequenceHandoffKind,
      canOpenShootingSequenceHandoff,
      canPassActiveShooter,
      shootingPreviewActive,
      canConfirmShootingDeclaration,
      hasDeclaredShotToResolve,
      resolutionDraftActive,
      shootDisabledReason,
      shootingWhyItems,
      shootingSupportingShooters,
      shootingSupportTargetUnitId,
      shootingSupportBonus,
      helperSection,
    });
  }

  return `
    <div class="battlefield-placeholder-card">
      <strong>Befehle</strong>
      <div class="battlefield-command-primary">
        <div class="battlefield-command-grid">
          ${showUnitRootActions ? `
            <button class="shell-button battlefield-command-button ${commandMenuBranch === 'move' ? 'is-active' : ''}" type="button" data-action="set-command-menu-branch" data-branch="move" data-testid="command-move-branch-button" aria-label="Move oeffnen">Move</button>
            <button class="shell-button battlefield-command-button ${commandMenuBranch === 'charge' ? 'is-active' : ''}" type="button" data-action="start-charge-preview" data-testid="command-charge-branch-button" aria-label="Charge oeffnen" title="${chargeDisabledReason || 'Charge vor anderer Bewegung starten'}" ${canStartCharge ? '' : 'disabled'}>Charge</button>
          ` : ''}
          ${showCommanderRootActions ? `
            <button class="shell-button battlefield-command-button ${commandMenuBranch === 'move' ? 'is-active' : ''}" type="button" data-action="set-command-menu-branch" data-branch="move" data-testid="command-move-branch-button" aria-label="Move oeffnen">Move</button>
            <button class="shell-button battlefield-command-button ${commandMenuBranch === 'attach' ? 'is-active' : ''}" type="button" data-action="attach-commander" data-testid="command-attach-branch-button" aria-label="Attach oeffnen" ${canAttachCommander ? '' : 'disabled'}>Attach</button>
          ` : ''}
          ${showShootRootActions ? `
            <button class="shell-button battlefield-command-button ${commandMenuBranch === 'shoot' ? 'is-active' : ''}" type="button" data-action="${hasDeclaredShotToResolve || resolvedShotRecord || shootingProcedureStatus === 'active' ? 'set-command-menu-branch' : 'start-shooting-declaration-preview'}" ${hasDeclaredShotToResolve || resolvedShotRecord || shootingProcedureStatus === 'active' ? 'data-branch="shoot"' : ''} data-testid="command-shoot-branch-button" aria-label="Shoot oeffnen" title="${hasDeclaredShotToResolve || resolvedShotRecord ? 'Shoot branch with declaration and roll/result state' : shootDisabledReason || 'Shoot declaration starten'}" ${(hasDeclaredShotToResolve || resolvedShotRecord || canStartShootingDeclaration || shootingProcedureStatus === 'active') ? '' : 'disabled'}>Shoot</button>
          ` : ''}
          ${showMeleeRootActions ? `
            <button class="shell-button battlefield-command-button ${commandMenuBranch === 'melee' ? 'is-active' : ''}" type="button" data-action="set-command-menu-branch" data-branch="melee" data-testid="command-melee-branch-button" aria-label="Melee oeffnen">Melee</button>
          ` : ''}
          ${showBranchBackButton ? `
            <button class="ghost-button battlefield-command-button" type="button" data-action="set-command-menu-branch" data-branch="" data-testid="command-branch-back-button" aria-label="Zur ersten Befehlsebene zurueck">Zurueck</button>
          ` : ''}
          ${showChargeTargetHint ? `
            <div class="shell-button battlefield-command-button battlefield-command-branch-hint" data-testid="command-charge-target-hint" aria-live="polite">Ziel waehlen</div>
          ` : ''}
          ${showShootTargetHint ? `
            <div class="shell-button battlefield-command-button battlefield-command-branch-hint" data-testid="command-shoot-target-hint" aria-live="polite">Ziel fuer den Schuss waehlen</div>
          ` : ''}
          ${showShootProcedureHint ? `
            <div class="shell-button battlefield-command-button battlefield-command-branch-hint" data-testid="command-shoot-procedure-hint" aria-live="polite">${isActiveShootingUnit ? 'Ausgewaehlter Shooter: Shoot oder Pass' : activeShootingUnitId ? `Ausgewaehlter Shooter: ${activeShootingUnitId}` : 'Naechsten Shooter waehlen'}</div>
          ` : ''}
          ${showMeleeBranchActions ? `
            <div class="shell-button battlefield-command-button battlefield-command-branch-hint" data-testid="command-melee-procedure-hint" aria-live="polite">Melee Queue: ${meleeSelectionCount} ausgewaehlt</div>
          ` : ''}
          ${showAdvanceButton ? `
            <button class="shell-button battlefield-command-button ${advanceModeActive ? 'is-active' : ''}" type="button" data-action="toggle-advance-mode" data-testid="command-advance-button" data-automation-id="toggle-advance-mode" aria-label="Advance" ${!chargePreviewActive && canIssueMovementCommands && (advanceModeActive || maxAdvanceUd > 0) ? '' : 'disabled'}>Advance</button>
          ` : ''}
          ${showDirectionButtons ? `
            <button class="shell-button battlefield-command-button ${(wheelModeActive || (chargeStartControlsActive && selectedChargeStartType === 'wheel')) ? 'is-active' : ''}" type="button" data-action="toggle-wheel-mode" data-testid="command-wheel-button" data-automation-id="toggle-wheel-mode" aria-label="Wheel" ${chargeStartControlsActive ? chargeWheelOption?.status === 'available' ? '' : 'disabled' : !chargePreviewActive && canIssueMovementCommands && (wheelModeActive || remainingAdvanceBudgetUd > 0) ? '' : 'disabled'}>Wheel</button>
            <button class="shell-button battlefield-command-button ${(slideModeActive || (chargeStartControlsActive && selectedChargeStartType === 'shift-slide')) ? 'is-active' : ''}" type="button" data-action="toggle-slide-mode" data-testid="command-slide-button" data-automation-id="toggle-slide-mode" aria-label="Slide" ${chargeStartControlsActive ? chargeSlideOption?.status === 'available' ? '' : 'disabled' : !chargePreviewActive && canIssueMovementCommands && (slideModeActive || slideAvailable) ? '' : 'disabled'}>Slide</button>
          ` : ''}
          ${showChargeButton ? `
            <button class="shell-button battlefield-command-button ${chargePreviewActive ? 'is-active' : ''}" type="button" data-action="start-charge-preview" data-testid="command-charge-button" data-automation-id="start-charge-preview" aria-label="Charge starten" title="${chargeDisabledReason || 'Charge vor anderer Bewegung starten'}" ${canStartCharge || chargePreviewActive ? '' : 'disabled'}>Charge</button>
          ` : ''}
          ${showStayButton ? `<button class="ghost-button battlefield-command-button" type="button" data-action="mark-unit-stay" ${canMarkStay ? '' : 'disabled'}>Stay</button>` : ''}
          ${showLegacyMovementSurface && showAttachCommanderButton ? `<button class="ghost-button battlefield-command-button" type="button" data-action="attach-commander" ${canAttachCommander ? '' : 'disabled'}>Kommandeur anhaengen</button>` : ''}
          ${showResetButton ? `<button class="ghost-button battlefield-command-button" type="button" data-action="reset-test-units" ${isSetupActive || !selectedUnit ? 'disabled' : ''}>Einheit zuruecksetzen</button>` : ''}
        </div>
        ${showCommandActions ? `
        <div class="battlefield-command-actions">
          ${showShootingCommandActions ? `
            ${resolutionDraftActive ? `
              <label class="battlefield-command-free-cp-toggle" data-testid="shooting-protection-input-row">
                <span>Verified protection</span>
                <select data-action="set-shooting-resolution-protection" aria-label="Verified protection value">
                  <option value="" ${Number.isFinite(shootingResolutionDraft?.resolvedTargetProtectionValue) ? '' : 'selected'}>choose</option>
                  ${[0, 1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}" ${shootingResolutionDraft?.resolvedTargetProtectionValue === value ? 'selected' : ''}>${value}</option>`).join('')}
                </select>
              </label>
              <label class="battlefield-command-free-cp-toggle" data-testid="shooting-shooter-die-input-row">
                <span>Shooter D6</span>
                <select data-action="set-shooting-resolution-shooter-die" aria-label="Shooter D6 value">
                  ${[1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}" ${shootingResolutionDraft?.shooterDieRoll === value ? 'selected' : ''}>${value}</option>`).join('')}
                </select>
              </label>
              <label class="battlefield-command-free-cp-toggle" data-testid="shooting-target-die-input-row">
                <span>Target D6</span>
                <select data-action="set-shooting-resolution-target-die" aria-label="Target D6 value">
                  ${[1, 2, 3, 4, 5, 6].map((value) => `<option value="${value}" ${shootingResolutionDraft?.targetDieRoll === value ? 'selected' : ''}>${value}</option>`).join('')}
                </select>
              </label>
              <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-shooting-resolution" aria-label="Roll/result bestaetigen" title="Deterministisches Roll/result im Reducer speichern" ${isSetupActive || !canConfirmShootingResolution ? 'disabled' : ''}>
                <span>Roll/Result bestaetigen</span>
              </button>
              <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="cancel-shooting-resolution-draft" aria-label="Roll/result verwerfen" title="Roll/result verwerfen" ${isSetupActive ? 'disabled' : ''}>
                <span aria-hidden="true">&#10005;</span>
              </button>
            ` : hasDeclaredShotToResolve ? `
              <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="start-shooting-resolution-draft" aria-label="Roll/result starten" title="Expliziten verified protection input und deterministische D6-Werte eingeben">
                <span>Roll/Result</span>
              </button>
              ${canPassActiveShooter ? `
                <button class="ghost-button battlefield-command-action" type="button" data-action="pass-active-shooter" aria-label="Aktiven Shooter ueberspringen" title="Diesen Shooter ohne Schuss als abgeschlossen markieren">
                  <span>Pass</span>
                </button>
              ` : ''}
              <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="set-command-menu-branch" data-branch="" aria-label="Shoot branch schliessen" title="Shoot branch schliessen">
                <span aria-hidden="true">&#10005;</span>
              </button>
            ` : `
              <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-shooting-declaration" aria-label="Schuss deklarieren" title="Schuss deklarieren" ${isSetupActive || !canConfirmShootingDeclaration ? 'disabled' : ''}>
                <span>Schuss deklarieren</span>
              </button>
              ${canPassActiveShooter ? `
                <button class="ghost-button battlefield-command-action" type="button" data-action="pass-active-shooter" aria-label="Aktiven Shooter ueberspringen" title="Diesen Shooter ohne Schuss als abgeschlossen markieren">
                  <span>Pass</span>
                </button>
              ` : ''}
              <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="cancel-shooting-declaration-preview" aria-label="Schussvorschau verwerfen" title="Schussvorschau verwerfen" ${isSetupActive || !canCancelShootingDeclaration ? 'disabled' : ''}>
                <span aria-hidden="true">&#10005;</span>
              </button>
            `}
            ${shootingProcedureOverview ? `
              <div class="battlefield-command-diagnostics battlefield-command-why-card" data-testid="shooting-procedure-overview-card">
                <strong>Shooting Procedure</strong>
                <ul>
                  <li><strong>Ranged:</strong> ${shootingProcedureOverview.totalRangedUnits}</li>
                  <li><strong>Eligible:</strong> ${shootingProcedureOverview.eligibleUnits}</li>
                  <li><strong>Blocked:</strong> ${shootingProcedureOverview.blockedUnits}</li>
                  <li><strong>Done:</strong> ${shootingProcedureOverview.completedUnits}</li>
                </ul>
              </div>
            ` : ''}
            ${shootingSupportingShooters.length > 0 ? `
              <div class="battlefield-command-diagnostics battlefield-command-why-card" data-testid="shooting-support-card" data-support-target-unit-id="${shootingSupportTargetUnitId ?? ''}">
                <strong>Support Fire</strong>
                <ul>
                  <li><strong>Bonus:</strong> +${shootingSupportBonus}</li>
                  ${shootingSupportingShooters.map((supporter) => `
                    <li><strong>${supporter.label ?? supporter.id}:</strong> ${supporter.supportValueLabel}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            ${shootingResolutionPreview?.result ? `
              <div class="battlefield-command-diagnostics battlefield-command-why-card" data-testid="shooting-resolution-preview-card">
                <strong>Roll/Result Preview</strong>
                <ul>
                  <li><strong>Shooter:</strong> ${shootingResolutionPreview.result.shooterTotal}</li>
                  <li><strong>Target:</strong> ${shootingResolutionPreview.result.targetTotal}</li>
                  <li><strong>Cohesion:</strong> ${shootingResolutionPreview.result.cohesionLoss}</li>
                </ul>
              </div>
            ` : ''}
          ` : ''}
          ${showMeleeBranchActions ? `
            <button class="shell-button battlefield-command-action battlefield-command-action-confirm" type="button" data-action="open-melee-phase-procedure" aria-label="Melee Procedure Popup oeffnen">
              <span>Melee Popup</span>
            </button>
            <button class="ghost-button battlefield-command-action" type="button" data-action="preview-melee-batch" aria-label="Melee Preview erzeugen" ${meleeSelectionCount > 0 ? '' : 'disabled'}>
              <span>Preview</span>
            </button>
            <button class="ghost-button battlefield-command-action" type="button" data-action="apply-melee-batch" aria-label="Melee Batch anwenden" ${canApplyMeleeBatch ? '' : 'disabled'}>
              <span>Apply</span>
            </button>
          ` : ''}
          ${canStartAdjustedChargeDistanceRoll ? `
            <button class="shell-button battlefield-command-action battlefield-command-action-confirm" type="button" data-action="start-adjusted-charge-distance-roll" aria-label="Adjusted Charge-Distanz auswuerfeln" title="Deterministischen Folgewurf fuer die angepasste Charge-Distanz starten">
              <span>Adjusted Charge wuerfeln</span>
            </button>
          ` : ''}
          ${canResolveEvadeAvoidanceChoice ? evadeAvoidanceCandidates.map((candidate) => `
            <button class="ghost-button battlefield-command-action battlefield-command-action-confirm" type="button" data-action="select-evade-avoidance-choice" data-candidate-id="${candidate.id ?? ''}" data-side="${candidate.side ?? ''}" data-distance-ud="${candidate.distanceUd ?? candidate.spentDistanceUd ?? 0}" aria-label="${getEvadeAvoidanceChoiceLabel(candidate)}" title="${getEvadeAvoidanceChoiceLabel(candidate)}">
              <span>${getEvadeAvoidanceChoiceLabel(candidate)}</span>
            </button>
          `).join('') : ''}
          ${canResolveEvadeAvoidanceChoice && evadeChoicePathStepIds.length > 0 ? `
            <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="reset-evade-avoidance-path" aria-label="Knotenpfad zuruecksetzen" title="Aktiven Evade-Knotenpfad auf Wurzel zuruecksetzen">
              <span>Knotenpfad reset</span>
            </button>
          ` : ''}
          ${canResolveChargeContinuationChoice ? `
            <button class="ghost-button battlefield-command-action battlefield-command-action-confirm" type="button" data-action="resolve-charge-continuation-choice" data-option="${CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP}" aria-label="Bei Mindestvorlauf stoppen" title="Bei ${formatLengthUd(minimumChargeContinuationDistanceUd)} UD Mindestvorlauf stoppen">
              <span>Stop at ${formatLengthUd(minimumChargeContinuationDistanceUd)} UD</span>
            </button>
            <button class="shell-button battlefield-command-action battlefield-command-action-confirm" type="button" data-action="resolve-charge-continuation-choice" data-option="${CHARGE_MOVEMENT_CONTINUATION_DECISIONS.CONTINUE}" aria-label="Volle Charge fortsetzen" title="Bis ${formatLengthUd(maximumChargeContinuationDistanceUd)} UD voll weiterziehen">
              <span>Continue to ${formatLengthUd(maximumChargeContinuationDistanceUd)} UD</span>
            </button>
          ` : ''}
          ${!showShootingCommandActions ? `
          <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-movement" aria-label="${confirmActionLabel}" title="${confirmActionTitle}" ${isSetupActive || !canConfirmMovement ? 'disabled' : ''}>
            <span>${confirmActionLabel}</span>
          </button>
          <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="cancel-movement-preview" aria-label="Vorschau verwerfen" title="Vorschau verwerfen" ${isSetupActive || !canCancelMovement ? 'disabled' : ''}>
            <span aria-hidden="true">&#10005;</span>
          </button>
          ` : ''}
        </div>
        ` : ''}
        ${canUseFreeCommandPoint ? `
          <label class="battlefield-command-free-cp-toggle">
            <input type="checkbox" data-action="toggle-use-free-command-point" ${useFreeCommandPoint ? 'checked' : ''} />
            Freien CP fuer diese Kommandeursbewegung nutzen
          </label>
        ` : ''}
        ${canToggleCommanderEngagedDiagnostic ? `
          <label class="battlefield-command-free-cp-toggle battlefield-command-diagnostic-toggle">
            <input type="checkbox" data-action="toggle-commander-engaged-diagnostic" ${commanderEngagedDiagnosticActive ? 'checked' : ''} />
            Diagnosefall: aktiven Kommandeur als im Nahkampf markieren
          </label>
        ` : ''}
        ${selectionLockActive ? `
          <div class="battlefield-validation-callout is-warning battlefield-command-selection-lock">
            <strong>Auswahl fixiert</strong>
            <span>${selectionLockCopy}</span>
          </div>
        ` : ''}
        ${!isSetupActive && roundState?.roundPhase === 'corps-movement' && roundState?.dialog?.type === null ? `
          <div class="battlefield-command-round-actions">
            <button class="ghost-button battlefield-command-button" type="button" data-action="request-next-corps">
              Naechstes Corps
            </button>
          </div>
        ` : ''}
      </div>
      ${helperSection}
    </div>
  `;
}
