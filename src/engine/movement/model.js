export const MOVEMENT_COMMAND_IDS = {
  ADVANCE: 'advance',
  WHEEL: 'wheel',
  SLIDE: 'slide',
};

export const MOVEMENT_PREVIEW_STATUSES = {
  IDLE: 'idle',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const MOVEMENT_CONFIRMATION_STATUSES = {
  IDLE: 'idle',
  READY: 'ready',
  BLOCKED: 'blocked',
};

export const MOVEMENT_SOURCE_STATUSES = {
  PLACEHOLDER: 'placeholder',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
  SOURCE_CHECKED: 'source-checked',
};

export const MOVEMENT_PIVOT_SIDES = {
  LEFT: 'left',
  RIGHT: 'right',
};

function normalizeCommandId(commandId) {
  return Object.values(MOVEMENT_COMMAND_IDS).includes(commandId)
    ? commandId
    : null;
}

function normalizeSourceStatus(sourceStatus) {
  return Object.values(MOVEMENT_SOURCE_STATUSES).includes(sourceStatus)
    ? sourceStatus
    : MOVEMENT_SOURCE_STATUSES.PLACEHOLDER;
}

function normalizePreviewStatus(status) {
  return Object.values(MOVEMENT_PREVIEW_STATUSES).includes(status)
    ? status
    : MOVEMENT_PREVIEW_STATUSES.IDLE;
}

function normalizeConfirmationStatus(status) {
  return Object.values(MOVEMENT_CONFIRMATION_STATUSES).includes(status)
    ? status
    : MOVEMENT_CONFIRMATION_STATUSES.IDLE;
}

function normalizePose(pose = {}) {
  return {
    xUd: Number.isFinite(pose.xUd) ? pose.xUd : 0,
    yUd: Number.isFinite(pose.yUd) ? pose.yUd : 0,
    rotationRadians: Number.isFinite(pose.rotationRadians) ? pose.rotationRadians : 0,
  };
}

function normalizeDistanceFacts(distance = {}) {
  return {
    requestedUd: Number.isFinite(distance.requestedUd) ? distance.requestedUd : 0,
    resolvedUd: Number.isFinite(distance.resolvedUd) ? distance.resolvedUd : 0,
    measurementMode: distance.measurementMode || 'placeholder',
  };
}

function normalizeDiagnostics(diagnostics = []) {
  if (!Array.isArray(diagnostics)) {
    return [];
  }

  return diagnostics.map((diagnostic, index) => ({
    id: diagnostic?.id || `diagnostic-${index + 1}`,
    severity: diagnostic?.severity || 'info',
    message: diagnostic?.message || '',
    sourceStatus: normalizeSourceStatus(diagnostic?.sourceStatus),
  }));
}

function normalizeManeuver(maneuver = {}) {
  return {
    pivotSide: Object.values(MOVEMENT_PIVOT_SIDES).includes(maneuver.pivotSide)
      ? maneuver.pivotSide
      : null,
    angleRadians: Number.isFinite(maneuver.angleRadians) ? maneuver.angleRadians : 0,
  };
}

export function createMovementSegment(segment = {}) {
  return {
    commandId: normalizeCommandId(segment.commandId),
    unitId: segment.unitId || null,
    startPose: normalizePose(segment.startPose),
    endPose: normalizePose(segment.endPose),
    maneuver: normalizeManeuver(segment.maneuver),
    distance: normalizeDistanceFacts(segment.distance),
    sourceStatus: normalizeSourceStatus(segment.sourceStatus),
    diagnostics: normalizeDiagnostics(segment.diagnostics),
  };
}

export function createMovementDraft(draft = {}) {
  return {
    commandId: normalizeCommandId(draft.commandId),
    unitId: draft.unitId || null,
    segments: Array.isArray(draft.segments)
      ? draft.segments.map((segment) => createMovementSegment(segment))
      : [],
    sourceStatus: normalizeSourceStatus(draft.sourceStatus),
  };
}

export function createMovementPreview(preview = {}) {
  return {
    status: normalizePreviewStatus(preview.status),
    segments: Array.isArray(preview.segments)
      ? preview.segments.map((segment) => createMovementSegment(segment))
      : [],
    explanations: Array.isArray(preview.explanations)
      ? preview.explanations.filter((explanation) => typeof explanation === 'string')
      : [],
    diagnostics: normalizeDiagnostics(preview.diagnostics),
    sourceStatus: normalizeSourceStatus(preview.sourceStatus),
  };
}

export function getCommittedMovementPreviewSegments(preview) {
  const normalizedPreview = createMovementPreview(preview);

  if (normalizedPreview.status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
    return normalizedPreview.segments;
  }

  if (normalizedPreview.status === MOVEMENT_PREVIEW_STATUSES.REJECTED) {
    return normalizedPreview.segments.slice(0, -1);
  }

  return [];
}

export function getLastCommittedMovementPreviewSegment(preview) {
  const committedSegments = getCommittedMovementPreviewSegments(preview);
  return committedSegments[committedSegments.length - 1] ?? null;
}

export function getMovementPreviewEndPose(preview, fallbackPose = {}) {
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(preview);
  return lastCommittedSegment
    ? normalizePose(lastCommittedSegment.endPose)
    : normalizePose(fallbackPose);
}

export function getMovementPreviewResolvedDistanceUd(preview) {
  return getCommittedMovementPreviewSegments(preview)
    .reduce((totalDistance, segment) => totalDistance + (segment.distance?.resolvedUd ?? 0), 0);
}

export function getMovementPreviewSpentBudgetUd(preview) {
  return getCommittedMovementPreviewSegments(preview)
    .reduce((totalDistance, segment) => totalDistance + (segment.commandId === MOVEMENT_COMMAND_IDS.SLIDE ? 0 : (segment.distance?.resolvedUd ?? 0)), 0);
}

export function getMovementPreviewAdvanceDistanceUd(preview) {
  return getCommittedMovementPreviewSegments(preview)
    .reduce((totalDistance, segment) => totalDistance + (segment.commandId === MOVEMENT_COMMAND_IDS.ADVANCE ? (segment.distance?.resolvedUd ?? 0) : 0), 0);
}

export function applyMovementPreview(unit, preview) {
  const normalizedPreview = createMovementPreview(preview);
  const lastCommittedSegment = getLastCommittedMovementPreviewSegment(normalizedPreview);

  if (!lastCommittedSegment || normalizedPreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
    return unit;
  }

  const endPose = getMovementPreviewEndPose(normalizedPreview, {
    xUd: unit.xUd,
    yUd: unit.yUd,
    rotationRadians: unit.rotationRadians ?? 0,
  });

  return {
    ...unit,
    xUd: endPose.xUd,
    yUd: endPose.yUd,
    rotationRadians: endPose.rotationRadians,
    advanceUsedUd: (unit.advanceUsedUd ?? 0) + getMovementPreviewSpentBudgetUd(normalizedPreview),
  };
}

export function createMovementConfirmation(confirmation = {}) {
  return {
    status: normalizeConfirmationStatus(confirmation.status),
    readyCommandId: normalizeCommandId(confirmation.readyCommandId),
  };
}