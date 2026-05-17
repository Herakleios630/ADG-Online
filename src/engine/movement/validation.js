import {
  createMovementPreview,
  getLastCommittedMovementPreviewSegment,
  MOVEMENT_COMMAND_IDS,
  MOVEMENT_PREVIEW_STATUSES,
} from './model.js';

export const MOVEMENT_VALIDATION_STATUSES = {
  IDLE: 'idle',
  VALID: 'valid',
  INVALID: 'invalid',
};

const DIAGNOSTIC_STATUSES = ['verified', 'blocked', 'placeholder', 'needs-source-check'];

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

function createValidationDiagnostic(diagnostic = {}, index = 0) {
  return {
    id: diagnostic.id || `movement-validation-${index + 1}`,
    label: diagnostic.label || 'Validation',
    status: normalizeDiagnosticStatus(diagnostic.status),
    text: diagnostic.text || '',
  };
}

export function createMovementValidationSnapshot(snapshot = {}) {
  return {
    status: normalizeValidationStatus(snapshot.status),
    diagnostics: Array.isArray(snapshot.diagnostics)
      ? snapshot.diagnostics.map((diagnostic, index) => createValidationDiagnostic(diagnostic, index))
      : [],
  };
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

export function buildMovementValidationSnapshot({ selectedUnit, selectedCommandId, preview, commandContext }) {
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
    text: 'Official allowances, terrain effects, ZOC restrictions, difficult maneuvers, group movement, special troop exceptions, and contact/conformation remain outside the current P4 legality scope.',
  });

  const status = diagnostics.some((diagnostic) => diagnostic.status === 'blocked')
    ? MOVEMENT_VALIDATION_STATUSES.INVALID
    : MOVEMENT_VALIDATION_STATUSES.VALID;

  return createMovementValidationSnapshot({ status, diagnostics });
}