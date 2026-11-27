"use client";
import { useEffect, useRef } from "react";
import { HeuserMark } from "@/components/brand/Heuser";

/**
 * Heuser College mark as a large tone-on-tone brand shape behind the hero (and behind Baymax), bleeding ~20% off the
 * right edge. Desktop: the full hero height. Mobile: scaled down behind Baymax at the bottom. Slow parallax: it
 * drifts down while Baymax drifts up, so it reads as further back. Static with reduced motion.
 */
export function HeroWatermark() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => el.current?.style.setProperty("transform", `translate3d(0, ${(Math.min(scrollY, 900) * 0.05).toFixed(1)}px, 0)`));
    };
    addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on);
    };
  }, []);
  return (
    <div
      ref={el}
      aria-hidden
      className="pointer-events-none absolute bottom-11 right-0 -z-10 h-[400px] will-change-transform sm:h-[500px] md:bottom-0 md:top-0 md:h-auto"
    >
      <HeuserMark className="h-full w-auto translate-x-[20%] text-white opacity-[0.11] battle:opacity-[0.09]" />
    </div>
  );
}
