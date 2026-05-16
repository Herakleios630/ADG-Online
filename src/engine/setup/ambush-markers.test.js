import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAmbushMarkerDraft,
  createInitialAmbushMarkersState,
  getPublicAmbushMarkerShell,
  isAmbushMarkerWithinBattlefield,
} from './ambush-markers.js';

test('initial ambush marker state starts empty because ambush markers are optional', () => {
  const ambushState = createInitialAmbushMarkersState();

  assert.equal(ambushState.visibilityScope, 'owner-only');
  assert.equal(ambushState.markers.length, 0);
});

test('ambush marker draft factory creates labelled optional markers with empty private notes', () => {
  const marker = createAmbushMarkerDraft({}, 0);

  assert.equal(marker.label, 'Marker I');
  assert.equal(marker.privateContents.notes, '');
});

test('public ambush shell projection excludes private contents', () => {
  const shell = getPublicAmbushMarkerShell({
    ...createAmbushMarkerDraft({}, 0),
    privateContents: {
      notes: 'LH and Psiloi',
      unitRefs: ['unit-1'],
    },
  });

  assert.equal(shell.label, 'Marker I');
  assert.equal('privateContents' in shell, false);
});

test('ambush marker footprint must remain inside the battlefield', () => {
  const marker = {
    ...createAmbushMarkerDraft({}, 0),
    pose: { xUd: 29.7, yUd: 19.8 },
  };

  assert.equal(isAmbushMarkerWithinBattlefield(marker, { widthUd: 30, heightUd: 20 }), false);
});