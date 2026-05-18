import { getFootprintCommandRangeMeasurement } from '../command/range.js';
import { createMovementPreview, getMovementPreviewSpentBudgetUd } from './model.js';

const MOVEMENT_BUDGET_EPSILON = 1e-6;
const HEAVY_INFANTRY_OPERATIONAL_ZONE_THRESHOLD_UD = 4;

const MOVEMENT_BUDGETS_BY_TROOP_TYPE = {
  cavalry: 4,
  'medium-infantry': 3,
};

function normalizeTroopType(troopType) {
  return String(troopType ?? '').trim().toLowerCase();
}

function getEnemyUnitsForSelectedUnit(selectedUnit, units = []) {
  if (!selectedUnit || !Array.isArray(units)) {
    return [];
  }

  return units.filter((unit) => unit.id !== selectedUnit.id && unit.owner !== selectedUnit.owner);
}

function chooseNearestEnemyMeasurement(selectedUnit, enemyUnits) {
  let nearestMeasurement = null;

  for (const enemyUnit of enemyUnits) {
    const measurement = getFootprintCommandRangeMeasurement(selectedUnit, enemyUnit);

    if (!nearestMeasurement || measurement.distanceUd < nearestMeasurement.distanceUd - MOVEMENT_BUDGET_EPSILON) {
      nearestMeasurement = {
        ...measurement,
        enemyUnitId: enemyUnit.id ?? null,
      };
    }
  }

  return nearestMeasurement;
}

function createBudgetResult(result = {}) {
  return {
    active: Boolean(result.active),
    status: result.status ?? 'placeholder',
    label: result.label ?? 'Movement budget subset',
    text: result.text ?? '',
    troopType: result.troopType ?? null,
    budgetUd: Number.isFinite(result.budgetUd) ? result.budgetUd : null,
    spentBudgetUd: Number.isFinite(result.spentBudgetUd) ? result.spentBudgetUd : 0,
    remainingBudgetUd: Number.isFinite(result.remainingBudgetUd) ? result.remainingBudgetUd : null,
    nearestEnemyDistanceUd: Number.isFinite(result.nearestEnemyDistanceUd) ? result.nearestEnemyDistanceUd : null,
    nearestEnemyUnitId: result.nearestEnemyUnitId ?? null,
    operationalZoneActive: Boolean(result.operationalZoneActive),
    operationalZoneText: result.operationalZoneText ?? '',
  };
}

export function getUnitMovementBudgetUd({ selectedUnit, units = [] }) {
  const evaluatedBudget = evaluateMovementBudgetSubset({
    selectedUnit,
    preview: undefined,
    units,
  });

  if (Number.isFinite(evaluatedBudget.budgetUd)) {
    return evaluatedBudget.budgetUd;
  }

  return 4;
}

export function evaluateMovementBudgetSubset({ selectedUnit, preview, units = [] }) {
  const normalizedPreview = createMovementPreview(preview);
  const spentBudgetUd = getMovementPreviewSpentBudgetUd(normalizedPreview);

  if (!selectedUnit) {
    return createBudgetResult({
      active: false,
      text: 'Movement budget subset needs a selected unit before troop allowances can be evaluated.',
      spentBudgetUd,
    });
  }

  const troopType = normalizeTroopType(selectedUnit.troopType);

  if (troopType === 'heavy-infantry') {
    const nearestMeasurement = chooseNearestEnemyMeasurement(selectedUnit, getEnemyUnitsForSelectedUnit(selectedUnit, units));
    const nearestEnemyDistanceUd = nearestMeasurement?.distanceUd ?? Number.POSITIVE_INFINITY;
    const operationalZoneActive = nearestEnemyDistanceUd > HEAVY_INFANTRY_OPERATIONAL_ZONE_THRESHOLD_UD + MOVEMENT_BUDGET_EPSILON;
    const budgetUd = operationalZoneActive ? 3 : 2;
    const remainingBudgetUd = Math.max(0, budgetUd - spentBudgetUd);
    const status = spentBudgetUd > budgetUd + MOVEMENT_BUDGET_EPSILON ? 'blocked' : 'verified';
    const distanceText = Number.isFinite(nearestEnemyDistanceUd)
      ? `${nearestEnemyDistanceUd.toFixed(3)} UD`
      : 'no enemy footprint on table';
    const operationalZoneText = operationalZoneActive
      ? Number.isFinite(nearestEnemyDistanceUd)
        ? `Heavy infantry starts more than 4 UD from the nearest enemy footprint (${distanceText}), so the approved P6 subset grants the 3 UD operational-zone budget.`
        : 'Heavy infantry has no enemy footprint on table, so the approved P6 subset grants the 3 UD operational-zone budget.'
      : `Heavy infantry starts within 4 UD of enemy footprint ${nearestMeasurement?.enemyUnitId ?? 'unknown'}, so the approved P6 subset keeps the 2 UD budget.`;

    return createBudgetResult({
      active: true,
      status,
      troopType,
      budgetUd,
      spentBudgetUd,
      remainingBudgetUd,
      nearestEnemyDistanceUd,
      nearestEnemyUnitId: nearestMeasurement?.enemyUnitId ?? null,
      operationalZoneActive,
      operationalZoneText,
      text: status === 'blocked'
        ? `Current preview spends ${spentBudgetUd.toFixed(3)} UD, which exceeds the approved P6 subset budget of ${budgetUd.toFixed(3)} UD for heavy infantry.`
        : `Current preview spends ${spentBudgetUd.toFixed(3)} UD out of the approved P6 subset budget of ${budgetUd.toFixed(3)} UD for heavy infantry.`,
    });
  }

  const budgetUd = MOVEMENT_BUDGETS_BY_TROOP_TYPE[troopType];

  if (!Number.isFinite(budgetUd)) {
    return createBudgetResult({
      active: false,
      troopType,
      spentBudgetUd,
      text: `Movement budget subset is not yet defined for troop type '${troopType || 'unknown'}'.`,
    });
  }

  const remainingBudgetUd = Math.max(0, budgetUd - spentBudgetUd);
  const status = spentBudgetUd > budgetUd + MOVEMENT_BUDGET_EPSILON ? 'blocked' : 'verified';

  return createBudgetResult({
    active: true,
    status,
    troopType,
    budgetUd,
    spentBudgetUd,
    remainingBudgetUd,
    text: status === 'blocked'
      ? `Current preview spends ${spentBudgetUd.toFixed(3)} UD, which exceeds the approved P6 subset budget of ${budgetUd.toFixed(3)} UD for ${troopType}.`
      : `Current preview spends ${spentBudgetUd.toFixed(3)} UD out of the approved P6 subset budget of ${budgetUd.toFixed(3)} UD for ${troopType}.`,
  });
}