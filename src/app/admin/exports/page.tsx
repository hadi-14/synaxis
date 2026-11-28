import { requireStaff } from "@/lib/auth";
import { getModules } from "@/lib/content";

export const instant = false;
export const metadata = { title: "Exports" };

export default async function ExportsPage() {
  await requireStaff("super_admin", "finance");
  const modules = await getModules();
  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Data port</p>
      <h1 className="font-display text-3xl font-extrabold">Exports</h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">Every download is recorded in the audit log. Files contain personal data; share them only inside the Cabinet.</p>
      <ul className="mt-6 space-y-3">
        <Row title="All teams" desc="One row per team with status, fees, preferences and allocation." q="dataset=teams" />
        <Row title="All delegates" desc="One row per member with contact details." q="dataset=members" />
        <Row title="Payments" desc="Every receipt and its review status." q="dataset=payments" />
        <Row title="Waivers" desc="Per member: uploaded / received." q="dataset=waivers" />
        <Row title="By institution" desc="Teams and delegates per school (Best Overall Institute check)." q="dataset=institutions" />
      </ul>
      <h2 className="mt-10 font-display text-xl font-bold">Per module (delegates)</h2>
      <ul className="mt-3 space-y-3">
        {modules.map((m) => <Row key={m.id} title={m.name} desc={`Delegates in teams allocated to (or ranking) ${m.name}.`} q={`dataset=members&module=${m.id}`} />)}
      </ul>
    </div>
  );
}

const link = (q: string, f: "csv" | "xlsx") => `/admin/exports/download?${q}&format=${f}`;
function Row({ title, desc, q }: { title: string; desc: string; q: string }) {
  return (
    <li className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div><p className="font-semibold">{title}</p><p className="text-sm text-[var(--ink-muted)]">{desc}</p></div>
      <div className="flex gap-2"><a className="btn btn-secondary !min-h-9 text-sm" href={link(q, "csv")}>CSV</a><a className="btn btn-primary !min-h-9 text-sm" href={link(q, "xlsx")}>XLSX</a></div>
    </li>
  );
}
