import assert from "node:assert/strict";
import { test } from "node:test";
import { csv, runReport, sampleRows } from "./reporting";
test("sample report excludes the three actual issues and traces accepted totals", () => {
  const result = runReport(sampleRows);
  assert.deepEqual(
    result.totals.map((row) => row.pence),
    [420000, 500000],
  );
  assert.equal(result.change, 80000);
  assert.equal(result.accepted.length, 10);
  assert.deepEqual(
    result.flagged.map((row) => row.index),
    [10, 11, 12],
  );
  assert.deepEqual(result.totals[1].sources, [5, 6, 7, 8, 9]);
  assert.ok(Math.abs(result.percent! - 19.047619) < 0.00001);
});
test("editing inputs changes totals without mutating the source", () => {
  const rows = sampleRows.map((row) => ({ ...row }));
  rows[0].amount = "0.10";
  const result = runReport(rows);
  assert.equal(result.totals[0].pence, 300010);
  assert.equal(sampleRows[0].amount, "1200.00");
});
test("money is exact, malformed values excluded, zero baseline has no percentage", () => {
  const row = { id: "A", week: "Week 2", account: "Test", amount: "0.10" };
  const result = runReport([
    row,
    { ...row, id: "B", amount: "0.20" },
    { ...row, id: "C", amount: "1.005" },
    { ...row, id: "D", amount: "-1" },
    { ...row, id: "E", amount: "1e5" },
  ]);
  assert.equal(result.totals[1].pence, 30);
  assert.equal(result.percent, null);
  assert.equal(result.flagged.length, 3);
});
test("CSV quotes punctuation and defuses spreadsheet formulas", () => {
  assert.equal(
    csv([["=SUM(A1)", 'a,"b"', "x\ny"]]),
    '"\'=SUM(A1)","a,""b""","x\ny"\r\n',
  );
});
