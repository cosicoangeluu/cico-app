"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { findFee } from "@/lib/cico/fees";
import type { Transaction } from "@/lib/cico/transactions";
import { formatPesos } from "@/lib/money";
import { cico, useCicoData } from "@/lib/data";
import { FeeBreakdown } from "@/components/fee-breakdown";
import { MoneyInput, useMoney } from "@/components/money-input";
import { ReceiptPicker } from "@/components/receipt-picker";
import { SavedSummary } from "@/components/saved-summary";
import {
  ReferenceInput,
  TransferTimeFields,
  useTransferTime,
} from "@/components/transfer-fields";
import { buttonClass, CheckRow, Field, Panel, Problem, ScreenHeader } from "@/components/ui";

export function CashInForm() {
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState<Transaction | null>(null);

  if (saved) {
    return (
      <SavedSummary
        transaction={saved}
        title="Cash-in saved"
        anotherLabel="Record another cash-in"
        onAnother={() => {
          setSaved(null);
          setFormKey((key) => key + 1);
        }}
      />
    );
  }
  return <CashInSteps key={formKey} onSaved={setSaved} />;
}

function CashInSteps({ onSaved }: { onSaved: (t: Transaction) => void }) {
  const data = useCicoData();
  const amount = useMoney();
  const [image, setImage] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [scannedReference, setScannedReference] = useState<string | null>(null);
  const [customer, setCustomer] = useState("");
  const [scannedCustomer, setScannedCustomer] = useState<string | null>(null);
  const when = useTransferTime();
  const [paid, setPaid] = useState(false);
  const [sent, setSent] = useState(false);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const match = amount.centavos !== null ? findFee(data.feeTiers, amount.centavos) : null;
  const fee = match?.ok ? match.range.feeCentavos : null;

  const missing = {
    reference: !reference.trim() ? "Enter the reference number of your transfer." : null,
    customer: !customer.trim() ? "Enter the name of the wallet owner." : null,
  };

  async function save() {
    setTried(true);
    setError(null);
    if (saving || amount.centavos === null || fee === null) return;
    if (missing.reference || missing.customer || !when.iso) return;
    if (!paid || !sent) {
      setError("Tick both boxes once the customer has paid and your transfer went through.");
      return;
    }

    setSaving(true);
    const result = await cico.createCashIn({
      principalCentavos: amount.centavos,
      referenceNumber: reference,
      customerName: customer,
      transferredAt: when.iso,
      receiptImage: image,
      customerPaid: paid,
      transferSent: sent,
    });
    setSaving(false);
    if (result.ok) onSaved(result.value);
    else setError(result.error);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader title="Cash-in" tone="cash-in">
        The customer gives you cash and pays a separate fee. You send the full
        amount to their wallet.
      </ScreenHeader>

      <Panel title="How much does the customer want to send?" order={1}>
        <Field id="amount" label="Amount" error={amount.error}>
          <MoneyInput
            id="amount"
            large
            autoFocus
            value={amount.text}
            onChange={amount.set}
            invalid={Boolean(amount.error)}
          />
        </Field>
        {amount.centavos !== null && match && (
          <div className="mt-4">
            <FeeBreakdown type="cash_in" principalCentavos={amount.centavos} match={match} />
          </div>
        )}
        {tried && amount.centavos === null && !amount.error && (
          <p className="mt-3 font-medium text-danger">Enter the amount first.</p>
        )}
      </Panel>

      {fee !== null && amount.centavos !== null && (
        <>
          <Panel title="Receipt of your transfer" order={2}>
            <div className="grid gap-6 lg:grid-cols-2">
              <ReceiptPicker
                image={image}
                onChange={setImage}
                expectedCentavos={amount.centavos}
                onScan={(reading) => {
                  if (reading.reference && !reference.trim()) {
                    setReference(reading.reference);
                    setScannedReference(reading.reference);
                  }
                  // The receipt of a cash-in shows who received it: the customer.
                  if (reading.name && !customer.trim()) {
                    setCustomer(reading.name);
                    setScannedCustomer(reading.name);
                  }
                  when.fillScanned(reading.date, reading.time);
                }}
              />
              <div className="space-y-5">
                <Field
                  id="reference"
                  label="Reference number"
                  hint={
                    reference && reference === scannedReference
                      ? "Read from the photo. Check every digit before you save."
                      : "Type it exactly, including any zeroes at the start."
                  }
                  error={tried ? missing.reference : null}
                >
                  <ReferenceInput
                    id="reference"
                    value={reference}
                    onChange={setReference}
                    invalid={tried && Boolean(missing.reference)}
                  />
                </Field>
                <Field
                  id="customer"
                  label="Customer (wallet owner)"
                  hint={
                    customer && customer === scannedCustomer
                      ? "Read from the photo. The dots hide letters: type the full name if you know it."
                      : undefined
                  }
                  error={tried ? missing.customer : null}
                >
                  <input
                    id="customer"
                    type="text"
                    autoComplete="off"
                    value={customer}
                    onChange={(event) => setCustomer(event.target.value)}
                    className="field"
                  />
                </Field>
                <TransferTimeFields idPrefix="sent" value={when} showError={tried} />
              </div>
            </div>
          </Panel>

          <Panel title="Before you save" order={3}>
            <div className="space-y-3">
              <CheckRow checked={paid} onChange={setPaid}>
                The customer paid me {formatPesos(amount.centavos)} plus the{" "}
                {formatPesos(fee)} fee.
              </CheckRow>
              <CheckRow checked={sent} onChange={setSent}>
                I sent the full {formatPesos(amount.centavos)} to the
                customer&apos;s wallet and the transfer went through.
              </CheckRow>
            </div>
            <div className="mt-5 space-y-4" aria-live="polite">
              {error && <Problem>{error}</Problem>}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className={buttonClass("cash-in", "w-full sm:w-auto")}
              >
                {saving && <LoaderCircle aria-hidden className="spin size-5" />}
                {saving ? "Saving…" : "Save cash-in"}
              </button>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
