"use client";
import { useEffect } from "react";

/** Tap feedback: six microbots scatter from the tap point on buttons/links. Skips reduced motion. */
export function MicrobotBurst() {
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onDown = (e: PointerEvent) => {
      if (mq.matches) return;
      const el = (e.target as HTMLElement | null)?.closest(".btn, [data-burst]");
      if (!el) return;
      for (let i = 0; i < 6; i++) {
        const dot = document.createElement("span");
        dot.className = "microbot-dot";
        const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
        const r = 18 + Math.random() * 14;
        dot.style.left = `${e.clientX - 3}px`;
        dot.style.top = `${e.clientY - 3}px`;
        dot.style.setProperty("--dx", `${Math.cos(a) * r}px`);
        dot.style.setProperty("--dy", `${Math.sin(a) * r}px`);
        if (i % 3 === 0) dot.style.background = "var(--primary)";
        document.body.appendChild(dot);
        dot.addEventListener("animationend", () => dot.remove(), { once: true });
      }
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
