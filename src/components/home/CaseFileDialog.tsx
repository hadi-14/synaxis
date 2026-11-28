"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BH6Image } from "@/components/brand/BH6Image";
import { MODULE_ART } from "@/lib/bh6-assets";
import type { Module } from "@/lib/types";

export type CaseFileModule = Pick<
  Module,
  "slug" | "name" | "subject" | "character" | "tagline" | "description" | "format" | "team_size_note" | "schedule_slot" | "head_name" | "cohead_name" | "is_compulsory" | "motif"
>;

/**
 * "Open the file" on the module bento tiles: a case-file dialog (bottom sheet on phones) that stays open
 * until the visitor acts. The tiles stay real links, so a modified click, a middle click or a click before
 * this has hydrated still opens the module page. Native <dialog>: focus is trapped, Escape closes and focus
 * returns to the tile. A click on the backdrop closes it too.
 */
export function CaseFileDialog({ modules }: { modules: CaseFileModule[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const m = modules.find((x) => x.slug === slug) ?? null;
  const index = m ? modules.indexOf(m) + 1 : 0;

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest<HTMLAnchorElement>("a.bento-tile[data-slug]");
      if (!a || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      // capture phase: runs before next/link's own handler, which would navigate
      ev.preventDefault();
      ev.stopPropagation();
      setSlug(a.dataset.slug!);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d || !m) return;
    if (!d.open) d.showModal();
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [m]);

  const close = () => dialog.current?.close();

  const head = m && [m.head_name, m.cohead_name && `Co-Head: ${m.cohead_name}`].filter(Boolean).join(" · ");
  const rows: [string, string][] = m
    ? [
        ["Format", m.format],
        ["Team size", m.team_size_note],
        ["Schedule", m.schedule_slot],
        ["Module Head", head || ""],
      ]
    : [];
  const art = m ? (MODULE_ART[m.motif] ?? MODULE_ART.microbots) : null;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="case-file-title"
      className="case-dialog"
      onClose={() => setSlug(null)}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {m && art && (
        <div className="relative flex max-h-[inherit] flex-col">
          <span className="case-dialog-tab font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
            Case file {String(index).padStart(2, "0")} · {m.subject}
          </span>
          <div className="case-dialog-body overflow-y-auto overscroll-contain px-5 pb-5 pt-5 sm:px-7 sm:pt-6">
            <div className="flex items-start gap-4 pr-8">
              <div className="min-w-0 flex-1">
                <h2 id="case-file-title" className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{m.name}</h2>
                <p className="mt-1 font-semibold text-[#7A5A22]">{m.character}</p>
                {m.is_compulsory && <span className="stamp mt-3 inline-block">Compulsory</span>}
              </div>
              <BH6Image id={art.character} decorative sizes="112px" className="h-24 w-auto shrink-0 object-contain drop-shadow-[0_6px_10px_rgba(60,40,10,.3)] sm:h-28" fallback="hide" />
            </div>
            {m.tagline && <p className="mt-4 font-semibold">{m.tagline}</p>}
            {m.description && <p className="mt-2 text-[15px] leading-relaxed text-[#4A3A1C]">{m.description}</p>}
            <dl className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="rounded-lg border border-[#C9B07A] bg-[#FBF4E2] px-3 py-2.5">
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A5A22]">{k}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{v || "To be announced"}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#C9B07A] px-5 py-4 sm:px-7">
            <button type="button" onClick={close} className="btn btn-secondary">Close</button>
            <Link href={`/modules/${m.slug}`} onClick={close} className="btn btn-primary">
              View full module <span aria-hidden>→</span>
            </Link>
          </div>
          <button type="button" onClick={close} aria-label="Close case file" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-[#5A4520] hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#5A4520]">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
      )}
    </dialog>
  );
}
