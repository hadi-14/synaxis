"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { HeuserMark } from "@/components/brand/Heuser";
import { ThemeToggle } from "./ThemeToggle";
import { track } from "@/lib/analytics";

const NAV = [
  { href: "/#about", label: "About" },
  { href: "/#modules", label: "Modules" },
  { href: "/#register", label: "Fees" },
  { href: "/#faq", label: "FAQ" },
  { href: "/council", label: "Council" },
  { href: "/sponsors", label: "Sponsors" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile menu after navigation
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-200 ${
        scrolled || open ? "bg-[var(--bg)]/95 shadow-[0_1px_0_var(--line)] backdrop-blur-md" : "bg-[var(--bg)]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* Compact lockup: Heuser mark | SYNAXIS. Own focus style: no box on click/tap, a neutral ring for keyboard only. */}
        <Link
          href="/"
          className="mr-auto flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] sm:gap-3"
          aria-label="Synaxis by Heuser College, home"
          data-header-logo
        >
          <HeuserMark className="h-7 w-auto text-[var(--ink)] sm:h-8" />
          <span aria-hidden className="h-6 w-px bg-[var(--line)] sm:h-7" />
          <Logo className="h-5 w-auto sm:h-6" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-5 text-sm font-semibold lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="plasma-link">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <Link href="/register" onClick={() => track("cta_clicked", { location: "header" })} className="btn btn-primary !min-h-10 !px-4 text-sm">
          Register
        </Link>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--line)] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="inflate-in border-t border-[var(--line)] bg-[var(--bg)] px-4 pb-6 pt-2 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-[var(--line)] py-4 font-display text-lg">
                {n.label}
              </Link>
            ))}
            <Link href="/dashboard" onClick={() => setOpen(false)} className="border-b border-[var(--line)] py-4 font-display text-lg">
              My team
            </Link>
          </nav>
          <div className="mt-5 flex items-center justify-between">
            <ThemeToggle />
            <Link href="/register" className="btn btn-primary">Register your team</Link>
          </div>
        </div>
      )}
    </header>
  );
}
