"use server";
import { revalidatePath } from "next/cache";
import { assertStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { allocate } from "@/lib/allocation";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { ModulesAllocated } from "@/lib/email/templates";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
export type PlanRow = { teamId: string; regCode: string; teamName: string; status: string; prefs: number[]; modules: number[]; filled: number[]; short: boolean };

async function context() {
  const admin = createAdminClient();
  const [{ data: settings }, { data: modules }] = await Promise.all([
    admin.from("settings").select("modules_min, modules_max").eq("id", 1).single(),
    admin.from("modules").select("id, name, capacity, is_compulsory, is_active").eq("is_active", true).order("sort"),
  ]);
  return { admin, min: settings!.modules_min, max: settings!.modules_max, modules: modules ?? [] };
}

export async function previewAllocation(includeWaiverPending: boolean, reallocateAll: boolean): Promise<Result<{ rows: PlanRow[]; load: Record<number, number> }>> {
  await assertStaff("super_admin");
  const { admin, min, max, modules } = await context();
  const statuses = includeWaiverPending ? ["verified", "waiver_pending"] : ["verified"];
  if (reallocateAll) statuses.push("modules_allocated");
  const [{ data: teams }, { data: existing }] = await Promise.all([
    admin.from("teams").select("id, reg_code, team_name, status, submitted_at, module_preferences(module_id, rank)").in("status", statuses as never[]),
    admin.from("module_allocations").select("team_id, module_id"),
  ]);
  const ids = new Set((teams ?? []).map((t) => t.id));
  // Teams already allocated (and not being re-run) still occupy capacity.
  const fixedLoad = (existing ?? []).filter((a) => !ids.has(a.team_id));
  const capModules = modules.map((m) => ({ ...m, capacity: m.capacity == null ? null : Math.max(0, m.capacity - fixedLoad.filter((a) => a.module_id === m.id).length) }));
  const r = allocate((teams ?? []).map((t) => ({ id: t.id, submitted_at: t.submitted_at, prefs: t.module_preferences })), capModules, min, max);
  const load: Record<number, number> = {};
  for (const m of modules) load[m.id] = (r.load[m.id] ?? 0) + fixedLoad.filter((a) => a.module_id === m.id).length;
  return {
    ok: true,
    data: {
      load,
      rows: (teams ?? []).map((t) => ({
        teamId: t.id, regCode: t.reg_code, teamName: t.team_name, status: t.status,
        prefs: [...t.module_preferences].filter((p) => p.rank > 0).sort((a, b) => a.rank - b.rank).map((p) => p.module_id),
        ...r.byTeam[t.id],
      })),
    },
  };
}

/** Writes allocations for the given teams (replacing theirs), sets status, optionally emails. */
export async function applyAllocation(plan: { teamId: string; modules: number[] }[], notify: boolean): Promise<Result<{ applied: number }>> {
  const staff = await assertStaff("super_admin");
  const { admin, min, max, modules } = await context();
  const compulsory = modules.filter((m) => m.is_compulsory).map((m) => m.id);
  const valid = new Set(modules.map((m) => m.id));
  for (const p of plan) {
    const set = new Set(p.modules);
    if (set.size !== p.modules.length) return { ok: false, error: "A team has a duplicate module." };
    if (p.modules.some((id) => !valid.has(id))) return { ok: false, error: "Unknown module in plan." };
    if (compulsory.some((c) => !set.has(c))) return { ok: false, error: "Every team must include the compulsory module(s)." };
    if (set.size < min || set.size > max) return { ok: false, error: `Each team needs ${min}–${max} modules.` };
  }
  const teamIds = plan.map((p) => p.teamId);
  const { data: teams } = await admin.from("teams").select("id, reg_code, team_name, head_email, status").in("id", teamIds);
  const blocked = (teams ?? []).filter((t) => ["cancelled", "pending_payment", "under_review", "rejected", "reupload_requested"].includes(t.status));
  if (blocked.length) return { ok: false, error: `${blocked[0].reg_code} isn't verified yet.` };

  const { error: delErr } = await admin.from("module_allocations").delete().in("team_id", teamIds);
  if (delErr) return { ok: false, error: delErr.message };
  const rows = plan.flatMap((p) => p.modules.map((module_id) => ({ team_id: p.teamId, module_id, allocated_by: staff.id })));
  const { error } = await admin.from("module_allocations").insert(rows);
  if (error) return { ok: false, error: error.message };
  await admin.from("teams").update({ status: "modules_allocated" }).in("id", teamIds).neq("status", "checked_in");
  const name = (id: number) => modules.find((m) => m.id === id)?.name ?? String(id);
  for (const p of plan) {
    const t = teams?.find((x) => x.id === p.teamId);
    await audit({ actor: { id: staff.id, email: staff.email }, action: "modules.allocated", entity: "team", entityId: p.teamId, teamId: p.teamId, before: { status: t?.status }, after: { modules: p.modules.map(name) } });
    if (notify && t) {
      await sendEmail({ to: t.head_email, subject: `${t.reg_code} · Your Synaxis modules`, template: "modules-allocated", teamId: t.id, sentBy: staff.id, react: ModulesAllocated({ teamName: t.team_name, regCode: t.reg_code, modules: p.modules.map(name) }) });
    }
  }
  revalidatePath("/admin", "layout");
  return { ok: true, data: { applied: plan.length } };
}
