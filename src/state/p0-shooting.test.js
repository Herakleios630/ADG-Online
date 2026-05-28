import test from 'node:test';
import assert from 'node:assert/strict';

import { UNIT_PROFILE_IDS } from '../data/unit-profiles.js';

import {
  SHOOTING_DECLARATION_REASON_CODES,
  SHOOTING_DECLARATION_STATUSES,
  SHOOTING_PROCEDURE_STATUSES,
  SHOOTING_PROCEDURE_UNIT_STATUSES,
  SHOOTING_PREVIEW_STATUSES,
  acknowledgeShootingPhaseProcedure,
  cancelShootingDeclarationPreview,
  confirmShootingResolution,
  confirmShootingDeclaration,
  createInitialShootingState,
  declareShootingShotGroup,
  getShootingProcedurePresentation,
  getShootingResolutionPresentation,
  passShootingProcedureUnit,
  rebuildShootingProcedureState,
  setShootingResolutionDraftDieRoll,
  setShootingResolutionDraftProtection,
  setShootingDeclarationTarget,
  startShootingResolutionDraft,
  startShootingDeclarationPreview,
} from './p0-shooting.js';

function createGameState(overrides = {}) {
  return {
    selectedUnitId: overrides.selectedUnitId ?? null,
    units: overrides.units ?? [],
    commandContext: overrides.commandContext ?? {
      currentPhaseId: 'shooting',
      activePlayerId: 'player-1',
    },
    shooting: createInitialShootingState(overrides.shooting),
  };
}

function createDeclaredShot(overrides = {}) {
  return {
    status: overrides.status ?? 'ready',
    sourceStatus: overrides.sourceStatus ?? 'verified',
    mainShooterUnitId: overrides.mainShooterUnitId ?? 'shooter-1',
    targetUnitId: overrides.targetUnitId ?? 'target-1',
    supportingUnitIds: overrides.supportingUnitIds ?? [],
    supportBonus: overrides.supportBonus ?? 0,
    declarationSnapshot: overrides.declarationSnapshot ?? {
      mainShooterUnitId: overrides.mainShooterUnitId ?? 'shooter-1',
      targetUnitId: overrides.targetUnitId ?? 'target-1',
      supportingUnitIds: overrides.supportingUnitIds ?? [],
      supportBonus: overrides.supportBonus ?? 0,
    },
  };
}

function createShooter(overrides = {}) {
  return {
    id: overrides.id ?? 'shooter-1',
    owner: overrides.owner ?? 'player-1',
    shootingProfileId: overrides.shootingProfileId ?? 'sp-mounted-bow',
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 10,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 0.75,
    rotationRadians: overrides.rotationRadians ?? 0,
    baseShape: overrides.baseShape ?? 'rectangle',
    scenarioLabel: overrides.scenarioLabel ?? 'Shooter 1',
    moveCountThisSequence: overrides.moveCountThisSequence ?? 0,
    hasChargedThisSequence: overrides.hasChargedThisSequence ?? false,
    hasEvadedThisSequence: overrides.hasEvadedThisSequence ?? false,
    hasDisengagedThisSequence: overrides.hasDisengagedThisSequence ?? false,
    retreatedOutOfZocThisSequence: overrides.retreatedOutOfZocThisSequence ?? false,
    engagedInMelee: overrides.engagedInMelee ?? false,
    inMeleeSupport: overrides.inMeleeSupport ?? false,
    providesOnlySimpleSupport: overrides.providesOnlySimpleSupport ?? false,
  };
}

function createTarget(overrides = {}) {
  return {
    id: overrides.id ?? 'target-1',
    owner: overrides.owner ?? 'player-2',
    profileId: overrides.profileId ?? UNIT_PROFILE_IDS.LIGHT_INFANTRY,
    xUd: overrides.xUd ?? 10,
    yUd: overrides.yUd ?? 8.5,
    widthUd: overrides.widthUd ?? 1,
    depthUd: overrides.depthUd ?? 1,
    rotationRadians: overrides.rotationRadians ?? 0,
    baseShape: overrides.baseShape ?? 'square',
    scenarioLabel: overrides.scenarioLabel ?? 'Target 1',
  };
}

test('P8-06 declares a combined shot group and locks the target for the phase', () => {
  const result = declareShootingShotGroup(createGameState(), createDeclaredShot({ targetUnitId: 'target-7' }));

  assert.equal(result.status, SHOOTING_DECLARATION_STATUSES.DECLARED);
  assert.deepEqual(result.nextGameState.shooting.targetedUnitIds, ['target-7']);
  assert.equal(result.nextGameState.shooting.declaredShots.length, 1);
  assert.equal(result.nextGameState.shooting.declaredShots[0]?.targetUnitId, 'target-7');
});

test('P8-06 rejects duplicate target declarations in the same shooting phase', () => {
  const gameState = createGameState({
    shooting: {
      targetedUnitIds: ['target-7'],
      declaredShots: [createDeclaredShot({ targetUnitId: 'target-7' })],
    },
  });
  const result = declareShootingShotGroup(gameState, createDeclaredShot({ mainShooterUnitId: 'shooter-2', targetUnitId: 'target-7' }));

  assert.equal(result.status, SHOOTING_DECLARATION_STATUSES.REJECTED);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_DECLARATION_REASON_CODES.TARGET_ALREADY_DECLARED);
  assert.equal(result.nextGameState, gameState);
});

test('P8-06 keeps source-open shot groups out of reducer-owned target locks', () => {
  const result = declareShootingShotGroup(
    createGameState(),
    createDeclaredShot({ status: 'source-open', sourceStatus: 'needs-source-check' }),
  );

  assert.equal(result.status, SHOOTING_DECLARATION_STATUSES.REJECTED);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_DECLARATION_REASON_CODES.SHOT_GROUP_SOURCE_OPEN);
  assert.deepEqual(result.nextGameState.shooting.targetedUnitIds, []);
});

test('P8-06 rejects ready-looking declarations that still carry needs-source-check status', () => {
  const result = declareShootingShotGroup(
    createGameState(),
    createDeclaredShot({ status: 'ready', sourceStatus: 'needs-source-check', targetUnitId: 'target-9' }),
  );

  assert.equal(result.status, SHOOTING_DECLARATION_STATUSES.REJECTED);
  assert.equal(result.diagnostics[0]?.code, SHOOTING_DECLARATION_REASON_CODES.SHOT_GROUP_SOURCE_OPEN);
  assert.deepEqual(result.nextGameState.shooting.targetedUnitIds, []);
  assert.deepEqual(result.nextGameState.shooting.declaredShots, []);
});

test('P8-08 starts a reducer-owned shooting preview and readies an eligible target declaration', () => {
  const shooter = createShooter();
  const target = createTarget();
  let gameState = createGameState({
    selectedUnitId: shooter.id,
    units: [shooter, target],
  });

  gameState = startShootingDeclarationPreview(gameState, shooter.id);
  assert.equal(gameState.shooting.preview.status, SHOOTING_PREVIEW_STATUSES.READY);
  assert.equal(gameState.shooting.preview.targetUnitId, target.id);

  gameState = setShootingDeclarationTarget(gameState, target.id);
  assert.equal(gameState.shooting.preview.status, SHOOTING_PREVIEW_STATUSES.READY);
  assert.equal(gameState.shooting.preview.targetUnitId, target.id);

  const result = confirmShootingDeclaration(gameState);
  assert.equal(result.status, SHOOTING_DECLARATION_STATUSES.DECLARED);
  assert.deepEqual(result.nextGameState.shooting.targetedUnitIds, [target.id]);
  assert.equal(result.nextGameState.shooting.preview.status, SHOOTING_PREVIEW_STATUSES.IDLE);
  assert.equal(result.nextGameState.shooting.resolutionDraft.status, 'active');
  assert.equal(result.nextGameState.shooting.resolutionDraft.targetUnitId, target.id);
});

test('P8-08 keeps blocked target picks in reducer state for the why surface without declaring them', () => {
  const shooter = createShooter();
  const friendlyUnit = createTarget({ id: 'friendly-1', owner: 'player-1', scenarioLabel: 'Friendly 1' });
  let gameState = createGameState({
    selectedUnitId: shooter.id,
    units: [shooter, friendlyUnit],
  });

  gameState = startShootingDeclarationPreview(gameState, shooter.id);
  gameState = setShootingDeclarationTarget(gameState, friendlyUnit.id);

  assert.equal(gameState.shooting.preview.status, SHOOTING_PREVIEW_STATUSES.BLOCKED);

  const result = confirmShootingDeclaration(gameState);
  assert.equal(result.status, SHOOTING_DECLARATION_STATUSES.REJECTED);
  assert.deepEqual(result.nextGameState.shooting.declaredShots, []);

  const cancelledState = cancelShootingDeclarationPreview(gameState);
  assert.equal(cancelledState.shooting.preview.status, SHOOTING_PREVIEW_STATUSES.IDLE);
});

test('P8-08 keeps roll/result source-open until explicit verified protection is entered, then records a deterministic result', () => {
  const shooter = createShooter();
  const target = createTarget();
  let gameState = createGameState({
    selectedUnitId: shooter.id,
    units: [shooter, target],
    shooting: {
      declaredShots: [createDeclaredShot({ mainShooterUnitId: shooter.id, targetUnitId: target.id })],
      targetedUnitIds: [target.id],
    },
  });

  gameState = startShootingResolutionDraft(gameState, shooter.id);

  let presentation = getShootingResolutionPresentation({ gameState, selectedUnit: shooter });
  assert.equal(presentation.resolutionDraftActive, true);
  assert.equal(presentation.canConfirmShootingResolution, false);
  assert.equal(presentation.resolutionPreview?.status, 'source-open');

  gameState = setShootingResolutionDraftProtection(gameState, 1);
  gameState = setShootingResolutionDraftDieRoll(gameState, 'shooter', 5);
  gameState = setShootingResolutionDraftDieRoll(gameState, 'target', 3);

  presentation = getShootingResolutionPresentation({ gameState, selectedUnit: shooter });
  assert.equal(presentation.canConfirmShootingResolution, true);
  assert.equal(presentation.resolutionPreview?.result?.cohesionLoss, 1);

  gameState = confirmShootingResolution(gameState);

  assert.equal(gameState.shooting.pendingRollClaims.length, 1);
  assert.equal(gameState.shooting.resolvedShots.length, 1);
  assert.equal(gameState.shooting.resolvedShots[0]?.result?.targetProtectionValue, 1);
  assert.equal(gameState.shooting.resolvedShots[0]?.result?.cohesionLoss, 1);
  assert.equal(gameState.shooting.resolutionDraft.status, 'idle');
});

test('P8-08 guided procedure builds queue and popup counts from eligible ranged units only', () => {
  const firstShooter = createShooter({ id: 'first-shooter', xUd: 4, scenarioLabel: 'First Shooter' });
  const secondShooter = createShooter({ id: 'second-shooter', xUd: 8, scenarioLabel: 'Second Shooter' });
  const blockedShooter = createShooter({ id: 'blocked-shooter', xUd: 12, hasEvadedThisSequence: true, scenarioLabel: 'Blocked Shooter' });
  const meleeOnly = createTarget({ id: 'melee-only', owner: 'player-1', profileId: UNIT_PROFILE_IDS.MEDIUM_INFANTRY, xUd: 16, scenarioLabel: 'Melee Only' });
  let gameState = createGameState({
    units: [
      firstShooter,
      secondShooter,
      blockedShooter,
      meleeOnly,
      createTarget({ id: 'front-target', xUd: 4, yUd: 8.5 }),
      createTarget({ id: 'second-front-target', xUd: 8, yUd: 8.5 }),
    ],
  });

  gameState = rebuildShootingProcedureState(gameState, { status: SHOOTING_PROCEDURE_STATUSES.ANNOUNCED });

  assert.equal(gameState.shooting.procedure.status, SHOOTING_PROCEDURE_STATUSES.ANNOUNCED);
  assert.deepEqual(gameState.shooting.procedure.selectableUnitIds, ['first-shooter', 'second-shooter']);
  assert.deepEqual(gameState.shooting.procedure.blockedUnitIds, ['blocked-shooter']);
  assert.equal(gameState.shooting.procedure.overview.totalRangedUnits, 3);
  assert.equal(gameState.shooting.procedure.overview.eligibleUnits, 2);
  assert.equal(gameState.shooting.procedure.overview.blockedUnits, 1);
  assert.equal(gameState.shooting.procedure.activeShooterUnitId, null);
  assert.equal(
    gameState.shooting.procedure.unitStatuses.find((entry) => entry.unitId === 'melee-only')?.status,
    SHOOTING_PROCEDURE_UNIT_STATUSES.NON_RANGED,
  );
});

test('P8-08 guided procedure acknowledges popup without auto-selecting a shooter and passes only the selected unresolved shooter', () => {
  const firstShooter = createShooter({ id: 'first-shooter', xUd: 4 });
  const secondShooter = createShooter({ id: 'second-shooter', xUd: 8 });
  let gameState = createGameState({
    units: [
      firstShooter,
      secondShooter,
      createTarget({ id: 'front-target', xUd: 4, yUd: 8.5 }),
      createTarget({ id: 'second-front-target', xUd: 8, yUd: 8.5 }),
    ],
  });

  gameState = rebuildShootingProcedureState(gameState, { status: SHOOTING_PROCEDURE_STATUSES.ANNOUNCED });
  gameState = acknowledgeShootingPhaseProcedure(gameState);

  assert.equal(gameState.shooting.procedure.status, SHOOTING_PROCEDURE_STATUSES.ACTIVE);
  assert.equal(gameState.shooting.procedure.activeShooterUnitId, null);
  assert.equal(gameState.selectedUnitId, null);
  assert.equal(getShootingProcedurePresentation(gameState, 'first-shooter').canPassActiveShooter, false);

  gameState = {
    ...gameState,
    selectedUnitId: 'second-shooter',
  };
  gameState = rebuildShootingProcedureState(gameState, { status: SHOOTING_PROCEDURE_STATUSES.ACTIVE, selectedUnitId: 'second-shooter' });

  assert.equal(gameState.shooting.procedure.activeShooterUnitId, 'second-shooter');
  assert.equal(getShootingProcedurePresentation(gameState, 'second-shooter').canPassActiveShooter, true);

  gameState = passShootingProcedureUnit(gameState, 'second-shooter');

  assert.deepEqual(gameState.shooting.procedure.processedUnitIds, ['second-shooter']);
  assert.deepEqual(gameState.shooting.procedure.passedUnitIds, ['second-shooter']);
  assert.equal(gameState.shooting.procedure.activeShooterUnitId, null);
  assert.equal(gameState.selectedUnitId, null);
});

test('P8-08 guided procedure keeps simultaneous resolution isolated and closes the main shooter with same-target supporters', () => {
  const shooter = createShooter({ id: 'procedure-shooter', xUd: 4 });
  const supporter = createShooter({ id: 'support-shooter', xUd: 6, scenarioLabel: 'Support Shooter' });
  const target = createTarget({ id: 'procedure-target', xUd: 4, yUd: 8.5 });
  let gameState = createGameState({
    selectedUnitId: shooter.id,
    units: [shooter, supporter, target],
  });

  gameState = rebuildShootingProcedureState(gameState, { status: SHOOTING_PROCEDURE_STATUSES.ACTIVE, selectedUnitId: shooter.id });
  gameState = acknowledgeShootingPhaseProcedure(gameState);
  gameState = {
    ...gameState,
    selectedUnitId: shooter.id,
  };
  gameState = rebuildShootingProcedureState(gameState, { status: SHOOTING_PROCEDURE_STATUSES.ACTIVE, selectedUnitId: shooter.id });
  const unitsBeforeResolution = gameState.units;

  gameState = startShootingDeclarationPreview(gameState, shooter.id);
  gameState = setShootingDeclarationTarget(gameState, target.id);
  const declarationResult = confirmShootingDeclaration(gameState);
  gameState = declarationResult.nextGameState;

  assert.deepEqual(gameState.shooting.declaredShots[0]?.supportingUnitIds, [supporter.id]);
  assert.equal(gameState.shooting.declaredShots[0]?.supportBonus, 1);

  gameState = startShootingResolutionDraft(gameState, shooter.id);
  gameState = setShootingResolutionDraftProtection(gameState, 1);
  gameState = setShootingResolutionDraftDieRoll(gameState, 'shooter', 5);
  gameState = setShootingResolutionDraftDieRoll(gameState, 'target', 3);
  gameState = confirmShootingResolution(gameState);

  assert.equal(gameState.shooting.resolvedShots.length, 1);
  assert.equal(gameState.shooting.resolvedShots[0]?.applicationStatus, 'pending-simultaneous-group');
  assert.deepEqual(gameState.units, unitsBeforeResolution);
  assert.deepEqual(gameState.shooting.procedure.processedUnitIds, [shooter.id, supporter.id]);
  assert.equal(gameState.shooting.procedure.overview.completedUnits, 2);
  assert.equal(
    gameState.shooting.procedure.unitStatuses.find((entry) => entry.unitId === shooter.id)?.status,
    SHOOTING_PROCEDURE_UNIT_STATUSES.FINISHED,
  );
  assert.equal(
    gameState.shooting.procedure.unitStatuses.find((entry) => entry.unitId === supporter.id)?.status,
    SHOOTING_PROCEDURE_UNIT_STATUSES.FINISHED,
  );
  assert.equal(gameState.shooting.procedure.status, SHOOTING_PROCEDURE_STATUSES.COMPLETE);
  assert.equal(gameState.selectedUnitId, null);
});