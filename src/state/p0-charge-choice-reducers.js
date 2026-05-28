import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_MOVEMENT_CONTINUATION_DECISIONS,
  CHARGE_PREVIEW_STATUSES,
  EVADE_CHOICE_HANDOFF_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createChargeFollowThroughResolution,
  createEvadeChoiceHandoff,
  createInitialChargePreview,
} from '../engine/charge/index.js';
import { createAdjustedChargeDistanceClaim } from './p0-charge-branch-helpers.js';
import {
  applyCommittedChargeFollowThroughToUnits,
  canFinalizeChargeFollowThrough,
  createChargeFollowThroughCompletionRecord,
} from './p0-charge-follow-through-helpers.js';
import {
  createEvadeMoveResolutionFromPlan,
  resolveChargePreviewEvadePlan,
  resolveEvadePlanAvoidanceChoice,
} from './p0-charge-evade-helpers.js';
import {
  applyCommittedEvadeMoveToUnits,
  isEvadeMoveReadyForAdjustedCharge,
} from './p0-evade-move-state-helpers.js';

export function reduceStartAdjustedChargeDistanceRoll(state) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
    || !preview?.branchDistanceRoll?.result
    || !isEvadeMoveReadyForAdjustedCharge(preview?.evadeMove)
  ) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        branchDistanceRoll: createAdjustedChargeDistanceClaim(state.game, preview),
        followThroughResolution: createChargeFollowThroughResolution(),
      }),
    },
  };
}

export function reduceSelectEvadeAvoidanceChoice(state, choice) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE
    || !preview?.branchDistanceRoll?.result
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || !preview?.evadePlan?.choiceRequired
  ) {
    return state;
  }

  const evadePlan = preview?.evadePlan?.choiceKind === 'initial-branch'
    ? resolveChargePreviewEvadePlan(state.game, preview, preview.branchDistanceRoll.result, {
      selectedInitialBranch: choice?.candidateId ?? null,
    })
    : resolveEvadePlanAvoidanceChoice(preview.evadePlan, choice);
  if (!evadePlan) {
    return state;
  }

  const evadeMove = createEvadeMoveResolutionFromPlan(state.game, preview, evadePlan);
  const nextUnits = applyCommittedEvadeMoveToUnits(state.game.units, evadeMove);

  return {
    ...state,
    game: {
      ...state.game,
      setupViewMode: preview?.evadeChoiceHandoff?.returnViewMode ?? state.game.setupViewMode,
      units: nextUnits,
      chargePreview: createInitialChargePreview({
        ...preview,
        unitRollbackSnapshot: preview?.unitRollbackSnapshot?.length ? preview.unitRollbackSnapshot : state.game.units,
        evadePlan,
        evadeMove,
        evadeChoiceHandoff: createEvadeChoiceHandoff(),
      }),
    },
  };
}

export function reduceAcknowledgeEvadeChoiceHandoff(state) {
  const preview = state.game.chargePreview;
  const handoff = preview?.evadeChoiceHandoff ?? null;

  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.evadeMove?.status !== EVADE_MOVE_RESOLUTION_STATUSES.CHOICE_REQUIRED
    || handoff?.status !== EVADE_CHOICE_HANDOFF_STATUSES.PENDING
  ) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      setupViewMode: handoff.nextViewMode ?? state.game.setupViewMode,
      chargePreview: createInitialChargePreview({
        ...preview,
        evadeChoiceHandoff: createEvadeChoiceHandoff({
          ...handoff,
          status: EVADE_CHOICE_HANDOFF_STATUSES.ACKNOWLEDGED,
        }),
      }),
    },
  };
}

export function reduceResolveChargeContinuationChoice(state, option) {
  const preview = state.game.chargePreview;
  const chargeMovementPlan = preview?.chargeMovementPlan ?? null;
  const continuationChoice = chargeMovementPlan?.continuationChoice ?? null;

  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || !continuationChoice?.required
    || ![CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP, CHARGE_MOVEMENT_CONTINUATION_DECISIONS.CONTINUE].includes(option)
  ) {
    return state;
  }

  const nextChargeMovementPlan = {
    ...chargeMovementPlan,
    distanceUd: option === CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP
      ? continuationChoice.minimumDistanceUd
      : continuationChoice.maximumDistanceUd,
    endPose: option === CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP
      ? continuationChoice.minimumEndPose
      : continuationChoice.maximumEndPose,
    continuationChoice: {
      ...continuationChoice,
      selectedOption: option,
    },
  };

  const nextPreview = createInitialChargePreview({
    ...preview,
    chargeMovementPlan: nextChargeMovementPlan,
  });

  if (canFinalizeChargeFollowThrough(nextPreview, nextChargeMovementPlan)) {
    return {
      ...state,
      game: {
        ...state.game,
        units: applyCommittedChargeFollowThroughToUnits(state.game.units, nextChargeMovementPlan),
        chargePreview: createInitialChargePreview(),
        lastChargeCompletion: createChargeFollowThroughCompletionRecord(nextPreview, nextChargeMovementPlan),
      },
    };
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: nextPreview,
    },
  };
}