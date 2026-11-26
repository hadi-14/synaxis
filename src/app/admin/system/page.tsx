import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/dates";
import { TestEmailButton } from "./TestEmailButton";

export const instant = false;
export const metadata = { title: "System" };

type Check = { label: string; ok: boolean; detail?: string };

/** Super Admin health page: environment, database, storage, auth trigger, email. */
export default async function SystemPage() {
  await requireStaff("super_admin");
  const admin = createAdminClient();
  const env = (k: string) => !!process.env[k]?.trim();
  const checks: { group: string; items: Check[] }[] = [];

  checks.push({
    group: "Environment (names only, values never shown)",
    items: [
      { label: "NEXT_PUBLIC_SUPABASE_URL", ok: env("NEXT_PUBLIC_SUPABASE_URL"), detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : undefined },
      { label: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ok: env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") },
      { label: "SUPABASE_SECRET_KEY (server only)", ok: env("SUPABASE_SECRET_KEY") },
      { label: "NEXT_PUBLIC_SITE_URL", ok: env("NEXT_PUBLIC_SITE_URL"), detail: process.env.NEXT_PUBLIC_SITE_URL },
      { label: "RESEND_API_KEY", ok: env("RESEND_API_KEY"), detail: env("RESEND_API_KEY") ? undefined : "emails are logged as skipped" },
      { label: "EMAIL_FROM", ok: env("EMAIL_FROM"), detail: process.env.EMAIL_FROM },
      { label: "ADMIN_NOTIFY_EMAILS", ok: env("ADMIN_NOTIFY_EMAILS"), detail: env("ADMIN_NOTIFY_EMAILS") ? `${process.env.ADMIN_NOTIFY_EMAILS!.split(",").length} address(es)` : "sponsor inquiries won't be emailed" },
    ],
  });

  const [settings, modules, faqs, bank, buckets, users, profiles, roles, lastEmail] = await Promise.all([
    admin.from("settings").select("delegation_fee_early, registration_open, updated_at").eq("id", 1).maybeSingle(),
    admin.from("modules").select("slug, is_compulsory"),
    admin.from("faqs").select("id", { count: "exact", head: true }),
    admin.from("payment_details").select("iban").eq("id", 1).maybeSingle(),
    admin.storage.listBuckets(),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("user_roles").select("role"),
    admin.from("email_logs").select("status, error, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  checks.push({
    group: "Database",
    items: [
      { label: "Reachable with the secret key", ok: !settings.error, detail: settings.error?.message },
      { label: "Latest migration applied (split delegation fee)", ok: !settings.error && settings.data?.delegation_fee_early !== undefined },
      { label: "Settings row", ok: !!settings.data, detail: settings.data ? `registration ${settings.data.registration_open ? "open" : "closed"} · updated ${formatDate(settings.data.updated_at, true)}` : undefined },
      { label: "Modules seeded (Kabuki Caper compulsory)", ok: (modules.data?.length ?? 0) >= 9 && !!modules.data?.some((m) => m.slug === "kabuki-caper" && m.is_compulsory), detail: `${modules.data?.length ?? 0} modules` },
      { label: "FAQs", ok: (faqs.count ?? 0) > 0, detail: `${faqs.count ?? 0}` },
      { label: "Bank details filled in", ok: !!bank.data && !bank.data.iban.includes("X"), detail: bank.data?.iban.includes("X") ? "still the placeholder IBAN" : undefined },
      { label: "Super Admins", ok: (roles.data ?? []).some((r) => r.role === "super_admin"), detail: `${(roles.data ?? []).filter((r) => r.role === "super_admin").length}` },
    ],
  });
  const want: Record<string, boolean> = { receipts: false, waivers: false, media: true };
  checks.push({
    group: "Storage",
    items: Object.entries(want).map(([id, pub]) => {
      const b = buckets.data?.find((x) => x.id === id);
      return { label: `Bucket “${id}” (${pub ? "public" : "private"})`, ok: !!b && b.public === pub, detail: b ? `limit ${Math.round(Number(b.file_size_limit ?? 0) / 1048576)} MB` : "missing" };
    }),
  });
  const userCount = users.data?.users.length ?? 0;
  checks.push({
    group: "Auth",
    items: [{ label: "Every user has a profile (signup trigger)", ok: (profiles.count ?? 0) >= userCount, detail: `${userCount} users · ${profiles.count ?? 0} profiles` }],
  });
  checks.push({
    group: "Email",
    items: [{ label: "Last email", ok: !lastEmail.data || lastEmail.data.status !== "failed", detail: lastEmail.data ? `${lastEmail.data.status}${lastEmail.data.error ? `: ${lastEmail.data.error}` : ""} · ${formatDate(lastEmail.data.created_at, true)}` : "none sent yet" }],
  });

  const failed = checks.flatMap((g) => g.items).filter((i) => !i.ok).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Diagnostics</p>
        <h1 className="font-display text-3xl font-extrabold">System health</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{failed ? `${failed} item(s) need attention.` : "All systems go. I am satisfied with my care."}</p>
      </div>
      {checks.map((g) => (
        <section key={g.group} className="card p-5">
          <h2 className="font-display font-bold">{g.group}</h2>
          <ul className="mt-3 divide-y divide-[var(--line)] text-sm">
            {g.items.map((i) => (
              <li key={i.label} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><span aria-hidden>{i.ok ? "✅" : "❌"}</span> <span className="sr-only">{i.ok ? "OK:" : "Problem:"}</span> {i.label}</span>
                {i.detail && <span className="font-mono text-xs text-[var(--ink-muted)]">{i.detail}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="card p-5">
        <h2 className="font-display font-bold">Email test</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">Sends a test email to your own address through Resend and shows the result.</p>
        <div className="mt-3"><TestEmailButton /></div>
      </section>
    </div>
  );
}
