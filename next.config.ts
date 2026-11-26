import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  /* config options here */
  cacheComponents: true,
  // The main site lives at "/"; old /portal links (and #anchors) redirect permanently (308).
  async redirects() {
    return [{ source: "/portal", destination: "/", permanent: true }];
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
