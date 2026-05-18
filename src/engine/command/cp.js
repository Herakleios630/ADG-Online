export const COMMAND_CP_SOURCE_STATUS = 'needs-source-check';

export const COMMAND_CP_REASON_CODES = {
  ACTIVATION_ROLL: 'activation-roll',
  FREE_CP: 'free-cp',
  BASE_ORDER: 'base-order',
  OUT_OF_COMMAND: 'out-of-command',
  DIFFICULT_MANOEUVRE: 'difficult-manoeuvre',
  COMMANDER_ENGAGED: 'commander-engaged',
};

function createLedgerEntry({
  reasonCode,
  amount,
  note,
  dieRoll = null,
  commanderValue = null,
  unitId = null,
}) {
  return {
    reasonCode,
    amount,
    note,
    dieRoll,
    commanderValue,
    unitId,
    sourceStatus: COMMAND_CP_SOURCE_STATUS,
  };
}

export function createCommandPointState({
  available = 0,
  spent = 0,
  free = 0,
  lastRoll = null,
  ledger = [],
} = {}) {
  return {
    available,
    spent,
    free,
    lastRoll,
    ledger,
    label: available == null ? 'CP placeholder pending source check' : `${available} CP available`,
    sourceStatus: COMMAND_CP_SOURCE_STATUS,
  };
}

export function generateCommandPoints({ dieRoll, commanderValue, freeCp = 1 }) {
  if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 6) {
    throw new Error('Command point generation requires a D6 roll from 1 to 6.');
  }

  if (!Number.isFinite(commanderValue)) {
    throw new Error('Command point generation requires a numeric commander value.');
  }

  if (!Number.isInteger(freeCp) || freeCp < 0) {
    throw new Error('Command point generation requires a non-negative integer free CP value.');
  }

  const rolledCp = Math.ceil((dieRoll + commanderValue) / 2);
  const available = rolledCp + freeCp;

  return createCommandPointState({
    available,
    spent: 0,
    free: freeCp,
    lastRoll: dieRoll,
    ledger: [
      createLedgerEntry({
        reasonCode: COMMAND_CP_REASON_CODES.ACTIVATION_ROLL,
        amount: rolledCp,
        note: 'Activation roll component from the current P6 formula anchor.',
        dieRoll,
        commanderValue,
      }),
      createLedgerEntry({
        reasonCode: COMMAND_CP_REASON_CODES.FREE_CP,
        amount: freeCp,
        note: 'Free CP component from the current P6 formula anchor.',
      }),
    ],
  });
}

export function getCommandPointCostBreakdown({
  inCommand = true,
  difficultManoeuvre = false,
  commanderEngaged = false,
  useFreeCommandPoint = false,
} = {}) {
  const components = [];
  let surchargeCost = 0;

  if (useFreeCommandPoint) {
    components.push(createLedgerEntry({
      reasonCode: COMMAND_CP_REASON_CODES.FREE_CP,
      amount: -1,
      note: 'Free CP assigned to the base order cost for a commander-led movement order in the approved P6 subset.',
    }));
  } else {
    components.push(createLedgerEntry({
      reasonCode: COMMAND_CP_REASON_CODES.BASE_ORDER,
      amount: 1,
      note: 'Base cost for a movement order in the approved P6 subset.',
    }));
  }

  if (!inCommand) {
    components.push(createLedgerEntry({
      reasonCode: COMMAND_CP_REASON_CODES.OUT_OF_COMMAND,
      amount: 1,
      note: 'Out-of-command surcharge in the approved P6 subset.',
    }));
    surchargeCost += 1;
  }

  if (difficultManoeuvre) {
    components.push(createLedgerEntry({
      reasonCode: COMMAND_CP_REASON_CODES.DIFFICULT_MANOEUVRE,
      amount: 1,
      note: 'Difficult manoeuvre surcharge in the approved P6 subset.',
    }));
    surchargeCost += 1;
  }

  if (commanderEngaged) {
    components.push(createLedgerEntry({
      reasonCode: COMMAND_CP_REASON_CODES.COMMANDER_ENGAGED,
      amount: 1,
      note: 'Commander engaged surcharge anchor carried into P6.',
    }));
    surchargeCost += 1;
  }

  return {
    totalCost: 1 + surchargeCost,
    usesFreeCommandPoint: useFreeCommandPoint,
    freeCommandPointDelta: useFreeCommandPoint ? -1 : 0,
    components,
    sourceStatus: COMMAND_CP_SOURCE_STATUS,
  };
}

export function spendCommandPoints(commandPointState, costBreakdown, { unitId = null } = {}) {
  const totalCost = Number(costBreakdown?.totalCost ?? 0);
  if (!Number.isInteger(totalCost) || totalCost < 0) {
    throw new Error('Command point spend requires a non-negative integer total cost.');
  }

  const available = Number(commandPointState?.available ?? 0);
  const spent = Number(commandPointState?.spent ?? 0);
  const free = Number(commandPointState?.free ?? 0);
  const freeCommandPointDelta = Number(costBreakdown?.freeCommandPointDelta ?? 0);
  const requiredFreeCommandPoints = Math.max(0, -freeCommandPointDelta);
  if (totalCost > available) {
    return {
      ok: false,
      shortage: totalCost - available,
      nextState: commandPointState,
    };
  }

  if (requiredFreeCommandPoints > free) {
    return {
      ok: false,
      shortage: requiredFreeCommandPoints - free,
      nextState: commandPointState,
    };
  }

  const ledgerEntries = (costBreakdown?.components ?? []).map((entry) => ({
    ...entry,
    unitId: entry.unitId ?? unitId,
  }));

  const nextAvailable = available - totalCost;
  const spentDelta = Math.max(0, totalCost - requiredFreeCommandPoints);
  const nextState = createCommandPointState({
    available: nextAvailable,
    spent: spent + spentDelta,
    free: free + freeCommandPointDelta,
    lastRoll: commandPointState?.lastRoll ?? null,
    ledger: [...(commandPointState?.ledger ?? []), ...ledgerEntries],
  });

  return {
    ok: true,
    shortage: 0,
    nextState,
  };
}

export function spendFreeCommandPoint(commandPointState, { unitId = null } = {}) {
  const available = Number(commandPointState?.available ?? 0);
  const free = Number(commandPointState?.free ?? 0);

  if (available < 1 || free < 1) {
    return {
      ok: false,
      shortage: 1,
      nextState: commandPointState,
    };
  }

  const nextState = createCommandPointState({
    available: available - 1,
    spent: Number(commandPointState?.spent ?? 0),
    free: free - 1,
    lastRoll: commandPointState?.lastRoll ?? null,
    ledger: [
      ...(commandPointState?.ledger ?? []),
      createLedgerEntry({
        reasonCode: COMMAND_CP_REASON_CODES.FREE_CP,
        amount: -1,
        note: 'Free CP spent to start a free commander move in the approved P6 subset.',
        unitId,
      }),
    ],
  });

  return {
    ok: true,
    shortage: 0,
    nextState,
  };
}

export function refundFreeCommandPoint(commandPointState, { unitId = null } = {}) {
  const available = Number(commandPointState?.available ?? 0);
  const free = Number(commandPointState?.free ?? 0);

  if (free >= 1) {
    return {
      ok: false,
      shortage: 0,
      nextState: commandPointState,
    };
  }

  const nextState = createCommandPointState({
    available: available + 1,
    spent: Number(commandPointState?.spent ?? 0),
    free: free + 1,
    lastRoll: commandPointState?.lastRoll ?? null,
    ledger: [
      ...(commandPointState?.ledger ?? []),
      createLedgerEntry({
        reasonCode: COMMAND_CP_REASON_CODES.FREE_CP,
        amount: 1,
        note: 'Free CP refunded after resetting a free commander move in the approved P6 subset.',
        unitId,
      }),
    ],
  });

  return {
    ok: true,
    shortage: 0,
    nextState,
  };
}

export function refundCommandPointsForUnit(commandPointState, unitId) {
  if (!unitId) {
    return {
      ok: false,
      refunded: false,
      nextState: commandPointState,
    };
  }

  const refundableReasonCodes = [
    COMMAND_CP_REASON_CODES.BASE_ORDER,
    COMMAND_CP_REASON_CODES.OUT_OF_COMMAND,
    COMMAND_CP_REASON_CODES.DIFFICULT_MANOEUVRE,
    COMMAND_CP_REASON_CODES.COMMANDER_ENGAGED,
  ];
  const normalTotals = refundableReasonCodes.reduce((totals, reasonCode) => {
    totals[reasonCode] = 0;
    return totals;
  }, {});
  let freeConsumed = 0;

  for (const entry of commandPointState?.ledger ?? []) {
    if (entry?.unitId !== unitId) {
      continue;
    }

    if (entry.reasonCode === COMMAND_CP_REASON_CODES.FREE_CP) {
      freeConsumed += -Number(entry.amount ?? 0);
      continue;
    }

    if (Object.hasOwn(normalTotals, entry.reasonCode)) {
      normalTotals[entry.reasonCode] += Number(entry.amount ?? 0);
    }
  }

  const refundableFree = Math.max(0, freeConsumed);
  const refundEntries = [];
  let refundableNormal = 0;

  for (const reasonCode of refundableReasonCodes) {
    const amount = Math.max(0, normalTotals[reasonCode]);
    if (amount < 1) {
      continue;
    }

    refundableNormal += amount;
    refundEntries.push(createLedgerEntry({
      reasonCode,
      amount: -amount,
      note: 'Command points refunded after resetting a unit to its current battle baseline.',
      unitId,
    }));
  }

  if (refundableFree > 0) {
    refundEntries.push(createLedgerEntry({
      reasonCode: COMMAND_CP_REASON_CODES.FREE_CP,
      amount: refundableFree,
      note: 'Free CP refunded after resetting a unit to its current battle baseline.',
      unitId,
    }));
  }

  if (refundEntries.length === 0) {
    return {
      ok: true,
      refunded: false,
      nextState: commandPointState,
    };
  }

  const nextState = createCommandPointState({
    available: Number(commandPointState?.available ?? 0) + refundableNormal + refundableFree,
    spent: Math.max(0, Number(commandPointState?.spent ?? 0) - refundableNormal),
    free: Number(commandPointState?.free ?? 0) + refundableFree,
    lastRoll: commandPointState?.lastRoll ?? null,
    ledger: [...(commandPointState?.ledger ?? []), ...refundEntries],
  });

  return {
    ok: true,
    refunded: true,
    nextState,
  };
}