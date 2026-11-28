import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toKarachiLocalInput } from "@/lib/dates";
import { ActionForm, F, Toggle } from "@/components/admin/ActionForm";
import { savePaymentDetails, saveSettings } from "../content/actions";
import { MapField } from "@/components/admin/MapField";
import { EarlyBirdPreviewToggle } from "@/components/earlybird/EarlyBirdPreviewToggle";

export const instant = false;
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireStaff("super_admin");
  const admin = createAdminClient();
  const [{ data: s }, { data: b }] = await Promise.all([admin.from("settings").select("*").eq("id", 1).single(), admin.from("payment_details").select("*").eq("id", 1).single()]);
  if (!s || !b) return null;
  const dt = (v: string) => toKarachiLocalInput(v);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Control panel</p>
        <h1 className="font-display text-3xl font-extrabold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">All times are Pakistan time (PKT). Changes are logged in the audit log and go live on the public site immediately.</p>
      </div>

      <ActionForm action={saveSettings} className="space-y-6">
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">Registration</h2>
          <div className="mt-3 flex flex-wrap gap-6">
            <Toggle name="registration_open" defaultChecked={s.registration_open} label="Registration open (master switch)" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <F label="Opens at"><input className="field" type="datetime-local" name="registration_opens_at" defaultValue={dt(s.registration_opens_at)} required /></F>
            <F label="Early bird ends"><input className="field" type="datetime-local" name="early_bird_deadline" defaultValue={dt(s.early_bird_deadline)} required /></F>
            <F label="Registration closes" hint="Head Delegates can edit teams until this time."><input className="field" type="datetime-local" name="registration_closes_at" defaultValue={dt(s.registration_closes_at)} required /></F>
            <F label="Payment deadline"><input className="field" type="datetime-local" name="payment_deadline" defaultValue={dt(s.payment_deadline)} required /></F>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">Fees (Rs)</h2>
          <p className="text-xs text-[var(--ink-muted)]">Total = delegation fee + members × per-delegate fee. Early-bird amounts apply to teams that submit before the early-bird deadline. Teams keep the fee they registered with.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <F label="Delegation fee per team, early bird"><input className="field" type="number" min={0} name="delegation_fee_early" defaultValue={s.delegation_fee_early} /></F>
            <F label="Delegation fee per team, regular"><input className="field" type="number" min={0} name="delegation_fee_regular" defaultValue={s.delegation_fee_regular} /></F>
            <F label="Per delegate, early bird"><input className="field" type="number" min={0} name="early_fee" defaultValue={s.early_fee} /></F>
            <F label="Per delegate, regular"><input className="field" type="number" min={0} name="regular_fee" defaultValue={s.regular_fee} /></F>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">Team & module rules</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <F label="Team size min (incl. head)"><input className="field" type="number" min={1} name="team_min" defaultValue={s.team_min} /></F>
            <F label="Team size max"><input className="field" type="number" min={1} name="team_max" defaultValue={s.team_max} /></F>
            <F label="Best Overall Institute: min teams"><input className="field" type="number" min={0} name="best_institute_min_teams" defaultValue={s.best_institute_min_teams} /></F>
            <F label="Modules per team min (incl. compulsory)"><input className="field" type="number" min={1} name="modules_min" defaultValue={s.modules_min} /></F>
            <F label="Modules per team max"><input className="field" type="number" min={1} name="modules_max" defaultValue={s.modules_max} /></F>
            <F label="Internal email domain" hint="Heuser students"><input className="field" name="internal_email_domain" defaultValue={s.internal_email_domain} /></F>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">Event & contact</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <F label="Season label"><input className="field" name="season_label" defaultValue={s.season_label} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Event start"><input className="field" type="date" name="event_start" defaultValue={s.event_start} /></F>
              <F label="Event end"><input className="field" type="date" name="event_end" defaultValue={s.event_end} /></F>
            </div>
            <F label="Venue name"><input className="field" name="venue_name" defaultValue={s.venue_name} /><Todo v={s.venue_name} /></F>
            <F label="Venue address"><input className="field" name="venue_address" defaultValue={s.venue_address} /></F>
            <MapField defaultValue={s.venue_map_url} fallbackQuery={[s.venue_name, s.venue_address].filter(Boolean).join(", ")} />
            <F label="Contact email" hint={todo(s.contact_email) ? "Still the placeholder shown in the site footer. Replace before launch." : undefined}><input className="field" type="email" name="contact_email" defaultValue={s.contact_email} /><Todo v={s.contact_email} /></F>
            <F label="Contact WhatsApp" hint={todo(s.contact_whatsapp) ? "Still the placeholder shown in the site footer. Replace before launch." : undefined}><input className="field" name="contact_whatsapp" defaultValue={s.contact_whatsapp} /><Todo v={s.contact_whatsapp} /></F>
            <F label="Instagram URL"><input className="field" name="instagram_url" defaultValue={s.instagram_url} /></F>
            <F label="Waiver template URL" hint="Default /waiver (printable). Or a PDF link."><input className="field" name="waiver_template_url" defaultValue={s.waiver_template_url} /></F>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">Site announcement banner</h2>
          <F label="Message" className="mt-3"><input className="field" name="announcement" defaultValue={s.announcement} maxLength={280} placeholder="e.g. Early-bird ends Sunday!" /></F>
          <div className="mt-3"><Toggle name="announcement_active" defaultChecked={s.announcement_active} label="Show banner" /></div>
        </section>
      </ActionForm>

      <ActionForm action={savePaymentDetails} submitLabel="Save bank details">
        <section className="card p-5">
          <h2 className="font-display text-lg font-bold">Bank details (shown to registered Head Delegates only)</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <F label="Bank"><input className="field" name="bank_name" defaultValue={b.bank_name} /></F>
            <F label="Account title"><input className="field" name="account_title" defaultValue={b.account_title} /></F>
            <F label="Account number"><input className="field" name="account_number" defaultValue={b.account_number} /></F>
            <F label="IBAN"><input className="field font-mono" name="iban" defaultValue={b.iban} /></F>
            <F label="WhatsApp for receipts" hint="Digits with country code, e.g. 923001234567"><input className="field" name="receipt_whatsapp" defaultValue={b.receipt_whatsapp} /></F>
            <F label="Instructions"><input className="field" name="instructions" defaultValue={b.instructions} /></F>
          </div>
        </section>
      </ActionForm>
      <section className="card mt-6 p-5">
        <h2 className="font-display text-lg font-bold">Early-bird preview</h2>
        <p className="mb-3 text-xs text-[var(--ink-muted)]">The public site switches to regular prices automatically when the early-bird deadline (Registration section above) passes.</p>
        <EarlyBirdPreviewToggle />
      </section>
    </div>
  );
}

/** Placeholder values seeded at launch: flagged until the Cabinet fills them in. */
const todo = (v: string) => /example\.com|0000000|TBC/i.test(v);
function Todo({ v }: { v: string }) {
  return todo(v) ? <span className="ml-2 rounded bg-[#FBBF24]/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--warning)]">TODO: placeholder</span> : null;
}
