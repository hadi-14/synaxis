"use client";
/**
 * Privacy-first analytics (PostHog). Events are queued until PostHog has loaded (after idle) and
 * dropped entirely if NEXT_PUBLIC_POSTHOG_KEY is missing or the page is /admin.
 * Never pass personal data (names, emails, phones, receipts) in event properties.
 */
export type AnalyticsEvent =
  | "register_started"
  | "register_step_completed"
  | "registration_submitted"
  | "receipt_uploaded"
  | "module_viewed"
  | "easter_egg_found"
  | "cta_clicked";

type Client = { capture: (e: string, p?: Record<string, unknown>) => void };
let client: Client | null = null;
const queue: [string, Record<string, unknown> | undefined][] = [];

export function track(event: AnalyticsEvent | "$pageview", props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || location.pathname.startsWith("/admin")) return;
  if (client) client.capture(event, props);
  else if (queue.length < 50) queue.push([event, props]);
}

export function attachClient(c: Client) {
  client = c;
  for (const [e, p] of queue.splice(0)) c.capture(e, p);
}
