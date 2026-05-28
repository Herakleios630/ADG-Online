import {
  CHARGE_CONTACT_CLASSIFICATION_TYPES,
  CHARGE_CONTACT_FLANK_SIDES,
} from './classification.js';
import { createChargeGuideSegment } from './path.js';
import { resolveChargeContactState } from './contact.js';
import {
  dedupeEvadeCandidates,
  getDirectBlockerClearanceSlides,
  getDirectionWheelCandidates,
  getFinalOverlapClearanceSlides,
  getLinearEndPose,
  getObstacleWheelCandidates,
  getPathAvoidanceCandidates,
  resolvePlayerFacingEvadeCandidates,
} from './evade-solver.js';
import {
  applyEndHalfTurnHookToPose,
  createEndHalfTurnHook,
  createTableExitHook,
  evaluateSimpleBlockedEvade,
  getClearanceBlockerSummaries,
  getEvadePlanDiagnostics,
  getOverlappingUnitsAtPose,
} from './evade-geometry.js';
import {
  CHARGE_BRANCH_DISTANCE_OUTCOMES,
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_MOVEMENT_CONTINUATION_DECISIONS,
  CHARGE_MOVEMENT_PLAN_SOURCE_STATUSES,
  EVADE_CHOICE_KINDS,
  EVADE_INITIAL_BRANCH_IDS,
  createChargeBranchRollClaim,
  createChargeBranchRollResult,
  createChargeMovementContinuationChoice,
  createChargeMovementPlan,
  createEvadeAvoidanceCandidate,
  createEvadeDiagnostic,
  createEvadePlan,
  createStraightEvadeCandidate,
  EVADE_PLAN_SOURCE_STATUSES,
  getSignedAngleDeltaRadians,
  getEvadeStepIdPart,
  summarizeEvadeCandidateForDecisionTrace,
  summarizeEvadeDiagnosticForDecisionTrace,
} from './evade-model.js';
export {
  CHARGE_BRANCH_DISTANCE_OUTCOMES,
  CHARGE_BRANCH_ROLL_REASONS,
  CHARGE_MOVEMENT_CONTINUATION_DECISIONS,
  CHARGE_MOVEMENT_PLAN_SOURCE_STATUSES,
  createChargeBranchRollClaim,
  createChargeBranchRollResult,
  createChargeMovementContinuationChoice,
  createChargeMovementPlan,
  createEvadePlan,
  EVADE_CHOICE_KINDS,
  EVADE_INITIAL_BRANCH_IDS,
  EVADE_PLAN_SOURCE_STATUSES,
  getEvadeStepIdPart,
} from './evade-model.js';
export { evaluateSimpleBlockedEvade } from './evade-geometry.js';
import { GEOMETRY_EPSILON, addVectors, getAxesFromRotation, normalizeAngleRadians, scaleVector } from '../geometry/index.js';

const SIMPLE_EVADE_BLOCKER_MAX_AHEAD_UD = 1;
const SIMPLE_EVADE_SLIDE_STEP_UD = 0.25;

function getEvadeSolveNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function roundEvadeSolveMs(value) {
  return Number(Number(value ?? 0).toFixed(2));
}

function addSolveTiming(stageTimingsMs, timingKey, startedAtMs) {
  if (!stageTimingsMs || !timingKey || !Number.isFinite(startedAtMs)) {
    return;
  }

  const elapsedMs = roundEvadeSolveMs(getEvadeSolveNowMs() - startedAtMs);
  stageTimingsMs[timingKey] = roundEvadeSolveMs((stageTimingsMs[timingKey] ?? 0) + elapsedMs);
}

export function resolveEvadeReorientation({
  reactingUnit,
  contactClassification,
  selectedContactSide = null,
  contactSnapshot = null,
}) {
  if (!reactingUnit) {
    throw new Error('Evade reorientation requires a reacting unit.');
  }

  const startPose = getEvadeStartPose(reactingUnit, contactSnapshot);
  const contactType = getEffectiveContactType(contactClassification, selectedContactSide);
  const flankSide = getEffectiveFlankSide(contactClassification, selectedContactSide);
  const reorientedRotationRadians = normalizeAngleRadians(
    Number(startPose.rotationRadians ?? 0) + getEvadeRotationDelta(contactType, flankSide),
  );

  return {
    startPose,
    contactType,
    flankSide,
    reorientedPose: {
      xUd: Number(startPose.xUd ?? 0),
      yUd: Number(startPose.yUd ?? 0),
      rotationRadians: reorientedRotationRadians,
    },
  };
}




function isMountedChargeUnit(chargingUnit) {
  const troopType = String(chargingUnit?.troopType ?? '').toLowerCase();
  const family = String(chargingUnit?.chargeReactionCapability?.family ?? '').toLowerCase();

  return [
    'cavalry',
    'light-cavalry',
    'camelry',
    'camelry',
    'light-chariot',
    'light-chariots',
    'general',
  ].includes(troopType) || [
    'cavalry',
    'light-cavalry',
    'camelry',
    'camelry',
    'light-chariots',
  ].includes(family);
}

function isChargeUnitImpetuous(chargingUnit) {
  return Boolean(chargingUnit?.hasImpetuous ?? chargingUnit?.chargeReactionCapability?.hasImpetuous);
}

function getChargeFollowThroughMinimumDistanceUd(chargingUnit, maximumDistanceUd) {
  const minimumDistanceUd = isMountedChargeUnit(chargingUnit) ? 2 : 1;
  return Number(Math.min(Math.max(0, maximumDistanceUd), minimumDistanceUd).toFixed(3));
}

function getEvadeStartPose(reactingUnit, contactSnapshot) {
  return contactSnapshot?.defenderPose ?? {
    xUd: Number(reactingUnit?.xUd ?? 0),
    yUd: Number(reactingUnit?.yUd ?? 0),
    rotationRadians: Number(reactingUnit?.rotationRadians ?? 0),
  };
}

function getEffectiveContactType(contactClassification, selectedContactSide) {
  if (contactClassification?.type === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR_OR_FLANK) {
    if (selectedContactSide === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
      return CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR;
    }

    return CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK;
  }

  return contactClassification?.type ?? CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT;
}

function getEffectiveFlankSide(contactClassification, selectedContactSide) {
  if (selectedContactSide === CHARGE_CONTACT_FLANK_SIDES.LEFT || selectedContactSide === CHARGE_CONTACT_FLANK_SIDES.RIGHT) {
    return selectedContactSide;
  }

  return contactClassification?.flankSide ?? null;
}

function getEvadeRotationDelta(contactType, flankSide) {
  if (contactType === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT) {
    return Math.PI;
  }

  if (contactType === CHARGE_CONTACT_CLASSIFICATION_TYPES.REAR) {
    return 0;
  }

  if (contactType === CHARGE_CONTACT_CLASSIFICATION_TYPES.FLANK) {
    if (flankSide === CHARGE_CONTACT_FLANK_SIDES.LEFT) {
      return Math.PI / 2;
    }

    if (flankSide === CHARGE_CONTACT_FLANK_SIDES.RIGHT) {
      return -Math.PI / 2;
    }
  }

  throw new Error('Isolated evade plan requires a supported front, flank, or rear contact classification.');
}

export function resolveIsolatedSingleUnitEvadePlan({
  reactingUnit,
  contactClassification,
  selectedContactSide = null,
  contactSnapshot = null,
  chargeDirectionRadians = null,
  distanceRollResult,
  battlefieldProfile = null,
  units = [],
  hardBlockers = [],
  ignoredUnitIds = [],
  deferInitialBranchChoice = false,
  selectedInitialBranch = null,
}) {
  if (!reactingUnit || !distanceRollResult || !Number.isFinite(distanceRollResult.resolvedDistanceUd)) {
    throw new Error('Isolated evade plan requires a reacting unit and a resolved evade distance result.');
  }

  const {
    startPose,
    contactType,
    flankSide,
    reorientedPose,
  } = resolveEvadeReorientation({
    reactingUnit,
    contactClassification,
    selectedContactSide,
    contactSnapshot,
  });
  const signedDirectionWheelDeltaRadians = Number.isFinite(chargeDirectionRadians)
    ? getSignedAngleDeltaRadians(chargeDirectionRadians, reorientedPose.rotationRadians)
    : null;
  const directionWheelAngleRadians = Number.isFinite(signedDirectionWheelDeltaRadians)
    ? Math.abs(signedDirectionWheelDeltaRadians)
    : null;
  const hasMeaningfulDirectionWheelBranch = Number.isFinite(directionWheelAngleRadians)
    && directionWheelAngleRadians > GEOMETRY_EPSILON
    && directionWheelAngleRadians <= (Math.PI / 2) + GEOMETRY_EPSILON;
  const shouldDeferInitialBranchChoice = deferInitialBranchChoice
    && hasMeaningfulDirectionWheelBranch
    && !selectedInitialBranch;

  if (shouldDeferInitialBranchChoice) {
    const decisionTrace = [{
      stage: 'reorientation',
      reactingUnitId: reactingUnit.id ?? null,
      contactType,
      flankSide: flankSide ?? null,
      selectedContactSide: selectedContactSide ?? null,
      startPose,
      reorientedPose,
      distanceUd: distanceRollResult.resolvedDistanceUd,
    }, {
      stage: 'initial-branch-choice-deferred',
      chargeDirectionRadians,
      directionWheelAngleRadians,
      choiceCandidateIds: [
        EVADE_INITIAL_BRANCH_IDS.CURRENT_ORIENTATION,
        EVADE_INITIAL_BRANCH_IDS.DIRECTION_WHEEL,
      ],
    }];

    return createEvadePlan({
      reactingUnitId: reactingUnit.id ?? null,
      contactType,
      flankSide,
      selectedContactSide,
      startPose,
      reorientedPose,
      distanceUd: distanceRollResult.resolvedDistanceUd,
      remainingDistanceUd: distanceRollResult.resolvedDistanceUd,
      avoidanceCandidates: [
        createEvadeAvoidanceCandidate({
          id: EVADE_INITIAL_BRANCH_IDS.CURRENT_ORIENTATION,
          type: 'initial-branch-current-orientation',
        }),
        createEvadeAvoidanceCandidate({
          id: EVADE_INITIAL_BRANCH_IDS.DIRECTION_WHEEL,
          type: 'initial-branch-direction-wheel',
        }),
      ],
      choiceRequired: true,
      choiceKind: EVADE_CHOICE_KINDS.INITIAL_BRANCH,
      rollResult: distanceRollResult,
      decisionTrace,
      sourceStatus: EVADE_PLAN_SOURCE_STATUSES.VERIFIED,
    });
  }

  const includeDirectionWheelBranch = hasMeaningfulDirectionWheelBranch
    && selectedInitialBranch !== EVADE_INITIAL_BRANCH_IDS.CURRENT_ORIENTATION;
  const solveOnlyDirectionWheelBranch = selectedInitialBranch === EVADE_INITIAL_BRANCH_IDS.DIRECTION_WHEEL;
  const solverUnits = [
    ...(Array.isArray(units) ? units : []),
    ...(Array.isArray(hardBlockers) ? hardBlockers : []),
  ];
  const { forwardAxis } = getAxesFromRotation(reorientedPose.rotationRadians);
  const endPosition = addVectors(
    { x: reorientedPose.xUd, y: reorientedPose.yUd },
    scaleVector(forwardAxis, distanceRollResult.resolvedDistanceUd),
  );
  const straightEndPose = {
    xUd: Number(endPosition.x.toFixed(3)),
    yUd: Number(endPosition.y.toFixed(3)),
    rotationRadians: reorientedPose.rotationRadians,
  };
  const straightDiagnostics = getEvadePlanDiagnostics({
    reactingUnit,
    startPose: reorientedPose,
    endPose: straightEndPose,
    battlefieldProfile,
    units: solverUnits,
    ignoredUnitIds,
  });
  const straightCandidate = createStraightEvadeCandidate({
    endPose: straightEndPose,
    distanceUd: distanceRollResult.resolvedDistanceUd,
  });
  const straightHasFinalOverlap = straightDiagnostics.some((diagnostic) => diagnostic.code === 'charge.evade.final-overlap');
  const straightHasPathOverlap = straightDiagnostics.some((diagnostic) => diagnostic.code === 'charge.evade.path-overlap');
  const baselineLegal = straightDiagnostics.length === 0;
  let directBlockerClearance = null;
  let solverCandidates = [];
  const stageTimingsMs = {};
  const totalSolveStartedAtMs = getEvadeSolveNowMs();
  let directBlockerSlideCount = 0;
  let finalOverlapSlideCount = 0;
  let obstacleWheelCandidateCount = 0;
  let pathAvoidanceCandidateCount = 0;
  let directionWheelCandidateCount = 0;
  let currentOrientationCandidateCount = 0;
  let selectedSolverBranch = null;
  const solverMemo = {
    insideBattlefield: new Map(),
    overlapAny: new Map(),
    overlappingUnitsAtPose: new Map(),
    linearPathOverlap: new Map(),
    blockerLinearPathOverlap: new Map(),
  };
  const decisionTrace = [
    {
      stage: 'reorientation',
      reactingUnitId: reactingUnit.id ?? null,
      contactType,
      flankSide: flankSide ?? null,
      selectedContactSide: selectedContactSide ?? null,
      startPose,
      reorientedPose,
      distanceUd: distanceRollResult.resolvedDistanceUd,
    },
    {
      stage: 'straight-evaluate',
      straightEndPose,
      baselineLegal,
      straightHasFinalOverlap,
      straightHasPathOverlap,
      diagnostics: straightDiagnostics.map(summarizeEvadeDiagnosticForDecisionTrace),
    },
  ];

  if (straightHasFinalOverlap || straightHasPathOverlap) {
    const directBlockerStartedAtMs = getEvadeSolveNowMs();
    directBlockerClearance = getDirectBlockerClearanceSlides({
      reactingUnit,
      reorientedPose,
      distanceUd: distanceRollResult.resolvedDistanceUd,
      battlefieldProfile,
      units: solverUnits,
      ignoredUnitIds,
      decisionTrace,
      solverMemo,
    });
    addSolveTiming(stageTimingsMs, 'directBlockerClearanceMs', directBlockerStartedAtMs);
    decisionTrace.push({
      stage: 'direct-blocker-clearance-check',
      blockerUnitIds: directBlockerClearance?.blockerUnitIds ?? [],
      clearanceSlides: Array.isArray(directBlockerClearance?.clearanceSlides)
        ? directBlockerClearance.clearanceSlides.map((slide) => ({
          side: slide?.side ?? null,
          distanceUd: Number.isFinite(slide?.distanceUd) ? slide.distanceUd : null,
        }))
        : [],
      clearanceBlockers: getClearanceBlockerSummaries({
        blockerUnits: solverUnits.filter((unit) => (directBlockerClearance?.blockerUnitIds ?? []).includes(unit?.id)),
        unit: {
          ...reactingUnit,
          xUd: reorientedPose.xUd,
          yUd: reorientedPose.yUd,
          rotationRadians: reorientedPose.rotationRadians,
        },
      }),
      isBlocked: Boolean(directBlockerClearance?.isBlocked),
    });
  }

  const directionWheelBranchReferencePose = contactSnapshot?.chargerContactPose ?? contactSnapshot?.chargerStartPose ?? startPose;
  const getDirectionWheelCandidateSet = () => (includeDirectionWheelBranch
    ? (() => {
      const directionWheelStartedAtMs = getEvadeSolveNowMs();
      const directionWheelCandidates = getDirectionWheelCandidates({
        reactingUnit,
        reorientedPose,
        distanceUd: distanceRollResult.resolvedDistanceUd,
        chargeDirectionRadians,
        battlefieldProfile,
        units: solverUnits,
        ignoredUnitIds,
        requireDirectBlockerClearance: (directBlockerClearance?.blockerUnitIds?.length ?? 0) > 0,
        solverMemo,
        branchReferencePose: directionWheelBranchReferencePose,
        decisionTrace,
      });
      addSolveTiming(stageTimingsMs, 'directionWheelMs', directionWheelStartedAtMs);
      directionWheelCandidateCount = directionWheelCandidates.length;
      return directionWheelCandidates;
    })()
    : []);

  if ((directBlockerClearance?.blockerUnitIds?.length ?? 0) > 0) {
    const directBlockerSlides = directBlockerClearance.clearanceSlides;
    directBlockerSlideCount = directBlockerSlides.length;
    const obstacleWheelCandidates = directBlockerSlides.length === 0
      ? (() => {
        const obstacleWheelStartedAtMs = getEvadeSolveNowMs();
        const candidates = getObstacleWheelCandidates({
        reactingUnit,
        reorientedPose,
        distanceUd: distanceRollResult.resolvedDistanceUd,
        blockerUnitIds: directBlockerClearance.blockerUnitIds,
        battlefieldProfile,
        units: solverUnits,
        ignoredUnitIds,
        solverMemo,
        });
        addSolveTiming(stageTimingsMs, 'obstacleWheelMs', obstacleWheelStartedAtMs);
        obstacleWheelCandidateCount += candidates.length;
        return candidates;
      })()
      : [];
    const pathAvoidanceCandidates = straightHasPathOverlap
      ? (() => {
        const pathAvoidanceStartedAtMs = getEvadeSolveNowMs();
        const candidates = getPathAvoidanceCandidates({
        reactingUnit,
        startPose: reorientedPose,
        distanceUd: distanceRollResult.resolvedDistanceUd,
        battlefieldProfile,
        units: solverUnits,
        ignoredUnitIds,
        decisionTrace,
        solverMemo,
        });
        addSolveTiming(stageTimingsMs, 'pathAvoidanceMs', pathAvoidanceStartedAtMs);
        pathAvoidanceCandidateCount += candidates.length;
        return candidates;
      })()
      : [];

    solverCandidates = solveOnlyDirectionWheelBranch
      ? []
      : dedupeEvadeCandidates([
        ...directBlockerSlides,
        ...obstacleWheelCandidates,
        ...pathAvoidanceCandidates,
      ]);
    currentOrientationCandidateCount = solverCandidates.length;
    selectedSolverBranch = 'direct-blocker-clearance';
    decisionTrace.push({
      stage: 'solver-branch',
      branch: 'direct-blocker-clearance',
      candidateCount: solverCandidates.length,
      candidates: solverCandidates.map(summarizeEvadeCandidateForDecisionTrace),
    });
  } else if (straightHasFinalOverlap) {
    const finalOverlapBlockerUnitIds = getOverlappingUnitsAtPose({
      reactingUnit,
      pose: straightEndPose,
      units: solverUnits,
      ignoredUnitIds,
    }).map((unit) => unit.id ?? null).filter(Boolean);
    const finalOverlapStartedAtMs = getEvadeSolveNowMs();
    const finalOverlapSlides = getFinalOverlapClearanceSlides({
      reactingUnit,
      reorientedPose,
      distanceUd: distanceRollResult.resolvedDistanceUd,
      battlefieldProfile,
      units: solverUnits,
      ignoredUnitIds,
      solverMemo,
    });
    addSolveTiming(stageTimingsMs, 'finalOverlapClearanceMs', finalOverlapStartedAtMs);
    finalOverlapSlideCount = finalOverlapSlides.length;
    const pathAvoidanceCandidates = contactType === CHARGE_CONTACT_CLASSIFICATION_TYPES.FRONT
      && finalOverlapBlockerUnitIds.length > 0
      ? (() => {
        const pathAvoidanceStartedAtMs = getEvadeSolveNowMs();
        const candidates = getPathAvoidanceCandidates({
        reactingUnit,
        startPose: reorientedPose,
        distanceUd: distanceRollResult.resolvedDistanceUd,
        battlefieldProfile,
        units: solverUnits,
        ignoredUnitIds,
        blockerUnitIds: finalOverlapBlockerUnitIds,
        decisionTrace,
        solverMemo,
        });
        addSolveTiming(stageTimingsMs, 'pathAvoidanceMs', pathAvoidanceStartedAtMs);
        pathAvoidanceCandidateCount += candidates.length;
        return candidates;
      })()
      : [];
    const currentOrientationCandidates = dedupeEvadeCandidates([
      ...finalOverlapSlides,
      ...pathAvoidanceCandidates,
    ]);
    currentOrientationCandidateCount = currentOrientationCandidates.length;
    solverCandidates = dedupeEvadeCandidates([
      ...(solveOnlyDirectionWheelBranch ? [] : currentOrientationCandidates),
      ...getDirectionWheelCandidateSet(),
    ]);
    selectedSolverBranch = 'final-overlap-clearance';
    decisionTrace.push({
      stage: 'solver-branch',
      branch: 'final-overlap-clearance',
      candidateCount: solverCandidates.length,
      candidates: solverCandidates.map(summarizeEvadeCandidateForDecisionTrace),
    });
  } else if (baselineLegal) {
    const directionWheelCandidates = getDirectionWheelCandidateSet();
    currentOrientationCandidateCount = solveOnlyDirectionWheelBranch ? 0 : 1;
    solverCandidates = dedupeEvadeCandidates([
      ...(solveOnlyDirectionWheelBranch ? [] : [straightCandidate]),
      ...directionWheelCandidates,
    ]);
    selectedSolverBranch = 'baseline';
    decisionTrace.push({
      stage: 'solver-branch',
      branch: 'baseline',
      candidateCount: solverCandidates.length,
      candidates: solverCandidates.map(summarizeEvadeCandidateForDecisionTrace),
    });
  } else if (!baselineLegal) {
    const straightPathAvoidanceCandidates = straightHasPathOverlap
      ? (() => {
        const pathAvoidanceStartedAtMs = getEvadeSolveNowMs();
        const candidates = getPathAvoidanceCandidates({
        reactingUnit,
        startPose: reorientedPose,
        distanceUd: distanceRollResult.resolvedDistanceUd,
        battlefieldProfile,
        units: solverUnits,
        ignoredUnitIds,
        idPrefix: 'straight',
        decisionTrace,
        solverMemo,
        });
        addSolveTiming(stageTimingsMs, 'pathAvoidanceMs', pathAvoidanceStartedAtMs);
        pathAvoidanceCandidateCount += candidates.length;
        return candidates;
      })()
      : [];

    currentOrientationCandidateCount = solveOnlyDirectionWheelBranch ? 0 : straightPathAvoidanceCandidates.length;
    solverCandidates = dedupeEvadeCandidates([
      ...(solveOnlyDirectionWheelBranch ? [] : straightPathAvoidanceCandidates),
      ...getDirectionWheelCandidateSet(),
    ]);
    selectedSolverBranch = 'path-avoidance';
    decisionTrace.push({
      stage: 'solver-branch',
      branch: 'path-avoidance',
      candidateCount: solverCandidates.length,
      candidates: solverCandidates.map(summarizeEvadeCandidateForDecisionTrace),
    });
  }

  const playerFacingRankingStartedAtMs = getEvadeSolveNowMs();
  const avoidanceCandidates = resolvePlayerFacingEvadeCandidates({
    candidates: solverCandidates,
    contactSnapshot,
    fallbackReferencePose: startPose,
  });
  addSolveTiming(stageTimingsMs, 'playerFacingRankingMs', playerFacingRankingStartedAtMs);
  const selectedAvoidanceCandidate = avoidanceCandidates.length === 1 ? avoidanceCandidates[0] : null;
  const choiceRequired = avoidanceCandidates.length > 1;
  const blockedByDirectBlocker = (directBlockerClearance?.blockerUnitIds?.length ?? 0) > 0 && solverCandidates.length === 0;
  const endPose = blockedByDirectBlocker
    ? null
    : selectedAvoidanceCandidate?.endPose
      ?? (choiceRequired ? null : avoidanceCandidates[0]?.endPose ?? (baselineLegal ? straightEndPose : null));
  const tableExit = endPose
    ? createTableExitHook({
      reactingUnit,
      pose: endPose,
      battlefieldProfile,
    })
    : null;
  const endHalfTurnHook = tableExit
    ? null
    : createEndHalfTurnHook({
      reactingUnit,
      endPose,
    });
  const resolvedEndPose = applyEndHalfTurnHookToPose(endPose, endHalfTurnHook);
  const diagnostics = blockedByDirectBlocker
    ? [createEvadeDiagnostic({
      code: 'charge.evade.blocked',
      status: 'warn',
      text: 'The evade path is blocked by a nearby obstacle or unit that cannot be cleared within the supported direct-blocker subset.',
    })]
    : selectedAvoidanceCandidate
      ? []
      : straightDiagnostics.filter((diagnostic) => !(tableExit && diagnostic.code === 'charge.evade.table-edge'));
  const selectedAvoidanceSteps = selectedAvoidanceCandidate && selectedAvoidanceCandidate.type !== 'straight'
    ? (selectedAvoidanceCandidate.avoidanceSteps?.length > 0 ? selectedAvoidanceCandidate.avoidanceSteps : [selectedAvoidanceCandidate])
    : [];
  addSolveTiming(stageTimingsMs, 'totalSolveMs', totalSolveStartedAtMs);
  const selectedCandidateSummary = selectedAvoidanceCandidate
    ? summarizeEvadeCandidateForDecisionTrace(selectedAvoidanceCandidate)
    : null;
  const resolvedSelectedInitialBranch = selectedInitialBranch
    ?? (selectedCandidateSummary?.analysis?.branchKey === 'direction-wheel'
      ? EVADE_INITIAL_BRANCH_IDS.DIRECTION_WHEEL
      : selectedCandidateSummary
        ? EVADE_INITIAL_BRANCH_IDS.CURRENT_ORIENTATION
        : null);
  decisionTrace.push({
    stage: 'selected-branch-analysis',
    selectedInitialBranch: resolvedSelectedInitialBranch,
    includeDirectionWheelBranch,
    solveOnlyDirectionWheelBranch,
    straightHasFinalOverlap,
    straightHasPathOverlap,
    baselineLegal,
    solverBranch: selectedSolverBranch,
    stageTimingsMs,
    candidateCounts: {
      currentOrientation: currentOrientationCandidateCount,
      directionWheel: directionWheelCandidateCount,
      pathAvoidance: pathAvoidanceCandidateCount,
      obstacleWheel: obstacleWheelCandidateCount,
      directBlockerSlides: directBlockerSlideCount,
      finalOverlapSlides: finalOverlapSlideCount,
      solverCandidates: solverCandidates.length,
      playerFacingCandidates: avoidanceCandidates.length,
    },
    selectedCandidateAnalysis: selectedCandidateSummary?.analysis ?? null,
  });
  decisionTrace.push({
    stage: 'resolution',
    blockedByDirectBlocker,
    choiceRequired,
    selectedAvoidanceCandidateId: selectedAvoidanceCandidate?.id ?? null,
    selectedAvoidanceType: selectedAvoidanceCandidate?.type ?? null,
    avoidanceCandidates: avoidanceCandidates.map(summarizeEvadeCandidateForDecisionTrace),
    tableExit: tableExit ?? null,
    endHalfTurnHook: endHalfTurnHook ?? null,
    resolvedEndPose,
    diagnostics: diagnostics.map(summarizeEvadeDiagnosticForDecisionTrace),
  });

  return createEvadePlan({
    reactingUnitId: reactingUnit.id ?? null,
    contactType,
    flankSide,
    selectedContactSide,
    startPose,
    reorientedPose,
    endPose: resolvedEndPose,
    distanceUd: distanceRollResult.resolvedDistanceUd,
    spentAvoidanceUd: selectedAvoidanceCandidate?.spentDistanceUd ?? 0,
    remainingDistanceUd: selectedAvoidanceCandidate?.remainingDistanceUd ?? distanceRollResult.resolvedDistanceUd,
    avoidanceSteps: selectedAvoidanceSteps,
    avoidanceCandidates,
    tableExit,
    endHalfTurnHook,
    choiceRequired,
    choiceKind: choiceRequired ? EVADE_CHOICE_KINDS.AVOIDANCE_CANDIDATE : EVADE_CHOICE_KINDS.NONE,
    rollResult: distanceRollResult,
    diagnostics,
    decisionTrace,
    sourceStatus: diagnostics.length > 0 || avoidanceCandidates.length > 1
      ? EVADE_PLAN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
      : EVADE_PLAN_SOURCE_STATUSES.VERIFIED,
  });
}

export function resolveAdjustedChargeFollowThroughPlan({
  chargingUnit,
  declarationSnapshot,
  distanceRollResult,
  contactState = null,
}) {
  if (!chargingUnit || !distanceRollResult || !Number.isFinite(distanceRollResult.resolvedDistanceUd)) {
    throw new Error('Adjusted charge follow-through requires a charging unit and a resolved adjusted charge distance result.');
  }

  const startPose = declarationSnapshot?.contactEvent?.contactSnapshot?.chargerStartPose
    ?? declarationSnapshot?.startPose
    ?? {
      xUd: Number(chargingUnit.xUd ?? 0),
      yUd: Number(chargingUnit.yUd ?? 0),
      rotationRadians: Number(chargingUnit.rotationRadians ?? 0),
    };
  const frozenDirectionRadians = Number.isFinite(declarationSnapshot?.frozenDirectionRadians)
    ? declarationSnapshot.frozenDirectionRadians
    : Number(startPose.rotationRadians ?? chargingUnit.rotationRadians ?? 0);
  const maximumDistanceUd = Number(distanceRollResult.resolvedDistanceUd ?? 0);
  const maximumEndPose = getLinearEndPose(startPose, frozenDirectionRadians, maximumDistanceUd);
  const firstContactEvent = contactState?.contactEvents?.[0] ?? null;
  const firstContactPose = firstContactEvent?.contactSnapshot?.chargerContactPose ?? null;
  const minimumDistanceUd = getChargeFollowThroughMinimumDistanceUd(chargingUnit, maximumDistanceUd);
  const isImpetuous = isChargeUnitImpetuous(chargingUnit);
  const hasBlockingContact = Boolean(contactState?.contactEvents?.length);
  const hasForcedFullContinuation = isImpetuous
    && !hasBlockingContact
    && maximumDistanceUd > minimumDistanceUd + GEOMETRY_EPSILON;
  const continuationChoice = createChargeMovementContinuationChoice({
    required: !isImpetuous && !hasBlockingContact && maximumDistanceUd > minimumDistanceUd + GEOMETRY_EPSILON,
    selectedOption: hasForcedFullContinuation ? CHARGE_MOVEMENT_CONTINUATION_DECISIONS.CONTINUE : null,
    minimumDistanceUd,
    minimumEndPose: getLinearEndPose(startPose, frozenDirectionRadians, minimumDistanceUd),
    maximumDistanceUd,
    maximumEndPose,
    isImpetuous,
    minimumLabel: isMountedChargeUnit(chargingUnit) ? '2 UD mounted minimum' : '1 UD foot minimum',
  });

  return createChargeMovementPlan({
    chargingUnitId: chargingUnit.id ?? null,
    startPose: {
      xUd: Number(startPose.xUd ?? 0),
      yUd: Number(startPose.yUd ?? 0),
      rotationRadians: Number(startPose.rotationRadians ?? chargingUnit.rotationRadians ?? 0),
    },
    contactPose: firstContactPose ?? declarationSnapshot?.contactEvent?.contactSnapshot?.chargerContactPose ?? null,
    endPose: firstContactPose ?? maximumEndPose,
    frozenDirectionRadians,
    distanceUd: maximumDistanceUd,
    rollResult: distanceRollResult,
    contactState,
    continuationChoice,
    decisionTrace: [
      {
        stage: 'follow-through-plan',
        chargingUnitId: chargingUnit.id ?? null,
        startPose,
        maximumDistanceUd,
        minimumDistanceUd,
        frozenDirectionRadians,
        hasBlockingContact,
        firstContactEventType: firstContactEvent?.type ?? null,
        firstContactDefenderId: firstContactEvent?.defenderId ?? null,
        continuationChoice,
        endPose: firstContactPose ?? maximumEndPose,
      },
    ],
  });
}

export function resolveAdjustedChargeFollowThroughContactState({
  chargingUnit,
  declarationSnapshot,
  distanceRollResult,
  evadePlan,
  evadeMove = null,
  battlefieldProfile,
  units = [],
}) {
  const reactingUnitId = evadeMove?.reactingUnitId ?? evadePlan?.reactingUnitId ?? null;
  const evaderPose = evadeMove?.finalPose ?? evadePlan?.endPose ?? null;

  if (!chargingUnit || !declarationSnapshot || !distanceRollResult || !reactingUnitId || !evaderPose) {
    return null;
  }

  const startPose = declarationSnapshot?.contactEvent?.contactSnapshot?.chargerStartPose
    ?? declarationSnapshot?.startPose
    ?? {
      xUd: Number(chargingUnit.xUd ?? 0),
      yUd: Number(chargingUnit.yUd ?? 0),
      rotationRadians: Number(chargingUnit.rotationRadians ?? 0),
    };
  const frozenDirectionRadians = Number.isFinite(declarationSnapshot?.frozenDirectionRadians)
    ? declarationSnapshot.frozenDirectionRadians
    : Number(startPose.rotationRadians ?? chargingUnit.rotationRadians ?? 0);
  const posedCharger = {
    ...chargingUnit,
    xUd: Number(startPose.xUd ?? chargingUnit.xUd ?? 0),
    yUd: Number(startPose.yUd ?? chargingUnit.yUd ?? 0),
    rotationRadians: frozenDirectionRadians,
  };
  const reactingUnit = (units ?? []).find((unit) => unit.id === reactingUnitId) ?? null;

  if (!reactingUnit) {
    return null;
  }

  const posedEvader = {
    ...reactingUnit,
    xUd: Number(evaderPose.xUd ?? reactingUnit.xUd ?? 0),
    yUd: Number(evaderPose.yUd ?? reactingUnit.yUd ?? 0),
    rotationRadians: Number(evaderPose.rotationRadians ?? reactingUnit.rotationRadians ?? 0),
  };
  const unitsWithEvaderPose = Array.isArray(units)
    ? units.map((unit) => {
      if (unit.id === posedCharger.id) {
        return posedCharger;
      }

      if (unit.id === posedEvader.id) {
        return posedEvader;
      }

      return unit;
    })
    : [posedCharger, posedEvader];

  return resolveChargeContactState({
    selectedUnit: posedCharger,
    targetUnit: posedEvader,
    pathSegments: [createChargeGuideSegment({
      xUd: posedCharger.xUd,
      yUd: posedCharger.yUd,
      rotationRadians: frozenDirectionRadians,
      distanceUd: Number(distanceRollResult.resolvedDistanceUd ?? 0),
    })],
    battlefieldProfile,
    units: unitsWithEvaderPose,
  });
}

export function resolveEvadeDistanceRoll({ dieRoll, baseDistanceUd, claim = null }) {
  return createChargeBranchRollResult({
    claim,
    dieRoll,
    baseDistanceUd,
  });
}

export function resolveAdjustedChargeDistanceRoll({ dieRoll, baseDistanceUd, claim = null, neverReduce = false }) {
  return createChargeBranchRollResult({
    claim,
    dieRoll,
    baseDistanceUd,
    neverReduce,
  });
}

