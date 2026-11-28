import type { Metadata } from "next";
import Content, { meta } from "../../../../content/legal/terms.mdx";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMeta } from "@/lib/seo";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = pageMeta("/terms", "Terms of Service", "Terms for Synaxis 2027: eligibility, teams of 4–6, 4–5 modules with Kabuki Caper compulsory, fees and payment, waivers, minors, refunds and code of conduct.");

export default async function Page() {
  const s = await getSettings();
  const ContactEmail = () => <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>;
  return (
    <LegalPage file="terms" updated={meta.updated}>
      <Content components={{ ContactEmail }} />
    </LegalPage>
  );
}
