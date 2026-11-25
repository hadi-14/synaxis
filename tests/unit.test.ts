import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFee } from "../src/lib/fees";
import { normalizePkMobile, isPkPhone } from "../src/lib/phone";
import { ruleIssues, moduleSlots, type RegistrationData, type Rules } from "../src/lib/validation/registration";

const settings = { delegation_fee: 4500, early_fee: 2500, regular_fee: 3500, early_bird_deadline: "2026-12-15T23:59:00+05:00" };

test("fee: early bird = delegation + members × early", () => {
  const f = computeFee(settings, 5, new Date("2026-12-01T10:00:00+05:00"));
  assert.equal(f.tier, "early");
  assert.equal(f.total, 4500 + 5 * 2500);
});
test("fee: after deadline is regular", () => {
  const f = computeFee(settings, 4, new Date("2026-12-16T00:00:00+05:00"));
  assert.equal(f.tier, "regular");
  assert.equal(f.total, 4500 + 4 * 3500);
});
test("fee: exactly at the deadline is still early", () => {
  assert.equal(computeFee(settings, 4, new Date("2026-12-15T23:59:00+05:00")).tier, "early");
});

test("phone: PK mobile formats normalise to +92", () => {
  for (const v of ["0300 1234567", "03001234567", "+92 300 1234567", "923001234567", "0092-300-1234567"]) assert.equal(normalizePkMobile(v), "+923001234567", v);
  for (const v of ["0300123456", "12345", "+44 7700 900123", "0213 5861234"]) assert.equal(normalizePkMobile(v), null, v);
  assert.ok(isPkPhone("021-35861234"));
});

const rules: Rules = { team_min: 4, team_max: 6, modules_min: 4, modules_max: 5, internal_email_domain: "heusercollege.edu.pk", compulsoryModuleIds: [1], activeModuleIds: [1, 2, 3, 4, 5, 6] };
const member = (n: number, inst = "KGS") => ({ full_name: `M ${n}`, email: `m${n}@x.com`, phone: "03001234567", grade: "Grade 9" as const, institution: inst });
const base = (over: Partial<RegistrationData> = {}): RegistrationData => ({
  delegation_type: "external_independent", elig_enrolled: true, elig_not_university: true, elig_read_rules: true,
  head_name: "Head", head_email: "h@x.com", head_whatsapp: "03001234567", head_alt_phone: "", head_grade: "Grade 9", institution: "KGS", city: "Karachi",
  team_name: "T", guardian_name: "G", guardian_phone: "03001234567",
  members: [member(1), member(2), member(3)], module_ranking: [2, 3, 4],
  heard_from: "Instagram", agree_rules: true, agree_conduct: true, agree_dress: true, agree_media: true, ...over,
});

test("rules: valid team has no issues", () => assert.deepEqual(ruleIssues(base(), rules), []));
test("rules: team of 3 (incl. head) is too small; 7 too big", () => {
  assert.ok(ruleIssues(base({ members: [member(1), member(2)] }), rules).some((i) => i.path[0] === "members"));
  assert.ok(ruleIssues(base({ members: [1, 2, 3, 4, 5, 6].map((n) => member(n)) }), rules).some((i) => i.path[0] === "members"));
});
test("rules: compulsory module excluded; must rank 3–4 more", () => {
  assert.deepEqual(moduleSlots(rules), { min: 3, max: 4 });
  assert.ok(ruleIssues(base({ module_ranking: [2, 3] }), rules).some((i) => i.path[0] === "module_ranking"));
  assert.ok(ruleIssues(base({ module_ranking: [2, 3, 4, 5, 6] }), rules).some((i) => i.path[0] === "module_ranking"));
  assert.ok(ruleIssues(base({ module_ranking: [2, 2, 3] }), rules).some((i) => i.message.includes("once")));
  assert.deepEqual(ruleIssues(base({ module_ranking: [1, 2, 3, 4] }), rules), []); // compulsory id is ignored if sent
});
test("rules: internal teams need the college domain", () => {
  const issues = ruleIssues(base({ delegation_type: "internal" }), rules);
  assert.ok(issues.length >= 4);
});
test("rules: official delegations share one institution", () => {
  assert.ok(ruleIssues(base({ delegation_type: "external_official", members: [member(1), member(2), member(3, "Other")] }), rules).some((i) => i.path.join(".") === "members.2.institution"));
});
test("rules: duplicate emails rejected", () => {
  assert.ok(ruleIssues(base({ members: [member(1), member(1), member(3)] }), rules).some((i) => i.message.includes("different email")));
});

import { allocate } from "../src/lib/allocation";
test("allocation: compulsory for all, preferences honoured, capacity respected, 4–5 modules", () => {
  const modules = [
    { id: 1, capacity: null, is_compulsory: true },
    { id: 2, capacity: 2, is_compulsory: false },
    { id: 3, capacity: 10, is_compulsory: false },
    { id: 4, capacity: 10, is_compulsory: false },
    { id: 5, capacity: 10, is_compulsory: false },
    { id: 6, capacity: 10, is_compulsory: false },
  ];
  const prefs = (ids: number[]) => ids.map((m, i) => ({ module_id: m, rank: i + 1 }));
  const teams = [
    { id: "a", submitted_at: "2026-12-01", prefs: prefs([2, 3, 4, 5]) },
    { id: "b", submitted_at: "2026-12-02", prefs: prefs([2, 3, 4]) },
    { id: "c", submitted_at: "2026-12-03", prefs: prefs([2, 3, 4, 6]) },
  ];
  const r = allocate(teams, modules, 4, 5);
  for (const t of teams) {
    const m = r.byTeam[t.id].modules;
    assert.ok(m.includes(1), "compulsory");
    assert.ok(m.length >= 4 && m.length <= 5, `${t.id} has ${m.length}`);
    assert.equal(new Set(m).size, m.length);
  }
  assert.equal(r.load[2], 2, "capacity 2 respected");
  assert.ok(r.byTeam.a.modules.includes(2) && r.byTeam.b.modules.includes(2), "earliest teams get scarce first choice");
  assert.ok(!r.byTeam.c.modules.includes(2));
  assert.ok(r.byTeam.c.modules.includes(6), "c falls back to its next preferences");
});
test("allocation: tops up teams whose preferences are full", () => {
  const modules = [{ id: 1, capacity: null, is_compulsory: true }, { id: 2, capacity: 0, is_compulsory: false }, { id: 3, capacity: 5, is_compulsory: false }, { id: 4, capacity: 5, is_compulsory: false }, { id: 5, capacity: 5, is_compulsory: false }];
  const r = allocate([{ id: "x", submitted_at: "1", prefs: [{ module_id: 2, rank: 1 }, { module_id: 3, rank: 2 }, { module_id: 4, rank: 3 }] }], modules, 4, 5);
  assert.equal(r.byTeam.x.modules.length, 4);
  assert.deepEqual(r.byTeam.x.filled, [5]);
});

import { safeNext } from "../src/lib/safe-next";
test("safeNext: only same-origin paths", () => {
  assert.equal(safeNext("/dashboard?x=1#a"), "/dashboard?x=1#a");
  assert.equal(safeNext("/admin"), "/admin");
  assert.equal(safeNext("/a/../dashboard"), "/dashboard");
  for (const bad of ["//evil.com", "/\\evil.com", "/\\/evil.com", "https://evil.com", "evil.com", "/%0d%0aLocation:x".replace("%0d%0a", "\r\n"), "", null, undefined, "javascript:alert(1)", "/.//evil.com", "/a/..//evil.com", "/./\\evil.com", "/%2e//evil.com"])
    assert.equal(safeNext(bad as string), "/register", String(bad));
});
