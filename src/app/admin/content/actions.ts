"use server";
import { updateTag } from "next/cache";
import { expandMapShortLink } from "@/lib/maps";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertStaff, hasRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { CONTENT_TAG } from "@/lib/content";
import { fromKarachiLocalInput } from "@/lib/dates";

export type FormResult = { ok: boolean; message: string };
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => (str(f, k) === "" ? null : Number(str(f, k)));
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const done = (message: string): FormResult => {
  updateTag(CONTENT_TAG);
  revalidatePath("/admin", "layout");
  return { ok: true, message };
};
const fail = (e: unknown): FormResult => ({ ok: false, message: e instanceof Error ? e.message : String(e) });
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be like #F24B59");
const url = z.union([z.literal(""), z.string().url("Enter a full URL (https://…)").or(z.string().startsWith("/"))]);

// ---------------------------------------------------------------- modules
export async function saveModule(_: FormResult | null, f: FormData): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin", "module_head");
    const id = Number(str(f, "id"));
    const isSuper = hasRole(staff, "super_admin");
    if (!isSuper && !staff.moduleIds.includes(id)) return { ok: false, message: "You can only edit your own module." };
    const content = {
      name: z.string().min(2).max(60).parse(str(f, "name")),
      tagline: z.string().max(140).parse(str(f, "tagline")),
      description: z.string().max(2000).parse(str(f, "description")),
      format: z.string().max(200).parse(str(f, "format")),
      team_size_note: z.string().max(100).parse(str(f, "team_size_note")),
      schedule_slot: z.string().max(100).parse(str(f, "schedule_slot")),
      head_name: z.string().max(80).parse(str(f, "head_name")),
      cohead_name: z.string().max(80).parse(str(f, "cohead_name")),
    };
    const structural = isSuper
      ? {
          subject: z.string().min(2).max(40).parse(str(f, "subject")),
          character: z.string().min(2).max(40).parse(str(f, "character")),
          accent: hex.parse(str(f, "accent")),
          capacity: num(f, "capacity"),
          is_compulsory: bool(f, "is_compulsory"),
          is_active: bool(f, "is_active"),
          sort: num(f, "sort") ?? 0,
        }
      : {};
    const admin = createAdminClient();
    const { data: before } = await admin.from("modules").select("*").eq("id", id).single();
    const { error } = await admin.from("modules").update({ ...content, ...structural }).eq("id", id);
    if (error) throw error;
    await audit({ actor: { id: staff.id, email: staff.email }, action: "content.module_updated", entity: "module", entityId: id, before, after: { ...content, ...structural } });
    return done("Module saved");
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- FAQs
export async function saveFaq(_: FormResult | null, f: FormData): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const row = {
      question: z.string().min(3).max(200).parse(str(f, "question")),
      answer: z.string().min(1).max(3000).parse(str(f, "answer")),
      category: str(f, "category") || "General",
      sort: num(f, "sort") ?? 0,
      is_published: bool(f, "is_published"),
    };
    const id = num(f, "id");
    const admin = createAdminClient();
    const { error } = id ? await admin.from("faqs").update(row).eq("id", id) : await admin.from("faqs").insert(row);
    if (error) throw error;
    await audit({ actor: { id: staff.id, email: staff.email }, action: id ? "content.faq_updated" : "content.faq_created", entity: "faq", entityId: id, after: row });
    return done(id ? "FAQ saved" : "FAQ added");
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- council
export async function saveCouncil(_: FormResult | null, f: FormData): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const row = {
      name: z.string().min(2).max(80).parse(str(f, "name")),
      role: z.string().min(2).max(80).parse(str(f, "role")),
      tier: z.enum(["executive", "module"]).parse(str(f, "tier") || "module"),
      module_id: num(f, "module_id"),
      photo_url: url.parse(str(f, "photo_url")) || null,
      instagram: str(f, "instagram").replace(/^@/, "") || null,
      linkedin: url.parse(str(f, "linkedin")) || null,
      email: str(f, "email") || null,
      bio: str(f, "bio").slice(0, 300) || null,
      sort: num(f, "sort") ?? 0,
      is_published: bool(f, "is_published"),
    };
    const id = num(f, "id");
    const admin = createAdminClient();
    const { error } = id ? await admin.from("council_members").update(row).eq("id", id) : await admin.from("council_members").insert(row);
    if (error) throw error;
    await audit({ actor: { id: staff.id, email: staff.email }, action: id ? "content.council_updated" : "content.council_created", entity: "council", entityId: id, after: row });
    return done(id ? "Council member saved" : "Council member added");
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- sponsors
export async function saveSponsor(_: FormResult | null, f: FormData): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const row = {
      name: z.string().min(2).max(80).parse(str(f, "name")),
      tier: z.enum(["title", "platinum", "gold", "community", "partner"]).parse(str(f, "tier")),
      logo_url: url.parse(str(f, "logo_url")) || null,
      url: url.parse(str(f, "url")) || null,
      blurb: str(f, "blurb").slice(0, 300) || null,
      sort: num(f, "sort") ?? 0,
      is_published: bool(f, "is_published"),
    };
    const id = num(f, "id");
    const admin = createAdminClient();
    const { error } = id ? await admin.from("sponsors").update(row).eq("id", id) : await admin.from("sponsors").insert(row);
    if (error) throw error;
    await audit({ actor: { id: staff.id, email: staff.email }, action: id ? "content.sponsor_updated" : "content.sponsor_created", entity: "sponsor", entityId: id, after: row });
    return done(id ? "Sponsor saved" : "Sponsor added");
  } catch (e) {
    return fail(e);
  }
}

export async function deleteContent(kind: "faqs" | "council_members" | "sponsors", id: number): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const { error } = await createAdminClient().from(kind).delete().eq("id", id);
    if (error) throw error;
    await audit({ actor: { id: staff.id, email: staff.email }, action: `content.${kind}_deleted`, entity: kind, entityId: id });
    return done("Deleted");
  } catch (e) {
    return fail(e);
  }
}

export async function markInquiry(id: number, handled: boolean): Promise<FormResult> {
  try {
    await assertStaff("super_admin");
    await createAdminClient().from("sponsor_inquiries").update({ handled }).eq("id", id);
    revalidatePath("/admin/content");
    return { ok: true, message: handled ? "Marked handled" : "Reopened" };
  } catch (e) {
    return fail(e);
  }
}

/** Signed upload URL into the public `media` bucket (photos/logos). Returns the final public URL. */
export async function mediaUploadUrl(kind: "council" | "sponsors", mime: string, size: number): Promise<{ ok: true; path: string; token: string; publicUrl: string } | { ok: false; error: string }> {
  await assertStaff("super_admin");
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" }[mime];
  if (!ext) return { ok: false, error: "Use JPG, PNG, WebP or SVG." };
  if (size > 5 * 1024 * 1024) return { ok: false, error: "Max 5 MB." };
  const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("media").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Upload unavailable." };
  return { ok: true, path, token: data.token, publicUrl: admin.storage.from("media").getPublicUrl(path).data.publicUrl };
}

// ---------------------------------------------------------------- settings
export async function saveSettings(_: FormResult | null, f: FormData): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const int = (k: string) => z.coerce.number().int().min(0).parse(str(f, k));
    const when = (k: string) => fromKarachiLocalInput(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, `${k}: pick a date and time`).parse(str(f, k)));
    const row = {
      season_label: str(f, "season_label") || "Season 1",
      event_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(str(f, "event_start")),
      event_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(str(f, "event_end")),
      venue_name: str(f, "venue_name"),
      venue_address: str(f, "venue_address"),
      venue_map_url: await expandMapShortLink(str(f, "venue_map_url").slice(0, 2000)), // any Google Maps link or an address
      delegation_fee_early: int("delegation_fee_early"),
      delegation_fee_regular: int("delegation_fee_regular"),
      early_fee: int("early_fee"),
      regular_fee: int("regular_fee"),
      registration_opens_at: when("registration_opens_at"),
      early_bird_deadline: when("early_bird_deadline"),
      registration_closes_at: when("registration_closes_at"),
      payment_deadline: when("payment_deadline"),
      team_min: int("team_min"),
      team_max: int("team_max"),
      modules_min: int("modules_min"),
      modules_max: int("modules_max"),
      best_institute_min_teams: int("best_institute_min_teams"),
      registration_open: bool(f, "registration_open"),
      internal_email_domain: str(f, "internal_email_domain").replace(/^@/, "").toLowerCase(),
      announcement: str(f, "announcement").slice(0, 280),
      announcement_active: bool(f, "announcement_active"),
      contact_email: z.string().email().parse(str(f, "contact_email")),
      contact_whatsapp: str(f, "contact_whatsapp"),
      instagram_url: url.parse(str(f, "instagram_url")),
      waiver_template_url: url.parse(str(f, "waiver_template_url")) || "/waiver",
    };
    if (row.team_max < row.team_min) return { ok: false, message: "Team max must be ≥ team min." };
    if (row.modules_max < row.modules_min) return { ok: false, message: "Modules max must be ≥ modules min." };
    if (row.event_end < row.event_start) return { ok: false, message: "Event end must be after start." };
    const admin = createAdminClient();
    const { data: before } = await admin.from("settings").select("*").eq("id", 1).single();
    const { error } = await admin.from("settings").update(row).eq("id", 1);
    if (error) throw error;
    await audit({ actor: { id: staff.id, email: staff.email }, action: "settings.updated", entity: "settings", entityId: 1, before, after: row });
    return done("Settings saved. Fees and dates apply to new submissions; existing totals are unchanged.");
  } catch (e) {
    return fail(e);
  }
}

export async function savePaymentDetails(_: FormResult | null, f: FormData): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const row = {
      bank_name: str(f, "bank_name"),
      account_title: str(f, "account_title"),
      account_number: str(f, "account_number"),
      iban: str(f, "iban").replace(/\s+/g, "").toUpperCase(),
      receipt_whatsapp: str(f, "receipt_whatsapp").replace(/\D/g, ""),
      instructions: str(f, "instructions").slice(0, 500),
    };
    if (!/^PK\d{2}[A-Z0-9]{4}\d{16}$/.test(row.iban) && !row.iban.includes("X")) return { ok: false, message: "IBAN should look like PK36SCBL0000001123456702." };
    const admin = createAdminClient();
    const { data: before } = await admin.from("payment_details").select("*").eq("id", 1).single();
    const { error } = await admin.from("payment_details").update(row).eq("id", 1);
    if (error) throw error;
    await audit({ actor: { id: staff.id, email: staff.email }, action: "settings.bank_updated", entity: "payment_details", entityId: 1, before, after: row });
    return done("Bank details saved");
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- roles
export async function addRole(_: FormResult | null, f: FormData): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const email = z.string().email().parse(str(f, "email").toLowerCase());
    const role = z.enum(["super_admin", "finance", "module_head"]).parse(str(f, "role"));
    const moduleId = role === "module_head" ? z.coerce.number().int().positive().parse(str(f, "module_id")) : null;
    const admin = createAdminClient();
    // Exact (case-insensitive) match: escape LIKE wildcards so "_" or "%" can't match other accounts.
    const literal = email.replace(/[\\%_]/g, (c) => `\\${c}`);
    const { data: matches } = await admin.from("profiles").select("id, email").ilike("email", literal).limit(2);
    const profile = matches?.find((p) => p.email.toLowerCase() === email);
    if (!profile || (matches?.length ?? 0) > 1) return { ok: false, message: `${email} hasn't signed in yet. Ask them to sign in once at /login, then add them.` };
    const { error } = await admin.from("user_roles").insert({ user_id: profile.id, role, module_id: moduleId });
    if (error) return { ok: false, message: error.code === "23505" ? "They already have that role." : error.message };
    await audit({ actor: { id: staff.id, email: staff.email }, action: "role.granted", entity: "user_roles", entityId: profile.id, after: { email, role, moduleId } });
    revalidatePath("/admin/roles");
    return { ok: true, message: `Granted ${role.replace("_", " ")} to ${email}` };
  } catch (e) {
    return fail(e);
  }
}

export async function removeRole(id: number): Promise<FormResult> {
  try {
    const staff = await assertStaff("super_admin");
    const admin = createAdminClient();
    const { data: row } = await admin.from("user_roles").select("*").eq("id", id).single();
    if (row?.user_id === staff.id && row.role === "super_admin") {
      const { count } = await admin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
      if ((count ?? 0) <= 1) return { ok: false, message: "You're the last Super Admin; add another one first." };
    }
    await admin.from("user_roles").delete().eq("id", id);
    await audit({ actor: { id: staff.id, email: staff.email }, action: "role.revoked", entity: "user_roles", entityId: id, before: row });
    revalidatePath("/admin/roles");
    return { ok: true, message: "Role removed" };
  } catch (e) {
    return fail(e);
  }
}
