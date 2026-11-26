/** Baymax's battery charge meter — used for form steps and progress. */
export function Battery({
  value,
  max,
  label,
  charging = false,
  className = "",
}: {
  value: number;
  max: number;
  label?: string;
  charging?: boolean;
  className?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label ?? "Progress"}
        className="relative flex h-7 flex-1 items-center gap-1 rounded-[9px] border-2 border-[var(--ink)] p-1 after:absolute after:-right-[6px] after:top-1/2 after:h-3 after:w-1 after:-translate-y-1/2 after:rounded-r after:bg-[var(--ink)]"
      >
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={`h-full flex-1 rounded-[4px] transition-colors duration-300 ${
              i < value
                ? pct >= 100
                  ? "bg-[var(--success)]"
                  : "bg-[var(--primary)]"
                : charging && i === value
                  ? "battery-cell-charging bg-[color-mix(in_srgb,var(--primary)_30%,var(--surface-2))]"
                  : "bg-[var(--surface-2)]"
            }`}
          />
        ))}
      </div>
      {label && <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">{label}</span>}
    </div>
  );
}

/** Loader: Baymax charging station. */
export function ChargingLoader({ label = "Charging…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-[var(--ink-muted)]" role="status" aria-live="polite">
      <div className="flex h-8 w-20 items-center gap-1 rounded-[9px] border-2 border-current p-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="battery-cell-charging h-full flex-1 rounded-[3px] bg-[var(--primary)]"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}
