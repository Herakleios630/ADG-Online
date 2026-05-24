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
import { canUseFreeCommandPointForCurrentOrder, doesMovementPreviewContainCommand, getSlideQualifiedMovementDistanceUd } from '../state/p0-movement.js';
import { hasUnitUsedSlideThisMovementPhase, isSlideAvailableForUnit } from '../state/p0-slide.js';
import {
  canConfirmChargePreviewDirection,
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
    ? (chargePreview.reactionRequests[1] ?? null)
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

  return [
    { label: 'Status', value: getChargeStatusLabel(chargePreview.status) },
    { label: 'Ziel', value: referenceTarget?.scenarioLabel ?? referenceTarget?.id ?? referenceTargetUnitId ?? 'Noch keines' },
    { label: 'Start', value: getChargeStartLabel(referenceStart) },
    { label: 'Pfad', value: getChargePathLabel(referencePath, referenceContact) },
    { label: 'Kontakt', value: getChargeContactLabel(referenceContact, selectedContactSide) },
    { label: 'Reaktion', value: getChargeReactionTypeLabel(referenceReaction?.type ?? null) },
    followThroughLabel ? { label: 'Follow-through', value: followThroughLabel } : null,
    secondaryReactionLabel ? { label: 'Next reaction', value: secondaryReactionLabel } : null,
    secondaryReactionDecisionLabel ? { label: 'Recorded reaction', value: secondaryReactionDecisionLabel } : null,
    handoffLabel ? { label: 'Handoff', value: handoffLabel } : null,
  ].filter(Boolean);
}

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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

export function getEvadeAvoidanceChoiceLabel(candidate) {
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
        helperCopy = secondaryReactionDecisionLabel
          ? `Die Sekundaerziel-Reaktion ist als ${secondaryReactionDecisionLabel} abgeschlossen. Der Geradeaus-Follow-Through wartet jetzt im expliziten No-Evade-Handoff auf den naechsten P7A/P7B-Slice.`
          : 'Reaktion abgeschlossen: kein Ausweichen. Die Charge wartet jetzt im expliziten No-Evade-Handoff auf P7A/P7B.';
      } else if (chargePreview.status === 'evade-required') {
        const branchDistanceClaim = chargePreview?.branchDistanceRoll?.claim ?? null;
        const branchDistanceResult = chargePreview?.branchDistanceRoll?.result ?? null;
        const branchClaimTargetsPrimaryReaction = branchDistanceClaim?.targetUnitId === getPrimaryChargeTargetUnitId(chargePreview);
        const continuationChoice = chargePreview?.chargeMovementPlan?.continuationChoice ?? null;
        const followThroughResolution = chargePreview?.followThroughResolution ?? null;
        const evadeMove = chargePreview?.evadeMove ?? null;
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
          helperCopy = `Der Geradeaus-Follow-Through trifft zuerst das Sekundaerziel ${getUnitScenarioLabel(state, followThroughResolution.defenderId)} und pausiert dort. ${secondaryReactionLabel ? `Die naechste pausierte Reaktion ist ${secondaryReactionLabel}.` : (chargePreview.evadePlan && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE && branchDistanceResult && !branchClaimTargetsPrimaryReaction) ? `Die Sekundaerziel-Reaktion ist jetzt als ${secondaryReactionDecisionLabel ?? 'sekundaere Ausweichreaktion'} aufgeloest. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)} fuer ${getUnitScenarioLabel(state, chargePreview.evadePlan?.reactingUnitId)}. Die weitere Kette bleibt im aktuellen P7A-Schnitt noch angehalten.` : secondaryReactionDecisionLabel ? `Die Sekundaerziel-Reaktion ist bereits als ${secondaryReactionDecisionLabel} erfasst; die Kette bleibt bis zum naechsten P7A-Slice angehalten.` : 'Die Sekundaerziel-Reaktion bleibt fuer den naechsten P7A-Slice offen.'}`;
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
          helperCopy = `Ausweichen ist committed. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)}. Starte jetzt den Folgewurf fuer die angepasste Charge-Distanz.`;
        } else if (chargePreview.evadePlan && branchDistanceClaim?.reason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE && branchDistanceResult) {
          helperCopy = `Die Sekundaerziel-Reaktion ist jetzt als ${secondaryReactionDecisionLabel ?? 'sekundaere Ausweichreaktion'} aufgeloest. Ergebnis: ${getChargeBranchDistanceOutcomeLabel(branchDistanceResult.distanceOutcome)} fuer ${getUnitScenarioLabel(state, chargePreview.evadePlan?.reactingUnitId)}. Die weitere Kette bleibt im aktuellen P7A-Schnitt noch angehalten.`;
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
  const canConfirmMovement = Boolean(
    commanderFreeMovePreview?.status === 'ready'
      && commanderFreeMovePreview.unitId === selectedUnit?.id,
  ) || state.game.movement.confirmation.status === 'ready' || chargeConfirmReady;
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
      && chargePreview?.evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED
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
    confirmActionLabel: chargeConfirmReady ? 'Richtung bestaetigen' : 'Bewegung beenden',
    confirmActionTitle: chargeConfirmReady ? 'Charge-Deklaration einfrieren und Reaktion oeffnen' : 'Bewegung beenden',
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

  return `
    <div class="battlefield-placeholder-card">
      <strong>Befehle</strong>
      <div class="battlefield-command-primary">
        <div class="battlefield-command-grid">
          ${canShowMovementButtons ? `
            <button class="shell-button battlefield-command-button ${advanceModeActive ? 'is-active' : ''}" type="button" data-action="toggle-advance-mode" ${!chargePreviewActive && canIssueMovementCommands && (advanceModeActive || maxAdvanceUd > 0) ? '' : 'disabled'}>Advance</button>
            <button class="shell-button battlefield-command-button ${(wheelModeActive || (chargeStartControlsActive && selectedChargeStartType === 'wheel')) ? 'is-active' : ''}" type="button" data-action="toggle-wheel-mode" ${chargeStartControlsActive ? chargeWheelOption?.status === 'available' ? '' : 'disabled' : !chargePreviewActive && canIssueMovementCommands && (wheelModeActive || remainingAdvanceBudgetUd > 0) ? '' : 'disabled'}>Wheel</button>
            <button class="shell-button battlefield-command-button ${(slideModeActive || (chargeStartControlsActive && selectedChargeStartType === 'shift-slide')) ? 'is-active' : ''}" type="button" data-action="toggle-slide-mode" ${chargeStartControlsActive ? chargeSlideOption?.status === 'available' ? '' : 'disabled' : !chargePreviewActive && canIssueMovementCommands && (slideModeActive || slideAvailable) ? '' : 'disabled'}>Slide</button>
            <button class="shell-button battlefield-command-button ${chargePreviewActive ? 'is-active' : ''}" type="button" data-action="start-charge-preview" title="${chargeDisabledReason || 'Charge vor anderer Bewegung starten'}" ${canStartCharge || chargePreviewActive ? '' : 'disabled'}>Charge</button>
          ` : ''}
          <button class="ghost-button battlefield-command-button" type="button" data-action="mark-unit-stay" ${canMarkStay ? '' : 'disabled'}>Stay</button>
          ${showAttachCommanderButton ? `<button class="ghost-button battlefield-command-button" type="button" data-action="attach-commander" ${canAttachCommander ? '' : 'disabled'}>Kommandeur anhaengen</button>` : ''}
          <button class="ghost-button battlefield-command-button" type="button" data-action="reset-test-units" ${isSetupActive || !selectedUnit ? 'disabled' : ''}>Einheit zuruecksetzen</button>
        </div>
        <div class="battlefield-command-actions">
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
          <button class="shell-button battlefield-command-action battlefield-command-action-confirm is-active" type="button" data-action="confirm-movement" aria-label="${confirmActionLabel}" title="${confirmActionTitle}" ${isSetupActive || !canConfirmMovement ? 'disabled' : ''}>
            <span>${confirmActionLabel}</span>
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