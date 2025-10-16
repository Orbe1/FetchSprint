declare module "pdf-parse" {
  import type { Buffer } from "buffer";

  interface PDFParseResult {
    text: string;
    info?: Record<string, unknown>;
    metadata?: unknown;
    version?: string;
    [key: string]: unknown;
  }

  type DataLike = Buffer | Uint8Array | ArrayBuffer;

  export default function pdfParse(
    data: DataLike,
    options?: Record<string, unknown>
  ): Promise<PDFParseResult>;

  export class PDFParse {
    constructor(
      options: { data: DataLike } & Record<string, unknown>
    );
    static setWorker(workerSrc: string): void;
    getText(options?: Record<string, unknown>): Promise<PDFParseResult>;
    destroy(): Promise<void>;
  }
}
