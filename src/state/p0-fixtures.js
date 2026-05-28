import { COMMAND_PLAYER_IDS } from './p0-command-context.js';

const DEPLOYMENT_SEED_UNIT_IDS = ['test-unit-1', 'test-unit-2'];

const COMMANDER_QUALITY_RANGES_UD = {
  brilliant: 8,
  competent: 6,
  ordinary: 4,
};

const P6_COMMAND_FIXTURE_TAG = 'p6-command-fixture';

const P6_PLAYER_ONE_CORPS_X_POSITIONS = [5, 10, 15];
const P6_PLAYER_TWO_CORPS_X_POSITIONS = [15, 20, 25];

function createFixtureUnit({
  id,
  owner,
  corpsId,
  xUd,
  yUd,
  widthUd,
  depthUd,
  facing,
  rotationRadians,
  troopType,
  baseShape,
  isCommander = false,
  commanderQuality = null,
  hasIncludedCommander = false,
}) {
  return {
    id,
    owner,
    corpsId,
    xUd,
    yUd,
    facing,
    widthUd,
    depthUd,
    rotationRadians,
    advanceUsedUd: 0,
    moveCountThisSequence: 0,
    slideUsedThisMovementPhase: false,
    stayedThisMovementPhase: false,
    hasChargedThisSequence: false,
    hasEvadedThisSequence: false,
    hasDisengagedThisSequence: false,
    retreatedOutOfZocThisSequence: false,
    cannotShootThisSequence: false,
    commanderMovePhaseStartXUd: null,
    commanderMovePhaseStartYUd: null,
    troopType,
    baseShape,
    fixtureTag: P6_COMMAND_FIXTURE_TAG,
    isCommander,
    commanderQuality,
    commandRangeUd: commanderQuality ? COMMANDER_QUALITY_RANGES_UD[commanderQuality] : null,
    hasIncludedCommander,
    attachedUnitId: null,
    attachedCommanderId: null,
    attachOriginXUd: null,
    attachOriginYUd: null,
    attachOriginRotationRadians: null,
    attachOriginAdvanceUsedUd: null,
  };
}

function createP6CorpsFixtureUnitsForPlayer({ owner, yUd, facing, rotationRadians, xPositions }) {
  const playerPrefix = owner === COMMAND_PLAYER_IDS.PLAYER_ONE ? 'p1' : 'p2';

  const corpsOneId = `${playerPrefix}-corps-1`;
  const corpsTwoId = `${playerPrefix}-corps-2`;
  const corpsThreeId = `${playerPrefix}-corps-3`;

  const corpsOneGeneralId = owner === COMMAND_PLAYER_IDS.PLAYER_ONE ? 'test-unit-1' : 'test-unit-2';
  const corpsOneCavalryOneId = owner === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'test-unit-3' : `${playerPrefix}-c1-cav-1`;
  const corpsOneCavalryTwoId = owner === COMMAND_PLAYER_IDS.PLAYER_TWO ? 'test-unit-4' : `${playerPrefix}-c1-cav-2`;

  return [
    createFixtureUnit({
      id: corpsOneGeneralId,
      owner,
      corpsId: corpsOneId,
      xUd: xPositions[0],
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'general',
      baseShape: 'circle',
      isCommander: true,
      commanderQuality: 'brilliant',
    }),
    createFixtureUnit({
      id: corpsOneCavalryOneId,
      owner,
      corpsId: corpsOneId,
      xUd: xPositions[0] - 1.1,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'cavalry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: corpsOneCavalryTwoId,
      owner,
      corpsId: corpsOneId,
      xUd: xPositions[0] + 1.1,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'cavalry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c2-gen`,
      owner,
      corpsId: corpsTwoId,
      xUd: xPositions[1],
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'general',
      baseShape: 'circle',
      isCommander: true,
      commanderQuality: 'competent',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c2-mi-1`,
      owner,
      corpsId: corpsTwoId,
      xUd: xPositions[1] - 1.1,
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'medium-infantry',
      baseShape: 'square',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c2-mi-2`,
      owner,
      corpsId: corpsTwoId,
      xUd: xPositions[1] + 1.1,
      yUd,
      widthUd: 1,
      depthUd: 1,
      facing,
      rotationRadians,
      troopType: 'medium-infantry',
      baseShape: 'square',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-1`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] - 1.65,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
      hasIncludedCommander: true,
      commanderQuality: 'ordinary',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-2`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] - 0.55,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-3`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] + 0.55,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
    }),
    createFixtureUnit({
      id: `${playerPrefix}-c3-hi-4`,
      owner,
      corpsId: corpsThreeId,
      xUd: xPositions[2] + 1.65,
      yUd,
      widthUd: 1,
      depthUd: 0.75,
      facing,
      rotationRadians,
      troopType: 'heavy-infantry',
      baseShape: 'rectangle',
    }),
  ];
}

export function getDeploymentSeedUnits(units) {
  return units.filter((unit) => DEPLOYMENT_SEED_UNIT_IDS.includes(unit.id));
}

export function createStandardDirectBattleFixtureUnits() {
  return [
    ...createP6CorpsFixtureUnitsForPlayer({
      owner: COMMAND_PLAYER_IDS.PLAYER_ONE,
      yUd: 17,
      facing: 'north',
      rotationRadians: 0,
      xPositions: P6_PLAYER_ONE_CORPS_X_POSITIONS,
    }),
    ...createP6CorpsFixtureUnitsForPlayer({
      owner: COMMAND_PLAYER_IDS.PLAYER_TWO,
      yUd: 3,
      facing: 'south',
      rotationRadians: Math.PI,
      xPositions: P6_PLAYER_TWO_CORPS_X_POSITIONS,
    }),
  ].map((unit) => {
    if (unit.id === 'test-unit-3') {
      return {
        ...unit,
        xUd: 5,
        yUd: 13,
      };
    }

    if (unit.id === 'test-unit-4') {
      return {
        ...unit,
        xUd: 4.5,
        yUd: 8.5,
      };
    }

    return unit;
  });
}