"use client";

import { useEffect, useState } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { formatPesos } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/env";
import { demoAvailable } from "@/lib/demo/mode";
import { cico, type UploadRequest } from "@/lib/data";
import { ReceiptPicker } from "@/components/receipt-picker";
import { ReferenceInput } from "@/components/transfer-fields";
import { buttonClass, Field, Problem } from "@/components/ui";

const available = isSupabaseConfigured || demoAvailable;

type Lookup =
  | { status: "loading" }
  | { status: "open"; request: UploadRequest }
  | { status: "closed" }
  | { status: "error"; message: string };

export function SenderUpload({ token }: { token: string }) {
  const [lookup, setLookup] = useState<Lookup>({ status: "loading" });
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!available) return;
    let active = true;
    void cico.getUploadRequest(token).then((result) => {
      if (!active) return;
      setLookup(
        !result.ok
          ? { status: "error", message: result.error }
          : result.value
            ? { status: "open", request: result.value }
            : { status: "closed" },
      );
    });
    return () => {
      active = false;
    };
  }, [token]);

  if (!available) {
    return <Notice title="Not available yet">Receipt uploads aren&apos;t switched on yet.</Notice>;
  }
  if (lookup.status === "loading") {
    return (
      <p role="status" className="mt-10 flex items-center gap-3 text-lead">
        <LoaderCircle aria-hidden className="spin size-6" />
        Loading…
      </p>
    );
  }
  if (lookup.status === "error") {
    return <Notice title="Something went wrong">{lookup.message}</Notice>;
  }

  const request = lookup.status === "open" ? lookup.request : null;

  if (sent) {
    return (
      <section className="rise mt-8 rounded-ui bg-cash-in p-6 text-cash-in-ink sm:p-8">
        <CircleCheck aria-hidden className="size-12" strokeWidth={1.5} />
        <h1 className="mt-4 text-head font-medium">Receipt sent</h1>
        <p className="mt-3 text-lead">
          Thank you. The cash is handed over only after the money has been
          found in the receiving wallet.
        </p>
        {request && (
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setImage(null);
            }}
            className={buttonClass("night", "mt-6")}
          >
            Send a different picture
          </button>
        )}
      </section>
    );
  }

  if (!request) {
    return (
      <Notice title="This link isn't active">
        It may already have been used to finish the cash-out, or it was never
        valid. Ask the person collecting the cash for a new link.
      </Notice>
    );
  }

  async function send() {
    if (sending) return;
    setTried(true);
    setError(null);
    if (!image) {
      setError("Add a photo or screenshot of your transfer receipt.");
      return;
    }
    if (!name.trim()) return;
    setSending(true);
    const result = await cico.submitSenderReceipt(token, { image, name, reference });
    setSending(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return (
    <>
      <section className="rise mt-8 rounded-ui bg-pending p-6 text-pending-ink sm:p-8">
        <h1 className="text-head font-medium">Upload your receipt</h1>
        <p className="mt-3 text-lead">
          You&apos;re sending <strong>{formatPesos(request.amountCentavos)}</strong>
          {request.receiverFirstName && <> for {request.receiverFirstName}</>}.
          After you transfer, upload the receipt here.
        </p>
      </section>

      <section className="rise mt-3 space-y-5 rounded-ui bg-surface p-5 sm:p-8" style={{ "--i": 1 } as React.CSSProperties}>
        <ReceiptPicker image={image} onChange={setImage} />
        <Field id="name" label="Your name" error={tried && !name.trim() ? "Enter your name." : null}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field"
          />
        </Field>
        <Field id="reference" label="Reference number (optional)" hint="Shown on your receipt.">
          <ReferenceInput id="reference" value={reference} onChange={setReference} />
        </Field>
        {error && <Problem>{error}</Problem>}
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className={buttonClass("cash-in", "w-full")}
        >
          {sending && <LoaderCircle aria-hidden className="spin size-5" />}
          {sending ? "Sending…" : "Send receipt"}
        </button>
        <p className="text-small text-muted">
          Never share your wallet PIN, password or one-time code. Nobody needs
          them for this.
        </p>
      </section>

      {demoAvailable && (
        <p className="mt-4 text-small text-muted">
          Demo: this page reads the demo records in this browser.
        </p>
      )}
    </>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rise mt-8 rounded-ui bg-surface p-6 sm:p-8">
      <h1 className="text-head font-medium">{title}</h1>
      <p className="mt-3 text-lead">{children}</p>
    </section>
  );
}
