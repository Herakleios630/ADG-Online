import { createChargeDrillScenario } from './src/data/charge-drill-scenarios.js';
import { getBattlefieldProfile } from './src/data/battlefield-profiles.js';
import { getChargeTargetCandidates, getChargeTargetCandidateByUnitId } from './src/engine/charge/index.js';

const scenario = createChargeDrillScenario();
const battlefieldProfile = getBattlefieldProfile('standard');

const chargingUnitId = 'charge-drill-p1-evade-blocker-charger';
const targetUnitId = 'charge-drill-p2-evade-blocker-target';

const startPose = { x: 28.5, y: 17, rot: 0 };
const remainingChargeRangeUd = 4;
const chargeContext = {
  isAdvanceOnly: true,
};

// Update charger pose and remaining range
scenario.units = scenario.units.map(u => {
  if (u.id === chargingUnitId) {
    return { ...u, ...startPose, remainingChargeRangeUd };
  }
  return u;
});

const candidates = getChargeTargetCandidates({
  units: scenario.units,
  chargingUnitId,
  battlefieldProfile,
  chargeContext
});

const candidate = getChargeTargetCandidateByUnitId(candidates, targetUnitId);

if (candidate) {
  console.log('Status:', candidate.status);
  console.log('Reason:', candidate.reason);
  console.log('Diagnostics:', JSON.stringify(candidate.diagnostics, null, 2));
} else {
  console.log('Candidate not found');
}
