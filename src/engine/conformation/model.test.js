import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONFORMATION_CANDIDATE_STATUSES,
  CONFORMATION_OPTIONAL_CHOICE_TYPES,
  CONFORMATION_PLAN_STATUSES,
  CONFORMATION_SHIFTING_PLAN_STATUSES,
  createConformationCandidate,
  createConformationDiagnostic,
  createConformationOptionalChoice,
  createConformationPlan,
  createConformationShiftPlan,
} from './index.js';

test('conformation plan model initializes as a serializable placeholder spine', () => {
  const plan = createConformationPlan();

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.IDLE);
  assert.equal(plan.sourceStatus, null);
  assert.equal(plan.controllingEnemyId, null);
  assert.equal(plan.principalOpponentId, null);
  assert.equal(plan.selectedCandidateId, null);
  assert.equal(plan.contactSnapshot, null);
  assert.equal(plan.contactClassification, null);
  assert.deepEqual(plan.candidates, []);
  assert.equal(plan.optionalChoice, null);
  assert.equal(plan.shiftingPlan, null);
  assert.deepEqual(plan.diagnostics, []);
  assert.doesNotThrow(() => JSON.stringify(plan));
});

test('conformation candidate preserves deterministic ranking and nested serializable details', () => {
  const candidate = createConformationCandidate({
    id: 'front-complete-a',
    status: CONFORMATION_CANDIDATE_STATUSES.COMPLETE,
    contactSide: 'front',
    contactRelationship: 'front-edge-to-front-edge',
    finalPose: { xUd: 9, yUd: 12, rotationRadians: Math.PI },
    principalOpponentId: 'enemy-1',
    contactSpanUd: 0.75,
    lateralMisalignmentUd: 0.125,
    deterministicPriority: 1,
    diagnostics: [{ code: 'conformation.complete', message: 'Complete conformation candidate.' }],
  });

  assert.equal(candidate.id, 'front-complete-a');
  assert.equal(candidate.contactRelationship, 'front-edge-to-front-edge');
  assert.equal(candidate.contactSpanUd, 0.75);
  assert.equal(candidate.lateralMisalignmentUd, 0.125);
  assert.equal(candidate.deterministicPriority, 1);
  assert.equal(candidate.diagnostics[0]?.code, 'conformation.complete');
  assert.doesNotThrow(() => JSON.stringify(candidate));
});

test('conformation plan preserves optional choices, shifting plans, and diagnostics', () => {
  const plan = createConformationPlan({
    status: CONFORMATION_PLAN_STATUSES.CHOICE_REQUIRED,
    sourceStatus: 'verified',
    controllingEnemyId: 'enemy-1',
    principalOpponentId: 'enemy-1',
    selectedCandidateId: 'terrain-choice-a',
    optionalChoice: createConformationOptionalChoice({
      type: CONFORMATION_OPTIONAL_CHOICE_TYPES.TERRAIN,
      prompt: 'Enter penalizing terrain to conform fully?',
      options: [{ id: 'stay-outside' }, { id: 'enter-terrain' }],
    }),
    shiftingPlan: createConformationShiftPlan({
      status: CONFORMATION_SHIFTING_PLAN_STATUSES.READY,
      shiftedUnitIds: ['friend-1'],
      steps: [{ unitId: 'friend-1', direction: 'rear', distanceUd: 0.25 }],
      lockEffects: [{ unitId: 'friend-1', movedOrRalliedLock: true }],
    }),
    candidates: [
      createConformationCandidate({
        id: 'terrain-choice-a',
        status: CONFORMATION_CANDIDATE_STATUSES.OPTIONAL,
      }),
    ],
    diagnostics: [createConformationDiagnostic({
      code: 'conformation.terrain-optional',
      severity: 'warn',
      message: 'Terrain choice affects full conformation.',
    })],
  });

  assert.equal(plan.status, CONFORMATION_PLAN_STATUSES.CHOICE_REQUIRED);
  assert.equal(plan.optionalChoice?.type, CONFORMATION_OPTIONAL_CHOICE_TYPES.TERRAIN);
  assert.equal(plan.shiftingPlan?.status, CONFORMATION_SHIFTING_PLAN_STATUSES.READY);
  assert.deepEqual(plan.shiftingPlan?.shiftedUnitIds, ['friend-1']);
  assert.equal(plan.candidates[0]?.status, CONFORMATION_CANDIDATE_STATUSES.OPTIONAL);
  assert.equal(plan.diagnostics[0]?.severity, 'warn');
  assert.doesNotThrow(() => JSON.stringify(plan));
});