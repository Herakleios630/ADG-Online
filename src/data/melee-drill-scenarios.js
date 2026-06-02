import { COMMAND_PLAYER_IDS } from '../state/p0-command-context.js';
import {
  UNIT_PROFILE_IDS,
  getDefaultFootprintForProfile,
  getUnitProfile,
} from './unit-profiles.js';
import {
  getUnitBaseGeometry,
  localPointToWorldPoint,
  normalizeAngleRadians,
  worldPointToLocalPoint,
} from '../engine/geometry/index.js';
import { validateMeleeContactEvidenceGeometry } from '../engine/melee/contact-geometry.js';

export const MELEE_DRILL_SCENARIO_ID = 'melee-drill';
export const MELEE_PLACEMENT_RESULT_STATUSES = {
  EXACT: 'exact',
  BLOCKED: 'blocked',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

const MELEE_PLACEMENT_REF_MODES = {
  ANCHOR: 'anchor',
  ANCHOR_FRONT_ENEMY: 'anchor-front-enemy',
};

const MELEE_P9_SUPPORTED_PATTERN_TOKENS = new Set([
  'simple-support-left',
  'simple-support-right',
  'simple-support-flank-left',
  'simple-support-flank-right',
  'flank-attack-left',
  'flank-attack-right',
  'rear-attack',
  'front-attack-full',
  'front-attack-left-offset',
  'front-attack-right-offset',
]);

const PLACEMENT_CONSTRAINT_EPSILON_UD = 1e-6;

const PLACEMENT_TOKEN_ALIASES = {
  'enemy-front-support-left': 'simple-support-flank-left',
  'enemy-front-support-right': 'simple-support-flank-right',
};

const BLOCKED_REASONS = {
  PATTERN_TOKEN_NOT_ROUTED: 'pattern-token-not-routed',
};

function createMovementConformationTriggerBridge({ attackContactType }) {
  return {
    triggerFamily: 'movement-conformation',
    sourceStatus: 'verified',
    attackContactType,
    defenderFactorToZeroEligible: true,
    requiresDefenderFrontEngagementForToZero: true,
    cancellationFamilyHint: attackContactType === 'rear'
      ? 'rear-contact-formed'
      : 'flank-contact-formed',
    immediateMultipleAttackTrigger: {
      type: 'multiple-attack-immediate',
      source: 'movement-conformation',
      sourceStatus: 'needs-source-check',
      cohesionLoss: 1,
    },
  };
}

function buildUnitRectangle(unit) {
  return {
    center: { x: Number(unit.xUd), y: Number(unit.yUd) },
    widthUd: Number(unit.widthUd),
    depthUd: Number(unit.depthUd),
    rotationRadians: Number(unit.rotationRadians ?? 0),
  };
}

function getCardinalFacingFromRotation(rotationRadians, fallbackFacing = 'north') {
  const normalized = normalizeAngleRadians(Number(rotationRadians ?? 0));
  const epsilon = 1e-6;
  const cardinalFacingByRotation = [
    { angle: 0, facing: 'north' },
    { angle: Math.PI / 2, facing: 'east' },
    { angle: Math.PI, facing: 'south' },
    { angle: (Math.PI * 3) / 2, facing: 'west' },
  ];

  const matchedFacing = cardinalFacingByRotation.find((entry) => Math.abs(entry.angle - normalized) <= epsilon)?.facing;
  return matchedFacing ?? fallbackFacing;
}

function normalizePatternToken(patternToken) {
  if (typeof patternToken !== 'string') {
    return null;
  }

  const normalizedToken = patternToken.trim().toLowerCase();
  if (!normalizedToken) {
    return null;
  }

  return PLACEMENT_TOKEN_ALIASES[normalizedToken] ?? normalizedToken;
}

function getFrontEnemyCandidates(anchorUnit, unitsById) {
  if (!anchorUnit) {
    return [];
  }

  const candidates = [];
  for (const unit of unitsById.values()) {
    if (!unit || unit.id === anchorUnit.id) {
      continue;
    }

    if (unit.owner === anchorUnit.owner) {
      continue;
    }

    const anchorClaimsUnitAsFrontOpponent = anchorUnit.meleePendingOpponentId === unit.id;
    const unitClaimsAnchorAsFrontOpponent = unit.meleePendingOpponentId === anchorUnit.id;
    const anchorEvidenceFront =
      anchorUnit.meleeContactEvidence?.principalOpponentId === unit.id
      && anchorUnit.meleeContactEvidence?.contactSide === 'front';
    const unitEvidenceFront =
      unit.meleeContactEvidence?.principalOpponentId === anchorUnit.id
      && unit.meleeContactEvidence?.contactSide === 'front';

    if (anchorClaimsUnitAsFrontOpponent || unitClaimsAnchorAsFrontOpponent || anchorEvidenceFront || unitEvidenceFront) {
      candidates.push(unit.id);
    }
  }

  return [...new Set(candidates)].sort();
}

function getPlacementPoseInReferenceFrame({ patternToken, unit, referenceUnit }) {
  const referenceHalfWidth = Number(referenceUnit.widthUd ?? 0) / 2;
  const referenceHalfDepth = Number(referenceUnit.depthUd ?? 0) / 2;
  const unitHalfWidth = Number(unit.widthUd ?? 0) / 2;
  const unitHalfDepth = Number(unit.depthUd ?? 0) / 2;

  switch (patternToken) {
    case 'simple-support-left':
      return {
        localCenter: {
          x: -(referenceHalfWidth + unitHalfWidth),
          y: referenceHalfDepth - unitHalfDepth,
        },
        rotationDeltaRadians: 0,
      };
    case 'simple-support-right':
      return {
        localCenter: {
          x: referenceHalfWidth + unitHalfWidth,
          y: referenceHalfDepth - unitHalfDepth,
        },
        rotationDeltaRadians: 0,
      };
    case 'simple-support-flank-left':
      return {
        localCenter: {
          x: -(referenceHalfWidth + unitHalfWidth),
          y: referenceHalfDepth + unitHalfDepth,
        },
        rotationDeltaRadians: 0,
      };
    case 'simple-support-flank-right':
      return {
        localCenter: {
          x: referenceHalfWidth + unitHalfWidth,
          y: referenceHalfDepth + unitHalfDepth,
        },
        rotationDeltaRadians: 0,
      };
    case 'flank-attack-left':
      return {
        localCenter: {
          x: -referenceHalfWidth - unitHalfDepth,
          y: referenceHalfDepth - unitHalfWidth,
        },
        rotationDeltaRadians: Math.PI / 2,
      };
    case 'flank-attack-right':
      return {
        localCenter: {
          x: referenceHalfWidth + unitHalfDepth,
          y: referenceHalfDepth - unitHalfWidth,
        },
        rotationDeltaRadians: -Math.PI / 2,
      };
    case 'rear-attack':
      return {
        localCenter: {
          x: unitHalfWidth - referenceHalfWidth,
          y: -(referenceHalfDepth + unitHalfDepth),
        },
        rotationDeltaRadians: 0,
      };
    case 'front-attack-full':
      return {
        localCenter: {
          x: unitHalfWidth - referenceHalfWidth,
          y: referenceHalfDepth + unitHalfDepth,
        },
        rotationDeltaRadians: Math.PI,
      };
    case 'front-attack-left-offset':
      return {
        localCenter: {
          x: -referenceHalfWidth + unitHalfWidth,
          y: referenceHalfDepth + unitHalfDepth,
        },
        rotationDeltaRadians: Math.PI,
      };
    case 'front-attack-right-offset':
      return {
        localCenter: {
          x: referenceHalfWidth - unitHalfWidth,
          y: referenceHalfDepth + unitHalfDepth,
        },
        rotationDeltaRadians: Math.PI,
      };
    default:
      return null;
  }
}

function pointsAlmostEqual(leftPoint, rightPoint, epsilon = PLACEMENT_CONSTRAINT_EPSILON_UD) {
  return Math.abs(Number(leftPoint?.x ?? 0) - Number(rightPoint?.x ?? 0)) <= epsilon
    && Math.abs(Number(leftPoint?.y ?? 0) - Number(rightPoint?.y ?? 0)) <= epsilon;
}

function axisAlmostEqual(point, axis, value, epsilon = PLACEMENT_CONSTRAINT_EPSILON_UD) {
  if (axis !== 'x' && axis !== 'y') {
    return false;
  }

  return Math.abs(Number(point?.[axis] ?? 0) - Number(value ?? 0)) <= epsilon;
}

function pointDistanceToSegment(point, segmentStart, segmentEnd) {
  const px = Number(point?.x ?? 0);
  const py = Number(point?.y ?? 0);
  const x1 = Number(segmentStart?.x ?? 0);
  const y1 = Number(segmentStart?.y ?? 0);
  const x2 = Number(segmentEnd?.x ?? 0);
  const y2 = Number(segmentEnd?.y ?? 0);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const segmentLengthSquared = dx * dx + dy * dy;

  if (segmentLengthSquared <= Number.EPSILON) {
    const singlePointDx = px - x1;
    const singlePointDy = py - y1;
    return Math.hypot(singlePointDx, singlePointDy);
  }

  const tRaw = ((px - x1) * dx + (py - y1) * dy) / segmentLengthSquared;
  const t = Math.max(0, Math.min(1, tRaw));
  const projectionX = x1 + t * dx;
  const projectionY = y1 + t * dy;
  return Math.hypot(px - projectionX, py - projectionY);
}

function pointOnSegment(point, segmentStart, segmentEnd, epsilon = PLACEMENT_CONSTRAINT_EPSILON_UD) {
  return pointDistanceToSegment(point, segmentStart, segmentEnd) <= epsilon;
}

function getReferenceFrameTargets(referenceUnit) {
  const halfWidth = Number(referenceUnit.widthUd ?? 0) / 2;
  const halfDepth = Number(referenceUnit.depthUd ?? 0) / 2;

  return {
    halfWidth,
    halfDepth,
    corners: {
      frontLeft: { x: -halfWidth, y: halfDepth },
      frontRight: { x: halfWidth, y: halfDepth },
      rearLeft: { x: -halfWidth, y: -halfDepth },
      rearRight: { x: halfWidth, y: -halfDepth },
    },
    edges: {
      front: {
        start: { x: -halfWidth, y: halfDepth },
        end: { x: halfWidth, y: halfDepth },
      },
      left: {
        start: { x: -halfWidth, y: halfDepth },
        end: { x: -halfWidth, y: -halfDepth },
      },
      right: {
        start: { x: halfWidth, y: halfDepth },
        end: { x: halfWidth, y: -halfDepth },
      },
      rear: {
        start: { x: -halfWidth, y: -halfDepth },
        end: { x: halfWidth, y: -halfDepth },
      },
    },
  };
}

function validatePlacementConstraintsInReferenceFrame({
  patternToken,
  unit,
  referenceUnit,
  placementPose,
}) {
  const referenceRectangle = buildUnitRectangle(referenceUnit);
  const placedWorldCenter = localPointToWorldPoint(referenceRectangle, {
    x: Number(placementPose.localCenter?.x ?? 0),
    y: Number(placementPose.localCenter?.y ?? 0),
  });
  const placedWorldGeometry = getUnitBaseGeometry({
    center: placedWorldCenter,
    widthUd: Number(unit.widthUd ?? 0),
    depthUd: Number(unit.depthUd ?? 0),
    rotationRadians: normalizeAngleRadians(
      Number(referenceUnit.rotationRadians ?? 0) + Number(placementPose.rotationDeltaRadians ?? 0),
    ),
  });
  const toReferenceLocal = (point) => worldPointToLocalPoint(referenceRectangle, point);
  const placedGeometry = {
    corners: {
      frontLeft: toReferenceLocal(placedWorldGeometry.corners.frontLeft),
      frontRight: toReferenceLocal(placedWorldGeometry.corners.frontRight),
      rearLeft: toReferenceLocal(placedWorldGeometry.corners.rearLeft),
      rearRight: toReferenceLocal(placedWorldGeometry.corners.rearRight),
    },
    frontEdge: {
      start: toReferenceLocal(placedWorldGeometry.frontEdge.start),
      end: toReferenceLocal(placedWorldGeometry.frontEdge.end),
    },
    leftFlankEdge: {
      start: toReferenceLocal(placedWorldGeometry.leftFlankEdge.start),
      end: toReferenceLocal(placedWorldGeometry.leftFlankEdge.end),
    },
    rightFlankEdge: {
      start: toReferenceLocal(placedWorldGeometry.rightFlankEdge.start),
      end: toReferenceLocal(placedWorldGeometry.rightFlankEdge.end),
    },
  };
  const referenceTargets = getReferenceFrameTargets(referenceUnit);
  const checks = [];

  switch (patternToken) {
    case 'simple-support-left':
      checks.push({
        code: 'unit-right-touches-anchor-left',
        passed: axisAlmostEqual(placedGeometry.rightFlankEdge.start, 'x', -referenceTargets.halfWidth)
          && axisAlmostEqual(placedGeometry.rightFlankEdge.end, 'x', -referenceTargets.halfWidth),
      });
      checks.push({
        code: 'unit-fr-touches-anchor-fl',
        passed: pointsAlmostEqual(placedGeometry.corners.frontRight, referenceTargets.corners.frontLeft),
      });
      break;

    case 'simple-support-right':
      checks.push({
        code: 'unit-left-touches-anchor-right',
        passed: axisAlmostEqual(placedGeometry.leftFlankEdge.start, 'x', referenceTargets.halfWidth)
          && axisAlmostEqual(placedGeometry.leftFlankEdge.end, 'x', referenceTargets.halfWidth),
      });
      checks.push({
        code: 'unit-fl-touches-anchor-fr',
        passed: pointsAlmostEqual(placedGeometry.corners.frontLeft, referenceTargets.corners.frontRight),
      });
      break;

    case 'simple-support-flank-left':
      checks.push({
        code: 'unit-right-touches-anchor-left',
        passed: axisAlmostEqual(placedGeometry.rightFlankEdge.start, 'x', -referenceTargets.halfWidth)
          && axisAlmostEqual(placedGeometry.rightFlankEdge.end, 'x', -referenceTargets.halfWidth),
      });
      checks.push({
        code: 'unit-right-rear-touches-anchor-fl',
        passed: pointsAlmostEqual(placedGeometry.corners.rearRight, referenceTargets.corners.frontLeft),
      });
      break;

    case 'simple-support-flank-right':
      checks.push({
        code: 'unit-left-touches-anchor-right',
        passed: axisAlmostEqual(placedGeometry.leftFlankEdge.start, 'x', referenceTargets.halfWidth)
          && axisAlmostEqual(placedGeometry.leftFlankEdge.end, 'x', referenceTargets.halfWidth),
      });
      checks.push({
        code: 'unit-left-rear-touches-anchor-fr',
        passed: pointsAlmostEqual(placedGeometry.corners.rearLeft, referenceTargets.corners.frontRight),
      });
      break;

    case 'flank-attack-left':
      checks.push({
        code: 'unit-front-touches-anchor-left',
        passed: axisAlmostEqual(placedGeometry.frontEdge.start, 'x', -referenceTargets.halfWidth)
          && axisAlmostEqual(placedGeometry.frontEdge.end, 'x', -referenceTargets.halfWidth),
      });
      checks.push({
        code: 'unit-fl-touches-anchor-fl',
        passed: pointsAlmostEqual(placedGeometry.corners.frontLeft, referenceTargets.corners.frontLeft),
      });
      break;

    case 'flank-attack-right':
      checks.push({
        code: 'unit-front-touches-anchor-right',
        passed: axisAlmostEqual(placedGeometry.frontEdge.start, 'x', referenceTargets.halfWidth)
          && axisAlmostEqual(placedGeometry.frontEdge.end, 'x', referenceTargets.halfWidth),
      });
      checks.push({
        code: 'unit-fr-touches-anchor-fr',
        passed: pointsAlmostEqual(placedGeometry.corners.frontRight, referenceTargets.corners.frontRight),
      });
      break;

    case 'rear-attack':
      checks.push({
        code: 'unit-front-touches-anchor-rear',
        passed: axisAlmostEqual(placedGeometry.frontEdge.start, 'y', -referenceTargets.halfDepth)
          && axisAlmostEqual(placedGeometry.frontEdge.end, 'y', -referenceTargets.halfDepth),
      });
      checks.push({
        code: 'unit-fl-touches-anchor-rl',
        passed: pointsAlmostEqual(placedGeometry.corners.frontLeft, referenceTargets.corners.rearLeft),
      });
      checks.push({
        code: 'unit-fr-touches-anchor-rr',
        passed: pointsAlmostEqual(placedGeometry.corners.frontRight, referenceTargets.corners.rearRight),
      });
      break;

    case 'front-attack-full':
      checks.push({
        code: 'unit-front-touches-anchor-front',
        passed: axisAlmostEqual(placedGeometry.frontEdge.start, 'y', referenceTargets.halfDepth)
          && axisAlmostEqual(placedGeometry.frontEdge.end, 'y', referenceTargets.halfDepth),
      });
      checks.push({
        code: 'unit-fr-touches-anchor-fl',
        passed: pointsAlmostEqual(placedGeometry.corners.frontRight, referenceTargets.corners.frontLeft),
      });
      checks.push({
        code: 'unit-fl-touches-anchor-fr',
        passed: pointsAlmostEqual(placedGeometry.corners.frontLeft, referenceTargets.corners.frontRight),
      });
      break;

    case 'front-attack-left-offset':
      checks.push({
        code: 'unit-front-touches-anchor-front',
        passed: axisAlmostEqual(placedGeometry.frontEdge.start, 'y', referenceTargets.halfDepth)
          && axisAlmostEqual(placedGeometry.frontEdge.end, 'y', referenceTargets.halfDepth),
      });
      checks.push({
        code: 'unit-fr-touches-anchor-front',
        passed: pointOnSegment(
          placedGeometry.corners.frontRight,
          referenceTargets.edges.front.start,
          referenceTargets.edges.front.end,
        ),
      });
      checks.push({
        code: 'anchor-fl-touches-unit-front',
        passed: pointOnSegment(
          referenceTargets.corners.frontLeft,
          placedGeometry.frontEdge.start,
          placedGeometry.frontEdge.end,
        ),
      });
      break;

    case 'front-attack-right-offset':
      checks.push({
        code: 'unit-front-touches-anchor-front',
        passed: axisAlmostEqual(placedGeometry.frontEdge.start, 'y', referenceTargets.halfDepth)
          && axisAlmostEqual(placedGeometry.frontEdge.end, 'y', referenceTargets.halfDepth),
      });
      checks.push({
        code: 'unit-fl-touches-anchor-front',
        passed: pointOnSegment(
          placedGeometry.corners.frontLeft,
          referenceTargets.edges.front.start,
          referenceTargets.edges.front.end,
        ),
      });
      checks.push({
        code: 'anchor-fr-touches-unit-front',
        passed: pointOnSegment(
          referenceTargets.corners.frontRight,
          placedGeometry.frontEdge.start,
          placedGeometry.frontEdge.end,
        ),
      });
      break;

    default:
      return {
        valid: false,
        firstFailCode: 'pattern-token-not-yet-routed-in-p9-03z-validator',
      };
  }

  const firstFail = checks.find((check) => check.passed !== true) ?? null;
  return {
    valid: firstFail == null,
    firstFailCode: firstFail?.code ?? null,
  };
}

function buildPlacementLogEntry({
  unitId,
  anchorUnitId,
  requestedPatternToken,
  normalizedPatternToken,
  refMode,
  status,
  blockedReason = null,
  resolvedReferenceUnitId = null,
}) {
  return {
    unitId,
    anchorId: anchorUnitId,
    patternToken: normalizedPatternToken,
    requestedPatternToken,
    refMode,
    status,
    blockedReason,
    resolvedReferenceUnitId,
  };
}

export function resolveMeleeDrillPlacementIntent({
  unit,
  anchorUnit,
  patternToken,
  refMode = MELEE_PLACEMENT_REF_MODES.ANCHOR,
  units = [],
  frontEnemyCandidateIds = null,
}) {
  const normalizedPatternToken = normalizePatternToken(patternToken);
  const requestedPatternToken = typeof patternToken === 'string' ? patternToken : null;

  if (!unit || !unit.id) {
    return {
      status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
      blockedReason: 'placement-unit-missing',
      logEntry: buildPlacementLogEntry({
        unitId: null,
        anchorUnitId: anchorUnit?.id ?? null,
        requestedPatternToken,
        normalizedPatternToken,
        refMode,
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: 'placement-unit-missing',
      }),
    };
  }

  if (!anchorUnit || !anchorUnit.id) {
    return {
      status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
      blockedReason: 'placement-anchor-missing',
      logEntry: buildPlacementLogEntry({
        unitId: unit.id,
        anchorUnitId: null,
        requestedPatternToken,
        normalizedPatternToken,
        refMode,
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: 'placement-anchor-missing',
      }),
    };
  }

  if (!normalizedPatternToken) {
    return {
      status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
      blockedReason: 'pattern-token-missing',
      logEntry: buildPlacementLogEntry({
        unitId: unit.id,
        anchorUnitId: anchorUnit.id,
        requestedPatternToken,
        normalizedPatternToken,
        refMode,
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: 'pattern-token-missing',
      }),
    };
  }

  if (!MELEE_P9_SUPPORTED_PATTERN_TOKENS.has(normalizedPatternToken)) {
    return {
      status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
      blockedReason: BLOCKED_REASONS.PATTERN_TOKEN_NOT_ROUTED,
      logEntry: buildPlacementLogEntry({
        unitId: unit.id,
        anchorUnitId: anchorUnit.id,
        requestedPatternToken,
        normalizedPatternToken,
        refMode,
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: BLOCKED_REASONS.PATTERN_TOKEN_NOT_ROUTED,
      }),
    };
  }

  const unitsById = new Map(Array.isArray(units) ? units.map((entry) => [entry.id, entry]) : []);
  let referenceUnit = anchorUnit;

  if (refMode === MELEE_PLACEMENT_REF_MODES.ANCHOR_FRONT_ENEMY) {
    const candidateIds = Array.isArray(frontEnemyCandidateIds)
      ? [...new Set(frontEnemyCandidateIds.filter((entry) => typeof entry === 'string' && entry.trim().length > 0))]
      : getFrontEnemyCandidates(anchorUnit, unitsById);

    if (candidateIds.length !== 1) {
      return {
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: 'non-simple-front-enemy-selection-deferred-post-p16',
        logEntry: buildPlacementLogEntry({
          unitId: unit.id,
          anchorUnitId: anchorUnit.id,
          requestedPatternToken,
          normalizedPatternToken,
          refMode,
          status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
          blockedReason: 'non-simple-front-enemy-selection-deferred-post-p16',
        }),
      };
    }

    referenceUnit = unitsById.get(candidateIds[0]) ?? null;
    if (!referenceUnit) {
      return {
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: 'reference-front-enemy-not-found',
        logEntry: buildPlacementLogEntry({
          unitId: unit.id,
          anchorUnitId: anchorUnit.id,
          requestedPatternToken,
          normalizedPatternToken,
          refMode,
          status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
          blockedReason: 'reference-front-enemy-not-found',
        }),
      };
    }
  }

  if (refMode !== MELEE_PLACEMENT_REF_MODES.ANCHOR && refMode !== MELEE_PLACEMENT_REF_MODES.ANCHOR_FRONT_ENEMY) {
    return {
      status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
      blockedReason: 'placement-ref-mode-unsupported',
      logEntry: buildPlacementLogEntry({
        unitId: unit.id,
        anchorUnitId: anchorUnit.id,
        requestedPatternToken,
        normalizedPatternToken,
        refMode,
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: 'placement-ref-mode-unsupported',
      }),
    };
  }

  const placementPose = getPlacementPoseInReferenceFrame({
    patternToken: normalizedPatternToken,
    unit,
    referenceUnit,
  });
  if (!placementPose) {
    return {
      status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
      blockedReason: BLOCKED_REASONS.PATTERN_TOKEN_NOT_ROUTED,
      logEntry: buildPlacementLogEntry({
        unitId: unit.id,
        anchorUnitId: anchorUnit.id,
        requestedPatternToken,
        normalizedPatternToken,
        refMode,
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: BLOCKED_REASONS.PATTERN_TOKEN_NOT_ROUTED,
      }),
    };
  }

  const placementValidation = validatePlacementConstraintsInReferenceFrame({
    patternToken: normalizedPatternToken,
    unit,
    referenceUnit,
    placementPose,
  });
  if (!placementValidation.valid) {
    return {
      status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
      blockedReason: `placement-constraints-failed:${placementValidation.firstFailCode}`,
      logEntry: buildPlacementLogEntry({
        unitId: unit.id,
        anchorUnitId: anchorUnit.id,
        requestedPatternToken,
        normalizedPatternToken,
        refMode,
        status: MELEE_PLACEMENT_RESULT_STATUSES.BLOCKED,
        blockedReason: `placement-constraints-failed:${placementValidation.firstFailCode}`,
        resolvedReferenceUnitId: referenceUnit.id,
      }),
    };
  }

  const referenceRectangle = buildUnitRectangle(referenceUnit);
  const nextCenter = localPointToWorldPoint(referenceRectangle, placementPose.localCenter);
  const nextRotationRadians = normalizeAngleRadians(
    Number(referenceUnit.rotationRadians ?? 0) + placementPose.rotationDeltaRadians,
  );
  const isFlankSupportToken = normalizedPatternToken === 'simple-support-flank-left'
    || normalizedPatternToken === 'simple-support-flank-right';

  return {
    status: isFlankSupportToken
      ? MELEE_PLACEMENT_RESULT_STATUSES.NEEDS_SOURCE_CHECK
      : MELEE_PLACEMENT_RESULT_STATUSES.EXACT,
    sourceStatus: MELEE_PLACEMENT_RESULT_STATUSES.NEEDS_SOURCE_CHECK,
    normalizedPatternToken,
    refMode,
    referenceUnitId: referenceUnit.id,
    pose: {
      xUd: nextCenter.x,
      yUd: nextCenter.y,
      rotationRadians: nextRotationRadians,
      facing: getCardinalFacingFromRotation(nextRotationRadians, unit.facing),
    },
    logEntry: buildPlacementLogEntry({
      unitId: unit.id,
      anchorUnitId: anchorUnit.id,
      requestedPatternToken,
      normalizedPatternToken,
      refMode,
      status: MELEE_PLACEMENT_RESULT_STATUSES.EXACT,
      resolvedReferenceUnitId: referenceUnit.id,
    }),
  };
}

function createMeleeDrillUnit({
  id,
  owner,
  corpsId,
  profileId,
  xUd,
  yUd,
  rotationRadians = 0,
  facing = rotationRadians === Math.PI ? 'south' : 'north',
  scenarioMeleeTraits = [],
  fixtureTag = MELEE_DRILL_SCENARIO_ID,
  ...scenarioFields
} = {}) {
  const footprint = getDefaultFootprintForProfile(profileId);
  const profile = getUnitProfile(profileId);

  return {
    id,
    owner,
    corpsId,
    xUd,
    yUd,
    facing,
    rotationRadians,
    widthUd: footprint.widthUd,
    depthUd: footprint.depthUd,
    baseShape: footprint.baseShape,
    troopType: profile.troopFamily,
    profileId,
    visualProfileId: profile.visualProfileId,
    advanceUsedUd: 0,
    moveCountThisSequence: 0,
    slideUsedThisMovementPhase: false,
    stayedThisMovementPhase: false,
    commanderMovePhaseStartXUd: null,
    commanderMovePhaseStartYUd: null,
    hasChargedThisSequence: false,
    hasEvadedThisSequence: false,
    hasDisengagedThisSequence: false,
    retreatedOutOfZocThisSequence: false,
    cannotShootThisSequence: false,
    fixtureTag,
    scenarioTroopFamily: profile.troopFamily,
    scenarioMeleeTraits: [...new Set([...(profile.defaultAbilities ?? []), ...scenarioMeleeTraits])],
    ...scenarioFields,
  };
}

export function createMeleeDrillScenario() {
  const playerOne = COMMAND_PLAYER_IDS.PLAYER_ONE;
  const playerTwo = COMMAND_PLAYER_IDS.PLAYER_TWO;

  const scenario = {
    id: MELEE_DRILL_SCENARIO_ID,
    label: 'Melee Drill',
    description: 'Direct-to-melee debug fixture with three simultaneous contacts (two front and one conformed flank) for queue ordering, preview, and batch-end apply checks. Combat-factor bindings stay source-open unless explicitly provided by fixture metadata.',
    units: [
      createMeleeDrillUnit({
        id: 'melee-drill-p1-frontline-a',
        owner: playerOne,
        corpsId: 'p1-corps-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 12,
        yUd: 12,
        hasChargedThisSequence: true,
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
        },
        scenarioRole: 'active-attacker-a',
        scenarioLabel: 'P1 Swordsmen A',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p1-frontline-b',
        owner: playerOne,
        corpsId: 'p1-corps-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
        xUd: 18,
        yUd: 12,
        hasChargedThisSequence: true,
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
        },
        scenarioRole: 'active-attacker-b',
        scenarioLabel: 'P1 Spearmen B',
        attachedCommanderId: 'melee-drill-p1-commander-b',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p1-commander-b',
        owner: playerOne,
        corpsId: 'p1-corps-1',
        profileId: UNIT_PROFILE_IDS.COMMANDER,
        xUd: 18,
        yUd: 13,
        facing: 'north',
        rotationRadians: 0,
        troopType: 'general',
        baseShape: 'circle',
        isCommander: true,
        commanderQuality: 'competent',
        scenarioRole: 'attached-commander-b',
        scenarioLabel: 'P1 Attached Commander B',
        scenarioTroopFamily: 'general',
        scenarioMeleeTraits: ['commander-only'],
        attachedUnitId: 'melee-drill-p1-frontline-b',
        widthUd: 1,
        depthUd: 1,
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p2-frontline-a',
        owner: playerTwo,
        corpsId: 'p2-corps-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
        xUd: 12,
        yUd: 11,
        facing: 'south',
        rotationRadians: Math.PI,
        scenarioRole: 'passive-defender-a',
        scenarioLabel: 'P2 Spearmen A',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p2-frontline-b',
        owner: playerTwo,
        corpsId: 'p2-corps-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 18,
        yUd: 11,
        facing: 'south',
        rotationRadians: Math.PI,
        scenarioRole: 'passive-defender-b',
        scenarioLabel: 'P2 Swordsmen B',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p1-support-a',
        owner: playerOne,
        corpsId: 'p1-corps-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 11,
        yUd: 11.75,
        hasChargedThisSequence: false,
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          contactOrigin: 'move-to-support-contact',
          principalOpponentId: 'melee-drill-p1-frontline-a',
          contactSide: 'left',
          contactRelationship: 'support-front-corner',
          contactClassification: { type: 'flank' },
          contactRole: 'simple-support',
        },
        scenarioRole: 'active-simple-support-a',
        scenarioLabel: 'P1 Javelin Support A',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p1-frontline-c-gap',
        owner: playerOne,
        corpsId: 'p1-corps-1',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 6,
        yUd: 7.5,
        scenarioRole: 'active-noncontact-c',
        scenarioLabel: 'P1 Javelin Gap C',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p1-flank-c',
        owner: playerOne,
        corpsId: 'p1-corps-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 23.125,
        yUd: 10.875,
        facing: 'east',
        rotationRadians: Math.PI / 2,
        scenarioRole: 'active-flank-attacker-c',
        scenarioLabel: 'P1 Impetuous Flank C',
        hasChargedThisSequence: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-p2-frontline-c-flanked',
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
          principalOpponentId: 'melee-drill-p2-frontline-c-flanked',
          contactSide: 'right',
          contactRelationship: 'flank-edge-to-front-edge',
          contactClassification: { type: 'flank' },
          meleeTriggerBridge: createMovementConformationTriggerBridge({ attackContactType: 'flank' }),
        },
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p2-frontline-c-flanked',
        owner: playerTwo,
        corpsId: 'p2-corps-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
        xUd: 24,
        yUd: 11,
        facing: 'south',
        rotationRadians: Math.PI,
        scenarioRole: 'passive-flanked-c',
        scenarioLabel: 'P2 Impact Flanked C',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-p2-frontline-c-gap',
        owner: playerTwo,
        corpsId: 'p2-corps-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 6,
        yUd: 4,
        facing: 'south',
        rotationRadians: Math.PI,
        scenarioRole: 'passive-noncontact-c',
        scenarioLabel: 'P2 Impetuous Gap C',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case1-main-a',
        owner: playerOne,
        corpsId: 'p1-corps-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 20,
        yUd: 7,
        hasChargedThisSequence: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case1-main-d',
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
          principalOpponentId: 'melee-drill-case1-main-d',
          contactSide: 'front',
          contactRelationship: 'front-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'front' },
          sourceStatus: 'verified',
        },
        scenarioRole: 'support-case-1-main-a',
        scenarioLabel: 'Support Case 1 Main A',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case1-main-d',
        owner: playerTwo,
        corpsId: 'p2-corps-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 20,
        yUd: 6,
        facing: 'south',
        rotationRadians: Math.PI,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case1-main-a',
        scenarioRole: 'support-case-1-main-d',
        scenarioLabel: 'Support Case 1 Main D',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case1-simple-left',
        owner: playerOne,
        corpsId: 'p1-corps-2',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 19,
        yUd: 6.75,
        scenarioRole: 'support-case-1-simple-left',
        scenarioLabel: 'Support Case 1 Simple Left',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case1-main-a',
        hasChargedThisSequence: false,
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          contactOrigin: 'move-to-support-contact',
          principalOpponentId: 'melee-drill-case1-main-a',
          contactSide: 'left',
          contactRelationship: 'support-front-corner',
          contactClassification: { type: 'flank' },
          contactRole: 'simple-support',
        },
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case1-side-melee',
        owner: playerOne,
        corpsId: 'p1-corps-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 20.875,
        yUd: 6,
        facing: 'west',
        rotationRadians: (Math.PI * 3) / 2,
        scenarioRole: 'support-case-1-flank-attack-left',
        scenarioLabel: 'Support Case 1 Flank Attack Left',
        hasChargedThisSequence: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case1-main-d',
        contactRole: 'melee-support',
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
          principalOpponentId: 'melee-drill-case1-main-d',
          supportTargetUnitId: 'melee-drill-case1-main-a',
          contactSide: 'left',
          contactRelationship: 'flank-edge-to-front-edge',
          contactClassification: { type: 'flank' },
          contactRole: 'melee-support',
          meleeTriggerBridge: createMovementConformationTriggerBridge({ attackContactType: 'flank' }),
        },
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case2-main-a',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 24,
        yUd: 7,
        hasChargedThisSequence: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case2-main-d',
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
          principalOpponentId: 'melee-drill-case2-main-d',
          contactSide: 'front',
          contactRelationship: 'front-edge-to-front-edge-fully-conformed',
          contactClassification: { type: 'front' },
          sourceStatus: 'verified',
        },
        scenarioRole: 'support-case-2-main-a',
        scenarioLabel: 'Support Case 2 Main A',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case2-main-d',
        owner: playerTwo,
        corpsId: 'p2-corps-3',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 24,
        yUd: 6,
        facing: 'south',
        rotationRadians: Math.PI,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case2-main-a',
        scenarioRole: 'support-case-2-main-d',
        scenarioLabel: 'Support Case 2 Main D',
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case2-simple-left',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 23,
        yUd: 6.75,
        scenarioRole: 'support-case-2-simple-left',
        scenarioLabel: 'Support Case 2 Simple Left',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case2-main-a',
        hasChargedThisSequence: false,
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          contactOrigin: 'move-to-support-contact',
          principalOpponentId: 'melee-drill-case2-main-a',
          contactSide: 'left',
          contactRelationship: 'support-front-corner',
          contactClassification: { type: 'flank' },
          contactRole: 'simple-support',
        },
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case2-simple-right',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.LIGHT_INFANTRY_JAVELIN,
        xUd: 25,
        yUd: 6.75,
        scenarioRole: 'support-case-2-simple-right',
        scenarioLabel: 'Support Case 2 Simple Right',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case2-main-a',
        hasChargedThisSequence: false,
        providesOnlySimpleSupport: true,
        meleeContactEvidence: {
          contactOrigin: 'move-to-support-contact',
          principalOpponentId: 'melee-drill-case2-main-a',
          contactSide: 'right',
          contactRelationship: 'support-front-corner',
          contactClassification: { type: 'flank' },
          contactRole: 'simple-support',
        },
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case2-flank-left',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 23.125,
        yUd: 6,
        facing: 'east',
        rotationRadians: Math.PI / 2,
        scenarioRole: 'support-case-2-flank-attack-right',
        scenarioLabel: 'Support Case 2 Flank Attack Right',
        hasChargedThisSequence: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case2-main-d',
        contactRole: 'melee-support',
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
          principalOpponentId: 'melee-drill-case2-main-d',
          supportTargetUnitId: 'melee-drill-case2-main-a',
          contactSide: 'right',
          contactRelationship: 'flank-edge-to-front-edge',
          contactClassification: { type: 'flank' },
          contactRole: 'melee-support',
          meleeTriggerBridge: createMovementConformationTriggerBridge({ attackContactType: 'flank' }),
        },
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case2-flank-right',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.HEAVY_CAVALRY_IMPACT,
        xUd: 24.875,
        yUd: 6,
        facing: 'west',
        rotationRadians: (Math.PI * 3) / 2,
        scenarioRole: 'support-case-2-flank-attack-left',
        scenarioLabel: 'Support Case 2 Flank Attack Left',
        hasChargedThisSequence: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case2-main-d',
        contactRole: 'melee-support',
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
          principalOpponentId: 'melee-drill-case2-main-d',
          supportTargetUnitId: 'melee-drill-case2-main-a',
          contactSide: 'left',
          contactRelationship: 'flank-edge-to-front-edge',
          contactClassification: { type: 'flank' },
          contactRole: 'melee-support',
          meleeTriggerBridge: createMovementConformationTriggerBridge({ attackContactType: 'flank' }),
        },
      }),
      createMeleeDrillUnit({
        id: 'melee-drill-case2-rear',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        xUd: 24,
        yUd: 5.125,
        facing: 'south',
        rotationRadians: Math.PI,
        scenarioRole: 'support-case-2-rear-attack',
        scenarioLabel: 'Support Case 2 Rear Attack',
        hasChargedThisSequence: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-drill-case2-main-d',
        contactRole: 'melee-support',
        meleeContactEvidence: {
          contactOrigin: 'charge-contact',
          principalOpponentId: 'melee-drill-case2-main-d',
          supportTargetUnitId: 'melee-drill-case2-main-a',
          contactSide: 'rear',
          contactRelationship: 'rear-edge-to-front-edge',
          contactClassification: { type: 'rear' },
          contactRole: 'melee-support',
          meleeTriggerBridge: createMovementConformationTriggerBridge({ attackContactType: 'rear' }),
        },
      }),
    ],
  };

  const unitsById = new Map(scenario.units.map((unit) => [unit.id, unit]));
  for (const unit of scenario.units) {
    if (!unit?.meleeContactEvidence?.contactRelationship) {
      continue;
    }

    const opponentId = unit.meleeContactEvidence.principalOpponentId ?? unit.meleePendingOpponentId ?? null;
    if (!opponentId) {
      throw new Error(`Melee drill contact evidence for unit '${unit.id}' is missing principal opponent id.`);
    }

    const opponentUnit = unitsById.get(opponentId) ?? null;
    if (!opponentUnit) {
      throw new Error(`Melee drill contact evidence for unit '${unit.id}' references unknown opponent '${opponentId}'.`);
    }

    const validation = validateMeleeContactEvidenceGeometry({
      unit,
      opponentUnit,
      contactEvidence: unit.meleeContactEvidence,
    });
    if (validation.status === 'invalid') {
      throw new Error(
        `Melee drill contact geometry invalid for unit '${unit.id}' vs '${opponentId}' (${validation.relationship}): ${validation.firstFailCode}`,
      );
    }
  }

  return scenario;
}

export function createMeleeCommanderPresenceScenario() {
  const playerOne = COMMAND_PLAYER_IDS.PLAYER_ONE;
  const playerTwo = COMMAND_PLAYER_IDS.PLAYER_TWO;

  return {
    id: 'melee-commander-presence-drill',
    label: 'Melee Commander Presence Drill',
    description: 'Focused V2 drill for attached, included, and support-only commander participation lanes.',
    units: [
      createMeleeDrillUnit({
        id: 'melee-commander-included-main-a',
        owner: playerOne,
        corpsId: 'p1-corps-1',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 32,
        yUd: 12,
        hasIncludedCommander: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-included-main-d',
        scenarioRole: 'commander-included-main-attacker',
        scenarioLabel: 'Commander Included Main A',
      }),
      createMeleeDrillUnit({
        id: 'melee-commander-included-main-d',
        owner: playerTwo,
        corpsId: 'p2-corps-1',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
        xUd: 32,
        yUd: 11,
        facing: 'south',
        rotationRadians: Math.PI,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-included-main-a',
        scenarioRole: 'commander-included-main-defender',
        scenarioLabel: 'Commander Included Main D',
      }),
      createMeleeDrillUnit({
        id: 'melee-commander-attached-main-a',
        owner: playerOne,
        corpsId: 'p1-corps-2',
        profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
        xUd: 38,
        yUd: 12,
        attachedCommanderId: 'melee-commander-attached-a',
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-attached-main-d',
        scenarioRole: 'commander-attached-main-attacker',
        scenarioLabel: 'Commander Attached Main A',
      }),
      createMeleeDrillUnit({
        id: 'melee-commander-attached-a',
        owner: playerOne,
        corpsId: 'p1-corps-2',
        profileId: UNIT_PROFILE_IDS.COMMANDER,
        xUd: 38,
        yUd: 13,
        facing: 'north',
        rotationRadians: 0,
        isCommander: true,
        troopType: 'general',
        scenarioTroopFamily: 'general',
        scenarioMeleeTraits: ['commander-only'],
        attachedUnitId: 'melee-commander-attached-main-a',
        widthUd: 1,
        depthUd: 1,
        scenarioRole: 'commander-attached-unit',
        scenarioLabel: 'Commander Attached Unit',
      }),
      createMeleeDrillUnit({
        id: 'melee-commander-attached-main-d',
        owner: playerTwo,
        corpsId: 'p2-corps-2',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 38,
        yUd: 11,
        facing: 'south',
        rotationRadians: Math.PI,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-attached-main-a',
        scenarioRole: 'commander-attached-main-defender',
        scenarioLabel: 'Commander Attached Main D',
      }),
      createMeleeDrillUnit({
        id: 'melee-commander-support-main-a',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 44,
        yUd: 12,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-support-main-d',
        scenarioRole: 'commander-support-main-attacker',
        scenarioLabel: 'Commander Support Main A',
      }),
      createMeleeDrillUnit({
        id: 'melee-commander-support-main-d',
        owner: playerTwo,
        corpsId: 'p2-corps-3',
        profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
        xUd: 44,
        yUd: 11,
        facing: 'south',
        rotationRadians: Math.PI,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-support-main-a',
        scenarioRole: 'commander-support-main-defender',
        scenarioLabel: 'Commander Support Main D',
      }),
      createMeleeDrillUnit({
        id: 'melee-commander-support-only-a',
        owner: playerOne,
        corpsId: 'p1-corps-3',
        profileId: UNIT_PROFILE_IDS.COMMANDER,
        xUd: 43,
        yUd: 11.75,
        facing: 'north',
        rotationRadians: 0,
        isCommander: true,
        troopType: 'general',
        scenarioTroopFamily: 'general',
        scenarioMeleeTraits: ['commander-only'],
        providesOnlySimpleSupport: true,
        engagedInMelee: true,
        meleePendingOpponentId: 'melee-commander-support-main-a',
        meleeContactEvidence: {
          contactOrigin: 'move-to-support-contact',
          principalOpponentId: 'melee-commander-support-main-a',
          contactSide: 'left',
          contactRelationship: 'support-front-corner',
          contactClassification: { type: 'flank' },
          contactRole: 'simple-support',
        },
        widthUd: 1,
        depthUd: 1,
        scenarioRole: 'commander-support-only',
        scenarioLabel: 'Commander Support Only A',
      }),
    ],
  };
}

export function createP9V2Mini11BPair11vs12FixtureRows() {
  const attackerUnit = {
    id: 'p9v2-mini-11b-main-a',
    owner: COMMAND_PLAYER_IDS.PLAYER_ONE,
    profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
    meleeCombatFactorValue: 5,
    meleeCombatFactorSourceStatus: 'verified',
  };
  const defenderUnit = {
    id: 'p9v2-mini-11b-main-d',
    owner: COMMAND_PLAYER_IDS.PLAYER_TWO,
    profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
    meleeCombatFactorValue: 5,
    meleeCombatFactorSourceStatus: 'verified',
  };
  const sharedResolutionInput = {
    attackerUnit,
    defenderUnit,
    attackerDieRoll: 4,
    defenderDieRoll: 2,
    attackerModifierEntries: [
      {
        code: 'p9v2-mini-11b.support.attacker',
        label: 'Melee support attacker',
        stage: 'support',
        value: 1,
        sourceStatus: 'verified',
      },
    ],
    defenderModifierEntries: [
      {
        code: 'p9v2-mini-11b.disorder.defender',
        label: 'Disorder penalty defender',
        stage: 'terrain',
        value: -1,
        sourceStatus: 'verified',
      },
    ],
    attackerModifierContext: {
      sourceStatus: 'verified',
      flankOrRearAttack: true,
      flankRearBranch: {
        applyDefenderCombatFactorToZero: true,
        sourceStatus: 'verified',
      },
    },
    defenderModifierContext: {
      sourceStatus: 'verified',
    },
  };
  const sharedParticipants = {
    attackerMainUnitId: attackerUnit.id,
    defenderMainUnitId: defenderUnit.id,
    attackerSupportUnitIds: ['p9v2-mini-11b-support-a'],
    defenderSupportUnitIds: [],
  };
  const immediateMultipleAttackEvent = {
    type: 'multiple-attack-immediate',
    status: 'resolved',
    defenderUnitId: defenderUnit.id,
    cohesionLoss: 1,
    precondition: {
      defenderAlreadyInMeleeOrSupport: true,
      newQualifyingFlankRearContact: true,
      triggerContactType: 'flank',
    },
    capPerDefenderPerSequencePhase: 1,
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));

  return [
    {
      pairId: '11',
      label: 'pair-11',
      selectedParticipants: clone(sharedParticipants),
      fixedDice: {
        attackerDieRoll: sharedResolutionInput.attackerDieRoll,
        defenderDieRoll: sharedResolutionInput.defenderDieRoll,
      },
      resolutionInput: clone(sharedResolutionInput),
      immediateMultipleAttackEvent: clone(immediateMultipleAttackEvent),
    },
    {
      pairId: '12',
      label: 'pair-12',
      selectedParticipants: clone(sharedParticipants),
      fixedDice: {
        attackerDieRoll: sharedResolutionInput.attackerDieRoll,
        defenderDieRoll: sharedResolutionInput.defenderDieRoll,
      },
      resolutionInput: clone(sharedResolutionInput),
      immediateMultipleAttackEvent: clone(immediateMultipleAttackEvent),
    },
  ];
}

export function createP9V2Mini12GCoreLaneGoldRows() {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const createExplicitUnit = ({ id, owner, combatFactor = 5 }) => ({
    id,
    owner,
    profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY_SWORDSMEN,
    meleeCombatFactorValue: combatFactor,
    meleeCombatFactorSourceStatus: 'verified',
  });
  const createExpectedResolved = ({
    attackerBase,
    attackerSupport = 0,
    attackerSituation = 0,
    attackerDisorder = 0,
    attackerDie,
    defenderBase,
    defenderSupport = 0,
    defenderSituation = 0,
    defenderDisorder = 0,
    defenderDie,
  }) => {
    const attackerStageFinal = attackerBase + attackerSupport + attackerDisorder + attackerDie;
    const defenderStageFinal = defenderBase + defenderSupport + defenderDisorder + defenderDie;
    const attackerCombatTotal = attackerStageFinal + attackerSituation;
    const defenderCombatTotal = defenderStageFinal + defenderSituation;
    const differential = attackerCombatTotal - defenderCombatTotal;
    const winnerSide = differential === 0 ? null : (differential > 0 ? 'attacker' : 'defender');
    const difference = Math.abs(differential);

    return {
      status: 'resolved',
      attacker: {
        base: attackerBase,
        support: attackerSupport,
        situation: attackerSituation,
        flankRear: 0,
        disorder: attackerDisorder,
        die: attackerDie,
        final: attackerStageFinal,
      },
      defender: {
        base: defenderBase,
        support: defenderSupport,
        situation: defenderSituation,
        flankRear: 0,
        disorder: defenderDisorder,
        die: defenderDie,
        final: defenderStageFinal,
      },
      winnerSide,
      difference,
    };
  };
  const createResolvedRow = ({
    rowId,
    tags,
    resolutionInput,
    expected,
  }) => ({
    rowId,
    tags,
    expected,
    resolutionInput,
  });
  const createSourceOpenRow = ({
    rowId,
    tags,
    resolutionInput,
    expectedDiagnosticCodes,
  }) => ({
    rowId,
    tags,
    expected: {
      status: 'source-open',
      diagnosticCodes: expectedDiagnosticCodes,
    },
    resolutionInput,
  });

  const rows = [
    createResolvedRow({
      rowId: '12g-front-baseline-01',
      tags: ['front', 'dice'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a1', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d1', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 3,
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 4,
        defenderBase: 5,
        defenderDie: 3,
      }),
    }),
    createResolvedRow({
      rowId: '12g-front-support-attacker-02',
      tags: ['front', 'support'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a2', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d2', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 3,
        attackerModifierEntries: [
          {
            code: '12g.support.attacker',
            label: 'Support attacker',
            stage: 'support',
            value: 2,
            sourceStatus: 'verified',
          },
        ],
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerSupport: 2,
        attackerDie: 4,
        defenderBase: 5,
        defenderDie: 3,
      }),
    }),
    createResolvedRow({
      rowId: '12g-front-support-defender-03',
      tags: ['front', 'support'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a3', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d3', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        defenderModifierEntries: [
          {
            code: '12g.support.defender',
            label: 'Support defender',
            stage: 'support',
            value: 1,
            sourceStatus: 'verified',
          },
        ],
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 4,
        defenderBase: 5,
        defenderSupport: 1,
        defenderDie: 4,
      }),
    }),
    createResolvedRow({
      rowId: '12g-front-disorder-attacker-04',
      tags: ['front', 'disorder'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a4', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d4', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        attackerModifierEntries: [
          {
            code: '12g.disorder.attacker',
            label: 'Disorder attacker',
            stage: 'terrain',
            value: -1,
            sourceStatus: 'verified',
          },
        ],
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDisorder: -1,
        attackerDie: 4,
        defenderBase: 5,
        defenderDie: 4,
      }),
    }),
    createResolvedRow({
      rowId: '12g-front-disorder-defender-05',
      tags: ['front', 'disorder'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a5', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d5', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        defenderModifierEntries: [
          {
            code: '12g.disorder.defender',
            label: 'Disorder defender',
            stage: 'terrain',
            value: -1,
            sourceStatus: 'verified',
          },
        ],
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 4,
        defenderBase: 5,
        defenderDisorder: -1,
        defenderDie: 4,
      }),
    }),
    createResolvedRow({
      rowId: '12g-flank-to-zero-06',
      tags: ['flank', 'to-zero'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a6', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d6', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        attackerModifierContext: {
          sourceStatus: 'verified',
          flankOrRearAttack: true,
          flankRearBranch: {
            attackContactType: 'flank',
            attackerSituationBonus: 1,
            applyDefenderCombatFactorToZero: true,
            sourceStatus: 'verified',
          },
        },
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerSituation: 1,
        attackerDie: 4,
        defenderBase: 0,
        defenderDie: 4,
      }),
    }),
    createResolvedRow({
      rowId: '12g-rear-to-zero-cancel-bonus-07',
      tags: ['rear', 'to-zero'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a7', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d7', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        attackerModifierContext: {
          sourceStatus: 'verified',
          flankOrRearAttack: true,
          flankRearBranch: {
            attackContactType: 'rear',
            attackerSituationBonus: 0,
            applyDefenderCombatFactorToZero: true,
            cancelAttackSituationBonus: true,
            cancellationFamily: 'rear-contact-formed',
            sourceStatus: 'verified',
          },
        },
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 4,
        defenderBase: 0,
        defenderDie: 4,
      }),
    }),
    createResolvedRow({
      rowId: '12g-flank-cancel-bonus-08',
      tags: ['flank', 'cancellation'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a8', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d8', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        attackerModifierContext: {
          sourceStatus: 'verified',
          flankOrRearAttack: true,
          flankRearBranch: {
            attackContactType: 'flank',
            attackerSituationBonus: 0,
            cancelAttackSituationBonus: true,
            cancellationFamily: 'flank-contact-formed',
            sourceStatus: 'verified',
          },
        },
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 4,
        defenderBase: 5,
        defenderDie: 4,
      }),
    }),
    createResolvedRow({
      rowId: '12g-die-advantage-attacker-09',
      tags: ['front', 'dice'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a9', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d9', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 6,
        defenderDieRoll: 1,
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 6,
        defenderBase: 5,
        defenderDie: 1,
      }),
    }),
    createResolvedRow({
      rowId: '12g-die-advantage-defender-10',
      tags: ['front', 'dice'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a10', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d10', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 1,
        defenderDieRoll: 6,
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 1,
        defenderBase: 5,
        defenderDie: 6,
      }),
    }),
    createResolvedRow({
      rowId: '12g-mixed-support-disorder-11',
      tags: ['support', 'disorder'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a11', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d11', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        attackerModifierEntries: [
          {
            code: '12g.support.attacker.mixed',
            label: 'Support attacker mixed',
            stage: 'support',
            value: 1,
            sourceStatus: 'verified',
          },
        ],
        defenderModifierEntries: [
          {
            code: '12g.disorder.defender.mixed',
            label: 'Disorder defender mixed',
            stage: 'terrain',
            value: -1,
            sourceStatus: 'verified',
          },
        ],
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerSupport: 1,
        attackerDie: 4,
        defenderBase: 5,
        defenderDisorder: -1,
        defenderDie: 4,
      }),
    }),
    createResolvedRow({
      rowId: '12g-front-tie-12',
      tags: ['front', 'dice'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a12', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d12', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 3,
        defenderDieRoll: 3,
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerDie: 3,
        defenderBase: 5,
        defenderDie: 3,
      }),
    }),
    createResolvedRow({
      rowId: '12g-rear-support-13',
      tags: ['rear', 'support'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a13', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d13', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 3,
        attackerModifierContext: {
          sourceStatus: 'verified',
          flankOrRearAttack: true,
          flankRearBranch: {
            attackContactType: 'rear',
            attackerSituationBonus: 1,
            sourceStatus: 'verified',
          },
        },
        attackerModifierEntries: [
          {
            code: '12g.support.attacker.rear',
            label: 'Support attacker rear',
            stage: 'support',
            value: 1,
            sourceStatus: 'verified',
          },
        ],
      },
      expected: createExpectedResolved({
        attackerBase: 5,
        attackerSupport: 1,
        attackerSituation: 1,
        attackerDie: 4,
        defenderBase: 5,
        defenderDie: 3,
      }),
    }),
    createSourceOpenRow({
      rowId: '12g-source-open-profile-deferred-14',
      tags: ['source-open', 'front'],
      resolutionInput: {
        attackerUnit: {
          id: '12g-a14',
          owner: COMMAND_PLAYER_IDS.PLAYER_ONE,
          profileId: UNIT_PROFILE_IDS.MEDIUM_CAVALRY_IMPETUOUS,
        },
        defenderUnit: {
          id: '12g-d14',
          owner: COMMAND_PLAYER_IDS.PLAYER_TWO,
          profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY_SPEARMEN,
        },
        attackerDieRoll: 4,
        defenderDieRoll: 3,
      },
      expectedDiagnosticCodes: ['combat-factor-profile-deferred'],
    }),
    createSourceOpenRow({
      rowId: '12g-source-open-unverified-modifier-15',
      tags: ['source-open', 'support'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a15', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d15', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        attackerModifierEntries: [
          {
            code: '12g.unverified.support',
            label: 'Unverified support',
            stage: 'support',
            value: 1,
            sourceStatus: 'source-open',
          },
        ],
      },
      expectedDiagnosticCodes: ['modifier-source-open'],
    }),
    createSourceOpenRow({
      rowId: '12g-source-open-unresolved-cancellation-16',
      tags: ['source-open', 'flank', 'cancellation'],
      resolutionInput: {
        attackerUnit: createExplicitUnit({ id: '12g-a16', owner: COMMAND_PLAYER_IDS.PLAYER_ONE, combatFactor: 5 }),
        defenderUnit: createExplicitUnit({ id: '12g-d16', owner: COMMAND_PLAYER_IDS.PLAYER_TWO, combatFactor: 5 }),
        attackerDieRoll: 4,
        defenderDieRoll: 4,
        attackerModifierContext: {
          sourceStatus: 'verified',
          flankOrRearAttack: true,
          flankRearBranch: {
            attackContactType: 'flank',
            cancelAttackSituationBonus: true,
            cancellationFamily: 'unresolved-family',
            sourceStatus: 'verified',
          },
        },
      },
      expectedDiagnosticCodes: ['modifier-source-open'],
    }),
  ];

  return clone(rows);
}

export function createMeleeV2DrillScenarioPayload(scenario = createMeleeDrillScenario()) {
  const units = Array.isArray(scenario?.units) ? scenario.units : [];

  const entries = units
    .filter((unit) => unit?.engagedInMelee || unit?.meleePendingOpponentId || unit?.meleeContactEvidence)
    .map((unit) => {
      const principalOpponentId = unit?.meleeContactEvidence?.principalOpponentId
        ?? unit?.meleePendingOpponentId
        ?? null;
      const intentId = `${String(unit?.id ?? 'unknown')}::${String(principalOpponentId ?? 'none')}`;

      return {
        unitId: unit?.id ?? null,
        owner: unit?.owner ?? null,
        principalOpponentId,
        intentId,
        contactRole: unit?.meleeContactEvidence?.contactRole ?? unit?.contactRole ?? null,
        contactType: unit?.meleeContactEvidence?.contactClassification?.type ?? null,
        conformationApplied: unit?.conformationApplied === true,
        sourceStatus: unit?.meleeContactEvidence?.sourceStatus ?? 'source-open',
        roundStateSeed: 'first-contact',
      };
    })
    .sort((left, right) => String(left.intentId ?? '').localeCompare(String(right.intentId ?? '')));

  return {
    scenarioId: scenario?.id ?? MELEE_DRILL_SCENARIO_ID,
    payloadVersion: 'v2-drill-1',
    sourceStatus: entries.every((entry) => entry?.sourceStatus === 'verified') ? 'verified' : 'source-open',
    entries,
  };
}
