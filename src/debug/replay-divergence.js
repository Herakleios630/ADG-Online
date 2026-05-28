function toRoundedNumber(value, digits = 4) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(digits)) : null;
}

const REPLAY_DISTANCE_TOLERANCE_UD = 0.0001001;
const TOLERANT_CHECKPOINT_PATHS = new Set([
  'movement.totalDistanceUd',
  'movement.lastSegment.distanceUd',
]);

function isEquivalentCheckpointValue(path, expected, actual) {
  if (expected === actual) {
    return true;
  }

  if (
    TOLERANT_CHECKPOINT_PATHS.has(path)
    && Number.isFinite(expected)
    && Number.isFinite(actual)
  ) {
    return Math.abs(expected - actual) <= REPLAY_DISTANCE_TOLERANCE_UD;
  }

  return false;
}

function normalizeSide(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'left' || normalized === 'right' ? normalized : null;
}

function getNormalizedMovementSegmentSide(segment = null) {
  const explicitSide = normalizeSide(segment?.side);
  if (explicitSide) {
    return explicitSide;
  }

  const measurementMode = String(segment?.distance?.measurementMode ?? '').toLowerCase();
  if (measurementMode.includes('left')) {
    return 'left';
  }

  if (measurementMode.includes('right')) {
    return 'right';
  }

  return null;
}

function normalizeMovementSegment(segment = null) {
  if (!segment || typeof segment !== 'object') {
    return null;
  }

  return {
    commandId: segment.commandId ?? null,
    distanceUd: toRoundedNumber(segment.distanceUd ?? segment.distance?.resolvedUd),
    angleRadians: toRoundedNumber(segment.angleRadians ?? segment.maneuver?.angleRadians),
    pivotSide: normalizeSide(segment.pivotSide ?? segment.maneuver?.pivotSide),
    side: getNormalizedMovementSegmentSide(segment),
  };
}

function normalizeChargeStartManoeuvre(manoeuvre = null) {
  if (!manoeuvre || typeof manoeuvre !== 'object') {
    return null;
  }

  const normalized = {
    type: manoeuvre.type ?? null,
    pivotSide: normalizeSide(manoeuvre.pivotSide),
    wheelAngleRadians: toRoundedNumber(manoeuvre.wheelAngleRadians),
    slideSide: normalizeSide(manoeuvre.slideSide),
    slideDistanceUd: toRoundedNumber(manoeuvre.slideDistanceUd),
    spentBudgetUd: toRoundedNumber(manoeuvre.spentBudgetUd),
  };

  if (
    normalized.type === 'none'
    && normalized.pivotSide == null
    && normalized.wheelAngleRadians === 0
    && normalized.slideSide == null
    && normalized.slideDistanceUd === 0
    && normalized.spentBudgetUd === 0
  ) {
    return null;
  }

  return normalized;
}

export function buildReplayCheckpointFromState(state, options = {}) {
  const chargePreview = state?.game?.chargePreview ?? null;
  const branchDistanceRoll = chargePreview?.branchDistanceRoll ?? null;
  const movementPreview = state?.game?.movement?.preview ?? null;
  const movementSegments = Array.isArray(movementPreview?.segments) ? movementPreview.segments : [];
  const lastPreviewSegment = movementSegments.length > 0 ? movementSegments[movementSegments.length - 1] : null;
  const totalDistanceUd = movementSegments.reduce((total, segment) => total + Number(segment?.distance?.resolvedUd ?? segment?.distanceUd ?? 0), 0);

  return {
    selectedUnitId: state?.game?.selectedUnitId ?? null,
    activePlayerId: state?.game?.commandContext?.activePlayerId ?? null,
    activeCorpsId: state?.game?.commandContext?.activeCorpsId ?? null,
    battlePhase: state?.game?.commandContext?.currentPhaseId ?? null,
    chargeStatus: chargePreview?.status ?? null,
    chargeIntentUnitId: chargePreview?.intent?.unitId ?? null,
    chargeTargetId: chargePreview?.intent?.targetUnitId ?? null,
    activeModalId: typeof options.getActiveModalId === 'function' ? options.getActiveModalId() : null,
    branchRollValue: Number.isFinite(branchDistanceRoll?.result?.rawRoll)
      ? branchDistanceRoll.result.rawRoll
      : (Number.isFinite(branchDistanceRoll?.result?.dieRoll) ? branchDistanceRoll.result.dieRoll : null),
    movement: {
      previewSegmentCount: movementSegments.length,
      totalDistanceUd: toRoundedNumber(totalDistanceUd),
      lastSegment: normalizeMovementSegment(lastPreviewSegment),
    },
    chargeStartManoeuvre: normalizeChargeStartManoeuvre(chargePreview?.intent?.startManoeuvre ?? null),
  };
}

export function normalizeReplayCheckpoint(checkpoint = null) {
  if (!checkpoint || typeof checkpoint !== 'object') {
    return null;
  }

  return {
    selectedUnitId: checkpoint.selectedUnitId ?? null,
    activePlayerId: checkpoint.activePlayerId ?? null,
    activeCorpsId: checkpoint.activeCorpsId ?? null,
    battlePhase: checkpoint.battlePhase ?? null,
    chargeStatus: checkpoint.chargeStatus ?? null,
    chargeIntentUnitId: checkpoint.chargeIntentUnitId ?? null,
    chargeTargetId: checkpoint.chargeTargetId ?? null,
    activeModalId: checkpoint.activeModalId ?? null,
    branchRollValue: Number.isFinite(checkpoint.branchRollValue) ? checkpoint.branchRollValue : null,
    movement: checkpoint.movement
      ? {
        previewSegmentCount: Number.isInteger(checkpoint.movement.previewSegmentCount)
          ? checkpoint.movement.previewSegmentCount
          : 0,
        totalDistanceUd: toRoundedNumber(checkpoint.movement.totalDistanceUd),
        lastSegment: normalizeMovementSegment(checkpoint.movement.lastSegment),
      }
      : null,
    chargeStartManoeuvre: normalizeChargeStartManoeuvre(checkpoint.chargeStartManoeuvre),
  };
}

function flattenCheckpoint(checkpoint) {
  const movement = checkpoint?.movement ?? null;
  const lastSegment = movement?.lastSegment ?? null;
  const chargeStartManoeuvre = checkpoint?.chargeStartManoeuvre ?? null;

  return {
    selectedUnitId: checkpoint?.selectedUnitId ?? null,
    activePlayerId: checkpoint?.activePlayerId ?? null,
    activeCorpsId: checkpoint?.activeCorpsId ?? null,
    battlePhase: checkpoint?.battlePhase ?? null,
    chargeStatus: checkpoint?.chargeStatus ?? null,
    chargeIntentUnitId: checkpoint?.chargeIntentUnitId ?? null,
    chargeTargetId: checkpoint?.chargeTargetId ?? null,
    activeModalId: checkpoint?.activeModalId ?? null,
    branchRollValue: checkpoint?.branchRollValue ?? null,
    'movement.previewSegmentCount': movement?.previewSegmentCount ?? null,
    'movement.totalDistanceUd': movement?.totalDistanceUd ?? null,
    'movement.lastSegment.commandId': lastSegment?.commandId ?? null,
    'movement.lastSegment.distanceUd': lastSegment?.distanceUd ?? null,
    'movement.lastSegment.angleRadians': lastSegment?.angleRadians ?? null,
    'movement.lastSegment.pivotSide': lastSegment?.pivotSide ?? null,
    'movement.lastSegment.side': lastSegment?.side ?? null,
    'chargeStartManoeuvre.type': chargeStartManoeuvre?.type ?? null,
    'chargeStartManoeuvre.pivotSide': chargeStartManoeuvre?.pivotSide ?? null,
    'chargeStartManoeuvre.wheelAngleRadians': chargeStartManoeuvre?.wheelAngleRadians ?? null,
    'chargeStartManoeuvre.slideSide': chargeStartManoeuvre?.slideSide ?? null,
    'chargeStartManoeuvre.slideDistanceUd': chargeStartManoeuvre?.slideDistanceUd ?? null,
    'chargeStartManoeuvre.spentBudgetUd': chargeStartManoeuvre?.spentBudgetUd ?? null,
  };
}

export function createReplayCheckpointHash(checkpoint = null) {
  const normalized = normalizeReplayCheckpoint(checkpoint);
  return JSON.stringify(normalized);
}

function classifyReplayDriftOwner(mismatchPaths = []) {
  if (mismatchPaths.some((path) => path === 'activeModalId')) {
    return 'ui-selector-hitbox';
  }

  if (mismatchPaths.some((path) => path.startsWith('movement.') || path.startsWith('chargeStartManoeuvre.'))) {
    return 'engine-movement-geometry';
  }

  if (mismatchPaths.some((path) => path === 'branchRollValue')) {
    return 'reducer-transition';
  }

  return 'reducer-transition';
}

export function compareReplayCheckpoints(expectedCheckpoint, actualCheckpoint) {
  const expected = normalizeReplayCheckpoint(expectedCheckpoint);
  const actual = normalizeReplayCheckpoint(actualCheckpoint);

  if (!expected) {
    return {
      ok: true,
      mismatches: [],
      expected,
      actual,
      expectedHash: createReplayCheckpointHash(expected),
      actualHash: createReplayCheckpointHash(actual),
      ownerClass: null,
    };
  }

  const flatExpected = flattenCheckpoint(expected);
  const flatActual = flattenCheckpoint(actual);
  const mismatches = Object.keys(flatExpected)
    .filter((path) => !isEquivalentCheckpointValue(path, flatExpected[path], flatActual[path]))
    .map((path) => ({
      path,
      expected: flatExpected[path],
      actual: flatActual[path],
    }));

  return {
    ok: mismatches.length === 0,
    mismatches,
    expected,
    actual,
    expectedHash: createReplayCheckpointHash(expected),
    actualHash: createReplayCheckpointHash(actual),
    ownerClass: mismatches.length > 0
      ? classifyReplayDriftOwner(mismatches.map((mismatch) => mismatch.path))
      : null,
  };
}

export function compareReplayActionOutcome(event, actualCheckpoint) {
  const payload = event?.action?.payload ?? {};

  if (
    event?.eventType === 'commit-movement-segment'
    || event?.eventType === 'confirm-movement'
  ) {
    return compareReplayCheckpoints(event.checkpoint ?? null, actualCheckpoint);
  }

  if (event?.postCheckpoint) {
    return compareReplayCheckpoints(event.postCheckpoint, actualCheckpoint);
  }

  if (event?.eventType === 'resolve-charge-branch-distance' && Number.isFinite(payload.dieRoll)) {
    const actual = normalizeReplayCheckpoint(actualCheckpoint);
    const expected = {
      branchRollValue: payload.dieRoll,
    };
    const mismatch = actual?.branchRollValue !== payload.dieRoll
      ? [{
        path: 'branchRollValue',
        expected: payload.dieRoll,
        actual: actual?.branchRollValue ?? null,
      }]
      : [];
    return {
      ok: mismatch.length === 0,
      mismatches: mismatch,
      expected,
      actual,
      expectedHash: JSON.stringify(expected),
      actualHash: createReplayCheckpointHash(actual),
      ownerClass: mismatch.length > 0 ? 'reducer-transition' : null,
    };
  }

  return {
    ok: true,
    mismatches: [],
    expected: null,
    actual: normalizeReplayCheckpoint(actualCheckpoint),
    expectedHash: createReplayCheckpointHash(null),
    actualHash: createReplayCheckpointHash(actualCheckpoint),
    ownerClass: null,
  };
}