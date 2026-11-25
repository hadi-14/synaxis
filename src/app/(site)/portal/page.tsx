import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { Countdown } from "@/components/site/Countdown";
import { HeroArt } from "@/components/portal/HeroArt";
import { Ticker } from "@/components/portal/Ticker";
import { ModuleCard } from "@/components/site/ModuleCard";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/effects/Reveal";
import { WasabiSticker } from "@/components/eggs/WasabiSticker";
import { FaqKaiju } from "@/components/eggs/FaqKaiju";
import { getFaqs, getModules, getSettings } from "@/lib/content";
import { formatRs } from "@/lib/fees";
import { formatDate, formatDateRange } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Portal",
  alternates: { canonical: "/portal" },
};

export default async function PortalPage() {
  const [settings, modules, faqs] = await Promise.all([getSettings(), getModules(), getFaqs()]);
  const compulsory = modules.filter((m) => m.is_compulsory);
  const pickMin = Math.max(0, settings.modules_min - compulsory.length);
  const pickMax = Math.max(0, settings.modules_max - compulsory.length);

  return (
    <>
      {/* ------------------------------------------------------------ HERO */}
      <section className="relative overflow-hidden bg-blueprint">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_65%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pb-24 md:pt-16">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary-text)]">
              Heuser Science Society presents
            </p>
            <h1 className="mt-4">
              <span className="sr-only">Synaxis {settings.season_label}</span>
              <Logo className="h-auto w-full max-w-[520px]" title={`Synaxis ${settings.season_label}`} />
            </h1>
            <p className="mt-5 font-display text-xl font-bold sm:text-2xl">
              {settings.season_label} · {formatDateRange(settings.event_start, settings.event_end)}
            </p>
            <p className="mt-3 max-w-md text-[var(--ink-muted)] sm:text-lg">
              A three-day science olympiad in San Fransokyo style. Nine modules, one team, and a mystery every team must
              solve.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary text-base">
                Register your team
              </Link>
              <Link href="#modules" className="btn btn-secondary text-base">
                Explore modules
              </Link>
            </div>
            <div className="mt-9">
              <Countdown to={`${settings.event_start}T09:00:00+05:00`} />
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <Ticker items={[formatDateRange(settings.event_start, settings.event_end), `${modules.length} modules`, "Karachi", `Teams of ${settings.team_min}–${settings.team_max}`, "Kabuki Caper is compulsory", `Early bird until ${formatDate(settings.early_bird_deadline)}`, "Register now"]} />

      {/* ------------------------------------------------------------ ABOUT */}
      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="01 · About"
          title="A gathering of curious minds"
          intro={
            <p>
              <em>Synaxis</em> means “a gathering”. For three days, school teams from across Pakistan meet in Karachi to compete in
              nine modules, from Baymax’s biology lab to Yokai’s crime scene. You think like Hiro, build like Tadashi and stay calm
              like Baymax.
            </p>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["When", formatDateRange(settings.event_start, settings.event_end)],
            ["Where", `${settings.venue_name}`],
            ["Teams", `${settings.team_min}–${settings.team_max} delegates`],
            ["Modules", `${settings.modules_min}–${settings.modules_max} per team`],
          ].map(([k, v], i) => (
            <Reveal key={k} delay={i * 60}>
              <div className="card panel-lines h-full p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">{k}</p>
                <p className="mt-2 font-display text-lg font-bold">{v}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
          <Reveal>
            <div className="card relative h-full p-6">
              <h3 className="font-display text-lg font-bold">Who can enter</h3>
              <p className="mt-2 text-[var(--ink-muted)]">
                Students currently enrolled in Grade 9, O-Level/Matric, AS or A-Level/Intermediate (or equivalent). HSSC completers
                preparing for MDCAT are welcome. University students are not eligible. Register as a Heuser team, an official
                school delegation or an independent team.
              </p>
              <WasabiSticker />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <Link href="/council" className="card group flex h-full flex-col justify-between p-6 hover:border-[var(--primary)]">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">The Cubinet</p>
                <p className="mt-2 font-display text-lg font-bold">Meet the council running Synaxis</p>
              </div>
              <span className="mt-4 font-bold text-[var(--primary-text)]">
                See the team <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ MODULES */}
      <section id="modules" className="scroll-mt-20 bg-[var(--surface-2)]/60 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="02 · Modules"
            title="Nine labs. Pick your mission."
            intro={
              <p>
                Every team competes in {settings.modules_min}–{settings.modules_max} modules.{" "}
                {compulsory.length > 0 && (
                  <>
                    <strong className="text-[var(--ink)]">{compulsory.map((m) => m.name).join(", ")}</strong> is compulsory. You rank{" "}
                    {pickMin === pickMax ? pickMin : `${pickMin}–${pickMax}`} more.
                  </>
                )}
              </p>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <li key={m.id}>
                <Reveal delay={(i % 3) * 60} className="h-full">
                  <ModuleCard m={m} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ REGISTER TEASER */}
      <div className="bg-[color-mix(in_srgb,var(--primary)_9%,var(--bg))]">
      <section id="register" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="03 · Registration"
          title="Suit up in four steps"
          intro={<p>Only the Head Delegate fills in the form. It saves as you go, so you can finish it later on any device.</p>}
        />
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            ["Sign in", "With Google or a one-time email link."],
            ["Build your team", `${settings.team_min}–${settings.team_max} members, module rankings and consent. About 10 minutes.`],
            ["Pay & upload", "Your exact total appears instantly. Upload the receipt or send it on WhatsApp."],
            ["Track it live", "Your dashboard shows payment, waivers, modules and check-in QR codes."],
          ].map(([t, d], i) => (
            <li key={t}>
              <Reveal delay={i * 60} className="h-full">
                <div className="card h-full p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)] font-mono font-bold text-[var(--primary-ink)]">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display font-bold">{t}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{d}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <caption className="border-b border-[var(--line)] px-5 py-4 text-left font-display text-base font-bold">Fees</caption>
              <tbody className="divide-y divide-[var(--line)]">
                <tr>
                  <th scope="row" className="px-5 py-3 font-semibold">Delegation fee (once per team)</th>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{formatRs(settings.delegation_fee)}</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-semibold">
                    Per delegate, early bird
                    <span className="block text-xs font-normal text-[var(--ink-muted)]">Submitted by {formatDate(settings.early_bird_deadline)}</span>
                  </th>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{formatRs(settings.early_fee)}</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-semibold">Per delegate, regular</th>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{formatRs(settings.regular_fee)}</td>
                </tr>
                <tr className="bg-[var(--surface-2)]">
                  <th scope="row" className="px-5 py-3 font-semibold">
                    Example: team of {settings.team_min}, early bird
                  </th>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono font-bold">
                    {formatRs(settings.delegation_fee + settings.team_min * settings.early_fee)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card flex flex-col justify-between gap-4 p-5">
            <dl className="space-y-3 text-sm">
              {[
                ["Early bird ends", settings.early_bird_deadline],
                ["Registration closes", settings.registration_closes_at],
                ["Payment deadline", settings.payment_deadline],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-[var(--ink-muted)]">{k}</dt>
                  <dd className="font-mono font-semibold">{formatDate(v)}</dd>
                </div>
              ))}
            </dl>
            <Link href="/register" className="btn btn-primary w-full">
              Start registration
            </Link>
          </div>
        </div>
      </section>

      </div>

      {/* ------------------------------------------------------------ FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="04 · FAQ" title="Questions? Scan complete." />
        <FaqAccordion faqs={faqs} />
        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Still stuck? Message us on{" "}
          <a className="plasma-link font-semibold text-[var(--ink)]" href={settings.instagram_url} target="_blank" rel="noopener">
            Instagram
          </a>
          .
        </p>
        <FaqKaiju />
      </section>
    </>
  );
}
