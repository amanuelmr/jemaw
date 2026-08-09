import assert from "node:assert/strict";
import test from "node:test";

import {
  assertBalancedMoney,
  formatMinorUnits,
  normalizeMoney,
  normalizeExactMoneySplits,
  parseMinorUnits,
  splitMoneyByPercentages,
  splitMoneyByShares,
  splitMoneyEqually,
  subtractMoney,
  sumMoney,
} from "../src/lib/money.ts";

test("splits remainder cents without losing money", () => {
  const splits = splitMoneyEqually("10.00", ["payer", "a", "b"], "USD");

  assert.deepEqual(splits, [
    { userId: "payer", amount: "3.34" },
    { userId: "a", amount: "3.33" },
    { userId: "b", amount: "3.33" },
  ]);
  assert.equal(
    splits.reduce((sum, split) => sum + parseMinorUnits(split.amount, "USD"), 0n),
    1000n
  );
});

test("respects zero-decimal currencies", () => {
  assert.deepEqual(splitMoneyEqually("100", ["a", "b", "c"], "JPY"), [
    { userId: "a", amount: "34" },
    { userId: "b", amount: "33" },
    { userId: "c", amount: "33" },
  ]);
});

test("normalizes and subtracts money without floating point", () => {
  assert.equal(normalizeMoney("001.2", "USD"), "1.20");
  assert.equal(subtractMoney("10.00", "3.34", "USD"), "6.66");
  assert.equal(sumMoney(["3.33", "3.33"], "USD"), "6.66");
  assert.equal(formatMinorUnits(-125n, "USD"), "-1.25");
});

test("rejects invalid precision and number formats", () => {
  assert.throws(() => parseMinorUnits("1.001", "USD"));
  assert.throws(() => parseMinorUnits("1.50", "JPY"));
  assert.throws(() => parseMinorUnits("1e3", "USD"));
  assert.throws(() => splitMoneyEqually("0.01", ["a", "b"], "USD"));
});

test("enforces zero-sum financial entries", () => {
  assert.doesNotThrow(() => assertBalancedMoney(["6.66", "-3.33", "-3.33"], "USD"));
  assert.throws(() => assertBalancedMoney(["6.67", "-3.33", "-3.33"], "USD"));
});

test("allocates percentages without losing remainder cents", () => {
  assert.deepEqual(
    splitMoneyByPercentages(
      "10.00",
      [
        { userId: "a", percentage: "33.33" },
        { userId: "b", percentage: "33.33" },
        { userId: "c", percentage: "33.34" },
      ],
      "USD"
    ),
    [
      { userId: "a", amount: "3.33" },
      { userId: "b", amount: "3.33" },
      { userId: "c", amount: "3.34" },
    ]
  );
  assert.throws(() =>
    splitMoneyByPercentages(
      "10.00",
      [
        { userId: "a", percentage: "40" },
        { userId: "b", percentage: "50" },
      ],
      "USD"
    )
  );
});

test("allocates weighted shares deterministically", () => {
  assert.deepEqual(
    splitMoneyByShares(
      "10.00",
      [
        { userId: "a", shares: "1" },
        { userId: "b", shares: "2" },
      ],
      "USD"
    ),
    [
      { userId: "a", amount: "3.33" },
      { userId: "b", amount: "6.67" },
    ]
  );
});

test("validates exact splits against the bill total", () => {
  assert.deepEqual(
    normalizeExactMoneySplits(
      "10.00",
      [
        { userId: "a", amount: "4" },
        { userId: "b", amount: "6.00" },
      ],
      "USD"
    ),
    [
      { userId: "a", amount: "4.00" },
      { userId: "b", amount: "6.00" },
    ]
  );
  assert.throws(() =>
    normalizeExactMoneySplits(
      "10.00",
      [
        { userId: "a", amount: "4.00" },
        { userId: "b", amount: "5.99" },
      ],
      "USD"
    )
  );
});
