"use client";

import { useSyncExternalStore } from "react";
import { findFee, type FeeTier } from "@/lib/cico/fees";
import {
  completionProblems,
  findReferenceConflict,
  type CompletionInput,
  type Receipt,
  type Transaction,
} from "@/lib/cico/transactions";

/**
 * DEMO ONLY: CICO's records kept in this browser's localStorage, so the
 * whole process can be tried before the database exists. Nothing here
 * leaves the browser. The rules come from lib/cico, which the database
 * version will reuse.
 */

const STORAGE_KEY = "cico-demo-v1";

export type DemoData = {
  loaded: boolean;
  feeTiers: FeeTier[];
  feeTiersSavedAt: string | null;
  transactions: Transaction[];
};

const EMPTY: DemoData = {
  loaded: false,
  feeTiers: [],
  feeTiersSavedAt: null,
  transactions: [],
};

let cachedRaw: string | null | undefined;
let cachedData: DemoData = EMPTY;

function read(): DemoData {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private window): behave as an empty demo.
  }
  if (raw === cachedRaw) return cachedData;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Omit<DemoData, "loaded">) : null;
    cachedData = {
      loaded: true,
      feeTiers: parsed?.feeTiers ?? [],
      feeTiersSavedAt: parsed?.feeTiersSavedAt ?? null,
      transactions: parsed?.transactions ?? [],
    };
  } catch {
    cachedData = { ...EMPTY, loaded: true };
  }
  return cachedData;
}

const listeners = new Set<() => void>();

function write(data: DemoData): Result<null> {
  const stored = {
    feeTiers: data.feeTiers,
    feeTiersSavedAt: data.feeTiersSavedAt,
    transactions: data.transactions,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    return {
      ok: false,
      error:
        "This browser's demo storage is full. Use \"Reset demo data\" to clear it, or try a smaller receipt photo.",
    };
  }
  listeners.forEach((listener) => listener());
  return { ok: true, value: null };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab (such as the sender's upload page) changed the data.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDemoData(): DemoData {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function randomId(length = 16) {
  // getRandomValues also works on plain-http addresses such as a phone on the LAN.
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function saveFeeTiers(tiers: FeeTier[]): Result<null> {
  const data = read();
  return write({
    ...data,
    feeTiers: [...tiers].sort((a, b) => a.upToCentavos - b.upToCentavos),
    feeTiersSavedAt: new Date().toISOString(),
  });
}

type NewTransaction = {
  type: Transaction["type"];
  principalCentavos: number;
  referenceNumber: string;
  senderName: string;
  receiverName: string;
  transferredAt: string | null;
  receipt: Receipt | null;
} & (
  | { complete: true; fundsVerified: boolean; cashReleased: boolean }
  | { complete: false; withUploadLink: boolean }
);

/** Records a transaction with the fee from the current fee rules. */
export function createTransaction(input: NewTransaction): Result<Transaction> {
  const data = read();
  const match = findFee(data.feeTiers, input.principalCentavos);
  if (!match.ok) {
    return { ok: false, error: "No fee rule covers this amount. Add one in Fee rules first." };
  }

  if (input.type === "cash_out" && input.referenceNumber.trim()) {
    const conflict = findReferenceConflict(data.transactions, input.referenceNumber);
    if (conflict) {
      return {
        ok: false,
        error: `Reference ${conflict.referenceNumber} is already recorded on another cash-out. Each transfer can only be paid out once.`,
      };
    }
  }

  const now = new Date().toISOString();
  const draft: Transaction = {
    id: randomId(),
    type: input.type,
    status: "pending",
    principalCentavos: input.principalCentavos,
    feeCentavos: match.range.feeCentavos,
    feeRange: {
      fromCentavos: match.range.fromCentavos,
      upToCentavos: match.range.upToCentavos,
    },
    referenceNumber: input.referenceNumber.trim(),
    senderName: input.senderName.trim(),
    receiverName: input.receiverName.trim(),
    transferredAt: input.transferredAt,
    receipt: input.receipt,
    uploadToken: !input.complete && input.withUploadLink ? randomId(24) : null,
    fundsVerifiedAt: null,
    completedAt: null,
    createdAt: now,
  };

  let transaction = draft;
  if (input.complete) {
    if (input.type === "cash_out") {
      const problems = completionProblems(
        draft,
        {
          referenceNumber: draft.referenceNumber,
          senderName: draft.senderName,
          receiverName: draft.receiverName,
          transferredAt: draft.transferredAt,
          fundsVerified: input.fundsVerified,
          cashReleased: input.cashReleased,
        },
        data.transactions,
      );
      if (problems.length > 0) return { ok: false, error: problems[0] };
    }
    transaction = {
      ...draft,
      status: "completed",
      fundsVerifiedAt: input.type === "cash_out" ? now : null,
      completedAt: now,
    };
  }

  const saved = write({ ...data, transactions: [transaction, ...data.transactions] });
  return saved.ok ? { ok: true, value: transaction } : saved;
}

/** Marks a pending cash-out completed, re-checking every rule against fresh data. */
export function completeCashOut(
  id: string,
  input: CompletionInput,
  receipt: Receipt | null,
): Result<Transaction> {
  const data = read();
  const transaction = data.transactions.find((t) => t.id === id);
  if (!transaction) return { ok: false, error: "This cash-out no longer exists." };

  const problems = completionProblems(transaction, input, data.transactions);
  if (problems.length > 0) return { ok: false, error: problems[0] };

  const now = new Date().toISOString();
  const completed: Transaction = {
    ...transaction,
    status: "completed",
    referenceNumber: input.referenceNumber.trim(),
    senderName: input.senderName.trim(),
    receiverName: input.receiverName.trim(),
    transferredAt: input.transferredAt,
    receipt: receipt ?? transaction.receipt,
    uploadToken: null, // the upload link stops working once completed
    fundsVerifiedAt: now,
    completedAt: now,
  };

  const saved = write({
    ...data,
    transactions: data.transactions.map((t) => (t.id === id ? completed : t)),
  });
  return saved.ok ? { ok: true, value: completed } : saved;
}

/** Keeps a receipt the operator attached to a pending cash-out. */
export function attachOperatorReceipt(id: string, receipt: Receipt | null): Result<null> {
  const data = read();
  return write({
    ...data,
    transactions: data.transactions.map((t) =>
      t.id === id && t.status === "pending" ? { ...t, receipt } : t,
    ),
  });
}

/** What the public upload page may know about a request: as little as possible. */
export type UploadRequest = { amountCentavos: number; receiverFirstName: string };

export function findUploadRequest(token: string): UploadRequest | null {
  const transaction = read().transactions.find(
    (t) => t.uploadToken === token && t.status === "pending",
  );
  if (!transaction) return null;
  return {
    amountCentavos: transaction.principalCentavos,
    receiverFirstName: transaction.receiverName.split(/\s+/)[0] ?? "",
  };
}

/**
 * The remote sender's upload. It only attaches the receipt to its one pending
 * request. It never verifies funds or completes anything.
 */
export function submitSenderReceipt(
  token: string,
  upload: { imageUrl: string; name: string; reference: string },
): Result<null> {
  const data = read();
  const transaction = data.transactions.find(
    (t) => t.uploadToken === token && t.status === "pending",
  );
  if (!transaction) return { ok: false, error: "This link is no longer active." };

  const receipt: Receipt = {
    imageUrl: upload.imageUrl,
    uploadedBy: "sender",
    uploadedAt: new Date().toISOString(),
    senderNote: { name: upload.name.trim(), reference: upload.reference.trim() },
  };
  return write({
    ...data,
    transactions: data.transactions.map((t) =>
      t.id === transaction.id ? { ...t, receipt } : t,
    ),
  });
}

export function resetDemo() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored.
  }
  listeners.forEach((listener) => listener());
}
