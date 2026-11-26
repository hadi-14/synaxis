import type { Metadata } from "next";
import Content, { meta } from "../../../../content/legal/privacy.mdx";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy", description: "What Synaxis collects, why, and how to ask us to change or delete it.", alternates: { canonical: "/privacy" } };

export default function Page() {
  return (
    <LegalPage file="privacy" updated={meta.updated}>
      <Content />
    </LegalPage>
  );
}
