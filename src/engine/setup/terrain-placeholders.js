import { getRotatedRectangleBounds } from '../geometry/index.js';

export const TERRAIN_SHAPE_MODELS = {
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
};

export const TERRAIN_SOURCE_STATUSES = {
  PLACEHOLDER: 'placeholder',
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const TERRAIN_TYPE_IDS = {
  HILL: 'hill',
  WOOD: 'wood',
  FIELD: 'field',
  ROAD: 'road',
  RIVER: 'river',
  VILLAGE: 'village',
};

export function createTerrainPlaceholder(overrides = {}) {
  return {
    id: overrides.id ?? 'terrain-placeholder',
    terrainType: overrides.terrainType ?? TERRAIN_TYPE_IDS.HILL,
    label: overrides.label ?? 'Hill',
    shapeModel: overrides.shapeModel ?? TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: {
      widthUd: overrides.footprint?.widthUd ?? 4,
      depthUd: overrides.footprint?.depthUd ?? 2,
      rotationRadians: overrides.footprint?.rotationRadians ?? 0,
    },
    pose: {
      xUd: overrides.pose?.xUd ?? 15,
      yUd: overrides.pose?.yUd ?? 10,
    },
    ownerRole: overrides.ownerRole ?? 'public',
    placementStep: overrides.placementStep ?? 'terrain',
    lockState: overrides.lockState ?? 'draft',
    sourceStatus: overrides.sourceStatus ?? TERRAIN_SOURCE_STATUSES.PLACEHOLDER,
    sourceRefs: overrides.sourceRefs ?? [],
  };
}

export function getTerrainPlaceholderFootprintBounds(placeholder) {
  return getRotatedRectangleBounds({
    center: { x: placeholder.pose.xUd, y: placeholder.pose.yUd },
    widthUd: placeholder.footprint.widthUd,
    depthUd: placeholder.footprint.depthUd,
    rotationRadians: placeholder.footprint.rotationRadians,
  });
}

export function isTerrainPlaceholderWithinBattlefield(placeholder, battlefieldProfile) {
  const bounds = getTerrainPlaceholderFootprintBounds(placeholder);

  return (
    bounds.minX >= 0
    && bounds.minY >= 0
    && bounds.maxX <= battlefieldProfile.widthUd
    && bounds.maxY <= battlefieldProfile.heightUd
  );
}
