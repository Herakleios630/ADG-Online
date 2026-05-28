import test from 'node:test';
import assert from 'node:assert/strict';

import { createShootingLosExampleScenario } from '../../data/shooting-drill-scenarios.js';
import {
  SHOOTING_PRIORITY_REASON_CODES,
  SHOOTING_PRIORITY_STATUSES,
  rankShootingPriorityCandidates,
  selectPriorityShootingTargets,
} from './target-priority.js';
import { SHOOTING_PROFILE_IDS } from './index.js';

function createRectangleUnit(overrides = {}) {
  return {
    id: overrides.id ?? 'unit-1',
    xUd: Number(overrides.xUd ?? 10),
    yUd: Number(overrides.yUd ?? 10),
    widthUd: Number(overrides.widthUd ?? 1),
    depthUd: Number(overrides.depthUd ?? 1),
    rotationRadians: Number(overrides.rotationRadians ?? 0),
    baseShape: 'rectangle',
  };
}

test('P8-05 prefers the nearest target directly in front before wider in-zone targets', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter' });
  const selection = selectPriorityShootingTargets({
    shooterUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    targetUnits: [
      createRectangleUnit({ id: 'front-near', xUd: 10, yUd: 8.5 }),
      createRectangleUnit({ id: 'front-far', xUd: 10, yUd: 7 }),
      createRectangleUnit({ id: 'zone-only', xUd: 11.25, yUd: 8.5 }),
    ],
  });

  assert.equal(selection.status, SHOOTING_PRIORITY_STATUSES.SELECTED);
  assert.equal(selection.selectedTargetUnitId, 'front-near');
});

test('P8-05 falls back to nearest in-zone target when nothing is directly in front', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter' });
  const selection = selectPriorityShootingTargets({
    shooterUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    targetUnits: [
      createRectangleUnit({ id: 'zone-near', xUd: 11.25, yUd: 8.5 }),
      createRectangleUnit({ id: 'zone-far', xUd: 11.25, yUd: 7 }),
    ],
  });

  assert.equal(selection.status, SHOOTING_PRIORITY_STATUSES.SELECTED);
  assert.equal(selection.selectedTargetUnitId, 'zone-near');
});

test('P8-05 equal-distance directly-in-front targets stay a player-choice seam until most-in-front is source-closed', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter' });
  const selection = selectPriorityShootingTargets({
    shooterUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    targetUnits: [
      createRectangleUnit({ id: 'left', xUd: 9.5, yUd: 8.5 }),
      createRectangleUnit({ id: 'right', xUd: 10.5, yUd: 8.5 }),
    ],
  });

  assert.equal(selection.status, SHOOTING_PRIORITY_STATUSES.PLAYER_CHOICE_REQUIRED);
  assert.equal(selection.priorityTargets.length, 2);
  assert.equal(selection.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_PRIORITY_REASON_CODES.MOST_IN_FRONT_TIE), true);
  assert.equal(selection.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_PRIORITY_REASON_CODES.MOST_IN_FRONT_DEFERRED), true);
});

test('P8-05 ranking marks non-priority in-zone targets with diagnostics', () => {
  const shooterUnit = createRectangleUnit({ id: 'shooter' });
  const ranked = rankShootingPriorityCandidates({
    shooterUnit,
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    targetUnits: [
      createRectangleUnit({ id: 'front-near', xUd: 10, yUd: 8.5 }),
      createRectangleUnit({ id: 'zone-only', xUd: 11.25, yUd: 8.5 }),
    ],
  });

  const zoneOnly = ranked.find((candidate) => candidate.targetUnitId === 'zone-only');
  assert.equal(zoneOnly.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_PRIORITY_REASON_CODES.NON_PRIORITY_TARGET), true);
});

test('P8-09 page 58 example keeps B as the priority target for both bowmen', () => {
  const scenario = createShootingLosExampleScenario();
  const unitsByRole = new Map(scenario.units.map((unit) => [unit.scenarioRole, unit]));

  const a1Selection = selectPriorityShootingTargets({
    shooterUnit: unitsByRole.get('A1'),
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    targetUnits: [unitsByRole.get('B'), unitsByRole.get('D')],
  });
  const a2Selection = selectPriorityShootingTargets({
    shooterUnit: unitsByRole.get('A2'),
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    targetUnits: [unitsByRole.get('B'), unitsByRole.get('C2')],
  });
  const a1Ranked = rankShootingPriorityCandidates({
    shooterUnit: unitsByRole.get('A1'),
    shootingProfileId: SHOOTING_PROFILE_IDS.LIGHT_MISSILE_FOOT,
    targetUnits: [unitsByRole.get('B'), unitsByRole.get('D')],
  });
  const dCandidate = a1Ranked.find((candidate) => candidate.targetUnitId === unitsByRole.get('D').id);

  assert.equal(a1Selection.status, SHOOTING_PRIORITY_STATUSES.SELECTED);
  assert.equal(a1Selection.selectedTargetUnitId, unitsByRole.get('B').id);

  assert.equal(a2Selection.status, SHOOTING_PRIORITY_STATUSES.SELECTED);
  assert.equal(a2Selection.selectedTargetUnitId, unitsByRole.get('B').id);

  assert.equal(dCandidate.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_PRIORITY_REASON_CODES.NOT_DIRECTLY_IN_FRONT), true);
  assert.equal(dCandidate.diagnostics.some((diagnostic) => diagnostic.code === SHOOTING_PRIORITY_REASON_CODES.NON_PRIORITY_TARGET), true);
});