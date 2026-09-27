import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Vinext beta's basePath prerender currently skips the root page.
  // Export at root; prepare-pages.mjs prefixes static bundle URLs afterwards.
  images: { unoptimized: true },
};

export default nextConfig;
