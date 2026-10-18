"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import { shrinkImage } from "@/lib/demo/image";

/**
 * Take a photo of a receipt or upload one, then keep it beside the form.
 * Reading the details off the picture (scanning) isn't available yet, so the
 * picture is for the operator to read while typing.
 */
export function ReceiptPicker({
  image,
  onChange,
}: {
  image: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await shrinkImage(file));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "That picture didn't work.");
    } finally {
      setBusy(false);
    }
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
            onClick={() => onChange(null)}
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

      <p className="text-small text-muted">
        Scanning isn&apos;t available yet: type the details from the receipt
        below. No receipt? Type them from your wallet history.
      </p>
    </div>
  );
}
