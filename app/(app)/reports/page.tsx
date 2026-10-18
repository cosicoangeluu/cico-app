import type { Metadata } from "next";
import { DataGate } from "@/components/data-gate";
import { ReportView } from "./report-view";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <DataGate>
      <ReportView />
    </DataGate>
  );
}
