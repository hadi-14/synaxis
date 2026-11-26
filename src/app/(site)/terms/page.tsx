import type { Metadata } from "next";
import Content, { meta } from "../../../../content/legal/terms.mdx";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Service", description: "Rules for registering and taking part in Synaxis Season 1.", alternates: { canonical: "/terms" } };

export default function Page() {
  return (
    <LegalPage file="terms" updated={meta.updated}>
      <Content />
    </LegalPage>
  );
}
