import assert from "node:assert/strict";
import { test } from "node:test";
import {
  renderReferenceDocument,
  rewriteReferenceLink,
  loadReferenceDocument,
  fetchReferenceAsset,
  ReferenceFetchError,
} from "./reference-content";
import { selectLatestFamilies } from "../reference-catalog";

const doc = selectLatestFamilies([
  {
    name: "pandas",
    slug: "pandas~3",
    type: "pandas",
    release: "3.0.8",
    mtime: 100,
    db_size: 10000,
    attribution: "Copyright pandas contributors. BSD 3-clause.",
    links: { home: "https://pandas.pydata.org/" },
  },
])[0].collections[0];

test("reader preserves code, math, source notices and anchors while removing executable markup", () => {
  const source = `<h1 id="groupby">DataFrame.groupby</h1><h2 id="examples">Examples</h2><pre><code>frame.groupby("city").sum()</code></pre>
    <math><mfrac><mi>a</mi><mi>b</mi></mfrac></math><a href="pandas.dataframe.sum#sum">Sum</a>
    <a href="#examples">Jump</a><img src="../../_images/chart.png" onerror="alert(1)" />
    <script>alert(1)</script><style>body{display:none}</style><iframe src="https://evil.example"></iframe>
    <a href="javascript:alert(1)" onclick="alert(1)">Unsafe</a><input autofocus onfocus="alert(1)">
    <div class="_attribution">Copyright pandas contributors. BSD 3-clause.<a href="https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.groupby.html">Source</a></div>`;
  const rendered = renderReferenceDocument(
    source,
    doc,
    "reference/api/pandas.dataframe.groupby",
  );
  assert.equal(rendered.title, "DataFrame.groupby");
  assert.deepEqual(rendered.outline, [
    { id: "ref-examples", title: "Examples", level: 2 },
  ]);
  assert.ok(rendered.html.includes('id="ref-groupby"'));
  assert.ok(rendered.html.includes('href="#ref-examples"'));
  assert.ok(
    rendered.html.includes(
      "/learn/references/pandas/reference/api/pandas.dataframe.sum#ref-sum",
    ),
  );
  assert.ok(rendered.html.includes("<math><mfrac>"));
  assert.ok(
    rendered.html.includes("Copyright pandas contributors. BSD 3-clause."),
  );
  assert.ok(rendered.html.includes('rel="noopener noreferrer"'));
  assert.ok(rendered.html.includes('referrerpolicy="no-referrer"'));
  assert.ok(
    !/<(?:script|style|iframe|input)\b|onerror|onclick|javascript:/i.test(
      rendered.html,
    ),
  );
  assert.equal(rendered.sourceIsPage, true);
});

test("source fallback uses the collection's notices when a page has no footer", () => {
  const rendered = renderReferenceDocument(
    "<h1>Sample</h1><p>Content</p>",
    doc,
    "index",
  );
  assert.ok(
    rendered.html.includes("Copyright pandas contributors. BSD 3-clause."),
  );
  assert.equal(rendered.sourceUrl, "https://pandas.pydata.org/");
  assert.equal(rendered.sourceIsPage, false);
});

test("link rewriting confines reader routes to known collections and rejects unsafe schemes", () => {
  assert.equal(
    rewriteReferenceLink(
      "../groupby#splitting",
      doc,
      "reference/api/dataframe",
    ),
    "/learn/references/pandas/reference/groupby/#ref-splitting",
  );
  assert.equal(
    rewriteReferenceLink("https://pandas.pydata.org/docs/", doc, "index"),
    "https://pandas.pydata.org/docs/",
  );
  assert.equal(rewriteReferenceLink("javascript:alert(1)", doc, "index"), null);
  assert.equal(
    rewriteReferenceLink("https://user:password@example.com/", doc, "index"),
    null,
  );
});

test("loader correctly fetches encoded filenames and does not append a second HTML extension", async (context) => {
  const urls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string) => {
    urls.push(url);
    return new Response("<h1>GDScript</h1><p>Example</p>");
  });
  await loadReferenceDocument(
    { ...doc, slug: "godot~4.7" },
    "classes/class_%40gdscript",
  );
  assert.equal(
    urls[0],
    "https://documents.devdocs.io/godot~4.7/classes/class_%2540gdscript.html?100",
  );
  await loadReferenceDocument(doc, "page.html");
  assert.equal(urls[1], "https://documents.devdocs.io/pandas~3/page.html?100");
  await assert.rejects(
    () => loadReferenceDocument(doc, "../secret"),
    ReferenceFetchError,
  );
  assert.equal(urls.length, 2);
});

test("a missing CDN page uses the bounded official offline database and still sanitizes its content", async (context) => {
  const urls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string) => {
    urls.push(url);
    if (url.includes("/index.json?"))
      return Response.json({
        entries: [{ name: "Missing", path: "missing", type: "General" }],
        types: [],
      });
    return url.includes("/db.json?")
      ? Response.json({
          missing: "<h1>Recovered</h1><script>bad()</script><p>Saved page.</p>",
        })
      : new Response("Missing", { status: 403 });
  });
  const result = await loadReferenceDocument(doc, "missing");
  assert.equal(result.title, "Recovered");
  assert.ok(result.html.includes("Saved page."));
  assert.ok(!result.html.includes("<script"));
  assert.equal(urls.length, 3);
  assert.ok(
    urls[2].startsWith("https://documents.devdocs.io/pandas~3/db.json?"),
  );
});

test("downloads enforce limits and do not follow redirects; large offline packages are not fetched as fallbacks", async (context) => {
  let calls = 0;
  context.mock.method(
    globalThis,
    "fetch",
    async (_url: string, options: RequestInit) => {
      calls++;
      assert.equal(options.redirect, "error");
      return new Response("x".repeat(500), {
        headers: { "content-length": "500" },
      });
    },
  );
  await assert.rejects(
    () => fetchReferenceAsset(doc, "index.json", 100),
    ReferenceFetchError,
  );
  context.mock.method(globalThis, "fetch", async () => {
    calls++;
    return new Response("Missing", { status: 404 });
  });
  await assert.rejects(
    () =>
      loadReferenceDocument({ ...doc, db_size: 100 * 1024 * 1024 }, "missing"),
    ReferenceFetchError,
  );
  assert.equal(calls, 2);
});

test("unknown paths cannot trigger a large offline-database download", async (context) => {
  const urls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string) => {
    urls.push(url);
    if (url.includes("/index.json?"))
      return Response.json({
        entries: [{ name: "Known", path: "known", type: "General" }],
        types: [],
      });
    return new Response("Missing", { status: 404 });
  });
  await assert.rejects(
    () => loadReferenceDocument(doc, "random-unknown-path"),
    ReferenceFetchError,
  );
  assert.equal(urls.length, 2);
  assert.ok(!urls.some((url) => url.includes("/db.json?")));
});

test("legacy decoded filenames recover only through an exact published source alias", async (context) => {
  const urls: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: string) => {
    urls.push(url);
    if (url.includes("/index.json?"))
      return Response.json({
        entries: [
          {
            name: "GDScript",
            path: "classes/class_%40gdscript",
            type: "General",
          },
        ],
        types: [],
      });
    if (url.includes("class_%2540gdscript"))
      return new Response(
        "<h1>GDScript</h1><p>Recovered encoded filename.</p>",
      );
    return new Response("Missing", { status: 403 });
  });
  const result = await loadReferenceDocument(doc, "classes/class_@gdscript");
  assert.equal(result.title, "GDScript");
  assert.equal(urls.length, 3);
  assert.ok(!urls.some((url) => url.includes("/db.json?")));
});
