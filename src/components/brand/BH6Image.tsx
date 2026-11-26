"use client";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { bh6 } from "@/lib/bh6-assets";
import { Motif } from "./Motif";

const subscribe = () => () => {};
const debugFlag = () => new URLSearchParams(location.search).get("debug") === "assets";

/**
 * Big Hero 6 artwork slot.
 * - Real file present → next/image (AVIF/WebP, lazy unless `priority`).
 * - Still missing/placeholder → `fallback="icon"` shows the small prop icon, `fallback="hide"` renders nothing.
 *   Labelled placeholder images only appear with ?debug=assets (never by default, never as dark boxes).
 */
export function BH6Image({
  id,
  className = "",
  sizes = "(max-width: 640px) 60vw, 360px",
  priority = false,
  decorative = false,
  fill = false,
  fallback = "hide",
  iconClassName = "h-9 w-9",
}: {
  id: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
  fill?: boolean;
  fallback?: "icon" | "hide";
  iconClassName?: string;
}) {
  const a = bh6(id);
  const debug = useSyncExternalStore(subscribe, debugFlag, () => false);
  if (!a.real && !debug) {
    if (fallback === "hide") return null;
    return (
      <Motif
        motif={a.motif}
        accent={a.accent}
        className={`${iconClassName} text-[var(--ink)]`}
        {...(decorative ? {} : { label: a.alt })}
      />
    );
  }
  const alt = decorative ? "" : a.alt;
  const common = { src: a.src, alt, sizes, priority, className, ...(priority ? {} : { loading: "lazy" as const }) };
  return fill ? <Image {...common} alt={alt} fill /> : <Image {...common} alt={alt} width={a.width} height={a.height} />;
}

/** True when the real file exists (lets callers drop wrappers/glows for missing art). */
export function useBH6Real(id: string) {
  return bh6(id).real;
}
