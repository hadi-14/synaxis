import { requireStaff, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getModules, getSettings } from "@/lib/content";
import { Scanner } from "@/components/admin/Scanner";

export const instant = false;

/** Event day 1–3 for "now" in Karachi (clamped). Per-request: the page is dynamic. */
function currentEventDay(eventStart: string) {
  const start = new Date(`${eventStart}T00:00:00+05:00`).getTime();
  return Math.min(3, Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1));
}
export const metadata = { title: "Check-in" };

export default async function CheckinPage(props: PageProps<"/admin/checkin">) {
  const staff = await requireStaff();
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const [modules, settings] = await Promise.all([getModules(), getSettings()]);
  const admin = createAdminClient();
  const [{ data: checkins }, { data: teams }] = await Promise.all([
    admin.from("checkins").select("team_id, day_no, module_id, created_at"),
    admin.from("teams").select("id, reg_code, team_name, status, module_allocations(module_id)").in("status", ["modules_allocated", "checked_in"]),
  ]);
  // Default day from today's date (Karachi), clamped to 1–3.
  const todayDay = currentEventDay(settings.event_start);
  const myModules = hasRole(staff, "super_admin", "finance") ? modules : modules.filter((m) => staff.moduleIds.includes(m.id));
  const attendance = [1, 2, 3].map((d) => ({
    day: d,
    gate: new Set((checkins ?? []).filter((c) => c.day_no === d && !c.module_id).map((c) => c.team_id)).size,
    modules: modules.map((m) => ({
      id: m.id,
      name: m.name,
      accent: m.accent,
      expected: (teams ?? []).filter((t) => t.module_allocations.some((a) => a.module_id === m.id)).length,
      present: (checkins ?? []).filter((c) => c.day_no === d && c.module_id === m.id).length,
    })),
  }));
  const notIn = (teams ?? []).filter((t) => !(checkins ?? []).some((c) => c.team_id === t.id && c.day_no === todayDay && !c.module_id));

  return (
    <div className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Event day</p>
      <h1 className="font-display text-3xl font-extrabold">Check-in</h1>
      <Scanner modules={myModules.map((m) => ({ id: m.id, name: m.name }))} defaultDay={todayDay} initialToken={sp.t ?? null} canGate={hasRole(staff, "super_admin", "finance")} canUndo={hasRole(staff, "super_admin")} />

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {attendance.map((a) => (
          <div key={a.day} className="card p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display font-bold">Day {a.day}</h2>
              <p className="font-mono text-sm">Gate: <strong>{a.gate}</strong>/{teams?.length ?? 0}</p>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {a.modules.filter((m) => m.expected > 0 || m.present > 0).map((m) => (
                <li key={m.id} className="grid grid-cols-[1fr_5rem_3rem] items-center gap-2">
                  <span className="truncate">{m.name}</span>
                  <span className="h-2 rounded-full bg-[var(--surface-2)]"><span className="block h-full rounded-full" style={{ width: `${m.expected ? (m.present / m.expected) * 100 : 0}%`, background: m.accent }} /></span>
                  <span className="text-right font-mono text-xs">{m.present}/{m.expected}</span>
                </li>
              ))}
              {a.modules.every((m) => m.expected === 0) && <li className="text-[var(--ink-muted)]">No allocations yet.</li>}
            </ul>
          </div>
        ))}
      </section>

      <section className="card mt-6 p-4">
        <h2 className="font-display font-bold">Not yet through the gate today (day {todayDay}) · {notIn.length}</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{notIn.map((t) => `${t.reg_code} ${t.team_name}`).join(" · ") || "Everyone is in. I am satisfied with my care."}</p>
      </section>
    </div>
  );
}
