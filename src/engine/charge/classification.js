import { getUnitBaseGeometry, worldPointToLocalPoint } from '../geometry/index.js';

export const CHARGE_CONTACT_CLASSIFICATION_TYPES = {
  FRONT: 'front',
  FLANK: 'flank',
  REAR: 'rear',
  REAR_OR_FLANK: 'rear-or-flank',
  UNCLASSIFIED: 'unclassified',
};

export const CHARGE_CONTACT_FLANK_SIDES = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center',
};

const CLASSIFICATION_EPSILON = 1e-6;

export function createChargeContactClassification(overrides = {}) {
  return {
    type: overrides.type ?? CHARGE_CONTACT_CLASSIFICATION_TYPES.UNCLASSIFIED,
    allowedTypes: Array.isArray(overrides.allowedTypes) ? overrides.allowedTypes : [],
    flankSide: overrides.flankSide ?? null,
    explanation: overrides.explanation ?? '',
  };
}

function createUnitBaseFromPose(unit, pose) {
  return {
    center: {
      x: Number(pose?.xUd ?? unit?.xUd ?? 0),
      y: Number(pose?.yUd ?? unit?.yUd ?? 0),
    },
    widthUd: Number(unit?.widthUd ?? 0),
    depthUd: Number(unit?.depthUd ?? 0),
    rotationRadians: Number(pose?.rotationRadians ?? unit?.rotationRadians ?? 0),
  };
}

function getFlankSide(frontEdgeLocalPoints) {
  const averageX = frontEdgeLocalPoints.reduce((total, point) => total + point.x, 0) / frontEdgeLocalPoints.length;

  if (averageX < -CLASSIFICATION_EPSILON) {
    return CHARGE_CONTACT_FLANK_SIDES.LEFT;
  }

  if (averageX > CLASSIFICATION_EPSILON) {
    return CHARGE_CONTACT_FLANK_SIDES.RIGHT;
  }

  return CHARGE_CONTACT_FLANK_SIDES.CENTER;
}

function getLocalFrontEdgeAgainstDefender(chargerUnit, chargerStartPose, defenderUnit, defenderPose) {
  const chargerGeometry = getUnitBaseGeometry(createUnitBaseFromPose(chargerUnit, chargerStartPose));
  const defenderRectangle = createUnitBaseFromPose(defenderUnit, defenderPose);

  return [
    worldPointToLocalPoint(defenderRectangle, chargerGeometry.frontEdge.start),
    worldPointToLocalPoint(defenderRectangle, chargerGeometry.frontEdge.end),
  ];
}

export function classifyChargeContact({ chargerUnit, defenderUnit, contactSnapshot }) {
  if (!chargerUnit || !defenderUnit || !contactSnapshot?.chargerStartPose || !contactSnapshot?.defenderPose) {
    return createChargeContactClassification({
      explanation: 'Charge-Klassifikation fehlt ein vollstaendiger Start- oder Verteidiger-Snapshot.',
    });
  }

  const frontEdgeLocalPoints = getLocalFrontEdgeAgainstDefender(
    chargerUnit,
    contactSnapshot.chargerStartPose,
    defenderUnit,
    contactSnapshot.defenderPose,
  );
  const halfWidthUd = Number(defenderUnit.widthUd ?? 0) / 2;
  const halfDepthUd = Number(defenderUnit.depthUd ?? 0) / 2;
  const yValues = frontEdgeLocalPoints.map((point) => point.y);
  const xValues = frontEdgeLocalPoints.map((point) => point.x);
  const maxY = Math.max(...yValues);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const anyPartInFront = maxY >= halfDepthUd - CLASSIFICATION_EPSILON;
  const entirelyBehindFront = maxY < halfDepthUd - CLASSIFICATION_EPSILON;
  const entirelyBehindRear = maxY <= -halfDepthUd + CLASSIFICATION_EPSILON;
  const directRearArea = entirelyBehindRear
    && minX >= -halfWidthUd - CLASSIFICATION_EPSILON
    && maxX <= halfWidthUd + CLASSIFICATION_EPSILON;
  const flankAllowed = entirelyBehindFront && (!entirelyBehindRear || !directRearArea);
  const rearAllowed = entirelyBehindRear;
  const flankSide = flankAllowed ? getFlankSide(frontEdgeLocalPoints) : null;

  if (anyPartInFront) {
    return createChargeContactClassification({
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT,
      allowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT],
      explanation: 'Ein Teil der Angreifer-Front liegt noch vor der Frontlinie des Ziels; damit ist der Angriff Front.',
    });
  }

  if (rearAllowed && flankAllowed) {
    return createChargeContactClassification({
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
      allowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR, CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK],
      flankSide,
      explanation: 'Die Angreifer-Front liegt komplett hinter der Rearlinie, aber nicht voll im direkten Rear-Bereich; dadurch bleibt Rear oder Flank zulaessig.',
    });
  }

  if (rearAllowed) {
    return createChargeContactClassification({
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR,
      allowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR],
      explanation: 'Die Angreifer-Front liegt komplett im direkten Rear-Bereich hinter der Rearlinie; der Angriff ist nur Rear.',
    });
  }

  if (flankAllowed) {
    return createChargeContactClassification({
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      allowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK],
      flankSide,
      explanation: 'Die Angreifer-Front liegt komplett hinter der Frontlinie, aber nicht im direkten Rear-Bereich; der Angriff ist Flank.',
    });
  }

  return createChargeContactClassification({
    explanation: 'Der Fall laesst sich aus der aktuellen Frontkanten-Geometrie nicht sauber klassifizieren.',
  });
}