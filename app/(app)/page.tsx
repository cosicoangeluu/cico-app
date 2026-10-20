import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { ArrowRight, Banknote, Clock, Wallet, type LucideIcon } from "lucide-react";
import { requireOperator } from "@/lib/auth";
import { demoAvailable } from "@/lib/demo/mode";
import { createClient } from "@/lib/supabase/server";
import { DemoPendingCount } from "@/components/demo/demo-pending-count";
import { stagger } from "@/components/stagger";
import { tones, type Tone } from "@/components/tones";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="rise text-head font-medium">What are you recording?</h1>
      <p className="rise mt-3 max-w-[44ch] text-lead" style={stagger(1)}>
        Pick the kind of transaction. The fee is always paid separately from the
        amount.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <ActionTile
          href="/cash-in"
          tone="cash-in"
          icon={Wallet}
          title="Cash-in"
          order={2}
        >
          Customer gives you cash.
          <br />
          You send it to their wallet.
        </ActionTile>
        <ActionTile
          href="/cash-out"
          tone="cash-out"
          icon={Banknote}
          title="Cash-out"
          order={3}
        >
          Customer sends to your wallet.
          <br />
          You give them cash.
        </ActionTile>
      </div>

      <Link
        href="/pending"
        className={`group liftable rise mt-3 flex flex-col gap-4 rounded-ui p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 ${tones.pending}`}
        style={stagger(4)}
      >
        <span className="flex items-start gap-4">
          <Clock aria-hidden className="mt-1 size-8 shrink-0" />
          <span>
            <span className="block text-lead font-medium">Pending cash-outs</span>
            <span className="block">
              Waiting for money to arrive in your wallet.
            </span>
          </span>
        </span>
        <span className="flex items-center gap-4 self-end sm:self-auto">
          <span className="text-lead font-medium">
            {demoAvailable ? (
              <DemoPendingCount />
            ) : (
              <Suspense fallback="Checking…">
                <PendingCount />
              </Suspense>
            )}
          </span>
          <ArrowRight aria-hidden className="nudge size-7" />
        </span>
      </Link>
    </div>
  );
}

function ActionTile({
  href,
  tone,
  icon: Icon,
  title,
  order,
  children,
}: {
  href: string;
  tone: Tone;
  icon: LucideIcon;
  title: string;
  order: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group liftable rise flex min-h-60 flex-col justify-between gap-8 rounded-ui p-6 sm:min-h-72 sm:p-8 ${tones[tone]}`}
      style={stagger(order)}
    >
      <span>
        <span className="block text-head font-medium">{title}</span>
        <span className="mt-3 block text-lead">{children}</span>
      </span>
      <span className="flex items-end justify-between">
        <Icon aria-hidden className="size-12" strokeWidth={1.5} />
        <span className="flex size-14 items-center justify-center rounded-full bg-night text-night-ink">
          <ArrowRight aria-hidden className="nudge size-7" />
        </span>
      </span>
    </Link>
  );
}

async function PendingCount() {
  await requireOperator();
  // A live count: never prerender it. The Supabase client also checks the
  // session's expiry against the current time before each query.
  await io();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("type", "cash_out")
    .eq("status", "pending");

  if (error) {
    const tableMissing = error.code === "PGRST205" || error.code === "42P01";
    return tableMissing ? "Tables not set up yet" : "Couldn't check";
  }
  return `${count ?? 0} waiting`;
}
