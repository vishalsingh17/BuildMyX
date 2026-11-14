import snapshot from "@/data/references/catalog.json";
import {
  collectionHref,
  type ReferenceCatalog,
  type ReferenceCollection,
} from "./reference-catalog";

export const referenceCatalog = snapshot as ReferenceCatalog;
export const referenceFamilies = referenceCatalog.families;
export const referenceCollections = referenceFamilies.flatMap(
  (family) => family.collections,
);
const bySlug = new Map(referenceCollections.map((doc) => [doc.slug, doc]));
const primaryByFamily = new Map(
  referenceFamilies.map((family) => [family.id, bySlug.get(family.primary)!]),
);

export function findReference(id: string): ReferenceCollection | undefined {
  return bySlug.get(id) || primaryByFamily.get(id);
}

export const referenceFamilyCount = referenceFamilies.length;
export const referenceEntryCount = referenceCollections.reduce(
  (total, doc) => total + doc.entryCount,
  0,
);
export const referencePageCount = referenceCollections.reduce(
  (total, doc) => total + doc.pageCount,
  0,
);
export const referencePaths = referenceCollections.map(collectionHref);
