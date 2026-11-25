"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type FieldPath, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Battery } from "@/components/ui/Battery";
import { toast } from "@/components/ui/toast-store";
import { BaymaxGuide } from "@/components/guide/BaymaxGuide";
import { say } from "@/components/guide/guide-store";
import { foundSecret } from "@/components/eggs/secrets";
import { FistBump } from "@/components/effects/FistBump";
import { computeFee, formatRs } from "@/lib/fees";
import { formatDate } from "@/lib/dates";
import type { Module, Settings } from "@/lib/types";
import {
  DELEGATION_TYPES,
  GRADES,
  HEARD_FROM,
  moduleSlots,
  registrationBase,
  ruleIssues,
  type RegistrationData,
  type Rules,
} from "@/lib/validation/registration";
import { checkTeamName, saveDraft, submitRegistration } from "./actions";
import { ModuleRanker } from "./ModuleRanker";
import { Field, Check } from "./fields";

export type WizardValues = RegistrationData;

const STEPS = [
  { n: 1, title: "Eligibility", short: "Eligibility" },
  { n: 2, title: "You & your institution", short: "Head Delegate" },
  { n: 3, title: "Team members", short: "Members" },
  { n: 4, title: "Module preferences", short: "Modules" },
  { n: 5, title: "Extras & consent", short: "Consent" },
  { n: 6, title: "Review & fee", short: "Review" },
] as const;

const STEP_FIELDS: Record<number, FieldPath<WizardValues>[]> = {
  1: ["delegation_type", "elig_enrolled", "elig_not_university", "elig_read_rules"],
  2: ["head_name", "head_email", "head_whatsapp", "head_alt_phone", "head_grade", "institution", "city", "team_name", "guardian_name", "guardian_phone"],
  3: ["members"],
  4: ["module_ranking"],
  5: ["heard_from", "heard_from_other", "needs", "agree_rules", "agree_conduct", "agree_dress", "agree_media"],
  6: [],
};

const GUIDE_LINES: Record<number, string> = {
  1: "Hello. I am Baymax, your personal registration companion. First, let us check eligibility.",
  2: "Tell me about you, the Head Delegate. I will send updates to this email and WhatsApp.",
  3: "Add your teammates. I will count them for you.",
  4: "Kabuki Caper is compulsory. Drag the others into the order you prefer.",
  5: "Almost done. A few consents, and you are ready.",
  6: "Scan complete. Check everything, then submit. Your fee is shown below.",
};

const LS_KEY = (uid: string) => `synaxis-reg-draft:${uid}`;
const emptyMember = (institution = "") => ({ full_name: "", email: "", phone: "", grade: "" as WizardValues["head_grade"], institution });

export function RegisterWizard(props: {
  user: { id: string; email: string; name: string | null };
  settings: Settings;
  modules: Module[];
  rules: Rules;
  initial: Partial<WizardValues> | null;
  initialStep: number;
  draftSavedAt: string | null;
  teamId: string | null;
  submittedAt: string | null;
}) {
  const { settings, modules, rules, user, teamId } = props;
  const router = useRouter();
  const [step, setStep] = useState(props.initialStep);
  const [maxReached, setMaxReached] = useState(props.teamId ? 6 : props.initialStep);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "offline">("idle");
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [nameState, setNameState] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const failCount = useRef<Record<string, number>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Resolver = base schema + settings-dependent rules, so errors appear on the right fields.
  const schema = useMemo(
    () =>
      registrationBase.superRefine((d, ctx) => {
        for (const i of ruleIssues(d as RegistrationData, rules)) ctx.addIssue({ code: "custom", path: i.path, message: i.message });
      }),
    [rules],
  );

  const defaults: WizardValues = {
    delegation_type: undefined as unknown as WizardValues["delegation_type"],
    elig_enrolled: false as true,
    elig_not_university: false as true,
    elig_read_rules: false as true,
    head_name: user.name ?? "",
    head_email: user.email,
    head_whatsapp: "",
    head_alt_phone: "",
    head_grade: "" as WizardValues["head_grade"],
    institution: "",
    city: "Karachi",
    team_name: "",
    guardian_name: "",
    guardian_phone: "",
    members: Array.from({ length: Math.max(0, rules.team_min - 1) }, () => emptyMember()),
    module_ranking: [],
    heard_from: "" as WizardValues["heard_from"],
    heard_from_other: "",
    needs: "",
    agree_rules: false as true,
    agree_conduct: false as true,
    agree_dress: false as true,
    agree_media: false as true,
  };

  const form = useForm<WizardValues>({
    resolver: zodResolver(schema as unknown as z.ZodType<WizardValues, WizardValues>),
    defaultValues: { ...defaults, ...(props.initial ?? {}) },
    mode: "onTouched",
  });
  const { register, control, handleSubmit, trigger, setValue, getValues, formState, reset, setError } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "members" });
  const values = useWatch({ control }) as WizardValues;

  // ---------- restore newer localStorage draft (offline edits) ----------
  useEffect(() => {
    if (teamId) return;
    try {
      const raw = localStorage.getItem(LS_KEY(user.id));
      if (!raw) return;
      const local = JSON.parse(raw) as { data: WizardValues; step: number; savedAt: string };
      if (!props.draftSavedAt || new Date(local.savedAt) > new Date(props.draftSavedAt)) {
        reset({ ...defaults, ...local.data });
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage after hydration
        setStep(local.step);
        setMaxReached(local.step);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- autosave: local immediately (debounced), server every ~2s ----------
  const serverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (teamId || success) return;
    const t = setTimeout(() => {
      const data = getValues();
      try {
        localStorage.setItem(LS_KEY(user.id), JSON.stringify({ data, step, savedAt: new Date().toISOString() }));
      } catch {}
      clearTimeout(serverTimer.current);
      serverTimer.current = setTimeout(async () => {
        setSaving("saving");
        const r = await saveDraft(getValues(), step).catch(() => ({ ok: false as const, error: "offline" }));
        setSaving(r.ok ? "saved" : "offline");
      }, 1600);
    }, 400);
    return () => clearTimeout(t);
  }, [values, step, teamId, success, getValues, user.id]);

  // ---------- guide lines per step ----------
  const firstStep = useRef(true);
  useEffect(() => {
    say(GUIDE_LINES[step], step === 1 ? "wave" : "point");
    // Move focus to the new step's heading for screen readers, but not on first load.
    if (firstStep.current) firstStep.current = false;
    else headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  // ---------- live team-name availability ----------
  useEffect(() => {
    const name = values.team_name?.trim() ?? "";
    if (name.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the name is cleared
      setNameState("idle");
      return;
    }
    setNameState("checking");
    const t = setTimeout(async () => {
      const r = await checkTeamName(name, teamId ?? undefined).catch(() => ({ available: true }));
      setNameState(r.available ? "ok" : "taken");
    }, 450);
    return () => clearTimeout(t);
  }, [values.team_name, teamId]);

  // ---------- official delegations: members share the head's institution ----------
  const official = values.delegation_type === "external_official";
  useEffect(() => {
    if (!official) return;
    (getValues("members") ?? []).forEach((_, i) => setValue(`members.${i}.institution`, values.institution ?? "", { shouldValidate: false }));
  }, [official, values.institution, getValues, setValue]);

  // Members default to the Head Delegate's institution (filled in on step 2).
  useEffect(() => {
    if (step !== 3) return;
    const inst = getValues("institution");
    (getValues("members") ?? []).forEach((m, i) => {
      if (!m.institution?.trim() && inst) setValue(`members.${i}.institution`, inst);
    });
  }, [step, getValues, setValue]);

  const teamSize = (values.members?.length ?? 0) + 1;
  useEffect(() => {
    if (step !== 3) return;
    if (teamSize < rules.team_min) say(`You have ${teamSize}. Teams need at least ${rules.team_min}, including you.`, "point", "warn");
    else if (teamSize === rules.team_max) say(`That is a full team of ${rules.team_max}. Excellent.`, "fist", "success");
  }, [teamSize, step, rules.team_min, rules.team_max]);

  const fee = useMemo(
    () => computeFee(settings, teamSize, props.submittedAt ? new Date(props.submittedAt) : new Date()),
    [settings, teamSize, props.submittedAt],
  );

  const onInvalidStep = useCallback((errors: FieldErrors<WizardValues>) => {
    const first = Object.keys(errors)[0];
    failCount.current[first] = (failCount.current[first] ?? 0) + 1;
    if (failCount.current[first] >= 3) {
      say("Look for another angle. Read the hint under the highlighted field.", "point", "warn");
      foundSecret("another-angle");
    } else say("Scan complete. A few fields need attention. They are highlighted.", "point", "warn");
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  }, []);

  const goNext = async () => {
    const ok = await trigger(STEP_FIELDS[step], { shouldFocus: false });
    if (step === 2 && nameState === "taken") {
      setError("team_name", { message: "That team name is taken." });
      onInvalidStep({ team_name: { type: "taken" } } as FieldErrors<WizardValues>);
      return;
    }
    if (!ok) {
      onInvalidStep(form.formState.errors);
      return;
    }
    // Settings-dependent rules (team size, module count, email domain…) for THIS step.
    // The resolver's superRefine only runs once every step is valid, so check them here too.
    const stepIssues = ruleIssues(getValues(), rules).filter((i) => STEP_FIELDS[step].includes(String(i.path[0]) as FieldPath<WizardValues>));
    if (stepIssues.length) {
      stepIssues.forEach((i) =>
        setError((i.path.length === 1 && i.path[0] === "members" ? "members.root" : i.path.join(".")) as FieldPath<WizardValues>, { message: i.message }),
      );
      onInvalidStep(Object.fromEntries(stepIssues.map((i) => [String(i.path[0]), { type: "rule" }])) as FieldErrors<WizardValues>);
      return;
    }
    const n = Math.min(6, step + 1);
    setStep(n);
    setMaxReached((m) => Math.max(m, n));
    scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    setStep((s) => Math.max(1, s - 1));
    scrollTo({ top: 0 });
  };
  const goTo = (n: number) => {
    if (n <= maxReached) {
      setStep(n);
      scrollTo({ top: 0 });
    }
  };

  const onSubmit = () =>
    handleSubmit(
    (data) =>
      startTransition(async () => {
        const res = await submitRegistration(data, teamId ?? undefined);
        if (!res.ok) {
          res.fieldErrors?.forEach((fe) => setError(fe.path.join(".") as FieldPath<WizardValues>, { message: fe.message }));
          const firstPath = res.fieldErrors?.[0]?.path?.[0];
          const target = firstPath ? Number(Object.entries(STEP_FIELDS).find(([, f]) => f.includes(firstPath as never))?.[0] ?? 6) : 6;
          if (target !== 6) setStep(target);
          toast.error(res.error);
          say(res.error, "point", "warn");
          return;
        }
        try {
          localStorage.removeItem(LS_KEY(user.id));
        } catch {}
        setSuccess(res.data!.regCode);
        say(teamId ? "Changes saved. I am satisfied with my care." : "Ba-la-la-la-la! Your team is registered.", "fist", "success");
        setTimeout(() => router.push(teamId ? "/dashboard?updated=1" : "/dashboard?welcome=1"), 2200);
      }),
    (errors) => {
      const firstKey = Object.keys(errors)[0];
      const target = Number(Object.entries(STEP_FIELDS).find(([, f]) => f.includes(firstKey as never))?.[0] ?? 6);
      setStep(target);
      onInvalidStep(errors);
    },
  )();

  if (success) {
    return (
      <div className="card mt-6 flex flex-col items-center p-8 text-center" role="status">
        <FistBump />
        <h1 className="mt-4 font-display text-2xl font-extrabold">{teamId ? "Changes saved" : "You're registered!"}</h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Registration ID <span className="font-mono font-bold text-[var(--primary-text)]">{success}</span>. Taking you to your dashboard…
        </p>
      </div>
    );
  }

  const errors = formState.errors;
  const slots = moduleSlots(rules);

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 bg-[var(--bg)]/95 px-4 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            {teamId ? "Editing team" : "Registration"} · Step {step} of 6
          </p>
          <p className="font-mono text-[11px] text-[var(--ink-muted)]" aria-live="polite">
            {teamId ? "" : saving === "saving" ? "Saving…" : saving === "saved" ? "Saved ✓" : saving === "offline" ? "Saved on this device" : ""}
          </p>
        </div>
        <Battery value={step - 1} max={6} charging className="mt-2" label={`${Math.round(((step - 1) / 6) * 100)}%`} />
        <nav aria-label="Registration steps" className="no-scrollbar mt-2 flex gap-1 overflow-x-auto">
          {STEPS.map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => goTo(s.n)}
              disabled={s.n > maxReached}
              aria-current={s.n === step ? "step" : undefined}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                s.n === step ? "bg-[var(--ink)] text-[var(--bg)]" : s.n <= maxReached ? "bg-[var(--surface-2)]" : "text-[var(--ink-muted)] opacity-60"
              }`}
            >
              {s.n}. {s.short}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={(e) => e.preventDefault()} noValidate className="mt-4">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-extrabold outline-none sm:text-3xl">
          {STEPS[step - 1].title}
        </h1>

        {/* ----------------------------------------------------- STEP 1 */}
        {step === 1 && (
          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Delegation type</legend>
              <div className="grid gap-3">
                {Object.entries(DELEGATION_TYPES).map(([v, label]) => (
                  <label
                    key={v}
                    className={`card flex cursor-pointer items-start gap-3 p-4 transition-colors ${values.delegation_type === v ? "!border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : ""}`}
                  >
                    <input type="radio" value={v} {...register("delegation_type")} className="mt-1 h-5 w-5 accent-[var(--primary)]" />
                    <span>
                      <span className="block font-semibold">{label}</span>
                      <span className="block text-sm text-[var(--ink-muted)]">
                        {v === "internal"
                          ? `Every member needs a @${rules.internal_email_domain} email.`
                          : v === "external_official"
                            ? "Sent by your school. All members are from one institution and wear school uniform."
                            : "Students who enter on their own. Members may come from different schools. Semi-formal dress."}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.delegation_type && <p role="alert" className="hud-error mt-2 text-sm font-semibold text-[var(--danger)]">{errors.delegation_type.message}</p>}
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold">Eligibility (all required)</legend>
              <Check reg={register("elig_enrolled")} error={errors.elig_enrolled?.message}>
                Every member is currently enrolled in high or secondary school (Grade 9, O-Level/Matric, AS, A-Level/Inter or equivalent; HSSC
                completers preparing for MDCAT are allowed).
              </Check>
              <Check reg={register("elig_not_university")} error={errors.elig_not_university?.message}>
                No member is a university student.
              </Check>
              <Check reg={register("elig_read_rules")} error={errors.elig_read_rules?.message}>
                I have read the competition rules.
              </Check>
            </fieldset>
          </div>
        )}

        {/* ----------------------------------------------------- STEP 2 */}
        {step === 2 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.head_name?.message}>
              <input className="field" autoComplete="name" {...register("head_name")} />
            </Field>
            <Field label="Email" hint="Updates and receipts go here." error={errors.head_email?.message}>
              <input className="field" type="email" inputMode="email" autoComplete="email" {...register("head_email")} />
            </Field>
            <Field label="WhatsApp number" hint="Pakistani mobile, e.g. 0300 1234567" error={errors.head_whatsapp?.message}>
              <input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" {...register("head_whatsapp")} />
            </Field>
            <Field label="Alternate phone (optional)" error={errors.head_alt_phone?.message}>
              <input className="field" type="tel" inputMode="tel" {...register("head_alt_phone")} />
            </Field>
            <Field label="Grade / level" error={errors.head_grade?.message}>
              <select className="field" {...register("head_grade")}>
                <option value="">Select…</option>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Institution" hint="School or college name" error={errors.institution?.message}>
              <input className="field" list="institutions" autoComplete="organization" {...register("institution")} />
              <datalist id="institutions">
                {["Heuser College", "Karachi Grammar School", "The Lyceum", "Nixor College", "Bayview Academy", "Beaconhouse", "The City School", "Habib Public School", "Aga Khan Higher Secondary School", "Generation's School", "Foundation Public School", "St. Patrick's High School"].map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </Field>
            <Field label="City" error={errors.city?.message}>
              <input className="field" autoComplete="address-level2" {...register("city")} />
            </Field>
            <Field
              label="Team name"
              hint={nameState === "checking" ? "Checking availability…" : nameState === "ok" ? "✓ Available" : nameState === "taken" ? "" : "Unique, 2–40 characters"}
              error={errors.team_name?.message ?? (nameState === "taken" ? "That team name is taken. Try another." : undefined)}
            >
              <input className="field" autoComplete="off" {...register("team_name")} />
            </Field>
            <div className="sm:col-span-2 mt-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4">
              <p className="text-sm font-semibold">Guardian / emergency contact</p>
              <p className="text-sm text-[var(--ink-muted)]">Most delegates are under 18. We only call this number in an emergency.</p>
              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                <Field label="Guardian name" error={errors.guardian_name?.message}>
                  <input className="field" {...register("guardian_name")} />
                </Field>
                <Field label="Guardian phone" error={errors.guardian_phone?.message}>
                  <input className="field" type="tel" inputMode="tel" {...register("guardian_phone")} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- STEP 3 */}
        {step === 3 && (
          <div className="mt-6">
            <div className="card flex items-center justify-between gap-4 p-4" aria-live="polite">
              <div>
                <p className="font-display text-lg font-bold">
                  {teamSize} of {rules.team_min}–{rules.team_max} members
                </p>
                <p className="text-sm text-[var(--ink-muted)]">Including you ({values.head_name || "Head Delegate"}).</p>
              </div>
              <Battery value={teamSize} max={rules.team_max} className="w-32 flex-none" />
            </div>
            {errors.members?.root?.message || errors.members?.message ? (
              <p role="alert" className="hud-error mt-3 text-sm font-semibold text-[var(--danger)]">{errors.members?.root?.message ?? errors.members?.message}</p>
            ) : null}
            <ol className="mt-4 space-y-4">
              {fields.map((f, i) => {
                const e = errors.members?.[i];
                return (
                  <li key={f.id} className="card inflate-in p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-display font-bold">Member {i + 2}</p>
                      <button
                        type="button"
                        className="btn btn-ghost !min-h-9 !px-3 text-sm text-[var(--danger)]"
                        onClick={() => remove(i)}
                        aria-label={`Remove member ${i + 2}`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full name" error={e?.full_name?.message}>
                        <input className="field" {...register(`members.${i}.full_name`)} />
                      </Field>
                      <Field label="Email" error={e?.email?.message}>
                        <input className="field" type="email" inputMode="email" {...register(`members.${i}.email`)} />
                      </Field>
                      <Field label="WhatsApp / phone" error={e?.phone?.message}>
                        <input className="field" type="tel" inputMode="tel" {...register(`members.${i}.phone`)} />
                      </Field>
                      <Field label="Grade / level" error={e?.grade?.message}>
                        <select className="field" {...register(`members.${i}.grade`)}>
                          <option value="">Select…</option>
                          {GRADES.map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </Field>
                      <Field
                        label="Institution"
                        hint={official ? "Locked: official delegations are from one institution." : undefined}
                        error={e?.institution?.message}
                        className="sm:col-span-2"
                      >
                        <input className="field read-only:opacity-70" list="institutions" readOnly={official} {...register(`members.${i}.institution`)} />
                      </Field>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              className="btn btn-secondary mt-4 w-full"
              onClick={() => append(emptyMember(values.institution ?? ""))}
              disabled={teamSize >= rules.team_max}
            >
              {teamSize >= rules.team_max ? `Team is full (${rules.team_max})` : "+ Add a member"}
            </button>
          </div>
        )}

        {/* ----------------------------------------------------- STEP 4 */}
        {step === 4 && (
          <div className="mt-6">
            <p className="text-[var(--ink-muted)]">
              Your team competes in {rules.modules_min}–{rules.modules_max} modules. Pick and rank{" "}
              <strong className="text-[var(--ink)]">{slots.min === slots.max ? slots.min : `${slots.min}–${slots.max}`}</strong> besides the
              compulsory one. 1 = most wanted.
            </p>
            <ModuleRanker
              modules={modules}
              value={values.module_ranking ?? []}
              max={slots.max}
              onChange={(ids) => setValue("module_ranking", ids, { shouldValidate: formState.isSubmitted || !!errors.module_ranking, shouldDirty: true })}
            />
            {errors.module_ranking && (
              <p role="alert" className="hud-error mt-3 text-sm font-semibold text-[var(--danger)]">
                {errors.module_ranking.message ?? errors.module_ranking.root?.message}
              </p>
            )}
            <p className="mt-4 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink-muted)]">
              Modules are allocated by preference and availability; your preferences are not guaranteed.
            </p>
          </div>
        )}

        {/* ----------------------------------------------------- STEP 5 */}
        {step === 5 && (
          <div className="mt-6 space-y-6">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">How did you hear about Synaxis?</legend>
              <div className="flex flex-wrap gap-2">
                {HEARD_FROM.map((h) => (
                  <label key={h} className={`btn btn-secondary !min-h-10 cursor-pointer text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-[var(--accent)] ${values.heard_from === h ? "!border-[var(--primary)] bg-[var(--primary)]/10" : ""}`}>
                    <input type="radio" value={h} className="sr-only" {...register("heard_from")} />
                    {h}
                  </label>
                ))}
              </div>
              {errors.heard_from && <p role="alert" className="hud-error mt-2 text-sm font-semibold text-[var(--danger)]">{errors.heard_from.message}</p>}
              {values.heard_from === "Other" && (
                <Field label="Where?" error={errors.heard_from_other?.message} className="mt-3">
                  <input className="field" {...register("heard_from_other")} />
                </Field>
              )}
            </fieldset>
            <Field label="Dietary or accessibility needs (optional)" hint="Allergies, mobility, anything that helps us look after your team." error={errors.needs?.message}>
              <textarea className="field min-h-24" {...register("needs")} />
            </Field>
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold">Agreements</legend>
              <Check reg={register("agree_rules")} error={errors.agree_rules?.message}>I agree to the competition rules.</Check>
              <Check reg={register("agree_conduct")} error={errors.agree_conduct?.message}>My team agrees to the code of conduct.</Check>
              <Check reg={register("agree_dress")} error={errors.agree_dress?.message}>
                We&apos;ll follow the dress code ({official ? "school uniform" : values.delegation_type === "internal" ? "college uniform" : "semi-formal"}).
              </Check>
              <Check reg={register("agree_media")} error={errors.agree_media?.message}>
                We consent to photos and videos taken at Synaxis being used by the Heuser Science Society.
              </Check>
            </fieldset>
          </div>
        )}

        {/* ----------------------------------------------------- STEP 6 */}
        {step === 6 && (
          <div className="mt-6 space-y-4">
            <Summary title="Eligibility" onEdit={() => goTo(1)}>
              {values.delegation_type ? DELEGATION_TYPES[values.delegation_type] : "—"}
            </Summary>
            <Summary title="Head Delegate" onEdit={() => goTo(2)}>
              <p className="font-semibold">{values.head_name} · {values.head_grade}</p>
              <p>{values.head_email} · {values.head_whatsapp}</p>
              <p>{values.institution}, {values.city}</p>
              <p>Team: <strong>{values.team_name}</strong></p>
              <p>Guardian: {values.guardian_name} ({values.guardian_phone})</p>
            </Summary>
            <Summary title={`Members (${teamSize})`} onEdit={() => goTo(3)}>
              <ol className="list-decimal pl-5">
                <li>{values.head_name} (Head Delegate)</li>
                {(values.members ?? []).map((m, i) => (
                  <li key={i}>{m.full_name || "—"} · {m.grade || "—"}</li>
                ))}
              </ol>
            </Summary>
            <Summary title="Modules" onEdit={() => goTo(4)}>
              <ol className="list-decimal pl-5">
                {modules.filter((m) => m.is_compulsory).map((m) => <li key={m.id}>{m.name} <span className="text-xs font-bold uppercase text-[var(--primary-text)]">compulsory</span></li>)}
                {(values.module_ranking ?? []).map((id) => <li key={id}>{modules.find((m) => m.id === id)?.name}</li>)}
              </ol>
            </Summary>
            <Summary title="Extras" onEdit={() => goTo(5)}>
              <p>Heard via {values.heard_from}{values.heard_from === "Other" ? `: ${values.heard_from_other}` : ""}</p>
              {values.needs && <p>Needs: {values.needs}</p>}
            </Summary>

            <div className="card panel-lines overflow-hidden" aria-live="polite">
              <div className="border-b border-[var(--line)] px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">Fee breakdown · instant</p>
              </div>
              <dl className="divide-y divide-[var(--line)] text-sm">
                <div className="flex justify-between px-5 py-3"><dt>Delegation fee</dt><dd className="font-mono">{formatRs(fee.delegationFee)}</dd></div>
                <div className="flex justify-between gap-4 px-5 py-3">
                  <dt>{fee.members} delegates × {formatRs(fee.perDelegate)} <span className="text-[var(--ink-muted)]">({fee.tier === "early" ? `early bird until ${formatDate(settings.early_bird_deadline)}` : "regular"})</span></dt>
                  <dd className="whitespace-nowrap font-mono">{formatRs(fee.delegatesTotal)}</dd>
                </div>
                <div className="flex justify-between bg-[var(--surface-2)] px-5 py-4 text-base"><dt className="font-bold">Total</dt><dd className="font-mono text-xl font-extrabold text-[var(--primary-text)]">{formatRs(fee.total)}</dd></div>
              </dl>
              <p className="px-5 py-3 text-xs text-[var(--ink-muted)]">
                Pay by {formatDate(settings.payment_deadline, true)}. Bank details appear after you submit.
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- NAV */}
        <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center gap-3 border-t border-[var(--line)] bg-[var(--bg)]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-24 backdrop-blur sm:-mx-6 sm:px-6 sm:pr-28">
          {step > 1 && (
            <button type="button" className="btn btn-secondary" onClick={goBack}>
              Back
            </button>
          )}
          {step < 6 ? (
            <button type="button" className="btn btn-primary ml-auto" onClick={goNext}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn btn-primary ml-auto whitespace-nowrap" onClick={onSubmit} disabled={pending}>
              {pending ? "Submitting…" : teamId ? "Save changes" : `Submit · ${formatRs(fee.total)}`}
            </button>
          )}
        </div>
      </form>
      <BaymaxGuide />
    </>
  );
}

function Summary({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display font-bold">{title}</h2>
        <button type="button" onClick={onEdit} className="text-sm font-bold text-[var(--primary-text)] plasma-link">
          Edit
        </button>
      </div>
      <div className="space-y-0.5 text-sm text-[var(--ink-muted)]">{children}</div>
    </section>
  );
}
