import { localPointToWorldPoint } from '../engine/geometry/index.js';
import { getEvadeStepIdPart } from '../engine/charge/index.js';
import { getEvadeAvoidanceChoiceLabel } from './battlefield-command-panel.js';
import {
  createLinearReachStyle,
  createPreviewGhostStyle,
  createWheelHandleStyle,
  escapeHtml,
} from './battlefield-render-helpers.js';

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

export function getEvadeRenderablePathSegments(evadePlan) {
  if (Array.isArray(evadePlan?.pathSegments) && evadePlan.pathSegments.length > 0) {
    return evadePlan.pathSegments.filter(Boolean);
  }

  const fallbackSegment = createEvadePlanSegment(evadePlan);
  return fallbackSegment ? [fallbackSegment] : [];
}

export function renderEvadePathReaches({
  pathSegments = [],
  evadeUnit,
  battlefieldProfile,
  sourceStatus = 'verified',
  dataScope = 'preview',
}) {
  if (!evadeUnit || !Array.isArray(pathSegments) || pathSegments.length === 0) {
    return '';
  }

  return pathSegments
    .filter((segment) => segment?.kind === 'evade-straight' && Number(segment.distanceUd ?? 0) > 0)
    .map((segment, index) => `
      <div
        class="battlefield-advance-reach battlefield-evade-preview-reach ${sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
        aria-hidden="true"
        data-evade-${dataScope}-corridor
        data-evade-${dataScope}-segment-kind="${segment.kind}"
        data-evade-${dataScope}-segment-index="${index}"
        data-evade-source-status="${sourceStatus}"
        style="${createLinearReachStyle(segment, evadeUnit, battlefieldProfile)}"
      ></div>
    `)
    .join('');
}

export function renderEvadePathTrails({
  pathSegments = [],
  evadeUnit,
  battlefieldProfile,
  sourceStatus = 'verified',
  dataScope = 'preview',
}) {
  if (!evadeUnit || !Array.isArray(pathSegments) || pathSegments.length === 0) {
    return '';
  }

  return pathSegments
    .filter((segment) => segment?.endPose)
    .map((segment, index) => `
      <div
        class="battlefield-unit-preview battlefield-evade-choice-trail ${evadeUnit.baseShape === 'circle' ? 'is-circle-base' : ''} is-trail ${sourceStatus === 'needs-source-check' ? 'is-source-open' : ''}"
        aria-hidden="true"
        data-evade-${dataScope}-trail
        data-evade-${dataScope}-segment-kind="${segment.kind ?? 'evade-step'}"
        data-evade-${dataScope}-segment-index="${index}"
        data-evade-source-status="${sourceStatus}"
        style="${createPreviewGhostStyle(segment.endPose, evadeUnit, battlefieldProfile)}"
      ></div>
    `)
    .join('');
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

function getPoseDistanceUd(startPose = null, endPose = null) {
  if (!startPose || !endPose) {
    return 0;
  }

  return Number(Math.hypot(
    Number(endPose.xUd ?? 0) - Number(startPose.xUd ?? 0),
    Number(endPose.yUd ?? 0) - Number(startPose.yUd ?? 0),
  ).toFixed(3));
}

function getEvadeCandidatePathSegments({ candidate, reorientedPose }) {
  if (!candidate?.endPose || !reorientedPose) {
    return [];
  }

  const steps = getEvadeCandidateAvoidanceSteps(candidate).filter(Boolean);
  const pathSegments = [];
  let currentPose = reorientedPose;

  for (const step of steps) {
    if (!step?.endPose) {
      continue;
    }

    const stepStartPose = step.startPose ?? currentPose;
    const preStepStraightDistanceUd = getPoseDistanceUd(currentPose, stepStartPose);
    if (preStepStraightDistanceUd > 0) {
      pathSegments.push({
        kind: 'evade-straight',
        xUd: Number(currentPose.xUd ?? 0),
        yUd: Number(currentPose.yUd ?? 0),
        rotationRadians: Number(currentPose.rotationRadians ?? 0),
        distanceUd: preStepStraightDistanceUd,
        endPose: stepStartPose,
      });
    }

    pathSegments.push({
      kind: step.type === 'slide'
        ? 'evade-slide'
        : step.type === 'direction-wheel'
          ? 'evade-direction-wheel'
          : step.type === 'obstacle-wheel'
            ? 'evade-obstacle-wheel'
            : 'evade-step',
      xUd: Number(stepStartPose.xUd ?? 0),
      yUd: Number(stepStartPose.yUd ?? 0),
      rotationRadians: Number(stepStartPose.rotationRadians ?? 0),
      distanceUd: Number(step.spentDistanceUd ?? step.distanceUd ?? 0),
      side: step.side ?? null,
      pivotSide: step.pivotSide ?? null,
      angleRadians: Number.isFinite(step.angleRadians) ? step.angleRadians : null,
      endPose: step.endPose,
    });
    currentPose = step.endPose;
  }

  const finalStraightDistanceUd = getPoseDistanceUd(currentPose, candidate.endPose);
  if (finalStraightDistanceUd > 0) {
    pathSegments.push({
      kind: 'evade-straight',
      xUd: Number(currentPose.xUd ?? 0),
      yUd: Number(currentPose.yUd ?? 0),
      rotationRadians: Number(currentPose.rotationRadians ?? 0),
      distanceUd: finalStraightDistanceUd,
      endPose: candidate.endPose,
    });
  }

  return pathSegments;
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

export function getEvadeChoiceTree({ evadeAvoidanceCandidates = [], choicePathStepIds = [] }) {
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

export function renderEvadeChoiceHandles({
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
      const sourcePose = node.step?.startPose
        ?? (node.depth > 0 ? (steps[node.depth - 1]?.endPose ?? null) : evadePlan.reorientedPose);
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
  evadePlan = null,
  evadePlanUnit,
  battlefieldProfile,
}) {
  if (!evadePlan?.reorientedPose || !evadePlanUnit || !Array.isArray(evadeAvoidanceCandidates) || evadeAvoidanceCandidates.length === 0) {
    return '';
  }

  return evadeAvoidanceCandidates
    .filter((candidate) => candidate?.id)
    .map((candidate) => getEvadeCandidatePathSegments({
      candidate,
      reorientedPose: evadePlan.reorientedPose,
    }).map((segment, index) => `
      ${segment.kind === 'evade-straight' && Number(segment.distanceUd ?? 0) > 0 ? `
        <div
          class="battlefield-advance-reach battlefield-evade-preview-reach"
          aria-hidden="true"
          data-evade-candidate-corridor
          data-candidate-id="${candidate.id ?? ''}"
          data-evade-step-index="${index}"
          data-evade-candidate-segment-kind="${segment.kind}"
          style="${createLinearReachStyle(segment, evadePlanUnit, battlefieldProfile)}"
        ></div>
      ` : ''}
        <div
          class="battlefield-unit-preview battlefield-evade-choice-trail ${evadePlanUnit.baseShape === 'circle' ? 'is-circle-base' : ''} is-trail"
          aria-hidden="true"
          data-evade-candidate-trail
          data-candidate-id="${candidate.id ?? ''}"
          data-evade-step-index="${index}"
          data-evade-candidate-segment-kind="${segment.kind ?? 'evade-step'}"
          style="${createPreviewGhostStyle(segment.endPose, evadePlanUnit, battlefieldProfile)}"
        ></div>
      `).join(''))
    .join('');
}

export function renderEvadeChoiceGhosts({
  evadeAvoidanceCandidates = [],
  evadePlan = null,
  evadePlanUnit,
  battlefieldProfile,
}) {
  if (!evadePlanUnit || !Array.isArray(evadeAvoidanceCandidates) || evadeAvoidanceCandidates.length === 0) {
    return '';
  }

  return `
    ${renderEvadeChoiceTrails({
      evadeAvoidanceCandidates,
      evadePlan,
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