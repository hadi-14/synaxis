import Link from "next/link";
import { Baymax } from "@/components/brand/Baymax";
import { PainScale } from "@/components/eggs/PainScale";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-blueprint px-4 py-16">
      <div className="max-w-xl text-center">
        <Baymax pose="point" className="mx-auto w-28" />
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-[var(--primary-text)]">404 · page not found</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">On a scale of 1 to 10, how would you rate your pain?</h1>
        <PainScale />
        <Link href="/portal" className="btn btn-primary mt-8">Take me home</Link>
      </div>
    </main>
  );
}
