import { NextRequest, NextResponse } from "next/server";
import { pathToFileURL } from "node:url";

type ReceiptSummary = {
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
};

type ReceiptItem = {
  name: string;
  price: number;
};

const SUMMARY_KEYWORDS = {
  subtotal: /(subtotal|item total|items total)/i,
  tax: /(tax|vat)/i,
  total: /(total|amount due|grand total|balance due)/i,
};

const IGNORE_ITEM_KEYWORDS =
  /(subtotal|tax|total|change|payment|tender|cash|credit|debit|thank|amount due|balance)/i;

const CURRENCY_SYMBOLS = [
  "$",
  "\u20AC", // Euro
  "\u00A3", // Pound
  "\u00A5", // Yen
  "\u20B1", // Philippine Peso
  "\u20B9", // Indian Rupee
  "\u20A9", // Won
  "\u20AB", // Dong
  "\u20A6", // Naira
  "\u20B4", // Hryvnia
];

const CURRENCY_MAP: Record<string, string> = {
  $: "USD",
  "\u20AC": "EUR",
  "\u00A3": "GBP",
  "\u00A5": "JPY",
  "\u20B1": "PHP",
  "\u20B9": "INR",
  "\u20A9": "KRW",
  "\u20AB": "VND",
  "\u20A6": "NGN",
  "\u20B4": "UAH",
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const currencyExpression = new RegExp(
  `(${CURRENCY_SYMBOLS.map(escapeRegExp).join("|")})`
);

const trailingCurrencyExpression = new RegExp(
  `(${CURRENCY_SYMBOLS.map(escapeRegExp).join("|")})+$`
);

export const runtime = "nodejs";

const toBuffer = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

type PdfParserCtor = {
  new (options: { data: Buffer }): {
    getText: () => Promise<{ text?: string }>;
    destroy: () => Promise<void>;
  };
  setWorker?: (workerSrc: string) => void;
};

let pdfParserCtorPromise: Promise<PdfParserCtor> | null = null;

const configureWorker = async (PdfParse: PdfParserCtor) => {
  try {
    if (typeof PdfParse.setWorker !== "function") {
      return;
    }

    const workerModule = (await import("pdf-parse/worker")) as {
      getWorkerSource?: () => string;
      getWorkerPath?: () => string;
    };

    const src =
      typeof workerModule.getWorkerSource === "function"
        ? workerModule.getWorkerSource()
        : typeof workerModule.getWorkerPath === "function"
          ? pathToFileURL(workerModule.getWorkerPath()).href
          : undefined;

    if (typeof src === "string" && src.length > 0) {
      PdfParse.setWorker(src);
    }
  } catch (workerError) {
    console.warn("Failed to configure pdf-parse worker", workerError);
  }
};

const loadPdfParser = async (): Promise<PdfParserCtor> => {
  if (!pdfParserCtorPromise) {
    pdfParserCtorPromise = (async () => {
      const mod = await import("pdf-parse");
      const PdfParseExport = (mod as { PDFParse?: unknown }).PDFParse;

      if (typeof PdfParseExport !== "function") {
        throw new Error("Unable to load pdf-parse module.");
      }

      const PdfParse = PdfParseExport as PdfParserCtor;
      await configureWorker(PdfParse);
      return PdfParse;
    })();
  }

  return pdfParserCtorPromise;
};

const sanitizeText = (text: string) =>
  text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "    ")
    .trim();

const extractCurrency = (line: string): string | undefined => {
  const symbolMatch = line.match(currencyExpression);
  if (!symbolMatch) {
    return undefined;
  }

  return CURRENCY_MAP[symbolMatch[1]] ?? undefined;
};

type AmountMatch = {
  value: number;
  index: number;
};

const extractAmount = (line: string): AmountMatch | undefined => {
  const amountRegex = /(\d+\.\d{1,2})(?!.*\d)/;
  const match = amountRegex.exec(line);
  if (!match || match.index === undefined) {
    return undefined;
  }

  const parsed = Number.parseFloat(match[1]);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return {
    value: parsed,
    index: match.index,
  };
};

const parseReceiptLines = (text: string) => {
  const lines = text.split("\n");
  const items: ReceiptItem[] = [];
  const summary: ReceiptSummary = {};
  let currency: string | undefined;
  const seenItems = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.replace(/\u0000/g, "");
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const amountData = extractAmount(trimmed);
    if (!amountData) {
      continue;
    }

    if (!currency) {
      currency = extractCurrency(trimmed);
    }

    const lower = trimmed.toLowerCase();

    if (SUMMARY_KEYWORDS.subtotal.test(lower)) {
      summary.subtotal ??= amountData.value;
      continue;
    }

    if (SUMMARY_KEYWORDS.tax.test(lower) && !/taxable/i.test(lower)) {
      summary.tax ??= amountData.value;
      continue;
    }

    if (SUMMARY_KEYWORDS.total.test(lower)) {
      summary.total ??= amountData.value;
      continue;
    }

    const priceIndex = amountData.index;
    const namePart =
      priceIndex >= 0
        ? trimmed
            .slice(0, priceIndex)
            .replace(trailingCurrencyExpression, "")
            .trim()
        : trimmed;

    if (!namePart || IGNORE_ITEM_KEYWORDS.test(namePart.toLowerCase())) {
      continue;
    }

    if (namePart.length < 2) {
      continue;
    }

    const cleanedName = namePart
      .replace(/[\s.\-_:]+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!cleanedName) {
      continue;
    }

    const itemKey = `${cleanedName.toLowerCase()}-${amountData.value.toFixed(
      2
    )}`;
    if (seenItems.has(itemKey)) {
      continue;
    }
    seenItems.add(itemKey);

    items.push({
      name: cleanedName,
      price: amountData.value,
    });
  }

  if (currency) {
    summary.currency = currency;
  }

  return { items, summary };
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("receipt");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "A PDF receipt must be provided." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF uploads are supported in this prototype." },
        { status: 415 }
      );
    }

    const PdfParse = await loadPdfParser();
    const pdfBuffer = await toBuffer(file);
    const parser = new PdfParse({ data: pdfBuffer });

    let sanitizedText = "";

    try {
      const parsed = await parser.getText();
      sanitizedText = sanitizeText(parsed.text ?? "");
    } finally {
      try {
        await parser.destroy();
      } catch (cleanupError) {
        console.warn("Failed to release PDF parser resources", cleanupError);
      }
    }

    if (!sanitizedText) {
      return NextResponse.json(
        {
          error:
            "We couldn't extract text from that receipt. Please upload a text-based PDF.",
        },
        { status: 422 }
      );
    }

    const { items, summary } = parseReceiptLines(sanitizedText);

    return NextResponse.json({
      name: file.name,
      size: file.size,
      receiptText: sanitizedText,
      items,
      summary,
    });
  } catch (error) {
    console.error("Receipt upload failed", error);
    return NextResponse.json(
      { error: "Unexpected error while processing upload." },
      { status: 500 }
    );
  }
}