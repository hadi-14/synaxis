// Cuts Baymax's armoured forearm + fist out of public/assets/bh6/baymax-armor.png (not redrawn) for the
// rocket-fist scroll indicator:  node scripts/make-rocket-fist.mjs
// A polygon mask (crop coordinates) keeps the forearm shell and knuckles and drops the torso and upper arm;
// the result is trimmed and saved transparent at 224px tall (4× the ~56px display size).
import sharp from "sharp";

const SRC = "public/assets/bh6/baymax-armor.png";
const OUT = "public/assets/bh6/derived/rocket-fist.png";
const L = 700, T = 300, W = 363, H = 640;
const POLY = "74,160 105,128 140,110 190,101 250,106 303,130 338,168 355,225 360,320 355,420 342,500 318,560 296,602 250,622 180,626 110,618 62,598 44,560 44,505 56,460 64,390 62,300 64,220";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><filter id="f"><feGaussianBlur stdDeviation="1.2"/></filter><polygon points="${POLY}" fill="#fff" filter="url(#f)"/></svg>`;

const crop = await sharp(SRC).extract({ left: L, top: T, width: W, height: H }).ensureAlpha().raw().toBuffer();
const mask = await sharp(Buffer.from(svg)).resize(W, H).extractChannel(0).raw().toBuffer();
for (let i = 0; i < W * H; i++) crop[i * 4 + 3] = Math.min(crop[i * 4 + 3], mask[i]); // keep the art's own alpha too
const cut = await sharp(crop, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
const trimmed = await sharp(cut).trim({ threshold: 1 }).toBuffer();
const info = await sharp(trimmed).resize({ height: 224 }).png({ compressionLevel: 9 }).toFile(OUT);
console.log(OUT, `${info.width}×${info.height}`, `${(info.size / 1024).toFixed(1)} KB`);
