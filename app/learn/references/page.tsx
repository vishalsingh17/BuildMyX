import Link from "next/link";
import { Arrow } from "@/components/icons";
import {
  ReferenceDirectory,
  type DirectoryFamily,
} from "@/components/reference-directory";
import { pageMetadata } from "@/lib/metadata";
import {
  collectionHref,
  editionLabel,
  referenceDate,
  versionLabel,
} from "@/lib/reference-catalog";
import {
  referenceCatalog,
  referenceCollections,
  referenceEntryCount,
  referenceFamilies,
  referenceFamilyCount,
} from "@/lib/references";
import "./references.css";

export const metadata = pageMetadata(
  "Developer documentation library",
  "Search the latest available DevDocs references across programming languages, web frameworks, data, AI, databases and infrastructure.",
  "/learn/references/",
);

export default async function References({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const families: DirectoryFamily[] = referenceFamilies.map((family) => {
    const primary = family.collections.find(
      (doc) => doc.slug === family.primary,
    )!;
    return {
      id: family.id,
      name: family.name,
      category: family.category,
      version: versionLabel(primary),
      href: collectionHref(primary),
      updated: referenceDate(primary.mtime),
      entryCount: primary.entryCount,
      alias: primary.alias || "",
      preview: primary.preview,
      editions: family.collections
        .filter((doc) => doc.slug !== family.primary)
        .map((doc) => ({
          name: editionLabel(doc),
          version: versionLabel(doc),
          href: collectionHref(doc),
          preview: doc.preview,
        })),
    };
  });
  return (
    <main id="main" tabIndex={-1} className="reference-page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <a href="/learn/">Learn</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Documentation</span>
      </nav>
      <header className="reference-hero">
        <div>
          <p className="eyebrow">BUILDMYX LEARN / THE REFERENCE LIBRARY</p>
          <h1>
            A good question.
            <br />
            <em>A reference away.</em>
          </h1>
          <p className="reference-hero-description">
            Find the API, explore the guide, keep building. Documentation for
            every family in DevDocs, brought together in one searchable library.
          </p>
          <a href="#reference-browse-title" className="button">
            Find documentation <Arrow />
          </a>
        </div>
        <aside
          className="reference-library-stats"
          aria-label="Documentation coverage"
        >
          <p className="eyebrow">ROOM TO EXPLORE</p>
          <dl>
            <div>
              <dt>{referenceFamilyCount}</dt>
              <dd>documentation families</dd>
            </div>
            <div>
              <dt>{referenceCollections.length}</dt>
              <dd>latest collections & editions</dd>
            </div>
            <div>
              <dt>{referenceEntryCount.toLocaleString("en")}</dt>
              <dd>indexed APIs, topics & sections</dd>
            </div>
          </dl>
          <p>Free to read. No sign-up.</p>
        </aside>
      </header>
      <div className="reference-snapshot-note">
        <span className="reference-status-dot" aria-hidden="true" />
        <p>
          Catalog checked{" "}
          {referenceDate(Date.parse(referenceCatalog.syncedAt) / 1000)}. Each
          collection shows its available version and source update date. Some
          references trail official releases.
        </p>
      </div>
      <ReferenceDirectory
        families={families}
        initialQuery={
          typeof params.q === "string" ? params.q.slice(0, 150) : ""
        }
      />
      <section
        className="reference-about"
        aria-labelledby="reference-about-title"
      >
        <div>
          <p className="eyebrow">LEARN IT. THEN LOOK IT UP.</p>
          <h2 id="reference-about-title">
            Understanding meets a useful reference.
          </h2>
        </div>
        <div>
          <p>
            Follow our Python, pandas, PyTorch, Generative AI and system design
            learning paths for explanations, exercises and projects. Use this
            library when you need a function, a parameter or a deeper technical
            guide.
          </p>
          <a href="/learn/" className="text-link">
            Explore the learning paths <Arrow />
          </a>
          <p className="reference-license-note">
            References are provided through{" "}
            <a href="https://devdocs.io/">DevDocs</a>, with original source
            links and copyright notices. Documentation retains its upstream
            licenses.
          </p>
        </div>
      </section>
    </main>
  );
}
