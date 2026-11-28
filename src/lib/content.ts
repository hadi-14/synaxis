import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import type { CouncilMember, Faq, Module, Settings, Sponsor } from "./types";

export const CONTENT_TAG = "content";

/* Public content is cached and invalidated with updateTag(CONTENT_TAG) from admin actions. */

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG, "settings");
  const { data, error } = await createPublicClient().from("settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error(`settings: ${error?.message ?? "missing row"}`);
  return data as Settings;
}

/**
 * Fills defaults for the module-page fields, so a row from before migration 20261128120000_module_pages
 * (or one an organiser left half-filled) still renders: lists become [], the overview falls back to the old
 * description, and the legacy free-text head names are kept for display.
 */
function normalizeModule(row: Record<string, unknown>): Module {
  const m = row as Partial<Module> & Module;
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String).map((x) => x.trim()).filter(Boolean) : []);
  return {
    ...m,
    overview: (m.overview ?? "").trim() || (m.description ?? "").trim(),
    ideal_for: list(m.ideal_for),
    skills_tested: list(m.skills_tested),
    character_role: m.character_role ?? "",
    character_tie_in: m.character_tie_in ?? "",
    brochure_number: m.brochure_number ?? null,
    head_member_id: m.head_member_id ?? null,
    cohead_member_id: m.cohead_member_id ?? null,
    rules_highlights: Array.isArray(m.rules_highlights)
      ? (m.rules_highlights as unknown[])
          .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
          .map((x) => ({ title: String(x.title ?? "").trim(), body: String(x.body ?? "").trim() }))
          .filter((x) => x.title)
      : [],
  };
}

export async function getModules(): Promise<Module[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG, "modules");
  const { data, error } = await createPublicClient()
    .from("modules")
    .select("*")
    .eq("is_active", true)
    .order("sort");
  if (error) throw new Error(`modules: ${error.message}`);
  return (data ?? []).map(normalizeModule);
}

export async function getModule(slug: string): Promise<Module | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG, "modules");
  const { data } = await createPublicClient().from("modules").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data ? normalizeModule(data) : null;
}

export async function getFaqs(): Promise<Faq[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG, "faqs");
  const { data, error } = await createPublicClient().from("faqs").select("*").eq("is_published", true).order("sort");
  if (error) throw new Error(`faqs: ${error.message}`);
  return (data ?? []) as Faq[];
}

export async function getCouncil(): Promise<CouncilMember[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG, "council");
  const { data, error } = await createPublicClient()
    .from("council_members")
    .select("*")
    .eq("is_published", true)
    .order("sort");
  if (error) throw new Error(`council: ${error.message}`);
  return (data ?? []) as CouncilMember[];
}

export async function getSponsors(): Promise<Sponsor[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG, "sponsors");
  const { data, error } = await createPublicClient().from("sponsors").select("*").eq("is_published", true).order("sort");
  if (error) throw new Error(`sponsors: ${error.message}`);
  return (data ?? []) as Sponsor[];
}

export function rulesFrom(settings: Settings, modules: Module[]) {
  return {
    team_min: settings.team_min,
    team_max: settings.team_max,
    modules_min: settings.modules_min,
    modules_max: settings.modules_max,
    internal_email_domain: settings.internal_email_domain,
    compulsoryModuleIds: modules.filter((m) => m.is_compulsory).map((m) => m.id),
    activeModuleIds: modules.map((m) => m.id),
  };
}

/** Registration is open when the toggle is on AND now is inside the open/close window. */
export function registrationState(s: Settings, now: Date) {
  if (!s.registration_open) return "closed" as const;
  if (now < new Date(s.registration_opens_at)) return "not_yet" as const;
  if (now > new Date(s.registration_closes_at)) return "closed" as const;
  return "open" as const;
}
