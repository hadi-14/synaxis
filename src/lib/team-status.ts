import "server-only";
import { createAdminClient } from "./supabase/admin";

export async function teamWaiversComplete(teamId: string) {
  const admin = createAdminClient();
  const [{ data: members }, { data: waivers }] = await Promise.all([
    admin.from("team_members").select("id").eq("team_id", teamId),
    admin.from("waivers").select("member_id, received").eq("team_id", teamId),
  ]);
  if (waivers?.some((w) => !w.member_id && w.received)) return true;
  return !!members?.length && members.every((m) => waivers?.some((w) => w.member_id === m.id && w.received));
}

/** Re-derive the team's pipeline status after a payment or waiver change. Never touches cancelled/allocated/checked-in. */
export async function recomputeStatus(teamId: string) {
  const admin = createAdminClient();
  const { data: team } = await admin.from("teams").select("status, total_fee").eq("id", teamId).single();
  if (!team || ["cancelled", "modules_allocated", "checked_in"].includes(team.status)) return team?.status;
  const { data: pays } = await admin.from("payments").select("amount, status, created_at").eq("team_id", teamId).order("created_at", { ascending: false });
  const verified = (pays ?? []).filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
  const latest = pays?.[0];
  let next: string;
  if (verified >= team.total_fee) next = (await teamWaiversComplete(teamId)) ? "verified" : "waiver_pending";
  else if (latest?.status === "under_review") next = "under_review";
  else if (latest?.status === "rejected") next = "rejected";
  else if (latest?.status === "reupload_requested") next = "reupload_requested";
  else next = "pending_payment";
  if (next !== team.status) await admin.from("teams").update({ status: next as never }).eq("id", teamId);
  return next;
}

