"use client";
import { useEffect, useState } from "react";

type Mode = "medical" | "battle";

/** "Healthcare / Combat" chip: the healthcare cross suits up into a combat shield (and back). */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the theme set by the pre-paint script
    setMode((document.documentElement.dataset.theme as Mode) ?? "medical");
  }, []);

  const flip = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    document.documentElement.style.setProperty("--vt-x", `${r.left + r.width / 2}px`);
    document.documentElement.style.setProperty("--vt-y", `${r.top + r.height / 2}px`);
    const next: Mode = mode === "battle" ? "medical" : "battle";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("synaxis-theme", next);
      setMode(next);
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.dataset.vt = "suit";
      const vt = doc.startViewTransition(apply) as { finished?: Promise<void> };
      vt.finished?.finally(() => delete document.documentElement.dataset.vt);
    } else apply();
  };

  const battle = mode === "battle";
  return (
    <button
      type="button"
      onClick={flip}
      role="switch"
      aria-checked={battle}
      aria-label={battle ? "Battle Mode on. Switch to Peaceful Medical Mode" : "Peaceful Medical Mode on. Switch to Battle Mode"}
      title={battle ? "Battle Mode" : "Peaceful Medical Mode"}
      className="group relative inline-flex h-11 items-center gap-2 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] py-1 pl-1 pr-3 text-xs font-bold"
      data-burst
    >
      <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-[var(--bg)]">
        {/* Healthcare cross morphs into a combat shield. */}
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <path
            d="M16 4 L26 8 V16 C26 22 21.5 26.5 16 28 C10.5 26.5 6 22 6 16 V8 Z"
            fill={battle ? "#DC2A35" : "transparent"}
            stroke={battle ? "#8B93F0" : "transparent"}
            strokeWidth="1.5"
            style={{ transform: battle ? "scale(1)" : "scale(.4)", transformOrigin: "16px 16px", transition: "transform 380ms cubic-bezier(.34,1.56,.64,1), fill 300ms" }}
          />
          <path d="M16 10v12M10 16h12" stroke={battle ? "#fff" : "#F24B59"} strokeWidth="3.5" strokeLinecap="round" style={{ transition: "stroke 300ms" }} />
        </svg>
      </span>
      {!compact && (
        <span className="font-mono uppercase tracking-wider">
          {mode === null ? "Mode" : battle ? "Combat" : "Healthcare"}
        </span>
      )}
    </button>
  );
}
