import Link from "next/link";
import type { FeeMatch } from "@/lib/cico/fees";
import type { TransactionType } from "@/lib/cico/transactions";
import { formatPesos } from "@/lib/money";
import { Problem } from "@/components/ui";

/**
 * What the operator tells the customer: the amount, the separate fee, and
 * what changes hands. The fee is never taken out of the amount.
 */
export function FeeBreakdown({
  type,
  principalCentavos,
  match,
}: {
  type: TransactionType;
  principalCentavos: number;
  match: FeeMatch;
}) {
  if (!match.ok) {
    return (
      <Problem>
        {match.reason === "no-rules" ? (
          <>There are no fee rules yet, so CICO can&apos;t work out the fee. </>
        ) : (
          <>
            The fee rules only go up to {formatPesos(match.limitCentavos)}, so
            there&apos;s no fee for this amount.{" "}
          </>
        )}
        <Link href="/fees" className="underline underline-offset-4">
          Open Fee rules
        </Link>
      </Problem>
    );
  }

  const fee = match.range.feeCentavos;
  const rows =
    type === "cash_in"
      ? [
          ["Customer gives you", `${formatPesos(principalCentavos)} cash + ${formatPesos(fee)} fee`],
          ["Customer pays in total", formatPesos(principalCentavos + fee)],
          ["You send to their wallet", formatPesos(principalCentavos)],
        ]
      : [
          ["Customer sends to your wallet", formatPesos(principalCentavos)],
          ["Customer pays you the fee", formatPesos(fee)],
          ["You give the customer", `${formatPesos(principalCentavos)} cash`],
        ];

  return (
    <div className="rise rounded-ui bg-night p-5 text-night-ink sm:p-6">
      <p className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span>Fee</span>
        <span className="text-head font-medium">{formatPesos(fee)}</span>
      </p>
      <p className="text-small text-night-ink/70">
        For amounts {formatPesos(match.range.fromCentavos)} to{" "}
        {formatPesos(match.range.upToCentavos)}. Paid separately.
      </p>
      <dl className="mt-5 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-x-4">
            <dt className="text-night-ink/80">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
