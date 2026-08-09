import assert from "node:assert/strict";
import test from "node:test";

import { createCsv, escapeCsvCell } from "../src/lib/csv.ts";

test("escapes commas, quotes, and newlines in CSV cells", () => {
  assert.equal(escapeCsvCell('Dinner, "Friday"\npaid'), '"Dinner, ""Friday""\npaid"');
});

test("neutralizes spreadsheet formulas in user-controlled cells", () => {
  assert.equal(escapeCsvCell("=HYPERLINK(\"bad\")"), '"\'=HYPERLINK(""bad"")"');
  assert.equal(escapeCsvCell("-not-a-number"), '"\'-not-a-number"');
  assert.equal(escapeCsvCell("-12.50"), '"-12.50"');
});

test("creates RFC-style rows with CRLF line endings", () => {
  assert.equal(
    createCsv(["name", "amount"], [["Lunch", "12.50"]]),
    '"name","amount"\r\n"Lunch","12.50"'
  );
});
