"use client";
import { useEffect, useState } from "react";

type Mode = "medical" | "battle";

/** "Healthcare / Combat" chip: Baymax suits up (visor + armour plates) or takes the armour off. */
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
        {/* Baymax face. In battle: red helmet + indigo visor slide in. */}
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <ellipse cx="16" cy="17" rx="13" ry="10" fill={battle ? "#DC2A35" : "#fff"} stroke="#18243A" strokeWidth="1.2" style={{ transition: "fill 300ms" }} />
          <rect
            x="5" y="12" width="22" height="9" rx="4.5"
            fill="#424CBC"
            style={{ transform: battle ? "translateY(0)" : "translateY(-22px)", transition: "transform 380ms cubic-bezier(.34,1.56,.64,1)" }}
          />
          <circle cx="11" cy="16.5" r="2" fill={battle ? "#8B93F0" : "#18243A"} />
          <circle cx="21" cy="16.5" r="2" fill={battle ? "#8B93F0" : "#18243A"} />
          <line x1="11" y1="16.5" x2="21" y2="16.5" stroke={battle ? "#8B93F0" : "#18243A"} strokeWidth="1.2" />
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
