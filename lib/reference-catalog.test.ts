import assert from "node:assert/strict";
import { test } from "node:test";
import snapshot from "../data/references/catalog.json";
import {
  collectionHref,
  compareReleases,
  editionId,
  selectLatestFamilies,
  validateUpstreamCatalog,
  type DevDocsCollection,
} from "./reference-catalog";
import {
  entryHref,
  referencePathFromRoute,
  parseReferenceIndex,
  searchReferenceEntries,
  validReferencePath,
} from "./reference-paths";

const make = (
  slug: string,
  release: string | null,
  mtime = 100,
): DevDocsCollection => ({
  name: slug.split("~")[0],
  slug,
  type: "test",
  release,
  mtime,
  db_size: 100,
});

test("latest selection compares versions numerically, independently of update dates and source order", () => {
  const families = selectLatestFamilies([
    make("python~3.9", "3.9.99", 900),
    make("python~3.15", "3.15.0", 100),
    make("python~3.12", "3.12.9", 950),
  ]);
  assert.equal(families[0].primary, "python~3.15");
  assert.equal(families[0].collections.length, 1);
  assert.ok(
    compareReleases(make("python~3.10", "3.10"), make("python~3.9", "3.9")) > 0,
  );
});

test("every family and parallel edition survives selection; stable and newer preview editions both remain accessible", () => {
  const docs = [
    make("gcc~16", "16.2.0"),
    make("gcc~15_cpp", "15.3.0"),
    make("gcc~16_cpp", "16.2.0"),
    make("haxe", "4.1.3"),
    make("haxe~python", "4.1.3"),
    make("haxe~javascript", "4.1.3"),
    make("bootstrap~6", "6.0.0-alpha.1"),
    make("bootstrap~5", "5.3"),
    make("rust", "1.98.0"),
  ];
  const families = selectLatestFamilies(docs);
  assert.equal(
    families.length,
    new Set(docs.map((d) => d.slug.split("~")[0])).size,
  );
  assert.deepEqual(
    families.find((f) => f.id === "gcc")!.collections.map((d) => d.slug),
    ["gcc~16", "gcc~16_cpp"],
  );
  assert.equal(families.find((f) => f.id === "haxe")!.collections.length, 3);
  const bootstrap = families.find((f) => f.id === "bootstrap")!;
  assert.equal(bootstrap.primary, "bootstrap~5");
  assert.equal(
    bootstrap.collections.find((d) => d.slug === "bootstrap~6")!.preview,
    true,
  );
  assert.equal(editionId(make("node~24_lts", "24.14.0")), "lts");
});

test("rolling unversioned collections and duplicate source slugs do not select an old release", () => {
  const families = selectLatestFamilies([
    make("ansible~2.11", "2.11"),
    make("ansible", null),
    make("bun", "1.3.12"),
    make("bun", "1.4.0"),
  ]);
  assert.equal(families.find((f) => f.id === "ansible")!.primary, "ansible");
  assert.equal(families.find((f) => f.id === "bun")!.collections.length, 1);
  assert.equal(
    families.find((f) => f.id === "bun")!.collections[0].release,
    "1.4.0",
  );
});

test("unsafe source links are omitted without losing a documentation family; malformed catalog input fails", () => {
  const docs = validateUpstreamCatalog([
    {
      ...make("axios", "1.15.0"),
      type: null,
      links: {
        home: "hthttps://invalid",
        code: "https://github.com/axios/axios",
      },
    },
  ]);
  assert.deepEqual(docs[0].links, { code: "https://github.com/axios/axios" });
  assert.equal(docs[0].type, "axios");
  assert.throws(() =>
    validateUpstreamCatalog([{ ...make("bad/slug", "1.0") }]),
  );
  assert.throws(() => validateUpstreamCatalog([]));
});

test("fragment-only source entries resolve their parent or category page; external source entries are preserved", () => {
  const source = {
    entries: [
      { name: "LazyList", path: "scala/lazylist", type: "scala" },
      { name: "LazyList.#::()", path: "#::-ffff", type: "scala" },
      { name: "hsv", path: "d3-hsv", type: "HSV" },
      { name: "d3.interpolateHsv()", path: "#interpolateHsv", type: "HSV" },
      {
        name: "AbstractMetadata",
        path: "https://pointclouds.org/documentation/class_abstract_metadata.html#",
        type: "pcl",
      },
    ],
    types: [],
  };
  const { entries } = parseReferenceIndex(source);
  assert.equal(entries.length, source.entries.length);
  assert.equal(entries[1].path, "scala/lazylist#::-ffff");
  assert.equal(entries[3].path, "d3-hsv#interpolateHsv");
  const doc = selectLatestFamilies([make("test~2", "2")])[0].collections[0];
  assert.equal(entryHref(doc, entries[4].path), source.entries[4].path);
});

test("local reader URLs preserve literal encoded filenames and safe section anchors", () => {
  const doc = selectLatestFamilies([make("godot~4.7", "4.7")])[0]
    .collections[0];
  assert.equal(collectionHref(doc), "/learn/references/godot/");
  assert.equal(
    entryHref(doc, "classes/class_%40gdscript#annotation"),
    "/learn/references/godot/classes/class_~2540gdscript/#ref-annotation",
  );
  assert.equal(
    entryHref(doc, "index#hello%20world"),
    "/learn/references/godot/index/#ref-hello%20world",
  );
  for (const value of [
    "../secret",
    "%2e%2e/secret",
    "/absolute",
    "a\\b",
    "a/%2Fsecret",
    "a?url=evil",
    "a//b",
    "a/%00",
    "https://evil.example/x",
  ])
    assert.equal(validReferencePath(value), false, value);
  assert.equal(validReferencePath("scala/$hash$colon$colon$$#apply"), true);
});

test("topic search ranks exact API names, searches categories and supports full pagination without dropping entries", () => {
  const entries = Array.from({ length: 125 }, (_, i) => ({
    name: `item${i}`,
    path: `page${i}`,
    type: i % 2 ? "Tables" : "Groups",
  }));
  assert.equal(
    searchReferenceEntries(entries, "item12").entries[0].name,
    "item12",
  );
  assert.equal(searchReferenceEntries(entries, "groups").total, 63);
  assert.equal(searchReferenceEntries(entries, "", "Tables").total, 62);
  assert.equal(searchReferenceEntries(entries, "", "", 80).entries.length, 80);
  assert.equal(
    searchReferenceEntries(entries, "", "", 160).entries.length,
    125,
  );
});

test("the reviewed snapshot exposes every catalog collection through one unique reader address", () => {
  assert.equal(snapshot.schemaVersion, 1);
  assert.ok(snapshot.families.length >= 247);
  assert.equal(
    new Set(snapshot.families.map((f) => f.id)).size,
    snapshot.families.length,
  );
  const families =
    snapshot.families as import("./reference-catalog").ReferenceFamily[];
  const collections = families.flatMap((f) => f.collections);
  assert.equal(
    new Set(collections.map((d) => d.slug)).size,
    collections.length,
  );
  assert.equal(
    new Set(families.flatMap((f) => f.collections.map(collectionHref))).size,
    collections.length,
  );
  for (const family of families) {
    assert.ok(family.collections.some((d) => d.slug === family.primary));
    for (const doc of family.collections) {
      assert.equal(doc.family, family.id);
      assert.ok(
        doc.entryCount > 0 &&
          doc.pageCount > 0 &&
          doc.pageCount <= doc.entryCount,
      );
    }
  }
});

test("reference addresses match Next canonical URLs for dotted API names and edition slugs", () => {
  const doc = selectLatestFamilies([make("pandas~3", "3.0.8")])[0]
    .collections[0];
  assert.equal(
    entryHref(doc, "reference/api/pandas.dataframe.groupby#parameters"),
    "/learn/references/pandas/reference/api/pandas.dataframe.groupby#ref-parameters",
  );
  const preview = selectLatestFamilies([make("leaflet~2.0", "2.0.0-alpha1")])[0]
    .collections[0];
  assert.equal(collectionHref(preview), "/learn/references/leaflet~2.0");
  assert.equal(
    entryHref(preview, "index"),
    "/learn/references/leaflet~2.0/index/",
  );
});

test("catch-all parameters decode one URL layer without losing literal source escapes or allowing traversal", () => {
  assert.equal(
    referencePathFromRoute(["classes", "class_%2540gdscript"]),
    "classes/class_%40gdscript",
  );
  assert.equal(
    referencePathFromRoute(["scala", "%24hash%24colon"]),
    "scala/$hash$colon",
  );
  assert.equal(referencePathFromRoute(undefined), null);
  for (const segments of [
    ["%2e%2e", "secret"],
    ["%252e%252e", "secret"],
    ["a%2fb"],
    ["bad%xx"],
  ])
    assert.equal(referencePathFromRoute(segments), undefined);
});

test("source filenames survive both local and hosting-adapter URL decoding", () => {
  const doc = selectLatestFamilies([make("godot~4.7", "4.7")])[0]
    .collections[0];
  for (const file of [
    "class_%40gdscript",
    "literal%25name",
    "has~25text",
    "café",
    "$builder",
    "plain.file",
  ]) {
    const source = `classes/${file}`;
    const url = new URL(entryHref(doc, source), "https://buildmyx.example");
    const segments = url.pathname
      .slice(collectionHref(doc).length)
      .replace(/\/$/, "")
      .split("/");
    assert.equal(referencePathFromRoute(segments), source, `local ${file}`);
    assert.equal(
      referencePathFromRoute(
        segments.map((segment) => decodeURIComponent(segment)),
      ),
      source,
      `hosted ${file}`,
    );
  }
});
