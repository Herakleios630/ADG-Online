import {
  GEOMETRY_EPSILON,
  getRotatedRectangleCorners,
  worldPointToLocalPoint,
} from '../geometry/index.js';
import { evaluateShootingGeometry } from './geometry.js';
import { SHOOTING_SOURCE_STATUSES } from './model.js';

export const SHOOTING_PRIORITY_STATUSES = {
  NO_CANDIDATES: 'no-candidates',
  SELECTED: 'selected',
  PLAYER_CHOICE_REQUIRED: 'player-choice-required',
};

export const SHOOTING_PRIORITY_REASON_CODES = {
  NOT_IN_SHOOTING_ZONE: 'not-in-shooting-zone',
  OUT_OF_RANGE: 'out-of-range',
  NOT_DIRECTLY_IN_FRONT: 'not-directly-in-front',
  NON_PRIORITY_TARGET: 'non-priority-target',
  MOST_IN_FRONT_TIE: 'most-in-front-tie',
  MOST_IN_FRONT_DEFERRED: 'most-in-front-deferred',
  STABLE_TARGET_RETENTION_DEFERRED: 'stable-target-retention-deferred',
};

function createDiagnostic(code, message, sourceStatus = SHOOTING_SOURCE_STATUSES.VERIFIED) {
  return { code, message, sourceStatus };
}

function toWorldRectangle(unit) {
  return {
    center: { x: Number(unit?.xUd ?? 0), y: Number(unit?.yUd ?? 0) },
    widthUd: Number(unit?.widthUd ?? 0),
    depthUd: Number(unit?.depthUd ?? 0),
    rotationRadians: Number(unit?.rotationRadians ?? 0),
  };
}

function getCirclePrioritySamplePoints(targetUnit, shooterUnit) {
  const center = {
    x: Number(targetUnit?.xUd ?? 0),
    y: Number(targetUnit?.yUd ?? 0),
  };
  return [worldPointToLocalPoint(toWorldRectangle(shooterUnit), center)];
}

function getRectanglePrioritySamplePoints(targetUnit, shooterUnit) {
  return getRotatedRectangleCorners(toWorldRectangle(targetUnit))
    .map((corner) => worldPointToLocalPoint(toWorldRectangle(shooterUnit), corner));
}

function getPrioritySamplePoints(targetUnit, shooterUnit) {
  return targetUnit?.baseShape === 'circle'
    ? getCirclePrioritySamplePoints(targetUnit, shooterUnit)
    : getRectanglePrioritySamplePoints(targetUnit, shooterUnit);
}

function getDirectFrontBounds(shooterUnit) {
  const halfWidthUd = Number(shooterUnit?.widthUd ?? 0) / 2;
  const halfDepthUd = Number(shooterUnit?.depthUd ?? 0) / 2;

  return {
    minX: -halfWidthUd,
    maxX: halfWidthUd,
    minY: halfDepthUd,
  };
}

function getCandidateMetrics(targetUnit, shooterUnit) {
  const samplePoints = getPrioritySamplePoints(targetUnit, shooterUnit);
  const directFrontBounds = getDirectFrontBounds(shooterUnit);
  const inDirectFrontSamples = samplePoints.filter((point) => (
    point.x >= directFrontBounds.minX - GEOMETRY_EPSILON
      && point.x <= directFrontBounds.maxX + GEOMETRY_EPSILON
      && point.y >= directFrontBounds.minY - GEOMETRY_EPSILON
  ));

  return {
    samplePoints,
    directlyInFront: inDirectFrontSamples.length > 0,
    nearestDirectFrontDistanceUd: inDirectFrontSamples.length > 0
      ? Math.min(...inDirectFrontSamples.map((point) => point.y - directFrontBounds.minY))
      : Number.POSITIVE_INFINITY,
    nearestZoneDistanceUd: samplePoints.length > 0
      ? Math.min(...samplePoints.map((point) => point.y - directFrontBounds.minY))
      : Number.POSITIVE_INFINITY,
    mostInFrontOffsetUd: inDirectFrontSamples.length > 0
      ? Math.min(...inDirectFrontSamples.map((point) => Math.abs(point.x)))
      : Number.POSITIVE_INFINITY,
  };
}

function comparePriorityCandidates(left, right) {
  if (left.metrics.directlyInFront !== right.metrics.directlyInFront) {
    return left.metrics.directlyInFront ? -1 : 1;
  }

  const distanceKey = left.metrics.directlyInFront ? 'nearestDirectFrontDistanceUd' : 'nearestZoneDistanceUd';
  if (Math.abs(left.metrics[distanceKey] - right.metrics[distanceKey]) > GEOMETRY_EPSILON) {
    return left.metrics[distanceKey] - right.metrics[distanceKey];
  }

  return String(left.targetUnitId).localeCompare(String(right.targetUnitId));
}

function buildTargetCandidate({ shooterUnit, targetUnit, geometryResult }) {
  const metrics = getCandidateMetrics(targetUnit, shooterUnit);

  return {
    targetUnitId: targetUnit?.id ?? null,
    targetUnit,
    geometryResult,
    metrics,
    diagnostics: [],
  };
}

function choosePriorityGroup(sortedCandidates) {
  if (sortedCandidates.length === 0) {
    return [];
  }

  const first = sortedCandidates[0];
  const useDirectFront = first.metrics.directlyInFront;
  const distanceKey = useDirectFront ? 'nearestDirectFrontDistanceUd' : 'nearestZoneDistanceUd';
  const priorityDistanceUd = first.metrics[distanceKey];

  return sortedCandidates.filter((candidate) => (
    candidate.metrics.directlyInFront === useDirectFront
      && Math.abs(candidate.metrics[distanceKey] - priorityDistanceUd) <= GEOMETRY_EPSILON
  ));
}

export function rankShootingPriorityCandidates({
  shooterUnit,
  targetUnits = [],
  shootingProfile = null,
  shootingProfileId = null,
} = {}) {
  const ranked = (Array.isArray(targetUnits) ? targetUnits : [])
    .map((targetUnit) => {
      const geometryResult = evaluateShootingGeometry({
        shooterUnit,
        targetUnit,
        shootingProfile,
        shootingProfileId,
      });

      const candidate = buildTargetCandidate({ shooterUnit, targetUnit, geometryResult });

      if (!geometryResult.isInZone) {
        candidate.diagnostics.push(createDiagnostic(
          SHOOTING_PRIORITY_REASON_CODES.NOT_IN_SHOOTING_ZONE,
          'Target is outside the current supported shooting zone.',
        ));
      }

      if (!geometryResult.isInRange) {
        candidate.diagnostics.push(createDiagnostic(
          SHOOTING_PRIORITY_REASON_CODES.OUT_OF_RANGE,
          'Target is outside the current supported shooting range.',
        ));
      }

      return candidate;
    })
    .filter((candidate) => candidate.geometryResult.isInZone && candidate.geometryResult.isInRange)
    .sort(comparePriorityCandidates)
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));

  const priorityGroup = choosePriorityGroup(ranked);
  const priorityIds = new Set(priorityGroup.map((candidate) => candidate.targetUnitId));
  const hasDirectFrontPriority = ranked.some((candidate) => candidate.metrics.directlyInFront);

  return ranked.map((candidate) => {
    if (hasDirectFrontPriority && !candidate.metrics.directlyInFront) {
      candidate.diagnostics.push(createDiagnostic(
        SHOOTING_PRIORITY_REASON_CODES.NOT_DIRECTLY_IN_FRONT,
        'A nearer directly-in-front target would take priority before this in-zone target.',
      ));
    }

    if (!priorityIds.has(candidate.targetUnitId)) {
      candidate.diagnostics.push(createDiagnostic(
        SHOOTING_PRIORITY_REASON_CODES.NON_PRIORITY_TARGET,
        'This target is not the current priority target under the supported P8-05 subset.',
      ));
    }

    return candidate;
  });
}

export function selectPriorityShootingTargets({
  shooterUnit,
  targetUnits = [],
  shootingProfile = null,
  shootingProfileId = null,
} = {}) {
  const candidates = rankShootingPriorityCandidates({
    shooterUnit,
    targetUnits,
    shootingProfile,
    shootingProfileId,
  });

  if (candidates.length === 0) {
    return {
      status: SHOOTING_PRIORITY_STATUSES.NO_CANDIDATES,
      selectedTargetUnitId: null,
      selected: null,
      priorityTargets: [],
      candidates: [],
      sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
      diagnostics: [],
    };
  }

  const priorityTargets = choosePriorityGroup(candidates);
  const diagnostics = [createDiagnostic(
    SHOOTING_PRIORITY_REASON_CODES.STABLE_TARGET_RETENTION_DEFERRED,
    'Stable repeated-target retention across later turns remains deferred until geometry-change tracking exists.',
    SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  )];

  if (priorityTargets.length > 1) {
    diagnostics.push(createDiagnostic(
      SHOOTING_PRIORITY_REASON_CODES.MOST_IN_FRONT_TIE,
      'Several targets remain tied on the current verified priority metrics; player choice is still required.',
      SHOOTING_SOURCE_STATUSES.VERIFIED,
    ));

    diagnostics.push(createDiagnostic(
      SHOOTING_PRIORITY_REASON_CODES.MOST_IN_FRONT_DEFERRED,
      'The exact geometric interpretation of most in front remains deferred until the source wording is closed further.',
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));

    return {
      status: SHOOTING_PRIORITY_STATUSES.PLAYER_CHOICE_REQUIRED,
      selectedTargetUnitId: null,
      selected: null,
      priorityTargets,
      candidates,
      sourceStatus: SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      diagnostics,
    };
  }

  return {
    status: SHOOTING_PRIORITY_STATUSES.SELECTED,
    selectedTargetUnitId: priorityTargets[0].targetUnitId,
    selected: priorityTargets[0],
    priorityTargets,
    candidates,
    sourceStatus: SHOOTING_SOURCE_STATUSES.VERIFIED,
    diagnostics,
  };
}