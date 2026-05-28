import { getUnitCommandRangeMeasurement } from '../engine/command/index.js';
import {
  addVectors,
  getAxesFromRotation,
  getRotatedRectangleBounds,
  scaleVector,
} from '../engine/geometry/index.js';
import { toCorpsSlotId } from './p0-corps-slot.js';
import { syncCommandContextSnapshots } from './p0-command-context.js';
import { withMovementValidationSnapshot } from './p0-movement.js';

const MOVEMENT_PHASE_ID = 'movement';
const COMMANDER_FREE_MOVE_UD = 5;
const POSITION_GUARD_EPSILON = 0.0001;

export function isUnitFootprintWithinBattlefield(unit, battlefieldProfile) {
  const bounds = getRotatedRectangleBounds({
    center: { x: unit.xUd, y: unit.yUd },
    widthUd: unit.widthUd,
    depthUd: unit.depthUd,
    rotationRadians: unit.rotationRadians ?? 0,
  });

  return bounds.minX >= 0
    && bounds.maxX <= battlefieldProfile.widthUd
    && bounds.minY >= 0
    && bounds.maxY <= battlefieldProfile.heightUd;
}

function isUnitInActiveCorps(gameState, unit) {
  if (!unit) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(gameState.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
  return Boolean(activeCorpsSlotId && unitCorpsSlotId && activeCorpsSlotId === unitCorpsSlotId);
}

function getActiveCommanderUnit(gameState) {
  const commanderId = gameState.commandContext?.commander?.unitId;
  if (!commanderId) {
    return null;
  }

  return gameState.units.find((unit) => unit.id === commanderId) || null;
}

export function getSelectedCommanderUnit(gameState) {
  const selectedUnit = gameState.units.find((unit) => unit.id === gameState.selectedUnitId) || null;
  return selectedUnit?.isCommander && !selectedUnit.hasIncludedCommander ? selectedUnit : null;
}

function getCommanderPreviewActor(gameState, commanderUnit = getSelectedCommanderUnit(gameState)) {
  if (!commanderUnit) {
    return null;
  }

  const preview = gameState.commanderFreeMovePreview;
  if (
    preview?.unitId !== commanderUnit.id
    || !Number.isFinite(preview?.xUd)
    || !Number.isFinite(preview?.yUd)
    || !Number.isFinite(preview?.nextSpentUd)
  ) {
    return commanderUnit;
  }

  return {
    ...commanderUnit,
    xUd: Number(preview.xUd),
    yUd: Number(preview.yUd),
    advanceUsedUd: Number(preview.nextSpentUd),
  };
}

export function getCommanderAttachActor(gameState, commanderUnit = null) {
  return getCommanderPreviewActor(gameState, commanderUnit ?? getSelectedCommanderUnit(gameState) ?? getActiveCommanderUnit(gameState));
}

export function getAttachedCommanderPose(hostUnit, commanderUnit) {
  const { forwardAxis } = getAxesFromRotation(hostUnit.rotationRadians ?? 0);
  const center = addVectors(
    { x: hostUnit.xUd, y: hostUnit.yUd },
    scaleVector(forwardAxis, -((hostUnit.depthUd / 2) + (commanderUnit.depthUd / 2))),
  );

  return {
    xUd: Number(center.x.toFixed(3)),
    yUd: Number(center.y.toFixed(3)),
    rotationRadians: hostUnit.rotationRadians ?? commanderUnit.rotationRadians ?? 0,
  };
}

export function finalizeCommandAttachmentState(gameState) {
  const syncedGameState = syncCommandContextSnapshots(gameState);
  return {
    ...syncedGameState,
    movement: withMovementValidationSnapshot(syncedGameState, syncedGameState.movement),
  };
}

export function syncAttachedCommanderWithHost(gameState, hostUnitId) {
  const hostUnit = gameState.units.find((unit) => unit.id === hostUnitId) || null;
  if (!hostUnit?.attachedCommanderId) {
    return gameState;
  }

  const commanderUnit = gameState.units.find((unit) => unit.id === hostUnit.attachedCommanderId) || null;
  if (!commanderUnit) {
    return gameState;
  }

  const attachedPose = getAttachedCommanderPose(hostUnit, commanderUnit);
  const nextUnits = gameState.units.map((unit) => (
    unit.id === commanderUnit.id
      ? {
          ...unit,
          xUd: attachedPose.xUd,
          yUd: attachedPose.yUd,
          rotationRadians: attachedPose.rotationRadians,
        }
      : unit
  ));

  return finalizeCommandAttachmentState({
    ...gameState,
    units: nextUnits,
  });
}

export function clearAttachmentRelationsForUnit(units, unitId) {
  const unit = units.find((candidate) => candidate.id === unitId) || null;
  if (!unit) {
    return units;
  }

  const attachedHostId = unit.attachedUnitId ?? null;
  const attachedCommanderId = unit.attachedCommanderId ?? null;

  return units.map((candidate) => {
    if (candidate.id === unitId) {
      return {
        ...candidate,
        attachedUnitId: null,
        attachedCommanderId: null,
      };
    }

    if (attachedHostId && candidate.id === attachedHostId) {
      return {
        ...candidate,
        attachedCommanderId: null,
      };
    }

    if (attachedCommanderId && candidate.id === attachedCommanderId) {
      return {
        ...candidate,
        xUd: Number.isFinite(candidate.attachOriginXUd) ? candidate.attachOriginXUd : candidate.xUd,
        yUd: Number.isFinite(candidate.attachOriginYUd) ? candidate.attachOriginYUd : candidate.yUd,
        rotationRadians: Number.isFinite(candidate.attachOriginRotationRadians)
          ? candidate.attachOriginRotationRadians
          : candidate.rotationRadians,
        advanceUsedUd: Number.isFinite(candidate.attachOriginAdvanceUsedUd)
          ? candidate.attachOriginAdvanceUsedUd
          : candidate.advanceUsedUd,
        attachedUnitId: null,
        attachOriginXUd: null,
        attachOriginYUd: null,
        attachOriginRotationRadians: null,
        attachOriginAdvanceUsedUd: null,
      };
    }

    return candidate;
  });
}

export function canAttachCommanderToUnit(
  gameState,
  targetUnit = gameState.units.find((unit) => unit.id === gameState.selectedUnitId) || null,
  commanderUnitOverride = null,
) {
  if (!targetUnit || gameState.setup.isActive || gameState.commandContext.currentPhaseId !== MOVEMENT_PHASE_ID) {
    return false;
  }

  const commanderUnit = getCommanderAttachActor(gameState, commanderUnitOverride);
  if (!commanderUnit || !commanderUnit.isCommander || commanderUnit.hasIncludedCommander) {
    return false;
  }

  if (commanderUnit.attachedUnitId || targetUnit.id === commanderUnit.id) {
    return false;
  }

  if (targetUnit.isCommander || targetUnit.hasIncludedCommander || targetUnit.attachedCommanderId) {
    return false;
  }

  if (targetUnit.owner !== gameState.commandContext.activePlayerId || commanderUnit.owner !== gameState.commandContext.activePlayerId) {
    return false;
  }

  if (!isUnitInActiveCorps(gameState, targetUnit) || !isUnitInActiveCorps(gameState, commanderUnit)) {
    return false;
  }

  const measurement = getUnitCommandRangeMeasurement(commanderUnit, targetUnit);
  const remainingBudgetUd = COMMANDER_FREE_MOVE_UD - (commanderUnit.advanceUsedUd ?? 0);
  if (!measurement || measurement.distanceUd > remainingBudgetUd + POSITION_GUARD_EPSILON) {
    return false;
  }

  return Boolean(measurement && measurement.distanceUd <= COMMANDER_FREE_MOVE_UD + POSITION_GUARD_EPSILON);
}

export function getCommanderAttachRemainingUd(gameState, commanderUnit = getSelectedCommanderUnit(gameState)) {
  if (!commanderUnit || !commanderUnit.isCommander || commanderUnit.hasIncludedCommander || commanderUnit.attachedUnitId) {
    return 0;
  }

  return Math.max(0, COMMANDER_FREE_MOVE_UD - Number(commanderUnit.advanceUsedUd ?? 0));
}

export function canStartCommanderAttach(gameState, commanderUnit = getSelectedCommanderUnit(gameState)) {
  if (!commanderUnit || gameState.setup.isActive || gameState.commandContext.currentPhaseId !== MOVEMENT_PHASE_ID) {
    return false;
  }

  const selectedCommander = getSelectedCommanderUnit(gameState);
  const finishedCommander = selectedCommander && selectedCommander.id === commanderUnit.id
    ? selectedCommander
    : commanderUnit;

  if (!commanderUnit || !commanderUnit.isCommander || commanderUnit.hasIncludedCommander) {
    return false;
  }

  if ((finishedCommander?.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON || finishedCommander?.stayedThisMovementPhase) {
    return false;
  }

  if (commanderUnit.attachedUnitId) {
    return false;
  }

  if (!isUnitInActiveCorps(gameState, commanderUnit) || commanderUnit.owner !== gameState.commandContext.activePlayerId) {
    return false;
  }

  if (getCommanderAttachRemainingUd(gameState, commanderUnit) <= POSITION_GUARD_EPSILON) {
    return false;
  }

  const preview = gameState.commanderFreeMovePreview;
  return preview?.status === 'idle'
    || (preview?.unitId === commanderUnit.id && (preview?.mode === 'attach' || preview?.mode === 'move'));
}

export function canUseCommanderFreeMove(state, unit) {
  if (!unit || state.game.setup.isActive) {
    return false;
  }

  if (!unit.isCommander || unit.hasIncludedCommander || unit.attachedUnitId) {
    return false;
  }

  if ((unit.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON || unit.stayedThisMovementPhase) {
    return false;
  }

  if (state.game.commandContext.currentPhaseId !== MOVEMENT_PHASE_ID) {
    return false;
  }

  if (unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  const remainingBudgetUd = COMMANDER_FREE_MOVE_UD - (unit.advanceUsedUd ?? 0);
  if (remainingBudgetUd <= POSITION_GUARD_EPSILON) {
    return false;
  }

  const isStartingCommanderMove = (unit.advanceUsedUd ?? 0) <= POSITION_GUARD_EPSILON;
  if (isStartingCommanderMove && Number(state.game.commandContext?.commandPoints?.free ?? 0) < 1) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
  return Boolean(activeCorpsSlotId && unitCorpsSlotId && activeCorpsSlotId === unitCorpsSlotId);
}

export function canResetCommanderFreeMove(state, unit) {
  if (!unit || state.game.setup.isActive) {
    return false;
  }

  if (!unit.isCommander || unit.hasIncludedCommander || unit.attachedUnitId) {
    return false;
  }

  if (unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);
  const hasPhaseStartPose = Number.isFinite(unit.commanderMovePhaseStartXUd)
    && Number.isFinite(unit.commanderMovePhaseStartYUd);
  return Boolean(
    activeCorpsSlotId
      && unitCorpsSlotId
      && activeCorpsSlotId === unitCorpsSlotId
      && hasPhaseStartPose
      && (unit.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON,
  );
}