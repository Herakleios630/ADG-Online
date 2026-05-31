import { getUnitBaseGeometry, worldPointToLocalPoint } from '../geometry/index.js';

const CONTACT_EPSILON_UD = 1e-4;

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function axisAlmostEqual(point, axis, value, epsilon = CONTACT_EPSILON_UD) {
  if (axis !== 'x' && axis !== 'y') {
    return false;
  }

  return Math.abs(Number(point?.[axis] ?? 0) - Number(value ?? 0)) <= epsilon;
}

function pointsAlmostEqual(leftPoint, rightPoint, epsilon = CONTACT_EPSILON_UD) {
  return Math.abs(Number(leftPoint?.x ?? 0) - Number(rightPoint?.x ?? 0)) <= epsilon
    && Math.abs(Number(leftPoint?.y ?? 0) - Number(rightPoint?.y ?? 0)) <= epsilon;
}

function buildReferenceTargets(opponentUnit) {
  const halfWidth = Number(opponentUnit?.widthUd ?? 0) / 2;
  const halfDepth = Number(opponentUnit?.depthUd ?? 0) / 2;

  return {
    halfWidth,
    halfDepth,
    corners: {
      frontLeft: { x: -halfWidth, y: halfDepth },
      frontRight: { x: halfWidth, y: halfDepth },
      rearLeft: { x: -halfWidth, y: -halfDepth },
      rearRight: { x: halfWidth, y: -halfDepth },
    },
  };
}

function buildUnitGeometryInOpponentFrame(unit, opponentUnit) {
  const unitGeometry = getUnitBaseGeometry({
    center: {
      x: Number(unit?.xUd ?? 0),
      y: Number(unit?.yUd ?? 0),
    },
    widthUd: Number(unit?.widthUd ?? 0),
    depthUd: Number(unit?.depthUd ?? 0),
    rotationRadians: Number(unit?.rotationRadians ?? 0),
  });
  const opponentFrame = {
    center: {
      x: Number(opponentUnit?.xUd ?? 0),
      y: Number(opponentUnit?.yUd ?? 0),
    },
    widthUd: Number(opponentUnit?.widthUd ?? 0),
    depthUd: Number(opponentUnit?.depthUd ?? 0),
    rotationRadians: Number(opponentUnit?.rotationRadians ?? 0),
  };
  const toOpponentLocal = (point) => worldPointToLocalPoint(opponentFrame, point);

  return {
    corners: {
      frontLeft: toOpponentLocal(unitGeometry.corners.frontLeft),
      frontRight: toOpponentLocal(unitGeometry.corners.frontRight),
      rearLeft: toOpponentLocal(unitGeometry.corners.rearLeft),
      rearRight: toOpponentLocal(unitGeometry.corners.rearRight),
    },
    edges: {
      front: {
        start: toOpponentLocal(unitGeometry.frontEdge.start),
        end: toOpponentLocal(unitGeometry.frontEdge.end),
      },
      leftFlank: {
        start: toOpponentLocal(unitGeometry.leftFlankEdge.start),
        end: toOpponentLocal(unitGeometry.leftFlankEdge.end),
      },
      rightFlank: {
        start: toOpponentLocal(unitGeometry.rightFlankEdge.start),
        end: toOpponentLocal(unitGeometry.rightFlankEdge.end),
      },
    },
  };
}

function runChecks(relationship, contactSide, unitLocalGeometry, referenceTargets) {
  const side = normalizeText(contactSide);
  const checks = [];

  switch (relationship) {
    case 'rear-edge-to-front-edge':
    case 'front-edge-to-rear-edge':
      checks.push({
        code: 'unit-front-on-opponent-rear',
        passed: axisAlmostEqual(unitLocalGeometry.edges.front.start, 'y', -referenceTargets.halfDepth)
          && axisAlmostEqual(unitLocalGeometry.edges.front.end, 'y', -referenceTargets.halfDepth),
      });
      checks.push({
        code: 'unit-fl-on-opponent-rl',
        passed: pointsAlmostEqual(unitLocalGeometry.corners.frontLeft, referenceTargets.corners.rearLeft),
      });
      checks.push({
        code: 'unit-fr-on-opponent-rr',
        passed: pointsAlmostEqual(unitLocalGeometry.corners.frontRight, referenceTargets.corners.rearRight),
      });
      break;

    case 'flank-edge-to-front-edge':
    case 'front-edge-to-left-flank-edge':
    case 'front-edge-to-right-flank-edge': {
      const requireLeft = relationship.includes('left-flank') || side === 'left';
      const requireRight = relationship.includes('right-flank') || side === 'right';
      const checkLeft = axisAlmostEqual(unitLocalGeometry.edges.front.start, 'x', -referenceTargets.halfWidth)
        && axisAlmostEqual(unitLocalGeometry.edges.front.end, 'x', -referenceTargets.halfWidth)
        && pointsAlmostEqual(unitLocalGeometry.corners.frontLeft, referenceTargets.corners.frontLeft);
      const checkRight = axisAlmostEqual(unitLocalGeometry.edges.front.start, 'x', referenceTargets.halfWidth)
        && axisAlmostEqual(unitLocalGeometry.edges.front.end, 'x', referenceTargets.halfWidth)
        && pointsAlmostEqual(unitLocalGeometry.corners.frontRight, referenceTargets.corners.frontRight);

      checks.push({
        code: 'unit-front-on-opponent-flank',
        passed: requireLeft
          ? checkLeft
          : requireRight
            ? checkRight
            : (checkLeft || checkRight),
      });
      break;
    }

    case 'front-edge-to-front-edge':
      checks.push({
        code: 'unit-front-on-opponent-front',
        passed: axisAlmostEqual(unitLocalGeometry.edges.front.start, 'y', referenceTargets.halfDepth)
          && axisAlmostEqual(unitLocalGeometry.edges.front.end, 'y', referenceTargets.halfDepth),
      });
      break;

    case 'support-front-corner': {
      const checkLeft = pointsAlmostEqual(unitLocalGeometry.corners.frontRight, referenceTargets.corners.frontLeft);
      const checkRight = pointsAlmostEqual(unitLocalGeometry.corners.frontLeft, referenceTargets.corners.frontRight);
      checks.push({
        code: 'support-front-corner-lock',
        passed: side === 'left'
          ? checkLeft
          : side === 'right'
            ? checkRight
            : (checkLeft || checkRight),
      });
      break;
    }

    case 'support-rear-fully-conformed':
      return {
        status: 'not-applicable',
        checks: [],
        firstFailCode: null,
      };

    default:
      return {
        status: 'not-applicable',
        checks: [],
        firstFailCode: null,
      };
  }

  const firstFailed = checks.find((check) => check.passed === false) ?? null;
  return {
    status: firstFailed ? 'invalid' : 'valid',
    checks,
    firstFailCode: firstFailed?.code ?? null,
  };
}

export function validateMeleeContactEvidenceGeometry({
  unit,
  opponentUnit,
  contactEvidence = null,
} = {}) {
  if (!unit || !unit.id) {
    return {
      status: 'invalid',
      reason: 'unit-missing',
      checks: [],
      firstFailCode: null,
    };
  }
  if (!opponentUnit || !opponentUnit.id) {
    return {
      status: 'invalid',
      reason: 'opponent-missing',
      checks: [],
      firstFailCode: null,
    };
  }

  const evidence = contactEvidence ?? unit.meleeContactEvidence ?? unit.conformationApplied ?? null;
  const relationship = normalizeText(evidence?.contactRelationship);
  if (!relationship) {
    return {
      status: 'not-applicable',
      reason: 'contact-relationship-missing',
      checks: [],
      firstFailCode: null,
    };
  }

  const unitLocalGeometry = buildUnitGeometryInOpponentFrame(unit, opponentUnit);
  const referenceTargets = buildReferenceTargets(opponentUnit);
  const checkResult = runChecks(
    relationship,
    evidence?.contactSide,
    unitLocalGeometry,
    referenceTargets,
  );

  return {
    ...checkResult,
    reason: checkResult.status,
    relationship,
    contactSide: normalizeText(evidence?.contactSide),
    unitId: unit.id,
    opponentUnitId: opponentUnit.id,
  };
}
