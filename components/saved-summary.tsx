import Link from "next/link";
import { CircleCheck } from "lucide-react";
import type { Transaction } from "@/lib/cico/transactions";
import { formatPesos } from "@/lib/money";
import { formatManilaDateTime } from "@/lib/time";
import { stagger } from "@/components/stagger";
import { buttonClass } from "@/components/ui";
import { tones } from "@/components/tones";

/** The screen after saving: what was recorded, and where to go next. */
export function SavedSummary({
  transaction,
  title,
  onAnother,
  anotherLabel,
  next,
}: {
  transaction: Transaction;
  title: string;
  onAnother: () => void;
  anotherLabel: string;
  next?: { href: string; label: string };
}) {
  const tone =
    transaction.status === "pending"
      ? "pending"
      : transaction.type === "cash_in"
        ? "cash-in"
        : "cash-out";

  const rows: [string, string][] = [
    ["Amount", formatPesos(transaction.principalCentavos)],
    ["Fee (paid separately)", formatPesos(transaction.feeCentavos)],
    ["Reference number", transaction.referenceNumber || "Not entered yet"],
    [transaction.type === "cash_in" ? "Customer" : "Collecting cash", transaction.receiverName],
  ];
  if (transaction.type === "cash_out" && transaction.senderName) {
    rows.push(["Sent by", transaction.senderName]);
  }
  rows.push(["Recorded", formatManilaDateTime(transaction.createdAt)]);

  return (
    <div className="mx-auto max-w-3xl">
      <section className={`rise rounded-ui p-6 sm:p-10 ${tones[tone]}`}>
        <CircleCheck aria-hidden className="size-14" strokeWidth={1.5} />
        <h1 className="mt-4 text-head font-medium">{title}</h1>
        <dl className="mt-6 space-y-2 text-lead">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-wrap justify-between gap-x-6">
              <dt>{label}</dt>
              <dd className="font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="rise mt-3 flex flex-wrap gap-3" style={stagger(1)}>
        {next && (
          <Link href={next.href} className={buttonClass("pending")}>
            {next.label}
          </Link>
        )}
        <button type="button" onClick={onAnother} className={buttonClass("night")}>
          {anotherLabel}
        </button>
        <Link href="/history" className={buttonClass("surface")}>
          See history
        </Link>
      </div>
    </div>
  );
}
