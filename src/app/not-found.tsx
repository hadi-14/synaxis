import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BH6Image } from "@/components/brand/BH6Image";
import { PainScale } from "@/components/eggs/PainScale";
import { getSettings } from "@/lib/content";

/** Themed 404: Baymax asks you to rate your pain. Red-led, works in both modes, with header + footer. */
export default async function NotFound() {
  const settings = await getSettings();
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <section className="band">
          <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-[auto_1fr] md:py-20">
            <div className="mx-auto w-36 sm:w-44">
              <BH6Image id="baymax-healthcare" sizes="176px" className="h-auto w-full" fallback="icon" iconClassName="mx-auto h-28 w-28" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[var(--band-body)]">404 · page not found</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-[var(--band-heading)] sm:text-4xl">
                On a scale of 1 to 10, how would you rate your pain?
              </h1>
              <p className="mt-3 text-lg font-semibold text-[var(--band-body)]">This page doesn&apos;t exist. Let me help you find your way back.</p>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <PainScale />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary">Back to home</Link>
            <Link href="/register" className="btn btn-secondary">Register your team</Link>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </>
  );
}
