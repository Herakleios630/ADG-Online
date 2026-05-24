import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import {
  addVectors,
  classifyFacingRelationship,
  getAxesFromRotation,
  getFacingBoundaries,
  localPointToWorldPoint,
  scaleVector,
  worldPointToLocalPoint,
} from '../engine/geometry/index.js';
import { getCommittedMovementPreviewSegments, getMovementPreviewEndPose } from '../engine/movement/index.js';
import { getPublicAmbushMarkerShell } from '../engine/setup/ambush-markers.js';
import { BATTLE_PLAN_FIELD_IDS } from '../engine/setup/battle-plan.js';
import { projectSetupForViewer } from '../engine/visibility/setup-view.js';
import { TERRAIN_SHAPE_MODELS, TERRAIN_SOURCE_STATUSES } from '../engine/setup/terrain-placeholders.js';
import { SETUP_OBJECT_FAMILIES } from '../engine/setup/setup-objects.js';
import {
  canAttachCommanderToUnit,
  canStartCommanderAttach,
  getCommanderAttachRemainingUd,
  SETUP_STEP_DEFINITIONS,
} from '../state/p0-state.js';
import {
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES,
  CHARGE_PREVIEW_STATUSES,
  CHARGE_REACTION_REQUEST_TYPES,
  getEvadeStepIdPart,
} from '../engine/charge/index.js';
import { getAvailableCorpsForPlayer, ROUND_DIALOG_TYPES } from '../state/p0-round.js';
import {
  getEnemyZocBandLocalBounds,
  getUnitFootprintSamplePoints,
  ZOC_DEFAULT_FRONT_RANGE_UD,
} from '../engine/zoc/geometry.js';
import {
  getAdvancePreviewPresentation,
  getEvadeAvoidanceChoiceLabel,
  renderAdvanceCommandPanel,
} from './battlefield-command-panel.js';
import { renderBattlefieldRightPanel } from './battlefield-side-panel.js';

const TERRAIN_PALETTE_ENTRIES = [
  {
    type: 'hill',
    label: 'Hill',
    shapeModel: TERRAIN_SHAPE_MODELS.ELLIPSE,
    footprint: { widthUd: 4, depthUd: 3 },
  },
  {
    type: 'wood',
    label: 'Wood',
    shapeModel: TERRAIN_SHAPE_MODELS.ELLIPSE,
    footprint: { widthUd: 4, depthUd: 3 },
  },
  {
    type: 'field',
    label: 'Field',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 4, depthUd: 2.5 },
  },
  {
    type: 'road',
    label: 'Road',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 5, depthUd: 1 },
  },
  {
    type: 'river',
    label: 'River',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 5, depthUd: 1.2 },
  },
  {
    type: 'village',
    label: 'Village',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 3, depthUd: 2.5 },
  },
];

const SETUP_OBJECT_PALETTE_ENTRIES = [
  {
    family: SETUP_OBJECT_FAMILIES.FORTIFICATION,
    type: 'fortification',
    label: 'Fortification',
    footprint: { widthUd: 3, depthUd: 0.8 },
  },
  {
    family: SETUP_OBJECT_FAMILIES.OBSTACLE,
    type: 'obstacle',
    label: 'Obstacle',
    footprint: { widthUd: 2.8, depthUd: 1 },
  },
  {
    family: SETUP_OBJECT_FAMILIES.STAKES,
    type: 'stakes',
    label: 'Stakes',
    footprint: { widthUd: 2.4, depthUd: 0.7 },
  },
];

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function createWheelHandleStyle(point, battlefieldProfile) {
  return [
    `left:${(point.x / battlefieldProfile.widthUd) * 100}%`,
    `top:${(point.y / battlefieldProfile.heightUd) * 100}%`,
  ].join(';');
}

function createPreviewGhostStyle(pose, unit, battlefieldProfile) {
  return [
    `left:${(pose.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(pose.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(unit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(unit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--unit-rotation:${pose.rotationRadians}rad`,
  ].join(';');
}

function createLinearReachStyle(segment, unit, battlefieldProfile) {
  const forwardAxis = getAxesFromRotation(segment.rotationRadians ?? 0).forwardAxis;
  const reachCenter = addVectors(
    { x: segment.xUd, y: segment.yUd },
    scaleVector(forwardAxis, (unit.depthUd / 2) + (segment.distanceUd / 2)),
  );

  return [
    `left:${(reachCenter.x / battlefieldProfile.widthUd) * 100}%`,
    `top:${(reachCenter.y / battlefieldProfile.heightUd) * 100}%`,
    `width:${(unit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(segment.distanceUd / battlefieldProfile.heightUd) * 100}%`,
    `--advance-rotation:${segment.rotationRadians ?? 0}rad`,
  ].join(';');
}

function createEvadePlanSegment(evadePlan) {
  if (!evadePlan?.reorientedPose || !Number.isFinite(evadePlan?.distanceUd)) {
    return null;
  }

  return {
    xUd: evadePlan.reorientedPose.xUd,
    yUd: evadePlan.reorientedPose.yUd,
    rotationRadians: evadePlan.reorientedPose.rotationRadians ?? 0,
    distanceUd: evadePlan.distanceUd,
  };
}

function createChargeMovementPlanSegment(chargeMovementPlan) {
  if (!chargeMovementPlan?.startPose || !Number.isFinite(chargeMovementPlan?.distanceUd)) {
    return null;
  }

  return {
    xUd: chargeMovementPlan.startPose.xUd,
    yUd: chargeMovementPlan.startPose.yUd,
    rotationRadians: chargeMovementPlan.frozenDirectionRadians ?? chargeMovementPlan.startPose.rotationRadians ?? 0,
    distanceUd: chargeMovementPlan.distanceUd,
  };
}

function getLinearSegmentEndPose(segment) {
  const forwardAxis = getAxesFromRotation(segment.rotationRadians ?? 0).forwardAxis;

  return {
    xUd: segment.xUd + (forwardAxis.x * (segment.distanceUd ?? 0)),
    yUd: segment.yUd + (forwardAxis.y * (segment.distanceUd ?? 0)),
    rotationRadians: segment.rotationRadians ?? 0,
  };
}

function getEvadeCandidateBadgeLabel(candidate) {
  if ((candidate?.avoidanceSteps?.length ?? 0) > 1) {
    return 'Path';
  }

  switch (candidate?.type) {
    case 'direction-wheel':
      return 'Wheel';
    case 'obstacle-wheel':
      return 'Obs';
    case 'straight':
      return 'Straight';
    default:
      return 'Slide';
  }
}

function getEvadeHandleBadgeLabel(step) {
  if (!step) {
    return 'Go';
  }

  switch (step.type) {
    case 'direction-wheel':
      return step.pivotSide === 'left' ? 'WL' : 'WR';
    case 'obstacle-wheel':
      return step.pivotSide === 'left' ? 'OL' : 'OR';
    case 'slide':
      return step.side === 'left' ? 'SL' : 'SR';
    case 'straight':
      return 'Go';
    default:
      return 'Go';
  }
}

function getEvadeCandidateAvoidanceSteps(candidate) {
  if (Array.isArray(candidate?.avoidanceSteps) && candidate.avoidanceSteps.length > 0) {
    return candidate.avoidanceSteps;
  }

  if (candidate?.type === 'straight') {
    return [];
  }

  return candidate ? [candidate] : [];
}

function doesEvadeCandidateMatchChoicePath(candidate, choicePathStepIds = []) {
  if (!Array.isArray(choicePathStepIds) || choicePathStepIds.length === 0) {
    return true;
  }

  const steps = getEvadeCandidateAvoidanceSteps(candidate);
  if (steps.length < choicePathStepIds.length) {
    return false;
  }

  return choicePathStepIds.every((stepId, index) => getEvadeStepIdPart(steps[index]) === stepId);
}

function getEvadeChoiceTree({ evadeAvoidanceCandidates = [], choicePathStepIds = [] }) {
  const matchingCandidates = evadeAvoidanceCandidates.filter((candidate) => doesEvadeCandidateMatchChoicePath(candidate, choicePathStepIds));
  const frontierNodes = [];
  const frontierNodeIds = new Set();

  matchingCandidates.forEach((candidate) => {
    const steps = getEvadeCandidateAvoidanceSteps(candidate);
    const nextStep = steps[choicePathStepIds.length] ?? null;
    const nextStepId = getEvadeStepIdPart(nextStep);
    if (!nextStepId || frontierNodeIds.has(nextStepId)) {
      return;
    }

    frontierNodeIds.add(nextStepId);
    frontierNodes.push({
      stepId: nextStepId,
      depth: choicePathStepIds.length,
      step: nextStep,
      candidate,
    });
  });

  return {
    frontierNodes,
    visibleCandidates: choicePathStepIds.length > 0 ? matchingCandidates : evadeAvoidanceCandidates,
  };
}

function getEvadeChoiceHandleAnchorPoint({ sourcePose, evadePlanUnit, step }) {
  if (!sourcePose || !evadePlanUnit || !step) {
    return null;
  }

  const handleOffsetUd = Math.max(evadePlanUnit.widthUd ?? 1, evadePlanUnit.depthUd ?? 1) * 0.55;
  let localPoint = { x: 0, y: (Number(evadePlanUnit.depthUd ?? 1) / 2) + handleOffsetUd };

  if (step.type === 'slide') {
    localPoint = {
      x: (step.side === 'left' ? -1 : 1) * ((Number(evadePlanUnit.widthUd ?? 1) / 2) + handleOffsetUd),
      y: 0,
    };
  } else if (step.type === 'direction-wheel' || step.type === 'obstacle-wheel') {
    localPoint = {
      x: (step.pivotSide === 'left' ? -1 : 1) * ((Number(evadePlanUnit.widthUd ?? 1) / 2) + handleOffsetUd),
      y: (Number(evadePlanUnit.depthUd ?? 1) / 2) + (handleOffsetUd * 0.55),
    };
  }

  return localPointToWorldPoint({
    center: { x: sourcePose.xUd, y: sourcePose.yUd },
    widthUd: evadePlanUnit.widthUd,
    depthUd: evadePlanUnit.depthUd,
    rotationRadians: sourcePose.rotationRadians ?? 0,
  }, localPoint);
}

function renderEvadeChoiceHandles({
  frontierNodes = [],
  evadePlan,
  evadePlanUnit,
  battlefieldProfile,
}) {
  if (!evadePlanUnit || !evadePlan?.reorientedPose || !Array.isArray(frontierNodes) || frontierNodes.length === 0) {
    return '';
  }

  return frontierNodes
    .filter((node) => node?.stepId && node?.step)
    .map((node) => {
      const steps = getEvadeCandidateAvoidanceSteps(node.candidate);
      const sourcePose = node.depth > 0
        ? (steps[node.depth - 1]?.endPose ?? null)
        : evadePlan.reorientedPose;
      const handlePoint = getEvadeChoiceHandleAnchorPoint({
        sourcePose,
        evadePlanUnit,
        step: node.step,
      });
      if (!Number.isFinite(handlePoint.x) || !Number.isFinite(handlePoint.y)) {
        return '';
      }

      return `
        <button
          class="battlefield-evade-branch-handle"
          type="button"
          data-action="preview-evade-avoidance-node"
          data-evade-candidate-handle
          data-evade-handle-kind="${node.step?.type ?? 'straight'}"
          data-step-id="${node.stepId}"
          data-evade-node-depth="${node.depth}"
          aria-label="${escapeHtml(getEvadeAvoidanceChoiceLabel(node.candidate))}"
          title="${escapeHtml(getEvadeAvoidanceChoiceLabel(node.candidate))}"
          style="${createWheelHandleStyle(handlePoint, battlefieldProfile)}"
        >
          <span>${escapeHtml(getEvadeHandleBadgeLabel(node.step))}</span>
        </button>
      `;
    })
    .join('');
}

function renderEvadeChoiceTrails({
  evadeAvoidanceCandidates = [],
  evadePlanUnit,
  battlefieldProfile,
}) {
  if (!evadePlanUnit || !Array.isArray(evadeAvoidanceCandidates) || evadeAvoidanceCandidates.length === 0) {
    return '';
  }

  return evadeAvoidanceCandidates
    .filter((candidate) => candidate?.id && Array.isArray(candidate?.avoidanceSteps) && candidate.avoidanceSteps.length > 0)
    .map((candidate) => candidate.avoidanceSteps
      .filter((step) => step?.endPose)
      .map((step, index) => `
        <div
          class="battlefield-unit-preview battlefield-evade-choice-trail ${evadePlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} is-trail"
          aria-hidden="true"
          data-evade-candidate-trail
          data-candidate-id="${candidate.id ?? ''}"
          data-evade-step-index="${index}"
          style="${createPreviewGhostStyle(step.endPose, evadePlanUnit, battlefieldProfile)}"
        ></div>
      `).join(''))
    .join('');
}

function renderEvadeChoiceGhosts({
  evadeAvoidanceCandidates = [],
  evadePlanUnit,
  battlefieldProfile,
}) {
  if (!evadePlanUnit || !Array.isArray(evadeAvoidanceCandidates) || evadeAvoidanceCandidates.length === 0) {
    return '';
  }

  return `
    ${renderEvadeChoiceTrails({
      evadeAvoidanceCandidates,
      evadePlanUnit,
      battlefieldProfile,
    })}
    ${evadeAvoidanceCandidates
    .filter((candidate) => candidate?.id && candidate?.endPose)
    .map((candidate) => `
      <button
        class="battlefield-evade-choice-button"
        type="button"
        data-action="select-evade-avoidance-choice"
        data-evade-candidate-ghost
        data-evade-candidate-type="${candidate.type ?? 'slide'}"
        data-candidate-id="${candidate.id ?? ''}"
        data-side="${candidate.side ?? ''}"
        data-distance-ud="${candidate.distanceUd ?? candidate.spentDistanceUd ?? 0}"
        aria-label="${escapeHtml(getEvadeAvoidanceChoiceLabel(candidate))}"
        title="${escapeHtml(getEvadeAvoidanceChoiceLabel(candidate))}"
        style="${createPreviewGhostStyle(candidate.endPose, evadePlanUnit, battlefieldProfile)}"
      >
        <span class="battlefield-evade-choice-badge">${escapeHtml(getEvadeCandidateBadgeLabel(candidate))}</span>
      </button>
    `)
    .join('')}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function getRollPipPattern(value) {
  const patterns = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return patterns[value] ?? [];
}

function renderRollPips(value) {
  const activePips = new Set(getRollPipPattern(value));

  return `
    <span class="battlefield-command-roll-pips" aria-hidden="true">
      ${Array.from({ length: 9 }, (_, index) => `
        <span class="battlefield-command-roll-pip ${activePips.has(index) ? 'is-filled' : ''}"></span>
      `).join('')}
    </span>
  `;
}

function formatRelationshipLabel(label) {
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

function renderFacingGeometryOverlay(relationship) {
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

function renderSectorOverlay() {
  return `
    <div class="battlefield-overlay-layer battlefield-overlay-layer-sectors" aria-hidden="true">
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-left"></span>
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-right"></span>
      <span class="battlefield-sector-line battlefield-sector-line-horizontal"></span>
    </div>
  `;
}

function renderDeploymentOverlay(state, battlefieldProfile) {
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

function renderTerrainPalette(state) {
  const currentStepId = state.game.setup.currentStepId;
  const isTerrainStep = currentStepId === 'terrain' || currentStepId === 'terrain-adjustment';
  if (!isTerrainStep) {
    return '';
  }

  const selectedPlaceholder = state.game.setup.terrain.placeholders.find(
    (placeholder) => placeholder.id === state.game.setup.terrain.selectedPlaceholderId,
  ) || null;

  return `
    <div class="battlefield-placeholder-card battlefield-terrain-palette-card">
      <strong>Terrain Palette</strong>
      <span class="muted-copy">P3-05 nutzt bewusst sichtbare Placeholder mit echten Footprints. Offizielle Terrain-Regeln folgen spaeter.</span>
      <div class="battlefield-terrain-palette-grid">
        ${TERRAIN_PALETTE_ENTRIES.map((entry) => `
          <button
            class="shell-button battlefield-terrain-palette-button"
            type="button"
            data-action="add-terrain-placeholder"
            data-terrain-type="${entry.type}"
            data-terrain-label="${entry.label}"
            data-terrain-shape="${entry.shapeModel}"
            data-terrain-width-ud="${entry.footprint.widthUd}"
            data-terrain-depth-ud="${entry.footprint.depthUd}"
          >${entry.label}</button>
        `).join('')}
      </div>
      ${selectedPlaceholder ? `
        <div class="battlefield-terrain-selection-meta">
          <span><strong>Auswahl:</strong> ${selectedPlaceholder.label}</span>
          <span>Footprint: ${formatLengthUd(selectedPlaceholder.footprint.widthUd)} UD x ${formatLengthUd(selectedPlaceholder.footprint.depthUd)} UD</span>
          <span>Status: ${selectedPlaceholder.sourceStatus === TERRAIN_SOURCE_STATUSES.PLACEHOLDER ? 'placeholder' : selectedPlaceholder.sourceStatus}</span>
        </div>
      ` : `
        <span class="muted-copy">Noch kein Terrain-Placeholder ausgewaehlt.</span>
      `}
    </div>
  `;
}

function renderSetupObjectPalette(state) {
  if (state.game.setup.currentStepId !== 'camps') {
    return '';
  }

  const selectedSetupObject = state.game.setup.setupObjects.placeholders.find(
    (setupObject) => setupObject.id === state.game.setup.setupObjects.selectedObjectId,
  ) || null;

  return `
    <div class="battlefield-placeholder-card battlefield-setup-object-card">
      <strong>Camps And Setup Objects</strong>
      <span class="muted-copy">Standard-200 startet mit zwei Pflicht-Camps. Weitere Setup-Objekte bleiben in P3 sichtbare Placeholder ohne offizielle Legalitaetsbehauptung.</span>
      <div class="battlefield-setup-object-meta-grid">
        ${state.game.setup.setupObjects.placeholders
          .filter((setupObject) => setupObject.family === SETUP_OBJECT_FAMILIES.CAMP)
          .map((setupObject) => `<span>${setupObject.label}: ${setupObject.owner}</span>`).join('')}
      </div>
      <div class="battlefield-terrain-palette-grid">
        ${SETUP_OBJECT_PALETTE_ENTRIES.map((entry) => `
          <button
            class="shell-button battlefield-terrain-palette-button"
            type="button"
            data-action="add-setup-object"
            data-setup-object-family="${entry.family}"
            data-setup-object-type="${entry.type}"
            data-setup-object-label="${entry.label}"
            data-setup-object-width-ud="${entry.footprint.widthUd}"
            data-setup-object-depth-ud="${entry.footprint.depthUd}"
          >${entry.label}</button>
        `).join('')}
      </div>
      ${selectedSetupObject ? `
        <div class="battlefield-terrain-selection-meta">
          <span><strong>Auswahl:</strong> ${selectedSetupObject.label}</span>
          <span>Owner: ${selectedSetupObject.owner}</span>
          <span>Footprint: ${formatLengthUd(selectedSetupObject.footprint.widthUd)} UD x ${formatLengthUd(selectedSetupObject.footprint.depthUd)} UD</span>
        </div>
      ` : `
        <span class="muted-copy">Noch kein Setup-Objekt ausgewaehlt.</span>
      `}
    </div>
  `;
}

function renderBattlePlanBoard(state) {
  if (state.game.setup.currentStepId !== 'battle-plan') {
    return '';
  }

  const battlePlan = state.game.setup.battlePlan;
  if (battlePlan.isRedacted) {
    return `
      <div class="battlefield-placeholder-card battlefield-battle-plan-card">
        <div class="battlefield-battle-plan-header">
          <strong>Battle Plan Board</strong>
          <span class="battlefield-validation-badge is-info">hidden</span>
        </div>
        <span class="muted-copy">${battlePlan.redactedMessage}</span>
      </div>
    `;
  }

  const fieldLabels = {
    [BATTLE_PLAN_FIELD_IDS.LEFT]: 'Left',
    [BATTLE_PLAN_FIELD_IDS.CENTER]: 'Center',
    [BATTLE_PLAN_FIELD_IDS.RIGHT]: 'Right',
    [BATTLE_PLAN_FIELD_IDS.FLANK_MARCH]: 'Flank March',
  };

  return `
    <div class="battlefield-placeholder-card battlefield-battle-plan-card">
      <div class="battlefield-battle-plan-header">
        <strong>Battle Plan Board</strong>
        <span class="battlefield-validation-badge is-info">owner-only</span>
      </div>
      <span class="muted-copy">Diese vier Felder sind private Battle-Plan-Zuordnungen, keine Battlefield-Sektoren. Effekte und Timing bleiben source-blocked.</span>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Owner:</strong> ${battlePlan.owner}</span>
        <span>Visibility: ${battlePlan.visibilityScope}</span>
        <span>Source: ${battlePlan.sourceStatus}</span>
      </div>
      <div class="battlefield-battle-plan-corps-grid">
        ${battlePlan.corpsCards.map((corpsCard) => `
          <button
            class="battlefield-battle-plan-corps-card ${battlePlan.selectedCorpsId === corpsCard.id ? 'is-selected' : ''}"
            type="button"
            data-action="select-battle-plan-corps"
            data-corps-id="${corpsCard.id}"
          >
            <strong>${corpsCard.label}</strong>
            <span>${corpsCard.assignmentFieldId ? `Aktuell: ${fieldLabels[corpsCard.assignmentFieldId]}` : 'Noch nicht zugeordnet'}</span>
          </button>
        `).join('')}
      </div>
      <div class="battlefield-battle-plan-fields-grid">
        ${Object.values(BATTLE_PLAN_FIELD_IDS).map((fieldId) => `
          <button
            class="battlefield-battle-plan-field"
            type="button"
            data-action="assign-battle-plan-corps"
            data-field-id="${fieldId}"
            ${battlePlan.selectedCorpsId ? '' : 'disabled'}
          >
            <span class="battlefield-battle-plan-field-title">${fieldLabels[fieldId]}</span>
            <span class="battlefield-battle-plan-field-meta">${battlePlan.fieldAssignments[fieldId].length ? battlePlan.fieldAssignments[fieldId].map((corpsId) => battlePlan.corpsCards.find((corpsCard) => corpsCard.id === corpsId)?.label ?? corpsId).join(', ') : 'Noch leer'}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAmbushMarkersPanel(state) {
  if (state.game.setup.currentStepId !== 'ambushes') {
    return '';
  }

  const ambushMarkers = state.game.setup.ambushMarkers;
  if (ambushMarkers.isRedacted) {
    return `
      <div class="battlefield-placeholder-card battlefield-ambush-card">
        <div class="battlefield-battle-plan-header">
          <strong>Ambush Markers</strong>
          <span class="battlefield-validation-badge is-info">hidden</span>
        </div>
        <span class="muted-copy">${ambushMarkers.redactedMessage}</span>
        <span class="muted-copy">Oeffentliche Marker-Shells bleiben auf dem Battlefield sichtbar, private Inhalte nicht.</span>
      </div>
    `;
  }

  const selectedMarker = ambushMarkers.markers.find((marker) => marker.id === ambushMarkers.selectedMarkerId) || null;

  return `
    <div class="battlefield-placeholder-card battlefield-ambush-card">
      <div class="battlefield-battle-plan-header">
        <strong>Ambush Markers</strong>
        <span class="battlefield-validation-badge is-info">private contents</span>
      </div>
      <span class="muted-copy">P3-09 trennt oeffentliche Marker-Shells von owner-only Inhalten. Exakte Marker-Anzahl, Fake-Truth und Reveal-Timing bleiben source-blocked.</span>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Owner:</strong> ${ambushMarkers.owner}</span>
        <span>Visibility: ${ambushMarkers.visibilityScope}</span>
        <span>Source: ${ambushMarkers.sourceStatus}</span>
      </div>
      <div class="battlefield-inline-actions battlefield-ambush-actions">
        <button class="shell-button battlefield-terrain-palette-button" type="button" data-action="add-ambush-marker">Marker hinzufuegen</button>
      </div>
      <div class="battlefield-battle-plan-corps-grid">
        ${ambushMarkers.markers.map((marker) => `
          <button
            class="battlefield-battle-plan-corps-card ${ambushMarkers.selectedMarkerId === marker.id ? 'is-selected' : ''}"
            type="button"
            data-action="select-ambush-marker"
            data-marker-id="${marker.id}"
          >
            <strong>${marker.label}</strong>
            <span>${marker.privateContents.notes ? 'Private Inhalte eingetragen' : 'Noch keine privaten Inhalte'}</span>
          </button>
        `).join('')}
      </div>
      ${ambushMarkers.markers.length === 0 ? `
        <span class="muted-copy">Ambush marker sind optional. Fuege nur dann einen Marker hinzu, wenn du fuer diesen Placeholder-Schritt tatsaechlich einen brauchst.</span>
      ` : ''}
      ${selectedMarker ? `
        <label class="battlefield-ambush-editor" for="ambush-marker-notes">
          <span class="battlefield-battle-plan-field-title">Owner-private contents</span>
          <textarea
            id="ambush-marker-notes"
            class="battlefield-ambush-textarea"
            data-action="edit-ambush-notes"
            data-marker-id="${selectedMarker.id}"
            placeholder="Bis der Army Designer existiert: freie Notizen zu Einheiten oder Gruppen im Marker."
          >${escapeHtml(selectedMarker.privateContents.notes)}</textarea>
        </label>
      ` : `
        <span class="muted-copy">Fuege einen Marker hinzu oder waehle einen vorhandenen Marker, um private Inhalte zu pflegen. Auf dem Battlefield bleibt nur die oeffentliche Shell sichtbar.</span>
      `}
    </div>
  `;
}

function renderDeploymentSetupCard(state) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const deploymentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'deployment');
  if (currentStepIndex !== -1 && currentStepIndex < deploymentStepIndex) {
    return '';
  }

  const selectedPlaceholder = state.game.setup.deployment.visiblePlaceholders.find(
    (placeholder) => placeholder.unitId === state.game.selectedUnitId,
  ) || null;

  return `
    <details class="battlefield-collapsible-card battlefield-placeholder-card battlefield-deployment-card">
      <summary class="battlefield-collapsible-summary">
        <strong>Deployment Foundation</strong>
        <span>${state.game.setup.deployment.visiblePlaceholders.length} Placeholder</span>
      </summary>
      <div class="battlefield-collapsible-body">
        <span class="muted-copy">P3-11 zeigt explizite Placeholder-Zonen und sichtbare Deployment-Objekte. Das ist bewusst kein offizieller Deployment-Validator.</span>
        <div class="battlefield-battle-plan-owner-meta">
          <span><strong>Zonen:</strong> ${state.game.setup.deployment.zones.length}</span>
          <span>Visible placeholders: ${state.game.setup.deployment.visiblePlaceholders.length}</span>
          <span>Source: ${state.game.setup.deployment.sourceStatus}</span>
        </div>
        ${state.game.setup.deployment.overlapPairs.length ? `
          <span class="battlefield-validation-badge is-error">Overlap placeholder detected</span>
        ` : `
          <span class="battlefield-validation-badge is-valid">No placeholder overlap</span>
        `}
        ${selectedPlaceholder ? `
          <div class="battlefield-terrain-selection-meta">
            <span><strong>Auswahl:</strong> ${selectedPlaceholder.unitId}</span>
            <span>Owner: ${selectedPlaceholder.owner}</span>
            <span>Corps: ${selectedPlaceholder.corpsId}</span>
            <span>Footprint: ${formatLengthUd(selectedPlaceholder.footprint.widthUd)} UD x ${formatLengthUd(selectedPlaceholder.footprint.depthUd)} UD</span>
          </div>
        ` : `
          <span class="muted-copy">Waehle im Deployment-Schritt einen sichtbaren Unit-Placeholder aus, um seine Setup-Metadaten zu sehen.</span>
        `}
      </div>
    </details>
  `;
}

function renderZocBands(units, selectedUnit, battlefieldProfile, options = {}) {
  if (!selectedUnit) {
    return '';
  }

  const showAllEnemyZoc = Boolean(options.showAllEnemyZoc);

  return units
    .filter((unit) => unit.owner !== selectedUnit.owner)
    .filter((enemy) => {
      if (showAllEnemyZoc) {
        return true;
      }

      // Only show band when selected unit is within 0.5 UD of the ZOC near edge.
      // Threshold = enemy front half-depth + ZOC range + selected unit half-depth + 0.5 UD.
      const threshold =
        enemy.depthUd / 2 +
        ZOC_DEFAULT_FRONT_RANGE_UD +
        selectedUnit.depthUd / 2 +
        0.5;
      const dx = selectedUnit.xUd - enemy.xUd;
      const dy = selectedUnit.yUd - enemy.yUd;
      return Math.sqrt(dx * dx + dy * dy) <= threshold;
    })
    .map((enemy) => {
      const rangeUd = ZOC_DEFAULT_FRONT_RANGE_UD;
      const rot = enemy.rotationRadians ?? 0;
      // Game forward axis: rotateVector({0,-1}, θ) = {sin(θ), -cos(θ)}
      const fwdX = Math.sin(rot);
      const fwdY = -Math.cos(rot);
      // ZOC band center is halfDepth + rangeUd/2 along the forward axis from the unit center
      const halfDepth = enemy.depthUd / 2;
      const distAlongForward = halfDepth + rangeUd / 2;
      const worldCenterX = enemy.xUd + fwdX * distAlongForward;
      const worldCenterY = enemy.yUd + fwdY * distAlongForward;
      const style = [
        `left:${(worldCenterX / battlefieldProfile.widthUd) * 100}%`,
        `top:${(worldCenterY / battlefieldProfile.heightUd) * 100}%`,
        `width:${(enemy.widthUd / battlefieldProfile.widthUd) * 100}%`,
        `height:${(rangeUd / battlefieldProfile.heightUd) * 100}%`,
        `--zoc-rotation:${rot}rad`,
      ].join(';');

      return `<div class="battlefield-zoc-band" aria-hidden="true" data-enemy-id="${enemy.id}" style="${style}"></div>`;
    })
    .join('');
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isLocalPointInZocBand(localPoint, localBounds) {
  return localPoint.x >= localBounds.minX
    && localPoint.x <= localBounds.maxX
    && localPoint.y >= localBounds.minY
    && localPoint.y <= localBounds.maxY;
}

function getLocalPointDistanceToZocBand(localPoint, localBounds) {
  const closestX = clampNumber(localPoint.x, localBounds.minX, localBounds.maxX);
  const closestY = clampNumber(localPoint.y, localBounds.minY, localBounds.maxY);
  const dx = localPoint.x - closestX;
  const dy = localPoint.y - closestY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getNearZocContacts(units, referenceUnit, thresholdUd = 0.5) {
  if (!referenceUnit) {
    return [];
  }

  return units
    .filter((enemy) => enemy.owner !== referenceUnit.owner)
    .map((enemy) => {
      const zone = getEnemyZocBandLocalBounds(enemy, { rangeUd: ZOC_DEFAULT_FRONT_RANGE_UD });
      const localPoints = getUnitFootprintSamplePoints(referenceUnit).map((sample) => {
        const localPoint = worldPointToLocalPoint(
          {
            center: { x: enemy.xUd, y: enemy.yUd },
            widthUd: enemy.widthUd,
            depthUd: enemy.depthUd,
            rotationRadians: enemy.rotationRadians ?? 0,
          },
          sample.point,
        );

        return {
          localPoint,
          inBand: isLocalPointInZocBand(localPoint, zone.localBounds),
          distanceUd: getLocalPointDistanceToZocBand(localPoint, zone.localBounds),
        };
      });

      if (localPoints.some((point) => point.inBand)) {
        return null;
      }

      const nearestDistanceUd = Math.min(...localPoints.map((point) => point.distanceUd));
      return nearestDistanceUd > 0 && nearestDistanceUd <= thresholdUd
        ? {
            enemyId: enemy.id,
            nearestDistanceUd,
          }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.nearestDistanceUd - right.nearestDistanceUd);
}

function renderNearZocCue(units, referenceUnit, battlefieldProfile, thresholdUd = 0.5) {
  if (!referenceUnit) {
    return '';
  }

  const nearContacts = getNearZocContacts(units, referenceUnit, thresholdUd);
  if (nearContacts.length === 0) {
    return '';
  }

  const nearest = nearContacts[0];
  const style = [
    `left:${(referenceUnit.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(referenceUnit.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(referenceUnit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(referenceUnit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--near-zoc-rotation:${referenceUnit.rotationRadians ?? 0}rad`,
  ].join(';');

  return `<div class="battlefield-zoc-near-cue" aria-hidden="true" data-near-zoc-enemy="${nearest.enemyId}" style="${style}"></div>`;
}

function createMovementReferenceUnit(selectedUnit, movementPreview, commanderFreeMovePreview) {
  if (!selectedUnit) {
    return null;
  }

  if (
    commanderFreeMovePreview?.status === 'ready'
    && commanderFreeMovePreview.unitId === selectedUnit.id
    && Number.isFinite(commanderFreeMovePreview.xUd)
    && Number.isFinite(commanderFreeMovePreview.yUd)
  ) {
    return {
      ...selectedUnit,
      xUd: commanderFreeMovePreview.xUd,
      yUd: commanderFreeMovePreview.yUd,
    };
  }

  if (movementPreview?.status !== 'accepted' || !Array.isArray(movementPreview.segments) || movementPreview.segments.length === 0) {
    return selectedUnit;
  }

  const endPose = getMovementPreviewEndPose(movementPreview, {
    xUd: selectedUnit.xUd,
    yUd: selectedUnit.yUd,
    rotationRadians: selectedUnit.rotationRadians ?? 0,
  });

  return {
    ...selectedUnit,
    xUd: endPose.xUd,
    yUd: endPose.yUd,
    rotationRadians: endPose.rotationRadians,
  };
}

function renderMostThreateningLine(units, referenceUnit, validationSnapshot, battlefieldProfile) {
  if (!referenceUnit || !validationSnapshot?.zoc?.mostThreateningEnemyId) {
    return '';
  }

  const threatEnemy = units.find((unit) => unit.id === validationSnapshot.zoc.mostThreateningEnemyId) || null;
  if (!threatEnemy) {
    return '';
  }

  const dx = threatEnemy.xUd - referenceUnit.xUd;
  const dy = threatEnemy.yUd - referenceUnit.yUd;
  const lengthUd = Math.sqrt(dx * dx + dy * dy);
  if (lengthUd <= 0) {
    return '';
  }

  const centerX = (referenceUnit.xUd + threatEnemy.xUd) / 2;
  const centerY = (referenceUnit.yUd + threatEnemy.yUd) / 2;
  const angleRadians = Math.atan2(dy, dx);

  const style = [
    `left:${(centerX / battlefieldProfile.widthUd) * 100}%`,
    `top:${(centerY / battlefieldProfile.heightUd) * 100}%`,
    `width:${(lengthUd / battlefieldProfile.widthUd) * 100}%`,
    `--threat-line-rotation:${angleRadians}rad`,
  ].join(';');

  return `<div class="battlefield-zoc-threat-line" aria-hidden="true" data-enemy-id="${threatEnemy.id}" style="${style}"></div>`;
}

function renderCommandStatusLine(state, referenceUnit, battlefieldProfile) {
  if (state.game.setup.isActive || !referenceUnit) {
    return '';
  }

  const commanderId = state.game.commandContext.commander?.unitId ?? null;
  if (!commanderId || commanderId === referenceUnit.id) {
    return '';
  }

  const commanderUnit = state.game.units.find((unit) => unit.id === commanderId) ?? null;
  if (!commanderUnit) {
    return '';
  }

  const commandStatus = state.game.movement.orderCommandSnapshot?.unitId === referenceUnit.id
    ? state.game.movement.orderCommandSnapshot.status
    : state.game.commandContext.inCommand?.status;

  if (commandStatus !== 'in-command' && commandStatus !== 'out-of-command') {
    return '';
  }

  const dx = commanderUnit.xUd - referenceUnit.xUd;
  const dy = commanderUnit.yUd - referenceUnit.yUd;
  const lengthUd = Math.sqrt(dx * dx + dy * dy);
  if (lengthUd <= 0) {
    return '';
  }

  const centerX = (referenceUnit.xUd + commanderUnit.xUd) / 2;
  const centerY = (referenceUnit.yUd + commanderUnit.yUd) / 2;
  const angleRadians = Math.atan2(dy, dx);
  const style = [
    `left:${(centerX / battlefieldProfile.widthUd) * 100}%`,
    `top:${(centerY / battlefieldProfile.heightUd) * 100}%`,
    `width:${(lengthUd / battlefieldProfile.widthUd) * 100}%`,
    `--command-link-rotation:${angleRadians}rad`,
  ].join(';');

  return `
    <div
      class="battlefield-command-link ${commandStatus === 'in-command' ? 'is-in-command' : 'is-out-of-command'}"
      aria-hidden="true"
      data-commander-id="${commanderUnit.id}"
      data-unit-id="${referenceUnit.id}"
      style="${style}"
    ></div>
  `;
}

function getActiveCommanderRangeVisualization(state, battlefieldProfile) {
  if (state.game.setup.isActive || !state.game.commandContext.activeCorpsId) {
    return '';
  }

  const commanderId = state.game.commandContext.commander?.unitId ?? null;
  const rangeUd = Number.isFinite(state.game.commandContext.commander?.rangeUd)
    ? state.game.commandContext.commander.rangeUd
    : null;
  if (!commanderId || rangeUd == null) {
    return '';
  }

  const commanderUnit = state.game.units.find((unit) => unit.id === commanderId) ?? null;
  if (!commanderUnit) {
    return '';
  }

  const radiusUd = rangeUd + 0.5;
  const diameterUd = radiusUd * 2;
  const style = [
    `left:${(commanderUnit.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(commanderUnit.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(diameterUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(diameterUd / battlefieldProfile.heightUd) * 100}%`,
  ].join(';');

  return `
    <span class="battlefield-command-range-ring has-range is-active-commander-ring" aria-hidden="true" data-range-commander-id="${commanderUnit.id}" style="${style}">
      <span class="battlefield-command-range-ring-label">${rangeUd} UD</span>
    </span>
  `;
}

function toUnitCssToken(unitId) {
  return String(unitId)
    .toLowerCase()
    .replaceAll(/[^a-z0-9_-]/g, '-');
}

function toCorpsSlotId(corpsId) {
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

function renderTerrainPlaceholders(state, battlefieldProfile) {
  return state.game.setup.terrain.placeholders.map((placeholder) => {
    const style = [
      `left:${(placeholder.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
      `top:${(placeholder.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
      `width:${(placeholder.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
      `height:${(placeholder.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
      `--terrain-rotation:${placeholder.footprint.rotationRadians}rad`,
    ].join(';');

    return `
      <button
        class="battlefield-terrain-placeholder ${placeholder.shapeModel === TERRAIN_SHAPE_MODELS.ELLIPSE ? 'is-ellipse' : 'is-rectangle'} ${state.game.setup.terrain.selectedPlaceholderId === placeholder.id ? 'is-selected' : ''} ${placeholder.lockState === 'locked' ? 'is-locked' : ''}"
        type="button"
        data-action="select-terrain-placeholder"
        data-terrain-placeholder-id="${placeholder.id}"
        title="${placeholder.label} ziehen"
        style="${style}"
      >
        <span class="battlefield-terrain-placeholder-label">${placeholder.label}</span>
      </button>
    `;
  }).join('');
}

function renderSetupObjects(state, battlefieldProfile) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const campsStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'camps');
  if (currentStepIndex !== -1 && currentStepIndex < campsStepIndex) {
    return '';
  }

  return state.game.setup.setupObjects.placeholders.map((setupObject) => {
    const style = [
      `left:${(setupObject.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
      `top:${(setupObject.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
      `width:${(setupObject.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
      `height:${(setupObject.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
      `--setup-object-rotation:${setupObject.footprint.rotationRadians}rad`,
    ].join(';');
    const ownerClass = setupObject.owner === 'player-2' ? 'is-owner-two' : 'is-owner-one';
    const familyClass = `is-family-${setupObject.family}`;

    return `
      <button
        class="battlefield-setup-object-placeholder ${ownerClass} ${familyClass} ${state.game.setup.setupObjects.selectedObjectId === setupObject.id ? 'is-selected' : ''}"
        type="button"
        data-action="select-setup-object"
        data-setup-object-id="${setupObject.id}"
        title="${setupObject.label} verschieben"
        style="${style}"
      >
        <span class="battlefield-setup-object-label">${setupObject.label}</span>
      </button>
    `;
  }).join('');
}

function renderAmbushMarkerShells(state, battlefieldProfile) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const ambushStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'ambushes');
  if (currentStepIndex !== -1 && currentStepIndex < ambushStepIndex) {
    return '';
  }

  return state.game.setup.ambushMarkers.markers.map((marker) => {
    const shell = getPublicAmbushMarkerShell(marker);
    const style = [
      `left:${(shell.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
      `top:${(shell.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
      `width:${(shell.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
      `height:${(shell.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
      `--ambush-marker-rotation:${shell.footprint.rotationRadians}rad`,
    ].join(';');
    const ownerClass = shell.owner === 'player-2' ? 'is-owner-two' : 'is-owner-one';

    return `
      <button
        class="battlefield-ambush-marker-shell ${ownerClass} ${state.game.setup.ambushMarkers.selectedMarkerId === shell.id ? 'is-selected' : ''}"
        type="button"
        data-action="select-ambush-marker"
        data-marker-id="${shell.id}"
        title="${shell.label} verschieben"
        style="${style}"
      >
        <span class="battlefield-ambush-marker-label">${shell.label}</span>
      </button>
    `;
  }).join('');
}

function renderTerrainValidationList(results) {
  if (!results.length) {
    return '<span class="muted-copy">Noch keine Terrain-Diagnosen vorhanden.</span>';
  }

  const severityOrder = {
    error: 0,
    warning: 1,
    info: 2,
  };

  const orderedResults = [...results].sort((left, right) => {
    if (left.ok !== right.ok) {
      return left.ok ? 1 : -1;
    }

    return (severityOrder[left.severity] ?? 99) - (severityOrder[right.severity] ?? 99);
  });

  return `
    <ul class="battlefield-validation-list">
      ${orderedResults.map((result) => `
        <li class="battlefield-validation-item is-${result.severity} ${result.ok ? 'is-ok' : 'is-not-ok'}">
          <span class="battlefield-validation-item-title">${result.message}</span>
          <span class="battlefield-validation-item-meta">${result.sourceStatus}${result.ruleRefs.length ? ` • ${result.ruleRefs.join(', ')}` : ''}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderTerrainValidation(state) {
  const currentStepId = state.game.setup.currentStepId;
  const isTerrainStep = currentStepId === 'terrain' || currentStepId === 'terrain-adjustment';
  if (!isTerrainStep) {
    return '';
  }

  const validation = state.game.setup.terrain.validation;
  const summary = validation.activeSummary;
  const highlightedBlockedResults = validation.activeResults
    .filter((result) => !result.ok)
    .sort((left, right) => {
      const leftPriority = left.id === 'road-river-source-check' ? 0 : 1;
      const rightPriority = right.id === 'road-river-source-check' ? 0 : 1;
      return leftPriority - rightPriority;
    })
    .slice(0, 3);
  const statusLabel = !validation.activePlaceholderLabel
    ? 'Setup-Blick'
    : summary.isPhysicallyValid
      ? 'Physisch gueltig'
      : 'Physisch blockiert';
  const statusClass = !validation.activePlaceholderLabel
    ? 'is-info'
    : summary.isPhysicallyValid
      ? 'is-valid'
      : 'is-error';

  return `
    <div class="battlefield-placeholder-card battlefield-terrain-validation-card">
      <div class="battlefield-validation-header">
        <strong>Terrain Checks</strong>
        <span class="battlefield-validation-badge ${statusClass}">${statusLabel}</span>
      </div>
      <span class="muted-copy">Verifizierte Physik-Checks sind echt. Offizielle Terrain-Regeln bleiben bis zur Source-Pruefung als Warnung markiert.</span>
      ${validation.activePlaceholderLabel ? `
        <div class="battlefield-validation-summary">
          <span><strong>Aktiver Check:</strong> ${validation.activePlaceholderLabel}</span>
          <span>Quelle: ${validation.activeSource === 'attempted-placeholder' ? 'letzter ungueltiger Versuch' : 'aktuell ausgewaehlter Placeholder'}</span>
          <span>${summary.passedCheckCount} Checks ok, ${summary.warningCount} Warnungen, ${summary.errorCount} Fehler</span>
        </div>
      ` : `
        <span class="muted-copy">Waehle oder bewege einen Placeholder, um konkrete Diagnosen zu sehen.</span>
      `}
      ${highlightedBlockedResults.length ? `
        <div class="battlefield-validation-callout-list">
          ${highlightedBlockedResults.map((result) => `
            <div class="battlefield-validation-callout is-${result.severity}">
              <strong>${result.severity === 'error' ? 'Blockiert' : 'Offen'}</strong>
              <span>${result.message}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <span class="battlefield-validation-section-title">Aktiver Placeholder</span>
      ${renderTerrainValidationList(validation.activeResults)}
      <span class="battlefield-validation-section-title">P3-Grenzen</span>
      ${renderTerrainValidationList(validation.globalResults)}
    </div>
  `;
}

function formatRoundCorpsLabel(corpsId) {
  const match = String(corpsId ?? '').match(/corps-(\d+)/i);
  return match ? `Corps ${match[1]}` : escapeHtml(String(corpsId ?? 'Corps'));
}

function getSetupGuideStepContent(state) {
  const stepId = state.game.setup.currentStepId;
  const currentIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === stepId);
  const stepNumber = currentIndex === -1 ? '?' : currentIndex + 1;
  const isReadyStep = stepId === 'ready';

  const base = {
    stepNumber,
    badge: 'Setup Flow',
    sourceStatus: 'needs-source-check',
    helper: 'Die Schrittfuehrung ist jetzt als End-UX-Hook eingebaut. Offizielle Legality-Checks bleiben bis zur Source-Pruefung klar markiert.',
    primaryAction: isReadyStep ? 'complete-setup' : 'setup-next',
    primaryLabel: isReadyStep ? 'In die Schlacht' : 'Weiter zum naechsten Schritt',
  };

  switch (stepId) {
    case 'format':
      return {
        ...base,
        title: 'Initiative, Rollen und Format vorbereiten',
        body: 'Langfristig sollen hier Initiativewurf, Angreifer/Verteidiger und Profilstart dialoggefuehrt starten. Aktuell dient dieser Schritt als gefuehrter Einstieg vor der Regions- und Terrainphase.',
        checklist: [
          'Initiative und Rollen sind fachlich noch placeholder.',
          'Spielprofil bleibt Standard-200 als aktueller Zielpfad.',
        ],
      };
    case 'region':
      return {
        ...base,
        title: 'Region und Pflichtgelaende festlegen',
        body: 'Hier sollte spaeter die Region bestimmt werden und daraus das Pflichtgelaende des Verteidigers folgen. Solange die Regionstabellen noch nicht source-verifiziert sind, bleibt dieser Schritt ein gefuehrter Platzhalter.',
        checklist: [
          'Verteidiger bestimmt spaeter Region und Pflichtgelaende.',
          'Exakte Terrainquoten bleiben bis Source-Check offen.',
        ],
      };
    case 'terrain':
      return {
        ...base,
        title: 'Terrain auswaehlen und platzieren',
        body: 'Nutze links die Terrain-Palette und platziere sichtbare Placeholder auf dem Feld. Dieser Schritt bildet jetzt bereits die spaetere Platzierungsreihenfolge als Untersequenz ab, auch wenn Quoten und einzelne Sonderregeln noch nicht final erzwungen werden.',
        checklist: [
          'Pflichtgelaende des Verteidigers zuerst.',
          'Danach restliches Terrain in der vorgesehenen Reihenfolge.',
        ],
        substeps: [
          '1. Verteidiger platziert Pflichtgelaende.',
          '2. Falls vorhanden: Fluss oder Kueste wird als frueher Sonderfall gesetzt.',
          '3. Verteidiger versucht gegebenenfalls ein Dorf zu platzieren.',
          '4. Beide Spieler platzieren restliches Gelaende abwechselnd.',
          '5. Die Strasse folgt zuletzt.',
        ],
      };
    case 'terrain-adjustment':
      return {
        ...base,
        title: 'Terrain anpassen',
        body: 'Dieser Schritt ist der Hook fuer die spaetere Adjustment-Sequenz mit Wurf, erlaubter Aktion und Bestätigung je Gelaendeteil. Aktuell kannst du Placeholder bewegen und die Diagnosen links zur Orientierung nutzen.',
        checklist: [
          'Angreifer passt zuerst an, dann Verteidiger.',
          'Offizielle Wurf- und Entfernen-Regeln sind noch nicht final erzwungen.',
        ],
      };
    case 'camps':
      return {
        ...base,
        title: 'Camps und Befestigungen setzen',
        body: 'Pflicht-Camps und weitere Setup-Objekte koennen bereits als echte Placeholder auf dem Tisch liegen. Spaeter wird dieser Schritt Defender-first und dann Attacker-first streng dialoggefuehrt.',
        checklist: [
          'Camp in eigener Zone und offenem Gelaende.',
          'Fortifications und Obstacles folgen spaeter mit offizieller Legalitaet.',
        ],
      };
    case 'battle-plan':
      return {
        ...base,
        title: 'Battle Plan verdeckt festlegen',
        body: 'Ordne die Corps links, mitte, rechts oder Flank March auf dem privaten Board zu. Dieser Schritt ist als Hotseat-sicherer Handover-Hook gedacht und bleibt owner-private.',
        checklist: [
          'Corps-Slots getrennt von echten Battlefield-Sektoren behandeln.',
          `Aktuelle Privacy-Ansicht: ${escapeHtml(state.game.setupViewMode)}.`,
        ],
      };
    case 'ambushes':
      return {
        ...base,
        title: 'Ambush Marker setzen',
        body: 'Lege Marker und private Inhalte an. Der sichtbare Marker bleibt oeffentlich, der Inhalt privat. So bleibt der Schritt spaeter fuer Hotseat und Multiplayer verwendbar.',
        checklist: [
          'Verteidiger zuerst, dann Angreifer.',
          'Exakte Markeranzahl und Terrainbedingungen bleiben source-blocked.',
        ],
      };
    case 'deployment':
      return {
        ...base,
        title: 'Armeen corpsweise deployen',
        body: 'Die sichtbaren Deployment-Placeholder sind jetzt der End-UX-Hook fuer spaetere corpsweise Aufstellung. Die aktuelle Version zeigt schon Footprints und Non-Overlap-Hooks, aber noch keine voll offizielle Deployment-Legalitaet.',
        checklist: [
          'Verteidiger beginnt, danach abwechselnd corpsweise.',
          'Schwere und leichte Truppen-Zonen folgen spaeter mit strenger Regelpruefung.',
        ],
      };
    case 'ready':
      return {
        ...base,
        title: 'Setup abschliessen und Spiel starten',
        body: 'Wenn Terrain, Battle Plan, Ambushes und Deployment vorbereitet sind, wechselst du mit diesem Schritt in die Schlacht. Direkt danach sollte der Rundenstart-Dialog erscheinen.',
        checklist: [
          'Dismounting, Flank March und Unreliable sollen spaeter als eigene End-Hooks folgen.',
          'Mit In die Schlacht endet das Setup und die Round-Flow-Dialoge uebernehmen.',
        ],
      };
    default:
      return {
        ...base,
        title: 'Setup-Schritt',
        body: 'Dieser Setup-Schritt hat bereits einen Guide-Hook, aber noch keine spezifische Schrittbeschreibung.',
        checklist: [],
        substeps: [],
      };
  }
}

function renderSetupGuideDialog(state) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const content = getSetupGuideStepContent(state);
  const currentStepId = state.game.setup.currentStepId;
  const isLocked = state.game.setup.lockedStepIds.includes(currentStepId);
  const isDismissed = state.game.setup.dismissedGuideStepIds.includes(currentStepId);

  if (isDismissed) {
    return '';
  }

  return `
    <div class="battlefield-setup-guide-overlay" data-setup-guide-overlay>
      <div class="battlefield-setup-guide-dialog" role="dialog" aria-labelledby="setup-guide-title" aria-modal="false">
        <div class="battlefield-setup-guide-header">
          <span class="battlefield-round-dialog-tag">${content.badge}</span>
          <span class="battlefield-round-dialog-tag is-muted">Schritt ${content.stepNumber}</span>
        </div>
        <strong id="setup-guide-title">${escapeHtml(content.title)}</strong>
        <span class="muted-copy">${escapeHtml(content.body)}</span>
        <div class="battlefield-setup-guide-meta">
          <span><strong>Status:</strong> ${isLocked ? 'fixiert' : 'offen'}</span>
          <span><strong>Quelle:</strong> ${escapeHtml(content.sourceStatus)}</span>
        </div>
        ${content.checklist.length ? `
          <ul class="battlefield-setup-guide-list">
            ${content.checklist.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}
          </ul>
        ` : ''}
        ${content.substeps?.length ? `
          <div class="battlefield-setup-guide-substeps">
            <strong>Untersequenz</strong>
            <ol class="battlefield-setup-guide-sequence-list">
              ${content.substeps.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}
            </ol>
          </div>
        ` : ''}
        <span class="muted-copy">${escapeHtml(content.helper)}</span>
        <div class="battlefield-round-dialog-actions">
          <button class="shell-button battlefield-round-dialog-button" type="button" data-action="dismiss-setup-guide">OK</button>
        </div>
      </div>
    </div>
  `;
}

function renderRoundDialog(state) {
  const round = state.game.round;
  const dialogType = round?.dialog?.type ?? null;

  if (!round || !dialogType) {
    return '';
  }

  if (dialogType === ROUND_DIALOG_TYPES.CORPS_SELECTION) {
    const availableCorps = getAvailableCorpsForPlayer(
      state.game.commandContext.corpsActivation,
      round.turnPlayerId,
    );

    return `
      <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay>
        <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
          <div class="battlefield-round-dialog-header">
            <span class="battlefield-round-dialog-tag">Rundenfolge</span>
          </div>
          <strong id="round-dialog-title">Bitte erstes Corps fuer Aktivierung waehlen</strong>
          <span class="muted-copy">Waehle eines der noch nicht aktivierten Corps des aktuellen Spielers.</span>
          <div class="battlefield-round-dialog-corps-grid">
            ${availableCorps.map((entry) => `
              <button class="shell-button battlefield-round-dialog-button" type="button" data-action="select-active-corps" data-corps-id="${entry.corpsId}">
                ${formatRoundCorpsLabel(entry.corpsId)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  if (dialogType === ROUND_DIALOG_TYPES.NEXT_CORPS_PROMPT) {
    return `
      <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay>
        <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
          <div class="battlefield-round-dialog-header">
            <span class="battlefield-round-dialog-tag">Rundenfolge</span>
          </div>
          <strong id="round-dialog-title">Naechstes Corps?</strong>
          <span class="muted-copy">Soll ein weiteres Corps dieses Spielers aktiviert werden?</span>
          <div class="battlefield-round-dialog-actions">
            <button class="shell-button battlefield-round-dialog-button" type="button" data-action="confirm-next-corps">Ja</button>
            <button class="ghost-button battlefield-round-dialog-button" type="button" data-action="skip-remaining-corps">Nein</button>
          </div>
        </div>
      </div>
    `;
  }

  if (dialogType === ROUND_DIALOG_TYPES.PHASE_ANNOUNCE) {
    return `
      <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay>
        <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
          <div class="battlefield-round-dialog-header">
            <span class="battlefield-round-dialog-tag">Rundenfolge</span>
          </div>
          <strong id="round-dialog-title">${escapeHtml(round.dialog.phaseLabel ?? 'Naechste Phase')}</strong>
          <span class="muted-copy">Diese Phase ist aktuell noch ein Platzhalter. Mit Weiter springst du direkt zur naechsten Phase.</span>
          <div class="battlefield-round-dialog-actions">
            <button class="shell-button battlefield-round-dialog-button" type="button" data-action="advance-round-phase">Weiter</button>
          </div>
        </div>
      </div>
    `;
  }

  const title = dialogType === ROUND_DIALOG_TYPES.PLAYER_SWITCH
    ? `${round.turnPlayerId === 'player-2' ? 'Spieler 2' : 'Spieler 1'} ist dran`
    : `Runde ${round.roundNumber}`;
  const copy = dialogType === ROUND_DIALOG_TYPES.PLAYER_SWITCH
    ? 'Der naechste Spieler beginnt jetzt mit seiner Corps-Aktivierung.'
    : 'Beginne die Runde und waehle danach das erste Corps fuer die Aktivierung.';

  return `
    <div class="battlefield-round-dialog-overlay" data-round-dialog-overlay>
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="round-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">Rundenfolge</span>
        </div>
        <strong id="round-dialog-title">${escapeHtml(title)}</strong>
        <span class="muted-copy">${copy}</span>
        <div class="battlefield-round-dialog-actions">
          <button class="shell-button battlefield-round-dialog-button" type="button" data-action="round-begin">Beginnen</button>
        </div>
      </div>
    </div>
  `;
}

function getChargeReactionUnitLabel(state, unitId) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  return unit?.scenarioLabel ?? unit?.id ?? 'Unbekanntes Ziel';
}

function getPendingChargeReactionDialogConfig(preview) {
  if (preview?.status === CHARGE_PREVIEW_STATUSES.REACTION_PENDING) {
    return {
      request: preview.declarationSnapshot?.reactionRequests?.[0] ?? preview.reactionRequests?.[0] ?? null,
      resolveAction: 'resolve-charge-reaction',
      tag: 'Charge-Reaktion',
      titlePrefix: 'Reaktion des Ziels',
      bodyPrefix: 'reagiert jetzt auf die bestaetigte Charge-Deklaration.',
    };
  }

  if (
    preview?.status === CHARGE_PREVIEW_STATUSES.EVADE_REQUIRED
    && preview?.followThroughResolution?.status === CHARGE_FOLLOW_THROUGH_RESOLUTION_STATUSES.SECONDARY_TARGET
    && !preview?.secondaryReactionDecision
  ) {
    return {
      request: preview.reactionRequests?.[1] ?? null,
      resolveAction: 'resolve-secondary-charge-reaction',
      tag: 'Sekundaerziel-Reaktion',
      titlePrefix: 'Reaktion des Sekundaerziels',
      bodyPrefix: 'reagiert jetzt auf den pausierten Follow-Through-Kontakt.',
    };
  }

  return null;
}

function renderChargeReactionDialog(state) {
  const preview = state.game.chargePreview;
  const dialogConfig = getPendingChargeReactionDialogConfig(preview);
  if (!dialogConfig) {
    return '';
  }

  const request = dialogConfig.request;
  if (!request) {
    return '';
  }

  const targetLabel = escapeHtml(getChargeReactionUnitLabel(state, request.unitId));
  const diagnosticsText = escapeHtml((request.diagnostics ?? []).map((entry) => entry.text).filter(Boolean).join(' '));

  let title = dialogConfig.titlePrefix;
  let body = `${targetLabel} ${dialogConfig.bodyPrefix}`;
  let actions = '';

  if (request.type === CHARGE_REACTION_REQUEST_TYPES.NONE) {
    title = 'Keine Ausweichreaktion';
    body = `${targetLabel} hat in diesem P7-Schnitt keine Ausweichreaktion. Mit Weiter wird der No-Evade-Handoff festgehalten.`;
    actions = `<button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="no-evade">Weiter</button>`;
  } else if (request.type === CHARGE_REACTION_REQUEST_TYPES.BLOCKED_EVADE) {
    title = 'Ausweichen blockiert';
    body = `${targetLabel} darf nicht ausweichen. Mit Weiter wird der blockierte No-Evade-Handoff festgehalten.`;
    actions = `<button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="blocked-no-evade">Weiter</button>`;
  } else if (request.type === CHARGE_REACTION_REQUEST_TYPES.MAY_EVADE) {
    title = 'Reaktion: Ausweichen moeglich';
    body = `${targetLabel} darf jetzt ausweichen oder stehenbleiben.`;
    actions = `
      <button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="evade">Ausweichen</button>
      <button class="ghost-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="no-evade">Nicht ausweichen</button>
    `;
  } else if (request.type === CHARGE_REACTION_REQUEST_TYPES.MUST_EVADE) {
    title = 'Reaktion: Ausweichen erforderlich';
    body = `${targetLabel} muss in diesem P7-Schnitt ausweichen. Mit Bestaetigen wird der explizite P7A-Handoff gesetzt.`;
    actions = `<button class="shell-button battlefield-round-dialog-button" type="button" data-action="${dialogConfig.resolveAction}" data-decision-type="forced-evade">Ausweichen bestaetigen</button>`;
  } else {
    title = 'Quellenpruefung erforderlich';
    body = `${targetLabel} braucht vor der Reaktionsaufloesung noch eine Quellenpruefung. Die Charge darf von hier nur abgebrochen werden.`;
    actions = '<button class="ghost-button battlefield-round-dialog-button" type="button" data-action="cancel-charge-preview">Charge abbrechen</button>';
  }

  return `
    <div class="battlefield-round-dialog-overlay" data-charge-reaction-dialog-overlay>
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="charge-reaction-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">${dialogConfig.tag}</span>
        </div>
        <strong id="charge-reaction-dialog-title">${escapeHtml(title)}</strong>
        <span class="muted-copy">${escapeHtml(body)}</span>
        ${diagnosticsText ? `<span class="muted-copy">${diagnosticsText}</span>` : ''}
        <div class="battlefield-round-dialog-actions">
          ${actions}
        </div>
      </div>
    </div>
  `;
}

function renderChargeBranchDistanceDialog(state) {
  const preview = state.game.chargePreview;
  const claim = preview?.branchDistanceRoll?.claim ?? null;
  const result = preview?.branchDistanceRoll?.result ?? null;
  if (!claim || result) {
    return '';
  }

  const targetLabel = escapeHtml(getChargeReactionUnitLabel(state, claim.targetUnitId));
  const chargerLabel = escapeHtml(getChargeReactionUnitLabel(state, claim.chargingUnitId));
  const isAdjustedChargeDistance = claim.reason === CHARGE_BRANCH_ROLL_REASONS.ADJUSTED_CHARGE_DISTANCE;
  const title = isAdjustedChargeDistance ? 'Adjusted Charge-Distanz bestimmen' : 'Ausweichdistanz bestimmen';
  const tag = isAdjustedChargeDistance ? 'P7A Charge-Folgezug' : 'P7A Evade-Distanz';
  const body = isAdjustedChargeDistance
    ? `${chargerLabel} folgt jetzt allen initialen Ausweichern mit der angepassten Charge. Waehle den deterministischen D6-Wert fuer die erste Follow-Through-Distanz.`
    : `${targetLabel} weicht der bestaetigten Charge von ${chargerLabel} aus. Waehle den deterministischen D6-Wert fuer die erste Evade-Distanz.`;

  return `
    <div class="battlefield-round-dialog-overlay" data-charge-branch-distance-dialog-overlay>
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="charge-branch-distance-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">${tag}</span>
        </div>
        <strong id="charge-branch-distance-dialog-title">${title}</strong>
        <span class="muted-copy">${body}</span>
        <div class="battlefield-branch-roll-grid">
          ${Array.from({ length: 6 }, (_, index) => {
            const dieRoll = index + 1;
            return `
              <button
                class="battlefield-command-roll-die battlefield-command-roll-die-button"
                type="button"
                data-action="resolve-charge-branch-distance"
                data-die-roll="${dieRoll}"
                data-roll-value="${dieRoll}"
              >
                ${renderRollPips(dieRoll)}
                <span class="battlefield-command-roll-die-label">D6</span>
                <span class="battlefield-command-roll-die-value">${dieRoll}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderEvadeChoiceHandoffDialog(state) {
  const handoff = state.game.chargePreview?.evadeChoiceHandoff ?? null;
  if (handoff?.status !== 'pending') {
    return '';
  }

  const reactingPlayerLabel = handoff.reactingPlayerId === 'player-2' ? 'Spieler B' : 'Spieler A';
  const targetLabel = escapeHtml(handoff.targetLabel ?? handoff.reactingUnitId ?? 'das Ziel');
  const prompt = escapeHtml(handoff.prompt ?? `${reactingPlayerLabel} waehlt jetzt den Ausweichzug fuer ${targetLabel}.`);

  return `
    <div class="battlefield-round-dialog-overlay" data-evade-choice-handoff-dialog-overlay>
      <div class="battlefield-round-dialog" role="dialog" aria-modal="true" aria-labelledby="evade-choice-handoff-dialog-title">
        <div class="battlefield-round-dialog-header">
          <span class="battlefield-round-dialog-tag">Hotseat Handoff</span>
        </div>
        <strong id="evade-choice-handoff-dialog-title">${reactingPlayerLabel} uebernimmt den Ausweichzug</strong>
        <span class="muted-copy">${prompt}</span>
        <span class="muted-copy">Mit OK schaltest du auf ${reactingPlayerLabel} um und oeffnest erst dann die Ausweichwahl fuer ${targetLabel}.</span>
        <div class="battlefield-round-dialog-actions">
          <button class="shell-button battlefield-round-dialog-button" type="button" data-action="acknowledge-evade-choice-handoff">OK</button>
        </div>
      </div>
    </div>
  `;
}

export function renderBattlefieldScreen(state) {
  const visibleSetup = projectSetupForViewer(state.game.setup, state.game.setupViewMode);
  const renderState = {
    ...state,
    game: {
      ...state.game,
      setup: visibleSetup,
    },
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const overlayHotkey = state.shell.settings.keyBindings.overlayCycle.primary || 'Nicht belegt';
  const showScaleOverlay = state.shell.settings.showScaleOverlay;
  const viewport = state.game.viewport;
  const testUnit = state.game.units[0];
  const isSetupActive = renderState.game.setup.isActive;
  const isTerrainStep = isSetupActive
    && (renderState.game.setup.currentStepId === 'terrain' || renderState.game.setup.currentStepId === 'terrain-adjustment');
  const isDeploymentSetupStep = isSetupActive
    && (renderState.game.setup.currentStepId === 'deployment' || renderState.game.setup.currentStepId === 'ready');
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
  const selectedUnitMovementFinished = Boolean(
    selectedUnit
      && (
        Number(selectedUnit.advanceUsedUd ?? 0) > 0
        || Boolean(selectedUnit.slideUsedThisMovementPhase)
        || Boolean(selectedUnit.stayedThisMovementPhase)
      )
  );
  const canIssueMovementCommands =
    !isSetupActive &&
    selectedUnit !== null &&
    state.game.commandContext.currentPhaseId === 'movement' &&
    selectedUnit.owner === state.game.commandContext.activePlayerId &&
    !selectedUnitMovementFinished &&
    state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.IDLE;
  const canDragUnitsInSetup = isSetupActive
    && (renderState.game.setup.currentStepId === 'deployment' || renderState.game.setup.currentStepId === 'ready');
  const {
    advanceModeActive,
    slideModeActive,
    wheelModeActive,
    wheelPivotSide,
    advancePreviewUd,
    slidePreviewUd,
    wheelPreviewAngleRadians,
    wheelDistanceUd,
    previewDistanceUd,
    slideAvailable,
    remainingAdvanceBudgetUd,
    maxAdvanceUd,
    previewUnitStyle,
    advanceReachStyle,
    helperCopy,
    diagnostics,
    canCancelMovement,
    canConfirmMovement,
    canMarkStay,
    canShowMovementButtons,
    canUseFreeCommandPoint,
    useFreeCommandPoint,
    chargePreviewActive,
    chargeStartControlsActive,
    chargeStartOptions,
    selectedChargeStartType,
    canStartCharge,
    chargeDisabledReason,
    canStartAdjustedChargeDistanceRoll,
    canResolveEvadeAvoidanceChoice,
    evadeAvoidanceCandidates,
    evadeChoicePathStepIds,
    canResolveChargeContinuationChoice,
    minimumChargeContinuationDistanceUd,
    maximumChargeContinuationDistanceUd,
    chargeWhyItems,
    confirmActionLabel,
    confirmActionTitle,
  } = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive,
    canDragUnitsInSetup,
    battlefieldProfile,
  });
  const showDeploymentOverlay = isDeploymentSetupStep
    || state.game.overlayMode === 'Aufstellungszonen'
    || state.game.overlayMode === 'Beides';
  const showSectorOverlay = state.game.overlayMode === 'Sektoren' || state.game.overlayMode === 'Beides';
  const committedPreviewSegments = getCommittedMovementPreviewSegments(state.game.movement.preview);
  const committedPreviewTrailSegments = committedPreviewSegments.slice(0, -1);
  const commanderGhostPose = selectedUnit
    && state.game.commanderFreeMovePreview?.status === 'ready'
    && state.game.commanderFreeMovePreview.unitId === selectedUnit.id
    && Number.isFinite(state.game.commanderFreeMovePreview.xUd)
    && Number.isFinite(state.game.commanderFreeMovePreview.yUd)
    ? {
        xUd: state.game.commanderFreeMovePreview.xUd,
        yUd: state.game.commanderFreeMovePreview.yUd,
        rotationRadians: selectedUnit.rotationRadians ?? 0,
      }
    : null;
  const commanderAttachTargetingActive = Boolean(
    selectedUnit
      && selectedUnit.isCommander
      && !selectedUnit.hasIncludedCommander
      && !selectedUnit.attachedUnitId
      && state.game.commanderFreeMovePreview?.status === 'targeting'
      && state.game.commanderFreeMovePreview?.mode === 'attach'
      && state.game.commanderFreeMovePreview?.unitId === selectedUnit.id,
  );
  const commanderAttachReachUd = commanderAttachTargetingActive
    ? getCommanderAttachRemainingUd(state.game, selectedUnit)
    : 0;
  const chargeTargetingActive = Boolean(
    state.game.chargePreview?.status === CHARGE_PREVIEW_STATUSES.TARGETING
      && state.game.chargePreview?.intent?.unitId === selectedUnit?.id,
  );
  const chargePreviewActiveForSelectedUnit = Boolean(
    state.game.chargePreview?.status !== CHARGE_PREVIEW_STATUSES.IDLE
      && state.game.chargePreview?.intent?.unitId === selectedUnit?.id,
  );
  const chargeTargetCandidatesByUnitId = new Map(
    Array.isArray(state.game.chargePreview?.targetCandidates)
      ? state.game.chargePreview.targetCandidates.map((candidate) => [candidate.unitId, candidate])
      : [],
  );
  const chargeGuideSegment = selectedUnit && chargePreviewActiveForSelectedUnit
    ? (state.game.chargePreview?.pathSegments ?? []).find((segment) => segment.kind === 'charge-direction-guide') || null
    : null;
  const chargeContactEvent = chargePreviewActiveForSelectedUnit
    ? (state.game.chargePreview?.contactEvents ?? [])[0] ?? null
    : null;
  const chargeStartPose = chargePreviewActiveForSelectedUnit
    ? state.game.chargePreview?.intent?.startPose ?? null
    : null;
  const chargePreviewReachStyle = chargeGuideSegment && selectedUnit
    ? createLinearReachStyle(chargeGuideSegment, selectedUnit, battlefieldProfile)
    : '';
  const chargeGhostPose = chargeGuideSegment && selectedUnit
    ? getLinearSegmentEndPose(chargeGuideSegment)
    : null;
  const evadePlan = state.game.chargePreview?.evadePlan ?? null;
  const evadePlanUnit = evadePlan?.reactingUnitId
    ? state.game.units.find((unit) => unit.id === evadePlan.reactingUnitId) ?? null
    : null;
  const evadeChoiceTree = getEvadeChoiceTree({
    evadeAvoidanceCandidates,
    choicePathStepIds: evadeChoicePathStepIds,
  });
  const evadeReorientationStyle = evadePlan?.reorientedPose && evadePlanUnit
    ? createPreviewGhostStyle(evadePlan.reorientedPose, evadePlanUnit, battlefieldProfile)
    : '';
  const evadePlanSegment = evadePlan && evadePlanUnit ? createEvadePlanSegment(evadePlan) : null;
  const evadePlanReachStyle = evadePlanSegment && evadePlanUnit
    ? createLinearReachStyle(evadePlanSegment, evadePlanUnit, battlefieldProfile)
    : '';
  const chargeMovementPlan = state.game.chargePreview?.chargeMovementPlan ?? null;
  const chargeMovementPlanUnit = chargeMovementPlan?.chargingUnitId
    ? state.game.units.find((unit) => unit.id === chargeMovementPlan.chargingUnitId) ?? null
    : null;
  const chargeMovementPlanSegment = chargeMovementPlan && chargeMovementPlanUnit
    ? createChargeMovementPlanSegment(chargeMovementPlan)
    : null;
  const chargeMovementPlanReachStyle = chargeMovementPlanSegment && chargeMovementPlanUnit
    ? createLinearReachStyle(chargeMovementPlanSegment, chargeMovementPlanUnit, battlefieldProfile)
    : '';
  const chargeContinuationMinimumSegment = chargeMovementPlan?.continuationChoice?.required
    && !chargeMovementPlan?.continuationChoice?.selectedOption
    && chargeMovementPlan?.continuationChoice?.minimumEndPose
    && chargeMovementPlanUnit
    ? createChargeMovementPlanSegment({
      ...chargeMovementPlan,
      distanceUd: chargeMovementPlan.continuationChoice.minimumDistanceUd,
    })
    : null;
  const chargeContinuationMinimumReachStyle = chargeContinuationMinimumSegment && chargeMovementPlanUnit
    ? createLinearReachStyle(chargeContinuationMinimumSegment, chargeMovementPlanUnit, battlefieldProfile)
    : '';
  const commanderAttachRangeStyle = commanderAttachTargetingActive
    ? [
        `left:${(selectedUnit.xUd / battlefieldProfile.widthUd) * 100}%`,
        `top:${(selectedUnit.yUd / battlefieldProfile.heightUd) * 100}%`,
        `width:${((commanderAttachReachUd * 2) / battlefieldProfile.widthUd) * 100}%`,
        `height:${((commanderAttachReachUd * 2) / battlefieldProfile.heightUd) * 100}%`,
      ].join(';')
    : '';
  const movementReferenceUnit = createMovementReferenceUnit(selectedUnit, state.game.movement.preview, state.game.commanderFreeMovePreview);
  const wheelDisplayPose = wheelModeActive && selectedUnit
    ? getMovementPreviewEndPose(state.game.movement.preview, {
        xUd: selectedUnit.xUd,
        yUd: selectedUnit.yUd,
        rotationRadians: selectedUnit.rotationRadians ?? 0,
      })
    : chargePreviewActiveForSelectedUnit && state.game.chargePreview?.intent?.startManoeuvre?.type === 'wheel' && chargeStartPose
      ? chargeStartPose
    : null;
  const leftWheelHandlePoint = wheelDisplayPose && selectedUnit
    ? localPointToWorldPoint(
        {
          center: { x: wheelDisplayPose.xUd, y: wheelDisplayPose.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: wheelDisplayPose.rotationRadians,
        },
        { x: -(selectedUnit.widthUd / 2), y: selectedUnit.depthUd / 2 },
      )
    : null;
  const rightWheelHandlePoint = wheelDisplayPose && selectedUnit
    ? localPointToWorldPoint(
        {
          center: { x: wheelDisplayPose.xUd, y: wheelDisplayPose.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: wheelDisplayPose.rotationRadians,
        },
        { x: selectedUnit.widthUd / 2, y: selectedUnit.depthUd / 2 },
      )
    : null;
  const chargeWheelStartManoeuvre = state.game.chargePreview?.intent?.startManoeuvre?.type === 'wheel'
    ? state.game.chargePreview.intent.startManoeuvre
    : null;
  const chargeWheelAngleRadians = Number(chargeWheelStartManoeuvre?.wheelAngleRadians ?? 0);
  const highlightedWheelPivotSide = chargePreviewActiveForSelectedUnit && chargeWheelStartManoeuvre && chargeWheelAngleRadians > 1e-9
    ? chargeWheelStartManoeuvre.pivotSide
    : Number(wheelPreviewAngleRadians ?? 0) > 1e-9
      ? wheelPivotSide
      : null;
  const selectedUnitRotationRadians = selectedUnit?.rotationRadians ?? 0;
  const facingRelationship = state.game.debug.isActive && selectedUnit
    ? classifyFacingRelationship(
        {
          center: { x: selectedUnit.xUd, y: selectedUnit.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: selectedUnitRotationRadians,
          battlefieldProfileId: battlefieldProfile.id,
        },
        {
          center: {
            x: state.game.debug.unitPose.xUd,
            y: state.game.debug.unitPose.yUd,
          },
          widthUd: state.game.debug.unitDimensions.widthUd,
          depthUd: state.game.debug.unitDimensions.depthUd,
          rotationRadians: state.game.debug.unitPose.rotationRadians,
          battlefieldProfileId: battlefieldProfile.id,
        },
      )
    : null;
  const debugUnitStyle = state.game.debug.isActive
    ? [
        `left:${(state.game.debug.unitPose.xUd / battlefieldProfile.widthUd) * 100}%`,
        `top:${(state.game.debug.unitPose.yUd / battlefieldProfile.heightUd) * 100}%`,
        `width:${(state.game.debug.unitDimensions.widthUd / battlefieldProfile.widthUd) * 100}%`,
        `height:${(state.game.debug.unitDimensions.depthUd / battlefieldProfile.heightUd) * 100}%`,
        `--debug-rotation:${state.game.debug.unitPose.rotationRadians}rad`,
      ].join(';')
    : '';
  
  const createUnitTokenStyle = (unit) => [
    `left:${(unit.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(unit.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(unit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(unit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--unit-rotation:${unit.rotationRadians ?? 0}rad`,
  ].join(';');
  
  const unitStyle = createUnitTokenStyle(testUnit);
  const worldStyle = [
    `--viewport-zoom:${viewport.zoom}`,
    `--viewport-pan-x:${viewport.panX}px`,
    `--viewport-pan-y:${viewport.panY}px`,
  ].join(';');
  return `
    <section class="battlefield-shell">
      <div class="battlefield-stage">
        <aside class="battlefield-side-panel battlefield-side-panel-left" data-panel-id="left">
          <button class="ghost-button battlefield-back-button" type="button" data-action="navigate" data-screen="main-menu">Zurueck zum Menue</button>
          ${isSetupActive ? renderAdvanceCommandPanel({
            selectedUnit,
            isSetupActive,
            roundState: state.game.round,
            setupStepId: state.game.setup.currentStepId,
            canIssueMovementCommands,
            advanceModeActive,
            slideModeActive,
            wheelModeActive,
            wheelPivotSide,
            advancePreviewUd,
            slidePreviewUd,
            wheelPreviewAngleRadians,
            wheelDistanceUd,
            previewDistanceUd,
            slideAvailable,
            remainingAdvanceBudgetUd,
            maxAdvanceUd,
            helperCopy,
            diagnostics,
            canCancelMovement,
            canConfirmMovement,
            canMarkStay,
            canShowMovementButtons,
            canUseFreeCommandPoint,
            useFreeCommandPoint,
            chargePreviewActive,
            chargeStartControlsActive,
            chargeStartOptions,
            selectedChargeStartType,
            canStartCharge,
            chargeDisabledReason,
            canStartAdjustedChargeDistanceRoll,
            canResolveEvadeAvoidanceChoice,
            evadeAvoidanceCandidates,
            evadeChoicePathStepIds,
            canResolveChargeContinuationChoice,
            minimumChargeContinuationDistanceUd,
            maximumChargeContinuationDistanceUd,
            chargeWhyItems,
            confirmActionLabel,
            confirmActionTitle,
            canToggleCommanderEngagedDiagnostic: false,
            commanderEngagedDiagnosticActive: false,
            canAttachCommander: false,
          }) : ''}
          ${renderTerrainPalette(renderState)}
          ${renderTerrainValidation(renderState)}
          ${renderSetupObjectPalette(renderState)}
          ${renderBattlePlanBoard(renderState)}
          ${renderAmbushMarkersPanel(renderState)}
          ${!isSetupActive ? renderAdvanceCommandPanel({
            selectedUnit,
            isSetupActive,
            roundState: state.game.round,
            setupStepId: state.game.setup.currentStepId,
            canIssueMovementCommands,
            advanceModeActive,
            slideModeActive,
            wheelModeActive,
            wheelPivotSide,
            advancePreviewUd,
            slidePreviewUd,
            wheelPreviewAngleRadians,
            wheelDistanceUd,
            previewDistanceUd,
            slideAvailable,
            remainingAdvanceBudgetUd,
            maxAdvanceUd,
            helperCopy,
            diagnostics,
            canCancelMovement,
            canConfirmMovement,
            canMarkStay,
            canShowMovementButtons,
            canUseFreeCommandPoint,
            useFreeCommandPoint,
            chargePreviewActive,
            chargeStartControlsActive,
            chargeStartOptions,
            selectedChargeStartType,
            canStartCharge,
            chargeDisabledReason,
            canStartAdjustedChargeDistanceRoll,
            canResolveEvadeAvoidanceChoice,
            evadeAvoidanceCandidates,
            evadeChoicePathStepIds,
            canResolveChargeContinuationChoice,
            minimumChargeContinuationDistanceUd,
            maximumChargeContinuationDistanceUd,
            chargeWhyItems,
            confirmActionLabel,
            confirmActionTitle,
            canToggleCommanderEngagedDiagnostic: Boolean(
              state.game.commandContext.currentPhaseId === 'movement'
                && state.game.commandContext.commander?.unitId,
            ),
            commanderEngagedDiagnosticActive: Boolean(state.game.commandContext.commander?.engagedInCombat),
            canAttachCommander: canStartCommanderAttach(state.game, selectedUnit),
          }) : ''}
          ${renderDeploymentSetupCard(renderState)}
        </aside>
        <div class="battlefield-center-column">
          <div class="battlefield-surface" data-battlefield-surface>
            <div class="battlefield-world" style="${worldStyle}" data-battlefield-world>
              ${showDeploymentOverlay ? renderDeploymentOverlay(renderState, battlefieldProfile) : ''}
              ${showSectorOverlay ? renderSectorOverlay() : ''}
              ${renderSetupObjects(renderState, battlefieldProfile)}
              ${renderAmbushMarkerShells(renderState, battlefieldProfile)}
              ${renderTerrainPlaceholders(renderState, battlefieldProfile)}
              ${!isSetupActive ? renderZocBands(state.game.units, movementReferenceUnit, battlefieldProfile, { showAllEnemyZoc: chargePreviewActiveForSelectedUnit }) : ''}
              ${!isSetupActive ? renderNearZocCue(state.game.units, movementReferenceUnit, battlefieldProfile, 0.5) : ''}
              ${!isSetupActive ? renderMostThreateningLine(state.game.units, movementReferenceUnit, state.game.movement.validationSnapshot, battlefieldProfile) : ''}
              ${!isSetupActive ? renderCommandStatusLine(state, movementReferenceUnit, battlefieldProfile) : ''}
              ${!isSetupActive ? getActiveCommanderRangeVisualization(state, battlefieldProfile) : ''}
              ${commanderAttachTargetingActive ? `
                <span class="battlefield-command-range-ring has-range is-attach-preview-ring" aria-hidden="true" style="${commanderAttachRangeStyle}">
                  <span class="battlefield-command-range-ring-label">Attach ${formatLengthUd(commanderAttachReachUd)} UD</span>
                </span>
              ` : ''}
              ${chargeGuideSegment && selectedUnit ? `
                ${chargeStartPose ? `
                  <div
                    class="battlefield-unit-preview ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                    aria-hidden="true"
                    ${state.game.chargePreview?.intent?.startManoeuvre?.type === 'shift-slide' ? 'data-slide-preview-handle' : ''}
                    data-unit-id="${selectedUnit.id}"
                    style="${createPreviewGhostStyle(chargeStartPose, selectedUnit, battlefieldProfile)}"
                  ></div>
                ` : ''}
                <div
                  class="battlefield-advance-reach battlefield-charge-preview-reach"
                  aria-hidden="true"
                  data-charge-preview-corridor
                  data-charge-start-type="${state.game.chargePreview?.intent?.startManoeuvre?.type ?? 'none'}"
                  style="${chargePreviewReachStyle}"
                ></div>
                <div
                  class="battlefield-unit-preview ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                  aria-hidden="true"
                  data-charge-preview-ghost
                  data-charge-start-type="${state.game.chargePreview?.intent?.startManoeuvre?.type ?? 'none'}"
                  style="${createPreviewGhostStyle(chargeGhostPose, selectedUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${evadePlanSegment && evadePlanUnit ? `
                <div
                  class="battlefield-unit-preview battlefield-evade-preview-reorientation ${evadePlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${evadePlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-evade-preview-reorientation
                  data-evade-contact-type="${evadePlan?.contactType ?? 'unknown'}"
                  style="${evadeReorientationStyle}"
                ></div>
                <div
                  class="battlefield-advance-reach battlefield-evade-preview-reach ${evadePlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-evade-preview-corridor
                  data-evade-source-status="${evadePlan?.sourceStatus ?? 'verified'}"
                  style="${evadePlanReachStyle}"
                ></div>
                <div
                  class="battlefield-unit-preview battlefield-evade-preview-ghost ${evadePlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${evadePlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-evade-preview-ghost
                  data-evade-source-status="${evadePlan?.sourceStatus ?? 'verified'}"
                  style="${createPreviewGhostStyle(evadePlan.endPose, evadePlanUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${canResolveEvadeAvoidanceChoice ? renderEvadeChoiceHandles({
                frontierNodes: evadeChoiceTree.frontierNodes,
                evadePlan,
                evadePlanUnit,
                battlefieldProfile,
              }) : ''}
              ${canResolveEvadeAvoidanceChoice ? renderEvadeChoiceGhosts({
                evadeAvoidanceCandidates: evadeChoiceTree.visibleCandidates,
                evadePlanUnit,
                battlefieldProfile,
              }) : ''}
              ${chargeMovementPlanSegment && chargeMovementPlanUnit ? `
                <div
                  class="battlefield-advance-reach battlefield-charge-follow-through-reach ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-corridor
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${chargeMovementPlanReachStyle}"
                ></div>
                <div
                  class="battlefield-unit-preview battlefield-charge-follow-through-ghost ${chargeMovementPlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-ghost
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${createPreviewGhostStyle(chargeMovementPlan.endPose, chargeMovementPlanUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${chargeContinuationMinimumSegment && chargeMovementPlanUnit ? `
                <div
                  class="battlefield-advance-reach battlefield-charge-follow-through-reach is-minimum ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-minimum-corridor
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${chargeContinuationMinimumReachStyle}"
                ></div>
                <div
                  class="battlefield-unit-preview battlefield-charge-follow-through-ghost is-minimum ${chargeMovementPlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} ${chargeMovementPlan?.sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
                  aria-hidden="true"
                  data-charge-follow-through-minimum-ghost
                  data-charge-follow-through-source-status="${chargeMovementPlan?.sourceStatus ?? 'verified'}"
                  style="${createPreviewGhostStyle(chargeMovementPlan.continuationChoice.minimumEndPose, chargeMovementPlanUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${advanceModeActive ? `<div class="battlefield-advance-reach" aria-hidden="true" style="${advanceReachStyle}"></div>` : ''}
              ${selectedUnit && committedPreviewTrailSegments.length > 0 ? committedPreviewTrailSegments.map((segment) => `
                <div
                  class="battlefield-unit-preview is-trail ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                  aria-hidden="true"
                  style="${createPreviewGhostStyle(segment.endPose, selectedUnit, battlefieldProfile)}"
                ></div>
              `).join('') : ''}
              ${selectedUnit && state.game.movement.preview.status === 'accepted' && state.game.movement.preview.segments.length > 0 ? `
                <div
                  class="battlefield-unit-preview"
                  aria-hidden="true"
                  ${advanceModeActive ? 'data-advance-preview-handle' : ''}
                  ${slideModeActive ? 'data-slide-preview-handle' : ''}
                  data-unit-id="${selectedUnit.id}"
                  style="${previewUnitStyle}"
                ></div>
              ` : ''}
              ${selectedUnit && commanderGhostPose ? `
                <div
                  class="battlefield-unit-preview ${selectedUnit.baseShape === 'circle' ? 'is-circle-base' : ''}"
                  aria-hidden="true"
                  data-unit-id="${selectedUnit.id}"
                  style="${createPreviewGhostStyle(commanderGhostPose, selectedUnit, battlefieldProfile)}"
                ></div>
              ` : ''}
              ${(wheelModeActive || (chargePreviewActiveForSelectedUnit && state.game.chargePreview?.intent?.startManoeuvre?.type === 'wheel')) && selectedUnit && leftWheelHandlePoint && rightWheelHandlePoint ? `
                <button
                  class="battlefield-wheel-handle ${highlightedWheelPivotSide === 'right' ? 'is-active' : ''}"
                  type="button"
                  aria-label="Linke vordere Ecke ziehen"
                  data-wheel-handle
                  data-unit-id="${selectedUnit.id}"
                  data-corner-side="left"
                  style="${createWheelHandleStyle(leftWheelHandlePoint, battlefieldProfile)}"
                ></button>
                <button
                  class="battlefield-wheel-handle ${highlightedWheelPivotSide === 'left' ? 'is-active' : ''}"
                  type="button"
                  aria-label="Rechte vordere Ecke ziehen"
                  data-wheel-handle
                  data-unit-id="${selectedUnit.id}"
                  data-corner-side="right"
                  style="${createWheelHandleStyle(rightWheelHandlePoint, battlefieldProfile)}"
                ></button>
              ` : ''}
              ${state.game.debug.isActive ? `
                <div
                  class="battlefield-debug-unit"
                  data-debug-unit
                  title="Debug-Einheit frei ziehen"
                  style="${debugUnitStyle}"
                >
                  <span class="battlefield-debug-unit-label">${facingRelationship && state.game.debug.showFacingGeometryOverlay ? formatRelationshipLabel(facingRelationship.primaryLabel) : 'Debug'}</span>
                </div>
              ` : ''}
              ${facingRelationship && state.game.debug.showFacingGeometryOverlay ? renderFacingGeometryOverlay({ ...facingRelationship, battlefieldProfileId: battlefieldProfile.id }) : ''}
              ${state.game.units.map((unit) => `
                ${(() => {
                  const unitCssToken = toUnitCssToken(unit.id);
                  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
                  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
                  const corpsActivationRecord = state.game.commandContext.corpsActivation?.corps?.find(
                    (entry) => toCorpsSlotId(entry.corpsId) === unitCorpsSlotId && entry.ownerId === unit.owner,
                  ) ?? null;
                  const isActiveCorpsUnit = Boolean(
                    activeCorpsSlotId
                      && unitCorpsSlotId === activeCorpsSlotId
                      && unit.owner === state.game.commandContext.activePlayerId,
                  );
                  const isSpentCorpsUnit = Boolean(
                    !isActiveCorpsUnit
                      && corpsActivationRecord?.status === 'spent'
                      && unit.owner === state.game.commandContext.activePlayerId,
                  );
                  const chargeTargetCandidate = chargeTargetCandidatesByUnitId.get(unit.id) || null;
                  const commanderSpentUd = state.game.commanderFreeMovePreview?.status === 'ready'
                    && state.game.commanderFreeMovePreview.unitId === unit.id
                    ? Number(state.game.commanderFreeMovePreview.nextSpentUd ?? unit.advanceUsedUd ?? 0)
                    : Number(unit.advanceUsedUd ?? 0);
                  const isCommanderFreeMoveReady = Boolean(
                    !isSetupActive
                      && state.game.selectedUnitId === unit.id
                      && state.game.commandContext.currentPhaseId === 'movement'
                      && unit.isCommander
                      && !unit.hasIncludedCommander
                      && Math.max(0, 5 - commanderSpentUd) > 0
                      && unit.owner === state.game.commandContext.activePlayerId
                      && isActiveCorpsUnit
                      && !advanceModeActive
                      && !slideModeActive
                      && !wheelModeActive,
                  );
                  const hasMovedThisPhase = (unit.advanceUsedUd ?? 0) > 0 || Boolean(unit.slideUsedThisMovementPhase);
                  const hasStayedThisPhase = Boolean(unit.stayedThisMovementPhase);
                  const hasMandatoryMovementPending = Boolean(unit.mandatoryMovementPending ?? unit.mustMoveThisPhase);
                  const hasMandatoryMovementResolved = Boolean(unit.mandatoryMovementResolved);
                  const isAttachTarget = Boolean(
                    commanderAttachTargetingActive
                      && canAttachCommanderToUnit(state.game, unit, selectedUnit)
                  );
                  const isAttachTargetSelected = Boolean(
                    selectedUnit
                      && state.game.commanderFreeMovePreview?.mode === 'attach'
                      && state.game.commanderFreeMovePreview?.targetUnitId === unit.id,
                  );
                  const isChargeTargetSelected = Boolean(
                    chargePreviewActiveForSelectedUnit
                      && state.game.chargePreview?.intent?.targetUnitId === unit.id,
                  );
                  const isChargeContactDefender = Boolean(
                    chargeContactEvent?.defenderId === unit.id,
                  );
                  const chargeContactClassification = isChargeContactDefender
                    ? chargeContactEvent?.classification ?? null
                    : null;
                  const selectedChargeContactSide = isChargeContactDefender
                    && state.game.chargePreview?.selectedContactSide?.defenderId === unit.id
                    ? state.game.chargePreview.selectedContactSide.side
                    : null;
                  const isChargeTargetEligible = Boolean(
                    chargeTargetingActive && chargeTargetCandidate?.status === 'eligible',
                  );
                  const isChargeTargetBlocked = Boolean(
                    (chargeTargetingActive && chargeTargetCandidate?.status === 'blocked')
                      || (isChargeTargetSelected && chargeTargetCandidate?.status === 'blocked'),
                  );
                  const chargeTargetReasonTitle = (chargeTargetingActive || isChargeTargetSelected) && chargeTargetCandidate?.reason
                    ? chargeTargetCandidate.reason
                    : '';
                  const baseUnitTitle = isTerrainStep
                    ? 'Unit auswaehlen'
                    : canDragUnitsInSetup && state.game.selectedUnitId === unit.id
                      ? 'Unit ziehen'
                      : isCommanderFreeMoveReady
                        ? 'General ziehen (max 5 UD)'
                        : 'Unit auswaehlen';
                  const suppressUnitTitleSuffix = Boolean(
                    (chargeTargetingActive && chargeTargetCandidate)
                      || isChargeTargetSelected
                      || chargeTargetReasonTitle,
                  );
                  const unitTitle = `${chargeTargetReasonTitle || baseUnitTitle}${suppressUnitTitleSuffix ? '' : unit.hasIncludedCommander ? ' (inkl. General)' : unit.isCommander ? ' (General)' : ''}`;
                  const isSelectableUnit = Boolean(
                    chargeTargetingActive
                      ? unit.id === selectedUnit?.id || chargeTargetCandidatesByUnitId.has(unit.id)
                      : chargePreviewActiveForSelectedUnit && isChargeTargetSelected
                        ? true
                        : unit.owner === state.game.commandContext.activePlayerId
                          && (!activeCorpsSlotId || unitCorpsSlotId === activeCorpsSlotId),
                  );
                  const activeCorpsStatusClass = !isActiveCorpsUnit
                    ? ''
                    : hasMandatoryMovementPending && !hasMandatoryMovementResolved && !hasMovedThisPhase && !hasStayedThisPhase
                      ? 'is-corps-unit-mandatory'
                      : hasMovedThisPhase || hasStayedThisPhase || hasMandatoryMovementResolved
                        ? 'is-corps-unit-done'
                        : 'is-corps-unit-pending';
                  const commandRangeRing = unit.commandRangeUd != null
                    ? (() => {
                      const radiusUd = Number(unit.commandRangeUd) + 0.5;
                      const diameterUd = radiusUd * 2;
                      const style = [
                        `left:${(unit.xUd / battlefieldProfile.widthUd) * 100}%`,
                        `top:${(unit.yUd / battlefieldProfile.heightUd) * 100}%`,
                        `width:${(diameterUd / battlefieldProfile.widthUd) * 100}%`,
                        `height:${(diameterUd / battlefieldProfile.heightUd) * 100}%`,
                      ].join(';');

                      return `<span class="battlefield-command-range-ring has-range for-${unitCssToken}" aria-hidden="true" style="${style}"></span>`;
                    })()
                    : `<span class="battlefield-command-range-ring no-range for-${unitCssToken}" aria-hidden="true"></span>`;

                  return `
                <button
                  class="battlefield-unit-token for-${unitCssToken} ${unit.baseShape === 'circle' ? 'is-circle-base' : ''} ${unit.isCommander ? 'is-commander' : ''} ${unit.hasIncludedCommander ? 'has-included-commander' : ''} ${isActiveCorpsUnit ? 'is-active-corps-unit' : ''} ${isSpentCorpsUnit ? 'is-spent-corps-unit' : ''} ${!isSelectableUnit ? 'is-selection-locked' : ''} ${activeCorpsStatusClass} ${isAttachTarget ? 'is-attach-target' : ''} ${isAttachTargetSelected ? 'is-attach-target-selected' : ''} ${isChargeTargetEligible ? 'is-charge-target-eligible' : ''} ${isChargeTargetBlocked ? 'is-charge-target-blocked' : ''} ${isChargeTargetSelected ? 'is-charge-target-selected' : ''} ${state.game.selectedUnitId === unit.id ? 'is-selected' : ''} ${advanceModeActive && state.game.selectedUnitId === unit.id ? 'is-advance-ready' : ''} ${wheelModeActive && state.game.selectedUnitId === unit.id ? 'is-wheel-ready' : ''} ${(canDragUnitsInSetup || isCommanderFreeMoveReady) && state.game.selectedUnitId === unit.id ? 'is-setup-placeable' : ''}"
                  type="button"
                  ${isSelectableUnit ? '' : 'disabled'}
                  aria-pressed="${state.game.selectedUnitId === unit.id}"
                  data-action="select-unit"
                  data-unit-id="${unit.id}"
                  data-charge-target-status="${chargeTargetingActive ? chargeTargetCandidate?.status ?? 'none' : isChargeTargetSelected ? 'selected' : 'none'}"
                  data-selected-charge-target-current-status="${isChargeTargetSelected ? chargeTargetCandidate?.status ?? 'unknown' : 'none'}"
                  data-charge-contact-classification="${chargeContactClassification?.type ?? 'none'}"
                  data-selected-charge-contact-side="${selectedChargeContactSide ?? 'none'}"
                  title="${escapeHtml(unitTitle)}"
                  style="--token-color:${unit.owner === 'player-1' ? state.shell.settings.playerColor : '#a8a8a8'};${createUnitTokenStyle(unit)}"
                >${activeCorpsStatusClass === 'is-corps-unit-mandatory' ? '<span class="battlefield-unit-status-badge is-mandatory" aria-hidden="true">!</span>' : ''}${renderChargeContactSideMarkers(chargeContactClassification, selectedChargeContactSide)}</button>
                ${commandRangeRing}
              `;
                })()}
              `).join('')}
            </div>
          </div>
        </div>
        ${renderBattlefieldRightPanel({
          state,
          battlefieldProfile,
          showScaleOverlay,
          unitStyle,
          isDeploymentSetupStep,
          overlayHotkey,
          testUnit,
          selectedUnit,
          selectedUnitRotationRadians,
          facingRelationship,
        })}
        ${renderSetupGuideDialog(state)}
        ${renderRoundDialog(state)}
        ${renderChargeReactionDialog(state)}
        ${renderChargeBranchDistanceDialog(state)}
        ${renderEvadeChoiceHandoffDialog(state)}
      </div>
    </section>
  `;
}

function getChargeContactSideStates(classification, selectedContactSide = null) {
  if (!classification?.type) {
    return null;
  }

  const sideStates = {
    front: 'not-attacked',
    rear: 'not-attacked',
    left: 'not-attacked',
    right: 'not-attacked',
  };

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    sideStates.front = 'attacked';
    return sideStates;
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    sideStates.rear = 'attacked';
    return sideStates;
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK) {
    if (classification.flankSide === 'left') {
      sideStates.left = 'attacked';
    } else if (classification.flankSide === 'right') {
      sideStates.right = 'attacked';
    }
    return sideStates;
  }

  if (classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK) {
    const possibleSides = ['rear'];
    if (classification.flankSide === 'left') {
      possibleSides.push('left');
    } else if (classification.flankSide === 'right') {
      possibleSides.push('right');
    }

    if (possibleSides.includes(selectedContactSide)) {
      sideStates[selectedContactSide] = 'attacked';
      return sideStates;
    }

    sideStates.rear = 'possible';
    if (classification.flankSide === 'left') {
      sideStates.left = 'possible';
    } else if (classification.flankSide === 'right') {
      sideStates.right = 'possible';
    }
    return sideStates;
  }

  return null;
}

function renderChargeContactSideMarkers(classification, selectedContactSide = null) {
  const sideStates = getChargeContactSideStates(classification, selectedContactSide);
  if (!sideStates) {
    return '';
  }

  const createSideMarkerMarkup = (side, state) => {
    const isSelectable = state === 'possible'
      || (
        classification.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK
        && selectedContactSide === side
        && state === 'attacked'
      );
    const selectableAttributes = isSelectable
      ? ' data-charge-contact-side-selectable="true"'
      : '';

    return `<span class="battlefield-charge-contact-side is-${side} is-${state}" data-charge-contact-side="${side}" data-charge-contact-state="${state}"${selectableAttributes}></span>`;
  };

  return `
    <span class="battlefield-charge-contact-sides" aria-hidden="true" data-charge-contact-classification="${classification.type}">
      ${createSideMarkerMarkup('front', sideStates.front)}
      ${createSideMarkerMarkup('rear', sideStates.rear)}
      ${createSideMarkerMarkup('left', sideStates.left)}
      ${createSideMarkerMarkup('right', sideStates.right)}
    </span>
  `;
}