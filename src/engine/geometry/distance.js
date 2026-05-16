export function getPointDistance(left, right) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

export function getRectangleCenterDistance(sourceRectangle, targetRectangle) {
  return getPointDistance(sourceRectangle.center, targetRectangle.center);
}