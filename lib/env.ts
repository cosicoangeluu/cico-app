/**
 * The project's base address, e.g. https://abcd.supabase.co. The dashboard's
 * Data API page shows it with "/rest/v1/" on the end, so anything after the
 * domain is dropped.
 */
function baseUrl(value: string | undefined): string {
  if (!value) return "";
  try {
    return new URL(value.trim()).origin;
  } catch {
    return "";
  }
}

export const supabaseUrl = baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

/** False until the operator fills in .env.local (see SUPABASE_SETUP.md). */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);
