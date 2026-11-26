import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getStaff, getUser } from "@/lib/auth";
import { AdminNav } from "./AdminNav";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  await connection();
  const staff = await getStaff();
  if (!staff) {
    const user = await getUser();
    if (!user) redirect("/login?next=/admin");
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-blueprint px-4">
        <div className="card max-w-md p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--danger)]">Access denied · HUD</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold">This lab is Cubinet-only</h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            You&apos;re signed in as {user.email}, which has no admin role. Ask the President or VP to add you.
          </p>
          <form action="/auth/signout" method="post" className="mt-6"><button className="btn btn-secondary">Sign out</button></form>
        </div>
      </main>
    );
  }
  return (
    <div className="relative flex min-h-dvh flex-col bg-blueprint lg:flex-row">
      <aside className="border-b border-[var(--line)] bg-[var(--surface)] lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <a href="/admin" className="flex flex-col">
            <Logo className="h-4 w-auto" />
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ink-muted)]">Cubinet lab</span>
          </a>
          <div className="lg:hidden"><ThemeToggle compact /></div>
        </div>
        <AdminNav roles={staff.roles} />
        <div className="hidden px-4 py-4 lg:block">
          <ThemeToggle />
          <p className="mt-3 truncate text-xs text-[var(--ink-muted)]" title={staff.email}>{staff.email}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">{staff.roles.join(" · ").replace(/_/g, " ")}</p>
          <form action="/auth/signout" method="post" className="mt-2"><button className="text-xs font-semibold underline">Sign out</button></form>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <Suspense fallback={<AdminSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

/** Skeleton: Hiro's blueprint grid lines drawing in. */
function AdminSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-9 w-64" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      <div className="skeleton h-72" />
    </div>
  );
}
