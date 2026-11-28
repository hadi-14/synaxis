import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getModules, getSettings, registrationState, rulesFrom } from "@/lib/content";
import { formatDate } from "@/lib/dates";
import { ChargingLoader } from "@/components/ui/Battery";
import { BH6Image } from "@/components/brand/BH6Image";
import { RegisterWizard, type WizardValues } from "./RegisterWizard";
import { RegisterLanding } from "./RegisterLanding";

export const metadata: Metadata = pageMeta("/register", "Register your team", "Register your school team for Synaxis 2027 in Karachi, 15–17 January. Teams of 4–6, instant fee calculation, receipt upload and a live dashboard. Takes 10 minutes.");

export default function RegisterPage(props: PageProps<"/register">) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <Suspense fallback={<ChargingLoader label="Loading your registration" />}>
        <RegisterGate searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function RegisterGate({ searchParams }: { searchParams: PageProps<"/register">["searchParams"] }) {
  await connection(); // per-request: reads the clock and the session
  const sp = await searchParams;
  const editing = sp.edit === "1";
  const user = await getUser();
  if (!user) {
    if (editing) redirect(`/login?next=${encodeURIComponent("/register?edit=1")}`);
    // Public, indexable landing for signed-out visitors (and search engines).
    return <RegisterLanding settings={await getSettings()} />;
  }

  const [settings, modules] = await Promise.all([getSettings(), getModules()]);
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("*, team_members(*), module_preferences(module_id, rank)")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (team && !editing) redirect("/dashboard");
  const state = registrationState(settings, new Date());
  if (state !== "open") {
    return (
      <div className="card mt-6 flex flex-col items-center p-8 text-center">
        <BH6Image id="baymax-healthcare" decorative sizes="112px" className="h-auto w-28 rotate-[8deg] saturate-50" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          {state === "not_yet" ? "Registration opens soon" : "Registration is closed"}
        </h1>
        <p className="mt-2 max-w-md text-[var(--ink-muted)]">
          {state === "not_yet"
            ? `Registration opens on ${formatDate(settings.registration_opens_at, true)}. Follow @heusersynaxis for the announcement.`
            : team
              ? "Online editing has closed. Contact the organisers if something on your team needs to change."
              : "Registration for Synaxis Season 1 has closed. Follow @heusersynaxis for updates."}
        </p>
        <Link href={team ? "/dashboard" : "/"} className="btn btn-primary mt-6">
          {team ? "Back to dashboard" : "Back to home"}
        </Link>
      </div>
    );
  }

  let initial: Partial<WizardValues> | null = null;
  let initialStep = 1;
  let draftSavedAt: string | null = null;
  if (team && editing) {
    const members = [...team.team_members].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    initial = {
      delegation_type: team.delegation_type,
      elig_enrolled: true,
      elig_read_rules: true,
      head_name: team.head_name,
      head_email: team.head_email,
      head_whatsapp: team.head_whatsapp,
      head_alt_phone: team.head_alt_phone ?? "",
      head_grade: legacyGrade(team.head_grade),
      institution: team.institution,
      city: team.city,
      team_name: team.team_name,
      guardian_name: team.guardian_name,
      guardian_phone: team.guardian_phone,
      members: members
        .filter((m: { is_head: boolean }) => !m.is_head)
        .map((m: { full_name: string; email: string; phone: string; grade: string; institution: string }) => ({
          full_name: m.full_name,
          email: m.email,
          phone: m.phone,
          grade: legacyGrade(m.grade),
          institution: m.institution,
        })),
      module_ranking: [...team.module_preferences]
        .filter((p: { rank: number }) => p.rank > 0)
        .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
        .map((p: { module_id: number }) => p.module_id),
      heard_from: team.heard_from,
      heard_from_other: team.heard_from_other ?? "",
      needs: team.needs ?? "",
      agree_rules: true,
      agree_conduct: true,
      agree_media: true,
    } as Partial<WizardValues>;
  } else {
    const { data: draft } = await supabase.from("registration_drafts").select("data, step, updated_at").eq("owner_id", user.id).maybeSingle();
    if (draft) {
      initial = draft.data as Partial<WizardValues>;
      initialStep = draft.step;
      draftSavedAt = draft.updated_at;
    }
  }

  return (
    <RegisterWizard
      user={{ id: user.id, email: user.email, name: user.name }}
      settings={settings}
      modules={modules}
      rules={rulesFrom(settings, modules)}
      initial={initial}
      initialStep={initialStep}
      draftSavedAt={draftSavedAt}
      teamId={team && editing ? team.id : null}
      submittedAt={team && editing ? team.submitted_at : null}
    />
  );
}

/** The "HSSC completed (MDCAT prep)" option was renamed; keep teams saved with it editable. */
function legacyGrade(g: string) {
  return g === "HSSC completed (MDCAT prep)" ? "Recent graduate (gap year)" : g;
}
