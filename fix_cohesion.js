"// fix_cohesion.js – Remove duplicate cohesion definitions from p9-melee-v2.js
const fs = require('fs');

const inputPath = 'src/state/p9-melee-v2.js';
const outputPath = 'src/state/p9-melee-v2.js.tmp';

let content = fs.readFileSync(inputPath, 'utf8');

// Step 1: Fix the escaped import (from previous bad edit)
const oldEscapedImport = '"import {\n  COHESION_ACCOUNT_STATUSES,\n  COHESION_ACCOUNT_LANE_KEYS,\n  createEmptyCohesionLaneTotals,\n  normalizeCohesionLaneTotals,\n  sumCohesionLaneTotals,\n  deriveCohesionAccountStatus,\n  getNormalizedCohesionAccountForUnit,\n  createCommittedCohesionHistoryEntry,\n} from \'./p0-cohesion.js\';"';
const correctImport = 'import {\n  COHESION_ACCOUNT_STATUSES,\n  COHESION_ACCOUNT_LANE_KEYS,\n  createEmptyCohesionLaneTotals,\n  normalizeCohesionLaneTotals,\n  sumCohesionLaneTotals,\n  deriveCohesionAccountStatus,\n  getNormalizedCohesionAccountForUnit,\n  createCommittedCohesionHistoryEntry,\n} from \'./p0-cohesion.js\';';

if (content.includes(oldEscapedImport)) {
  content = content.replace(oldEscapedImport, correctImport);
  console.log('Fixed escaped import quotes');
} else {
  console.log('Escaped import not found – may already be correct');
}

// Step 2: Replace duplicate constant/function definitions with a re-export block
const oldBlockStart = 'export const COHESION_ACCOUNT_STATUSES = {';
const oldBlockEnd = 'function getPendingMeleeBatchApplicationPlan(gameState) {';

const startIndex = content.indexOf(oldBlockStart);
const endIndex = content.indexOf(oldBlockEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('START or END marker not found. Aborting.');
  process.exit(1);
}

const beforeBlock = content.substring(0, startIndex);
const afterBlock = content.substring(endIndex);

const replacementBlock = [
  '// Cohesion re-exports – canonical definitions live in p0-cohesion.js',
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

const output = beforeBlock + replacementBlock + afterBlock;

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Output written to ${outputPath} (${output.length} bytes)`);
"