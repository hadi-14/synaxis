import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/dates";
import { Empty } from "@/components/ui/Empty";

export const instant = false;
export const metadata = { title: "Audit log" };
const PAGE = 50;

export default async function AuditPage(props: PageProps<"/admin/audit">) {
  await requireStaff("super_admin", "finance");
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const page = Math.max(0, Number(sp.page ?? 0));
  let q = createAdminClient().from("audit_logs").select("*, teams(reg_code, team_name)", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  if (sp.action) q = q.ilike("action", `${sp.action.replace(/[%_]/g, "")}%`);
  if (sp.actor) q = q.ilike("actor_email", `%${sp.actor.replace(/[%_]/g, "")}%`);
  const { data, count } = await q;
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.action ? { action: sp.action } : {}), ...(sp.actor ? { actor: sp.actor } : {}), page: String(p) })}`;
  return (
    <div className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Flight recorder</p>
      <h1 className="font-display text-3xl font-extrabold">Audit log</h1>
      <form className="card mt-4 flex flex-wrap gap-3 p-4">
        <select name="action" defaultValue={sp.action ?? ""} className="field max-w-xs" aria-label="Action">
          <option value="">All actions</option>
          {["payment.", "waiver.", "team.", "modules.", "content.", "settings.", "role.", "email.", "export.", "checkin."].map((a) => <option key={a} value={a}>{a.replace(".", "")}</option>)}
        </select>
        <input name="actor" defaultValue={sp.actor} placeholder="Actor email" className="field max-w-xs" />
        <button className="btn btn-primary">Filter</button>
      </form>
      {!data?.length ? <div className="card mt-4"><Empty title="No entries" /></div> : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]"><tr><th className="px-4 py-2">When</th><th>Who</th><th>Action</th><th>Team</th><th className="pr-4">Detail</th></tr></thead>
            <tbody className="divide-y divide-[var(--line)]">
              {data.map((a) => {
                const team = a.teams as unknown as { reg_code: string; team_name: string } | null;
                return (
                  <tr key={a.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{formatDate(a.created_at, true)}</td>
                    <td className="max-w-[12rem] truncate py-2">{a.actor_email ?? "system"}</td>
                    <td className="py-2 font-semibold">{a.action}</td>
                    <td className="py-2">{team ? <Link className="plasma-link font-mono text-xs" href={`/admin/teams?team=${a.team_id}`}>{team.reg_code}</Link> : "—"}</td>
                    <td className="max-w-md py-2 pr-4 text-xs text-[var(--ink-muted)]">
                      {a.note && <p>“{a.note}”</p>}
                      {(a.before || a.after) && (
                        <details><summary className="cursor-pointer">changes</summary><pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-[var(--surface-2)] p-2 text-[11px]">{JSON.stringify({ before: a.before, after: a.after }, null, 1)}</pre></details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-[var(--ink-muted)]">{count ?? 0} entries</span>
        <span className="flex gap-2">
          {page > 0 && <Link className="btn btn-secondary !min-h-9" href={qs(page - 1)}>Newer</Link>}
          {(page + 1) * PAGE < (count ?? 0) && <Link className="btn btn-secondary !min-h-9" href={qs(page + 1)}>Older</Link>}
        </span>
      </div>
    </div>
  );
}
