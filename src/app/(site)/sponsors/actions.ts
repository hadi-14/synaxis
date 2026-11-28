"use server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { adminInbox, sendEmail } from "@/lib/email/send";
import { SponsorInquiry } from "@/lib/email/templates";

const schema = z.object({
  name: z.string().trim().min(2, "Your name, please.").max(80),
  organisation: z.string().trim().min(2, "Organisation name, please.").max(120),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(30).optional(),
  interest: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters).").max(2000),
  website: z.string().max(0).optional(), // honeypot
});

export type InquiryState = { ok: boolean; message: string; errors?: Record<string, string>; values?: Record<string, string> } | null;

export async function submitInquiry(_: InquiryState, f: FormData): Promise<InquiryState> {
  const raw = Object.fromEntries(["name", "organisation", "email", "phone", "interest", "message", "website"].map((k) => [k, String(f.get(k) ?? "")]));
  if (raw.website) return { ok: true, message: "Thanks! We'll be in touch." }; // bot
  const values = { ...raw, website: "" };
  if (!(await rateLimit("sponsor-inquiry", 5, 3600))) return { ok: false, message: "Too many messages from this connection. Try again later.", values };
  const p = schema.safeParse(raw);
  if (!p.success) return { ok: false, message: "Please check the highlighted fields.", values, errors: Object.fromEntries(p.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const { website: _w, ...row } = p.data;
  void _w;
  const { error } = await createAdminClient().from("sponsor_inquiries").insert({ ...row, phone: row.phone || null, interest: row.interest || null });
  if (error) return { ok: false, message: "Couldn't send right now. Please email us instead.", values };
  const to = adminInbox();
  if (to.length) await sendEmail({ to, subject: `Sponsor inquiry: ${row.organisation}`, template: "sponsor-inquiry", react: SponsorInquiry(row) });
  return { ok: true, message: "Thank you! The Cabinet will get back to you within a few days." };
}
