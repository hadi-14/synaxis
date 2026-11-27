import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DeferredSiteEffects } from "@/components/effects/DeferredSiteEffects";
import { ViewTransition } from "react";
import { getSettings } from "@/lib/content";
import { EarlyBirdScript } from "@/components/earlybird/EarlyBirdScript";
import { earlyBirdMax, formatRs } from "@/lib/fees";
import { formatDate } from "@/lib/dates";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const eb = earlyBirdMax(settings, settings.team_min, settings.team_max);
  return (
    <>
      <EarlyBirdScript deadline={settings.early_bird_deadline} />
      <DeferredSiteEffects />
      {eb.saving > 0 && (
        <Link
          href="/#fees"
          data-eb-only="on"
          className="block bg-[var(--band-deep)] px-4 py-2 text-center text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-[0.16em]">Early bird</span>
          <span aria-hidden> · </span>
          Save up to {formatRs(eb.saving)} per team. Ends {formatDate(settings.early_bird_deadline)}.
        </Link>
      )}
      {settings.announcement_active && settings.announcement && (
        <div className="bg-[var(--primary)] px-4 py-2 text-center text-sm font-semibold text-[var(--primary-ink)]">
          {settings.announcement}
        </div>
      )}
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* Page transition: microbot dissolve (see globals.css) */}
        <ViewTransition default="microbot-swap">{children}</ViewTransition>
      </main>
      <Footer settings={settings} />
    </>
  );
}
