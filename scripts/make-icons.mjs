// Builds the favicon set from public/icon.svg (the Synaxis X on a dark rounded square).
// Usage: node scripts/make-icons.mjs   (requires `rsvg-convert` and ImageMagick `magick` on PATH)
// Outputs stable, un-hashed URLs that Google can fetch (multiples of 48 px, see README → Search):
//   public/favicon.ico (16/32/48) · public/icon-48.png · public/icon-96.png · public/icon-192.png · public/apple-touch-icon.png (180)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "synaxis-icons-"));
const base = readFileSync("public/icon.svg", "utf8");
// Tiny sizes: the X fills ~84% of the tile instead of ~68%, so it still reads as an X at 16 px.
const tight = base.replace(/transform="translate\(40 72\) scale\(0\.9\) translate\(-518 1\)"/, 'transform="translate(21.5 58) scale(1.1) translate(-518 1)"');
if (tight === base) throw new Error("public/icon.svg changed shape: update the transform in make-icons.mjs");
// Apple: full-bleed square (iOS rounds the corners itself).
const apple = base.replace(/<rect width="256" height="256" rx="56"/, '<rect width="256" height="256"');

const src = (name, svg) => { const f = join(dir, `${name}.svg`); writeFileSync(f, svg); return f; };
const png = (svgFile, size, out) => execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), svgFile, "-o", out]);

const tightSvg = src("tight", tight), baseSvg = src("base", base), appleSvg = src("apple", apple);
const ico = [16, 32, 48].map((n) => { const f = join(dir, `ico-${n}.png`); png(tightSvg, n, f); return f; });
execFileSync("magick", [...ico, "public/favicon.ico"]);
png(tightSvg, 48, "public/icon-48.png");
png(baseSvg, 96, "public/icon-96.png");
png(baseSvg, 192, "public/icon-192.png");
png(appleSvg, 180, "public/apple-touch-icon.png");
console.log("wrote public/favicon.ico, icon-48.png, icon-96.png, icon-192.png, apple-touch-icon.png");
