/** San Fransokyo billboard ticker (Krei Tech-style LED strip) in coral. Static under reduced motion. */
export function Ticker({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y-2 border-[var(--primary-press)] bg-[var(--primary)] py-3 text-[var(--primary-ink)]">
      <p className="sr-only">{items.join(" · ")}</p>
      <div aria-hidden className="flex w-max gap-8 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.18em] motion-safe:animate-[ticker_40s_linear_infinite]">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8">
            {t}
            <svg viewBox="518 -1 194 127" className="h-3 w-4" aria-hidden><path d="M520 1 L600 1 L640 60 L600 124 L520 124 L560 62 Z" fill="currentColor" opacity=".5" /></svg>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}
