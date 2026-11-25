import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "./supabase/admin";

/** Fixed-window limiter backed by Postgres (works across serverless instances). */
export async function rateLimit(bucket: string, max: number, windowSeconds: number, subject?: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const key = `${bucket}:${subject ?? ip}`;
  const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit check failed", error.message);
    return true; // fail open: never block registrations because the limiter broke
  }
  return data === true;
}
