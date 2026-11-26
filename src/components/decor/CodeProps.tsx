/**
 * Props drawn in code (no image files): a glossy chem ball (any colour) and a glowing green energy blade.
 * Generic, original shapes. The blade's pulse is CSS and stops under reduced motion.
 */
export function ChemBall({ color = "#FF5FA2", className = "" }: { color?: string; className?: string }) {
  const id = `cb-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id={id} cx="38%" cy="34%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".18" stopColor={color} stopOpacity=".85" />
          <stop offset=".75" stopColor={color} />
          <stop offset="1" stopColor={`color-mix(in srgb, ${color} 55%, #000)`} />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="93" rx="26" ry="4" fill="#000" opacity=".15" />
      <circle cx="50" cy="50" r="38" fill={`url(#${id})`} />
      <path d="M30 58 a22 22 0 0 0 34 10" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="38" cy="34" rx="9" ry="5" transform="rotate(-30 38 34)" fill="#fff" opacity=".8" />
    </svg>
  );
}

export function EnergyBlade({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="eb-core" x1="0" x2="1">
          <stop offset="0" stopColor="#2BB673" />
          <stop offset=".5" stopColor="#F2FFF8" />
          <stop offset="1" stopColor="#2BB673" />
        </linearGradient>
        <filter id="eb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <g transform="rotate(-38 50 50)">
        <g className="motion-safe:animate-[eb-pulse_1.8s_ease-in-out_infinite]" style={{ transformOrigin: "50px 50px" }}>
          <rect x="44" y="6" width="12" height="66" rx="6" fill="#36E28E" opacity=".75" filter="url(#eb-glow)" />
          <rect x="46.5" y="8" width="7" height="62" rx="3.5" fill="url(#eb-core)" />
        </g>
        <rect x="40" y="72" width="20" height="6" rx="2" fill="#1C2A3A" />
        <rect x="45" y="78" width="10" height="16" rx="3" fill="#2C3E52" />
        <circle cx="50" cy="75" r="1.6" fill="#36E28E" />
      </g>
      <style>{`@keyframes eb-pulse{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.8;transform:scaleY(.97)}}`}</style>
    </svg>
  );
}

/** Prop ids that are drawn in code instead of loaded from /public/assets/bh6. */
export const CODE_PROPS = new Set(["code:chem-ball", "code:energy-blade"]);
export function CodeProp({ id, color, className }: { id: string; color?: string; className?: string }) {
  return id === "code:chem-ball" ? <ChemBall color={color} className={className} /> : <EnergyBlade className={className} />;
}
