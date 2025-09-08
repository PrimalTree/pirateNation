**Supabase Schema**

- Files: `schema.sql` (tables, RLS), `seed.sql` (demo data)

**Apply Locally (Supabase CLI)**
- Start: `supabase start`
- Get DB URL: `supabase status` (copy `DB URL`)
- Apply schema: `psql "$DB_URL" -f supabase/schema.sql`
- Seed: `psql "$DB_URL" -f supabase/seed.sql`

**Apply to Remote**
- Set `DB_URL` to your Postgres connection string.
- Run the same `psql` commands above.

After applying, verify RLS is enabled and seed rows exist in `games`, `sponsors`, `polls`, and `players`.

