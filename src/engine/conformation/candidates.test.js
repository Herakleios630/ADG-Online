import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
} from '../charge/classification.js';
import {
  CONFORMATION_CANDIDATE_STATUSES,
  CONFORMATION_PLAN_STATUSES,
  CONFORMATION_SOURCE_STATUSES,
} from './index.js';
import { resolveConformationPlan, resolveFrontConformationPlan } from './candidates.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit',
    owner: overrides.owner ?? 'player-1',
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 10,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 1,
    rotationRadians: overrides.rotationRadians ?? 0,
    troopType: overrides.troopType ?? null,
    inMeleeSupport: overrides.inMeleeSupport ?? false,
    providesOnlySimpleSupport: overrides.providesOnlySimpleSupport ?? false,
    wouldSupportFriendlyAfterConformation: overrides.wouldSupportFriendlyAfterConformation,
    baseShape: 'rectangle',
  };
}

test('front conformation plan produces a clean complete candidate when the aligned pose is clear', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.4, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveFrontConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10.4, yUd: 8.8, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates.length, 1);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.COMPLETE);
  assert.equal(plan.candidates[0]?.contactRelationship, 'front-edge-to-front-edge');
  assert.equal(plan.candidates[0]?.finalPose?.xUd, 10);
  assert.equal(plan.candidates[0]?.finalPose?.yUd, 9);
  assert.equal(plan.candidates[0]?.finalPose?.rotationRadians, Math.PI);
});

test('front conformation plan falls back to incomplete when complete conformation would leave the battlefield', () => {
  const charger = createUnit({ id: 'charger', xUd: 1, yUd: 0.3, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', xUd: 1, yUd: 1, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveFrontConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 1, yUd: 0.3, rotationRadians: Math.PI },
      defenderPose: { xUd: 1, yUd: 1, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 1.4 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.INCOMPLETE);
  assert.equal(plan.diagnostics[0]?.code, 'conformation.front.table-edge-incomplete');
});

test('front conformation plan uses a simple shift when a friendly blocker occupies the ideal pose', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });
  const friendlyBlocker = createUnit({ id: 'friendly-blocker', owner: 'player-1', xUd: 10, yUd: 9, widthUd: 1, depthUd: 1, rotationRadians: Math.PI });

  const plan = resolveFrontConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender, friendlyBlocker],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.COMPLETE);
  assert.equal(plan.candidates[0]?.finalPose?.xUd, 10);
  assert.equal(plan.candidates[0]?.finalPose?.yUd, 9);
  assert.equal(plan.shiftingPlan?.status, 'ready');
  assert.equal(plan.shiftingPlan?.shiftedUnitIds?.[0], 'friendly-blocker');
  assert.equal(plan.diagnostics[0]?.code, 'conformation.shift.ready');
});

test('front conformation does not use the friendly-blocker incomplete fallback for enemy overlaps', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });
  const enemyOverlap = createUnit({ id: 'enemy-overlap', owner: 'player-2', xUd: 10, yUd: 9, widthUd: 1, depthUd: 1, rotationRadians: Math.PI });

  const plan = resolveFrontConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender, enemyOverlap],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.SOURCE_OPEN);
  assert.equal(plan.candidates.length, 0);
  assert.equal(plan.diagnostics[0]?.code, 'conformation.front.overlap-needs-source-check');
});

test('front conformation preserves blocked chain-case shifting outcomes', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0, owner: 'player-2' });
  const blocker = createUnit({ id: 'friendly-blocker', xUd: 10.7, yUd: 9, widthUd: 0.6, depthUd: 1, rotationRadians: Math.PI });
  const chainedBlocker = createUnit({ id: 'rear-chain-blocker', xUd: 9.3, yUd: 9, widthUd: 0.6, depthUd: 1, rotationRadians: Math.PI });

  const plan = resolveFrontConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender, blocker, chainedBlocker],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.BLOCKED);
  assert.equal(plan.candidates.length, 0);
  assert.equal(plan.shiftingPlan?.status, 'blocked');
  assert.equal(plan.diagnostics[0]?.code, 'conformation.shift.blocked.chain-case');
});

test('front conformation keeps errata-open blocker families source-open', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0, owner: 'player-2' });
  const blocker = createUnit({ id: 'war-wagon-blocker', xUd: 10, yUd: 9, troopType: 'war-wagon' });

  const plan = resolveFrontConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10.5, yUd: 8.8, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender, blocker],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.SOURCE_OPEN);
  assert.equal(plan.candidates.length, 0);
  assert.equal(plan.shiftingPlan?.status, 'source-open');
  assert.equal(plan.sourceStatus, CONFORMATION_SOURCE_STATUSES.ERRATA_CHECK);
  assert.equal(plan.diagnostics[0]?.code, 'conformation.shift.blocked.unshiftable-unit');
});

test('flank conformation plan produces a complete left-flank candidate', () => {
  const charger = createUnit({ id: 'charger', xUd: 8.9, yUd: 10.2, rotationRadians: Math.PI / 2 });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 8.9, yUd: 10.2, rotationRadians: Math.PI / 2 },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.LEFT,
    },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.COMPLETE);
  assert.equal(plan.candidates[0]?.contactSide, 'left');
  assert.equal(plan.candidates[0]?.contactRelationship, 'front-edge-to-left-flank-edge');
  assert.equal(plan.candidates[0]?.finalPose?.xUd, 8.5);
  assert.equal(plan.candidates[0]?.finalPose?.yUd, 10);
  assert.equal(plan.candidates[0]?.finalPose?.rotationRadians, Math.PI / 2);
  assert.equal(plan.candidates[0]?.meleeTriggerBridge?.triggerFamily, 'movement-conformation');
  assert.equal(plan.candidates[0]?.meleeTriggerBridge?.attackContactType, 'flank');
  assert.equal(plan.candidates[0]?.meleeTriggerBridge?.defenderFactorToZeroEligible, true);
  assert.equal(plan.candidates[0]?.meleeTriggerBridge?.requiresDefenderFrontEngagementForToZero, true);
});

test('rear conformation plan produces a complete rear candidate', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.2, yUd: 11.4, rotationRadians: 0 });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10.2, yUd: 11.4, rotationRadians: 0 },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.COMPLETE);
  assert.equal(plan.candidates[0]?.contactSide, 'rear');
  assert.equal(plan.candidates[0]?.contactRelationship, 'front-edge-to-rear-edge');
  assert.equal(plan.candidates[0]?.finalPose?.xUd, 10);
  assert.equal(plan.candidates[0]?.finalPose?.yUd, 11);
  assert.equal(plan.candidates[0]?.finalPose?.rotationRadians, 0);
  assert.equal(plan.candidates[0]?.meleeTriggerBridge?.attackContactType, 'rear');
  assert.equal(plan.candidates[0]?.meleeTriggerBridge?.cancellationFamilyHint, 'rear-contact-formed');
});

test('rear-or-flank conformation plan consumes the selected flank side', () => {
  const charger = createUnit({ id: 'charger', xUd: 11.2, yUd: 10, rotationRadians: (Math.PI * 3) / 2 });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 11.2, yUd: 10, rotationRadians: (Math.PI * 3) / 2 },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    },
    selectedContactSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.COMPLETE);
  assert.equal(plan.candidates[0]?.contactSide, 'right');
  assert.equal(plan.candidates[0]?.contactRelationship, 'front-edge-to-right-flank-edge');
  assert.equal(plan.candidates[0]?.finalPose?.xUd, 11.5);
  assert.equal(plan.candidates[0]?.finalPose?.yUd, 10);
  assert.equal(plan.candidates[0]?.finalPose?.rotationRadians, (Math.PI * 3) / 2);
});

test('rear-or-flank conformation plan requires an explicit selected side before generating candidates', () => {
  const charger = createUnit({ id: 'charger' });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.LEFT,
    },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.CHOICE_REQUIRED);
  assert.equal(plan.diagnostics[0]?.code, 'conformation.rear-or-flank.selection-required');
});

test('flank conformation uses a simple shift when the ideal flank pose is occupied by a friendly blocker', () => {
  const charger = createUnit({ id: 'charger', xUd: 8.9, yUd: 10.2, rotationRadians: Math.PI / 2 });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });
  const blocker = createUnit({ id: 'blocker', owner: 'player-1', xUd: 8.5, yUd: 10, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 8.9, yUd: 10.2, rotationRadians: Math.PI / 2 },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: {
      type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK,
      flankSide: CHARGE_CONTACT_FLANK_SIDES.LEFT,
    },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender, blocker],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.COMPLETE);
  assert.equal(plan.candidates[0]?.finalPose?.xUd, 8.5);
  assert.equal(plan.shiftingPlan?.status, 'ready');
  assert.equal(plan.shiftingPlan?.shiftedUnitIds?.[0], 'blocker');
  assert.equal(plan.diagnostics[0]?.code, 'conformation.shift.ready');
});

test('rear conformation falls back to incomplete when full conformation would leave the battlefield', () => {
  const charger = createUnit({ id: 'charger', xUd: 10, yUd: 11.4, rotationRadians: 0 });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10, yUd: 11.4, rotationRadians: 0 },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR },
    battlefieldProfile: { widthUd: 30, heightUd: 11.2 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.READY);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.INCOMPLETE);
  assert.equal(plan.candidates[0]?.finalPose?.yUd, 11.4);
  assert.equal(plan.diagnostics[0]?.code, 'conformation.rear.table-edge-incomplete');
});

test('conformation returns an optional terrain choice when explicit penalizing-terrain facts are provided', () => {
  const charger = createUnit({ id: 'charger', xUd: 10.4, yUd: 8.8, rotationRadians: Math.PI });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10.4, yUd: 8.8, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      terrainConformation: {
        fullConformationEntersPenalizingTerrain: true,
        terrainId: 'rough-1',
        terrainType: 'rough',
        penalizedUnitId: 'charger',
      },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.CHOICE_REQUIRED);
  assert.equal(plan.optionalChoice?.type, 'terrain-choice');
  assert.equal(plan.candidates.length, 2);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.INCOMPLETE);
  assert.equal(plan.candidates[1]?.status, CONFORMATION_CANDIDATE_STATUSES.OPTIONAL);
  assert.equal(plan.diagnostics[0]?.code, 'conformation.front.terrain-optional');
});

test('special conformation cases stay source-open instead of pretending to resolve them', () => {
  const charger = createUnit({ id: 'charger', troopType: 'war-wagon' });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveConformationPlan({
    chargerUnit: charger,
    defenderUnit: defender,
    contactSnapshot: {
      chargerContactPose: { xUd: 10, yUd: 9, rotationRadians: Math.PI },
      defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    },
    contactClassification: { type: CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT },
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    units: [defender],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.SOURCE_OPEN);
  assert.equal(plan.diagnostics[0]?.code, 'conformation.special-case.needs-source-check');
  assert.equal(plan.diagnostics[0]?.details?.specialCaseReasons?.[0]?.reason, 'war-wagon-special-case');
});