import { manilaDateKey } from "@/lib/time";
import type { Transaction, TransactionType } from "./transactions";

export type TypeTotals = {
  count: number;
  principalCentavos: number;
  feeCentavos: number;
};

export type ReportSummary = {
  cashIn: TypeTotals;
  cashOut: TypeTotals;
  feeRevenueCentavos: number;
  /** Pending cash-outs created in the period; never part of the totals. */
  pendingCount: number;
};

const empty = (): TypeTotals => ({ count: 0, principalCentavos: 0, feeCentavos: 0 });

/**
 * Totals for completed transactions whose completion falls on a Manila
 * calendar day from `from` to `to` (inclusive, "YYYY-MM-DD"). Principal and
 * fees are kept apart; pending records are only counted, never added up.
 */
export function summarize(
  transactions: Transaction[],
  from: string,
  to: string,
): ReportSummary {
  const totals: Record<TransactionType, TypeTotals> = {
    cash_in: empty(),
    cash_out: empty(),
  };
  let pendingCount = 0;

  for (const t of transactions) {
    if (t.status === "pending") {
      const day = manilaDateKey(t.createdAt);
      if (day >= from && day <= to) pendingCount += 1;
      continue;
    }
    if (!t.completedAt) continue;
    const day = manilaDateKey(t.completedAt);
    if (day < from || day > to) continue;

    const bucket = totals[t.type];
    bucket.count += 1;
    bucket.principalCentavos += t.principalCentavos;
    bucket.feeCentavos += t.feeCentavos;
  }

  return {
    cashIn: totals.cash_in,
    cashOut: totals.cash_out,
    feeRevenueCentavos: totals.cash_in.feeCentavos + totals.cash_out.feeCentavos,
    pendingCount,
  };
}
