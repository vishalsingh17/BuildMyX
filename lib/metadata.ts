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
    ...(siteConfig.canonicalUrl
      ? {
          alternates: {
            canonical: new URL(path, siteConfig.canonicalUrl).toString(),
          },
        }
      : {}),
  };
}
