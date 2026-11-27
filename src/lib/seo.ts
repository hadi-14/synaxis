/** Single source for SEO constants. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://heusersynaxis.com").replace(/\/$/, "");
export const SITE_NAME = "Synaxis";
/** Fits Google's ~55–60 character title width; the dates live in the description. */
export const DEFAULT_TITLE = "Synaxis 2027 · Heuser Science Olympiad, Karachi";
export const DEFAULT_DESCRIPTION =
  "Synaxis, Heuser Science Society's first science olympiad: 3 days, 9 modules, teams of 4–6. 15–17 January 2027, Karachi. Register your team now.";
export const INSTAGRAM = "https://www.instagram.com/heusersynaxis/";

/** Per-page metadata helper: canonical + OG/Twitter that match the page. */
export function pageMeta(path: string, title: string, description: string) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, locale: "en_PK", type: "website" as const },
    twitter: { card: "summary_large_image" as const, title, description },
  };
}
