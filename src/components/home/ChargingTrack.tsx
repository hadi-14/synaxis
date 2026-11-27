"use client";
import { useEffect, useRef, useState } from "react";
import { BaymaxVideo } from "@/components/brand/BaymaxVideo";

const SHAPES = ["chip-pill", "chip-hex", "chip-ticket", "chip-shield"];

/**
 * Registration steps along a charging track. Each step lights up as it scrolls into view and the battery
 * gains a cell; when the last step lights up, the Baymax charging video plays (lazy). Reduced motion /
 * no JS: everything is lit and the video shows its poster.
 */
export function ChargingTrack({ steps, microbot }: { steps: [string, string][]; microbot: string }) {
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const [lit, setLit] = useState(steps.length);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start uncharged only when JS can animate it
    setLit(0);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = refs.current.indexOf(e.target as HTMLLIElement);
          setLit((n) => Math.max(n, i + 1));
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [steps.length]);
  const full = lit >= steps.length;
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_200px]">
      <ol className="charge-track relative grid gap-6 md:grid-cols-4 md:gap-4" style={{ "--mb": `url("${microbot}")` } as React.CSSProperties}>
        {/* the chain the steps hang on */}
        <span aria-hidden className="track-chain absolute left-[27px] top-6 bottom-6 w-[10px] md:left-6 md:right-6 md:top-[27px] md:bottom-auto md:h-[10px] md:w-auto" />
        {steps.map(([t, d], i) => (
          <li key={t} ref={(el) => { refs.current[i] = el; }} className={`relative flex gap-4 md:flex-col md:gap-3 ${i < lit ? "is-lit" : ""}`}>
            <span className={`step-chip ${SHAPES[i % SHAPES.length]} relative z-10 grid h-14 w-14 shrink-0 place-items-center font-mono text-lg font-extrabold`}>{i + 1}</span>
            <span className="step-label">
              <span className="block font-display text-base font-bold">{t}</span>
              <span className="mt-1 block text-sm text-[var(--ink-muted)]">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-4 lg:flex-col">
        <div className="battery-big" role="img" aria-label={`Registration charge: ${lit} of ${steps.length}`}>
          {steps.map((_, i) => <span key={i} className={i < lit ? "on" : ""} />)}
        </div>
        <div className={`w-28 transition-opacity duration-500 lg:w-40 ${full ? "opacity-100" : "opacity-40"}`}>
          {full ? <BaymaxVideo className="shadow-md" label="Baymax charging up: your team is ready" /> : <div className="aspect-[480/614] rounded-[22px] bg-[var(--surface-2)]" />}
        </div>
      </div>
    </div>
  );
}
