import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  DEVDOCS_CATALOG_URL,
  DEVDOCS_DOCUMENTS_ORIGIN,
  selectLatestFamilies,
  validateUpstreamCatalog,
  type ReferenceCatalog,
} from "../lib/reference-catalog";
import { loadReferenceDocument } from "../lib/server/reference-content";
import { parseReferenceIndex } from "../lib/reference-paths";

const target = resolve("data/references/catalog.json");
const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !["--verify-pages", "--check"].includes(arg)))
  throw new Error("Use --check or --verify-pages.");

async function download(url: string, asJson = true): Promise<unknown> {
  const cachePath = resolve(
    ".cache/references",
    `${encodeURIComponent(new URL(url).pathname)}.${new URL(url).search.slice(1)}.json`,
  );
  try {
    return JSON.parse(await readFile(cachePath, "utf8"));
  } catch {
    /* New upstream revision. */
  }
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(25000),
        redirect: "error",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const value = asJson ? await response.json() : await response.text();
      await mkdir(dirname(cachePath), { recursive: true });
      await writeFile(cachePath, JSON.stringify(value));
      return value;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Unable to verify ${new URL(url).pathname}.`, {
    cause: lastError,
  });
}

async function main() {
  const catalogResponse = await fetch(DEVDOCS_CATALOG_URL, {
    signal: AbortSignal.timeout(30000),
  });
  if (!catalogResponse.ok)
    throw new Error(`Catalog returned ${catalogResponse.status}.`);
  const docs = validateUpstreamCatalog(await catalogResponse.json());
  const families = selectLatestFamilies(docs);
  let previous: ReferenceCatalog | undefined;
  try {
    previous = JSON.parse(await readFile(target, "utf8"));
  } catch {
    /* First import. */
  }
  // A truncated feed must never silently remove published documentation families.
  if (
    previous &&
    previous.families.some(
      (old) => !families.some((next) => next.id === old.id),
    )
  )
    throw new Error(
      "Upstream removed a family. Review removals explicitly before replacing the snapshot.",
    );
  const collections = families.flatMap((f) => f.collections);
  let done = 0,
    cursor = 0;
  const failures: string[] = [];
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (cursor < collections.length) {
        const doc = collections[cursor++];
        try {
          const index = parseReferenceIndex(
            await download(
              `${DEVDOCS_DOCUMENTS_ORIGIN}/${doc.slug}/index.json?${doc.mtime}`,
            ),
          );
          doc.entryCount = index.entries.length;
          doc.pageCount = new Set(
            index.entries.map((entry) => entry.path.split("#")[0]),
          ).size;
          if (args.has("--verify-pages")) {
            const path = index.entries
              .find((entry) => !/^https?:/.test(entry.path))!
              .path.split("#")[0];
            let verified = false;
            for (let attempt = 0; attempt < 3 && !verified; attempt++) {
              try {
                await loadReferenceDocument(doc, path);
                verified = true;
              } catch (error) {
                if (attempt === 2) throw error;
              }
            }
          }
        } catch (error) {
          failures.push(
            `${doc.slug}: ${error instanceof Error ? error.message : "failed"}`,
          );
        }
        done++;
        if (done % 25 === 0 || done === collections.length)
          console.log(`Verified ${done}/${collections.length} collections.`);
      }
    }),
  );
  if (failures.length)
    throw new Error(
      `Snapshot unchanged; ${failures.length} collections failed verification:\n${failures.join("\n")}`,
    );
  const snapshot: ReferenceCatalog = {
    schemaVersion: 1,
    syncedAt: new Date().toISOString(),
    source: DEVDOCS_CATALOG_URL,
    upstreamCollectionCount: docs.length,
    families,
  };
  if (args.has("--check")) {
    if (
      !previous ||
      JSON.stringify({ ...snapshot, syncedAt: "" }) !==
        JSON.stringify({ ...previous, syncedAt: "" })
    )
      throw new Error(
        "The reference catalog has updates. Run npm run sync:references and review the diff on dev.",
      );
  } else {
    const unchanged =
      previous &&
      JSON.stringify({ ...snapshot, syncedAt: "" }) ===
        JSON.stringify({ ...previous, syncedAt: "" });
    if (!unchanged) {
      await mkdir(dirname(target), { recursive: true });
      const temporary = `${target}.tmp`;
      try {
        await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
        await rename(temporary, target);
      } finally {
        await rm(temporary, { force: true });
      }
    }
  }
  console.log(
    `${families.length} families; ${collections.length} latest collections and parallel editions; ${collections.reduce((total, d) => total + d.entryCount, 0).toLocaleString("en")} indexed entries.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
