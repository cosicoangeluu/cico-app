import type { Metadata } from "next";
import { DataGate } from "@/components/data-gate";
import { HistoryList } from "./history-list";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <DataGate>
      <HistoryList />
    </DataGate>
  );
}
