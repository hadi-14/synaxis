import { feeLines, formatRs, type FeeBreakdown } from "@/lib/fees";
import { formatDate } from "@/lib/dates";

/**
 * Fee breakdown used on the review step and the payment screen: regular prices, a red early-bird
 * discount line, the total and "You saved". After the deadline: a gentle "Early bird ended" note.
 */
export function FeeBreakdownView({ fee, deadline, totalLabel = "Total", className = "" }: { fee: FeeBreakdown; deadline: string; totalLabel?: string; className?: string }) {
  const { lines, discount, total } = feeLines(fee);
  return (
    <div className={className}>
      <dl className="divide-y divide-[var(--line)] text-sm">
        {lines.map((l) => (
          <div key={l.label} className="flex justify-between gap-3 px-5 py-3">
            <dt>{l.label}</dt>
            <dd className="whitespace-nowrap font-mono">{formatRs(l.amount)}</dd>
          </div>
        ))}
        {discount > 0 && (
          <div className="flex justify-between gap-3 px-5 py-3 font-semibold text-[#C8102E] [html[data-theme=battle]_&]:text-[#FF6B76]">
            <dt>Early-bird discount <span className="font-normal opacity-80">(submitted by {formatDate(deadline)})</span></dt>
            <dd className="whitespace-nowrap font-mono">−{formatRs(discount)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 bg-[var(--surface-2)] px-5 py-4 text-base">
          <dt className="font-bold">{totalLabel}</dt>
          <dd className="font-mono text-xl font-extrabold text-[var(--primary-text)]">{formatRs(total)}</dd>
        </div>
      </dl>
      {discount > 0 ? (
        <p className="px-5 pt-3 text-sm font-bold text-[#C8102E] [html[data-theme=battle]_&]:text-[#FF6B76]">You saved {formatRs(discount)} with early bird.</p>
      ) : fee.tier === "regular" ? (
        <p className="px-5 pt-3 text-sm text-[var(--ink-muted)]">Early bird ended on {formatDate(deadline)}, so regular prices apply.</p>
      ) : null}
    </div>
  );
}
