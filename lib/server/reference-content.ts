import { load } from "cheerio";
import sanitizeHtml from "sanitize-html";
import {
  DEVDOCS_DOCUMENTS_ORIGIN,
  safeExternalUrl,
  type ReferenceCollection,
} from "../reference-catalog";
import {
  entryHref,
  parseReferenceIndex,
  validReferencePath,
} from "../reference-paths";
type ReferenceLookup = (id: string) => ReferenceCollection | undefined;

export class ReferenceFetchError extends Error {
  constructor(
    public readonly kind: "missing" | "unavailable",
    message: string,
  ) {
    super(message);
  }
}

export interface ReferenceDocument {
  title: string;
  html: string;
  sourceUrl: string | null;
  sourceIsPage: boolean;
  outline: { id: string; title: string; level: number }[];
}

export async function fetchReferenceAsset(
  doc: ReferenceCollection,
  path: string,
  limit: number,
): Promise<string> {
  const url = `${DEVDOCS_DOCUMENTS_ORIGIN}/${doc.slug}/${path}?${doc.mtime}`;
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: path.endsWith(".json") ? "application/json" : "text/html",
      },
    });
  } catch {
    throw new ReferenceFetchError(
      "unavailable",
      "Documentation could not be reached.",
    );
  }
  if ([403, 404].includes(response.status)) {
    await response.body?.cancel();
    throw new ReferenceFetchError(
      "missing",
      "This documentation page was not found.",
    );
  }
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new ReferenceFetchError(
      "unavailable",
      "Documentation is temporarily unavailable.",
    );
  }
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body.cancel();
    throw new ReferenceFetchError(
      "unavailable",
      "This documentation resource is too large to display.",
    );
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Response limit exceeded.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } catch {
    throw new ReferenceFetchError(
      "unavailable",
      "Documentation could not be downloaded.",
    );
  } finally {
    reader.releaseLock();
  }
}

export async function loadReferenceIndex(doc: ReferenceCollection) {
  const raw = await fetchReferenceAsset(doc, "index.json", 32 * 1024 * 1024);
  try {
    return parseReferenceIndex(JSON.parse(raw));
  } catch {
    throw new ReferenceFetchError(
      "unavailable",
      "The reference index could not be read.",
    );
  }
}

function documentUrl(doc: ReferenceCollection, path: string) {
  const encoded = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${DEVDOCS_DOCUMENTS_ORIGIN}/${doc.slug}/${encoded}${path.endsWith(".html") ? "" : ".html"}`;
}

/** Only known local collections become reader links; external URLs keep their source. */
export function rewriteReferenceLink(
  href: string,
  doc: ReferenceCollection,
  page: string,
  lookup: ReferenceLookup = (id) =>
    id === doc.slug || id === doc.family ? doc : undefined,
): string | null {
  if (href.startsWith("#")) return `#ref-${href.slice(1)}`;
  if (/^mailto:/i.test(href)) return href;
  let url: URL;
  try {
    url = new URL(href, documentUrl(doc, page));
  } catch {
    return null;
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    return null;
  if (
    url.hostname === "devdocs.io" ||
    url.origin === DEVDOCS_DOCUMENTS_ORIGIN
  ) {
    const [, slug, ...parts] = url.pathname.split("/");
    const target = lookup(slug);
    const path = parts
      .join("/")
      .replace(/\.html$/, "")
      .replace(/\/$/, "");
    if (
      target &&
      validReferencePath(path) &&
      !/\.(?:png|jpe?g|gif|svg|webp|pdf|zip|json|txt|css|js|woff2?)$/i.test(
        path,
      )
    )
      return entryHref(target, path + url.hash);
  }
  return safeExternalUrl(url.href);
}

const mathTags = [
  "math",
  "mrow",
  "mi",
  "mn",
  "mo",
  "ms",
  "mtext",
  "mspace",
  "msup",
  "msub",
  "msubsup",
  "mfrac",
  "msqrt",
  "mroot",
  "munder",
  "mover",
  "munderover",
  "mtable",
  "mtr",
  "mtd",
  "mlabeledtr",
  "mfenced",
  "menclose",
  "mstyle",
  "mpadded",
  "mphantom",
  "semantics",
  "annotation",
];
const allowedTags = [
  ...new Set([
    ...sanitizeHtml.defaults.allowedTags,
    ...mathTags,
    "img",
    "figure",
    "figcaption",
    "details",
    "summary",
    "kbd",
    "samp",
    "var",
    "mark",
    "small",
    "sub",
    "sup",
    "span",
    "wbr",
  ]),
];

export function sanitizeReferenceHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      "*": [
        "id",
        "class",
        "title",
        "lang",
        "dir",
        "aria-label",
        "aria-hidden",
        "role",
      ],
      a: ["href", "name", "target", "rel", "title"],
      img: [
        "src",
        "alt",
        "width",
        "height",
        "loading",
        "decoding",
        "referrerpolicy",
      ],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      ol: ["start", "reversed", "type"],
      li: ["value"],
      details: ["open"],
      time: ["datetime"],
      ...Object.fromEntries(
        mathTags.map((tag) => [
          tag,
          [
            "id",
            "class",
            "display",
            "mathvariant",
            "mathsize",
            "stretchy",
            "fence",
            "separator",
            "accent",
            "accentunder",
            "columnalign",
            "rowalign",
            "columnspan",
            "rowspan",
            "notation",
            "encoding",
          ],
        ]),
      ),
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: false,
  });
}

export function renderReferenceDocument(
  html: string,
  doc: ReferenceCollection,
  page: string,
  lookup?: ReferenceLookup,
): ReferenceDocument {
  const $ = load(html, {}, false);
  $(
    "script, style, noscript, iframe, object, embed, form, input, button, select, textarea, link, meta, base",
  ).remove();
  const titleElement = $("h1").first();
  const title =
    titleElement.text().replace(/\s+/g, " ").trim() ||
    page.split("/").at(-1) ||
    doc.name;
  const sourceCandidates = $("._attribution a[href]")
    .toArray()
    .map((node) => safeExternalUrl($(node).attr("href")))
    .filter((url): url is string => !!url);
  const sourceUrl = sourceCandidates.at(-1) || safeExternalUrl(doc.links?.home);
  $("[id]").each((_, node) => {
    $(node).attr("id", `ref-${$(node).attr("id")}`);
  });
  $("a[name]").each((_, node) => {
    $(node)
      .attr("id", `ref-${$(node).attr("name")}`)
      .removeAttr("name");
  });
  // The reader owns the page h1 and global IDs. Preserve the source anchor.
  if (titleElement.length)
    titleElement.replaceWith(
      $("<span>").attr("id", titleElement.attr("id") || "ref-document-title"),
    );
  $("h1").each((_, node) => {
    const el = $(node);
    el.replaceWith(
      $("<h2>")
        .attr("id", el.attr("id") || "")
        .html(el.html() || ""),
    );
  });
  $("a[href]").each((_, node) => {
    const link = $(node),
      href = rewriteReferenceLink(link.attr("href") || "", doc, page, lookup);
    if (!href) link.removeAttr("href");
    else {
      link.attr("href", href);
      if (/^https?:/i.test(href))
        link.attr("target", "_blank").attr("rel", "noopener noreferrer");
      else link.removeAttr("target").removeAttr("rel");
    }
  });
  $("img").each((_, node) => {
    const image = $(node);
    let source: string | null = null;
    try {
      source = safeExternalUrl(
        new URL(image.attr("src") || "", documentUrl(doc, page)).href,
      );
    } catch {
      /* Removed below. */
    }
    if (!source) image.remove();
    else
      image
        .attr("src", source)
        .attr("loading", "lazy")
        .attr("decoding", "async")
        .attr("referrerpolicy", "no-referrer")
        .attr("alt", image.attr("alt") || "Documentation illustration");
  });
  const outline: ReferenceDocument["outline"] = [];
  $("h2, h3").each((i, node) => {
    const element = $(node),
      title = element.text().replace(/\s+/g, " ").trim();
    const id = element.attr("id") || `ref-section-${i + 1}`;
    element.attr("id", id);
    if (title)
      outline.push({ id, title, level: node.tagName === "h3" ? 3 : 2 });
  });
  if (!$("._attribution").length) {
    const footer = $("<div>").addClass("_attribution");
    if (doc.attribution) footer.html(doc.attribution);
    if (sourceUrl)
      footer.append(
        $("<p>").append(
          $("<a>")
            .attr("href", sourceUrl)
            .attr("target", "_blank")
            .attr("rel", "noopener noreferrer")
            .text("Original documentation"),
        ),
      );
    $.root().append(footer);
  }
  return {
    title,
    html: sanitizeReferenceHtml($.html()),
    sourceUrl,
    sourceIsPage: sourceCandidates.length > 0,
    outline,
  };
}

export async function loadReferenceDocument(
  doc: ReferenceCollection,
  path: string,
  lookup?: ReferenceLookup,
): Promise<ReferenceDocument> {
  if (!validReferencePath(path) || path.includes("#"))
    throw new ReferenceFetchError("missing", "Invalid documentation path.");
  let raw: string;
  try {
    raw = await fetchReferenceAsset(
      doc,
      documentUrl(doc, path).split(`/${doc.slug}/`)[1],
      16 * 1024 * 1024,
    );
  } catch (error) {
    // A few old collections have missing individual CDN files. The official
    // DevDocs offline database can still contain those pages. Never proxy an
    // arbitrary upstream URL, and bound this exceptional download.
    if (
      !(error instanceof ReferenceFetchError) ||
      error.kind !== "missing" ||
      doc.db_size > 64 * 1024 * 1024
    )
      throw error;
    if (path !== "index") {
      const index = await loadReferenceIndex(doc);
      const known = index.entries.some(
        (entry) => entry.path.split("#")[0] === path,
      );
      if (!known) throw error;
    }
    const database = JSON.parse(
      await fetchReferenceAsset(doc, "db.json", 64 * 1024 * 1024),
    );
    const key = Object.hasOwn(database, path)
      ? path
      : path.replace(/\.html$/, "");
    if (!Object.hasOwn(database, key) || typeof database[key] !== "string")
      throw error;
    raw = database[key];
  }
  if (!raw.trim() || !/<[a-z][\s\S]*>/i.test(raw))
    throw new ReferenceFetchError(
      "unavailable",
      "The source did not return a documentation page.",
    );
  return renderReferenceDocument(raw, doc, path, lookup);
}
