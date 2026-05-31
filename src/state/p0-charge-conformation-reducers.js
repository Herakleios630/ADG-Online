import { CHARGE_PREVIEW_STATUSES, createInitialChargePreview } from '../engine/charge/index.js';
import {
  CONFORMATION_CANDIDATE_STATUSES,
  CONFORMATION_PLAN_STATUSES,
  CONFORMATION_SHIFTING_PLAN_STATUSES,
  createConformationPlan,
} from '../engine/conformation/index.js';

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function getSelectedConformationCandidate(conformationPlan) {
  if (!conformationPlan) {
    return null;
  }

  return (conformationPlan.candidates ?? []).find((candidate) => candidate.id === conformationPlan.selectedCandidateId)
    ?? conformationPlan.candidates?.[0]
    ?? null;
}

function canApplyConformationCandidate(candidate) {
  return candidate?.finalPose
    && candidate.status === CONFORMATION_CANDIDATE_STATUSES.COMPLETE;
}

export function canConfirmChargeConformation(preview) {
  const conformationPlan = preview?.conformationPlan ?? null;
  const selectedCandidate = getSelectedConformationCandidate(conformationPlan);
  const shiftingPlan = conformationPlan?.shiftingPlan ?? null;
  const shiftingReady = !shiftingPlan
    || shiftingPlan.status === CONFORMATION_SHIFTING_PLAN_STATUSES.NONE
    || shiftingPlan.status === CONFORMATION_SHIFTING_PLAN_STATUSES.READY;

  return preview?.status === CHARGE_PREVIEW_STATUSES.NO_EVADE_HANDOFF
    && conformationPlan?.status === CONFORMATION_PLAN_STATUSES.READY
    && canApplyConformationCandidate(selectedCandidate)
    && shiftingReady;
}

function createAppliedConformationMetadata({ preview, candidate }) {
  const conformationPlan = preview?.conformationPlan ?? null;
  return {
    status: CONFORMATION_PLAN_STATUSES.APPLIED,
    appliedAtPhase: 'movement',
    candidateId: candidate?.id ?? null,
    candidateStatus: candidate?.status ?? null,
    contactSide: candidate?.contactSide ?? null,
    contactRelationship: candidate?.contactRelationship ?? null,
    principalOpponentId: conformationPlan?.principalOpponentId ?? candidate?.principalOpponentId ?? null,
    controllingEnemyId: conformationPlan?.controllingEnemyId ?? null,
    sourceStatus: candidate?.sourceStatus ?? conformationPlan?.sourceStatus ?? null,
    finalPose: cloneSerializable(candidate?.finalPose ?? null),
    meleeTriggerBridge: cloneSerializable(candidate?.meleeTriggerBridge ?? null),
    contactSnapshot: cloneSerializable(conformationPlan?.contactSnapshot ?? null),
    contactClassification: cloneSerializable(conformationPlan?.contactClassification ?? null),
    shiftingPlan: cloneSerializable(conformationPlan?.shiftingPlan ?? null),
  };
}

function applyShiftToUnit(unit, shiftingStep, lockEffect, appliedMetadata) {
  const toPose = shiftingStep?.toPose ?? null;
  if (!toPose) {
    return unit;
  }

  return {
    ...unit,
    xUd: Number(toPose.xUd ?? unit.xUd),
    yUd: Number(toPose.yUd ?? unit.yUd),
    rotationRadians: Number(toPose.rotationRadians ?? unit.rotationRadians ?? 0),
    movementOrRallyLockedByConformation: Boolean(lockEffect?.movedOrRalliedLock),
    conformationShiftLockSource: lockEffect ? cloneSerializable(lockEffect) : null,
    lastConformationShift: {
      ...cloneSerializable(shiftingStep),
      appliedConformation: appliedMetadata,
    },
  };
}

function applyConfirmedConformationToUnits(units, preview, candidate, appliedMetadata) {
  const chargerUnitId = preview?.intent?.unitId ?? null;
  const defenderUnitId = appliedMetadata.principalOpponentId ?? preview?.intent?.targetUnitId ?? null;
  const shiftSteps = Array.isArray(preview?.conformationPlan?.shiftingPlan?.steps)
    ? preview.conformationPlan.shiftingPlan.steps
    : [];
  const lockEffects = Array.isArray(preview?.conformationPlan?.shiftingPlan?.lockEffects)
    ? preview.conformationPlan.shiftingPlan.lockEffects
    : [];
  const shiftStepByUnitId = new Map(shiftSteps.map((step) => [step?.unitId, step]));
  const lockEffectByUnitId = new Map(lockEffects.map((effect) => [effect?.unitId, effect]));

  return units.map((unit) => {
    if (unit.id === chargerUnitId) {
      return {
        ...unit,
        xUd: Number(candidate.finalPose.xUd ?? unit.xUd),
        yUd: Number(candidate.finalPose.yUd ?? unit.yUd),
        rotationRadians: Number(candidate.finalPose.rotationRadians ?? unit.rotationRadians ?? 0),
        advanceUsedUd: Math.max(Number(unit.advanceUsedUd ?? 0), Number(preview?.pathSegments?.[0]?.distanceUd ?? 0)),
        moveCountThisSequence: Math.max(Number(unit.moveCountThisSequence ?? 0), 1),
        stayedThisMovementPhase: true,
        hasChargedThisSequence: true,
        cannotShootThisSequence: true,
        engagedInMelee: true,
        meleePending: true,
        meleePendingOpponentId: defenderUnitId,
        conformationApplied: appliedMetadata,
      };
    }

    if (unit.id === defenderUnitId) {
      return {
        ...unit,
        engagedInMelee: true,
        meleePending: true,
        meleePendingOpponentId: chargerUnitId,
        conformationApplied: appliedMetadata,
      };
    }

    if (shiftStepByUnitId.has(unit.id)) {
      return applyShiftToUnit(
        unit,
        shiftStepByUnitId.get(unit.id),
        lockEffectByUnitId.get(unit.id),
        appliedMetadata,
      );
    }

    return unit;
  });
}

export function reduceConfirmChargeConformation(state) {
  const preview = state.game.chargePreview;
  if (!canConfirmChargeConformation(preview)) {
    return state;
  }

  const selectedCandidate = getSelectedConformationCandidate(preview.conformationPlan);
  const appliedMetadata = createAppliedConformationMetadata({ preview, candidate: selectedCandidate });
  const appliedPlan = createConformationPlan({
    ...preview.conformationPlan,
    status: CONFORMATION_PLAN_STATUSES.APPLIED,
  });

  return {
    ...state,
    game: {
      ...state.game,
      units: applyConfirmedConformationToUnits(state.game.units, preview, selectedCandidate, appliedMetadata),
      chargePreview: createInitialChargePreview(),
      lastChargeCompletion: {
        unitId: preview.intent?.unitId ?? null,
        targetUnitId: appliedMetadata.principalOpponentId ?? preview.intent?.targetUnitId ?? null,
        conformationPlan: appliedPlan,
        appliedConformation: appliedMetadata,
        reactionDecision: cloneSerializable(preview.reactionDecision ?? preview.secondaryReactionDecision ?? null),
        declarationSnapshot: cloneSerializable(preview.declarationSnapshot ?? null),
      },
    },
  };
}