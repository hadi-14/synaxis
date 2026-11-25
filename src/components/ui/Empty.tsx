/** Empty state: Mochi the cat asleep. */
export function Empty({ title = "Nothing here yet", body }: { title?: string; body?: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center text-[var(--ink-muted)]">
      <svg viewBox="0 0 120 60" className="h-16 w-32" aria-hidden>
        <path d="M14 50c0-18 18-30 44-30s48 12 48 30z" fill="#E7A35A" />
        <path d="M30 26l-4-14 12 9M54 20l2-13 8 12" fill="#E7A35A" />
        <path d="M34 36q4 3 8 0M50 36q4 3 8 0" stroke="#18243A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M106 50c8 0 10-8 4-12" stroke="#E7A35A" strokeWidth="6" fill="none" strokeLinecap="round" />
        <text x="76" y="20" fontSize="10" fill="currentColor" fontFamily="monospace">z z</text>
      </svg>
      <p className="mt-3 font-display text-base font-bold text-[var(--ink)]">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm">{body}</p>}
    </div>
  );
}
