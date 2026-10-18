/**
 * The shape of a CICO record and the rules for completing one. These are
 * plain functions so the demo and the future database version share them.
 */

export type TransactionType = "cash_in" | "cash_out";
export type TransactionStatus = "pending" | "completed";

export type Receipt = {
  /** Where to show the photo: a data URL (demo) or a private, short-lived link. */
  imageUrl: string | null;
  uploadedBy: "operator" | "sender";
  uploadedAt: string;
  /** What the remote sender typed, kept apart from what the operator saved. */
  senderNote: { name: string; reference: string } | null;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;

  principalCentavos: number;
  /** The fee applied when the record was created. Never recalculated. */
  feeCentavos: number;
  feeRange: { fromCentavos: number; upToCentavos: number };

  /** Text, so leading zeroes and every character are kept. */
  referenceNumber: string;
  /** Cash-in: the operator. Cash-out: whoever sent money to the operator. */
  senderName: string;
  /** Cash-in: the wallet owner. Cash-out: whoever collects the cash. */
  receiverName: string;
  /** Date and time of the wallet transfer (from the receipt or wallet history). */
  transferredAt: string | null;

  receipt: Receipt | null;
  /** Only for pending cash-outs with a separate sender. */
  uploadToken: string | null;

  /** Set only when the operator confirmed the money in their own wallet. */
  fundsVerifiedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

/** How references are compared: spaces ignored, letters in any case. */
export function referenceKey(reference: string): string {
  return reference.replace(/\s+/g, "").toUpperCase();
}

/** Another cash-out already holding this transfer reference, if any. */
export function findReferenceConflict(
  transactions: Transaction[],
  reference: string,
  excludeId?: string,
): Transaction | undefined {
  const key = referenceKey(reference);
  if (!key) return undefined;
  return transactions.find(
    (t) =>
      t.type === "cash_out" &&
      t.id !== excludeId &&
      t.referenceNumber !== "" &&
      referenceKey(t.referenceNumber) === key,
  );
}

export type CompletionInput = {
  referenceNumber: string;
  senderName: string;
  receiverName: string;
  transferredAt: string | null;
  fundsVerified: boolean;
  cashReleased: boolean;
};

/** Everything that must be true before a cash-out can be marked completed. */
export function completionProblems(
  transaction: Transaction,
  input: CompletionInput,
  all: Transaction[],
): string[] {
  const problems: string[] = [];

  if (transaction.type !== "cash_out") problems.push("Only cash-outs can be completed here.");
  if (transaction.status !== "pending") {
    problems.push("This cash-out is already completed. It can't be paid out twice.");
    return problems;
  }
  if (!input.referenceNumber.trim()) problems.push("Enter the reference number of the transfer.");
  if (!input.senderName.trim()) problems.push("Enter the sender's name.");
  if (!input.receiverName.trim()) problems.push("Enter the name of the person collecting the cash.");
  if (!input.transferredAt) problems.push("Enter the date and time of the transfer.");
  if (!input.fundsVerified) {
    problems.push("Confirm you found the money in your own wallet history.");
  }
  if (!input.cashReleased) {
    problems.push("Confirm you collected the fee and handed over the full cash amount.");
  }

  const conflict = findReferenceConflict(all, input.referenceNumber, transaction.id);
  if (conflict) {
    problems.push(
      `Reference ${conflict.referenceNumber} is already recorded on another cash-out. Check your wallet history: each transfer can only be paid out once.`,
    );
  }

  return problems;
}
