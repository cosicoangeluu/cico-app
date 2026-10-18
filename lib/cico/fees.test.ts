import { describe, expect, it } from "vitest";
import { feeRanges, findFee, validateTiers, type FeeTier } from "./fees";

// Sample tiers for tests only; CICO ships with no fee rules.
const tiers: FeeTier[] = [
  { upToCentavos: 100000, feeCentavos: 2000 }, // up to 1,000 -> 20
  { upToCentavos: 50000, feeCentavos: 1000 }, // up to 500 -> 10 (entered out of order)
];

describe("feeRanges", () => {
  it("sorts rows and starts each one right after the previous limit", () => {
    expect(feeRanges(tiers)).toEqual([
      { fromCentavos: 1, upToCentavos: 50000, feeCentavos: 1000 },
      { fromCentavos: 50001, upToCentavos: 100000, feeCentavos: 2000 },
    ]);
  });
});

describe("findFee", () => {
  it.each([
    [1, 1000],
    [50000, 1000], // exactly on a limit belongs to that row
    [50001, 2000], // one centavo above moves to the next row
    [100000, 2000],
  ])("charges the matching fee at %i centavos", (amount, fee) => {
    const match = findFee(tiers, amount);
    expect(match.ok && match.range.feeCentavos).toBe(fee);
  });

  it("refuses amounts above the last limit instead of guessing", () => {
    expect(findFee(tiers, 100001)).toEqual({
      ok: false,
      reason: "above-limit",
      limitCentavos: 100000,
    });
  });

  it("refuses everything when there are no rules", () => {
    expect(findFee([], 5000)).toEqual({ ok: false, reason: "no-rules" });
  });
});

describe("validateTiers", () => {
  it("accepts a sound table", () => {
    expect(validateTiers(tiers).size).toBe(0);
  });

  it("flags rows ending at the same amount (an overlap)", () => {
    const problems = validateTiers([
      { upToCentavos: 50000, feeCentavos: 1000 },
      { upToCentavos: 50000, feeCentavos: 1500 },
    ]);
    expect(problems.get(1)).toMatch(/Row 1 already ends/);
  });

  it("flags missing limits and negative fees", () => {
    const problems = validateTiers([
      { upToCentavos: 0, feeCentavos: 1000 },
      { upToCentavos: 1000, feeCentavos: -1 },
    ]);
    expect([...problems.keys()]).toEqual([0, 1]);
  });
});
