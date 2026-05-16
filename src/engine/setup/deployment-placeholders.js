import { getRotatedRectangleBounds } from '../geometry/index.js';

export const DEPLOYMENT_ZONE_SHAPE_MODELS = {
  RECTANGLE: 'rectangle',
};

export const DEPLOYMENT_SOURCE_STATUSES = {
  PLACEHOLDER: 'placeholder',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const DEPLOYMENT_ZONE_ROLE_IDS = {
  PLAYER_ONE_MAIN: 'player-one-main',
  PLAYER_TWO_MAIN: 'player-two-main',
};

export function createDeploymentZonePlaceholder({
  id,
  owner,
  label,
  zoneRole,
  pose,
  footprint,
  shapeModel = DEPLOYMENT_ZONE_SHAPE_MODELS.RECTANGLE,
  sourceStatus = DEPLOYMENT_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  sourceRefs = ['setup.deployment-zone-math'],
}) {
  return {
    id,
    owner,
    label,
    zoneRole,
    shapeModel,
    pose,
    footprint,
    sourceStatus,
    sourceRefs,
  };
}

export function createVisibleDeploymentPlaceholder({
  id,
  unitId,
  owner,
  corpsId,
  deploymentGroupId,
  pose,
  footprint,
  sourceStatus = DEPLOYMENT_SOURCE_STATUSES.PLACEHOLDER,
  sourceRefs = ['setup.deployment-corps-relative-and-overlap'],
}) {
  return {
    id,
    unitId,
    owner,
    corpsId,
    deploymentGroupId,
    pose,
    footprint,
    sourceStatus,
    sourceRefs,
  };
}

export function getDeploymentFootprintBounds(placeholder) {
  return getRotatedRectangleBounds({
    center: {
      x: placeholder.pose.xUd,
      y: placeholder.pose.yUd,
    },
    widthUd: placeholder.footprint.widthUd,
    depthUd: placeholder.footprint.depthUd,
    rotationRadians: placeholder.footprint.rotationRadians ?? 0,
  });
}

export function isDeploymentPlaceholderWithinBattlefield(placeholder, battlefieldProfile) {
  const bounds = getDeploymentFootprintBounds(placeholder);

  return bounds.minX >= 0
    && bounds.maxX <= battlefieldProfile.widthUd
    && bounds.minY >= 0
    && bounds.maxY <= battlefieldProfile.heightUd;
}

export function doDeploymentPlaceholdersOverlap(leftPlaceholder, rightPlaceholder) {
  const leftBounds = getDeploymentFootprintBounds(leftPlaceholder);
  const rightBounds = getDeploymentFootprintBounds(rightPlaceholder);

  return !(
    leftBounds.maxX <= rightBounds.minX
    || rightBounds.maxX <= leftBounds.minX
    || leftBounds.maxY <= rightBounds.minY
    || rightBounds.maxY <= leftBounds.minY
  );
}

export function createInitialDeploymentSetupState(units, battlefieldProfile) {
  const sideInsetUd = battlefieldProfile.widthUd * 0.1333333333;
  const zoneWidthUd = battlefieldProfile.widthUd - (sideInsetUd * 2);
  const zoneDepthUd = battlefieldProfile.heightUd * 0.25;

  const zones = [
    createDeploymentZonePlaceholder({
      id: DEPLOYMENT_ZONE_ROLE_IDS.PLAYER_ONE_MAIN,
      owner: 'player-1',
      label: 'Player 1 Deployment',
      zoneRole: DEPLOYMENT_ZONE_ROLE_IDS.PLAYER_ONE_MAIN,
      pose: { xUd: battlefieldProfile.widthUd / 2, yUd: zoneDepthUd / 2 },
      footprint: { widthUd: zoneWidthUd, depthUd: zoneDepthUd, rotationRadians: 0 },
    }),
    createDeploymentZonePlaceholder({
      id: DEPLOYMENT_ZONE_ROLE_IDS.PLAYER_TWO_MAIN,
      owner: 'player-2',
      label: 'Player 2 Deployment',
      zoneRole: DEPLOYMENT_ZONE_ROLE_IDS.PLAYER_TWO_MAIN,
      pose: { xUd: battlefieldProfile.widthUd / 2, yUd: battlefieldProfile.heightUd - (zoneDepthUd / 2) },
      footprint: { widthUd: zoneWidthUd, depthUd: zoneDepthUd, rotationRadians: 0 },
    }),
  ];

  const visiblePlaceholders = units.map((unit, index) => createVisibleDeploymentPlaceholder({
    id: `deployment-unit-${index + 1}`,
    unitId: unit.id,
    owner: unit.owner,
    corpsId: unit.corpsId ?? `${unit.owner}-corps-placeholder`,
    deploymentGroupId: unit.deploymentGroupId ?? `${unit.owner}-deployment-group`,
    pose: { xUd: unit.xUd, yUd: unit.yUd },
    footprint: {
      widthUd: unit.widthUd,
      depthUd: unit.depthUd,
      rotationRadians: unit.rotationRadians ?? 0,
    },
  }));

  return {
    zones,
    visiblePlaceholders,
    sourceStatus: DEPLOYMENT_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    sourceRefs: ['setup.deployment-zone-math', 'setup.deployment-corps-relative-and-overlap'],
  };
}