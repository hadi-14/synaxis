import { requireStaff } from "@/lib/auth";
import { BH6_ASSETS, bh6 } from "@/lib/bh6-assets";

export const instant = false;
export const metadata = { title: "Assets" };

/** Which Big Hero 6 images are real vs still placeholders/missing. */
export default async function AssetsPage() {
  await requireStaff();
  const rows = BH6_ASSETS.map((a) => bh6(a.id));
  const needed = rows.filter((r) => r.used);
  const done = needed.filter((r) => r.real).length;
  const groups: { kind: string; label: string }[] = [
    { kind: "character", label: "Characters (transparent PNG cutouts, ≥1200px tall)" },
    { kind: "prop", label: "Objects and props (transparent PNG)" },
    { kind: "background", label: "Backgrounds (≥2400px wide JPG)" },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--primary-text)]">Art department</p>
      <h1 className="font-display text-3xl font-extrabold">Big Hero 6 images</h1>
      <div className="card mt-4 p-4 text-sm">
        <p className="font-semibold">{done}/{needed.length} needed images in place · {rows.length - needed.length} slots not needed right now.</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[var(--ink-muted)]">
          <li>Drop each file into <code className="font-mono">public/assets/bh6/</code> using the exact file name below (replace the placeholder).</li>
          <li>Run <code className="font-mono">npm run assets:process</code>. It backs up the original to <code className="font-mono">assets-src/bh6/</code>, removes flat backgrounds from cutouts, trims empty space, resizes, and marks the slot as real.</li>
          <li>Add the source to <code className="font-mono">public/assets/CREDITS.md</code>, then commit and deploy. The site serves AVIF/WebP automatically.</li>
        </ol>
        <p className="mt-2 text-[var(--ink-muted)]">Until a slot is real, the live site shows a themed stand-in. Add <code className="font-mono">?debug=assets</code> to any page URL to see the labelled placeholders.</p>
      </div>
      {groups.map((g) => (
        <section key={g.kind} className="mt-8">
          <h2 className="font-display text-lg font-bold">{g.label}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.filter((r) => r.kind === g.kind).map((r) => (
              <li key={r.id} className={`card flex items-center gap-3 p-3 ${r.real ? "" : "border-dashed"} ${r.used ? "" : "opacity-55"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.src} alt="" className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-2)] object-contain" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold">{!r.used ? "➖" : r.real ? "✅" : "❌"} {r.file}</p>
                  <p className="truncate text-xs text-[var(--ink-muted)]">{r.purpose}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{!r.used ? "not needed (not shown on the site)" : r.real ? `${r.width}×${r.height}` : r.status.missing ? "missing" : "placeholder"}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
