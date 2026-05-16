import { getRotatedRectangleBounds } from '../geometry/index.js';

export const AMBUSH_MARKER_SOURCE_STATUSES = {
  PLACEHOLDER: 'placeholder',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export function createAmbushMarker(overrides = {}) {
  return {
    id: overrides.id ?? 'ambush-marker-1',
    owner: overrides.owner ?? 'player-1',
    label: overrides.label ?? 'Marker I',
    pose: {
      xUd: overrides.pose?.xUd ?? 6,
      yUd: overrides.pose?.yUd ?? 8,
    },
    footprint: {
      widthUd: overrides.footprint?.widthUd ?? 1.8,
      depthUd: overrides.footprint?.depthUd ?? 1.2,
      rotationRadians: overrides.footprint?.rotationRadians ?? 0,
    },
    lockState: overrides.lockState ?? 'draft',
    visibilityScope: overrides.visibilityScope ?? 'owner-private-contents',
    publicShell: {
      label: overrides.publicShell?.label ?? overrides.label ?? 'Marker I',
      visibility: overrides.publicShell?.visibility ?? 'public',
      sourceStatus: overrides.publicShell?.sourceStatus ?? AMBUSH_MARKER_SOURCE_STATUSES.PLACEHOLDER,
    },
    privateContents: {
      notes: overrides.privateContents?.notes ?? '',
      unitRefs: overrides.privateContents?.unitRefs ?? [],
    },
    fakeStatus: overrides.fakeStatus ?? 'unknown',
    revealState: overrides.revealState ?? 'hidden',
    sourceStatus: overrides.sourceStatus ?? AMBUSH_MARKER_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    sourceRefs: overrides.sourceRefs ?? ['hidden-info.reveal-trigger-set'],
  };
}

export function createInitialAmbushMarkersState() {
  return {
    owner: 'player-1',
    visibilityScope: 'owner-only',
    sourceStatus: AMBUSH_MARKER_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    selectedMarkerId: null,
    markers: [],
  };
}

export function createAmbushMarkerDraft(overrides = {}, existingCount = 0) {
  const romanLabel = ['I', 'II', 'III', 'IV', 'V'][existingCount] ?? String(existingCount + 1);

  return createAmbushMarker({
    id: overrides.id ?? `ambush-marker-${existingCount + 1}`,
    label: overrides.label ?? `Marker ${romanLabel}`,
    pose: overrides.pose ?? {
      xUd: 6 + Math.min(existingCount, 4) * 2.2,
      yUd: 6.5 + Math.min(existingCount, 3) * 1.3,
    },
    ...overrides,
  });
}

export function getAmbushMarkerFootprintBounds(marker) {
  return getRotatedRectangleBounds({
    center: { x: marker.pose.xUd, y: marker.pose.yUd },
    widthUd: marker.footprint.widthUd,
    depthUd: marker.footprint.depthUd,
    rotationRadians: marker.footprint.rotationRadians,
  });
}

export function isAmbushMarkerWithinBattlefield(marker, battlefieldProfile) {
  const bounds = getAmbushMarkerFootprintBounds(marker);
  return (
    bounds.minX >= 0
    && bounds.minY >= 0
    && bounds.maxX <= battlefieldProfile.widthUd
    && bounds.maxY <= battlefieldProfile.heightUd
  );
}

export function getPublicAmbushMarkerShell(marker) {
  return {
    id: marker.id,
    owner: marker.owner,
    label: marker.publicShell.label,
    pose: marker.pose,
    footprint: marker.footprint,
    visibility: marker.publicShell.visibility,
    sourceStatus: marker.publicShell.sourceStatus,
    revealState: marker.revealState,
  };
}