/**
 * Fee formula — the single source of truth shared by the review step, the payment screen,
 * emails and admin. The server recomputes it on submit; the client copy is only a preview.
 *
 * total = delegation_fee + members × (early_fee | regular_fee)
 * Tier is decided by SUBMISSION time vs early_bird_deadline (assumption A4).
 */
export type FeeSettings = {
  delegation_fee: number;
  early_fee: number;
  regular_fee: number;
  early_bird_deadline: string;
};

export type FeeBreakdown = {
  tier: "early" | "regular";
  members: number;
  delegationFee: number;
  perDelegate: number;
  delegatesTotal: number;
  total: number;
};

export function computeFee(settings: FeeSettings, members: number, at: Date): FeeBreakdown {
  const tier = at.getTime() <= new Date(settings.early_bird_deadline).getTime() ? "early" : "regular";
  const perDelegate = tier === "early" ? settings.early_fee : settings.regular_fee;
  const delegatesTotal = perDelegate * members;
  return {
    tier,
    members,
    delegationFee: settings.delegation_fee,
    perDelegate,
    delegatesTotal,
    total: settings.delegation_fee + delegatesTotal,
  };
}

export const formatRs = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;
