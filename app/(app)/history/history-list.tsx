"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Transaction } from "@/lib/cico/transactions";
import { formatPesos } from "@/lib/money";
import { formatManilaDateTime } from "@/lib/time";
import { useCicoData } from "@/lib/data";
import { stagger } from "@/components/stagger";
import { buttonClass, ScreenHeader } from "@/components/ui";

const filters = [
  { key: "all", label: "All" },
  { key: "cash_in", label: "Cash-in" },
  { key: "cash_out", label: "Cash-out" },
  { key: "pending", label: "Pending" },
] as const;

type Filter = (typeof filters)[number]["key"];

function matches(t: Transaction, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "pending") return t.status === "pending";
  return t.type === filter;
}

export function HistoryList() {
  const { transactions } = useCicoData();
  const [filter, setFilter] = useState<Filter>("all");
  const shown = transactions.filter((t) => matches(t, filter));

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader title="History" tone="surface">
        Every cash-in and cash-out you&apos;ve recorded, newest first.
      </ScreenHeader>

      <div role="group" aria-label="Show" className="rise mt-3 flex flex-wrap gap-2" style={stagger(1)}>
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`pressable h-12 rounded-full px-5 font-medium ${
              filter === key ? "bg-night text-night-ink" : "bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <section className="rise mt-3 rounded-ui bg-surface p-6 sm:p-10" style={stagger(2)}>
          <p className="text-lead font-medium">Nothing here yet.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/cash-in" className={buttonClass("cash-in")}>Record a cash-in</Link>
            <Link href="/cash-out" className={buttonClass("cash-out")}>Record a cash-out</Link>
          </div>
        </section>
      ) : (
        <ul className="mt-3 space-y-2">
          {shown.map((t, index) => (
            <li key={t.id} className="rise" style={stagger(Math.min(index + 2, 10))}>
              <HistoryItem t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryItem({ t }: { t: Transaction }) {
  const cashIn = t.type === "cash_in";
  const pending = t.status === "pending";

  const details: [string, string][] = [
    ["Reference number", t.referenceNumber || "Not entered yet"],
    [cashIn ? "Customer (wallet owner)" : "Collected the cash", t.receiverName || "-"],
  ];
  if (!cashIn) details.push(["Sent the money", t.senderName || "Not known yet"]);
  details.push(
    ["Fee rule used", `${formatPesos(t.feeRange.fromCentavos)} to ${formatPesos(t.feeRange.upToCentavos)}`],
    ["Transfer time", t.transferredAt ? formatManilaDateTime(t.transferredAt) : "Not entered yet"],
    ["Recorded", formatManilaDateTime(t.createdAt)],
  );
  if (t.fundsVerifiedAt) details.push(["Money checked in wallet", formatManilaDateTime(t.fundsVerifiedAt)]);
  if (t.completedAt) details.push(["Completed", formatManilaDateTime(t.completedAt)]);

  return (
    <details className="group/item rounded-ui bg-surface">
      <summary className="pressable flex cursor-pointer list-none items-center gap-4 rounded-ui p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className={`w-2 self-stretch rounded-full ${cashIn ? "bg-cash-in" : "bg-cash-out"}`}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{cashIn ? "Cash-in" : "Cash-out"}</span>
            <span
              className={`rounded-full px-3 py-0.5 text-small font-medium ${
                pending ? "bg-pending text-pending-ink" : "bg-night text-night-ink"
              }`}
            >
              {pending ? "Pending" : "Completed"}
            </span>
          </span>
          <span className="block truncate text-muted">
            {t.receiverName} · {formatManilaDateTime(t.completedAt ?? t.createdAt)}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-lead font-medium">{formatPesos(t.principalCentavos)}</span>
          <span className="block text-small text-muted">+ {formatPesos(t.feeCentavos)} fee</span>
        </span>
        <ChevronDown aria-hidden className="size-6 shrink-0 transition-transform duration-200 group-open/item:rotate-180" />
      </summary>

      <div className="grid gap-6 px-4 pb-5 sm:px-5 lg:grid-cols-[1fr_auto]">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-small text-muted">{label}</dt>
              <dd className="font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>
        {t.receipt?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL or a private, short-lived link
          <img
            src={t.receipt.imageUrl}
            alt="Receipt"
            className="max-h-64 rounded-ui bg-field object-contain"
          />
        )}
        {pending && (
          <Link href={`/pending/${t.id}`} className={buttonClass("pending", "justify-self-start")}>
            Open pending cash-out
          </Link>
        )}
      </div>
    </details>
  );
}
