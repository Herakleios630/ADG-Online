import {
  applyAdvancePreview,
  createMovementConfirmation,
  createMovementDraft,
  createMovementPreview,
  createAdvancePreview,
  getCommittedMovementPreviewSegments,
  getLastCommittedMovementPreviewSegment,
  getMovementPreviewEndPose,
  getMovementPreviewSpentBudgetUd,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from '../engine/movement/index.js';
import { createConfirmationForPreview, withMovementValidationSnapshot } from './p0-movement.js';

const P0_ADVANCE_LIMIT_UD = 4;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getAdvanceBaseSegments(preview) {
  const committedSegments = getCommittedMovementPreviewSegments(preview);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(preview);

  if (lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.ADVANCE && preview.status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
    return committedSegments.slice(0, -1);
  }

  return committedSegments;
}

function createAdvanceBaseUnit(selectedUnit, preview) {
  const baseSegments = getAdvanceBaseSegments(preview);
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

export function createInitialAdvanceState() {
  return {
    advanceModeActive: false,
    advancePreviewUd: 0,
  };
}

export function clampAdvanceDistance(value, maxDistance = P0_ADVANCE_LIMIT_UD) {
  return clamp(value, 0, maxDistance);
}

export function getRemainingAdvanceBudgetUd(unit) {
  return clamp(P0_ADVANCE_LIMIT_UD - (unit.advanceUsedUd ?? 0), 0, P0_ADVANCE_LIMIT_UD);
}

export function reduceSetAdvanceMode(gameState, isActive) {
  if (gameState.setup.isActive) {
    return {
      ...gameState,
      ...createInitialAdvanceState(),
      ...gameState,
      movement: {
        ...gameState.movement,
        selectedCommandId: null,
        draft: null,
        preview: createMovementPreview(),
        confirmation: createMovementConfirmation(),
      },
    };
  }

  const nextIsActive = Boolean(isActive) && Boolean(gameState.selectedUnitId);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(gameState.movement.preview);

  return {
    ...gameState,
    advanceModeActive: nextIsActive,
    advancePreviewUd: nextIsActive && lastCommittedSegment?.commandId === MOVEMENT_COMMAND_IDS.ADVANCE
      ? lastCommittedSegment.distance.resolvedUd
      : 0,
    wheelModeActive: false,
    wheelPivotSide: null,
    wheelPreviewAngleRadians: 0,
    movement: nextIsActive
      ? {
          ...gameState.movement,
          selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
        }
      : {
          ...gameState.movement,
          selectedCommandId: null,
        },
  };
}

export function reduceSetAdvancePreviewDistance(gameState, distanceUd, selectedUnit, battlefieldProfile) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  const previewBase = selectedUnit ? createAdvanceBaseUnit(selectedUnit, gameState.movement.preview) : null;
  const maxDistance = previewBase
    ? getRemainingAdvanceBudgetUd(previewBase.baseUnit)
    : selectedUnit
      ? getRemainingAdvanceBudgetUd(selectedUnit)
      : P0_ADVANCE_LIMIT_UD;
  const clampedDistance = clampAdvanceDistance(distanceUd, maxDistance);

  if (!selectedUnit || !battlefieldProfile) {
    return {
      ...gameState,
      advancePreviewUd: clampedDistance,
    };
  }

  const { baseSegments, baseUnit } = previewBase;

  if (clampedDistance <= 0) {
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
      advancePreviewUd: 0,
      movement: withMovementValidationSnapshot(gameState, {
        ...gameState.movement,
        selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
        draft: baseSegments.length
          ? createMovementDraft({
              commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
              unitId: selectedUnit.id,
              segments: baseSegments,
              sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
            })
          : null,
        preview,
        confirmation: createConfirmationForPreview(preview),
      }),
    };
  }

  const nextCommandPreview = createAdvancePreview(baseUnit, clampedDistance, battlefieldProfile);
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
    commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    unitId: selectedUnit.id,
    segments: combinedSegments,
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });

  return {
    ...gameState,
    advancePreviewUd: clampedDistance,
    movement: withMovementValidationSnapshot(gameState, {
      ...gameState.movement,
      selectedCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
      draft,
      preview,
      confirmation: createConfirmationForPreview(preview),
    }),
  };
}

export function reduceConfirmAdvance(gameState, selectedUnit) {
  if (gameState.setup.isActive) {
    return gameState;
  }

  if (
    !selectedUnit
    || gameState.movement.preview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED
    || gameState.movement.preview.segments.length === 0
  ) {
    return gameState;
  }

  return {
    ...gameState,
    ...createInitialAdvanceState(),
    movement: {
      ...gameState.movement,
      selectedCommandId: null,
      draft: null,
      preview: createMovementPreview(),
      confirmation: createMovementConfirmation(),
    },
    units: gameState.units.map((unit) =>
      unit.id === selectedUnit.id
        ? {
            ...applyAdvancePreview(unit, gameState.movement.preview),
            slideUsedThisMovementPhase: unit.slideUsedThisMovementPhase
              || gameState.movement.preview.segments.some((segment) => segment.commandId === MOVEMENT_COMMAND_IDS.SLIDE),
          }
        : unit,
    ),
  };
}