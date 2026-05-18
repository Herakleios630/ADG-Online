import { evaluateCommandRange } from './range.js';

export const IN_COMMAND_STATUSES = {
  PLACEHOLDER: 'placeholder',
  IN_COMMAND: 'in-command',
  OUT_OF_COMMAND: 'out-of-command',
  NO_ACTIVE_CORPS: 'no-active-corps',
  NO_COMMANDER: 'no-commander',
  WRONG_CORPS: 'wrong-corps',
};

function toCorpsSlotId(corpsId) {
  const raw = String(corpsId ?? '').toLowerCase();
  if (!raw) {
    return null;
  }

  const normalized = raw.replaceAll('_', '-');
  const match = normalized.match(/corps-(\d+)/);
  if (!match) {
    return null;
  }

  return `corps-${match[1]}`;
}

export function evaluateInCommand({ commanderUnit, selectedUnit, activeCorpsId }) {
  if (!activeCorpsId) {
    return {
      status: IN_COMMAND_STATUSES.NO_ACTIVE_CORPS,
      unitId: selectedUnit?.id ?? null,
      corpsId: selectedUnit?.corpsId ?? null,
      distanceUd: null,
      commandRangeUd: commanderUnit?.commandRangeUd ?? null,
      inRange: false,
      label: 'No active corps selected.',
      sourceStatus: 'needs-source-check',
    };
  }

  if (!commanderUnit) {
    return {
      status: IN_COMMAND_STATUSES.NO_COMMANDER,
      unitId: selectedUnit?.id ?? null,
      corpsId: activeCorpsId,
      distanceUd: null,
      commandRangeUd: null,
      inRange: false,
      label: 'Active corps commander unresolved.',
      sourceStatus: 'needs-source-check',
    };
  }

  if (!selectedUnit) {
    return {
      status: IN_COMMAND_STATUSES.PLACEHOLDER,
      unitId: null,
      corpsId: activeCorpsId,
      distanceUd: null,
      commandRangeUd: commanderUnit.commandRangeUd ?? null,
      inRange: false,
      label: 'Select a unit to evaluate command range.',
      sourceStatus: 'needs-source-check',
    };
  }

  if (toCorpsSlotId(selectedUnit.corpsId) !== toCorpsSlotId(activeCorpsId)) {
    return {
      status: IN_COMMAND_STATUSES.WRONG_CORPS,
      unitId: selectedUnit.id,
      corpsId: selectedUnit.corpsId ?? null,
      distanceUd: null,
      commandRangeUd: commanderUnit.commandRangeUd ?? null,
      inRange: false,
      label: 'Selected unit is outside the active corps.',
      sourceStatus: 'needs-source-check',
    };
  }

  const measurement = evaluateCommandRange(commanderUnit, selectedUnit, commanderUnit.commandRangeUd);
  return {
    status: measurement.inRange ? IN_COMMAND_STATUSES.IN_COMMAND : IN_COMMAND_STATUSES.OUT_OF_COMMAND,
    unitId: selectedUnit.id,
    corpsId: selectedUnit.corpsId ?? null,
    distanceUd: measurement.distanceUd,
    commandRangeUd: measurement.commandRangeUd,
    inRange: measurement.inRange,
    measurement,
    label: measurement.inRange
      ? `In command at ${measurement.distanceUd.toFixed(2)} UD.`
      : `Out of command at ${measurement.distanceUd.toFixed(2)} UD.`,
    sourceStatus: 'needs-source-check',
  };
}
