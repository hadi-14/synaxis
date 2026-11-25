"use client";
import { useEffect, useRef, useState } from "react";
import { foundSecret } from "./secrets";

/** Idle 25s with the FAQ in view and Fred's kaiju doodle stomps along the bottom of the screen. */
export function FaqKaiju() {
  const ref = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = ref.current?.closest("section");
    if (!section) return;
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(timer);
      if (visible) timer = setTimeout(() => {
        setShow(true);
        foundSecret("kaiju");
        setTimeout(() => setShow(false), 6000);
      }, 25000);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      arm();
    });
    io.observe(section);
    const evs = ["pointermove", "keydown", "scroll"] as const;
    evs.forEach((ev) => addEventListener(ev, arm, { passive: true }));
    return () => {
      io.disconnect();
      clearTimeout(timer);
      evs.forEach((ev) => removeEventListener(ev, arm));
    };
  }, []);
  return (
    <span ref={ref} aria-hidden>
      {show && (
        <span className="pointer-events-none fixed bottom-2 left-0 z-40 block w-24 animate-[kaiju_6s_linear_forwards]">
          <svg viewBox="0 0 80 60" className="w-24 text-[#2FB8AC]">
            <path d="M10 56c-2-16 6-34 22-36 12-1 20 8 20 18 0 7-5 12-12 12H26" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="40" cy="32" r="3" fill="currentColor" />
            <path d="M20 22l-5-10 10 5M30 18l1-11 6 9" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M54 38c6 0 12-3 18-9M54 44c7 1 13 0 18-3" stroke="#FFB347" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <style>{`@keyframes kaiju{from{transform:translateX(-120px)}to{transform:translateX(110vw)}}`}</style>
        </span>
      )}
    </span>
  );
}
