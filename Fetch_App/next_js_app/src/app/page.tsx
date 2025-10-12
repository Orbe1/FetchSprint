"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

const features = [
  {
    title: "Fast PDF capture",
    description:
      "Drag in a PDF receipt and we will parse it for the fields your finance team needs.",
  },
  {
    title: "Data you control",
    description:
      "Stay in control of your submissions with instant feedback and easy auditing.",
  },
  {
    title: "Fetch social stays ready",
    description:
      "Log in any time to access the skill-sharing feed, meetings, and DMs you already know.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        setMessage(
          errorData?.error ?? "Something went wrong. Please try again."
        );
        return;
      }

      const result: ReceiptUploadResponse = await response.json();

      if (typeof window === "undefined") {
        throw new Error(
          "Preview is unavailable in the current environment. Please retry in a browser."
        );
      }

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
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        router.push(`/receipt/preview?id=${receiptId}`);
        return;
      } catch (storageError) {
        console.error("Failed to cache receipt preview", storageError);
        setStatus("error");
        setMessage(
          "We saved your receipt but could not open the preview. Please try again."
        );
        return;
      }
    } catch (error) {
      console.error("Receipt upload failed", error);
      setStatus("error");
      setMessage("We couldn't reach the upload service. Try again shortly.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          FetchSprint
        </Link>
        <Button
          asChild
          variant="outline"
          className="border-white/20 bg-white/5 text-white backdrop-blur transition hover:bg-white/10"
        >
          <Link href="/login">Log in / Sign up</Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 md:px-12 lg:flex-row lg:items-start">
        <section className="flex-1 space-y-10">
          <div className="space-y-6">
            <p className="inline rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
              Receipt capture prototype
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Submit receipts without logging in. Unlock social learning when
              you're ready.
            </h1>
            <p className="text-lg text-white/80 lg:text-xl">
              The FetchSprint network still powers the authenticated feed, but
              this new landing experience lets anyone try our PDF receipt flow
              instantly.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.8)]"
              >
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm text-white/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Already have an account?
              </p>
              <p className="text-lg font-semibold">
                Head straight to the feed after you sign in.
              </p>
            </div>
            <Button
              asChild
              className="bg-white text-slate-900 hover:bg-slate-200"
            >
              <Link href="/feed">Open the app</Link>
            </Button>
          </div>
        </section>

        <section className="flex-1 rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.6)]">
          <h2 className="text-2xl font-semibold">Upload a PDF receipt</h2>
          <p className="mt-2 text-sm text-slate-600">
            We'll parse the essentials and queue the data for your finance
            workspace. Images aren't supported just yet.
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
                className="cursor-pointer border-slate-200 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:border-slate-300"
              />
              <p className="text-xs text-slate-500">
                Up to 10 MB. Only PDF receipts for now.
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
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
            >
              {status === "uploading" ? "Uploading..." : "Submit receipt"}
            </Button>

            {message && (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600"
                role="alert"
              >
                {message}
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
