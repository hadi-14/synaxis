import type { MetadataRoute } from "next";
import { getModules, getSettings } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [modules, settings] = await Promise.all([getModules(), getSettings()]);
  const contentUpdated = new Date(settings.updated_at ?? Date.UTC(2026, 10, 26));
  const legal = new Date("2026-11-26");
  const page = (path: string, priority: number, lastModified: Date, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority });
  return [
    page("/", 1, contentUpdated, "daily"),
    page("/register", 0.9, contentUpdated),
    ...modules.map((m) => page(`/modules/${m.slug}`, 0.8, new Date(m.updated_at ?? contentUpdated))),
    page("/council", 0.6, contentUpdated),
    page("/sponsors", 0.5, contentUpdated),
    page("/terms", 0.3, legal, "monthly"),
    page("/privacy", 0.3, legal, "monthly"),
  ];
}
