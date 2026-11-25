"use server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { ReceiptReceived } from "@/lib/email/templates";
import { revalidatePath } from "next/cache";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const LIMITS = {
  receipt: { bucket: "receipts", max: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"] },
  waiver: { bucket: "waivers", max: 10 * 1024 * 1024, types: ["application/pdf", "image/jpeg", "image/png"] },
} as const;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "application/pdf": "pdf" };

async function ownTeam() {
  const user = await getUser();
  if (!user) return { user: null, team: null } as const;
  const { data: team } = await createAdminClient()
    .from("teams")
    .select("id, reg_code, team_name, status, head_email, total_fee")
    .eq("owner_id", user.id)
    .maybeSingle();
  return { user, team } as const;
}

/** Step 1 of an upload: validate, then hand the browser a one-time signed upload URL for its own team folder. */
export async function createUploadUrl(kind: "receipt" | "waiver", mime: string, size: number, memberId?: string | null): Promise<Result<{ path: string; token: string; bucket: string }>> {
  const { user, team } = await ownTeam();
  if (!user || !team) return { ok: false, error: "Sign in again to upload." };
  if (!(await rateLimit(`upload-${kind}`, 20, 600, user.id))) return { ok: false, error: "Too many uploads. Try again in a few minutes." };
  const lim = LIMITS[kind];
  if (!(lim.types as readonly string[]).includes(mime)) return { ok: false, error: kind === "receipt" ? "Upload a photo (JPG/PNG/HEIC) or a PDF." : "Upload a PDF or a photo." };
  if (size > lim.max) return { ok: false, error: `That file is too large. The limit is ${lim.max / 1024 / 1024} MB.` };
  if (["cancelled"].includes(team.status)) return { ok: false, error: "This registration is cancelled." };
  if (kind === "waiver" && memberId) {
    const { data: m } = await createAdminClient().from("team_members").select("id").eq("id", memberId).eq("team_id", team.id).maybeSingle();
    if (!m) return { ok: false, error: "Member not found." };
  }
  const path = `${team.id}/${kind === "waiver" ? (memberId ?? "combined") + "-" : ""}${Date.now()}.${EXT[mime]}`;
  const { data, error } = await createAdminClient().storage.from(lim.bucket).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Upload service unavailable. Try again." };
  return { ok: true, data: { path, token: data.token, bucket: lim.bucket } };
}

async function objectExists(bucket: string, path: string) {
  const [folder, name] = [path.slice(0, path.lastIndexOf("/")), path.slice(path.lastIndexOf("/") + 1)];
  const { data } = await createAdminClient().storage.from(bucket).list(folder, { search: name, limit: 1 });
  return !!data?.some((o) => o.name === name);
}

/** Step 2: record the receipt, move the team to under_review, notify. */
export async function confirmReceipt(path: string): Promise<Result> {
  const { user, team } = await ownTeam();
  if (!user || !team) return { ok: false, error: "Sign in again." };
  if (!path.startsWith(`${team.id}/`) || !(await objectExists("receipts", path))) return { ok: false, error: "We couldn't find that upload. Try again." };
  const admin = createAdminClient();
  const { data: t } = await admin.from("teams").select("fee_breakdown, total_fee").eq("id", team.id).single();
  const { error } = await admin.from("payments").insert({
    team_id: team.id,
    amount: t!.total_fee,
    fee_breakdown: t!.fee_breakdown,
    method: "upload",
    receipt_path: path,
    status: "under_review",
  });
  if (error) return { ok: false, error: "Couldn't save the receipt. Try again." };
  // Only move forward in the pipeline; never pull a verified team back.
  if (["pending_payment", "rejected", "reupload_requested", "under_review"].includes(team.status)) {
    await admin.from("teams").update({ status: "under_review" }).eq("id", team.id);
  }
  await audit({ actor: { id: user.id, email: user.email }, action: "payment.receipt_uploaded", entity: "payment", teamId: team.id, before: { status: team.status }, after: { status: "under_review", path } });
  await sendEmail({ to: team.head_email, subject: `${team.reg_code} · Receipt received`, template: "receipt-received", teamId: team.id, react: ReceiptReceived({ teamName: team.team_name, regCode: team.reg_code }) });
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function confirmWaiver(path: string, memberId: string | null): Promise<Result> {
  const { user, team } = await ownTeam();
  if (!user || !team) return { ok: false, error: "Sign in again." };
  if (!path.startsWith(`${team.id}/`) || !(await objectExists("waivers", path))) return { ok: false, error: "We couldn't find that upload. Try again." };
  const { error } = await createAdminClient().from("waivers").insert({ team_id: team.id, member_id: memberId, file_path: path });
  if (error) return { ok: false, error: "Couldn't save the waiver. Try again." };
  await audit({ actor: { id: user.id, email: user.email }, action: "waiver.uploaded", entity: "waiver", teamId: team.id, after: { path, memberId } });
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Records that the Head Delegate chose WhatsApp. Status stays pending until finance checks it (A8). */
export async function markWhatsAppShared(): Promise<Result> {
  const { user, team } = await ownTeam();
  if (!user || !team) return { ok: false, error: "Sign in again." };
  await createAdminClient().from("teams").update({ whatsapp_shared_at: new Date().toISOString() }).eq("id", team.id);
  await audit({ actor: { id: user.id, email: user.email }, action: "payment.whatsapp_shared", entity: "team", teamId: team.id });
  return { ok: true };
}

/** Short-lived signed URL so the owner can view their own uploaded file. */
export async function viewOwnFile(kind: "receipt" | "waiver", path: string): Promise<Result<{ url: string }>> {
  const { team } = await ownTeam();
  if (!team || !path.startsWith(`${team.id}/`)) return { ok: false, error: "Not found." };
  const { data } = await createAdminClient().storage.from(kind === "receipt" ? "receipts" : "waivers").createSignedUrl(path, 300);
  return data ? { ok: true, data: { url: data.signedUrl } } : { ok: false, error: "Not found." };
}
