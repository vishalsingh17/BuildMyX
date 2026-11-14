import { canIndexSite } from "@/lib/launch";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { learningPaths } from "@/lib/learning";
export default function sitemap(): MetadataRoute.Sitemap {
  if (
    !canIndexSite(
      siteConfig.canonicalUrl,
      siteConfig.launchApproved,
      process.env.VERCEL_ENV || process.env.CONTEXT || process.env.NODE_ENV,
    )
  )
    return [];
  return [
    "/",
    "/services/ai/",
    "/services/career/",
    "/services/team/",
    "/projects/",
    "/projects/reporting-pipeline/",
    "/resources/reporting-readiness/",
    "/resources/hiring-brief/",
    "/developers/",
    "/privacy/",
    ...learningPaths,
    "/learn/references/",
  ].map((path) => ({
    url: new URL(path, siteConfig.canonicalUrl!).toString(),
  }));
}
