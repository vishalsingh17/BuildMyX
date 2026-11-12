import { test } from "node:test";
import assert from "node:assert/strict";
import {
  handleEnquiryIntake,
  intakeAvailable,
  intakeConfig,
} from "./enquiry-intake";
const siteUrl = "https://example.convex.site";
const reference = "11111111-1111-4111-8111-111111111111";
const fields = {
  name: "Example Visitor",
  email: "visitor@example.com",
  interest: "ai",
  description: "I want to automate my weekly spreadsheet reports.",
  company: "",
  links: "",
};
const request = (body: unknown = fields, headers = {}) =>
  new Request("https://build-my-x.vercel.app/api/enquiry", {
    method: "POST",
    headers: {
      Origin: "https://build-my-x.vercel.app",
      "Content-Type": "application/json",
      "Idempotency-Key": reference,
      ...headers,
    },
    body: JSON.stringify(body),
  });
test("storage discovery works without email settings and disabling intake forces copy mode", async () => {
  assert.equal(await intakeAvailable({ siteUrl: null }), false);
  assert.equal(
    await intakeAvailable({
      siteUrl,
      fetch: async () => Response.json({ enabled: true }),
    }),
    true,
  );
  await assert.rejects(() =>
    intakeAvailable({
      siteUrl,
      fetch: async () => Response.json({ enabled: false }, { status: 503 }),
    }),
  );
  assert.equal(
    intakeConfig({
      ENQUIRY_ENABLED: "false",
      ENQUIRY_CONVEX_SITE_URL: siteUrl,
    }),
    null,
  );
  assert.equal(
    intakeConfig({ ENQUIRY_CONVEX_SITE_URL: "http://example.convex.site" }),
    null,
  );
  assert.equal(intakeConfig({ ENQUIRY_CONVEX_SITE_URL: siteUrl }), siteUrl);
  assert.equal(intakeConfig({ VERCEL_ENV: "preview" }), null);
  const production = "https://kindhearted-hippopotamus-469.convex.site";
  assert.equal(intakeConfig({ VERCEL_ENV: "production" }), production);
  assert.equal(
    intakeConfig({
      VERCEL_ENV: "production",
      ENQUIRY_CONVEX_SITE_URL: "https://tacit-badger-38.convex.site/",
    }),
    production,
  );
  assert.equal(
    intakeConfig({
      VERCEL_ENV: "production",
      ENQUIRY_CONVEX_SITE_URL: siteUrl,
    }),
    siteUrl,
  );
});
test("intake requires confirmed storage and forwards one stable submission reference", async () => {
  const calls: RequestInit[] = [];
  const response = await handleEnquiryIntake(request(), {
    siteUrl,
    fetch: async (_url, init) => {
      calls.push(init!);
      return Response.json({ saved: true, reference });
    },
  });
  assert.deepEqual(await response.json(), { saved: true, reference });
  assert.equal(calls.length, 1);
  assert.equal(
    (calls[0].headers as Record<string, string>)["Idempotency-Key"],
    reference,
  );
  assert.deepEqual(JSON.parse(String(calls[0].body)), fields);
  for (const result of [
    {},
    { delivered: true },
    { saved: true, reference: "wrong" },
  ]) {
    assert.equal(
      (
        await handleEnquiryIntake(request(), {
          siteUrl,
          fetch: async () => Response.json(result),
        })
      ).status,
      503,
    );
  }
});
test("intake rejects origin, media type, malformed fields, honeypot and oversized streamed bodies before forwarding", async () => {
  let calls = 0;
  const deps = {
    siteUrl,
    fetch: async () => {
      calls++;
      return Response.json({ saved: true, reference });
    },
  };
  assert.equal(
    (
      await handleEnquiryIntake(
        request(fields, { Origin: "https://other.example" }),
        deps,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleEnquiryIntake(
        request(fields, { "Content-Type": "text/plain" }),
        deps,
      )
    ).status,
    415,
  );
  assert.equal(
    (await handleEnquiryIntake(request({ ...fields, email: 123 }), deps))
      .status,
    400,
  );
  assert.equal(
    (
      await handleEnquiryIntake(
        request({ ...fields, description: "short" }),
        deps,
      )
    ).status,
    422,
  );
  assert.equal(
    (await handleEnquiryIntake(request({ ...fields, website: "spam" }), deps))
      .status,
    400,
  );
  assert.equal(
    (
      await handleEnquiryIntake(
        request({ ...fields, description: "x".repeat(12001) }),
        deps,
      )
    ).status,
    413,
  );
  assert.equal(calls, 0);
});
test("outages and rate limits never become success or expose upstream details", async () => {
  for (const status of [409, 429, 500]) {
    const response = await handleEnquiryIntake(request(), {
      siteUrl,
      fetch: async () =>
        Response.json({ error: "private-provider-details" }, { status }),
    });
    assert.equal(response.status, status === 500 ? 503 : status);
    assert.doesNotMatch(await response.text(), /private-provider/);
  }
  assert.equal(
    (
      await handleEnquiryIntake(request(), {
        siteUrl,
        fetch: async () => {
          throw new Error("network down");
        },
      })
    ).status,
    503,
  );
});
