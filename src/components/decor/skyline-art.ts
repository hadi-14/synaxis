/**
 * Original city silhouette in the spirit of a Japanese-Western harbour city: three depth layers of
 * varied towers (curved pagoda roofs with upturned eaves, set-backs, spires, slanted and rounded tops),
 * sparse window lights, a suspension bridge with torii-style towers in the centre, and small
 * wind-turbine blimps. Deterministic (seeded), one path per layer, no images.
 *
 * Built to static files by `npm run decor:build` (public/decor/skyline-*.svg) so the paths never sit in the HTML.
 * Sizing: the viewBox is 1600×300. Give the SVG `h-[max(150px,18.75vw)]` (= 100vw × 300/1600) so it
 * scales without cropping on wide screens; below ~800px the minimum height kicks in and `slice`
 * crops the sides, keeping the bridge centred.
 */
type Palette = { back: string; mid: string; front: string; bridge: string; win: string; blimp: string };

export const SKYLINE_RED: Palette = { back: "#C9232F", mid: "#B01B27", front: "#8E111C", bridge: "#7A0E17", win: "#E8636C", blimp: "#B01B27" };
export const SKYLINE_NIGHT: Palette = { back: "#131B2E", mid: "#101727", front: "#0C1220", bridge: "#0A0F1B", win: "#F2B35B", blimp: "#1A2440" };

const W = 1600, G = 300; // viewBox width, ground line
const BRIDGE_L = 560, BRIDGE_R = 1040; // bridge span (centred on 800)

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Curved roof with upturned eaves sitting on y, spanning x..x+w (overhangs both sides). */
const roof = (x: number, w: number, y: number, h = 10) => {
  const o = Math.max(5, w * 0.14);
  return `M${x - o} ${y - h * 0.55} Q${x + w * 0.12} ${y + 1} ${x + w * 0.3} ${y - h * 0.35} L${x + w / 2} ${y - h} L${x + w * 0.7} ${y - h * 0.35} Q${x + w * 0.88} ${y + 1} ${x + w + o} ${y - h * 0.55} L${x + w} ${y + 2} L${x} ${y + 2}Z`;
};
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;

type Kind = "pagoda" | "setback" | "spire" | "slant" | "round" | "box";

function building(x: number, w: number, h: number, kind: Kind) {
  const top = G - h;
  switch (kind) {
    case "pagoda": {
      // tower body + 2–3 tiers of curved roofs
      let d = rect(x, top + 12, w, h - 12) + roof(x, w, top + 12, 12);
      const tiers = w > 34 ? 3 : 2;
      let tw = w * 0.7, ty = top + 12 - 11;
      for (let i = 1; i < tiers; i++) {
        const tx = x + (w - tw) / 2;
        d += rect(tx, ty - 10, tw, 12) + roof(tx, tw, ty - 10, 10);
        ty -= 21;
        tw *= 0.7;
      }
      return d + rect(x + w / 2 - 1, ty - 4, 2, 14);
    }
    case "setback":
      return rect(x, top + h * 0.35, w, h * 0.65) + rect(x + w * 0.15, top + h * 0.12, w * 0.7, h * 0.3) + rect(x + w * 0.32, top, w * 0.36, h * 0.15);
    case "spire":
      return rect(x, top + 18, w, h - 18) + `M${x + w * 0.2} ${top + 19}L${x + w / 2} ${top - 6}L${x + w * 0.8} ${top + 19}Z` + rect(x + w / 2 - 0.75, top - 24, 1.5, 20);
    case "slant":
      return `M${x} ${G}V${top + 14}L${x + w} ${top}V${G}Z` + rect(x + w * 0.7, top - 10, 1.5, 12);
    case "round":
      return `M${x} ${G}V${top + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${top + w / 2}V${G}Z`;
    default:
      return rect(x, top, w, h) + (w > 30 ? rect(x + w * 0.2, top - 6, w * 0.25, 6) : "");
  }
}

function windows(r: () => number, x: number, w: number, h: number) {
  let d = "";
  if (w < 18) return d;
  for (let yy = G - h + 26; yy < G - 10; yy += 9)
    for (let xx = x + 5; xx < x + w - 5; xx += 7) if (r() < 0.16) d += `M${xx} ${yy}h2.4v2.4h-2.4Z`;
  return d;
}

function layer(seed: number, opts: { minH: number; maxH: number; minW: number; maxW: number; gap: number; bridgeMaxH?: number; win: boolean }) {
  const r = rng(seed);
  const kinds: Kind[] = ["pagoda", "setback", "spire", "slant", "round", "box", "pagoda", "setback"];
  let d = "", wd = "";
  for (let x = -20; x < W + 20; ) {
    const w = opts.minW + r() * (opts.maxW - opts.minW);
    const inBridge = x + w > BRIDGE_L - 30 && x < BRIDGE_R + 30;
    let h = opts.minH + r() * (opts.maxH - opts.minH);
    if (inBridge && opts.bridgeMaxH !== undefined) h = Math.min(h, opts.bridgeMaxH);
    const kind = h < 50 ? "box" : kinds[Math.floor(r() * kinds.length)];
    if (h > 12) {
      d += building(x, w, h, kind);
      if (opts.win) wd += windows(r, x, w, h);
    }
    x += w + opts.gap * r();
  }
  return { d, wd };
}

/** Suspension bridge with two torii-style towers; fully inside the viewBox. */
function bridge() {
  const deck = G - 52, top = 92;
  let d = rect(BRIDGE_L - 40, deck, BRIDGE_R - BRIDGE_L + 80, 7); // deck
  for (const cx of [690, 910]) {
    d += rect(cx - 15, top + 10, 7, G - top - 10) + rect(cx + 8, top + 10, 7, G - top - 10); // pillars
    d += `M${cx - 30} ${top - 2}Q${cx} ${top + 6} ${cx + 30} ${top - 2}L${cx + 26} ${top + 6}L${cx - 26} ${top + 6}Z`; // kasagi (upturned)
    d += rect(cx - 22, top + 9, 44, 4); // top tie
    d += rect(cx - 19, top + 28, 38, 4); // nuki
    d += rect(cx - 17, deck - 32, 34, 4); // lower tie
  }
  // main cables: anchor → tower → sag → tower → anchor
  const cables = `M${BRIDGE_L - 40} ${deck}Q${640} ${top + 40} ${690} ${top + 6}Q${800} ${deck - 32} ${910} ${top + 6}Q${960} ${top + 40} ${BRIDGE_R + 40} ${deck}`;
  // suspenders
  let s = "";
  for (let x = 700; x < 900; x += 14) {
    const t = (x - 690) / 220;
    const y = (1 - t) * (1 - t) * (top + 6) + 2 * (1 - t) * t * (deck - 32) + t * t * (top + 6);
    s += `M${x} ${y}V${deck}`;
  }
  for (const [a, b, c] of [[BRIDGE_L - 40, 640, 690], [BRIDGE_R + 40, 960, 910]] as const) {
    for (let k = 1; k < 6; k++) {
      const t = k / 6;
      const x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
      const y = (1 - t) * (1 - t) * deck + 2 * (1 - t) * t * (top + 40) + t * t * (top + 6);
      s += `M${x} ${y}V${deck}`;
    }
  }
  return { d, cables, s };
}

const BLIMPS = [
  { x: 250, y: 58, s: 1, delay: "0s" },
  { x: 1330, y: 44, s: 0.8, delay: "-2.5s" },
  { x: 1010, y: 30, s: 0.6, delay: "-4s" },
];

const BACK = layer(11, { minH: 90, maxH: 210, minW: 26, maxW: 60, gap: 8, win: false });
const MID = layer(29, { minH: 60, maxH: 170, minW: 22, maxW: 56, gap: 10, bridgeMaxH: 40, win: true });
const FRONT = layer(53, { minH: 30, maxH: 120, minW: 30, maxW: 70, gap: 26, bridgeMaxH: 22, win: true });
const BRIDGE = bridge();

/** The skyline as a standalone SVG document (used by scripts/build-decor.ts). */
export function skylineSvg(palette: Palette) {
  const blimps = BLIMPS.map(
    (b) => `<g transform="translate(${b.x} ${b.y}) scale(${b.s})"><g class="b" style="animation-delay:${b.delay}" fill="${palette.blimp}"><ellipse cx="0" cy="0" rx="40" ry="11"/><rect x="-9" y="9" width="18" height="6" rx="2"/><path d="M38 0l12-10 3 3-9 7 9 7-3 3z"/><rect x="-54" y="-1.5" width="14" height="3"/><path d="M-56 -12h3v24h-3z"/></g></g>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${G}" preserveAspectRatio="xMidYMax slice">` +
    `<style>.b{animation:bob 6s ease-in-out infinite alternate}@keyframes bob{from{transform:translateY(-3px)}to{transform:translateY(4px)}}@media (prefers-reduced-motion: reduce){.b{animation:none}}</style>` +
    `<path fill="${palette.back}" opacity=".75" d="${BACK.d}"/>` +
    blimps +
    `<path fill="${palette.mid}" d="${MID.d}"/><path fill="${palette.win}" opacity=".55" d="${MID.wd}"/>` +
    `<path fill="${palette.bridge}" d="${BRIDGE.d}"/><path fill="none" stroke="${palette.bridge}" stroke-width="3.5" d="${BRIDGE.cables}"/><path fill="none" stroke="${palette.bridge}" stroke-width="1.2" d="${BRIDGE.s}"/>` +
    `<path fill="${palette.front}" d="${FRONT.d}"/><path fill="${palette.win}" opacity=".5" d="${FRONT.wd}"/><rect fill="${palette.front}" x="0" y="${G - 6}" width="${W}" height="6"/>` +
    `</svg>`;
}
