"use server";
import { assertStaff } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import { Broadcast } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";

/** Sends a test email to the signed-in Super Admin and reports what Resend said. */
export async function sendTestEmail(): Promise<{ ok: boolean; message: string }> {
  const staff = await assertStaff("super_admin");
  if (!(await rateLimit("test-email", 5, 600, staff.id))) return { ok: false, message: "Too many test emails. Wait a few minutes." };
  const r = await sendEmail({
    to: staff.email,
    subject: "Synaxis test email",
    template: "system-test",
    sentBy: staff.id,
    react: Broadcast({ heading: "Hello. I am Baymax.", body: `This is a test email from Synaxis.\n\nIf you can read this, Resend is set up correctly for ${process.env.RESEND_FROM ?? process.env.EMAIL_FROM ?? "the default sender"}.` }),
  });
  if (r.status === "sent") return { ok: true, message: `Sent to ${staff.email}. Check your inbox (and spam).` };
  if (r.status === "skipped") return { ok: false, message: "Not sent: RESEND_API_KEY is not set on the server." };
  return { ok: false, message: `Resend error: ${r.error}` };
}
