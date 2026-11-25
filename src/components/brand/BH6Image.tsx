"use client";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { bh6 } from "@/lib/bh6-assets";
import { Motif } from "./Motif";

const DEV = process.env.NODE_ENV === "development";
const subscribe = () => () => {};
const debugFlag = () => new URLSearchParams(location.search).get("debug") === "assets";

/**
 * Big Hero 6 artwork slot.
 * - Real file present  → next/image (AVIF/WebP, lazy unless `priority`).
 * - Still a placeholder → live site: themed fallback (accent colour + prop icon + microbot pattern);
 *   development or ?debug=assets: the labelled placeholder image.
 */
export function BH6Image({
  id,
  className = "",
  sizes = "(max-width: 640px) 60vw, 360px",
  priority = false,
  decorative = false,
  fill = false,
  fallbackClassName = "",
}: {
  id: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
  fill?: boolean;
  fallbackClassName?: string;
}) {
  const a = bh6(id);
  const debug = useSyncExternalStore(subscribe, debugFlag, () => false);
  const showFile = a.real || DEV || debug;
  if (!showFile) return <BH6Fallback id={id} className={`${className} ${fallbackClassName}`} decorative={decorative} />;
  const common = { src: a.src, alt: decorative ? "" : a.alt, sizes, priority, className, ...(priority ? {} : { loading: "lazy" as const }) };
  return fill ? <Image {...common} alt={common.alt} fill /> : <Image {...common} alt={common.alt} width={a.width} height={a.height} />;
}

/** Themed stand-in used on the live site until the real art is added. */
export function BH6Fallback({ id, className = "", decorative = false }: { id: string; className?: string; decorative?: boolean }) {
  const a = bh6(id);
  const shape = a.kind === "background" ? "" : a.kind === "prop" ? "rounded-full aspect-square" : "rounded-[40%_40%_24px_24px] aspect-[3/4]";
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : a.alt}
      aria-hidden={decorative || undefined}
      className={`relative grid place-items-center overflow-hidden ${shape} ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${a.accent} 16%, transparent)`,
        backgroundImage: `radial-gradient(color-mix(in srgb, ${a.accent} 45%, transparent) 1.4px, transparent 1.6px)`,
        backgroundSize: "14px 14px",
      }}
    >
      {a.kind !== "background" && <Motif motif={a.motif} accent={a.accent} className="w-1/2 max-w-[160px] text-[var(--ink)] opacity-80" />}
    </div>
  );
}
