import type { Metadata } from "next";
import Content, { meta } from "../../../../content/legal/privacy.mdx";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMeta } from "@/lib/seo";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = pageMeta("/privacy", "Privacy Policy", "How Synaxis 2027 collects, uses and protects delegate data: what we store, why, who can see it, how long we keep it, and how to ask for access or deletion.");

export default async function Page() {
  const s = await getSettings();
  const ContactEmail = () => <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>;
  return (
    <LegalPage file="privacy" updated={meta.updated}>
      <Content components={{ ContactEmail }} />
    </LegalPage>
  );
}
