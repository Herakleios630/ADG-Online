import test from 'node:test';
import assert from 'node:assert/strict';

import { createAmbushMarkerDraft } from '../setup/ambush-markers.js';
import { assignCorpsToBattlePlanField, createInitialBattlePlanState } from '../setup/battle-plan.js';
import { projectSetupForViewer, SETUP_VIEW_MODES } from './setup-view.js';

function createSetupFixture() {
  const battlePlan = assignCorpsToBattlePlanField(
    createInitialBattlePlanState(),
    'corps-1',
    'left',
  );

  return {
    isActive: true,
    currentStepId: 'ambushes',
    lockedStepIds: [],
    terrain: { placeholders: [], selectedPlaceholderId: null, validation: null },
    setupObjects: { placeholders: [], selectedObjectId: null },
    battlePlan,
    ambushMarkers: {
      owner: 'player-1',
      visibilityScope: 'owner-only',
      sourceStatus: 'needs-source-check',
      selectedMarkerId: 'ambush-marker-1',
      markers: [
        {
          ...createAmbushMarkerDraft({}, 0),
          privateContents: {
            notes: 'LH behind wood',
            unitRefs: ['unit-1'],
          },
        },
      ],
    },
  };
}

test('canonical setup view keeps private battle plan and ambush contents', () => {
  const projected = projectSetupForViewer(createSetupFixture(), SETUP_VIEW_MODES.CANONICAL);

  assert.deepEqual(projected.battlePlan.fieldAssignments.left, ['corps-1']);
  assert.equal(projected.ambushMarkers.markers[0].privateContents.notes, 'LH behind wood');
});

test('player two view redacts battle plan assignments and ambush contents', () => {
  const projected = projectSetupForViewer(createSetupFixture(), SETUP_VIEW_MODES.PLAYER_TWO);

  assert.deepEqual(projected.battlePlan.fieldAssignments.left, []);
  assert.equal(projected.battlePlan.corpsCards[0].assignmentFieldId, null);
  assert.equal(projected.ambushMarkers.markers[0].privateContents.notes, '');
  assert.equal(projected.ambushMarkers.markers[0].label, 'Marker I');
});

test('hotseat handoff view hides private setup data but keeps public marker shell state', () => {
  const projected = projectSetupForViewer(createSetupFixture(), SETUP_VIEW_MODES.HOTSEAT_HANDOFF);

  assert.equal(projected.battlePlan.isRedacted, true);
  assert.equal(projected.ambushMarkers.isRedacted, true);
  assert.equal(projected.ambushMarkers.markers[0].privateContents.notes, '');
  assert.equal(projected.ambushMarkers.markers[0].pose.xUd, 6);
});