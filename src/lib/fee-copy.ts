import { earlyBirdOffer, formatRs, type FeeSettings } from "./fees";
import { formatDate } from "./dates";

type S = FeeSettings & { team_min: number };

/** Plain-language fee sentence. "on" = during early bird (regular price + discount), "after" = regular only. */
export function feesSentence(s: S, mode: "on" | "after") {
  const regular = `${formatRs(s.delegation_fee_regular)} per team plus ${formatRs(s.regular_fee)} per delegate`;
  const ex = earlyBirdOffer(s, s.team_min);
  if (mode === "after" || ex.saving === 0)
    return `The fee is ${regular}, so a team of ${s.team_min} pays ${formatRs(ex.regular)}.`;
  const del = s.delegation_fee_early === 0 ? "the delegation fee is free" : `the delegation fee is ${formatRs(s.delegation_fee_early)}`;
  return `The regular fee is ${regular}. Early bird (submitted by ${formatDate(s.early_bird_deadline)}): ${del} and each delegate pays ${formatRs(s.early_fee)}, so a team of ${s.team_min} pays ${formatRs(ex.early)} instead of ${formatRs(ex.regular)} and saves ${formatRs(ex.saving)}.`;
}

export const FEES_TOKEN = "{{fees}}";
