import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deliverEnquiry,
  prepareEnquiry,
  validateEnquiry,
  type Enquiry,
} from "./enquiry";

const valid: Enquiry = {
  name: "A Person",
  email: "person@example.com",
  interest: "ai",
  description: "We want to automate a weekly spreadsheet report.",
  company: "",
  links: "",
};

test("valid enquiries support all four distinct interests", () => {
  for (const interest of ["ai", "learning", "hiring", "developer"])
    assert.deepEqual(validateEnquiry({ ...valid, interest }), {});
});
test("required fields reject whitespace, invalid emails, unsupported interests and short descriptions", () => {
  const errors = validateEnquiry({
    ...valid,
    name: " ",
    email: "invalid@",
    interest: "unknown",
    description: " too short ",
  });
  assert.deepEqual(Object.keys(errors), [
    "name",
    "email",
    "interest",
    "description",
  ]);
});
test("optional links accept only complete HTTP(S) URLs", () => {
  assert.ok(validateEnquiry({ ...valid, links: "javascript:alert(1)" }).links);
  assert.ok(validateEnquiry({ ...valid, links: "example.com" }).links);
  assert.deepEqual(
    validateEnquiry({
      ...valid,
      links: "https://example.com/portfolio https://example.com/cv",
    }),
    {},
  );
});
test("enquiry size limits apply on every editable field", () => {
  assert.deepEqual(
    Object.keys(
      validateEnquiry({
        name: "a".repeat(101),
        email: "a".repeat(250) + "@example.com",
        interest: "ai",
        description: "a".repeat(3001),
        company: "a".repeat(151),
        links: "https://example.com/" + "a".repeat(1001),
      }),
    ),
    ["name", "email", "description", "company", "links"],
  );
});
test("the prepared message contains the selected interest and preserves the written need", () => {
  const message = prepareEnquiry({
    ...valid,
    interest: "developer",
    company: "A Company",
    links: "https://example.com",
  });
  assert.match(message, /Interest: Developer introductions/);
  assert.match(message, /Company: A Company/);
  assert.ok(message.includes(valid.description));
  assert.match(message, /Relevant links: https:\/\/example.com/);
});
test("delivery only succeeds with a successful response and explicit delivery confirmation", async (context) => {
  const calls: RequestInit[] = [];
  context.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      calls.push(init);
      return Response.json({ delivered: true });
    },
  );
  await deliverEnquiry("https://example.com/enquiry", valid);
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(JSON.parse(calls[0].body as string), valid);
});
test("an HTTP failure never declares delivery", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ delivered: true }, { status: 500 }),
  );
  await assert.rejects(
    () => deliverEnquiry("https://example.com/enquiry", valid),
    /wasn’t confirmed/,
  );
});
test("confirmed database storage succeeds without claiming an email receipt", async (context) => {
  const reference = "11111111-1111-4111-8111-111111111111";
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ saved: true, reference }),
  );
  assert.deepEqual(
    await deliverEnquiry("https://example.com/enquiry", valid, reference),
    {
      saved: true,
      reference,
      confirmationSent: false,
    },
  );
});
test("a saved claim without a valid reference cannot confirm submission", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ saved: true }),
  );
  await assert.rejects(
    () => deliverEnquiry("https://example.com/enquiry", valid),
    /couldn’t be confirmed as saved/,
  );
});
test("a 200 without explicit delivery confirmation is rejected", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("<html>Not a delivery service</html>", { status: 200 }),
  );
  await assert.rejects(
    () => deliverEnquiry("https://example.com/enquiry", valid),
    /wasn’t confirmed/,
  );
});
test("network failures propagate without changing the enquiry", async (context) => {
  context.mock.method(globalThis, "fetch", async () => {
    throw new Error("Network unavailable");
  });
  await assert.rejects(
    () => deliverEnquiry("https://example.com/enquiry", valid),
    /Delivery couldn’t be confirmed/,
  );
  assert.equal(
    valid.description,
    "We want to automate a weekly spreadsheet report.",
  );
});
