import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { formatDate } from "@/lib/dates";

/** Readable legal page: table of contents (from the MDX "##" headings) + last-updated date. */
export function LegalPage({ file, updated, children }: { file: "terms" | "privacy"; updated: string; children: React.ReactNode }) {
  const src = readFileSync(join(process.cwd(), "content/legal", `${file}.mdx`), "utf8");
  const toc = [...src.matchAll(/^## (.+)$/gm)].map(([, t]) => ({ t, id: t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[16rem_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary-text)]">On this page</p>
        <nav aria-label="Table of contents" className="mt-3">
          <ol className="space-y-1.5 text-sm">
            {toc.map((h) => (
              <li key={h.id}><a href={`#${h.id}`} className="plasma-link">{h.t}</a></li>
            ))}
          </ol>
        </nav>
        <p className="mt-6 text-xs text-[var(--ink-muted)]">Last updated {formatDate(updated)}</p>
        <p className="mt-2 text-xs">
          {file === "terms" ? <Link className="plasma-link font-semibold" href="/privacy">Privacy Policy →</Link> : <Link className="plasma-link font-semibold" href="/terms">Terms of Service →</Link>}
        </p>
      </aside>
      <article className="max-w-[70ch]">{children}</article>
    </div>
  );
}
