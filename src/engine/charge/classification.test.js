import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
  classifyChargeContact,
} from './classification.js';

const DEFENDER = {
  id: 'defender',
  owner: 'player-2',
  troopType: 'infantry',
  xUd: 0,
  yUd: 0,
  widthUd: 1,
  depthUd: 1,
  rotationRadians: 0,
};

const CHARGER = {
  id: 'charger',
  owner: 'player-1',
  troopType: 'cavalry',
  xUd: 0,
  yUd: 0,
  widthUd: 1,
  depthUd: 0.75,
  rotationRadians: 0,
};

function createStartPoseFromFrontEdge({ leftX, rightX, frontY, rotationRadians = 0 }) {
  return {
    xUd: Number(((leftX + rightX) / 2).toFixed(3)),
    yUd: Number((-(frontY - (CHARGER.depthUd / 2))).toFixed(3)),
    rotationRadians,
  };
}

function rotatePoint(point, angleRadians) {
  const cosine = Math.cos(angleRadians);
  const sine = Math.sin(angleRadians);

  return {
    x: Number((((point.x * cosine) - (point.y * sine))).toFixed(3)),
    y: Number((((point.x * sine) + (point.y * cosine))).toFixed(3)),
  };
}

function rotatePose(pose, angleRadians) {
  const rotatedCenter = rotatePoint({ x: pose.xUd, y: pose.yUd }, angleRadians);

  return {
    xUd: rotatedCenter.x,
    yUd: rotatedCenter.y,
    rotationRadians: Number((pose.rotationRadians + angleRadians).toFixed(6)),
  };
}

test('charge contact classification follows the page-41 example-style front/flank/rear matrix', () => {
  const cases = [
    {
      label: 'A',
      startPose: createStartPoseFromFrontEdge({ leftX: -0.4, rightX: 0.4, frontY: 0.9 }),
      expectedType: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT,
      expectedAllowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT],
      expectedFlankSide: null,
    },
    {
      label: 'B1',
      startPose: createStartPoseFromFrontEdge({ leftX: 0.7, rightX: 1.7, frontY: 0.2 }),
      expectedType: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      expectedAllowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK],
      expectedFlankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    {
      label: 'B2',
      startPose: createStartPoseFromFrontEdge({ leftX: -1.7, rightX: -0.7, frontY: 0.2 }),
      expectedType: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      expectedAllowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK],
      expectedFlankSide: CHARGE_CONTACT_FLANK_SIDES.LEFT,
    },
    {
      label: 'C1',
      startPose: createStartPoseFromFrontEdge({ leftX: 0.55, rightX: 1.55, frontY: 0.52 }),
      expectedType: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT,
      expectedAllowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT],
      expectedFlankSide: null,
    },
    {
      label: 'C2',
      startPose: createStartPoseFromFrontEdge({ leftX: 0.55, rightX: 1.55, frontY: 0.48 }),
      expectedType: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      expectedAllowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK],
      expectedFlankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    {
      label: 'D',
      startPose: createStartPoseFromFrontEdge({ leftX: -0.3, rightX: 0.3, frontY: -0.6 }),
      expectedType: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR,
      expectedAllowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR],
      expectedFlankSide: null,
    },
    {
      label: 'E',
      startPose: createStartPoseFromFrontEdge({ leftX: 0.2, rightX: 1.2, frontY: -0.6 }),
      expectedType: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
      expectedAllowedTypes: [CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR, CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK],
      expectedFlankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
  ];

  for (const entry of cases) {
    const classification = classifyChargeContact({
      chargerUnit: CHARGER,
      defenderUnit: DEFENDER,
      contactSnapshot: {
        chargerStartPose: entry.startPose,
        defenderPose: {
          xUd: DEFENDER.xUd,
          yUd: DEFENDER.yUd,
          rotationRadians: DEFENDER.rotationRadians,
        },
      },
    });

    assert.equal(classification.type, entry.expectedType, `${entry.label} type`);
    assert.deepEqual(classification.allowedTypes, entry.expectedAllowedTypes, `${entry.label} allowed types`);
    assert.equal(classification.flankSide, entry.expectedFlankSide, `${entry.label} flank side`);
  }
});

test('charge contact classification stays stable when the defender and attacker are rotated together', () => {
  const rotationRadians = Math.PI / 2;
  const baseStartPose = createStartPoseFromFrontEdge({ leftX: 0.7, rightX: 1.7, frontY: 0.2 });
  const rotatedDefenderPose = rotatePose({ xUd: 0, yUd: 0, rotationRadians: 0 }, rotationRadians);
  const rotatedStartPose = rotatePose(baseStartPose, rotationRadians);

  const classification = classifyChargeContact({
    chargerUnit: CHARGER,
    defenderUnit: DEFENDER,
    contactSnapshot: {
      chargerStartPose: rotatedStartPose,
      defenderPose: rotatedDefenderPose,
    },
  });

  assert.equal(classification.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK);
  assert.deepEqual(classification.allowedTypes, [CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK]);
  assert.equal(classification.flankSide, CHARGE_CONTACT_FLANK_SIDES.RIGHT);
});

test('charge contact classification treats exact front-line boundary contact as front', () => {
  const classification = classifyChargeContact({
    chargerUnit: CHARGER,
    defenderUnit: DEFENDER,
    contactSnapshot: {
      chargerStartPose: createStartPoseFromFrontEdge({ leftX: 0.55, rightX: 1.55, frontY: 0.5 }),
      defenderPose: {
        xUd: DEFENDER.xUd,
        yUd: DEFENDER.yUd,
        rotationRadians: DEFENDER.rotationRadians,
      },
    },
  });

  assert.equal(classification.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT);
  assert.deepEqual(classification.allowedTypes, [CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT]);
});

test('charge contact classification treats exact rear-line boundary contact in the direct rear band as rear', () => {
  const classification = classifyChargeContact({
    chargerUnit: CHARGER,
    defenderUnit: DEFENDER,
    contactSnapshot: {
      chargerStartPose: createStartPoseFromFrontEdge({ leftX: -0.3, rightX: 0.3, frontY: -0.5 }),
      defenderPose: {
        xUd: DEFENDER.xUd,
        yUd: DEFENDER.yUd,
        rotationRadians: DEFENDER.rotationRadians,
      },
    },
  });

  assert.equal(classification.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR);
  assert.deepEqual(classification.allowedTypes, [CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR]);
});

test('charge contact classification preserves the rear-corner grey zone as rear-or-flank at the exact rear boundary', () => {
  const classification = classifyChargeContact({
    chargerUnit: CHARGER,
    defenderUnit: DEFENDER,
    contactSnapshot: {
      chargerStartPose: createStartPoseFromFrontEdge({ leftX: 0.5, rightX: 1.5, frontY: -0.5 }),
      defenderPose: {
        xUd: DEFENDER.xUd,
        yUd: DEFENDER.yUd,
        rotationRadians: DEFENDER.rotationRadians,
      },
    },
  });

  assert.equal(classification.type, CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK);
  assert.deepEqual(classification.allowedTypes, [
    CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR,
    CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
  ]);
  assert.equal(classification.flankSide, CHARGE_CONTACT_FLANK_SIDES.RIGHT);
});