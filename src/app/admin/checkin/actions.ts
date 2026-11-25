"use server";
import { assertStaff, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

export type CheckinResult =
  | {
      ok: true;
      already: boolean;
      team: { id: string; reg_code: string; team_name: string; institution: string; members: string[]; modules: string[]; status: string };
      warnings: string[];
    }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Accepts a scanned QR (URL containing ?t=token, or the bare token) or a typed registration ID. */
export async function checkIn(input: string, day: number, moduleId: number | null): Promise<CheckinResult> {
  const staff = await assertStaff();
  if (![1, 2, 3].includes(day)) return { ok: false, error: "Pick day 1, 2 or 3." };
  const admin = createAdminClient();
  const raw = input.trim();
  let token: string | null = null;
  try {
    token = new URL(raw).searchParams.get("t");
  } catch {
    if (UUID.test(raw)) token = raw;
  }
  const q = admin.from("teams").select("id, reg_code, team_name, institution, status, team_members(full_name, position), module_allocations(module_id), modules:module_allocations(modules(name))");
  const { data: team } = token
    ? await q.eq("checkin_token", token).maybeSingle()
    : await q.ilike("reg_code", raw.toUpperCase().replace(/^(\d+)$/, (n) => `SYN-S1-${n.padStart(4, "0")}`)).maybeSingle();
  if (!team) return { ok: false, error: "No team matches that code." };
  if (moduleId && !hasRole(staff, "super_admin", "finance") && !staff.moduleIds.includes(moduleId)) return { ok: false, error: "You can only check in for your own module." };

  const warnings: string[] = [];
  if (team.status === "cancelled") return { ok: false, error: `${team.reg_code} is cancelled.` };
  if (!["modules_allocated", "checked_in", "verified"].includes(team.status)) warnings.push(`Status is “${team.status.replace(/_/g, " ")}”: payment or waivers may be incomplete.`);
  if (moduleId && !team.module_allocations.some((a) => a.module_id === moduleId)) warnings.push("This team isn't allocated to this module.");

  const { error } = await admin.from("checkins").insert({ team_id: team.id, day_no: day, module_id: moduleId, checked_in_by: staff.id });
  const already = error?.code === "23505";
  if (error && !already) return { ok: false, error: error.message };
  if (!already) {
    if (team.status !== "checked_in" && !moduleId) await admin.from("teams").update({ status: "checked_in" }).eq("id", team.id);
    await audit({ actor: { id: staff.id, email: staff.email }, action: "checkin.recorded", entity: "checkin", teamId: team.id, after: { day, moduleId } });
  }
  return {
    ok: true,
    already,
    warnings,
    team: {
      id: team.id,
      reg_code: team.reg_code,
      team_name: team.team_name,
      institution: team.institution,
      status: team.status,
      members: [...team.team_members].sort((a, b) => a.position - b.position).map((m) => m.full_name),
      modules: (team.modules as unknown as { modules: { name: string } | null }[]).map((m) => m.modules?.name ?? "").filter(Boolean),
    },
  };
}

export async function undoCheckIn(teamId: string, day: number, moduleId: number | null) {
  const staff = await assertStaff("super_admin");
  const admin = createAdminClient();
  let q = admin.from("checkins").delete().eq("team_id", teamId).eq("day_no", day);
  q = moduleId ? q.eq("module_id", moduleId) : q.is("module_id", null);
  await q;
  await audit({ actor: { id: staff.id, email: staff.email }, action: "checkin.undone", entity: "checkin", teamId, after: { day, moduleId } });
  return { ok: true };
}
