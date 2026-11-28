import type { Metadata } from "next";
import { Suspense } from "react";
import { ChargingLoader } from "@/components/ui/Battery";
import { AdminShell } from "@/components/admin/AdminShell";

/** Admin is always per-request (session + live data); opt out of instant-navigation validation. */
export const instant = false;

export const metadata: Metadata = { title: { default: "Cabinet", template: "%s · Cabinet" }, robots: { index: false, follow: false } };

/** Hiro's garage lab: blueprint workbench, HUD labels, calmer effects. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-blueprint"><ChargingLoader label="Powering up the lab" /></div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
