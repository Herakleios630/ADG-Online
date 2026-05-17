import {
  createMovementPreview,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_PREVIEW_STATUSES,
} from './model.js';
import {
  evaluateZocTransitionsForMovementPreview,
  MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES,
} from './path-splitting.js';
import { worldPointToLocalPoint } from '../geometry/index.js';
import { getUnitFootprintSamplePoints } from '../zoc/geometry.js';

export const MOVEMENT_VALIDATION_STATUSES = {
  IDLE: 'idle',
  VALID: 'valid',
  INVALID: 'invalid',
};

const DIAGNOSTIC_STATUSES = ['verified', 'blocked', 'placeholder', 'needs-source-check'];

const ZOC_CONTACT_MODES = {
  NONE: 'none',
  ENTERS: 'enters',
  REMAINS: 'remains',
  EXITS: 'exits',
  TRANSIENT: 'transient',
};

function normalizeValidationStatus(status) {
  return Object.values(MOVEMENT_VALIDATION_STATUSES).includes(status)
    ? status
    : MOVEMENT_VALIDATION_STATUSES.IDLE;
}

function normalizeDiagnosticStatus(status) {
  return DIAGNOSTIC_STATUSES.includes(status)
    ? status
    : 'placeholder';
}

function normalizePathSampleSourceStatus(status) {
  return Object.values(MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES).includes(status)
    ? status
    : MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK;
}

function createValidationDiagnostic(diagnostic = {}, index = 0) {
  return {
    id: diagnostic.id || `movement-validation-${index + 1}`,
    label: diagnostic.label || 'Validation',
    status: normalizeDiagnosticStatus(diagnostic.status),
    text: diagnostic.text || '',
  };
}

function normalizeZocContactMode(contactMode) {
  return Object.values(ZOC_CONTACT_MODES).includes(contactMode)
    ? contactMode
    : ZOC_CONTACT_MODES.NONE;
}

function createZocValidationFacts(facts = {}) {
  return {
    contactMode: normalizeZocContactMode(facts.contactMode),
    startsInEnemyZoc: Boolean(facts.startsInEnemyZoc),
    endsInEnemyZoc: Boolean(facts.endsInEnemyZoc),
    encountersEnemyZoc: Boolean(facts.encountersEnemyZoc),
    mostThreateningEnemyId: facts.mostThreateningEnemyId ?? null,
    transitionCount: Number.isFinite(facts.transitionCount) ? Math.max(0, Math.floor(facts.transitionCount)) : 0,
    sourceStatus: normalizePathSampleSourceStatus(facts.sourceStatus),
    relaxationCandidate: Boolean(facts.relaxationCandidate),
    relaxationNote: facts.relaxationNote || '',
    legalSubsetApplied: Boolean(facts.legalSubsetApplied),
  };
}

function getCenterDistanceUd(leftPose, rightUnit) {
  if (!leftPose || !rightUnit) {
    return Number.POSITIVE_INFINITY;
  }

  const dx = (leftPose.xUd ?? 0) - (rightUnit.xUd ?? 0);
  const dy = (leftPose.yUd ?? 0) - (rightUnit.yUd ?? 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function isPreviewClosingOnEnemy(preview, enemyUnit) {
  const firstSegment = preview?.segments?.[0] ?? null;
  const lastSegment = preview?.segments?.[preview.segments.length - 1] ?? null;

  if (!firstSegment || !lastSegment || !enemyUnit) {
    return false;
  }

  const startDistance = getCenterDistanceUd(firstSegment.startPose, enemyUnit);
  const endDistance = getCenterDistanceUd(lastSegment.endPose, enemyUnit);
  return endDistance < startDistance - 1e-6;
}

function doesTargetUnitContactEnemy(targetUnit, enemyUnit) {
  if (!targetUnit || !enemyUnit) {
    return false;
  }

  const halfEnemyWidth = (enemyUnit.widthUd ?? 0) / 2;
  const halfEnemyDepth = (enemyUnit.depthUd ?? 0) / 2;

  return getUnitFootprintSamplePoints(targetUnit).some((sample) => {
    const localPoint = worldPointToLocalPoint(
      {
        center: { x: enemyUnit.xUd, y: enemyUnit.yUd },
        widthUd: enemyUnit.widthUd,
        depthUd: enemyUnit.depthUd,
        rotationRadians: enemyUnit.rotationRadians ?? 0,
      },
      sample.point,
    );

    return localPoint.x >= -halfEnemyWidth
      && localPoint.x <= halfEnemyWidth
      && localPoint.y >= -halfEnemyDepth
      && localPoint.y <= halfEnemyDepth;
  });
}

function doesTransitionPathContactEnemy(transitionAnalysis, movingUnit, enemyUnit) {
  if (!transitionAnalysis || !movingUnit || !enemyUnit) {
    return false;
  }

  return transitionAnalysis.samples.some((sample) => {
    const posedUnit = {
      ...movingUnit,
      xUd: sample.pose.xUd,
      yUd: sample.pose.yUd,
      rotationRadians: sample.pose.rotationRadians ?? 0,
    };
    return doesTargetUnitContactEnemy(posedUnit, enemyUnit);
  });
}

export function createMovementValidationSnapshot(snapshot = {}) {
  return {
    status: normalizeValidationStatus(snapshot.status),
    diagnostics: Array.isArray(snapshot.diagnostics)
      ? snapshot.diagnostics.map((diagnostic, index) => createValidationDiagnostic(diagnostic, index))
      : [],
    zoc: createZocValidationFacts(snapshot.zoc),
  };
}

function deriveZocContactMode(transitionAnalysis) {
  const startsInEnemyZoc = Boolean(transitionAnalysis?.startsInEnemyZoc);
  const endsInEnemyZoc = Boolean(transitionAnalysis?.endsInEnemyZoc);
  const encountersEnemyZoc = Boolean(transitionAnalysis?.encountersEnemyZoc);

  if (!encountersEnemyZoc) {
    return ZOC_CONTACT_MODES.NONE;
  }

  if (!startsInEnemyZoc && endsInEnemyZoc) {
    return ZOC_CONTACT_MODES.ENTERS;
  }

  if (startsInEnemyZoc && endsInEnemyZoc) {
    return ZOC_CONTACT_MODES.REMAINS;
  }

  if (startsInEnemyZoc && !endsInEnemyZoc) {
    return ZOC_CONTACT_MODES.EXITS;
  }

  return ZOC_CONTACT_MODES.TRANSIENT;
}

function hasCommandContext(commandContext) {
  return Boolean(commandContext?.activePlayerId)
    && Boolean(commandContext?.currentPhaseId)
    && Boolean(commandContext?.activeCorpsId);
}

function createCommandSpecificDiagnostic(lastSegment) {
  if (!lastSegment) {
    return null;
  }

  if (lastSegment.commandId === MOVEMENT_COMMAND_IDS.WHEEL) {
    return (lastSegment.maneuver?.angleRadians ?? 0) > 0
      ? {
          id: 'command-input-wheel',
          label: 'Wheel input',
          status: 'verified',
          text: 'Current wheel preview has a positive pivot angle.',
        }
      : {
          id: 'command-input-wheel',
          label: 'Wheel input',
          status: 'blocked',
          text: 'Wheel preview needs a positive angle before it represents a maneuver.',
        };
  }

  if (lastSegment.commandId === MOVEMENT_COMMAND_IDS.ADVANCE || lastSegment.commandId === MOVEMENT_COMMAND_IDS.SLIDE) {
    return (lastSegment.distance?.requestedUd ?? 0) > 0 || (lastSegment.distance?.resolvedUd ?? 0) > 0
      ? {
          id: `command-input-${lastSegment.commandId}`,
          label: `${lastSegment.commandId} input`,
          status: 'verified',
          text: 'Current preview has positive movement distance.',
        }
      : {
          id: `command-input-${lastSegment.commandId}`,
          label: `${lastSegment.commandId} input`,
          status: 'blocked',
          text: 'Current preview needs a positive movement distance before it represents a maneuver.',
        };
  }

  return null;
}

function getEnemyUnitsForSelectedUnit(selectedUnit, units = []) {
  if (!selectedUnit || !Array.isArray(units)) {
    return [];
  }

  return units.filter((unit) => unit.id !== selectedUnit.id && unit.owner !== selectedUnit.owner);
}

function createZocSubsetDiagnostic({ selectedUnit, selectedCommandId, preview, units }) {
  if (!selectedUnit || !selectedCommandId || preview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
    return {
      primary: {
        id: 'zoc-subset-legality',
        label: 'ZOC subset legality',
        status: 'placeholder',
        text: 'ZOC legality runs when an accepted preview exists for a selected unit and command.',
      },
      secondary: null,
      facts: createZocValidationFacts({
        contactMode: ZOC_CONTACT_MODES.NONE,
      }),
      tertiary: null,
    };
  }

  const enemyUnits = getEnemyUnitsForSelectedUnit(selectedUnit, units);
  const transitionAnalysis = evaluateZocTransitionsForMovementPreview({
    preview,
    movingUnit: selectedUnit,
    enemyUnits,
    samplesPerUd: 4,
  });
  const topThreatSample = transitionAnalysis.samples.find((sample) => sample.inEnemyZoc && sample.mostThreateningEnemyId);
  const topThreatId = topThreatSample?.mostThreateningEnemyId ?? null;
  const topThreatEnemy = enemyUnits.find((enemy) => enemy.id === topThreatId) ?? null;
  const contactMode = deriveZocContactMode(transitionAnalysis);
  const relaxationCandidate = transitionAnalysis.encountersEnemyZoc
    && (selectedCommandId === MOVEMENT_COMMAND_IDS.ADVANCE || selectedCommandId === MOVEMENT_COMMAND_IDS.WHEEL)
    && Boolean(topThreatId);
  const closesOnTopThreat = topThreatEnemy
    ? isPreviewClosingOnEnemy(preview, topThreatEnemy)
    : false;
  const pathContactsTopThreat = topThreatEnemy
    ? doesTransitionPathContactEnemy(transitionAnalysis, selectedUnit, topThreatEnemy)
    : false;
  const legalSubsetApplied = relaxationCandidate
    && closesOnTopThreat
    && !pathContactsTopThreat;
  const relaxationNote = relaxationCandidate
    ? legalSubsetApplied
      ? 'Conservative P5 subset: maneuver is allowed while ZOC-constrained because it closes distance to the most-threatening enemy without contact.'
      : 'Conservative P5 subset still blocks because the maneuver does not close on the most-threatening enemy or would create contact.'
    : '';
  const facts = createZocValidationFacts({
    contactMode,
    startsInEnemyZoc: transitionAnalysis.startsInEnemyZoc,
    endsInEnemyZoc: transitionAnalysis.endsInEnemyZoc,
    encountersEnemyZoc: transitionAnalysis.encountersEnemyZoc,
    mostThreateningEnemyId: topThreatId,
    transitionCount: transitionAnalysis.transitions.length,
    sourceStatus: transitionAnalysis.sourceStatus,
    relaxationCandidate,
    relaxationNote,
    legalSubsetApplied,
  });

  if (transitionAnalysis.encountersEnemyZoc) {
    const contactModeLabel = contactMode === ZOC_CONTACT_MODES.ENTERS
      ? 'enters enemy ZOC'
      : contactMode === ZOC_CONTACT_MODES.REMAINS
        ? 'remains in enemy ZOC'
        : contactMode === ZOC_CONTACT_MODES.EXITS
          ? 'starts in enemy ZOC and exits it'
          : 'crosses enemy ZOC during the path';

    if (legalSubsetApplied) {
      return {
        primary: {
          id: 'zoc-subset-legality',
          label: 'ZOC subset legality',
          status: 'verified',
          text: `Current conservative P5 subset allows this ${selectedCommandId} while ZOC-constrained because it closes on most-threatening enemy ${topThreatId} and avoids contact. Charge/contact resolution remains outside this card.`,
        },
        secondary: {
          id: 'zoc-mid-segment-checks',
          label: 'ZOC path checkpoints',
          status: transitionAnalysis.sourceStatus === MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
            ? 'needs-source-check'
            : 'verified',
          text: `Path sampling detected ${transitionAnalysis.transitions.length} ZOC transition checkpoint(s); conservative no-contact closing checks were applied against most-threatening enemy ${topThreatId}.`,
        },
        tertiary: {
          id: 'zoc-relaxation-candidate',
          label: 'ZOC relaxation candidate',
          status: 'needs-source-check',
          text: `Most-threatening enemy ${topThreatId} selected. This is a source-gated conservative allowance (close-without-contact), not full charge/conformation legality.`,
        },
        facts,
      };
    }

    return {
      primary: {
        id: 'zoc-subset-legality',
        label: 'ZOC subset legality',
        status: 'blocked',
        text: topThreatId
          ? `Current P5 subset blocks this movement because the path ${contactModeLabel} (most threatening enemy: ${topThreatId}). Charge-resolution and full exception handling remain for later cards.`
          : `Current P5 subset blocks this movement because the path ${contactModeLabel}. Charge-resolution and full exception handling remain for later cards.`,
      },
      secondary: {
        id: 'zoc-mid-segment-checks',
        label: 'ZOC path checkpoints',
        status: transitionAnalysis.sourceStatus === MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
          ? 'needs-source-check'
          : 'verified',
        text: `Path sampling detected ${transitionAnalysis.transitions.length} ZOC transition checkpoint(s); deeper tie-break and exception wording is still tracked in open verification.`,
      },
      tertiary: relaxationCandidate
        ? {
            id: 'zoc-relaxation-candidate',
            label: 'ZOC relaxation candidate',
            status: 'needs-source-check',
            text: `Most-threatening enemy ${topThreatId} identified, but this maneuver is blocked in current conservative subset because it does not close distance sufficiently or it would create contact.`,
          }
        : null,
      facts,
    };
  }

  return {
    primary: {
      id: 'zoc-subset-legality',
      label: 'ZOC subset legality',
      status: 'verified',
      text: 'No enemy ZOC contact was detected along the sampled preview path for the current P5 subset.',
    },
    secondary: {
      id: 'zoc-mid-segment-checks',
      label: 'ZOC path checkpoints',
      status: transitionAnalysis.sourceStatus === MOVEMENT_PATH_SAMPLE_SOURCE_STATUSES.NEEDS_SOURCE_CHECK
        ? 'needs-source-check'
        : 'verified',
      text: `Path sampling executed ${transitionAnalysis.samples.length} checkpoint sample(s) for mid-segment ZOC detection.`,
    },
    tertiary: null,
    facts,
  };
}

export function buildMovementValidationSnapshot({ selectedUnit, selectedCommandId, preview, commandContext, units = [] }) {
  const normalizedPreview = createMovementPreview(preview);

  if (!selectedCommandId && normalizedPreview.status === MOVEMENT_PREVIEW_STATUSES.IDLE) {
    return createMovementValidationSnapshot();
  }

  const lastSegment = normalizedPreview.segments[normalizedPreview.segments.length - 1] ?? null;
  const diagnostics = [];

  diagnostics.push(
    selectedUnit
      ? {
          id: 'selected-unit',
          label: 'Selected unit',
          status: 'verified',
          text: 'A valid selected unit is present for the current movement preview.',
        }
      : {
          id: 'selected-unit',
          label: 'Selected unit',
          status: 'blocked',
          text: 'Movement preview needs a selected unit.',
        },
  );

  diagnostics.push(
    selectedCommandId
      ? {
          id: 'command-id',
          label: 'Command id',
          status: 'verified',
          text: `Current movement command is '${selectedCommandId}'.`,
        }
      : {
          id: 'command-id',
          label: 'Command id',
          status: 'blocked',
          text: 'No active movement command is selected.',
        },
  );

  const commandSpecificDiagnostic = createCommandSpecificDiagnostic(lastSegment);
  if (commandSpecificDiagnostic) {
    diagnostics.push(commandSpecificDiagnostic);
  }

  const zocSubsetDiagnostic = createZocSubsetDiagnostic({
    selectedUnit,
    selectedCommandId,
    preview: normalizedPreview,
    units,
  });
  diagnostics.push(zocSubsetDiagnostic.primary);
  if (zocSubsetDiagnostic.secondary) {
    diagnostics.push(zocSubsetDiagnostic.secondary);
  }
  if (zocSubsetDiagnostic.tertiary) {
    diagnostics.push(zocSubsetDiagnostic.tertiary);
  }

  diagnostics.push(
    normalizedPreview.status === MOVEMENT_PREVIEW_STATUSES.REJECTED
      && normalizedPreview.diagnostics.some((diagnostic) => diagnostic.id === 'battlefield-bounds')
      ? {
          id: 'battlefield-bounds',
          label: 'Bounds',
          status: 'blocked',
          text: 'Preview is blocked by the verified full-footprint battlefield bounds check.',
        }
      : {
          id: 'battlefield-bounds',
          label: 'Bounds',
          status: 'verified',
          text: 'Preview uses the verified full-footprint battlefield bounds check.',
        },
  );

  diagnostics.push(
    hasCommandContext(commandContext)
      ? {
          id: 'command-context',
          label: 'Command context presence',
          status: 'verified',
          text: 'Active player, active phase, and active corps are all present in the current command context skeleton.',
        }
      : {
          id: 'command-context',
          label: 'Command context presence',
          status: 'placeholder',
          text: 'Current command context skeleton is still incomplete for official movement claims because active corps or related context is missing.',
        },
  );

  diagnostics.push({
    id: 'movement-allowances',
    label: 'Movement allowances',
    status: 'needs-source-check',
    text: 'Official allowances, terrain effects, group movement, difficult maneuvers, special troop exceptions, and contact/conformation remain partially open beyond the current P5 subset legality scope.',
  });

  const status = diagnostics.some((diagnostic) => diagnostic.status === 'blocked')
    ? MOVEMENT_VALIDATION_STATUSES.INVALID
    : MOVEMENT_VALIDATION_STATUSES.VALID;

  return createMovementValidationSnapshot({ status, diagnostics, zoc: zocSubsetDiagnostic.facts });
}