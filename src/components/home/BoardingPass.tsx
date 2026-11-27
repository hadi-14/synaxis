import { Countdown } from "@/components/site/Countdown";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { formatDate, formatDateRange } from "@/lib/dates";
import type { Settings } from "@/lib/types";

/** Key dates as a boarding pass, with the early-bird countdown (or registration close after the deadline). */
export function BoardingPass({ s }: { s: Settings }) {
  const field = (k: string, v: string) => (
    <div>
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{k}</dt>
      <dd className="mt-0.5 font-display text-base font-bold">{v}</dd>
    </div>
  );
  return (
    <div className="boarding-pass band flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">Boarding pass · {s.season_label}</p>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">Gate SFK</p>
      </div>
      <div className="flex items-center gap-3 px-5 pt-3">
        <div>
          <p className="font-display text-3xl font-extrabold leading-none">YOU</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Your school</p>
        </div>
        <span aria-hidden className="h-[2px] flex-1 bg-[repeating-linear-gradient(90deg,#fff_0_8px,transparent_8px_14px)] opacity-60" />
        <div className="text-right">
          <p className="font-display text-3xl font-extrabold leading-none">KHI</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Synaxis</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 pt-5">
        {field("Event", formatDateRange(s.event_start, s.event_end))}
        {field("Early bird ends", formatDate(s.early_bird_deadline))}
        {field("Registration closes", formatDate(s.registration_closes_at))}
        {field("Payment due", formatDate(s.payment_deadline))}
      </dl>
      <div aria-hidden className="pass-perf mt-5" />
      <div className="px-5 pb-5 pt-4">
        <div data-eb-only="on">
          <Countdown onRed to={s.early_bird_deadline} label="Early bird ends in" />
        </div>
        <div data-eb-only="after">
          <Countdown onRed to={s.registration_closes_at} label="Registration closes in" />
        </div>
        <TrackedLink location="fees_panel" href="/register" className="btn btn-onred mt-5 w-full">
          Start registration
        </TrackedLink>
      </div>
    </div>
  );
}
