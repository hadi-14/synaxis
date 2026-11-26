-- Delegation fee (per team) now has separate early-bird and regular amounts,
-- chosen by the same rule as the per-delegate fee (submission time vs early_bird_deadline).
alter table public.settings rename column delegation_fee to delegation_fee_early;
alter table public.settings add column delegation_fee_regular int not null default 4500 check (delegation_fee_regular >= 0);
update public.settings set delegation_fee_regular = delegation_fee_early;
