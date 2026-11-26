"use client";
import { useState } from "react";
import { foundSecret } from "@/components/eggs/secrets";

/**
 * Footer easter egg: a tiny café mark that, on hover/focus/tap, reveals
 * "Lucky Cat Café: now serving science". No artwork; counts as the lucky-cat secret.
 */
export function LuckyCat() {
  const [open, setOpen] = useState(false);
  const reveal = () => {
    setOpen(true);
    foundSecret("lucky-cat");
  };
  return (
    <button
      type="button"
      onPointerEnter={reveal}
      onFocus={reveal}
      onClick={() => (open ? setOpen(false) : reveal())}
      onPointerLeave={() => setOpen(false)}
      onBlur={() => setOpen(false)}
      aria-expanded={open}
      aria-label="Lucky Cat Café"
      className="group inline-flex items-center gap-2 rounded-full border border-current px-3 py-1.5 text-xs font-semibold"
    >
      {/* steaming cup mark */}
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path d="M4 10h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="currentColor" />
        <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H16" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M8 4c0 1.5 1.5 1.5 1.5 3M12 4c0 1.5 1.5 1.5 1.5 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" className="motion-safe:animate-[steam_1.6s_ease-in-out_infinite]" />
      </svg>
      <span className="whitespace-nowrap">Lucky Cat Café</span>
      <span aria-live="polite" className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ${open ? "max-w-64 opacity-100" : "max-w-0 opacity-0"}`}>
        : now serving science ☕
      </span>
      <style>{`@keyframes steam{0%,100%{opacity:.4;transform:translateY(0)}50%{opacity:1;transform:translateY(-1.5px)}}`}</style>
    </button>
  );
}
