import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { DEMO_COOKIE, demoAvailable } from "@/lib/demo/mode";
import { createClient } from "@/lib/supabase/server";

export type Operator = {
  id: string;
  email: string;
};

/**
 * The signed-in operator, or a redirect to the sign-in page.
 *
 * Checking a Supabase session compares the token's expiry with the current
 * time, which Next.js refuses while prerendering (partial prefetching
 * prerenders with the visitor's cookies). A private cache scope may read
 * both; its result stays in this visitor's browser, never a server cache.
 * Only a resolved operator is cached: redirect() throws.
 */
export async function requireOperator(): Promise<Operator> {
  "use cache: private";
  if (!isSupabaseConfigured) {
    const inDemo =
      demoAvailable && (await cookies()).get(DEMO_COOKIE)?.value === "1";
    if (!inDemo) redirect("/login");
    return { id: "demo", email: "Demo operator" };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) redirect("/login");

  return { id: claims.sub, email: String(claims.email ?? "") };
}
