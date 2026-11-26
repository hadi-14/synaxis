"use client";
import { useState } from "react";
import { foundSecret } from "@/components/eggs/secrets";

/**
 * Footer easter egg: a small original flat beckoning cat (traditional maneki-neko figure, drawn in our
 * own style) whose raised paw waves on hover/focus/tap. Counts as the lucky-cat secret.
 */
export function LuckyCat() {
  const [wave, setWave] = useState(false);
  const go = () => {
    setWave(true);
    foundSecret("lucky-cat");
  };
  return (
    <button
      type="button"
      onPointerEnter={go}
      onFocus={go}
      onClick={go}
      onPointerLeave={() => setWave(false)}
      onBlur={() => setWave(false)}
      className="group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-semibold"
      aria-label="Lucky Cat Café"
    >
      <svg viewBox="0 0 40 44" className="h-12 w-11 shrink-0" aria-hidden>
        {/* raised paw (waves) */}
        <g style={{ transformOrigin: "29px 20px", animation: wave ? "lc-wave 360ms ease-in-out 3" : undefined }}>
          <rect x="26" y="6" width="7" height="15" rx="3.5" fill="#FFF6E0" stroke="#7a4a00" strokeWidth="1.2" />
        </g>
        {/* body */}
        <rect x="7" y="17" width="25" height="24" rx="10" fill="#FFF6E0" stroke="#7a4a00" strokeWidth="1.2" />
        {/* head + ears */}
        <path d="M9 14 L11 4 L16 10 M30 14 L28 4 L23 10" fill="#FFF6E0" stroke="#7a4a00" strokeWidth="1.2" strokeLinejoin="round" />
        <ellipse cx="19.5" cy="15" rx="11.5" ry="9" fill="#FFF6E0" stroke="#7a4a00" strokeWidth="1.2" />
        <path d="M14.5 14.5 q1.5 1.6 3 0 M21.5 14.5 q1.5 1.6 3 0" stroke="#3b2a12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M18.4 18.2 q1.1 .9 2.2 0" stroke="#3b2a12" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* red collar + gold bell, gold coin */}
        <rect x="9" y="22.5" width="21" height="3" rx="1.5" fill="#DC2A35" />
        <circle cx="19.5" cy="27" r="2.4" fill="#F5C400" stroke="#7a4a00" strokeWidth=".8" />
        <ellipse cx="15" cy="33.5" rx="4.6" ry="3.4" fill="#F5C400" stroke="#7a4a00" strokeWidth="1" />
        <path d="M13 33.5 h4" stroke="#7a4a00" strokeWidth=".8" />
      </svg>
      <span className="whitespace-nowrap">Lucky Cat Café</span>
      <style>{`@keyframes lc-wave{0%,100%{transform:rotate(0)}50%{transform:rotate(-24deg)}}@media (prefers-reduced-motion: reduce){[style*="lc-wave"]{animation:none!important}}`}</style>
    </button>
  );
}
