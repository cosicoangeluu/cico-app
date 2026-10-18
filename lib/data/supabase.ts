"use client";

import { useSyncExternalStore } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import type { FeeTier } from "@/lib/cico/fees";
import type { Transaction } from "@/lib/cico/transactions";
import { getBrowserClient } from "@/lib/supabase/client";
import type { CicoData, CicoSource, Result } from "./types";

/**
 * Records in the Supabase database. Every write goes through a database
 * function that re-checks CICO's rules, so the screens can't get around them.
 */

const BUCKET = "receipts";
const SIGNED_URL_SECONDS = 60 * 60;

type Row = {
  id: string;
  type: Transaction["type"];
  status: Transaction["status"];
  principal_centavos: number;
  fee_centavos: number;
  fee_from_centavos: number;
  fee_up_to_centavos: number;
  reference_number: string;
  sender_name: string;
  receiver_name: string;
  transferred_at: string | null;
  receipt_path: string | null;
  receipt_uploaded_by: "operator" | "sender" | null;
  receipt_uploaded_at: string | null;
  sender_note_name: string | null;
  sender_note_reference: string | null;
  upload_token: string | null;
  funds_verified_at: string | null;
  completed_at: string | null;
  created_at: string;
};

const EMPTY: CicoData = {
  loaded: false,
  error: null,
  feeTiers: [],
  feeTiersSavedAt: null,
  transactions: [],
};

let state: CicoData = EMPTY;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

/** Private receipt links, reused until shortly before they expire. */
const signedUrls = new Map<string, { url: string; expiresAt: number }>();

function setState(next: CicoData) {
  state = next;
  listeners.forEach((listener) => listener());
}

function toTransaction(row: Row): Transaction {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    principalCentavos: Number(row.principal_centavos),
    feeCentavos: Number(row.fee_centavos),
    feeRange: {
      fromCentavos: Number(row.fee_from_centavos),
      upToCentavos: Number(row.fee_up_to_centavos),
    },
    referenceNumber: row.reference_number,
    senderName: row.sender_name,
    receiverName: row.receiver_name,
    transferredAt: row.transferred_at,
    receipt: row.receipt_path
      ? {
          imageUrl: signedUrls.get(row.receipt_path)?.url ?? null,
          uploadedBy: row.receipt_uploaded_by ?? "operator",
          uploadedAt: row.receipt_uploaded_at ?? row.created_at,
          senderNote:
            row.receipt_uploaded_by === "sender"
              ? { name: row.sender_note_name ?? "", reference: row.sender_note_reference ?? "" }
              : null,
        }
      : null,
    uploadToken: row.upload_token,
    fundsVerifiedAt: row.funds_verified_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

async function signReceipts(paths: string[]) {
  const soon = Date.now() + 5 * 60 * 1000;
  const needed = paths.filter((path) => (signedUrls.get(path)?.expiresAt ?? 0) < soon);
  if (needed.length === 0) return;

  const { data } = await getBrowserClient()
    .storage.from(BUCKET)
    .createSignedUrls(needed, SIGNED_URL_SECONDS);
  const expiresAt = Date.now() + SIGNED_URL_SECONDS * 1000;
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) signedUrls.set(item.path, { url: item.signedUrl, expiresAt });
  }
}

async function load() {
  const supabase = getBrowserClient();
  const [tiers, rows] = await Promise.all([
    supabase.from("fee_tiers").select("up_to_centavos, fee_centavos, created_at").order("up_to_centavos"),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }),
  ]);

  if (tiers.error || rows.error) {
    setState({
      ...state,
      loaded: true,
      error: "CICO couldn't load your records. Check your internet connection, then try again.",
    });
    return;
  }

  const records = rows.data as Row[];
  await signReceipts(records.flatMap((row) => (row.receipt_path ? [row.receipt_path] : [])));

  const feeTiers: FeeTier[] = tiers.data.map((tier) => ({
    upToCentavos: Number(tier.up_to_centavos),
    feeCentavos: Number(tier.fee_centavos),
  }));
  const savedAt = tiers.data.reduce<string | null>(
    (latest, tier) => (latest && latest > tier.created_at ? latest : tier.created_at),
    null,
  );

  setState({
    loaded: true,
    error: null,
    feeTiers,
    feeTiersSavedAt: savedAt,
    transactions: records.map(toTransaction),
  });
}

function refresh(): Promise<void> {
  loading ??= load().finally(() => {
    loading = null;
  });
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refresh();
    window.addEventListener("focus", onFocus);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("focus", onFocus);
  };
}

function onFocus() {
  void refresh();
}

/** The database's own message (CICO writes them for people), or a plain fallback. */
function failure(error: PostgrestError | Error | null): { ok: false; error: string } {
  const message = error?.message ?? "";
  const fromCico = error && "code" in error && error.code === "P0001";
  return {
    ok: false,
    error: fromCico
      ? message
      : /fetch|network/i.test(message)
        ? "CICO couldn't reach the database. Check your internet connection and try again."
        : `Something went wrong: ${message || "unknown error"}. Nothing was saved.`,
  };
}

function randomName() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Uploads a shrunk receipt photo into a folder of the private bucket. */
async function uploadImage(folder: string, dataUrl: string): Promise<Result<string>> {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${folder}/${randomName()}.jpg`;
  const { error } = await getBrowserClient()
    .storage.from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) {
    return { ok: false, error: "The receipt photo couldn't be uploaded. Check your connection and try again." };
  }
  return { ok: true, value: path };
}

async function operatorFolder(): Promise<string | null> {
  const { data } = await getBrowserClient().auth.getClaims();
  const id = data?.claims?.sub;
  return id ? `operator/${id}` : null;
}

async function uploadOperatorImage(image: string | null): Promise<Result<string | null>> {
  if (!image) return { ok: true, value: null };
  const folder = await operatorFolder();
  if (!folder) return { ok: false, error: "Please sign in again." };
  return uploadImage(folder, image);
}

async function saveRow(
  call: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
): Promise<Result<Transaction>> {
  const { data, error } = await call;
  if (error || !data) return failure(error);
  await refresh();
  const saved = state.transactions.find((t) => t.id === (data as Row).id);
  return { ok: true, value: saved ?? toTransaction(data as Row) };
}

export const supabaseSource: CicoSource = {
  useData() {
    return useSyncExternalStore(subscribe, () => state, () => EMPTY);
  },

  refresh,

  async saveFeeTiers(tiers) {
    const { error } = await getBrowserClient().rpc("save_fee_tiers", {
      tiers: tiers.map((tier) => ({
        up_to_centavos: tier.upToCentavos,
        fee_centavos: tier.feeCentavos,
      })),
    });
    if (error) return failure(error);
    await refresh();
    return { ok: true, value: null };
  },

  async createCashIn(input) {
    const photo = await uploadOperatorImage(input.receiptImage);
    if (!photo.ok) return photo;
    return saveRow(
      getBrowserClient().rpc("create_cash_in", {
        principal_centavos: input.principalCentavos,
        reference_number: input.referenceNumber,
        customer_name: input.customerName,
        transferred_at: input.transferredAt,
        receipt_path: photo.value,
        customer_paid: input.customerPaid,
        transfer_sent: input.transferSent,
      }),
    );
  },

  async createCashOut(input) {
    const photo = await uploadOperatorImage(input.receiptImage);
    if (!photo.ok) return photo;
    return saveRow(
      getBrowserClient().rpc("create_cash_out", {
        principal_centavos: input.principalCentavos,
        sender_name: input.senderName,
        receiver_name: input.receiverName,
        complete_now: input.completeNow,
        reference_number: input.referenceNumber,
        transferred_at: input.transferredAt,
        receipt_path: photo.value,
        funds_verified: input.fundsVerified,
        cash_released: input.cashReleased,
        with_upload_link: input.withUploadLink,
      }),
    );
  },

  async completeCashOut(id, input) {
    return saveRow(
      getBrowserClient().rpc("complete_cash_out", {
        transaction_id: id,
        reference_number: input.referenceNumber,
        sender_name: input.senderName,
        receiver_name: input.receiverName,
        transferred_at: input.transferredAt,
        funds_verified: input.fundsVerified,
        cash_released: input.cashReleased,
      }),
    );
  },

  async setOperatorReceipt(id, image) {
    const photo = await uploadOperatorImage(image);
    if (!photo.ok) return photo;
    const { error } = await getBrowserClient().rpc("set_operator_receipt", {
      transaction_id: id,
      receipt_path: photo.value,
    });
    if (error) return failure(error);
    await refresh();
    return { ok: true, value: null };
  },

  async getUploadRequest(token) {
    const { data, error } = await getBrowserClient().rpc("get_upload_request", { token });
    if (error) return failure(error);
    const row = (data as { amount_centavos: number; receiver_first_name: string }[])[0];
    return {
      ok: true,
      value: row
        ? { amountCentavos: Number(row.amount_centavos), receiverFirstName: row.receiver_first_name }
        : null,
    };
  },

  async submitSenderReceipt(token, upload) {
    const photo = await uploadImage(`sender/${token}`, upload.image);
    if (!photo.ok) return photo;
    const { error } = await getBrowserClient().rpc("submit_sender_receipt", {
      token,
      receipt_path: photo.value,
      sender_name: upload.name,
      sender_reference: upload.reference,
    });
    return error ? failure(error) : { ok: true, value: null };
  },
};
