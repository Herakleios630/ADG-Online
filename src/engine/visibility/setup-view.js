export const SETUP_VIEW_MODES = {
  CANONICAL: 'canonical',
  PLAYER_ONE: 'player-one-view',
  PLAYER_TWO: 'player-two-view',
  HOTSEAT_HANDOFF: 'hotseat-handoff',
};

export function getSetupViewModeLabel(viewMode) {
  switch (viewMode) {
    case SETUP_VIEW_MODES.PLAYER_ONE:
      return 'Player 1';
    case SETUP_VIEW_MODES.PLAYER_TWO:
      return 'Player 2';
    case SETUP_VIEW_MODES.HOTSEAT_HANDOFF:
      return 'Hotseat Handoff';
    case SETUP_VIEW_MODES.CANONICAL:
    default:
      return 'Canonical';
  }
}

function canViewOwnerPrivate(owner, viewMode) {
  if (viewMode === SETUP_VIEW_MODES.CANONICAL) {
    return true;
  }

  if (viewMode === SETUP_VIEW_MODES.HOTSEAT_HANDOFF) {
    return false;
  }

  return (
    (viewMode === SETUP_VIEW_MODES.PLAYER_ONE && owner === 'player-1')
    || (viewMode === SETUP_VIEW_MODES.PLAYER_TWO && owner === 'player-2')
  );
}

function createEmptyBattlePlanAssignments(fieldAssignments) {
  return Object.fromEntries(
    Object.keys(fieldAssignments).map((fieldId) => [fieldId, []]),
  );
}

function projectBattlePlanForViewer(battlePlan, viewMode) {
  const canViewPrivate = canViewOwnerPrivate(battlePlan.owner, viewMode);
  if (canViewPrivate) {
    return {
      ...battlePlan,
      isPrivateVisible: true,
      isRedacted: false,
      redactedMessage: '',
    };
  }

  return {
    ...battlePlan,
    selectedCorpsId: null,
    corpsCards: battlePlan.corpsCards.map((corpsCard) => ({
      ...corpsCard,
      assignmentFieldId: null,
    })),
    fieldAssignments: createEmptyBattlePlanAssignments(battlePlan.fieldAssignments),
    isPrivateVisible: false,
    isRedacted: true,
    redactedMessage:
      viewMode === SETUP_VIEW_MODES.HOTSEAT_HANDOFF
        ? 'Private battle-plan assignments are hidden during hotseat handoff.'
        : 'Private battle-plan assignments are hidden from the opposing player.',
  };
}

function projectAmbushMarkersForViewer(ambushMarkers, viewMode) {
  const canViewPrivate = canViewOwnerPrivate(ambushMarkers.owner, viewMode);

  return {
    ...ambushMarkers,
    selectedMarkerId: canViewPrivate ? ambushMarkers.selectedMarkerId : null,
    markers: ambushMarkers.markers.map((marker) =>
      canViewPrivate
        ? {
            ...marker,
            isPrivateVisible: true,
            isRedacted: false,
          }
        : {
            ...marker,
            privateContents: {
              notes: '',
              unitRefs: [],
            },
            isPrivateVisible: false,
            isRedacted: true,
          },
    ),
    isPrivateVisible: canViewPrivate,
    isRedacted: !canViewPrivate,
    redactedMessage:
      canViewPrivate
        ? ''
        : viewMode === SETUP_VIEW_MODES.HOTSEAT_HANDOFF
          ? 'Private ambush contents are hidden during hotseat handoff.'
          : 'Private ambush contents are hidden from the opposing player.',
  };
}

export function projectSetupForViewer(setup, viewMode = SETUP_VIEW_MODES.CANONICAL) {
  return {
    ...setup,
    battlePlan: projectBattlePlanForViewer(setup.battlePlan, viewMode),
    ambushMarkers: projectAmbushMarkersForViewer(setup.ambushMarkers, viewMode),
    viewer: {
      mode: viewMode,
      label: getSetupViewModeLabel(viewMode),
    },
  };
}