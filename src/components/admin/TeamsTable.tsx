"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Empty } from "@/components/ui/Empty";
import { formatRs } from "@/lib/fees";
import { formatDate } from "@/lib/dates";
import { STATUS_LABEL, type Module, type TeamStatus } from "@/lib/types";

type Row = {
  id: string;
  reg_code: string;
  team_name: string;
  status: TeamStatus;
  delegation_type: string;
  institution: string;
  head_name: string;
  head_email: string;
  member_count: number;
  total_fee: number;
  fee_tier: string;
  submitted_at: string;
  whatsapp_shared_at: string | null;
  module_preferences: { module_id: number; rank: number }[];
  module_allocations: { module_id: number }[];
  payments: { status: string; amount: number }[];
};

export const statusTone: Record<string, string> = {
  pending_payment: "bg-[var(--surface-2)]",
  under_review: "bg-[#FBBF24]/25 text-[var(--warning)]",
  verified: "bg-[var(--success)]/15 text-[var(--success)]",
  waiver_pending: "bg-[var(--accent)]/15 text-[var(--accent)]",
  modules_allocated: "bg-[var(--success)]/25 text-[var(--success)]",
  checked_in: "bg-[var(--success)] text-white",
  rejected: "bg-[var(--danger)]/15 text-[var(--danger)]",
  reupload_requested: "bg-[var(--danger)]/15 text-[var(--danger)]",
  cancelled: "bg-[var(--ink)]/10 text-[var(--ink-muted)] line-through",
  draft: "bg-[var(--surface-2)]",
};

export function TeamsTable({ rows, modules, canBulk, baseQuery }: { rows: Row[]; modules: Module[]; canBulk: boolean; baseQuery: string }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const all = rows.length > 0 && sel.size === rows.length;
  const name = useMemo(() => Object.fromEntries(modules.map((m) => [m.id, m.name])), [modules]);
  const link = (id: string) => `${baseQuery}${baseQuery.length > 1 ? "&" : ""}team=${id}`;
  const toggle = (id: string) => setSel((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  if (!rows.length) return <div className="card mt-4"><Empty title="No teams match" body="Try clearing a filter." /></div>;

  return (
    <div className="mt-4">
      {canBulk && sel.size > 0 && (
        <div className="card inflate-in mb-3 flex flex-wrap items-center gap-2 p-3 text-sm">
          <span className="font-semibold">{sel.size} selected</span>
          <a className="btn btn-secondary !min-h-9 text-sm" href={`/admin/exports/download?dataset=teams&format=csv&ids=${[...sel].join(",")}`}>Export CSV</a>
          <a className="btn btn-secondary !min-h-9 text-sm" href={`/admin/exports/download?dataset=members&format=xlsx&ids=${[...sel].join(",")}`}>Members XLSX</a>
          <Link className="btn btn-secondary !min-h-9 text-sm" href={`/admin/emails?ids=${[...sel].join(",")}`}>Email selected</Link>
          <button className="btn btn-ghost !min-h-9 text-sm" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-[var(--line)] font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
            <tr>
              {canBulk && (
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" aria-label="Select all" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} className="h-4 w-4 accent-[var(--primary)]" />
                </th>
              )}
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Team</th>
              <th className="px-3 py-3">Institution</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Members</th>
              <th className="px-3 py-3 text-right">Fee</th>
              <th className="px-3 py-3">Modules</th>
              <th className="px-3 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {rows.map((r) => {
              const mods = r.module_allocations.length
                ? r.module_allocations.map((a) => name[a.module_id])
                : [...r.module_preferences].sort((a, b) => a.rank - b.rank).map((p) => name[p.module_id]);
              return (
                <tr key={r.id} className="hover:bg-[var(--surface-2)]/60">
                  {canBulk && (
                    <td className="px-3 py-2.5"><input type="checkbox" aria-label={`Select ${r.team_name}`} checked={sel.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 accent-[var(--primary)]" /></td>
                  )}
                  <td className="px-3 py-2.5 font-mono text-xs"><Link href={link(r.id)} scroll={false} className="font-bold text-[var(--primary-text)] hover:underline">{r.reg_code}</Link></td>
                  <td className="px-3 py-2.5">
                    <Link href={link(r.id)} scroll={false} className="font-semibold hover:underline">{r.team_name}</Link>
                    <p className="text-xs text-[var(--ink-muted)]">{r.head_name}</p>
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2.5" title={r.institution}>{r.institution}<p className="text-xs text-[var(--ink-muted)]">{r.delegation_type.replace("external_", "ext. ")}</p></td>
                  <td className="px-3 py-2.5">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[r.status] ?? ""}`}>{STATUS_LABEL[r.status]}</span>
                    {r.whatsapp_shared_at && r.status === "pending_payment" && <p className="mt-1 text-[10px] font-semibold text-[var(--warning)]">WhatsApp opened</p>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{r.member_count}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono">{formatRs(r.total_fee)}<p className="text-[10px] text-[var(--ink-muted)]">{r.fee_tier}</p></td>
                  <td className="max-w-[14rem] px-3 py-2.5 text-xs text-[var(--ink-muted)]">{mods.join(", ")}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs">{formatDate(r.submitted_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
