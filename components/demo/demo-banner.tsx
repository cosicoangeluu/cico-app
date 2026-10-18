"use client";

import { RotateCcw } from "lucide-react";
import { resetDemo } from "@/lib/demo/store";

/** Always visible in demo mode, so test records are never mistaken for real ones. */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-pending px-4 py-3 text-pending-ink sm:px-8 lg:px-12"
    >
      <p>
        <span className="font-medium">Demo mode.</span> Records stay in this
        browser only. Nothing is saved to a database.
      </p>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Delete all demo records and fee rules in this browser?")) {
            resetDemo();
          }
        }}
        className="pressable inline-flex h-10 items-center gap-2 rounded-full bg-night px-4 text-small font-medium text-night-ink"
      >
        <RotateCcw aria-hidden className="size-4" />
        Reset demo data
      </button>
    </div>
  );
}
