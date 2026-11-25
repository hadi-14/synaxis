import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BaymaxFlight } from "@/components/effects/BaymaxFlight";
import { CursorTrail } from "@/components/effects/CursorTrail";
import { ViewTransition } from "react";
import { getSettings } from "@/lib/content";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <>
      <BaymaxFlight />
      <CursorTrail />
      {settings.announcement_active && settings.announcement && (
        <div className="bg-[var(--primary)] px-4 py-2 text-center text-sm font-semibold text-[var(--primary-ink)]">
          {settings.announcement}
        </div>
      )}
      <Header />
      <main id="main" className="flex-1">
        {/* Page transition: microbot dissolve (see globals.css) */}
        <ViewTransition default="microbot-swap">{children}</ViewTransition>
      </main>
      <Footer settings={settings} />
    </>
  );
}
