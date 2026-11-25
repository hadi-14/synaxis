// Processes Big Hero 6 art dropped into public/assets/bh6/ and updates src/lib/bh6-status.json.
//   npm run assets:process
// For every slot:
//  - missing file                -> { missing: true, placeholder: true }
//  - file == known placeholder   -> { placeholder: true }
//  - new real file               -> back up original to assets-src/bh6/, then:
//      cutouts (characters/props): remove a flat background if there's no transparency
//        (flood-fill from the corners, fuzz 12%), trim empty space, resize (≤1600px tall
//        for characters, ≤1000px for props), strip metadata
//      backgrounds: resize to ≤2560px wide, JPEG q82, strip metadata
//    -> { placeholder: false, width, height, hash }
// next/image then serves AVIF/WebP automatically (see next.config.ts).
// Complex photo backgrounds may need a proper matting tool (e.g. `rembg i in.png out.png`) first.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const STATUS = "src/lib/bh6-status.json";
const src = readFileSync("src/lib/bh6-assets.ts", "utf8");
const rows = [...src.matchAll(/^\s*([CPB])\("([^"]+)"/gm)].map(([, k, id]) => ({ k, id, file: `${id}.${k === "B" ? "jpg" : "png"}` }));
const status = existsSync(STATUS) ? JSON.parse(readFileSync(STATUS, "utf8")) : {};
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const im = (...a) => execFileSync("magick", a, { encoding: "utf8" }).trim();
mkdirSync("assets-src/bh6", { recursive: true });

let changed = 0;
for (const { k, id, file } of rows) {
  const p = `public/assets/bh6/${file}`;
  const prev = status[id] ?? {};
  if (!existsSync(p)) {
    status[id] = { placeholder: true, missing: true };
    continue;
  }
  const h = sha(p);
  if (prev.placeholderHash === h) {
    status[id] = { ...prev, placeholder: true, missing: false };
    continue;
  }
  if (!prev.placeholder && prev.hash === h) continue; // already processed
  copyFileSync(p, `assets-src/bh6/${file}`);
  if (k === "B") {
    im(p, "-auto-orient", "-resize", "2560x>", "-strip", "-quality", "82", p);
  } else {
    const opaque = im(p, "-format", "%[opaque]", "info:") === "True";
    const args = [p, "-auto-orient"];
    if (opaque) {
      const [w, hh] = im(p, "-format", "%w %h", "info:").split(" ").map(Number);
      args.push("-alpha", "set", "-fuzz", "12%", "-fill", "none");
      for (const [x, y] of [[0, 0], [w - 1, 0], [0, hh - 1], [w - 1, hh - 1]]) args.push("-draw", `color ${x},${y} floodfill`);
    }
    args.push("-trim", "+repage", "-resize", k === "C" ? "x1600>" : "1000x1000>", "-strip", p);
    im(...args);
  }
  const [width, height] = im(p, "-format", "%w %h", "info:").split(" ").map(Number);
  status[id] = { placeholder: false, missing: false, width, height, hash: sha(p) };
  changed++;
  console.log(`processed ${file} -> ${width}x${height}${k !== "B" ? "" : ""}`);
}
writeFileSync(STATUS, JSON.stringify(status, null, 2) + "\n");
const real = Object.values(status).filter((s) => !s.placeholder).length;
console.log(`${changed} processed · ${real}/${rows.length} real · status written to ${STATUS}`);
