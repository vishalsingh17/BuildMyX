import assert from "node:assert/strict";
import { test } from "node:test";
import { syncDevelopment } from "./sync-dev.mjs";
const mainSha = "a".repeat(40),
  devSha = "b".repeat(40);
const config = {
  repository: "vishalsingh17/BuildMyX",
  token: "test-only",
  mainSha,
};
test("a released commit fast-forwards dev with force explicitly disabled", async () => {
  const requests = [];
  await syncDevelopment(config, async (url, init) => {
    requests.push({ url, ...init });
    return Response.json(
      init.method === "PATCH" || url.endsWith("/heads/main")
        ? { object: { sha: mainSha } }
        : url.includes("/compare/")
          ? { status: "ahead" }
          : { object: { sha: devSha } },
    );
  });
  assert.equal(requests.length, 4);
  assert.deepEqual(JSON.parse(requests[3].body), {
    sha: mainSha,
    force: false,
  });
});
test("newer development work and races are preserved", async () => {
  for (const status of ["behind", "diverged"]) {
    let writes = 0;
    const message = await syncDevelopment(config, async (url, init) => {
      if (init.method !== "GET") writes++;
      return Response.json(
        url.includes("/compare/")
          ? { status }
          : { object: { sha: url.endsWith("/heads/main") ? mainSha : devSha } },
      );
    });
    assert.equal(writes, 0);
    assert.match(message, /no commits were overwritten/);
  }
  let advanced = false;
  const result = await syncDevelopment(config, async (url, init) => {
    if (init.method === "PATCH") {
      advanced = true;
      return new Response("", { status: 422 });
    }
    return Response.json(
      url.includes("/compare/")
        ? { status: "ahead" }
        : {
            object: {
              sha: url.endsWith("/heads/main")
                ? mainSha
                : advanced
                  ? "c".repeat(40)
                  : devSha,
            },
          },
    );
  });
  assert.match(result, /advanced during synchronization/);
});
test("a preview or outdated deployment cannot synchronize development", async () => {
  let writes = 0;
  const result = await syncDevelopment(config, async (_url, init) => {
    if (init.method !== "GET") writes++;
    return Response.json({ object: { sha: "c".repeat(40) } });
  });
  assert.equal(writes, 0);
  assert.match(result, /not the current production commit/);
});

test("a rejected branch update cannot be reported as a successful synchronization", async () => {
  await assert.rejects(
    () =>
      syncDevelopment(config, async (url, init) =>
        init.method === "PATCH"
          ? new Response("", { status: 422 })
          : Response.json(
              url.includes("/compare/")
                ? { status: "ahead" }
                : {
                    object: {
                      sha: url.endsWith("/heads/main") ? mainSha : devSha,
                    },
                  },
            ),
      ),
    /rejected development synchronization/,
  );
});
