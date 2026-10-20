"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, LoaderCircle, ScanText, Trash2 } from "lucide-react";
import { shrinkImage } from "@/lib/demo/image";
import { formatPesos } from "@/lib/money";
import { scanReceipt } from "@/lib/scan/ocr";
import type { ReceiptReading } from "@/lib/scan/parse";
import { formatManilaDateTime, manilaToIso } from "@/lib/time";

type Scan =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "done"; reading: ReceiptReading }
  | { status: "failed" };

/**
 * Take a photo of a receipt or upload one, then keep it beside the form.
 * With `onScan`, the photo is also read on this device and what was found is
 * handed to the form to fill in. Scanning can misread, so every box stays
 * editable and the operator checks it against the photo.
 */
export function ReceiptPicker({
  image,
  onChange,
  onScan,
  expectedCentavos,
}: {
  image: string | null;
  onChange: (dataUrl: string | null) => void;
  onScan?: (reading: ReceiptReading) => void;
  /** The amount already typed, to warn when the photo shows a different one. */
  expectedCentavos?: number | null;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const scanId = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan>({ status: "idle" });

  async function read(file: File) {
    if (!onScan) return;
    const id = ++scanId.current;
    setScan({ status: "reading" });
    try {
      const reading = await scanReceipt(file);
      if (id !== scanId.current) return; // The photo was replaced or removed meanwhile.
      setScan({ status: "done", reading });
      onScan(reading);
    } catch {
      if (id === scanId.current) setScan({ status: "failed" });
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await shrinkImage(file));
      void read(file);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That picture didn't work.");
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    scanId.current++;
    setScan({ status: "idle" });
    onChange(null);
  }

  const fileInput = (ref: React.RefObject<HTMLInputElement | null>, camera: boolean) => (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      capture={camera ? "environment" : undefined}
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => {
        void handleFile(event.target.files?.[0]);
        event.target.value = "";
      }}
    />
  );

  return (
    <div className="space-y-3">
      {fileInput(cameraRef, true)}
      {fileInput(uploadRef, false)}

      {image ? (
        <figure className="rise space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL or a private, short-lived link */}
          <img
            src={image}
            alt="Receipt photo"
            className="max-h-[28rem] w-full rounded-ui bg-field object-contain"
          />
          <button
            type="button"
            onClick={remove}
            className="pressable inline-flex h-12 items-center gap-2 rounded-full bg-field px-5 font-medium"
          >
            <Trash2 aria-hidden className="size-5" />
            Remove photo
          </button>
        </figure>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
            className="pressable flex h-16 items-center justify-center gap-3 rounded-ui bg-field font-medium"
          >
            <Camera aria-hidden className="size-6" />
            Take a photo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => uploadRef.current?.click()}
            className="pressable flex h-16 items-center justify-center gap-3 rounded-ui bg-field font-medium"
          >
            <ImageUp aria-hidden className="size-6" />
            Upload a picture
          </button>
        </div>
      )}

      {busy && (
        <p role="status" className="flex items-center gap-2 text-muted">
          <LoaderCircle aria-hidden className="spin size-5" />
          Preparing the picture…
        </p>
      )}
      {error && <p role="alert" className="font-medium text-danger">{error}</p>}

      {onScan && image && <ScanResult scan={scan} expectedCentavos={expectedCentavos} />}

      {onScan && !image && (
        <p className="text-small text-muted">
          CICO reads the name, reference number, amount, date and time from
          the photo and fills in the empty boxes. Hold steady, avoid glare, and
          fit the whole receipt in the frame. No receipt? Type the details from
          your wallet history.
        </p>
      )}
    </div>
  );
}

function ScanResult({
  scan,
  expectedCentavos,
}: {
  scan: Scan;
  expectedCentavos?: number | null;
}) {
  if (scan.status === "idle") return null;
  if (scan.status === "reading") {
    return (
      <p role="status" className="flex items-center gap-2 text-muted">
        <LoaderCircle aria-hidden className="spin size-5" />
        Reading the receipt…
      </p>
    );
  }
  if (scan.status === "failed") {
    return (
      <p role="status" className="text-muted">
        CICO couldn&apos;t read this photo. Type the details below.
      </p>
    );
  }

  const { reference, name, amountCentavos, date, time } = scan.reading;
  const iso = date && time ? manilaToIso(date, time) : null;
  const found = [
    name,
    reference && `reference ${reference}`,
    amountCentavos !== null && formatPesos(amountCentavos),
    iso && formatManilaDateTime(iso),
  ].filter(Boolean);
  const amountDiffers =
    amountCentavos !== null && expectedCentavos != null && amountCentavos !== expectedCentavos;

  return (
    <div role="status" className="space-y-2">
      {found.length ? (
        <p className="flex items-start gap-2">
          <ScanText aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>
            Read from the photo: {found.join(", ")}. Empty boxes were filled
            in. <strong>Check every digit against the photo</strong>, and fix
            anything that&apos;s wrong.
          </span>
        </p>
      ) : (
        <p className="text-muted">
          CICO couldn&apos;t find the details in this photo. Type them below,
          or retake it closer and without glare.
        </p>
      )}
      {amountDiffers && (
        <p className="font-medium text-danger">
          The photo seems to show {formatPesos(amountCentavos)}, but the amount
          entered is {formatPesos(expectedCentavos)}. Check which one is right.
        </p>
      )}
    </div>
  );
}
