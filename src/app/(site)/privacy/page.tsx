import type { Metadata } from "next";
import Content, { meta } from "../../../../content/legal/privacy.mdx";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("/privacy", "Privacy Policy", "How Synaxis 2027 collects, uses and protects delegate data: what we store, why, who can see it, how long we keep it, and how to ask for access or deletion.");

export default function Page() {
  return (
    <LegalPage file="privacy" updated={meta.updated}>
      <Content />
    </LegalPage>
  );
}
