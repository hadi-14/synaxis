import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** Cookie-less anon client for public content inside `use cache` functions. */
export function createPublicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
