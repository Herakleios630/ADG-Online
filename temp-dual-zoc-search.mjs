import { getChargeTargetCandidates } from './src/engine/charge/declaration.js';
import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from './src/data/battlefield-profiles.js';
const profile = getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
const leftXs = [24.0, 24.25, 24.5, 24.75, 25.0];
const rightXs = [27.0, 27.25, 27.5, 27.75, 28.0];
const sentryYs = [14.5, 15.0, 15.5];
const widths = [1.0, 1.25, 1.5];
const depths = [0.75, 1.0];
const targetXs = [25.5, 26.0, 26.5];
const targetYs = [12.5, 13.0, 13.5];
const results = [];
for (const leftX of leftXs) {
  for (const rightX of rightXs) {
    for (const sentryY of sentryYs) {
      for (const width of widths) {
        for (const depth of depths) {
          for (const targetX of targetXs) {
            for (const targetY of targetYs) {
              const units = [
                { id: 'charger', owner: 'player-1', troopType: 'cavalry', xUd: 26, yUd: 17, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: 0 },
                { id: 'zoc-left', owner: 'player-2', troopType: 'medium-infantry', xUd: leftX, yUd: sentryY, widthUd: width, depthUd: depth, baseShape: 'square', rotationRadians: Math.PI / 2 },
                { id: 'zoc-right', owner: 'player-2', troopType: 'medium-infantry', xUd: rightX, yUd: sentryY, widthUd: width, depthUd: depth, baseShape: 'square', rotationRadians: -Math.PI / 2 },
                { id: 'selected-target', owner: 'player-2', troopType: 'cavalry', xUd: targetX, yUd: targetY, widthUd: 1, depthUd: 0.75, baseShape: 'rectangle', rotationRadians: Math.PI },
              ];
              const candidates = getChargeTargetCandidates({ units, chargingUnitId: 'charger', battlefieldProfile: profile });
              const candidate = candidates.find((entry) => entry.unitId === 'selected-target');
              if (!candidate) continue;
              if (candidate.status !== 'blocked') continue;
              if (!candidate.reason.includes('feindliche ZoC')) continue;
              results.push({ leftX, rightX, sentryY, width, depth, targetX, targetY, reason: candidate.reason });
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
}
console.log(JSON.stringify(results, null, 2));
