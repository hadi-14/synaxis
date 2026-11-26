"use client";
import Link from "next/link";
import { track } from "@/lib/analytics";

/** A normal Next link that records a `cta_clicked` event with where the CTA lives. */
export function TrackedLink({ location, ...props }: React.ComponentProps<typeof Link> & { location: string }) {
  return <Link {...props} onClick={(e) => { track("cta_clicked", { location }); props.onClick?.(e); }} />;
}
