import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/** Typography for MDX content (Terms / Privacy). Headings get ids for the table of contents. */
const slug = (c: React.ReactNode) => String(c).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{children}</h1>,
    h2: ({ children }) => (
      <h2 id={slug(children)} className="mt-10 scroll-mt-24 border-t-4 border-[var(--band)] pt-4 font-display text-xl font-bold sm:text-2xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => <h3 className="mt-6 font-display text-lg font-bold">{children}</h3>,
    p: ({ children }) => <p className="mt-3 leading-7 text-[var(--ink)]">{children}</p>,
    ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-6 leading-7">{children}</ul>,
    ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-6 leading-7">{children}</ol>,
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    a: ({ href = "", children }) =>
      href.startsWith("/") ? (
        <Link href={href} className="font-semibold text-[var(--primary-text)] underline underline-offset-2">{children}</Link>
      ) : (
        <a href={href} className="font-semibold text-[var(--primary-text)] underline underline-offset-2" target="_blank" rel="noopener">{children}</a>
      ),
    blockquote: ({ children }) => <blockquote className="mt-4 rounded-[var(--radius-sm)] border-l-4 border-[var(--warning)] bg-[#FBBF24]/15 p-3 text-sm">{children}</blockquote>,
    ...components,
  };
}
