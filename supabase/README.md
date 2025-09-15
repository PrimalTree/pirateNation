**Supabase Schema**

- Files: `schema.sql` (tables, RLS), `seed.sql` (demo data)

**Apply Locally (Supabase CLI)**
- Start: `supabase start`
- Get DB URL: `supabase status` (copy `DB URL`)
- Apply schema: `psql "$DB_URL" -f supabase/schema.sql`
- Seed: `psql "$DB_URL" -f supabase/seed.sql`

Or using migrations (recommended):
- Generate: `supabase migration new <name>`
- Push all migrations: `supabase db push`
- Reset (dangerous; drops and recreates): `supabase db reset`
- This repo includes `supabase/migrations/20250913T120000Z_locks.sql` for the poller lock table.

**Apply to Remote**
- Set `DB_URL` to your Postgres connection string.
- Run the same `psql` commands above.

Or via migrations:
- Set `SUPABASE_DB_URL` or use `supabase link --project-ref <ref>`
- Then `supabase db push` to apply pending migrations.

After applying, verify RLS is enabled and seed rows exist in `games`, `sponsors`, `polls`, and `players`.
