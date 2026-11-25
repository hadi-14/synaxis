"use client";
/** Success state: Baymax fist bump + "ba-la-la-la-la" finger-wiggle sparks. Reduced motion: static. */
export function FistBump({ label = "Ba-la-la-la-la" }: { label?: string }) {
  return (
    <div className="relative h-28 w-44" aria-hidden>
      <svg viewBox="0 0 176 112" className="h-full w-full overflow-visible">
        <g className="motion-safe:animate-[bumpL_900ms_cubic-bezier(.34,1.56,.64,1)_both]">
          <rect x="18" y="38" width="56" height="40" rx="18" fill="#fff" stroke="#18243A" strokeWidth="3" />
        </g>
        <g className="motion-safe:animate-[bumpR_900ms_cubic-bezier(.34,1.56,.64,1)_both]">
          <rect x="102" y="38" width="56" height="40" rx="18" fill="#F24B59" stroke="#18243A" strokeWidth="3" />
        </g>
        {[[-28, -26], [-34, 0], [-28, 26], [28, -26], [34, 0], [28, 26]].map(([dx, dy], i) => (
          <circle key={i} cx={88} cy={58} r="4" fill={i % 2 ? "#424CBC" : "#F24B59"} className="motion-safe:animate-[spark_700ms_ease-out_450ms_both]" style={{ "--sx": `${dx}px`, "--sy": `${dy}px` } as React.CSSProperties} />
        ))}
      </svg>
      <p className="mt-1 text-center font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-text)]">{label}</p>
      <style>{`
        @keyframes bumpL{0%{transform:translateX(-30px)}55%{transform:translateX(14px)}100%{transform:translateX(0)}}
        @keyframes bumpR{0%{transform:translateX(30px)}55%{transform:translateX(-14px)}100%{transform:translateX(0)}}
        @keyframes spark{0%{transform:translate(0,0);opacity:1}100%{transform:translate(var(--sx),var(--sy));opacity:0}}
      `}</style>
    </div>
  );
}
