"use server";
import { assertStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBatch } from "@/lib/email/send";
import { Broadcast } from "@/lib/email/templates";
import { audit } from "@/lib/audit";
import { formatRs } from "@/lib/fees";
import { formatDate } from "@/lib/dates";

export type Audience = { statuses: string[]; moduleId: number | null; type: string | null; ids: string[]; allMembers: boolean };

async function recipients(a: Audience) {
  const admin = createAdminClient();
  let q = admin.from("teams").select("id, reg_code, team_name, head_email, total_fee, status, payments(amount, status), module_allocations(module_id), module_preferences(module_id), team_members(email)").neq("status", "cancelled");
  if (a.ids.length) q = q.in("id", a.ids);
  if (a.statuses.length) q = q.in("status", a.statuses as never[]);
  if (a.type) q = q.eq("delegation_type", a.type as never);
  const { data } = await q;
  let teams = data ?? [];
  if (a.moduleId) teams = teams.filter((t) => (t.module_allocations.length ? t.module_allocations : t.module_preferences).some((m) => m.module_id === a.moduleId));
  return teams;
}

export async function previewAudience(a: Audience) {
  await assertStaff("super_admin");
  const teams = await recipients(a);
  const emails = a.allMembers ? [...new Set(teams.flatMap((t) => t.team_members.map((m) => m.email.toLowerCase())))] : teams.map((t) => t.head_email);
  return { teams: teams.length, emails: emails.length, sample: teams.slice(0, 5).map((t) => `${t.reg_code} ${t.team_name}`) };
}

/** Sends a broadcast. Placeholders: {{team_name}} {{reg_code}} {{total}} {{balance}} {{payment_deadline}} */
export async function sendBroadcast(a: Audience, subject: string, body: string, template: string) {
  const staff = await assertStaff("super_admin");
  if (subject.trim().length < 3 || body.trim().length < 10) return { ok: false as const, error: "Write a subject and a message." };
  const teams = await recipients(a);
  if (!teams.length) return { ok: false as const, error: "No recipients match." };
  const { data: s } = await createAdminClient().from("settings").select("payment_deadline").eq("id", 1).single();
  const fill = (txt: string, t: (typeof teams)[number]) => {
    const paid = t.payments.filter((p) => p.status === "verified").reduce((x, p) => x + p.amount, 0);
    return txt
      .replaceAll("{{team_name}}", t.team_name)
      .replaceAll("{{reg_code}}", t.reg_code)
      .replaceAll("{{total}}", formatRs(t.total_fee))
      .replaceAll("{{balance}}", formatRs(Math.max(0, t.total_fee - paid)))
      .replaceAll("{{payment_deadline}}", s ? formatDate(s.payment_deadline, true) : "");
  };
  const items = teams.flatMap((t) => {
    const to = a.allMembers ? [...new Set(t.team_members.map((m) => m.email.toLowerCase()))] : [t.head_email];
    return to.map((email) => ({ to: email, subject: fill(subject, t), teamId: t.id, react: Broadcast({ heading: fill(subject, t), body: fill(body, t) }) }));
  });
  const r = await sendBatch(items, `broadcast:${template}`, staff.id);
  await audit({ actor: { id: staff.id, email: staff.email }, action: "email.broadcast", entity: "email", entityId: template, after: { subject, recipients: items.length, ...r, audience: a } });
  return { ok: true as const, ...r, total: items.length };
}
