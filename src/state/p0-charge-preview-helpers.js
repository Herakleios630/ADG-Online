import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_REACTION_REQUEST_TYPES,
  createChargeDeclarationSnapshot,
  resolveChargeReactionState,
} from '../engine/charge/index.js';
import { createChargeConformationPlan } from '../engine/charge/model.js';
import { resolveConformationPlan } from '../engine/conformation/index.js';

export function getChargeContactSideOptions(classification) {
  if (!classification?.type) {
    return [];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    return ['front'];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    return ['rear'];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK) {
    return classification.flankSide ? [classification.flankSide] : [];
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK) {
    return classification.flankSide ? ['rear', classification.flankSide] : ['rear'];
  }

  return [];
}

export function resolveChargeContactSideSelection(currentSelection, contactEvents) {
  const primaryContactEvent = Array.isArray(contactEvents) ? (contactEvents[0] ?? null) : null;
  const classification = primaryContactEvent?.classification ?? null;
  if (
    !primaryContactEvent?.defenderId
    || classification?.type !== CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
  ) {
    return null;
  }

  const allowedSides = getChargeContactSideOptions(classification);
  if (
    currentSelection?.defenderId === primaryContactEvent.defenderId
    && allowedSides.includes(currentSelection.side)
  ) {
    return currentSelection;
  }

  return null;
}

export function getChargeReactionPreviewState({ selectedUnit, targetUnit, pathSegments, contactEvents, units = [], selectedContactSide = null }) {
  const reactionState = resolveChargeReactionState({
    chargingUnit: selectedUnit,
    targetUnit,
    contactEvents,
    pathSegments,
    units,
    selectedContactSide,
  });
  const hasPendingReaction = reactionState.reactionRequests.some(
    (request) => request.type !== CHARGE_REACTION_REQUEST_TYPES.NONE && request.status === 'pending',
  );

  return {
    ...reactionState,
    hasPendingReaction,
  };
}

export function getPrimaryChargeReactionRequest(preview) {
  return Array.isArray(preview?.reactionRequests) ? (preview.reactionRequests[0] ?? null) : null;
}

export function chargePreviewRequiresContactSideSelection(preview) {
  const classification = preview?.contactEvents?.[0]?.classification ?? null;
  return classification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
    && !preview?.selectedContactSide?.side;
}

export function canConfirmChargeDirection(preview) {
  return preview?.status === CHARGE_PREVIEW_STATUSES.READY
    && Boolean(preview?.intent?.unitId)
    && Boolean(preview?.intent?.targetUnitId)
    && Array.isArray(preview?.pathSegments)
    && preview.pathSegments.length > 0
    && Array.isArray(preview?.contactEvents)
    && preview.contactEvents.length > 0
    && !chargePreviewRequiresContactSideSelection(preview);
}

export function createChargeDirectionSnapshot(gameState, preview, cloneCommandSnapshotFn) {
  return createChargeDeclarationSnapshot({
    unitId: preview.intent?.unitId ?? null,
    targetUnitId: preview.intent?.targetUnitId ?? null,
    targetSnapshot: preview.intent?.targetSnapshot ?? null,
    startPose: preview.intent?.startPose ?? null,
    startManoeuvre: preview.intent?.startManoeuvre ?? null,
    frozenDirectionRadians: preview.intent?.frozenDirectionRadians ?? null,
    commandSnapshot: cloneCommandSnapshotFn(gameState.commandContext?.inCommand ?? preview.intent?.commandSnapshot),
    selectedContactSide: preview.selectedContactSide ?? null,
    pathSegments: preview.pathSegments,
    contactEvent: preview.contactEvents?.[0] ?? null,
    reactionRequests: preview.reactionRequests,
  });
}

export function completeChargeReactionRequests(reactionRequests) {
  return Array.isArray(reactionRequests)
    ? reactionRequests.map((request) => ({
        ...request,
        status: 'complete',
      }))
    : [];
}

export function resolveChargePreviewConformationPlan({
  selectedUnit,
  contactEvents,
  units,
  battlefieldProfile,
  hasPendingReaction,
  selectedContactSide = null,
}) {
  if (hasPendingReaction) {
    return createChargeConformationPlan();
  }

  const primaryContactEvent = Array.isArray(contactEvents) ? (contactEvents[0] ?? null) : null;
  const defenderUnit = units.find((unit) => unit.id === primaryContactEvent?.defenderId) || null;
  if (!primaryContactEvent?.contactSnapshot || !primaryContactEvent?.classification || !defenderUnit) {
    return createChargeConformationPlan();
  }

  return resolveConformationPlan({
    chargerUnit: selectedUnit,
    defenderUnit,
    contactSnapshot: primaryContactEvent.contactSnapshot,
    contactClassification: primaryContactEvent.classification,
    selectedContactSide,
    units,
    battlefieldProfile,
  });
}