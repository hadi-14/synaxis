"use client";
import { useId, useState } from "react";
import type { Faq } from "@/lib/types";
import { PlusIcon } from "@/components/ui/Icon";
import { FEES_TOKEN } from "@/lib/fee-copy";

/** Split an answer into printout lines (sentences). */
const lines = (t: string) => t.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g)?.map((x) => x.trim()).filter(Boolean) ?? [t];

/** One printout line; {{fees}} renders the early-bird and regular sentences, switched by html[data-eb]. */
function PrintLine({ text, fees, i }: { text: string; fees?: { on: string; after: string }; i: number }) {
  const style = { "--l": i } as React.CSSProperties;
  if (fees && text.includes(FEES_TOKEN)) {
    const [a, b] = text.split(FEES_TOKEN);
    return (
      <span className="print-line" style={style}>
        {a}
        <span data-eb-only="on">{fees.on}</span>
        <span data-eb-only="after">{fees.after}</span>
        {b}
      </span>
    );
  }
  return <span className="print-line" style={style}>{text}</span>;
}

/** FAQ accordion: Wasabi's plasma blade slices the panel open along a clean line. */
export function FaqAccordion({ faqs, fees, mapHref }: { faqs: Faq[]; fees?: { on: string; after: string }; mapHref?: string }) {
  const [open, setOpen] = useState<number | null>(faqs[0]?.id ?? null);
  const base = useId();
  if (!faqs.length) return null;
  return (
    <div className="divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]">
      {faqs.map((f) => {
        const isOpen = open === f.id;
        const btn = `${base}-b-${f.id}`;
        const panel = `${base}-p-${f.id}`;
        return (
          <div key={f.id}>
            <h3>
              <button
                id={btn}
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className={`faq-q relative flex w-full items-center justify-between gap-4 overflow-hidden px-5 py-4 text-left font-semibold sm:px-6 ${isOpen ? "is-open" : ""}`}
              >
                <span>{f.question}</span>
                <span
                  aria-hidden
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 ${isOpen ? "border-[#2BB673] text-[#2BB673]" : "border-[var(--line)]"}`}
                >
                  <span className={`grid place-items-center transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                    <PlusIcon />
                  </span>
                </span>
              </button>
            </h3>
            <div id={panel} role="region" aria-labelledby={btn} hidden={!isOpen} className="relative px-5 pb-5 sm:px-6">
              {isOpen && <span aria-hidden className="plasma-blade absolute inset-x-5 top-0 h-[2px] bg-gradient-to-r from-[#2BB673] via-[#E9FFF4] to-[#2BB673] sm:inset-x-6" />}
              {isOpen && (
                <div className="printout mt-3">
                  <p className="text-[var(--ink-muted)]">
                    {lines(f.answer).map((l, i) => (
                      <PrintLine key={i} text={l} fees={fees} i={i} />
                    ))}
                  </p>
                  {mapHref && /where/i.test(f.question) && (
                    <p className="print-line mt-2" style={{ "--l": lines(f.answer).length } as React.CSSProperties}>
                      <a href={mapHref} target="_blank" rel="noopener noreferrer" className="plasma-link font-semibold">Open in Google Maps ↗</a>
                    </p>
                  )}
                  <p aria-hidden className="print-line mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A8F56]" style={{ "--l": lines(f.answer).length } as React.CSSProperties}>
                    Scan complete ✓
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
