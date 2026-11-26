import { ImageResponse } from "next/og";
import { LOGO_LETTERS, LOGO_X } from "@/components/brand/logo-paths";

export const alt = "Synaxis 2027: Heuser Science Society olympiad, 15–17 January 2027, Karachi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site share card: bold red brand, white logo, dates, 9 modules, teams of 4–6. */
export default async function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#DC2A35", position: "relative", fontFamily: "sans-serif" }}>
        <div style={{ position: "absolute", left: -160, bottom: -200, width: 620, height: 620, borderRadius: 9999, background: "rgba(255,255,255,.08)", display: "flex" }} />
        <div style={{ position: "absolute", right: -120, top: -160, width: 520, height: 520, borderRadius: 9999, background: "rgba(163,20,31,.55)", display: "flex" }} />
        <svg width="890" height="126" viewBox="0 0 890 126">
          <path d={LOGO_LETTERS} fill="#FFFFFF" fillRule="evenodd" />
          <path d={LOGO_X} fill="#FFFFFF" fillRule="evenodd" />
        </svg>
        <div style={{ display: "flex", marginTop: 44, fontSize: 46, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>15–17 January 2027 · Karachi</div>
        <div style={{ display: "flex", marginTop: 22, gap: 16 }}>
          {["9 modules", "Teams of 4–6", "Register now"].map((t) => (
            <div key={t} style={{ display: "flex", background: t === "Register now" ? "#fff" : "#A3141F", color: t === "Register now" ? "#C42634" : "#fff", fontSize: 30, padding: "10px 26px", borderRadius: 999 }}>{t}</div>
          ))}
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: 34, fontSize: 26, color: "#fff", letterSpacing: 3 }}>HEUSER SCIENCE SOCIETY · heusersynaxis.com</div>
      </div>
    ),
    size,
  );
}
