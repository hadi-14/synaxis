import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { Countdown } from "@/components/site/Countdown";
import { HeroArt } from "@/components/portal/HeroArt";
import { Ticker } from "@/components/portal/Ticker";
import { IntroOverlay } from "@/components/landing/IntroOverlay";
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
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [settings, modules, faqs] = await Promise.all([getSettings(), getModules(), getFaqs()]);
  const compulsory = modules.filter((m) => m.is_compulsory);
  const pickMin = Math.max(0, settings.modules_min - compulsory.length);
  const pickMax = Math.max(0, settings.modules_max - compulsory.length);

  return (
    <>
      <IntroOverlay />
      {/* ------------------------------------------------------------ HERO */}
      {/* pb-11 reserves the ticker's height; the ticker is pinned to the bottom edge in front of Baymax's legs */}
      <section className="band relative overflow-hidden pb-11">
        <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div className="pb-12 md:pb-20">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--band-body)]">
              Heuser Science Society presents
            </p>
            <h1 className="mt-4" data-hero-item style={{ "--i": 0 } as React.CSSProperties}>
              <span className="sr-only">Synaxis {settings.season_label}</span>
              <Logo mono className="h-auto w-full max-w-[540px] drop-shadow-[0_6px_0_var(--band-deep)]" title={`Synaxis ${settings.season_label}`} />
            </h1>
            <p data-hero-item style={{ "--i": 1 } as React.CSSProperties} className="mt-6 font-display text-2xl font-extrabold text-[var(--band-heading)] sm:text-3xl">
              {settings.season_label} · {formatDateRange(settings.event_start, settings.event_end)}
            </p>
            <p data-hero-item style={{ "--i": 2 } as React.CSSProperties} className="mt-3 max-w-md text-lg font-semibold text-[var(--band-body)]">
              A three-day science olympiad in San Fransokyo style. Nine modules, one team, and a mystery every team must
              solve.
            </p>
            <div data-hero-item style={{ "--i": 3 } as React.CSSProperties} className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-onred text-base">
                Register your team
              </Link>
              <Link href="#modules" className="btn btn-onred-outline text-base">
                Explore modules
              </Link>
            </div>
            <div data-hero-item style={{ "--i": 4 } as React.CSSProperties} className="mt-9">
              <Countdown onRed to={`${settings.event_start}T09:00:00+05:00`} />
            </div>
          </div>
          <div data-hero-item style={{ "--i": 2 } as React.CSSProperties}><HeroArt /></div>
        </div>
        <Ticker items={[formatDateRange(settings.event_start, settings.event_end), `${modules.length} modules`, "Karachi", `Teams of ${settings.team_min}–${settings.team_max}`, "Kabuki Caper is compulsory", `Early bird until ${formatDate(settings.early_bird_deadline)}`, "Register now"]} />
      </section>


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
      <section id="modules" className="band scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            onRed
            eyebrow="02 · Modules"
            title="Nine labs. Pick your mission."
            intro={
              <p>
                Every team competes in {settings.modules_min}–{settings.modules_max} modules.{" "}
                {compulsory.length > 0 && (
                  <>
                    <strong className="font-extrabold">{compulsory.map((m) => m.name).join(", ")}</strong> is compulsory. You rank{" "}
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
      <div>
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
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--band-deep)] font-mono font-bold text-white">
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
          <div className="band overflow-hidden rounded-[var(--radius)] shadow-[0_10px_0_var(--band-deep)]">
            <table className="w-full text-left text-sm">
              <caption className="border-b-2 border-[var(--band-deep)] px-5 py-4 text-left font-display text-2xl font-extrabold text-[var(--band-heading)]">Fees</caption>
              <tbody className="divide-y divide-[var(--band-deep)]/60">
                {settings.delegation_fee_early === settings.delegation_fee_regular ? (
                  <tr>
                    <th scope="row" className="px-5 py-3 font-semibold">Delegation fee (once per team)</th>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{feeText(settings.delegation_fee_early)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-semibold">
                        Delegation fee (once per team), early bird
                        <span className="block text-xs font-medium">Submitted by {formatDate(settings.early_bird_deadline)}</span>
                      </th>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{feeText(settings.delegation_fee_early)}</td>
                    </tr>
                    <tr>
                      <th scope="row" className="px-5 py-3 font-semibold">Delegation fee (once per team), regular</th>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{feeText(settings.delegation_fee_regular)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <th scope="row" className="px-5 py-3 font-semibold">
                    Per delegate, early bird
                    <span className="block text-xs font-medium">Submitted by {formatDate(settings.early_bird_deadline)}</span>
                  </th>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{feeText(settings.early_fee)}</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3 font-semibold">Per delegate, regular</th>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono">{feeText(settings.regular_fee)}</td>
                </tr>
                <tr className="bg-[var(--band-deep)] text-white">
                  <th scope="row" className="px-5 py-3 font-semibold">
                    Example: team of {settings.team_min}, early bird
                  </th>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-mono font-bold">
                    {formatRs(settings.delegation_fee_early + settings.team_min * settings.early_fee)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="band flex flex-col justify-between gap-4 rounded-[var(--radius)] p-5 shadow-[0_10px_0_var(--band-deep)]">
            <dl className="space-y-3 text-sm font-semibold">
              {[
                ["Early bird ends", settings.early_bird_deadline],
                ["Registration closes", settings.registration_closes_at],
                ["Payment deadline", settings.payment_deadline],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt>{k}</dt>
                  <dd className="font-mono font-semibold">{formatDate(v)}</dd>
                </div>
              ))}
            </dl>
            <Link href="/register" className="btn btn-onred w-full">
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

/** Fee cell text: "Free" for 0 (e.g. no per-delegate fee during early bird), otherwise Rs amount. */
function feeText(n: number) {
  return n === 0 ? "Free" : formatRs(n);
}
