import { getPerpendicularVector, normalizeVector, rotateVector } from './vector.js';

export const TAU_RADIANS = Math.PI * 2;

export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

export function normalizeAngleRadians(angleRadians) {
  const normalized = angleRadians % TAU_RADIANS;

  if (normalized < 0) {
    return normalized + TAU_RADIANS;
  }

  return normalized;
}

export function getAxesFromRotation(angleRadians) {
  const forwardAxis = normalizeVector(rotateVector({ x: 0, y: -1 }, angleRadians));
  const rightAxis = normalizeVector(getPerpendicularVector(forwardAxis));

  return {
    forwardAxis,
    rightAxis,
  };
}