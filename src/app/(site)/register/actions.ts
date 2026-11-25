"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { getModules, getSettings, registrationState, rulesFrom } from "@/lib/content";
import { computeFee } from "@/lib/fees";
import { normalizePkMobile } from "@/lib/phone";
import { registrationBase, ruleIssues, type RegistrationData } from "@/lib/validation/registration";
import { sendEmail } from "@/lib/email/send";
import { RegistrationReceived } from "@/lib/email/templates";
import { formatDate } from "@/lib/dates";
import type { PaymentDetails } from "@/lib/types";
import type { Json } from "@/lib/database.types";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: { path: (string | number)[]; message: string }[] };

/** Autosave: the owner's draft row (RLS: owner only). */
export async function saveDraft(data: unknown, step: number): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Signed out" };
  if (JSON.stringify(data).length > 50_000) return { ok: false, error: "Draft too large" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("registration_drafts")
    .upsert({ owner_id: user.id, data: (data ?? {}) as NonNullable<Json>, step: Math.min(6, Math.max(1, step)) });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function checkTeamName(name: string, excludeTeamId?: string): Promise<{ available: boolean }> {
  const user = await getUser();
  if (!user) return { available: true };
  if (!(await rateLimit("team-name", 60, 60, user.id))) return { available: true };
  const key = name.trim().replace(/\s+/g, " ").toLowerCase();
  if (key.length < 2) return { available: true };
  let q = createAdminClient().from("teams").select("id").eq("team_name_key", key).limit(1);
  if (excludeTeamId) q = q.neq("id", excludeTeamId);
  const { data } = await q;
  return { available: !data?.length };
}

function normalise(d: RegistrationData): RegistrationData {
  return {
    ...d,
    head_whatsapp: normalizePkMobile(d.head_whatsapp) ?? d.head_whatsapp,
    team_name: d.team_name.trim().replace(/\s+/g, " "),
  };
}

/** Creates (or, with teamId, updates) the registration. All checks re-run on the server. */
export async function submitRegistration(raw: unknown, teamId?: string): Promise<ActionResult<{ regCode: string }>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Your session expired. Sign in again; your answers are saved." };
  if (!(await rateLimit("submit", 8, 600, user.id))) return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };

  const [settings, modules] = await Promise.all([getSettings(), getModules()]);
  const now = new Date();
  if (registrationState(settings, now) !== "open") {
    return { ok: false, error: "Registration is closed right now." };
  }

  const parsed = registrationBase.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some answers need attention.",
      fieldErrors: parsed.error.issues.map((i) => ({ path: i.path as (string | number)[], message: i.message })),
    };
  }
  const d = normalise(parsed.data);
  const rules = rulesFrom(settings, modules);
  const issues = ruleIssues(d, rules);
  if (issues.length) return { ok: false, error: issues[0].message, fieldErrors: issues };

  const admin = createAdminClient();
  let existing: { id: string; submitted_at: string; status: string; total_fee: number } | null = null;
  {
    const { data } = await admin.from("teams").select("id, submitted_at, status, total_fee").eq("owner_id", user.id).maybeSingle();
    existing = data;
  }
  if (teamId) {
    if (!existing || existing.id !== teamId) return { ok: false, error: "Team not found." };
    if (["cancelled", "modules_allocated", "checked_in"].includes(existing.status))
      return { ok: false, error: "This team can no longer be edited online. Contact the organisers." };
  } else if (existing) {
    return { ok: false, error: "You've already registered a team. Open your dashboard to edit it." };
  }

  const { available } = await checkTeamName(d.team_name, teamId);
  if (!available) return { ok: false, error: "That team name is taken.", fieldErrors: [{ path: ["team_name"], message: "That team name is taken." }] };

  // Fee tier is fixed by the ORIGINAL submission time (A4).
  const tierAt = existing ? new Date(existing.submitted_at) : now;
  const fee = computeFee(settings, d.members.length + 1, tierAt);
  const compulsory = rules.compulsoryModuleIds;
  const ranked = d.module_ranking.filter((id) => !compulsory.includes(id));

  const teamPayload = {
    team_name: d.team_name,
    delegation_type: d.delegation_type,
    head_name: d.head_name,
    head_email: d.head_email,
    head_whatsapp: d.head_whatsapp,
    head_alt_phone: d.head_alt_phone ?? "",
    head_grade: d.head_grade,
    institution: d.institution,
    city: d.city,
    guardian_name: d.guardian_name,
    guardian_phone: d.guardian_phone,
    heard_from: d.heard_from,
    heard_from_other: d.heard_from_other ?? "",
    needs: d.needs ?? "",
    consents: { rules: true, conduct: true, dress: true, media: true, eligibility: true, at: now.toISOString() },
    member_count: fee.members,
    fee_tier: fee.tier,
    total_fee: fee.total,
    fee_breakdown: fee,
  };

  const { data: team, error } = await admin.rpc("save_team", {
    p_owner: user.id,
    p_team_id: (teamId ?? null) as unknown as string, // SQL accepts null = create
    p_team: teamPayload,
    p_members: d.members,
    p_module_ids: ranked,
    p_compulsory_ids: compulsory,
  });
  if (error || !team) {
    if (error?.code === "23505") return { ok: false, error: "That team name is taken.", fieldErrors: [{ path: ["team_name"], message: "That team name is taken." }] };
    console.error("save_team failed", error);
    return { ok: false, error: "We couldn't save your registration. Please try again in a moment." };
  }
  const t = team as { id: string; reg_code: string; team_name: string };

  await admin.from("registration_drafts").delete().eq("owner_id", user.id);
  await audit({
    actor: { id: user.id, email: user.email },
    action: teamId ? "team.edited_by_owner" : "team.registered",
    entity: "team",
    entityId: t.id,
    teamId: t.id,
    before: existing ? { total_fee: existing.total_fee } : null,
    after: { total_fee: fee.total, members: fee.members, modules: ranked },
  });

  if (!teamId) {
    const { data: bank } = await admin.from("payment_details").select("*").eq("id", 1).single();
    await sendEmail({
      to: d.head_email,
      subject: `${t.reg_code} · Synaxis registration received`,
      template: "registration-received",
      teamId: t.id,
      react: RegistrationReceived({
        teamName: t.team_name,
        regCode: t.reg_code,
        fee,
        bank: bank as PaymentDetails,
        paymentDeadline: formatDate(settings.payment_deadline, true),
      }),
    });
  }
  return { ok: true, data: { regCode: t.reg_code } };
}
