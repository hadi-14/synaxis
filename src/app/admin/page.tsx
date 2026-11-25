import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRs } from "@/lib/fees";
import { STATUS_LABEL, type TeamStatus } from "@/lib/types";

export const instant = false;
export const metadata = { title: "Overview" };

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card panel-lines p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[var(--ink-muted)]">{sub}</p>}
    </div>
  );
}

function Bars({ rows, total }: { rows: [string, number][]; total?: number }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <ul className="space-y-1.5">
      {rows.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-2 text-sm">
          <span className="truncate" title={k}>{k}</span>
          <span className="h-2.5 rounded-full bg-[var(--surface-2)]">
            <span className="block h-full rounded-full bg-[var(--primary)]" style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="font-mono text-xs tabular-nums">{v}{total ? ` · ${Math.round((v / total) * 100)}%` : ""}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminOverview() {
  await requireStaff();
  const admin = createAdminClient();
  const [{ data: teams }, { data: payments }, { data: prefs }, { data: allocs }, { data: modules }] = await Promise.all([
    admin.from("teams").select("id, status, member_count, total_fee, fee_tier, delegation_type, institution, submitted_at"),
    admin.from("payments").select("team_id, amount, status"),
    admin.from("module_preferences").select("module_id, rank"),
    admin.from("module_allocations").select("module_id"),
    admin.from("modules").select("id, name, capacity").order("sort"),
  ]);
  const live = (teams ?? []).filter((t) => t.status !== "cancelled");
  const delegates = live.reduce((s, t) => s + t.member_count, 0);
  const expected = live.reduce((s, t) => s + t.total_fee, 0);
  const verified = (payments ?? []).filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
  const pendingReview = (payments ?? []).filter((p) => p.status === "under_review").length;
  const count = <T extends string>(arr: T[]) => arr.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
  const byStatus = count((teams ?? []).map((t) => t.status as string));
  const byType = count(live.map((t) => t.delegation_type as string));
  const byTier = count(live.map((t) => t.fee_tier));
  const byInst = Object.entries(count(live.map((t) => t.institution))).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const demand = (modules ?? []).map((m) => {
    const first = (prefs ?? []).filter((p) => p.module_id === m.id && p.rank === 1).length;
    const any = (prefs ?? []).filter((p) => p.module_id === m.id).length;
    const alloc = (allocs ?? []).filter((a) => a.module_id === m.id).length;
    return { ...m, first, any, alloc };
  });
  // registrations per day (Karachi)
  const days = count(live.map((t) => new Date(new Date(t.submitted_at).getTime() + 5 * 3600_000).toISOString().slice(0, 10)));
  const dayRows = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0])).slice(-21);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Workbench</p>
      <h1 className="font-display text-3xl font-extrabold">Overview</h1>

      {pendingReview > 0 && (
        <Link href="/admin/teams?status=under_review" className="card mt-4 flex items-center justify-between gap-3 border-2 !border-[var(--primary)] p-4">
          <span className="font-semibold">{pendingReview} receipt{pendingReview > 1 ? "s" : ""} waiting for review</span>
          <span className="btn btn-primary !min-h-9 text-sm">Review now</span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Teams" value={live.length} sub={`${(teams ?? []).length - live.length} cancelled`} />
        <Stat label="Delegates" value={delegates} />
        <Stat label="Expected revenue" value={formatRs(expected)} />
        <Stat label="Verified revenue" value={formatRs(verified)} sub={expected ? `${Math.round((verified / expected) * 100)}% collected` : undefined} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display font-bold">By status</h2>
          <div className="mt-3">
            <Bars rows={(Object.keys(STATUS_LABEL) as TeamStatus[]).filter((s) => byStatus[s]).map((s) => [STATUS_LABEL[s], byStatus[s]])} total={(teams ?? []).length} />
          </div>
          {!teams?.length && <p className="text-sm text-[var(--ink-muted)]">No registrations yet.</p>}
        </section>
        <section className="card p-5">
          <h2 className="font-display font-bold">Delegation type · fee tier</h2>
          <div className="mt-3 space-y-4">
            <Bars rows={[["Internal", byType.internal ?? 0], ["External official", byType.external_official ?? 0], ["External independent", byType.external_independent ?? 0]]} total={live.length} />
            <Bars rows={[["Early bird", byTier.early ?? 0], ["Regular", byTier.regular ?? 0]]} total={live.length} />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-display font-bold">Module demand</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
              <tr><th className="py-1">Module</th><th className="text-right">1st choice</th><th className="text-right">Ranked</th><th className="text-right">Allocated</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {demand.map((m) => (
                <tr key={m.id}>
                  <td className="py-1.5">{m.name}</td>
                  <td className="text-right font-mono">{m.first}</td>
                  <td className="text-right font-mono">{m.any}</td>
                  <td className="text-right font-mono">{m.alloc}{m.capacity ? `/${m.capacity}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-5">
          <h2 className="font-display font-bold">Top institutions</h2>
          <div className="mt-3">{byInst.length ? <Bars rows={byInst} /> : <p className="text-sm text-[var(--ink-muted)]">No data yet.</p>}</div>
        </section>
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display font-bold">Registrations over time</h2>
          {dayRows.length ? (
            <div className="mt-4 flex h-40 items-end gap-1.5" role="img" aria-label={`Registrations per day: ${dayRows.map(([d, n]) => `${d}: ${n}`).join(", ")}`}>
              {dayRows.map(([d, n]) => {
                const max = Math.max(...dayRows.map((r) => r[1]));
                return (
                  <div key={d} className="flex flex-1 flex-col items-center gap-1">
                    <span className="font-mono text-[10px]">{n}</span>
                    <span className="w-full rounded-t bg-[var(--accent)]" style={{ height: `${(n / max) * 110}px` }} />
                    <span className="font-mono text-[9px] text-[var(--ink-muted)]">{d.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No registrations yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
