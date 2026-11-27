"use client";
import { useEffect, useState } from "react";

const COOKIE = "synaxis-eb-preview";

/** Admin-only: preview the site as it looks after the early-bird deadline (cookie, this browser only). */
export function EarlyBirdPreviewToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the cookie after hydration
    setOn(new RegExp(`(?:^|; )${COOKIE}=after`).test(document.cookie));
  }, []);
  const toggle = () => {
    const next = !on;
    document.cookie = next ? `${COOKIE}=after; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax` : `${COOKIE}=; path=/; max-age=0; samesite=lax`;
    setOn(next);
    (window as unknown as { __ebRefresh?: () => void }).__ebRefresh?.();
  };
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={on} onChange={toggle} className="mt-1 h-5 w-5 accent-[var(--primary)]" />
      <span>
        <span className="font-semibold">Preview as after early bird</span>
        <span className="block text-sm text-[var(--ink-muted)]">Only in this browser. Hides the discount badges, banner and strikethroughs so you can check the regular-price view. Turn it off when you&apos;re done.</span>
      </span>
    </label>
  );
}
