import {
  applyWheelPreview,
  createMovementConfirmation,
  createMovementDraft,
  createMovementPreview,
  createWheelPreview,
  getCommittedMovementPreviewSegments,
  getLastCommittedMovementPreviewSegment,
  getMovementPreviewEndPose,
  getMovementPreviewSpentBudgetUd,
  getWheelAngleRadiansForDistanceUd,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from '../engine/movement/index.js';
import { getRemainingAdvanceBudgetUd } from './p0-advance.js';
import {
  createInitialMovementState,
  createConfirmationForPreview,
  getFrozenMovementOrderCommandSnapshot,
  spendCommandPointsForCurrentOrder,
  withMovementValidationSnapshot,
} from './p0-movement.js';

const MAX_WHEEL_ANGLE_RADIANS = Math.PI / 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getWheelBaseSegments(preview) {
  const committedSegments = getCommittedMovementPreviewSegments(preview);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(preview);

  if (lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.WHEEL && preview.status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
    return committedSegments.slice(0, -1);
  }

  return committedSegments;
}

function createWheelBaseUnit(selectedUnit, preview) {
  const baseSegments = getWheelBaseSegments(preview);
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

export function createInitialWheelState() {
  return {
    wheelModeActive: false,
    wheelPivotSide: null,
    wheelPreviewAngleRadians: 0,
  };
}

export function clampWheelAngleRadians(angleRadians) {
  return clamp(angleRadians, 0, MAX_WHEEL_ANGLE_RADIANS);
}

export function reduceSetWheelMode(gameState, isActive) {
  if (gameState.setup.isActive || !gameState.selectedUnitId) {
    return {
      ...gameState,
      ...createInitialWheelState(),
      movement: {
        ...gameState.movement,
        selectedCommandId: null,
        draft: null,
        preview: createMovementPreview(),
        confirmation: createMovementConfirmation(),
        orderCommandSnapshot: null,
      },
    };
  }

  if (!isActive) {
    return {
      ...gameState,
      ...createInitialWheelState(),
      movement: {
        ...gameState.movement,
        selectedCommandId: null,
      },
    };
  }

  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(gameState.movement.preview);

  return {
    ...gameState,
    wheelModeActive: true,
    wheelPivotSide: lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.WHEEL ? lastCommittedSegment.maneuver.pivotSide : null,
    wheelPreviewAngleRadians: lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.WHEEL ? lastCommittedSegment.maneuver.angleRadians : 0,
    movement: {
      ...gameState.movement,
      selectedCommandId: MOVEMENT_COMMAND_IDS.WHEEL,
      orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
    },
  };
}

export function reduceSetWheelPreviewAngle(gameState, angleRadians, pivotSide, selectedUnit, battlefieldProfile) {
  if (gameState.setup.isActive || !gameState.wheelModeActive || !pivotSide) {
    return gameState;
  }

  const previewBase = selectedUnit ? createWheelBaseUnit(selectedUnit, gameState.movement.preview) : null;
  const maxBudgetAngleRadians = previewBase
    ? getWheelAngleRadiansForDistanceUd(getRemainingAdvanceBudgetUd(previewBase.baseUnit, gameState.units))
    : MAX_WHEEL_ANGLE_RADIANS;
  const clampedAngleRadians = clampWheelAngleRadians(Math.min(angleRadians, maxBudgetAngleRadians));

  if (!selectedUnit || !battlefieldProfile) {
    return {
      ...gameState,
      wheelPivotSide: pivotSide,
      wheelPreviewAngleRadians: clampedAngleRadians,
    };
  }

  const { baseSegments, baseUnit } = previewBase;

  if (clampedAngleRadians <= 0) {
    const preview = baseSegments.length
      ? createMovementPreview({
          status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
          segments: baseSegments,
          explanations: ['Movement chain is ready to confirm.'],
          sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
        })
      : createMovementPreview();

    return {
      ...gameState,
      wheelPivotSide: pivotSide,
      wheelPreviewAngleRadians: 0,
      movement: withMovementValidationSnapshot(gameState, {
        ...gameState.movement,
        selectedCommandId: MOVEMENT_COMMAND_IDS.WHEEL,
        draft: baseSegments.length
          ? createMovementDraft({
              commandId: MOVEMENT_COMMAND_IDS.WHEEL,
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

  const nextCommandPreview = createWheelPreview(baseUnit, pivotSide, clampedAngleRadians, battlefieldProfile);
  const segment = nextCommandPreview.segments[0] ?? null;
  const combinedSegments = segment ? [...baseSegments, segment] : [...baseSegments];
  const preview = createMovementPreview({
    status: nextCommandPreview.status,
    segments: combinedSegments,
    explanations: nextCommandPreview.explanations,
    diagnostics: nextCommandPreview.diagnostics,
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
  const draft = createMovementDraft({
    commandId: MOVEMENT_COMMAND_IDS.WHEEL,
    unitId: selectedUnit.id,
    segments: combinedSegments,
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });

  return {
    ...gameState,
    wheelPivotSide: pivotSide,
    wheelPreviewAngleRadians: clampedAngleRadians,
    movement: withMovementValidationSnapshot(gameState, {
      ...gameState.movement,
      selectedCommandId: MOVEMENT_COMMAND_IDS.WHEEL,
      draft,
      preview,
      confirmation: createConfirmationForPreview(preview),
      orderCommandSnapshot: getFrozenMovementOrderCommandSnapshot(gameState),
    }),
  };
}

export function reduceConfirmWheel(gameState, selectedUnit) {
  if (
    gameState.setup.isActive
    || !selectedUnit
    || gameState.movement.confirmation.status !== MOVEMENT_CONFIRMATION_STATUSES.READY
    || gameState.movement.preview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED
    || gameState.movement.preview.segments.length === 0
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
    ...createInitialWheelState(),
    movement: createInitialMovementState(),
    units: paidGameState.units.map((unit) =>
      unit.id === selectedUnit.id
        ? {
            ...applyWheelPreview(unit, paidGameState.movement.preview),
            slideUsedThisMovementPhase: unit.slideUsedThisMovementPhase
              || paidGameState.movement.preview.segments.some((segment) => segment.commandId === MOVEMENT_COMMAND_IDS.SLIDE),
            stayedThisMovementPhase: false,
          }
        : unit,
    ),
  };
}

export { MOVEMENT_PIVOT_SIDES };