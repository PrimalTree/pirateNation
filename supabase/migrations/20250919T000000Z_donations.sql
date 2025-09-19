-- Donations table for fan contributions
create table if not exists public.donations (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now() not null,
  stripe_session_id text unique,
  amount numeric not null,
  recipient text check (recipient in ('OMVP','DMVP','TEAM')),
  message text,
  week int,
  game_id text,
  status text default 'paid'
);

-- Basic RLS: allow read for anon, inserts via service role only
alter table public.donations enable row level security;

do $$ begin
  perform 1 from pg_policies where schemaname = 'public' and tablename = 'donations' and policyname = 'donations_read';
  if not found then
    create policy donations_read on public.donations for select to anon, authenticated using (true);
  end if;
end $$;

-- Service role inserts are done from server API; no user inserts policy.

