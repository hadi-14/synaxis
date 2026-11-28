import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMeta } from "@/lib/seo";
import { Home } from "@/components/home/Home";
import { IntroGate } from "@/components/landing/IntroGate";

export const metadata: Metadata = {
  ...pageMeta("/", DEFAULT_TITLE, DEFAULT_DESCRIPTION),
  title: { absolute: DEFAULT_TITLE },
};

/** "/" = the home page + the intro. Crawlers and audit tools get /home-static instead (src/proxy.ts). */
export default function HomePage() {
  return (
    <>
      <IntroGate />
      <Home />
    </>
  );
}
