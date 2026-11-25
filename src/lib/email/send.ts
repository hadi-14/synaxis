import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { createAdminClient } from "../supabase/admin";

const FROM = process.env.EMAIL_FROM ?? "Synaxis <onboarding@resend.dev>";
const REPLY_TO = process.env.EMAIL_REPLY_TO;

/** Sends one email and records it in email_logs. Never throws: email problems must not break a registration. */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  template: string;
  react: ReactElement;
  teamId?: string | null;
  sentBy?: string | null;
}) {
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
  const key = process.env.RESEND_API_KEY;
  let status: "sent" | "failed" | "skipped" = "skipped";
  let providerId: string | null = null;
  let error: string | null = key ? null : "RESEND_API_KEY not set";
  if (key) {
    try {
      const resend = new Resend(key);
      const res = await resend.emails.send({ from: FROM, to: recipients, subject: opts.subject, react: opts.react, replyTo: REPLY_TO });
      if (res.error) {
        status = "failed";
        error = res.error.message;
      } else {
        status = "sent";
        providerId = res.data?.id ?? null;
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  }
  try {
    await createAdminClient()
      .from("email_logs")
      .insert(recipients.map((to) => ({ to_email: to, template: opts.template, subject: opts.subject, team_id: opts.teamId ?? null, status, provider_id: providerId, error, sent_by: opts.sentBy ?? null })));
  } catch (e) {
    console.error("email log failed", e);
  }
  return { status, error };
}

/** Admin notification addresses (comma-separated env). */
export const adminInbox = () => (process.env.ADMIN_NOTIFY_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** Batch send (Resend batch API, 100 per call). Each item is logged. Never throws. */
export async function sendBatch(
  items: { to: string; subject: string; react: ReactElement; teamId?: string | null }[],
  template: string,
  sentBy: string | null,
) {
  const key = process.env.RESEND_API_KEY;
  const results: { status: "sent" | "failed" | "skipped"; error: string | null; providerId: string | null }[] = [];
  if (!key) items.forEach(() => results.push({ status: "skipped", error: "RESEND_API_KEY not set", providerId: null }));
  else {
    const resend = new Resend(key);
    for (let i = 0; i < items.length; i += 100) {
      const chunk = items.slice(i, i + 100);
      try {
        const res = await resend.batch.send(
          chunk.map((it) => ({ from: FROM, to: [it.to], subject: it.subject, react: it.react, replyTo: REPLY_TO })),
          { batchValidation: "permissive" },
        );
        if (res.error) chunk.forEach(() => results.push({ status: "failed", error: res.error!.message, providerId: null }));
        else {
          const errs = new Map((res.data as unknown as { errors?: { index: number; message: string }[] }).errors?.map((e) => [e.index, e.message]) ?? []);
          let ok = 0;
          chunk.forEach((_, j) => {
            if (errs.has(j)) results.push({ status: "failed", error: errs.get(j)!, providerId: null });
            else results.push({ status: "sent", error: null, providerId: res.data?.data?.[ok++]?.id ?? null });
          });
        }
      } catch (e) {
        chunk.forEach(() => results.push({ status: "failed", error: e instanceof Error ? e.message : String(e), providerId: null }));
      }
    }
  }
  await createAdminClient()
    .from("email_logs")
    .insert(items.map((it, i) => ({ to_email: it.to, template, subject: it.subject, team_id: it.teamId ?? null, status: results[i].status, provider_id: results[i].providerId, error: results[i].error, sent_by: sentBy })));
  return { sent: results.filter((r) => r.status === "sent").length, failed: results.filter((r) => r.status === "failed").length, skipped: results.filter((r) => r.status === "skipped").length };
}
