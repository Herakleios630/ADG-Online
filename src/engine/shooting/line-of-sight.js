import {
  GEOMETRY_EPSILON,
  addVectors,
  getRotatedRectangleCorners,
  getUnitBaseGeometry,
  scaleVector,
  subtractVectors,
} from '../geometry/index.js';
import { SHOOTING_SOURCE_STATUSES } from './model.js';

export const SHOOTING_LOS_STATUSES = {
  VISIBLE: 'visible',
  BLOCKED: 'blocked',
  SOURCE_OPEN: 'source-open',
};

export const SHOOTING_LOS_REASON_CODES = {
  TARGET_POINT_VISIBLE: 'target-point-visible',
  BLOCKED_BY_UNIT: 'blocked-by-unit',
  TERRAIN_BLOCKERS_DEFERRED: 'terrain-blockers-deferred',
  AMBUSH_BLOCKERS_DEFERRED: 'ambush-blockers-deferred',
  NO_TARGET_EDGE_POINT_VISIBLE: 'no-target-edge-point-visible',
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSegmentIntersectionPoint(leftStart, leftEnd, rightStart, rightEnd) {
  const leftDelta = subtractVectors(leftEnd, leftStart);
  const rightDelta = subtractVectors(rightEnd, rightStart);
  const determinant = (leftDelta.x * rightDelta.y) - (leftDelta.y * rightDelta.x);

  if (Math.abs(determinant) <= GEOMETRY_EPSILON) {
    return null;
  }

  const startDelta = subtractVectors(rightStart, leftStart);
  const leftFactor = ((startDelta.x * rightDelta.y) - (startDelta.y * rightDelta.x)) / determinant;
  const rightFactor = ((startDelta.x * leftDelta.y) - (startDelta.y * leftDelta.x)) / determinant;

  if (
    leftFactor < -GEOMETRY_EPSILON
    || leftFactor > 1 + GEOMETRY_EPSILON
    || rightFactor < -GEOMETRY_EPSILON
    || rightFactor > 1 + GEOMETRY_EPSILON
  ) {
    return null;
  }

  return {
    x: leftStart.x + (leftDelta.x * leftFactor),
    y: leftStart.y + (leftDelta.y * leftFactor),
  };
}

function getRectangleEdges(rectangle) {
  const corners = getRotatedRectangleCorners(rectangle);
  return [
    { start: corners[0], end: corners[1] },
    { start: corners[1], end: corners[2] },
    { start: corners[2], end: corners[3] },
    { start: corners[3], end: corners[0] },
  ];
}

function getTargetEdgeCandidatePoints(targetUnit) {
  const geometry = getUnitBaseGeometry(toWorldRectangle(targetUnit));
  const edges = [
    geometry.frontEdge,
    geometry.rightFlankEdge,
    geometry.rearEdge,
    geometry.leftFlankEdge,
  ];

  return edges.flatMap((edge, index) => ([
    { edgeIndex: index, pointId: `${index}-start`, point: edge.start },
    { edgeIndex: index, pointId: `${index}-mid`, point: addVectors(edge.start, scaleVector(subtractVectors(edge.end, edge.start), 0.5)) },
    { edgeIndex: index, pointId: `${index}-end`, point: edge.end },
  ]));
}

function doesSegmentHitRectangle(segmentStart, segmentEnd, blockerUnit) {
  const blockerRectangle = toWorldRectangle(blockerUnit);
  const edges = getRectangleEdges(blockerRectangle);

  return edges.some((edge) => {
    const intersection = getSegmentIntersectionPoint(segmentStart, segmentEnd, edge.start, edge.end);
    if (!intersection) {
      return false;
    }

    const nearSegmentStart = Math.abs(intersection.x - segmentStart.x) <= GEOMETRY_EPSILON
      && Math.abs(intersection.y - segmentStart.y) <= GEOMETRY_EPSILON;
    const nearSegmentEnd = Math.abs(intersection.x - segmentEnd.x) <= GEOMETRY_EPSILON
      && Math.abs(intersection.y - segmentEnd.y) <= GEOMETRY_EPSILON;

    return !nearSegmentStart && !nearSegmentEnd;
  });
}

function getClosestPointOnSegment(start, end, point) {
  const segment = subtractVectors(end, start);
  const segmentLengthSquared = (segment.x * segment.x) + (segment.y * segment.y);

  if (segmentLengthSquared <= GEOMETRY_EPSILON) {
    return start;
  }

  const fromStart = subtractVectors(point, start);
  const factor = clamp(((fromStart.x * segment.x) + (fromStart.y * segment.y)) / segmentLengthSquared, 0, 1);

  return addVectors(start, scaleVector(segment, factor));
}

function doesSegmentHitCircle(segmentStart, segmentEnd, blockerUnit) {
  const center = { x: Number(blockerUnit?.xUd ?? 0), y: Number(blockerUnit?.yUd ?? 0) };
  const closestPoint = getClosestPointOnSegment(segmentStart, segmentEnd, center);
  const distanceToCenter = Math.hypot(closestPoint.x - center.x, closestPoint.y - center.y);
  const radiusUd = Number(blockerUnit?.widthUd ?? 0) / 2;

  return distanceToCenter < radiusUd - GEOMETRY_EPSILON;
}

function doesSegmentHitUnit(segmentStart, segmentEnd, blockerUnit) {
  return blockerUnit?.baseShape === 'circle'
    ? doesSegmentHitCircle(segmentStart, segmentEnd, blockerUnit)
    : doesSegmentHitRectangle(segmentStart, segmentEnd, blockerUnit);
}

function evaluateTargetPointVisibility(shooterGeometry, targetPointCandidate, blockerUnits) {
  const sightLines = [
    { shooterCornerId: 'front-left', start: shooterGeometry.corners.frontLeft, end: targetPointCandidate.point },
    { shooterCornerId: 'front-right', start: shooterGeometry.corners.frontRight, end: targetPointCandidate.point },
  ];

  const blockingUnits = blockerUnits.filter((blockerUnit) => sightLines.some((line) => doesSegmentHitUnit(line.start, line.end, blockerUnit)));

  return {
    targetPointCandidate,
    sightLines,
    blockingUnits,
    visible: blockingUnits.length === 0,
  };
}

export function evaluateLineOfSight({
  shooterUnit,
  targetUnit,
  blockerUnits = [],
  terrainBlockers = [],
  ambushBlocksSight = false,
} = {}) {
  const diagnostics = [];
  const shooterGeometry = getUnitBaseGeometry(toWorldRectangle(shooterUnit));
  const targetPointCandidates = getTargetEdgeCandidatePoints(targetUnit);
  const filteredBlockers = (Array.isArray(blockerUnits) ? blockerUnits : []).filter((unit) => unit.id !== shooterUnit?.id && unit.id !== targetUnit?.id);
  const evaluations = targetPointCandidates.map((candidate) => evaluateTargetPointVisibility(shooterGeometry, candidate, filteredBlockers));
  const firstVisible = evaluations.find((evaluation) => evaluation.visible) ?? null;

  if (Array.isArray(terrainBlockers) && terrainBlockers.length > 0) {
    diagnostics.push(createDiagnostic(
      SHOOTING_LOS_REASON_CODES.TERRAIN_BLOCKERS_DEFERRED,
      'Terrain and cover blockers remain source-open beyond the current unit-blocker LOS subset.',
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));
  }

  if (ambushBlocksSight) {
    diagnostics.push(createDiagnostic(
      SHOOTING_LOS_REASON_CODES.AMBUSH_BLOCKERS_DEFERRED,
      'Ambush visibility remains source-open beyond the current unit-blocker LOS subset.',
      SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    ));
  }

  if (firstVisible) {
    diagnostics.push(createDiagnostic(
      SHOOTING_LOS_REASON_CODES.TARGET_POINT_VISIBLE,
      'At least one target-edge point remains visible from both shooting-edge corners.',
    ));

    return {
      status: SHOOTING_LOS_STATUSES.VISIBLE,
      hasLineOfSight: true,
      visibleTargetPoint: firstVisible.targetPointCandidate,
      evaluations,
      sourceStatus: diagnostics.some((diagnostic) => diagnostic.sourceStatus === SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK)
        ? SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
        : SHOOTING_SOURCE_STATUSES.VERIFIED,
      diagnostics,
    };
  }

  const blockingUnitIds = [...new Set(evaluations.flatMap((evaluation) => evaluation.blockingUnits.map((unit) => unit.id)).filter(Boolean))];
  diagnostics.push(createDiagnostic(
    blockingUnitIds.length > 0 ? SHOOTING_LOS_REASON_CODES.BLOCKED_BY_UNIT : SHOOTING_LOS_REASON_CODES.NO_TARGET_EDGE_POINT_VISIBLE,
    blockingUnitIds.length > 0
      ? `All current target-edge point candidates are blocked by other units: ${blockingUnitIds.join(', ')}.`
      : 'No supported target-edge point remained visible from both shooting-edge corners.',
  ));

  return {
    status: SHOOTING_LOS_STATUSES.BLOCKED,
    hasLineOfSight: false,
    visibleTargetPoint: null,
    evaluations,
    sourceStatus: diagnostics.some((diagnostic) => diagnostic.sourceStatus === SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK)
      ? SHOOTING_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
      : SHOOTING_SOURCE_STATUSES.VERIFIED,
    diagnostics,
  };
}