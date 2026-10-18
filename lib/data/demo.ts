"use client";

import type { Receipt } from "@/lib/cico/transactions";
import * as store from "@/lib/demo/store";
import type { CicoSource } from "./types";

/** DEMO ONLY: the browser-storage source, wrapped in the shared shape. */

const operatorReceipt = (image: string | null): Receipt | null =>
  image
    ? { imageUrl: image, uploadedBy: "operator", uploadedAt: new Date().toISOString(), senderNote: null }
    : null;

export const demoSource: CicoSource = {
  useData() {
    return { ...store.useDemoData(), error: null };
  },

  async refresh() {
    // Demo data is always current; other tabs update it through storage events.
  },

  async saveFeeTiers(tiers) {
    return store.saveFeeTiers(tiers);
  },

  async createCashIn(input) {
    if (!input.customerPaid || !input.transferSent) {
      return { ok: false, error: "Confirm the customer paid and your transfer went through." };
    }
    return store.createTransaction({
      type: "cash_in",
      principalCentavos: input.principalCentavos,
      referenceNumber: input.referenceNumber,
      senderName: "Operator",
      receiverName: input.customerName,
      transferredAt: input.transferredAt,
      receipt: operatorReceipt(input.receiptImage),
      complete: true,
      fundsVerified: false,
      cashReleased: false,
    });
  },

  async createCashOut(input) {
    const common = {
      type: "cash_out" as const,
      principalCentavos: input.principalCentavos,
      senderName: input.senderName,
      receiverName: input.receiverName,
      receipt: operatorReceipt(input.receiptImage),
    };
    return input.completeNow
      ? store.createTransaction({
          ...common,
          referenceNumber: input.referenceNumber,
          transferredAt: input.transferredAt,
          complete: true,
          fundsVerified: input.fundsVerified,
          cashReleased: input.cashReleased,
        })
      : store.createTransaction({
          ...common,
          referenceNumber: "",
          transferredAt: null,
          complete: false,
          withUploadLink: input.withUploadLink,
        });
  },

  async completeCashOut(id, input) {
    return store.completeCashOut(id, input, null);
  },

  async setOperatorReceipt(id, image) {
    return store.attachOperatorReceipt(id, operatorReceipt(image));
  },

  async getUploadRequest(token) {
    return { ok: true, value: store.findUploadRequest(token) };
  },

  async submitSenderReceipt(token, upload) {
    return store.submitSenderReceipt(token, {
      imageUrl: upload.image,
      name: upload.name,
      reference: upload.reference,
    });
  },
};
