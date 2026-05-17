import { getRotatedRectangleBounds } from '../engine/geometry/index.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clampBattlefieldPointUd(surfaceRect, zoom, panX, panY, clientX, clientY, battlefieldProfile, footprint = null) {
  const worldX = clientX - surfaceRect.left + panX;
  const worldY = clientY - surfaceRect.top + panY;
  const rawXUd = (worldX / (surfaceRect.width * zoom)) * battlefieldProfile.widthUd;
  const rawYUd = (worldY / (surfaceRect.height * zoom)) * battlefieldProfile.heightUd;

  if (!footprint) {
    return {
      xUd: clamp(rawXUd, 0, battlefieldProfile.widthUd),
      yUd: clamp(rawYUd, 0, battlefieldProfile.heightUd),
    };
  }

  const footprintBounds = getRotatedRectangleBounds({
    center: { x: 0, y: 0 },
    widthUd: footprint.widthUd,
    depthUd: footprint.depthUd,
    rotationRadians: footprint.rotationRadians,
  });
  const minCenterX = -footprintBounds.minX;
  const maxCenterX = battlefieldProfile.widthUd - footprintBounds.maxX;
  const minCenterY = -footprintBounds.minY;
  const maxCenterY = battlefieldProfile.heightUd - footprintBounds.maxY;

  return {
    xUd: clamp(rawXUd, minCenterX, maxCenterX),
    yUd: clamp(rawYUd, minCenterY, maxCenterY),
  };
}

export function getBattlefieldPointUd(surfaceRect, zoom, panX, panY, clientX, clientY, battlefieldProfile) {
  const worldX = clientX - surfaceRect.left + panX;
  const worldY = clientY - surfaceRect.top + panY;

  return {
    xUd: (worldX / (surfaceRect.width * zoom)) * battlefieldProfile.widthUd,
    yUd: (worldY / (surfaceRect.height * zoom)) * battlefieldProfile.heightUd,
  };
}

export function clampBattlefieldCenterToFootprint(xUd, yUd, battlefieldProfile, footprint) {
  if (!footprint) {
    return {
      xUd: clamp(xUd, 0, battlefieldProfile.widthUd),
      yUd: clamp(yUd, 0, battlefieldProfile.heightUd),
    };
  }

  const footprintBounds = getRotatedRectangleBounds({
    center: { x: 0, y: 0 },
    widthUd: footprint.widthUd,
    depthUd: footprint.depthUd,
    rotationRadians: footprint.rotationRadians,
  });

  return {
    xUd: clamp(xUd, -footprintBounds.minX, battlefieldProfile.widthUd - footprintBounds.maxX),
    yUd: clamp(yUd, -footprintBounds.minY, battlefieldProfile.heightUd - footprintBounds.maxY),
  };
}