# OSM ASSISTANT — hackathon demo

React + TypeScript + Vite + Tailwind dashboard, plus a Node.js/Express backend using Google's `@google/genai` SDK for live Gemini evaluation.

## Quick start (Windows / VS Code)

1. Extract the ZIP and open the **osm-assistant** folder (the folder containing `package.json`) in VS Code.
2. Install **Node.js 22 or newer** from https://nodejs.org/.
3. In VS Code, open **Terminal → New Terminal** and run `npm install`. Let it finish.
4. Open the root `.env` file. Replace `PASTE_YOUR_GOOGLE_AI_STUDIO_KEY_HERE` with your Google AI Studio key. Get a key at https://aistudio.google.com/api-keys. Do not add `VITE_` to `GEMINI_API_KEY`.
5. Run `npm run verify` for dependency-free source/config sanity checks.
6. Run `npm run build`. Fix any errors before the competition.
7. Run `npm run dev:all`. Open the Vite URL printed in the terminal (usually http://localhost:5173).
8. In another browser tab, open http://localhost:8000/api/health. Confirm `ok: true` and `modelConfigured: true`.
9. Open the Live Sandbox and run a test. Confirm the result says **Live model response**, not **Offline demo only**.

## Important safety / limitations

- The root `.env` is read by the backend and is git-ignored. Never share your real API key or commit `.env`.
- Backend only returns `ai_suggested_marks`; official teacher marks are not changed. A discrepancy of at least 1.0 mark is flagged.
- OCR confidence below `0.75` triggers manual reading and no suggested score.
- Gemini output is JSON-checked and scores are bounded to the maximum marks. Human moderators must verify the reasoning.
- The offline heuristic fallback exists only for rehearsing the UI. It is not AI and must never be presented as a real evaluation.
- NCERT references and quotations in seeded demo data are not independently authenticated. The UI labels them as demo references; verify exact citations against the official NCERT edition before claiming them as evidence.
- KPI tiles describe seeded demo capabilities, not independently measured model accuracy or real-world performance.

## Commands

- `npm run verify` — fast sanity checks; no external dependencies beyond Node.js.
- `npm run build` — TypeScript check and production frontend build.
- `npm run dev` — frontend only.
- `npm run server` — backend only.
- `npm run dev:all` — backend and frontend together.

## Verification status of this archive

The backend JavaScript syntax and local JSON/package parsing were checked. Dependency installation timed out in the preparation environment, so the frontend production build and live Gemini request have **not** been confirmed here. Run `npm install`, `npm run verify`, and `npm run build` locally; then confirm the live API health check and sandbox response before presenting.
