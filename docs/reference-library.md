# Developer reference library

BuildMyX serves a searchable directory and an integrated documentation reader at `/learn/references/`. Zensical continues to provide the authored Python, pandas, PyTorch and system-design learning paths. The landing page, footer, learning library, curriculum navigation and relevant lessons link to the references.

## Coverage and version policy

`data/references/catalog.json` is a reviewed snapshot of `https://devdocs.io/docs.json`. It includes **every documentation family**, the newest available stable release per family/edition, and any newer preview release as a separately labelled option. Parallel editions such as GCC C++, Haxe targets, Node LTS and RethinkDB languages remain available. Duplicate source slugs are deduplicated by release. Version comparison uses numeric components, not lexical order or whichever old branch was patched most recently. Rolling unversioned collections remain current.

“Latest” means latest **available through DevDocs**, not a guarantee of the latest upstream product release. The UI shows exact releases, upstream generation dates and the catalog check date. Official source links remain available. The courses retain their tested versions.

Every supplied index entry remains searchable. Fragment-only source entries resolve against an exact parent API or a category with one page. Explicit external source entries stay external and are labelled as such; they are never fetched by the server as arbitrary URLs. The collection overview is accessible as an `index` page.

## Loading and provenance

The repository stores metadata, rather than a multi-gigabyte copy of every documentation database. The reader fetches the chosen collection's index and requested HTML through read-only endpoints. It can access all supplied pages as needed; this is not an offline mirror or a full-text search engine. Topic search covers names and categories. Pagination lets readers reach every matching entry.

- `/api/references/[collection]/index/` returns the validated topic index.
- `/api/references/[collection]/page/?path=...` returns sanitized HTML, a title, source link and heading outline.
- The server accepts only catalog collections, a fixed HTTPS CDN origin and validated relative paths. Redirects are refused. Downloads have time and byte limits; errors are not cached.
- Some older collections have a missing per-page CDN file while the page still exists in `db.json`. The loader can recover known indexed pages (and the collection overview) from the official offline database when its declared size is at most 64 MiB. Unknown paths cannot trigger a database download. Larger databases are not downloaded on a reader request; the reader provides source/DevDocs links and retry controls.
- Successful JSON responses stream in bounded chunks, so large Java/Scala indexes can exceed Vercel's 4.5 MB buffered response limit. They have a one-hour browser cache, one-day shared cache and a stale-revalidation window. An approved catalog update changes versioned requests via the source mtime. New deployments should receive the updated metadata; source content is not guaranteed to remain immutable at the CDN.
- Original attribution blocks and source URLs are retained. If a page lacks a notice block, the collection's supplied notice is appended. Documentation keeps its original license, including any applicable sharing obligations. The DevDocs application is MPL 2.0; its application source has not been copied into this reader.
- Scripts, styles, embedded frames, forms, event handlers, unsafe URLs and unsupported markup are removed. MathML, code examples, tables and headings are supported. Document IDs are prefixed to avoid collisions with the website. Percent-bearing filenames use reversible URL-safe escapes so both local Next and Vercel routing preserve the source key; old decoded links recover only through an exact published index alias. External images load with no referrer; external source links open separately.
- No Convex records, API keys, account, saved progress or new browser storage are needed. Existing analytics privacy controls remain in effect; search text is not added to analytics.

## Refresh all families

```sh
npm run sync:references -- --verify-pages
```

This fetches the current catalog, selects every latest edition, validates every selected index and loads/sanitizes one representative local page per collection. It does **not** claim to test every page or execute examples from third-party documentation. Index counts include sections and API entries; distinct page counts exclude duplicate fragments. The updater retains a local `.cache/references` index cache keyed by collection and upstream generation timestamp. Remove that ignored directory for a fresh CDN audit.

The catalog is replaced atomically only after every collection passes. An upstream family removal blocks the update for explicit review. Temporary files are removed on failure. Unchanged metadata preserves the existing checked date and does not create a meaningless diff.

```sh
npm run sync:references -- --check
```

This checks for catalog changes without writing a snapshot. It exits nonzero if a refresh needs review. Refreshes are deliberately **not** run in the production build: builds remain repeatable and a source change cannot bypass development approval. To update, run the command on `dev`, inspect the catalog diff, run the tests/build/browser checks, push to `dev`, review its Vercel preview and follow the existing `dev` → `main` owner approval process. See [environments and releases](environments-and-releases.md).

## Verification

Catalog tests cover semantic version selection, previews, all families, parallel editions, duplicate slugs, unsafe metadata and malformed input. Reader tests cover source-specific path quirks, name search and pagination, provenance, HTML sanitization, safe links, bounded downloads and offline-database recovery. Browser checks exercise the directory, filters, desktop/mobile reading, navigation, source links, failures/retries and stale-response cancellation using deterministic source fixtures. A separate live audit verifies all selected indexes and representative pages against the actual CDN.
