// RLS / data-API security checks against a LOCAL Supabase stack (never point this at production).
// Run: node --env-file=.env.local tests/rls.test.mjs
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUB = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;
if (!URL?.includes("127.0.0.1") && !URL?.includes("localhost")) throw new Error("Refusing to run against a non-local Supabase URL");

const admin = createClient(URL, SECRET, { auth: { persistSession: false } });
const anon = createClient(URL, PUB, { auth: { persistSession: false } });
let pass = 0;
const ok = (name) => { pass++; console.log("  ✓", name); };

async function userClient(email) {
  const password = "Test-password-123!";
  await admin.auth.admin.createUser({ email, password, email_confirm: true }).catch(() => {});
  const c = createClient(URL, PUB, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

console.log("anon");
for (const t of ["teams", "team_members", "payments", "waivers", "payment_details", "registration_drafts", "audit_logs", "email_logs", "user_roles", "sponsor_inquiries", "profiles", "rate_limits"]) {
  const { data, error } = await anon.from(t).select("*").limit(5);
  assert.ok(error || (data ?? []).length === 0, `anon can read ${t}`);
}
ok("anon cannot read private tables");
{
  const { data } = await anon.from("modules").select("id");
  assert.ok(data.length >= 9);
  ok("anon can read public modules");
}
{
  const { error } = await anon.from("teams").insert({ team_name: "hack" });
  assert.ok(error);
  ok("anon cannot insert teams");
}
{
  const { error } = await anon.rpc("save_team", { p_owner: "00000000-0000-0000-0000-000000000000", p_team_id: null, p_team: {}, p_members: [], p_module_ids: [], p_compulsory_ids: [] });
  assert.ok(error);
  ok("anon cannot call save_team");
}
{
  const { error } = await anon.rpc("rate_limit_hit", { p_key: "x", p_max: 1, p_window_seconds: 1 });
  assert.ok(error);
  ok("anon cannot call rate_limit_hit");
}
{
  const { data: up, error } = await anon.storage.from("receipts").upload(`x/${Date.now()}.png`, new Blob(["x"], { type: "image/png" }));
  assert.ok(error && !up);
  ok("anon cannot upload receipts");
}

console.log("other signed-in user (not owner, not staff)");
const mallory = await userClient("mallory@example.com");
{
  const { data } = await mallory.from("teams").select("id");
  assert.equal(data.length, 0);
  ok("cannot see other teams");
}
for (const t of ["team_members", "payments", "waivers", "module_preferences", "audit_logs", "email_logs"]) {
  const { data } = await mallory.from(t).select("*");
  assert.equal((data ?? []).length, 0, t);
}
ok("cannot see other teams' members/payments/waivers/logs");
{
  const { data } = await mallory.from("payment_details").select("*");
  assert.equal((data ?? []).length, 0);
  ok("cannot read bank details without a team");
}
{
  const { error } = await mallory.from("teams").update({ status: "verified" }).neq("id", "00000000-0000-0000-0000-000000000000");
  const { data: still } = await admin.from("teams").select("status").neq("status", "verified");
  assert.ok(error || still.length > 0);
  ok("cannot update team status");
}
{
  const { error } = await mallory.from("user_roles").insert({ user_id: (await mallory.auth.getUser()).data.user.id, role: "super_admin" });
  assert.ok(error);
  ok("cannot grant self a role");
}
{
  const { data: list } = await mallory.storage.from("receipts").list("", { limit: 10 });
  assert.equal((list ?? []).length, 0);
  ok("cannot list receipts bucket");
}
{
  const me = (await mallory.auth.getUser()).data.user.id;
  const { error: e1 } = await mallory.from("registration_drafts").upsert({ owner_id: me, data: { a: 1 }, step: 2 });
  assert.ifError(e1);
  const { error: e2 } = await mallory.from("registration_drafts").upsert({ owner_id: "00000000-0000-0000-0000-000000000000", data: {}, step: 1 });
  assert.ok(e2);
  await mallory.from("registration_drafts").delete().eq("owner_id", me);
  ok("drafts: own row only");
}

console.log("team owner");
const { data: anyTeam } = await admin.from("teams").select("id, owner_id").limit(1).maybeSingle();
if (anyTeam) {
  const { data: u } = await admin.auth.admin.getUserById(anyTeam.owner_id);
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
  const owner = createClient(URL, PUB, { auth: { persistSession: false } });
  const { error } = await owner.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (error) throw error;
  const { data: mine } = await owner.from("teams").select("id");
  assert.equal(mine.length, 1);
  assert.equal(mine[0].id, anyTeam.id);
  ok("owner sees exactly their team");
  const { data: bank } = await owner.from("payment_details").select("iban");
  assert.equal(bank.length, 1);
  ok("owner can read bank details");
  const { error: upErr } = await owner.from("payments").insert({ team_id: anyTeam.id, amount: 1, fee_breakdown: {}, method: "upload", status: "verified" });
  assert.ok(upErr);
  ok("owner cannot forge a verified payment");
} else console.log("  (skipped: no team in DB)");

await admin.auth.admin.listUsers().then(async ({ data }) => {
  const m = data.users.find((x) => x.email === "mallory@example.com");
  if (m) await admin.auth.admin.deleteUser(m.id);
});
console.log(`\n${pass} checks passed`);
