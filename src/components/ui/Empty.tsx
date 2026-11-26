import { BH6Image } from "@/components/brand/BH6Image";

/** Empty state: Mochi the cat asleep. */
export function Empty({ title = "Nothing here yet", body }: { title?: string; body?: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center text-[var(--ink-muted)]">
      <BH6Image id="mochi" decorative sizes="112px" className="h-24 w-auto object-contain opacity-90" fallback="icon" iconClassName="h-14 w-14" />
      <p className="mt-3 font-display text-base font-bold text-[var(--ink)]">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm">{body}</p>}
    </div>
  );
}
