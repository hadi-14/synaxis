"use server";
import { revalidatePath } from "next/cache";
import { assertStaff, type StaffContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { PaymentRejected, PaymentVerified, WaiversReceived } from "@/lib/email/templates";
import { recomputeStatus, teamWaiversComplete } from "@/lib/team-status";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
const actor = (s: StaffContext) => ({ id: s.id, email: s.email });

export async function verifyPayment(paymentId: string, amount: number | null, note: string): Promise<Result> {
  const staff = await assertStaff("super_admin", "finance");
  const admin = createAdminClient();
  const { data: p } = await admin.from("payments").select("*, teams(id, reg_code, team_name, head_email, status)").eq("id", paymentId).single();
  if (!p) return { ok: false, error: "Payment not found." };
  const team = p.teams as unknown as { id: string; reg_code: string; team_name: string; head_email: string; status: string };
  await admin
    .from("payments")
    .update({ status: "verified", amount: amount ?? p.amount, reviewed_by: staff.id, reviewed_at: new Date().toISOString(), notes: note || null })
    .eq("id", paymentId);
  const next = await recomputeStatus(team.id);
  await audit({ actor: actor(staff), action: "payment.verified", entity: "payment", entityId: paymentId, teamId: team.id, before: { status: p.status, team: team.status }, after: { status: "verified", amount: amount ?? p.amount, team: next }, note });
  if (next === "verified" || next === "waiver_pending") {
    await sendEmail({ to: team.head_email, subject: `${team.reg_code} · Payment verified`, template: "payment-verified", teamId: team.id, sentBy: staff.id, react: PaymentVerified({ teamName: team.team_name, regCode: team.reg_code, waiversDone: next === "verified" }) });
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function rejectPayment(paymentId: string, reason: string, reupload: boolean): Promise<Result> {
  const staff = await assertStaff("super_admin", "finance");
  if (reason.trim().length < 3) return { ok: false, error: "Add a short reason for the team." };
  const admin = createAdminClient();
  const { data: p } = await admin.from("payments").select("*, teams(id, reg_code, team_name, head_email, status)").eq("id", paymentId).single();
  if (!p) return { ok: false, error: "Payment not found." };
  const team = p.teams as unknown as { id: string; reg_code: string; team_name: string; head_email: string; status: string };
  const status = reupload ? "reupload_requested" : "rejected";
  await admin.from("payments").update({ status, reviewed_by: staff.id, reviewed_at: new Date().toISOString(), notes: reason }).eq("id", paymentId);
  const next = await recomputeStatus(team.id);
  await audit({ actor: actor(staff), action: `payment.${status}`, entity: "payment", entityId: paymentId, teamId: team.id, before: { status: p.status, team: team.status }, after: { status, team: next }, note: reason });
  await sendEmail({ to: team.head_email, subject: `${team.reg_code} · ${reupload ? "Please re-upload your receipt" : "Payment not verified"}`, template: reupload ? "reupload-requested" : "payment-rejected", teamId: team.id, sentBy: staff.id, react: PaymentRejected({ teamName: team.team_name, regCode: team.reg_code, reason, reupload }) });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** For receipts sent on WhatsApp / cash: finance records a payment directly. */
export async function recordManualPayment(teamId: string, amount: number, note: string): Promise<Result> {
  const staff = await assertStaff("super_admin", "finance");
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter the amount received." };
  const admin = createAdminClient();
  const { data: t } = await admin.from("teams").select("fee_breakdown").eq("id", teamId).single();
  if (!t) return { ok: false, error: "Team not found." };
  const { data: p, error } = await admin
    .from("payments")
    .insert({ team_id: teamId, amount, fee_breakdown: t.fee_breakdown, method: "whatsapp", status: "under_review", notes: note || "Recorded by finance (WhatsApp)" })
    .select("id")
    .single();
  if (error || !p) return { ok: false, error: "Couldn't record the payment." };
  await audit({ actor: actor(staff), action: "payment.recorded_manually", entity: "payment", entityId: p.id, teamId, after: { amount }, note });
  return verifyPayment(p.id, amount, note || "WhatsApp receipt");
}

export async function setWaiverReceived(waiverId: string, received: boolean): Promise<Result> {
  const staff = await assertStaff("super_admin", "finance");
  const admin = createAdminClient();
  const { data: w } = await admin.from("waivers").select("team_id, received").eq("id", waiverId).single();
  if (!w) return { ok: false, error: "Waiver not found." };
  const wasComplete = await teamWaiversComplete(w.team_id);
  await admin.from("waivers").update({ received, received_by: received ? staff.id : null, received_at: received ? new Date().toISOString() : null }).eq("id", waiverId);
  const nowComplete = await teamWaiversComplete(w.team_id);
  const next = await recomputeStatus(w.team_id);
  await audit({ actor: actor(staff), action: received ? "waiver.received" : "waiver.unmarked", entity: "waiver", entityId: waiverId, teamId: w.team_id, before: { received: w.received }, after: { received, team: next } });
  if (!wasComplete && nowComplete) {
    const { data: t } = await admin.from("teams").select("reg_code, team_name, head_email").eq("id", w.team_id).single();
    if (t) await sendEmail({ to: t.head_email, subject: `${t.reg_code} · Waivers complete`, template: "waivers-received", teamId: w.team_id, sentBy: staff.id, react: WaiversReceived({ teamName: t.team_name, regCode: t.reg_code }) });
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setTeamCancelled(teamId: string, cancelled: boolean, note: string): Promise<Result> {
  const staff = await assertStaff("super_admin");
  const admin = createAdminClient();
  const { data: t } = await admin.from("teams").select("status").eq("id", teamId).single();
  if (!t) return { ok: false, error: "Team not found." };
  if (cancelled) await admin.from("teams").update({ status: "cancelled" }).eq("id", teamId);
  else {
    await admin.from("teams").update({ status: "pending_payment" }).eq("id", teamId);
    await recomputeStatus(teamId);
  }
  await audit({ actor: actor(staff), action: cancelled ? "team.cancelled" : "team.reinstated", entity: "team", entityId: teamId, teamId, before: { status: t.status }, note });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveAdminNotes(teamId: string, notes: string): Promise<Result> {
  const staff = await assertStaff("super_admin", "finance");
  await createAdminClient().from("teams").update({ admin_notes: notes.slice(0, 2000) }).eq("id", teamId);
  await audit({ actor: actor(staff), action: "team.notes_updated", entity: "team", entityId: teamId, teamId });
  return { ok: true };
}

/** Signed URL (5 min) for a receipt or waiver — staff only. */
export async function signedFileUrl(bucket: "receipts" | "waivers", path: string): Promise<Result<{ url: string }>> {
  const staff = await assertStaff();
  if (bucket === "receipts" && !staff.roles.some((r) => r === "super_admin" || r === "finance")) return { ok: false, error: "Not authorised." };
  const { data } = await createAdminClient().storage.from(bucket).createSignedUrl(path, 300);
  return data ? { ok: true, data: { url: data.signedUrl } } : { ok: false, error: "File not found." };
}

