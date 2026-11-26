import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Synaxis — Heuser Science Olympiad",
    short_name: "Synaxis",
    description: "Synaxis 2027: Heuser Science Society's science olympiad. 15–17 January 2027, Karachi.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#DC2A35",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
