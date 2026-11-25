import Link from "next/link";
import { BH6Image } from "@/components/brand/BH6Image";
import { PainScale } from "@/components/eggs/PainScale";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-blueprint px-4 py-16">
      <div className="max-w-xl text-center">
        <BH6Image id="team" sizes="(max-width: 640px) 90vw, 520px" className="mx-auto h-auto w-full max-w-[520px]" fallbackClassName="mx-auto w-full max-w-[420px] !aspect-[5/3] !rounded-[var(--radius)]" />
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-[var(--primary-text)]">404 · page not found</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">On a scale of 1 to 10, how would you rate your pain?</h1>
        <PainScale />
        <Link href="/portal" className="btn btn-primary mt-8">Take me home</Link>
      </div>
    </main>
  );
}
