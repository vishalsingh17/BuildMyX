import { siteConfig } from "../site-config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { handleEnquiry } from "./enquiries";
import { memoryDeliveryStore } from "./delivery-store.fixture";
const origin = new URL(siteConfig.canonicalUrl || "https://example.com").origin;
const config = {
  apiKey: "test-key",
  from: "BuildMyX <site@example.com>",
  to: "owner@example.com",
};
const valid = {
  name: "Example Visitor",
  email: "visitor@example.com",
  interest: "ai",
  description: "We want to automate a weekly spreadsheet report.",
  company: "Example",
  links: "https://example.com",
};
const id = "11111111-1111-4111-8111-111111111111";
const request = (body: unknown = valid, headers: Record<string, string> = {}) =>
  new Request(`${origin}/api/enquiry`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "Idempotency-Key": id,
      ...headers,
    },
    body: JSON.stringify(body),
  });
const dependencies = () => ({
  config,
  store: memoryDeliveryStore(),
  secret: "test-only-hashing-secret",
  allowRequest: () => true,
});
test("unconfigured sending stays unavailable", async () => {
  const response = await handleEnquiry(request(), { config: null });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).delivered, undefined);
});
test("origin, media type, rate and size are enforced before email", async () => {
  assert.equal(
    (
      await handleEnquiry(
        request(valid, { Origin: "https://other.example" }),
        dependencies(),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleEnquiry(
        request(valid, { "Content-Type": "text/plain" }),
        dependencies(),
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await handleEnquiry(request(), {
        ...dependencies(),
        allowRequest: () => false,
      })
    ).status,
    429,
  );
  assert.equal(
    (
      await handleEnquiry(
        request({ ...valid, description: "x".repeat(12001) }),
        dependencies(),
      )
    ).status,
    413,
  );
});
test("server rejects malformed JSON, types, invalid fields and honeypot", async () => {
  const malformed = new Request(`${origin}/api/enquiry`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: "{",
  });
  assert.equal((await handleEnquiry(malformed, dependencies())).status, 400);
  assert.equal(
    (await handleEnquiry(request({ ...valid, email: 42 }), dependencies()))
      .status,
    400,
  );
  const response = await handleEnquiry(
    request({ ...valid, email: "invalid", description: "short" }),
    dependencies(),
  );
  assert.equal(response.status, 422);
  assert.ok((await response.json()).fields.email);
  assert.equal(
    (
      await handleEnquiry(
        request({ ...valid, website: "spam" }),
        dependencies(),
      )
    ).status,
    400,
  );
});
test("business notification and visitor receipt use stable independent idempotency keys", async () => {
  const calls: RequestInit[] = [];
  const response = await handleEnquiry(request(), {
    ...dependencies(),
    fetch: (async (_url, init) => {
      calls.push(init!);
      return Response.json({ id: `mail-${calls.length}` });
    }) as typeof fetch,
  });
  assert.deepEqual(await response.json(), {
    delivered: true,
    reference: id,
    confirmationSent: true,
  });
  assert.equal(calls.length, 2);
  assert.equal(
    (calls[0].headers as Record<string, string>)["Idempotency-Key"],
    `${id}-owner`,
  );
  assert.equal(
    (calls[1].headers as Record<string, string>)["Idempotency-Key"],
    `${id}-receipt`,
  );
  assert.deepEqual(JSON.parse(String(calls[0].body)).to, [config.to]);
  assert.equal(JSON.parse(String(calls[0].body)).reply_to, valid.email);
  assert.deepEqual(JSON.parse(String(calls[1].body)).to, [valid.email]);
  assert.match(JSON.parse(String(calls[0].body)).text, /weekly spreadsheet/);
});
test("provider failure cannot become success; receipt failure does not invite a duplicate", async () => {
  let calls = 0;
  const failure = (async () => {
    calls++;
    return Response.json({ error: "private upstream detail" }, { status: 500 });
  }) as typeof fetch;
  const failed = await handleEnquiry(request(), {
    ...dependencies(),
    fetch: failure,
  });
  assert.equal(failed.status, 502);
  assert.equal(calls, 1);
  assert.doesNotMatch(await failed.text(), /private upstream|test-key/);
  calls = 0;
  const partial = await handleEnquiry(request(), {
    ...dependencies(),
    fetch: (async () => {
      calls++;
      if (calls === 2) throw new Error("network error");
      return Response.json({ id: "accepted" });
    }) as typeof fetch,
  });
  assert.deepEqual(await partial.json(), {
    delivered: true,
    reference: id,
    confirmationSent: false,
  });
});

test("configured sending requires durable records and fails closed on store outages", async () => {
  assert.equal(
    (await handleEnquiry(request(), { config, store: null })).status,
    503,
  );
  const deps = dependencies();
  deps.store.allow = async () => {
    throw new Error("Store unavailable");
  };
  const { allowRequest, ...withoutOverride } = deps;
  assert.equal((await handleEnquiry(request(), withoutOverride)).status, 503);
});

test("replaying an accepted ID returns the durable result without sending mail twice", async () => {
  const deps = dependencies();
  let calls = 0;
  const fetch = (async () => {
    calls++;
    return Response.json({ id: `provider-${calls}` });
  }) as typeof globalThis.fetch;
  const first = await handleEnquiry(request(), { ...deps, fetch });
  const retry = await handleEnquiry(request(), { ...deps, fetch });
  assert.deepEqual(await first.json(), await retry.json());
  assert.equal(calls, 2);
  const conflict = await handleEnquiry(
    request({
      ...valid,
      description: "A genuinely different enquiry using the same ID.",
    }),
    { ...deps, fetch },
  );
  assert.equal(conflict.status, 409);
  assert.equal(calls, 2);
});

test("concurrent retries do not begin another business email", async () => {
  const deps = dependencies();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const firstStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  let calls = 0;
  const fetch = (async () => {
    calls++;
    started();
    await gate;
    return Response.json({ id: `provider-${calls}` });
  }) as typeof globalThis.fetch;
  const first = handleEnquiry(request(), { ...deps, fetch });
  await firstStarted;
  const second = await handleEnquiry(request(), { ...deps, fetch });
  assert.equal(second.status, 409);
  assert.equal(calls, 1);
  release();
  assert.equal((await first).status, 200);
});

test("metadata recording failure after provider acceptance never invites another enquiry", async () => {
  const deps = dependencies();
  deps.store.acceptOwner = async () => {
    throw new Error("Metadata temporarily unavailable");
  };
  const response = await handleEnquiry(request(), {
    ...deps,
    fetch: (async () =>
      Response.json({ id: "accepted-owner" })) as typeof globalThis.fetch,
  });
  assert.deepEqual(await response.json(), {
    delivered: true,
    reference: id,
    confirmationSent: false,
  });
});

test("a malformed provider acknowledgment cannot become a delivered enquiry", async () => {
  const response = await handleEnquiry(request(), {
    ...dependencies(),
    fetch: (async () =>
      Response.json({ id: { malformed: true } })) as typeof globalThis.fetch,
  });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).delivered, undefined);
});
