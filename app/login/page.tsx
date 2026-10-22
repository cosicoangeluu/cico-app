import type { Metadata } from "next";
import { Suspense } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { enterDemo } from "@/lib/auth-actions";
import { demoAvailable } from "@/lib/demo/mode";
import { stagger } from "@/components/stagger";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/** The three kinds of record, each in the colour it keeps across CICO. */
const folders = [
  { label: "Cash-in", className: "bg-cash-in text-cash-in-ink", tab: "left-0" },
  { label: "Cash-out", className: "bg-cash-out text-cash-out-ink", tab: "left-[34%]" },
  { label: "Pending", className: "bg-pending text-pending-ink", tab: "right-0" },
];

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="flex min-h-[44svh] flex-col overflow-hidden bg-night text-night-ink lg:min-h-svh">
        <div className="px-6 pt-8 sm:px-10 lg:px-14 lg:pt-14">
          <p className="rise font-display text-giant font-light leading-[0.85] tracking-[-0.04em]">
            CICO
          </p>
          <p
            className="rise mt-4 max-w-[26ch] text-lead"
            style={stagger(1)}
          >
            Every cash-in and cash-out, recorded in one place.
          </p>
        </div>

        <div aria-hidden className="relative mt-auto h-40 sm:h-52 lg:h-64">
          {folders.map((folder, index) => (
            <div
              key={folder.label}
              className={`rise absolute inset-x-6 bottom-0 sm:inset-x-10 lg:inset-x-14 ${folder.className}`}
              style={{ ...stagger(index + 2), top: `${index * 30}%` }}
            >
              <span
                className={`folder-tab absolute -top-9 flex h-9 items-center px-6 font-medium ${folder.tab} ${folder.className}`}
              >
                {folder.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <h1 className="rise text-head font-medium" style={stagger(1)}>
            Sign in
          </h1>
          <p className="rise mt-3 text-muted" style={stagger(2)}>
            Use the operator email and password.
          </p>

          {isSupabaseConfigured ? (
            <div className="rise" style={stagger(3)}>
              <Suspense fallback={<LoginForm next="/dashboard" />}>
                <LoginFormWithNext searchParams={searchParams} />
              </Suspense>
            </div>
          ) : (
            <div className="rise" style={stagger(3)}>
              <div role="status" className="mt-8 rounded-ui bg-pending p-6 text-pending-ink">
                <p className="text-lead font-medium">
                  CICO isn&apos;t connected to its database yet.
                </p>
                <p className="mt-2">
                  Follow the steps in <strong>SUPABASE_SETUP.md</strong> to
                  create the Supabase project and fill in{" "}
                  <strong>.env.local</strong>, then restart CICO.
                </p>
              </div>
              {demoAvailable && (
                <form action={enterDemo} className="mt-6">
                  <button
                    type="submit"
                    className="pressable flex h-14 w-full items-center justify-center rounded-full bg-night px-6 text-lead font-medium text-night-ink"
                  >
                    Try the demo
                  </button>
                  <p className="mt-3 text-small text-muted">
                    Demo records stay in this browser only. Nothing is saved to
                    a database.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

async function LoginFormWithNext({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : "/dashboard"} />;
}
