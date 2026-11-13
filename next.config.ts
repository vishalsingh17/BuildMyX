import type { NextConfig } from "next";
import { learningPaths } from "./lib/learning";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  trailingSlash: true,
  images: { unoptimized: true },
  async rewrites() {
    // Zensical emits directory indexes. Serve only published lessons; unknown
    // paths still receive the site's real 404, and assets use the filesystem.
    return {
      fallback: learningPaths.map((path) => ({
        source: path,
        destination: `${path}index.html`,
      })),
    };
  },
};

export default nextConfig;
