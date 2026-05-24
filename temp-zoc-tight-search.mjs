import { createChargeDrillScenario } from './src/data/charge-drill-scenarios.js';
import { getChargeTargetCandidates } from './src/engine/charge/declaration.js';
import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from './src/data/battlefield-profiles.js';

const profile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
const results = [];

const chargerXs = [24.5, 25.0, 25.5, 26.0];
const chargerYs = [16.5, 17.0, 17.5];
const sentryXs = [25.5, 26.0, 26.5, 27.0];
const sentryYs = [14.5, 15.0, 15.5];
const targetXs = [24.5, 25.0, 25.5, 26.0];
const targetYs = [12.5, 13.0, 13.5];

for (const cx of chargerXs) {
  for (const cy of chargerYs) {
    for (const sx of sentryXs) {
      for (const sy of sentryYs) {
        for (const tx of targetXs) {
          for (const ty of targetYs) {
            const scenario = createChargeDrillScenario();
            scenario.units.push({
              id: 'charge-drill-p1-zoc-charger',
              owner: 'player-1',
              corpsId: 'p1-corps-1',
              xUd: cx,
              yUd: cy,
              facing: 'north',
              widthUd: 1,
              depthUd: 0.75,
              rotationRadians: 0,
              advanceUsedUd: 0,
              slideUsedThisMovementPhase: false,
              stayedThisMovementPhase: false,
              commanderMovePhaseStartXUd: null,
              commanderMovePhaseStartYUd: null,
              troopType: 'cavalry',
              baseShape: 'rectangle',
              fixtureTag: 'charge-drill',
              isCommander: false,
              commanderQuality: null,
              commandRangeUd: null,
              hasIncludedCommander: false,
              attachedUnitId: null,
              attachedCommanderId: null,
              attachOriginXUd: null,
              attachOriginYUd: null,
              attachOriginRotationRadians: null,
              attachOriginAdvanceUsedUd: null,
              scenarioRole: 'zoc-charger',
              scenarioLabel: 'P1 ZoC Charger',
            });

            const sentry = scenario.units.find((unit) => unit.id === 'charge-drill-p2-zoc-sentry');
            sentry.xUd = sx;
            sentry.yUd = sy;
            sentry.facing = 'west';
            sentry.widthUd = 1.5;
            sentry.depthUd = 1;
            sentry.baseShape = 'square';
            sentry.rotationRadians = -Math.PI / 2;

            const target = scenario.units.find((unit) => unit.id === 'charge-drill-p2-zoc-target');
            target.xUd = tx;
            target.yUd = ty;
            target.facing = 'south';
            target.rotationRadians = Math.PI;

            const candidates = getChargeTargetCandidates({
              units: scenario.units,
              chargingUnitId: 'charge-drill-p1-zoc-charger',
              battlefieldProfile: profile,
            });
            const candidate = candidates.find((entry) => entry.unitId === 'charge-drill-p2-zoc-target');
            if (!candidate) continue;
            if (candidate.status !== 'blocked') continue;
            if (!candidate.reason.includes('feindliche ZoC')) continue;
            results.push({
              charger: { xUd: cx, yUd: cy },
              sentry: { xUd: sx, yUd: sy },
              target: { xUd: tx, yUd: ty },
              reason: candidate.reason,
            });
            if (results.length >= 5) {
              console.log(JSON.stringify(results, null, 2));
              process.exit(0);
            }
          }
        }
      }
    }
  }
}

console.log(JSON.stringify(results, null, 2));
