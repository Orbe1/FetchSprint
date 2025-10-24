"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadState = "idle" | "uploading" | "error";

type ReceiptUploadResponse = {
  name: string;
  size: number;
  receiptText: string;
  items: { name: string; price: number }[];
  summary?: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  };
};

const RECEIPT_STORAGE_PREFIX = "fetchSprint:receipt:";

export default function ReceiptUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string>("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      setSelectedFile(null);
      setStatus("idle");
      setMessage("");
      return;
    }
    if (nextFile.type !== "application/pdf") {
      setSelectedFile(null);
      setStatus("error");
      setMessage("Only PDF receipts are supported right now.");
      event.target.value = "";
      return;
    }
    setSelectedFile(nextFile);
    setStatus("idle");
    setMessage("");
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setStatus("error");
      setMessage("Choose a PDF receipt before uploading.");
      return;
    }
    const formData = new FormData();
    formData.append("receipt", selectedFile);
    setStatus("uploading");
    setMessage("");
    try {
      const response = await fetch("/api/receipt-upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setStatus("error");
        setMessage(errorData?.error ?? "Something went wrong. Please try again.");
        return;
      }
      const result: ReceiptUploadResponse = await response.json();
      try {
        const receiptId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(
          `${RECEIPT_STORAGE_PREFIX}${receiptId}`,
          JSON.stringify(result)
        );
        setStatus("idle");
        setMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.push(`/receipt/preview?id=${receiptId}`);
      } catch (storageError) {
        console.error("Failed to cache receipt preview", storageError);
        setStatus("error");
        setMessage(
          "We saved your receipt but could not open the preview. Please try again."
        );
      }
    } catch (error) {
      console.error("Receipt upload failed", error);
      setStatus("error");
      setMessage("We couldn't reach the upload service. Try again shortly.");
    }
  };

  return (
    <section
      id="receipt-upload"
      className="flex-1 rounded-3xl border border-orange-100 bg-white p-8 text-slate-900 shadow-sm"
    >
      <h2 className="text-2xl font-semibold">Upload a PDF receipt</h2>
      <p className="mt-2 text-sm text-slate-600">
        We’ll parse the essentials and queue the data. Images aren’t supported yet.
      </p>

      <form onSubmit={handleUpload} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="receipt">Receipt PDF</Label>
          <Input
            ref={fileInputRef}
            id="receipt"
            name="receipt"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="cursor-pointer border-slate-200 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--primary)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:border-slate-300"
          />
          <p className="text-xs text-slate-500">
            Up to 10 MB. PDF only.
          </p>
        </div>

        {selectedFile && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={status === "uploading"}
          className="w-full"
        >
          {status === "uploading" ? "Uploading..." : "Submit receipt"}
        </Button>

        {message && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600" role="alert">
            {message}
          </div>
        )}
      </form>
    </section>
  );
}
