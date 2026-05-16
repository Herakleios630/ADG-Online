import test from 'node:test';
import assert from 'node:assert/strict';

import { STANDARD_200_BATTLEFIELD_PROFILE } from '../../data/battlefield-profiles.js';
import {
  TERRAIN_SHAPE_MODELS,
  TERRAIN_SOURCE_STATUSES,
  TERRAIN_TYPE_IDS,
  createTerrainPlaceholder,
  getTerrainPlaceholderFootprintBounds,
  isTerrainPlaceholderWithinBattlefield,
} from './terrain-placeholders.js';

test('terrain placeholder factory creates a serializable default placeholder', () => {
  const placeholder = createTerrainPlaceholder();

  assert.equal(placeholder.terrainType, TERRAIN_TYPE_IDS.HILL);
  assert.equal(placeholder.label, 'Hill');
  assert.equal(placeholder.shapeModel, TERRAIN_SHAPE_MODELS.RECTANGLE);
  assert.equal(placeholder.lockState, 'draft');
  assert.equal(placeholder.sourceStatus, TERRAIN_SOURCE_STATUSES.PLACEHOLDER);
  assert.deepEqual(placeholder.sourceRefs, []);
});

test('terrain placeholder footprint bounds reflect the rotated full footprint', () => {
  const placeholder = createTerrainPlaceholder({
    footprint: {
      widthUd: 2,
      depthUd: 2,
      rotationRadians: Math.PI / 4,
    },
    pose: {
      xUd: 10,
      yUd: 10,
    },
  });

  const bounds = getTerrainPlaceholderFootprintBounds(placeholder);

  assert.ok(bounds.minX < 10);
  assert.ok(bounds.maxX > 10);
  assert.ok(bounds.minY < 10);
  assert.ok(bounds.maxY > 10);
});

test('terrain placeholder battlefield check uses full footprint extents', () => {
  const insidePlaceholder = createTerrainPlaceholder({
    pose: {
      xUd: 4,
      yUd: 4,
    },
  });
  const outsidePlaceholder = createTerrainPlaceholder({
    pose: {
      xUd: 29,
      yUd: 19,
    },
    footprint: {
      widthUd: 4,
      depthUd: 4,
      rotationRadians: 0,
    },
  });

  assert.equal(isTerrainPlaceholderWithinBattlefield(insidePlaceholder, STANDARD_200_BATTLEFIELD_PROFILE), true);
  assert.equal(isTerrainPlaceholderWithinBattlefield(outsidePlaceholder, STANDARD_200_BATTLEFIELD_PROFILE), false);
});
