"use client";

import { useDemoData } from "@/lib/demo/store";

/** The Home screen's pending count, from the demo records in this browser. */
export function DemoPendingCount() {
  const { loaded, transactions } = useDemoData();
  if (!loaded) return "Checking…";
  const count = transactions.filter((t) => t.status === "pending").length;
  return `${count} waiting`;
}
