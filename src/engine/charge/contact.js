import { getFootprintCommandRangeMeasurement } from '../command/range.js';
import { classifyChargeContact } from './classification.js';
import {
  createAdvancePreview,
  createMovementPreview,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SOURCE_STATUSES,
  splitMovementPreviewIntoPathSamples,
} from '../movement/index.js';

export const CHARGE_CONTACT_EVENT_TYPES = {
  TARGET_CONTACT: 'target-contact',
  EARLIER_ENEMY_CONTACT: 'earlier-enemy-contact',
  FRIENDLY_BLOCKER: 'friendly-blocker',
};

export const CHARGE_CONTACT_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

const CHARGE_CONTACT_TYPE_PRIORITY = {
  [CHARGE_CONTACT_EVENT_TYPES.FRIENDLY_BLOCKER]: 0,
  [CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT]: 1,
  [CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT]: 2,
};

const CHARGE_CONTACT_EPSILON = 1e-6;
const CHARGE_CONTACT_SAMPLES_PER_UD = 8;
const CHARGE_CONTACT_STEP_UD = 0.1;
const CHARGE_CONTACT_REFINEMENT_STEPS = 12;

export function createChargeContactEvent(overrides = {}) {
  return {
    type: overrides.type ?? CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT,
    chargerId: overrides.chargerId ?? null,
    defenderId: overrides.defenderId ?? null,
    selectedTargetId: overrides.selectedTargetId ?? null,
    segmentIndex: Number.isInteger(overrides.segmentIndex) ? overrides.segmentIndex : -1,
    pathSampleIndex: Number.isInteger(overrides.pathSampleIndex) ? overrides.pathSampleIndex : -1,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : 0,
    guideDistanceUd: Number.isFinite(overrides.guideDistanceUd) ? overrides.guideDistanceUd : 0,
    pose: overrides.pose ?? null,
    contactSnapshot: overrides.contactSnapshot ?? null,
    classification: overrides.classification ?? null,
    sourceStatus: overrides.sourceStatus ?? CHARGE_CONTACT_SOURCE_STATUSES.VERIFIED,
  };
}

export function createChargeContactDiagnostic(overrides = {}) {
  return {
    code: overrides.code ?? 'charge.contact',
    status: overrides.status ?? 'info',
    text: overrides.text ?? '',
    sourceStatus: overrides.sourceStatus ?? CHARGE_CONTACT_SOURCE_STATUSES.VERIFIED,
  };
}

function interpolateNumber(start, end, ratio) {
  return start + ((end - start) * ratio);
}

function interpolatePose(startPose, endPose, ratio) {
  return {
    xUd: interpolateNumber(startPose.xUd, endPose.xUd, ratio),
    yUd: interpolateNumber(startPose.yUd, endPose.yUd, ratio),
    rotationRadians: interpolateNumber(startPose.rotationRadians ?? 0, endPose.rotationRadians ?? 0, ratio),
  };
}

function createAcceptedPreview(segments) {
  return createMovementPreview({
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments,
    explanations: ['Charge contact preview is ready.'],
    sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
  });
}

function createPosedUnit(baseUnit, pose) {
  return {
    ...baseUnit,
    xUd: pose.xUd,
    yUd: pose.yUd,
    rotationRadians: pose.rotationRadians ?? 0,
  };
}

function createUnitPoseSnapshot(unit) {
  if (!unit) {
    return null;
  }

  return {
    xUd: Number(unit.xUd ?? 0),
    yUd: Number(unit.yUd ?? 0),
    rotationRadians: Number(unit.rotationRadians ?? 0),
  };
}

function createGuidePoseSnapshot(guideSegment, fallbackPose) {
  if (guideSegment) {
    return {
      xUd: Number(guideSegment.xUd ?? 0),
      yUd: Number(guideSegment.yUd ?? 0),
      rotationRadians: Number(guideSegment.rotationRadians ?? 0),
    };
  }

  if (!fallbackPose) {
    return null;
  }

  return {
    xUd: Number(fallbackPose.xUd ?? 0),
    yUd: Number(fallbackPose.yUd ?? 0),
    rotationRadians: Number(fallbackPose.rotationRadians ?? 0),
  };
}

function doesUnitsOverlap(leftUnit, rightUnit) {
  return getFootprintCommandRangeMeasurement(leftUnit, rightUnit).distanceUd <= CHARGE_CONTACT_EPSILON;
}

function getGuideSegment(pathSegments) {
  return (pathSegments ?? []).find((segment) => segment.kind === 'charge-direction-guide') ?? null;
}

function getPrefixSegments(pathSegments) {
  return (pathSegments ?? []).filter((segment) => segment.commandId);
}

function getSegmentDistanceUd(segment) {
  return Math.max(segment?.distance?.resolvedUd ?? 0, segment?.distance?.requestedUd ?? 0, 0);
}

function getPreviewDistanceBeforeSegment(preview, segmentIndex) {
  return preview.segments
    .slice(0, segmentIndex)
    .reduce((totalDistance, segment) => totalDistance + getSegmentDistanceUd(segment), 0);
}

function getSampleDistanceUd(preview, sample) {
  const baseDistanceUd = getPreviewDistanceBeforeSegment(preview, sample.segmentIndex ?? 0);
  const segmentDistanceUd = getSegmentDistanceUd(preview.segments[sample.segmentIndex ?? 0]);

  return Number((baseDistanceUd + (segmentDistanceUd * (sample.ratio ?? 0))).toFixed(3));
}

function createRefinedSample(baseSample, pose, distanceUd) {
  return {
    ...baseSample,
    pose,
    distanceUd: Number(distanceUd.toFixed(3)),
  };
}

function refineContactSample({ preview, selectedUnit, otherUnit, previousSample, currentSample }) {
  if (!previousSample || !currentSample) {
    return createRefinedSample(
      currentSample,
      currentSample?.pose ?? null,
      getSampleDistanceUd(preview, currentSample),
    );
  }

  if (previousSample.segmentIndex !== currentSample.segmentIndex) {
    return createRefinedSample(
      currentSample,
      currentSample.pose,
      getSampleDistanceUd(preview, currentSample),
    );
  }

  let leftPose = previousSample.pose;
  let rightPose = currentSample.pose;
  let leftDistanceUd = getSampleDistanceUd(preview, previousSample);
  let rightDistanceUd = getSampleDistanceUd(preview, currentSample);

  for (let index = 0; index < CHARGE_CONTACT_REFINEMENT_STEPS; index += 1) {
    const midPose = interpolatePose(leftPose, rightPose, 0.5);
    const midDistanceUd = interpolateNumber(leftDistanceUd, rightDistanceUd, 0.5);
    const posedUnit = createPosedUnit(selectedUnit, midPose);

    if (doesUnitsOverlap(posedUnit, otherUnit)) {
      rightPose = midPose;
      rightDistanceUd = midDistanceUd;
    } else {
      leftPose = midPose;
      leftDistanceUd = midDistanceUd;
    }
  }

  return createRefinedSample(currentSample, rightPose, rightDistanceUd);
}

function replaceGuideDistance(pathSegments, nextDistanceUd) {
  return (pathSegments ?? []).map((segment) => (segment.kind === 'charge-direction-guide'
    ? {
        ...segment,
        distanceUd: Number(Math.max(0, nextDistanceUd).toFixed(3)),
      }
    : segment));
}

function createContactSnapshot({ selectedUnit, targetUnit, defenderUnit, sample, guideSegment }) {
  return {
    chargerOriginPose: createUnitPoseSnapshot(selectedUnit),
    chargerStartPose: createGuidePoseSnapshot(guideSegment, sample?.pose ?? null),
    chargerContactPose: sample?.pose ?? null,
    defenderPose: createUnitPoseSnapshot(defenderUnit),
    selectedTargetPose: createUnitPoseSnapshot(targetUnit),
    frozenDirectionRadians: Number(guideSegment?.rotationRadians ?? sample?.pose?.rotationRadians ?? selectedUnit?.rotationRadians ?? 0),
  };
}

function createContactClassification({ selectedUnit, defenderUnit, contactSnapshot }) {
  return classifyChargeContact({
    chargerUnit: selectedUnit,
    defenderUnit,
    contactSnapshot,
  });
}

function buildChargePathPreview({ selectedUnit, pathSegments, battlefieldProfile }) {
  const guideSegment = getGuideSegment(pathSegments);
  const prefixSegments = getPrefixSegments(pathSegments);

  if (!guideSegment) {
    return {
      preview: createAcceptedPreview(prefixSegments),
      guideSegment: null,
      acceptedGuideDistanceUd: 0,
      edgeLimited: false,
      prefixDistanceUd: prefixSegments.reduce((totalDistance, segment) => totalDistance + getSegmentDistanceUd(segment), 0),
    };
  }

  const startUnit = createPosedUnit(selectedUnit, {
    xUd: guideSegment.xUd,
    yUd: guideSegment.yUd,
    rotationRadians: guideSegment.rotationRadians ?? selectedUnit.rotationRadians ?? 0,
  });

  let acceptedGuideDistanceUd = Number(guideSegment.distanceUd ?? 0);
  let advancePreview = createAdvancePreview(startUnit, acceptedGuideDistanceUd, battlefieldProfile);
  while (advancePreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED && acceptedGuideDistanceUd > CHARGE_CONTACT_EPSILON) {
    acceptedGuideDistanceUd = Number(Math.max(0, acceptedGuideDistanceUd - CHARGE_CONTACT_STEP_UD).toFixed(3));
    advancePreview = createAdvancePreview(startUnit, acceptedGuideDistanceUd, battlefieldProfile);
  }

  const acceptedAdvanceSegments = advancePreview.status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED
    ? advancePreview.segments
    : [];

  return {
    preview: createAcceptedPreview([
      ...prefixSegments,
      ...acceptedAdvanceSegments,
    ]),
    guideSegment,
    acceptedGuideDistanceUd,
    edgeLimited: acceptedGuideDistanceUd + CHARGE_CONTACT_EPSILON < Number(guideSegment.distanceUd ?? 0),
    prefixDistanceUd: prefixSegments.reduce((totalDistance, segment) => totalDistance + getSegmentDistanceUd(segment), 0),
  };
}

function buildTargetContactEvent({ selectedUnit, targetUnit, sample, preview, prefixDistanceUd, guideSegment }) {
  const distanceUd = sample.distanceUd ?? getSampleDistanceUd(preview, sample);
  const guideDistanceUd = guideSegment
    ? Number(Math.max(0, Math.min(guideSegment.distanceUd, distanceUd - prefixDistanceUd)).toFixed(3))
    : 0;
  const contactSnapshot = createContactSnapshot({
    selectedUnit,
    targetUnit,
    defenderUnit: targetUnit,
    sample,
    guideSegment,
  });

  return createChargeContactEvent({
    type: CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT,
    chargerId: selectedUnit.id,
    defenderId: targetUnit.id,
    selectedTargetId: targetUnit.id,
    segmentIndex: sample.segmentIndex,
    pathSampleIndex: sample.pathSampleIndex,
    distanceUd,
    guideDistanceUd,
    pose: sample.pose,
    contactSnapshot,
    classification: createContactClassification({
      selectedUnit,
      defenderUnit: targetUnit,
      contactSnapshot,
    }),
    sourceStatus: CHARGE_CONTACT_SOURCE_STATUSES.VERIFIED,
  });
}

function buildBlockingContactEvent({ type, selectedUnit, targetUnit, blockerUnit, sample, preview, prefixDistanceUd, guideSegment }) {
  const distanceUd = sample.distanceUd ?? getSampleDistanceUd(preview, sample);
  const guideDistanceUd = guideSegment
    ? Number(Math.max(0, Math.min(guideSegment.distanceUd, distanceUd - prefixDistanceUd)).toFixed(3))
    : 0;
  const contactSnapshot = createContactSnapshot({
    selectedUnit,
    targetUnit,
    defenderUnit: blockerUnit,
    sample,
    guideSegment,
  });

  return createChargeContactEvent({
    type,
    chargerId: selectedUnit.id,
    defenderId: blockerUnit.id,
    selectedTargetId: targetUnit.id,
    segmentIndex: sample.segmentIndex,
    pathSampleIndex: sample.pathSampleIndex,
    distanceUd,
    guideDistanceUd,
    pose: sample.pose,
    contactSnapshot,
    classification: createContactClassification({
      selectedUnit,
      defenderUnit: blockerUnit,
      contactSnapshot,
    }),
    sourceStatus: CHARGE_CONTACT_SOURCE_STATUSES.VERIFIED,
  });
}

function createContactDiagnostic(event) {
  if (!event) {
    return [];
  }

  if (event.type === CHARGE_CONTACT_EVENT_TYPES.TARGET_CONTACT) {
    return [
      createChargeContactDiagnostic({
        code: 'charge.contact.target',
        status: 'ok',
        text: `Erster Kontakt: ${event.defenderId} nach ${event.guideDistanceUd} UD geradem Charge-Vorlauf.`,
      }),
    ];
  }

  if (event.type === CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT) {
    return [
      createChargeContactDiagnostic({
        code: 'charge.contact.earlier-enemy',
        status: 'blocked',
        text: `Erster Kontakt trifft ${event.defenderId} vor dem ausgewaehlten Ziel nach ${event.guideDistanceUd} UD geradem Charge-Vorlauf.`,
      }),
    ];
  }

  return [
    createChargeContactDiagnostic({
      code: 'charge.contact.friendly-blocker',
      status: 'blocked',
      text: `Erster Kontakt trifft ${event.defenderId} als eigenen Blocker nach ${event.guideDistanceUd} UD geradem Charge-Vorlauf.`,
    }),
  ];
}

function compareChargeContactEvents(leftEvent, rightEvent) {
  const distanceDifference = Number(leftEvent.distanceUd ?? 0) - Number(rightEvent.distanceUd ?? 0);
  if (Math.abs(distanceDifference) > CHARGE_CONTACT_EPSILON) {
    return distanceDifference;
  }

  const priorityDifference = (CHARGE_CONTACT_TYPE_PRIORITY[leftEvent.type] ?? Number.MAX_SAFE_INTEGER)
    - (CHARGE_CONTACT_TYPE_PRIORITY[rightEvent.type] ?? Number.MAX_SAFE_INTEGER);
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return String(leftEvent.defenderId ?? '').localeCompare(String(rightEvent.defenderId ?? ''));
}

function selectEarliestContactEvent(events) {
  return [...events].sort(compareChargeContactEvents)[0] ?? null;
}

export function resolveChargeContactState({ selectedUnit, targetUnit, pathSegments, battlefieldProfile, units }) {
  if (!selectedUnit || !targetUnit || !Array.isArray(pathSegments) || pathSegments.length === 0) {
    return {
      pathSegments: Array.isArray(pathSegments) ? pathSegments : [],
      contactEvents: [],
      diagnostics: [],
    };
  }

  const { preview, guideSegment, acceptedGuideDistanceUd, edgeLimited, prefixDistanceUd } = buildChargePathPreview({
    selectedUnit,
    pathSegments,
    battlefieldProfile,
  });
  const pathSamples = splitMovementPreviewIntoPathSamples(preview, {
    samplesPerUd: CHARGE_CONTACT_SAMPLES_PER_UD,
    minSamplesPerSegment: 2,
  }).map((sample, pathSampleIndex) => ({
    ...sample,
    pathSampleIndex,
  }));
  const blockerUnits = (units ?? []).filter((unit) => unit.id !== selectedUnit.id && unit.id !== targetUnit.id);

  for (let index = 0; index < pathSamples.length; index += 1) {
    const sample = pathSamples[index];
    const previousSample = index > 0 ? pathSamples[index - 1] : null;
    const posedUnit = createPosedUnit(selectedUnit, sample.pose);
    const candidateEvents = [];

    blockerUnits
      .filter((unit) => unit.owner === selectedUnit.owner && doesUnitsOverlap(posedUnit, unit))
      .forEach((friendlyBlocker) => {
        const refinedSample = refineContactSample({
          preview,
          selectedUnit,
          otherUnit: friendlyBlocker,
          previousSample,
          currentSample: sample,
        });
        candidateEvents.push(buildBlockingContactEvent({
          type: CHARGE_CONTACT_EVENT_TYPES.FRIENDLY_BLOCKER,
          selectedUnit,
          targetUnit,
          blockerUnit: friendlyBlocker,
          sample: refinedSample,
          preview,
          prefixDistanceUd,
          guideSegment,
        }));
      });

    blockerUnits
      .filter((unit) => unit.owner !== selectedUnit.owner && doesUnitsOverlap(posedUnit, unit))
      .forEach((earlierEnemy) => {
        const refinedSample = refineContactSample({
          preview,
          selectedUnit,
          otherUnit: earlierEnemy,
          previousSample,
          currentSample: sample,
        });
        candidateEvents.push(buildBlockingContactEvent({
          type: CHARGE_CONTACT_EVENT_TYPES.EARLIER_ENEMY_CONTACT,
          selectedUnit,
          targetUnit,
          blockerUnit: earlierEnemy,
          sample: refinedSample,
          preview,
          prefixDistanceUd,
          guideSegment,
        }));
      });

    if (doesUnitsOverlap(posedUnit, targetUnit)) {
      const refinedSample = refineContactSample({
        preview,
        selectedUnit,
        otherUnit: targetUnit,
        previousSample,
        currentSample: sample,
      });
      candidateEvents.push(buildTargetContactEvent({
        selectedUnit,
        targetUnit,
        sample: refinedSample,
        preview,
        prefixDistanceUd,
        guideSegment,
      }));
    }

    const event = selectEarliestContactEvent(candidateEvents);
    if (event) {
      return {
        pathSegments: replaceGuideDistance(pathSegments, event.guideDistanceUd),
        contactEvents: [event],
        diagnostics: createContactDiagnostic(event),
      };
    }
  }

  return {
    pathSegments: edgeLimited ? replaceGuideDistance(pathSegments, acceptedGuideDistanceUd) : pathSegments,
    contactEvents: [],
    diagnostics: edgeLimited
      ? [
          createChargeContactDiagnostic({
            code: 'charge.contact.table-edge',
            status: 'blocked',
            text: 'Der gerade Charge-Vorlauf endet vor Kontakt an der Spielfeldkante.',
          }),
        ]
      : [],
  };
}