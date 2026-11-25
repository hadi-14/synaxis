/**
 * Original, stylised motifs for each module/character (no film imagery).
 * Each is a 64×64 line/shape icon that inherits `color` for strokes and uses `accent` for fills.
 */
export type MotifKey =
  | "baymax"
  | "chem"
  | "maglev"
  | "blueprint"
  | "microbots"
  | "plasma"
  | "portal"
  | "kaiju"
  | "kabuki";

export function Motif({ motif, accent, className = "" }: { motif: string; accent: string; className?: string }) {
  const s = { stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  let body: React.ReactNode;
  switch (motif as MotifKey) {
    case "baymax":
      body = (
        <>
          <ellipse cx="32" cy="34" rx="24" ry="18" fill="#fff" stroke="#18243A" strokeWidth="2.5" />
          <circle cx="22" cy="33" r="4" fill="#18243A" />
          <circle cx="42" cy="33" r="4" fill="#18243A" />
          <line x1="22" y1="33" x2="42" y2="33" stroke="#18243A" strokeWidth="2.5" />
          <path d="M48 12h6v6h-6zM50 10v10M46 15h10" stroke={accent} strokeWidth="2" fill="none" />
        </>
      );
      break;
    case "chem":
      body = (
        <>
          <circle cx="20" cy="40" r="10" fill="#FF5FA2" />
          <circle cx="40" cy="22" r="9" fill="#F5C400" />
          <circle cx="45" cy="45" r="8" fill="#3BB2F6" />
          <path d="M26 33l8-6M42 31l2 6" {...s} />
          <circle cx="17" cy="37" r="2.5" fill="#fff" opacity=".8" />
        </>
      );
      break;
    case "maglev":
      body = (
        <>
          <ellipse cx="38" cy="32" rx="18" ry="18" fill={accent} />
          <ellipse cx="38" cy="32" rx="9" ry="9" fill="#18243A" />
          <ellipse cx="38" cy="32" rx="4" ry="4" fill={accent} />
          <path d="M4 22h14M2 32h12M6 42h12" {...s} />
        </>
      );
      break;
    case "blueprint":
      body = (
        <>
          <path d="M6 12h52v40H6z" stroke={accent} strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          {/* SFIT-style cap */}
          <path d="M16 36c0-10 7-16 16-16s16 6 16 16z" fill={accent} />
          <path d="M14 36h40c0 3-3 5-6 5H14z" fill="currentColor" opacity=".85" />
          <circle cx="32" cy="20" r="2" fill="currentColor" />
        </>
      );
      break;
    case "microbots":
      body = (
        <>
          {[
            [12, 14], [28, 10], [44, 16], [52, 32], [40, 46], [24, 52], [10, 38], [30, 30],
          ].map(([x, y], i, arr) => (
            <g key={i}>
              <line x1={x} y1={y} x2={arr[(i + 1) % arr.length][0]} y2={arr[(i + 1) % arr.length][1]} stroke="currentColor" strokeWidth="1" opacity=".45" />
              <line x1={x} y1={y} x2={30} y2={30} stroke="currentColor" strokeWidth=".8" opacity=".3" />
              <rect x={x - 3.5} y={y - 2.5} width="7" height="5" rx="1.5" fill={i === 7 ? accent : "currentColor"} />
            </g>
          ))}
        </>
      );
      break;
    case "plasma":
      body = (
        <>
          <path d="M8 8h48v48H8z" stroke="currentColor" strokeWidth="1" opacity=".3" fill="none" />
          <path d="M8 24h48M8 40h48M24 8v48M40 8v48" stroke="currentColor" strokeWidth="1" opacity=".2" />
          <path d="M12 52L52 12" stroke={accent} strokeWidth="5" strokeLinecap="round" />
          <path d="M12 52L52 12" stroke="#E9FFF4" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
      break;
    case "portal":
      body = (
        <>
          <ellipse cx="32" cy="32" rx="24" ry="24" {...s} stroke={accent} />
          <ellipse cx="32" cy="32" rx="16" ry="16" {...s} strokeDasharray="4 4" />
          <ellipse cx="32" cy="32" rx="8" ry="8" fill={accent} opacity=".5" />
        </>
      );
      break;
    case "kaiju":
      body = (
        <>
          <path d="M14 50c-2-14 4-28 18-30 10-1 16 6 16 14 0 6-4 10-10 10H26" {...s} />
          <circle cx="36" cy="30" r="2.5" fill="currentColor" />
          <path d="M22 22l-4-8 8 4M30 18l1-9 5 7" {...s} />
          <path d="M48 36c4 0 8-2 12-6M48 40c5 1 9 0 12-2" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      );
      break;
    case "kabuki":
      body = (
        <>
          <path d="M14 14c10-6 26-6 36 0 2 16-4 34-18 38C18 48 12 30 14 14z" fill="#fff" stroke="#111" strokeWidth="2.5" />
          <path d="M20 26c4-3 8-3 10 0M34 26c2-3 6-3 10 0" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M18 22l6 2M46 22l-6 2" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 40c4 2 8 2 12 0" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={4 + i * 9} y={56 - (i % 2) * 4} width="5" height="3.5" rx="1" fill="currentColor" opacity=".55" />
          ))}
        </>
      );
      break;
    default:
      body = <circle cx="32" cy="32" r="20" fill={accent} />;
  }
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {body}
    </svg>
  );
}
