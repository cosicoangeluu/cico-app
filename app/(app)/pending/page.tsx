import type { Metadata } from "next";
import { DataGate } from "@/components/data-gate";
import { PendingList } from "./pending-list";

export const metadata: Metadata = { title: "Pending cash-outs" };

export default function PendingPage() {
  return (
    <DataGate>
      <PendingList />
    </DataGate>
  );
}
