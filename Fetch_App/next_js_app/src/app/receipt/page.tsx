"use client";

import ReceiptUploader from "@/components/receipt/ReceiptUploader";

export default function ReceiptPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-24 pt-6 sm:px-6">
      <ReceiptUploader />
    </main>
  );
}

