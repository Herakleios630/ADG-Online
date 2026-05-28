import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
} from '../engine/charge/classification.js';
import { resolveChargePreviewConformationPlan } from './p0-charge-preview-helpers.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit',
    owner: overrides.owner ?? 'player-1',
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 10,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 1,
    rotationRadians: overrides.rotationRadians ?? 0,
    baseShape: 'rectangle',
  };
}

test('charge preview conformation plan uses the reducer-selected rear-or-flank side', () => {
  const charger = createUnit({ id: 'charger', xUd: 11.2, yUd: 10, rotationRadians: (Math.PI * 3) / 2 });
  const defender = createUnit({ id: 'defender', xUd: 10, yUd: 10, widthUd: 2, depthUd: 1, rotationRadians: 0 });

  const plan = resolveChargePreviewConformationPlan({
    selectedUnit: charger,
    contactEvents: [{
      defenderId: 'defender',
      contactSnapshot: {
        chargerContactPose: { xUd: 11.2, yUd: 10, rotationRadians: (Math.PI * 3) / 2 },
        defenderPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
      },
      classification: {
        type: CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK,
        flankSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
      },
    }],
    units: [charger, defender],
    battlefieldProfile: { widthUd: 30, heightUd: 20 },
    hasPendingReaction: false,
    selectedContactSide: CHARGE_CONTACT_FLANK_SIDES.RIGHT,
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.candidates[0]?.contactSide, 'right');
  assert.equal(plan.candidates[0]?.finalPose?.xUd, 11.5);
});