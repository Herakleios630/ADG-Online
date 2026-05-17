import { GEOMETRY_EPSILON, getUnitBaseGeometry, worldPointToLocalPoint } from '../geometry/index.js';

export const ZOC_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  PLACEHOLDER: 'placeholder',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export const ZOC_DEFAULT_FRONT_RANGE_UD = 1;

const DEFAULT_EXCEPTION_SOURCE_REFS = ['zoc.terrain-suppression-and-non-exerting-cases'];

function normalizeSourceStatus(sourceStatus) {
  return Object.values(ZOC_SOURCE_STATUSES).includes(sourceStatus)
    ? sourceStatus
    : ZOC_SOURCE_STATUSES.NEEDS_SOURCE_CHECK;
}

function normalizePoseUnit(unit = {}) {
  return {
    id: unit.id ?? null,
    owner: unit.owner ?? null,
    xUd: Number.isFinite(unit.xUd) ? unit.xUd : 0,
    yUd: Number.isFinite(unit.yUd) ? unit.yUd : 0,
    widthUd: Number.isFinite(unit.widthUd) ? unit.widthUd : 1,
    depthUd: Number.isFinite(unit.depthUd) ? unit.depthUd : 1,
    rotationRadians: Number.isFinite(unit.rotationRadians) ? unit.rotationRadians : 0,
  };
}

function getUnitBase(unit) {
  const normalized = normalizePoseUnit(unit);

  return {
    id: normalized.id,
    owner: normalized.owner,
    center: { x: normalized.xUd, y: normalized.yUd },
    widthUd: normalized.widthUd,
    depthUd: normalized.depthUd,
    rotationRadians: normalized.rotationRadians,
  };
}

function createExceptionHooks(overrides = {}) {
  return {
    terrainSuppressesZoc: Boolean(overrides.terrainSuppressesZoc),
    nonExertingUnit: Boolean(overrides.nonExertingUnit),
    sourceStatus: normalizeSourceStatus(overrides.sourceStatus),
    sourceRefs: Array.isArray(overrides.sourceRefs) && overrides.sourceRefs.length > 0
      ? overrides.sourceRefs
      : DEFAULT_EXCEPTION_SOURCE_REFS,
  };
}

function toLocalPoint(enemyBase, point) {
  return worldPointToLocalPoint(
    {
      center: enemyBase.center,
      widthUd: enemyBase.widthUd,
      depthUd: enemyBase.depthUd,
      rotationRadians: enemyBase.rotationRadians,
    },
    point,
  );
}

function isEnemyForTarget(enemyUnit, targetUnit) {
  const normalizedEnemy = normalizePoseUnit(enemyUnit);
  const normalizedTarget = normalizePoseUnit(targetUnit);

  if (!normalizedEnemy.owner || !normalizedTarget.owner) {
    return true;
  }

  return normalizedEnemy.owner !== normalizedTarget.owner;
}

export function getEnemyZocBandLocalBounds(enemyUnit, options = {}) {
  const enemyBase = getUnitBase(enemyUnit);
  const rangeUd = Number.isFinite(options.rangeUd) ? Math.max(options.rangeUd, 0) : ZOC_DEFAULT_FRONT_RANGE_UD;
  const lateralPaddingUd = Number.isFinite(options.lateralPaddingUd) ? Math.max(options.lateralPaddingUd, 0) : 0;
  const halfWidth = enemyBase.widthUd / 2;
  const halfDepth = enemyBase.depthUd / 2;

  return {
    enemyUnitId: enemyBase.id,
    rangeUd,
    localBounds: {
      minX: -(halfWidth + lateralPaddingUd),
      maxX: halfWidth + lateralPaddingUd,
      minY: halfDepth,
      maxY: halfDepth + rangeUd,
    },
    sourceStatus: normalizeSourceStatus(options.sourceStatus),
    sourceRefs: Array.isArray(options.sourceRefs)
      ? options.sourceRefs
      : ['zoc.definition-front-geometry-and-range'],
    exceptionHooks: createExceptionHooks(options.exceptionHooks),
  };
}

export function evaluatePointInEnemyFrontZoc(enemyUnit, worldPoint, options = {}) {
  const enemyBase = getUnitBase(enemyUnit);
  const zone = getEnemyZocBandLocalBounds(enemyUnit, options);
  const localPoint = toLocalPoint(enemyBase, worldPoint);
  const localBounds = zone.localBounds;
  const inXBand = localPoint.x >= localBounds.minX - GEOMETRY_EPSILON
    && localPoint.x <= localBounds.maxX + GEOMETRY_EPSILON;
  const aheadOfFront = localPoint.y > localBounds.minY + GEOMETRY_EPSILON;
  const withinRange = localPoint.y <= localBounds.maxY + GEOMETRY_EPSILON;

  return {
    enemyUnitId: enemyBase.id,
    worldPoint,
    localPoint,
    inXBand,
    aheadOfFront,
    withinRange,
    isInZoc: inXBand && aheadOfFront && withinRange,
    rangeUd: zone.rangeUd,
    sourceStatus: zone.sourceStatus,
    sourceRefs: zone.sourceRefs,
    exceptionHooks: zone.exceptionHooks,
  };
}

export function getUnitFootprintSamplePoints(unit) {
  const unitBase = getUnitBase(unit);
  const geometry = getUnitBaseGeometry(unitBase);

  return [
    { id: 'center', point: geometry.center },
    { id: 'front-left', point: geometry.corners.frontLeft },
    { id: 'front-right', point: geometry.corners.frontRight },
    { id: 'rear-right', point: geometry.corners.rearRight },
    { id: 'rear-left', point: geometry.corners.rearLeft },
  ];
}

export function evaluateUnitFootprintInEnemyZoc(enemyUnit, targetUnit, options = {}) {
  const enemyBase = getUnitBase(enemyUnit);
  const targetBase = getUnitBase(targetUnit);
  const zone = getEnemyZocBandLocalBounds(enemyUnit, options);
  const sampledPoints = getUnitFootprintSamplePoints(targetUnit).map((sample) => {
    const pointResult = evaluatePointInEnemyFrontZoc(enemyUnit, sample.point, options);
    return {
      ...sample,
      localPoint: pointResult.localPoint,
      isInZoc: pointResult.isInZoc,
      inXBand: pointResult.inXBand,
      aheadOfFront: pointResult.aheadOfFront,
      withinRange: pointResult.withinRange,
    };
  });
  const matchingSamples = sampledPoints.filter((sample) => sample.isInZoc);

  return {
    enemyUnitId: enemyBase.id,
    targetUnitId: targetBase.id,
    targetOwner: targetBase.owner,
    enemyOwner: enemyBase.owner,
    rangeUd: zone.rangeUd,
    localBounds: zone.localBounds,
    sourceStatus: zone.sourceStatus,
    sourceRefs: zone.sourceRefs,
    exceptionHooks: zone.exceptionHooks,
    sampledPoints,
    matchingPointIds: matchingSamples.map((sample) => sample.id),
    isInEnemyZoc: matchingSamples.length > 0,
  };
}

export function getEnemyZocContacts(enemyUnits, targetUnit, options = {}) {
  if (!Array.isArray(enemyUnits)) {
    return [];
  }

  return enemyUnits
    .filter((enemyUnit) => isEnemyForTarget(enemyUnit, targetUnit))
    .map((enemyUnit) => evaluateUnitFootprintInEnemyZoc(enemyUnit, targetUnit, options))
    .filter((result) => result.isInEnemyZoc)
    .sort((left, right) => String(left.enemyUnitId).localeCompare(String(right.enemyUnitId)));
}