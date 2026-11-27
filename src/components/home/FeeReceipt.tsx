"use client";
import { useState } from "react";
import { earlyBirdOffer, feeLabel, formatRs, type FeeSettings } from "@/lib/fees";
import { formatDate } from "@/lib/dates";

/**
 * Fees as a café receipt (torn paper, mono type, slight tilt). Team-size toggle updates the order live.
 * Early-bird lines (struck regular prices, red discount, savings) and the regular-only version are both
 * rendered and switched by html[data-eb] (data-eb-only), so the receipt flips itself at the deadline.
 */
function Row({ label, children, className = "", eb }: { label: React.ReactNode; children: React.ReactNode; className?: string; eb?: "on" | "after" }) {
  return (
    <div data-eb-only={eb} className={`flex items-baseline justify-between gap-3 py-1.5 ${className}`}>
      <dt className="min-w-0">{label}</dt>
      <dd className="whitespace-nowrap text-right">{children}</dd>
    </div>
  );
}
const Was = ({ v }: { v: number }) => <s className="mr-2 text-[#8A8578] decoration-[1.5px]">{formatRs(v)}</s>;

export function FeeReceipt({ s, teamMin, teamMax }: { s: FeeSettings; teamMin: number; teamMax: number }) {
  const sizes = Array.from({ length: teamMax - teamMin + 1 }, (_, i) => teamMin + i);
  const [n, setN] = useState(teamMin);
  const o = earlyBirdOffer(s, n);
  const hasEb = o.saving > 0;
  return (
    <div className="receipt-wrap">
      <div className="receipt font-mono text-[13px] text-[#2B2620] sm:text-sm">
        <p className="text-center text-base font-extrabold tracking-[0.18em]">LUCKY CAT CAFÉ</p>
        <p className="text-center text-[11px] tracking-[0.2em] text-[#6B6457]">ORDER #SYN-S1 · TEAM REGISTRATION</p>
        <p className="my-3 border-t-2 border-dashed border-[#CFC6B4]" />

        <fieldset>
          <legend className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6457]">Team size</legend>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Team size">
            {sizes.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={n === k}
                onClick={() => setN(k)}
                className={`h-10 min-w-12 rounded-md border-2 px-3 font-bold transition-colors ${n === k ? "border-[#2B2620] bg-[#2B2620] text-[#FBF7EE]" : "border-[#CFC6B4] hover:border-[#2B2620]"}`}
              >
                {k}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="my-3 border-t-2 border-dashed border-[#CFC6B4]" />

        <dl aria-live="polite">
          <Row label="1 × Delegation fee">
            {hasEb && s.delegation_fee_regular !== s.delegation_fee_early ? (
              <>
                <span data-eb-only="on"><Was v={s.delegation_fee_regular} /><b className="text-[#C8102E]">{feeLabel(s.delegation_fee_early)}</b></span>
                <span data-eb-only="after">{formatRs(s.delegation_fee_regular)}</span>
              </>
            ) : (
              formatRs(s.delegation_fee_regular)
            )}
          </Row>
          <Row label={<>{n} × Delegate <span className="hidden text-[#6B6457] sm:inline">@ <span data-eb-only="on">{hasEb && s.regular_fee !== s.early_fee ? <><s>{formatRs(s.regular_fee)}</s> {formatRs(s.early_fee)}</> : formatRs(s.regular_fee)}</span><span data-eb-only="after">{formatRs(s.regular_fee)}</span></span></>}>
            <span data-eb-only="on">{hasEb && s.regular_fee !== s.early_fee ? <><Was v={n * s.regular_fee} /><b>{formatRs(n * s.early_fee)}</b></> : formatRs(n * s.regular_fee)}</span>
            <span data-eb-only="after">{formatRs(n * s.regular_fee)}</span>
          </Row>
          {hasEb && (
            <Row label={<>Early-bird discount <span className="text-[11px]">(by {formatDate(s.early_bird_deadline)})</span></>} className="font-bold text-[#C8102E]" eb="on">
              −{formatRs(o.saving)}
            </Row>
          )}
          <Row label={<b className="text-base tracking-[0.12em]">TOTAL</b>} className="mt-2 border-t-2 border-dashed border-[#CFC6B4] pt-3 text-base">
            <span data-eb-only="on"><b className="text-xl">{formatRs(hasEb ? o.early : o.regular)}</b></span>
            <span data-eb-only="after"><b className="text-xl">{formatRs(o.regular)}</b></span>
          </Row>
        </dl>
        {hasEb && (
          <p data-eb-only="on" className="mt-3 rounded-md bg-[#C8102E] px-3 py-2 text-center font-bold text-white">
            Team of {n}: you save {formatRs(o.saving)} ({o.percent}%)
          </p>
        )}
        <p className="mt-4 text-center text-[11px] tracking-[0.2em] text-[#6B6457]">Exact total shown before you submit.</p>
        <span aria-hidden className="receipt-stamp">Thank you · Come again</span>
      </div>
    </div>
  );
}
