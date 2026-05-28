import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
} from '../charge/classification.js';
import { getFirstOverlappingUnitId, isPoseInsideBattlefield } from '../charge/evade-geometry.js';
import { getAxesFromRotation, normalizeAngleRadians } from '../geometry/index.js';
import {
  CONFORMATION_CANDIDATE_STATUSES,
  CONFORMATION_OPTIONAL_CHOICE_TYPES,
  CONFORMATION_PLAN_STATUSES,
  CONFORMATION_SOURCE_STATUSES,
  createConformationCandidate,
  createConformationDiagnostic,
  createConformationPlan,
} from './model.js';
import { resolveSimpleConformationShift } from './shifting.js';

function createPoseFromSnapshot(pose = null, fallbackUnit = null) {
  return {
    xUd: Number(pose?.xUd ?? fallbackUnit?.xUd ?? 0),
    yUd: Number(pose?.yUd ?? fallbackUnit?.yUd ?? 0),
    rotationRadians: Number(pose?.rotationRadians ?? fallbackUnit?.rotationRadians ?? 0),
  };
}

function createIdealFrontConformationPose({ chargerUnit, defenderUnit, defenderPose }) {
  const axes = getAxesFromRotation(Number(defenderPose?.rotationRadians ?? 0));
  const contactDistanceUd = (Number(chargerUnit?.depthUd ?? 0) + Number(defenderUnit?.depthUd ?? 0)) / 2;

  return {
    xUd: Number((Number(defenderPose?.xUd ?? 0) + (axes.forwardAxis.x * contactDistanceUd)).toFixed(3)),
    yUd: Number((Number(defenderPose?.yUd ?? 0) + (axes.forwardAxis.y * contactDistanceUd)).toFixed(3)),
    rotationRadians: normalizeAngleRadians(Number(defenderPose?.rotationRadians ?? 0) + Math.PI),
  };
}

function createIdealRearConformationPose({ chargerUnit, defenderUnit, defenderPose }) {
  const axes = getAxesFromRotation(Number(defenderPose?.rotationRadians ?? 0));
  const contactDistanceUd = (Number(chargerUnit?.depthUd ?? 0) + Number(defenderUnit?.depthUd ?? 0)) / 2;

  return {
    xUd: Number((Number(defenderPose?.xUd ?? 0) - (axes.forwardAxis.x * contactDistanceUd)).toFixed(3)),
    yUd: Number((Number(defenderPose?.yUd ?? 0) - (axes.forwardAxis.y * contactDistanceUd)).toFixed(3)),
    rotationRadians: normalizeAngleRadians(Number(defenderPose?.rotationRadians ?? 0)),
  };
}

function createIdealFlankConformationPose({ chargerUnit, defenderUnit, defenderPose, flankSide }) {
  const axes = getAxesFromRotation(Number(defenderPose?.rotationRadians ?? 0));
  const contactDistanceUd = (Number(defenderUnit?.widthUd ?? 0) + Number(chargerUnit?.depthUd ?? 0)) / 2;
  const directionMultiplier = flankSide === CHARGE_CONTACT_FLANK_SIDES.RIGHT ? 1 : -1;
  const rotationOffset = flankSide === CHARGE_CONTACT_FLANK_SIDES.RIGHT ? (-Math.PI / 2) : (Math.PI / 2);

  return {
    xUd: Number((Number(defenderPose?.xUd ?? 0) + (axes.rightAxis.x * contactDistanceUd * directionMultiplier)).toFixed(3)),
    yUd: Number((Number(defenderPose?.yUd ?? 0) + (axes.rightAxis.y * contactDistanceUd * directionMultiplier)).toFixed(3)),
    rotationRadians: normalizeAngleRadians(Number(defenderPose?.rotationRadians ?? 0) + rotationOffset),
  };
}

function createPlanBase({ contactSnapshot, contactClassification, defenderId, idealPose, selectedCandidateId }) {
  return {
    sourceStatus: CONFORMATION_SOURCE_STATUSES.VERIFIED,
    controllingEnemyId: defenderId,
    principalOpponentId: defenderId,
    contactSnapshot,
    contactClassification,
    diagnostics: [],
    selectedCandidateId,
    candidates: [],
    shiftingPlan: null,
    optionalChoice: null,
    idealPose,
  };
}

function normalizeString(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getUnsupportedSpecialCaseReasons(...units) {
  const reasons = [];

  for (const unit of units.filter(Boolean)) {
    const labels = [unit.troopType, unit.profileId, unit.unitType, unit.baseType]
      .map(normalizeString)
      .filter(Boolean);
    const hasLabel = (pattern) => labels.some((label) => label.includes(pattern));

    if (hasLabel('war-wagon') || hasLabel('war wagon')) {
      reasons.push({ unitId: unit.id ?? null, reason: 'war-wagon-special-case' });
    }

    if (hasLabel('heavy-artillery') || hasLabel('heavy artillery')) {
      reasons.push({ unitId: unit.id ?? null, reason: 'heavy-artillery-special-case' });
    }

    if (unit.defendingBehindFortification || unit.defendingBehindObstacle || unit.defendingBehindStakes) {
      reasons.push({ unitId: unit.id ?? null, reason: 'defensive-barrier-special-case' });
    }
  }

  return reasons;
}

function getPenalizingTerrainChoice({ terrainConformation = null, contactSnapshot = null }) {
  const terrainChoice = terrainConformation ?? contactSnapshot?.terrainConformation ?? null;
  const entersPenalizingTerrain = Boolean(
    terrainChoice?.fullConformationEntersPenalizingTerrain
      ?? terrainChoice?.idealPoseEntersPenalizingTerrain
      ?? terrainChoice?.entersPenalizingTerrain,
  );

  if (!entersPenalizingTerrain) {
    return null;
  }

  return {
    terrainId: terrainChoice.terrainId ?? null,
    terrainType: terrainChoice.terrainType ?? null,
    penalizedUnitId: terrainChoice.penalizedUnitId ?? null,
    sourceStatus: terrainChoice.sourceStatus ?? CONFORMATION_SOURCE_STATUSES.VERIFIED,
  };
}

function resolveConformationContactType(contactClassification, selectedContactSide) {
  if (contactClassification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    return {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT,
      contactSide: 'front',
      candidateId: 'front-primary',
      contactRelationship: 'front-edge-to-front-edge',
    };
  }

  if (contactClassification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    return {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR,
      contactSide: 'rear',
      candidateId: 'rear-primary',
      contactRelationship: 'front-edge-to-rear-edge',
    };
  }

  if (contactClassification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK && contactClassification?.flankSide) {
    return {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: contactClassification.flankSide,
      contactSide: contactClassification.flankSide,
      candidateId: `flank-${contactClassification.flankSide}-primary`,
      contactRelationship: `front-edge-to-${contactClassification.flankSide}-flank-edge`,
    };
  }

  if (contactClassification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK) {
    if (selectedContactSide === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
      return {
        type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR,
        contactSide: 'rear',
        candidateId: 'rear-primary',
        contactRelationship: 'front-edge-to-rear-edge',
      };
    }

    if (
      selectedContactSide === CHARGE_CONTACT_FLANK_SIDES.LEFT
      || selectedContactSide === CHARGE_CONTACT_FLANK_SIDES.RIGHT
    ) {
      return {
        type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
        flankSide: selectedContactSide,
        contactSide: selectedContactSide,
        candidateId: `flank-${selectedContactSide}-primary`,
        contactRelationship: `front-edge-to-${selectedContactSide}-flank-edge`,
      };
    }
  }

  return null;
}

function createIdealConformationPose({ chargerUnit, defenderUnit, defenderPose, resolvedContactType }) {
  if (resolvedContactType?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    return createIdealFrontConformationPose({ chargerUnit, defenderUnit, defenderPose });
  }

  if (resolvedContactType?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    return createIdealRearConformationPose({ chargerUnit, defenderUnit, defenderPose });
  }

  if (resolvedContactType?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK && resolvedContactType?.flankSide) {
    return createIdealFlankConformationPose({
      chargerUnit,
      defenderUnit,
      defenderPose,
      flankSide: resolvedContactType.flankSide,
    });
  }

  return null;
}

function createUnsupportedContactTypePlan({
  contactSnapshot,
  contactClassification,
  selectedContactSide = null,
}) {
  const selectionRequired = contactClassification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
    && !selectedContactSide;

  return createConformationPlan({
    status: selectionRequired ? CONFORMATION_PLAN_STATUSES.CHOICE_REQUIRED : CONFORMATION_PLAN_STATUSES.SOURCE_OPEN,
    sourceStatus: selectionRequired
      ? CONFORMATION_SOURCE_STATUSES.VERIFIED
      : CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    contactSnapshot,
    contactClassification,
    diagnostics: [createConformationDiagnostic({
      code: selectionRequired
        ? 'conformation.rear-or-flank.selection-required'
        : 'conformation.unsupported-contact-type',
      severity: 'warn',
      message: selectionRequired
        ? 'Rear-or-flank conformation requires a reducer-owned side selection before candidate generation can continue.'
        : 'The conformation solver does not support the current contact classification yet.',
      sourceStatus: selectionRequired
        ? CONFORMATION_SOURCE_STATUSES.VERIFIED
        : CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    })],
  });
}

function createUnsupportedSpecialCasePlan({
  contactSnapshot,
  contactClassification,
  specialCaseReasons,
}) {
  return createConformationPlan({
    status: CONFORMATION_PLAN_STATUSES.SOURCE_OPEN,
    sourceStatus: CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    contactSnapshot,
    contactClassification,
    diagnostics: [createConformationDiagnostic({
      code: 'conformation.special-case.needs-source-check',
      severity: 'warn',
      message: 'This conformation involves a special unit or defensive-barrier case that is outside the supported P7B single-unit subset.',
      sourceStatus: CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      details: { specialCaseReasons },
    })],
  });
}

function createIncompleteCandidate({ resolvedContactType, currentPose, idealPose, defenderUnit, chargerUnit, diagnostic }) {
  const sourceStatus = diagnostic?.sourceStatus ?? CONFORMATION_SOURCE_STATUSES.VERIFIED;

  return createConformationCandidate({
    id: resolvedContactType.candidateId,
    status: CONFORMATION_CANDIDATE_STATUSES.INCOMPLETE,
    contactSide: resolvedContactType.contactSide,
    contactRelationship: resolvedContactType.contactRelationship,
    finalPose: currentPose,
    movementPose: idealPose,
    principalOpponentId: defenderUnit.id ?? null,
    sourceStatus,
    diagnostics: [createConformationDiagnostic({
      ...diagnostic,
      candidateId: resolvedContactType.candidateId,
      unitId: chargerUnit.id ?? null,
      sourceStatus,
    })],
  });
}

function createIncompletePlan({ planBase, resolvedContactType, currentPose, idealPose, defenderUnit, chargerUnit, diagnostic }) {
  const sourceStatus = diagnostic?.sourceStatus ?? CONFORMATION_SOURCE_STATUSES.VERIFIED;
  const normalizedDiagnostic = createConformationDiagnostic({
    ...diagnostic,
    candidateId: resolvedContactType.candidateId,
    unitId: chargerUnit.id ?? null,
    sourceStatus,
  });

  return createConformationPlan({
    ...planBase,
    status: CONFORMATION_PLAN_STATUSES.READY,
    sourceStatus,
    candidates: [createIncompleteCandidate({
      resolvedContactType,
      currentPose,
      idealPose,
      defenderUnit,
      chargerUnit,
      diagnostic,
    })],
    diagnostics: [normalizedDiagnostic],
  });
}

function createShiftFailurePlan({
  planBase,
  resolvedContactType,
  chargerUnit,
  shiftResult,
  overlapUnitId,
}) {
  const shiftDiagnostic = shiftResult.shiftingPlan?.diagnostics?.[0] ?? createConformationDiagnostic({
    code: 'conformation.shift.unsupported',
    severity: 'warn',
    message: `Complete ${resolvedContactType.contactSide} conformation is blocked by unit '${overlapUnitId}', and the current simple shifting slice could not resolve it honestly.`,
    sourceStatus: CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  });
  const normalizedDiagnostic = createConformationDiagnostic({
    ...shiftDiagnostic,
    candidateId: resolvedContactType.candidateId,
    unitId: chargerUnit.id ?? null,
    sourceStatus: shiftResult.shiftingPlan?.sourceStatus
      ?? shiftDiagnostic.sourceStatus
      ?? CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    details: {
      overlapUnitId,
      ...(shiftDiagnostic.details ?? {}),
    },
  });

  return createConformationPlan({
    ...planBase,
    status: shiftResult.shiftingPlan?.status === 'blocked'
      ? CONFORMATION_PLAN_STATUSES.BLOCKED
      : CONFORMATION_PLAN_STATUSES.SOURCE_OPEN,
    sourceStatus: normalizedDiagnostic.sourceStatus,
    selectedCandidateId: null,
    shiftingPlan: shiftResult.shiftingPlan,
    diagnostics: [normalizedDiagnostic],
  });
}

function createOptionalTerrainPlan({ planBase, resolvedContactType, currentPose, idealPose, defenderUnit, chargerUnit, terrainChoice }) {
  const optionalChoice = {
    type: CONFORMATION_OPTIONAL_CHOICE_TYPES.TERRAIN,
    prompt: 'Full conformation would enter terrain that penalizes this unit in melee; choose whether to stay incomplete or enter the terrain.',
    options: [
      {
        id: 'stay-incomplete',
        label: 'Stay incomplete outside penalizing terrain',
        candidateStatus: CONFORMATION_CANDIDATE_STATUSES.INCOMPLETE,
      },
      {
        id: 'enter-penalizing-terrain',
        label: 'Enter penalizing terrain and conform fully',
        candidateStatus: CONFORMATION_CANDIDATE_STATUSES.OPTIONAL,
      },
    ],
    sourceStatus: terrainChoice.sourceStatus,
  };
  const optionalDiagnostic = createConformationDiagnostic({
    code: `conformation.${resolvedContactType.contactSide}.terrain-optional`,
    severity: 'warn',
    message: 'Full conformation enters terrain that penalizes the unit in melee; the rules make this an explicit player choice rather than mandatory full conformation.',
    candidateId: resolvedContactType.candidateId,
    unitId: chargerUnit.id ?? null,
    sourceStatus: terrainChoice.sourceStatus,
    details: terrainChoice,
  });

  return createConformationPlan({
    ...planBase,
    status: CONFORMATION_PLAN_STATUSES.CHOICE_REQUIRED,
    sourceStatus: terrainChoice.sourceStatus,
    selectedCandidateId: null,
    optionalChoice,
    candidates: [
      createIncompleteCandidate({
        resolvedContactType,
        currentPose,
        idealPose,
        defenderUnit,
        chargerUnit,
        diagnostic: {
          code: `conformation.${resolvedContactType.contactSide}.terrain-incomplete-option`,
          severity: 'warn',
          message: 'The unit may remain in incomplete conformation instead of entering penalizing terrain.',
          details: terrainChoice,
        },
      }),
      createConformationCandidate({
        id: `${resolvedContactType.candidateId}-enter-penalizing-terrain`,
        status: CONFORMATION_CANDIDATE_STATUSES.OPTIONAL,
        contactSide: resolvedContactType.contactSide,
        contactRelationship: resolvedContactType.contactRelationship,
        finalPose: idealPose,
        movementPose: currentPose,
        principalOpponentId: defenderUnit.id ?? null,
        sourceStatus: terrainChoice.sourceStatus,
        optionalChoice,
        diagnostics: [optionalDiagnostic],
      }),
    ],
    diagnostics: [optionalDiagnostic],
  });
}

function createShiftedConformationPlan({
  planBase,
  resolvedContactType,
  currentPose,
  idealPose,
  defenderUnit,
  shiftResult,
}) {
  const shiftDiagnostic = shiftResult.shiftingPlan.diagnostics[0] ?? createConformationDiagnostic({
    code: 'conformation.shift.ready',
    severity: 'warn',
    message: 'A friendly unit shifts to clear the conformation lane.',
    sourceStatus: CONFORMATION_SOURCE_STATUSES.VERIFIED,
  });

  return createConformationPlan({
    ...planBase,
    status: CONFORMATION_PLAN_STATUSES.READY,
    shiftingPlan: shiftResult.shiftingPlan,
    diagnostics: [shiftDiagnostic],
    candidates: [createConformationCandidate({
      id: resolvedContactType.candidateId,
      status: CONFORMATION_CANDIDATE_STATUSES.COMPLETE,
      contactSide: resolvedContactType.contactSide,
      contactRelationship: resolvedContactType.contactRelationship,
      finalPose: idealPose,
      movementPose: currentPose,
      principalOpponentId: defenderUnit.id ?? null,
      sourceStatus: CONFORMATION_SOURCE_STATUSES.VERIFIED,
      shiftingPlan: shiftResult.shiftingPlan,
      diagnostics: [shiftDiagnostic],
    })],
  });
}

function createUnsupportedOverlapPlan({ planBase, resolvedContactType, overlapUnitId, chargerUnit }) {
  return createConformationPlan({
    ...planBase,
    status: CONFORMATION_PLAN_STATUSES.SOURCE_OPEN,
    sourceStatus: CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    selectedCandidateId: null,
    diagnostics: [createConformationDiagnostic({
      code: `conformation.${resolvedContactType.contactSide}.overlap-needs-source-check`,
      severity: 'warn',
      message: `Complete ${resolvedContactType.contactSide} conformation overlaps unit '${overlapUnitId}', and only simple friendly-blocker fallback is supported in the current subset.`,
      candidateId: resolvedContactType.candidateId,
      unitId: chargerUnit.id ?? null,
      sourceStatus: CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      details: { overlapUnitId },
    })],
  });
}

export function resolveConformationPlan({
  chargerUnit,
  defenderUnit,
  contactSnapshot = null,
  contactClassification = null,
  selectedContactSide = null,
  units = [],
  battlefieldProfile = null,
  terrainConformation = null,
}) {
  if (!chargerUnit || !defenderUnit || !contactSnapshot?.defenderPose) {
    return createConformationPlan({
      status: CONFORMATION_PLAN_STATUSES.SOURCE_OPEN,
      sourceStatus: CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      contactSnapshot,
      contactClassification,
      diagnostics: [createConformationDiagnostic({
        code: 'conformation.front.missing-snapshot',
        severity: 'warn',
        message: 'Front conformation requires a full defender/contact snapshot.',
        sourceStatus: CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      })],
    });
  }

  const specialCaseReasons = getUnsupportedSpecialCaseReasons(chargerUnit, defenderUnit);
  if (specialCaseReasons.length > 0) {
    return createUnsupportedSpecialCasePlan({
      contactSnapshot,
      contactClassification,
      specialCaseReasons,
    });
  }

  const resolvedContactType = resolveConformationContactType(contactClassification, selectedContactSide);
  if (!resolvedContactType) {
    return createUnsupportedContactTypePlan({
      contactSnapshot,
      contactClassification,
      selectedContactSide,
    });
  }

  const defenderPose = createPoseFromSnapshot(contactSnapshot.defenderPose, defenderUnit);
  const currentPose = createPoseFromSnapshot(contactSnapshot.chargerContactPose, chargerUnit);
  const idealPose = createIdealConformationPose({
    chargerUnit,
    defenderUnit,
    defenderPose,
    resolvedContactType,
  });
  const planBase = createPlanBase({
    contactSnapshot,
    contactClassification,
    defenderId: defenderUnit.id ?? null,
    idealPose,
    selectedCandidateId: resolvedContactType.candidateId,
  });
  const tableEdgeCode = `conformation.${resolvedContactType.contactSide}.table-edge-incomplete`;
  const overlapCode = `conformation.${resolvedContactType.contactSide}.blocker-incomplete`;
  const penalizingTerrainChoice = getPenalizingTerrainChoice({ terrainConformation, contactSnapshot });

  if (!isPoseInsideBattlefield({ reactingUnit: chargerUnit, pose: idealPose, battlefieldProfile })) {
    return createIncompletePlan({
      planBase,
      resolvedContactType,
      currentPose,
      idealPose,
      defenderUnit,
      chargerUnit,
      diagnostic: {
        code: tableEdgeCode,
        severity: 'warn',
        message: `Complete ${resolvedContactType.contactSide} conformation would leave the battlefield, so the supported fallback remains incomplete contact.`,
      },
    });
  }

  if (penalizingTerrainChoice) {
    return createOptionalTerrainPlan({
      planBase,
      resolvedContactType,
      currentPose,
      idealPose,
      defenderUnit,
      chargerUnit,
      terrainChoice: penalizingTerrainChoice,
    });
  }

  const overlapUnitId = getFirstOverlappingUnitId({
    reactingUnit: chargerUnit,
    pose: idealPose,
    units,
    ignoredUnitIds: [chargerUnit.id, defenderUnit.id].filter(Boolean),
    shrinkFootprintUd: 0,
  });
  const overlapUnit = units.find((unit) => unit?.id === overlapUnitId) ?? null;

  if (overlapUnitId && overlapUnit?.owner === chargerUnit?.owner) {
    const shiftResult = resolveSimpleConformationShift({
      chargerUnit,
      defenderUnit,
      blockerUnit: overlapUnit,
      idealPose,
      units,
      battlefieldProfile,
    });

    if (shiftResult.shiftingPlan?.status === 'ready') {
      return createShiftedConformationPlan({
        planBase,
        resolvedContactType,
        currentPose,
        idealPose,
        defenderUnit,
        shiftResult,
      });
    }

    if (shiftResult.shiftingPlan?.status === 'blocked' || shiftResult.shiftingPlan?.status === 'source-open') {
      return createShiftFailurePlan({
        planBase,
        resolvedContactType,
        chargerUnit,
        shiftResult,
        overlapUnitId,
      });
    }

    return createIncompletePlan({
      planBase,
      resolvedContactType,
      currentPose,
      idealPose,
      defenderUnit,
      chargerUnit,
      diagnostic: {
        code: shiftResult.shiftingPlan?.status === 'blocked'
          ? `conformation.${resolvedContactType.contactSide}.shift-blocked-incomplete`
          : overlapCode,
        severity: 'warn',
        message: shiftResult.shiftingPlan?.status === 'blocked'
          ? `Complete ${resolvedContactType.contactSide} conformation is blocked by unit '${overlapUnitId}', and the current simple shifting slice could not clear it.`
          : `Complete ${resolvedContactType.contactSide} conformation is blocked by unit '${overlapUnitId}', so the supported fallback remains incomplete contact.`,
        details: {
          overlapUnitId,
          shiftingPlan: shiftResult.shiftingPlan?.status && shiftResult.shiftingPlan?.status !== 'none'
            ? shiftResult.shiftingPlan
            : null,
        },
      },
    });
  }

  if (overlapUnitId) {
    return createUnsupportedOverlapPlan({
      planBase,
      resolvedContactType,
      overlapUnitId,
      chargerUnit,
    });
  }

  return createConformationPlan({
    ...planBase,
    status: CONFORMATION_PLAN_STATUSES.READY,
    candidates: [createConformationCandidate({
      id: resolvedContactType.candidateId,
      status: CONFORMATION_CANDIDATE_STATUSES.COMPLETE,
      contactSide: resolvedContactType.contactSide,
      contactRelationship: resolvedContactType.contactRelationship,
      finalPose: idealPose,
      movementPose: currentPose,
      principalOpponentId: defenderUnit.id ?? null,
      sourceStatus: CONFORMATION_SOURCE_STATUSES.VERIFIED,
    })],
  });
}

export function resolveFrontConformationPlan(options) {
  return resolveConformationPlan(options);
}