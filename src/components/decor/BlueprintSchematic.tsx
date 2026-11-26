/**
 * Original "Hiro's lab" blueprint: exploded view of a microbot + a handheld healthcare scanner,
 * with measurement lines and labels. Line art only, very low contrast (inherits currentColor).
 */
export function BlueprintSchematic({ className = "" }: { className?: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.2 } as const;
  const t = { fill: "currentColor", fontFamily: "ui-monospace, monospace", fontSize: 9, letterSpacing: 1.5 } as const;
  return (
    <svg viewBox="0 0 360 380" className={className} aria-hidden>
      {/* microbot: exploded layers */}
      <g transform="translate(40 40)">
        <rect x="0" y="0" width="120" height="44" rx="10" {...s} />
        <rect x="10" y="62" width="100" height="30" rx="6" {...s} strokeDasharray="4 3" />
        <rect x="24" y="108" width="72" height="20" rx="4" {...s} />
        {[18, 48, 78].map((x) => <circle key={x} cx={x + 12} cy="22" r="7" {...s} />)}
        <path d="M60 44 V62 M60 92 V108" {...s} strokeDasharray="2 3" />
        <path d="M-12 0 V128 M-16 0 H-8 M-16 128 H-8" {...s} />
        <text x="-30" y="70" transform="rotate(-90 -30 70)" {...t}>42.0 MM</text>
        <text x="128" y="26" {...t}>SHELL</text>
        <text x="118" y="80" {...t}>NEURAL LINK</text>
        <text x="104" y="122" {...t}>MAG COUPLER</text>
      </g>
      {/* scanner device */}
      <g transform="translate(60 210)">
        <rect x="0" y="0" width="160" height="70" rx="22" {...s} />
        <rect x="18" y="18" width="70" height="34" rx="8" {...s} />
        <path d="M24 35 h12 l6 -10 l8 20 l6 -10 h20" {...s} />
        <circle cx="122" cy="35" r="14" {...s} />
        <circle cx="122" cy="35" r="5" {...s} />
        <path d="M160 35 h40 M200 20 v30" {...s} strokeDasharray="3 3" />
        <path d="M0 92 H160 M0 86 V98 M160 86 V98" {...s} />
        <text x="58" y="110" {...t}>160 MM</text>
        <text x="0" y="-10" {...t}>HEALTHCARE COMPANION v1.0 · SCANNER</text>
      </g>
      <text x="40" y="360" {...t}>SFIT · ROBOTICS LAB · SHEET 04/09</text>
    </svg>
  );
}
