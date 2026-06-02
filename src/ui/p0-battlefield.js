import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { getShootingProfileForUnit } from '../data/unit-profiles.js';
import {
  classifyFacingRelationship,
  getAxesFromRotation,
  localPointToWorldPoint,
} from '../engine/geometry/index.js';
import { getCommittedMovementPreviewSegments, getMovementPreviewEndPose } from '../engine/movement/index.js';
import { projectSetupForViewer } from '../engine/visibility/setup-view.js';
import {
  canAttachCommanderToUnit,
  canStartCommanderAttach,
  getCommanderAttachRemainingUd,
  SETUP_STEP_DEFINITIONS,
} from '../state/p0-state.js';
import {
  getMeleeCohesionMarkerStateByUnitId,
  getMeleeParticipationByUnitId,
} from './melee-v2-adapter.js';
import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_PREVIEW_STATUSES,
} from '../engine/charge/index.js';
import {
  getAdvancePreviewPresentation,
  renderAdvanceCommandPanel,
} from './battlefield-command-panel.js';
import { renderBattlefieldRightPanel } from './battlefield-side-panel.js';
import {
  createMovementReferenceUnit,
  getActiveCommanderRangeVisualization,
  renderCommandStatusLine,
  renderMostThreateningLine,
  renderNearZocCue,
  renderZocBands,
} from './battlefield-command-overlays.js';
import {
  renderChargeBranchDistanceDialog,
  renderChargeReactionDialog,
  renderEvadeInitialBranchChoiceDialog,
  renderEvadeChoiceHandoffDialog,
  renderMeleeResolutionDialog,
  renderRoundDialog,
  renderShootingResolutionDialog,
  renderSetupGuideDialog,
} from './battlefield-dialogs.js';
import { evaluateShootingGeometry } from '../engine/shooting/geometry.js';
import {
  getEvadeChoiceTree,
  getEvadeRenderablePathSegments,
  renderEvadeChoiceGhosts,
  renderEvadeChoiceHandles,
  renderEvadePathReaches,
  renderEvadePathTrails,
} from './battlefield-evade-overlays.js';
import {
  createLinearReachStyle,
  createPreviewBadgeStyle,
  createPreviewGhostStyle,
  createWheelHandleStyle,
  escapeHtml,
  formatLengthUd,
} from './battlefield-render-helpers.js';
import {
  renderAmbushMarkerShells,
  renderAmbushMarkersPanel,
  renderBattlePlanBoard,
  renderDeploymentSetupCard,
  renderSetupObjectPalette,
  renderSetupObjects,
  renderTerrainPalette,
  renderTerrainPlaceholders,
  renderTerrainValidation,
} from './battlefield-setup-panels.js';
import {
  formatRelationshipLabel,
  renderDeploymentOverlay,
  renderFacingGeometryOverlay,
  renderSectorOverlay,
} from './battlefield-surface-overlays.js';
import {
  renderUnitVisualLayer,
  resolveRenderableVisualProfile,
  toCorpsSlotId,
  toUnitCssToken,
} from './battlefield-unit-visuals.js';

function createChargeMovementPlanSegment(chargeMovementPlan) {
  if (!chargeMovementPlan?.startPose || !Number.isFinite(chargeMovementPlan?.distanceUd)) {
    return null;
  }

  return {
    xUd: chargeMovementPlan.startPose.xUd,
    yUd: chargeMovementPlan.startPose.yUd,
    rotationRadians: chargeMovementPlan.frozenDirectionRadians ?? chargeMovementPlan.startPose.rotationRadians ?? 0,
    distanceUd: chargeMovementPlan.distanceUd,
  };
}

function getLinearSegmentEndPose(segment) {
  const forwardAxis = getAxesFromRotation(segment.rotationRadians ?? 0).forwardAxis;

  return {
    xUd: segment.xUd + (forwardAxis.x * (segment.distanceUd ?? 0)),
    yUd: segment.yUd + (forwardAxis.y * (segment.distanceUd ?? 0)),
    rotationRadians: segment.rotationRadians ?? 0,
  };
}

function getRenderableUnitDebugLabel(unit, unitIndex) {
  if (!unit) {
    return '';
  }

  return String(unitIndex + 1);
}

function renderCohesionMarkerLayer(markerState) {
  if (!markerState) {
    return '';
  }

  const committedLossCount = Number(markerState.committedLossCount ?? 0);
  const pendingLossCount = Number(markerState.pendingLossCount ?? 0);
  if (committedLossCount <= 0 && pendingLossCount <= 0) {
    return '';
  }

  const committedMarkers = Array.from(
    { length: committedLossCount },
    () => '<span class="battlefield-cohesion-marker is-committed" aria-hidden="true"></span>',
  ).join('');
  const pendingMarkers = Array.from(
    { length: pendingLossCount },
    () => '<span class="battlefield-cohesion-marker is-pending" aria-hidden="true"></span>',
  ).join('');

  return `<span class="battlefield-cohesion-marker-layer" aria-hidden="true" data-cohesion-committed-losses="${committedLossCount}" data-cohesion-pending-losses="${pendingLossCount}" data-cohesion-status="${escapeHtml(markerState.status ?? '')}">${committedMarkers}${pendingMarkers}</span>`;
}

function createShootingSupportLineStyle(fromUnit, toUnit, battlefieldProfile) {
  if (!fromUnit || !toUnit || !battlefieldProfile) {
    return '';
  }

  const deltaX = Number(toUnit.xUd ?? 0) - Number(fromUnit.xUd ?? 0);
  const deltaY = Number(toUnit.yUd ?? 0) - Number(fromUnit.yUd ?? 0);
  const distanceUd = Math.hypot(deltaX, deltaY);
  const angleRadians = Math.atan2(deltaY, deltaX);

  return [
    `left:${(Number(fromUnit.xUd ?? 0) / battlefieldProfile.widthUd) * 100}%`,
    `top:${(Number(fromUnit.yUd ?? 0) / battlefieldProfile.heightUd) * 100}%`,
    `width:${(distanceUd / battlefieldProfile.widthUd) * 100}%`,
    `transform:rotate(${angleRadians}rad)`,
  ].join(';');
}

function createShootingPriorityLineStyle(fromUnit, toUnit, battlefieldProfile) {
  if (!fromUnit || !toUnit || !battlefieldProfile) {
    return '';
  }

  const deltaX = Number(toUnit.xUd ?? 0) - Number(fromUnit.xUd ?? 0);
  const deltaY = Number(toUnit.yUd ?? 0) - Number(fromUnit.yUd ?? 0);
  const distanceUd = Math.hypot(deltaX, deltaY);
  const angleRadians = Math.atan2(deltaY, deltaX);

  return [
    `left:${(Number(fromUnit.xUd ?? 0) / battlefieldProfile.widthUd) * 100}%`,
    `top:${(Number(fromUnit.yUd ?? 0) / battlefieldProfile.heightUd) * 100}%`,
    `width:${(distanceUd / battlefieldProfile.widthUd) * 100}%`,
    `transform:rotate(${angleRadians}rad)`,
  ].join(';');
}

function createShootingZoneOverlayStyle(shooterUnit, zoneBounds, battlefieldProfile) {
  if (!shooterUnit || !zoneBounds || !battlefieldProfile) {
    return '';
  }

  const localCenter = {
    x: (Number(zoneBounds.minX ?? 0) + Number(zoneBounds.maxX ?? 0)) / 2,
    y: (Number(zoneBounds.minY ?? 0) + Number(zoneBounds.maxY ?? 0)) / 2,
  };
  const worldCenter = localPointToWorldPoint({
    center: { x: Number(shooterUnit.xUd ?? 0), y: Number(shooterUnit.yUd ?? 0) },
    widthUd: Number(shooterUnit.widthUd ?? 0),
    depthUd: Number(shooterUnit.depthUd ?? 0),
    rotationRadians: Number(shooterUnit.rotationRadians ?? 0),
  }, localCenter);
  const zoneWidthUd = Number(zoneBounds.maxX ?? 0) - Number(zoneBounds.minX ?? 0);
  const zoneDepthUd = Number(zoneBounds.maxY ?? 0) - Number(zoneBounds.minY ?? 0);

  return [
    `left:${(worldCenter.x / battlefieldProfile.widthUd) * 100}%`,
    `top:${(worldCenter.y / battlefieldProfile.heightUd) * 100}%`,
    `width:${(zoneWidthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(zoneDepthUd / battlefieldProfile.heightUd) * 100}%`,
    `transform:translate(-50%, -50%) rotate(${Number(shooterUnit.rotationRadians ?? 0)}rad)`,
  ].join(';');
}

function createShootingSupportBadgeStyle(unit, battlefieldProfile) {
  if (!unit || !battlefieldProfile) {
    return '';
  }

  return [
    `left:${(Number(unit.xUd ?? 0) / battlefieldProfile.widthUd) * 100}%`,
    `top:${(Number(unit.yUd ?? 0) / battlefieldProfile.heightUd) * 100}%`,
  ].join(';');
}

function createTableExitBadgeStyle({ tableExit, fallbackPose, battlefieldProfile }) {
  if (!tableExit?.exitsTable || !battlefieldProfile) {
    return '';
  }

  const edge = Array.isArray(tableExit.exitEdges) ? tableExit.exitEdges[0] : null;
  const clampedX = Math.min(battlefieldProfile.widthUd - 0.4, Math.max(0.4, Number(fallbackPose?.xUd ?? battlefieldProfile.widthUd / 2)));
  const clampedY = Math.min(battlefieldProfile.heightUd - 0.4, Math.max(0.4, Number(fallbackPose?.yUd ?? battlefieldProfile.heightUd / 2)));
  let pose = { xUd: clampedX, yUd: clampedY };

  if (edge === 'north') {
    pose = { xUd: clampedX, yUd: 0.4 };
  } else if (edge === 'south') {
    pose = { xUd: clampedX, yUd: battlefieldProfile.heightUd - 0.4 };
  } else if (edge === 'west') {
    pose = { xUd: 0.4, yUd: clampedY };
  } else if (edge === 'east') {
    pose = { xUd: battlefieldProfile.widthUd - 0.4, yUd: clampedY };
  }

  return createPreviewBadgeStyle(pose, battlefieldProfile);
}

function getPreferredConformationCandidate(conformationPlan) {
  if (!conformationPlan) {
    return null;
  }

  return (conformationPlan.candidates ?? []).find((candidate) => candidate.id === conformationPlan.selectedCandidateId)
    ?? conformationPlan.candidates?.[0]
    ?? null;
}

function getPreviewSourceStatusClass(sourceStatus) {
  return sourceStatus === 'needs-source-check' || sourceStatus === 'errata-check'
    ? 'is-source-open'
    : '';
}

function getActiveCorpsFrontStatus(activeCorpsStatusClass) {
  if (activeCorpsStatusClass === 'is-corps-unit-mandatory') {
    return 'mandatory';
  }

  if (activeCorpsStatusClass === 'is-corps-unit-done') {
    return 'done';
  }

  if (activeCorpsStatusClass === 'is-corps-unit-pending') {
    return 'pending';
  }

  return '';
}

function getShootingProcedureFrontStatus(procedureStatus) {
  if (procedureStatus === 'blocked' || procedureStatus === 'source-open') {
    return 'mandatory';
  }

  if (procedureStatus === 'finished') {
    return 'done';
  }

  if (procedureStatus === 'active' || procedureStatus === 'waiting') {
    return 'pending';
  }

  return '';
}

function getMeleeProcedureFrontStatus(meleeStatus) {
  if (meleeStatus === 'main-defender-resolved' || meleeStatus === 'resolved') {
    return 'done';
  }

  if (meleeStatus === 'main-defender-pending' || meleeStatus === 'pending') {
    return 'pending';
  }

  return '';
}

function formatMeleeDebugCountLine(meleeDebugCounts) {
  return [
    `pending:${meleeDebugCounts.pending}`,
    `resolved:${meleeDebugCounts.resolved}`,
    `support:${meleeDebugCounts.support}`,
    `non:${meleeDebugCounts.nonMelee}`,
  ].join(' | ');
}

export function renderBattlefieldScreen(state) {
  const visibleSetup = projectSetupForViewer(state.game.setup, state.game.setupViewMode);
  const renderState = {
    ...state,
    game: {
      ...state.game,
      setup: visibleSetup,
    },
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const overlayHotkey = state.shell.settings.keyBindings.overlayCycle.primary || 'Nicht belegt';
  const showScaleOverlay = state.shell.settings.showScaleOverlay;
  const viewport = state.game.viewport;
  const testUnit = state.game.units[0];
  const isSetupActive = renderState.game.setup.isActive;
  const isTerrainStep = isSetupActive
    && (renderState.game.setup.currentStepId === 'terrain' || renderState.game.setup.currentStepId === 'terrain-adjustment');
  const isDeploymentSetupStep = isSetupActive
    && (renderState.game.setup.currentStepId === 'deployment' || renderState.game.setup.currentStepId === 'ready');
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
  const selectedUnitMovementFinished = Boolean(
    selectedUnit
      && (
        Number(selectedUnit.advanceUsedUd ?? 0) > 0
        || Boolean(selectedUnit.slideUsedThisMovementPhase)
        || Boolean(selectedUnit.stayedThisMovementPhase)
      )
  );
  const canIssueMovementCommands =
    !isSetupActive &&
    selectedUnit !== null &&
    state.game.commandContext.currentPhaseId === 'movement' &&
    selectedUnit.owner === state.game.commandContext.activePlayerId &&
    !selectedUnitMovementFinished &&
    state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.IDLE;
  const canDragUnitsInSetup = isSetupActive
    && (renderState.game.setup.currentStepId === 'deployment' || renderState.game.setup.currentStepId === 'ready');
  const {
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
    minimumChargeContinuationDistanceUd,
    maximumChargeContinuationDistanceUd,
    chargeWhyItems,
    canShowShootingButton,
    shootingProcedureStatus,
    activeShootingUnitId,
    shootingProcedureOverview,
    shootingSequenceHandoffPending,
    shootingSequenceHandoffKind,
    canOpenShootingSequenceHandoff,
    canPassActiveShooter,
    isActiveShootingUnit,
    shootingPreviewActive,
    shootingTargetingActive,
    canStartShootingDeclaration,
    canCancelShootingDeclaration,
    canConfirmShootingDeclaration,
    hasDeclaredShotToResolve,
    resolvedShotRecord,
    resolutionDraftActive,
    canStartShootingResolution,
    canConfirmShootingResolution,
    shootingResolutionDraft,
    shootingResolutionPreview,
    shootDisabledReason,
    shootingWhyItems,
    shootingTargetCandidates,
    shootingSupportingShooters,
    shootingSupportTargetUnitId,
    shootingSupportBonus,
    shootingFlowActive,
    commandMenuBranch,
    commandMenuLevel,
    confirmActionLabel,
    confirmActionTitle,
  } = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive,
    canDragUnitsInSetup,
    battlefieldProfile,
  });
  const showDeploymentOverlay = isDeploymentSetupStep
    || state.game.overlayMode === 'Aufstellungszonen'
    || state.game.overlayMode === 'Beides';
  const showSectorOverlay = state.game.overlayMode === 'Sektoren' || state.game.overlayMode === 'Beides';
  const committedPreviewSegments = getCommittedMovementPreviewSegments(state.game.movement.preview);
  const committedPreviewTrailSegments = committedPreviewSegments.slice(0, -1);
  const commanderGhostPose = selectedUnit
    && state.game.commanderFreeMovePreview?.status === 'ready'
    && state.game.commanderFreeMovePreview.unitId === selectedUnit.id
    && Number.isFinite(state.game.commanderFreeMovePreview.xUd)
    && Number.isFinite(state.game.commanderFreeMovePreview.yUd)
    ? {
        xUd: state.game.commanderFreeMovePreview.xUd,
        yUd: state.game.commanderFreeMovePreview.yUd,
        rotationRadians: selectedUnit.rotationRadians ?? 0,
      }
    : null;
  const commanderAttachTargetingActive = Boolean(
    selectedUnit
      && selectedUnit.isCommander
      && !selectedUnit.hasIncludedCommander
      && !selectedUnit.attachedUnitId
      && state.game.commanderFreeMovePreview?.status === 'targeting'
      && state.game.commanderFreeMovePreview?.mode === 'attach'
      && state.game.commanderFreeMovePreview?.unitId === selectedUnit.id,
  );
  const commanderAttachReachUd = commanderAttachTargetingActive
    ? getCommanderAttachRemainingUd(state.game, selectedUnit)
    : 0;
  const chargeTargetingActive = Boolean(
    state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.TARGETING
      && state.game.chargePreview?.intent?.unitId === selectedUnit?.id,
  );
  const chargePreviewActiveForSelectedUnit = Boolean(
    state.game.chargePreview?.status !== CHARGE_PREVIEW_STATUSES.IDLE
      && state.game.chargePreview?.intent?.unitId === selectedUnit?.id,
  );
  const showAllEnemyZocForChargePreview = Boolean(
    chargePreviewActiveForSelectedUnit
      && (
        state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.TARGETING
        || state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING
        || state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.READY
      ),
  );
  const chargeTargetCandidatesByUnitId = new Map(
    Array.isArray(state.game.chargePreview?.targetCandidates)
      ? state.game.chargePreview.targetCandidates.map((candidate) => [candidate.unitId, candidate])
      : [],
  );
  const shootingTargetCandidatesByUnitId = new Map(
    Array.isArray(shootingTargetCandidates)
      ? shootingTargetCandidates.map((candidate) => [candidate.unitId, candidate])
      : [],
  );
  const shootingProcedureStatusesByUnitId = new Map(
    Array.isArray(state.game.shooting?.procedure?.unitStatuses)
      ? state.game.shooting.procedure.unitStatuses.map((entry) => [entry.unitId, entry])
      : [],
  );
  if (activeShootingUnitId) {
    const currentStatus = shootingProcedureStatusesByUnitId.get(activeShootingUnitId) ?? null;
    if (currentStatus && currentStatus.status === 'waiting') {
      shootingProcedureStatusesByUnitId.set(activeShootingUnitId, {
        ...currentStatus,
        status: 'active',
      });
    }
  }
  const meleePhaseActive = !isSetupActive && state.game.commandContext.currentPhaseId === 'melee';
  const meleeParticipationByUnitId = meleePhaseActive
    ? getMeleeParticipationByUnitId(state.game)
    : new Map();
  const meleeCohesionMarkerStateByUnitId = getMeleeCohesionMarkerStateByUnitId(state.game);
  const meleeProcedureStatusesByUnitId = meleePhaseActive
    ? new Map(state.game.units.map((unit) => [unit.id, meleeParticipationByUnitId.get(unit.id)?.status ?? 'non-melee']))
    : new Map();
  const meleeDebugCounts = {
    pending: 0,
    resolved: 0,
    support: 0,
    nonMelee: 0,
  };
  if (meleePhaseActive) {
    state.game.units.forEach((unit) => {
      const status = meleeProcedureStatusesByUnitId.get(unit.id) ?? 'non-melee';
      if (status === 'main-defender-pending' || status === 'pending') {
        meleeDebugCounts.pending += 1;
        return;
      }

      if (status === 'main-defender-resolved' || status === 'resolved') {
        meleeDebugCounts.resolved += 1;
        return;
      }

      if (status === 'support-participant') {
        meleeDebugCounts.support += 1;
        return;
      }

      meleeDebugCounts.nonMelee += 1;
    });
  }
  const actionableMeleeUnitIds = meleePhaseActive
    ? state.game.units
      .filter((unit) => {
        const participation = meleeParticipationByUnitId.get(unit.id);
        return participation?.isSelectableInBattlefield === true;
      })
      .map((unit) => unit.id)
    : [];
  const selectedMeleeStatus = selectedUnit
    ? (meleeProcedureStatusesByUnitId.get(selectedUnit.id) ?? 'non-melee')
    : 'none';
  const shootingSupportTargetUnit = shootingSupportTargetUnitId
    ? state.game.units.find((unit) => unit.id === shootingSupportTargetUnitId) ?? null
    : null;
  const effectiveShootingOverlayTargetUnitId = state.game.shooting?.preview?.targetUnitId
    ?? state.game.shooting?.resolutionDraft?.targetUnitId
    ?? shootingSupportTargetUnitId
    ?? null;
  const effectiveShootingOverlayTargetUnit = effectiveShootingOverlayTargetUnitId
    ? state.game.units.find((unit) => unit.id === effectiveShootingOverlayTargetUnitId) ?? null
    : null;
  const selectedShootingGeometry = !isSetupActive
    && state.game.commandContext.currentPhaseId === 'shooting'
    && selectedUnit
    && (shootingPreviewActive || resolutionDraftActive || hasDeclaredShotToResolve)
      ? evaluateShootingGeometry({
        shooterUnit: selectedUnit,
        targetUnit: effectiveShootingOverlayTargetUnit,
        shootingProfile: getShootingProfileForUnit(selectedUnit),
      })
      : null;
  const shootingPriorityOverlayMarkup = selectedUnit && effectiveShootingOverlayTargetUnit
    ? `
      <span
        class="battlefield-shooting-priority-line"
        aria-hidden="true"
        data-shooting-priority-line
        data-shooter-unit-id="${selectedUnit.id}"
        data-target-unit-id="${effectiveShootingOverlayTargetUnit.id}"
        style="${createShootingPriorityLineStyle(selectedUnit, effectiveShootingOverlayTargetUnit, battlefieldProfile)}"
      ></span>
    `
    : '';
  const shootingZoneOverlayMarkup = selectedShootingGeometry?.zoneBounds
    && selectedShootingGeometry?.shootingZoneKind === 'normal-front-rectangle'
      ? `
        <span
          class="battlefield-shooting-zone-overlay"
          aria-hidden="true"
          data-shooting-zone-overlay
          data-shooter-unit-id="${selectedUnit.id}"
          style="${createShootingZoneOverlayStyle(selectedUnit, selectedShootingGeometry.zoneBounds, battlefieldProfile)}"
        ></span>
      `
      : '';
  const shootingSupportOverlayMarkup = shootingSupportTargetUnit && shootingSupportingShooters.length > 0
    ? shootingSupportingShooters.map((supporter) => {
      const supportUnit = state.game.units.find((unit) => unit.id === supporter.id) ?? null;
      if (!supportUnit) {
        return '';
      }

      return `
        <span
          class="battlefield-shooting-support-line"
          aria-hidden="true"
          data-support-shooter-unit-id="${supportUnit.id}"
          data-support-target-unit-id="${shootingSupportTargetUnit.id}"
          style="${createShootingSupportLineStyle(supportUnit, shootingSupportTargetUnit, battlefieldProfile)}"
        ></span>
        <span
          class="battlefield-shooting-support-badge"
          aria-hidden="true"
          data-support-shooter-badge="${supportUnit.id}"
          style="${createShootingSupportBadgeStyle(supportUnit, battlefieldProfile)}"
        >${supporter.supportValueLabel}</span>
      `;
    }).join('')
    : '';
  const chargeGuideSegment = selectedUnit && chargePreviewActiveForSelectedUnit
    ? (state.game.chargePreview?.pathSegments ?? []).find((segment) => segment.kind === 'charge-direction-guide') || null
    : null;
  const chargeContactEvent = chargePreviewActiveForSelectedUnit
    ? (state.game.chargePreview?.contactEvents ?? [])[0] ?? null
    : null;
  const chargeStartPose = chargePreviewActiveForSelectedUnit
    ? state.game.chargePreview?.intent?.startPose ?? null
    : null;
  const chargePreviewReachStyle = chargeGuideSegment && selectedUnit
    ? createLinearReachStyle(chargeGuideSegment, selectedUnit, battlefieldProfile)
    : '';
  const chargeGhostPose = chargeGuideSegment && selectedUnit
    ? getLinearSegmentEndPose(chargeGuideSegment)
    : null;
  const conformationPlan = chargePreviewActiveForSelectedUnit
    ? state.game.chargePreview?.conformationPlan ?? null
    : null;
  const selectedConformationCandidate = getPreferredConformationCandidate(conformationPlan);
  const conformationGhostPose = selectedUnit && selectedConformationCandidate?.finalPose
    ? selectedConformationCandidate.finalPose
    : null;
  const conformationBadgeStyle = conformationGhostPose
    ? createPreviewBadgeStyle(conformationGhostPose, battlefieldProfile)
    : '';
  const conformationStatusClass = getPreviewSourceStatusClass(
    selectedConformationCandidate?.sourceStatus ?? conformationPlan?.sourceStatus,
  );
  const conformationShiftGhosts = (chargePreviewActiveForSelectedUnit
    ? conformationPlan?.shiftingPlan?.steps ?? []
    : [])
    .map((step) => {
      const shiftedUnit = state.game.units.find((unit) => unit.id === step?.unitId) ?? null;
      if (!shiftedUnit || !step?.toPose) {
        return null;
      }

      return {
        shiftedUnit,
        toPose: step.toPose,
        direction: step.direction ?? 'unknown',
        sourceStatus: conformationPlan?.shiftingPlan?.sourceStatus ?? null,
      };
    })
    .filter(Boolean);
  const evadePlan = state.game.chargePreview?.evadePlan ?? null;
  const evadeMove = state.game.chargePreview?.evadeMove ?? null;
  const evadePlanUnit = evadePlan?.reactingUnitId
    ? state.game.units.find((unit) => unit.id === evadePlan.reactingUnitId) ?? null
    : null;
  const evadePlanPathSegments = getEvadeRenderablePathSegments(evadePlan);
  const evadeCommittedUnit = evadeMove?.status === 'committed' && evadeMove?.reactingUnitId
    ? state.game.units.find((unit) => unit.id === evadeMove.reactingUnitId) ?? null
    : null;
  const evadeCommittedPathSegments = evadeMove?.status === 'committed'
    ? getEvadeRenderablePathSegments(evadeMove)
    : [];
  const evadeChoiceTree = getEvadeChoiceTree({
    evadeAvoidanceCandidates,
    choicePathStepIds: evadeChoicePathStepIds,
  });
  const evadeReorientationStyle = evadePlan?.reorientedPose && evadePlanUnit
    ? createPreviewGhostStyle(evadePlan.reorientedPose, evadePlanUnit, battlefieldProfile)
    : '';
  const evadeCommittedHalfTurnBadgeStyle = evadeMove?.status === 'committed'
    && evadeMove?.endHalfTurnHook?.applied
    && evadeMove?.finalPose
    ? createPreviewBadgeStyle(evadeMove.finalPose, battlefieldProfile)
    : '';
  const evadeCommittedTableExitBadgeStyle = evadeMove?.status === 'committed'
    && evadeMove?.tableExit?.exitsTable
    ? createTableExitBadgeStyle({
      tableExit: evadeMove.tableExit,
      fallbackPose: evadeMove.finalPose ?? evadeMove.reorientedPose ?? evadeMove.startPose,
      battlefieldProfile,
    })
    : '';
  const chargeMovementPlan = state.game.chargePreview?.chargeMovementPlan ?? null;
  const chargeMovementPlanUnit = chargeMovementPlan?.chargingUnitId
    ? state.game.units.find((unit) => unit.id === chargeMovementPlan.chargingUnitId) ?? null
    : null;
  const chargeMovementPlanSegment = chargeMovementPlan && chargeMovementPlanUnit
    ? createChargeMovementPlanSegment(chargeMovementPlan)
    : null;
  const chargeMovementPlanReachStyle = chargeMovementPlanSegment && chargeMovementPlanUnit
    ? createLinearReachStyle(chargeMovementPlanSegment, chargeMovementPlanUnit, battlefieldProfile)
    : '';
  const chargeContinuationMinimumSegment = chargeMovementPlan?.continuationChoice?.required
    && !chargeMovementPlan?.continuationChoice?.selectedOption
    && chargeMovementPlan?.continuationChoice?.minimumEndPose
    && chargeMovementPlanUnit
    ? createChargeMovementPlanSegment({
      ...chargeMovementPlan,
      distanceUd: chargeMovementPlan.continuationChoice.minimumDistanceUd,
    })
    : null;
  const chargeContinuationMinimumReachStyle = chargeContinuationMinimumSegment && chargeMovementPlanUnit
    ? createLinearReachStyle(chargeContinuationMinimumSegment, chargeMovementPlanUnit, battlefieldProfile)
    : '';
  const chargeContinuationMinimumBadgeStyle = chargeMovementPlan?.continuationChoice?.required
    && !chargeMovementPlan?.continuationChoice?.selectedOption
    && chargeMovementPlan?.continuationChoice?.minimumEndPose
    ? createPreviewBadgeStyle(chargeMovementPlan.continuationChoice.minimumEndPose, battlefieldProfile)
    : '';
  const commanderAttachRangeStyle = commanderAttachTargetingActive
    ? [
        `left:${(selectedUnit.xUd / battlefieldProfile.widthUd) * 100}%`,
        `top:${(selectedUnit.yUd / battlefieldProfile.heightUd) * 100}%`,
        `width:${((commanderAttachReachUd * 2) / battlefieldProfile.widthUd) * 100}%`,
        `height:${((commanderAttachReachUd * 2) / battlefieldProfile.heightUd) * 100}%`,
      ].join(';')
    : '';
  const movementReferenceUnit = createMovementReferenceUnit(selectedUnit, state.game.movement.preview, state.game.commanderFreeMovePreview);
  const wheelDisplayPose = wheelModeActive && selectedUnit
    ? getMovementPreviewEndPose(state.game.movement.preview, {
        xUd: selectedUnit.xUd,
        yUd: selectedUnit.yUd,
        rotationRadians: selectedUnit.rotationRadians ?? 0,
      })
    : chargePreviewActiveForSelectedUnit && state.game.chargePreview?.intent?.startManoeuvre?.type === 'wheel' && chargeStartPose
      ? chargeStartPose
    : null;
  const leftWheelHandlePoint = wheelDisplayPose && selectedUnit
    ? localPointToWorldPoint(
        {
          center: { x: wheelDisplayPose.xUd, y: wheelDisplayPose.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: wheelDisplayPose.rotationRadians,
        },
        { x: -(selectedUnit.widthUd / 2), y: selectedUnit.depthUd / 2 },
      )
    : null;
  const rightWheelHandlePoint = wheelDisplayPose && selectedUnit
    ? localPointToWorldPoint(
        {
          center: { x: wheelDisplayPose.xUd, y: wheelDisplayPose.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: wheelDisplayPose.rotationRadians,
        },
        { x: selectedUnit.widthUd / 2, y: selectedUnit.depthUd / 2 },
      )
    : null;
  const chargeWheelStartManoeuvre = state.game.chargePreview?.intent?.startManoeuvre?.type === 'wheel'
    ? state.game.chargePreview.intent.startManoeuvre
    : null;
  const chargeWheelAngleRadians = Number(chargeWheelStartManoeuvre?.wheelAngleRadians ?? 0);
  const highlightedWheelPivotSide = chargePreviewActiveForSelectedUnit && chargeWheelStartManoeuvre && chargeWheelAngleRadians > 1e-9
    ? chargeWheelStartManoeuvre.pivotSide
    : Number(wheelPreviewAngleRadians ?? 0) > 1e-9
      ? wheelPivotSide
      : null;
  const selectedUnitRotationRadians = selectedUnit?.rotationRadians ?? 0;
  const facingRelationship = state.game.debug.isActive && selectedUnit
    ? classifyFacingRelationship(
        {
          center: { x: selectedUnit.xUd, y: selectedUnit.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: selectedUnitRotationRadians,
          battlefieldProfileId: battlefieldProfile.id,
        },
        {
          center: {
            x: state.game.debug.unitPose.xUd,
            y: state.game.debug.unitPose.yUd,
          },
          widthUd: state.game.debug.unitDimensions.widthUd,
          depthUd: state.game.debug.unitDimensions.depthUd,
          rotationRadians: state.game.debug.unitPose.rotationRadians,
          battlefieldProfileId: battlefieldProfile.id,
        },
      )
    : null;
  const debugUnitStyle = state.game.debug.isActive
    ? [
        `left:${(state.game.debug.unitPose.xUd / battlefieldProfile.widthUd) * 100}%`,
        `top:${(state.game.debug.unitPose.yUd / battlefieldProfile.heightUd) * 100}%`,
        `width:${(state.game.debug.unitDimensions.widthUd / battlefieldProfile.widthUd) * 100}%`,
        `height:${(state.game.debug.unitDimensions.depthUd / battlefieldProfile.heightUd) * 100}%`,
        `--debug-rotation:${state.game.debug.unitPose.rotationRadians}rad`,
      ].join(';')
    : '';
  
  const createUnitTokenStyle = (unit) => [
    `left:${(unit.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(unit.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(unit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(unit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--unit-rotation:${unit.rotationRadians ?? 0}rad`,
  ].join(';');
  
  const unitStyle = createUnitTokenStyle(testUnit);
  const worldStyle = [
    `--viewport-zoom:${viewport.zoom}`,
    `--viewport-pan-x:${viewport.panX}px`,
    `--viewport-pan-y:${viewport.panY}px`,
  ].join(';');
  return `
    <section class="battlefield-shell">
      <div class="battlefield-stage">
        <aside class="battlefield-side-panel battlefield-side-panel-left" data-panel-id="left">
          <button class="ghost-button battlefield-back-button" type="button" data-action="navigate" data-screen="main-menu">Zurueck zum Menue</button>
          ${meleePhaseActive ? `
            <section class="battlefield-melee-debug-card battlefield-placeholder-card" data-melee-debug-panel>
              <strong>Melee Debug</strong>
              <p data-melee-debug-phase>phase:${state.game.commandContext.currentPhaseId};active:${meleePhaseActive ? 'yes' : 'no'}</p>
              <p data-melee-debug-selected>selected:${state.game.selectedUnitId ?? 'none'};status:${selectedMeleeStatus}</p>
              <p data-melee-debug-counts>${formatMeleeDebugCountLine(meleeDebugCounts)}</p>
              <p data-melee-debug-actionable>actionable:${actionableMeleeUnitIds.length > 0 ? actionableMeleeUnitIds.join(',') : 'none'}</p>
            </section>
          ` : ''}
          ${isSetupActive ? renderAdvanceCommandPanel({
            selectedUnit,
            isSetupActive,
            roundState: state.game.round,
            setupStepId: state.game.setup.currentStepId,
            canIssueMovementCommands,
            canShowShootingButton,
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
            minimumChargeContinuationDistanceUd,
            maximumChargeContinuationDistanceUd,
            chargeWhyItems,
            shootingProcedureStatus,
            activeShootingUnitId,
            shootingProcedureOverview,
            shootingSequenceHandoffPending,
            shootingSequenceHandoffKind,
            canOpenShootingSequenceHandoff,
            canPassActiveShooter,
            isActiveShootingUnit,
            shootingPreviewActive,
            shootingTargetingActive,
            canStartShootingDeclaration,
            canCancelShootingDeclaration,
            canConfirmShootingDeclaration,
            hasDeclaredShotToResolve,
            resolvedShotRecord,
            resolutionDraftActive,
            canStartShootingResolution,
            canConfirmShootingResolution,
            shootingResolutionDraft,
            shootingResolutionPreview,
            shootDisabledReason,
            shootingWhyItems,
            shootingSupportingShooters,
            shootingSupportTargetUnitId,
            shootingSupportBonus,
            shootingFlowActive,
            commandMenuBranch,
            commandMenuLevel,
            confirmActionLabel,
            confirmActionTitle,
            canToggleCommanderEngagedDiagnostic: false,
            commanderEngagedDiagnosticActive: false,
            canAttachCommander: false,
          }) : ''}
          ${renderTerrainPalette(renderState)}
          ${renderTerrainValidation(renderState)}
          ${renderSetupObjectPalette(renderState)}
          ${renderBattlePlanBoard(renderState)}
          ${renderAmbushMarkersPanel(renderState)}
          ${!isSetupActive ? renderAdvanceCommandPanel({
            selectedUnit,
            isSetupActive,
            roundState: state.game.round,
            setupStepId: state.game.setup.currentStepId,
            canIssueMovementCommands,
            canShowShootingButton,
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
            minimumChargeContinuationDistanceUd,
            maximumChargeContinuationDistanceUd,
            chargeWhyItems,
            shootingProcedureStatus,
            activeShootingUnitId,
            shootingProcedureOverview,
            canPassActiveShooter,
            isActiveShootingUnit,
            shootingPreviewActive,
            shootingTargetingActive,
            canStartShootingDeclaration,
            canCancelShootingDeclaration,
            canConfirmShootingDeclaration,
            hasDeclaredShotToResolve,
            resolvedShotRecord,
            resolutionDraftActive,
            canStartShootingResolution,
            canConfirmShootingResolution,
            shootingResolutionDraft,
            shootingResolutionPreview,
            shootDisabledReason,
            shootingWhyItems,
            shootingSupportingShooters,
            shootingSupportTargetUnitId,
            shootingSupportBonus,
            shootingFlowActive,
            commandMenuBranch,
            commandMenuLevel,
            confirmActionLabel,
            confirmActionTitle,
            canToggleCommanderEngagedDiagnostic: Boolean(
              state.game.commandContext.currentPhaseId === 'movement'
                && state.game.commandContext.commander?.unitId,
            ),
            commanderEngagedDiagnosticActive: Boolean(state.game.commandContext.commander?.engagedInCombat),
            canAttachCommander: canStartCommanderAttach(state.game, selectedUnit),
          }) : ''}
          ${renderDeploymentSetupCard(renderState)}
        </aside>
        <div class="battlefield-center-column">
          <div class="battlefield-surface" data-battlefield-surface>
            <div class="battlefield-world" style="${worldStyle}" data-battlefield-world>
              ${showDeploymentOverlay ? renderDeploymentOverlay(renderState, battlefieldProfile) : ''}
              ${showSectorOverlay ? renderSectorOverlay() : ''}
              ${renderSetupObjects(renderState, battlefieldProfile)}
              ${renderAmbushMarkerShells(renderState, battlefieldProfile)}
              ${renderTerrainPlaceholders(renderState, battlefieldProfile)}
              ${!isSetupActive ? renderZocBands(state.game.units, movementReferenceUnit, battlefieldProfile, { showAllEnemyZoc: showAllEnemyZocForChargePreview }) : ''}
              ${!isSetupActive ? renderNearZocCue(state.game.units, movementReferenceUnit, battlefieldProfile, 0.5) : ''}
              ${!isSetupActive ? renderMostThreateningLine(state.game.units, movementReferenceUnit, state.game.movement.validationSnapshot, battlefieldProfile) : ''}
              ${!isSetupActive ? renderCommandStatusLine(state, movementReferenceUnit, battlefieldProfile) : ''}
              ${!isSetupActive ? getActiveCommanderRangeVisualization(state, battlefieldProfile) : ''}
              ${shootingZoneOverlayMarkup}
              ${shootingPriorityOverlayMarkup}
              ${shootingSupportOverlayMarkup}
              ${commanderAttachTargetingActive ? `
                <span class="battlefield-command-range-ring has-range is-attach-preview-ring" aria-hidden="true" style="${commanderAttachRangeStyle}">
                  <span class="battlefield-command-range-ring-label">Attach ${formatLengthUd(commanderAttachReachUd)} UD</span>
                </span>
              ` : ''}
              ${chargeGuideSegment && selectedUnit ? `
                ${chargeStartPose ? `
                  <div
                    class="battlefield-unit-preview ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                    aria-hidden="true"
                    ${state.game.chargePreview?.intent?.startManoeuvre?.type === 'shift-slide' ? 'data-slide-preview-handle' : ''}
                    data-unit-id="${selectedUnit.id}"
                    style="${createPreviewGhostStyle(chargeStartPose, selectedUnit, battlefieldProfile)}"
                  ></div>
                ` : ''}
                <div
                  class="battlefield-advance-reach battlefield-charge-preview-reach"
                  aria-hidden="true"
                  data-charge-preview-corridor
                  data-charge-start-type="${state.game.chargePreview?.intent?.startManoeuvre?.type ?? 'none'}"
                  style="${chargePreviewReachStyle}"
                ></div>
                <div
                  class="battlefield-unit-preview ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                  aria-hidden="true"
                  data-charge-preview-ghost
                  data-charge-start-type="${state.game.chargePreview?.intent?.startManoeuvre?.type ?? 'none'}"
                  style="${createPreviewGhostStyle(chargeGhostPose, selectedUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${selectedUnit && conformationGhostPose ? `
                <div
                  class="battlefield-unit-preview battlefield-conformation-ghost ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${conformationStatusClass} ${selectedConformationCandidate?.status === 'incomplete' ? 'is-incomplete' : ''} ${selectedConformationCandidate?.status === 'optional' ? 'is-optional' : ''}"
                  aria-hidden="true"
                  data-conformation-preview-ghost
                  data-conformation-status="${conformationPlan?.status ?? 'idle'}"
                  data-conformation-candidate-id="${selectedConformationCandidate?.id ?? ''}"
                  data-conformation-candidate-status="${selectedConformationCandidate?.status ?? 'unknown'}"
                  data-conformation-source-status="${selectedConformationCandidate?.sourceStatus ?? conformationPlan?.sourceStatus ?? 'verified'}"
                  style="${createPreviewGhostStyle(conformationGhostPose, selectedUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${conformationBadgeStyle ? `
                <span
                  class="battlefield-preview-badge battlefield-preview-badge-conformation"
                  aria-hidden="true"
                  data-conformation-preview-badge
                  style="${conformationBadgeStyle}"
                >${selectedConformationCandidate?.status === 'incomplete' ? 'Incomplete' : selectedConformationCandidate?.status === 'optional' ? 'Optional' : 'Conform'}</span>
              ` : ''}
              ${conformationShiftGhosts.map(({ shiftedUnit, toPose, direction, sourceStatus }) => `
                <div
                  class="battlefield-unit-preview battlefield-conformation-shift-ghost ${shiftedUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${getPreviewSourceStatusClass(sourceStatus)}"
                  aria-hidden="true"
                  data-conformation-shift-ghost
                  data-shift-unit-id="${shiftedUnit.id}"
                  data-shift-direction="${direction}"
                  data-shift-source-status="${sourceStatus ?? 'verified'}"
                  style="${createPreviewGhostStyle(toPose, shiftedUnit, battlefieldProfile)}"
                ></div>
              `).join('')}
              ${conformationShiftGhosts.map(({ toPose, direction }) => `
                <span
                  class="battlefield-preview-badge battlefield-preview-badge-shift"
                  aria-hidden="true"
                  data-conformation-shift-badge
                  data-shift-direction="${direction}"
                  style="${createPreviewBadgeStyle(toPose, battlefieldProfile)}"
                >Shift ${escapeHtml(direction)}</span>
              `).join('')}
              ${evadePlan && evadePlanUnit ? `
                <div
                  class="battlefield-unit-preview battlefield-evade-preview-reorientation ${evadePlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${evadePlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-evade-preview-reorientation
                  data-evade-contact-type="${evadePlan?.contactType ?? 'unknown'}"
                  style="${evadeReorientationStyle}"
                ></div>
                ${renderEvadePathReaches({
                  pathSegments: evadePlanPathSegments,
                  evadeUnit: evadePlanUnit,
                  battlefieldProfile,
                  sourceStatus: evadePlan?.sourceStatus ?? 'verified',
                })}
                ${renderEvadePathTrails({
                  pathSegments: evadePlanPathSegments,
                  evadeUnit: evadePlanUnit,
                  battlefieldProfile,
                  sourceStatus: evadePlan?.sourceStatus ?? 'verified',
                })}
              ` : ''}
              ${canResolveEvadeAvoidanceChoice ? renderEvadeChoiceHandles({
                frontierNodes: evadeChoiceTree.frontierNodes,
                evadePlan,
                evadePlanUnit,
                battlefieldProfile,
              }) : ''}
              ${canResolveEvadeAvoidanceChoice ? renderEvadeChoiceGhosts({
                evadeAvoidanceCandidates: evadeChoiceTree.visibleCandidates,
                evadePlan,
                evadePlanUnit,
                battlefieldProfile,
              }) : ''}
              ${evadeCommittedUnit && evadeCommittedPathSegments.length > 0 ? `
                ${renderEvadePathReaches({
                  pathSegments: evadeCommittedPathSegments,
                  evadeUnit: evadeCommittedUnit,
                  battlefieldProfile,
                  sourceStatus: evadeMove?.sourceStatus ?? 'verified',
                  dataScope: 'committed',
                })}
                ${renderEvadePathTrails({
                  pathSegments: evadeCommittedPathSegments,
                  evadeUnit: evadeCommittedUnit,
                  battlefieldProfile,
                  sourceStatus: evadeMove?.sourceStatus ?? 'verified',
                  dataScope: 'committed',
                })}
              ` : ''}
              ${evadeCommittedHalfTurnBadgeStyle ? `
                <span
                  class="battlefield-preview-badge battlefield-preview-badge-evade-commit"
                  aria-hidden="true"
                  data-evade-committed-badge="end-half-turn"
                  style="${evadeCommittedHalfTurnBadgeStyle}"
                >LT half-turn</span>
              ` : ''}
              ${evadeCommittedTableExitBadgeStyle ? `
                <span
                  class="battlefield-preview-badge battlefield-preview-badge-evade-commit is-table-exit"
                  aria-hidden="true"
                  data-evade-committed-badge="table-exit"
                  style="${evadeCommittedTableExitBadgeStyle}"
                >Exit table</span>
              ` : ''}
              ${chargeMovementPlanSegment && chargeMovementPlanUnit ? `
                <div
                  class="battlefield-advance-reach battlefield-charge-follow-through-reach ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-corridor
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${chargeMovementPlanReachStyle}"
                ></div>
                <div
                  class="battlefield-unit-preview battlefield-charge-follow-through-ghost ${chargeMovementPlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-ghost
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${createPreviewGhostStyle(chargeMovementPlan.endPose, chargeMovementPlanUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${chargeContinuationMinimumSegment && chargeMovementPlanUnit ? `
                <div
                  class="battlefield-advance-reach battlefield-charge-follow-through-reach is-minimum ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-minimum-corridor
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${chargeContinuationMinimumReachStyle}"
                ></div>
                <div
                  class="battlefield-unit-preview battlefield-charge-follow-through-ghost is-minimum ${chargeMovementPlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-minimum-ghost
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${createPreviewGhostStyle(chargeMovementPlan.continuationChoice.minimumEndPose, chargeMovementPlanUnit, battlefieldProfile)}"
                ></div>
                <span
                  class="battlefield-preview-badge battlefield-preview-badge-minimum"
                  aria-hidden="true"
                  data-charge-follow-through-minimum-badge
                  style="${chargeContinuationMinimumBadgeStyle}"
                >Stop ${formatLengthUd(chargeMovementPlan.continuationChoice.minimumDistanceUd)} UD</span>
              ` : ''}
              ${advanceModeActive ? `<div class="battlefield-advance-reach" aria-hidden="true" style="${advanceReachStyle}"></div>` : ''}
              ${selectedUnit && committedPreviewTrailSegments.length > 0 ? committedPreviewTrailSegments.map((segment) => `
                <div
                  class="battlefield-unit-preview is-trail ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                  aria-hidden="true"
                  style="${createPreviewGhostStyle(segment.endPose, selectedUnit, battlefieldProfile)}"
                ></div>
              `).join('') : ''}
              ${selectedUnit && state.game.movement.preview.status === 'accepted' && state.game.movement.preview.segments.length > 0 ? `
                <div
                  class="battlefield-unit-preview"
                  aria-hidden="true"
                  ${advanceModeActive ? 'data-advance-preview-handle' : ''}
                  ${slideModeActive ? 'data-slide-preview-handle' : ''}
                  data-unit-id="${selectedUnit.id}"
                  style="${previewUnitStyle}"
                ></div>
              ` : ''}
              ${selectedUnit && commanderGhostPose ? `
                <div
                  class="battlefield-unit-preview ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                  aria-hidden="true"
                  data-unit-id="${selectedUnit.id}"
                  style="${createPreviewGhostStyle(commanderGhostPose, selectedUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${(wheelModeActive || (chargePreviewActiveForSelectedUnit && state.game.chargePreview?.intent?.startManoeuvre?.type === 'wheel')) && selectedUnit && leftWheelHandlePoint && rightWheelHandlePoint ? `
                <button
                  class="battlefield-wheel-handle ${highlightedWheelPivotSide === 'right' ? 'is-active' : ''}"
                  type="button"
                  aria-label="Linke vordere Ecke ziehen"
                  data-wheel-handle
                  data-unit-id="${selectedUnit.id}"
                  data-corner-side="left"
                  style="${createWheelHandleStyle(leftWheelHandlePoint, battlefieldProfile)}"
                ></button>
                <button
                  class="battlefield-wheel-handle ${highlightedWheelPivotSide === 'left' ? 'is-active' : ''}"
                  type="button"
                  aria-label="Rechte vordere Ecke ziehen"
                  data-wheel-handle
                  data-unit-id="${selectedUnit.id}"
                  data-corner-side="right"
                  style="${createWheelHandleStyle(rightWheelHandlePoint, battlefieldProfile)}"
                ></button>
              ` : ''}
              ${state.game.debug.isActive ? `
                <div
                  class="battlefield-debug-unit"
                  data-debug-unit
                  title="Debug-Einheit frei ziehen"
                  style="${debugUnitStyle}"
                >
                  <span class="battlefield-debug-unit-label">${facingRelationship && state.game.debug.showFacingGeometryOverlay ? formatRelationshipLabel(facingRelationship.primaryLabel) : 'Debug'}</span>
                </div>
              ` : ''}
              ${facingRelationship && state.game.debug.showFacingGeometryOverlay ? renderFacingGeometryOverlay({ ...facingRelationship, battlefieldProfileId: battlefieldProfile.id }) : ''}
              ${state.game.units.map((unit, index) => `
                ${(() => {
                  const unitCssToken = toUnitCssToken(unit.id);
                  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
                  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
                  const corpsActivationRecord = state.game.commandContext.corpsActivation?.corps?.find(
                    (entry) => toCorpsSlotId(entry.corpsId) === unitCorpsSlotId && entry.ownerId === unit.owner,
                  ) ?? null;
                  const isActiveCorpsUnit = Boolean(
                    activeCorpsSlotId
                      && unitCorpsSlotId === activeCorpsSlotId
                      && unit.owner === state.game.commandContext.activePlayerId,
                  );
                  const isSpentCorpsUnit = Boolean(
                    !isActiveCorpsUnit
                      && corpsActivationRecord?.status === 'spent'
                      && unit.owner === state.game.commandContext.activePlayerId,
                  );
                  const chargeTargetCandidate = chargeTargetCandidatesByUnitId.get(unit.id) || null;
                  const commanderSpentUd = state.game.commanderFreeMovePreview?.status === 'ready'
                    && state.game.commanderFreeMovePreview.unitId === unit.id
                    ? Number(state.game.commanderFreeMovePreview.nextSpentUd ?? unit.advanceUsedUd ?? 0)
                    : Number(unit.advanceUsedUd ?? 0);
                  const isCommanderFreeMoveReady = Boolean(
                    !isSetupActive
                      && state.game.selectedUnitId === unit.id
                      && state.game.commandContext.currentPhaseId === 'movement'
                      && unit.isCommander
                      && !unit.hasIncludedCommander
                      && Math.max(0, 5 - commanderSpentUd) > 0
                      && unit.owner === state.game.commandContext.activePlayerId
                      && isActiveCorpsUnit
                      && !advanceModeActive
                      && !slideModeActive
                      && !wheelModeActive,
                  );
                  const hasMovedThisPhase = (unit.advanceUsedUd ?? 0) > 0 || Boolean(unit.slideUsedThisMovementPhase);
                  const hasStayedThisPhase = Boolean(unit.stayedThisMovementPhase);
                  const hasMandatoryMovementPending = Boolean(unit.mandatoryMovementPending ?? unit.mustMoveThisPhase);
                  const hasMandatoryMovementResolved = Boolean(unit.mandatoryMovementResolved);
                  const isAttachTarget = Boolean(
                    commanderAttachTargetingActive
                      && canAttachCommanderToUnit(state.game, unit, selectedUnit)
                  );
                  const isAttachTargetSelected = Boolean(
                    selectedUnit
                      && state.game.commanderFreeMovePreview?.mode === 'attach'
                      && state.game.commanderFreeMovePreview?.targetUnitId === unit.id,
                  );
                  const isChargeTargetSelected = Boolean(
                    chargePreviewActiveForSelectedUnit
                      && state.game.chargePreview?.intent?.targetUnitId === unit.id,
                  );
                  const shootingTargetCandidate = shootingTargetCandidatesByUnitId.get(unit.id) ?? null;
                  const shootingProcedureStatus = shootingProcedureStatusesByUnitId.get(unit.id) ?? null;
                  const meleeProcedureStatus = meleePhaseActive
                    ? (meleeProcedureStatusesByUnitId.get(unit.id) ?? 'non-melee')
                    : 'non-melee';
                  const meleeParticipation = meleePhaseActive
                    ? (meleeParticipationByUnitId.get(unit.id) ?? null)
                    : null;
                  const isShootingTargetSelected = Boolean(
                    shootingPreviewActive
                      && state.game.shooting?.preview?.targetUnitId === unit.id,
                  );
                  const isShootingTargetEligible = Boolean(
                    shootingPreviewActive && shootingTargetCandidate?.status === 'eligible',
                  );
                  const isShootingTargetBlocked = Boolean(
                    shootingPreviewActive && shootingTargetCandidate?.status === 'blocked',
                  );
                  const isShootingTargetSourceOpen = Boolean(
                    shootingPreviewActive && shootingTargetCandidate?.status === 'source-open',
                  );
                  const isChargeContactDefender = Boolean(
                    chargeContactEvent?.defenderId === unit.id,
                  );
                  const chargeContactClassification = isChargeContactDefender
                    ? chargeContactEvent?.classification ?? null
                    : null;
                  const selectedChargeContactSide = isChargeContactDefender
                    && state.game.chargePreview?.selectedContactSide?.defenderId === unit.id
                    ? state.game.chargePreview.selectedContactSide.side
                    : null;
                  const isChargeTargetEligible = Boolean(
                    chargeTargetingActive && chargeTargetCandidate?.status === 'eligible',
                  );
                  const isChargeTargetBlocked = Boolean(
                    (chargeTargetingActive && chargeTargetCandidate?.status === 'blocked')
                      || (isChargeTargetSelected && chargeTargetCandidate?.status === 'blocked'),
                  );
                  const chargeTargetReasonTitle = (chargeTargetingActive || isChargeTargetSelected) && chargeTargetCandidate?.reason
                    ? chargeTargetCandidate.reason
                    : '';
                  const shootingTargetReasonTitle = (shootingPreviewActive || isShootingTargetSelected) && shootingTargetCandidate?.reason
                    ? shootingTargetCandidate.reason
                    : '';
                  const baseUnitTitle = isTerrainStep
                    ? 'Unit auswaehlen'
                    : canDragUnitsInSetup && state.game.selectedUnitId === unit.id
                      ? 'Unit ziehen'
                      : isCommanderFreeMoveReady
                        ? 'General ziehen (max 5 UD)'
                        : 'Unit auswaehlen';
                  const suppressUnitTitleSuffix = Boolean(
                    (chargeTargetingActive && chargeTargetCandidate)
                      || isChargeTargetSelected
                      || chargeTargetReasonTitle
                      || shootingTargetReasonTitle,
                  );
                  const unitTitle = `${chargeTargetReasonTitle || shootingTargetReasonTitle || baseUnitTitle}${suppressUnitTitleSuffix ? '' : unit.hasIncludedCommander ? ' (inkl. General)' : unit.isCommander ? ' (General)' : ''}`;
                  const isSelectableUnit = Boolean(
                    shootingPreviewActive
                      ? true
                      : chargeTargetingActive
                      ? unit.id === selectedUnit?.id || chargeTargetCandidatesByUnitId.has(unit.id)
                      : meleePhaseActive
                        ? meleeParticipation?.isSelectableInBattlefield === true
                      : chargePreviewActiveForSelectedUnit && isChargeTargetSelected
                        ? true
                        : unit.owner === state.game.commandContext.activePlayerId
                          && (!activeCorpsSlotId || unitCorpsSlotId === activeCorpsSlotId),
                  );
                  const selectabilityDebugReason = shootingPreviewActive
                    ? 'shooting-preview-open'
                    : chargeTargetingActive
                      ? unit.id === selectedUnit?.id || chargeTargetCandidatesByUnitId.has(unit.id)
                        ? 'charge-targeting-eligible'
                        : 'charge-targeting-ineligible'
                      : meleePhaseActive
                        ? isSelectableUnit
                          ? 'melee-main'
                          : `melee-${meleeProcedureStatus}`
                        : chargePreviewActiveForSelectedUnit && isChargeTargetSelected
                          ? 'charge-preview-selected-target'
                          : unit.owner === state.game.commandContext.activePlayerId
                            ? !activeCorpsSlotId || unitCorpsSlotId === activeCorpsSlotId
                              ? 'active-corps-eligible'
                              : 'inactive-corps'
                            : 'enemy-unit-outside-targeting';
                  const activeCorpsStatusClass = !isActiveCorpsUnit
                    ? ''
                    : hasMandatoryMovementPending && !hasMandatoryMovementResolved && !hasMovedThisPhase && !hasStayedThisPhase
                      ? 'is-corps-unit-mandatory'
                      : hasMovedThisPhase || hasStayedThisPhase || hasMandatoryMovementResolved
                        ? 'is-corps-unit-done'
                        : 'is-corps-unit-pending';
                  const shootingProcedureStatusClass = shootingProcedureStatus?.status
                    ? `is-shooting-procedure-${shootingProcedureStatus.status}`
                    : '';
                  const meleeProcedureStatusClass = meleePhaseActive
                    ? meleeProcedureStatus === 'support-participant'
                      ? 'is-melee-support-participant'
                      : meleeProcedureStatus === 'non-melee'
                      ? 'is-melee-nonparticipant'
                      : ''
                    : '';
                  const unitScenarioLabel = unit.scenarioLabel || unit.id;
                  const cohesionMarkerState = meleeCohesionMarkerStateByUnitId.get(unit.id) ?? null;
                  const unitAutomationLabel = [
                    'Einheit auswaehlen',
                    unitScenarioLabel,
                    `ID ${unit.id}`,
                    unit.owner,
                    unit.corpsId,
                    `x ${formatLengthUd(unit.xUd)} UD`,
                    `y ${formatLengthUd(unit.yUd)} UD`,
                    isSelectableUnit ? 'anklickbar' : 'gesperrt',
                    state.game.selectedUnitId === unit.id ? 'ausgewaehlt' : null,
                    isChargeTargetEligible ? 'Charge-Ziel erreichbar' : null,
                    isChargeTargetBlocked ? 'Charge-Ziel blockiert' : null,
                    isShootingTargetEligible ? 'Schuss-Ziel erreichbar' : null,
                    isShootingTargetBlocked ? 'Schuss-Ziel blockiert' : null,
                    isShootingTargetSourceOpen ? 'Schuss-Ziel quellenoffen' : null,
                    cohesionMarkerState?.committedLossCount ? `verlorene Kohäsion ${cohesionMarkerState.committedLossCount}` : null,
                    cohesionMarkerState?.pendingLossCount ? `ausstehende Kohäsion ${cohesionMarkerState.pendingLossCount}` : null,
                  ].filter(Boolean).join('; ');
                  const unitVisualProfile = resolveRenderableVisualProfile(unit);
                  const unitVisualLayer = renderUnitVisualLayer(unitVisualProfile, {
                    frontStatus: meleePhaseActive
                      ? getMeleeProcedureFrontStatus(meleeProcedureStatus)
                      : state.game.commandContext.currentPhaseId === 'shooting'
                        ? getShootingProcedureFrontStatus(shootingProcedureStatus?.status) || getActiveCorpsFrontStatus(activeCorpsStatusClass)
                        : getActiveCorpsFrontStatus(activeCorpsStatusClass),
                  });
                  const commandRangeRing = unit.commandRangeUd != null
                    ? (() => {
                      const radiusUd = Number(unit.commandRangeUd) + 0.5;
                      const diameterUd = radiusUd * 2;
                      const style = [
                        `left:${(unit.xUd / battlefieldProfile.widthUd) * 100}%`,
                        `top:${(unit.yUd / battlefieldProfile.heightUd) * 100}%`,
                        `width:${(diameterUd / battlefieldProfile.widthUd) * 100}%`,
                        `height:${(diameterUd / battlefieldProfile.heightUd) * 100}%`,
                      ].join(';');

                      return `<span class="battlefield-command-range-ring has-range for-${unitCssToken}" aria-hidden="true" style="${style}"></span>`;
                    })()
                    : `<span class="battlefield-command-range-ring no-range for-${unitCssToken}" aria-hidden="true"></span>`;

                  return `
                <button
                  class="battlefield-unit-token for-${unitCssToken} ${unit.baseShape === 'circle' ? 'is-circle-base' : ''} ${unit.isCommander ? 'is-commander' : ''} ${unit.hasIncludedCommander ? 'has-included-commander' : ''} ${isActiveCorpsUnit ? 'is-active-corps-unit' : ''} ${isSpentCorpsUnit ? 'is-spent-corps-unit' : ''} ${!isSelectableUnit ? 'is-selection-locked' : ''} ${activeCorpsStatusClass} ${shootingProcedureStatusClass} ${meleeProcedureStatusClass} ${isAttachTarget ? 'is-attach-target' : ''} ${isAttachTargetSelected ? 'is-attach-target-selected' : ''} ${isChargeTargetEligible ? 'is-charge-target-eligible' : ''} ${isChargeTargetBlocked ? 'is-charge-target-blocked' : ''} ${isChargeTargetSelected ? 'is-charge-target-selected' : ''} ${isShootingTargetEligible ? 'is-shoot-target-eligible' : ''} ${isShootingTargetBlocked ? 'is-shoot-target-blocked' : ''} ${isShootingTargetSourceOpen ? 'is-shoot-target-source-open' : ''} ${isShootingTargetSelected ? 'is-shoot-target-selected' : ''} ${state.game.selectedUnitId === unit.id ? 'is-selected' : ''} ${advanceModeActive && state.game.selectedUnitId === unit.id ? 'is-advance-ready' : ''} ${wheelModeActive && state.game.selectedUnitId === unit.id ? 'is-wheel-ready' : ''} ${(canDragUnitsInSetup || isCommanderFreeMoveReady) && state.game.selectedUnitId === unit.id ? 'is-setup-placeable' : ''}"
                  type="button"
                  ${isSelectableUnit ? '' : 'disabled'}
                  aria-pressed="${state.game.selectedUnitId === unit.id}"
                  aria-label="${escapeHtml(unitAutomationLabel)}"
                  data-action="select-unit"
                  data-testid="unit-${unit.id}"
                  data-automation-id="unit-${unit.id}"
                  data-automation-label="${escapeHtml(unitAutomationLabel)}"
                  data-unit-id="${unit.id}"
                  data-unit-owner="${unit.owner}"
                  data-unit-corps-id="${unit.corpsId ?? ''}"
                  data-unit-scenario-role="${unit.scenarioRole ?? ''}"
                  data-unit-scenario-label="${escapeHtml(unitScenarioLabel)}"
                  data-unit-scenario-lane-id="${unit.scenarioLaneId ?? ''}"
                  data-unit-scenario-example-id="${unit.scenarioExampleId ?? ''}"
                  data-unit-scenario-support-status="${unit.scenarioSupportStatus ?? ''}"
                  data-unit-scenario-blocker="${escapeHtml(unit.scenarioBlocker ?? '')}"
                  data-unit-visual-profile-id="${unitVisualProfile?.id ?? ''}"
                  data-unit-render-family="${unitVisualProfile?.renderFamily ?? ''}"
                  data-unit-base-silhouette="${unitVisualProfile?.baseSilhouette ?? ''}"
                  data-unit-figure-silhouette="${unitVisualProfile?.figureSilhouette ?? ''}"
                  data-unit-facing-marker="${unitVisualProfile?.facingMarker ?? ''}"
                  data-unit-accent-slot="${unitVisualProfile?.accentSlot ?? ''}"
                  data-unit-owner-color-treatment="${unitVisualProfile?.ownerColorTreatment ?? ''}"
                  data-unit-x-ud="${formatLengthUd(unit.xUd)}"
                  data-unit-y-ud="${formatLengthUd(unit.yUd)}"
                  data-charge-target-status="${chargeTargetingActive ? chargeTargetCandidate?.status ?? 'none' : isChargeTargetSelected ? 'selected' : 'none'}"
                  data-selected-charge-target-current-status="${isChargeTargetSelected ? chargeTargetCandidate?.status ?? 'unknown' : 'none'}"
                  data-shoot-target-status="${shootingPreviewActive ? shootingTargetCandidate?.status ?? (isShootingTargetSelected ? 'selected' : 'none') : isShootingTargetSelected ? 'selected' : 'none'}"
                  data-selected-shoot-target-current-status="${isShootingTargetSelected ? shootingTargetCandidate?.status ?? 'unknown' : 'none'}"
                  data-shooting-procedure-status="${shootingProcedureStatus?.status ?? 'none'}"
                  data-melee-procedure-status="${meleeProcedureStatus}"
                  data-selectability-debug-reason="${escapeHtml(selectabilityDebugReason)}"
                  data-charge-contact-classification="${chargeContactClassification?.type ?? 'none'}"
                  data-selected-charge-contact-side="${selectedChargeContactSide ?? 'none'}"
                  title="${escapeHtml(unitTitle)}"
                  style="--token-color:${unit.owner === 'player-1' ? state.shell.settings.playerColor : '#a8a8a8'};${createUnitTokenStyle(unit)}"
                >${activeCorpsStatusClass === 'is-corps-unit-mandatory' ? '<span class="battlefield-unit-status-badge is-mandatory" aria-hidden="true">!</span>' : ''}${unitVisualLayer}${renderCohesionMarkerLayer(cohesionMarkerState)}<span class="battlefield-unit-debug-label" aria-hidden="true">${escapeHtml(getRenderableUnitDebugLabel(unit, index))}</span>${renderChargeContactSideMarkers(chargeContactClassification, selectedChargeContactSide)}</button>
                ${commandRangeRing}
              `;
                })()}
              `).join('')}
            </div>
          </div>
        </div>
        ${renderBattlefieldRightPanel({
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
        })}
        ${renderSetupGuideDialog(state)}
        ${renderRoundDialog(state)}
        ${renderMeleeResolutionDialog(state)}
        ${renderShootingResolutionDialog(state)}
        ${renderChargeReactionDialog(state)}
        ${renderChargeBranchDistanceDialog(state)}
        ${renderEvadeChoiceHandoffDialog(state)}
        ${renderEvadeInitialBranchChoiceDialog(state)}
      </div>
    </section>
  `;
}

function getChargeContactSideStates(classification, selectedContactSide = null) {
  if (!classification?.type) {
    return null;
  }

  const sideStates = {
    front: 'not-attacked',
    rear: 'not-attacked',
    left: 'not-attacked',
    right: 'not-attacked',
  };

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    sideStates.front = 'attacked';
    return sideStates;
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    sideStates.rear = 'attacked';
    return sideStates;
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK) {
    if (classification.flankSide === 'left') {
      sideStates.left = 'attacked';
    } else if (classification.flankSide === 'right') {
      sideStates.right = 'attacked';
    }
    return sideStates;
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK) {
    const possibleSides = ['rear'];
    if (classification.flankSide === 'left') {
      possibleSides.push('left');
    } else if (classification.flankSide === 'right') {
      possibleSides.push('right');
    }

    if (possibleSides.includes(selectedContactSide)) {
      sideStates[selectedContactSide] = 'attacked';
      return sideStates;
    }

    sideStates.rear = 'possible';
    if (classification.flankSide === 'left') {
      sideStates.left = 'possible';
    } else if (classification.flankSide === 'right') {
      sideStates.right = 'possible';
    }
    return sideStates;
  }

  return null;
}

function renderChargeContactSideMarkers(classification, selectedContactSide = null) {
  const sideStates = getChargeContactSideStates(classification, selectedContactSide);
  if (!sideStates) {
    return '';
  }

  const createSideMarkerMarkup = (side, state) => {
    const isSelectable = state === 'possible'
      || (
        classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
        && selectedContactSide === side
        && state === 'attacked'
      );
    const selectableAttributes = isSelectable
      ? ' data-charge-contact-side-selectable="true"'
      : '';

    return `<span class="battlefield-charge-contact-side is-${side} is-${state}" data-charge-contact-side="${side}" data-charge-contact-state="${state}"${selectableAttributes}></span>`;
  };

  return `
    <span class="battlefield-charge-contact-sides" aria-hidden="true" data-charge-contact-classification="${classification.type}">
      ${createSideMarkerMarkup('front', sideStates.front)}
      ${createSideMarkerMarkup('rear', sideStates.rear)}
      ${createSideMarkerMarkup('left', sideStates.left)}
      ${createSideMarkerMarkup('right', sideStates.right)}
    </span>
  `;
}