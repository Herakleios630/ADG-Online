import { createMovementPreview, MOVEMENT_COMMAND_IDS, MOVEMENT_PREVIEW_STATUSES, MOVEMENT_SOURCE_STATUSES } from './model.js';

export const DIFFICULT_MANOEUVRE_RESULTS = {
  NO: 'no',
  YES: 'yes',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

const SPECIAL_CASE_TRAIT_KEYS = [
  'isUnmanoeuvrable',
  'isImpetuous',
  'isCataphract',
  'isPike',
  'isWarWagon',
  'isHeavyArtillery',
  'isScythedChariot',
];

const SPECIAL_CASE_TROOP_TYPES = new Set([
  'cataphract',
  'pike',
  'war-wagon',
  'heavy-artillery',
  'scythed-chariot',
]);

function hasExplicitDifficultMarker(preview) {
  return preview.segments.some((segment) =>
    (segment.diagnostics ?? []).some((diagnostic) => diagnostic.id === 'difficult-manoeuvre')
  );
}

function getUnresolvedTriggerHints(selectedUnit, selectedCommandId) {
  const hints = [];

  if (SPECIAL_CASE_TRAIT_KEYS.some((key) => Boolean(selectedUnit?.[key]))) {
    hints.push('special-troop-trait');
  }

  if (SPECIAL_CASE_TROOP_TYPES.has(String(selectedUnit?.troopType ?? '').toLowerCase())) {
    hints.push('special-troop-type');
  }

  if (
    selectedCommandId !== MOVEMENT_COMMAND_IDS.ADVANCE
    && selectedCommandId !== MOVEMENT_COMMAND_IDS.WHEEL
    && selectedCommandId !== MOVEMENT_COMMAND_IDS.SLIDE
  ) {
    hints.push('unimplemented-command-type');
  }

  return hints;
}

export function classifyCurrentMovementManoeuvre({ selectedUnit = null, selectedCommandId = null, preview = null } = {}) {
  const normalizedPreview = createMovementPreview(preview);

  if (!selectedCommandId || normalizedPreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED || normalizedPreview.segments.length === 0) {
    return {
      active: false,
      result: DIFFICULT_MANOEUVRE_RESULTS.NEEDS_SOURCE_CHECK,
      triggers: [],
      sourceStatus: MOVEMENT_SOURCE_STATUSES.PLACEHOLDER,
      text: 'Difficult manoeuvre classification runs when an accepted movement preview exists.',
    };
  }

  if (hasExplicitDifficultMarker(normalizedPreview)) {
    return {
      active: true,
      result: DIFFICULT_MANOEUVRE_RESULTS.YES,
      triggers: ['explicit-preview-marker'],
      sourceStatus: MOVEMENT_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      text: 'Current preview already carries an explicit difficult-manoeuvre marker for later rule-backed CP handling.',
    };
  }

  const unresolvedTriggerHints = getUnresolvedTriggerHints(selectedUnit, selectedCommandId);
  if (unresolvedTriggerHints.length > 0) {
    return {
      active: true,
      result: DIFFICULT_MANOEUVRE_RESULTS.NEEDS_SOURCE_CHECK,
      triggers: unresolvedTriggerHints,
      sourceStatus: MOVEMENT_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      text: 'Current preview touches troop or command cases whose difficult-manoeuvre status is still source-sensitive in P6.',
    };
  }

  return {
    active: true,
    result: DIFFICULT_MANOEUVRE_RESULTS.NO,
    triggers: [],
    sourceStatus: MOVEMENT_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    text: 'Current P6 subset does not classify this preview as a difficult manoeuvre, but open triggers such as third move, quarter-turn, half-turn, extension, contraction, ZoC-exit cases, and special-troop exceptions remain source-sensitive.',
  };
}