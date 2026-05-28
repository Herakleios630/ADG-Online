import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_CONTACT_EVENT_TYPES,
  CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_MOVEMENT_CONTINUATION_DECISIONS,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_REACTION_REQUEST_TYPES,
  createChargeFollowThroughResolution,
  createChargeReactionRequest,
  resolveAdjustedChargeFollowThroughContactState,
  resolveAdjustedChargeFollowThroughPlan,
  resolveChargeReactionState,
} from '../engine/charge/index.js';

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

export function resolveChargePreviewChargeMovementPlan(gameState, preview, result) {
  if (!result || preview?.declarationSnapshot == null) {
    return preview?.chargeMovementPlan ?? null;
  }

  if (preview?.branchDistanceRoll?.claim?.reason !== CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
    return preview?.chargeMovementPlan ?? null;
  }

  const chargingUnitId = preview?.intent?.unitId ?? null;
  const chargingUnit = gameState.units.find((unit) => unit.id === chargingUnitId) ?? null;
  const declarationSnapshot = preview?.declarationSnapshot ?? null;

  if (!chargingUnit || !declarationSnapshot) {
    return null;
  }

  const contactState = resolveAdjustedChargeFollowThroughContactState({
    chargingUnit,
    declarationSnapshot,
    distanceRollResult: result,
    evadePlan: preview?.evadePlan ?? null,
    evadeMove: preview?.evadeMove ?? null,
    battlefieldProfile: getBattlefieldProfile(gameState.battlefieldProfileId),
    units: gameState.units,
  });

  return resolveAdjustedChargeFollowThroughPlan({
    chargingUnit,
    declarationSnapshot,
    distanceRollResult: result,
    contactState,
  });
}

export function getLatestAdjustedChargeDistanceResult(preview) {
  const currentResult = preview?.branchDistanceRoll?.claim?.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE
    ? preview?.branchDistanceRoll?.result ?? null
    : null;
  if (currentResult?.claim?.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
    return currentResult;
  }

  const history = Array.isArray(preview?.branchDistanceRoll?.history)
    ? [...preview.branchDistanceRoll.history]
    : [];

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entryResult = history[index]?.result ?? null;
    if (entryResult?.claim?.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE) {
      return entryResult;
    }
  }

  return null;
}

export function createSecondaryTargetReactionRequests(gameState, preview, chargeMovementPlan = null) {
  const contactEvents = Array.isArray(chargeMovementPlan?.contactState?.contactEvents)
    ? chargeMovementPlan.contactState.contactEvents
    : [];
  const secondaryContactEvents = contactEvents
    .map((contactEvent, contactEventIndex) => ({ contactEvent, contactEventIndex }))
    .filter(({ contactEvent }) => (
      contactEvent?.type === CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT
      && Boolean(contactEvent?.defenderId)
    ));

  if (secondaryContactEvents.length === 0) {
    return [];
  }

  const chargingUnit = gameState.units.find((unit) => unit.id === preview?.intent?.unitId) ?? null;
  const secondaryRequestsByUnitId = new Map();

  secondaryContactEvents.forEach(({ contactEvent, contactEventIndex }) => {
    const targetUnit = gameState.units.find((unit) => unit.id === contactEvent.defenderId) ?? null;
    if (secondaryRequestsByUnitId.has(contactEvent.defenderId)) {
      return;
    }

    if (!chargingUnit || !targetUnit) {
      secondaryRequestsByUnitId.set(contactEvent.defenderId, createChargeReactionRequest({
        type: CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK,
        unitId: contactEvent.defenderId,
        status: 'pending',
        diagnostics: [
          {
            code: 'charge.reaction.secondary-target-pause',
            status: 'needs-source-check',
            text: 'The adjusted charge hit a secondary target, but the secondary reaction request could not be reconstructed safely.',
            sourceStatus: 'needs-source-check',
          },
        ],
        sourceStatus: 'needs-source-check',
        contactEventIndex,
        chargePathSnapshot: chargeMovementPlan?.contactState?.pathSegments ?? [],
        contactSnapshot: contactEvent.contactSnapshot ?? null,
      }));
      return;
    }

    const secondaryReactionState = resolveChargeReactionState({
      chargingUnit,
      targetUnit,
      contactEvents: [contactEvent],
      pathSegments: chargeMovementPlan?.contactState?.pathSegments ?? [],
      units: gameState.units,
    });

    if (secondaryReactionState.reactionRequests[0]) {
      secondaryRequestsByUnitId.set(contactEvent.defenderId, {
        ...secondaryReactionState.reactionRequests[0],
        status: 'pending',
        contactEventIndex,
      });
    }
  });

  return [...secondaryRequestsByUnitId.values()].filter(Boolean);
}

export function applyAdjustedChargeDistanceToReactionRequests(gameState, preview, reactionRequests, result, chargeMovementPlan = null) {
  if (!Array.isArray(reactionRequests)) {
    return [];
  }

  const firstContactEvent = chargeMovementPlan?.contactState?.contactEvents?.[0] ?? null;

  const nextReactionRequests = reactionRequests.map((request, index) => (
    index === 0
      ? {
          ...request,
          adjustedChargeDistanceUd: result?.resolvedDistanceUd ?? request?.adjustedChargeDistanceUd ?? null,
          caughtByCharger: firstContactEvent?.type === CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT
            && firstContactEvent?.defenderId === request?.unitId,
        }
      : request
  ));

  const secondaryReactionRequests = createSecondaryTargetReactionRequests(gameState, preview, chargeMovementPlan);
  secondaryReactionRequests.forEach((secondaryReactionRequest) => {
    const alreadyQueued = nextReactionRequests.some((request) => request?.unitId === secondaryReactionRequest.unitId);
    if (!alreadyQueued) {
      nextReactionRequests.push(secondaryReactionRequest);
    }
  });

  return nextReactionRequests;
}

export function resolveChargeFollowThroughResolution(preview, chargeMovementPlan = null) {
  const firstContactEvent = chargeMovementPlan?.contactState?.contactEvents?.[0] ?? null;
  const primaryRequest = preview?.reactionRequests?.[0] ?? null;
  const activeTargetUnitId = preview?.declarationSnapshot?.targetUnitId
    ?? preview?.intent?.targetUnitId
    ?? preview?.followThroughResolution?.selectedTargetId
    ?? firstContactEvent?.selectedTargetId
    ?? primaryRequest?.unitId
    ?? null;

  if (!firstContactEvent) {
    return createChargeFollowThroughResolution(preview?.followThroughResolution ?? null);
  }

  if (
    firstContactEvent.type === CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT
    && firstContactEvent.defenderId === activeTargetUnitId
  ) {
    return createChargeFollowThroughResolution({
      status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.CAUGHT_EVADER,
      defenderId: firstContactEvent.defenderId,
      selectedTargetId: activeTargetUnitId,
      contactType: firstContactEvent.type,
      combatPosture: CHARGE_FOLLOW_THROUGH_COMBAT_POSTURES.REAR_ATTACK,
      cohesionLoss: {
        amount: 1,
        reason: 'caught-evader',
        exceptionStatus: 'light-charger-check-pending',
      },
    });
  }

  if (firstContactEvent.type === CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT) {
    return createChargeFollowThroughResolution({
      status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET,
      defenderId: firstContactEvent.defenderId,
      selectedTargetId: activeTargetUnitId,
      contactType: firstContactEvent.type,
    });
  }

  if (firstContactEvent.type === CHARGE_CONTACT_EVENT_TYPES.FRIENDLY_BLOCKER) {
    return createChargeFollowThroughResolution({
      status: CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.FRIENDLY_BLOCKER,
      defenderId: firstContactEvent.defenderId,
      selectedTargetId: activeTargetUnitId,
      contactType: firstContactEvent.type,
    });
  }

  return createChargeFollowThroughResolution();
}

export function canFinalizeChargeFollowThrough(preview, chargeMovementPlan = null) {
  const continuationChoice = chargeMovementPlan?.continuationChoice ?? null;
  const hasBlockingContact = Boolean(chargeMovementPlan?.contactState?.contactEvents?.length);
  const continuationResolved = !continuationChoice?.required
    || [
      CHARGE_MOVEMENT_CONTINUATION_DECISIONS.STOP,
      CHARGE_MOVEMENT_CONTINUATION_DECISIONS.CONTINUE,
    ].includes(continuationChoice.selectedOption);

  return preview?.status === CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    && Boolean(chargeMovementPlan?.chargingUnitId)
    && Boolean(chargeMovementPlan?.endPose)
    && !hasBlockingContact
    && continuationResolved;
}

export function applyCommittedChargeFollowThroughToUnits(units, chargeMovementPlan = null) {
  if (!Array.isArray(units)) {
    return [];
  }

  const chargingUnitId = chargeMovementPlan?.chargingUnitId ?? null;
  const endPose = chargeMovementPlan?.endPose ?? null;
  const spentDistanceUd = Number(chargeMovementPlan?.distanceUd ?? 0);

  if (!chargingUnitId || !endPose) {
    return units;
  }

  return units.map((unit) => {
    if (unit.id !== chargingUnitId) {
      return unit;
    }

    return {
      ...unit,
      xUd: Number(endPose.xUd ?? unit.xUd),
      yUd: Number(endPose.yUd ?? unit.yUd),
      rotationRadians: Number(endPose.rotationRadians ?? unit.rotationRadians ?? 0),
      advanceUsedUd: Math.max(Number(unit.advanceUsedUd ?? 0), spentDistanceUd),
      moveCountThisSequence: Math.max(Number(unit.moveCountThisSequence ?? 0), 1),
      stayedThisMovementPhase: true,
      hasChargedThisSequence: true,
      cannotShootThisSequence: true,
    };
  });
}

export function createChargeFollowThroughCompletionRecord(preview, chargeMovementPlan = null) {
  return {
    unitId: preview?.intent?.unitId ?? null,
    targetUnitId: preview?.declarationSnapshot?.targetUnitId ?? preview?.intent?.targetUnitId ?? null,
    chargeMovementPlan: cloneSerializable(chargeMovementPlan ?? null),
    followThroughResolution: cloneSerializable(preview?.followThroughResolution ?? null),
    reactionDecision: cloneSerializable(preview?.reactionDecision ?? preview?.secondaryReactionDecision ?? null),
    declarationSnapshot: cloneSerializable(preview?.declarationSnapshot ?? null),
    evadeMove: cloneSerializable(preview?.evadeMove ?? null),
    conformationPlan: null,
    appliedConformation: null,
  };
}