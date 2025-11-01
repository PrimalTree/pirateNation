Live Score Poller — Worker Queue Model

Overview

- Replaces cron-based polling with a worker-queue model.
- Each match is a job with its own schedule, retries, and backoff.
- Workers run with configurable concurrency; jobs are de-duplicated by key.
- Demonstrates dynamic re-enqueue until a match finishes.

Why a queue over cron

- Fine-grained control: schedule per match, not batch sweeps.
- Backpressure-aware: respect concurrency and avoid stampedes.
- Resilient: retries with exponential backoff and jitter.
- Idempotent: job keys prevent overlapping duplicate work.

Quick Start

- Requires Python 3.9+
- Run: `python -m src.app`

What it does

- Seeds a few mock matches and starts polling each on its own cadence.
- Simulates score updates until matches complete, then stops polling them.

Project Structure

- `src/queue.py` — Minimal async worker-queue with retries, delay, dedupe, concurrency.
- `src/poller.py` — Live score poller that uses a provider and storage.
- `src/providers/base.py` — Provider interface.
- `src/providers/mock.py` — Mock provider returning deterministic evolving scores.
- `src/storage.py` — In-memory store for match states.
- `src/app.py` — Entry point: wires queue, poller, producer, and runs the loop.

Notes

- Networking is mocked; swap `MockLiveScoreProvider` with a real provider.
- The queue is in-memory; for production, replace with Redis/SQS and a proper worker.

Frontend App Structure (Next.js)

- `app/` — Next.js App Router pages and layouts.
- `app/components/` — All shared UI components (migrated from root `components/`).
- `app/components/gameday/` — Gameday UI (kept).
- `app/components/engage/` — Engage components kept for re‑integration (not currently wired into pages).
- `app/components/ui/ScoreSummary.tsx` — UI summary used by admin live page (migrated from `shared/ui`).
- `lib/` — Shared runtime utilities (migrated from `shared/`).
  - `lib/supabase-browser.ts`
  - `lib/supabase-server.ts`
- `public/branding/` — Brand assets (root `Branding/` folder removed).

Path Aliases

- `@components/*` → `app/components/*`
- `@shared/*` → `lib/*` (use for shared utilities)
- `@lib/*` → `lib/*`

Notable Moves

- Moved root `components/*` → `app/components/*` and updated imports.
- Moved `shared/supabase-*.ts` → `lib/` and updated imports.
- Moved `shared/ui/ScoreSummary.tsx` → `app/components/ui/ScoreSummary.tsx`.
- Removed root `Branding/` (assets live under `public/branding/`).

Supabase Helpers

- Browser: `import { createSupabaseBrowser } from '@shared/supabase-browser'` (alias now points to `lib/`).
- Server: `import { createSupabaseServer } from '@shared/supabase-server'`.

TypeScript

- Validate type state: `npx tsc -p tsconfig.json --noEmit`

Developing the Frontend

- Ensure environment vars are set for Supabase and any external APIs used by components:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (server)
  - Optional: `NEXT_PUBLIC_MAPBOX_TOKEN` (map image overlay in `StadiumMap`)

Engage Components

- `app/components/engage/*` are intentionally preserved for future use. They are currently not imported into pages; integrate as needed and imports will resolve via `@components/engage/...`.
