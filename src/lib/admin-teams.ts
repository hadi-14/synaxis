import "server-only";
import { createAdminClient } from "./supabase/admin";
import { hasRole, type StaffContext } from "./auth";

export type TeamFilters = {
  q?: string;
  status?: string;
  module?: string;
  type?: string;
  tier?: string;
  from?: string;
  to?: string;
  sort?: string;
};

/**
 * Teams visible to this staff member, filtered. Module heads only see teams that ranked
 * or were allocated one of their modules (mirrors the RLS rule in can_view_team).
 */
export async function listTeams(staff: StaffContext, f: TeamFilters) {
  const admin = createAdminClient();
  let q = admin
    .from("teams")
    .select("id, reg_code, team_name, status, delegation_type, institution, city, head_name, head_email, head_whatsapp, member_count, total_fee, fee_tier, submitted_at, whatsapp_shared_at, module_preferences(module_id, rank), module_allocations(module_id), payments(status, amount), waivers(received, member_id)");
  if (f.status) q = q.eq("status", f.status as never);
  if (f.type) q = q.eq("delegation_type", f.type as never);
  if (f.tier) q = q.eq("fee_tier", f.tier);
  if (f.from) q = q.gte("submitted_at", `${f.from}T00:00:00+05:00`);
  if (f.to) q = q.lte("submitted_at", `${f.to}T23:59:59+05:00`);
  if (f.q) {
    const s = f.q.replace(/[%,()]/g, " ").trim();
    q = q.or(`team_name.ilike.%${s}%,reg_code.ilike.%${s}%,institution.ilike.%${s}%,head_name.ilike.%${s}%,head_email.ilike.%${s}%`);
  }
  const [col, dir] = (f.sort ?? "submitted_at.desc").split(".");
  const allowed = ["submitted_at", "team_name", "reg_no", "institution", "total_fee", "status"];
  q = q.order(allowed.includes(col) ? col : "submitted_at", { ascending: dir === "asc" });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let rows = data ?? [];
  const onlyModules = !hasRole(staff, "super_admin", "finance") ? staff.moduleIds : null;
  if (onlyModules) {
    rows = rows.filter((t) => t.module_preferences.some((p) => onlyModules.includes(p.module_id)) || t.module_allocations.some((a) => onlyModules.includes(a.module_id)));
  }
  if (f.module) {
    const id = Number(f.module);
    rows = rows.filter((t) => t.module_allocations.length ? t.module_allocations.some((a) => a.module_id === id) : t.module_preferences.some((p) => p.module_id === id));
  }
  return rows;
}

export async function getTeamDetail(staff: StaffContext, id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("*, team_members(*), module_preferences(module_id, rank), module_allocations(module_id), payments(*), waivers(*), checkins(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  if (!hasRole(staff, "super_admin", "finance")) {
    const ok = data.module_preferences.some((p) => staff.moduleIds.includes(p.module_id)) || data.module_allocations.some((a) => staff.moduleIds.includes(a.module_id));
    if (!ok) return null;
  }
  const { data: log } = await admin.from("audit_logs").select("*").eq("team_id", id).order("created_at", { ascending: false }).limit(30);
  return { ...data, audit: log ?? [] };
}
