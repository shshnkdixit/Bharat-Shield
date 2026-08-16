# BharatShield

BharatShield is a cybersecurity-focused prototype that helps people pause and assess suspicious messages and media metadata before they click, pay, or forward.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm --filter @workspace/bharatshield run dev` — run the BharatShield web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- The managed preview workflows provide `PORT` and `BASE_PATH`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bharatshield/src/App.tsx` — routes, pages, analysis flows, and shared result UI
- `artifacts/bharatshield/src/index.css` — BharatShield visual language and responsive layout
- `artifacts/api-server/src/lib/risk-engine.ts` — shared score and risk-level thresholds
- `artifacts/api-server/src/routes/analysis.ts` — rule-based text analyzer, prototype file analyzer, and in-memory history
- `artifacts/api-server/src/routes/models.ts` — model status catalog
- `lib/api-spec/openapi.yaml` — source of truth for the typed API contract

## Architecture decisions

- The MVP intentionally uses a rule-based text analyzer and file metadata-only analysis; real forensic/deepfake models are future integrations.
- Analysis results are stored in server memory for the prototype, keeping the first pass stable without database setup or authentication.
- The generated API client and Zod schemas are the contract boundary between the web app and the shared Express API server.
- English and Hindi copy are local dictionaries so more Indian languages can be added without introducing a translation service.

## Product

Users can assess suspicious text, audio, image, and video metadata; inspect explainable risk signals and recommendations; explore synthetic demo scenarios; review API-saved history; see model integration status; and read the product’s limitations.

## User preferences

No additional user preferences recorded.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using regenerated hooks or schemas.
- Direct Vite builds need temporary `PORT` and `BASE_PATH`; the managed web workflow supplies them automatically.
- Media analysis does not inspect uploaded bytes in this prototype; the browser validates the file and sends safe metadata only.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
