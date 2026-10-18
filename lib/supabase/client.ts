"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * The browser's Supabase client. It acts as the signed-in operator (or as an
 * anonymous visitor on the sender's page); the database decides what it may do.
 */
export function getBrowserClient(): SupabaseClient {
  client ??= createBrowserClient(supabaseUrl, supabasePublishableKey);
  return client;
}
