-- Simple poll votes for user engagement
create table if not exists public.poll_votes (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now() not null,
  poll_key text not null,
  option_key text not null,
  week int,
  game_id text,
  user_id uuid,
  ip inet,
  user_agent text
);

alter table public.poll_votes enable row level security;

do $$ begin
  perform 1 from pg_policies where schemaname = 'public' and tablename = 'poll_votes' and policyname = 'poll_votes_read';
  if not found then
    create policy poll_votes_read on public.poll_votes for select to anon, authenticated using (true);
  end if;
end $$;

