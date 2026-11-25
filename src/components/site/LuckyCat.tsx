"use client";
import { useState } from "react";
import { foundSecret } from "@/components/eggs/secrets";
import { BH6Image } from "@/components/brand/BH6Image";

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
      <span className="block h-12 w-10 origin-bottom" style={{ animation: wave ? "luckywave 300ms ease-in-out 4" : undefined }}>
        <BH6Image id="lucky-cat" decorative sizes="40px" className="h-full w-full object-contain" fallbackClassName="h-full w-full" />
      </span>
      <style>{`@keyframes luckywave{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}`}</style>
    </button>
  );
}
