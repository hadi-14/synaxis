import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMeta } from "@/lib/seo";
import { Home } from "@/components/home/Home";

/**
 * The home page without the intro: what crawlers, audit tools and link previewers get for "/".
 * Only reachable through the proxy's rewrite (src/proxy.ts); a direct request is a 404. Same metadata as "/"
 * (canonical "/"), since search engines index this HTML as the home page.
 */
export const metadata: Metadata = {
  ...pageMeta("/", DEFAULT_TITLE, DEFAULT_DESCRIPTION),
  title: { absolute: DEFAULT_TITLE },
};

export default function HomeStaticPage() {
  return <Home />;
}
