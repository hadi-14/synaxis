import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Big Hero 6 art in /public/assets/bh6 is served as AVIF/WebP via next/image.
  images: { formats: ["image/avif", "image/webp"], qualities: [70, 75, 85] },
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

export default nextConfig;
