"use client";
import { useEffect, useState } from "react";

/** SFIT / Krei Tech segmented digital display counting down to the event. */
export function Countdown({ to, label = "Until Synaxis begins", onRed = false }: { to: string; label?: string; onRed?: boolean }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock must start on the client to avoid a hydration mismatch
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = now === null ? null : Math.max(0, target - now);
  const parts = [
    ["Days", diff === null ? null : Math.floor(diff / 86400000)],
    ["Hrs", diff === null ? null : Math.floor(diff / 3600000) % 24],
    ["Min", diff === null ? null : Math.floor(diff / 60000) % 60],
    ["Sec", diff === null ? null : Math.floor(diff / 1000) % 60],
  ] as const;
  return (
    <div aria-label={label}>
      <p className={`mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${onRed ? "text-[var(--band-body)]" : "text-[var(--ink-muted)]"}`}>{label}</p>
      <div className="flex gap-2 sm:gap-3" role="timer" aria-live="off">
        {parts.map(([unit, v], i) => (
          <div
            key={unit}
            style={{ "--d": i } as React.CSSProperties}
            className="panel-lines flex min-w-[64px] flex-col items-center rounded-[var(--radius-sm)] bg-[var(--band-deep)] px-2 py-2 text-white shadow-[0_6px_0_#5e0a12] sm:min-w-[76px]"
          >
            <span className="segment-digit text-3xl font-bold leading-none tabular-nums sm:text-4xl" suppressHydrationWarning>
              {v === null ? "--" : String(v).padStart(2, "0")}
            </span>
            <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
