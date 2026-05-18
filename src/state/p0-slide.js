import {
  applySlidePreview,
  createMovementDraft,
  createMovementPreview,
  createSlidePreview,
  getCommittedMovementPreviewSegments,
  getLastCommittedMovementPreviewSegment,
  getMovementPreviewAdvanceDistanceUd,
  getMovementPreviewEndPose,
  getMovementPreviewSpentBudgetUd,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SLIDE_SIDES,
  MOVEMENT_SOURCE_STATUSES,
} from '../engine/movement/index.js';
import {
  createInitialMovementState,
  createConfirmationForPreview,
  doesMovementPreviewContainCommand,
  getFrozenMovementOrderCommandSnapshot,
  getSlideQualifiedMovementDistanceUd,
  spendCommandPointsForCurrentOrder,
  withMovementValidationSnapshot,
} from './p0-movement.js';

const MAX_SLIDE_DISTANCE_UD = 1;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSlideBaseSegments(preview) {
  const committedSegments = getCommittedMovementPreviewSegments(preview);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(preview);

  if (lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.SLIDE && preview.status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
    return committedSegments.slice(0, -1);
  }

  return committedSegments;
}

function createSlideBaseUnit(selectedUnit, preview) {
  const baseSegments = getSlideBaseSegments(preview);
  const basePose = getMovementPreviewEndPose({ status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED, segments: baseSegments }, {
    xUd: selectedUnit.xUd,
    yUd: selectedUnit.yUd,
    rotationRadians: selectedUnit.rotationRadians ?? 0,
  });

  return {
    baseSegments,
    baseUnit: {
      ...selectedUnit,
      xUd: basePose.xUd,
      yUd: basePose.yUd,
      rotationRadians: basePose.rotationRadians,
      advanceUsedUd: (selectedUnit.advanceUsedUd ?? 0) + getMovementPreviewSpentBudgetUd({
        status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
        segments: baseSegments,
      }),
    },
  };
}

export function hasUnitUsedSlideThisMovementPhase(unit) {
  return Boolean(unit?.slideUsedThisMovementPhase);
}

export function isSlideAvailableForUnit(unit, preview) {
  return !hasUnitUsedSlideThisMovementPhase(unit)
    && !doesMovementPreviewContainCommand(preview, MOVEMENT_COMMAND_IDS.SLIDE);
}

export function createInitialSlideState() {
  return {
    slideModeActive: false,
    slidePreviewUd: 0,
    slidePreviewSide: null,
  };
}

export function reduceSetSlideMode(gameState, isActive) {
  if (gameState.setup.isActive || !gameState.selectedUnitId) {
    return {
      ...gameState,
      ...createInitialSlideState(),
      movement: {
        ...gameState.movement,
        selectedCommandId: null,
        orderCommandSnapshot: null,
      },
    };
  }

  if (!isActive) {
    return {
      ...gameState,
      ...createInitialSlideState(),
      movement: {
        ...gameState.movement,
        selectedCommandId: null,
      },
    };
  }

  const selectedUnit = gameState.units.find((unit) => unit.id === gameState.selectedUnitId) || null;
  if (!isSlideAvailableForUnit(selectedUnit, gameState.movement.preview)) {
    return gameState;
  }

  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(gameState.movement.preview);

  return {
    ...gameState,
    slideModeActive: true,
    slidePreviewUd: lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.SLIDE ? lastCommittedSegment.distance.resolvedUd : 0,
    slidePreviewSide: lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.SLIDE
      ? (lastCommittedSegment.distance.measurementMode.includes('left') ? MOVEMENT_SLIDE_SIDES.LEFT : MOVEMENT_SLIDE_SIDES.RIGHT)
      : null,
    movement: {
      ...gameState.movement,
      selectedCommandId: MOVEMENT_COMMAND_IDS.SLIDE,
      orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
    },
  };
}

export function reduceSetSlidePreviewDistance(gameState, distanceUd, side, selectedUnit, battlefieldProfile) {
  if (gameState.setup.isActive || !gameState.slideModeActive || !side) {
    return gameState;
  }

  const clampedDistanceUd = clamp(distanceUd, 0, MAX_SLIDE_DISTANCE_UD);

  if (!selectedUnit || !battlefieldProfile) {
    return {
      ...gameState,
      slidePreviewUd: clampedDistanceUd,
      slidePreviewSide: side,
    };
  }

  const { baseSegments, baseUnit } = createSlideBaseUnit(selectedUnit, gameState.movement.preview);

  if (clampedDistanceUd <= 0) {
    const preview = baseSegments.length
      ? createMovementPreview({
          status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
          segments: baseSegments,
          explanations: ['Movement chain is ready geometrically.'],
          sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
        })
      : createMovementPreview();

    return {
      ...gameState,
      slidePreviewUd: 0,
      slidePreviewSide: side,
      movement: withMovementValidationSnapshot(gameState, {
        ...gameState.movement,
        selectedCommandId: MOVEMENT_COMMAND_IDS.SLIDE,
        draft: baseSegments.length
          ? createMovementDraft({
              commandId: MOVEMENT_COMMAND_IDS.SLIDE,
              unitId: selectedUnit.id,
              segments: baseSegments,
              sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
            })
          : null,
        preview,
        confirmation: createConfirmationForPreview(preview),
        orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
      }),
    };
  }

  const nextCommandPreview = createSlidePreview(baseUnit, side, clampedDistanceUd, battlefieldProfile);
  const segment = nextCommandPreview.segments[0] ?? null;
  const combinedSegments = segment ? [...baseSegments, segment] : [...baseSegments];
  const preview = createMovementPreview({
    status: nextCommandPreview.status,
    segments: combinedSegments,
    explanations: nextCommandPreview.status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED && getSlideQualifiedMovementDistanceUd({ status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED, segments: combinedSegments }) < 1
      ? ['Slide preview is geometrically valid, but the chain still needs at least 1 UD of advance or wheel movement before confirmation.']
      : nextCommandPreview.explanations,
    diagnostics: nextCommandPreview.diagnostics,
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
  const draft = createMovementDraft({
    commandId: MOVEMENT_COMMAND_IDS.SLIDE,
    unitId: selectedUnit.id,
    segments: combinedSegments,
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });

  return {
    ...gameState,
    slidePreviewUd: clampedDistanceUd,
    slidePreviewSide: side,
    movement: withMovementValidationSnapshot(gameState, {
      ...gameState.movement,
      selectedCommandId: MOVEMENT_COMMAND_IDS.SLIDE,
      draft,
      preview,
      confirmation: createConfirmationForPreview(preview),
      orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
    }),
  };
}

export function reduceConfirmSlide(gameState, selectedUnit) {
  if (
    gameState.setup.isActive
    || !selectedUnit
    || gameState.movement.confirmation.status !== MOVEMENT_CONFIRMATION_STATUSES.READY
    || gameState.movement.preview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED
    || gameState.movement.preview.segments.length === 0
    || getSlideQualifiedMovementDistanceUd(gameState.movement.preview) < 1
  ) {
    return gameState;
  }

  const spentCommandPoints = spendCommandPointsForCurrentOrder(gameState);
  if (!spentCommandPoints.ok) {
    return spentCommandPoints.nextGameState;
  }

  const paidGameState = spentCommandPoints.nextGameState;

  return {
    ...paidGameState,
    ...createInitialSlideState(),
    movement: createInitialMovementState(),
    units: paidGameState.units.map((unit) =>
      unit.id === selectedUnit.id
        ? {
            ...applySlidePreview(unit, paidGameState.movement.preview),
            slideUsedThisMovementPhase: true,
            stayedThisMovementPhase: false,
          }
        : unit
    ),
  };
}

export { MOVEMENT_SLIDE_SIDES };