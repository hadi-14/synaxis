"use client";
import { useEffect, useRef } from "react";

/** Desktop only: a faint trail of microbots following the cursor. Off for touch and reduced motion. */
export function CursorTrail() {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dots = [...(wrap.current?.children ?? [])] as HTMLElement[];
    const pos = dots.map(() => ({ x: -100, y: -100 }));
    let mx = -100, my = -100, raf = 0, idle = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      idle = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      let x = mx, y = my;
      pos.forEach((p, i) => {
        p.x += (x - p.x) * 0.35;
        p.y += (y - p.y) * 0.35;
        dots[i].style.transform = `translate3d(${p.x - 2}px, ${p.y - 1.5}px, 0)`;
        x = p.x;
        y = p.y;
      });
      idle++;
      raf = idle < 90 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={wrap} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="absolute left-0 top-0 h-[3px] w-1 rounded-[1px]" style={{ background: i % 3 ? "var(--ink-muted)" : "var(--primary)", opacity: 0.45 - i * 0.05 }} />
      ))}
    </div>
  );
}
