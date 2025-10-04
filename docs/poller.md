Dedicated Poller Worker (Option C)
=================================

This worker polls a live source on an interval and upserts results into Supabase (`public.live_games`). It’s designed to run outside Vercel so you can achieve sub‑minute cadence reliably.
> Note: Vercel Hobby cron now runs once per day (see `vercel.json`). Use this worker for anything more frequent.

Requirements
- Node 20+ runtime (or Docker)
- Env vars:
  - SUPABASE_URL (required)
  - SUPABASE_SERVICE_ROLE or SUPABASE_SERVICE_ROLE_KEY (required)
  - LIVE_SOURCE_URL (optional; defaults to a demo ESPN endpoint in the fetcher)
  - ADMIN_POLL_TOKEN (optional; bearer token sent to LIVE_SOURCE_URL)
- LIVE_POLL_INTERVAL_MS (optional; default 30000)

Database setup
- Locks table and RLS policies are included in `supabase/schema.sql`.
- A standalone migration is also provided: `supabase/migrations/20250913T120000Z_locks.sql`.
  - Apply via Supabase SQL editor or the CLI (e.g., `supabase db push`).
  - No public SELECT policy is created; only `service_role` can insert/update/delete.

Run locally (no Docker)
- Build cron scripts: `pnpm compile-cron`
- Start poller: `pnpm poller` (or `node dist/cron/fetchLiveScores.js`)

Docker (recommended)
- Build: `docker build -f Dockerfile.poller -t pirate-poller .`
- Run:
  - `docker run --rm -e SUPABASE_URL -e SUPABASE_SERVICE_ROLE -e LIVE_SOURCE_URL -e ADMIN_POLL_TOKEN -e LIVE_POLL_INTERVAL_MS=30000 pirate-poller`

Docker Compose
- Copy your secrets into an `.env` file (not committed):
  - SUPABASE_URL=...
  - SUPABASE_SERVICE_ROLE=...
  - LIVE_SOURCE_URL=...
  - ADMIN_POLL_TOKEN=...
  - LIVE_POLL_INTERVAL_MS=30000
- Start: `docker compose -f docker-compose.poller.yml up -d --build`
- Health: container writes `/app/cron/.last-poller-run` after each successful cycle.

Systemd (VM)
Create `/etc/systemd/system/pirate-poller.service`:

```
[Unit]
Description=Pirate Nation Poller
After=network-online.target

[Service]
Environment=SUPABASE_URL=%i
Environment=SUPABASE_SERVICE_ROLE=%i
Environment=LIVE_SOURCE_URL=%i
Environment=LIVE_POLL_INTERVAL_MS=30000
ExecStart=/usr/bin/node /opt/pirate/dist/cron/fetchLiveScores.js
WorkingDirectory=/opt/pirate
Restart=always

[Install]
WantedBy=multi-user.target
```

Deploy app files under `/opt/pirate`, run `pnpm install && pnpm compile-cron`, then `systemctl enable --now pirate-poller`.

Notes
- Idempotent writes: the poller computes a stable hash and skips unchanged rows to minimize writes and broadcasts.
- Locking: For multi‑instance coordination, prefer one instance. If you need HA, add a lightweight DB lock (see `cron/mockScorePoller.ts` for a locks table pattern).
- Observability: Logs are simple stdout; consider shipping container logs to your provider or add metrics as needed.
- Fly.io
  - Install flyctl, then:
    - `fly launch --copy-config --now --dockerfile Dockerfile.poller -c fly.poller.toml`
    - Set secrets: `fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE=...` (and optional vars)
    - Scale to 1 machine: `fly scale count 1`

- Render.com
  - Use `render.poller.yaml` as a Blueprint.
  - In Render Dashboard, add environment variables for SUPABASE_URL and SUPABASE_SERVICE_ROLE.
  - Select a Worker service, Starter plan is fine for low cadence.
