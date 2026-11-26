import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  /* config options here */
  cacheComponents: true,
  // The main site lives at "/"; old /portal links (and #anchors) redirect permanently (308).
  // PostHog reverse proxy (so ad blockers don't drop first-party analytics).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
    const assets = host.replace(".i.posthog.com", "-assets.i.posthog.com");
    return [
      { source: "/ingest/static/:path*", destination: `${assets}/static/:path*` },
      { source: "/ingest/:path*", destination: `${host}/:path*` },
    ];
  },
  async redirects() {
    return [
      { source: "/portal", destination: "/", permanent: true },
      // One canonical host: www → apex (also set in Vercel → Domains).
      { source: "/:path*", has: [{ type: "host", value: "www.heusersynaxis.com" }], destination: "https://heusersynaxis.com/:path*", permanent: true },
    ];
  },
  // Big Hero 6 art in /public/assets/bh6 is served as AVIF/WebP via next/image.
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 85],
    // Only the BH6 art folder is optimised; its URLs carry ?v=<hash> for cache-busting.
    localPatterns: [{ pathname: "/assets/bh6/**" }],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Legal pages are written in MDX (content/legal/*.mdx) so the organisers can edit plain text.
const withMDX = createMDX({});
export default withMDX(nextConfig);
