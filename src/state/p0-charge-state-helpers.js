import {
  CHARGE_PREVIEW_STATUSES,
  createChargeIntent,
} from '../engine/charge/index.js';
import { toCorpsSlotId } from './p0-corps-slot.js';
import { hasUnitFinishedMovementPhase } from './p0-movement.js';
import { canConfirmChargeDirection } from './p0-charge-preview-helpers.js';

const MOVEMENT_PHASE_ID = 'movement';

function isUnitSelectableInCurrentCorps(state, unit) {
  if (!unit || unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  if (!activeCorpsSlotId) {
    return true;
  }

  return toCorpsSlotId(unit.corpsId) === activeCorpsSlotId;
}

export function cloneCommandSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }

  return {
    status: snapshot.status ?? 'placeholder',
    unitId: snapshot.unitId ?? null,
    corpsId: snapshot.corpsId ?? null,
    distanceUd: Number.isFinite(snapshot.distanceUd) ? snapshot.distanceUd : null,
    commandRangeUd: Number.isFinite(snapshot.commandRangeUd) ? snapshot.commandRangeUd : null,
    label: snapshot.label ?? '',
    sourceStatus: snapshot.sourceStatus ?? 'placeholder',
  };
}

export function createChargeIntentFromUnit(gameState, unit) {
  return createChargeIntent({
    unitId: unit.id,
    startPose: {
      xUd: Number(unit.xUd),
      yUd: Number(unit.yUd),
      rotationRadians: Number(unit.rotationRadians ?? 0),
    },
    commandSnapshot: cloneCommandSnapshot(gameState.commandContext?.inCommand),
  });
}

export function createChargeTargetSnapshot(unit) {
  if (!unit) {
    return null;
  }

  return {
    unitId: unit.id,
    owner: unit.owner ?? null,
    corpsId: unit.corpsId ?? null,
    xUd: Number(unit.xUd),
    yUd: Number(unit.yUd),
    rotationRadians: Number(unit.rotationRadians ?? 0),
  };
}

export function getChargePreviewUnavailableReason(
  state,
  unit = state.game.units.find((candidate) => candidate.id === state.game.selectedUnitId) || null,
) {
  if (!unit) {
    return 'Waehle zuerst eine Einheit fuer Charge aus.';
  }

  if (state.game.setup.isActive) {
    return 'Charge bleibt waehrend des Setups gesperrt.';
  }

  if (state.game.commandContext.currentPhaseId !== MOVEMENT_PHASE_ID) {
    return 'Charge ist nur in der Movement-Phase verfuegbar.';
  }

  if (!isUnitSelectableInCurrentCorps(state, unit)) {
    return 'Charge ist nur fuer Einheiten des aktiven Corps und aktiven Spielers verfuegbar.';
  }

  if (hasUnitFinishedMovementPhase(unit)) {
    return 'Diese Einheit hat ihre Bewegung in dieser Phase bereits beendet und kann nicht mehr chargen.';
  }

  if (state.game.chargePreview?.status && state.game.chargePreview.status !== CHARGE_PREVIEW_STATUSES.IDLE) {
    return 'Eine andere Charge-Vorschau ist noch offen. Erst abschliessen oder abbrechen.';
  }

  const hasPendingMovementPreview = Array.isArray(state.game.movement?.preview?.segments)
    && state.game.movement.preview.segments.length > 0;
  if (hasPendingMovementPreview) {
    return 'Charge kann erst gestartet werden, wenn die laufende Bewegungs-Vorschau bestaetigt oder verworfen wurde.';
  }

  const hasPendingCommanderPreview = state.game.commanderFreeMovePreview?.status === 'targeting'
    || state.game.commanderFreeMovePreview?.status === 'ready';
  if (hasPendingCommanderPreview) {
    return 'Charge kann nicht waehrend einer laufenden Kommandeurs-Vorschau gestartet werden.';
  }

  return null;
}

export function canStartChargePreview(
  state,
  unit = state.game.units.find((candidate) => candidate.id === state.game.selectedUnitId) || null,
) {
  return getChargePreviewUnavailableReason(state, unit) === null;
}

export function canConfirmChargePreviewDirection(preview) {
  return canConfirmChargeDirection(preview);
}