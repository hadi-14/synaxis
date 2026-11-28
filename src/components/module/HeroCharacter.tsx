"use client";
import { useState } from "react";
import { BH6Image } from "@/components/brand/BH6Image";
import { foundSecret } from "@/components/eggs/secrets";

/** Each character's signature move: the tap label, the animation, and the line shown after it. */
const MOVE: Record<string, { verb: string; anim: string; line: string }> = {
  baymax: { verb: "Scan", anim: "hc-scan", line: "Scan complete. You are… curious." },
  chem: { verb: "Chem ball pop", anim: "hc-pop", line: "Reaction: successful." },
  maglev: { verb: "Maglev spin", anim: "hc-spin", line: "Woman up." },
  blueprint: { verb: "Open the blueprint", anim: "hc-tilt", line: "Built to help people." },
  microbots: { verb: "Swarm", anim: "hc-shake", line: "Look for another angle." },
  plasma: { verb: "Plasma slash", anim: "hc-slash", line: "A place for everything." },
  portal: { verb: "Through the portal", anim: "hc-spin", line: "Every mind has a motive." },
  kaiju: { verb: "Fire breath", anim: "hc-pop", line: "Fallacy spotted!" },
  kabuki: { verb: "Unmask", anim: "hc-tilt", line: "Unmasked: look for the motive." },
};

/**
 * The module hero's character cutout. It breaks out of the banner (layout in the page); a tap plays the
 * character's signature move and shows a one-liner. Reduced motion: no animation, the line still shows.
 * Width/height come from the art registry via BH6Image, so the image never shifts the layout.
 */
export function HeroCharacter({ motif, characterId, name }: { motif: string; characterId: string; name: string }) {
  const move = MOVE[motif] ?? MOVE.blueprint;
  const [played, setPlayed] = useState(0);
  return (
    <button
      type="button"
      onClick={() => {
        setPlayed((n) => n + 1);
        if (motif === "kabuki") foundSecret("kabuki-mask");
      }}
      className="group relative block h-full w-full cursor-pointer rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
      aria-label={`${name}: ${move.verb}`}
    >
      <span
        key={played}
        className="block h-full w-full"
        style={{ animation: played ? `${move.anim} 620ms cubic-bezier(.34,1.56,.64,1)` : undefined }}
      >
        <BH6Image
          id={characterId}
          priority
          sizes="(max-width: 768px) 70vw, 440px"
          className="h-full w-full object-contain object-bottom drop-shadow-[0_18px_30px_rgba(0,0,0,.35)] transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none"
          fallback="icon"
          iconClassName="h-40 w-40 text-white/80"
        />
      </span>
      <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        {played ? move.line : `Tap: ${move.verb}`}
      </span>
      <style>{`
        @keyframes hc-scan{0%{filter:brightness(1)}40%{filter:brightness(1.35) drop-shadow(0 0 18px #9ff)}100%{filter:none}}
        @keyframes hc-pop{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:none}}
        @keyframes hc-spin{0%{transform:rotate(0)}50%{transform:rotate(-8deg) scale(1.04)}100%{transform:none}}
        @keyframes hc-tilt{0%{transform:none}30%{transform:rotate(4deg) translateY(-6px)}60%{transform:rotate(-3deg)}100%{transform:none}}
        @keyframes hc-shake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
        @keyframes hc-slash{0%{clip-path:inset(0 0 0 100%)}100%{clip-path:inset(0)}}
        @media (prefers-reduced-motion: reduce){.group span[style*="animation"]{animation:none!important}}
      `}</style>
    </button>
  );
}
