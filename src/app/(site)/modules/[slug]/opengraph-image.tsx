import { ImageResponse } from "next/og";
import { getModule, getModules } from "@/lib/content";
import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";

export const alt = "Synaxis 2027 module";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getModules()).map((m) => ({ slug: m.slug }));
}

/** Per-module share card: red brand, module name, subject, character, accent colour. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await getModule(slug);
  const name = m?.name ?? "Synaxis module";
  const accent = m?.accent ?? "#F24B59";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#DC2A35", position: "relative", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 28, background: accent, display: "flex" }} />
        <div style={{ position: "absolute", right: -120, top: -120, width: 520, height: 520, borderRadius: 9999, background: "rgba(255,255,255,.10)", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 80px", width: "100%" }}>
          <svg width="356" height="50" viewBox="0 0 890 126">
            <path d={LOGO_LETTERS} fill="#FFFFFF" fillRule="evenodd" />
            <path d={LOGO_X} fill="#FFFFFF" fillRule="evenodd" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ display: "flex", background: "#A3141F", color: "#fff", fontSize: 28, padding: "8px 20px", borderRadius: 999, letterSpacing: 3 }}>{(m?.subject ?? "").toUpperCase()}</div>
              {m?.is_compulsory ? <div style={{ display: "flex", background: "#fff", color: "#C42634", fontSize: 28, padding: "8px 20px", borderRadius: 999, letterSpacing: 3 }}>COMPULSORY</div> : null}
            </div>
            <div style={{ display: "flex", fontSize: 92, fontWeight: 800, color: "#fff", marginTop: 24, lineHeight: 1.02 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 36, color: "#fff", marginTop: 16, alignItems: "center", gap: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: accent, border: "3px solid #fff", display: "flex" }} />
              {m?.character ?? ""}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#fff", letterSpacing: 2 }}>15–17 JANUARY 2027 · KARACHI · heusersynaxis.com</div>
        </div>
      </div>
    ),
    size,
  );
}
