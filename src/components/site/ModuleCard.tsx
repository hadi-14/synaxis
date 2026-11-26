"use client";
import Link from "next/link";
import { useRef } from "react";
import { Motif } from "@/components/brand/Motif";
import { BH6Image } from "@/components/brand/BH6Image";
import { foundSecret } from "@/components/eggs/secrets";
import { MODULE_ART, bh6 } from "@/lib/bh6-assets";
import type { Module } from "@/lib/types";

/**
 * Light, scannable module card: red top line, small prop icon, accent dot, red link.
 * On hover only, a 48px round character avatar appears next to the character name
 * (not rendered at all while that art is missing). Hiro's lab hologram tilt on desktop.
 */
export function ModuleCard({ m }: { m: Module }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const art = MODULE_ART[m.motif] ?? MODULE_ART.microbots;
  const hasAvatar = bh6(art.character).real;
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.transform = `perspective(700px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
  };
  const reset = () => ref.current && (ref.current.style.transform = "");
  return (
    <Link
      ref={ref}
      href={`/modules/${m.slug}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius)] bg-[var(--band-card)] p-5 shadow-[0_8px_0_var(--band-deep)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_4px_0_var(--band-deep)] focus-visible:shadow-[0_4px_0_var(--band-deep)]"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[var(--primary)]" />
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${m.accent} 16%, transparent)` }}>
          <Motif motif={m.motif} accent={m.accent} className="h-9 w-9 text-[var(--ink)]" />
        </span>
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: m.accent }} />
            {m.subject}
          </span>
          {m.is_compulsory && (
            <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primary-ink)]">Compulsory</span>
          )}
        </div>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold leading-tight text-[var(--ink)]">{m.name}</h3>
      <p className="mt-1 flex items-center text-sm font-semibold" style={{ color: `color-mix(in srgb, ${m.accent} 70%, var(--ink))` }}>
        {hasAvatar && (
          <span aria-hidden className="mr-0 h-12 w-0 overflow-hidden rounded-full opacity-0 transition-all duration-300 group-hover:mr-2 group-hover:w-12 group-hover:opacity-100 motion-reduce:transition-none">
            <BH6Image id={art.character} decorative sizes="48px" className="h-12 w-12 rounded-full object-cover object-top" />
          </span>
        )}
        {m.character}
      </p>
      <p className="mt-3 flex-1 text-sm text-[var(--ink-muted)]">{m.tagline}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--primary-text)]">
        Open the file
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </span>
      {m.motif === "blueprint" && (
        <span aria-hidden className="absolute bottom-2 right-2 h-4 w-5 opacity-20 transition-opacity group-hover:opacity-70" onPointerEnter={() => foundSecret("tadashi-cap")}>
          <BH6Image id="tadashi-cap" decorative sizes="20px" className="h-full w-full object-contain" fallback="icon" iconClassName="h-4 w-5" />
        </span>
      )}
    </Link>
  );
}
