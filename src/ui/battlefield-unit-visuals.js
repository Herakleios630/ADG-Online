import { getVisualProfileForUnit } from '../data/unit-profiles.js';

export function toUnitCssToken(unitId) {
  return String(unitId)
    .toLowerCase()
    .replaceAll(/[^a-z0-9_-]/g, '-');
}

export function toVisualCssToken(value) {
  return toUnitCssToken(value ?? '');
}

export function toCorpsSlotId(corpsId) {
  const raw = String(corpsId ?? '').toLowerCase();
  if (!raw) {
    return null;
  }

  const normalized = raw.replaceAll('_', '-');
  const match = normalized.match(/corps-(\d+)/);
  if (!match) {
    return null;
  }

  return `corps-${match[1]}`;
}

export function resolveRenderableVisualProfile(unit) {
  try {
    return getVisualProfileForUnit(unit ?? null);
  } catch {
    return null;
  }
}

export function renderUnitVisualLayer(visualProfile, options = {}) {
  if (!visualProfile) {
    return '';
  }

  const frontStatus = options?.frontStatus ?? '';
  const renderFamilyClass = `is-render-family-${toVisualCssToken(visualProfile.renderFamily)}`;
  const baseClass = `is-base-${toVisualCssToken(visualProfile.baseSilhouette)}`;
  const baseDepthClass = `is-base-depth-${toVisualCssToken(visualProfile.baseDepthHint)}`;
  const figureClass = `is-figures-${toVisualCssToken(visualProfile.figureSilhouette)}`;
  const accentClass = `is-accent-${toVisualCssToken(visualProfile.accentSlot)}`;
  const facingClass = `is-facing-${toVisualCssToken(visualProfile.facingMarker)}`;
  const figureMarkers = renderUnitVisualFigureMarkers(visualProfile);
  const bowMarker = visualProfile.figureSilhouette === 'horse-archers'
    ? '<span class="battlefield-unit-visual-bow-marker" aria-hidden="true"></span>'
    : '';
  const facingStatusAttribute = frontStatus ? ` data-front-status="${frontStatus}"` : '';

  return `<span class="battlefield-unit-visual ${renderFamilyClass} ${baseClass} ${baseDepthClass} ${figureClass} ${accentClass} ${facingClass}" aria-hidden="true"><span class="battlefield-unit-visual-base" aria-hidden="true"></span><span class="battlefield-unit-visual-figures" aria-hidden="true">${figureMarkers}</span><span class="battlefield-unit-visual-accent" aria-hidden="true"></span><span class="battlefield-unit-visual-facing" aria-hidden="true"${facingStatusAttribute}></span>${bowMarker}</span>`;
}

function renderUnitVisualFigureMarkers(visualProfile) {
  const figureCount = Math.max(0, Number(visualProfile?.figureCount ?? 0));
  if (figureCount === 0) {
    return '';
  }

  const figureFiles = Math.max(1, Number(visualProfile?.figureFiles ?? figureCount));
  const figureRanks = Math.max(1, Number(visualProfile?.figureRanks ?? Math.ceil(figureCount / figureFiles)));
  const markerShapeClass = `is-marker-${toVisualCssToken(visualProfile.figureMarkerShape)}`;
  const figureShapeClass = `is-figure-${toVisualCssToken(visualProfile.figureShapeHint)}`;
  const markers = [];

  for (let index = 0; index < figureCount; index += 1) {
    const rowIndex = Math.floor(index / figureFiles);
    const columnIndex = index % figureFiles;
    const markersInRow = rowIndex === figureRanks - 1
      ? Math.min(figureFiles, figureCount - (rowIndex * figureFiles))
      : figureFiles;
    const leftPercent = interpolateMarkerAxis(columnIndex, markersInRow, 16, 84);
    const topPercent = interpolateMarkerAxis(rowIndex, figureRanks, 18, 82);

    markers.push(`<span class="battlefield-unit-figure-marker ${markerShapeClass} ${figureShapeClass}" aria-hidden="true" data-figure-marker-index="${index}" style="left:${leftPercent}%;top:${topPercent}%"></span>`);
  }

  return markers.join('');
}

function interpolateMarkerAxis(index, count, startPercent, endPercent) {
  if (count <= 1) {
    return (startPercent + endPercent) / 2;
  }

  const progress = index / (count - 1);
  return startPercent + ((endPercent - startPercent) * progress);
}