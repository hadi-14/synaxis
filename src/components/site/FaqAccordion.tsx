"use client";
import { useId, useState } from "react";
import type { Faq } from "@/lib/types";
import { PlusIcon } from "@/components/ui/Icon";

/** FAQ accordion: Wasabi's plasma blade slices the panel open along a clean line. */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
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
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold sm:px-6"
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
              <p className="pt-3 text-[var(--ink-muted)]">{f.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
