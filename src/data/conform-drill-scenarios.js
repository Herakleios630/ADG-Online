import { COMMAND_PLAYER_IDS } from '../state/p0-command-context.js';
import {
  getChargeReactionCapabilityForUnit,
  getDefaultFootprintForProfile,
  getUnitProfile,
  UNIT_PROFILE_IDS,
} from './unit-profiles.js';

export const CONFORM_DRILL_SCENARIO_ID = 'conform-drill';

export const CONFORM_DRILL_LANE_IDS = {
  SHIFTING_UNITS: 'CFD-E1',
  INCOMPLETE_CONFORMATION: 'CFD-E2',
  CONFORMATION_TERRAIN: 'CFD-E3',
  INCOMPLETE_FLANK_CONFORMING: 'CFD-E4',
};

export const CONFORM_DRILL_SUPPORT_STATUSES = {
  SUPPORTED: 'supported',
  DEFERRED: 'deferred',
};

export const CONFORM_DRILL_LANES = [
  {
    id: CONFORM_DRILL_LANE_IDS.SHIFTING_UNITS,
    sourceExampleId: 'rv2-p53-shifting-units-a',
    caption: 'Shifting units when conforming',
    supportStatus: CONFORM_DRILL_SUPPORT_STATUSES.SUPPORTED,
    summary: 'B1 charges A1, slides right to conform, and B2 is pushed back only as much as needed.',
  },
  {
    id: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
    sourceExampleId: 'rv2-p53-incomplete-conformation-a',
    caption: 'Incomplete conformation',
    supportStatus: CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED,
    blocker: 'Requires multi-unit in-contact and support-network-aware conformation.',
  },
  {
    id: CONFORM_DRILL_LANE_IDS.CONFORMATION_TERRAIN,
    sourceExampleId: 'rv2-p53-conformation-terrain-a',
    caption: 'Conformation and terrain',
    supportStatus: CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED,
    blocker: 'Requires terrain system and terrain-sensitive conformation choices.',
  },
  {
    id: CONFORM_DRILL_LANE_IDS.INCOMPLETE_FLANK_CONFORMING,
    sourceExampleId: 'rv2-p53-incomplete-flank-conforming-a',
    caption: 'Incomplete flank conforming',
    supportStatus: CONFORM_DRILL_SUPPORT_STATUSES.DEFERRED,
    blocker: 'Requires terrain plus later-turn fallback and defender-turn follow-up behavior.',
  },
];

function getLaneById(laneId) {
  return CONFORM_DRILL_LANES.find((lane) => lane.id === laneId) ?? null;
}

export function createConformDrillUnit(overrides) {
  const profileId = overrides.profileId ?? UNIT_PROFILE_IDS.CAVALRY;
  const defaultFootprint = getDefaultFootprintForProfile(profileId);
  const visualProfileId = overrides.visualProfileId ?? getUnitProfile(profileId).visualProfileId;
  const lane = getLaneById(overrides.laneId);
  const unit = {
    id: overrides.id,
    owner: overrides.owner,
    corpsId: overrides.corpsId,
    xUd: overrides.xUd,
    yUd: overrides.yUd,
    facing: overrides.facing,
    widthUd: overrides.widthUd ?? defaultFootprint?.widthUd ?? null,
    depthUd: overrides.depthUd ?? defaultFootprint?.depthUd ?? null,
    rotationRadians: overrides.rotationRadians,
    advanceUsedUd: 0,
    slideUsedThisMovementPhase: false,
    stayedThisMovementPhase: false,
    commanderMovePhaseStartXUd: null,
    commanderMovePhaseStartYUd: null,
    troopType: overrides.troopType,
    profileId,
    visualProfileId,
    baseShape: overrides.baseShape ?? defaultFootprint?.baseShape ?? null,
    fixtureTag: CONFORM_DRILL_SCENARIO_ID,
    isCommander: false,
    commanderQuality: null,
    commandRangeUd: null,
    hasIncludedCommander: false,
    attachedUnitId: null,
    attachedCommanderId: null,
    attachOriginXUd: null,
    attachOriginYUd: null,
    attachOriginRotationRadians: null,
    attachOriginAdvanceUsedUd: null,
    scenarioRole: overrides.scenarioRole,
    scenarioLabel: overrides.scenarioLabel,
    scenarioLaneId: lane?.id ?? overrides.laneId,
    scenarioExampleId: lane?.sourceExampleId ?? null,
    scenarioExampleCaption: lane?.caption ?? null,
    scenarioSupportStatus: lane?.supportStatus ?? null,
    scenarioBlocker: lane?.blocker ?? null,
    scenarioOverrideReason: overrides.scenarioOverrideReason ?? null,
    chargeReactionProfile: overrides.chargeReactionProfile ?? null,
    chargeReactionCapability: null,
  };

  unit.chargeReactionCapability = getChargeReactionCapabilityForUnit(unit);
  return unit;
}

export function createConformDrillScenario() {
  const playerOne = COMMAND_PLAYER_IDS.PLAYER_ONE;
  const playerTwo = COMMAND_PLAYER_IDS.PLAYER_TWO;
  const units = [
    createConformDrillUnit({
      id: 'conform-drill-cfd-e1-b1-charger',
      owner: playerOne,
      corpsId: 'p1-corps-1',
      xUd: 6,
      yUd: 15.2,
      facing: 'north',
      rotationRadians: 0,
      troopType: 'cavalry',
      profileId: UNIT_PROFILE_IDS.CAVALRY,
      laneId: CONFORM_DRILL_LANE_IDS.SHIFTING_UNITS,
      scenarioRole: 'cfd-e1-b1-charger',
      scenarioLabel: 'CFD-E1 B1 Charger - Shifting Units',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e1-a1-target',
      owner: playerTwo,
      corpsId: 'p2-corps-1',
      xUd: 6.4,
      yUd: 11.6,
      facing: 'south',
      rotationRadians: Math.PI,
      troopType: 'cavalry',
      profileId: UNIT_PROFILE_IDS.CAVALRY,
      laneId: CONFORM_DRILL_LANE_IDS.SHIFTING_UNITS,
      scenarioRole: 'cfd-e1-a1-target',
      scenarioLabel: 'CFD-E1 A1 Target - Shifting Units',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e1-b2-shifted-neighbor',
      owner: playerOne,
      corpsId: 'p1-corps-1',
      xUd: 7.4,
      yUd: 12.35,
      facing: 'north',
      rotationRadians: 0,
      troopType: 'cavalry',
      profileId: UNIT_PROFILE_IDS.CAVALRY,
      laneId: CONFORM_DRILL_LANE_IDS.SHIFTING_UNITS,
      scenarioRole: 'cfd-e1-b2-shifted-neighbor',
      scenarioLabel: 'CFD-E1 B2 Shifted Neighbor - Shifting Units',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e2-reference-anchor',
      owner: playerOne,
      corpsId: 'p1-corps-2',
      xUd: 12.4,
      yUd: 15.2,
      facing: 'north',
      rotationRadians: 0,
      troopType: 'heavy-infantry',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
      scenarioRole: 'cfd-e2-b1-reference',
      scenarioLabel: 'CFD-E2 B1 Reference - Incomplete Conformation',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e2-b2-reference',
      owner: playerOne,
      corpsId: 'p1-corps-2',
      xUd: 13.6,
      yUd: 15.2,
      facing: 'north',
      rotationRadians: 0,
      troopType: 'heavy-infantry',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
      scenarioRole: 'cfd-e2-b2-reference',
      scenarioLabel: 'CFD-E2 B2 Reference - Incomplete Conformation',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e2-b3-reference',
      owner: playerOne,
      corpsId: 'p1-corps-2',
      xUd: 14.8,
      yUd: 15.2,
      facing: 'north',
      rotationRadians: 0,
      troopType: 'heavy-infantry',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
      scenarioRole: 'cfd-e2-b3-reference',
      scenarioLabel: 'CFD-E2 B3 Reference - Incomplete Conformation',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e2-a1-reference',
      owner: playerTwo,
      corpsId: 'p2-corps-2',
      xUd: 12.4,
      yUd: 12.7,
      facing: 'south',
      rotationRadians: Math.PI,
      troopType: 'heavy-infantry',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
      scenarioRole: 'cfd-e2-a1-reference',
      scenarioLabel: 'CFD-E2 A1 Reference - Incomplete Conformation',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e2-a2-reference',
      owner: playerTwo,
      corpsId: 'p2-corps-2',
      xUd: 13.6,
      yUd: 12.7,
      facing: 'south',
      rotationRadians: Math.PI,
      troopType: 'heavy-infantry',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
      scenarioRole: 'cfd-e2-a2-reference',
      scenarioLabel: 'CFD-E2 A2 Reference - Incomplete Conformation',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e2-a3-reference',
      owner: playerTwo,
      corpsId: 'p2-corps-2',
      xUd: 14.8,
      yUd: 12.7,
      facing: 'south',
      rotationRadians: Math.PI,
      troopType: 'heavy-infantry',
      profileId: UNIT_PROFILE_IDS.HEAVY_INFANTRY,
      laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_CONFORMATION,
      scenarioRole: 'cfd-e2-a3-reference',
      scenarioLabel: 'CFD-E2 A3 Reference - Incomplete Conformation',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e3-reference-anchor',
      owner: playerOne,
      corpsId: 'p1-corps-2',
      xUd: 19,
      yUd: 15.2,
      facing: 'north',
      rotationRadians: 0,
      troopType: 'cavalry',
      profileId: UNIT_PROFILE_IDS.CAVALRY,
      laneId: CONFORM_DRILL_LANE_IDS.CONFORMATION_TERRAIN,
      scenarioRole: 'cfd-e3-reference-anchor',
      scenarioLabel: 'CFD-E3 Deferred - Conformation And Terrain',
    }),
    createConformDrillUnit({
      id: 'conform-drill-cfd-e4-reference-anchor',
      owner: playerOne,
      corpsId: 'p1-corps-3',
      xUd: 25,
      yUd: 15.2,
      facing: 'north',
      rotationRadians: 0,
      troopType: 'cavalry',
      profileId: UNIT_PROFILE_IDS.CAVALRY,
      laneId: CONFORM_DRILL_LANE_IDS.INCOMPLETE_FLANK_CONFORMING,
      scenarioRole: 'cfd-e4-reference-anchor',
      scenarioLabel: 'CFD-E4 Deferred - Incomplete Flank Conforming',
    }),
  ];

  return {
    id: CONFORM_DRILL_SCENARIO_ID,
    label: 'Conform Drill',
    description: 'Source-backed conformation example shell for Rules_v2 page 53. CFD-E1 is the first supported lane; CFD-E2 through CFD-E4 are honest deferred reference anchors until their prerequisite systems exist.',
    lanes: CONFORM_DRILL_LANES,
    units,
    terrainPlaceholders: [],
    setupObjects: [],
  };
}