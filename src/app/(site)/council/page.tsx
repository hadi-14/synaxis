import type { Metadata } from "next";
import { getCouncil, getModules } from "@/lib/content";
import { SectionHeading } from "@/components/site/SectionHeading";
import { CouncilCard } from "@/components/site/CouncilCard";
import { Empty } from "@/components/ui/Empty";
import { Reveal } from "@/components/effects/Reveal";
import { BH6Image } from "@/components/brand/BH6Image";
import { MODULE_ART } from "@/lib/bh6-assets";

export const metadata: Metadata = { title: "The Cubinet", description: "Meet the Heuser Science Society council running Synaxis Season 1.", alternates: { canonical: "/council" } };

export default async function CouncilPage() {
  const [council, modules] = await Promise.all([getCouncil(), getModules()]);
  const exec = council.filter((c) => c.tier === "executive");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <SectionHeading eyebrow="The Cubinet" title="The team behind the microbots" intro={<p>The President, Vice President and every Module Head and Co-Head of Synaxis Season 1.</p>} />
      {council.length === 0 && <div className="card"><Empty title="Council reveal coming soon" body="Follow @heusersynaxis for the announcement." /></div>}
      {exec.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2">
          {exec.map((c, i) => <li key={c.id}><Reveal delay={i * 80}><CouncilCard c={c} accent="#F24B59" large /></Reveal></li>)}
        </ul>
      )}
      {modules.map((m) => {
        const team = council.filter((c) => c.tier === "module" && c.module_id === m.id);
        if (!team.length) return null;
        return (
          <section key={m.id} className="mt-12 grid items-end gap-4 sm:grid-cols-[9rem_1fr]">
            {/* the module's character stands beside its Head/Co-Head cards */}
            <div className="hidden h-48 sm:block"><BH6Image id={(MODULE_ART[m.motif] ?? MODULE_ART.microbots).character} decorative sizes="144px" className="h-full w-auto object-contain object-bottom drop-shadow-xl" fallbackClassName="h-full" /></div>
            <div>
            <h2 className="flex items-center gap-3 font-display text-xl font-bold"><span className="h-3 w-3 rounded-full" style={{ background: m.accent }} />{m.name}<span className="text-sm font-normal text-[var(--ink-muted)]">{m.subject}</span></h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {team.map((c, i) => <li key={c.id}><Reveal delay={i * 60}><CouncilCard c={c} accent={m.accent} /></Reveal></li>)}
            </ul>
            </div>
          </section>
        );
      })}
      {council.filter((c) => c.tier === "module" && !c.module_id).length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">Council</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {council.filter((c) => c.tier === "module" && !c.module_id).map((c) => <li key={c.id}><CouncilCard c={c} accent="#424CBC" /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
