import assert from "node:assert/strict";
import { test } from "node:test";
import {
  enquiryBusy,
  enquiryReducer as reduce,
  initialEnquiryState,
  type EnquiryState,
} from "./enquiry-machine";

const valid = (): EnquiryState => ({
  ...initialEnquiryState("/api/enquiry"),
  values: {
    name: "Example Visitor",
    email: "visitor@example.test",
    interest: "ai",
    description: "Please help automate our weekly reporting workflow.",
    company: "",
    links: "",
  },
});
const send = (
  state: EnquiryState,
  operationId = "operation-1",
  submissionId = "submission-1",
) => reduce(state, { type: "START_SEND", operationId, submissionId });
const fail = (state: EnquiryState, operationId = "operation-1") =>
  reduce(state, {
    type: "SEND_UNCONFIRMED",
    operationId,
    message: "Delivery is unconfirmed",
  });

test("retry identity belongs to the persistent draft and normalizes whitespace", () => {
  let state = fail(send(valid()));
  state = reduce(state, {
    type: "EDIT",
    field: "name",
    value: " Example Visitor ",
  });
  state = send(state, "operation-2", "new-id-that-must-not-be-used");
  assert.equal(state.submission?.id, "submission-1");
  state = fail(state, "operation-2");
  state = reduce(state, {
    type: "EDIT",
    field: "description",
    value: "An actually different enquiry about a new reporting task.",
  });
  state = send(state, "operation-3", "submission-3");
  assert.equal(state.submission?.id, "submission-3");
});
test("a late send cannot confirm an edited draft, but preserves the old acceptance", () => {
  let state = send(valid());
  state = reduce(state, {
    type: "EDIT",
    field: "description",
    value: "These are new details which have not been submitted.",
  });
  assert.equal(enquiryBusy(state), true);
  state = reduce(state, {
    type: "SENT",
    operationId: "operation-1",
    result: { reference: "accepted", confirmationSent: false },
  });
  assert.equal(state.phase.tag, "editing");
  assert.match(state.values.description, /new details/);
  assert.equal(state.submission?.result?.reference, "accepted");
});
test("late clipboard outcomes after an edit never create an empty manual-copy phase", () => {
  for (const manual of [true, false]) {
    let state = reduce(valid(), {
      type: "START_COPY",
      operationId: "copy-1",
      message: "The original prepared snapshot",
    });
    state = reduce(state, {
      type: "EDIT",
      field: "interest",
      value: "learning",
    });
    state = reduce(state, {
      type: "COPY_FINISHED",
      operationId: "copy-1",
      manual,
    });
    assert.equal(state.phase.tag, "editing");
    assert.equal(enquiryBusy(state), false);
  }
});
test("sending after a copied message atomically removes all copy feedback", () => {
  let state = reduce(valid(), {
    type: "START_COPY",
    operationId: "copy-1",
    message: "Prepared enquiry",
  });
  state = reduce(state, {
    type: "COPY_FINISHED",
    operationId: "copy-1",
    manual: false,
  });
  state = send(state);
  assert.equal(state.phase.tag, "sending");
  assert.equal("message" in state.phase, false);
  state = reduce(state, {
    type: "SENT",
    operationId: "operation-1",
    result: { confirmationSent: true },
  });
  assert.equal(state.phase.tag, "submitted");
  assert.equal("message" in state.phase, false);
});
test("interest and ordinary edits consistently reset error and copy-fallback feedback", () => {
  for (const [field, value] of [
    ["interest", "hiring"],
    ["name", "Updated Visitor"],
  ] as const) {
    const state = reduce(fail(send(valid())), { type: "EDIT", field, value });
    assert.equal(state.phase.tag, "editing");
    assert.equal(enquiryBusy(state), false);
  }
});
test("rapid second actions and stale completions cannot replace the active attempt", () => {
  let state = send(valid());
  assert.equal(
    reduce(state, {
      type: "START_COPY",
      operationId: "copy-2",
      message: "Other message",
    }),
    state,
  );
  state = send(fail(state), "operation-2");
  assert.equal(
    reduce(state, {
      type: "SENT",
      operationId: "operation-1",
      result: { confirmationSent: true },
    }),
    state,
  );
});
test("capability retries ignore previous probes and do not overwrite action state", () => {
  let state = initialEnquiryState(null);
  state = reduce(state, {
    type: "DISCOVERED",
    generation: 0,
    outcome: "error",
  });
  state = reduce(state, { type: "RETRY_DISCOVERY" });
  assert.equal(
    reduce(state, { type: "DISCOVERED", generation: 0, outcome: "available" }),
    state,
  );
  state = reduce(state, {
    type: "START_COPY",
    operationId: "copy",
    message: "An owned snapshot",
  });
  state = reduce(state, {
    type: "DISCOVERED",
    generation: 1,
    outcome: "available",
  });
  assert.equal(state.capability.tag, "available");
  assert.equal(state.phase.tag, "copying");
});
test("enquiry-start semantics are once for the persistent draft", () => {
  const state = reduce(valid(), { type: "STARTED" });
  assert.equal(reduce(state, { type: "STARTED" }), state);
  assert.equal(
    reduce(state, { type: "EDIT", field: "interest", value: "developer" })
      .started,
    true,
  );
});
