import { referenceJsonResponse } from "@/lib/server/reference-json";
import { findReference } from "@/lib/references";
import { validReferencePath } from "@/lib/reference-paths";
import {
  loadReferenceDocument,
  loadReferenceIndex,
  ReferenceFetchError,
} from "@/lib/server/reference-content";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ collection: string; resource: string }> },
) {
  const { collection, resource } = await context.params;
  const doc = findReference(collection);
  if (!doc || !["index", "page"].includes(resource))
    return Response.json(
      { error: "Reference collection not found." },
      { status: 404 },
    );
  const url = new URL(request.url);
  const allowedParams = resource === "index" ? ["v"] : ["v", "path"];
  if (
    [...url.searchParams.keys()].some(
      (key) =>
        !allowedParams.includes(key) ||
        url.searchParams.getAll(key).length !== 1,
    )
  )
    return Response.json(
      { error: "Unexpected reference parameters." },
      { status: 400 },
    );
  const revision = url.searchParams.get("v");
  if (revision && revision !== String(doc.mtime))
    return Response.json(
      {
        error:
          "This reference was updated. Reload the page to open the current edition.",
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  const path = url.searchParams.get("path") || "";
  if (resource === "page" && (!validReferencePath(path) || path.includes("#")))
    return Response.json(
      { error: "Invalid documentation path." },
      { status: 400 },
    );
  try {
    const value =
      resource === "index"
        ? await loadReferenceIndex(doc)
        : await loadReferenceDocument(doc, path, findReference);
    return referenceJsonResponse(value, {
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    });
  } catch (error) {
    // Only public collection identifiers enter logs; search text and raw source
    // errors are excluded from both logs and the client response.
    console.error("Reference source request failed", {
      collection: doc.slug,
      resource,
      kind: error instanceof ReferenceFetchError ? error.kind : "unexpected",
    });
    const status =
      error instanceof ReferenceFetchError && error.kind === "missing"
        ? 404
        : 503;
    return Response.json(
      {
        error:
          status === 404
            ? "This documentation page was not found."
            : "Documentation is temporarily unavailable. Please retry or open the source.",
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
