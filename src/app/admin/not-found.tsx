import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--danger)]">HUD · restricted</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold">Not available for your role</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">This page doesn&apos;t exist, or your Cabinet role can&apos;t open it.</p>
      <Link href="/admin" className="btn btn-primary mt-6">Back to overview</Link>
    </div>
  );
}
