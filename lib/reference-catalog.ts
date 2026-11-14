/** DevDocs metadata only. Documentation keeps each upstream project's license. */
export interface DevDocsCollection {
  name: string;
  slug: string;
  type: string;
  version?: string | null;
  release?: string | null;
  mtime: number;
  db_size: number;
  attribution?: string | null;
  alias?: string | null;
  links?: { home?: string; code?: string };
}

export interface ReferenceCollection extends DevDocsCollection {
  family: string;
  edition: string;
  preview: boolean;
  entryCount: number;
  pageCount: number;
}

export interface ReferenceFamily {
  id: string;
  name: string;
  category: string;
  primary: string;
  collections: ReferenceCollection[];
}

export interface ReferenceCatalog {
  schemaVersion: 1;
  syncedAt: string;
  source: string;
  upstreamCollectionCount: number;
  families: ReferenceFamily[];
}

export const REFERENCE_ROOT = "/learn/references/";
export const DEVDOCS_CATALOG_URL = "https://devdocs.io/docs.json";
export const DEVDOCS_DOCUMENTS_ORIGIN = "https://documents.devdocs.io";

export const referenceCategories = [
  "Languages",
  "Web platform",
  "Frontend",
  "Backend",
  "Data & AI",
  "Databases",
  "Infrastructure",
  "Tools & testing",
  "Other libraries",
] as const;

const categoryGroups: Record<string, string> = {};
for (const [category, names] of [
  [
    "Languages",
    "bash c cpp clojure coffeescript crystal d dart elisp elixir erlang fish gcc gnu_fortran gnu_cobol go groovy haskell haxe javascript julia kotlin lua nim nushell ocaml octave odin openjdk perl php pony powershell python r ruby rust scala tcl_tk typescript zig zsh",
  ],
  [
    "Web platform",
    "browser_support_tables css dom html http svg web_extensions xslt_xpath",
  ],
  [
    "Frontend",
    "angular angularjs astro backbone bootstrap cyclejs d3 dojo ember htmx jquery jquerymobile jqueryui knockout leaflet less lit maplibre_gl marionette meteor nextjs openlayers phaser react react_bootstrap react_native react_router redux relay sass socketio svelte tailwindcss tanstack_query tanstack_router threejs vue vue_router vueuse vuex webpack",
  ],
  [
    "Backend",
    "apache_http_server bottle cakephp celery codeigniter django django_rest_framework express falcon fastapi flask hapi jinja koa laravel nginx nginx_lua_module padrino phalcon phoenix rails spring_boot symfony twig vertx wagtail werkzeug wordpress",
  ],
  [
    "Data & AI",
    "apache_pig eigen3 matplotlib numpy pandas point_cloud_library polars pytorch scikit_image scikit_learn statsmodels tensorflow tensorflow_cpp",
  ],
  [
    "Databases",
    "couchdb duckdb influxdata mariadb mongoose opentsdb postgresql redis rethinkdb sequelize sqlite",
  ],
  [
    "Infrastructure",
    "ansible chef docker graphite haproxy kubectl kubernetes nix opentofu rabbitmq saltstack terraform vagrant varnish",
  ],
  [
    "Tools & testing",
    "babel bazel bower bun chai cmake codeception codeceptjs composer cordova cypress deno electron enzyme esbuild eslint git gnu_make grunt homebrew i3 jasmine jest jsdoc jq markdown mocha modernizr npm phpunit playwright prettier puppeteer pytest qunit sinon vite vitest yarn",
  ],
] as const)
  for (const name of names.split(" ")) categoryGroups[name] = category;

export function familyId(slug: string) {
  return slug.split("~", 1)[0];
}

/** Keep language/platform/channel editions, rather than dropping e.g. GCC C++. */
export function editionId(doc: DevDocsCollection): string {
  return (
    (doc.slug.split("~")[1] || "").replace(/^\d+(?:\.\d+)*(?:[_-])?/, "") ||
    "default"
  );
}

export function isPreview(doc: DevDocsCollection): boolean {
  return /(?:alpha|beta|preview|nightly|canary|experimental|master|\bdev\b|(?:\d|[.-])rc\d*)/i.test(
    `${doc.release || ""} ${doc.version || ""}`,
  );
}

function versionParts(doc: DevDocsCollection): number[] {
  const match = (
    doc.release ||
    doc.version ||
    doc.slug.split("~")[1] ||
    ""
  ).match(/^v?(\d+(?:\.\d+)*)/);
  return match ? match[1].split(".").map(Number) : [];
}

/** Semantically newer releases win, even if an older branch was patched later. */
export function compareReleases(
  a: DevDocsCollection,
  b: DevDocsCollection,
): number {
  // The unversioned rolling collection is the maintainer's current edition.
  const rolling = (d: DevDocsCollection) =>
    !d.release && !d.version && !d.slug.includes("~");
  if (rolling(a) !== rolling(b)) return rolling(a) ? 1 : -1;
  const av = versionParts(a),
    bv = versionParts(b);
  for (let i = 0; i < Math.max(av.length, bv.length); i++) {
    const difference = (av[i] || 0) - (bv[i] || 0);
    if (difference) return difference;
  }
  if (isPreview(a) !== isPreview(b)) return isPreview(a) ? -1 : 1;
  return (
    a.mtime - b.mtime ||
    Number(!a.slug.includes("~")) - Number(!b.slug.includes("~"))
  );
}

export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function validateUpstreamCatalog(value: unknown): DevDocsCollection[] {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error("Empty DevDocs catalog.");
  for (const item of value) {
    if (
      !item ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      typeof item.slug !== "string" ||
      !/^[a-z0-9_]+(?:~[a-z0-9_.-]+)?$/.test(item.slug) ||
      (item.type != null && typeof item.type !== "string") ||
      !Number.isSafeInteger(item.mtime) ||
      item.mtime <= 0 ||
      typeof item.db_size !== "number" ||
      item.db_size < 0 ||
      (item.release != null && typeof item.release !== "string") ||
      (item.version != null && typeof item.version !== "string") ||
      (item.attribution != null && typeof item.attribution !== "string")
    ) {
      throw new Error(
        "Unexpected DevDocs catalog shape; the previous snapshot was retained.",
      );
    }
  }
  return (value as DevDocsCollection[]).map((item) => ({
    ...item,
    type: item.type || familyId(item.slug),
    links: Object.fromEntries(
      Object.entries(item.links || {}).filter(
        ([key, url]) => ["home", "code"].includes(key) && safeExternalUrl(url),
      ),
    ),
  }));
}

export function selectLatestFamilies(
  docs: DevDocsCollection[],
): ReferenceFamily[] {
  const groups = new Map<string, Map<string, DevDocsCollection[]>>();
  for (const doc of docs) {
    const family = familyId(doc.slug),
      edition = editionId(doc);
    if (!groups.has(family)) groups.set(family, new Map());
    const editions = groups.get(family)!;
    if (!editions.has(edition)) editions.set(edition, []);
    editions.get(edition)!.push(doc);
  }
  return [...groups]
    .map(([id, editions]) => {
      const selected: ReferenceCollection[] = [];
      for (const [edition, candidates] of editions) {
        const ranked = [...candidates].sort((a, b) => compareReleases(b, a));
        const stable = ranked.find((doc) => !isPreview(doc));
        const latest = ranked[0];
        const add = (doc: DevDocsCollection) => {
          if (!selected.some((s) => s.slug === doc.slug))
            selected.push({
              ...doc,
              family: id,
              edition,
              preview: isPreview(doc),
              entryCount: 0,
              pageCount: 0,
            });
        };
        if (stable) add(stable);
        if (
          !stable ||
          (isPreview(latest) && compareReleases(latest, stable) > 0)
        )
          add(latest);
      }
      const primary =
        selected.find((d) => d.edition === "default" && !d.preview) ||
        selected.find((d) => d.edition === "default") ||
        selected[0];
      return {
        id,
        name: primary.name,
        category: categoryGroups[id] || "Other libraries",
        primary: primary.slug,
        collections: [primary, ...selected.filter((d) => d !== primary)],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function versionLabel(doc: DevDocsCollection): string {
  return doc.release || doc.version || "Rolling reference";
}

export function editionLabel(doc: ReferenceCollection): string {
  if (doc.edition === "default")
    return doc.preview ? "Preview" : "Main reference";
  return doc.version?.replace(/^\d+(?:\.\d+)*\s*/, "").trim() || doc.edition;
}

export function collectionHref(doc: ReferenceCollection): string {
  // Stable family addresses keep course links working when a version advances.
  const id = doc.edition === "default" && !doc.preview ? doc.family : doc.slug;
  // Match Next's canonical URLs: file-like final segments omit the slash.
  return `${REFERENCE_ROOT}${id}${id.includes(".") ? "" : "/"}`;
}

export function referenceDate(mtime: number): string {
  return new Date(mtime * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
