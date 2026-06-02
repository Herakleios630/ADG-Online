// fix_cohesion.cjs
const fs = require('fs');

const inputPath = 'src/state/p9-melee-v2.js';
const outputPath = 'src/state/p9-melee-v2.js.tmp';

let content = fs.readFileSync(inputPath, 'utf8');

// Fix escaped import
const oldEscaped = '\"import {\r\n  COHESION_ACCOUNT_STATUSES,\r\n  COHESION_ACCOUNT_LANE_KEYS,\r\n  createEmptyCohesionLaneTotals,\r\n  normalizeCohesionLaneTotals,\r\n  sumCohesionLaneTotals,\r\n  deriveCohesionAccountStatus,\r\n  getNormalizedCohesionAccountForUnit,\r\n  createCommittedCohesionHistoryEntry,\r\n} from \'./p0-cohesion.js\';\"';
const correctImport = 'import {\r\n  COHESION_ACCOUNT_STATUSES,\r\n  COHESION_ACCOUNT_LANE_KEYS,\r\n  createEmptyCohesionLaneTotals,\r\n  normalizeCohesionLaneTotals,\r\n  sumCohesionLaneTotals,\r\n  deriveCohesionAccountStatus,\r\n  getNormalizedCohesionAccountForUnit,\r\n  createCommittedCohesionHistoryEntry,\r\n} from \'./p0-cohesion.js\';';

if (content.includes(oldEscaped)) {
  content = content.replace(oldEscaped, correctImport);
  console.log('Fixed escaped import');
} else {
  console.log('No escaped import found');
}

// Replace duplicated definitions with re-exports
const blockStart = 'export const COHESION_ACCOUNT_STATUSES = {';
const blockEnd = 'function getPendingMeleeBatchApplicationPlan(gameState) {';

const si = content.indexOf(blockStart);
const ei = content.indexOf(blockEnd);

if (si === -1 || ei === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const before = content.substring(0, si);
const after = content.substring(ei);

const replacement = [
  '// Cohesion re-exports / canonical definitions live in p0-cohesion.js',
  'export {',
  '  COHESION_ACCOUNT_STATUSES,',
  '  COHESION_ACCOUNT_LANE_KEYS,',
  '  createEmptyCohesionLaneTotals,',
  '  normalizeCohesionLaneTotals,',
  '  sumCohesionLaneTotals,',
  '  deriveCohesionAccountStatus,',
  '  getNormalizedCohesionAccountForUnit,',
  '  createCommittedCohesionHistoryEntry,',
  '} from \'./p0-cohesion.js\';',
  '',
].join('\r\n');

const output = before + replacement + after;

fs.writeFileSync(outputPath, output, 'utf8');
console.log('Written', output.length, 'bytes to', outputPath);
