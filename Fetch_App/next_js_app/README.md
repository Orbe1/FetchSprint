AI Receipt Scanner — Next.js (Serverless‑safe)

Live: https://fetch-sprint.vercel.app

Demo (90s): https://drive.google.com/file/d/178vJ8fPFMzFauE2_I_5Jf0OMJxsuL2au/view?usp=sharing

Code: https://github.com/Orbe1/FetchSprint

Overview
- Upload a receipt PDF → extract text → parse line‑items/totals → preview results.
- Serverless‑safe parsing: Node runtime, CommonJS PDF parser, no DOM/FS at module scope.
- Includes small AI demo endpoints (captions, embeddings, trends) to show bolt‑on AI.

Features
- Receipt upload (/receipt) → server route parses PDF and returns JSON
- Preview UI (/receipt/preview?id=...) to view parsed items & totals
- Serverless‑safe parser: Node runtime + CJS helper loaded inside the route handler
- Optional AI demos: /api/ai-captions, /api/youtube-trends, /embeddings
- Production deploy on Vercel

Quick Start
- Clone
  - git clone https://github.com/Orbe1/FetchSprint
  - cd FetchSprint/Fetch_App/next_js_app
- Install & run
  - npm install
  - npm run dev
- Open
  - http://localhost:3000/receipt
  - Upload a small, text-based PDF (see Examples below)

Examples
- Place sample PDFs under `examples/receipts/` (tiny + de‑identified). For example:
  - examples/receipts/groceryMarket.pdf (text‑based)
  - examples/receipts/imageOnly.pdf (scan‑only → returns 422)

Serverless‑Safe Pattern (Important)
- Route config
  - export const runtime = 'nodejs'
  - export const dynamic = 'force-dynamic'
- Load the PDF parser inside the request handler via a tiny CJS helper that targets the Node file directly:
  - File: `src/lib/parsePdf.cjs`
    - const pdfParse = require('pdf-parse/lib/pdf-parse.js')
    - module.exports = async (buf) => pdfParse(buf)
- Route usage (inside POST)
  - const { default: parsePdfBuffer } = await import('@/lib/parsePdf.cjs')
  - const result = await parsePdfBuffer(buffer)

API
- POST /api/receipt-upload
  - Multipart field: `file` or `receipt` (PDF)
- Curl (local)
  - curl -F "file=@examples/receipts/groceryMarket.pdf" http://localhost:3000/api/receipt-upload
- Curl (prod)
  - curl -F "file=@/absolute/path/to/groceryMarket.pdf" https://fetch-sprint.vercel.app/api/receipt-upload
- Response shape
  - {
    "name": "groceryMarket.pdf",
    "size": 12345,
    "receiptText": "…",
    "items": [{ "name": "Milk", "price": 3.49 }],
    "summary": { "subtotal": 22.65, "tax": 1.81, "total": 24.46, "currency": "USD" }
    }

Environment
- Node: 18+
- Next.js: 15
- Install: npm install
- Dev: npm run dev
- Build: npm run build
- AI endpoints (optional): add provider keys to `.env.local` if you enable them

Troubleshooting
- Build error mentions `./test/data/05-versions-space.pdf`
  - A browser/ESM pdf.js path was pulled. Fixes used here:
    - Pin pdf-parse@1.1.1 (Node/CJS)
    - Do not import PDF libs at module scope
    - Call the CJS helper from inside the route (`src/lib/parsePdf.cjs`)
- Prod 500 but dev works
  - Check Vercel Function logs for `/api/receipt-upload`
  - Redeploy with “Clear cache & rebuild” if lockfile changed
  - Ensure project root is `Fetch_App/next_js_app`

Architecture
- next_js_app/
  - app/
    - receipt/               (upload UI)
    - receipt/preview/       (preview parsed result)
    - api/
      - receipt-upload/      (POST: multipart → JSON {items, totals})
      - ai-captions/         (optional AI demo)
      - youtube-trends/      (optional AI demo)
      - embeddings/          (optional AI demo)
  - src/
    - lib/
      - parsePdf.cjs         (CJS helper that calls pdf-parse Node file)
  - examples/
    - receipts/              (put sample PDFs here)

Demo Script (for reviewers)
- Open /receipt, upload examples/receipts/groceryMarket.pdf
- Show parsed items/totals; open /receipt/preview
- Hit an AI endpoint to demo AI-assisted feature
- Mention serverless-safe approach (Node runtime, CJS parsing inside handler)

