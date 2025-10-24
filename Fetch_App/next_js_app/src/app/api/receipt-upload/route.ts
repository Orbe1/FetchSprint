import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ReceiptItem = { name: string; price: number };
type ReceiptSummary = {
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
};

const sanitizeText = (text: string) =>
  text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "    ")
    .trim();

// Simple patterns for matching receipt lines like:
// "Milk $3.49", "Subtotal $22.65", "Tax (8%) $1.81", "TOTAL $24.46"
const RE_ITEM = /^(.*?)[\s\t]+\$\s*(\d+(?:\.\d{1,2})?)\s*$/;
const RE_SUBTOTAL = /^\s*subtotal\b.*\$\s*(\d+(?:\.\d{1,2})?)/i;
const RE_TAX = /^\s*tax\b.*\$\s*(\d+(?:\.\d{1,2})?)/i;
const RE_TOTAL = /^\s*(total|amount due)\b.*\$\s*(\d+(?:\.\d{1,2})?)/i;

function parseReceipt(text: string): { items: ReceiptItem[]; summary?: ReceiptSummary } {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\u0000/g, "").trim())
    .filter(Boolean);

  const items: ReceiptItem[] = [];
  let subtotal: number | undefined;
  let tax: number | undefined;
  let total: number | undefined;

  for (const line of lines) {
    let m: RegExpMatchArray | null;

    if ((m = line.match(RE_SUBTOTAL))) {
      subtotal = parseFloat(m[1]);
      continue;
    }
    if ((m = line.match(RE_TAX))) {
      tax = parseFloat(m[1]);
      continue;
    }
    if ((m = line.match(RE_TOTAL))) {
      total = parseFloat(m[2]);
      continue;
    }
    if ((m = line.match(RE_ITEM))) {
      const name = m[1].trim();
      const price = parseFloat(m[2]);
      if (name && Number.isFinite(price)) {
        items.push({ name, price });
      }
    }
  }

  const summary: ReceiptSummary = {};
  if (subtotal !== undefined) summary.subtotal = subtotal;
  if (tax !== undefined) summary.tax = tax;
  if (total !== undefined) summary.total = total;
  if (Object.keys(summary).length > 0) summary.currency = "USD";

  return { items, summary: Object.keys(summary).length ? summary : undefined };
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const result: any = await pdf(buffer as unknown as Buffer);
  return (result?.text ?? "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = (formData.get("receipt") ?? formData.get("file")) as File | null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a PDF receipt." },
        { status: 400 }
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF uploads are supported." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    const text = await extractTextFromPdf(buffer);
    const sanitized = sanitizeText(text ?? "");

    if (!sanitized) {
      return NextResponse.json(
        { error: "No extractable text was found. Please upload a text-based PDF." },
        { status: 422 }
      );
    }

    const { items, summary } = parseReceipt(sanitized);
    return NextResponse.json({
      name: file.name,
      size: file.size,
      receiptText: sanitized,
      items,
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Receipt upload failed", error);
    return NextResponse.json(
      { error: "Unexpected error while processing upload.", message },
      { status: 500 }
    );
  }
}
