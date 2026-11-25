"use client";
import { useEffect, useRef } from "react";
import { BH6Image } from "@/components/brand/BH6Image";

/**
 * Hero: real Baymax over the San Fransokyo skyline with three parallax layers.
 * Healthcare Baymax + day skyline in Medical Mode; armoured Baymax + night skyline in Battle Mode
 * (theme-swapped with CSS; only the visible pair is fetched because both are lazy).
 */
export function HeroArt() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = [...(root.current?.querySelectorAll<HTMLElement>("[data-depth]") ?? [])];
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(scrollY, 900);
        for (const l of layers) l.style.transform = `translate3d(0, ${(y * Number(l.dataset.depth)).toFixed(1)}px, 0)`;
      });
    };
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  return (
    <div ref={root} className="relative mx-auto aspect-[5/4] w-full max-w-[560px]">
      {/* layer 1: skyline (slowest) */}
      <div data-depth="0.12" className="absolute inset-0 overflow-hidden rounded-[var(--radius)] will-change-transform">
        <div className="medical-only absolute inset-0"><BH6Image id="san-fransokyo-day" fill decorative sizes="(max-width: 768px) 100vw, 560px" className="object-cover" fallbackClassName="h-full w-full" /></div>
        <div className="battle-only absolute inset-0"><BH6Image id="san-fransokyo-night" fill decorative sizes="(max-width: 768px) 100vw, 560px" className="object-cover" fallbackClassName="h-full w-full" /></div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
      </div>
      {/* layer 2: microbot ring */}
      <svg data-depth="0.06" viewBox="0 0 500 400" aria-hidden className="absolute inset-0 h-full w-full will-change-transform">
        <g fill="var(--primary)" opacity=".55">
          {Array.from({ length: 26 }, (_, i) => {
            const a = (i / 26) * Math.PI * 2;
            return <rect key={i} x={250 + Math.cos(a) * 190 - 4} y={215 + Math.sin(a) * 150 - 2.5} width="8" height="5" rx="1.5" />;
          })}
        </g>
      </svg>
      {/* layer 3: Baymax (fastest, bobbing) */}
      <div data-depth="-0.05" className="absolute inset-x-[16%] bottom-[2%] top-[6%] will-change-transform">
        <div className="h-full motion-safe:animate-[bob_3.2s_ease-in-out_infinite]">
          <div className="medical-only h-full"><BH6Image id="baymax-healthcare" className="mx-auto h-full w-auto object-contain drop-shadow-2xl" sizes="(max-width: 768px) 70vw, 380px" fallbackClassName="mx-auto h-full" /></div>
          <div className="battle-only h-full"><BH6Image id="baymax-armor" className="mx-auto h-full w-auto object-contain drop-shadow-[0_0_40px_rgba(242,75,89,.45)]" sizes="(max-width: 768px) 70vw, 380px" fallbackClassName="mx-auto h-full" /></div>
        </div>
      </div>
      <style>{`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
    </div>
  );
}
