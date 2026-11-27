import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getModules, getSettings, registrationState } from "@/lib/content";
import { formatDate } from "@/lib/dates";
import { formatRs, type FeeBreakdown } from "@/lib/fees";
import { waNumber } from "@/lib/phone";
import { STATUS_LABEL, type PaymentDetails, type TeamStatus } from "@/lib/types";
import { ChargingLoader } from "@/components/ui/Battery";
import { Empty } from "@/components/ui/Empty";
import { Motif } from "@/components/brand/Motif";
import { Countdown } from "@/components/site/Countdown";
import { PurseReceipt } from "@/components/dashboard/PurseReceipt";
import { FileDrop } from "@/components/dashboard/FileDrop";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { WelcomeToast } from "@/components/dashboard/WelcomeToast";
import { BaymaxGuide } from "@/components/guide/BaymaxGuide";
import { FeeBreakdownView } from "@/components/earlybird/FeeBreakdownView";

export const metadata: Metadata = { title: "My team", robots: { index: false } };

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <Suspense fallback={<ChargingLoader label="Loading your team" />}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

const PIPELINE: { key: string; label: string }[] = [
  { key: "submitted", label: "Registered" },
  { key: "payment", label: "Payment" },
  { key: "waivers", label: "Waivers" },
  { key: "modules", label: "Modules" },
  { key: "checkin", label: "Check-in" },
];

async function Dashboard({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  await connection(); // per-request: reads the clock and the session
  const sp = await searchParams;
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("*, team_members(*), module_preferences(module_id, rank), module_allocations(module_id), payments(*), waivers(*), checkins(*)")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!team) {
    return (
      <div className="card p-6 text-center">
        <Empty title="No team yet" body="You haven't registered a team with this account. Start your registration; it only takes about 10 minutes." />
        <Link href="/register" className="btn btn-primary">Register your team</Link>
        <p className="mt-4 text-xs text-[var(--ink-muted)]">Signed in as {user.email}. Wrong account? <SignOut /></p>
      </div>
    );
  }

  const [settings, modules, bankRes] = await Promise.all([
    getSettings(),
    getModules(),
    supabase.from("payment_details").select("*").eq("id", 1).maybeSingle(),
  ]);
  const bank = bankRes.data as PaymentDetails | null;
  const status = team.status as TeamStatus;
  const fee = team.fee_breakdown as unknown as FeeBreakdown;
  const members = [...team.team_members].sort((a, b) => a.position - b.position);
  const payments = [...team.payments].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const latest = payments[0];
  const verifiedAmount = payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, team.total_fee - verifiedAmount);
  const combinedWaiver = team.waivers.find((w) => !w.member_id);
  const waiverFor = (memberId: string) => team.waivers.filter((w) => w.member_id === memberId).sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))[0];
  const waiversComplete =
    (combinedWaiver?.received ?? false) || members.every((m) => team.waivers.some((w) => w.member_id === m.id && w.received));
  const allocated = team.module_allocations.map((a) => modules.find((m) => m.id === a.module_id)).filter(Boolean);
  const prefs = [...team.module_preferences].sort((a, b) => a.rank - b.rank).map((p) => modules.find((m) => m.id === p.module_id)).filter(Boolean);
  const canEdit = registrationState(settings, new Date()) === "open" && !["cancelled", "modules_allocated", "checked_in"].includes(status);
  const paid = ["verified", "waiver_pending", "modules_allocated", "checked_in"].includes(status);
  const showQr = ["modules_allocated", "checked_in"].includes(status);

  const stage = (k: string): "done" | "now" | "todo" => {
    switch (k) {
      case "submitted":
        return "done";
      case "payment":
        return paid ? "done" : "now";
      case "waivers":
        return waiversComplete ? "done" : paid ? "now" : "todo";
      case "modules":
        return allocated.length ? "done" : paid && waiversComplete ? "now" : "todo";
      default:
        return status === "checked_in" ? "done" : showQr ? "now" : "todo";
    }
  };

  const waText = encodeURIComponent(
    `Hello Synaxis team! Payment receipt for ${team.team_name} · ${team.reg_code} · amount ${formatRs(balance || team.total_fee)}. Receipt attached.`,
  );
  const waHref = `https://wa.me/${waNumber(bank?.receipt_whatsapp ?? settings.contact_whatsapp)}?text=${waText}`;
  const qrSvg = showQr
    ? await QRCode.toString(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/checkin?t=${team.checkin_token}`, {
        type: "svg",
        margin: 1,
        color: { dark: "#18243A", light: "#FFFFFF" },
      })
    : null;

  return (
    <>
      <WelcomeToast welcome={sp.welcome === "1"} updated={sp.updated === "1"} />
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">Head Delegate dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">{team.team_name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono font-bold text-[var(--primary-text)]">{team.reg_code}</span>
            <CopyButton value={team.reg_code} label="Copy ID" />
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold">{STATUS_LABEL[status]}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && <Link href="/register?edit=1" className="btn btn-secondary">Edit team</Link>}
          <SignOut />
        </div>
      </div>

      {/* pipeline */}
      <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Registration progress">
        {PIPELINE.map((p) => {
          const s = stage(p.key);
          return (
            <li key={p.key} className="flex flex-col gap-1.5">
              <span
                className={`h-2.5 rounded-full ${s === "done" ? "bg-[var(--success)]" : s === "now" ? "battery-cell-charging bg-[var(--primary)]" : "bg-[var(--surface-2)]"}`}
              />
              <span className={`text-[11px] font-semibold sm:text-xs ${s === "todo" ? "text-[var(--ink-muted)]" : ""}`}>
                {p.label}
                <span className="sr-only">: {s === "done" ? "complete" : s === "now" ? "in progress" : "not started"}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {status === "cancelled" && (
        <p className="card mt-6 border-[var(--danger)] p-4 font-semibold text-[var(--danger)]">This registration was cancelled. Contact the organisers if this is unexpected.</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* ---------------------------------------------------------- PAYMENT */}
        <section className="card panel-lines p-5 sm:p-6" aria-labelledby="pay-h">
          <h2 id="pay-h" className="font-display text-xl font-bold">Payment</h2>
          {latest?.status === "rejected" || latest?.status === "reupload_requested" ? (
            <div role="alert" className="mt-3 rounded-[var(--radius-sm)] border-2 border-[var(--danger)] p-3 text-sm">
              <p className="font-bold text-[var(--danger)]">{latest.status === "rejected" ? "Payment could not be verified" : "Please re-upload your receipt"}</p>
              {latest.notes && <p className="mt-1">Reason: {latest.notes}</p>}
            </div>
          ) : null}
          <FeeBreakdownView fee={fee} deadline={settings.early_bird_deadline} className="-mx-5 mt-4 sm:-mx-6" />
          <dl className="mt-2 divide-y divide-[var(--line)] text-sm">
            {verifiedAmount > 0 && <div className="flex justify-between py-2"><dt>Verified so far</dt><dd className="font-mono text-[var(--success)]">− {formatRs(verifiedAmount)}</dd></div>}
            <div className="flex justify-between py-3 text-base"><dt className="font-bold">Balance due</dt><dd className="font-mono text-xl font-extrabold text-[var(--primary-text)]">{formatRs(balance)}</dd></div>
          </dl>

          {balance > 0 && bank && (
            <>
              <div className="mt-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4 text-sm">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Transfer to</p>
                <ul className="mt-2 space-y-1.5">
                  <li className="font-semibold">{bank.bank_name}</li>
                  <li>Title: {bank.account_title}</li>
                  <li className="flex flex-wrap items-center gap-2">Account: <span className="font-mono">{bank.account_number}</span> <CopyButton value={bank.account_number} /></li>
                  <li className="flex flex-wrap items-center gap-2">IBAN: <span className="font-mono">{bank.iban}</span> <CopyButton value={bank.iban} /></li>
                  <li className="flex flex-wrap items-center gap-2">Reference: <span className="font-mono font-bold text-[var(--primary-text)]">{team.reg_code}</span> <CopyButton value={team.reg_code} /></li>
                </ul>
                {bank.instructions && <p className="mt-3 text-[var(--ink-muted)]">{bank.instructions}</p>}
              </div>
              <div className="mt-5">
                <Countdown to={settings.payment_deadline} label={`Payment deadline · ${formatDate(settings.payment_deadline, true)}`} />
              </div>
            </>
          )}

          {status !== "cancelled" && balance > 0 && (
            <div className="mt-6">
              <PurseReceipt waHref={waHref} hasReceipt={!!latest?.receipt_path} />
            </div>
          )}

          {payments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Receipts</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--line)] px-3 py-2">
                    <span>{formatDate(p.created_at, true)} · {formatRs(p.amount)}</span>
                    <span className={`text-xs font-bold uppercase ${p.status === "verified" ? "text-[var(--success)]" : p.status === "under_review" ? "text-[var(--warning)]" : "text-[var(--danger)]"}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {team.whatsapp_shared_at && !latest && (
            <p className="mt-4 text-sm text-[var(--ink-muted)]">You opened WhatsApp on {formatDate(team.whatsapp_shared_at, true)}. Finance will mark it once they find your receipt.</p>
          )}
        </section>

        <div className="space-y-6">
          {/* ---------------------------------------------------------- QR */}
          {showQr && qrSvg && (
            <section className="card p-5 text-center sm:p-6" aria-labelledby="qr-h">
              <h2 id="qr-h" className="font-display text-xl font-bold">Check-in QR</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">Show this at the registration desk each day.</p>
              <div className="mx-auto mt-4 w-56 rounded-[var(--radius-sm)] bg-white p-3" role="img" aria-label={`Check-in QR code for ${team.reg_code}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="mt-2 font-mono text-sm font-bold">{team.reg_code}</p>
              {team.checkins.length > 0 && <p className="mt-2 text-sm text-[var(--success)]">Checked in on day {[...new Set(team.checkins.map((c) => c.day_no))].sort().join(", ")}</p>}
            </section>
          )}

          {/* ---------------------------------------------------------- MODULES */}
          <section className="card p-5 sm:p-6" aria-labelledby="mod-h">
            <h2 id="mod-h" className="font-display text-xl font-bold">{allocated.length ? "Your modules" : "Module preferences"}</h2>
            {!allocated.length && <p className="mt-1 text-sm text-[var(--ink-muted)]">Allocated after payment and waivers are verified.</p>}
            <ul className="mt-4 space-y-2">
              {(allocated.length ? allocated : prefs).map((m, i) => (
                <li key={m!.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--line)] p-2.5" style={{ borderLeft: `4px solid ${m!.accent}` }}>
                  <Motif motif={m!.motif} accent={m!.accent} className="h-8 w-8 text-[var(--ink)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{allocated.length ? "" : m!.is_compulsory ? "🔒 " : `${i + 1 - prefs.filter((x) => x!.is_compulsory).length}. `}{m!.name}</p>
                    <p className="truncate text-xs text-[var(--ink-muted)]">{allocated.length ? m!.schedule_slot || "Schedule TBA" : m!.subject}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* ---------------------------------------------------------- WAIVERS */}
      <section className="card mt-6 p-5 sm:p-6" aria-labelledby="w-h">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="w-h" className="font-display text-xl font-bold">Waivers of liability</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Every delegate needs a signed waiver (a guardian signs for under-18s). Upload one combined PDF, or one per member.
            </p>
          </div>
          <a href={settings.waiver_template_url} target="_blank" rel="noopener" className="btn btn-secondary text-sm">Download template</a>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3">
          <div className="text-sm">
            <p className="font-semibold">Combined PDF (all members)</p>
            <p className="text-xs text-[var(--ink-muted)]">
              {combinedWaiver ? (combinedWaiver.received ? "✓ Received by organisers" : `Uploaded ${formatDate(combinedWaiver.uploaded_at)} · awaiting check`) : "Not uploaded"}
            </p>
          </div>
          <FileDrop memberId={null} label={combinedWaiver ? "Replace" : "Upload combined"} />
        </div>
        <ul className="mt-3 divide-y divide-[var(--line)]">
          {members.map((m) => {
            const w = waiverFor(m.id);
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="text-sm">
                  <p className="font-semibold">{m.full_name}{m.is_head ? " (Head)" : ""}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {w ? (w.received ? "✓ Received" : "Uploaded · awaiting check") : combinedWaiver ? "Covered by combined PDF" : "Not uploaded"}
                  </p>
                </div>
                <FileDrop memberId={m.id} label={w ? "Replace" : "Upload"} />
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------------------------------------------------------- TEAM */}
      <section className="card mt-6 p-5 sm:p-6" aria-labelledby="t-h">
        <h2 id="t-h" className="font-display text-xl font-bold">Team ({members.length})</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {members.map((m) => (
            <li key={m.id} className="rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-sm">
              <p className="font-semibold">{m.full_name}{m.is_head ? " · Head Delegate" : ""}</p>
              <p className="text-[var(--ink-muted)]">{m.grade} · {m.institution}</p>
            </li>
          ))}
        </ul>
        {!canEdit && status !== "cancelled" && <p className="mt-3 text-xs text-[var(--ink-muted)]">Online editing is closed. Contact the organisers for changes.</p>}
      </section>
      <BaymaxGuide />
    </>
  );
}

function SignOut() {
  return (
    <form action="/auth/signout" method="post" className="inline">
      <button className="btn btn-ghost text-sm">Sign out</button>
    </form>
  );
}
