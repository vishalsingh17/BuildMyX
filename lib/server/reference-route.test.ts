import assert from "node:assert/strict";
import { test } from "node:test";
import { referenceJsonResponse } from "./reference-json";
import { GET } from "../../app/api/references/[collection]/[resource]/route";
import { findReference } from "../references";

const doc = findReference("pandas")!;
function request(resource: string, query = "", collection = "pandas") {
  return GET(
    new Request(
      `https://buildmyx.example/api/references/${collection}/${resource}/${query ? `?${query}` : ""}`,
    ),
    {
      params: Promise.resolve({ collection, resource }),
    },
  );
}

test("public reference routes reject unknown collections, paths, revisions and proxy parameters before fetching", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls++;
    throw new Error("Must not fetch.");
  });
  assert.equal((await request("index", "", "unknown-collection")).status, 404);
  assert.equal((await request("admin")).status, 404);
  assert.equal((await request("page", "path=..%2Fsecret")).status, 400);
  assert.equal(
    (await request("page", "path=https%3A%2F%2Fevil.example")).status,
    400,
  );
  assert.equal((await request("page", "path=index&path=other")).status, 400);
  assert.equal(
    (await request("index", "url=https%3A%2F%2Fevil.example")).status,
    400,
  );
  assert.equal((await request("index", "v=old")).status, 409);
  assert.equal(calls, 0);
});

test("reference endpoints deliver validated indexes and sanitized pages, with public caching and source notices", async (context) => {
  const urls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string) => {
    urls.push(url);
    return url.includes("/index.json?")
      ? Response.json({
          entries: [
            { name: "DataFrame", path: "reference/dataframe", type: "Tables" },
          ],
          types: [],
        })
      : new Response(
          '<h1>DataFrame</h1><h2 id="example">Example</h2><script>unsafe()</script><p>Read this.</p>',
        );
  });
  const index = await request("index", `v=${doc.mtime}`);
  assert.equal(index.status, 200);
  assert.equal((await index.json()).entries.length, 1);
  const page = await request(
    "page",
    `path=reference%2Fdataframe&v=${doc.mtime}`,
  );
  assert.equal(page.status, 200);
  assert.ok(page.headers.get("Cache-Control")?.includes("s-maxage=86400"));
  assert.equal(page.headers.get("X-Content-Type-Options"), "nosniff");
  const data = await page.json();
  assert.equal(data.title, "DataFrame");
  assert.ok(data.html.includes('id="ref-example"'));
  assert.ok(data.html.includes("_attribution"));
  assert.ok(!data.html.includes("<script"));
  assert.ok(
    urls.every((url) =>
      url.startsWith(`https://documents.devdocs.io/${doc.slug}/`),
    ),
  );
});

test("upstream outages return a retryable uncached response without leaking internal errors", async (context) => {
  context.mock.method(globalThis, "fetch", async () => {
    throw new Error("Internal details should not escape.");
  });
  const response = await request("page", "path=index");
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.ok(!(await response.text()).includes("Internal details"));
});

test("large Unicode indexes stream in bounded chunks without a content-length ceiling", async () => {
  const value = { topic: "Examples 😃 ".repeat(500000) };
  const response = referenceJsonResponse(value);
  assert.equal(
    response.headers.get("Content-Type"),
    "application/json; charset=utf-8",
  );
  assert.equal(response.headers.get("Content-Length"), null);
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    assert.ok(chunk.byteLength <= 32768);
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  assert.ok(bytes.length > 4.5 * 1024 * 1024);
  assert.deepEqual(JSON.parse(bytes.toString("utf8")), value);
});
