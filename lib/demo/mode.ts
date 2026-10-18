import { isSupabaseConfigured } from "@/lib/env";

export const DEMO_COOKIE = "cico_demo";

/**
 * Demo mode only exists while developing on this computer with no database
 * connected. A production build never offers it, and connecting Supabase
 * switches it off.
 */
export const demoAvailable =
  !isSupabaseConfigured && process.env.NODE_ENV === "development";
