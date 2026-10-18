import type { Metadata } from "next";
import { DataGate } from "@/components/data-gate";
import { CashOutForm } from "./cash-out-form";

export const metadata: Metadata = { title: "Cash-out" };

export default function CashOutPage() {
  return (
    <DataGate>
      <CashOutForm />
    </DataGate>
  );
}
