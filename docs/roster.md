CFBD → Supabase Roster ETL

Overview
- Fetches team roster from CollegeFootballData (CFBD) and inserts/updates `public.players` in Supabase.
- Stores position and derived `side` (offense | defense | special) in `players.metadata`.
- Optionally assigns a `game_id` to associate the roster with a specific game for MVP views.

Environment
- CFBD_API_KEY: CFBD API bearer token
- SUPABASE_URL: Supabase project URL
- SUPABASE_SERVICE_ROLE: Supabase service role key (server-side only)
- CFBD_TEAM_NAME: Team name (default: East Carolina)
- CFBD_YEAR: Season year (default: current year)
- TARGET_GAME_ID: Optional `public.games.id` value to stamp on `players.game_id`

Usage
- Run: `pnpm roster:cfbd`
- Under the hood: compiles `cron/fetchRosterFromCFBD.ts` and runs the script.

What it does
- Fetch roster from CFBD `/roster?team=<team>&year=<year>`.
- Build `players` rows with:
  - `username`: "First Last"
  - `game_id`: `TARGET_GAME_ID` if provided
  - `metadata`: `{ cfbd_id, position, side, number, class, height, weight, hometown, source: 'cfbd' }`
- Update existing players matched by `metadata.cfbd_id`.
- If no CFBD match, attempt match by `username` (single match only), update metadata.
- Insert new records for remaining players.
- Cleanup pass: ensures `metadata.side` is set based on `metadata.position` where missing.

Notes
- Requires service role key; never expose it to the client.
- Realtime can be enabled on `public.players` for live admin dashboards, but not required.
- For public roster JSON endpoints, you can continue to populate `data/public/roster.json` as needed; this ETL focuses on Supabase `players`.

