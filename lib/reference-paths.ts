import {
  collectionHref,
  safeExternalUrl,
  type ReferenceCollection,
} from "./reference-catalog";

export interface ReferenceEntry {
  name: string;
  path: string;
  type: string;
}
export interface ReferenceIndex {
  entries: ReferenceEntry[];
  types: { name: string; count: number; slug: string }[];
}

export function validReferencePath(value: string): boolean {
  if (!value || value.length > 1800) return false;
  const path = value.split("#", 1)[0];
  if (!path || path.startsWith("/") || path.endsWith("/")) return false;
  return path.split("/").every((segment) => {
    try {
      const decoded = decodeURIComponent(segment);
      return (
        decoded !== "." &&
        decoded !== ".." &&
        !!decoded &&
        !/[\\/\u0000-\u001f\u007f?#]/.test(decoded)
      );
    } catch {
      return false;
    }
  });
}

/** Catch-all route parameters retain URL escapes in Next. Decode exactly once. */
export function referencePathFromRoute(
  segments?: string[],
): string | null | undefined {
  if (!segments?.length) return null;
  try {
    const decoded = segments.map((segment) => decodeURIComponent(segment));
    if (decoded.some((segment) => !segment || /[\\/]/.test(segment)))
      return undefined;
    const path = decoded.join("/");
    return validReferencePath(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

export function parseReferenceIndex(value: unknown): ReferenceIndex {
  const input = value as ReferenceIndex;
  if (
    !input ||
    !Array.isArray(input.entries) ||
    !input.entries.length ||
    !Array.isArray(input.types)
  )
    throw new Error("Invalid reference index.");
  const pageByName = new Map(
    input.entries
      .filter(
        (entry) =>
          entry &&
          typeof entry.name === "string" &&
          typeof entry.path === "string" &&
          validReferencePath(entry.path),
      )
      .map((entry) => [entry.name, entry.path.split("#")[0]]),
  );
  const pagesByType = new Map<string, Set<string>>();
  for (const entry of input.entries) {
    if (
      entry &&
      typeof entry.path === "string" &&
      validReferencePath(entry.path)
    ) {
      if (!pagesByType.has(entry.type)) pagesByType.set(entry.type, new Set());
      pagesByType.get(entry.type)!.add(entry.path.split("#")[0]);
    }
  }
  const entries = input.entries.map((entry) => {
    if (
      !entry ||
      typeof entry.name !== "string" ||
      typeof entry.path !== "string" ||
      (entry.type != null && typeof entry.type !== "string")
    )
      throw new Error("Invalid reference entry.");
    let path = entry.path;
    // Some upstream indexes contain fragment-only methods. Resolve an exact
    // parent API, or the category's sole page, before falling back to its index.
    if (path.startsWith("#")) {
      let parent = entry.name;
      let page: string | undefined;
      while (parent.includes(".") && !page) {
        parent = parent.slice(0, parent.lastIndexOf("."));
        page = pageByName.get(parent);
      }
      const peers = pagesByType.get(entry.type);
      if (!page && peers?.size === 1) page = [...peers][0];
      path = (page || "index") + path;
    }
    if (!validReferencePath(path) && !safeExternalUrl(path))
      throw new Error("Unsupported paths in reference index.");
    return { name: entry.name, path, type: entry.type || "General" };
  });
  return {
    entries,
    types: input.types.filter((type) => type && typeof type.name === "string"),
  };
}

export function entryHref(doc: ReferenceCollection, path: string): string {
  const external = safeExternalUrl(path);
  if (external) return external;
  if (!validReferencePath(path)) throw new Error("Invalid documentation path.");
  const [page, ...fragments] = path.split("#");
  const encoded = page
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  let fragment = fragments.join("#");
  try {
    fragment = decodeURIComponent(fragment);
  } catch {
    /* Preserve literal source fragment. */
  }
  const root = collectionHref(doc).replace(/\/$/, "");
  const trailingSlash = page.split("/").at(-1)!.includes(".") ? "" : "/";
  return `${root}/${encoded}${trailingSlash}${fragments.length ? `#ref-${encodeURIComponent(fragment)}` : ""}`;
}

/** Ranked name search; it does not claim to search the full text of pages. */
export function searchReferenceEntries(
  entries: ReferenceEntry[],
  query: string,
  category = "",
  limit = 80,
): { entries: ReferenceEntry[]; total: number } {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const needle = words.join(" ");
  const scored: { entry: ReferenceEntry; score: number; position: number }[] =
    [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (category && entry.type !== category) continue;
    const name = entry.name.toLocaleLowerCase();
    if (
      words.length &&
      !words.every((word) =>
        `${name} ${entry.type.toLocaleLowerCase()}`.includes(word),
      )
    )
      continue;
    const score = !needle
      ? 0
      : name === needle
        ? 0
        : name.startsWith(needle)
          ? 1
          : name.includes(needle)
            ? 2
            : 3;
    scored.push({ entry, score, position: i });
  }
  scored.sort((a, b) => a.score - b.score || a.position - b.position);
  return {
    entries: scored.slice(0, limit).map((item) => item.entry),
    total: scored.length,
  };
}
