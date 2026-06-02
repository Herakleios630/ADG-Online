"import { readFileSync, writeFileSync } from 'fs';

const c = readFileSync('src/state/p9-melee-v2.js', 'utf8');

// Fix 1: Escaped import quotes
const fixed1 = c.replaceAll('\"import {', 'import {');

// Fix 2: Duplicate constants
const start = fixed1.indexOf('export const COHESION_ACCOUNT_STATUSES = {');
const end = fixed1.indexOf('function getPendingMeleeBatchApplicationPlan(gameState) {');
if (start !== -1 && end !== -1) {
  const reExport = `// Cohesion re-exports from shared spine
export {
  COHESION_ACCOUNT_STATUSES,
  COHESION_ACCOUNT_LANE_KEYS,
  createEmptyCohesionLaneTotals,
  normalizeCohesionLaneTotals,
  sumCohesionLaneTotals,
  deriveCohesionAccountStatus,
  getNormalizedCohesionAccountForUnit,
  createCommittedCohesionHistoryEntry,
} from './p0-cohesion.js';
`;
  const result = fixed1.substring(0, start) + reExport + fixed1.substring(end);
  writeFileSync('src/state/p9-melee-v2.js', result, 'utf8');
  console.log('Fixed:', result.length);
} else {
  console.log('Duplicates already gone, start=', start, 'end=', end);
  writeFileSync('src/state/p9-melee-v2.js', fixed1, 'utf8');
}"