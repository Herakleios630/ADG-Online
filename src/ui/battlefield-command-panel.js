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
import { getRemainingAdvanceBudgetUd } from '../state/p0-advance.js';
import { canUseFreeCommandPointForCurrentOrder, doesMovementPreviewContainCommand, getSlideQualifiedMovementDistanceUd } from '../state/p0-movement.js';
import { hasUnitUsedSlideThisMovementPhase, isSlideAvailableForUnit } from '../state/p0-slide.js';

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatAngleDegrees(angleRadians) {
  const degrees = angleRadians * (180 / Math.PI);
  return Number.isInteger(degrees) ? String(degrees) : degrees.toFixed(1);
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
  const helperCopy = selectedUnit
    ? canDragUnitsInSetup
      ? 'Im Aufstellungsbereich kann die ausgewaehlte Einheit frei gezogen werden. Advance bleibt bis Kampfbeginn gesperrt.'
      : isSetupActive
        ? 'Während des Setups bleiben Advance-Befehle gesperrt.'
        : movementPreview.status === 'rejected'
          ? movementPreview.explanations[0] || 'Movement preview is blocked.'
          : slideModeActive
            ? slideQualifiedDistanceUd >= 1
              ? 'Slide aktiv. Ziehe die Einheit oder den aktiven Ghost seitlich bis maximal 1 UD. Der seitliche Anteil ist in dieser P4-Regelannahme kostenlos.'
              : `Slide aktiv. Seitliche Bewegung bis 1 UD ist in dieser P4-Regelannahme kostenlos, aber Confirm bleibt gesperrt, bis die Kette mindestens 1 UD Advance- oder Wheel-Bewegung enthaelt. Aktuell: ${formatLengthUd(slideQualifiedDistanceUd)} UD qualifizierende Bewegung.`
          : hasUnitUsedSlideThisMovementPhase(selectedUnit)
            ? 'Diese Einheit hat in der aktuellen Movement-Phase bereits ihren einen erlaubten Slide verbraucht.'
          : previewContainsSlide
            ? 'Die aktuelle Bewegungskette enthaelt bereits einen Slide. Ein zweiter Slide ist in derselben Movement-Phase nicht erlaubt.'
          : wheelModeActive
            ? !state.game.wheelPivotSide
              ? 'Wheel-Modus aktiv. Greife eine der beiden vorderen Ecken und ziehe sie nach vorn. Die gegenueberliegende vordere Ecke bleibt fest.'
              : `Wheel ${state.game.wheelPivotSide === 'left' ? 'um die linke feste Ecke' : 'um die rechte feste Ecke'} nutzt fuer P4 die vereinfachte Einzelbasis-Messung: 90 Grad = 1.5 UD. Aktuell: ${formatAngleDegrees(wheelPreviewAngleRadians)} Grad / ${formatLengthUd(wheelDistanceUd)} UD.`
          : commanderAttachPreview?.status === 'targeting'
            ? `Attach aktiv. Waehle eine eigene Einheit im markierten Radius von ${formatLengthUd(Math.max(0, 5 - Number(commanderAttachPreview?.nextSpentUd ?? selectedUnit?.advanceUsedUd ?? 0)))} UD. Der General-Ghost wird dann hinter der Einheit vorbereitet.`
          : commanderAttachPreview?.status === 'ready'
            ? 'Attach-Vorschau bereit. Bestaetigen haengt den General an die gewaehte Einheit an; danach bewegt er sich mit ihr mit.'
          : selectedUnit && (Number(selectedUnit.advanceUsedUd ?? 0) > 0 || Boolean(selectedUnit.slideUsedThisMovementPhase) || Boolean(selectedUnit.stayedThisMovementPhase))
            ? 'Diese Einheit ist fuer die aktuelle Movement-Phase bereits beendet. Du kannst sie noch auswaehlen und bei Bedarf zuruecksetzen, aber keine weiteren Bewegungsbefehle mehr geben.'
          : isFreeCommander
            ? 'General frei ziehen (Ghost) und mit Bestaetigen uebernehmen. Maximal 5 UD pro Movement-Phase.'
            : movementBudgetSubset?.troopType === 'heavy-infantry'
              ? `Advance zieht die Einheit innerhalb des aktuellen P6-Budgets von maximal ${formatLengthUd(maxAdvanceUd)} UD. ${movementBudgetSubset.operationalZoneText}`
              : `Advance zieht die Einheit innerhalb des aktuellen P6-Budgets von maximal ${formatLengthUd(maxAdvanceUd)} UD fuer ${movementBudgetSubset?.troopType ?? 'diese Einheit'}.`
    : 'Waehle zuerst die Testeinheit aus.';
  const hasPendingCommanderPreview = Boolean(
    commanderFreeMovePreview?.status !== 'idle'
      && commanderFreeMovePreview.unitId === selectedUnit?.id,
  );
  const hasPendingMovementPreview = movementPreview.status !== 'idle' && movementPreview.segments.length > 0;
  const selectionLockActive = Boolean(selectedUnit && (hasPendingCommanderPreview || hasPendingMovementPreview));
  const selectionLockCopy = selectionLockActive
    ? 'Auswahl gesperrt: Diese Einheit hat eine laufende, noch nicht bestaetigte Bewegung. Erst bestaetigen, abbrechen oder resetten.'
    : '';
  const canConfirmMovement = Boolean(
    commanderFreeMovePreview?.status === 'ready'
      && commanderFreeMovePreview.unitId === selectedUnit?.id,
  ) || state.game.movement.confirmation.status === 'ready';
  const canCancelMovement = hasPendingCommanderPreview
    || Boolean(state.game.movement.selectedCommandId)
    || movementPreview.status !== 'idle'
    || advanceModeActive
    || slideModeActive
    || wheelModeActive;
  const diagnostics = state.game.movement.validationSnapshot?.diagnostics ?? [];
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
    helperCopy,
    diagnostics,
    canCancelMovement,
    canConfirmMovement,
    selectionLockActive,
    selectionLockCopy,
    canMarkStay,
    canShowMovementButtons,
    canUseFreeCommandPoint,
    useFreeCommandPoint,
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
  canToggleCommanderEngagedDiagnostic = false,
  commanderEngagedDiagnosticActive = false,
  canAttachCommander = false,
  movementBudgetLabel = 'P6-Budget',
}) {
  const isReadySetupStep = setupStepId === 'ready';
  const setupPrimaryLabel = isReadySetupStep ? 'In die Schlacht' : 'Naechster Schritt';

  if (isSetupActive) {
    return `
      <div class="battlefield-placeholder-card battlefield-setup-primary-card">
        <strong>Befehle</strong>
        <div class="battlefield-command-primary">
          <div class="battlefield-command-round-actions battlefield-command-round-actions-setup-top">
            <button class="shell-button battlefield-command-button" type="button" data-action="${isReadySetupStep ? 'complete-setup' : 'setup-next'}">
              ${setupPrimaryLabel}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const selectedUnitSummary = selectedUnit ? `
    <div class="battlefield-command-summary">
      <span>Distanz: ${formatLengthUd(wheelModeActive ? wheelDistanceUd : slideModeActive ? slidePreviewUd : advancePreviewUd)} UD / ${formatLengthUd((wheelModeActive ? wheelDistanceUd : slideModeActive ? slidePreviewUd : advancePreviewUd) * 4)} cm</span>
      <span>Preview gesamt: ${formatLengthUd(previewDistanceUd)} UD / ${formatLengthUd(previewDistanceUd * 4)} cm</span>
      <span>${movementBudgetLabel}: ${formatLengthUd(remainingAdvanceBudgetUd)} UD / ${formatLengthUd(remainingAdvanceBudgetUd * 4)} cm verbleibend</span>
    </div>
  ` : '';

  const helperSection = `
    <details class="battlefield-collapsible-card battlefield-command-details">
      <summary class="battlefield-collapsible-summary">
        <strong>Hinweise</strong>
        <span>${selectedUnit ? 'Details' : 'Auswahl'}</span>
      </summary>
      <div class="battlefield-collapsible-body">
        ${selectedUnitSummary}
        <span class="muted-copy">${helperCopy}</span>
        ${selectedUnit ? `
          <div class="battlefield-command-diagnostics">
            <strong>Diagnostics</strong>
            <ul>
              ${diagnostics.map((item) => `
                <li><strong>${item.label}:</strong> ${item.status} - ${item.text}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </details>
  `;

  return `
    <div class="battlefield-placeholder-card">
      <strong>Befehle</strong>
      <div class="battlefield-command-primary">
        <div class="battlefield-command-grid">
          ${canShowMovementButtons ? `
            <button class="shell-button battlefield-command-button ${advanceModeActive ? 'is-active' : ''}" type="button" data-action="toggle-advance-mode" ${canIssueMovementCommands && (advanceModeActive || maxAdvanceUd > 0) ? '' : 'disabled'}>Advance</button>
            <button class="shell-button battlefield-command-button ${wheelModeActive ? 'is-active' : ''}" type="button" data-action="toggle-wheel-mode" ${canIssueMovementCommands && (wheelModeActive || remainingAdvanceBudgetUd > 0) ? '' : 'disabled'}>Wheel</button>
            <button class="shell-button battlefield-command-button ${slideModeActive ? 'is-active' : ''}" type="button" data-action="toggle-slide-mode" ${canIssueMovementCommands && (slideModeActive || slideAvailable) ? '' : 'disabled'}>Slide</button>
          ` : ''}
          <button class="ghost-button battlefield-command-button" type="button" data-action="mark-unit-stay" ${canMarkStay ? '' : 'disabled'}>Stay</button>
          <button class="ghost-button battlefield-command-button" type="button" data-action="attach-commander" ${canAttachCommander ? '' : 'disabled'}>Kommandeur anhaengen</button>
          <button class="ghost-button battlefield-command-button" type="button" data-action="reset-test-units" ${isSetupActive || !selectedUnit ? 'disabled' : ''}>Einheit zuruecksetzen</button>
        </div>
        <div class="battlefield-command-actions">
          <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-movement" aria-label="Bewegung beenden" title="Bewegung beenden" ${isSetupActive || !canConfirmMovement ? 'disabled' : ''}>
            <span>Bewegung beenden</span>
          </button>
          <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="cancel-movement-preview" aria-label="Vorschau verwerfen" title="Vorschau verwerfen" ${isSetupActive || !canCancelMovement ? 'disabled' : ''}>
            <span aria-hidden="true">&#10005;</span>
          </button>
        </div>
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