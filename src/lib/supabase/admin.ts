import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { SUPABASE_URL, assertSupabaseEnv } from "./env";

/**
 * Service-role client. BYPASSES RLS. Only use inside server actions/route handlers
 * AFTER verifying the caller (see src/lib/auth.ts).
 */
export function createAdminClient() {
  assertSupabaseEnv();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Missing SUPABASE_SECRET_KEY (server-only).");
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
