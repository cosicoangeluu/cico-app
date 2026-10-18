"use client";

import { useState, type ReactNode } from "react";
import { summarize } from "@/lib/cico/reports";
import { formatPesos } from "@/lib/money";
import { formatDateKey, manilaDateKey, periodRange, type Period } from "@/lib/time";
import { useCicoData } from "@/lib/data";
import { stagger } from "@/components/stagger";
import { tones, type Tone } from "@/components/tones";
import { Field, ScreenHeader } from "@/components/ui";

const periods: { key: Period | "custom"; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Choose dates" },
];

export function ReportView() {
  const { transactions } = useCicoData();
  const today = manilaDateKey(new Date());
  const [period, setPeriod] = useState<Period | "custom">("today");
  const [custom, setCustom] = useState({ from: today, to: today });

  const range = period === "custom" ? custom : periodRange(period, today);
  const validRange = range.from !== "" && range.to !== "" && range.from <= range.to;
  const summary = summarize(transactions, range.from, range.to);

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader title="Reports" tone="night">
        Totals for completed transactions only. Amounts and fees are counted
        separately. The amounts pass through your business; only the fees are
        what you earn.
      </ScreenHeader>

      <div role="group" aria-label="Period" className="rise mt-3 flex flex-wrap gap-2" style={stagger(1)}>
        {periods.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={period === key}
            onClick={() => setPeriod(key)}
            className={`pressable h-12 rounded-full px-5 font-medium ${
              period === key ? "bg-night text-night-ink" : "bg-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="rise mt-3 grid gap-4 rounded-ui bg-surface p-5 sm:grid-cols-2">
          <Field id="from" label="From">
            <input
              id="from"
              type="date"
              value={custom.from}
              onChange={(event) => setCustom((c) => ({ ...c, from: event.target.value }))}
              className="field"
            />
          </Field>
          <Field id="to" label="To">
            <input
              id="to"
              type="date"
              value={custom.to}
              onChange={(event) => setCustom((c) => ({ ...c, to: event.target.value }))}
              className="field"
            />
          </Field>
        </div>
      )}

      {!validRange ? (
        <p className="mt-3 rounded-ui bg-cash-out p-4 font-medium text-cash-out-ink">
          Choose a start date that comes before the end date.
        </p>
      ) : (
        <>
          <p className="rise mt-5 text-lead" style={stagger(2)}>
            {range.from === range.to
              ? formatDateKey(range.from)
              : `${formatDateKey(range.from)} to ${formatDateKey(range.to)}`}{" "}
            <span className="text-muted">(Philippine time)</span>
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Card tone="cash-in" order={3} title="Cash-in" count={summary.cashIn.count}>
              <Line label="Cash you received from customers" value={summary.cashIn.principalCentavos} />
              <Line label="Sent from your wallet to theirs" value={summary.cashIn.principalCentavos} />
              <Line label="Fees collected" value={summary.cashIn.feeCentavos} />
            </Card>
            <Card tone="cash-out" order={4} title="Cash-out" count={summary.cashOut.count}>
              <Line label="Received in your wallet" value={summary.cashOut.principalCentavos} />
              <Line label="Cash you handed out" value={summary.cashOut.principalCentavos} />
              <Line label="Fees collected" value={summary.cashOut.feeCentavos} />
            </Card>
          </div>

          <section
            className={`rise mt-3 rounded-ui p-6 sm:p-8 ${tones.night}`}
            style={stagger(5)}
          >
            <h2 className="text-lead font-medium">Fees earned</h2>
            <p className="mt-2 text-head font-medium">{formatPesos(summary.feeRevenueCentavos)}</p>
            <p className="mt-2 text-night-ink/80">
              {formatPesos(summary.cashIn.feeCentavos)} from cash-ins and{" "}
              {formatPesos(summary.cashOut.feeCentavos)} from cash-outs.
            </p>
          </section>

          {summary.pendingCount > 0 && (
            <p className="rise mt-3 rounded-ui bg-pending p-4 text-pending-ink" style={stagger(6)}>
              {summary.pendingCount === 1
                ? "1 pending cash-out from this period isn't counted."
                : `${summary.pendingCount} pending cash-outs from this period aren't counted.`}{" "}
              They&apos;re added once completed.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Card({
  tone,
  order,
  title,
  count,
  children,
}: {
  tone: Tone;
  order: number;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className={`rise rounded-ui p-6 sm:p-8 ${tones[tone]}`} style={stagger(order)}>
      <h2 className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="text-head font-medium">{title}</span>
        <span className="text-lead">{count === 1 ? "1 completed" : `${count} completed`}</span>
      </h2>
      <dl className="mt-5 space-y-2">{children}</dl>
    </section>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4">
      <dt>{label}</dt>
      <dd className="font-medium">{formatPesos(value)}</dd>
    </div>
  );
}
