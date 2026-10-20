"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { findFee } from "@/lib/cico/fees";
import { findReferenceConflict, type Transaction } from "@/lib/cico/transactions";
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

export function CashOutForm() {
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState<Transaction | null>(null);

  if (saved) {
    const pending = saved.status === "pending";
    return (
      <SavedSummary
        transaction={saved}
        title={pending ? "Saved as pending" : "Cash-out completed"}
        anotherLabel="Record another cash-out"
        next={pending ? { href: `/pending/${saved.id}`, label: "Open this pending cash-out" } : undefined}
        onAnother={() => {
          setSaved(null);
          setFormKey((key) => key + 1);
        }}
      />
    );
  }
  return <CashOutSteps key={formKey} onSaved={setSaved} />;
}

/** One of two big choices, shown as a card the whole width of a thumb. */
function Choice({
  name,
  checked,
  onSelect,
  title,
  detail,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`pressable flex cursor-pointer items-start gap-4 rounded-ui p-5 ${
        checked ? "bg-night text-night-ink" : "bg-field"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-1 size-5 shrink-0 accent-[#18bc42]"
      />
      <span>
        <span className="block font-medium">{title}</span>
        <span className={`block text-small ${checked ? "text-night-ink/80" : "text-muted"}`}>
          {detail}
        </span>
      </span>
    </label>
  );
}

function CashOutSteps({ onSaved }: { onSaved: (t: Transaction) => void }) {
  const data = useCicoData();
  const amount = useMoney();
  const [separateSender, setSeparateSender] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [sender, setSender] = useState("");
  const [arrived, setArrived] = useState<boolean | null>(null);
  const [withLink, setWithLink] = useState(true);

  const [image, setImage] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [scannedReference, setScannedReference] = useState<string | null>(null);
  const when = useTransferTime();
  const [verified, setVerified] = useState(false);
  const [released, setReleased] = useState(false);

  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const match = amount.centavos !== null ? findFee(data.feeTiers, amount.centavos) : null;
  const fee = match?.ok ? match.range.feeCentavos : null;
  const senderName = separateSender ? sender : receiver;
  const conflict = reference.trim()
    ? findReferenceConflict(data.transactions, reference)
    : undefined;

  const missing = {
    receiver: !receiver.trim()
      ? separateSender
        ? "Enter the name of the person collecting the cash."
        : "Enter the customer's name."
      : null,
    sender: separateSender && arrived && !sender.trim() ? "Enter the sender's name." : null,
    reference: arrived && !reference.trim() ? "Enter the reference number of the transfer." : null,
  };

  async function save() {
    setTried(true);
    setError(null);
    if (saving || amount.centavos === null || fee === null || arrived === null) return;
    if (missing.receiver || missing.sender || missing.reference) return;

    if (arrived) {
      if (!when.iso || conflict) return;
      if (!verified || !released) {
        setError("Tick both boxes only after you've checked your wallet and handed over the cash.");
        return;
      }
    }

    setSaving(true);
    const result = await cico.createCashOut({
      principalCentavos: amount.centavos,
      senderName,
      receiverName: receiver,
      completeNow: arrived,
      referenceNumber: arrived ? reference : "",
      transferredAt: arrived ? when.iso : null,
      receiptImage: image,
      fundsVerified: arrived && verified,
      cashReleased: arrived && released,
      withUploadLink: !arrived && separateSender && withLink,
    });
    setSaving(false);
    if (result.ok) onSaved(result.value);
    else setError(result.error);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader title="Cash-out" tone="cash-out">
        The customer sends money to your wallet. Once you&apos;ve checked it
        arrived, you collect the separate fee and hand over the cash.
      </ScreenHeader>

      <Panel title="How much cash does the customer want?" order={1}>
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
            <FeeBreakdown type="cash_out" principalCentavos={amount.centavos} match={match} />
          </div>
        )}
      </Panel>

      {fee !== null && amount.centavos !== null && (
        <>
          <Panel title="Who is sending the money?" order={2}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                name="sender"
                checked={!separateSender}
                onSelect={() => setSeparateSender(false)}
                title="The customer here"
                detail="The person collecting the cash sends it from their own wallet."
              />
              <Choice
                name="sender"
                checked={separateSender}
                onSelect={() => setSeparateSender(true)}
                title="Someone else"
                detail="Another person sends the money from somewhere else."
              />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field
                id="receiver"
                label={separateSender ? "Person collecting the cash" : "Customer name"}
                error={tried ? missing.receiver : null}
              >
                <input
                  id="receiver"
                  type="text"
                  autoComplete="off"
                  value={receiver}
                  onChange={(event) => setReceiver(event.target.value)}
                  className="field"
                />
              </Field>
              {separateSender && (
                <Field
                  id="sender-name"
                  label="Sender's name"
                  hint="Leave blank if you don't know it yet."
                  error={tried ? missing.sender : null}
                >
                  <input
                    id="sender-name"
                    type="text"
                    autoComplete="off"
                    value={sender}
                    onChange={(event) => setSender(event.target.value)}
                    className="field"
                  />
                </Field>
              )}
            </div>
          </Panel>

          <Panel title="Is the money already in your wallet?" order={3}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                name="arrived"
                checked={arrived === true}
                onSelect={() => setArrived(true)}
                title="Yes, I can see it"
                detail="Record the transfer, check it, then hand over the cash."
              />
              <Choice
                name="arrived"
                checked={arrived === false}
                onSelect={() => setArrived(false)}
                title="Not yet"
                detail="Save it as pending. Don't hand over any cash yet."
              />
            </div>
            {tried && arrived === null && (
              <p className="mt-3 font-medium text-danger">Choose one.</p>
            )}

            {arrived === false && separateSender && (
              <div className="mt-5">
                <CheckRow checked={withLink} onChange={setWithLink}>
                  Make a link the sender can use to upload their receipt.
                </CheckRow>
              </div>
            )}
          </Panel>

          {arrived === true && (
            <Panel title="The transfer you received" order={4}>
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
                    error={
                      tried && missing.reference
                        ? missing.reference
                        : conflict
                          ? `Already recorded on another cash-out (${formatPesos(conflict.principalCentavos)}, ${conflict.receiverName}). Each transfer can only be paid out once.`
                          : null
                    }
                  >
                    <ReferenceInput
                      id="reference"
                      value={reference}
                      onChange={setReference}
                      invalid={Boolean(conflict) || (tried && Boolean(missing.reference))}
                    />
                  </Field>
                  <TransferTimeFields idPrefix="received" value={when} showError={tried} />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <CheckRow checked={verified} onChange={setVerified}>
                  I found this transfer in my own wallet history. The reference
                  number and the amount ({formatPesos(amount.centavos)}) match.
                </CheckRow>
                <CheckRow checked={released} onChange={setReleased}>
                  I collected the {formatPesos(fee)} fee and gave{" "}
                  {formatPesos(amount.centavos)} cash to{" "}
                  {receiver.trim() || "the customer"}.
                </CheckRow>
              </div>
              <p className="mt-3 text-small text-muted">
                A receipt alone doesn&apos;t prove the money arrived. Always
                check your own wallet first.
              </p>
            </Panel>
          )}

          {arrived !== null && (
            <div className="mt-3 space-y-4" aria-live="polite">
              {error && <Problem>{error}</Problem>}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className={buttonClass(arrived ? "cash-out" : "pending", "w-full sm:w-auto")}
              >
                {saving && <LoaderCircle aria-hidden className="spin size-5" />}
                {saving ? "Saving…" : arrived ? "Complete cash-out" : "Save as pending"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
