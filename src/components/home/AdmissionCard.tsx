/** Original "admission card" design for the eligibility rules, with a rubber ELIGIBLE stamp. */
export function AdmissionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="admission relative h-full overflow-hidden p-6 pl-8 sm:p-7 sm:pl-10">
      <span aria-hidden className="absolute inset-y-0 left-0 w-3 bg-[repeating-linear-gradient(180deg,var(--band)_0_10px,transparent_10px_16px)] opacity-80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary-text)]">Admission card · Season 1</p>
          <h3 className="mt-1 font-display text-xl font-extrabold">Who can enter</h3>
        </div>
        <span aria-hidden className="grid h-14 w-11 shrink-0 place-items-center rounded-md border-2 border-dashed border-[var(--line-strong)] font-mono text-[9px] uppercase text-[var(--ink-muted)]">Photo</span>
      </div>
      <div className="mt-3 text-[var(--ink-muted)]">{children}</div>
      <span aria-hidden className="stamp stamp-ink absolute bottom-5 right-5 sm:bottom-6 sm:right-7">Eligible</span>
    </div>
  );
}
