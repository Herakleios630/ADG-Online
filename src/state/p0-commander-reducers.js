import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { getUnitCommandRangeMeasurement, refundFreeCommandPoint, spendFreeCommandPoint } from '../engine/command/index.js';
import { getPointDistance } from '../engine/geometry/index.js';
import {
  canAttachCommanderToUnit,
  canResetCommanderFreeMove,
  canStartCommanderAttach,
  canUseCommanderFreeMove,
  finalizeCommandAttachmentState,
  getAttachedCommanderPose,
  getCommanderAttachActor,
  getSelectedCommanderUnit,
  isUnitFootprintWithinBattlefield,
} from './p0-commander-helpers.js';
import { setActiveCommandMenuBranch } from './p0-state-ui-helpers.js';

const COMMANDER_FREE_MOVE_UD = 5;
const POSITION_GUARD_EPSILON = 0.0001;

export function reduceSetCommanderPositionInBattle(state, action) {
  if (state.game.selectedUnitId !== action.unitId) {
    return state;
  }

  const unit = state.game.units.find((candidate) => candidate.id === action.unitId) || null;
  if (!unit || !canUseCommanderFreeMove(state, unit)) {
    return state;
  }

  const xUd = Number(action.xUd);
  const yUd = Number(action.yUd);
  if (!Number.isFinite(xUd) || !Number.isFinite(yUd)) {
    return state;
  }

  const currentSpentUd = Number(unit.advanceUsedUd ?? 0);
  const dragSpentUdAtStart = Number.isFinite(action.dragSpentUdAtStart)
    ? Number(action.dragSpentUdAtStart)
    : currentSpentUd;
  const dragOriginXUd = Number.isFinite(action.dragOriginXUd) ? Number(action.dragOriginXUd) : unit.xUd;
  const dragOriginYUd = Number.isFinite(action.dragOriginYUd) ? Number(action.dragOriginYUd) : unit.yUd;
  const maxDistanceUd = Number.isFinite(action.maxDistanceUd)
    ? Number(action.maxDistanceUd)
    : Math.max(0, COMMANDER_FREE_MOVE_UD - dragSpentUdAtStart);
  const distanceUd = getPointDistance(
    { x: dragOriginXUd, y: dragOriginYUd },
    { x: xUd, y: yUd },
  );

  if (distanceUd > maxDistanceUd + POSITION_GUARD_EPSILON) {
    return state;
  }

  const nextSpentUd = dragSpentUdAtStart + distanceUd;
  if (nextSpentUd > COMMANDER_FREE_MOVE_UD + POSITION_GUARD_EPSILON) {
    return state;
  }

  const previewUnit = {
    ...unit,
    xUd,
    yUd,
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  if (!isUnitFootprintWithinBattlefield(previewUnit, battlefieldProfile)) {
    return state;
  }

  return {
    ...state,
    game: {
      ...state.game,
      commanderFreeMovePreview: {
        status: 'ready',
        mode: 'move',
        unitId: unit.id,
        targetUnitId: null,
        xUd,
        yUd,
        nextSpentUd: Number(nextSpentUd.toFixed(3)),
        phaseStartXUd: Number.isFinite(unit.commanderMovePhaseStartXUd)
          ? unit.commanderMovePhaseStartXUd
          : dragOriginXUd,
        phaseStartYUd: Number.isFinite(unit.commanderMovePhaseStartYUd)
          ? unit.commanderMovePhaseStartYUd
          : dragOriginYUd,
      },
    },
  };
}

export function reduceAttachCommander(state, targetUnitId, createInitialCommanderFreeMovePreview) {
  const selectedCommander = getSelectedCommanderUnit(state.game);
  const commanderUnit = getCommanderAttachActor(state.game, selectedCommander);
  if (!commanderUnit || !canStartCommanderAttach(state.game, commanderUnit)) {
    return state;
  }

  const currentPreview = state.game.commanderFreeMovePreview;
  if (!targetUnitId || targetUnitId === selectedCommander?.id) {
    return {
      ...state,
      game: {
        ...setActiveCommandMenuBranch(state.game, 'attach'),
        commanderFreeMovePreview: {
          ...createInitialCommanderFreeMovePreview(),
          status: 'targeting',
          mode: 'attach',
          unitId: selectedCommander.id,
          xUd: commanderUnit.xUd,
          yUd: commanderUnit.yUd,
          nextSpentUd: Number(commanderUnit.advanceUsedUd ?? 0),
          phaseStartXUd: Number.isFinite(commanderUnit.commanderMovePhaseStartXUd)
            ? commanderUnit.commanderMovePhaseStartXUd
            : commanderUnit.xUd,
          phaseStartYUd: Number.isFinite(commanderUnit.commanderMovePhaseStartYUd)
            ? commanderUnit.commanderMovePhaseStartYUd
            : commanderUnit.yUd,
          attachOriginXUd: commanderUnit.xUd,
          attachOriginYUd: commanderUnit.yUd,
          attachOriginRotationRadians: commanderUnit.rotationRadians ?? 0,
          attachOriginAdvanceUsedUd: Number(commanderUnit.advanceUsedUd ?? 0),
        },
      },
    };
  }

  if (currentPreview?.status !== 'targeting' || currentPreview.mode !== 'attach' || currentPreview.unitId !== selectedCommander?.id) {
    return state;
  }

  const targetUnit = state.game.units.find((unit) => unit.id === targetUnitId) || null;
  if (!canAttachCommanderToUnit(state.game, targetUnit, commanderUnit)) {
    return state;
  }

  const attachedPose = getAttachedCommanderPose(targetUnit, commanderUnit);
  const previewCommander = {
    ...commanderUnit,
    xUd: attachedPose.xUd,
    yUd: attachedPose.yUd,
    rotationRadians: attachedPose.rotationRadians,
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  if (!isUnitFootprintWithinBattlefield(previewCommander, battlefieldProfile)) {
    return state;
  }

  const measurement = getUnitCommandRangeMeasurement(commanderUnit, targetUnit);
  if (!measurement) {
    return state;
  }

  return {
    ...state,
    game: {
      ...setActiveCommandMenuBranch(state.game, 'attach'),
      commanderFreeMovePreview: {
        status: 'ready',
        mode: 'attach',
        unitId: commanderUnit.id,
        targetUnitId: targetUnit.id,
        xUd: attachedPose.xUd,
        yUd: attachedPose.yUd,
        nextSpentUd: Number(((commanderUnit.advanceUsedUd ?? 0) + measurement.distanceUd).toFixed(3)),
        phaseStartXUd: Number.isFinite(commanderUnit.commanderMovePhaseStartXUd)
          ? commanderUnit.commanderMovePhaseStartXUd
          : commanderUnit.xUd,
        phaseStartYUd: Number.isFinite(commanderUnit.commanderMovePhaseStartYUd)
          ? commanderUnit.commanderMovePhaseStartYUd
          : commanderUnit.yUd,
        attachOriginXUd: currentPreview.attachOriginXUd,
        attachOriginYUd: currentPreview.attachOriginYUd,
        attachOriginRotationRadians: currentPreview.attachOriginRotationRadians,
        attachOriginAdvanceUsedUd: currentPreview.attachOriginAdvanceUsedUd,
      },
    },
  };
}

export function reduceCancelCommanderFreeMovePreview(state, createInitialCommanderFreeMovePreview) {
  if (state.game.commanderFreeMovePreview?.status === 'idle') {
    return state;
  }

  return {
    ...state,
    game: {
      ...setActiveCommandMenuBranch(state.game, null),
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
    },
  };
}

export function reduceConfirmCommanderFreeMove(state, createInitialCommanderFreeMovePreview) {
  const preview = state.game.commanderFreeMovePreview;
  if (preview?.status !== 'ready' || !preview.unitId || !Number.isFinite(preview.xUd) || !Number.isFinite(preview.yUd)) {
    return state;
  }

  const unit = state.game.units.find((candidate) => candidate.id === preview.unitId) || null;
  if (!unit) {
    return state;
  }

  if (preview.mode === 'attach') {
    const targetUnit = state.game.units.find((candidate) => candidate.id === preview.targetUnitId) || null;
    if (!targetUnit || !canAttachCommanderToUnit(state.game, targetUnit, unit)) {
      return state;
    }

    const updatedCommander = {
      ...unit,
      xUd: Number(preview.xUd),
      yUd: Number(preview.yUd),
      rotationRadians: targetUnit.rotationRadians ?? unit.rotationRadians ?? 0,
      attachedUnitId: targetUnit.id,
      attachOriginXUd: Number.isFinite(preview.attachOriginXUd) ? Number(preview.attachOriginXUd) : unit.xUd,
      attachOriginYUd: Number.isFinite(preview.attachOriginYUd) ? Number(preview.attachOriginYUd) : unit.yUd,
      attachOriginRotationRadians: Number.isFinite(preview.attachOriginRotationRadians)
        ? Number(preview.attachOriginRotationRadians)
        : (unit.rotationRadians ?? 0),
      attachOriginAdvanceUsedUd: Number.isFinite(preview.attachOriginAdvanceUsedUd)
        ? Number(preview.attachOriginAdvanceUsedUd)
        : Number(unit.advanceUsedUd ?? 0),
      advanceUsedUd: Number(preview.nextSpentUd ?? unit.advanceUsedUd ?? 0),
      slideUsedThisMovementPhase: false,
      stayedThisMovementPhase: false,
      commanderMovePhaseStartXUd: Number.isFinite(unit.commanderMovePhaseStartXUd)
        ? unit.commanderMovePhaseStartXUd
        : preview.phaseStartXUd,
      commanderMovePhaseStartYUd: Number.isFinite(unit.commanderMovePhaseStartYUd)
        ? unit.commanderMovePhaseStartYUd
        : preview.phaseStartYUd,
    };
    const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
    if (!isUnitFootprintWithinBattlefield(updatedCommander, battlefieldProfile)) {
      return state;
    }

    const isStartingCommanderMove = (unit.advanceUsedUd ?? 0) <= POSITION_GUARD_EPSILON;
    const commandPointSpendResult = isStartingCommanderMove
      ? spendFreeCommandPoint(state.game.commandContext.commandPoints, { unitId: unit.id })
      : { ok: true, nextState: state.game.commandContext.commandPoints };
    if (!commandPointSpendResult.ok) {
      return state;
    }

    const nextUnits = state.game.units.map((candidate) => {
      if (candidate.id === updatedCommander.id) {
        return updatedCommander;
      }

      if (candidate.id === targetUnit.id) {
        return {
          ...candidate,
          attachedCommanderId: unit.id,
        };
      }

      return candidate;
    });

    return {
      ...state,
      game: finalizeCommandAttachmentState(setActiveCommandMenuBranch({
        ...state.game,
        commandContext: {
          ...state.game.commandContext,
          commandPoints: commandPointSpendResult.nextState,
        },
        commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
        units: nextUnits,
      }, null)),
    };
  }

  if (!canUseCommanderFreeMove(state, unit)) {
    return state;
  }

  const updatedUnit = {
    ...unit,
    xUd: Number(preview.xUd),
    yUd: Number(preview.yUd),
    advanceUsedUd: Number(preview.nextSpentUd ?? unit.advanceUsedUd ?? 0),
    slideUsedThisMovementPhase: false,
    stayedThisMovementPhase: false,
    commanderMovePhaseStartXUd: Number.isFinite(unit.commanderMovePhaseStartXUd)
      ? unit.commanderMovePhaseStartXUd
      : preview.phaseStartXUd,
    commanderMovePhaseStartYUd: Number.isFinite(unit.commanderMovePhaseStartYUd)
      ? unit.commanderMovePhaseStartYUd
      : preview.phaseStartYUd,
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  if (!isUnitFootprintWithinBattlefield(updatedUnit, battlefieldProfile)) {
    return state;
  }

  const isStartingCommanderMove = (unit.advanceUsedUd ?? 0) <= POSITION_GUARD_EPSILON;
  const commandPointSpendResult = isStartingCommanderMove
    ? spendFreeCommandPoint(state.game.commandContext.commandPoints, { unitId: unit.id })
    : { ok: true, nextState: state.game.commandContext.commandPoints };
  if (!commandPointSpendResult.ok) {
    return state;
  }

  return {
    ...state,
    game: {
      ...setActiveCommandMenuBranch(state.game, null),
      commandContext: {
        ...state.game.commandContext,
        commandPoints: commandPointSpendResult.nextState,
      },
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      units: state.game.units.map((candidate) =>
        candidate.id === updatedUnit.id ? updatedUnit : candidate
      ),
    },
  };
}

export function reduceResetCommanderFreeMove(state, unitId, createInitialCommanderFreeMovePreview) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  if (!unit || !canResetCommanderFreeMove(state, unit)) {
    return state;
  }

  const commandPoints = state.game.commandContext.commandPoints;
  const shouldRefundFreeCp = Number(commandPoints?.free ?? 0) < 1;
  const refundResult = shouldRefundFreeCp
    ? refundFreeCommandPoint(commandPoints, { unitId })
    : { ok: true, nextState: commandPoints };
  if (!refundResult.ok) {
    return state;
  }

  return {
    ...state,
    game: {
      ...setActiveCommandMenuBranch(state.game, null),
      commandContext: {
        ...state.game.commandContext,
        commandPoints: refundResult.nextState,
      },
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      units: state.game.units.map((candidate) =>
        candidate.id === unitId
          ? {
              ...candidate,
              xUd: unit.commanderMovePhaseStartXUd,
              yUd: unit.commanderMovePhaseStartYUd,
              advanceUsedUd: 0,
              slideUsedThisMovementPhase: false,
              stayedThisMovementPhase: false,
              commanderMovePhaseStartXUd: null,
              commanderMovePhaseStartYUd: null,
            }
          : candidate
      ),
    },
  };
}