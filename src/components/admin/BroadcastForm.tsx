"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast-store";
import { STATUS_LABEL, type TeamStatus } from "@/lib/types";
import { previewAudience, sendBroadcast, type Audience } from "@/app/admin/emails/actions";

const TEMPLATES: Record<string, { label: string; statuses: string[]; subject: string; body: string }> = {
  payment_reminder: {
    label: "Payment reminder",
    statuses: ["pending_payment", "reupload_requested", "rejected"],
    subject: "{{reg_code}} · Payment reminder",
    body: "Hello {{team_name}},\n\nThis is a gentle reminder that your Synaxis fee of {{balance}} is still due. The payment deadline is {{payment_deadline}}.\n\nTransfer using {{reg_code}} as the reference, then upload the receipt on your dashboard.\n\nI am here to help. — Baymax, on behalf of the Cubinet",
  },
  waiver_reminder: {
    label: "Waiver reminder",
    statuses: ["waiver_pending"],
    subject: "{{reg_code}} · Waivers needed",
    body: "Hello {{team_name}},\n\nYour payment is verified. We still need signed waivers for every member before we can allocate modules.\n\nDownload the template and upload the signed copies on your dashboard.",
  },
  schedule_update: {
    label: "Schedule update",
    statuses: ["modules_allocated"],
    subject: "Synaxis schedule update",
    body: "Hello {{team_name}},\n\nHere is an update to the Synaxis schedule:\n\n…\n\nSee your dashboard for your modules and check-in QR code.",
  },
  custom: { label: "Custom message", statuses: [], subject: "", body: "" },
};

export function BroadcastForm({ modules, ids }: { modules: { id: number; name: string }[]; ids: string[] }) {
  const router = useRouter();
  const [tpl, setTpl] = useState(ids.length ? "custom" : "payment_reminder");
  const [aud, setAud] = useState<Audience>({ statuses: ids.length ? [] : TEMPLATES.payment_reminder.statuses, moduleId: null, type: null, ids, allMembers: false });
  const [subject, setSubject] = useState(TEMPLATES[ids.length ? "custom" : "payment_reminder"].subject);
  const [body, setBody] = useState(TEMPLATES[ids.length ? "custom" : "payment_reminder"].body);
  const [preview, setPreview] = useState<{ teams: number; emails: number; sample: string[] } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let live = true;
    previewAudience(aud).then((p) => live && setPreview(p));
    return () => {
      live = false;
    };
  }, [aud]);

  const pick = (k: string) => {
    setTpl(k);
    setSubject(TEMPLATES[k].subject);
    setBody(TEMPLATES[k].body);
    if (!ids.length) setAud((a) => ({ ...a, statuses: TEMPLATES[k].statuses }));
  };

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap gap-2">
        {Object.entries(TEMPLATES).map(([k, t]) => (
          <button key={k} type="button" onClick={() => pick(k)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${tpl === k ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]" : "border-[var(--line)]"}`}>{t.label}</button>
        ))}
      </div>
      {ids.length > 0 ? (
        <p className="text-sm">Sending to <strong>{ids.length} selected team(s)</strong> from the Teams table.</p>
      ) : (
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="mb-2 text-sm font-semibold">Audience</legend>
          <div className="flex flex-wrap gap-1.5 sm:col-span-3">
            {(Object.keys(STATUS_LABEL) as TeamStatus[]).filter((s) => s !== "draft" && s !== "cancelled").map((s) => {
              const on = aud.statuses.includes(s);
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => setAud((a) => ({ ...a, statuses: on ? a.statuses.filter((x) => x !== s) : [...a.statuses, s] }))} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]" : "border-[var(--line)]"}`}>{STATUS_LABEL[s]}</button>
              );
            })}
          </div>
          <select className="field" aria-label="Module" value={aud.moduleId ?? ""} onChange={(e) => setAud((a) => ({ ...a, moduleId: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Any module</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select className="field" aria-label="Delegation type" value={aud.type ?? ""} onChange={(e) => setAud((a) => ({ ...a, type: e.target.value || null }))}>
            <option value="">Any delegation type</option>
            <option value="internal">Internal</option>
            <option value="external_official">External official</option>
            <option value="external_independent">External independent</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={aud.allMembers} onChange={(e) => setAud((a) => ({ ...a, allMembers: e.target.checked }))} /> All members (not just Head Delegates)</label>
        </fieldset>
      )}
      <label className="block text-sm"><span className="mb-1 block font-semibold">Subject</span><input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
      <label className="block text-sm"><span className="mb-1 block font-semibold">Message</span><textarea className="field min-h-48 font-mono text-sm" value={body} onChange={(e) => setBody(e.target.value)} /></label>
      <p className="text-xs text-[var(--ink-muted)]">Placeholders: {"{{team_name}} {{reg_code}} {{total}} {{balance}} {{payment_deadline}}"}. Blank lines start new paragraphs.</p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <p className="text-sm" aria-live="polite">{preview ? <><strong>{preview.emails}</strong> email(s) to <strong>{preview.teams}</strong> team(s){preview.sample.length ? <span className="text-[var(--ink-muted)]"> · e.g. {preview.sample.join(", ")}</span> : null}</> : "Counting…"}</p>
        <button
          className="btn btn-primary"
          disabled={pending || !preview?.emails}
          onClick={() => {
            if (!confirm(`Send to ${preview?.emails} recipient(s)?`)) return;
            start(async () => {
              const r = await sendBroadcast(aud, subject, body, tpl);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast.success(`Sent ${r.sent}/${r.total}`, r.skipped ? `${r.skipped} skipped (no RESEND_API_KEY).` : r.failed ? `${r.failed} failed — see log.` : undefined);
              router.refresh();
            });
          }}
        >
          {pending ? "Sending…" : "Send broadcast"}
        </button>
      </div>
    </section>
  );
}
