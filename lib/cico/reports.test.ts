import { describe, expect, it } from "vitest";
import { summarize } from "./reports";
import type { Transaction } from "./transactions";

function record(overrides: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36),
    type: "cash_in",
    status: "completed",
    principalCentavos: 100000,
    feeCentavos: 1000,
    feeRange: { fromCentavos: 1, upToCentavos: 100000 },
    referenceNumber: "1",
    senderName: "Operator",
    receiverName: "Ana",
    transferredAt: null,
    receipt: null,
    uploadToken: null,
    fundsVerifiedAt: null,
    completedAt: "2026-10-18T02:00:00.000Z",
    createdAt: "2026-10-18T02:00:00.000Z",
    ...overrides,
  };
}

describe("summarize", () => {
  const records = [
    record({}),
    record({ type: "cash_out", principalCentavos: 50000, feeCentavos: 1500 }),
    // Pending: counted, never added to totals or fee revenue.
    record({ type: "cash_out", status: "pending", completedAt: null, principalCentavos: 999999 }),
    // 23:30 Manila on Oct 17 is 15:30 UTC: belongs to Oct 17, not Oct 18.
    record({ completedAt: "2026-10-17T15:30:00.000Z" }),
  ];

  it("keeps principal and fees apart, per type", () => {
    const summary = summarize(records, "2026-10-18", "2026-10-18");
    expect(summary.cashIn).toEqual({ count: 1, principalCentavos: 100000, feeCentavos: 1000 });
    expect(summary.cashOut).toEqual({ count: 1, principalCentavos: 50000, feeCentavos: 1500 });
    expect(summary.feeRevenueCentavos).toBe(2500);
  });

  it("leaves pending records out of the totals", () => {
    const summary = summarize(records, "2026-10-18", "2026-10-18");
    expect(summary.pendingCount).toBe(1);
    expect(summary.cashOut.principalCentavos).toBe(50000);
  });

  it("uses the Manila calendar day", () => {
    expect(summarize(records, "2026-10-17", "2026-10-17").cashIn.count).toBe(1);
  });
});
