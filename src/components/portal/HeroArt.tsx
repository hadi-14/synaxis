"use client";
import { useEffect, useRef } from "react";
import { BH6Image } from "@/components/brand/BH6Image";

/**
 * Hero art: ONE Baymax cutout standing straight on the coral section in a soft glow, overlapping
 * the section's bottom edge. Healthcare Baymax (Medical) / armoured Baymax (Battle).
 * No cards, frames or boxes; if the art is missing only the glow remains.
 */
export function HeroArt() {
  const fig = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => fig.current?.style.setProperty("transform", `translate3d(0, ${(Math.min(scrollY, 700) * -0.06).toFixed(1)}px, 0)`));
    };
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  return (
    // The hero section clips at the ticker's bottom edge; the figure runs behind the ticker (which sits on top).
    <div className="pointer-events-none relative -mb-11 h-[360px] w-full sm:h-[460px] md:h-[560px]">
      {/* soft light behind the figure (white on red, no blurred shadows) */}
      <div aria-hidden className="absolute bottom-0 left-1/2 h-[85%] w-[110%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.35),rgba(255,255,255,0))] battle:bg-[radial-gradient(closest-side,rgba(255,80,96,.4),rgba(255,80,96,0))]" />
      <div ref={fig} className="absolute inset-x-0 bottom-0 top-0 will-change-transform">
        <div className="h-full motion-safe:animate-[bob_3.4s_ease-in-out_infinite]">
          <div className="medical-only h-full">
            <BH6Image id="baymax-healthcare" priority sizes="(max-width: 768px) 80vw, 460px" className="mx-auto h-full w-auto object-contain object-bottom" />
          </div>
          <div className="battle-only h-full">
            {/* also eager: the theme is only known in the browser, and either Baymax can be the LCP image */}
            <BH6Image id="baymax-armor" priority sizes="(max-width: 768px) 80vw, 460px" className="mx-auto h-full w-auto object-contain object-bottom drop-shadow-[0_0_32px_rgba(255,80,96,.5)]" />
          </div>
        </div>
      </div>
      <style>{`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
    </div>
  );
}
