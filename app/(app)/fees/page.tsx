import type { Metadata } from "next";
import { DataGate } from "@/components/data-gate";
import { FeeEditor } from "./fee-editor";

export const metadata: Metadata = { title: "Fee rules" };

export default function FeesPage() {
  return (
    <DataGate>
      <FeeEditor />
    </DataGate>
  );
}
