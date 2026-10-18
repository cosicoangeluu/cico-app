import { describe, expect, it } from "vitest";
import {
  completionProblems,
  findReferenceConflict,
  referenceKey,
  type CompletionInput,
  type Transaction,
} from "./transactions";

function cashOut(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "a",
    type: "cash_out",
    status: "pending",
    principalCentavos: 100000,
    feeCentavos: 1000,
    feeRange: { fromCentavos: 1, upToCentavos: 100000 },
    referenceNumber: "",
    senderName: "",
    receiverName: "Ana",
    transferredAt: null,
    receipt: null,
    uploadToken: null,
    fundsVerifiedAt: null,
    completedAt: null,
    createdAt: "2026-10-18T02:00:00.000Z",
    ...overrides,
  };
}

const ready: CompletionInput = {
  referenceNumber: "0012 3456",
  senderName: "Ben",
  receiverName: "Ana",
  transferredAt: "2026-10-18T02:05:00.000Z",
  fundsVerified: true,
  cashReleased: true,
};

describe("referenceKey", () => {
  it("keeps leading zeroes and ignores spaces and case", () => {
    expect(referenceKey(" 0012 3456 ")).toBe("00123456");
    expect(referenceKey("ab12")).toBe("AB12");
  });
});

describe("findReferenceConflict", () => {
  const used = cashOut({ id: "b", status: "completed", referenceNumber: "00123456" });

  it("finds a cash-out already holding the reference", () => {
    expect(findReferenceConflict([used], "0012 3456")?.id).toBe("b");
  });

  it("does not treat a different number as a match", () => {
    expect(findReferenceConflict([used], "123456")).toBeUndefined();
  });

  it("ignores the record being completed itself", () => {
    expect(findReferenceConflict([used], "00123456", "b")).toBeUndefined();
  });
});

describe("completionProblems", () => {
  it("allows a verified, paid-out cash-out", () => {
    const t = cashOut();
    expect(completionProblems(t, ready, [t])).toEqual([]);
  });

  it("refuses to complete the same cash-out twice", () => {
    const t = cashOut({ status: "completed", completedAt: "2026-10-18T03:00:00.000Z" });
    expect(completionProblems(t, ready, [t])[0]).toMatch(/already completed/);
  });

  it("refuses when funds were not verified in the wallet", () => {
    const t = cashOut();
    const problems = completionProblems(t, { ...ready, fundsVerified: false }, [t]);
    expect(problems.join(" ")).toMatch(/wallet history/);
  });

  it("refuses a reference already paid out on another cash-out", () => {
    const t = cashOut();
    const other = cashOut({ id: "b", status: "completed", referenceNumber: "00123456" });
    const problems = completionProblems(t, ready, [t, other]);
    expect(problems.join(" ")).toMatch(/already recorded on another cash-out/);
  });
});
