import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Email shell styled as Baymax's chest display inside a red case. */
export function EmailLayout({ preview, heading, children }: { preview: string; heading: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: "#F7F5F0", fontFamily: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "0 12px" }}>
          <Text style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, color: "#737375", margin: "0 0 12px" }}>
            SYNA<span style={{ color: "#DC2A35" }}>X</span>IS
          </Text>
          <Section style={{ background: "#DC2A35", borderRadius: 24, padding: 6 }}>
            <Section style={{ background: "#0F1A2C", borderRadius: 18, padding: "22px 24px" }}>
              <Text style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#8FA3C0", margin: 0 }}>
                Baymax · Status update
              </Text>
              <Text style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", margin: "6px 0 0" }}>{heading}</Text>
            </Section>
          </Section>
          <Section style={{ background: "#FFFFFF", borderRadius: 20, padding: "20px 24px", marginTop: 12, color: "#18243A" }}>
            {children}
          </Section>
          <Hr style={{ borderColor: "#D9D5CC", margin: "20px 0" }} />
          <Text style={{ fontSize: 12, color: "#5F5F63" }}>
            Synaxis Season 1 · Heuser Science Society · Karachi.{" "}
            <Link href={`${SITE}/dashboard`} style={{ color: "#C42634" }}>Open your dashboard</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const p = { fontSize: 15, lineHeight: "24px", margin: "0 0 12px", color: "#18243A" } as const;
export const mono = { fontFamily: "monospace", fontSize: 14 } as const;
export const button = {
  background: "#F24B59",
  color: "#0B1220",
  borderRadius: 999,
  padding: "12px 22px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
} as const;
