export const BATTLE_PLAN_FIELD_IDS = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  FLANK_MARCH: 'flank-march',
};

export const BATTLE_PLAN_SOURCE_STATUSES = {
  PLACEHOLDER: 'placeholder',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export function createBattlePlanCorpsCard(overrides = {}) {
  return {
    id: overrides.id ?? 'corps-1',
    label: overrides.label ?? 'Corps I',
    owner: overrides.owner ?? 'player-1',
    assignmentFieldId: overrides.assignmentFieldId ?? null,
    sourceStatus: overrides.sourceStatus ?? BATTLE_PLAN_SOURCE_STATUSES.PLACEHOLDER,
  };
}

export function createInitialBattlePlanState() {
  return {
    owner: 'player-1',
    visibilityScope: 'owner-only',
    lockState: 'draft',
    sourceStatus: BATTLE_PLAN_SOURCE_STATUSES.PLACEHOLDER,
    selectedCorpsId: null,
    corpsCards: [
      createBattlePlanCorpsCard({ id: 'corps-1', label: 'Corps I' }),
      createBattlePlanCorpsCard({ id: 'corps-2', label: 'Corps II' }),
      createBattlePlanCorpsCard({ id: 'corps-3', label: 'Corps III' }),
    ],
    fieldAssignments: {
      [BATTLE_PLAN_FIELD_IDS.LEFT]: [],
      [BATTLE_PLAN_FIELD_IDS.CENTER]: [],
      [BATTLE_PLAN_FIELD_IDS.RIGHT]: [],
      [BATTLE_PLAN_FIELD_IDS.FLANK_MARCH]: [],
    },
  };
}

export function assignCorpsToBattlePlanField(battlePlan, corpsId, fieldId) {
  const nextAssignments = Object.fromEntries(
    Object.entries(battlePlan.fieldAssignments).map(([assignmentFieldId, corpsIds]) => [
      assignmentFieldId,
      corpsIds.filter((currentCorpsId) => currentCorpsId !== corpsId),
    ]),
  );

  nextAssignments[fieldId] = [...(nextAssignments[fieldId] ?? []), corpsId];

  return {
    ...battlePlan,
    selectedCorpsId: corpsId,
    corpsCards: battlePlan.corpsCards.map((corpsCard) =>
      corpsCard.id === corpsId
        ? {
            ...corpsCard,
            assignmentFieldId: fieldId,
          }
        : corpsCard,
    ),
    fieldAssignments: nextAssignments,
  };
}