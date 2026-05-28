import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import {
  buildChargeStartSelectionResult,
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_HANDOFF_STATUSES,
  CHARGE_PATH_FAMILY_IDS,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_START_MANOEUVRE_TYPES,
  CHARGE_START_OPTION_STATUSES,
  CHARGE_TARGET_CANDIDATE_STATUSES,
  createChargeConformationPlan,
  createChargeIntent,
  createInitialChargePreview,
  getChargeStartOptions,
  getChargeTargetCandidateByUnitId,
  getChargeTargetCandidates,
  resolveChargeContactState,
} from '../engine/charge/index.js';
import { getUnitMovementBudgetUd } from '../engine/movement/budget.js';
import { createInitialAdvanceState } from './p0-advance.js';
import { createInitialMovementState } from './p0-movement.js';
import {
  getChargeContactSideOptions,
  getChargeReactionPreviewState,
  resolveChargePreviewConformationPlan,
  resolveChargeContactSideSelection,
} from './p0-charge-preview-helpers.js';
import { createInitialSlideState } from './p0-slide.js';
import { setActiveCommandMenuBranch } from './p0-state-ui-helpers.js';
import { createInitialWheelState } from './p0-wheel.js';

export function reduceStartChargePreview(state, unitId = state.game.selectedUnitId, deps) {
  const { canStartChargePreview, createChargeIntentFromUnit, createInitialCommanderFreeMovePreview } = deps;
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  if (!canStartChargePreview(state, unit)) {
    return state;
  }

  const targetCandidates = getChargeTargetCandidates({
    units: state.game.units,
    chargingUnitId: unit.id,
    battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
    deferPathFeasibility: true,
  });

  return {
    ...state,
    game: {
      ...setActiveCommandMenuBranch(state.game, 'charge'),
      movement: createInitialMovementState(),
      chargePreview: createInitialChargePreview({
        status: CHARGE_PREVIEW_STATUSES.TARGETING,
        intent: createChargeIntentFromUnit(state.game, unit),
        targetCandidates,
        conformationPlan: createChargeConformationPlan(),
      }),
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      ...createInitialAdvanceState(),
      ...createInitialSlideState(),
      ...createInitialWheelState(),
    },
  };
}

export function reduceSetChargeTarget(state, targetUnitId, deps) {
  const { createChargeTargetSnapshot } = deps;
  const preview = state.game.chargePreview;
  if (preview?.status !== CHARGE_PREVIEW_STATUSES.TARGETING || !preview.intent?.unitId || !targetUnitId) {
    return state;
  }

  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const chargingUnit = state.game.units.find((unit) => unit.id === preview.intent.unitId) || null;
  const targetUnit = state.game.units.find((unit) => unit.id === targetUnitId) || null;
  const previewCandidate = getChargeTargetCandidateByUnitId(preview.targetCandidates, targetUnitId);
  if (
    !chargingUnit
    || !targetUnit
    || !previewCandidate
    || previewCandidate.status !== CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE
    || chargingUnit.id === targetUnit.id
    || chargingUnit.owner === targetUnit.owner
  ) {
    return state;
  }

  const defaultStartResult = buildChargeStartSelectionResult({
    selectedUnit: chargingUnit,
    targetSnapshot: createChargeTargetSnapshot(targetUnit),
    manoeuvreType: CHARGE_START_MANOEUVRE_TYPES.NONE,
    battlefieldProfile,
  });
  const remainingChargeRangeUd = Math.max(
    0,
    getUnitMovementBudgetUd({ selectedUnit: chargingUnit, units: state.game.units }) - Number(defaultStartResult?.startManoeuvre?.spentBudgetUd ?? 0),
  );
  const currentStartTargetCandidates = defaultStartResult?.startPose
    ? getChargeTargetCandidates({
        units: state.game.units,
        chargingUnitId: chargingUnit.id,
        battlefieldProfile,
        targetUnitIds: [targetUnit.id],
        chargeContext: {
          startPose: defaultStartResult.startPose,
          remainingChargeRangeUd,
          allowedPathFamilies: [CHARGE_PATH_FAMILY_IDS.ADVANCE],
        },
      })
    : preview.targetCandidates;
  const currentStartTargetCandidate = getChargeTargetCandidateByUnitId(currentStartTargetCandidates, targetUnit.id);
  const currentPathContactState = resolveChargeContactState({
    selectedUnit: chargingUnit,
    targetUnit,
    pathSegments: defaultStartResult?.pathSegments ?? [],
    battlefieldProfile,
    units: state.game.units,
  });
  const useCurrentPathContactState = currentStartTargetCandidate?.status === CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE;
  const nextContactEvents = useCurrentPathContactState ? currentPathContactState.contactEvents : [];
  const nextReactionState = useCurrentPathContactState
    ? getChargeReactionPreviewState({
        selectedUnit: chargingUnit,
        targetUnit,
        pathSegments: currentPathContactState.pathSegments,
        contactEvents: nextContactEvents,
        units: state.game.units,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents)?.side ?? null,
      })
    : { reactionRequests: [], diagnostics: [], hasPendingReaction: false };
  const nextStatus = useCurrentPathContactState
    ? CHARGE_PREVIEW_STATUSES.READY
    : CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING;

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: nextStatus,
        startManoeuvreOptions: getChargeStartOptions({
          selectedUnit: chargingUnit,
          targetSnapshot: createChargeTargetSnapshot(targetUnit),
          battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
        }),
        targetCandidates: currentStartTargetCandidates,
        pathSegments: useCurrentPathContactState
          ? currentPathContactState.pathSegments
          : (defaultStartResult?.pathSegments ?? []),
        contactEvents: nextContactEvents,
        contactDecisionTrace: useCurrentPathContactState ? currentPathContactState.decisionTrace ?? [] : [],
        reactionRequests: useCurrentPathContactState ? nextReactionState.reactionRequests : [],
        declarationSnapshot: null,
        reactionDecision: null,
        handoffStatus: CHARGE_HANDOFF_STATUSES.NONE,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents),
        conformationPlan: useCurrentPathContactState
          ? resolveChargePreviewConformationPlan({
            selectedUnit: chargingUnit,
            contactEvents: nextContactEvents,
            units: state.game.units,
            battlefieldProfile,
            hasPendingReaction: nextReactionState.hasPendingReaction,
            selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents)?.side ?? null,
          })
          : createChargeConformationPlan(),
        diagnostics: [
          ...(currentStartTargetCandidate?.diagnostics ?? previewCandidate.diagnostics),
          ...(defaultStartResult?.diagnostics ?? []),
          ...(useCurrentPathContactState ? currentPathContactState.diagnostics : []),
          ...(useCurrentPathContactState ? nextReactionState.diagnostics : []),
        ],
        intent: createChargeIntent({
          ...preview.intent,
          targetUnitId: targetUnit.id,
          targetSnapshot: createChargeTargetSnapshot(targetUnit),
          startManoeuvre: defaultStartResult?.startManoeuvre ?? null,
          frozenDirectionRadians: defaultStartResult?.frozenDirectionRadians ?? null,
        }),
      }),
    },
  };
}

export function reduceSelectChargeStartManoeuvre(state, action) {
  const preview = state.game.chargePreview;
  const manoeuvreType = action?.manoeuvreType;
  if (
    !manoeuvreType
    || !preview?.intent?.unitId
    || ![CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING, CHARGE_PREVIEW_STATUSES.READY].includes(preview.status)
  ) {
    return state;
  }

  const selectedUnit = state.game.units.find((unit) => unit.id === preview.intent.unitId) || null;
  const option = (preview.startManoeuvreOptions ?? []).find((candidate) => candidate.type === manoeuvreType) || null;
  if (!selectedUnit || !option || option.status !== CHARGE_START_OPTION_STATUSES.AVAILABLE) {
    return state;
  }

  const targetSnapshot = preview.intent?.targetSnapshot ?? null;
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const result = buildChargeStartSelectionResult({
    selectedUnit,
    targetSnapshot,
    manoeuvreType,
    battlefieldProfile,
    slideSide: action?.slideSide,
    slideDistanceUd: action?.distanceUd,
    pivotSide: action?.pivotSide,
    wheelAngleRadians: action?.angleRadians,
  });
  if (!result) {
    return state;
  }

  if (!result.startPose) {
    return {
      ...state,
      game: {
        ...state.game,
        chargePreview: createInitialChargePreview({
          ...preview,
          status: CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING,
          diagnostics: result.diagnostics,
        }),
      },
    };
  }

  const remainingChargeRangeUd = Math.max(
    0,
    getUnitMovementBudgetUd({ selectedUnit, units: state.game.units }) - Number(result.startManoeuvre?.spentBudgetUd ?? 0),
  );
  const targetCandidates = getChargeTargetCandidates({
    units: state.game.units,
    chargingUnitId: selectedUnit.id,
    battlefieldProfile,
    targetUnitIds: [targetSnapshot?.unitId].filter(Boolean),
    chargeContext: {
      startPose: result.startPose,
      remainingChargeRangeUd,
      allowedPathFamilies: ['advance'],
    },
  });
  const selectedTargetCandidate = getChargeTargetCandidateByUnitId(targetCandidates, targetSnapshot?.unitId);
  const currentPathContactState = resolveChargeContactState({
    selectedUnit,
    targetUnit: state.game.units.find((unit) => unit.id === targetSnapshot?.unitId) || null,
    pathSegments: result.pathSegments,
    battlefieldProfile,
    units: state.game.units,
  });
  const useCurrentPathContactState = selectedTargetCandidate?.status === CHARGE_TARGET_CANDIDATE_STATUSES.ELIGIBLE;
  const nextContactEvents = useCurrentPathContactState ? currentPathContactState.contactEvents : [];
  const nextReactionState = useCurrentPathContactState
    ? getChargeReactionPreviewState({
        selectedUnit,
        targetUnit: state.game.units.find((unit) => unit.id === targetSnapshot?.unitId) || null,
        pathSegments: currentPathContactState.pathSegments,
        contactEvents: nextContactEvents,
        units: state.game.units,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents)?.side ?? null,
      })
    : { reactionRequests: [], diagnostics: [], hasPendingReaction: false };
  const nextStatus = useCurrentPathContactState
    ? CHARGE_PREVIEW_STATUSES.READY
    : CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING;

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: nextStatus,
        targetCandidates,
        pathSegments: useCurrentPathContactState ? currentPathContactState.pathSegments : result.pathSegments,
        contactEvents: nextContactEvents,
        contactDecisionTrace: useCurrentPathContactState ? currentPathContactState.decisionTrace ?? [] : [],
        reactionRequests: useCurrentPathContactState ? nextReactionState.reactionRequests : [],
        declarationSnapshot: null,
        reactionDecision: null,
        handoffStatus: CHARGE_HANDOFF_STATUSES.NONE,
        selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents),
        conformationPlan: useCurrentPathContactState
          ? resolveChargePreviewConformationPlan({
            selectedUnit,
            contactEvents: nextContactEvents,
            units: state.game.units,
            battlefieldProfile,
            hasPendingReaction: nextReactionState.hasPendingReaction,
            selectedContactSide: resolveChargeContactSideSelection(preview.selectedContactSide, nextContactEvents)?.side ?? null,
          })
          : createChargeConformationPlan(),
        diagnostics: [
          ...(selectedTargetCandidate?.diagnostics ?? []),
          ...result.diagnostics,
          ...(useCurrentPathContactState ? currentPathContactState.diagnostics : []),
          ...(useCurrentPathContactState ? nextReactionState.diagnostics : []),
        ],
        intent: createChargeIntent({
          ...preview.intent,
          startManoeuvre: result.startManoeuvre,
          startPose: result.startPose,
          frozenDirectionRadians: result.frozenDirectionRadians,
        }),
      }),
    },
  };
}

export function reducePreviewChargeStartManoeuvre(state, action) {
  const preview = state.game.chargePreview;
  const manoeuvreType = action?.manoeuvreType;
  if (
    !manoeuvreType
    || !preview?.intent?.unitId
    || ![CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING, CHARGE_PREVIEW_STATUSES.READY].includes(preview.status)
  ) {
    return state;
  }

  const selectedUnit = state.game.units.find((unit) => unit.id === preview.intent.unitId) || null;
  const option = (preview.startManoeuvreOptions ?? []).find((candidate) => candidate.type === manoeuvreType) || null;
  if (!selectedUnit || !option || option.status !== CHARGE_START_OPTION_STATUSES.AVAILABLE) {
    return state;
  }

  const result = buildChargeStartSelectionResult({
    selectedUnit,
    targetSnapshot: preview.intent?.targetSnapshot ?? null,
    manoeuvreType,
    battlefieldProfile: getBattlefieldProfile(state.game.battlefieldProfileId),
    slideSide: action?.slideSide,
    slideDistanceUd: action?.distanceUd,
    pivotSide: action?.pivotSide,
    wheelAngleRadians: action?.angleRadians,
  });
  if (!result) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        status: CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING,
        pathSegments: result.pathSegments,
        contactEvents: [],
        selectedContactSide: null,
        diagnostics: result.diagnostics,
        intent: createChargeIntent({
          ...preview.intent,
          startManoeuvre: result.startManoeuvre,
          startPose: result.startPose,
          frozenDirectionRadians: result.frozenDirectionRadians,
        }),
      }),
    },
  };
}

export function reduceCancelChargePreview(state) {
  if (state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.IDLE) {
    return state;
  }

  const nextUnits = Array.isArray(state.game.chargePreview?.unitRollbackSnapshot)
    && state.game.chargePreview.unitRollbackSnapshot.length > 0
    ? state.game.chargePreview.unitRollbackSnapshot
    : state.game.units;

  return {
    ...state,
    game: {
      ...setActiveCommandMenuBranch(state.game, null),
      units: nextUnits,
      chargePreview: createInitialChargePreview(),
    },
  };
}

export function reduceSelectChargeContactSide(state, action) {
  const preview = state.game.chargePreview;
  if (!preview || ![CHARGE_PREVIEW_STATUSES.MANOEUVRE_SELECTING, CHARGE_PREVIEW_STATUSES.READY].includes(preview.status)) {
    return state;
  }

  const primaryContactEvent = preview.contactEvents[0] ?? null;
  const classification = primaryContactEvent?.classification ?? null;
  const side = action?.side;
  if (
    !primaryContactEvent?.defenderId
    || action?.defenderId !== primaryContactEvent.defenderId
    || classification?.type !== CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
    || !getChargeContactSideOptions(classification).includes(side)
  ) {
    return state;
  }

  const nextSelectedContactSide = (
    preview.selectedContactSide?.defenderId === primaryContactEvent.defenderId
    && preview.selectedContactSide?.side === side
  )
    ? null
    : {
        defenderId: primaryContactEvent.defenderId,
        side,
      };

  return {
    ...state,
    game: {
      ...state.game,
      chargePreview: createInitialChargePreview({
        ...preview,
        selectedContactSide: nextSelectedContactSide,
      }),
    },
  };
}