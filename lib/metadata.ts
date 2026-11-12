import type { Metadata } from "next";
import { siteConfig } from "./site-config";

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title: `${title} — BuildMyX`,
    description,
    openGraph: {
      type: "website",
      siteName: "BuildMyX",
      title: `${title} — BuildMyX`,
      description,
      ...(siteConfig.canonicalUrl
        ? { url: new URL(path, siteConfig.canonicalUrl).toString() }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — BuildMyX`,
      description,
    },
    ...(siteConfig.canonicalUrl
      ? {
          alternates: {
            canonical: new URL(path, siteConfig.canonicalUrl).toString(),
          },
        }
      : {}),
  };
}
