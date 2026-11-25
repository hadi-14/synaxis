import type { MetadataRoute } from "next";
import { getModules } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const modules = await getModules();
  return [
    { url: `${base}/`, priority: 0.6 },
    { url: `${base}/portal`, priority: 1 },
    { url: `${base}/council`, priority: 0.6 },
    { url: `${base}/sponsors`, priority: 0.5 },
    { url: `${base}/register`, priority: 0.9 },
    ...modules.map((m) => ({ url: `${base}/modules/${m.slug}`, priority: 0.7 })),
  ];
}
