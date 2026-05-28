import { getRemainingAdvanceBudgetUd } from './p0-advance.js';
import { toCorpsSlotId } from './p0-corps-slot.js';
import { createInitialMovementState } from './p0-movement.js';
import { applyUnitShootingSequenceFlags } from './p0-shooting.js';
import { setActiveCommandMenuBranch } from './p0-state-ui-helpers.js';

const MOVEMENT_PHASE_ID = 'movement';
const COMMANDER_FREE_MOVE_UD = 5;
const POSITION_GUARD_EPSILON = 0.0001;

function canMarkUnitStay(state, unit) {
  if (!unit || state.game.setup.isActive) {
    return false;
  }

  if (state.game.commandContext.currentPhaseId !== MOVEMENT_PHASE_ID) {
    return false;
  }

  if (unit.owner !== state.game.commandContext.activePlayerId) {
    return false;
  }

  if ((unit.advanceUsedUd ?? 0) > POSITION_GUARD_EPSILON || unit.stayedThisMovementPhase) {
    return false;
  }

  const activeCorpsSlotId = toCorpsSlotId(state.game.commandContext.activeCorpsId);
  const unitCorpsSlotId = toCorpsSlotId(unit.corpsId);

  return Boolean(activeCorpsSlotId && unitCorpsSlotId && activeCorpsSlotId === unitCorpsSlotId);
}

export function reduceMarkUnitStay(state, unitId, createInitialCommanderFreeMovePreview) {
  const unit = state.game.units.find((candidate) => candidate.id === unitId) || null;
  if (!canMarkUnitStay(state, unit)) {
    return state;
  }

  const hasMandatoryMovementPending = Boolean(unit.mandatoryMovementPending ?? unit.mustMoveThisPhase);
  if (hasMandatoryMovementPending) {
    return state;
  }

  const stayBudgetUd = unit.isCommander && !unit.hasIncludedCommander
    ? COMMANDER_FREE_MOVE_UD
    : (unit.advanceUsedUd ?? 0) + getRemainingAdvanceBudgetUd(unit, state.game.units);

  return {
    ...state,
    game: {
      ...setActiveCommandMenuBranch(state.game, null),
      commanderFreeMovePreview: createInitialCommanderFreeMovePreview(),
      movement: createInitialMovementState(),
      units: state.game.units.map((candidate) =>
        candidate.id === unitId
          ? {
              ...applyUnitShootingSequenceFlags(candidate, {
                incrementMoveCount: true,
              }),
              advanceUsedUd: stayBudgetUd,
              slideUsedThisMovementPhase: false,
              stayedThisMovementPhase: true,
            }
          : candidate,
      ),
    },
  };
}