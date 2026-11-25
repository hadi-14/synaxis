/**
 * Module allocation (pure, unit-tested).
 * 1. Every team gets every compulsory module (uncapped by design; capacity still reported).
 * 2. Draft rounds: teams in priority order (earliest submission first; reversed on even rounds
 *    for fairness, "snake draft") each take their highest-ranked preference that still has capacity.
 * 3. Teams stop at modules_max. Anyone below modules_min after preferences run out is topped up
 *    with the least-loaded module that has capacity (flagged as "filled" so admins can review).
 * Existing (locked) allocations are respected and count toward capacity.
 */
export type AllocModule = { id: number; capacity: number | null; is_compulsory: boolean };
export type AllocTeam = { id: string; submitted_at: string; prefs: { module_id: number; rank: number }[]; locked?: number[] };
export type AllocResult = {
  byTeam: Record<string, { modules: number[]; filled: number[]; short: boolean }>;
  load: Record<number, number>;
};

export function allocate(teams: AllocTeam[], modules: AllocModule[], min: number, max: number): AllocResult {
  const load: Record<number, number> = Object.fromEntries(modules.map((m) => [m.id, 0]));
  const cap = (id: number) => modules.find((m) => m.id === id)?.capacity ?? Infinity;
  const has = (id: number) => load[id] < cap(id);
  const compulsory = modules.filter((m) => m.is_compulsory).map((m) => m.id);
  const order = [...teams].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
  const byTeam: AllocResult["byTeam"] = {};

  for (const t of order) {
    const mods = [...new Set([...(t.locked ?? []), ...compulsory])];
    mods.forEach((id) => (load[id] = (load[id] ?? 0) + 1));
    byTeam[t.id] = { modules: mods, filled: [], short: false };
  }
  const prefsOf = (t: AllocTeam) => [...t.prefs].filter((p) => p.rank > 0).sort((a, b) => a.rank - b.rank).map((p) => p.module_id);

  for (let round = 0; round < max; round++) {
    const seq = round % 2 === 0 ? order : [...order].reverse();
    let moved = false;
    for (const t of seq) {
      const cur = byTeam[t.id].modules;
      if (cur.length >= max) continue;
      const pick = prefsOf(t).find((id) => !cur.includes(id) && has(id));
      if (pick != null) {
        cur.push(pick);
        load[pick]++;
        moved = true;
      }
    }
    if (!moved) break;
  }

  for (const t of order) {
    const r = byTeam[t.id];
    while (r.modules.length < min) {
      const candidates = modules.filter((m) => !m.is_compulsory && !r.modules.includes(m.id) && has(m.id)).sort((a, b) => load[a.id] - load[b.id]);
      if (!candidates.length) {
        r.short = true;
        break;
      }
      r.modules.push(candidates[0].id);
      r.filled.push(candidates[0].id);
      load[candidates[0].id]++;
    }
  }
  return { byTeam, load };
}
