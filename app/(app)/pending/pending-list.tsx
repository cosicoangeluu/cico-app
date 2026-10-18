"use client";

import Link from "next/link";
import { ArrowRight, Clock, ReceiptText } from "lucide-react";
import { formatPesos } from "@/lib/money";
import { formatManilaDateTime } from "@/lib/time";
import { useAutoRefresh, useCicoData } from "@/lib/data";
import { stagger } from "@/components/stagger";
import { buttonClass, ScreenHeader } from "@/components/ui";

export function PendingList() {
  const { transactions } = useCicoData();
  useAutoRefresh();
  const pending = transactions.filter((t) => t.status === "pending");

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader title="Pending cash-outs" tone="pending">
        Waiting for the money to arrive, or for you to check it in your wallet.
        Don&apos;t hand over cash for these yet.
      </ScreenHeader>

      {pending.length === 0 ? (
        <section className="rise mt-3 rounded-ui bg-surface p-6 sm:p-10" style={stagger(1)}>
          <p className="text-lead font-medium">Nothing is waiting.</p>
          <p className="mt-2">
            When the money for a cash-out hasn&apos;t arrived yet, save it as
            pending and it shows up here.
          </p>
          <Link href="/cash-out" className={buttonClass("cash-out", "mt-6")}>
            Start a cash-out
          </Link>
        </section>
      ) : (
        <ul className="mt-3 space-y-3">
          {pending.map((t, index) => (
            <li key={t.id} className="rise" style={stagger(index + 1)}>
              <Link
                href={`/pending/${t.id}`}
                className="group liftable flex flex-col gap-4 rounded-ui bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <span>
                  <span className="block text-head font-medium">
                    {formatPesos(t.principalCentavos)}
                  </span>
                  <span className="block text-lead">
                    for {t.receiverName}
                    {t.senderName && t.senderName !== t.receiverName && (
                      <>, sent by {t.senderName}</>
                    )}
                  </span>
                  <span className="mt-1 block text-small text-muted">
                    Fee {formatPesos(t.feeCentavos)} · Created{" "}
                    {formatManilaDateTime(t.createdAt)}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-4">
                  {t.receipt ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-pending px-4 py-2 font-medium text-pending-ink">
                      <ReceiptText aria-hidden className="size-5" />
                      Receipt in. Check your wallet
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-bg px-4 py-2 font-medium">
                      <Clock aria-hidden className="size-5" />
                      Waiting for money
                    </span>
                  )}
                  <ArrowRight aria-hidden className="nudge size-7 shrink-0" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
