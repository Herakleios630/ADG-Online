import { getBattlefieldProfile } from '../data/battlefield-profiles.js';
import { classifyFacingRelationship, getFacingBoundaries, localPointToWorldPoint } from '../engine/geometry/index.js';
import { getCommittedMovementPreviewSegments, getMovementPreviewEndPose } from '../engine/movement/index.js';
import { getPublicAmbushMarkerShell } from '../engine/setup/ambush-markers.js';
import { BATTLE_PLAN_FIELD_IDS } from '../engine/setup/battle-plan.js';
import { projectSetupForViewer } from '../engine/visibility/setup-view.js';
import { TERRAIN_SHAPE_MODELS, TERRAIN_SOURCE_STATUSES } from '../engine/setup/terrain-placeholders.js';
import { SETUP_OBJECT_FAMILIES } from '../engine/setup/setup-objects.js';
import { SETUP_STEP_DEFINITIONS } from '../state/p0-state.js';
import { getAdvancePreviewPresentation, renderAdvanceCommandPanel } from './battlefield-command-panel.js';
import { renderBattlefieldRightPanel } from './battlefield-side-panel.js';

const TERRAIN_PALETTE_ENTRIES = [
  {
    type: 'hill',
    label: 'Hill',
    shapeModel: TERRAIN_SHAPE_MODELS.ELLIPSE,
    footprint: { widthUd: 4, depthUd: 3 },
  },
  {
    type: 'wood',
    label: 'Wood',
    shapeModel: TERRAIN_SHAPE_MODELS.ELLIPSE,
    footprint: { widthUd: 4, depthUd: 3 },
  },
  {
    type: 'field',
    label: 'Field',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 4, depthUd: 2.5 },
  },
  {
    type: 'road',
    label: 'Road',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 5, depthUd: 1 },
  },
  {
    type: 'river',
    label: 'River',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 5, depthUd: 1.2 },
  },
  {
    type: 'village',
    label: 'Village',
    shapeModel: TERRAIN_SHAPE_MODELS.RECTANGLE,
    footprint: { widthUd: 3, depthUd: 2.5 },
  },
];

const SETUP_OBJECT_PALETTE_ENTRIES = [
  {
    family: SETUP_OBJECT_FAMILIES.FORTIFICATION,
    type: 'fortification',
    label: 'Fortification',
    footprint: { widthUd: 3, depthUd: 0.8 },
  },
  {
    family: SETUP_OBJECT_FAMILIES.OBSTACLE,
    type: 'obstacle',
    label: 'Obstacle',
    footprint: { widthUd: 2.8, depthUd: 1 },
  },
  {
    family: SETUP_OBJECT_FAMILIES.STAKES,
    type: 'stakes',
    label: 'Stakes',
    footprint: { widthUd: 2.4, depthUd: 0.7 },
  },
];

function formatLengthUd(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function createWheelHandleStyle(point, battlefieldProfile) {
  return [
    `left:${(point.x / battlefieldProfile.widthUd) * 100}%`,
    `top:${(point.y / battlefieldProfile.heightUd) * 100}%`,
  ].join(';');
}

function createPreviewGhostStyle(pose, unit, battlefieldProfile) {
  return [
    `left:${(pose.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(pose.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(unit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(unit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--unit-rotation:${pose.rotationRadians}rad`,
  ].join(';');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatRelationshipLabel(label) {
  switch (label) {
    case 'front':
      return 'Front';
    case 'flank':
      return 'Flanke';
    case 'leftFlank':
      return 'Linke Flanke';
    case 'rightFlank':
      return 'Rechte Flanke';
    case 'rear':
      return 'Ruecken';
    case 'boundary':
      return 'Grenze';
    case 'ambiguous':
      return 'Mehrdeutig';
    default:
      return 'Unklar';
  }
}

function renderFacingGeometryOverlay(relationship) {
  const battlefieldProfile = getBattlefieldProfile(relationship.battlefieldProfileId);
  const boundaries = getFacingBoundaries(relationship.sourceGeometry, 40);

  return `
    <svg class="battlefield-overlay-layer battlefield-overlay-layer-facing" viewBox="0 0 ${battlefieldProfile.widthUd} ${battlefieldProfile.heightUd}" preserveAspectRatio="none" aria-hidden="true">
      <line class="battlefield-facing-line battlefield-facing-line-front" x1="${boundaries.frontBoundary.line.start.x}" y1="${boundaries.frontBoundary.line.start.y}" x2="${boundaries.frontBoundary.line.end.x}" y2="${boundaries.frontBoundary.line.end.y}"></line>
      <line class="battlefield-facing-line battlefield-facing-line-left" x1="${boundaries.leftFlankBoundary.line.start.x}" y1="${boundaries.leftFlankBoundary.line.start.y}" x2="${boundaries.leftFlankBoundary.line.end.x}" y2="${boundaries.leftFlankBoundary.line.end.y}"></line>
      <line class="battlefield-facing-line battlefield-facing-line-right" x1="${boundaries.rightFlankBoundary.line.start.x}" y1="${boundaries.rightFlankBoundary.line.start.y}" x2="${boundaries.rightFlankBoundary.line.end.x}" y2="${boundaries.rightFlankBoundary.line.end.y}"></line>
      <line class="battlefield-facing-line battlefield-facing-line-rear" x1="${boundaries.rearBoundary.line.start.x}" y1="${boundaries.rearBoundary.line.start.y}" x2="${boundaries.rearBoundary.line.end.x}" y2="${boundaries.rearBoundary.line.end.y}"></line>
    </svg>
  `;
}

function renderSectorOverlay() {
  return `
    <div class="battlefield-overlay-layer battlefield-overlay-layer-sectors" aria-hidden="true">
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-left"></span>
      <span class="battlefield-sector-line battlefield-sector-line-vertical battlefield-sector-line-vertical-right"></span>
      <span class="battlefield-sector-line battlefield-sector-line-horizontal"></span>
    </div>
  `;
}

function renderDeploymentOverlay(state, battlefieldProfile) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const deploymentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'deployment');
  if (currentStepIndex !== -1 && currentStepIndex < deploymentStepIndex) {
    return '';
  }

  return `
    <div class="battlefield-overlay-layer battlefield-overlay-layer-deployment" aria-hidden="true">
      ${state.game.setup.deployment.zones.map((zone) => {
        const style = [
          `left:${(zone.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
          `top:${(zone.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
          `width:${(zone.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
          `height:${(zone.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
        ].join(';');
        const ownerClass = zone.owner === 'player-2' ? 'is-owner-two' : 'is-owner-one';

        return `
          <span class="battlefield-deployment-zone ${ownerClass}" style="${style}">
            <span class="battlefield-deployment-zone-label">${zone.label}</span>
          </span>
        `;
      }).join('')}
    </div>
  `;
}

function renderTerrainPalette(state) {
  const currentStepId = state.game.setup.currentStepId;
  const isTerrainStep = currentStepId === 'terrain' || currentStepId === 'terrain-adjustment';
  if (!isTerrainStep) {
    return '';
  }

  const selectedPlaceholder = state.game.setup.terrain.placeholders.find(
    (placeholder) => placeholder.id === state.game.setup.terrain.selectedPlaceholderId,
  ) || null;

  return `
    <div class="battlefield-placeholder-card battlefield-terrain-palette-card">
      <strong>Terrain Palette</strong>
      <span class="muted-copy">P3-05 nutzt bewusst sichtbare Placeholder mit echten Footprints. Offizielle Terrain-Regeln folgen spaeter.</span>
      <div class="battlefield-terrain-palette-grid">
        ${TERRAIN_PALETTE_ENTRIES.map((entry) => `
          <button
            class="shell-button battlefield-terrain-palette-button"
            type="button"
            data-action="add-terrain-placeholder"
            data-terrain-type="${entry.type}"
            data-terrain-label="${entry.label}"
            data-terrain-shape="${entry.shapeModel}"
            data-terrain-width-ud="${entry.footprint.widthUd}"
            data-terrain-depth-ud="${entry.footprint.depthUd}"
          >${entry.label}</button>
        `).join('')}
      </div>
      ${selectedPlaceholder ? `
        <div class="battlefield-terrain-selection-meta">
          <span><strong>Auswahl:</strong> ${selectedPlaceholder.label}</span>
          <span>Footprint: ${formatLengthUd(selectedPlaceholder.footprint.widthUd)} UD x ${formatLengthUd(selectedPlaceholder.footprint.depthUd)} UD</span>
          <span>Status: ${selectedPlaceholder.sourceStatus === TERRAIN_SOURCE_STATUSES.PLACEHOLDER ? 'placeholder' : selectedPlaceholder.sourceStatus}</span>
        </div>
      ` : `
        <span class="muted-copy">Noch kein Terrain-Placeholder ausgewaehlt.</span>
      `}
    </div>
  `;
}

function renderSetupObjectPalette(state) {
  if (state.game.setup.currentStepId !== 'camps') {
    return '';
  }

  const selectedSetupObject = state.game.setup.setupObjects.placeholders.find(
    (setupObject) => setupObject.id === state.game.setup.setupObjects.selectedObjectId,
  ) || null;

  return `
    <div class="battlefield-placeholder-card battlefield-setup-object-card">
      <strong>Camps And Setup Objects</strong>
      <span class="muted-copy">Standard-200 startet mit zwei Pflicht-Camps. Weitere Setup-Objekte bleiben in P3 sichtbare Placeholder ohne offizielle Legalitaetsbehauptung.</span>
      <div class="battlefield-setup-object-meta-grid">
        ${state.game.setup.setupObjects.placeholders
          .filter((setupObject) => setupObject.family === SETUP_OBJECT_FAMILIES.CAMP)
          .map((setupObject) => `<span>${setupObject.label}: ${setupObject.owner}</span>`).join('')}
      </div>
      <div class="battlefield-terrain-palette-grid">
        ${SETUP_OBJECT_PALETTE_ENTRIES.map((entry) => `
          <button
            class="shell-button battlefield-terrain-palette-button"
            type="button"
            data-action="add-setup-object"
            data-setup-object-family="${entry.family}"
            data-setup-object-type="${entry.type}"
            data-setup-object-label="${entry.label}"
            data-setup-object-width-ud="${entry.footprint.widthUd}"
            data-setup-object-depth-ud="${entry.footprint.depthUd}"
          >${entry.label}</button>
        `).join('')}
      </div>
      ${selectedSetupObject ? `
        <div class="battlefield-terrain-selection-meta">
          <span><strong>Auswahl:</strong> ${selectedSetupObject.label}</span>
          <span>Owner: ${selectedSetupObject.owner}</span>
          <span>Footprint: ${formatLengthUd(selectedSetupObject.footprint.widthUd)} UD x ${formatLengthUd(selectedSetupObject.footprint.depthUd)} UD</span>
        </div>
      ` : `
        <span class="muted-copy">Noch kein Setup-Objekt ausgewaehlt.</span>
      `}
    </div>
  `;
}

function renderBattlePlanBoard(state) {
  if (state.game.setup.currentStepId !== 'battle-plan') {
    return '';
  }

  const battlePlan = state.game.setup.battlePlan;
  if (battlePlan.isRedacted) {
    return `
      <div class="battlefield-placeholder-card battlefield-battle-plan-card">
        <div class="battlefield-battle-plan-header">
          <strong>Battle Plan Board</strong>
          <span class="battlefield-validation-badge is-info">hidden</span>
        </div>
        <span class="muted-copy">${battlePlan.redactedMessage}</span>
      </div>
    `;
  }

  const fieldLabels = {
    [BATTLE_PLAN_FIELD_IDS.LEFT]: 'Left',
    [BATTLE_PLAN_FIELD_IDS.CENTER]: 'Center',
    [BATTLE_PLAN_FIELD_IDS.RIGHT]: 'Right',
    [BATTLE_PLAN_FIELD_IDS.FLANK_MARCH]: 'Flank March',
  };

  return `
    <div class="battlefield-placeholder-card battlefield-battle-plan-card">
      <div class="battlefield-battle-plan-header">
        <strong>Battle Plan Board</strong>
        <span class="battlefield-validation-badge is-info">owner-only</span>
      </div>
      <span class="muted-copy">Diese vier Felder sind private Battle-Plan-Zuordnungen, keine Battlefield-Sektoren. Effekte und Timing bleiben source-blocked.</span>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Owner:</strong> ${battlePlan.owner}</span>
        <span>Visibility: ${battlePlan.visibilityScope}</span>
        <span>Source: ${battlePlan.sourceStatus}</span>
      </div>
      <div class="battlefield-battle-plan-corps-grid">
        ${battlePlan.corpsCards.map((corpsCard) => `
          <button
            class="battlefield-battle-plan-corps-card ${battlePlan.selectedCorpsId === corpsCard.id ? 'is-selected' : ''}"
            type="button"
            data-action="select-battle-plan-corps"
            data-corps-id="${corpsCard.id}"
          >
            <strong>${corpsCard.label}</strong>
            <span>${corpsCard.assignmentFieldId ? `Aktuell: ${fieldLabels[corpsCard.assignmentFieldId]}` : 'Noch nicht zugeordnet'}</span>
          </button>
        `).join('')}
      </div>
      <div class="battlefield-battle-plan-fields-grid">
        ${Object.values(BATTLE_PLAN_FIELD_IDS).map((fieldId) => `
          <button
            class="battlefield-battle-plan-field"
            type="button"
            data-action="assign-battle-plan-corps"
            data-field-id="${fieldId}"
            ${battlePlan.selectedCorpsId ? '' : 'disabled'}
          >
            <span class="battlefield-battle-plan-field-title">${fieldLabels[fieldId]}</span>
            <span class="battlefield-battle-plan-field-meta">${battlePlan.fieldAssignments[fieldId].length ? battlePlan.fieldAssignments[fieldId].map((corpsId) => battlePlan.corpsCards.find((corpsCard) => corpsCard.id === corpsId)?.label ?? corpsId).join(', ') : 'Noch leer'}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAmbushMarkersPanel(state) {
  if (state.game.setup.currentStepId !== 'ambushes') {
    return '';
  }

  const ambushMarkers = state.game.setup.ambushMarkers;
  if (ambushMarkers.isRedacted) {
    return `
      <div class="battlefield-placeholder-card battlefield-ambush-card">
        <div class="battlefield-battle-plan-header">
          <strong>Ambush Markers</strong>
          <span class="battlefield-validation-badge is-info">hidden</span>
        </div>
        <span class="muted-copy">${ambushMarkers.redactedMessage}</span>
        <span class="muted-copy">Oeffentliche Marker-Shells bleiben auf dem Battlefield sichtbar, private Inhalte nicht.</span>
      </div>
    `;
  }

  const selectedMarker = ambushMarkers.markers.find((marker) => marker.id === ambushMarkers.selectedMarkerId) || null;

  return `
    <div class="battlefield-placeholder-card battlefield-ambush-card">
      <div class="battlefield-battle-plan-header">
        <strong>Ambush Markers</strong>
        <span class="battlefield-validation-badge is-info">private contents</span>
      </div>
      <span class="muted-copy">P3-09 trennt oeffentliche Marker-Shells von owner-only Inhalten. Exakte Marker-Anzahl, Fake-Truth und Reveal-Timing bleiben source-blocked.</span>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Owner:</strong> ${ambushMarkers.owner}</span>
        <span>Visibility: ${ambushMarkers.visibilityScope}</span>
        <span>Source: ${ambushMarkers.sourceStatus}</span>
      </div>
      <div class="battlefield-inline-actions battlefield-ambush-actions">
        <button class="shell-button battlefield-terrain-palette-button" type="button" data-action="add-ambush-marker">Marker hinzufuegen</button>
      </div>
      <div class="battlefield-battle-plan-corps-grid">
        ${ambushMarkers.markers.map((marker) => `
          <button
            class="battlefield-battle-plan-corps-card ${ambushMarkers.selectedMarkerId === marker.id ? 'is-selected' : ''}"
            type="button"
            data-action="select-ambush-marker"
            data-marker-id="${marker.id}"
          >
            <strong>${marker.label}</strong>
            <span>${marker.privateContents.notes ? 'Private Inhalte eingetragen' : 'Noch keine privaten Inhalte'}</span>
          </button>
        `).join('')}
      </div>
      ${ambushMarkers.markers.length === 0 ? `
        <span class="muted-copy">Ambush marker sind optional. Fuege nur dann einen Marker hinzu, wenn du fuer diesen Placeholder-Schritt tatsaechlich einen brauchst.</span>
      ` : ''}
      ${selectedMarker ? `
        <label class="battlefield-ambush-editor" for="ambush-marker-notes">
          <span class="battlefield-battle-plan-field-title">Owner-private contents</span>
          <textarea
            id="ambush-marker-notes"
            class="battlefield-ambush-textarea"
            data-action="edit-ambush-notes"
            data-marker-id="${selectedMarker.id}"
            placeholder="Bis der Army Designer existiert: freie Notizen zu Einheiten oder Gruppen im Marker."
          >${escapeHtml(selectedMarker.privateContents.notes)}</textarea>
        </label>
      ` : `
        <span class="muted-copy">Fuege einen Marker hinzu oder waehle einen vorhandenen Marker, um private Inhalte zu pflegen. Auf dem Battlefield bleibt nur die oeffentliche Shell sichtbar.</span>
      `}
    </div>
  `;
}

function renderDeploymentSetupCard(state) {
  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const deploymentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'deployment');
  if (currentStepIndex !== -1 && currentStepIndex < deploymentStepIndex) {
    return '';
  }

  const selectedPlaceholder = state.game.setup.deployment.visiblePlaceholders.find(
    (placeholder) => placeholder.unitId === state.game.selectedUnitId,
  ) || null;

  return `
    <div class="battlefield-placeholder-card battlefield-deployment-card">
      <strong>Deployment Foundation</strong>
      <span class="muted-copy">P3-11 zeigt explizite Placeholder-Zonen und sichtbare Deployment-Objekte. Das ist bewusst kein offizieller Deployment-Validator.</span>
      <div class="battlefield-battle-plan-owner-meta">
        <span><strong>Zonen:</strong> ${state.game.setup.deployment.zones.length}</span>
        <span>Visible placeholders: ${state.game.setup.deployment.visiblePlaceholders.length}</span>
        <span>Source: ${state.game.setup.deployment.sourceStatus}</span>
      </div>
      ${state.game.setup.deployment.overlapPairs.length ? `
        <span class="battlefield-validation-badge is-error">Overlap placeholder detected</span>
      ` : `
        <span class="battlefield-validation-badge is-valid">No placeholder overlap</span>
      `}
      ${selectedPlaceholder ? `
        <div class="battlefield-terrain-selection-meta">
          <span><strong>Auswahl:</strong> ${selectedPlaceholder.unitId}</span>
          <span>Owner: ${selectedPlaceholder.owner}</span>
          <span>Corps: ${selectedPlaceholder.corpsId}</span>
          <span>Footprint: ${formatLengthUd(selectedPlaceholder.footprint.widthUd)} UD x ${formatLengthUd(selectedPlaceholder.footprint.depthUd)} UD</span>
        </div>
      ` : `
        <span class="muted-copy">Waehle im Deployment-Schritt einen sichtbaren Unit-Placeholder aus, um seine Setup-Metadaten zu sehen.</span>
      `}
    </div>
  `;
}

function renderTerrainPlaceholders(state, battlefieldProfile) {
  return state.game.setup.terrain.placeholders.map((placeholder) => {
    const style = [
      `left:${(placeholder.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
      `top:${(placeholder.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
      `width:${(placeholder.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
      `height:${(placeholder.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
      `--terrain-rotation:${placeholder.footprint.rotationRadians}rad`,
    ].join(';');

    return `
      <button
        class="battlefield-terrain-placeholder ${placeholder.shapeModel === TERRAIN_SHAPE_MODELS.ELLIPSE ? 'is-ellipse' : 'is-rectangle'} ${state.game.setup.terrain.selectedPlaceholderId === placeholder.id ? 'is-selected' : ''} ${placeholder.lockState === 'locked' ? 'is-locked' : ''}"
        type="button"
        data-action="select-terrain-placeholder"
        data-terrain-placeholder-id="${placeholder.id}"
        title="${placeholder.label} ziehen"
        style="${style}"
      >
        <span class="battlefield-terrain-placeholder-label">${placeholder.label}</span>
      </button>
    `;
  }).join('');
}

function renderSetupObjects(state, battlefieldProfile) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const campsStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'camps');
  if (currentStepIndex !== -1 && currentStepIndex < campsStepIndex) {
    return '';
  }

  return state.game.setup.setupObjects.placeholders.map((setupObject) => {
    const style = [
      `left:${(setupObject.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
      `top:${(setupObject.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
      `width:${(setupObject.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
      `height:${(setupObject.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
      `--setup-object-rotation:${setupObject.footprint.rotationRadians}rad`,
    ].join(';');
    const ownerClass = setupObject.owner === 'player-2' ? 'is-owner-two' : 'is-owner-one';
    const familyClass = `is-family-${setupObject.family}`;

    return `
      <button
        class="battlefield-setup-object-placeholder ${ownerClass} ${familyClass} ${state.game.setup.setupObjects.selectedObjectId === setupObject.id ? 'is-selected' : ''}"
        type="button"
        data-action="select-setup-object"
        data-setup-object-id="${setupObject.id}"
        title="${setupObject.label} verschieben"
        style="${style}"
      >
        <span class="battlefield-setup-object-label">${setupObject.label}</span>
      </button>
    `;
  }).join('');
}

function renderAmbushMarkerShells(state, battlefieldProfile) {
  if (!state.game.setup.isActive) {
    return '';
  }

  const currentStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === state.game.setup.currentStepId);
  const ambushStepIndex = SETUP_STEP_DEFINITIONS.findIndex((step) => step.id === 'ambushes');
  if (currentStepIndex !== -1 && currentStepIndex < ambushStepIndex) {
    return '';
  }

  return state.game.setup.ambushMarkers.markers.map((marker) => {
    const shell = getPublicAmbushMarkerShell(marker);
    const style = [
      `left:${(shell.pose.xUd / battlefieldProfile.widthUd) * 100}%`,
      `top:${(shell.pose.yUd / battlefieldProfile.heightUd) * 100}%`,
      `width:${(shell.footprint.widthUd / battlefieldProfile.widthUd) * 100}%`,
      `height:${(shell.footprint.depthUd / battlefieldProfile.heightUd) * 100}%`,
      `--ambush-marker-rotation:${shell.footprint.rotationRadians}rad`,
    ].join(';');
    const ownerClass = shell.owner === 'player-2' ? 'is-owner-two' : 'is-owner-one';

    return `
      <button
        class="battlefield-ambush-marker-shell ${ownerClass} ${state.game.setup.ambushMarkers.selectedMarkerId === shell.id ? 'is-selected' : ''}"
        type="button"
        data-action="select-ambush-marker"
        data-marker-id="${shell.id}"
        title="${shell.label} verschieben"
        style="${style}"
      >
        <span class="battlefield-ambush-marker-label">${shell.label}</span>
      </button>
    `;
  }).join('');
}

function renderTerrainValidationList(results) {
  if (!results.length) {
    return '<span class="muted-copy">Noch keine Terrain-Diagnosen vorhanden.</span>';
  }

  const severityOrder = {
    error: 0,
    warning: 1,
    info: 2,
  };

  const orderedResults = [...results].sort((left, right) => {
    if (left.ok !== right.ok) {
      return left.ok ? 1 : -1;
    }

    return (severityOrder[left.severity] ?? 99) - (severityOrder[right.severity] ?? 99);
  });

  return `
    <ul class="battlefield-validation-list">
      ${orderedResults.map((result) => `
        <li class="battlefield-validation-item is-${result.severity} ${result.ok ? 'is-ok' : 'is-not-ok'}">
          <span class="battlefield-validation-item-title">${result.message}</span>
          <span class="battlefield-validation-item-meta">${result.sourceStatus}${result.ruleRefs.length ? ` • ${result.ruleRefs.join(', ')}` : ''}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderTerrainValidation(state) {
  const currentStepId = state.game.setup.currentStepId;
  const isTerrainStep = currentStepId === 'terrain' || currentStepId === 'terrain-adjustment';
  if (!isTerrainStep) {
    return '';
  }

  const validation = state.game.setup.terrain.validation;
  const summary = validation.activeSummary;
  const highlightedBlockedResults = validation.activeResults
    .filter((result) => !result.ok)
    .sort((left, right) => {
      const leftPriority = left.id === 'road-river-source-check' ? 0 : 1;
      const rightPriority = right.id === 'road-river-source-check' ? 0 : 1;
      return leftPriority - rightPriority;
    })
    .slice(0, 3);
  const statusLabel = !validation.activePlaceholderLabel
    ? 'Setup-Blick'
    : summary.isPhysicallyValid
      ? 'Physisch gueltig'
      : 'Physisch blockiert';
  const statusClass = !validation.activePlaceholderLabel
    ? 'is-info'
    : summary.isPhysicallyValid
      ? 'is-valid'
      : 'is-error';

  return `
    <div class="battlefield-placeholder-card battlefield-terrain-validation-card">
      <div class="battlefield-validation-header">
        <strong>Terrain Checks</strong>
        <span class="battlefield-validation-badge ${statusClass}">${statusLabel}</span>
      </div>
      <span class="muted-copy">Verifizierte Physik-Checks sind echt. Offizielle Terrain-Regeln bleiben bis zur Source-Pruefung als Warnung markiert.</span>
      ${validation.activePlaceholderLabel ? `
        <div class="battlefield-validation-summary">
          <span><strong>Aktiver Check:</strong> ${validation.activePlaceholderLabel}</span>
          <span>Quelle: ${validation.activeSource === 'attempted-placeholder' ? 'letzter ungueltiger Versuch' : 'aktuell ausgewaehlter Placeholder'}</span>
          <span>${summary.passedCheckCount} Checks ok, ${summary.warningCount} Warnungen, ${summary.errorCount} Fehler</span>
        </div>
      ` : `
        <span class="muted-copy">Waehle oder bewege einen Placeholder, um konkrete Diagnosen zu sehen.</span>
      `}
      ${highlightedBlockedResults.length ? `
        <div class="battlefield-validation-callout-list">
          ${highlightedBlockedResults.map((result) => `
            <div class="battlefield-validation-callout is-${result.severity}">
              <strong>${result.severity === 'error' ? 'Blockiert' : 'Offen'}</strong>
              <span>${result.message}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <span class="battlefield-validation-section-title">Aktiver Placeholder</span>
      ${renderTerrainValidationList(validation.activeResults)}
      <span class="battlefield-validation-section-title">P3-Grenzen</span>
      ${renderTerrainValidationList(validation.globalResults)}
    </div>
  `;
}

export function renderBattlefieldScreen(state) {
  const visibleSetup = projectSetupForViewer(state.game.setup, state.game.setupViewMode);
  const renderState = {
    ...state,
    game: {
      ...state.game,
      setup: visibleSetup,
    },
  };
  const battlefieldProfile = getBattlefieldProfile(state.game.battlefieldProfileId);
  const overlayHotkey = state.shell.settings.keyBindings.overlayCycle.primary || 'Nicht belegt';
  const showScaleOverlay = state.shell.settings.showScaleOverlay;
  const viewport = state.game.viewport;
  const testUnit = state.game.units[0];
  const isSetupActive = renderState.game.setup.isActive;
  const isTerrainStep = isSetupActive
    && (renderState.game.setup.currentStepId === 'terrain' || renderState.game.setup.currentStepId === 'terrain-adjustment');
  const isDeploymentSetupStep = isSetupActive
    && (renderState.game.setup.currentStepId === 'deployment' || renderState.game.setup.currentStepId === 'ready');
  const selectedUnit = state.game.units.find((unit) => unit.id === state.game.selectedUnitId) || null;
  const canDragUnitsInSetup = isSetupActive
    && (renderState.game.setup.currentStepId === 'deployment' || renderState.game.setup.currentStepId === 'ready');
  const {
    advanceModeActive,
    slideModeActive,
    wheelModeActive,
    wheelPivotSide,
    advancePreviewUd,
    slidePreviewUd,
    wheelPreviewAngleRadians,
    wheelDistanceUd,
    previewDistanceUd,
    slideAvailable,
    remainingAdvanceBudgetUd,
    maxAdvanceUd,
    previewUnitStyle,
    advanceReachStyle,
    helperCopy,
    diagnostics,
    canCancelMovement,
    canConfirmMovement,
  } = getAdvancePreviewPresentation({
    state,
    selectedUnit,
    isSetupActive,
    canDragUnitsInSetup,
    battlefieldProfile,
  });
  const showDeploymentOverlay = isDeploymentSetupStep
    || state.game.overlayMode === 'Aufstellungszonen'
    || state.game.overlayMode === 'Beides';
  const showSectorOverlay = state.game.overlayMode === 'Sektoren' || state.game.overlayMode === 'Beides';
  const committedPreviewSegments = getCommittedMovementPreviewSegments(state.game.movement.preview);
  const committedPreviewTrailSegments = committedPreviewSegments.slice(0, -1);
  const wheelDisplayPose = wheelModeActive && selectedUnit
    ? getMovementPreviewEndPose(state.game.movement.preview, {
        xUd: selectedUnit.xUd,
        yUd: selectedUnit.yUd,
        rotationRadians: selectedUnit.rotationRadians ?? 0,
      })
    : null;
  const leftWheelHandlePoint = wheelDisplayPose && selectedUnit
    ? localPointToWorldPoint(
        {
          center: { x: wheelDisplayPose.xUd, y: wheelDisplayPose.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: wheelDisplayPose.rotationRadians,
        },
        { x: -(selectedUnit.widthUd / 2), y: selectedUnit.depthUd / 2 },
      )
    : null;
  const rightWheelHandlePoint = wheelDisplayPose && selectedUnit
    ? localPointToWorldPoint(
        {
          center: { x: wheelDisplayPose.xUd, y: wheelDisplayPose.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: wheelDisplayPose.rotationRadians,
        },
        { x: selectedUnit.widthUd / 2, y: selectedUnit.depthUd / 2 },
      )
    : null;
  const selectedUnitRotationRadians = selectedUnit?.rotationRadians ?? 0;
  const facingRelationship = state.game.debug.isActive && selectedUnit
    ? classifyFacingRelationship(
        {
          center: { x: selectedUnit.xUd, y: selectedUnit.yUd },
          widthUd: selectedUnit.widthUd,
          depthUd: selectedUnit.depthUd,
          rotationRadians: selectedUnitRotationRadians,
          battlefieldProfileId: battlefieldProfile.id,
        },
        {
          center: {
            x: state.game.debug.unitPose.xUd,
            y: state.game.debug.unitPose.yUd,
          },
          widthUd: state.game.debug.unitDimensions.widthUd,
          depthUd: state.game.debug.unitDimensions.depthUd,
          rotationRadians: state.game.debug.unitPose.rotationRadians,
          battlefieldProfileId: battlefieldProfile.id,
        },
      )
    : null;
  const debugUnitStyle = state.game.debug.isActive
    ? [
        `left:${(state.game.debug.unitPose.xUd / battlefieldProfile.widthUd) * 100}%`,
        `top:${(state.game.debug.unitPose.yUd / battlefieldProfile.heightUd) * 100}%`,
        `width:${(state.game.debug.unitDimensions.widthUd / battlefieldProfile.widthUd) * 100}%`,
        `height:${(state.game.debug.unitDimensions.depthUd / battlefieldProfile.heightUd) * 100}%`,
        `--debug-rotation:${state.game.debug.unitPose.rotationRadians}rad`,
      ].join(';')
    : '';
  const unitStyle = [
    `left:${(testUnit.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(testUnit.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(testUnit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(testUnit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--unit-rotation:${testUnit.rotationRadians ?? 0}rad`,
  ].join(';');
  const worldStyle = [
    `--viewport-zoom:${viewport.zoom}`,
    `--viewport-pan-x:${viewport.panX}px`,
    `--viewport-pan-y:${viewport.panY}px`,
  ].join(';');
  return `
    <section class="battlefield-shell">
      <div class="battlefield-stage">
        <aside class="battlefield-side-panel battlefield-side-panel-left" data-panel-id="left">
          <button class="ghost-button battlefield-back-button" type="button" data-action="navigate" data-screen="main-menu">Zurueck zum Menue</button>
          ${renderTerrainPalette(renderState)}
          ${renderTerrainValidation(renderState)}
          ${renderSetupObjectPalette(renderState)}
          ${renderBattlePlanBoard(renderState)}
          ${renderAmbushMarkersPanel(renderState)}
          ${renderDeploymentSetupCard(renderState)}
          ${renderAdvanceCommandPanel({
            selectedUnit,
            isSetupActive,
            advanceModeActive,
            slideModeActive,
            wheelModeActive,
            wheelPivotSide,
            advancePreviewUd,
            slidePreviewUd,
            wheelPreviewAngleRadians,
            wheelDistanceUd,
            previewDistanceUd,
            slideAvailable,
            remainingAdvanceBudgetUd,
            maxAdvanceUd,
            helperCopy,
            diagnostics,
            canCancelMovement,
            canConfirmMovement,
          })}
        </aside>
        <div class="battlefield-center-column">
          <div class="battlefield-surface" data-battlefield-surface>
            <div class="battlefield-world" style="${worldStyle}" data-battlefield-world>
              ${showDeploymentOverlay ? renderDeploymentOverlay(renderState, battlefieldProfile) : ''}
              ${showSectorOverlay ? renderSectorOverlay() : ''}
              ${renderSetupObjects(renderState, battlefieldProfile)}
              ${renderAmbushMarkerShells(renderState, battlefieldProfile)}
              ${renderTerrainPlaceholders(renderState, battlefieldProfile)}
              ${advanceModeActive ? `<div class="battlefield-advance-reach" aria-hidden="true" style="${advanceReachStyle}"></div>` : ''}
              ${selectedUnit && committedPreviewTrailSegments.length > 0 ? committedPreviewTrailSegments.map((segment) => `
                <div
                  class="battlefield-unit-preview is-trail"
                  aria-hidden="true"
                  style="${createPreviewGhostStyle(segment.endPose, selectedUnit, battlefieldProfile)}"
                ></div>
              `).join('') : ''}
              ${selectedUnit && state.game.movement.preview.status === 'accepted' && state.game.movement.preview.segments.length > 0 ? `
                <div
                  class="battlefield-unit-preview"
                  aria-hidden="true"
                  ${advanceModeActive ? 'data-advance-preview-handle' : ''}
                  ${slideModeActive ? 'data-slide-preview-handle' : ''}
                  data-unit-id="${selectedUnit.id}"
                  style="${previewUnitStyle}"
                ></div>
              ` : ''}
              ${wheelModeActive && selectedUnit && leftWheelHandlePoint && rightWheelHandlePoint ? `
                <button
                  class="battlefield-wheel-handle ${wheelPivotSide === 'right' ? 'is-active' : ''}"
                  type="button"
                  aria-label="Linke vordere Ecke ziehen"
                  data-wheel-handle
                  data-unit-id="${selectedUnit.id}"
                  data-corner-side="left"
                  style="${createWheelHandleStyle(leftWheelHandlePoint, battlefieldProfile)}"
                ></button>
                <button
                  class="battlefield-wheel-handle ${wheelPivotSide === 'left' ? 'is-active' : ''}"
                  type="button"
                  aria-label="Rechte vordere Ecke ziehen"
                  data-wheel-handle
                  data-unit-id="${selectedUnit.id}"
                  data-corner-side="right"
                  style="${createWheelHandleStyle(rightWheelHandlePoint, battlefieldProfile)}"
                ></button>
              ` : ''}
              ${state.game.debug.isActive ? `
                <div
                  class="battlefield-debug-unit"
                  data-debug-unit
                  title="Debug-Einheit frei ziehen"
                  style="${debugUnitStyle}"
                >
                  <span class="battlefield-debug-unit-label">${facingRelationship && state.game.debug.showFacingGeometryOverlay ? formatRelationshipLabel(facingRelationship.primaryLabel) : 'Debug'}</span>
                </div>
              ` : ''}
              ${facingRelationship && state.game.debug.showFacingGeometryOverlay ? renderFacingGeometryOverlay({ ...facingRelationship, battlefieldProfileId: battlefieldProfile.id }) : ''}
              <button
                class="battlefield-unit-token ${state.game.selectedUnitId === testUnit.id ? 'is-selected' : ''} ${advanceModeActive && state.game.selectedUnitId === testUnit.id ? 'is-advance-ready' : ''} ${wheelModeActive && state.game.selectedUnitId === testUnit.id ? 'is-wheel-ready' : ''} ${canDragUnitsInSetup && state.game.selectedUnitId === testUnit.id ? 'is-setup-placeable' : ''}"
                type="button"
                aria-pressed="${state.game.selectedUnitId === testUnit.id}"
                data-action="select-unit"
                data-unit-id="${testUnit.id}"
                title="${isTerrainStep ? 'Testeinheit auswaehlen' : canDragUnitsInSetup && state.game.selectedUnitId === testUnit.id ? 'Testeinheit ziehen' : 'Testeinheit auswaehlen'}"
                style="--token-color:${state.shell.settings.playerColor};${unitStyle}"
              ></button>
            </div>
          </div>
        </div>
        ${renderBattlefieldRightPanel({
          state,
          battlefieldProfile,
          showScaleOverlay,
          unitStyle,
          isDeploymentSetupStep,
          overlayHotkey,
          testUnit,
          selectedUnit,
          selectedUnitRotationRadians,
          facingRelationship,
        })}
      </div>
    </section>
  `;
}