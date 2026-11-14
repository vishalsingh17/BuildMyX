"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Arrow } from "./icons";
import {
  collectionHref,
  safeExternalUrl,
  referenceDate,
  versionLabel,
  type ReferenceCollection,
} from "@/lib/reference-catalog";
import {
  entryHref,
  searchReferenceEntries,
  type ReferenceIndex,
} from "@/lib/reference-paths";
import type { ReferenceDocument } from "@/lib/server/reference-content";

const EMPTY_ENTRIES: ReferenceIndex["entries"] = [];

type Resource<T> =
  | { key: string; status: "loading" }
  | { key: string; status: "ready"; value: T }
  | { key: string; status: "error"; missing: boolean; stale: boolean };

/** Abort and key the result so rapid navigation can never display an older page. */
function useReferenceResource<T>(url: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Resource<T>>({
    key: url || "",
    status: "loading",
  });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setState({ key: url, status: "loading" });
    (async () => {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(45000),
          ]),
          cache: attempt ? "reload" : "default",
        });
        if (!response.ok) {
          if (!controller.signal.aborted)
            setState({
              key: url,
              status: "error",
              missing: response.status === 404,
              stale: response.status === 409,
            });
          return;
        }
        const value = (await response.json()) as T;
        if (!controller.signal.aborted)
          setState({ key: url, status: "ready", value });
      } catch {
        if (!controller.signal.aborted)
          setState({ key: url, status: "error", missing: false, stale: false });
      }
    })();
    return () => controller.abort();
  }, [url, attempt]);
  return {
    state:
      state.key === url
        ? state
        : ({ key: url || "", status: "loading" } as Resource<T>),
    retry: () => setAttempt((value) => value + 1),
  };
}

export function ReferenceReader({
  doc,
  path,
  sourceHome,
}: {
  doc: ReferenceCollection;
  path: string | null;
  sourceHome: string | null;
}) {
  const router = useRouter();
  const indexUrl = `/api/references/${encodeURIComponent(doc.slug)}/index/?v=${doc.mtime}`;
  const documentUrl = path
    ? `/api/references/${encodeURIComponent(doc.slug)}/page/?path=${encodeURIComponent(path)}&v=${doc.mtime}`
    : null;
  const index = useReferenceResource<ReferenceIndex>(indexUrl);
  const document = useReferenceResource<ReferenceDocument>(documentUrl);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(80);
  const [desktopTopics, setDesktopTopics] = useState(false);
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 801px)");
    const update = () => setDesktopTopics(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const deferredQuery = useDeferredValue(query);
  const content = useRef<HTMLDivElement>(null);
  const entries =
    index.state.status === "ready" ? index.state.value.entries : EMPTY_ENTRIES;
  const categories = useMemo(
    () =>
      [...new Set(entries.map((entry) => entry.type))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [entries],
  );
  const found = useMemo(
    () => searchReferenceEntries(entries, deferredQuery, category, limit),
    [entries, deferredQuery, category, limit],
  );
  const loaded =
    path && document.state.status === "ready" ? document.state.value : null;
  const fallbackTitle =
    path?.split("/").at(-1)?.replaceAll("_", " ") || `${doc.name} reference`;
  const title = loaded?.title || fallbackTitle;

  useEffect(() => {
    if (!loaded) return;
    window.document.title = `${loaded.title} · ${doc.name} reference — BuildMyX`;
    if (window.location.hash) {
      let id = "";
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      requestAnimationFrame(() =>
        window.document.getElementById(id)?.scrollIntoView(),
      );
    }
  }, [loaded, doc.name]);

  const source = loaded?.sourceUrl || sourceHome;
  const devDocsUrl = `https://devdocs.io/${doc.slug}/${path || ""}`;
  const indexBrowser = (
    <div className="reference-index-body">
      <label htmlFor="reference-topic-search">Search {doc.name} topics</label>
      <input
        id="reference-topic-search"
        type="search"
        value={query}
        autoComplete="off"
        placeholder="API, function or guide…"
        onChange={(event) => {
          setQuery(event.target.value);
          setLimit(80);
        }}
      />
      {categories.length > 1 && (
        <>
          <label htmlFor="reference-topic-category">Topic category</label>
          <select
            id="reference-topic-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setLimit(80);
            }}
          >
            <option value="">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </>
      )}
      {index.state.status === "loading" ? (
        <p role="status" className="reference-index-status">
          Loading the topic index…
        </p>
      ) : index.state.status === "error" ? (
        <div className="reference-index-status" role="status">
          <p>
            {index.state.stale
              ? "This collection has been updated. Reload to open the current edition."
              : "The topic index could not be loaded."}
          </p>
          <button
            type="button"
            className="reference-reset"
            onClick={
              index.state.stale ? () => window.location.reload() : index.retry
            }
          >
            {index.state.stale ? "Reload reference" : "Retry topic index"}
          </button>
        </div>
      ) : (
        <>
          <p className="reference-index-count" role="status">
            {found.total.toLocaleString("en")}{" "}
            {query || category ? "matching" : "indexed"} topics
          </p>
          {found.entries.length ? (
            <ul className="reference-topic-list">
              {found.entries.map((entry, i) => (
                <li key={`${entry.path}-${entry.name}-${i}`}>
                  <Link
                    href={entryHref(doc, entry.path)}
                    prefetch={false}
                    target={safeExternalUrl(entry.path) ? "_blank" : undefined}
                    rel={
                      safeExternalUrl(entry.path)
                        ? "noopener noreferrer"
                        : undefined
                    }
                    onClick={() => setMobileTopicsOpen(false)}
                    aria-current={path === entry.path ? "page" : undefined}
                  >
                    <span>
                      {entry.name}
                      {safeExternalUrl(entry.path) && (
                        <>
                          <span aria-hidden="true"> ↗</span>
                          <span className="sr-only">
                            {" "}
                            (original source, opens in a new tab)
                          </span>
                        </>
                      )}
                    </span>
                    <small>{entry.type}</small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="reference-index-status">
              No topics match. Try a shorter name or another category.
            </p>
          )}
          {found.total > limit && (
            <button
              type="button"
              className="reference-more"
              onClick={() => setLimit((value) => value + 80)}
            >
              Show 80 more topics
            </button>
          )}
          <p className="reference-index-note">
            Search matches topic names and categories.
          </p>
        </>
      )}
    </div>
  );

  return (
    <>
      <header
        className={`reference-reader-heading ${path ? "is-article" : ""}`}
      >
        <p className="eyebrow">{doc.name.toUpperCase()} / DOCUMENTATION</p>
        <h1>{title}</h1>
        <div className="reference-version-line">
          <span className="reference-version-badge">{versionLabel(doc)}</span>
          {doc.preview && (
            <span className="reference-preview">Preview release</span>
          )}
          <span>Source updated {referenceDate(doc.mtime)}</span>
        </div>
        {!path && (
          <p className="reference-reader-lead">
            Browse {doc.entryCount.toLocaleString("en")} indexed topics, search
            for an API, or open a guide. This collection includes every entry
            supplied for this edition.
          </p>
        )}
        <div className="reference-source-links">
          {source && (
            <a href={source} target="_blank" rel="noopener noreferrer">
              {loaded?.sourceIsPage
                ? "Original source page"
                : "Project website"}{" "}
              <Arrow diagonal />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <a href={devDocsUrl} target="_blank" rel="noopener noreferrer">
            View on DevDocs <Arrow diagonal />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {!path && (
            <Link href={entryHref(doc, "index")} prefetch={false}>
              Read collection overview <Arrow />
            </Link>
          )}
          {path && (
            <Link href={collectionHref(doc)} prefetch={false}>
              All {doc.name} topics <Arrow />
            </Link>
          )}
        </div>
      </header>
      {path ? (
        <div className="reference-reading-layout">
          <aside
            className="reference-topic-sidebar"
            aria-label={`${doc.name} topic navigation`}
          >
            <details
              className="reference-topic-disclosure"
              open={desktopTopics || mobileTopicsOpen}
              onToggle={(event) => {
                if (!desktopTopics)
                  setMobileTopicsOpen(event.currentTarget.open);
              }}
            >
              <summary>Browse & search topics</summary>
              {indexBrowser}
            </details>
          </aside>
          <article className="reference-article" aria-label={title}>
            {document.state.status === "loading" ? (
              <div className="reference-loading" role="status">
                <span className="eyebrow">OPENING THE REFERENCE</span>
                <p>Loading documentation…</p>
              </div>
            ) : document.state.status === "error" ? (
              <div className="reference-error" role="status">
                <h2>
                  {document.state.stale
                    ? "A newer reference is ready."
                    : document.state.missing
                      ? "This source page could not be found."
                      : "We couldn’t load this page."}
                </h2>
                <p>
                  {document.state.stale
                    ? "Reload this page to open the current edition."
                    : document.state.missing
                      ? "Choose another topic from the index, or check the original documentation."
                      : "The documentation source may be temporarily unavailable. Try again or open the source directly."}
                </p>
                <button
                  type="button"
                  className="button"
                  onClick={
                    document.state.stale
                      ? () => window.location.reload()
                      : document.retry
                  }
                >
                  {document.state.stale ? "Reload reference" : "Try again"}{" "}
                  <Arrow />
                </button>
                <Link
                  href={collectionHref(doc)}
                  prefetch={false}
                  className="text-link"
                >
                  Browse all topics <Arrow />
                </Link>
              </div>
            ) : (
              loaded && (
                <div
                  ref={content}
                  className="reference-content"
                  onClick={(event) => {
                    if (
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.altKey ||
                      event.shiftKey
                    )
                      return;
                    const anchor = (
                      event.target as Element
                    ).closest<HTMLAnchorElement>("a[href]");
                    if (
                      !anchor ||
                      anchor.target ||
                      anchor.hasAttribute("download")
                    )
                      return;
                    const destination = new URL(
                      anchor.href,
                      window.location.href,
                    );
                    if (
                      destination.origin === window.location.origin &&
                      destination.pathname.startsWith("/learn/references/") &&
                      destination.pathname !== window.location.pathname
                    ) {
                      event.preventDefault();
                      router.push(
                        destination.pathname +
                          destination.search +
                          destination.hash,
                      );
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: loaded.html }}
                />
              )
            )}
          </article>
          {loaded && loaded.outline.length > 0 && (
            <aside className="reference-contents" aria-label="On this page">
              <p className="eyebrow">ON THIS PAGE</p>
              <ul>
                {loaded.outline.map((heading, i) => (
                  <li
                    key={`${heading.id}-${i}`}
                    className={
                      heading.level === 3 ? "is-subheading" : undefined
                    }
                  >
                    <a href={`#${encodeURIComponent(heading.id)}`}>
                      {heading.title}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      ) : (
        <div className="reference-collection-browser">{indexBrowser}</div>
      )}
      <aside className="reference-provenance">
        <p>
          Documentation provided through{" "}
          <a
            href="https://devdocs.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            DevDocs
          </a>
          . Content belongs to its respective authors and retains its original
          license. Source notices are preserved on each page.
        </p>
        <p>
          The version above is the latest available in our DevDocs snapshot for
          this edition. Official releases may be newer.{" "}
          <Link href="/learn/references/">
            Browse all documentation families <Arrow />
          </Link>
        </p>
      </aside>
    </>
  );
}
