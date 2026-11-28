import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionForm, F } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { addRole } from "../content/actions";

export const instant = false;
export const metadata = { title: "Roles" };

export default async function RolesPage() {
  await requireStaff("super_admin");
  const admin = createAdminClient();
  const [{ data: roles }, { data: profiles }, { data: modules }] = await Promise.all([
    admin.from("user_roles").select("*").order("role"),
    admin.from("profiles").select("id, email"),
    admin.from("modules").select("id, name").order("sort"),
  ]);
  const email = (id: string) => profiles?.find((p) => p.id === id)?.email ?? id;
  const mod = (id: number | null) => (id ? modules?.find((m) => m.id === id)?.name : null);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Access</p>
        <h1 className="font-display text-3xl font-extrabold">Cabinet roles</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Super Admin: everything. Finance: payments, waivers, exports. Module Head/Co-Head: their module&apos;s teams (read) and module content.</p>
      </div>
      <section className="card p-5">
        <h2 className="font-display font-bold">Grant a role</h2>
        <p className="text-xs text-[var(--ink-muted)]">The person must have signed in once (at /login) so their account exists.</p>
        <ActionForm action={addRole} resetOnSuccess submitLabel="Grant role">
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <F label="Email"><input className="field" name="email" type="email" required /></F>
            <F label="Role">
              <select className="field" name="role"><option value="module_head">Module Head / Co-Head</option><option value="finance">Finance / Verifier</option><option value="super_admin">Super Admin</option></select>
            </F>
            <F label="Module (heads only)">
              <select className="field" name="module_id"><option value="">—</option>{modules?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            </F>
          </div>
        </ActionForm>
      </section>
      <ul className="card divide-y divide-[var(--line)]">
        {(roles ?? []).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span><strong>{email(r.user_id)}</strong> · <span className="capitalize">{r.role.replace("_", " ")}</span>{mod(r.module_id) ? ` · ${mod(r.module_id)}` : ""}</span>
            <DeleteButton kind="role" id={r.id} label="Remove" />
          </li>
        ))}
      </ul>
    </div>
  );
}
