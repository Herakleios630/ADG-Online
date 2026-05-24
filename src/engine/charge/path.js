import { BATTLEFIELD_PROFILE_IDS, getBattlefieldProfile } from '../../data/battlefield-profiles.js';
import { getUnitMovementBudgetUd } from '../movement/budget.js';
import {
  createSlidePreview,
  createWheelPreview,
  getMovementPreviewEndPose,
  getMovementPreviewSpentBudgetUd,
  MOVEMENT_PIVOT_SIDES,
  MOVEMENT_PREVIEW_STATUSES,
  MOVEMENT_SLIDE_SIDES,
} from '../movement/index.js';

export const CHARGE_START_MANOEUVRE_TYPES = {
  NONE: 'none',
  SHIFT_SLIDE: 'shift-slide',
  WHEEL: 'wheel',
};

export const CHARGE_START_OPTION_STATUSES = {
  AVAILABLE: 'available',
  BLOCKED: 'blocked',
};

export const CHARGE_START_SOURCE_STATUSES = {
  VERIFIED: 'verified',
  NEEDS_SOURCE_CHECK: 'needs-source-check',
};

export function createChargeStartDiagnostic(overrides = {}) {
  return {
    code: overrides.code ?? 'charge.start',
    status: overrides.status ?? 'info',
    text: overrides.text ?? '',
    sourceStatus: overrides.sourceStatus ?? CHARGE_START_SOURCE_STATUSES.VERIFIED,
  };
}

export function createChargeStartOption(overrides = {}) {
  return {
    type: overrides.type ?? CHARGE_START_MANOEUVRE_TYPES.NONE,
    label: overrides.label ?? 'Ohne Startmanoever',
    status: overrides.status ?? CHARGE_START_OPTION_STATUSES.AVAILABLE,
    sourceStatus: overrides.sourceStatus ?? CHARGE_START_SOURCE_STATUSES.VERIFIED,
    reason: overrides.reason ?? '',
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
  };
}

export function createChargeStartManoeuvre(overrides = {}) {
  return {
    type: overrides.type ?? CHARGE_START_MANOEUVRE_TYPES.NONE,
    label: overrides.label ?? 'Ohne Startmanoever',
    slideSide: overrides.slideSide ?? null,
    slideDistanceUd: Number.isFinite(overrides.slideDistanceUd) ? overrides.slideDistanceUd : 0,
    pivotSide: overrides.pivotSide ?? null,
    wheelAngleRadians: Number.isFinite(overrides.wheelAngleRadians) ? overrides.wheelAngleRadians : 0,
    spentBudgetUd: Number.isFinite(overrides.spentBudgetUd) ? overrides.spentBudgetUd : 0,
    sourceStatus: overrides.sourceStatus ?? CHARGE_START_SOURCE_STATUSES.VERIFIED,
    diagnostics: Array.isArray(overrides.diagnostics) ? overrides.diagnostics : [],
  };
}

export function createChargeGuideSegment(overrides = {}) {
  return {
    kind: overrides.kind ?? 'charge-direction-guide',
    xUd: Number.isFinite(overrides.xUd) ? overrides.xUd : 0,
    yUd: Number.isFinite(overrides.yUd) ? overrides.yUd : 0,
    rotationRadians: Number.isFinite(overrides.rotationRadians) ? overrides.rotationRadians : 0,
    distanceUd: Number.isFinite(overrides.distanceUd) ? overrides.distanceUd : 6,
    sourceStatus: overrides.sourceStatus ?? CHARGE_START_SOURCE_STATUSES.VERIFIED,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createAvailableOption(type, label, reason, diagnostics = []) {
  return createChargeStartOption({
    type,
    label,
    status: CHARGE_START_OPTION_STATUSES.AVAILABLE,
    sourceStatus: CHARGE_START_SOURCE_STATUSES.VERIFIED,
    reason,
    diagnostics,
  });
}

function createBlockedOption(type, label, reason, diagnostics = []) {
  return createChargeStartOption({
    type,
    label,
    status: CHARGE_START_OPTION_STATUSES.BLOCKED,
    sourceStatus: CHARGE_START_SOURCE_STATUSES.VERIFIED,
    reason,
    diagnostics,
  });
}

export function getChargeStartOptions({ selectedUnit, targetSnapshot, battlefieldProfile }) {
  if (!selectedUnit || !targetSnapshot?.unitId) {
    return [];
  }

  const resolvedBattlefieldProfile = battlefieldProfile
    ?? getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);
  const canSlideLeft = createSlidePreview(selectedUnit, MOVEMENT_SLIDE_SIDES.LEFT, 1, resolvedBattlefieldProfile).status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED;
  const canSlideRight = createSlidePreview(selectedUnit, MOVEMENT_SLIDE_SIDES.RIGHT, 1, resolvedBattlefieldProfile).status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED;
  const canWheelLeft = createWheelPreview(selectedUnit, MOVEMENT_PIVOT_SIDES.LEFT, Math.PI / 2, resolvedBattlefieldProfile).status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED;
  const canWheelRight = createWheelPreview(selectedUnit, MOVEMENT_PIVOT_SIDES.RIGHT, Math.PI / 2, resolvedBattlefieldProfile).status === MOVEMENT_PREVIEW_STATUSES.ACCEPTED;

  const slideDiagnostics = [
    createChargeStartDiagnostic({
      code: 'charge.start.shift-slide',
      status: canSlideLeft || canSlideRight ? 'ok' : 'blocked',
      text: canSlideLeft || canSlideRight
        ? 'Charge-Start Slide nutzt die bestehende laterale Geometrie und bleibt charge-owned.'
        : 'Charge-Start Slide wuerde die Einheit in der aktuellen Startlage aus dem Spielfeld fuehren.',
    }),
  ];
  const wheelDiagnostics = [
    createChargeStartDiagnostic({
      code: 'charge.start.wheel',
      status: canWheelLeft || canWheelRight ? 'ok' : 'blocked',
      text: canWheelLeft || canWheelRight
        ? 'Charge-Start Wheel nutzt die bestehende Einzelbasis-Geometrie und verbraucht Charge-Budget.'
        : 'Charge-Start Wheel wuerde die Einheit in der aktuellen Startlage aus dem Spielfeld fuehren.',
    }),
  ];

  return [
    createAvailableOption(
      CHARGE_START_MANOEUVRE_TYPES.NONE,
      'Ohne Startmanoever',
      'Charge startet ohne zusaetzliches Startmanoever und behaelt die aktuelle Vorwaertsrichtung.',
      [
        createChargeStartDiagnostic({
          code: 'charge.start.none',
          status: 'ok',
          text: 'Kein zusaetzliches Charge-Startmanoever ausgewaehlt; die Charge bleibt auf der aktuellen Vorwaertsachse.',
        }),
      ],
    ),
    canSlideLeft || canSlideRight
      ? createAvailableOption(
          CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE,
          'Shift/Slide',
          'Charge-Start Slide bleibt als seitliche Ausrichtung verfuegbar und aendert nur die Startlage, nicht die Vorwaertsachse.',
          slideDiagnostics,
        )
      : createBlockedOption(
          CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE,
          'Shift/Slide',
          'Charge-Start Slide ist aus der aktuellen Startlage geometrisch nicht verfuegbar.',
          slideDiagnostics,
        ),
    canWheelLeft || canWheelRight
      ? createAvailableOption(
          CHARGE_START_MANOEUVRE_TYPES.WHEEL,
          'Wheel',
          'Charge-Start Wheel bleibt als erste Charge-Ausrichtung verfuegbar und verbraucht vor dem Advance Charge-Budget.',
          wheelDiagnostics,
        )
      : createBlockedOption(
          CHARGE_START_MANOEUVRE_TYPES.WHEEL,
          'Wheel',
          'Charge-Start Wheel ist aus der aktuellen Startlage geometrisch nicht verfuegbar.',
          wheelDiagnostics,
        ),
  ];
}

function buildChargeStartPreview({ selectedUnit, manoeuvreType, battlefieldProfile, slideSide, slideDistanceUd, pivotSide, wheelAngleRadians }) {
  if (manoeuvreType === CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE) {
    const resolvedSlideSide = slideSide ?? MOVEMENT_SLIDE_SIDES.RIGHT;
    const resolvedSlideDistanceUd = clamp(Number(slideDistanceUd ?? 0), 0, 1);
    return createSlidePreview(selectedUnit, resolvedSlideSide, resolvedSlideDistanceUd, battlefieldProfile);
  }

  if (manoeuvreType === CHARGE_START_MANOEUVRE_TYPES.WHEEL) {
    const resolvedPivotSide = pivotSide ?? MOVEMENT_PIVOT_SIDES.RIGHT;
    const resolvedWheelAngleRadians = clamp(Number(wheelAngleRadians ?? 0), 0, Math.PI / 2);
    return createWheelPreview(selectedUnit, resolvedPivotSide, resolvedWheelAngleRadians, battlefieldProfile);
  }

  return {
    status: MOVEMENT_PREVIEW_STATUSES.ACCEPTED,
    segments: [],
  };
}

function createBlockedResult(option, diagnosticText) {
  return {
    startManoeuvre: createChargeStartManoeuvre({
      type: option.type,
      label: option.label,
      sourceStatus: option.sourceStatus,
      diagnostics: option.diagnostics,
    }),
    startPose: null,
    frozenDirectionRadians: null,
    pathSegments: [],
    diagnostics: [
      ...option.diagnostics,
      createChargeStartDiagnostic({
        code: `charge.start.${option.type}.blocked`,
        status: 'blocked',
        text: diagnosticText,
      }),
    ],
  };
}

export function buildChargeStartSelectionResult({
  selectedUnit,
  targetSnapshot,
  manoeuvreType,
  battlefieldProfile,
  slideSide = null,
  slideDistanceUd = 0,
  pivotSide = null,
  wheelAngleRadians = 0,
}) {
  if (!selectedUnit || !targetSnapshot?.unitId || !manoeuvreType) {
    return null;
  }

  const resolvedBattlefieldProfile = battlefieldProfile
    ?? getBattlefieldProfile(BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM);

  const basePose = {
    xUd: Number(selectedUnit.xUd ?? 0),
    yUd: Number(selectedUnit.yUd ?? 0),
    rotationRadians: Number(selectedUnit.rotationRadians ?? 0),
  };
  const option = getChargeStartOptions({
    selectedUnit,
    targetSnapshot,
    battlefieldProfile: resolvedBattlefieldProfile,
  }).find((candidate) => candidate.type === manoeuvreType) || null;
  if (!option || option.status !== CHARGE_START_OPTION_STATUSES.AVAILABLE) {
    return null;
  }

  const startPreview = buildChargeStartPreview({
    selectedUnit,
    manoeuvreType,
    battlefieldProfile: resolvedBattlefieldProfile,
    slideSide,
    slideDistanceUd,
    pivotSide,
    wheelAngleRadians,
  });

  if (startPreview.status !== MOVEMENT_PREVIEW_STATUSES.ACCEPTED) {
    return createBlockedResult(option, startPreview.explanations?.[0] ?? `${option.label} ist in der aktuellen Geometrie blockiert.`);
  }

  const startPose = manoeuvreType === CHARGE_START_MANOEUVRE_TYPES.NONE
    ? basePose
    : getMovementPreviewEndPose(startPreview, basePose);
  const frozenDirectionRadians = Number(startPose.rotationRadians ?? basePose.rotationRadians ?? 0);
  const spentBudgetUd = getMovementPreviewSpentBudgetUd(startPreview);
  const guideDistanceUd = Math.max(0, getUnitMovementBudgetUd({ selectedUnit, units: [] }) - spentBudgetUd);

  return {
    startManoeuvre: createChargeStartManoeuvre({
      type: option.type,
      label: option.label,
      slideSide: manoeuvreType === CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE ? (slideSide ?? MOVEMENT_SLIDE_SIDES.RIGHT) : null,
      slideDistanceUd: manoeuvreType === CHARGE_START_MANOEUVRE_TYPES.SHIFT_SLIDE ? clamp(Number(slideDistanceUd ?? 0), 0, 1) : 0,
      pivotSide: manoeuvreType === CHARGE_START_MANOEUVRE_TYPES.WHEEL ? (pivotSide ?? MOVEMENT_PIVOT_SIDES.RIGHT) : null,
      wheelAngleRadians: manoeuvreType === CHARGE_START_MANOEUVRE_TYPES.WHEEL ? clamp(Number(wheelAngleRadians ?? 0), 0, Math.PI / 2) : 0,
      spentBudgetUd,
      sourceStatus: option.sourceStatus,
      diagnostics: option.diagnostics,
    }),
    startPose,
    frozenDirectionRadians,
    pathSegments: [
      ...startPreview.segments,
      createChargeGuideSegment({
        xUd: startPose.xUd,
        yUd: startPose.yUd,
        rotationRadians: frozenDirectionRadians,
        distanceUd: guideDistanceUd,
        sourceStatus: option.sourceStatus,
      }),
    ],
    diagnostics: [...option.diagnostics],
  };
}