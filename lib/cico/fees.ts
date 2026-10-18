/**
 * Fee rules: one shared table for cash-in and cash-out. Each row covers the
 * amounts above the previous row's limit, up to and including its own limit,
 * and charges a fixed fee. Because every row starts right after the one
 * before it, the table can't have gaps or overlaps. Amounts above the last
 * limit have no fee rule, and CICO refuses them instead of guessing.
 */

export type FeeTier = {
  upToCentavos: number;
  feeCentavos: number;
};

export type FeeRange = FeeTier & { fromCentavos: number };

export type FeeMatch =
  | { ok: true; range: FeeRange }
  | { ok: false; reason: "no-rules" }
  | { ok: false; reason: "above-limit"; limitCentavos: number };

/** The tiers in order, each with the first amount it covers. */
export function feeRanges(tiers: FeeTier[]): FeeRange[] {
  const sorted = [...tiers].sort((a, b) => a.upToCentavos - b.upToCentavos);
  return sorted.map((tier, index) => ({
    ...tier,
    fromCentavos: index === 0 ? 1 : sorted[index - 1].upToCentavos + 1,
  }));
}

/** The fee rule covering an amount, or why there isn't one. */
export function findFee(tiers: FeeTier[], amountCentavos: number): FeeMatch {
  const ranges = feeRanges(tiers);
  if (ranges.length === 0) return { ok: false, reason: "no-rules" };

  const range = ranges.find(
    (r) => amountCentavos >= r.fromCentavos && amountCentavos <= r.upToCentavos,
  );
  if (range) return { ok: true, range };

  return {
    ok: false,
    reason: "above-limit",
    limitCentavos: ranges[ranges.length - 1].upToCentavos,
  };
}

/** Problems that stop a fee table from being saved, keyed by row index. */
export function validateTiers(tiers: FeeTier[]): Map<number, string> {
  const problems = new Map<number, string>();

  tiers.forEach((tier, index) => {
    if (!Number.isSafeInteger(tier.upToCentavos) || tier.upToCentavos <= 0) {
      problems.set(index, "Enter the highest amount this row covers.");
    } else if (!Number.isSafeInteger(tier.feeCentavos) || tier.feeCentavos < 0) {
      problems.set(index, "Enter the fee for this row (0 if free).");
    }
  });

  const seen = new Map<number, number>();
  tiers.forEach((tier, index) => {
    if (problems.has(index)) return;
    const earlier = seen.get(tier.upToCentavos);
    if (earlier !== undefined) {
      problems.set(index, `Row ${earlier + 1} already ends at this amount.`);
    } else {
      seen.set(tier.upToCentavos, index);
    }
  });

  return problems;
}
