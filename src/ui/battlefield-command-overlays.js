import { getMovementPreviewEndPose } from '../engine/movement/index.js';
import {
  getEnemyZocBandLocalBounds,
  getUnitFootprintSamplePoints,
  ZOC_DEFAULT_FRONT_RANGE_UD,
} from '../engine/zoc/geometry.js';
import { worldPointToLocalPoint } from '../engine/geometry/index.js';

export function renderZocBands(units, selectedUnit, battlefieldProfile, options = {}) {
  if (!selectedUnit) {
    return '';
  }

  const showAllEnemyZoc = Boolean(options.showAllEnemyZoc);

  return units
    .filter((unit) => unit.owner !== selectedUnit.owner)
    .filter((enemy) => {
      if (showAllEnemyZoc) {
        return true;
      }

      const threshold =
        enemy.depthUd / 2 +
        ZOC_DEFAULT_FRONT_RANGE_UD +
        selectedUnit.depthUd / 2 +
        0.5;
      const dx = selectedUnit.xUd - enemy.xUd;
      const dy = selectedUnit.yUd - enemy.yUd;
      return Math.sqrt(dx * dx + dy * dy) <= threshold;
    })
    .map((enemy) => {
      const rangeUd = ZOC_DEFAULT_FRONT_RANGE_UD;
      const rot = enemy.rotationRadians ?? 0;
      const fwdX = Math.sin(rot);
      const fwdY = -Math.cos(rot);
      const halfDepth = enemy.depthUd / 2;
      const distAlongForward = halfDepth + rangeUd / 2;
      const worldCenterX = enemy.xUd + fwdX * distAlongForward;
      const worldCenterY = enemy.yUd + fwdY * distAlongForward;
      const style = [
        `left:${(worldCenterX / battlefieldProfile.widthUd) * 100}%`,
        `top:${(worldCenterY / battlefieldProfile.heightUd) * 100}%`,
        `width:${(enemy.widthUd / battlefieldProfile.widthUd) * 100}%`,
        `height:${(rangeUd / battlefieldProfile.heightUd) * 100}%`,
        `--zoc-rotation:${rot}rad`,
      ].join(';');

      return `<div class="battlefield-zoc-band" aria-hidden="true" data-enemy-id="${enemy.id}" style="${style}"></div>`;
    })
    .join('');
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isLocalPointInZocBand(localPoint, localBounds) {
  return localPoint.x >= localBounds.minX
    && localPoint.x <= localBounds.maxX
    && localPoint.y >= localBounds.minY
    && localPoint.y <= localBounds.maxY;
}

function getLocalPointDistanceToZocBand(localPoint, localBounds) {
  const closestX = clampNumber(localPoint.x, localBounds.minX, localBounds.maxX);
  const closestY = clampNumber(localPoint.y, localBounds.minY, localBounds.maxY);
  const dx = localPoint.x - closestX;
  const dy = localPoint.y - closestY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getNearZocContacts(units, referenceUnit, thresholdUd = 0.5) {
  if (!referenceUnit) {
    return [];
  }

  return units
    .filter((enemy) => enemy.owner !== referenceUnit.owner)
    .map((enemy) => {
      const zone = getEnemyZocBandLocalBounds(enemy, { rangeUd: ZOC_DEFAULT_FRONT_RANGE_UD });
      const localPoints = getUnitFootprintSamplePoints(referenceUnit).map((sample) => {
        const localPoint = worldPointToLocalPoint(
          {
            center: { x: enemy.xUd, y: enemy.yUd },
            widthUd: enemy.widthUd,
            depthUd: enemy.depthUd,
            rotationRadians: enemy.rotationRadians ?? 0,
          },
          sample.point,
        );

        return {
          localPoint,
          inBand: isLocalPointInZocBand(localPoint, zone.localBounds),
          distanceUd: getLocalPointDistanceToZocBand(localPoint, zone.localBounds),
        };
      });

      if (localPoints.some((point) => point.inBand)) {
        return null;
      }

      const nearestDistanceUd = Math.min(...localPoints.map((point) => point.distanceUd));
      return nearestDistanceUd > 0 && nearestDistanceUd <= thresholdUd
        ? {
            enemyId: enemy.id,
            nearestDistanceUd,
          }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.nearestDistanceUd - right.nearestDistanceUd);
}

export function renderNearZocCue(units, referenceUnit, battlefieldProfile, thresholdUd = 0.5) {
  if (!referenceUnit) {
    return '';
  }

  const nearContacts = getNearZocContacts(units, referenceUnit, thresholdUd);
  if (nearContacts.length === 0) {
    return '';
  }

  const nearest = nearContacts[0];
  const style = [
    `left:${(referenceUnit.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(referenceUnit.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(referenceUnit.widthUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(referenceUnit.depthUd / battlefieldProfile.heightUd) * 100}%`,
    `--near-zoc-rotation:${referenceUnit.rotationRadians ?? 0}rad`,
  ].join(';');

  return `<div class="battlefield-zoc-near-cue" aria-hidden="true" data-near-zoc-enemy="${nearest.enemyId}" style="${style}"></div>`;
}

export function createMovementReferenceUnit(selectedUnit, movementPreview, commanderFreeMovePreview) {
  if (!selectedUnit) {
    return null;
  }

  if (
    commanderFreeMovePreview?.status === 'ready'
    && commanderFreeMovePreview.unitId === selectedUnit.id
    && Number.isFinite(commanderFreeMovePreview.xUd)
    && Number.isFinite(commanderFreeMovePreview.yUd)
  ) {
    return {
      ...selectedUnit,
      xUd: commanderFreeMovePreview.xUd,
      yUd: commanderFreeMovePreview.yUd,
    };
  }

  if (movementPreview?.status !== 'accepted' || !Array.isArray(movementPreview.segments) || movementPreview.segments.length === 0) {
    return selectedUnit;
  }

  const endPose = getMovementPreviewEndPose(movementPreview, {
    xUd: selectedUnit.xUd,
    yUd: selectedUnit.yUd,
    rotationRadians: selectedUnit.rotationRadians ?? 0,
  });

  return {
    ...selectedUnit,
    xUd: endPose.xUd,
    yUd: endPose.yUd,
    rotationRadians: endPose.rotationRadians,
  };
}

export function renderMostThreateningLine(units, referenceUnit, validationSnapshot, battlefieldProfile) {
  if (!referenceUnit || !validationSnapshot?.zoc?.mostThreateningEnemyId) {
    return '';
  }

  const threatEnemy = units.find((unit) => unit.id === validationSnapshot.zoc.mostThreateningEnemyId) || null;
  if (!threatEnemy) {
    return '';
  }

  const dx = threatEnemy.xUd - referenceUnit.xUd;
  const dy = threatEnemy.yUd - referenceUnit.yUd;
  const lengthUd = Math.sqrt(dx * dx + dy * dy);
  if (lengthUd <= 0) {
    return '';
  }

  const centerX = (referenceUnit.xUd + threatEnemy.xUd) / 2;
  const centerY = (referenceUnit.yUd + threatEnemy.yUd) / 2;
  const angleRadians = Math.atan2(dy, dx);

  const style = [
    `left:${(centerX / battlefieldProfile.widthUd) * 100}%`,
    `top:${(centerY / battlefieldProfile.heightUd) * 100}%`,
    `width:${(lengthUd / battlefieldProfile.widthUd) * 100}%`,
    `--threat-line-rotation:${angleRadians}rad`,
  ].join(';');

  return `<div class="battlefield-zoc-threat-line" aria-hidden="true" data-enemy-id="${threatEnemy.id}" style="${style}"></div>`;
}

export function renderCommandStatusLine(state, referenceUnit, battlefieldProfile) {
  if (state.game.setup.isActive || !referenceUnit) {
    return '';
  }

  const commanderId = state.game.commandContext.commander?.unitId ?? null;
  if (!commanderId || commanderId === referenceUnit.id) {
    return '';
  }

  const commanderUnit = state.game.units.find((unit) => unit.id === commanderId) ?? null;
  if (!commanderUnit) {
    return '';
  }

  const commandStatus = state.game.movement.orderCommandSnapshot?.unitId === referenceUnit.id
    ? state.game.movement.orderCommandSnapshot.status
    : state.game.commandContext.inCommand?.status;

  if (commandStatus !== 'in-command' && commandStatus !== 'out-of-command') {
    return '';
  }

  const dx = commanderUnit.xUd - referenceUnit.xUd;
  const dy = commanderUnit.yUd - referenceUnit.yUd;
  const lengthUd = Math.sqrt(dx * dx + dy * dy);
  if (lengthUd <= 0) {
    return '';
  }

  const centerX = (referenceUnit.xUd + commanderUnit.xUd) / 2;
  const centerY = (referenceUnit.yUd + commanderUnit.yUd) / 2;
  const angleRadians = Math.atan2(dy, dx);
  const style = [
    `left:${(centerX / battlefieldProfile.widthUd) * 100}%`,
    `top:${(centerY / battlefieldProfile.heightUd) * 100}%`,
    `width:${(lengthUd / battlefieldProfile.widthUd) * 100}%`,
    `--command-link-rotation:${angleRadians}rad`,
  ].join(';');

  return `
    <div
      class="battlefield-command-link ${commandStatus === 'in-command' ? 'is-in-command' : 'is-out-of-command'}"
      aria-hidden="true"
      data-commander-id="${commanderUnit.id}"
      data-unit-id="${referenceUnit.id}"
      style="${style}"
    ></div>
  `;
}

export function getActiveCommanderRangeVisualization(state, battlefieldProfile) {
  if (state.game.setup.isActive || !state.game.commandContext.activeCorpsId) {
    return '';
  }

  const commanderId = state.game.commandContext.commander?.unitId ?? null;
  const rangeUd = Number.isFinite(state.game.commandContext.commander?.rangeUd)
    ? state.game.commandContext.commander.rangeUd
    : null;
  if (!commanderId || rangeUd == null) {
    return '';
  }

  const commanderUnit = state.game.units.find((unit) => unit.id === commanderId) ?? null;
  if (!commanderUnit) {
    return '';
  }

  const radiusUd = rangeUd + 0.5;
  const diameterUd = radiusUd * 2;
  const style = [
    `left:${(commanderUnit.xUd / battlefieldProfile.widthUd) * 100}%`,
    `top:${(commanderUnit.yUd / battlefieldProfile.heightUd) * 100}%`,
    `width:${(diameterUd / battlefieldProfile.widthUd) * 100}%`,
    `height:${(diameterUd / battlefieldProfile.heightUd) * 100}%`,
  ].join(';');

  return `
    <span class="battlefield-command-range-ring has-range is-active-commander-ring" aria-hidden="true" data-range-commander-id="${commanderUnit.id}" style="${style}">
      <span class="battlefield-command-range-ring-label">${rangeUd} UD</span>
    </span>
  `;
}