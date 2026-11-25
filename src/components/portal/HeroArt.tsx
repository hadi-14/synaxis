import { Baymax } from "@/components/brand/Baymax";

/** San Fransokyo at a glance: torii-topped bridge towers, skyline, a lantern, and Baymax hovering. Original art. */
export function HeroArt() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[520px]" aria-hidden>
      <svg viewBox="0 0 500 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity=".22" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity=".08" />
          </linearGradient>
        </defs>
        <circle cx="250" cy="210" r="170" fill="url(#sky)" />
        {/* skyline */}
        <g fill="var(--ink)" opacity=".14">
          <rect x="70" y="230" width="34" height="90" rx="4" />
          <rect x="110" y="200" width="26" height="120" rx="4" />
          <rect x="350" y="215" width="30" height="105" rx="4" />
          <rect x="386" y="245" width="40" height="75" rx="4" />
          <path d="M150 320v-80l14-16 14 16v80z" />
        </g>
        {/* bridge with torii towers */}
        <g stroke="var(--primary)" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M40 300 Q140 220 250 300 Q360 220 460 300" strokeWidth="3" />
          <path d="M20 300h460" />
        </g>
        {[140, 360].map((x) => (
          <g key={x} fill="var(--primary)">
            <rect x={x - 22} y="220" width="44" height="7" rx="3" />
            <rect x={x - 17} y="232" width="34" height="5" rx="2" />
            <rect x={x - 15} y="222" width="7" height="80" />
            <rect x={x + 8} y="222" width="7" height="80" />
          </g>
        ))}
        {/* lantern */}
        <g transform="translate(410 120)">
          <line x1="0" y1="-30" x2="0" y2="0" stroke="var(--ink)" strokeOpacity=".4" />
          <rect x="-12" y="0" width="24" height="30" rx="10" fill="var(--primary)" opacity=".85" />
          <rect x="-8" y="-2" width="16" height="4" rx="1" fill="var(--ink)" opacity=".5" />
        </g>
        {/* sakura petals */}
        {[[90, 120], [120, 90], [70, 160], [430, 220]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="5" ry="3" fill="#FFB7C5" transform={`rotate(${i * 40} ${x} ${y})`} />
        ))}
        {/* microbot ring */}
        <g fill="var(--ink)" opacity=".5">
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI * 2;
            return <rect key={i} x={250 + Math.cos(a) * 150 - 3} y={210 + Math.sin(a) * 150 - 2} width="6" height="4" rx="1" />;
          })}
        </g>
      </svg>
      <div className="absolute left-1/2 top-[12%] w-[34%] -translate-x-1/2 motion-safe:animate-[bob_3.2s_ease-in-out_infinite]">
        <Baymax armour flame={0.7} className="w-full drop-shadow-xl" />
      </div>
      <style>{`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
    </div>
  );
}
