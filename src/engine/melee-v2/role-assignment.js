export const MELEE_V2_ROLE_ASSIGNMENT_VERSION = 'v2';

function createUnitMap(gameState) {
  const units = Array.isArray(gameState?.units) ? gameState.units : [];
  return new Map(units.map((unit) => [unit?.id, unit]));
}

export function assignMeleeV2Roles({ contactModel, gameState } = {}) {
  const unitById = createUnitMap(gameState);
  const contacts = Array.isArray(contactModel?.contacts) ? contactModel.contacts : [];

  const assignments = contacts.map((contact) => {
    const attackerUnit = unitById.get(contact?.attackerUnitId) ?? null;
    const role = attackerUnit?.meleeContactEvidence?.contactRole ?? 'main';
    const sourceStatus = typeof attackerUnit?.meleeContactEvidence?.contactRole === 'string'
      ? 'verified'
      : 'source-open';

    return {
      meleeId: contact?.meleeId ?? null,
      attackerUnitId: contact?.attackerUnitId ?? null,
      defenderUnitId: contact?.defenderUnitId ?? null,
      attackerRole: role,
      sourceStatus,
    };
  });

  const sourceOpenAssignments = assignments.filter((assignment) => assignment?.sourceStatus !== 'verified').length;

  return {
    version: MELEE_V2_ROLE_ASSIGNMENT_VERSION,
    sourceStatus: sourceOpenAssignments > 0 ? 'source-open' : 'verified',
    assignments,
    sourceOpenAssignments,
  };
}
