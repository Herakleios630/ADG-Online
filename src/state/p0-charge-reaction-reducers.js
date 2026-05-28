import { createChargeDeclarationSnapshot } from '../engine/charge/index.js';
import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_HANDOFF_STATUSES,
  CHARGE_PREVIEW_STATUSES,
  EVADE_CHOICE_HANDOFF_STATUSES,
  EVADE_MOVE_RESOLUTION_STATUSES,
  createChargeBranchDistanceState,
  createChargeReactionDecision,
  createInitialChargePreview,
  getChargeReactionDecisionHandoffStatus,
  isChargeReactionDecisionAllowed,
} from '../engine/charge/index.js';
import {
  createChargeBranchDistanceClaim,
  createChargeReactionBranchDistanceClaim,
  createEvadeChoiceHandoffFromMove,
  reanchorChargePreviewToSecondaryTarget,
  resolveChargeBranchDistanceResult,
} from './p0-charge-branch-helpers.js';
import {
  applyCommittedChargeFollowThroughToUnits,
  applyAdjustedChargeDistanceToReactionRequests,
  canFinalizeChargeFollowThrough,
  createChargeFollowThroughCompletionRecord,
  getLatestAdjustedChargeDistanceResult,
  resolveChargeFollowThroughResolution,
  resolveChargePreviewChargeMovementPlan,
} from './p0-charge-follow-through-helpers.js';
import {
  canConfirmChargeDirection,
  completeChargeReactionRequests,
  createChargeDirectionSnapshot,
  getPrimaryChargeReactionRequest,
  resolveChargePreviewConformationPlan,
} from './p0-charge-preview-helpers.js';
import {
  createEvadeMoveResolutionFromPlan,
  resolveChargePreviewEvadePlan,
} from './p0-charge-evade-helpers.js';
import { applyCommittedEvadeMoveToUnits } from './p0-evade-move-state-helpers.js';
import { SETUP_VIEW_MODES } from './p0-setup.js';
import { getBattlefieldProfile } from '../data/battlefield-profiles.js';

export function reduceConfirmChargeDirection(state, cloneCommandSnapshot) {
  const preview = state.game.chargePreview;
  if (!canConfirmChargeDirection(preview)) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: CHARGE_PREVIEW_STATUSES.REACTION_PENDING,
        declarationSnapshot: createChargeDirectionSnapshot(state.game, preview, cloneCommandSnapshot),
        reactionDecision: null,
        handoffStatus: CHARGE_HANDOFF_STATUSES.NONE,
      }),
    },
  };
}

export function reduceResolveChargeReaction(state, decisionType) {
  const preview = state.game.chargePreview;
  const declarationSnapshot = preview?.declarationSnapshot ?? null;
  const primaryRequest = declarationSnapshot?.reactionRequests?.[0] ?? getPrimaryChargeReactionRequest(preview);
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.REACTION_PENDING
    || !declarationSnapshot
    || !primaryRequest
    || !decisionType
    || !isChargeReactionDecisionAllowed(primaryRequest.type, decisionType)
  ) {
    return state;
  }

  const handoffStatus = getChargeReactionDecisionHandoffStatus(decisionType);
  const nextStatus = handoffStatus === CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED
    ? CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    : CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF;
  const branchDistanceRoll = createChargeBranchDistanceClaim(state.game, preview, primaryRequest, handoffStatus);
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const nextConformationPlan = handoffStatus === CHARGE_HANDOFF_STATUSES.NO_EVADE
    ? resolveChargePreviewConformationPlan({
      selectedUnit: state.game.units.find((unit) => unit.id === preview.intent?.unitId) || null,
      contactEvents: preview.contactEvents,
      units: state.game.units,
      battlefieldProfile,
      hasPendingReaction: false,
      selectedContactSide: preview.selectedContactSide?.side ?? null,
    })
    : preview.conformationPlan;

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: nextStatus,
        reactionRequests: completeChargeReactionRequests(preview.reactionRequests),
        reactionDecision: createChargeReactionDecision({
          type: decisionType,
          unitId: primaryRequest.unitId,
          requestType: primaryRequest.type,
          handoffStatus,
          declarationSnapshot,
        }),
        branchDistanceRoll,
        handoffStatus,
        conformationPlan: nextConformationPlan,
      }),
    },
  };
}

export function reduceResolveSecondaryChargeReaction(state, decisionType) {
  const preview = state.game.chargePreview;
  const secondaryRequest = Array.isArray(preview?.reactionRequests)
    ? preview.reactionRequests.find((request, index) => index > 0 && request?.status === 'pending') ?? null
    : null;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || preview?.followThroughResolution?.status !== CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET
    || !secondaryRequest
    || !decisionType
    || !isChargeReactionDecisionAllowed(secondaryRequest.type, decisionType)
  ) {
    return state;
  }

  const handoffStatus = getChargeReactionDecisionHandoffStatus(decisionType);
  const nextStatus = handoffStatus === CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED
    ? CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    : CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF;
  const contactEventIndex = Number.isInteger(secondaryRequest.contactEventIndex)
    ? secondaryRequest.contactEventIndex
    : 0;
  const secondaryContactEvent = preview?.chargeMovementPlan?.contactState?.contactEvents?.[contactEventIndex] ?? null;
  const secondaryDeclarationSnapshot = createChargeDeclarationSnapshot({
    unitId: preview?.intent?.unitId ?? null,
    targetUnitId: secondaryRequest.unitId,
    targetSnapshot: state.game.units.find((unit) => unit.id === secondaryRequest.unitId) ?? null,
    startPose: preview?.chargeMovementPlan?.startPose ?? null,
    frozenDirectionRadians: preview?.chargeMovementPlan?.frozenDirectionRadians ?? null,
    pathSegments: preview?.chargeMovementPlan?.contactState?.pathSegments ?? [],
    contactEvent: secondaryContactEvent,
    reactionRequests: [secondaryRequest],
  });
  const branchDistanceRoll = createChargeReactionBranchDistanceClaim(
    state.game,
    preview,
    secondaryRequest,
    handoffStatus,
    secondaryDeclarationSnapshot,
  );
  const reanchoredPreview = reanchorChargePreviewToSecondaryTarget(
    preview,
    state.game,
    secondaryRequest,
    secondaryDeclarationSnapshot,
  );
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const nextConformationPlan = handoffStatus === CHARGE_HANDOFF_STATUSES.NO_EVADE
    ? resolveChargePreviewConformationPlan({
      selectedUnit: state.game.units.find((unit) => unit.id === reanchoredPreview.intent?.unitId) || null,
      contactEvents: reanchoredPreview.contactEvents,
      units: state.game.units,
      battlefieldProfile,
      hasPendingReaction: false,
      selectedContactSide: reanchoredPreview.selectedContactSide?.side ?? null,
    })
    : reanchoredPreview.conformationPlan;

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...reanchoredPreview,
        status: nextStatus,
        reactionRequests: preview.reactionRequests.map((request, index) => (
          index > 0
            && request?.unitId === secondaryRequest.unitId
            && request?.contactEventIndex === secondaryRequest.contactEventIndex
            ? {
                ...request,
                status: 'complete',
              }
            : request
        )),
        secondaryReactionDecision: createChargeReactionDecision({
          type: decisionType,
          unitId: secondaryRequest.unitId,
          requestType: secondaryRequest.type,
          handoffStatus,
          declarationSnapshot: secondaryDeclarationSnapshot,
        }),
        branchDistanceRoll,
        handoffStatus,
        conformationPlan: nextConformationPlan,
      }),
    },
  };
}

export function reduceResolveChargeBranchDistance(state, dieRoll) {
  const preview = state.game.chargePreview;
  if (
    preview?.status !== CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    || !preview?.branchDistanceRoll?.claim
    || preview?.branchDistanceRoll?.result
  ) {
    return state;
  }

  const result = resolveChargeBranchDistanceResult(state.game, preview, dieRoll);
  if (!result) {
    return state;
  }

  const branchReason = preview.branchDistanceRoll.claim.reason;

  if (branchReason === CHARGE_BRANCH_ROLL_REASONS.EVADE_DISTANCE) {
    const evadePlan = resolveChargePreviewEvadePlan(state.game, preview, result, {
      deferInitialBranchChoice: true,
    });
    const evadeMove = createEvadeMoveResolutionFromPlan(state.game, preview, evadePlan);
    const nextUnits = applyCommittedEvadeMoveToUnits(state.game.units, evadeMove);
    const evadeChoiceHandoff = createEvadeChoiceHandoffFromMove(state.game, evadeMove);
    const adjustedChargeResult = preview?.secondaryReactionDecision
      ? getLatestAdjustedChargeDistanceResult(preview)
      : null;
    const chargePreviewForReusedAdjustedCharge = adjustedChargeResult
      ? {
          ...preview,
          branchDistanceRoll: createChargeBranchDistanceState({
            history: preview?.branchDistanceRoll?.history ?? [],
            claim: adjustedChargeResult.claim ?? null,
            result: adjustedChargeResult,
          }),
          evadePlan,
          evadeMove,
        }
      : null;
    const nextChargeMovementPlan = adjustedChargeResult && evadeMove?.status === EVADE_MOVE_RESOLUTION_STATUSES.COMMITTED
      ? resolveChargePreviewChargeMovementPlan(
          {
            ...state.game,
            units: nextUnits,
          },
          chargePreviewForReusedAdjustedCharge,
          adjustedChargeResult,
        )
      : preview?.chargeMovementPlan ?? null;
    const nextFollowThroughResolution = adjustedChargeResult && nextChargeMovementPlan
      ? resolveChargeFollowThroughResolution(chargePreviewForReusedAdjustedCharge, nextChargeMovementPlan)
      : preview?.followThroughResolution ?? null;
    const nextReactionRequests = adjustedChargeResult && nextChargeMovementPlan
      ? applyAdjustedChargeDistanceToReactionRequests(
          {
            ...state.game,
            units: nextUnits,
          },
          chargePreviewForReusedAdjustedCharge,
          preview.reactionRequests,
          adjustedChargeResult,
          nextChargeMovementPlan,
        )
      : preview.reactionRequests;

    const nextPreview = createInitialChargePreview({
      ...preview,
      unitRollbackSnapshot: preview?.unitRollbackSnapshot?.length ? preview.unitRollbackSnapshot : state.game.units,
      branchDistanceRoll: createChargeBranchDistanceState({
        history: preview.branchDistanceRoll.history,
        claim: preview.branchDistanceRoll.claim,
        result,
      }),
      evadePlan,
      evadeMove,
      evadeChoiceHandoff,
      chargeMovementPlan: nextChargeMovementPlan,
      followThroughResolution: nextFollowThroughResolution,
      reactionRequests: nextReactionRequests,
    });

    if (canFinalizeChargeFollowThrough(nextPreview, nextChargeMovementPlan)) {
      const committedUnits = applyCommittedChargeFollowThroughToUnits(nextUnits, nextChargeMovementPlan);
      return {
        ...state,
        game: {
          ...state.game,
          setupViewMode: evadeChoiceHandoff.status === EVADE_CHOICE_HANDOFF_STATUSES.PENDING
            ? SETUP_VIEW_MODES.HOTSEAT_HANDOFF
            : state.game.setupViewMode,
          units: committedUnits,
          chargePreview: createInitialChargePreview(),
          lastChargeCompletion: createChargeFollowThroughCompletionRecord(nextPreview, nextChargeMovementPlan),
        },
      };
    }

    return {
      ...state,
      game: {
        ...state.game,
        setupViewMode: evadeChoiceHandoff.status === EVADE_CHOICE_HANDOFF_STATUSES.PENDING
          ? SETUP_VIEW_MODES.HOTSEAT_HANDOFF
          : state.game.setupViewMode,
        units: nextUnits,
        chargePreview: nextPreview,
      },
    };
  }

  const chargeMovementPlan = resolveChargePreviewChargeMovementPlan(state.game, preview, result);
  const nextPreview = createInitialChargePreview({
    ...preview,
    branchDistanceRoll: createChargeBranchDistanceState({
      history: preview.branchDistanceRoll.history,
      claim: preview.branchDistanceRoll.claim,
      result,
    }),
    evadePlan: preview.evadePlan ?? null,
    evadeMove: preview.evadeMove,
    chargeMovementPlan,
    followThroughResolution: resolveChargeFollowThroughResolution(preview, chargeMovementPlan),
    reactionRequests: applyAdjustedChargeDistanceToReactionRequests(state.game, preview, preview.reactionRequests, result, chargeMovementPlan),
  });

  if (canFinalizeChargeFollowThrough(nextPreview, chargeMovementPlan)) {
    return {
      ...state,
      game: {
        ...state.game,
        units: applyCommittedChargeFollowThroughToUnits(state.game.units, chargeMovementPlan),
        chargePreview: createInitialChargePreview(),
        lastChargeCompletion: createChargeFollowThroughCompletionRecord(nextPreview, chargeMovementPlan),
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