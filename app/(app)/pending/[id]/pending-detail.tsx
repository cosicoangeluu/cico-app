"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, LoaderCircle } from "lucide-react";
import { findReferenceConflict, type Transaction } from "@/lib/cico/transactions";
import { formatPesos } from "@/lib/money";
import { formatManilaDateTime } from "@/lib/time";
import { cico, useAutoRefresh, useCicoData } from "@/lib/data";
import { demoAvailable } from "@/lib/demo/mode";
import { ReceiptPicker } from "@/components/receipt-picker";
import { SavedSummary } from "@/components/saved-summary";
import {
  ReferenceInput,
  TransferTimeFields,
  useTransferTime,
} from "@/components/transfer-fields";
import { buttonClass, CheckRow, Field, Panel, Problem, ScreenHeader } from "@/components/ui";

export function PendingDetail({ id }: { id: string }) {
  const router = useRouter();
  const { transactions } = useCicoData();
  useAutoRefresh();
  const transaction = transactions.find((t) => t.id === id);
  const [justCompleted, setJustCompleted] = useState<Transaction | null>(null);

  if (justCompleted) {
    return (
      <SavedSummary
        transaction={justCompleted}
        title="Cash-out completed"
        anotherLabel="Back to pending"
        onAnother={() => router.push("/pending")}
      />
    );
  }

  if (!transaction) {
    return (
      <div className="mx-auto max-w-5xl">
        <ScreenHeader title="Not found" tone="surface">
          This cash-out wasn&apos;t found. Check the link, or open it from the
          Pending list.
        </ScreenHeader>
        <Link href="/pending" className={buttonClass("night", "mt-3")}>
          Back to pending
        </Link>
      </div>
    );
  }

  if (transaction.status === "completed") {
    return (
      <div className="mx-auto max-w-5xl">
        <ScreenHeader title="Already completed" tone="cash-out">
          This cash-out was completed on{" "}
          {formatManilaDateTime(transaction.completedAt ?? transaction.createdAt)}.
          It can&apos;t be paid out again.
        </ScreenHeader>
        <Link href="/history" className={buttonClass("night", "mt-3")}>
          See history
        </Link>
      </div>
    );
  }

  return <PendingWork transaction={transaction} all={transactions} onCompleted={setJustCompleted} />;
}

function PendingWork({
  transaction,
  all,
  onCompleted,
}: {
  transaction: Transaction;
  all: Transaction[];
  onCompleted: (t: Transaction) => void;
}) {
  const note = transaction.receipt?.senderNote ?? null;
  const [reference, setReference] = useState(transaction.referenceNumber || note?.reference || "");
  const [sender, setSender] = useState(transaction.senderName || note?.name || "");
  const [receiver, setReceiver] = useState(transaction.receiverName);
  const when = useTransferTime(transaction.transferredAt);
  const [verified, setVerified] = useState(false);
  const [released, setReleased] = useState(false);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const uploadUrl = transaction.uploadToken
    ? `${window.location.origin}/send/${transaction.uploadToken}`
    : null;
  const conflict = reference.trim()
    ? findReferenceConflict(all, reference, transaction.id)
    : undefined;

  async function setOperatorReceipt(image: string | null) {
    setSavingPhoto(true);
    setError(null);
    const result = await cico.setOperatorReceipt(transaction.id, image);
    setSavingPhoto(false);
    if (!result.ok) setError(result.error);
  }

  async function complete() {
    if (saving) return;
    setTried(true);
    setError(null);
    setSaving(true);
    const result = await cico.completeCashOut(transaction.id, {
      referenceNumber: reference,
      senderName: sender,
      receiverName: receiver,
      transferredAt: when.iso,
      fundsVerified: verified,
      cashReleased: released,
    });
    setSaving(false);
    if (result.ok) onCompleted(result.value);
    else setError(result.error);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ScreenHeader title={`${formatPesos(transaction.principalCentavos)} for ${transaction.receiverName}`} tone="pending">
        Pending cash-out. Don&apos;t hand over any cash until you&apos;ve found
        the money in your own wallet.
      </ScreenHeader>

      <Panel order={1}>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-small text-muted">Cash to give</dt>
            <dd className="text-lead font-medium">{formatPesos(transaction.principalCentavos)}</dd>
          </div>
          <div>
            <dt className="text-small text-muted">Fee to collect</dt>
            <dd className="text-lead font-medium">{formatPesos(transaction.feeCentavos)}</dd>
          </div>
          <div>
            <dt className="text-small text-muted">Created</dt>
            <dd className="text-lead font-medium">{formatManilaDateTime(transaction.createdAt)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-small text-muted">
          The fee was agreed when this cash-out was created. Changing the fee
          rules doesn&apos;t change it.
        </p>
      </Panel>

      {uploadUrl && (
        <Panel title="Link for the sender" order={2}>
          <p>
            Send this link to the person sending the money. They can upload
            their receipt there. They won&apos;t see anything else in CICO.
          </p>
          <p className="mt-4 rounded-ui bg-field p-4 font-medium break-all">{uploadUrl}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(uploadUrl);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
              className={buttonClass("night")}
            >
              <Copy aria-hidden className="size-5" />
              {copied ? "Copied" : "Copy link"}
            </button>
            <a href={uploadUrl} target="_blank" rel="noreferrer" className={buttonClass("surface", "bg-bg!")}>
              <ExternalLink aria-hidden className="size-5" />
              Open sender page
            </a>
          </div>
          <p className="mt-4 text-small text-muted">
            {demoAvailable
              ? "Demo: this link only works in this browser on this computer, so open it here to play the sender."
              : "Send it by chat or text message. The link stops working once this cash-out is completed."}{" "}
            QR codes aren&apos;t available yet.
          </p>
        </Panel>
      )}

      <Panel title="Receipt" order={3}>
        {transaction.receipt?.uploadedBy === "sender" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {transaction.receipt.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- a data URL or a private, short-lived link
              <img
                src={transaction.receipt.imageUrl}
                alt="Receipt uploaded by the sender"
                className="max-h-[28rem] w-full rounded-ui bg-field object-contain"
              />
            )}
            <div className="space-y-2">
              <p className="font-medium">
                Uploaded by the sender, {formatManilaDateTime(transaction.receipt.uploadedAt)}.
              </p>
              {note && (
                <>
                  <p>
                    They typed: name <strong>{note.name || "not given"}</strong>,
                    reference <strong className="break-words">{note.reference || "not given"}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (note.reference) setReference(note.reference);
                      if (note.name) setSender(note.name);
                    }}
                    className={buttonClass("surface", "bg-bg! mt-2")}
                  >
                    Copy these into the form below
                  </button>
                </>
              )}
              <p className="text-small text-muted">
                A receipt doesn&apos;t prove the money arrived. Check your
                wallet before you complete this.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ReceiptPicker
              image={transaction.receipt?.imageUrl ?? null}
              onChange={setOperatorReceipt}
            />
            {savingPhoto && (
              <p role="status" className="mt-3 flex items-center gap-2 text-muted">
                <LoaderCircle aria-hidden className="spin size-5" />
                Saving the photo…
              </p>
            )}
          </>
        )}
      </Panel>

      <Panel title="Check and complete" order={4}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="reference"
            label="Reference number"
            hint="Copy it from your wallet history, including any zeroes at the start."
            error={
              conflict
                ? `Already recorded on another cash-out (${formatPesos(conflict.principalCentavos)}, ${conflict.receiverName}). Each transfer can only be paid out once.`
                : null
            }
          >
            <ReferenceInput id="reference" value={reference} onChange={setReference} invalid={Boolean(conflict)} />
          </Field>
          <Field id="sender" label="Sender's name">
            <input
              id="sender"
              type="text"
              autoComplete="off"
              value={sender}
              onChange={(event) => setSender(event.target.value)}
              className="field"
            />
          </Field>
          <Field id="receiver" label="Person collecting the cash">
            <input
              id="receiver"
              type="text"
              autoComplete="off"
              value={receiver}
              onChange={(event) => setReceiver(event.target.value)}
              className="field"
            />
          </Field>
        </div>
        <div className="mt-5">
          <TransferTimeFields idPrefix="received" value={when} showError={tried} />
        </div>

        <div className="mt-6 space-y-3">
          <CheckRow checked={verified} onChange={setVerified}>
            I found this transfer in my own wallet history. The reference
            number and the amount ({formatPesos(transaction.principalCentavos)}) match.
          </CheckRow>
          <CheckRow checked={released} onChange={setReleased}>
            I collected the {formatPesos(transaction.feeCentavos)} fee and gave{" "}
            {formatPesos(transaction.principalCentavos)} cash to{" "}
            {receiver.trim() || "the person collecting"}.
          </CheckRow>
        </div>

        <div className="mt-5 space-y-4" aria-live="polite">
          {error && <Problem>{error}</Problem>}
          <button
            type="button"
            onClick={complete}
            disabled={saving}
            className={buttonClass("cash-out", "w-full sm:w-auto")}
          >
            {saving && <LoaderCircle aria-hidden className="spin size-5" />}
            {saving ? "Saving…" : "Complete cash-out"}
          </button>
        </div>
      </Panel>
    </div>
  );
}
