"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * HUD "diagnostic" panel: when it scrolls into view a scan line sweeps down and each row resolves
 * from a scrambled readout into its value with a check mark. Values are real DOM text from the start
 * (screen readers and no-JS see them); the scramble is aria-hidden decoration. Reduced motion: static.
 */
export function ScanReadout({ rows, title = "Diagnostic · Synaxis S1" }: { rows: [label: string, value: string, icon?: ReactNode][]; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = useState(rows.length); // SSR/no-JS: everything resolved
  const [scanning, setScanning] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setResolved(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setScanning(true);
      rows.forEach((_, i) => setTimeout(() => setResolved(i + 1), 260 + i * 230));
      setTimeout(() => setScanning(false), 260 + rows.length * 230 + 200);
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [rows]);
  return (
    <div ref={ref} className="hud-panel relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--hud-line)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--hud-dim)]">
        <span className="flex items-center gap-2"><span aria-hidden className="h-2 w-2 rounded-full bg-[var(--hud-accent)] motion-safe:animate-pulse" />{title}</span>
        <span aria-hidden>{resolved >= rows.length ? "Scan complete" : "Scanning…"}</span>
      </div>
      <dl className="grid sm:grid-cols-2">
        {rows.map(([k, v, icon], i) => {
          const done = i < resolved;
          return (
            <div key={k} className="relative border-b border-[var(--hud-line)] px-5 py-4 pr-14 sm:[&:nth-child(odd)]:border-r">
              <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--hud-dim)]">{k}</dt>
              <dd className="relative mt-1 font-display text-lg font-bold leading-snug sm:text-xl">
                <span className={`${icon ? "inline-flex items-center gap-2" : ""} ${done ? "" : "opacity-0"}`}>{icon}{v}</span>
                {!done && <span aria-hidden className="absolute inset-0 font-mono text-base tracking-widest text-[var(--hud-dim)]">{"▒".repeat(Math.min(14, v.length))}</span>}
                <span aria-hidden className={`absolute -right-9 top-0 grid h-7 w-7 place-items-center rounded-full border-2 transition-all duration-300 ${done ? "scale-100 border-[var(--hud-accent)] text-[var(--hud-accent)]" : "scale-75 border-[var(--hud-line)] text-transparent"}`}>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      {scanning && <span aria-hidden className="hud-scan pointer-events-none absolute inset-x-0 top-0 h-16" />}
    </div>
  );
}
