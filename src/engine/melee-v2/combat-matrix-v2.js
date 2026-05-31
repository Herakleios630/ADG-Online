import {
  MELEE_MODIFIER_STAGES,
  MELEE_RESOLUTION_STATUSES,
  resolveMeleeOutcome,
} from '../melee/resolution.js';
import {
  resolveV2ModifierStageSourceStatus,
  summarizeV2ModifierStage,
} from './modifier-pipeline.js';

export const MELEE_V2_COMBAT_MATRIX_VERSION = 'v2-core-lanes';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickSideBreakdown(resolution, side) {
  const breakdown = resolution?.breakdown?.[side];
  return breakdown && typeof breakdown === 'object' ? breakdown : null;
}

function resolveBranchLaneFromContext(context = {}, side = 'attacker') {
  const branch = context?.flankRearBranch;
  if (!branch || typeof branch !== 'object') {
    return {
      laneType: 'flank-rear-branch',
      value: null,
      sourceStatus: 'verified',
      explanation: side === 'attacker'
        ? 'No attacker flank/rear branch applied in this matrix slice.'
        : 'No defender flank/rear branch applied in this matrix slice.',
    };
  }

  const branchSourceStatus = branch?.sourceStatus === 'verified' ? 'verified' : 'source-open';
  const branchValue = {
    attackContactType: branch?.attackContactType ?? null,
    applyDefenderCombatFactorToZero: branch?.applyDefenderCombatFactorToZero === true,
    cancellationApplies: branch?.cancellationApplies === true,
  };

  return {
    laneType: 'flank-rear-branch',
    value: branchValue,
    sourceStatus: branchSourceStatus,
    explanation: branchSourceStatus === 'verified'
      ? 'Flank/rear branch is source-closed for this lane and can be applied deterministically.'
      : 'Flank/rear branch remains source-open and stays explicitly diagnostic.',
  };
}

function resolveBaseLane(sideBreakdown) {
  const stageLedger = sideBreakdown?.stageLedger ?? {};
  const sourceStatus = sideBreakdown?.combatFactorSourceStatus === 'verified' ? 'verified' : 'source-open';

  return {
    laneType: 'base-cf',
    value: Number(stageLedger?.base ?? 0),
    sourceStatus,
    explanation: sourceStatus === 'verified'
      ? 'Base combat factor is source-closed for this profile lane.'
      : 'Base combat factor remains source-open for this profile lane.',
  };
}

function resolveSupportLane(sideBreakdown) {
  const stageEntries = asArray(sideBreakdown?.stages?.[MELEE_MODIFIER_STAGES.SUPPORT]);
  const summary = summarizeV2ModifierStage(stageEntries);

  return {
    laneType: 'support',
    value: Number(sideBreakdown?.stageLedger?.support ?? summary.total ?? 0),
    sourceStatus: summary.sourceStatus,
    explanation: `Support stage entries: ${summary.count}.`,
  };
}

function resolveSituationDisorderLane(sideBreakdown) {
  const situationEntries = asArray(sideBreakdown?.stages?.[MELEE_MODIFIER_STAGES.SITUATION]);
  const disorderValue = Number(sideBreakdown?.stageLedger?.disorder ?? 0);
  const residualSituation = Number(sideBreakdown?.stageLedger?.residualModifierBreakdown?.situation ?? 0);
  const situationSourceStatus = resolveV2ModifierStageSourceStatus(situationEntries);
  const sourceStatus = situationSourceStatus === 'verified' ? 'verified' : 'source-open';

  return {
    laneType: 'situation-disorder',
    value: {
      disorder: disorderValue,
      situation: residualSituation,
      combined: disorderValue + residualSituation,
    },
    sourceStatus,
    explanation: `Situation entries: ${situationEntries.length}; disorder lane kept explicit.`,
  };
}

function resolveDieLane(sideBreakdown) {
  const dieEntries = asArray(sideBreakdown?.stages?.[MELEE_MODIFIER_STAGES.DIE]);
  const summary = summarizeV2ModifierStage(dieEntries);

  return {
    laneType: 'die',
    value: Number(sideBreakdown?.stageLedger?.die ?? summary.total ?? 0),
    sourceStatus: summary.sourceStatus,
    explanation: `Die stage entries: ${summary.count}.`,
  };
}

function resolveFinalLane(sideBreakdown) {
  const finalEntries = asArray(sideBreakdown?.stages?.[MELEE_MODIFIER_STAGES.FINAL_RESULT]);
  const summary = summarizeV2ModifierStage(finalEntries);
  const stageLedger = sideBreakdown?.stageLedger ?? {};

  return {
    laneType: 'final',
    value: Number(stageLedger?.final ?? 0),
    sourceStatus: summary.sourceStatus,
    explanation: `Final lane entries: ${summary.count}.`,
  };
}

function evaluateSideLanes({ side, resolution, resolutionInput }) {
  const sideBreakdown = pickSideBreakdown(resolution, side);
  const modifierContext = side === 'attacker'
    ? resolutionInput?.attackerModifierContext
    : resolutionInput?.defenderModifierContext;

  const lanes = {
    flankRearBranch: resolveBranchLaneFromContext(modifierContext, side),
    baseCf: resolveBaseLane(sideBreakdown),
    support: resolveSupportLane(sideBreakdown),
    situationDisorder: resolveSituationDisorderLane(sideBreakdown),
    die: resolveDieLane(sideBreakdown),
    final: resolveFinalLane(sideBreakdown),
  };

  const sourceStatus = Object.values(lanes).every((lane) => lane?.sourceStatus === 'verified')
    ? 'verified'
    : 'source-open';

  return {
    lanes,
    sourceStatus,
  };
}

export function evaluateV2CoreCombatMatrix({
  resolutionInput = null,
  resolution = null,
} = {}) {
  const resolvedResolution = resolution ?? resolveMeleeOutcome(resolutionInput ?? {});
  const resolvedInput = resolutionInput ?? {};
  const diagnostics = asArray(resolvedResolution?.diagnostics);

  const attacker = evaluateSideLanes({
    side: 'attacker',
    resolution: resolvedResolution,
    resolutionInput: resolvedInput,
  });
  const defender = evaluateSideLanes({
    side: 'defender',
    resolution: resolvedResolution,
    resolutionInput: resolvedInput,
  });

  const sourceStatus = resolvedResolution?.status === MELEE_RESOLUTION_STATUSES.RESOLVED
    && attacker.sourceStatus === 'verified'
    && defender.sourceStatus === 'verified'
      ? 'verified'
      : 'source-open';

  return {
    version: MELEE_V2_COMBAT_MATRIX_VERSION,
    sourceStatus,
    resolutionStatus: resolvedResolution?.status ?? 'source-open',
    laneOrder: ['flankRearBranch', 'baseCf', 'support', 'situationDisorder', 'die', 'final'],
    attacker,
    defender,
    diagnostics,
  };
}
