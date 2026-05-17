import { createMovementPreview, MOVEMENT_PREVIEW_STATUSES } from './model.js';
import { getEnemyZocContacts, ZOC_SOURCE_STATUSES } from '../zoc/geometry.js';
import { selectMostThreateningEnemy } from '../zoc/most-threatening.js';

export const MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

const DEFAULT_SAMPLES_PER_UD = 4;

function normalizeSourceStatus(status) {
  return Object.values(MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES).includes(status)
    ? status
    : MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK;
}

function interpolateNumber(start, end, ratio) {
  return start + (end - start) * ratio;
}

function interpolatePose(startPose, endPose, ratio) {
  return {
    xUd: interpolateNumber(startPose.xUd, endPose.xUd, ratio),
    yUd: interpolateNumber(startPose.yUd, endPose.yUd, ratio),
    rotationRadians: interpolateNumber(startPose.rotationRadians ?? 0, endPose.rotationRadians ?? 0, ratio),
  };
}

function getSegmentSampleCount(segment, options = {}) {
  const samplesPerUd = Number.isFinite(options.samplesPerUd)
    ? Math.max(options.samplesPerUd, 1)
    : DEFAULT_SAMPLES_PER_UD;
  const minSamplesPerSegment = Number.isFinite(options.minSamplesPerSegment)
    ? Math.max(options.minSamplesPerSegment, 1)
    : 1;
  const distanceUd = Math.max(segment?.distance?.resolvedUd ?? 0, segment?.distance?.requestedUd ?? 0, 0);

  return Math.max(minSamplesPerSegment, Math.ceil(distanceUd * samplesPerUd));
}

function createMovingPoseUnit(baseUnit, pose) {
  return {
    id: baseUnit.id,
    owner: baseUnit.owner,
    widthUd: baseUnit.widthUd,
    depthUd: baseUnit.depthUd,
    xUd: pose.xUd,
    yUd: pose.yUd,
    rotationRadians: pose.rotationRadians ?? 0,
  };
}

export function splitMovementSegmentIntoPoseSamples(segment, options = {}) {
  const sampleCount = getSegmentSampleCount(segment, options);
  const includeStart = options.includeStart !== false;
  const poses = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    if (!includeStart && index === 0) {
      continue;
    }

    const ratio = sampleCount === 0 ? 1 : index / sampleCount;
    poses.push({
      segmentIndex: options.segmentIndex ?? 0,
      segmentCommandId: segment.commandId,
      sampleIndex: index,
      sampleCount,
      ratio,
      pose: interpolatePose(segment.startPose, segment.endPose, ratio),
    });
  }

  return poses;
}

export function splitMovementPreviewIntoPathSamples(preview, options = {}) {
  const normalizedPreview = createMovementPreview(preview);
  if (normalizedPreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED || normalizedPreview.segments.length === 0) {
    return [];
  }

  const samples = [];
  normalizedPreview.segments.forEach((segment, segmentIndex) => {
    const segmentSamples = splitMovementSegmentIntoPoseSamples(segment, {
      ...options,
      segmentIndex,
      includeStart: segmentIndex === 0,
    });
    samples.push(...segmentSamples);
  });

  return samples;
}

export function evaluateZocTransitionsForMovementPreview({
  preview,
  movingUnit,
  enemyUnits,
  samplesPerUd,
  zocRangeUd,
} = {}) {
  if (!movingUnit || !Array.isArray(enemyUnits)) {
    return {
      sourceStatus: MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      sourceRefs: ['zoc.mid-segment-entry-exit-detection'],
      samples: [],
      transitions: [],
      startsInEnemyZoc: false,
      endsInEnemyZoc: false,
      encountersEnemyZoc: false,
    };
  }

  const rawSamples = splitMovementPreviewIntoPathSamples(preview, { samplesPerUd });
  const samples = rawSamples.map((sample) => {
    const posedUnit = createMovingPoseUnit(movingUnit, sample.pose);
    const contacts = getEnemyZocContacts(enemyUnits, posedUnit, { rangeUd: zocRangeUd });
    const selection = selectMostThreateningEnemy(contacts);

    return {
      ...sample,
      inEnemyZoc: contacts.length > 0,
      mostThreateningEnemyId: selection.mostThreateningEnemyId,
      zocContactCount: contacts.length,
      mostThreatening: selection,
    };
  });

  const transitions = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (previous.inEnemyZoc !== current.inEnemyZoc || previous.mostThreateningEnemyId !== current.mostThreateningEnemyId) {
      transitions.push({
        sampleIndex: index,
        segmentIndex: current.segmentIndex,
        fromInEnemyZoc: previous.inEnemyZoc,
        toInEnemyZoc: current.inEnemyZoc,
        fromMostThreateningEnemyId: previous.mostThreateningEnemyId,
        toMostThreateningEnemyId: current.mostThreateningEnemyId,
      });
    }
  }

  const sourceStatus = samples.some(
    (sample) => normalizeSourceStatus(sample.mostThreatening?.sourceStatus) === ZOC_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  )
    ? MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
    : MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.VERIFIED;

  return {
    sourceStatus,
    sourceRefs: ['zoc.mid-segment-entry-exit-detection', 'zoc.most-threatening-priority-and-tie-breaks'],
    samples,
    transitions,
    startsInEnemyZoc: samples[0]?.inEnemyZoc ?? false,
    endsInEnemyZoc: samples[samples.length - 1]?.inEnemyZoc ?? false,
    encountersEnemyZoc: samples.some((sample) => sample.inEnemyZoc),
  };
}