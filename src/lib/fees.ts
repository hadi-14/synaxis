/**
 * Fee formula — the single source of truth shared by the review step, the payment screen,
 * emails and admin. The server recomputes it on submit; the client copy is only a preview.
 *
 * total = (delegation_fee_early | delegation_fee_regular) + members × (early_fee | regular_fee)
 * Tier is decided by SUBMISSION time vs early_bird_deadline (assumption A4).
 */
export type FeeSettings = {
  delegation_fee_early: number;
  delegation_fee_regular: number;
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
  /** What the same team pays at regular prices (equals total after the deadline). */
  regularTotal?: number;
  /** regularTotal − total; 0 after the deadline. */
  discount?: number;
  regularDelegationFee?: number;
  regularPerDelegate?: number;
};

export function computeFee(settings: FeeSettings, members: number, at: Date): FeeBreakdown {
  const tier = at.getTime() <= new Date(settings.early_bird_deadline).getTime() ? "early" : "regular";
  const perDelegate = tier === "early" ? settings.early_fee : settings.regular_fee;
  const delegationFee = tier === "early" ? settings.delegation_fee_early : settings.delegation_fee_regular;
  const delegatesTotal = perDelegate * members;
  return {
    tier,
    members,
    delegationFee,
    perDelegate,
    delegatesTotal,
    total: delegationFee + delegatesTotal,
    regularTotal: regularTotal(settings, members),
    discount: tier === "early" ? Math.max(0, regularTotal(settings, members) - (delegationFee + delegatesTotal)) : 0,
    regularDelegationFee: settings.delegation_fee_regular,
    regularPerDelegate: settings.regular_fee,
  };
}

export const regularTotal = (s: FeeSettings, members: number) => s.delegation_fee_regular + members * s.regular_fee;
export const earlyTotal = (s: FeeSettings, members: number) => s.delegation_fee_early + members * s.early_fee;

/** True while the early-bird price applies (deadline inclusive). */
export const isEarlyBird = (s: Pick<FeeSettings, "early_bird_deadline">, at: Date) => at.getTime() <= new Date(s.early_bird_deadline).getTime();

/** Early-bird offer for one team size: regular vs early totals, the saving and the % off (rounded down). */
export function earlyBirdOffer(s: FeeSettings, members: number) {
  const regular = regularTotal(s, members);
  const early = earlyTotal(s, members);
  const saving = Math.max(0, regular - early);
  return { members, regular, early, saving, percent: regular > 0 ? Math.floor((saving / regular) * 100) : 0 };
}

/** Largest rupee saving and largest % over the allowed team sizes (they can come from different sizes). */
export function earlyBirdMax(s: FeeSettings, teamMin: number, teamMax: number) {
  const offers = Array.from({ length: Math.max(1, teamMax - teamMin + 1) }, (_, i) => earlyBirdOffer(s, teamMin + i));
  return {
    saving: Math.max(...offers.map((o) => o.saving)),
    percent: Math.max(...offers.map((o) => o.percent)),
    delegationSaving: Math.max(0, s.delegation_fee_regular - s.delegation_fee_early),
    perDelegateSaving: Math.max(0, s.regular_fee - s.early_fee),
    offers,
  };
}

/** "FREE" for 0, otherwise Rs amount. */
export const feeLabel = (n: number) => (n === 0 ? "FREE" : formatRs(n));

export const formatRs = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

/**
 * Display lines for a stored breakdown: regular prices, then the early-bird discount, then the total.
 * Older breakdowns (before regular prices were stored) fall back to the charged prices with no discount line.
 */
export function feeLines(f: FeeBreakdown) {
  const hasRegular = f.regularDelegationFee !== undefined && f.regularPerDelegate !== undefined;
  const discount = hasRegular ? (f.discount ?? 0) : 0;
  const delegation = hasRegular ? f.regularDelegationFee! : f.delegationFee;
  const per = hasRegular ? f.regularPerDelegate! : f.perDelegate;
  return {
    lines: [
      { label: "Delegation fee (once per team)", amount: delegation },
      { label: `${f.members} delegates × ${formatRs(per)}`, amount: per * f.members },
    ],
    discount,
    total: f.total,
  };
}
