import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_PREVIEW_STATUSES,
  EVADE_CHOICE_HANDOFF_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createEvadeMoveResolution,
  createInitialChargePreview,
} from '../engine/charge/index.js';

export function reducePreviewEvadeAvoidanceNode(state, stepId, getEvadeChoiceFrontierStepIds) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
    || !preview?.branchDistanceRoll?.result
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || !preview?.evadePlan?.choiceRequired
    || preview?.evadeChoiceHandoff?.status !== EVADE_CHOICE_HANDOFF_STATUSES.ACKNOWLEDGED
    || !stepId
  ) {
    return state;
  }

  const currentPathStepIds = Array.isArray(preview.evadeMove?.choicePathStepIds)
    ? preview.evadeMove.choicePathStepIds
    : [];
  const nextFrontierStepIds = getEvadeChoiceFrontierStepIds(preview.evadeMove?.avoidanceCandidates ?? [], currentPathStepIds);

  let nextPathStepIds = currentPathStepIds;
  if (nextFrontierStepIds.has(stepId)) {
    nextPathStepIds = [...currentPathStepIds, stepId];
  } else if (currentPathStepIds[currentPathStepIds.length - 1] === stepId) {
    nextPathStepIds = currentPathStepIds.slice(0, -1);
  } else {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        evadeMove: createEvadeMoveResolution({
          ...preview.evadeMove,
          choicePathStepIds: nextPathStepIds,
        }),
      }),
    },
  };
}

export function reduceResetEvadeAvoidancePath(state) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || !Array.isArray(preview?.evadeMove?.choicePathStepIds)
    || preview.evadeMove.choicePathStepIds.length === 0
  ) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        evadeMove: createEvadeMoveResolution({
          ...preview.evadeMove,
          choicePathStepIds: [],
        }),
      }),
    },
  };
}

export function isEvadeMoveCommitted(evadeMove) {
  return evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED
    && Boolean(evadeMove?.reactingUnitId)
    && (Boolean(evadeMove?.finalPose) || Boolean(evadeMove?.tableExit?.exitsTable));
}

export function isEvadeMoveReadyForAdjustedCharge(evadeMove) {
  return isEvadeMoveCommitted(evadeMove);
}

export function applyCommittedEvadeMoveToUnits(units = [], evadeMove = null) {
  if (!isEvadeMoveCommitted(evadeMove)) {
    return units;
  }

  if (evadeMove.tableExit?.exitsTable && evadeMove.tableExit?.removeFromPlay !== false) {
    return units.filter((unit) => unit.id !== evadeMove.reactingUnitId);
  }

  return units.map((unit) => {
    if (unit.id !== evadeMove.reactingUnitId) {
      return unit;
    }

    return {
      ...unit,
      xUd: Number(evadeMove.finalPose.xUd ?? unit.xUd ?? 0),
      yUd: Number(evadeMove.finalPose.yUd ?? unit.yUd ?? 0),
      rotationRadians: Number(evadeMove.finalPose.rotationRadians ?? unit.rotationRadians ?? 0),
      moveCountThisSequence: Number(unit.moveCountThisSequence ?? 0) + 1,
      hasEvadedThisSequence: true,
      cannotShootThisSequence: Boolean(evadeMove.cannotShootHook),
      evadeCountThisPhase: Number(unit.evadeCountThisPhase ?? 0) + Number(evadeMove.repeatEvadeHook?.increment ?? 0),
    };
  });
}