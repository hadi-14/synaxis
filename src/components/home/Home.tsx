import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { HeuserMark } from "@/components/brand/Heuser";
import { Countdown } from "@/components/site/Countdown";
import { HeroArt } from "@/components/portal/HeroArt";
import { HeroWatermark } from "@/components/portal/HeroWatermark";
import { Ticker } from "@/components/portal/Ticker";
import { JsonLd, homeJsonLd } from "@/components/seo/JsonLd";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Skyline } from "@/components/decor/Skyline";
import { BlueprintSchematic } from "@/components/decor/BlueprintSchematic";
import { HexPattern } from "@/components/decor/HexPattern";
import { ScanHud } from "@/components/decor/ScanHud";
import { MicrobotChain } from "@/components/decor/MicrobotChain";
import { AmbientMicrobots } from "@/components/decor/AmbientMicrobots";
import { BentoTile } from "@/components/home/BentoTile";
import { ScanReadout } from "@/components/home/ScanReadout";
import { AdmissionCard } from "@/components/home/AdmissionCard";
import { ChargingTrack } from "@/components/home/ChargingTrack";
import { FeeReceipt } from "@/components/home/FeeReceipt";
import { BoardingPass } from "@/components/home/BoardingPass";
import { readableOnWhite } from "@/lib/color";
import { feesSentence } from "@/lib/fee-copy";
import { bh6 } from "@/lib/bh6-assets";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/effects/Reveal";
import { WasabiSticker } from "@/components/eggs/WasabiSticker";
import { FaqKaiju } from "@/components/eggs/FaqKaiju";
import { getFaqs, getModules, getSettings } from "@/lib/content";
import { earlyBirdMax, formatRs } from "@/lib/fees";
import { formatDateRange } from "@/lib/dates";
import { ELIGIBILITY } from "@/lib/eligibility";
import { venueMap } from "@/lib/maps";

/**
 * The home page content, shared by "/" (which adds the intro, see app/(site)/page.tsx) and /home-static (the
 * version crawlers and audit tools get from the proxy). The intro is not imported here, so the bot version
 * never ships its code.
 */
export async function Home() {
  const [settings, modules, faqs] = await Promise.all([getSettings(), getModules(), getFaqs()]);
  const compulsory = modules.filter((m) => m.is_compulsory);
  const map = venueMap(settings.venue_map_url, [settings.venue_name, settings.venue_address].filter(Boolean).join(", "));
  const pickMin = Math.max(0, settings.modules_min - compulsory.length);
  const pickMax = Math.max(0, settings.modules_max - compulsory.length);
  const eb = earlyBirdMax(settings, settings.team_min, settings.team_max);
  const ebTicker = [
    settings.delegation_fee_early === 0 && eb.delegationSaving > 0 ? "delegation fee free" : eb.delegationSaving > 0 ? `save ${formatRs(eb.delegationSaving)} on the delegation fee` : null,
    eb.perDelegateSaving > 0 ? `save ${formatRs(eb.perDelegateSaving)} per delegate` : null,
  ].filter(Boolean).join(" + ");

  return (
    <>
      <JsonLd data={homeJsonLd(settings, faqs)} />
      {/* ------------------------------------------------------------ HERO */}
      {/* pb-11 reserves the ticker's height; the ticker is pinned to the bottom edge in front of Baymax's legs */}
      <section className="band relative isolate overflow-hidden pb-11">
        {/* Heuser College mark: a large white brand shape bleeding off the right edge, behind Baymax */}
        <HeroWatermark />
        <div className="mx-auto grid max-w-6xl items-end gap-6 px-4 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div className="pb-12 md:pb-20">
            <p className="flex items-center gap-2.5 font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--band-body)]">
              <HeuserMark className="h-5 w-auto shrink-0" />
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
              A 3-day science olympiad in San Fransokyo style.{" "}
              <span className="font-extrabold underline decoration-[var(--band-deep)] decoration-[5px] underline-offset-[4px]">9 modules</span>, one team, and a mystery every team must
              solve.
            </p>
            <div data-hero-item style={{ "--i": 3 } as React.CSSProperties} className="mt-7 flex flex-wrap gap-3">
              <TrackedLink location="hero" href="/register" className="btn btn-onred text-base">
                Register your team
              </TrackedLink>
              <Link href="#modules" className="btn btn-onred-outline text-base">
                Explore modules
              </Link>
            </div>
            {eb.percent > 0 && (
              <p data-eb-only="on" className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#B3101C] shadow-[0_3px_0_var(--band-deep)]">
                <span aria-hidden className="h-2 w-2 rounded-full bg-[#DC2A35] motion-safe:animate-pulse" />
                Early bird: up to {eb.percent}% off
              </p>
            )}
            <div data-hero-item style={{ "--i": 4 } as React.CSSProperties} className="mt-9">
              <Countdown onRed to={`${settings.event_start}T09:00:00+05:00`} />
            </div>
          </div>
          <div data-hero-item style={{ "--i": 2 } as React.CSSProperties}><HeroArt /></div>
        </div>
        <Ticker
          items={[
            formatDateRange(settings.event_start, settings.event_end),
            `${modules.length} modules`,
            "Karachi",
            `Teams of ${settings.team_min}–${settings.team_max}`,
            "Kabuki Caper is compulsory",
            ...(ebTicker ? [{ text: `Early bird: ${ebTicker}`, earlyBird: true as const }] : []),
            "Register now",
          ]}
        />
      </section>


      {/* ------------------------------------------------------------ ABOUT */}
      <div className="relative isolate overflow-hidden bg-blueprint">
        <div aria-hidden className="pointer-events-none absolute right-[-40px] top-10 -z-10 hidden w-[380px] text-[var(--accent)] opacity-[0.16] md:block lg:right-[4%]">
          <BlueprintSchematic className="h-auto w-full" />
        </div>
        <AmbientMicrobots className="-z-10 text-[var(--ink-muted)]" count={4} />
      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="01 · About"
          title="A gathering of curious minds"
          intro={
            <p>
              <em>Synaxis</em> means “a gathering”. For 3 days, school teams from across Pakistan meet in Karachi to compete in
              9 modules, from Baymax’s biology lab to Yokai’s crime scene. You think like Hiro, build like Tadashi and stay calm
              like Baymax.
            </p>
          }
        />
        <Reveal>
          <ScanReadout
            rows={[
              ["Date", formatDateRange(settings.event_start, settings.event_end)],
              ["Venue", settings.venue_name, <HeuserMark key="mark" className="h-[1.15em] w-auto shrink-0" />],
              ["Team size", `${settings.team_min}–${settings.team_max} delegates`],
              ["Modules", `${settings.modules_min}–${settings.modules_max} per team`],
            ]}
          />
        </Reveal>
        <div className="mt-6 grid gap-5 md:grid-cols-[2fr_1fr]">
          <Reveal>
            <AdmissionCard>
              <p className="pr-20 sm:pr-24">
                {ELIGIBILITY}
              </p>
              <WasabiSticker />
            </AdmissionCard>
          </Reveal>
          <Reveal delay={80}>
            <Link href="/council" className="cabinet-badge group relative flex h-full flex-col justify-between overflow-hidden p-6">
              <span aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full border-[10px] border-[#DC2A35]/40" />
              <div>
                <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#FF8A94]">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
                  The Cabinet
                </p>
                <p className="mt-2 font-display text-lg font-bold">Meet the council running Synaxis</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
                Access granted <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
      </div>
      <MicrobotChain className="text-[var(--band)] opacity-70" />

      {/* ------------------------------------------------------------ MODULES */}
      {/* Bottom padding = skyline height + a clear gap, so the cards never touch the skyline. */}
      <section id="modules" className="band relative isolate scroll-mt-20 overflow-hidden pt-16 pb-[calc(max(150px,18.75vw)+3.5rem)] sm:pt-24">
        <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[max(150px,18.75vw)] w-full" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            onRed
            eyebrow="02 · Modules"
            title="9 labs. Pick your mission."
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
          {/* Bento: the compulsory module is the featured 2×2 tile; the rest fill around it. */}
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[...compulsory, ...modules.filter((m) => !m.is_compulsory)].map((m, i) => (
              <li key={m.id} className={m.is_compulsory ? "col-span-2 lg:row-span-2" : ""}>
                <Reveal delay={(i % 4) * 50} className="h-full">
                  <BentoTile m={{ slug: m.slug, name: m.name, subject: m.subject, character: m.character, tagline: m.tagline, motif: m.motif }} featured={m.is_compulsory} panel={readableOnWhite(m.accent)} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ REGISTER TEASER */}
      <div>
      <MicrobotChain className="text-[var(--band)] opacity-70" />
      <div className="relative isolate overflow-hidden">
        <HexPattern className="pointer-events-none absolute inset-0 -z-10 text-[var(--ink)] opacity-[0.05]" />
      <section id="register" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="03 · Registration"
          title="Suit up in 4 steps"
          intro={<p>Only the Head Delegate fills in the form. It saves as you go, so you can finish it later on any device.</p>}
        />
        <ChargingTrack
          microbot={bh6("microbot").src}
          steps={[
            ["Sign in", "With Google or a one-time email link."],
            ["Build your team", `${settings.team_min}–${settings.team_max} members, module rankings and consent. About 10 minutes.`],
            ["Pay & upload", "Your exact total appears instantly. Upload the receipt or send it on WhatsApp."],
            ["Track it live", "Your dashboard shows payment, waivers, modules and check-in QR codes."],
          ]}
        />

        <div id="fees" className="mt-14 grid scroll-mt-24 items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h3 className="mb-4 font-display text-2xl font-extrabold">Fees</h3>
            <FeeReceipt s={settings} teamMin={settings.team_min} teamMax={settings.team_max} />
          </div>
          <div className="lg:pt-12">
            <BoardingPass s={settings} />
          </div>
        </div>
      </section>
      </div>

      </div>

      {/* ------------------------------------------------------------ FAQ */}
      <MicrobotChain className="text-[var(--band)] opacity-70" />
      <div className="relative isolate overflow-hidden">
        <ScanHud className="absolute inset-0 -z-10 text-[var(--primary-text)] opacity-[0.14] [--scan-h:100%]" />
        <AmbientMicrobots className="-z-10 text-[var(--ink-muted)]" count={3} />
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading eyebrow="04 · FAQ" title="Questions? Scan complete." />
        <FaqAccordion faqs={faqs} mapHref={map?.open} fees={{ on: feesSentence(settings, "on"), after: feesSentence(settings, "after") }} />
        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          Still stuck? Message us on{" "}
          <a className="plasma-link font-semibold text-[var(--ink)]" href={settings.instagram_url} target="_blank" rel="noopener">
            Instagram
          </a>
          .
        </p>
        <FaqKaiju />
      </section>
      </div>
    </>
  );
}

