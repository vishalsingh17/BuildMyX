import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReferenceReader } from "@/components/reference-reader";
import { pageMetadata } from "@/lib/metadata";
import {
  collectionHref,
  editionLabel,
  safeExternalUrl,
} from "@/lib/reference-catalog";
import { entryHref, referencePathFromRoute } from "@/lib/reference-paths";
import { findReference, referenceFamilies } from "@/lib/references";
import "../../references.css";

type Props = { params: Promise<{ collection: string; entry?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection, entry } = await params;
  const doc = findReference(collection);
  if (!doc)
    return {
      title: "Documentation not found — BuildMyX",
      robots: { index: false, follow: false },
    };
  const title = entry?.length
    ? `${entry.at(-1)} · ${doc.name} reference`
    : `${doc.name} documentation`;
  return {
    ...pageMetadata(
      title,
      `Browse ${doc.name} API documentation, with a searchable topic index and links to the original sources.`,
      referencePathFromRoute(entry)
        ? entryHref(doc, referencePathFromRoute(entry)!)
        : collectionHref(doc),
    ),
    // The directory is indexable; mirrored source material is credited to its original publisher.
    robots: { index: false, follow: true },
  };
}

export default async function ReferenceCollectionPage({ params }: Props) {
  const { collection, entry } = await params;
  const doc = findReference(collection);
  const path = referencePathFromRoute(entry);
  if (!doc || path === undefined) notFound();
  const family = referenceFamilies.find((item) => item.id === doc.family)!;
  return (
    <main
      id="main"
      tabIndex={-1}
      className="reference-page reference-reader-page container"
    >
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/learn/references/">Documentation</Link>
        <span aria-hidden="true">/</span>
        {path ? (
          <>
            <Link href={collectionHref(doc)} prefetch={false}>
              {doc.name}
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Reference</span>
          </>
        ) : (
          <span aria-current="page">{doc.name}</span>
        )}
      </nav>
      {family.collections.length > 1 && (
        <nav
          className="reference-edition-nav"
          aria-label={`${doc.name} editions`}
        >
          <span>Edition</span>
          {family.collections.map((item) => (
            <Link
              key={item.slug}
              href={collectionHref(item)}
              prefetch={false}
              aria-current={item.slug === doc.slug ? "page" : undefined}
            >
              {editionLabel(item)}
              {item.preview ? ` · ${item.release || item.version}` : ""}
            </Link>
          ))}
        </nav>
      )}
      <ReferenceReader
        key={doc.slug}
        doc={doc}
        path={path}
        sourceHome={safeExternalUrl(doc.links?.home)}
      />
    </main>
  );
}
