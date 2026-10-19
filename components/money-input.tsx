"use client";

import { useState } from "react";
import { parsePesos } from "@/lib/money";

/** A peso amount box. Reports whole centavos, or null while not valid. */
export function MoneyInput({
  id,
  value,
  onChange,
  invalid,
  large = false,
  autoFocus = false,
}: {
  id: string;
  value: string;
  onChange: (text: string, centavos: number | null) => void;
  invalid?: boolean;
  large?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-4 flex items-center font-medium text-muted ${
          large ? "text-head" : ""
        }`}
      >
        ₱
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value, parsePesos(event.target.value))}
        className={`field ${large ? "h-18 pl-[calc(1.25rem+0.75em)] text-head font-medium" : "pl-10"}`}
      />
    </div>
  );
}

/** Text + parsed centavos for a MoneyInput, with "show error after typing". */
export function useMoney(initial = "") {
  const [text, setText] = useState(initial);
  const [centavos, setCentavos] = useState<number | null>(parsePesos(initial));
  return {
    text,
    centavos,
    set(nextText: string, next: number | null) {
      setText(nextText);
      setCentavos(next);
    },
    error:
      text.trim() !== "" && centavos === null
        ? "Type an amount like 1000 or 1,000.50."
        : null,
  };
}
