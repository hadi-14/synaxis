/** Small colour helpers for readable tiles (sRGB, WCAG contrast). */
const hex = (h: string) => {
  const v = h.replace("#", "");
  const n = parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export const luminance = (h: string) => {
  const [r, g, b] = hex(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const toHex = (rgb: number[]) => "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
export const mix = (a: string, b: string, t: number) => {
  const [p, q] = [hex(a), hex(b)];
  return toHex(p.map((c, i) => c + (q[i] - c) * t));
};
/** The suit colour, darkened toward ink only as much as needed for white text (≥ 4.5:1). */
export function readableOnWhite(accent: string, ink = "#0B1220") {
  for (let t = 0; t <= 0.85; t += 0.05) {
    const c = mix(accent, ink, t);
    if (contrast(c, "#FFFFFF") >= 4.5) return c;
  }
  return mix(accent, ink, 0.85);
}
