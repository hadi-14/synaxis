import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getModules } from "@/lib/content";
import { formatDate } from "@/lib/dates";
import { BroadcastForm } from "@/components/admin/BroadcastForm";

export const instant = false;
export const metadata = { title: "Emails" };

export default async function EmailsPage(props: PageProps<"/admin/emails">) {
  await requireStaff("super_admin");
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const [modules, { data: logs }] = await Promise.all([
    getModules(),
    createAdminClient().from("email_logs").select("id, to_email, template, subject, status, error, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Chest display broadcast</p>
        <h1 className="font-display text-3xl font-extrabold">Emails</h1>
      </div>
      <BroadcastForm modules={modules.map((m) => ({ id: m.id, name: m.name }))} ids={sp.ids?.split(",").filter(Boolean) ?? []} />
      <section className="card overflow-x-auto">
        <h2 className="border-b border-[var(--line)] p-4 font-display font-bold">Recent emails</h2>
        <table className="w-full min-w-[700px] text-sm">
          <thead className="text-left font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]"><tr><th className="px-4 py-2">When</th><th>To</th><th>Template</th><th>Subject</th><th className="pr-4">Status</th></tr></thead>
          <tbody className="divide-y divide-[var(--line)]">
            {(logs ?? []).map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{formatDate(l.created_at, true)}</td>
                <td className="max-w-[12rem] truncate">{l.to_email}</td>
                <td className="text-xs">{l.template}</td>
                <td className="max-w-[16rem] truncate">{l.subject}</td>
                <td className={`pr-4 text-xs font-bold uppercase ${l.status === "sent" ? "text-[var(--success)]" : l.status === "failed" ? "text-[var(--danger)]" : "text-[var(--ink-muted)]"}`} title={l.error ?? undefined}>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
