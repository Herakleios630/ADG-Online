import { addVectors, getAxesFromRotation, scaleVector } from '../engine/geometry/index.js';
import {
  getCommittedMovementPreviewSegments,
  getLastCommittedMovementPreviewSegment,
  getMovementPreviewEndPose,
  getMovementPreviewResolvedDistanceUd,
  getMovementPreviewSpentBudgetUd,
} from '../engine/movement/index.js';
import { getWheelDistanceUdForAngleRadians } from '../engine/movement/wheel.js';
import { getRemainingAdvanceBudgetUd } from '../state/p0-advance.js';
import { doesMovementPreviewContainCommand, getSlideQualifiedMovementDistanceUd } from '../state/p0-movement.js';
import { hasUnitUsedSlideThisMovementPhase, isSlideAvailableForUnit } from '../state/p0-slide.js';

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatAngleDegrees(angleRadians) {
  const degrees = angleRadians * (180 / Math.PI);
  return Number.isInteger(degrees) ? String(degrees) : degrees.toFixed(1);
}

export function getAdvancePreviewPresentation({ state, selectedUnit, isSetupActive, canDragUnitsInSetup, battlefieldProfile }) {
  const advanceModeActive = state.game.advanceModeActive && Boolean(selectedUnit);
  const slideModeActive = state.game.slideModeActive && Boolean(selectedUnit);
  const wheelModeActive = state.game.wheelModeActive && Boolean(selectedUnit);
  const advancePreviewUd = selectedUnit ? state.game.advancePreviewUd : 0;
  const slidePreviewUd = selectedUnit ? state.game.slidePreviewUd : 0;
  const wheelPreviewAngleRadians = selectedUnit ? state.game.wheelPreviewAngleRadians : 0;
  const movementPreview = state.game.movement.preview;
  const committedSegments = getCommittedMovementPreviewSegments(movementPreview);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(movementPreview);
  const baseAdvanceSegments = lastCommittedSegment?.commandId === 'advance' && movementPreview.status === 'accepted'
    ? committedSegments.slice(0, -1)
    : committedSegments;
  const previewDistanceUd = getMovementPreviewResolvedDistanceUd(movementPreview);
  const previewSpentBudgetUd = getMovementPreviewSpentBudgetUd(movementPreview);
  const slideQualifiedDistanceUd = getSlideQualifiedMovementDistanceUd(movementPreview);
  const previewContainsSlide = doesMovementPreviewContainCommand(movementPreview, 'slide');
  const slideAvailable = selectedUnit ? isSlideAvailableForUnit(selectedUnit, movementPreview) : false;
  const baseAdvancePreviewSpentBudgetUd = getMovementPreviewSpentBudgetUd({
    status: 'accepted',
    segments: baseAdvanceSegments,
  });
  const remainingAdvanceBudgetUd = selectedUnit
    ? Math.max(0, getRemainingAdvanceBudgetUd(selectedUnit) - previewSpentBudgetUd)
    : 4;
  const maxAdvanceUd = selectedUnit
    ? Math.max(0, getRemainingAdvanceBudgetUd(selectedUnit) - baseAdvancePreviewSpentBudgetUd)
    : 4;
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
          : `Advance zieht die Einheit frei vorwaerts innerhalb des verbleibenden P0-Budgets von maximal ${formatLengthUd(maxAdvanceUd)} UD.`
    : 'Waehle zuerst die Testeinheit aus.';
  const canConfirmMovement = state.game.movement.confirmation.status === 'ready';
  const canCancelMovement = Boolean(state.game.movement.selectedCommandId)
    || movementPreview.status !== 'idle'
    || advanceModeActive
    || slideModeActive
    || wheelModeActive;
  const diagnostics = state.game.movement.validationSnapshot?.diagnostics ?? [];

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
  };
}

export function renderAdvanceCommandPanel({
  selectedUnit,
  isSetupActive,
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
}) {
  return `
    <div class="battlefield-placeholder-card">
      <strong>Befehle</strong>
      ${selectedUnit ? `
        <span>Distanz: ${formatLengthUd(wheelModeActive ? wheelDistanceUd : slideModeActive ? slidePreviewUd : advancePreviewUd)} UD / ${formatLengthUd((wheelModeActive ? wheelDistanceUd : slideModeActive ? slidePreviewUd : advancePreviewUd) * 4)} cm</span>
        <span>Preview gesamt: ${formatLengthUd(previewDistanceUd)} UD / ${formatLengthUd(previewDistanceUd * 4)} cm</span>
        <span>Restbudget: ${formatLengthUd(remainingAdvanceBudgetUd)} UD / ${formatLengthUd(remainingAdvanceBudgetUd * 4)} cm</span>
        <span class="muted-copy">${helperCopy}</span>
        <div class="battlefield-command-diagnostics">
          <strong>Diagnostics</strong>
          <ul>
            ${diagnostics.map((item) => `
              <li><strong>${item.label}:</strong> ${item.status} - ${item.text}</li>
            `).join('')}
          </ul>
        </div>
      ` : `
        <span>${helperCopy}</span>
      `}
    </div>
    <div class="battlefield-command-grid">
      <button class="shell-button battlefield-command-button ${advanceModeActive ? 'is-active' : ''}" type="button" data-action="toggle-advance-mode" ${canIssueMovementCommands && (advanceModeActive || maxAdvanceUd > 0) ? '' : 'disabled'}>Advance</button>
      <button class="shell-button battlefield-command-button ${wheelModeActive ? 'is-active' : ''}" type="button" data-action="toggle-wheel-mode" ${canIssueMovementCommands && (wheelModeActive || remainingAdvanceBudgetUd > 0) ? '' : 'disabled'}>Wheel</button>
      <button class="shell-button battlefield-command-button ${slideModeActive ? 'is-active' : ''}" type="button" data-action="toggle-slide-mode" ${canIssueMovementCommands && (slideModeActive || slideAvailable) ? '' : 'disabled'}>Slide</button>
      <button class="ghost-button battlefield-command-button" type="button" data-action="reset-test-units" ${isSetupActive ? 'disabled' : ''}>Reset</button>
      <span class="battlefield-command-slot"></span>
    </div>
    <div class="battlefield-command-actions">
      <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-movement" aria-label="Bestaetigen" title="Bestaetigen" ${isSetupActive || !canConfirmMovement ? 'disabled' : ''}>
        <span aria-hidden="true">&#10003;</span>
      </button>
      <button class="ghost-button battlefield-command-action battlefield-command-action-reset" type="button" data-action="cancel-movement-preview" aria-label="Vorschau verwerfen" title="Vorschau verwerfen" ${isSetupActive || !canCancelMovement ? 'disabled' : ''}>
        <span aria-hidden="true">&#10005;</span>
      </button>
    </div>
  `;
}