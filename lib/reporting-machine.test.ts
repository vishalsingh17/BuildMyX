import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialReportingState,
  reportingReducer as reduce,
} from "./reporting-machine";

test("report edits invalidate provenance and only rerun restores current results", () => {
  let state = reduce(initialReportingState(), { type: "RUN" });
  state = reduce(state, { type: "SOURCES", indexes: [0, 1] });
  state = reduce(state, { type: "EDIT", index: 0, amount: "1500.00" });
  assert.equal(state.tag, "staleResult");
  assert.deepEqual(state.highlight, []);
  assert.equal(reduce(state, { type: "SOURCES", indexes: [0] }), state);
  assert.equal(reduce(state, { type: "QUESTION", question: "checks" }), state);
  state = reduce(state, { type: "RUN" });
  assert.equal(state.tag, "currentResult");
  assert.equal(state.result?.totals[0].pence, 450000);
});
test("reset restores the sample, clears results and returns to Compare weeks", () => {
  let state = reduce(initialReportingState(), { type: "RUN" });
  state = reduce(state, { type: "QUESTION", question: "checks" });
  state = reduce(state, { type: "SOURCES", indexes: [0] });
  state = reduce(state, { type: "RESET" });
  assert.deepEqual(state, initialReportingState());
  state = reduce(state, { type: "RUN" });
  assert.equal(state.question, "change");
});
test("editing before a report exists keeps a distinct result-free state", () => {
  const state = reduce(initialReportingState(), {
    type: "EDIT",
    index: 0,
    amount: "0",
  });
  assert.equal(state.tag, "editedWithoutResult");
  assert.equal(state.result, null);
});
