import test from 'node:test';
import assert from 'node:assert/strict';

import { STANDARD_200_BATTLEFIELD_PROFILE } from '../../data/battlefield-profiles.js';
import { createTerrainPlaceholder, TERRAIN_TYPE_IDS } from './terrain-placeholders.js';
import {
  createTerrainValidationSnapshot,
  hasBlockingTerrainValidationErrors,
  TERRAIN_VALIDATION_SEVERITIES,
  validateTerrainPlaceholder,
} from './terrain-validation.js';

test('terrain validation accepts a physically valid placeholder', () => {
  const placeholder = createTerrainPlaceholder({
    id: 'terrain-1',
    pose: { xUd: 8, yUd: 7 },
    footprint: { widthUd: 4, depthUd: 3, rotationRadians: 0 },
  });

  const results = validateTerrainPlaceholder(placeholder, STANDARD_200_BATTLEFIELD_PROFILE, [placeholder]);

  assert.equal(hasBlockingTerrainValidationErrors(results), false);
  assert.ok(results.some((result) => result.id === 'battlefield-bounds' && result.ok));
});

test('terrain validation reports a battlefield-bounds error for out-of-bounds footprints', () => {
  const placeholder = createTerrainPlaceholder({
    id: 'terrain-outside',
    pose: { xUd: 29, yUd: 19 },
    footprint: { widthUd: 4, depthUd: 4, rotationRadians: 0 },
  });

  const results = validateTerrainPlaceholder(placeholder, STANDARD_200_BATTLEFIELD_PROFILE, [placeholder]);
  const boundsResult = results.find((result) => result.id === 'battlefield-bounds');

  assert.ok(boundsResult);
  assert.equal(boundsResult.ok, false);
  assert.equal(boundsResult.severity, TERRAIN_VALIDATION_SEVERITIES.ERROR);
  assert.equal(hasBlockingTerrainValidationErrors(results), true);
});

test('terrain validation reports invalid placeholder size', () => {
  const placeholder = createTerrainPlaceholder({
    id: 'terrain-flat',
    footprint: { widthUd: 0, depthUd: 2, rotationRadians: 0 },
  });

  const results = validateTerrainPlaceholder(placeholder, STANDARD_200_BATTLEFIELD_PROFILE, [placeholder]);
  const sizeResult = results.find((result) => result.id === 'positive-size');

  assert.ok(sizeResult);
  assert.equal(sizeResult.ok, false);
  assert.equal(sizeResult.severity, TERRAIN_VALIDATION_SEVERITIES.ERROR);
});

test('terrain validation snapshot carries road or river source-check warnings', () => {
  const placeholder = createTerrainPlaceholder({
    id: 'terrain-road',
    terrainType: TERRAIN_TYPE_IDS.ROAD,
    label: 'Road',
  });

  const snapshot = createTerrainValidationSnapshot({
    placeholders: [placeholder],
    selectedPlaceholderId: placeholder.id,
    battlefieldProfile: STANDARD_200_BATTLEFIELD_PROFILE,
  });

  assert.equal(snapshot.activeSource, 'selected-placeholder');
  assert.ok(snapshot.activeResults.some((result) => result.id === 'road-river-source-check'));
  assert.ok(snapshot.globalResults.some((result) => result.id === 'official-placement-warning'));
});