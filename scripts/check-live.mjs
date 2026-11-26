// Read-mostly health check of the Supabase project in .env.local.  Usage: npm run check:live
// Creates ONE throwaway user to prove the profile-on-signup trigger works, then deletes it.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, secret = process.env.SUPABASE_SECRET_KEY, pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, secret, { auth: { persistSession: false } });
const anon = createClient(url, pub, { auth: { persistSession: false } });
let fails = 0;
const ok = (c, msg, extra = "") => { console.log(`${c ? "✓" : "✗"} ${msg}${extra ? ` (${extra})` : ""}`); if (!c) fails++; };

console.log(`Project: ${new URL(url).host}\n`);
const s = await admin.from("settings").select("delegation_fee_early, delegation_fee_regular, early_fee, regular_fee, registration_open").eq("id", 1).maybeSingle();
ok(!s.error, "Secret key works and schema is migrated", s.error?.message);
ok(!!s.data, "Settings row seeded", s.data ? `delegation ${s.data.delegation_fee_early}/${s.data.delegation_fee_regular}, delegate ${s.data.early_fee}/${s.data.regular_fee}, open=${s.data.registration_open}` : "");
const m = await admin.from("modules").select("slug, is_compulsory");
ok((m.data?.length ?? 0) >= 9, "Modules seeded", `${m.data?.length ?? 0} rows`);
ok(m.data?.some((x) => x.slug === "kabuki-caper" && x.is_compulsory), "Kabuki Caper is compulsory");
const f = await admin.from("faqs").select("id", { count: "exact", head: true });
ok((f.count ?? 0) > 0, "FAQs seeded", `${f.count ?? 0} rows`);
const pd = await admin.from("payment_details").select("id").eq("id", 1).maybeSingle();
ok(!!pd.data, "Payment details row seeded");

const b = await admin.storage.listBuckets();
const want = { receipts: false, waivers: false, media: true };
for (const [id, pub_] of Object.entries(want)) {
  const x = b.data?.find((y) => y.id === id);
  ok(!!x && x.public === pub_, `Bucket ${id} exists and is ${pub_ ? "public" : "private"}`, x ? `limit ${x.file_size_limit}` : "missing");
}
const up = await anon.storage.from("receipts").upload(`probe/${Date.now()}.png`, new Blob(["x"], { type: "image/png" }));
ok(!!up.error, "Anonymous users cannot upload receipts");
const ls = await anon.storage.from("receipts").list("", { limit: 1 });
ok(!(ls.data?.length), "Anonymous users cannot list receipts");
const t = await anon.from("teams").select("id").limit(1);
ok(!!t.error || t.data.length === 0, "Anonymous users cannot read teams (RLS)");

const email = `trigger-check+${Date.now()}@example.com`;
const cu = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: "Trigger Check" } });
if (cu.error) ok(false, "Create throwaway user", cu.error.message);
else {
  const p = await admin.from("profiles").select("id, email, full_name").eq("id", cu.data.user.id).maybeSingle();
  ok(p.data?.email === email, "Profile-on-signup trigger creates a profile", p.data ? p.data.full_name : "no profile row");
  const d = await admin.auth.admin.deleteUser(cu.data.user.id);
  ok(!d.error, "Throwaway user deleted", email);
}

const roles = await admin.from("user_roles").select("role, user_id");
const users = await admin.auth.admin.listUsers({ perPage: 1000 });
const byId = Object.fromEntries((users.data?.users ?? []).map((u) => [u.id, u.email]));
console.log(`\nSuper admins: ${(roles.data ?? []).filter((r) => r.role === "super_admin").map((r) => byId[r.user_id] ?? r.user_id).join(", ") || "none yet (run npm run make-admin)"}`);
console.log(fails ? `\n${fails} check(s) failed.` : "\nAll checks passed.");
process.exit(fails ? 1 : 0);
