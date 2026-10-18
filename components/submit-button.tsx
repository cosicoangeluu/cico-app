"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

/** The form's main button. Shows progress and blocks double submission. */
export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="pressable flex h-14 w-full items-center justify-center gap-3 rounded-full bg-cash-in px-6 text-lead font-medium text-cash-in-ink disabled:cursor-wait"
    >
      {pending && <LoaderCircle aria-hidden className="spin size-6" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
