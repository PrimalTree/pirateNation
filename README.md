**Pirate Nation App**

- Single Next.js app in `app/` with shared packages.
- Packages: `packages/ui`, `packages/types`, `packages/config`.

**MVP Features (Web App)**
- Live Score (Game hub at `/game/[id]`, realtime via Supabase)
- Interactive Stadium Map (`/map`)
- Fan Polls (`/polls`)
- Virtual “No Quarter” Flag (`/flag`)
- Notifications settings (mockup; PWA-enabled)
- Sponsor banner + coupons (`/sponsors`)
- Feedback / Bug Report (`/feedback`)
- Legal basics (`/legal/privacy`, `/legal/terms`)

**Quick Start (Local)**
- Prereqs: Node 18+, PNPM 9
- Install deps: `pnpm install`
- Copy env: `.env.example` -> `.env` and fill values (see Environment)
- Dev server: `pnpm dev` (port 3000)
- Open: http://localhost:3000

## Unified App Structure (in progress)

We are migrating to a single Vercel project with route groups:

- `app/(public)` — Homepage + fan UI (keeps public URLs like `/`, `/game/[id]`, etc.)
- `app/admin` — Admin UI (gated)
- `app/api` — Combined API routes (cron, public JSON, admin endpoints)
- `public/` — Static assets
- `shared/` — Common logic (`supabase-browser`, `supabase-server`, etc.)

Run the unified app locally (experimental):

- `pnpm dev:app` — start the single app at port 3000
- `pnpm build:app && pnpm start:app` — production build/start

Notes:

- Monorepo legacy apps have been removed.
- `app/(public)/lib/*` and `app/admin/lib/*` re-export from `shared/*` to minimize import changes.

### Local Mock Scores Poller (30s cadence)

Use the included mock data to exercise the Supabase live cache without any external APIs.

1) Env: copy `.env.local.example` to `.env` at repo root and fill:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE` (service role key; server-side only)
   - Optionally tweak `LIVE_POLL_INTERVAL_MS`.
2) Start web (serves mock JSON): `pnpm dev` (http://localhost:3000)
   - Mock source: `GET /mock/scores.json` → `public/mock/scores.json`
3) In another terminal: `pnpm run mock:poller:local`
   - Poller logs either `synced N item(s)` or `no changes` every ~30s.
4) Verify in Supabase: rows appear/update in `public.live_games` for `demo-1`, `demo-2`.
5) Modify `public/mock/scores.json` (e.g., change a score) → poller should detect and upsert changes on the next tick.

Notes:
- The poller uses a best-effort distributed lock via `public.locks` (created by `supabase/schema.sql`) to ensure only one instance runs at a time per environment.
- Logs are structured (one JSON per line) for easy aggregation.

### Stadium Map Edge Endpoint

- `GET /api/stadium-map` returns `public/maps/stadium-map.json`.
- Cache headers: `Cache-Control: public, max-age=60, s-maxage=600, stale-while-revalidate=86400`.
- Test locally: open http://localhost:3000/api/stadium-map and inspect headers.

## Admin Setup

Admin UI lives at `/admin` and is role‑gated. Use the magic‑link form in the admin header to sign in, then set your `profiles.role` to one of: `moderator`, `admin`, or `sponsor_admin`.

- Open Admin: http://localhost:3000/admin
- Root env required:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (for SSR session)
  - Server‑side: `SUPABASE_SERVICE_ROLE`, `ADMIN_POLL_TOKEN` (optional), `LIVE_SOURCE_URL`, `CRON_SECRET`, `CRON_URL`
- Admin pages:
  - `/` Dashboard
  - `/live` Realtime cache monitor with a “Trigger Poll” button (calls `/api/cron/live`)
  - `/polls`, `/ugc-queue`, `/sponsors`, `/map-layers`, `/feature-flags`, `/push` (MVP stubs)

**Environment**
- Client + server:
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL` and `SUPABASE_ANON_KEY` (for server components/actions)
- Admin utilities:
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

Additional env used by the hybrid system (root `.env.local`):

- `SUPABASE_SERVICE_ROLE` (server‑only)
- `ADMIN_POLL_TOKEN` (optional upstream bearer)
- `LIVE_SOURCE_URL`, `LIVE_POLL_INTERVAL_MS`
- `CRON_SECRET` (guard `/api/cron/live`), `CRON_URL` (for admin manual trigger)

Where to get values
- Supabase URL/keys: Supabase Dashboard → Project Settings → API
  - Project URL = `https://<project-ref>.supabase.co`
  - anon public key (browser) and anon/server keys (server)
  - service_role key (admin only; do not expose to client)
- Enable Realtime: Database → Replication → configure tables (`games`, `players`, `polls`, `poll_votes`, `chats`, `chat_messages`, `ugc_posts`)
- Map token (optional): Mapbox → Access tokens
- PostHog API key (optional): PostHog → Project Settings → Project API Key
- Plausible domain (optional): your Plausible site domain
- Web Push VAPID keys (optional): `npx web-push generate-vapid-keys`

**Supabase Setup**
- Create a project and run `supabase/schema.sql` in the SQL editor.
- Enable Realtime for: `games`, `players`, `polls`, `poll_votes`, `chats`, `chat_messages`, `ugc_posts`.
- RLS policies are included in the schema. Admin endpoints use service role.

**Seeding Games (Optional Demo)**
- POST ESPN scoreboard payload to the admin sync route to upsert `games`:
- `POST /api/admin/sync-games`
  - Or deploy admin and hit `/api/admin/sync-games`
  - Body: `{ "url": "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard" }`

**Key Routes (Web)**
- `/` Home
- `/game/[id]` Game Hub (tabs: Feed, Polls, Chat, UGC, Map)
- `/map`, `/polls`, `/flag`, `/sponsors`, `/feedback`, `/legal/privacy`, `/legal/terms`
- `/mockup` Full UI mockup preview (from `@pn/ui`)

Public API (Edge cached):

- `/api/public/schedule.json`
- `/api/public/roster.json`
- `/api/public/map.json`

Dynamic API:

- `/api/scoreboard` ECU‑filtered scoreboard (normalized)
- `/api/schedule` ECU‑filtered schedule (normalized)
- `/api/cron/live?token=CRON_SECRET` server‑driven poll (Node runtime)

**PWA & Offline**
- Installable PWA with service worker and offline page.
- Service worker strategy:
  - Cache First for static assets (`/_next/static/**`, icons, manifest, fonts)
  - Network First for navigations with fallback to `/offline.html`
- Icons:
  - SVG any/maskable/monochrome in `public/icons/`
  - PNG fallbacks referenced in manifest; generate from SVGs (see `public/icons/GENERATE.md`)

**Testing**
- Web dev: `pnpm dev`
- Game hub: navigate to `/game/<uuid>` for a seeded or existing game.
- Realtime: with tables enabled in Supabase Realtime, updates should stream into Feed/Chat/Score.
- Admin: visit `http://localhost:3001/live`, click “Trigger Poll” (requires `CRON_URL`/`CRON_SECRET`), confirm rows in `public.live_games` advance.
- PWA installability:
  - Chrome DevTools → Application → Manifest
  - Test “Install” and verify standalone launch
- Offline tests:
  - DevTools → Network → Offline → navigate → `offline.html` renders
  - Static assets should load from cache after first visit

**Build & Deploy**
- Build: `pnpm build`
- Start: `pnpm start`
- Hosting: Vercel/Netlify/Node server all work (service worker lives in `/public`).
- Set env vars in your host for the unified app as needed.

## Hybrid Data Distribution (MVP)

This project uses a hybrid strategy to minimize upstream API calls while keeping clients updated:

- Real‑time dynamic data (scores, No Quarter trigger) via a single admin poller + Supabase Realtime fanout.
- Static/shared data (schedule, roster, map) via Edge‑cached JSON endpoints.

### Realtime Backend

- Table: `public.live_games (game_id text primary key, score_json jsonb, hash text, updated_at timestamptz)` with RLS:
  - Public SELECT; only `service_role` can INSERT/UPDATE.
- Poller: `cron/fetchLiveScores.js`
  - Polls `LIVE_SOURCE_URL` every `LIVE_POLL_INTERVAL_MS` (default 30s).
  - Sends `Authorization: Bearer ${ADMIN_POLL_TOKEN}` if provided.
  - Stable hashes to avoid unnecessary updates and broadcasts.

Env (server‑side only):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `ADMIN_POLL_TOKEN` (optional)
- `LIVE_SOURCE_URL` (default: `https://api.example.com/live`)
- `LIVE_POLL_INTERVAL_MS` (default: `30000`)

Run locally: `pnpm poller`

### Vercel Cron (daily backfill)

- Hobby plan fires a single daily hit to `/api/cron/live` (see `vercel.json` `crons`).
- Use it for manual catch-up/backfill; sub-minute cadence comes from the poller worker.
- Route: `app/api/cron/live/route.ts` (runtime: nodejs) shares the same sync helper as the worker.

Set these envs in Vercel if you keep the cron/manual trigger:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- `ADMIN_POLL_TOKEN` (optional)
- `LIVE_SOURCE_URL` (optional)
- `CRON_SECRET` (required for the cron endpoint)

For tight cadences, deploy the containerised worker instead (`Dockerfile.poller`, `docker-compose.poller.yml`).

### Dedicated Poller Worker (primary)

- Runs the shared `syncLiveScores` loop on ~30s cadence outside Vercel; recommended for production live updates.
- Use `Dockerfile.poller` to build a tiny worker container and run it on your platform of choice (Fly/Render/Railway/K8s/VM).
- Or see `docker-compose.poller.yml` for a one‑service compose.
- Env required:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
  - Optional: `LIVE_SOURCE_URL`, `ADMIN_POLL_TOKEN`, `LIVE_POLL_INTERVAL_MS`
- Docs: `docs/poller.md`.

### Edge‑cached Static Endpoints

Public endpoints (Edge runtime):

- `/api/public/schedule.json` → `data/public/schedule.json`
- `/api/public/roster.json` → `data/public/roster.json`
- `/api/public/map.json` → `data/public/map.json`

All set `Cache‑Control: public, s-maxage=86400, stale-while-revalidate=3600`.

### Frontend Helpers

- Realtime: `app/(public)/lib/live.ts` → `fetchLiveInitial()`, `subscribeLive(cb)`
- CDN: `app/(public)/lib/cdn.ts` → `getSchedule()`, `getRoster()`, `getMapData()` (session‑cached)

### Rollback Playbook

1) Disable cron/poller:
   - Vercel: unset or rotate `CRON_SECRET`, or remove cron in `vercel.json` and redeploy.
   - External worker: stop the process or scale to zero.
2) Reset live cache if needed: `delete from public.live_games;`
3) Re‑enable once upstream stabilizes.

## User Instructions (Web App)

- Home: “Raise the Flag” hero, Kickoff Countdown (auto‑syncs to next ECU game), Quick Actions, Live/Latest ECU score, Season Schedule.
- Bottom nav: Home, Map, Flag (fullscreen), Polls, Sponsors.
- Top nav: Map, Players, Polls, Sponsors, Feedback, Donate.
- Data freshness:
  - Live scores update via Supabase Realtime (from the admin poller).
  - Schedule/Roster/Map are fetched once per session from edge‑cached JSON endpoints.
- PWA: Install from the browser menu; static assets are cached for offline.

## Where We Need To Work Next

- Replace mock `LIVE_SOURCE_URL` with real ESPN/StatBroadcast connectors; refine `normalizeLive` per source.
- Strengthen ECU filtering with team IDs (not just name tokens).
- Populate `data/public/*.json` from your CMS or a build step.
- Address Tailwind content pattern warning by scoping patterns (avoid matching all of `node_modules`).
- (Optional) Fix ESLint hook‑deps warnings; ensure all dynamic text has stable SSR or is wrapped per‑node.
- Add monitoring for poller success and last update deltas.

**Notes**
- Tailwind preset shared via `@pirate-nation/config`.
- UI components live in `@pn/ui`.
- Shared types and Zod schemas in `@pirate-nation/types`.
- For Android/iOS later: consider PWA → TWA (Android) or Capacitor (iOS+Android), then React Native/Expo for full native.

See `docs/requirements.md` for detailed requirements and next steps.
