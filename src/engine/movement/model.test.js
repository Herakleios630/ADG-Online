import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMovementConfirmation,
  createMovementDraft,
  createMovementPreview,
  createMovementSegment,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_CONFIRMATION_STATUSES,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
} from './model.js';
import { createAdvancePreview } from './advance.js';
import { createSlidePreview, MOVEMENT_SLIDE_SIDES } from './slide.js';
import { createWheelPreview } from './wheel.js';
import { degreesToRadians } from '../geometry/index.js';
import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../../data/battlefield-profiles.js';

test('movement model factories normalize a serializable command preview shape', () => {
  const segment = createMovementSegment({
    commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    unitId: 'test-unit-1',
    startPose: { xUd: 10, yUd: 10, rotationRadians: 0 },
    endPose: { xUd: 10, yUd: 8, rotationRadians: 0 },
    distance: { requestedUd: 2, resolvedUd: 2, measurementMode: 'front-edge' },
    diagnostics: [{ id: 'placeholder', message: 'No rule validation yet.' }],
  });
  const draft = createMovementDraft({
    commandId: MOVEMENT_COMMAND_IDS.ADVANCE,
    unitId: 'test-unit-1',
    segments: [segment],
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
  const preview = createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [segment],
    explanations: ['Preview only. No legality checks yet.'],
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
  const confirmation = createMovementConfirmation({
    status: MOVEMENT_CONFIRMATION_STATUSES.READY,
    readyCommandId: MOVEMENT_COMMAND_IDS.ADVANCE,
  });

  const serialized = JSON.stringify({ draft, preview, confirmation });
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.draft.commandId, MOVEMENT_COMMAND_IDS.ADVANCE);
  assert.equal(parsed.draft.segments[0].distance.measurementMode, 'front-edge');
  assert.equal(parsed.preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(parsed.preview.explanations[0], 'Preview only. No legality checks yet.');
  assert.equal(parsed.confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.READY);
});

test('movement model factories fall back to placeholder-safe defaults', () => {
  const draft = createMovementDraft({ commandId: 'invalid-command' });
  const preview = createMovementPreview({ status: 'unknown', explanations: ['ok', 1] });
  const confirmation = createMovementConfirmation({ status: 'not-real' });

  assert.equal(draft.commandId, null);
  assert.equal(draft.sourceStatus, MOVEMENT_SOURCE_STATUSES.PLACEHOLDER);
  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.IDLE);
  assert.deepEqual(preview.explanations, ['ok']);
  assert.equal(confirmation.status, MOVEMENT_CONFIRMATION_STATUSES.IDLE);
});

test('advance preview follows unit rotation when computing the end pose', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createAdvancePreview(
    {
      id: 'test-unit-1',
      xUd: 10,
      yUd: 10,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: degreesToRadians(90),
    },
    2,
    battlefieldProfile,
  );

  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(Number(preview.segments[0].endPose.xUd.toFixed(3)), 12);
  assert.equal(Number(preview.segments[0].endPose.yUd.toFixed(3)), 10);
});

test('advance preview rejects footprints that leave the battlefield', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createAdvancePreview(
    {
      id: 'test-unit-1',
      xUd: 1,
      yUd: 0.6,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
    },
    1,
    battlefieldProfile,
  );

  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.REJECTED);
  assert.equal(preview.diagnostics[0].id, 'battlefield-bounds');
});

test('wheel preview pivots around the left front corner for a 90-degree wheel', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createWheelPreview(
    {
      id: 'test-unit-1',
      xUd: 10,
      yUd: 10,
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    MOVEMENT_PIVOT_SIDES.LEFT,
    Math.PI / 2,
    battlefieldProfile,
  );

  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(Number(preview.segments[0].endPose.xUd.toFixed(3)), 9.5);
  assert.equal(Number(preview.segments[0].endPose.yUd.toFixed(3)), 8.5);
  assert.equal(Number(preview.segments[0].distance.resolvedUd.toFixed(3)), 1.5);
  assert.equal(preview.segments[0].distance.measurementMode, 'p4-linear-90deg-equals-1.5ud');
});

test('wheel preview pivots around the right front corner for a 90-degree wheel', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createWheelPreview(
    {
      id: 'test-unit-1',
      xUd: 10,
      yUd: 10,
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    MOVEMENT_PIVOT_SIDES.RIGHT,
    Math.PI / 2,
    battlefieldProfile,
  );

  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(Number(preview.segments[0].endPose.xUd.toFixed(3)), 10.5);
  assert.equal(Number(preview.segments[0].endPose.yUd.toFixed(3)), 8.5);
});

test('wheel preview uses linear P4 distance proportions for partial angles', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createWheelPreview(
    {
      id: 'test-unit-1',
      xUd: 10,
      yUd: 10,
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    MOVEMENT_PIVOT_SIDES.RIGHT,
    Math.PI / 4,
    battlefieldProfile,
  );

  assert.equal(Number(preview.segments[0].distance.resolvedUd.toFixed(3)), 0.75);
});

test('wheel preview rejects rotated footprints that leave the battlefield', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createWheelPreview(
    {
      id: 'test-unit-1',
      xUd: 0.7,
      yUd: 0.7,
      widthUd: 2,
      depthUd: 1,
      rotationRadians: 0,
    },
    MOVEMENT_PIVOT_SIDES.LEFT,
    Math.PI / 2,
    battlefieldProfile,
  );

  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.REJECTED);
  assert.equal(preview.diagnostics[0].id, 'battlefield-bounds');
});

test('slide preview moves laterally without changing rotation', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createSlidePreview(
    {
      id: 'test-unit-1',
      xUd: 10,
      yUd: 10,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: 0,
    },
    MOVEMENT_SLIDE_SIDES.RIGHT,
    1,
    battlefieldProfile,
  );

  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(Number(preview.segments[0].endPose.xUd.toFixed(3)), 11);
  assert.equal(Number(preview.segments[0].endPose.yUd.toFixed(3)), 10);
  assert.equal(Number(preview.segments[0].endPose.rotationRadians.toFixed(3)), 0);
});

test('slide preview follows rotated unit right axis', () => {
  const battlefieldProfile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const preview = createSlidePreview(
    {
      id: 'test-unit-1',
      xUd: 10,
      yUd: 10,
      widthUd: 1,
      depthUd: 1,
      rotationRadians: degreesToRadians(90),
    },
    MOVEMENT_SLIDE_SIDES.RIGHT,
    1,
    battlefieldProfile,
  );

  assert.equal(preview.status, MOVEMENT_PREVIEW_STATUSES.ACCEPTED);
  assert.equal(Number(preview.segments[0].endPose.xUd.toFixed(3)), 10);
  assert.equal(Number(preview.segments[0].endPose.yUd.toFixed(3)), 11);
});
