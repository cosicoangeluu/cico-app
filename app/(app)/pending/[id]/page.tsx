import type { Metadata } from "next";
import { Suspense } from "react";
import { DataGate } from "@/components/data-gate";
import { PendingDetail } from "./pending-detail";

export const metadata: Metadata = { title: "Pending cash-out" };

export default function PendingCashOutPage({ params }: PageProps<"/pending/[id]">) {
  return (
    <DataGate>
      <Suspense>
        <PendingDetailForId params={params} />
      </Suspense>
    </DataGate>
  );
}

async function PendingDetailForId({ params }: Pick<PageProps<"/pending/[id]">, "params">) {
  const { id } = await params;
  return <PendingDetail id={id} />;
}
