import { getResolvedAbilityIdsForUnit } from '../../data/unit-profiles.js';
import { getFootprintCommandRangeMeasurement } from '../command/range.js';
import { getFirstOverlappingUnitId, isPoseInsideBattlefield } from '../charge/evade-geometry.js';
import {
  GEOMETRY_EPSILON,
  addVectors,
  getAxesFromRotation,
  getUnitBaseGeometry,
  scaleVector,
  worldPointToLocalPoint,
} from '../geometry/index.js';
import {
  CONFORMATION_SHIFTING_PLAN_STATUSES,
  CONFORMATION_SOURCE_STATUSES,
  createConformationDiagnostic,
  createConformationShiftPlan,
} from './model.js';

const SHIFT_CLEARANCE_EPSILON_UD = 0.005;

function normalizeString(value) {
  return String(value ?? '').trim().toLowerCase();
}

function createFootprintFromPose(unit, pose = null) {
  return {
    id: unit?.id ?? null,
    xUd: Number(pose?.xUd ?? unit?.xUd ?? 0),
    yUd: Number(pose?.yUd ?? unit?.yUd ?? 0),
    widthUd: Number(unit?.widthUd ?? 0),
    depthUd: Number(unit?.depthUd ?? unit?.widthUd ?? 0),
    rotationRadians: Number(pose?.rotationRadians ?? unit?.rotationRadians ?? 0),
    baseShape: unit?.baseShape === 'circle' ? 'circle' : 'rectangle',
  };
}

function getLocalBoundsForFootprintRelativeToUnit(targetFootprint, unit, pose = null) {
  const unitFootprint = createFootprintFromPose(unit, pose);
  const unitGeometry = getUnitBaseGeometry({
    center: { x: unitFootprint.xUd, y: unitFootprint.yUd },
    widthUd: unitFootprint.widthUd,
    depthUd: unitFootprint.depthUd,
    rotationRadians: unitFootprint.rotationRadians,
  });
  const targetGeometry = getUnitBaseGeometry({
    center: { x: Number(targetFootprint.xUd ?? 0), y: Number(targetFootprint.yUd ?? 0) },
    widthUd: Number(targetFootprint.widthUd ?? 0),
    depthUd: Number(targetFootprint.depthUd ?? 0),
    rotationRadians: Number(targetFootprint.rotationRadians ?? 0),
  });
  const localPoints = [
    targetGeometry.center,
    targetGeometry.corners.frontLeft,
    targetGeometry.corners.frontRight,
    targetGeometry.corners.rearRight,
    targetGeometry.corners.rearLeft,
  ].map((point) => worldPointToLocalPoint({
    center: unitGeometry.center,
    widthUd: unitGeometry.widthUd,
    depthUd: unitGeometry.depthUd,
    rotationRadians: unitGeometry.rotationRadians,
  }, point));

  return {
    minX: Math.min(...localPoints.map((point) => point.x)),
    maxX: Math.max(...localPoints.map((point) => point.x)),
    minY: Math.min(...localPoints.map((point) => point.y)),
    maxY: Math.max(...localPoints.map((point) => point.y)),
  };
}

function getRequiredShiftDistance({ blockerUnit, chargerFootprint, direction }) {
  const blockerFootprint = createFootprintFromPose(blockerUnit);
  const localBounds = getLocalBoundsForFootprintRelativeToUnit(chargerFootprint, blockerFootprint);
  const halfWidth = blockerFootprint.widthUd / 2;
  const halfDepth = blockerFootprint.depthUd / 2;

  if (direction === 'rear') {
    return Number(Math.max(0, halfDepth - localBounds.minY + SHIFT_CLEARANCE_EPSILON_UD).toFixed(3));
  }

  if (direction === 'left') {
    return Number(Math.max(0, halfWidth - localBounds.minX + SHIFT_CLEARANCE_EPSILON_UD).toFixed(3));
  }

  if (direction === 'right') {
    return Number(Math.max(0, localBounds.maxX + halfWidth + SHIFT_CLEARANCE_EPSILON_UD).toFixed(3));
  }

  return null;
}

function getShiftedPose(blockerUnit, direction, distanceUd) {
  const rotationRadians = Number(blockerUnit?.rotationRadians ?? 0);
  const { forwardAxis, rightAxis } = getAxesFromRotation(rotationRadians);
  const movementVector = direction === 'rear'
    ? scaleVector(forwardAxis, -Math.abs(distanceUd))
    : scaleVector(rightAxis, direction === 'left' ? -Math.abs(distanceUd) : Math.abs(distanceUd));
  const shiftedCenter = addVectors(
    { x: Number(blockerUnit?.xUd ?? 0), y: Number(blockerUnit?.yUd ?? 0) },
    movementVector,
  );

  return {
    xUd: Number(shiftedCenter.x.toFixed(3)),
    yUd: Number(shiftedCenter.y.toFixed(3)),
    rotationRadians,
  };
}

function createShiftDiagnostic(code, message, details, sourceStatus = CONFORMATION_SOURCE_STATUSES.VERIFIED) {
  return createConformationDiagnostic({
    code,
    severity: 'warn',
    message,
    sourceStatus,
    details,
  });
}

function createShiftFailurePlan(status, diagnostic) {
  return {
    shiftingPlan: createConformationShiftPlan({
      status,
      sourceStatus: diagnostic.sourceStatus,
      diagnostics: [diagnostic],
    }),
    shiftedPose: null,
  };
}

function isKnownUnshiftableUnit(unit) {
  if (!unit) {
    return false;
  }

  const labels = [unit.troopType, unit.profileId, unit.unitType, unit.baseType]
    .map(normalizeString)
    .filter(Boolean);
  const hasLabel = (pattern) => labels.some((label) => label.includes(pattern));

  return hasLabel('war-wagon')
    || hasLabel('war wagon')
    || hasLabel('heavy-artillery')
    || hasLabel('heavy artillery')
    || Boolean(unit.defendingBehindFortification || unit.defendingBehindObstacle || unit.defendingBehindStakes);
}

function isLightTroopsUnit(unit) {
  if (!unit) {
    return false;
  }

  if (Array.isArray(unit.abilityIds) && unit.abilityIds.includes('light-troops')) {
    return true;
  }

  try {
    return getResolvedAbilityIdsForUnit(unit).includes('light-troops');
  } catch {
    const labels = [unit.troopType, unit.troopFamily, unit.profileId]
      .map(normalizeString)
      .filter(Boolean);
    return labels.some((label) => label.includes('light'));
  }
}

function getCandidateDirections(blockerUnit, chargerFootprint) {
  const rearDistanceUd = getRequiredShiftDistance({ blockerUnit, chargerFootprint, direction: 'rear' });
  const leftDistanceUd = getRequiredShiftDistance({ blockerUnit, chargerFootprint, direction: 'left' });
  const rightDistanceUd = getRequiredShiftDistance({ blockerUnit, chargerFootprint, direction: 'right' });
  const flankDirections = [
    { direction: 'left', distanceUd: leftDistanceUd },
    { direction: 'right', distanceUd: rightDistanceUd },
  ].sort((left, right) => {
    if (Math.abs(left.distanceUd - right.distanceUd) <= GEOMETRY_EPSILON) {
      return left.direction.localeCompare(right.direction);
    }

    return left.distanceUd - right.distanceUd;
  });

  return [{ direction: 'rear', distanceUd: rearDistanceUd }, ...flankDirections];
}

function buildShiftValidationUnits(units, blockerUnit, shiftedPose) {
  return Array.isArray(units)
    ? units.map((unit) => (unit?.id === blockerUnit.id ? { ...unit, ...shiftedPose } : unit))
    : [];
}

function getBlockingFootprintOverlap(blockerUnit, shiftedPose, chargerFootprint) {
  const measurement = getFootprintCommandRangeMeasurement(
    createFootprintFromPose(blockerUnit, shiftedPose),
    chargerFootprint,
  );

  return measurement.distanceUd <= 1e-6;
}

function createBlockedPlan(diagnostic) {
  return createShiftFailurePlan(CONFORMATION_SHIFTING_PLAN_STATUSES.BLOCKED, diagnostic);
}

function createSourceOpenPlan(diagnostic) {
  return createShiftFailurePlan(CONFORMATION_SHIFTING_PLAN_STATUSES.SOURCE_OPEN, diagnostic);
}

function getSupportPreservationFailure(blockerUnit, candidate, attemptedDirections) {
  const isSupportingUnit = Boolean(blockerUnit?.inMeleeSupport || blockerUnit?.providesOnlySimpleSupport);

  if (!isSupportingUnit) {
    return null;
  }

  if (blockerUnit?.wouldSupportFriendlyAfterConformation === true) {
    return null;
  }

  if (blockerUnit?.wouldSupportFriendlyAfterConformation === false) {
    return createBlockedPlan(createShiftDiagnostic(
      'conformation.shift.blocked.support-preservation',
      `Unit '${blockerUnit.id}' cannot be shifted because it would stop supporting after the conformation shift.`,
      {
        blockerUnitId: blockerUnit.id ?? null,
        direction: candidate.direction,
        distanceUd: candidate.distanceUd,
        attemptedDirections,
      },
    ));
  }

  return createSourceOpenPlan(createShiftDiagnostic(
    'conformation.shift.source-open.support-preservation',
    `Unit '${blockerUnit.id}' is currently supporting, but the current subset cannot verify that support would be preserved after shifting.`,
    {
      blockerUnitId: blockerUnit.id ?? null,
      direction: candidate.direction,
      distanceUd: candidate.distanceUd,
      attemptedDirections,
    },
    CONFORMATION_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  ));
}

export function resolveSimpleConformationShift({
  chargerUnit,
  defenderUnit,
  blockerUnit,
  idealPose,
  units = [],
  battlefieldProfile = null,
}) {
  if (!blockerUnit || !idealPose) {
    return {
      shiftingPlan: createConformationShiftPlan(),
      shiftedPose: null,
    };
  }

  if (isKnownUnshiftableUnit(blockerUnit)) {
    return createSourceOpenPlan(createShiftDiagnostic(
      'conformation.shift.blocked.unshiftable-unit',
      `Unit '${blockerUnit.id}' uses a blocker family that remains errata-open for shifting in the current conformation subset.`,
      { blockerUnitId: blockerUnit.id ?? null },
      CONFORMATION_SOURCE_STATUSES.ERRATA_CHECK,
    ));
  }

  const chargerFootprint = createFootprintFromPose(chargerUnit, idealPose);
  const candidateDirections = getCandidateDirections(blockerUnit, chargerFootprint);
  const attemptedDirections = [];

  for (const candidate of candidateDirections) {
    const shiftedPose = getShiftedPose(blockerUnit, candidate.direction, candidate.distanceUd);
    const validationUnits = buildShiftValidationUnits(units, blockerUnit, shiftedPose);
    const shiftedUnitOverlapId = getFirstOverlappingUnitId({
      reactingUnit: blockerUnit,
      pose: shiftedPose,
      units: validationUnits,
      ignoredUnitIds: [blockerUnit.id, chargerUnit?.id].filter(Boolean),
      shrinkFootprintUd: 0,
    });
    const chargerOverlapId = getFirstOverlappingUnitId({
      reactingUnit: chargerUnit,
      pose: idealPose,
      units: validationUnits,
      ignoredUnitIds: [chargerUnit?.id, defenderUnit?.id].filter(Boolean),
      shrinkFootprintUd: 0,
    });
    const leavesBattlefield = !isPoseInsideBattlefield({
      reactingUnit: blockerUnit,
      pose: shiftedPose,
      battlefieldProfile,
    });
    const stillOverlapsCharger = getBlockingFootprintOverlap(blockerUnit, shiftedPose, chargerFootprint);

    attemptedDirections.push({
      direction: candidate.direction,
      distanceUd: candidate.distanceUd,
      shiftedUnitOverlapId,
      chargerOverlapId,
      leavesBattlefield,
      stillOverlapsCharger,
    });

    if (leavesBattlefield || stillOverlapsCharger || shiftedUnitOverlapId || chargerOverlapId) {
      continue;
    }

    const supportPreservationFailure = getSupportPreservationFailure(
      blockerUnit,
      candidate,
      attemptedDirections,
    );
    if (supportPreservationFailure) {
      return supportPreservationFailure;
    }

    const lightTroopsException = isLightTroopsUnit(blockerUnit);
    const diagnostic = createShiftDiagnostic(
      'conformation.shift.ready',
      `Unit '${blockerUnit.id}' shifts ${candidate.direction} by ${candidate.distanceUd.toFixed(3)} UD to clear the conformation lane.`,
      {
        blockerUnitId: blockerUnit.id ?? null,
        direction: candidate.direction,
        distanceUd: candidate.distanceUd,
      },
    );

    return {
      shiftedPose,
      shiftingPlan: createConformationShiftPlan({
        status: CONFORMATION_SHIFTING_PLAN_STATUSES.READY,
        shiftedUnitIds: [blockerUnit.id ?? null].filter(Boolean),
        steps: [{
          unitId: blockerUnit.id ?? null,
          direction: candidate.direction,
          distanceUd: candidate.distanceUd,
          fromPose: createFootprintFromPose(blockerUnit),
          toPose: shiftedPose,
        }],
        lockEffects: [{
          unitId: blockerUnit.id ?? null,
          movedOrRalliedLock: !lightTroopsException,
          lightTroopsException,
        }],
        sourceStatus: CONFORMATION_SOURCE_STATUSES.VERIFIED,
        diagnostics: [diagnostic],
      }),
    };
  }

  const firstFailedAttempt = attemptedDirections[0] ?? null;
  const failureCode = firstFailedAttempt?.chargerOverlapId
    ? 'conformation.shift.blocked.chain-case'
    : firstFailedAttempt?.shiftedUnitOverlapId
      ? 'conformation.shift.blocked.secondary-overlap'
      : firstFailedAttempt?.leavesBattlefield
        ? 'conformation.shift.blocked.table-edge'
        : 'conformation.shift.blocked.no-legal-simple-shift';
  const failureMessage = firstFailedAttempt?.chargerOverlapId
    ? `Simple shifting still leaves the conformation lane blocked by unit '${firstFailedAttempt.chargerOverlapId}', so chain shifting remains unsupported in this slice.`
    : firstFailedAttempt?.shiftedUnitOverlapId
      ? `Unit '${blockerUnit.id}' cannot be shifted clear without colliding with unit '${firstFailedAttempt.shiftedUnitOverlapId}'.`
      : firstFailedAttempt?.leavesBattlefield
        ? `Unit '${blockerUnit.id}' cannot be shifted clear without leaving the battlefield.`
        : `Unit '${blockerUnit.id}' cannot be shifted clear with the current one-blocker minimality rules.`;

  return createBlockedPlan(createShiftDiagnostic(
    failureCode,
    failureMessage,
    {
      blockerUnitId: blockerUnit.id ?? null,
      attemptedDirections,
    },
  ));
}