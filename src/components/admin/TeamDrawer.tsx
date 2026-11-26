"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast-store";
import { formatRs, type FeeBreakdown } from "@/lib/fees";
import { formatDate } from "@/lib/dates";
import { STATUS_LABEL, type Module, type TeamStatus } from "@/lib/types";
import { recordManualPayment, rejectPayment, saveAdminNotes, setTeamCancelled, setWaiverReceived, signedFileUrl, verifyPayment } from "@/app/admin/actions";
import { statusTone } from "./TeamsTable";
import { CloseIcon } from "@/components/ui/Icon";

type Member = { id: string; position: number; is_head: boolean; full_name: string; email: string; phone: string; grade: string; institution: string };
type Payment = { id: string; amount: number; method: string; receipt_path: string | null; status: string; notes: string | null; created_at: string; reviewed_at: string | null };
type Waiver = { id: string; member_id: string | null; file_path: string; received: boolean; uploaded_at: string };
type Team = {
  id: string; reg_code: string; team_name: string; status: TeamStatus; delegation_type: string; institution: string; city: string;
  head_name: string; head_email: string; head_whatsapp: string; head_alt_phone: string | null; guardian_name: string; guardian_phone: string;
  heard_from: string; needs: string | null; total_fee: number; fee_breakdown: FeeBreakdown; submitted_at: string; admin_notes: string | null; whatsapp_shared_at: string | null;
  team_members: Member[]; module_preferences: { module_id: number; rank: number }[]; module_allocations: { module_id: number }[];
  payments: Payment[]; waivers: Waiver[]; checkins: { day_no: number; module_id: number | null }[];
  audit: { id: number; action: string; actor_email: string | null; note: string | null; created_at: string }[];
};

/** Detail drawer — inflates out of Baymax's charging case. */
export function TeamDrawer({ team, modules, closeHref, canFinance, canSuper }: { team: Team; modules: Module[]; closeHref: string; canFinance: boolean; canSuper: boolean; paymentDeadline: string }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<{ url: string; pdf: boolean } | null>(null);
  const [notes, setNotes] = useState(team.admin_notes ?? "");
  const [reason, setReason] = useState("");
  const [manual, setManual] = useState("");
  const close = () => router.push(closeHref, { scroll: false });

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(r.error ?? "Something went wrong");
    });

  const view = async (bucket: "receipts" | "waivers", path: string) => {
    const r = await signedFileUrl(bucket, path);
    if (r.ok) setPreview({ url: r.data!.url, pdf: path.endsWith(".pdf") });
    else toast.error(r.error);
  };

  const members = [...team.team_members].sort((a, b) => a.position - b.position);
  const payments = [...team.payments].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const verified = payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
  const modName = (id: number) => modules.find((m) => m.id === id)?.name ?? `#${id}`;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button aria-label="Close details" className="absolute inset-0 bg-[#0b1220]/50 backdrop-blur-[2px]" onClick={close} />
      <div ref={panel} tabIndex={-1} className="inflate-in absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto bg-[var(--bg)] shadow-2xl outline-none sm:rounded-l-[var(--radius)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <div>
            <p className="font-mono text-xs font-bold text-[var(--primary-text)]">{team.reg_code}</p>
            <h2 id="drawer-title" className="font-display text-xl font-extrabold">{team.team_name}</h2>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[team.status]}`}>{STATUS_LABEL[team.status]}</span>
          </div>
          <Link href={closeHref} scroll={false} className="btn btn-ghost grid !min-h-9 w-9 place-items-center !px-0" aria-label="Close"><CloseIcon /></Link>
        </div>

        <div className="space-y-5 p-5">
          {/* contact */}
          <section className="card p-4 text-sm">
            <h3 className="font-display font-bold">Head Delegate</h3>
            <p className="mt-1">{team.head_name} · <a className="plasma-link" href={`mailto:${team.head_email}`}>{team.head_email}</a></p>
            <p>WhatsApp <a className="plasma-link" href={`https://wa.me/${team.head_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">{team.head_whatsapp}</a>{team.head_alt_phone ? ` · alt ${team.head_alt_phone}` : ""}</p>
            <p className="text-[var(--ink-muted)]">{team.institution}, {team.city} · {team.delegation_type.replace(/_/g, " ")}</p>
            <p className="text-[var(--ink-muted)]">Guardian: {team.guardian_name} ({team.guardian_phone})</p>
            {team.needs && <p className="mt-2 rounded bg-[var(--surface-2)] p-2">Needs: {team.needs}</p>}
          </section>

          {/* payment */}
          <section className="card p-4 text-sm">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display font-bold">Payment</h3>
              <p className="font-mono">{formatRs(verified)} / {formatRs(team.total_fee)}</p>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">
              {formatRs(team.fee_breakdown.delegationFee)} + {team.fee_breakdown.members} × {formatRs(team.fee_breakdown.perDelegate)} ({team.fee_breakdown.tier})
              {team.whatsapp_shared_at && ` · WhatsApp opened ${formatDate(team.whatsapp_shared_at, true)}`}
            </p>
            {payments.length === 0 && <p className="mt-3 text-[var(--ink-muted)]">No receipt uploaded yet.</p>}
            <ul className="mt-3 space-y-3">
              {payments.map((p) => (
                <li key={p.id} className="rounded-[var(--radius-sm)] border border-[var(--line)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{formatDate(p.created_at, true)} · {p.method} · <strong className="font-mono">{formatRs(p.amount)}</strong></span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "verified" ? statusTone.verified : p.status === "under_review" ? statusTone.under_review : statusTone.rejected}`}>{p.status.replace("_", " ")}</span>
                  </div>
                  {p.notes && <p className="mt-1 text-xs text-[var(--ink-muted)]">Note: {p.notes}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.receipt_path && canFinance && <button className="btn btn-secondary !min-h-9 text-xs" onClick={() => view("receipts", p.receipt_path!)}>View receipt</button>}
                    {canFinance && p.status === "under_review" && (
                      <>
                        <button disabled={pending} className="btn btn-primary !min-h-9 text-xs" onClick={() => run(() => verifyPayment(p.id, null, ""), "Payment verified")}>Verify</button>
                        <button disabled={pending} className="btn btn-secondary !min-h-9 text-xs" onClick={() => run(() => rejectPayment(p.id, reason, true), "Re-upload requested")}>Request re-upload</button>
                        <button disabled={pending} className="btn btn-danger !min-h-9 text-xs" onClick={() => run(() => rejectPayment(p.id, reason, false), "Payment rejected")}>Reject</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {canFinance && payments.some((p) => p.status === "under_review") && (
              <label className="mt-3 block text-xs font-semibold">
                Reason for the team (needed for reject / re-upload)
                <input className="field mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Amount doesn't match; reference missing" />
              </label>
            )}
            {preview && (
              <div className="mt-3 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)]">
                <div className="flex justify-between bg-[var(--surface-2)] px-3 py-1.5 text-xs">
                  <a href={preview.url} target="_blank" rel="noopener" className="font-semibold underline">Open full size</a>
                  <button onClick={() => setPreview(null)}>Close preview</button>
                </div>
                {preview.pdf ? <iframe src={preview.url} title="Receipt PDF" className="h-96 w-full" /> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.url} alt="Uploaded receipt" className="max-h-[480px] w-full object-contain bg-white" />
                )}
              </div>
            )}
            {canFinance && verified < team.total_fee && (
              <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--line)] pt-3">
                <label className="text-xs font-semibold">
                  Record WhatsApp/cash payment (Rs)
                  <input inputMode="numeric" className="field mt-1 !min-h-10 w-40" value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))} placeholder={String(team.total_fee - verified)} />
                </label>
                <button disabled={pending || !manual} className="btn btn-secondary !min-h-10 text-xs" onClick={() => run(() => recordManualPayment(team.id, Number(manual), "WhatsApp receipt checked"), "Payment recorded and verified")}>Record & verify</button>
              </div>
            )}
          </section>

          {/* waivers */}
          <section className="card p-4 text-sm">
            <h3 className="font-display font-bold">Waivers</h3>
            {team.waivers.length === 0 && <p className="mt-2 text-[var(--ink-muted)]">None uploaded yet.</p>}
            <ul className="mt-2 divide-y divide-[var(--line)]">
              {team.waivers.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{w.member_id ? members.find((m) => m.id === w.member_id)?.full_name ?? "Member" : "Combined PDF"} <span className="text-xs text-[var(--ink-muted)]">· {formatDate(w.uploaded_at)}</span></span>
                  <span className="flex gap-2">
                    <button className="btn btn-ghost !min-h-8 text-xs" onClick={() => view("waivers", w.file_path)}>View</button>
                    {canFinance && (
                      <label className="flex items-center gap-1.5 text-xs font-semibold">
                        <input type="checkbox" className="h-4 w-4 accent-[var(--success)]" checked={w.received} disabled={pending} onChange={(e) => run(() => setWaiverReceived(w.id, e.target.checked), e.target.checked ? "Waiver marked received" : "Waiver unmarked")} />
                        Received
                      </label>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* members + modules */}
          <section className="card p-4 text-sm">
            <h3 className="font-display font-bold">Members ({members.length})</h3>
            <ul className="mt-2 space-y-1.5">
              {members.map((m) => (
                <li key={m.id}><strong>{m.full_name}</strong>{m.is_head ? " (Head)" : ""} · {m.grade} · <span className="text-[var(--ink-muted)]">{m.email} · {m.phone}</span></li>
              ))}
            </ul>
            <h3 className="mt-4 font-display font-bold">Modules</h3>
            <p className="mt-1">
              {team.module_allocations.length ? <>Allocated: {team.module_allocations.map((a) => modName(a.module_id)).join(", ")}</> : <>Preferences: {[...team.module_preferences].sort((a, b) => a.rank - b.rank).map((p) => `${p.rank === 0 ? "🔒" : p.rank + "."} ${modName(p.module_id)}`).join(" · ")}</>}
            </p>
          </section>

          {/* notes + danger */}
          {canFinance && (
            <section className="card p-4 text-sm">
              <label className="font-display font-bold" htmlFor="notes">Internal notes</label>
              <textarea id="notes" className="field mt-2 min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button disabled={pending} className="btn btn-secondary mt-2 !min-h-9 text-xs" onClick={() => run(() => saveAdminNotes(team.id, notes), "Notes saved")}>Save notes</button>
            </section>
          )}
          {canSuper && (
            <section className="card border-[var(--danger)]/40 p-4 text-sm">
              <h3 className="font-display font-bold">Registration</h3>
              {team.status === "cancelled" ? (
                <button disabled={pending} className="btn btn-secondary mt-2 !min-h-9 text-xs" onClick={() => run(() => setTeamCancelled(team.id, false, ""), "Team reinstated")}>Reinstate team</button>
              ) : (
                <button disabled={pending} className="btn btn-danger mt-2 !min-h-9 text-xs" onClick={() => confirm(`Cancel ${team.team_name}? The team will be told by email only if you send one.`) && run(() => setTeamCancelled(team.id, true, ""), "Team cancelled")}>Cancel registration</button>
              )}
            </section>
          )}

          {/* audit */}
          <section className="card p-4 text-sm">
            <h3 className="font-display font-bold">History</h3>
            <ol className="mt-2 space-y-1.5 border-l-2 border-dotted border-[var(--line-strong)] pl-3">
              {team.audit.map((a) => (
                <li key={a.id}>
                  <span className="font-mono text-xs">{formatDate(a.created_at, true)}</span> · <strong>{a.action}</strong> <span className="text-[var(--ink-muted)]">by {a.actor_email ?? "system"}{a.note ? ` — ${a.note}` : ""}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
