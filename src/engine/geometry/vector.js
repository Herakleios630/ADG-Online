export const GEOMETRY_EPSILON = 1e-9;

export function addVectors(left, right) {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
  };
}

export function subtractVectors(left, right) {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
  };
}

export function scaleVector(vector, factor) {
  return {
    x: vector.x * factor,
    y: vector.y * factor,
  };
}

export function dotProduct(left, right) {
  return (left.x * right.x) + (left.y * right.y);
}

export function crossProduct(left, right) {
  return (left.x * right.y) - (left.y * right.x);
}

export function getVectorLength(vector) {
  return Math.hypot(vector.x, vector.y);
}

export function normalizeVector(vector) {
  const length = getVectorLength(vector);

  if (length <= GEOMETRY_EPSILON) {
    return { x: 0, y: 0 };
  }

  return scaleVector(vector, 1 / length);
}

export function getPerpendicularVector(vector) {
  return {
    x: -vector.y,
    y: vector.x,
  };
}

export function rotateVector(vector, angleRadians) {
  const cosine = Math.cos(angleRadians);
  const sine = Math.sin(angleRadians);

  return {
    x: (vector.x * cosine) - (vector.y * sine),
    y: (vector.x * sine) + (vector.y * cosine),
  };
}