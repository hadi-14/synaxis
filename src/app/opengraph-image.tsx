import { ImageResponse } from "next/og";
import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";

export const alt = "Synaxis Season 1: a Big Hero 6-themed science olympiad by the Heuser Science Society, 15–17 January 2027";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Themed OG card: Battle Mode navy, coral glow, the traced logo, microbot ring. */
export default async function OgImage() {
  const dots = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return { x: 600 + Math.cos(a) * 330, y: 300 + Math.sin(a) * 230 };
  });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0B1220", position: "relative" }}>
        <div style={{ position: "absolute", width: 760, height: 760, borderRadius: 9999, background: "radial-gradient(circle, rgba(242,75,89,.35), rgba(11,18,32,0) 65%)", display: "flex" }} />
        {dots.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: d.x - 5, top: d.y - 3, width: 10, height: 6, borderRadius: 2, background: i % 5 === 0 ? "#F24B59" : "#424CBC", display: "flex" }} />
        ))}
        <svg width="890" height="126" viewBox="0 0 890 126">
          <path d={LOGO_LETTERS} fill="#B4B4B9" fillRule="evenodd" />
          <path d={LOGO_X} fill="#DC2A35" fillRule="evenodd" />
        </svg>
        <div style={{ marginTop: 48, display: "flex", fontSize: 40, color: "#F7F5F0", letterSpacing: 2 }}>SEASON 1 · 15–17 JANUARY 2027 · KARACHI</div>
        <div style={{ marginTop: 18, display: "flex", fontSize: 28, color: "#FF6B77" }}>Heuser Science Society · Register your team</div>
      </div>
    ),
    size,
  );
}
