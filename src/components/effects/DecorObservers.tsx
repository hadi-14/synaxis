"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * One idle-loaded helper for all server-rendered decor, instead of a client component per element:
 * - .mb-chain dividers get .rippling once when they enter the viewport (one light pulse)
 * - [data-ambient] layers run their drift only while on screen (--ambient-play)
 * - a.bento-tile: plain left click plays the case-file slide, then navigates (modifier clicks untouched)
 */
export function DecorObservers() {
  const router = useRouter();
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest<HTMLAnchorElement>("a.bento-tile");
      if (!a || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || reduced) return;
      // capture phase: runs before next/link's own handler, which would navigate immediately
      ev.preventDefault();
      ev.stopPropagation();
      const href = a.getAttribute("href")!;
      router.prefetch(href);
      a.classList.add("is-opening");
      setTimeout(() => router.push(href), 300);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, [router]);
  return null;
}
