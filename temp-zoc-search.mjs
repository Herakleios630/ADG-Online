import { createChargeDrillScenario } from './src/data/charge-drill-scenarios.js';
import { getChargeTargetCandidates } from './src/engine/charge/declaration.js';
import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from './src/data/battlefield-profiles.js';

const profile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
const chargerXs = [25.5, 26.0, 26.5, 27.0];
const chargerYs = [17.0];
const sentryXs = [27.2, 27.5, 27.8, 28.1, 28.4];
const sentryYs = [14.5, 15.0, 15.5];
const sentryRotations = [-Math.PI / 2, 0, Math.PI / 2];
const sentryWidths = [1.0, 1.25, 1.5];
const sentryDepths = [0.75, 1.0];
const targetXs = [25.8, 26.1, 26.4, 26.7, 27.0, 27.3];
const targetYs = [12.8, 13.0, 13.2, 13.4];
const found = [];

outer:
for (const cx of chargerXs) {
  for (const cy of chargerYs) {
    for (const sx of sentryXs) {
      for (const sy of sentryYs) {
        for (const rotation of sentryRotations) {
          for (const width of sentryWidths) {
            for (const depth of sentryDepths) {
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
                  sentry.widthUd = width;
                  sentry.depthUd = depth;
                  sentry.baseShape = 'square';
                  sentry.rotationRadians = rotation;
                  sentry.facing = rotation === -Math.PI / 2 ? 'west' : rotation === Math.PI / 2 ? 'east' : 'north';

                  const target = scenario.units.find((unit) => unit.id === 'charge-drill-p2-zoc-target');
                  target.xUd = tx;
                  target.yUd = ty;
                  target.rotationRadians = Math.PI;
                  target.facing = 'south';

                  const candidates = getChargeTargetCandidates({
                    units: scenario.units,
                    chargingUnitId: 'charge-drill-p1-zoc-charger',
                    battlefieldProfile: profile,
                  });
                  const candidate = candidates.find((entry) => entry.unitId === 'charge-drill-p2-zoc-target');
                  if (!candidate) {
                    continue;
                  }
                  if (candidate.status !== 'blocked') {
                    continue;
                  }
                  if (!candidate.reason.includes('feindliche ZoC')) {
                    continue;
                  }
                  found.push({
                    charger: { xUd: cx, yUd: cy },
                    sentry: { xUd: sx, yUd: sy, rotationRadians: rotation, widthUd: width, depthUd: depth },
                    target: { xUd: tx, yUd: ty },
                    reason: candidate.reason,
                  });
                  if (found.length >= 5) {
                    break outer;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

console.log(JSON.stringify(found, null, 2));
