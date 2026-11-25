"use client";
import { useState } from "react";
import { foundSecret } from "@/components/eggs/secrets";

/** Lucky Cat Café maneki-neko — waves on hover/tap (easter egg). */
export function LuckyCat() {
  const [wave, setWave] = useState(false);
  const go = () => {
    setWave(true);
    foundSecret("lucky-cat");
    setTimeout(() => setWave(false), 1200);
  };
  return (
    <button type="button" onPointerEnter={go} onClick={go} aria-label="Lucky Cat waves hello" className="shrink-0">
      <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
        <rect x="8" y="14" width="24" height="22" rx="10" fill="#fff" stroke="#18243A" strokeWidth="1.5" />
        <path d="M10 16l2-8 6 6M30 16l-2-8-6 6" fill="#fff" stroke="#18243A" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="16" cy="20" r="1.4" fill="#18243A" />
        <circle cx="24" cy="20" r="1.4" fill="#18243A" />
        <path d="M18 24q2 1.5 4 0" stroke="#18243A" strokeWidth="1.2" fill="none" />
        <circle cx="20" cy="30" r="3" fill="#F5C400" stroke="#18243A" strokeWidth="1" />
        <g style={{ transformOrigin: "31px 26px", transform: wave ? undefined : "rotate(0deg)", animation: wave ? "luckywave 300ms ease-in-out 4" : undefined }}>
          <rect x="29" y="14" width="6" height="12" rx="3" fill="#fff" stroke="#18243A" strokeWidth="1.5" />
        </g>
        <rect x="8" y="27" width="24" height="3" fill="#DC2A35" />
      </svg>
      <style>{`@keyframes luckywave{0%,100%{transform:rotate(0)}50%{transform:rotate(-28deg)}}`}</style>
    </button>
  );
}
