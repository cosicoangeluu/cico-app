import type { Metadata } from "next";
import { Suspense } from "react";
import { SenderUpload } from "./sender-upload";

export const metadata: Metadata = {
  title: "Upload your receipt",
  robots: { index: false, follow: false },
};

/** Public page for a remote sender: upload one receipt, see nothing else. */
export default function SendPage({ params }: PageProps<"/send/[token]">) {
  return (
    <main className="min-h-svh px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-xl">
        <p className="font-display text-[2rem] font-light leading-none tracking-[-0.04em]">
          CICO
        </p>
        <Suspense>
          <SenderUploadForToken params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function SenderUploadForToken({ params }: Pick<PageProps<"/send/[token]">, "params">) {
  const { token } = await params;
  return <SenderUpload token={token} />;
}
