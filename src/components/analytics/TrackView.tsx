"use client";
import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires one analytics event when mounted (e.g. module_viewed). Props must not contain personal data. */
export function TrackView({ event, props }: { event: AnalyticsEvent; props?: Record<string, string | number | boolean> }) {
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
