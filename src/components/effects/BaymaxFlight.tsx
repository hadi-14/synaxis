"use client";
import { useEffect, useRef, useState } from "react";
import { Baymax } from "@/components/brand/Baymax";

/**
 * Scroll progress = armoured Baymax flying down the right edge (≥640px).
 * Thruster flame ∝ scroll velocity; idles with a bob when still; lands at the footer.
 * Phones keep the thin coral rail. Reduced motion: static Baymax at the current %, no flame.
 */
export function BaymaxFlight() {
  const rail = useRef<HTMLDivElement>(null);
  const bot = useRef<HTMLDivElement>(null);
  const [flame, setFlame] = useState(0);
  const [landed, setLanded] = useState(false);
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastY = scrollY, lastT = performance.now(), v = 0, raf = 0, idleT: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      rail.current?.style.setProperty("--p", String(p));
      // Baymax travels from below the header to just above the bottom edge
      const top = 80, bottom = innerHeight - 110;
      bot.current?.style.setProperty("transform", `translate3d(0, ${top + (bottom - top) * p}px, 0)`);
      setLanded(p > 0.985);
    };
    const tick = () => {
      v *= 0.9;
      setFlame(reduced ? 0 : Math.min(1, v));
      if (v > 0.02) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(scrollY - lastY), dt = Math.max(16, now - lastT);
      v = Math.max(v, Math.min(1, (dy / dt) * 0.5));
      lastY = scrollY;
      lastT = now;
      update();
      setIdle(false);
      clearTimeout(idleT);
      idleT = setTimeout(() => setIdle(true), 220);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", update);
      cancelAnimationFrame(raf);
      clearTimeout(idleT);
    };
  }, []);

  return (
    <>
      <div ref={rail} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] sm:hidden">
        <div className="h-full origin-left bg-[var(--primary)]" style={{ transform: "scaleX(var(--p, 0))" }} />
      </div>
      <div aria-hidden className="pointer-events-none fixed right-1 top-0 z-40 hidden h-dvh w-12 sm:block">
        {/* flight path: dotted microbot trail */}
        <div className="absolute bottom-24 right-[22px] top-24 w-0 border-l-2 border-dotted border-[var(--line-strong)]/40" />
        <div ref={bot} className="absolute right-0 top-0 w-11 will-change-transform">
          <div className={idle && !landed ? "motion-safe:animate-[bmx-bob_2.4s_ease-in-out_infinite]" : ""} style={{ transform: `rotate(${landed ? 0 : -flame * 8}deg)`, transition: "transform 200ms" }}>
            <Baymax armour flame={landed ? 0 : Math.max(0.15, flame)} pose={landed ? "wave" : "idle"} className="w-full drop-shadow-[0_6px_10px_rgba(0,0,0,.25)]" />
          </div>
          {landed && <div className="mx-auto mt-0.5 h-1 w-8 rounded-full bg-[var(--primary)] opacity-60" />}
        </div>
      </div>
      <style>{`@keyframes bmx-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </>
  );
}
