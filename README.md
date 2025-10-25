# FetchApp Monorepo

This repository hosts the FetchSprint Next.js app and related assets. The app itself lives under `Fetch_App/next_js_app` to keep the root clean.

Quick links
- App README: `Fetch_App/next_js_app/README.md`
- Live: https://fetch-sprint.vercel.app
- Code (GitHub): https://github.com/Orbe1/FetchSprint

How to run the app
- cd `Fetch_App/next_js_app`
- `npm install`
- `npm run dev`
- Open http://localhost:3000/receipt

Environment
- The Next.js app uses `Fetch_App/next_js_app/.env.local`.
- If you previously kept env at repo root, move relevant values into the app’s `.env.local`.

Receipts examples
- Sample PDFs live in `Fetch_App/next_js_app/examples/receipts/`.
- See the app README for curl examples.

Project layout
- `Fetch_App/next_js_app` — the Next.js app (all source lives here)
- Root files — repository metadata only (README, .gitignore, etc.)

Vercel
- Set the project “Root Directory” to `Fetch_App/next_js_app`.
- If dependencies change, prefer “Clear cache & rebuild” during redeploy.

