import {
  getMeleeParticipationByUnitId,
  getMeleeProcedurePresentation,
  getMeleeUnitParticipation,
  getMeleeUnitStatus,
  MELEE_PROCEDURE_STATUSES,
} from '../state/p9-melee-v2.js';

export function normalizeMeleeSourceStatus(value) {
  if (typeof value !== 'string') {
    return 'source-open';
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : 'source-open';
}

export {
  getMeleeParticipationByUnitId,
  getMeleeProcedurePresentation,
  getMeleeUnitParticipation,
  getMeleeUnitStatus,
  MELEE_PROCEDURE_STATUSES,
};
