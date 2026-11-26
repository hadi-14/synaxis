"use client";
import { useState } from "react";
import { BH6Image } from "@/components/brand/BH6Image";
import { MODULE_ART } from "@/lib/bh6-assets";
import { foundSecret } from "@/components/eggs/secrets";

const MOVE: Record<string, { verb: string; anim: string }> = {
  baymax: { verb: "Scan", anim: "flip-scan" },
  chem: { verb: "Chem ball pop", anim: "flip-pop" },
  maglev: { verb: "Maglev spin", anim: "flip-spin" },
  blueprint: { verb: "Open the blueprint", anim: "flip-y" },
  microbots: { verb: "Swarm", anim: "flip-y" },
  plasma: { verb: "Plasma slash", anim: "flip-slash" },
  portal: { verb: "Through the portal", anim: "flip-spin" },
  kaiju: { verb: "Fire breath", anim: "flip-y" },
  kabuki: { verb: "Unmask", anim: "flip-y" },
};

/** Module card flip — each character's signature move. Reduced motion: content swaps without rotation. */
export function CardFlip({ motif, accent, name, character }: { motif: string; accent: string; name: string; character: string }) {
  const [flipped, setFlipped] = useState(false);
  const [interacted, setInteracted] = useState(false); // no entrance animation on first paint (keeps LCP fast)
  const move = MOVE[motif] ?? MOVE.blueprint;
  const art = MODULE_ART[motif] ?? MODULE_ART.microbots;
  return (
    <button
      type="button"
      onClick={() => {
        setFlipped((f) => !f);
        setInteracted(true);
        if (motif === "kabuki" && !flipped) foundSecret("kabuki-mask");
      }}
      aria-pressed={flipped}
      className="group relative mx-auto aspect-[4/5] w-full max-w-[300px] [perspective:900px]"
    >
      <span key={String(flipped)} className="card panel-lines absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden p-6" style={{ animation: interacted ? `${move.anim} 520ms cubic-bezier(.34,1.56,.64,1)` : undefined, borderColor: accent }}>
        {!flipped ? (
          <>
            <BH6Image id={art.character} priority sizes="(max-width: 640px) 60vw, 240px" className="h-56 w-auto object-contain drop-shadow-xl" fallback="icon" iconClassName="h-36 w-36" />
            <span className="font-display text-lg font-bold">{character}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">Tap: {move.verb}</span>
            <span className="sr-only">(flips the {name} card)</span>
          </>
        ) : (
          <>
            <span className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 40%, ${accent}, transparent 70%)` }} />
            <BH6Image id={art.prop} decorative sizes="128px" className="relative h-28 w-28 object-contain motion-safe:animate-[spin_1.2s_ease-out_1]" fallback="icon" iconClassName="relative h-24 w-24" />
            {motif === "kabuki" ? (
              <span className="relative text-center"><span className="block font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Unmasked</span><span className="mt-2 block font-display text-2xl font-extrabold">Look for the motive.</span></span>
            ) : (
              <span className="relative text-center font-display text-2xl font-extrabold" style={{ color: `color-mix(in srgb, ${accent} 70%, var(--ink))` }}>{move.verb}!</span>
            )}
            <span className="relative font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">Tap to flip back</span>
          </>
        )}
      </span>
      <style>{`
        @keyframes flip-y{from{transform:rotateY(90deg)}to{transform:none}}
        @keyframes flip-spin{from{transform:rotate(-200deg) scale(.6)}to{transform:none}}
        @keyframes flip-pop{0%{transform:scale(.4)}60%{transform:scale(1.08)}100%{transform:none}}
        @keyframes flip-slash{from{clip-path:polygon(0 0,0 0,0 100%,0 100%)}to{clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}}
        @keyframes flip-scan{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0)}}
      `}</style>
    </button>
  );
}
