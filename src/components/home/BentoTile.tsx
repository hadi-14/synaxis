import Link from "next/link";
import { BH6Image } from "@/components/brand/BH6Image";
import { CODE_PROPS, CodeProp } from "@/components/decor/CodeProps";
import { MODULE_ART } from "@/lib/bh6-assets";
import type { Module } from "@/lib/types";

/**
 * Module bento tile. Featured (compulsory) tile: dark case board with the Yokai cutout, the kabuki mask
 * and a COMPULSORY stamp. Other tiles: the hero's suit colour as the panel (darkened only enough for
 * white text), armour seams, the prop icon, and the character cutout sliding in on hover/focus.
 * "Open the file": a case-file folder slides over the tile, then the module page opens (DecorObservers).
 * Server component: no per-tile hydration.
 */
export type TileModule = Pick<Module, "slug" | "name" | "subject" | "character" | "tagline" | "motif">;

export function BentoTile({ m, panel, featured = false }: { m: TileModule; panel: string; featured?: boolean }) {
  const art = MODULE_ART[m.motif] ?? MODULE_ART.microbots;
  const href = `/modules/${m.slug}`;
  return (
    <Link
      href={href}
      className={`bento-tile group relative isolate flex h-full flex-col overflow-hidden text-white ${featured ? "min-h-[300px] p-6 sm:p-8" : "min-h-[180px] p-4 sm:p-5"}`}
      style={{ "--panel": panel, background: featured ? "#120B12" : panel } as React.CSSProperties}
    >
      {/* armour panel seams */}
      <span aria-hidden className="bento-seams absolute inset-0 -z-10" />
      {featured ? (
        <>
          <span aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_80%_40%,rgba(220,42,53,.55),transparent_70%)]" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB3B9]">Case file 01 · {m.subject}</span>
          <h3 className="mt-3 max-w-[11ch] pr-16 font-display text-3xl font-extrabold leading-[1.05] sm:pr-0 sm:text-5xl">{m.name}</h3>
          <p className="mt-2 font-semibold text-[#FFD6DA]">{m.character}</p>
          <p className="mt-3 max-w-[20ch] text-sm text-white/80 sm:max-w-[30ch] sm:text-base">{m.tagline}</p>
          <span aria-hidden className="stamp mt-5 self-start">Compulsory</span>
          <span className="mt-auto pt-6 font-bold">Open the file <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
          <span aria-hidden className="pointer-events-none absolute -right-6 bottom-0 top-20 w-[44%] max-w-[320px] sm:top-6 sm:w-[52%]">
            <BH6Image id={art.character} decorative sizes="(max-width: 640px) 50vw, 320px" className="h-full w-full object-contain object-bottom drop-shadow-[0_10px_30px_rgba(0,0,0,.5)] transition-transform duration-500 group-hover:-translate-y-2" fallback="hide" />
          </span>
          <span aria-hidden className="pointer-events-none absolute right-5 top-5 w-14 rotate-[-12deg] opacity-95 sm:w-16">
            <BH6Image id={art.prop} decorative sizes="80px" className="h-auto w-full object-contain" fallback="hide" />
          </span>
        </>
      ) : (
        <>
          <span className="flex items-start justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">{m.subject}</span>
            <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/20 sm:h-12 sm:w-12">
              {CODE_PROPS.has(art.prop) ? (
                <CodeProp id={art.prop} color="#FFB8D6" className="h-7 w-7 sm:h-9 sm:w-9" />
              ) : (
                <BH6Image id={art.prop} decorative sizes="40px" className={`h-7 w-7 object-contain sm:h-9 sm:w-9 ${art.prop === "microbot" ? "rotate-[35deg]" : ""}`} fallback="hide" />
              )}
            </span>
          </span>
          <h3 className="mt-3 max-w-[16ch] font-display text-lg font-extrabold leading-tight sm:text-xl">{m.name}</h3>
          <p className="mt-1 text-sm font-semibold text-white/85">{m.character}</p>
          <span className="mt-auto pt-4 text-sm font-bold">Open the file <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
          {/* character peeks in on hover/focus */}
          <span aria-hidden className="pointer-events-none absolute -bottom-2 -right-3 h-[78%] w-[46%] translate-x-6 translate-y-6 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none">
            <BH6Image id={art.character} decorative sizes="160px" className="h-full w-full object-contain object-bottom drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]" fallback="hide" />
          </span>
        </>
      )}
      {/* case-file folder that slides over the tile on open */}
      <span aria-hidden className="case-file pointer-events-none absolute inset-0 z-10 flex items-start p-4">
        <span className="rounded-t-md bg-[#E9D9B5] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A4520]">Case file · {m.name}</span>
      </span>
    </Link>
  );
}
