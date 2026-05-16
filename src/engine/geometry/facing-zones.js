import { GEOMETRY_EPSILON } from './vector.js';

export const FACING_ZONE_LABELS = {
  FRONT: 'front',
  FLANK: 'flank',
  LEFT_FLANK: 'leftFlank',
  RIGHT_FLANK: 'rightFlank',
  REAR: 'rear',
  BOUNDARY: 'boundary',
  AMBIGUOUS: 'ambiguous',
};

function isCloseToBoundary(value, boundary) {
  return Math.abs(Math.abs(value) - boundary) <= GEOMETRY_EPSILON;
}

export function classifyLocalPointFacingZone(point, halfWidthUd, halfDepthUd) {
  const insideHorizontalBounds = point.x >= -halfWidthUd - GEOMETRY_EPSILON && point.x <= halfWidthUd + GEOMETRY_EPSILON;
  const insideVerticalBounds = point.y >= -halfDepthUd - GEOMETRY_EPSILON && point.y <= halfDepthUd + GEOMETRY_EPSILON;

  if (insideHorizontalBounds && insideVerticalBounds) {
    if (
      isCloseToBoundary(point.x, halfWidthUd)
      || isCloseToBoundary(point.y, halfDepthUd)
    ) {
      return FACING_ZONE_LABELS.BOUNDARY;
    }

    return FACING_ZONE_LABELS.AMBIGUOUS;
  }

  if (point.y > halfDepthUd) {
    return FACING_ZONE_LABELS.FRONT;
  }

  if (point.y < -halfDepthUd) {
    return FACING_ZONE_LABELS.REAR;
  }

  if (insideHorizontalBounds) {
    return FACING_ZONE_LABELS.AMBIGUOUS;
  }

  if (insideVerticalBounds) {
    return point.x < -halfWidthUd ? FACING_ZONE_LABELS.LEFT_FLANK : FACING_ZONE_LABELS.RIGHT_FLANK;
  }

  return point.x < 0 ? FACING_ZONE_LABELS.LEFT_FLANK : FACING_ZONE_LABELS.RIGHT_FLANK;
}