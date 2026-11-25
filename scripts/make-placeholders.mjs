// Writes labelled placeholder images for every missing BH6 slot (never overwrites real files).
// Placeholders carry the comment "synaxis-placeholder" so the processor can tell them apart.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const src = readFileSync("src/lib/bh6-assets.ts", "utf8");
const rows = [...src.matchAll(/^\s*([CPB])\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"(?:, "[^"]+")?(?:, (\d+), (\d+))?\)/gm)];
for (const [, k, id, , purpose, accent, w0, h0] of rows) {
  const ext = k === "B" ? "jpg" : "png";
  const out = `public/assets/bh6/${id}.${ext}`;
  if (existsSync(out)) continue;
  const [w, h] = k === "B" ? [2400, 1200] : k === "P" ? [800, 800] : [Number(w0 ?? 900), Number(h0 ?? 1200)];
  const fs = Math.round(Math.min(w, h) / 14);
  execFileSync("magick", [
    "-size", `${w}x${h}`, k === "B" ? "xc:#18243A" : "xc:none",
    "-fill", k === "B" ? "#18243A" : "#18243AE6", "-stroke", accent, "-strokewidth", "8",
    "-draw", `roundrectangle 8,8 ${w - 9},${h - 9} 40,40`,
    "-stroke", "none", "-fill", accent, "-gravity", "center", "-pointsize", String(fs),
    "-annotate", `+0-${fs}`, `${id}.${ext}`,
    "-fill", "#B4B4B9", "-pointsize", String(Math.round(fs * 0.55)),
    "-annotate", `+0+${Math.round(fs * 0.6)}`, `PLACEHOLDER · ${w}×${h} · ${purpose}`,
    "-strip", "-set", "comment", "synaxis-placeholder",
    ...(k === "B" ? ["-quality", "70"] : []), out,
  ]);
  console.log("placeholder:", out, "(run: npm run assets:process to record it)");
}
