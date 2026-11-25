import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export type AppRole = "super_admin" | "finance" | "module_head";
export type SessionUser = { id: string; email: string; name: string | null };
export type StaffContext = SessionUser & { roles: AppRole[]; moduleIds: number[] };

/** Verified identity from the JWT (getClaims validates the signature). Null when signed out. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const c = data.claims as { sub: string; email?: string; user_metadata?: { full_name?: string; name?: string } };
  return { id: c.sub, email: c.email ?? "", name: c.user_metadata?.full_name ?? c.user_metadata?.name ?? null };
});

export async function requireUser(next = "/register"): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Roles are read with the service role so a missing SELECT grant can never lock admins out. */
export const getStaff = cache(async (): Promise<StaffContext | null> => {
  const user = await getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("user_roles").select("role, module_id").eq("user_id", user.id);
  if (!data?.length) return null;
  return {
    ...user,
    roles: [...new Set(data.map((r) => r.role as AppRole))],
    moduleIds: data.filter((r) => r.module_id != null).map((r) => r.module_id as number),
  };
});

export function hasRole(staff: StaffContext | null, ...roles: AppRole[]) {
  return !!staff && staff.roles.some((r) => roles.includes(r));
}

export async function requireStaff(...roles: AppRole[]): Promise<StaffContext> {
  await connection(); // admin pages are always per-request
  const staff = await getStaff();
  if (!staff) {
    const user = await getUser();
    if (!user) redirect("/login?next=/admin");
    notFound(); // the admin layout already shows the "Cubinet-only" message
  }
  if (roles.length && !hasRole(staff, ...roles)) notFound(); // renders app/admin/not-found.tsx
  return staff;
}

/** For server actions: throws instead of redirecting. */
export async function assertStaff(...roles: AppRole[]): Promise<StaffContext> {
  const staff = await getStaff();
  if (!staff || (roles.length && !hasRole(staff, ...roles))) throw new Error("Not authorised.");
  return staff;
}
