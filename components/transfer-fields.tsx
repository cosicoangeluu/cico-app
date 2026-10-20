"use client";

import { useState } from "react";
import { manilaParts, manilaToIso } from "@/lib/time";
import { Field } from "@/components/ui";

/** Date and time of a wallet transfer, typed in Philippine time. Defaults to now. */
export function useTransferTime(initialIso?: string | null) {
  const [parts, setParts] = useState(() => manilaParts(initialIso ?? new Date()));
  const [typed, setTyped] = useState(Boolean(initialIso));
  return {
    date: parts.date,
    time: parts.time,
    setDate: (date: string) => {
      setTyped(true);
      setParts((p) => ({ ...p, date }));
    },
    setTime: (time: string) => {
      setTyped(true);
      setParts((p) => ({ ...p, time }));
    },
    /** Takes a scanned date and time, unless the operator already typed their own. */
    fillScanned: (date: string | null, time: string | null) => {
      if (typed) return;
      setParts((p) => ({ date: date ?? p.date, time: time ?? p.time }));
    },
    iso: manilaToIso(parts.date, parts.time),
  };
}

export function TransferTimeFields({
  idPrefix,
  value,
  showError,
}: {
  idPrefix: string;
  value: ReturnType<typeof useTransferTime>;
  showError: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${idPrefix}-date`} label="Transfer date">
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={value.date}
            onChange={(event) => value.setDate(event.target.value)}
            className="field"
          />
        </Field>
        <Field id={`${idPrefix}-time`} label="Transfer time">
          <input
            id={`${idPrefix}-time`}
            type="time"
            value={value.time}
            onChange={(event) => value.setTime(event.target.value)}
            className="field"
          />
        </Field>
      </div>
      {showError && !value.iso && (
        <p className="font-medium text-danger">Enter both the date and the time of the transfer.</p>
      )}
    </div>
  );
}

/** A reference number box: plain text, so leading zeroes stay exactly as typed. */
export function ReferenceInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
      value={value}
      aria-invalid={invalid || undefined}
      onChange={(event) => onChange(event.target.value)}
      className="field tracking-wide"
    />
  );
}
