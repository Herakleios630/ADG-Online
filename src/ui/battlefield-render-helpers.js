import {
  addVectors,
  getAxesFromRotation,
  scaleVector,
} from '../engine/geometry/index.js';

export function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function createWheelHandleStyle(point, battlefieldProfile) {
  return [
    `left:${(point.x / battlefieldProfile.widthUd) * 100}%`,
    `top:${(point.y / battlefieldProfile.heightUd) * 100}%`,
  ].join(';');
}

export function createPreviewGhostStyle(pose, unit, battlefieldProfile) {
  return [
    `left:${(pose.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(pose.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(unit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(unit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--unit-rotation:${pose.rotationRadians}rad`,
  ].join(';');
}

export function createLinearReachStyle(segment, unit, battlefieldProfile) {
  const forwardAxis = getAxesFromRotation(segment.rotationRadians ?? 0).forwardAxis;
  const reachCenter = addVectors(
    { x: segment.xUd, y: segment.yUd },
    scaleVector(forwardAxis, (unit.depthUd / 2) + (segment.distanceUd / 2)),
  );

  return [
    `left:${(reachCenter.x / battlefieldProfile.widthUd) * 100}%`,
    `top:${(reachCenter.y / battlefieldProfile.heightUd) * 100}%`,
    `width:${(unit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(segment.distanceUd / battlefieldProfile.heightUd) * 100}%`,
    `--advance-rotation:${segment.rotationRadians ?? 0}rad`,
  ].join(';');
}

export function createPreviewBadgeStyle(pose, battlefieldProfile) {
  if (!pose || !battlefieldProfile) {
    return '';
  }

  return [
    `left:${(pose.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(pose.yUd / battlefieldProfile.heightUd) * 100}%`,
  ].join(';');
}