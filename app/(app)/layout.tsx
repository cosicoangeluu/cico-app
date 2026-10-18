import { Suspense } from "react";
import Link from "next/link";
import { requireOperator } from "@/lib/auth";
import { demoAvailable } from "@/lib/demo/mode";
import { DemoBanner } from "@/components/demo/demo-banner";
import {
  BottomNav,
  BottomNavPlaceholder,
  Sidebar,
  SidebarPlaceholder,
} from "@/components/app-nav";

/** Everything the signed-in operator uses: navigation around the screens. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const account = (
    <Suspense fallback={<span>Signed in</span>}>
      <SignedInAs />
    </Suspense>
  );

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[17rem_1fr]">
      {/* The nav reads the URL, which on pages like /pending/[id] is only known per request. */}
      <Suspense fallback={<SidebarPlaceholder />}>
        <Sidebar account={account} />
      </Suspense>

      <div className="flex min-h-svh flex-col">
        {demoAvailable && <DemoBanner />}
        <header className="flex h-16 items-center px-4 sm:px-8 lg:hidden">
          <Link
            href="/"
            className="font-display text-[2rem] font-light leading-none tracking-[-0.04em]"
          >
            CICO
          </Link>
        </header>

        <main className="flex-1 px-4 pt-2 pb-32 sm:px-8 lg:px-12 lg:pt-12 lg:pb-12">
          {children}
        </main>
      </div>

      <Suspense fallback={<BottomNavPlaceholder />}>
        <BottomNav account={account} />
      </Suspense>
    </div>
  );
}

async function SignedInAs() {
  const operator = await requireOperator();
  return (
    <span className="block truncate">
      Signed in as <span className="font-medium">{operator.email}</span>
    </span>
  );
}
