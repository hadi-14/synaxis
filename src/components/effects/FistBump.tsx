"use client";
/**
 * Success state: fist bump, animated in code (no image).
 * A soft white rounded fist pushes forward, then "explodes": small capsule fingers fan out
 * and wiggle ("ba-la-la-la-la") with a burst of coral sparkles.
 * Reduced motion: a static fist with the label.
 */
export function FistBump({ label = "Ba-la-la-la-la", compact = false }: { label?: string; compact?: boolean }) {
  const fingers = [-48, -24, 0, 24, 48];
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { x: Math.round(Math.cos(a) * 46), y: Math.round(Math.sin(a) * 34), d: 420 + (i % 3) * 60 };
  });
  return (
    <div className={`relative ${compact ? "h-16 w-20" : "h-28 w-44"}`} aria-hidden>
      <svg viewBox="0 0 176 112" className="h-full w-full overflow-visible">
        <g transform="translate(88 56)">
          {/* sparkles */}
          {sparks.map((s, i) => (
            <circle
              key={i}
              r={i % 2 ? 3 : 4}
              fill={i % 3 ? "#F24B59" : "#DC2A35"}
              className="fb-spark motion-reduce:hidden"
              style={{ "--sx": `${s.x}px`, "--sy": `${s.y}px`, animationDelay: `${s.d}ms` } as React.CSSProperties}
            />
          ))}
          {/* fingers that pop out and wiggle */}
          {fingers.map((rot, i) => (
            <g key={rot} transform={`rotate(${rot - 90})`}>
              <rect
                x="16"
                y="-6"
                width="24"
                height="12"
                rx="6"
                fill="#fff"
                stroke="#E3E1DC"
                strokeWidth="1.5"
                className="fb-finger motion-reduce:hidden"
                style={{ animationDelay: `${380 + i * 40}ms` }}
              />
            </g>
          ))}
          {/* the fist */}
          <g className="fb-fist">
            <ellipse cx="0" cy="0" rx="26" ry="22" fill="#fff" stroke="#E3E1DC" strokeWidth="2" />
            <path d="M-12 -8 Q-6 -12 0 -8 M0 -8 Q6 -12 12 -8" stroke="#D9D5CC" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </svg>
      {!compact && <p className="mt-1 text-center font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-text)]">{label}</p>}
      <style>{`
        .fb-fist{transform-box:fill-box;transform-origin:center;animation:fb-push 900ms cubic-bezier(.34,1.56,.64,1) both}
        .fb-finger{transform-box:fill-box;transform-origin:left center;animation:fb-pop 260ms ease-out both,fb-wiggle 180ms ease-in-out 5 alternate}
        .fb-spark{opacity:0;animation:fb-spark 650ms ease-out both}
        @keyframes fb-push{0%{transform:scale(.5) translateY(14px);opacity:0}45%{transform:scale(1.18)}60%{transform:scale(.92)}100%{transform:scale(1)}}
        @keyframes fb-pop{from{transform:scaleX(0);opacity:0}to{transform:scaleX(1);opacity:1}}
        @keyframes fb-wiggle{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
        @keyframes fb-spark{0%{transform:translate(0,0) scale(.4);opacity:1}100%{transform:translate(var(--sx),var(--sy)) scale(1);opacity:0}}
        @media (prefers-reduced-motion: reduce){.fb-fist{animation:none}}
      `}</style>
    </div>
  );
}
