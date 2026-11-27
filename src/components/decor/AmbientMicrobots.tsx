import { bh6 } from "@/lib/bh6-assets";

/**
 * A few large, recognisable microbots (the team's microbot.png as a mask) drifting slowly behind a section.
 * Server-rendered; DecorObservers runs the drift only while on screen. Static under reduced motion.
 */
export function AmbientMicrobots({ count = 4, className = "" }: { count?: number; className?: string }) {
  const src = bh6("microbot").src;
  const spots = [[6, 18, 28], [88, 12, -34], [80, 70, 62], [12, 78, -12], [48, 92, 80]];
  return (
    <div
      data-ambient
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ "--ambient-play": "paused", "--mb": `url("${src}")` } as React.CSSProperties}
    >
      {spots.slice(0, count).map(([left, top, rot], i) => (
        <span key={i} className="absolute block" style={{ left: `${left}%`, top: `${top}%`, transform: `rotate(${rot}deg)` }}>
          <span
            className="block h-[56px] w-[13px] bg-current [mask:var(--mb)_center/contain_no-repeat] motion-safe:animate-[drift_var(--d)_ease-in-out_infinite_alternate]"
            style={{ opacity: 0.22, "--d": `${22 + i * 6}s`, animationDelay: `${-i * 4}s`, animationPlayState: "var(--ambient-play)" } as React.CSSProperties}
          />
        </span>
      ))}
      <style>{`@keyframes drift{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(26px,-20px) rotate(14deg)}100%{transform:translate(-18px,16px) rotate(-10deg)}}`}</style>
    </div>
  );
}
