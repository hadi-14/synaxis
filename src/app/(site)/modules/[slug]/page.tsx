import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModule, getModules } from "@/lib/content";
import { CardFlip } from "@/components/effects/CardFlip";

export async function generateStaticParams() {
  const modules = await getModules();
  return modules.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata(props: PageProps<"/modules/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const m = await getModule(slug);
  if (!m) return { title: "Module not found" };
  return { title: `${m.name} · ${m.subject}`, description: `${m.tagline} ${m.description}`.slice(0, 160), alternates: { canonical: `/modules/${m.slug}` } };
}

export default async function ModulePage(props: PageProps<"/modules/[slug]">) {
  const { slug } = await props.params;
  const [m, all] = await Promise.all([getModule(slug), getModules()]);
  if (!m) notFound();
  const i = all.findIndex((x) => x.id === m.id);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16" style={{ "--accent-c": m.accent } as React.CSSProperties}>
      <Link href="/portal#modules" className="plasma-link text-sm font-semibold">← All modules</Link>
      <div className="mt-6 grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "color-mix(in srgb, var(--accent-c) 65%, var(--ink))" }}>
            {m.subject} · {m.character}
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight sm:text-5xl">{m.name}</h1>
          {m.is_compulsory && <span className="mt-3 inline-block rounded-full bg-[var(--primary)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary-ink)]">Compulsory for every team</span>}
          <p className="mt-4 text-lg font-semibold">{m.tagline}</p>
          <p className="mt-3 text-[var(--ink-muted)]">{m.description}</p>
        </div>
        <CardFlip motif={m.motif} accent={m.accent} name={m.name} character={m.character} />
      </div>
      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Format", m.format],
          ["Team size", m.team_size_note],
          ["Schedule", m.schedule_slot],
          ["Module Head", [m.head_name, m.cohead_name && `Co-Head: ${m.cohead_name}`].filter(Boolean).join(" · ") || "To be announced"],
        ].map(([k, v]) => (
          <div key={k} className="card p-4" style={{ borderTop: `4px solid ${m.accent}` }}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">{k}</dt>
            <dd className="mt-1 font-semibold">{v || "To be announced"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/modules/${prev.slug}`} className="btn btn-secondary">← {prev.name}</Link>
        <Link href="/register" className="btn btn-primary">Register your team</Link>
        <Link href={`/modules/${next.slug}`} className="btn btn-secondary">{next.name} →</Link>
      </div>
    </article>
  );
}
