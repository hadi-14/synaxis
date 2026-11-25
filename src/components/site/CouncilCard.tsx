"use client";
import { useState } from "react";
import type { CouncilMember } from "@/lib/types";

/** Flip card in the module accent colour: front = photo + role, back = bio + socials. */
export function CouncilCard({ c, accent, large = false }: { c: CouncilMember; accent: string; large?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const initials = c.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("");
  return (
    <div className={`group relative [perspective:1000px] ${large ? "h-80" : "h-72"}`}>
      <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
        <button type="button" onClick={() => setFlipped(true)} className="card absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 [backface-visibility:hidden]" style={{ borderTop: `6px solid ${accent}` }}>
          {c.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.photo_url} alt="" className={`${large ? "h-36 w-36" : "h-28 w-28"} rounded-full object-cover`} style={{ boxShadow: `0 0 0 4px ${accent}` }} loading="lazy" />
          ) : (
            <span className={`${large ? "h-36 w-36 text-4xl" : "h-28 w-28 text-3xl"} grid place-items-center rounded-full font-display font-extrabold text-white`} style={{ background: accent }}>{initials}</span>
          )}
          <span className="text-center">
            <span className="block font-display text-lg font-bold">{c.name}</span>
            <span className="block text-sm text-[var(--ink-muted)]">{c.role}</span>
            <span className="sr-only">Show details</span>
          </span>
        </button>
        <div className="card absolute inset-0 flex flex-col justify-between p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ background: `color-mix(in srgb, ${accent} 12%, var(--surface))` }} aria-hidden={!flipped}>
          <div>
            <p className="font-display text-lg font-bold">{c.name}</p>
            <p className="text-sm font-semibold" style={{ color: `color-mix(in srgb, ${accent} 70%, var(--ink))` }}>{c.role}</p>
            {c.bio && <p className="mt-3 text-sm">{c.bio}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            {c.instagram && <a tabIndex={flipped ? 0 : -1} className="plasma-link" href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener">@{c.instagram}</a>}
            {c.linkedin && <a tabIndex={flipped ? 0 : -1} className="plasma-link" href={c.linkedin} target="_blank" rel="noopener">LinkedIn</a>}
            {c.email && <a tabIndex={flipped ? 0 : -1} className="plasma-link" href={`mailto:${c.email}`}>Email</a>}
            <button tabIndex={flipped ? 0 : -1} type="button" onClick={() => setFlipped(false)} className="ml-auto text-xs underline">Flip back</button>
          </div>
        </div>
      </div>
    </div>
  );
}
