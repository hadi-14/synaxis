"use client";
import { useEffect } from "react";

/**
 * One idle-loaded helper for all server-rendered decor, instead of a client component per element:
 * - .mb-chain dividers get .rippling once when they enter the viewport (one light pulse)
 * - [data-ambient] layers run their drift only while on screen (--ambient-play)
 */
export function DecorObservers() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (el.classList.contains("mb-chain")) {
            if (e.isIntersecting) {
              el.classList.add("rippling");
              io.unobserve(el);
            }
          } else el.style.setProperty("--ambient-play", e.isIntersecting ? "running" : "paused");
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    const watch = () => document.querySelectorAll(".mb-chain:not(.rippling), [data-ambient]").forEach((el) => io.observe(el));
    watch();
    // pages change without a reload: re-scan when the main content is swapped
    const mo = new MutationObserver(watch);
    const main = document.getElementById("main");
    if (main) mo.observe(main, { childList: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
