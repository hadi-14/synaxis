"use client";
import Link from "next/link";
import { useRef } from "react";
import { Motif } from "@/components/brand/Motif";
import { foundSecret } from "@/components/eggs/secrets";
import type { Module } from "@/lib/types";

/** Module card: Hiro's lab hologram tilt + character colour scanline on hover. */
export function ModuleCard({ m }: { m: Module }) {
  const ref = useRef<HTMLAnchorElement>(null);
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
      className="card group relative flex h-full flex-col overflow-hidden p-5 transition-[transform,box-shadow,border-color] duration-200 hover:border-[var(--accent-c)] focus-visible:border-[var(--accent-c)]"
      style={{ "--accent-c": m.accent } as React.CSSProperties}
    >
      {/* hologram scanline */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-1/2 h-1/2 bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--accent-c)_22%,transparent)] to-transparent opacity-0 transition-[top,opacity] duration-500 group-hover:top-full group-hover:opacity-100"
      />
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: m.accent }} />
      <div className="flex items-start justify-between gap-3">
        <Motif motif={m.motif} accent={m.accent} className="h-14 w-14 text-[var(--ink)]" />
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
            {m.subject}
          </span>
          {m.is_compulsory && (
            <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--primary-ink)]">
              Compulsory
            </span>
          )}
        </div>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold leading-tight">{m.name}</h3>
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
        <svg aria-hidden viewBox="0 0 20 12" className="absolute bottom-2 right-2 h-3 w-5 opacity-20 transition-opacity group-hover:opacity-70" data-egg="tadashi-cap" onPointerEnter={() => foundSecret("tadashi-cap")}>
          <path d="M2 9c0-4 3-7 8-7s8 3 8 7z" fill="currentColor" />
        </svg>
      )}
    </Link>
  );
}
