import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getStaff, hasRole } from "@/lib/auth";
import { listTeams } from "@/lib/admin-teams";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

type Row = Record<string, string | number | null>;

function toCsv(rows: Row[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  // Guard against CSV/formula injection when opened in Excel/Sheets.
  const esc = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

async function toXlsx(rows: Row[], sheet: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Synaxis";
  const ws = wb.addWorksheet(sheet.slice(0, 31));
  if (rows.length) {
    ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k, width: Math.min(40, Math.max(10, k.length + 4)) }));
    ws.addRows(rows);
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function GET(req: NextRequest) {
  const staff = await getStaff();
  if (!staff) return new NextResponse("Not authorised", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const dataset = sp.get("dataset") ?? "teams";
  const format = sp.get("format") === "xlsx" ? "xlsx" : "csv";
  if (["payments", "waivers"].includes(dataset) && !hasRole(staff, "super_admin", "finance")) return new NextResponse("Not authorised", { status: 403 });

  const admin = createAdminClient();
  const { data: modules } = await admin.from("modules").select("id, name");
  const mName = (id: number) => modules?.find((m) => m.id === id)?.name ?? String(id);
  let teams = await listTeams(staff, {
    q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, module: sp.get("module") ?? undefined, type: sp.get("type") ?? undefined,
    tier: sp.get("tier") ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined,
  });
  const ids = sp.get("ids")?.split(",").filter(Boolean);
  if (ids?.length) teams = teams.filter((t) => ids.includes(t.id));
  const teamIds = teams.map((t) => t.id);

  let rows: Row[] = [];
  if (dataset === "teams") {
    rows = teams.map((t) => ({
      reg_code: t.reg_code, team_name: t.team_name, status: t.status, delegation_type: t.delegation_type, institution: t.institution, city: t.city,
      head_name: t.head_name, head_email: t.head_email, head_whatsapp: t.head_whatsapp, members: t.member_count, fee_tier: t.fee_tier, total_fee: t.total_fee,
      verified_paid: t.payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0),
      preferences: [...t.module_preferences].sort((a, b) => a.rank - b.rank).map((p) => mName(p.module_id)).join(" > "),
      allocated: t.module_allocations.map((a) => mName(a.module_id)).join(", "),
      submitted_at: t.submitted_at,
    }));
  } else if (dataset === "members") {
    const { data } = teamIds.length ? await admin.from("team_members").select("*").in("team_id", teamIds).order("position") : { data: [] };
    const byTeam = Object.fromEntries(teams.map((t) => [t.id, t]));
    rows = (data ?? []).map((m) => ({
      reg_code: byTeam[m.team_id].reg_code, team_name: byTeam[m.team_id].team_name, role: m.is_head ? "Head Delegate" : "Member",
      full_name: m.full_name, email: m.email, phone: m.phone, grade: m.grade, institution: m.institution,
      modules: byTeam[m.team_id].module_allocations.map((a) => mName(a.module_id)).join(", "),
    }));
  } else if (dataset === "payments") {
    const { data } = teamIds.length ? await admin.from("payments").select("*").in("team_id", teamIds).order("created_at") : { data: [] };
    const byTeam = Object.fromEntries(teams.map((t) => [t.id, t]));
    rows = (data ?? []).map((p) => ({
      reg_code: byTeam[p.team_id].reg_code, team_name: byTeam[p.team_id].team_name, amount: p.amount, total_fee: byTeam[p.team_id].total_fee,
      method: p.method, status: p.status, notes: p.notes, uploaded_at: p.created_at, reviewed_at: p.reviewed_at,
    }));
  } else if (dataset === "waivers") {
    const [{ data: members }, { data: waivers }] = await Promise.all([
      teamIds.length ? admin.from("team_members").select("id, team_id, full_name") .in("team_id", teamIds) : Promise.resolve({ data: [] as { id: string; team_id: string; full_name: string }[] }),
      teamIds.length ? admin.from("waivers").select("team_id, member_id, received") .in("team_id", teamIds) : Promise.resolve({ data: [] as { team_id: string; member_id: string | null; received: boolean }[] }),
    ]);
    const byTeam = Object.fromEntries(teams.map((t) => [t.id, t]));
    rows = (members ?? []).map((m) => {
      const own = waivers?.filter((w) => w.member_id === m.id) ?? [];
      const combined = waivers?.filter((w) => w.team_id === m.team_id && !w.member_id) ?? [];
      const received = own.some((w) => w.received) || combined.some((w) => w.received);
      return {
        reg_code: byTeam[m.team_id].reg_code, team_name: byTeam[m.team_id].team_name, member: m.full_name,
        uploaded: own.length || combined.length ? "yes" : "no", received: received ? "yes" : "no",
      };
    });
  } else if (dataset === "institutions") {
    const agg: Record<string, { teams: number; delegates: number; official: number }> = {};
    for (const t of teams.filter((t) => t.status !== "cancelled")) {
      const a = (agg[t.institution] ??= { teams: 0, delegates: 0, official: 0 });
      a.teams++;
      a.delegates += t.member_count;
      if (t.delegation_type === "external_official") a.official++;
    }
    rows = Object.entries(agg).sort((a, b) => b[1].teams - a[1].teams).map(([institution, a]) => ({ institution, ...a }));
  } else return new NextResponse("Unknown dataset", { status: 400 });

  await audit({ actor: { id: staff.id, email: staff.email }, action: "export.downloaded", entity: "export", entityId: dataset, after: { format, rows: rows.length } });
  const stamp = new Date().toISOString().slice(0, 10);
  const moduleSuffix = sp.get("module") ? `-${mName(Number(sp.get("module"))).replace(/\W+/g, "-").toLowerCase()}` : "";
  const filename = `synaxis-${dataset}${moduleSuffix}-${stamp}.${format}`;
  const headers = { "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" };
  if (format === "csv") return new NextResponse(toCsv(rows), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
  return new NextResponse(await toXlsx(rows, dataset), { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } });
}
