"use client";
import Link from "next/link";
import { useRef } from "react";
import { BH6Image } from "@/components/brand/BH6Image";
import { foundSecret } from "@/components/eggs/secrets";
import { MODULE_ART } from "@/lib/bh6-assets";
import type { Module } from "@/lib/types";

/**
 * Module card: the character cutout breaks out of the frame on hover (Hiro's lab hologram tilt),
 * and the character's prop is the effect (chem ball, maglev disc, plasma blade, kabuki mask…).
 */
export function ModuleCard({ m }: { m: Module }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const art = MODULE_ART[m.motif] ?? MODULE_ART.microbots;
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.transform = `perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
  };
  const reset = () => ref.current && (ref.current.style.transform = "");
  return (
    <Link
      ref={ref}
      href={`/modules/${m.slug}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="card group relative mt-14 flex h-[calc(100%-3.5rem)] flex-col p-5 pt-28 transition-[transform,box-shadow,border-color] duration-200 hover:border-[var(--accent-c)] focus-visible:border-[var(--accent-c)]"
      style={{ "--accent-c": m.accent } as React.CSSProperties}
    >
      {/* accent glow + top bar (clipped to the card) */}
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: m.accent }} />
        <span className="absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-30 blur-2xl" style={{ background: m.accent }} />
      </span>
      {/* character breaks out of the frame on hover */}
      <span aria-hidden className="pointer-events-none absolute -top-14 left-4 h-40 w-32 origin-bottom transition-transform duration-300 ease-out group-hover:-translate-y-3 group-hover:scale-110 motion-reduce:transition-none">
        <BH6Image id={art.character} decorative sizes="128px" className="h-full w-full object-contain object-bottom drop-shadow-xl" fallbackClassName="h-full w-full" />
      </span>
      {/* prop effect */}
      <span aria-hidden className="pointer-events-none absolute right-5 top-6 h-14 w-14 opacity-0 transition-all duration-300 group-hover:rotate-[20deg] group-hover:opacity-100 motion-reduce:transition-none">
        <BH6Image id={art.prop} decorative sizes="56px" className="h-full w-full object-contain" fallbackClassName="h-full w-full" />
      </span>
      <div className="absolute right-5 top-4 flex flex-col items-end gap-1 transition-opacity group-hover:opacity-0">
        <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">{m.subject}</span>
        {m.is_compulsory && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--primary)] py-1 pl-1 pr-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primary-ink)]">
            <span className="h-4 w-4 overflow-hidden rounded-full bg-white/70"><BH6Image id="kabuki-mask" decorative sizes="16px" className="h-full w-full object-contain" fallbackClassName="h-full w-full" /></span>
            Compulsory
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-bold leading-tight">{m.name}</h3>
      <p className="mt-1 text-sm font-semibold" style={{ color: "color-mix(in srgb, var(--accent-c) 70%, var(--ink))" }}>
        {m.character}
      </p>
      <p className="mt-3 flex-1 text-sm text-[var(--ink-muted)]">{m.tagline}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--primary-text)]">
        Open the file
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </span>
      {/* easter egg: Tadashi's cap tucked in the Hangar card */}
      {m.motif === "blueprint" && (
        <span aria-hidden className="absolute bottom-2 right-2 h-5 w-6 opacity-25 transition-opacity group-hover:opacity-80" onPointerEnter={() => foundSecret("tadashi-cap")}>
          <BH6Image id="tadashi-cap" decorative sizes="24px" className="h-full w-full object-contain" fallbackClassName="h-full w-full" />
        </span>
      )}
    </Link>
  );
}
