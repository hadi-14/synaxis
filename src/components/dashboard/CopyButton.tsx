"use client";
import { useState } from "react";

/** Copy to clipboard with a microbot "data port" blink. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-semibold"
      aria-label={`${label}: ${value}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-[2px] ${done ? "bg-[var(--success)] motion-safe:animate-[bh-charge_400ms_2]" : "bg-[var(--ink-muted)]"}`} />
      <span aria-live="polite">{done ? "Copied" : label}</span>
    </button>
  );
}
