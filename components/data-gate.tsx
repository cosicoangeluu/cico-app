"use client";

import { useState, type ReactNode } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { cico, useCicoData } from "@/lib/data";
import { buttonClass, Problem } from "@/components/ui";

/** Shows a screen once CICO's records are loaded, or says why they aren't. */
export function DataGate({ children }: { children: ReactNode }) {
  const data = useCicoData();
  const [retrying, setRetrying] = useState(false);

  if (!data.loaded) {
    return (
      <p role="status" className="flex items-center gap-3 text-lead">
        <LoaderCircle aria-hidden className="spin size-6" />
        Loading your records…
      </p>
    );
  }

  if (data.error) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Problem>{data.error}</Problem>
        <button
          type="button"
          disabled={retrying}
          onClick={async () => {
            setRetrying(true);
            await cico.refresh();
            setRetrying(false);
          }}
          className={buttonClass("night")}
        >
          {retrying ? (
            <LoaderCircle aria-hidden className="spin size-5" />
          ) : (
            <RotateCcw aria-hidden className="size-5" />
          )}
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
