/**
 * Generic San Fransokyo-style skyline silhouette (original line work): torii-topped suspension-bridge
 * towers, pagoda-roof towers, plain blocks and two wind-turbine blimps. Pure SVG, one colour.
 */
export function Skyline({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  const blocks = [
    [0, 70, 46], [50, 52, 30], [84, 88, 40], [128, 60, 34], [300, 96, 38], [342, 64, 30], [376, 110, 44],
    [424, 74, 32], [460, 58, 40], [640, 82, 36], [680, 120, 42], [726, 66, 30], [760, 92, 46], [810, 56, 34],
    [850, 104, 40], [894, 70, 36], [934, 86, 44], [982, 60, 30], [1016, 96, 40], [1060, 68, 36], [1100, 80, 40], [1144, 56, 56],
  ];
  const pagoda = (x: number, base: number, tiers: number) => {
    let d = "";
    let w = 44, y = 140 - base;
    for (let i = 0; i < tiers; i++) {
      d += `M${x - w / 2 - 6} ${y} Q${x} ${y - 10} ${x + w / 2 + 6} ${y} L${x + w / 2} ${y + 3} L${x + w / 2} ${y + 18} L${x - w / 2} ${y + 18} L${x - w / 2} ${y + 3}Z`;
      y -= 18;
      w -= 8;
    }
    return d + `M${x - 1.5} ${y + 2} h3 v-14 h-3z`;
  };
  return (
    <svg viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden fill={color}>
      {blocks.map(([x, h, w], i) => (
        <rect key={i} x={x} y={140 - h} width={w} height={h} />
      ))}
      <path d={pagoda(220, 40, 4)} />
      <path d={pagoda(560, 30, 5)} />
      <path d={pagoda(1180, 44, 3)} />
      {/* suspension bridge with torii-style towers */}
      <g>
        {[490, 610].map((x) => (
          <g key={x}>
            <rect x={x - 22} y={44} width={44} height={6} rx={2} />
            <rect x={x - 18} y={54} width={36} height={4} />
            <rect x={x - 14} y={44} width={6} height={96} />
            <rect x={x + 8} y={44} width={6} height={96} />
          </g>
        ))}
        <path d="M400 128 Q490 46 550 98 Q610 46 700 128" fill="none" stroke={color} strokeWidth={3} />
        <rect x={400} y={124} width={300} height={5} />
      </g>
      {/* wind-turbine blimps */}
      {[[150, 26], [930, 18]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={34} ry={9} />
          <rect x={x - 6} y={y + 8} width={12} height={4} rx={1} />
          <path d={`M${x + 34} ${y} l10 -8 l2 2 l-8 6 l8 6 l-2 2z`} />
        </g>
      ))}
    </svg>
  );
}
