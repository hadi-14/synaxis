"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "@/lib/auth";

const ITEMS: { href: string; label: string; roles: AppRole[] }[] = [
  { href: "/admin", label: "Overview", roles: ["super_admin", "finance", "module_head"] },
  { href: "/admin/teams", label: "Teams", roles: ["super_admin", "finance", "module_head"] },
  { href: "/admin/allocation", label: "Allocation", roles: ["super_admin"] },
  { href: "/admin/checkin", label: "Check-in", roles: ["super_admin", "finance", "module_head"] },
  { href: "/admin/emails", label: "Emails", roles: ["super_admin"] },
  { href: "/admin/content", label: "Content", roles: ["super_admin", "module_head"] },
  { href: "/admin/settings", label: "Settings", roles: ["super_admin"] },
  { href: "/admin/roles", label: "Roles", roles: ["super_admin"] },
  { href: "/admin/exports", label: "Exports", roles: ["super_admin", "finance"] },
  { href: "/admin/audit", label: "Audit log", roles: ["super_admin", "finance"] },
];

export function AdminNav({ roles }: { roles: AppRole[] }) {
  const path = usePathname();
  const items = ITEMS.filter((i) => i.roles.some((r) => roles.includes(r)));
  return (
    <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-[var(--ink)] text-[var(--bg)]" : "hover:bg-[var(--surface-2)]"
            }`}
          >
            {active && <span aria-hidden className="absolute -left-0.5 top-1/2 hidden h-4 w-1 -translate-y-1/2 rounded bg-[var(--primary)] lg:block" />}
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
