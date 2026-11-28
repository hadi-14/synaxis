// Grant a Cabinet role.  Usage:
//   npm run make-admin -- someone@example.com [super_admin|finance|module_head] [module-slug]
// The person must have signed in once (so their account exists). Uses SUPABASE_SECRET_KEY from .env.local.
import { createClient } from "@supabase/supabase-js";

const [email, role = "super_admin", moduleSlug] = process.argv.slice(2);
const ROLES = ["super_admin", "finance", "module_head"];
if (!email || !ROLES.includes(role) || (role === "module_head" && !moduleSlug)) {
  console.error("Usage: npm run make-admin -- <email> [super_admin|finance|module_head] [module-slug for module_head]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
const admin = createClient(url, key, { auth: { persistSession: false } });

let user = null;
for (let page = 1; !user; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw new Error(`Could not list users: ${error.message} (is SUPABASE_SECRET_KEY correct?)`);
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 1000) break;
}
if (!user) {
  console.error(`No account for ${email}. Ask them to sign in once at /login, then run this again.`);
  process.exit(1);
}
let moduleId = null;
if (role === "module_head") {
  const { data: m } = await admin.from("modules").select("id, name").eq("slug", moduleSlug).maybeSingle();
  if (!m) throw new Error(`Unknown module slug: ${moduleSlug}`);
  moduleId = m.id;
}
const { error } = await admin.from("user_roles").insert({ user_id: user.id, role, module_id: moduleId });
if (error && error.code !== "23505") throw new Error(error.message);
await admin.from("audit_logs").insert({ actor_email: "make-admin script", action: "role.granted", entity: "user_roles", entity_id: user.id, after: { email, role, moduleSlug: moduleSlug ?? null } });
console.log(error ? `${email} already has ${role}.` : `✓ Granted ${role}${moduleSlug ? ` (${moduleSlug})` : ""} to ${email}.`);
