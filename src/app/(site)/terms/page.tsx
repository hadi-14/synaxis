import type { Metadata } from "next";
import Content, { meta } from "../../../../content/legal/terms.mdx";
import { LegalPage } from "@/components/legal/LegalPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("/terms", "Terms of Service", "Terms for Synaxis 2027: eligibility, teams of 4–6, 4–5 modules with Kabuki Caper compulsory, fees and payment, waivers, code of conduct and dress code.");

export default function Page() {
  return (
    <LegalPage file="terms" updated={meta.updated}>
      <Content />
    </LegalPage>
  );
}
