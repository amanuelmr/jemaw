const CURRENCY_DECIMAL_PLACES: Record<string, number> = {
  JPY: 0,
};

export function getCurrencyDecimalPlaces(currency: string): number {
  return CURRENCY_DECIMAL_PLACES[currency.toUpperCase()] ?? 2;
}

export function parseMinorUnits(amount: string, currency: string): bigint {
  const value = amount.trim();
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  const match = value.match(/^(-?)(\d+)(?:\.(\d+))?$/);

  if (!match) {
    throw new Error("Amount must be a valid decimal number");
  }

  const [, sign, whole, fraction = ""] = match;
  if (fraction.length > decimalPlaces) {
    throw new Error(
      `${currency.toUpperCase()} supports at most ${decimalPlaces} decimal ${decimalPlaces === 1 ? "place" : "places"}`
    );
  }

  const paddedFraction = fraction.padEnd(decimalPlaces, "0");
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
