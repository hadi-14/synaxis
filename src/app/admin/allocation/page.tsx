import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getModules, getSettings } from "@/lib/content";
import { AllocationTool } from "@/components/admin/AllocationTool";

export const instant = false;
export const metadata = { title: "Allocation" };

export default async function AllocationPage() {
  await requireStaff("super_admin");
  const admin = createAdminClient();
  const [modules, settings, { data: allocated }, { data: counts }] = await Promise.all([
    getModules(),
    getSettings(),
    admin.from("teams").select("id, reg_code, team_name, status, module_allocations(module_id), module_preferences(module_id, rank)").in("status", ["modules_allocated", "checked_in"]).order("reg_no"),
    admin.from("teams").select("status"),
  ]);
  const by = (s: string) => (counts ?? []).filter((c) => c.status === s).length;
  return (
    <div className="mx-auto max-w-7xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Microbot matrix</p>
      <h1 className="font-display text-3xl font-extrabold">Module allocation</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
        Every team gets the compulsory module(s), then modules are drafted by ranked preference (earliest registrations pick first, snake order) within capacity, so each team ends with {settings.modules_min}–{settings.modules_max} modules. Review, adjust, then apply.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1">Ready (verified): <strong>{by("verified")}</strong></span>
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1">Waivers pending: <strong>{by("waiver_pending")}</strong></span>
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1">Allocated: <strong>{by("modules_allocated") + by("checked_in")}</strong></span>
      </div>
      <AllocationTool modules={modules} min={settings.modules_min} max={settings.modules_max} allocated={(allocated ?? []) as never} />
    </div>
  );
}
