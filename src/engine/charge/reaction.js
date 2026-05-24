import {
  CHARGE_HANDOFF_STATUSES,
  CHARGE_REACTION_DECISION_TYPES,
  CHARGE_REACTION_REQUEST_TYPES,
  createChargeReactionRequest,
} from './model.js';
import { GEOMETRY_EPSILON, getUnitBaseGeometry, worldPointToLocalPoint } from '../geometry/index.js';
import { evaluateSimpleBlockedEvade, resolveEvadeReorientation } from './evade.js';
import { getEnemyZocBandLocalBounds } from '../zoc/geometry.js';

export const CHARGE_REACTION_SOURCE_STATUSES = {
  DEFAULT_NONE: 'default-none',
  EXPLICIT_PROFILE: 'explicit-profile',
  CAPABILITY_DATA: 'capability-data',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

const EVASION_CAPABILITY_FAMILIES = {
  LIGHT_INFANTRY: 'light-infantry',
  LIGHT_CAVALRY: 'light-cavalry',
  JAVELINMEN: 'javelinmen',
  CAVALRY: 'cavalry',
  CAMELRY: 'camelry',
  LIGHT_CHARIOT: 'light-chariot',
};

function cloneSerializable(value) {
  if (value == null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function isKnownReactionType(type) {
  return Object.values(CHARGE_REACTION_REQUEST_TYPES).includes(type);
}

function hasMissileBowCrossbowCapability(capability) {
  return Boolean(
    capability?.hasBow
    || capability?.hasCrossbow
    || capability?.hasDoubleBow
    || capability?.hasDoubleCrossbow,
  );
}

function isCapabilityFamilyEvadeCapable(capability) {
  if (!capability?.family) {
    return false;
  }

  if (
    capability.family === EVASION_CAPABILITY_FAMILIES.LIGHT_INFANTRY
    || capability.family === EVASION_CAPABILITY_FAMILIES.LIGHT_CAVALRY
    || capability.family === EVASION_CAPABILITY_FAMILIES.JAVELINMEN
  ) {
    return true;
  }

  if (
    capability.family === EVASION_CAPABILITY_FAMILIES.CAVALRY
    && capability.hasImpact
    && hasMissileBowCrossbowCapability(capability)
  ) {
    return true;
  }

  if (
    (
      capability.family === EVASION_CAPABILITY_FAMILIES.CAVALRY
      || capability.family === EVASION_CAPABILITY_FAMILIES.CAMELRY
      || capability.family === EVASION_CAPABILITY_FAMILIES.LIGHT_CHARIOT
    )
    && !capability.hasImpact
    && !capability.hasImpetuous
  ) {
    return true;
  }

  return false;
}

function isCapabilityHeavyCharge(chargingUnit) {
  const capability = chargingUnit?.chargeReactionCapability ?? null;
  if (capability?.chargeWeight === 'heavy') {
    return true;
  }

  if (capability?.chargeWeight === 'light') {
    return false;
  }

  return false;
}

function normalizeBlockedEvadeDiagnostic(blockedEvade) {
  if (blockedEvade == null) {
    return null;
  }

  if (typeof blockedEvade === 'string') {
    return createChargeReactionDiagnostic({
      code: 'charge.reaction.blocked-evade-capability',
      status: 'info',
      text: blockedEvade,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
    });
  }

  if (typeof blockedEvade === 'object' && typeof blockedEvade.text === 'string') {
    return createChargeReactionDiagnostic({
      code: blockedEvade.code ?? 'charge.reaction.blocked-evade-capability',
      status: blockedEvade.status ?? 'info',
      text: blockedEvade.text,
      sourceStatus: blockedEvade.sourceStatus ?? CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
    });
  }

  return createChargeReactionDiagnostic({
    code: 'charge.reaction.invalid-capability-blocked-evade',
    status: 'needs-source-check',
    text: 'Blocked evade capability data is malformed and cannot be evaluated safely.',
    sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  });
}

function createBlockedEvadeZocDiagnostic(contacts) {
  const enemyIds = contacts
    .map((contact) => contact.enemyUnitId)
    .filter(Boolean)
    .join(', ');

  return createChargeReactionDiagnostic({
    code: 'charge.reaction.blocked-evade-enemy-zoc',
    status: 'info',
    text: `The contacted defender cannot evade because enemy ZoC lies directly ahead of its reoriented front edge${enemyIds ? ` from '${enemyIds}'` : ''}.`,
    sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
  });
}

function createBlockedEvadeObstacleDiagnostic(blockerUnitIds) {
  const blockerIds = blockerUnitIds.filter(Boolean).join(', ');

  return createChargeReactionDiagnostic({
    code: 'charge.reaction.blocked-evade-obstacle',
    status: 'info',
    text: `The contacted defender cannot evade because a simple blocker lies less than 1 UD directly ahead and no slide of 1 UD or less clears the evade lane${blockerIds ? ` from '${blockerIds}'` : ''}.`,
    sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
  });
}

function normalizePoseUnit(unit = {}) {
  return {
    id: unit.id ?? null,
    owner: unit.owner ?? null,
    xUd: Number.isFinite(unit.xUd) ? unit.xUd : 0,
    yUd: Number.isFinite(unit.yUd) ? unit.yUd : 0,
    widthUd: Number.isFinite(unit.widthUd) ? unit.widthUd : 1,
    depthUd: Number.isFinite(unit.depthUd) ? unit.depthUd : 1,
    rotationRadians: Number.isFinite(unit.rotationRadians) ? unit.rotationRadians : 0,
  };
}

function isEnemyForTarget(enemyUnit, targetUnit) {
  const normalizedEnemy = normalizePoseUnit(enemyUnit);
  const normalizedTarget = normalizePoseUnit(targetUnit);

  if (!normalizedEnemy.owner || !normalizedTarget.owner) {
    return true;
  }

  return normalizedEnemy.owner !== normalizedTarget.owner;
}

function clipLineSegmentToAxisAlignedBounds(startPoint, endPoint, bounds) {
  const deltaX = endPoint.x - startPoint.x;
  const deltaY = endPoint.y - startPoint.y;
  let entry = 0;
  let exit = 1;

  function clipBoundary(p, q) {
    if (Math.abs(p) <= GEOMETRY_EPSILON) {
      return q >= -GEOMETRY_EPSILON;
    }

    const ratio = q / p;
    if (p < 0) {
      if (ratio > exit) {
        return false;
      }
      if (ratio > entry) {
        entry = ratio;
      }
      return true;
    }

    if (ratio < entry) {
      return false;
    }
    if (ratio < exit) {
      exit = ratio;
    }
    return true;
  }

  const intersects = clipBoundary(-deltaX, startPoint.x - bounds.minX)
    && clipBoundary(deltaX, bounds.maxX - startPoint.x)
    && clipBoundary(-deltaY, startPoint.y - bounds.minY)
    && clipBoundary(deltaY, bounds.maxY - startPoint.y);

  if (!intersects) {
    return false;
  }

  return exit >= entry && exit - entry >= GEOMETRY_EPSILON;
}

function doesReorientedFrontEdgeIntersectEnemyZoc(enemyUnit, reorientedUnit) {
  const normalizedEnemy = normalizePoseUnit(enemyUnit);
  const normalizedTarget = normalizePoseUnit(reorientedUnit);
  const targetGeometry = getUnitBaseGeometry({
    center: { x: normalizedTarget.xUd, y: normalizedTarget.yUd },
    widthUd: normalizedTarget.widthUd,
    depthUd: normalizedTarget.depthUd,
    rotationRadians: normalizedTarget.rotationRadians,
  });
  const enemyRectangle = {
    center: { x: normalizedEnemy.xUd, y: normalizedEnemy.yUd },
    widthUd: normalizedEnemy.widthUd,
    depthUd: normalizedEnemy.depthUd,
    rotationRadians: normalizedEnemy.rotationRadians,
  };
  const frontEdgeStart = worldPointToLocalPoint(enemyRectangle, targetGeometry.frontEdge.start);
  const frontEdgeEnd = worldPointToLocalPoint(enemyRectangle, targetGeometry.frontEdge.end);
  const { localBounds } = getEnemyZocBandLocalBounds(normalizedEnemy);

  return clipLineSegmentToAxisAlignedBounds(frontEdgeStart, frontEdgeEnd, {
    minX: localBounds.minX - GEOMETRY_EPSILON,
    maxX: localBounds.maxX + GEOMETRY_EPSILON,
    minY: localBounds.minY + GEOMETRY_EPSILON,
    maxY: localBounds.maxY + GEOMETRY_EPSILON,
  });
}

function getBlockedEvadeFrontEdgeZocContacts(enemyUnits, reorientedUnit) {
  if (!Array.isArray(enemyUnits)) {
    return [];
  }

  return enemyUnits
    .filter((enemyUnit) => isEnemyForTarget(enemyUnit, reorientedUnit))
    .filter((enemyUnit) => doesReorientedFrontEdgeIntersectEnemyZoc(enemyUnit, reorientedUnit))
    .map((enemyUnit) => ({ enemyUnitId: enemyUnit.id ?? null }))
    .sort((left, right) => String(left.enemyUnitId).localeCompare(String(right.enemyUnitId)));
}

function getBlockedEvadeFromReorientation({
  targetUnit,
  contactEvent,
  selectedContactSide = null,
  units = [],
}) {
  if (!targetUnit || !contactEvent?.classification || !contactEvent?.contactSnapshot) {
    return null;
  }

  const { reorientedPose } = resolveEvadeReorientation({
    reactingUnit: targetUnit,
    contactClassification: contactEvent.classification,
    selectedContactSide,
    contactSnapshot: contactEvent.contactSnapshot,
  });
  const reorientedUnit = {
    ...targetUnit,
    xUd: reorientedPose.xUd,
    yUd: reorientedPose.yUd,
    rotationRadians: reorientedPose.rotationRadians,
  };
  const enemyUnits = Array.isArray(units)
    ? units.filter((unit) => unit?.id && unit.id !== targetUnit.id)
    : [];
  const zocContacts = getBlockedEvadeFrontEdgeZocContacts(enemyUnits, reorientedUnit);

  if (zocContacts.length > 0) {
    return createBlockedEvadeZocDiagnostic(zocContacts);
  }

  const simpleBlockedEvade = evaluateSimpleBlockedEvade({
    reorientedUnit,
    units: Array.isArray(units) ? units.filter((unit) => unit?.id && unit.id !== targetUnit.id) : [],
    ignoredUnitIds: [targetUnit.id],
  });

  if (!simpleBlockedEvade.isBlocked) {
    return null;
  }

  return createBlockedEvadeObstacleDiagnostic(simpleBlockedEvade.blockerUnitIds);
}

export function createChargeReactionDiagnostic(overrides = {}) {
  return {
    code: overrides.code ?? 'charge.reaction.info',
    label: overrides.label ?? 'reaction',
    status: overrides.status ?? 'info',
    text: overrides.text ?? '',
    sourceStatus: overrides.sourceStatus ?? null,
  };
}

function normalizeChargeReactionProfile(targetUnit) {
  const profile = targetUnit?.chargeReactionProfile ?? null;
  if (profile == null) {
    return {
      type: CHARGE_REACTION_REQUEST_TYPES.NONE,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.DEFAULT_NONE,
      diagnostics: [],
    };
  }

  if (typeof profile === 'string' && isKnownReactionType(profile)) {
    return {
      type: profile,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.EXPLICIT_PROFILE,
      diagnostics: [],
    };
  }

  if (typeof profile === 'object' && isKnownReactionType(profile.type)) {
    return {
      type: profile.type,
      sourceStatus: profile.sourceStatus ?? CHARGE_REACTION_SOURCE_STATUSES.EXPLICIT_PROFILE,
      diagnostics: Array.isArray(profile.diagnostics) ? profile.diagnostics : [],
    };
  }

  return {
    type: CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK,
    sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    diagnostics: [
      createChargeReactionDiagnostic({
        code: 'charge.reaction.invalid-profile',
        status: 'needs-source-check',
        text: `Unit '${targetUnit?.id ?? 'unknown'}' has an invalid chargeReactionProfile and is blocked pending a source-checked reaction mapping.`,
        sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      }),
    ],
  };
}

function normalizeChargeReactionCapability(chargingUnit, targetUnit) {
  const capability = targetUnit?.chargeReactionCapability ?? null;
  if (capability == null) {
    return null;
  }

  if (typeof capability !== 'object' || typeof capability.family !== 'string') {
    return {
      type: CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      diagnostics: [
        createChargeReactionDiagnostic({
          code: 'charge.reaction.invalid-capability-data',
          status: 'needs-source-check',
          text: `Unit '${targetUnit?.id ?? 'unknown'}' has missing or invalid chargeReactionCapability data and is blocked pending a source-checked reaction mapping.`,
          sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
        }),
      ],
    };
  }

  if (capability.engagedInMelee || (capability.inMeleeSupport && !capability.providesOnlySimpleSupport)) {
    return {
      type: CHARGE_REACTION_REQUEST_TYPES.NONE,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
      diagnostics: [
        createChargeReactionDiagnostic({
          code: 'charge.reaction.cannot-evade-engaged',
          status: 'info',
          text: 'The contacted defender cannot evade because it is engaged in melee or provides melee support beyond simple support.',
          sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
        }),
      ],
    };
  }

  const blockedEvadeDiagnostic = normalizeBlockedEvadeDiagnostic(capability.blockedEvade ?? null);
  if (blockedEvadeDiagnostic != null) {
    if (blockedEvadeDiagnostic.status === 'needs-source-check') {
      return {
        type: CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK,
        sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
        diagnostics: [blockedEvadeDiagnostic],
      };
    }

    return {
      type: CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
      diagnostics: [blockedEvadeDiagnostic],
    };
  }

  const mustEvade = (
    capability.family === EVASION_CAPABILITY_FAMILIES.LIGHT_INFANTRY
    && capability.inOpenTerrain !== false
    && isCapabilityHeavyCharge(chargingUnit)
    && !capability.wouldConformIntoLightTroops
    && !capability.wouldConformIntoElephants
    && !capability.wouldConformIntoScythedChariots
    && !capability.wouldSupportFriendlyAfterConformation
  );
  if (mustEvade) {
    return {
      type: CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
      diagnostics: [],
    };
  }

  if (isCapabilityFamilyEvadeCapable(capability)) {
    return {
      type: CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
      diagnostics: [],
    };
  }

  return {
    type: CHARGE_REACTION_REQUEST_TYPES.NONE,
    sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
    diagnostics: [
      createChargeReactionDiagnostic({
        code: 'charge.reaction.cannot-evade-family',
        status: 'info',
        text: 'The contacted defender does not belong to the first supported evade-capable troop families.',
        sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
      }),
    ],
  };
}

export function resolveChargeReactionState({
  chargingUnit,
  targetUnit,
  contactEvents = [],
  pathSegments = [],
  units = [],
  selectedContactSide = null,
}) {
  const primaryContactEvent = Array.isArray(contactEvents) ? (contactEvents[0] ?? null) : null;
  if (!chargingUnit || !targetUnit || !primaryContactEvent || primaryContactEvent.defenderId !== targetUnit.id) {
    return {
      reactionRequests: [],
      diagnostics: [],
    };
  }

  const normalizedProfile = normalizeChargeReactionProfile(targetUnit);
  const normalizedCapability = normalizedProfile.sourceStatus === CHARGE_REACTION_SOURCE_STATUSES.DEFAULT_NONE
    ? normalizeChargeReactionCapability(chargingUnit, targetUnit)
    : null;
  let resolvedReaction = normalizedCapability ?? normalizedProfile;
  const blockedEvadeDiagnostic = (
    resolvedReaction.type === CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE
    || resolvedReaction.type === CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE
  )
    ? getBlockedEvadeFromReorientation({
        targetUnit,
        contactEvent: primaryContactEvent,
        selectedContactSide,
        units,
      })
    : null;
  if (blockedEvadeDiagnostic) {
    resolvedReaction = {
      type: CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE,
      sourceStatus: CHARGE_REACTION_SOURCE_STATUSES.CAPABILITY_DATA,
      diagnostics: [blockedEvadeDiagnostic],
    };
  }
  const diagnostics = [...resolvedReaction.diagnostics];
  if (resolvedReaction.type === CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE) {
    diagnostics.push(createChargeReactionDiagnostic({
      code: 'charge.reaction.may-evade',
      status: 'info',
      text: 'The contacted defender currently exposes an explicit may-evade hook. P7 pauses here instead of inventing evade movement.',
      sourceStatus: resolvedReaction.sourceStatus,
    }));
  } else if (resolvedReaction.type === CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE) {
    diagnostics.push(createChargeReactionDiagnostic({
      code: 'charge.reaction.must-evade',
      status: 'info',
      text: 'The contacted defender currently exposes an explicit must-evade hook. P7 pauses here instead of inventing evade movement.',
      sourceStatus: resolvedReaction.sourceStatus,
    }));
  } else if (resolvedReaction.type === CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE) {
    diagnostics.push(createChargeReactionDiagnostic({
      code: 'charge.reaction.blocked-evade',
      status: 'info',
      text: 'The contacted defender currently exposes an explicit blocked-evade hook. P7 preserves the pause state instead of silently skipping the reaction step.',
      sourceStatus: resolvedReaction.sourceStatus,
    }));
  } else if (resolvedReaction.type === CHARGE_REACTION_REQUEST_TYPES.NEEDS_SOURCE_CHECK && diagnostics.length === 0) {
    diagnostics.push(createChargeReactionDiagnostic({
      code: 'charge.reaction.needs-source-check',
      status: 'needs-source-check',
      text: 'The contacted defender needs a source-checked reaction mapping before charge resolution can continue safely.',
      sourceStatus: resolvedReaction.sourceStatus,
    }));
  }

  return {
    reactionRequests: [
      createChargeReactionRequest({
        type: resolvedReaction.type,
        unitId: targetUnit.id,
        status: resolvedReaction.type === CHARGE_REACTION_REQUEST_TYPES.NONE ? 'complete' : 'pending',
        diagnostics,
        sourceStatus: resolvedReaction.sourceStatus,
        contactEventIndex: 0,
        chargePathSnapshot: cloneSerializable(pathSegments),
        contactSnapshot: cloneSerializable(primaryContactEvent.contactSnapshot ?? null),
        adjustedChargeDistanceUd: null,
        caughtByCharger: false,
        actionLogToken: null,
      }),
    ],
    diagnostics,
  };
}

export function getChargeReactionDecisionOptions(requestType) {
  if (requestType === CHARGE_REACTION_REQUEST_TYPES.NONE) {
    return [CHARGE_REACTION_DECISION_TYPES.NO_EVADE];
  }

  if (requestType === CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE) {
    return [CHARGE_REACTION_DECISION_TYPES.BLOCKED_NO_EVADE];
  }

  if (requestType === CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE) {
    return [CHARGE_REACTION_DECISION_TYPES.NO_EVADE, CHARGE_REACTION_DECISION_TYPES.EVADE];
  }

  if (requestType === CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE) {
    return [CHARGE_REACTION_DECISION_TYPES.FORCED_EVADE];
  }

  return [];
}

export function isChargeReactionDecisionAllowed(requestType, decisionType) {
  return getChargeReactionDecisionOptions(requestType).includes(decisionType);
}

export function getChargeReactionDecisionHandoffStatus(decisionType) {
  if (decisionType === CHARGE_REACTION_DECISION_TYPES.NO_EVADE) {
    return CHARGE_HANDOFF_STATUSES.NO_EVADE;
  }

  if (decisionType === CHARGE_REACTION_DECISION_TYPES.BLOCKED_NO_EVADE) {
    return CHARGE_HANDOFF_STATUSES.BLOCKED_NO_EVADE;
  }

  if (
    decisionType === CHARGE_REACTION_DECISION_TYPES.EVADE
    || decisionType === CHARGE_REACTION_DECISION_TYPES.FORCED_EVADE
  ) {
    return CHARGE_HANDOFF_STATUSES.EVADE_REQUIRED;
  }

  return CHARGE_HANDOFF_STATUSES.NONE;
}