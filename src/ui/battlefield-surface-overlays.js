import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { getFacingBoundaries } from '../engine/geometry/index.js';
import { SETUP_STEP_DEFINITIONS } from '../state/p0-state.js';

export function formatRelationshipLabel(label) {
  switch (label) {
    case 'front':
      return 'Front';
    case 'flank':
      return 'Flanke';
    case 'leftFlank':
      return 'Linke Flanke';
    case 'rightFlank':
      return 'Rechte Flanke';
    case 'rear':
      return 'Ruecken';
    case 'boundary':
      return 'Grenze';
    case 'ambiguous':
      return 'Mehrdeutig';
    default:
      return 'Unklar';
  }
}

export function renderFacingGeometryOverlay(relationship) {
  const battlefieldProfile = getBattlefieldProfile(relationship.battlefieldProfileId);
  const boundaries = getFacingBoundaries(relationship.sourceGeometry, 40);

  return `
    <svg class="battlefield-overlay-layer battlefield-overlay-layer-facing" viewBox="0 0 ${battlefieldProfile.widthUd} ${battlefieldProfile.heightUd}" preserveAspectRatio="none" aria-hidden="true">
      <line class="battlefield-facing-line battlefield-facing-line-front" x1="${boundaries.frontBoundary.line.start.x}" y1="${boundaries.frontBoundary.line.start.y}" x2="${boundaries.frontBoundary.line.end.x}" y2="${boundaries.frontBoundary.line.end.y}"></line>
      <line class="battlefield-facing-line battlefield-facing-line-left" x1="${boundaries.leftFlankBoundary.line.start.x}" y1="${boundaries.leftFlankBoundary.line.start.y}" x2="${boundaries.leftFlankBoundary.line.end.x}" y2="${boundaries.leftFlankBoundary.line.end.y}"></line>
      <line class="battlefield-facing-line battlefield-facing-line-right" x1="${boundaries.rightFlankBoundary.line.start.x}" y1="${boundaries.rightFlankBoundary.line.start.y}" x2="${boundaries.rightFlankBoundary.line.end.x}" y2="${boundaries.rightFlankBoundary.line.end.y}"></line>
      <line class="battlefield-facing-line battlefield-facing-line-rear" x1="${boundaries.rearBoundary.line.start.x}" y1="${boundaries.rearBoundary.line.start.y}" x2="${boundaries.rearBoundary.line.end.x}" y2="${boundaries.rearBoundary.line.end.y}"></line>
    </svg>
  `;
}

export function renderSectorOverlay() {
  return `
    <div class="battlefield-overlay-layer battlefield-overlay-layer-sectors" aria-hidden="true">
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-left"></span>
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-right"></span>
      <span class="battlefield-sector-line battlefield-sector-line-horizontal"></span>
    </div>
  `;
}

export function renderDeploymentOverlay(state, battlefieldProfile) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const deploymentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'deployment');
  if (currentStepIndex !== -1 && currentStepIndex < deploymentStepIndex) {
    return '';
  }

  return `
    <div class="battlefield-overlay-layer battlefield-overlay-layer-deployment" aria-hidden="true">
      ${state.game.setup.deployment.zones.map((zone) => {
        const style = [
          `left:${(zone.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
          `top:${(zone.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
          `width:${(zone.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
          `height:${(zone.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
        ].join(';');
        const ownerClass = zone.owner === 'player-2' ? 'is-owner-two' : 'is-owner-one';

        return `
          <span class="battlefield-deployment-zone ${ownerClass}" style="${style}">
            <span class="battlefield-deployment-zone-label">${zone.label}</span>
          </span>
        `;
      }).join('')}
    </div>
  `;
}