"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast-store";
import { Empty } from "@/components/ui/Empty";
import { Motif } from "@/components/brand/Motif";
import type { Module } from "@/lib/types";
import { applyAllocation, previewAllocation, type PlanRow } from "@/app/admin/allocation/actions";

type Allocated = { id: string; reg_code: string; team_name: string; status: string; module_allocations: { module_id: number }[]; module_preferences: { module_id: number; rank: number }[] };

export function AllocationTool({ modules, min, max, allocated }: { modules: Module[]; min: number; max: number; allocated: Allocated[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<PlanRow[] | null>(null);
  const [includeWaivers, setIncludeWaivers] = useState(false);
  const [rerun, setRerun] = useState(false);
  const [notify, setNotify] = useState(true);
  const [editing, setEditing] = useState<Record<string, number[]>>({});

  const compulsory = modules.filter((m) => m.is_compulsory).map((m) => m.id);
  const load = useMemo(() => {
    const l: Record<number, number> = Object.fromEntries(modules.map((m) => [m.id, 0]));
    const planIds = new Set(rows?.map((r) => r.teamId));
    for (const a of allocated) if (!planIds.has(a.id)) a.module_allocations.forEach((x) => (l[x.module_id] = (l[x.module_id] ?? 0) + 1));
    for (const r of rows ?? []) r.modules.forEach((id) => (l[id] = (l[id] ?? 0) + 1));
    return l;
  }, [rows, allocated, modules]);

  const run = () =>
    start(async () => {
      const r = await previewAllocation(includeWaivers, rerun);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setRows(r.data!.rows);
      if (!r.data!.rows.length) toast("No teams are ready for allocation yet.");
    });

  const toggle = (teamId: string, id: number) =>
    setRows((rs) =>
      rs!.map((r) => {
        if (r.teamId !== teamId || compulsory.includes(id)) return r;
        const has = r.modules.includes(id);
        if (!has && r.modules.length >= max) return r;
        return { ...r, modules: has ? r.modules.filter((x) => x !== id) : [...r.modules, id], filled: r.filled.filter((x) => x !== id) };
      }),
    );

  const apply = (plan: { teamId: string; modules: number[] }[]) =>
    start(async () => {
      const r = await applyAllocation(plan, notify);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`Allocated ${r.data!.applied} team${r.data!.applied === 1 ? "" : "s"}`, notify ? "Teams were emailed." : undefined);
      setRows(null);
      setEditing({});
      router.refresh();
    });

  const invalid = rows?.filter((r) => r.modules.length < min || r.modules.length > max) ?? [];

  return (
    <div className="mt-6 space-y-6">
      {/* capacity meters */}
      <section className="card p-5">
        <h2 className="font-display font-bold">Capacity</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const n = load[m.id] ?? 0;
            const over = m.capacity != null && n > m.capacity;
            return (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <Motif motif={m.motif} accent={m.accent} className="h-7 w-7 shrink-0 text-[var(--ink)]" />
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <span className="h-2 w-20 rounded-full bg-[var(--surface-2)]">
                  <span className="block h-full rounded-full" style={{ width: `${m.capacity ? Math.min(100, (n / m.capacity) * 100) : 100}%`, background: over ? "var(--danger)" : m.accent }} />
                </span>
                <span className={`w-14 text-right font-mono text-xs ${over ? "font-bold text-[var(--danger)]" : ""}`}>{n}{m.capacity != null ? `/${m.capacity}` : ""}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* run */}
      <section className="card flex flex-wrap items-center gap-4 p-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={includeWaivers} onChange={(e) => setIncludeWaivers(e.target.checked)} /> Include teams with waivers pending</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={rerun} onChange={(e) => setRerun(e.target.checked)} /> Re-run for already-allocated teams</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email teams when applied</label>
        <button className="btn btn-primary ml-auto" disabled={pending} onClick={run}>{pending && !rows ? "Assembling…" : "Run auto-allocation (preview)"}</button>
      </section>

      {rows && rows.length > 0 && (
        <section className="card overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
            <h2 className="font-display font-bold">Proposal · {rows.length} teams</h2>
            <div className="flex gap-2">
              <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => setRows(null)}>Discard</button>
              <button className="btn btn-primary !min-h-9 text-sm" disabled={pending || invalid.length > 0} onClick={() => apply(rows.map((r) => ({ teamId: r.teamId, modules: r.modules })))}>
                Apply {notify ? "& notify" : ""}
              </button>
            </div>
          </div>
          {invalid.length > 0 && <p className="px-4 pt-3 text-sm font-semibold text-[var(--danger)]">{invalid.length} team(s) outside {min}–{max} modules. Fix them before applying.</p>}
          <table className="w-full min-w-[900px] text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
              <tr><th className="px-4 py-2 text-left">Team</th>{modules.map((m) => <th key={m.id} className="px-1 py-2" title={m.name}><Motif motif={m.motif} accent={m.accent} className="mx-auto h-6 w-6 text-[var(--ink)]" /></th>)}<th className="px-3 text-right">#</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {rows.map((r) => (
                <tr key={r.teamId} className={r.short || r.modules.length < min ? "bg-[var(--danger)]/5" : ""}>
                  <td className="px-4 py-2"><span className="font-mono text-xs font-bold text-[var(--primary-text)]">{r.regCode}</span> <span className="font-semibold">{r.teamName}</span>{r.status === "waiver_pending" && <span className="ml-1 text-[10px] font-bold uppercase text-[var(--warning)]">waivers</span>}</td>
                  {modules.map((m) => {
                    const on = r.modules.includes(m.id);
                    const rank = r.prefs.indexOf(m.id) + 1;
                    return (
                      <td key={m.id} className="px-1 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(r.teamId, m.id)}
                          disabled={m.is_compulsory}
                          aria-pressed={on}
                          aria-label={`${m.name} for ${r.teamName}${rank ? `, ranked ${rank}` : ""}`}
                          className={`relative h-8 w-8 rounded-[8px] border-2 font-mono text-[11px] font-bold transition-colors ${on ? "text-[#0b1220]" : "border-[var(--line)] text-[var(--ink-muted)]"} ${r.filled.includes(m.id) ? "ring-2 ring-[var(--warning)]" : ""}`}
                          style={on ? { background: m.accent, borderColor: m.accent } : undefined}
                          title={r.filled.includes(m.id) ? "Filled (not in preferences)" : rank ? `Preference #${rank}` : "Not ranked"}
                        >
                          {m.is_compulsory ? "🔒" : rank || ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className={`px-3 text-right font-mono ${r.modules.length < min || r.modules.length > max ? "font-bold text-[var(--danger)]" : ""}`}>{r.modules.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-4 text-xs text-[var(--ink-muted)]">Numbers are the team&apos;s preference rank. Coloured = allocated. Amber ring = filled outside their preferences.</p>
        </section>
      )}

      <section className="card overflow-x-auto">
        <h2 className="border-b border-[var(--line)] p-4 font-display font-bold">Allocated teams ({allocated.length})</h2>
        {allocated.length === 0 ? <Empty title="No allocations yet" /> : (
          <ul className="divide-y divide-[var(--line)]">
            {allocated.map((t) => {
              const cur = editing[t.id] ?? t.module_allocations.map((a) => a.module_id);
              const dirty = !!editing[t.id];
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="w-60 min-w-0 truncate"><span className="font-mono text-xs font-bold text-[var(--primary-text)]">{t.reg_code}</span> {t.team_name}</span>
                  <span className="flex flex-wrap gap-1">
                    {modules.map((m) => {
                      const on = cur.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={m.is_compulsory}
                          aria-pressed={on}
                          onClick={() => setEditing((e) => ({ ...e, [t.id]: on ? cur.filter((x) => x !== m.id) : cur.length >= max ? cur : [...cur, m.id] }))}
                          className={`rounded-full border px-2 py-0.5 text-xs ${on ? "font-semibold text-[#0b1220]" : "border-[var(--line)] text-[var(--ink-muted)]"}`}
                          style={on ? { background: m.accent, borderColor: m.accent } : undefined}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </span>
                  {dirty && (
                    <span className="ml-auto flex gap-2">
                      <button className="btn btn-ghost !min-h-8 text-xs" onClick={() => setEditing((e) => Object.fromEntries(Object.entries(e).filter(([id]) => id !== t.id)))}>Undo</button>
                      <button className="btn btn-primary !min-h-8 text-xs" disabled={pending || cur.length < min} onClick={() => apply([{ teamId: t.id, modules: cur }])}>Save{notify ? " & notify" : ""}</button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
