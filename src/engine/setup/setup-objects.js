import { getRotatedRectangleBounds } from '../geometry/index.js';

export const SETUP_OBJECT_FAMILIES = {
  CAMP: 'camp',
  FORTIFICATION: 'fortification',
  OBSTACLE: 'obstacle',
  STAKES: 'stakes',
  MARKER_SHELL: 'marker-shell',
};

export const SETUP_OBJECT_TYPE_IDS = {
  CAMP: 'camp',
  FORTIFIED_CAMP: 'fortified-camp',
  SACRED_CAMP: 'sacred-camp',
  FORTIFICATION: 'fortification',
  OBSTACLE: 'obstacle',
  STAKES: 'stakes',
};

const MANDATORY_CAMP_EDGE_INSET_UD = 1.8;

export function createSetupObjectPlaceholder(overrides = {}) {
  return {
    id: overrides.id ?? 'setup-object',
    family: overrides.family ?? SETUP_OBJECT_FAMILIES.CAMP,
    type: overrides.type ?? SETUP_OBJECT_TYPE_IDS.CAMP,
    label: overrides.label ?? 'Camp',
    owner: overrides.owner ?? 'player-1',
    pose: {
      xUd: overrides.pose?.xUd ?? 4,
      yUd: overrides.pose?.yUd ?? 18,
    },
    footprint: {
      widthUd: overrides.footprint?.widthUd ?? 2.5,
      depthUd: overrides.footprint?.depthUd ?? 1.6,
      rotationRadians: overrides.footprint?.rotationRadians ?? 0,
    },
    lockState: overrides.lockState ?? 'draft',
    visibility: overrides.visibility ?? 'public',
    budget: {
      points: overrides.budget?.points ?? null,
      sourceStatus: overrides.budget?.sourceStatus ?? 'needs-source-check',
    },
    sourceStatus: overrides.sourceStatus ?? 'placeholder',
    sourceRefs: overrides.sourceRefs ?? [],
  };
}

export function createMandatoryCampPlaceholders() {
  return [
    createSetupObjectPlaceholder({
      id: 'camp-player-1',
      label: 'Camp P1',
      owner: 'player-1',
      pose: { xUd: 5, yUd: 20 - MANDATORY_CAMP_EDGE_INSET_UD },
      sourceRefs: ['standard-200.budget-table.values', 'setup.camps-fortifications-obstacles'],
    }),
    createSetupObjectPlaceholder({
      id: 'camp-player-2',
      label: 'Camp P2',
      owner: 'player-2',
      pose: { xUd: 25, yUd: MANDATORY_CAMP_EDGE_INSET_UD },
      sourceRefs: ['standard-200.budget-table.values', 'setup.camps-fortifications-obstacles'],
    }),
  ];
}

export function getSetupObjectFootprintBounds(setupObject) {
  return getRotatedRectangleBounds({
    center: { x: setupObject.pose.xUd, y: setupObject.pose.yUd },
    widthUd: setupObject.footprint.widthUd,
    depthUd: setupObject.footprint.depthUd,
    rotationRadians: setupObject.footprint.rotationRadians,
  });
}

export function isSetupObjectWithinBattlefield(setupObject, battlefieldProfile) {
  const bounds = getSetupObjectFootprintBounds(setupObject);
  return (
    bounds.minX >= 0
    && bounds.minY >= 0
    && bounds.maxX <= battlefieldProfile.widthUd
    && bounds.maxY <= battlefieldProfile.heightUd
  );
}