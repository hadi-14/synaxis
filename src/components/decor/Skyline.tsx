/**
 * Skyline silhouette, served as a static, cacheable SVG (generated from skyline-art.ts by
 * `npm run decor:build`). object-cover + object-bottom = the old xMidYMax slice: on narrow screens the
 * sides are cropped and the bridge stays centred.
 */
export function Skyline({ className = "", variant = "red", eager = false }: { className?: string; variant?: "red" | "night"; eager?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- static vector art; the image optimiser would rasterise it
  return <img src={`/decor/skyline-${variant}.svg?v=2`} alt="" aria-hidden width={1600} height={300} loading={eager ? "eager" : "lazy"} decoding="async" className={`object-cover object-bottom ${className}`} />;
}
