// Traces public/logo/synaxis-logo-trimmed.png into a two-colour SVG (grey letters + red X).
// Usage: node scripts/trace-logo.mjs   (requires ImageMagick `magick` on PATH and the `potrace` dev dep)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import potrace from "potrace";

const src = "public/logo/synaxis-logo-trimmed.png";
const dir = mkdtempSync(join(tmpdir(), "synaxis-trace-"));
const W = 890, H = 126;

// Build black-on-white masks per colour: red = high R, low G; grey = opaque and not red.
const red = join(dir, "red.png"), grey = join(dir, "grey.png");
execFileSync("magick", [src, "-background", "white", "-alpha", "remove", "-fx", "(r-g>0.25)?0:1", "-colorspace", "gray", red]);
execFileSync("magick", [src, "-alpha", "extract", "-threshold", "50%", "-negate", join(dir, "alpha.png")]);
// grey mask = opaque pixels that are not red: lighten(alpha mask, inverted red mask)
execFileSync("magick", [join(dir, "alpha.png"), "(", red, "-negate", ")", "-compose", "lighten", "-composite", grey]);

const trace = (file) => new Promise((res, rej) =>
  potrace.trace(readFileSync(file), { threshold: 128, turdSize: 4, optTolerance: 0.3 }, (err, svg) => err ? rej(err) : res(svg)));
const pathOf = (svg) => svg.match(/ d="([^"]+)"/)[1];

const [g, r] = await Promise.all([trace(grey), trace(red)]);
const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t"><title id="t">SYNAXIS</title>
  <path class="synaxis-letters" fill="#737375" fill-rule="evenodd" d="${pathOf(g)}"/>
  <path class="synaxis-x" fill="#DC2A35" fill-rule="evenodd" d="${pathOf(r)}"/>
</svg>
`;
writeFileSync("public/logo/synaxis-logo.svg", out);
console.log("wrote public/logo/synaxis-logo.svg", out.length, "bytes");
