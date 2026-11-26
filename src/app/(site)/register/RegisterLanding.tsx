import { TrackedLink } from "@/components/analytics/TrackedLink";
import { formatDate, formatDateRange } from "@/lib/dates";
import { formatRs } from "@/lib/fees";
import type { Settings } from "@/lib/types";

const fee = (n: number) => (n === 0 ? "Free" : formatRs(n));

/** What signed-out visitors (and Google) see at /register: what you need, fees, deadlines, sign-in CTA. */
export function RegisterLanding({ settings: s }: { settings: Settings }) {
  const sameDelegation = s.delegation_fee_early === s.delegation_fee_regular;
  return (
    <div className="mt-2">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-text)]">
        Registration · {formatDateRange(s.event_start, s.event_end)}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Register your team for Synaxis 2027</h1>
      <p className="mt-3 text-lg text-[var(--ink-muted)]">
        The Head Delegate registers the whole team in about 10 minutes. Your answers save as you go, your fee is shown instantly, and
        your dashboard tracks payment, waivers and modules.
      </p>

      <div className="mt-6">
        <TrackedLink location="register_landing" href="/login?next=%2Fregister" className="btn btn-primary text-base">
          Sign in to start registering
        </TrackedLink>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Sign in with Google or a one-time email link. No password needed.</p>
      </div>

      <section className="card mt-8 p-5 sm:p-6" aria-labelledby="need">
        <h2 id="need" className="font-display text-xl font-bold">What you&apos;ll need</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            A team of <strong>{s.team_min}–{s.team_max} students</strong>, including you as Head Delegate, all in Grade 9 to
            A-Level/Intermediate (or equivalent).
          </li>
          <li>Each member&apos;s name, email, phone or WhatsApp number, grade and institution.</li>
          <li>A guardian or emergency contact for the Head Delegate.</li>
          <li>
            Your module ranking: every team competes in <strong>{s.modules_min}–{s.modules_max} modules</strong>, and{" "}
            <strong>Kabuki Caper</strong> is compulsory.
          </li>
        </ul>
      </section>

      <section className="band mt-6 rounded-[var(--radius)] p-5 sm:p-6" aria-labelledby="fees">
        <h2 id="fees" className="font-display text-xl font-bold text-[var(--band-heading)]">Fees and deadlines</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm font-semibold sm:grid-cols-2">
          {sameDelegation ? (
            <div className="flex justify-between gap-4"><dt>Delegation fee (once per team)</dt><dd className="font-mono">{fee(s.delegation_fee_early)}</dd></div>
          ) : (
            <>
              <div className="flex justify-between gap-4"><dt>Delegation fee, early bird</dt><dd className="font-mono">{fee(s.delegation_fee_early)}</dd></div>
              <div className="flex justify-between gap-4"><dt>Delegation fee, regular</dt><dd className="font-mono">{fee(s.delegation_fee_regular)}</dd></div>
            </>
          )}
          <div className="flex justify-between gap-4"><dt>Per delegate, early bird</dt><dd className="font-mono">{fee(s.early_fee)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Per delegate, regular</dt><dd className="font-mono">{fee(s.regular_fee)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Early bird ends</dt><dd className="font-mono">{formatDate(s.early_bird_deadline)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Registration closes</dt><dd className="font-mono">{formatDate(s.registration_closes_at)}</dd></div>
          <div className="flex justify-between gap-4"><dt>Payment deadline</dt><dd className="font-mono">{formatDate(s.payment_deadline)}</dd></div>
        </dl>
      </section>

      <section className="card mt-6 p-5 sm:p-6" aria-labelledby="steps">
        <h2 id="steps" className="font-display text-xl font-bold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
          <li>Sign in, then fill in 6 short steps: eligibility, your details, members, modules, consent and review.</li>
          <li>Submit to get your registration ID (like SYN-S1-0042) and your exact total.</li>
          <li>Pay by bank transfer and upload the receipt, or send it on WhatsApp.</li>
          <li>Upload signed waivers. Modules are allocated once payment and waivers are verified.</li>
        </ol>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          By registering you agree to the <a className="plasma-link font-semibold" href="/terms">Terms</a> and{" "}
          <a className="plasma-link font-semibold" href="/privacy">Privacy Policy</a>.
        </p>
      </section>
    </div>
  );
}
