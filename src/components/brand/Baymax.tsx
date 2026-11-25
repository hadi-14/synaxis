/**
 * Original, simplified Baymax drawing (geometric, inspired-by — not traced from film art).
 * - `armour`: red plates, indigo trim, visor, wings and boot thrusters (Battle).
 * - `flame`: 0..1 thruster intensity (only drawn with armour).
 * - `pose`: arm pose used by the Guide (idle | wave | point | fist).
 */
export type BaymaxPose = "idle" | "wave" | "point" | "fist";

export function Baymax({
  armour = false,
  flame = 0,
  pose = "idle",
  droop = false,
  className = "",
  title,
}: {
  armour?: boolean;
  flame?: number;
  pose?: BaymaxPose;
  droop?: boolean;
  className?: string;
  title?: string;
}) {
  const body = armour ? "#DC2A35" : "#FFFFFF";
  const stroke = "#18243A";
  const trim = "#5A3FB0";
  const f = Math.max(0, Math.min(1, flame));
  const rightArm =
    pose === "wave"
      ? "rotate(-140 92 70)"
      : pose === "point"
        ? "rotate(-75 92 70)"
        : pose === "fist"
          ? "rotate(-100 92 70)"
          : "rotate(-18 92 70)";
  return (
    <svg viewBox="0 0 120 170" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {/* thrusters */}
      {armour && f > 0.02 && (
        <g>
          {[46, 74].map((x) => (
            <g key={x}>
              <path d={`M${x - 6} 150 Q${x} ${150 + 18 * f + 6} ${x + 6} 150 Z`} fill="#FFB347" opacity=".9" />
              <path d={`M${x - 3.5} 150 Q${x} ${150 + 10 * f + 4} ${x + 3.5} 150 Z`} fill="#FFF3C4" />
            </g>
          ))}
        </g>
      )}
      {/* wings */}
      {armour && (
        <g fill={trim} stroke={stroke} strokeWidth="1.5">
          <path d="M22 70 L2 92 L18 96 Z" />
          <path d="M98 70 L118 92 L102 96 Z" />
        </g>
      )}
      {/* left arm */}
      <ellipse cx="22" cy="92" rx="11" ry="30" transform="rotate(14 22 92)" fill={body} stroke={stroke} strokeWidth="2" />
      {/* right arm (posable) */}
      <g transform={rightArm} style={{ transition: "transform 260ms cubic-bezier(.34,1.56,.64,1)" }}>
        <ellipse cx="98" cy="92" rx="11" ry="30" fill={body} stroke={stroke} strokeWidth="2" />
        {pose === "fist" ? (
          <circle cx="99" cy="122" r="9" fill={body} stroke={stroke} strokeWidth="2" />
        ) : null}
      </g>
      {/* legs */}
      <rect x="36" y="124" width="20" height="28" rx="10" fill={body} stroke={stroke} strokeWidth="2" />
      <rect x="64" y="124" width="20" height="28" rx="10" fill={body} stroke={stroke} strokeWidth="2" />
      {/* body */}
      <ellipse cx="60" cy="92" rx="38" ry="44" fill={body} stroke={stroke} strokeWidth="2" />
      {armour ? (
        <g fill="none" stroke={trim} strokeWidth="3" strokeLinecap="round">
          <path d="M36 76 Q60 66 84 76" />
          <path d="M40 110 Q60 120 80 110" />
          <rect x="52" y="82" width="16" height="12" rx="3" fill="#0F1A2C" stroke={trim} />
        </g>
      ) : (
        <g>
          {/* access port */}
          <circle cx="76" cy="76" r="5" fill="none" stroke="#C9CED6" strokeWidth="1.5" />
          <ellipse cx="46" cy="82" rx="12" ry="18" fill="#000" opacity=".03" />
        </g>
      )}
      {/* head */}
      <g style={{ transform: droop ? "rotate(14deg) translateY(4px)" : undefined, transformOrigin: "60px 44px", transition: "transform 600ms ease" }}>
        <ellipse cx="60" cy="32" rx="20" ry="14" fill={body} stroke={stroke} strokeWidth="2" />
        {armour && <rect x="44" y="26" width="32" height="12" rx="6" fill="#0F1A2C" />}
        <circle cx="52" cy="32" r="3.2" fill={armour ? "#8B93F0" : stroke} />
        <circle cx="68" cy="32" r="3.2" fill={armour ? "#8B93F0" : stroke} />
        <line x1="52" y1="32" x2="68" y2="32" stroke={armour ? "#8B93F0" : stroke} strokeWidth="1.6" />
      </g>
    </svg>
  );
}
