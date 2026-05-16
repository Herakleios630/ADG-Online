import {
  isTerrainPlaceholderWithinBattlefield,
  TERRAIN_SHAPE_MODELS,
  TERRAIN_SOURCE_STATUSES,
  TERRAIN_TYPE_IDS,
} from './terrain-placeholders.js';

export const TERRAIN_VALIDATION_SEVERITIES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

export const TERRAIN_VALIDATION_RULE_AREAS = {
  TERRAIN_MODEL: 'terrain-model',
  TERRAIN_PLACEMENT: 'terrain-placement',
};

function createValidationResult(overrides) {
  return {
    id: overrides.id,
    ok: overrides.ok,
    severity: overrides.severity,
    ruleArea: overrides.ruleArea,
    message: overrides.message,
    facts: overrides.facts ?? {},
    ruleRefs: overrides.ruleRefs ?? [],
    sourceStatus: overrides.sourceStatus ?? TERRAIN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
  };
}

export function validateTerrainPlaceholder(placeholder, battlefieldProfile, allPlaceholders = []) {
  const validShape = Object.values(TERRAIN_SHAPE_MODELS).includes(placeholder.shapeModel);
  const hasPositiveSize = placeholder.footprint.widthUd > 0 && placeholder.footprint.depthUd > 0;
  const duplicateIdCount = allPlaceholders.filter((candidate) => candidate.id === placeholder.id).length;
  const hasUniqueId = duplicateIdCount <= 1;
  const isWithinBattlefield = validShape && hasPositiveSize
    ? isTerrainPlaceholderWithinBattlefield(placeholder, battlefieldProfile)
    : false;

  const results = [
    createValidationResult({
      id: 'shape-model',
      ok: validShape,
      severity: validShape ? TERRAIN_VALIDATION_SEVERITIES.INFO : TERRAIN_VALIDATION_SEVERITIES.ERROR,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_MODEL,
      message: validShape
        ? 'Shape-Modell ist fuer P3-Placeholder gueltig.'
        : 'Shape-Modell ist ungueltig. P3 erlaubt aktuell nur rectangle oder ellipse.',
      facts: { shapeModel: placeholder.shapeModel },
      ruleRefs: ['terrain-placeholders.shape-model'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.VERIFIED,
    }),
    createValidationResult({
      id: 'positive-size',
      ok: hasPositiveSize,
      severity: hasPositiveSize ? TERRAIN_VALIDATION_SEVERITIES.INFO : TERRAIN_VALIDATION_SEVERITIES.ERROR,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_MODEL,
      message: hasPositiveSize
        ? 'Footprint-Groesse ist positiv.'
        : 'Footprint-Groesse muss positiv sein.',
      facts: {
        widthUd: placeholder.footprint.widthUd,
        depthUd: placeholder.footprint.depthUd,
      },
      ruleRefs: ['terrain-placeholders.positive-size'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.VERIFIED,
    }),
    createValidationResult({
      id: 'unique-id',
      ok: hasUniqueId,
      severity: hasUniqueId ? TERRAIN_VALIDATION_SEVERITIES.INFO : TERRAIN_VALIDATION_SEVERITIES.ERROR,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_MODEL,
      message: hasUniqueId
        ? 'Placeholder-ID ist fuer den aktuellen Setup-State eindeutig.'
        : 'Placeholder-ID ist doppelt vergeben und muss eindeutig sein.',
      facts: {
        id: placeholder.id,
        duplicateCount: duplicateIdCount,
      },
      ruleRefs: ['terrain-placeholders.unique-id'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.VERIFIED,
    }),
    createValidationResult({
      id: 'battlefield-bounds',
      ok: isWithinBattlefield,
      severity: isWithinBattlefield ? TERRAIN_VALIDATION_SEVERITIES.INFO : TERRAIN_VALIDATION_SEVERITIES.ERROR,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_PLACEMENT,
      message: isWithinBattlefield
        ? 'Footprint bleibt innerhalb des Battlefields.'
        : 'Footprint verlaesst das Battlefield. Der letzte gueltige Stand bleibt erhalten.',
      facts: {
        xUd: placeholder.pose.xUd,
        yUd: placeholder.pose.yUd,
        battlefieldWidthUd: battlefieldProfile.widthUd,
        battlefieldHeightUd: battlefieldProfile.heightUd,
      },
      ruleRefs: ['terrain.size-and-placement-geometry'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.VERIFIED,
    }),
    createValidationResult({
      id: 'region-table-source-check',
      ok: false,
      severity: TERRAIN_VALIDATION_SEVERITIES.WARNING,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_PLACEMENT,
      message: 'Regionstabelle, Pflichtgelaende und Quoten sind noch source-blocked und werden in P3 nicht als offizielle Legalitaet behauptet.',
      ruleRefs: ['terrain.region-table-and-quotas', 'setup.reference-sheet-v4-cross-check'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    }),
    createValidationResult({
      id: 'overlap-adjustment-source-check',
      ok: false,
      severity: TERRAIN_VALIDATION_SEVERITIES.WARNING,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_PLACEMENT,
      message: 'Offizielle Overlap-, Abstands- und Anpassungsregeln bleiben source-blocked; P3 erzwingt hier nur physische Grundchecks.',
      ruleRefs: ['terrain.size-and-placement-geometry'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    }),
  ];

  if (placeholder.terrainType === TERRAIN_TYPE_IDS.ROAD || placeholder.terrainType === TERRAIN_TYPE_IDS.RIVER) {
    results.push(
      createValidationResult({
        id: 'road-river-source-check',
        ok: false,
        severity: TERRAIN_VALIDATION_SEVERITIES.WARNING,
        ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_PLACEMENT,
        message: 'Strassen- und Flussregeln wie side-to-side-Verlauf oder exakte Linienfuehrung sind noch nicht offiziell validiert.',
        ruleRefs: ['terrain.size-and-placement-geometry', 'setup.reference-sheet-v4-cross-check'],
        sourceStatus: TERRAIN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
      }),
    );
  }

  return results;
}

export function getTerrainSetupValidationResults(placeholders) {
  return [
    createValidationResult({
      id: 'placeholder-count',
      ok: true,
      severity: TERRAIN_VALIDATION_SEVERITIES.INFO,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_MODEL,
      message: `${placeholders.length} Terrain-Placeholder im aktuellen Setup-State.`,
      facts: { placeholderCount: placeholders.length },
      ruleRefs: ['terrain-placeholders.count'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.PLACEHOLDER,
    }),
    createValidationResult({
      id: 'official-placement-warning',
      ok: false,
      severity: TERRAIN_VALIDATION_SEVERITIES.WARNING,
      ruleArea: TERRAIN_VALIDATION_RULE_AREAS.TERRAIN_PLACEMENT,
      message: 'P3-06 trennt nur verifizierte physische Checks von source-blocked offiziellen Terrain-Regeln.',
      ruleRefs: ['terrain.region-table-and-quotas', 'terrain.size-and-placement-geometry'],
      sourceStatus: TERRAIN_SOURCE_STATUSES.NEEDS_SOURCE_CHECK,
    }),
  ];
}

export function summarizeTerrainValidationResults(results) {
  const errorCount = results.filter((result) => !result.ok && result.severity === TERRAIN_VALIDATION_SEVERITIES.ERROR).length;
  const warningCount = results.filter((result) => !result.ok && result.severity === TERRAIN_VALIDATION_SEVERITIES.WARNING).length;
  const passedCheckCount = results.filter((result) => result.ok).length;

  return {
    isPhysicallyValid: errorCount === 0,
    errorCount,
    warningCount,
    passedCheckCount,
  };
}

export function hasBlockingTerrainValidationErrors(results) {
  return results.some((result) => !result.ok && result.severity === TERRAIN_VALIDATION_SEVERITIES.ERROR);
}

export function createTerrainValidationSnapshot({
  placeholders,
  selectedPlaceholderId,
  battlefieldProfile,
  candidatePlaceholder = null,
}) {
  const selectedPlaceholder = placeholders.find((placeholder) => placeholder.id === selectedPlaceholderId) || null;
  const activePlaceholder = candidatePlaceholder ?? selectedPlaceholder ?? null;
  const activeResults = activePlaceholder
    ? validateTerrainPlaceholder(activePlaceholder, battlefieldProfile, candidatePlaceholder ? placeholders : placeholders)
    : [];

  return {
    activePlaceholderId: activePlaceholder?.id ?? null,
    activePlaceholderLabel: activePlaceholder?.label ?? null,
    activeSource: candidatePlaceholder ? 'attempted-placeholder' : activePlaceholder ? 'selected-placeholder' : 'setup',
    activeResults,
    activeSummary: summarizeTerrainValidationResults(activeResults),
    globalResults: getTerrainSetupValidationResults(placeholders),
  };
}