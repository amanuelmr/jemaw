export function getCurrencyDecimalPlaces(currency: string): number {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function parseMinorUnits(amount: string, currency: string): bigint {
  const value = amount.trim();
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  const match = value.match(/^(-?)(\d+)(?:\.(\d+))?$/);

  if (!match) {
    throw new Error("Amount must be a valid decimal number");
  }

  const [, sign, whole, fraction = ""] = match;
  if (fraction.length > decimalPlaces && /[1-9]/.test(fraction.slice(decimalPlaces))) {
    throw new Error(
      `${currency.toUpperCase()} supports at most ${decimalPlaces} decimal ${decimalPlaces === 1 ? "place" : "places"}`
    );
  }

  // Wider numeric DB columns (e.g. numeric(16,4)) return trailing zero padding
  // beyond the currency's own precision — trim that padding rather than the
  // significant digits before applying the currency's decimal places.
  const significantFraction = fraction.slice(0, decimalPlaces);
  const paddedFraction = significantFraction.padEnd(decimalPlaces, "0");
  const scale = 10n ** BigInt(decimalPlaces);
  const units = BigInt(whole) * scale + BigInt(paddedFraction || "0");

  return sign === "-" ? -units : units;
}

export function formatMinorUnits(units: bigint, currency: string): string {
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  const scale = 10n ** BigInt(decimalPlaces);
  const sign = units < 0n ? "-" : "";
  const absolute = units < 0n ? -units : units;
  const whole = absolute / scale;

  if (decimalPlaces === 0) {
    return `${sign}${whole}`;
  }

  const fraction = (absolute % scale).toString().padStart(decimalPlaces, "0");
  return `${sign}${whole}.${fraction}`;
}

export function normalizeMoney(amount: string, currency: string): string {
  return formatMinorUnits(parseMinorUnits(amount, currency), currency);
}

export function subtractMoney(
  left: string,
  right: string,
  currency: string
): string {
  return formatMinorUnits(
    parseMinorUnits(left, currency) - parseMinorUnits(right, currency),
    currency
  );
}

export function sumMoney(amounts: string[], currency: string): string {
  const total = amounts.reduce(
    (sum, amount) => sum + parseMinorUnits(amount, currency),
    0n
  );
  return formatMinorUnits(total, currency);
}

export function assertBalancedMoney(
  amounts: string[],
  currency: string
): void {
  if (parseMinorUnits(sumMoney(amounts, currency), currency) !== 0n) {
    throw new Error("Financial entries must balance to zero");
  }
}

export function splitMoneyEqually(
  amount: string,
  participantIds: string[],
  currency: string
): Array<{ userId: string; amount: string }> {
  if (participantIds.length === 0) {
    throw new Error("At least one participant is required");
  }

  const total = parseMinorUnits(amount, currency);
  if (total <= 0n) {
    throw new Error("Amount must be greater than zero");
  }

  const count = BigInt(participantIds.length);
  const baseShare = total / count;
  const remainder = total % count;

  if (baseShare === 0n) {
    throw new Error("Amount is too small to split among these participants");
  }

  return participantIds.map((userId, index) => {
    const extraUnit = BigInt(index) < remainder ? 1n : 0n;
    return {
      userId,
      amount: formatMinorUnits(baseShare + extraUnit, currency),
    };
  });
}

type WeightedParticipant = { userId: string; weight: bigint };

function allocateMoneyByWeight(
  amount: string,
  participants: WeightedParticipant[],
  currency: string
): Array<{ userId: string; amount: string }> {
  if (participants.length === 0) {
    throw new Error("At least one participant is required");
  }

  const total = parseMinorUnits(amount, currency);
  if (total <= 0n) throw new Error("Amount must be greater than zero");
  if (participants.some((participant) => participant.weight <= 0n)) {
    throw new Error("Every split value must be greater than zero");
  }

  const totalWeight = participants.reduce(
    (sum, participant) => sum + participant.weight,
    0n
  );
  const allocations = participants.map((participant, index) => {
    const weightedAmount = total * participant.weight;
    return {
      userId: participant.userId,
      units: weightedAmount / totalWeight,
      remainder: weightedAmount % totalWeight,
      index,
    };
  });

  let undistributed =
    total - allocations.reduce((sum, allocation) => sum + allocation.units, 0n);
  const remainderOrder = [...allocations].sort(
    (left, right) =>
      Number(right.remainder - left.remainder) || left.index - right.index
  );
  for (const allocation of remainderOrder) {
    if (undistributed === 0n) break;
    allocation.units += 1n;
    undistributed -= 1n;
  }

  if (allocations.some((allocation) => allocation.units === 0n)) {
    throw new Error("Amount is too small for the selected split values");
  }

  return allocations
    .sort((left, right) => left.index - right.index)
    .map((allocation) => ({
      userId: allocation.userId,
      amount: formatMinorUnits(allocation.units, currency),
    }));
}

function parsePercentageBasisPoints(value: string): bigint {
  const match = value.trim().match(/^(\d{1,3})(?:\.(\d{1,2}))?$/);
  if (!match) {
    throw new Error("Percentages support up to two decimal places");
  }

  const basisPoints =
    BigInt(match[1]) * 100n +
    BigInt((match[2] ?? "").padEnd(2, "0"));
  if (basisPoints <= 0n || basisPoints > 10000n) {
    throw new Error("Each percentage must be greater than 0 and at most 100");
  }
  return basisPoints;
}

export function splitMoneyByPercentages(
  amount: string,
  percentages: Array<{ userId: string; percentage: string }>,
  currency: string
) {
  const participants = percentages.map((split) => ({
    userId: split.userId,
    weight: parsePercentageBasisPoints(split.percentage),
  }));
  const totalPercentage = participants.reduce(
    (sum, participant) => sum + participant.weight,
    0n
  );
  if (totalPercentage !== 10000n) {
    throw new Error("Percentages must add up to exactly 100%");
  }
  return allocateMoneyByWeight(amount, participants, currency);
}

export function splitMoneyByShares(
  amount: string,
  shares: Array<{ userId: string; shares: string }>,
  currency: string
) {
  const participants = shares.map((split) => {
    const value = split.shares.trim();
    if (!/^\d{1,6}$/.test(value) || BigInt(value) <= 0n) {
      throw new Error("Shares must be positive whole numbers");
    }
    return { userId: split.userId, weight: BigInt(value) };
  });
  return allocateMoneyByWeight(amount, participants, currency);
}

export function normalizeExactMoneySplits(
  amount: string,
  splits: Array<{ userId: string; amount: string }>,
  currency: string
) {
  if (splits.length === 0) {
    throw new Error("At least one participant is required");
  }

  const normalized = splits.map((split) => {
    const splitAmount = normalizeMoney(split.amount, currency);
    if (parseMinorUnits(splitAmount, currency) <= 0n) {
      throw new Error("Every split amount must be greater than zero");
    }
    return { userId: split.userId, amount: splitAmount };
  });

  if (
    parseMinorUnits(
      sumMoney(normalized.map((split) => split.amount), currency),
      currency
    ) !==
    parseMinorUnits(amount, currency)
  ) {
    throw new Error("Exact split amounts must add up to the bill total");
  }

  return normalized;
}
