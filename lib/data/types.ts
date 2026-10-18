import type { FeeTier } from "@/lib/cico/fees";
import type { CompletionInput, Transaction } from "@/lib/cico/transactions";

/**
 * What every CICO screen reads and does, whoever stores the records: the
 * browser (demo mode) or the Supabase database.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type CicoData = {
  loaded: boolean;
  /** Set when records couldn't be loaded (offline, signed out, …). */
  error: string | null;
  feeTiers: FeeTier[];
  feeTiersSavedAt: string | null;
  transactions: Transaction[];
};

export type CashInInput = {
  principalCentavos: number;
  referenceNumber: string;
  customerName: string;
  transferredAt: string | null;
  /** A shrunk JPEG as a data URL, or null for manual entry without a photo. */
  receiptImage: string | null;
  customerPaid: boolean;
  transferSent: boolean;
};

export type CashOutInput = {
  principalCentavos: number;
  senderName: string;
  receiverName: string;
  completeNow: boolean;
  referenceNumber: string;
  transferredAt: string | null;
  receiptImage: string | null;
  fundsVerified: boolean;
  cashReleased: boolean;
  withUploadLink: boolean;
};

/** What the public upload page may know about a request: as little as possible. */
export type UploadRequest = { amountCentavos: number; receiverFirstName: string };

export type SenderUpload = { image: string; name: string; reference: string };

export type CicoSource = {
  useData(): CicoData;
  refresh(): Promise<void>;
  saveFeeTiers(tiers: FeeTier[]): Promise<Result<null>>;
  createCashIn(input: CashInInput): Promise<Result<Transaction>>;
  createCashOut(input: CashOutInput): Promise<Result<Transaction>>;
  completeCashOut(id: string, input: CompletionInput): Promise<Result<Transaction>>;
  setOperatorReceipt(id: string, image: string | null): Promise<Result<null>>;
  getUploadRequest(token: string): Promise<Result<UploadRequest | null>>;
  submitSenderReceipt(token: string, upload: SenderUpload): Promise<Result<null>>;
};
