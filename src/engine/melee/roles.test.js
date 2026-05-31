import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MELEE_CONTACT_ROLE_STATUSES,
  classifyMeleeContactUnit,
  resolveMeleeSupportAssignments,
  summarizeMeleeContactRoles,
} from './roles.js';

function createUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit-1',
    owner: overrides.owner ?? null,
    scenarioLabel: overrides.scenarioLabel ?? 'Unit 1',
    engagedInMelee: overrides.engagedInMelee ?? false,
    meleePending: overrides.meleePending ?? false,
    meleePendingOpponentId: overrides.meleePendingOpponentId ?? null,
    inMeleeSupport: overrides.inMeleeSupport ?? false,
    providesOnlySimpleSupport: overrides.providesOnlySimpleSupport ?? false,
    conformationApplied: overrides.conformationApplied ?? null,
    meleeContactEvidence: overrides.meleeContactEvidence ?? null,
  };
}

function createContactEvidence(overrides = {}) {
  return {
    principalOpponentId: overrides.principalOpponentId ?? 'enemy-1',
    contactSide: overrides.contactSide ?? 'front',
    contactRelationship: overrides.contactRelationship ?? 'front-edge-to-front-edge',
    contactClassification: overrides.contactClassification ?? { type: 'front' },
    contactRole: overrides.contactRole,
  };
}

test('classifyMeleeContactUnit marks front contact as main unit from contact evidence', () => {
  const role = classifyMeleeContactUnit(createUnit({
    engagedInMelee: true,
    meleePendingOpponentId: 'enemy-1',
    conformationApplied: createContactEvidence({
      contactSide: 'front',
      contactRelationship: 'front-edge-to-front-edge',
      contactClassification: { type: 'front' },
    }),
  }));

  assert.equal(role.role, MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT);
  assert.equal(role.supportKind, null);
  assert.equal(role.opponentUnitId, 'enemy-1');
  assert.equal(role.sourceStatus, 'verified');
});

test('classifyMeleeContactUnit keeps simple and melee support distinct using explicit support evidence', () => {
  const simpleSupport = classifyMeleeContactUnit(createUnit({
    id: 'simple',
    providesOnlySimpleSupport: true,
    meleeContactEvidence: createContactEvidence({
      contactSide: 'left',
      contactRelationship: 'support-front-corner',
      contactClassification: { type: 'flank' },
      contactRole: 'simple-support',
    }),
  }));
  const meleeSupport = classifyMeleeContactUnit(createUnit({
    id: 'melee',
    inMeleeSupport: true,
    meleeContactEvidence: createContactEvidence({
      contactSide: 'rear',
      contactRelationship: 'support-rear-fully-conformed',
      contactClassification: { type: 'rear' },
      contactRole: 'melee-support',
    }),
  }));

  assert.equal(simpleSupport.role, MELEE_CONTACT_ROLE_STATUSES.SIMPLE_SUPPORT);
  assert.equal(simpleSupport.supportKind, 'simple');
  assert.equal(meleeSupport.role, MELEE_CONTACT_ROLE_STATUSES.MELEE_SUPPORT);
  assert.equal(meleeSupport.supportKind, 'melee');
});

test('classifyMeleeContactUnit marks flank contact as main unit when conformation evidence is clear', () => {
  const role = classifyMeleeContactUnit(createUnit({
    id: 'flank-main',
    engagedInMelee: true,
    conformationApplied: createContactEvidence({
      contactSide: 'left',
      contactRelationship: 'front-edge-to-left-flank-edge',
      contactClassification: { type: 'flank' },
    }),
  }));

  assert.equal(role.role, MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT);
  assert.equal(role.contactSide, 'left');
});

test('classifyMeleeContactUnit marks rear contact as main unit when conformation evidence is clear', () => {
  const role = classifyMeleeContactUnit(createUnit({
    id: 'rear-main',
    engagedInMelee: true,
    conformationApplied: createContactEvidence({
      contactSide: 'rear',
      contactRelationship: 'front-edge-to-rear-edge',
      contactClassification: { type: 'rear' },
    }),
  }));

  assert.equal(role.role, MELEE_CONTACT_ROLE_STATUSES.MAIN_UNIT);
  assert.equal(role.contactSide, 'rear');
});

test('classifyMeleeContactUnit rejects corner-only contact as non-contact', () => {
  const role = classifyMeleeContactUnit(createUnit({
    id: 'corner-contact',
    engagedInMelee: true,
    conformationApplied: createContactEvidence({
      contactRelationship: 'corner-only-contact',
      contactClassification: { type: 'front' },
    }),
  }));

  assert.equal(role.role, MELEE_CONTACT_ROLE_STATUSES.NON_CONTACT);
  assert.equal(role.diagnostics[0]?.code, 'melee.contact.non-contact.corner-only');
});

test('classifyMeleeContactUnit marks rear-or-flank ambiguity as source-open', () => {
  const role = classifyMeleeContactUnit(createUnit({
    id: 'ambiguous-contact',
    engagedInMelee: true,
    conformationApplied: createContactEvidence({
      contactClassification: { type: 'rear-or-flank' },
      contactRelationship: 'front-edge-to-rear-or-flank-edge',
      contactSide: null,
    }),
  }));

  assert.equal(role.role, MELEE_CONTACT_ROLE_STATUSES.SOURCE_OPEN);
  assert.equal(role.sourceStatus, 'needs-source-check');
  assert.equal(role.diagnostics[0]?.code, 'melee.contact.source-open.rear-or-flank-ambiguous');
});

test('summarizeMeleeContactRoles filters to contact units and preserves role counts', () => {
  const summary = summarizeMeleeContactRoles([
    createUnit({
      id: 'main',
      engagedInMelee: true,
      conformationApplied: createContactEvidence({
        contactSide: 'front',
        contactRelationship: 'front-edge-to-front-edge',
        contactClassification: { type: 'front' },
      }),
    }),
    createUnit({
      id: 'simple',
      providesOnlySimpleSupport: true,
      meleeContactEvidence: createContactEvidence({
        contactRole: 'simple-support',
        contactRelationship: 'support-front-corner',
        contactClassification: { type: 'flank' },
      }),
    }),
    createUnit({
      id: 'melee',
      inMeleeSupport: true,
      meleeContactEvidence: createContactEvidence({
        contactRole: 'melee-support',
        contactRelationship: 'support-rear-fully-conformed',
        contactClassification: { type: 'rear' },
      }),
    }),
    createUnit({ id: 'reserve' }),
  ]);

  assert.equal(summary.entries.length, 3);
  assert.deepEqual(summary.mainUnitIds, ['main']);
  assert.deepEqual(summary.simpleSupportUnitIds, ['simple']);
  assert.deepEqual(summary.meleeSupportUnitIds, ['melee']);
  assert.deepEqual(summary.counts, {
    mainUnits: 1,
    simpleSupportUnits: 1,
    meleeSupportUnits: 1,
  });
});

test('resolveMeleeSupportAssignments enforces owner and opponent constraints', () => {
  const assignments = resolveMeleeSupportAssignments({
    units: [
      createUnit({
        id: 'main',
        scenarioLabel: 'Main',
        engagedInMelee: true,
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'enemy-main',
          contactRole: 'main-unit',
        }),
      }),
      createUnit({
        id: 'friendly-simple',
        scenarioLabel: 'Friendly simple',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      }),
      createUnit({
        id: 'enemy-simple',
        scenarioLabel: 'Enemy simple',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'right',
          contactRole: 'simple-support',
        }),
        engagedInMelee: false,
      }),
    ].map((unit, index) => ({
      ...unit,
      owner: index === 2 ? 'player-2' : 'player-1',
    })),
    mainUnitId: 'main',
    ownerId: 'player-1',
  });

  assert.deepEqual(assignments.simpleSupportUnitIds, ['friendly-simple']);
  assert.deepEqual(assignments.meleeSupportUnitIds, []);
});

test('resolveMeleeSupportAssignments applies one-per-side cap and marks competing support source-open', () => {
  const assignments = resolveMeleeSupportAssignments({
    units: [
      createUnit({
        id: 'main',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'enemy-main',
          contactRole: 'main-unit',
        }),
        owner: 'player-1',
      }),
      createUnit({
        id: 'simple-a',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      }),
      createUnit({
        id: 'simple-b',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      }),
      createUnit({
        id: 'melee-a',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'rear',
          contactRole: 'melee-support',
        }),
      }),
    ],
    mainUnitId: 'main',
    ownerId: 'player-1',
  });

  assert.deepEqual(assignments.simpleSupportUnitIds, ['simple-a']);
  assert.deepEqual(assignments.meleeSupportUnitIds, ['melee-a']);
  assert.equal(assignments.diagnostics.some((entry) => entry.code === 'melee.support.source-open.competing-candidates'), true);
  assert.equal(assignments.selected.find((entry) => entry.unit.id === 'simple-a')?.sourceStatus, 'needs-source-check');
});

test('resolveMeleeSupportAssignments keeps visible simple and melee support assignments for the support summary', () => {
  const assignments = resolveMeleeSupportAssignments({
    units: [
      createUnit({
        id: 'main',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'enemy-main',
          contactRole: 'main-unit',
        }),
      }),
      createUnit({
        id: 'simple-left',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'left',
          contactRole: 'simple-support',
        }),
      }),
      createUnit({
        id: 'simple-right',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'right',
          contactRole: 'simple-support',
        }),
      }),
      createUnit({
        id: 'flank-left',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'left',
          contactRole: 'melee-support',
        }),
      }),
      createUnit({
        id: 'flank-right',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'right',
          contactRole: 'melee-support',
        }),
      }),
      createUnit({
        id: 'rear',
        owner: 'player-1',
        meleeContactEvidence: createContactEvidence({
          principalOpponentId: 'main',
          contactSide: 'rear',
          contactRole: 'melee-support',
        }),
      }),
    ],
    mainUnitId: 'main',
    ownerId: 'player-1',
  });

  assert.deepEqual(assignments.simpleSupportUnitIds, ['simple-left', 'simple-right']);
  assert.deepEqual(assignments.meleeSupportUnitIds, ['flank-left', 'flank-right', 'rear']);
  assert.deepEqual(assignments.selected.map((entry) => entry.unit.id), [
    'simple-left',
    'simple-right',
    'flank-left',
    'flank-right',
    'rear',
  ]);
});