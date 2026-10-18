import type { Metadata } from "next";
import { DataGate } from "@/components/data-gate";
import { CashInForm } from "./cash-in-form";

export const metadata: Metadata = { title: "Cash-in" };

export default function CashInPage() {
  return (
    <DataGate>
      <CashInForm />
    </DataGate>
  );
}
