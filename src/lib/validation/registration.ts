import { z } from "zod";
import { isPkPhone, normalizePkMobile } from "../phone";

export const GRADES = [
  "Grade 9",
  "Grade 10 / O-Level / Matric",
  "Grade 11 / AS / First Year",
  "Grade 12 / A2 / Second Year",
  "HSSC completed (MDCAT prep)",
  "Other equivalent",
] as const;

export const HEARD_FROM = ["Instagram", "Friend", "School", "Other"] as const;

export const DELEGATION_TYPES = {
  internal: "Internal (Heuser students)",
  external_official: "External: official school delegation",
  external_independent: "External: independent (private) delegation",
} as const;

export type Rules = {
  team_min: number;
  team_max: number;
  modules_min: number;
  modules_max: number;
  internal_email_domain: string;
  compulsoryModuleIds: number[];
  activeModuleIds: number[];
};

const name = z.string().trim().min(2, "Please enter a full name.").max(80);
const email = z.string().trim().toLowerCase().email("That email doesn't look right.");
const mobile = z
  .string()
  .trim()
  .refine((v) => normalizePkMobile(v) !== null, "Use a Pakistani mobile number, e.g. 0300 1234567.");
const anyPhone = z.string().trim().refine(isPkPhone, "Use a Pakistani phone number, e.g. 0300 1234567.");
const grade = z.enum(GRADES, { error: "Pick a grade or level." });

export const step1 = z.object({
  delegation_type: z.enum(["internal", "external_official", "external_independent"], {
    error: "Choose a delegation type.",
  }),
  elig_enrolled: z.literal(true, { error: "Required: every delegate must be enrolled in school." }),
  elig_not_university: z.literal(true, { error: "Required: university students aren't eligible." }),
  elig_read_rules: z.literal(true, { error: "Please confirm you've read the rules." }),
});

export const step2 = z.object({
  head_name: name,
  head_email: email,
  head_whatsapp: mobile,
  head_alt_phone: z.union([z.literal(""), anyPhone]).optional(),
  head_grade: grade,
  institution: z.string().trim().min(2, "Enter your institution.").max(120),
  city: z.string().trim().min(2, "Enter your city.").max(60),
  team_name: z
    .string()
    .trim()
    .min(2, "Team names need at least 2 characters.")
    .max(40, "Keep it under 40 characters.")
    .regex(/^[\p{L}\p{N} .'&!-]+$/u, "Letters, numbers, spaces and . ' & ! - only."),
  guardian_name: name,
  guardian_phone: anyPhone,
});

export const memberSchema = z.object({
  full_name: name,
  email,
  phone: anyPhone,
  grade,
  institution: z.string().trim().min(2, "Enter the institution.").max(120),
});

export const step3 = z.object({ members: z.array(memberSchema) });

export const step4 = z.object({ module_ranking: z.array(z.number().int().positive()) });

export const step5 = z.object({
  heard_from: z.enum(HEARD_FROM, { error: "Let us know how you heard about Synaxis." }),
  heard_from_other: z.string().trim().max(120).optional(),
  needs: z.string().trim().max(500).optional(),
  agree_rules: z.literal(true, { error: "Required." }),
  agree_conduct: z.literal(true, { error: "Required." }),
  agree_dress: z.literal(true, { error: "Required." }),
  agree_media: z.literal(true, { error: "Required." }),
});

export const registrationBase = step1.and(step2).and(step3).and(step4).and(step5);
export type RegistrationData = z.infer<typeof step1> &
  z.infer<typeof step2> &
  z.infer<typeof step3> &
  z.infer<typeof step4> &
  z.infer<typeof step5>;

/** Cross-field rules that depend on admin settings. Returns issues as {path, message}. */
export function ruleIssues(d: RegistrationData, rules: Rules): { path: (string | number)[]; message: string }[] {
  const issues: { path: (string | number)[]; message: string }[] = [];
  const teamSize = d.members.length + 1;
  if (teamSize < rules.team_min || teamSize > rules.team_max) {
    issues.push({
      path: ["members"],
      message: `Teams need ${rules.team_min}–${rules.team_max} members including you (currently ${teamSize}).`,
    });
  }
  const emails = [d.head_email, ...d.members.map((m) => m.email)].map((e) => e.toLowerCase());
  emails.forEach((e, i) => {
    if (emails.indexOf(e) !== i) issues.push({ path: i === 0 ? ["head_email"] : ["members", i - 1, "email"], message: "Each member needs a different email." });
  });
  if (d.delegation_type === "internal") {
    const dom = "@" + rules.internal_email_domain.toLowerCase();
    if (!d.head_email.toLowerCase().endsWith(dom))
      issues.push({ path: ["head_email"], message: `Internal teams must use ${dom} emails.` });
    d.members.forEach((m, i) => {
      if (!m.email.toLowerCase().endsWith(dom))
        issues.push({ path: ["members", i, "email"], message: `Internal teams must use ${dom} emails.` });
    });
  }
  if (d.delegation_type === "external_official") {
    d.members.forEach((m, i) => {
      if (m.institution.trim().toLowerCase() !== d.institution.trim().toLowerCase())
        issues.push({ path: ["members", i, "institution"], message: "Official delegations are from one institution." });
    });
  }
  // modules: ranking excludes compulsory modules; total = compulsory + ranked
  const ranked = d.module_ranking.filter((id) => !rules.compulsoryModuleIds.includes(id));
  const unique = new Set(ranked);
  if (unique.size !== ranked.length) issues.push({ path: ["module_ranking"], message: "Each module can be ranked once." });
  if (ranked.some((id) => !rules.activeModuleIds.includes(id)))
    issues.push({ path: ["module_ranking"], message: "One of the modules is no longer available." });
  const minPick = Math.max(0, rules.modules_min - rules.compulsoryModuleIds.length);
  const maxPick = Math.max(0, rules.modules_max - rules.compulsoryModuleIds.length);
  if (ranked.length < minPick || ranked.length > maxPick)
    issues.push({ path: ["module_ranking"], message: `Pick and rank ${minPick}–${maxPick} modules besides the compulsory one.` });
  if (d.heard_from === "Other" && !d.heard_from_other?.trim())
    issues.push({ path: ["heard_from_other"], message: "Tell us where you heard about us." });
  return issues;
}

export function moduleSlots(rules: Pick<Rules, "modules_min" | "modules_max" | "compulsoryModuleIds">) {
  return {
    min: Math.max(0, rules.modules_min - rules.compulsoryModuleIds.length),
    max: Math.max(0, rules.modules_max - rules.compulsoryModuleIds.length),
  };
}
