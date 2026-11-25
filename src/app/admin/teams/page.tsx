import Link from "next/link";
import { requireStaff, hasRole } from "@/lib/auth";
import { listTeams, getTeamDetail, type TeamFilters } from "@/lib/admin-teams";
import { getModules, getSettings } from "@/lib/content";
import { STATUS_LABEL, type TeamStatus } from "@/lib/types";
import { TeamsTable } from "@/components/admin/TeamsTable";
import { TeamDrawer } from "@/components/admin/TeamDrawer";

export const instant = false;
export const metadata = { title: "Teams" };

export default async function TeamsPage(props: PageProps<"/admin/teams">) {
  const staff = await requireStaff();
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const filters: TeamFilters = { q: sp.q, status: sp.status, module: sp.module, type: sp.type, tier: sp.tier, from: sp.from, to: sp.to, sort: sp.sort };
  const [rows, modules, settings, detail] = await Promise.all([
    listTeams(staff, filters),
    getModules(),
    getSettings(),
    sp.team ? getTeamDetail(staff, sp.team) : Promise.resolve(null),
  ]);
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    return `?${p.toString()}`;
  };
  const exportQs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Blueprint · teams</p>
          <h1 className="font-display text-3xl font-extrabold">Teams <span className="font-mono text-lg text-[var(--ink-muted)]">{rows.length}</span></h1>
        </div>
        {hasRole(staff, "super_admin", "finance") && (
          <div className="flex gap-2">
            <a className="btn btn-secondary text-sm" href={`/admin/exports/download?dataset=teams&format=csv&${exportQs}`}>CSV</a>
            <a className="btn btn-secondary text-sm" href={`/admin/exports/download?dataset=teams&format=xlsx&${exportQs}`}>XLSX</a>
          </div>
        )}
      </div>

      <form className="card mt-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <label className="lg:col-span-2">
          <span className="sr-only">Search</span>
          <input name="q" defaultValue={sp.q} placeholder="Search team, ID, school, head…" className="field" />
        </label>
        <select name="status" defaultValue={sp.status ?? ""} className="field" aria-label="Status">
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABEL) as TeamStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select name="module" defaultValue={sp.module ?? ""} className="field" aria-label="Module">
          <option value="">All modules</option>
          {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select name="type" defaultValue={sp.type ?? ""} className="field" aria-label="Delegation type">
          <option value="">All types</option>
          <option value="internal">Internal</option>
          <option value="external_official">External official</option>
          <option value="external_independent">External independent</option>
        </select>
        <select name="sort" defaultValue={sp.sort ?? "submitted_at.desc"} className="field" aria-label="Sort">
          <option value="submitted_at.desc">Newest first</option>
          <option value="submitted_at.asc">Oldest first</option>
          <option value="team_name.asc">Team A–Z</option>
          <option value="institution.asc">Institution A–Z</option>
          <option value="total_fee.desc">Fee high–low</option>
        </select>
        <label className="text-xs text-[var(--ink-muted)]">From<input type="date" name="from" defaultValue={sp.from} className="field mt-1" /></label>
        <label className="text-xs text-[var(--ink-muted)]">To<input type="date" name="to" defaultValue={sp.to} className="field mt-1" /></label>
        <select name="tier" defaultValue={sp.tier ?? ""} className="field self-end" aria-label="Fee tier">
          <option value="">Any tier</option>
          <option value="early">Early bird</option>
          <option value="regular">Regular</option>
        </select>
        <div className="flex items-end gap-2 lg:col-span-3">
          <button className="btn btn-primary">Apply</button>
          <Link href="/admin/teams" className="btn btn-ghost">Reset</Link>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {(["under_review", "pending_payment", "waiver_pending", "verified", "modules_allocated"] as TeamStatus[]).map((s) => (
          <Link key={s} href={qs({ status: sp.status === s ? undefined : s, team: undefined })} className={`rounded-full border px-3 py-1 font-semibold ${sp.status === s ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]" : "border-[var(--line)]"}`}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <TeamsTable rows={rows as never} modules={modules} canBulk={hasRole(staff, "super_admin")} baseQuery={qs({ team: undefined })} />

      {detail && (
        <TeamDrawer
          team={detail as never}
          modules={modules}
          closeHref={qs({ team: undefined })}
          canFinance={hasRole(staff, "super_admin", "finance")}
          canSuper={hasRole(staff, "super_admin")}
          paymentDeadline={settings.payment_deadline}
        />
      )}
    </div>
  );
}
