"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Arrow } from "./icons";
import { referenceCategories } from "@/lib/reference-catalog";

export interface DirectoryFamily {
  id: string;
  name: string;
  category: string;
  version: string;
  href: string;
  updated: string;
  entryCount: number;
  alias: string;
  preview: boolean;
  editions: { name: string; version: string; href: string; preview: boolean }[];
}

export function ReferenceDirectory({
  families,
  initialQuery = "",
}: {
  families: DirectoryFamily[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("");
  const needle = useDeferredValue(query.trim().toLocaleLowerCase());
  const words = needle.split(/\s+/).filter(Boolean);
  const matches = families.filter(
    (family) =>
      (!category || family.category === category) &&
      words.every((word) =>
        `${family.name} ${family.id.replaceAll("_", " ")} ${family.category} ${family.alias}`
          .toLocaleLowerCase()
          .includes(word),
      ),
  );
  const categories = referenceCategories.filter((name) =>
    families.some((family) => family.category === name),
  );

  return (
    <section
      className="reference-directory"
      aria-labelledby="reference-browse-title"
    >
      <div className="reference-find-heading">
        <h2 id="reference-browse-title">Find your next answer.</h2>
        <p>Search a technology, then explore its APIs and guides.</p>
      </div>
      <div className="reference-filters">
        <div className="reference-search-field">
          <label htmlFor="reference-search">Find documentation</label>
          <input
            id="reference-search"
            type="search"
            value={query}
            autoComplete="off"
            placeholder="Python, React, PostgreSQL…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="reference-category">Browse by field</label>
          <select
            id="reference-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All fields</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {(query || category) && (
          <button
            type="button"
            className="reference-reset"
            onClick={() => {
              setQuery("");
              setCategory("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <p className="reference-results-summary" role="status" aria-live="polite">
        {matches.length} of {families.length} documentation families
        {category ? ` · ${category}` : ""}
      </p>
      {matches.length ? (
        <div className="reference-family-grid">
          {matches.map((family) => (
            <article key={family.id} className="reference-family-card">
              <p className="reference-card-category">{family.category}</p>
              <h3>
                <Link href={family.href} prefetch={false}>
                  {family.name}
                  <Arrow />
                </Link>
              </h3>
              <div className="reference-card-version">
                <span>{family.version}</span>
                {family.preview && (
                  <span className="reference-preview">Preview</span>
                )}
              </div>
              <p className="reference-card-details">
                {family.entryCount.toLocaleString("en")} indexed topics
                <br />
                Updated {family.updated}
              </p>
              {family.editions.length > 0 && (
                <ul
                  className="reference-editions"
                  aria-label={`${family.name} additional editions`}
                >
                  {family.editions.map((edition) => (
                    <li key={edition.href}>
                      <Link href={edition.href} prefetch={false}>
                        {edition.name}
                        {edition.preview ? ` · ${edition.version} preview` : ""}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="reference-empty">
          <h3>No matching documentation</h3>
          <p>Try a technology name or choose another field.</p>
          <button
            type="button"
            className="button"
            onClick={() => {
              setQuery("");
              setCategory("");
            }}
          >
            Show all documentation <Arrow />
          </button>
        </div>
      )}
    </section>
  );
}
