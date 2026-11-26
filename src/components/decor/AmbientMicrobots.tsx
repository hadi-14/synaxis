"use client";
import { useEffect, useRef } from "react";

/**
 * A few microbots drifting slowly in the background of a section. CSS-transform animation,
 * paused while the section is off-screen; static under reduced motion. Positions are deterministic (no hydration mismatch).
 */
export function AmbientMicrobots({ count = 8, className = "" }: { count?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.style.setProperty("--ambient-play", e.isIntersecting ? "running" : "paused"));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ "--ambient-play": "paused" } as React.CSSProperties}>
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37 + 11) % 96, top = (i * 53 + 7) % 90, dur = 18 + (i % 5) * 5, delay = -(i * 3.1);
        return (
          <span
            key={i}
            className="absolute block h-[5px] w-[8px] rounded-[2px] bg-current motion-safe:animate-[drift_var(--d)_ease-in-out_infinite_alternate]"
            style={{ left: `${left}%`, top: `${top}%`, opacity: 0.18 + (i % 3) * 0.06, "--d": `${dur}s`, animationDelay: `${delay}s`, animationPlayState: "var(--ambient-play)" } as React.CSSProperties}
          />
        );
      })}
      <style>{`@keyframes drift{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(28px,-18px) rotate(20deg)}100%{transform:translate(-22px,14px) rotate(-12deg)}}`}</style>
    </div>
  );
}
