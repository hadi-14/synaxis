import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCouncil, getModule, getModules } from "@/lib/content";
import { JsonLd, moduleBreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { TrackView } from "@/components/analytics/TrackView";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { BH6Image } from "@/components/brand/BH6Image";
import { Motif } from "@/components/brand/Motif";
import { CODE_PROPS, CodeProp } from "@/components/decor/CodeProps";
import { HeroCharacter } from "@/components/module/HeroCharacter";
import { SkillIcon } from "@/components/module/SkillIcon";
import { MODULE_ART } from "@/lib/bh6-assets";
import { GADGET_NAME, JUDGES_NOTE } from "@/lib/brochure";
import { mix, readableOnWhite } from "@/lib/color";
import type { CouncilMember, Module } from "@/lib/types";

export async function generateStaticParams() {
  const modules = await getModules();
  return modules.map((m) => ({ slug: m.slug }));
}

/**
 * Meta description from the tagline + overview: whole sentences only (never cut mid-sentence), as many as fit
 * in 160 characters; a sentence that doesn't fit is skipped. A short result gets a line of context.
 */
function metaDescription(m: Module) {
  const context = `${m.name} is the ${m.subject} module of Synaxis 2027${m.is_compulsory ? ", compulsory for every team" : `, themed on ${m.character}`}.`;
  const sentences = [m.tagline, ...(m.overview.match(/[^.!?]+[.!?]+/g) ?? [m.overview])].map((x) => x.trim()).filter(Boolean);
  let out = "";
  for (const x of sentences) {
    const next = out ? `${out} ${x}` : x;
    if (next.length <= 160) out = next;
  }
  if (out.length < 110 && `${out} ${context}`.length <= 160) out = out ? `${out} ${context}` : context;
  return out || context.slice(0, 160);
}

export async function generateMetadata(props: PageProps<"/modules/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const m = await getModule(slug);
  if (!m) return { title: "Module not found", robots: { index: false } };
  return pageMeta(`/modules/${m.slug}`, `${m.name} · ${m.subject}`, metaDescription(m));
}

/** All 9 module pages are prerendered (generateStaticParams), so no Suspense boundary: the content is in the
 *  initial HTML (a streamed skeleton swap caused a large layout shift). Navigation may block briefly. */
export const instant = false;

const pad = (n: number) => String(n).padStart(2, "0");

/** "Announced soon": the one empty state for anything the organisers haven't published yet. */
function Soon() {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink-muted)]">
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="8" r="6" /><path d="M8 4.8V8l2.2 1.4" /></svg>
      Announced soon
    </span>
  );
}

function Person({ member, legacyName, label }: { member?: CouncilMember; legacyName: string; label: string }) {
  const name = member?.name ?? legacyName;
  if (!name) return null;
  return (
    <span className="flex items-center gap-3">
      {member?.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- council photos are uploaded to Supabase storage (any host)
        <img src={member.photo_url} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] font-display text-sm font-bold">
          {name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}
        </span>
      )}
      <span>
        <span className="block font-semibold">{name}</span>
        <span className="block text-xs text-[var(--ink-muted)]">{label}</span>
      </span>
    </span>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold">
      <span aria-hidden className="h-6 w-1.5 rounded-full" style={{ background: accent }} />
      {children}
    </h2>
  );
}

export default async function ModulePage(props: PageProps<"/modules/[slug]">) {
  const { slug } = await props.params;
  const [m, all, council] = await Promise.all([getModule(slug), getModules(), getCouncil()]);
  if (!m) notFound();
  const i = all.findIndex((x) => x.id === m.id);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const art = MODULE_ART[m.motif] ?? MODULE_ART.microbots;
  const banner = readableOnWhite(m.accent);
  const deep = mix(banner, "#05060f", 0.45);
  const accentText = `color-mix(in srgb, ${m.accent} 70%, var(--ink))`;
  const head = council.find((c) => c.id === m.head_member_id);
  const cohead = council.find((c) => c.id === m.cohead_member_id);
  const hasHeads = Boolean(head || cohead || m.head_name || m.cohead_name);
  const gadget = GADGET_NAME[art.prop];

  return (
    <article style={{ "--accent-c": m.accent } as React.CSSProperties}>
      <JsonLd data={moduleBreadcrumbJsonLd(m.name, m.slug)} />
      <TrackView event="module_viewed" props={{ slug: m.slug }} />

      {/* ------------------------------------------------------------ HERO: the module's colour, its prop as a pattern */}
      <header className="relative isolate text-white" style={{ background: `linear-gradient(135deg, ${banner} 0%, ${deep} 100%)` }}>
        {/* only the pattern is clipped: the character is free to break out of the banner */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid grid-cols-6 gap-10 overflow-hidden p-6 opacity-[0.13] sm:grid-cols-10 sm:gap-14">
          {Array.from({ length: 40 }, (_, k) => (
            <Motif key={k} motif={m.motif} accent="#ffffff" className={`h-12 w-12 text-white ${k % 2 ? "rotate-12" : "-rotate-12"} ${k >= 24 ? "hidden sm:block" : ""}`} />
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_80%_60%,rgba(255,255,255,.18),transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl gap-2 px-4 pt-6 sm:px-6 md:grid-cols-[1.15fr_1fr] md:items-end md:gap-8 md:pt-10">
          <div className="order-2 pb-10 md:order-1 md:pb-16">
            <Link href="/#modules" className="text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline">← All modules</Link>
            <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/85 sm:text-xs">
              Case file {pad(i + 1)} / {pad(all.length)} · {m.subject}
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.02] sm:text-6xl">{m.name}</h1>
            {m.tagline && <p className="mt-4 max-w-xl text-lg font-semibold text-white/90 sm:text-xl">{m.tagline}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <TrackedLink location="module_hero" href="/register" className="btn bg-white text-[#0B1220] hover:bg-white/90">Register your team</TrackedLink>
              {m.is_compulsory && <span className="stamp" style={{ borderColor: "#fff", color: "#fff" }}>Compulsory</span>}
            </div>
          </div>
          {/* the character breaks out of the banner (above the title on phones) */}
          <div className="relative z-10 order-1 mx-auto h-64 w-full max-w-[300px] sm:h-80 md:order-2 md:-mb-10 md:h-[440px] md:max-w-[420px]">
            <HeroCharacter motif={m.motif} characterId={art.character} name={m.character} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-12">
            {/* ------------------------------------------------------------ OVERVIEW */}
            <section aria-labelledby="overview">
              <SectionTitle accent={m.accent}><span id="overview">Overview</span></SectionTitle>
              {m.tagline && (
                <blockquote className="mt-5 border-l-4 pl-5 font-display text-2xl font-bold leading-snug" style={{ borderColor: m.accent, color: accentText }}>
                  {m.tagline}
                </blockquote>
              )}
              {m.overview ? <p className="mt-5 max-w-[65ch] text-lg leading-8">{m.overview}</p> : <p className="mt-5"><Soon /></p>}
            </section>

            {/* ------------------------------------------------------------ FOR YOU IF */}
            {m.ideal_for.length > 0 && (
              <section aria-labelledby="for-you">
                <SectionTitle accent={m.accent}><span id="for-you">This module is for you if…</span></SectionTitle>
                <ul className="mt-5 flex flex-wrap gap-3">
                  {m.ideal_for.map((x) => (
                    <li key={x} className="flex max-w-full items-start gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 font-semibold">
                      <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white" style={{ background: banner }}>
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2.5 6.2 2.3 2.3 4.7-5" /></svg>
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ------------------------------------------------------------ SKILLS */}
            {m.skills_tested.length > 0 && (
              <section aria-labelledby="skills">
                <SectionTitle accent={m.accent}><span id="skills">Skills tested</span></SectionTitle>
                <ul className="mt-5 flex flex-wrap gap-2.5">
                  {m.skills_tested.map((s) => (
                    <li key={s} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold" style={{ background: `color-mix(in srgb, ${m.accent} 14%, var(--surface))`, color: accentText }}>
                      <SkillIcon skill={s} className="h-[18px] w-[18px]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ------------------------------------------------------------ RULES */}
            {m.rules_highlights.length > 0 && (
              <section aria-labelledby="rules">
                <SectionTitle accent={m.accent}><span id="rules">Rules highlights</span></SectionTitle>
                <div className="mt-5 divide-y divide-[var(--line)] overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]">
                  {m.rules_highlights.map((r) => (
                    <details key={r.title} className="group px-5 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                        {r.title}
                        <span aria-hidden className="text-xl leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
                      </summary>
                      {r.body && <p className="mt-3 text-[var(--ink-muted)]">{r.body}</p>}
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ------------------------------------------------------------ CHARACTER DOSSIER */}
          <aside aria-labelledby="dossier" className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_0_var(--line)]">
              <div className="flex items-center justify-between px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white" style={{ background: banner }}>
                <span id="dossier">Character dossier</span>
                <span>File {pad(i + 1)}</span>
              </div>
              <div className="flex gap-4 p-5">
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl" style={{ background: `color-mix(in srgb, ${m.accent} 18%, var(--surface-2))` }}>
                  <BH6Image id={art.character} decorative sizes="96px" className="h-full w-full object-cover object-top" fallback="icon" iconClassName="m-auto mt-6 h-14 w-14" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Subject</p>
                  <p className="font-display text-xl font-extrabold leading-tight">{m.character}</p>
                  {m.character_role && <p className="mt-1 text-sm text-[var(--ink-muted)]">{m.character_role}</p>}
                </div>
              </div>
              {m.character_tie_in && <p className="border-t border-dashed border-[var(--line)] px-5 py-4 leading-7">{m.character_tie_in}</p>}
              <div className="flex items-center gap-3 border-t border-dashed border-[var(--line)] px-5 py-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${m.accent} 16%, transparent)` }}>
                  {CODE_PROPS.has(art.prop) ? (
                    <CodeProp id={art.prop} color={m.accent} className="h-8 w-8" />
                  ) : (
                    <BH6Image id={art.prop} decorative sizes="32px" className="h-8 w-8 object-contain" fallback="icon" iconClassName="h-7 w-7" />
                  )}
                </span>
                <span>
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">Signature gadget</span>
                  <span className="block font-semibold">{gadget ?? m.subject}</span>
                </span>
              </div>
              <span aria-hidden className="stamp pointer-events-none absolute bottom-5 right-4 opacity-80" style={{ borderColor: "#1FA463", color: "#1A8F56" }}>Cleared</span>
            </div>
          </aside>
        </div>

        {/* ------------------------------------------------------------ DETAILS */}
        <dl className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Format", m.format ? <span className="font-semibold">{m.format}</span> : <Soon />],
              ["Team size", m.team_size_note ? <span className="font-semibold">{m.team_size_note}</span> : <Soon />],
              ["Schedule", m.schedule_slot ? <span className="font-semibold">{m.schedule_slot}</span> : <Soon />],
              [
                "Module Head & Co-Head",
                hasHeads ? (
                  <span className="flex flex-col gap-3">
                    <Person member={head} legacyName={m.head_name} label="Module Head" />
                    <Person member={cohead} legacyName={m.cohead_name} label="Co-Head" />
                  </span>
                ) : (
                  <Soon />
                ),
              ],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="bg-[var(--surface)] p-5">
              <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">{k}</dt>
              <dd className="mt-2">{v}</dd>
            </div>
          ))}
        </dl>

        {/* ------------------------------------------------------------ JUDGES */}
        <section aria-label="Judging" className="mt-8 flex items-start gap-4 rounded-[var(--radius)] p-5 sm:p-6" style={{ background: `color-mix(in srgb, ${m.accent} 10%, var(--surface))` }}>
          <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{ background: banner }}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="12" r="5" /><path d="M7 3h6l-1.5 4.2M8.5 7.2 7 3M10 9.5v5M8.3 12.2 10 14.5l1.7-2.3" /></svg>
          </span>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentText }}>Judged and awarded</p>
            <p className="mt-1 leading-7">{JUDGES_NOTE}</p>
          </div>
        </section>

        {/* ------------------------------------------------------------ CTA + PREV / NEXT */}
        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <p className="font-display text-2xl font-extrabold">Ready to open this case?</p>
          <TrackedLink location="module_page" href="/register" className="btn btn-primary">Register your team</TrackedLink>
        </div>
        <nav aria-label="More modules" className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            { m: prev, dir: "Previous" },
            { m: next, dir: "Next" },
          ].map(({ m: x, dir }) => {
            const xa = MODULE_ART[x.motif] ?? MODULE_ART.microbots;
            return (
              <Link
                key={dir}
                href={`/modules/${x.slug}`}
                className={`group flex items-center gap-4 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-3 pr-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] motion-reduce:transition-none ${dir === "Next" ? "sm:flex-row-reverse sm:text-right" : ""}`}
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: readableOnWhite(x.accent) }}>
                  <BH6Image id={xa.character} decorative sizes="64px" className="h-full w-full object-cover object-top" fallback="icon" iconClassName="m-auto mt-3 h-10 w-10 text-white" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">{dir} · {x.subject}</span>
                  <span className="block truncate font-display text-lg font-extrabold">{x.name}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </article>
  );
}
