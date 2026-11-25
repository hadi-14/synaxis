import type { Metadata } from "next";
import { getSettings, getSponsors } from "@/lib/content";
import { SectionHeading } from "@/components/site/SectionHeading";
import { InquiryForm } from "./InquiryForm";
import type { Sponsor } from "@/lib/types";
import { BH6Image } from "@/components/brand/BH6Image";

export const metadata: Metadata = { title: "Sponsors", description: "Partner with Synaxis Season 1, a science olympiad for Pakistan's brightest school students.", alternates: { canonical: "/sponsors" } };

const TIERS: { key: Sponsor["tier"]; label: string; size: string }[] = [
  { key: "title", label: "Title sponsor", size: "h-28" },
  { key: "platinum", label: "Platinum", size: "h-20" },
  { key: "gold", label: "Gold", size: "h-16" },
  { key: "community", label: "Community", size: "h-12" },
  { key: "partner", label: "Partners", size: "h-12" },
];

export default async function SponsorsPage() {
  const [sponsors, settings] = await Promise.all([getSponsors(), getSettings()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="Sponsors" title="Fuel the next generation of Hiros" intro={<p>Synaxis brings school teams from across Pakistan together for three days of science, logic and teamwork. Put your brand in front of them.</p>} />
      <div className="mb-6 overflow-hidden rounded-[var(--radius)]">
        <BH6Image id="team" sizes="(max-width: 1024px) 100vw, 1100px" className="h-auto max-h-80 w-full object-contain" fallbackClassName="w-full !aspect-[16/5] !rounded-[var(--radius)]" />
      </div>
      {TIERS.map((t) => {
        const list = sponsors.filter((s) => s.tier === t.key);
        if (!list.length) return null;
        return (
          <section key={t.key} className="mt-10">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">{t.label}</h2>
            <ul className={`mt-4 grid gap-4 ${t.key === "title" ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {list.map((s) => (
                <li key={s.id} className="card panel-lines flex flex-col items-center justify-center gap-3 p-6 text-center">
                  {s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo_url} alt={s.name} className={`${t.size} w-auto object-contain`} loading="lazy" />
                  ) : (
                    <span className={`${t.size} grid w-full max-w-xs place-items-center rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--line)] font-display text-lg font-bold text-[var(--ink-muted)]`}>{s.name}</span>
                  )}
                  {s.blurb && <p className="text-sm text-[var(--ink-muted)]">{s.blurb}</p>}
                  {s.url && <a className="plasma-link text-sm font-semibold" href={s.url} target="_blank" rel="noopener">Visit {s.name}</a>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.2fr]" id="become-a-sponsor">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Become a sponsor</h2>
          <ul className="mt-4 space-y-3 text-[var(--ink-muted)]">
            <li>• Logo on the site, social posts and event-day stage</li>
            <li>• Stall or demo space on campus (all three days)</li>
            <li>• Named awards for a module of your choice</li>
            <li>• Reach students from schools across Pakistan</li>
          </ul>
          <p className="mt-6 text-sm">Prefer email? <a className="plasma-link font-semibold" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>
        </div>
        <InquiryForm />
      </section>
    </div>
  );
}
