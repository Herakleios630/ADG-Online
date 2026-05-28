import { refundCommandPointsForUnit } from '../engine/command/index.js';
import { clearAttachmentRelationsForUnit, syncAttachedCommanderWithHost } from './p0-commander-helpers.js';
import { syncCommandContextSnapshots } from './p0-command-context.js';
import { createInitialMovementState } from './p0-movement.js';
import { createInitialCommandMenuState } from './p0-state-initializers.js';
import { createInitialAdvanceState } from './p0-advance.js';
import { createInitialSlideState } from './p0-slide.js';
import { createInitialWheelState } from './p0-wheel.js';

export function reduceResetTestUnits(
  state,
  unitId,
  createInitialCommanderFreeMovePreview,
  createInitialDebugState,
) {
  const resetUnitId = unitId ?? state.game.selectedUnitId;
  if (!resetUnitId) {
    return state;
  }

  const baselinePose = state.game.initialUnitPositions[resetUnitId];
  if (!baselinePose) {
    return state;
  }

  const detachedUnits = clearAttachmentRelationsForUnit(state.game.units, resetUnitId);
  const nextUnits = detachedUnits.map((unit) => (
    unit.id === resetUnitId
      ? {
          ...unit,
          xUd: baselinePose.xUd,
          yUd: baselinePose.yUd,
          rotationRadians: baselinePose.rotationRadians ?? unit.rotationRadians ?? 0,
          advanceUsedUd: 0,
          moveCountThisSequence: 0,
          slideUsedThisMovementPhase: false,
          stayedThisMovementPhase: false,
          hasChargedThisSequence: false,
          hasEvadedThisSequence: false,
          hasDisengagedThisSequence: false,
          retreatedOutOfZocThisSequence: false,
          cannotShootThisSequence: false,
          commanderMovePhaseStartXUd: null,
          commanderMovePhaseStartYUd: null,
          attachOriginXUd: null,
          attachOriginYUd: null,
          attachOriginRotationRadians: null,
          attachOriginAdvanceUsedUd: null,
          movementOrRallyLockedByConformation: false,
          conformationShiftLockSource: null,
          lastConformationShift: null,
          engagedInMelee: false,
          meleePending: false,
          meleePendingOpponentId: null,
          conformationApplied: null,
        }
      : unit
  ));
  const nextSelectedUnit = nextUnits.find((unit) => unit.id === state.game.selectedUnitId) || nextUnits[0] || null;
  const refundResult = refundCommandPointsForUnit(state.game.commandContext.commandPoints, resetUnitId);
  const nextGameState = syncCommandContextSnapshots({
    ...state.game,
    commandContext: {
      ...state.game.commandContext,
      commandPoints: refundResult.nextState,
    },
    commandMenu: createInitialCommandMenuState(),
    movement: createInitialMovementState(),
    commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
    ...createInitialAdvanceState(),
    ...createInitialSlideState(),
    ...createInitialWheelState(),
    debug: createInitialDebugState(nextSelectedUnit),
    units: nextUnits,
  }, state.game.selectedUnitId);
  const syncedResetGameState = syncAttachedCommanderWithHost(nextGameState, resetUnitId);

  return {
    ...state,
    game: syncedResetGameState,
  };
}