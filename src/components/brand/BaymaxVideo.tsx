"use client";
import { useEffect, useRef, useState } from "react";

const BASE = "/assets/bh6/video/baymax-charging";

/**
 * Baymax inflating out of his charging case: muted inline MP4/WebM in a rounded card.
 * Loads only when near the viewport; under reduced motion only the poster still is shown.
 * `loop=false` plays once and calls onEnded.
 */
export function BaymaxVideo({ className = "", loop = true, onEnded, label = "Baymax inflating out of his charging case" }: { className?: string; loop?: boolean; onEnded?: () => void; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"poster" | "video">("poster");
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onEnded?.();
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMode("video");
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);
  return (
    <div ref={ref} role="img" aria-label={label} className={`overflow-hidden rounded-[22px] bg-[#F1F2F6] ring-1 ring-black/5 ${className}`}>
      {mode === "video" ? (
        <video autoPlay muted playsInline loop={loop} onEnded={onEnded} poster={`${BASE}-poster.jpg`} preload="none" className="block h-auto w-full" width={480} height={614} aria-hidden>
          <source src={`${BASE}.webm`} type="video/webm" />
          <source src={`${BASE}.mp4`} type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- tiny pre-sized poster, no optimiser needed
        <img src={`${BASE}-poster.jpg`} alt="" width={480} height={614} loading="lazy" className="block h-auto w-full" />
      )}
    </div>
  );
}
