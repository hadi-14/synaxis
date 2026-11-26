"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { attachClient, track } from "@/lib/analytics";
import { whenIdle } from "@/components/effects/DeferredEffects";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * Loads posthog-js after the page is idle, through the /ingest reverse proxy.
 * Cookieless: persistence "memory" (nothing stored on the device, so no consent banner needed).
 * No autocapture, no session recording, inputs masked, IP not stored. Never runs on /admin.
 */
export function Analytics() {
  const path = usePathname();
  const started = useRef(false);

  useEffect(() => {
    if (!KEY || started.current || path.startsWith("/admin")) return;
    started.current = true;
    whenIdle(async () => {
      const { default: posthog } = await import("posthog-js");
      posthog.init(KEY, {
        api_host: "/ingest",
        ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(".i.posthog.com", ".posthog.com") ?? "https://us.posthog.com",
        persistence: "memory",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: true,
        disable_session_recording: true,
        session_recording: { maskAllInputs: true },
        ip: false,
        property_denylist: ["$ip"],
        sanitize_properties: (props) => {
          // never send query strings (they could contain emails or tokens), only the path
          for (const k of ["$current_url", "$referrer", "$initial_current_url"]) {
            if (typeof props[k] === "string") props[k] = String(props[k]).split("?")[0];
          }
          return props;
        },
      });
      attachClient(posthog);
    });
  }, [path]);

  // pageviews on route changes (queued until PostHog has loaded)
  useEffect(() => {
    track("$pageview");
  }, [path]);

  return null;
}
