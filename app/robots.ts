import { canIndexSite } from "@/lib/launch";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    ...(canIndexSite(
      siteConfig.canonicalUrl,
      siteConfig.launchApproved,
      process.env.VERCEL_ENV || process.env.CONTEXT || process.env.NODE_ENV,
    ) && siteConfig.canonicalUrl
      ? { sitemap: new URL("/sitemap.xml", siteConfig.canonicalUrl).toString() }
      : {}),
  };
}
