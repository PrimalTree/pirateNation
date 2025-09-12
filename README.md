**Pirate Nation Monorepo**

- PNPM workspaces with Next.js apps and shared packages.
- Apps: `apps/web` (port 3000), `apps/admin` (port 3001).
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
- Dev servers: `pnpm dev` (web on 3000, admin on 3001)
- Open: http://localhost:3000

**Environment**
- apps/web (client + server):
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_URL` and `SUPABASE_ANON_KEY` (for server components/actions)
- apps/admin (espn sync utility):
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

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
  - `POST /apps/admin/app/api/admin/sync-games` (when running admin locally)
  - Or deploy admin and hit `/api/admin/sync-games`
  - Body: `{ "url": "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard" }`

**Key Routes (Web)**
- `/` Home
- `/game/[id]` Game Hub (tabs: Feed, Polls, Chat, UGC, Map)
- `/map`, `/polls`, `/flag`, `/sponsors`, `/feedback`, `/legal/privacy`, `/legal/terms`
- `/mockup` Full UI mockup preview (from `@pn/ui`)

**PWA & Offline**
- Installable PWA with service worker and offline page.
- Service worker strategy:
  - Cache First for static assets (`/_next/static/**`, icons, manifest, fonts)
  - Network First for navigations with fallback to `/offline.html`
- Icons:
  - SVG any/maskable/monochrome in `apps/web/public/icons/`
  - PNG fallbacks referenced in manifest; generate from SVGs (see `apps/web/public/icons/GENERATE.md`)

**Testing**
- Web dev: `pnpm --filter ./apps/web dev`
- Game hub: navigate to `/game/<uuid>` for a seeded or existing game.
- Realtime: with tables enabled in Supabase Realtime, updates should stream into Feed/Chat/Score.
- PWA installability:
  - Chrome DevTools → Application → Manifest
  - Test “Install” and verify standalone launch
- Offline tests:
  - DevTools → Network → Offline → navigate → `offline.html` renders
  - Static assets should load from cache after first visit

**Build & Deploy**
- Build: `pnpm build`
- Start (web): `pnpm --filter ./apps/web start`
- Hosting: Vercel/Netlify/Node server all work (service worker lives in `/public`).
- Set env vars in your host for apps/web and apps/admin as needed.

**Notes**
- Tailwind preset shared via `@pirate-nation/config`.
- UI components live in `@pn/ui`.
- Shared types and Zod schemas in `@pirate-nation/types`.
- For Android/iOS later: consider PWA → TWA (Android) or Capacitor (iOS+Android), then React Native/Expo for full native.

See `docs/requirements.md` for detailed requirements and next steps.
