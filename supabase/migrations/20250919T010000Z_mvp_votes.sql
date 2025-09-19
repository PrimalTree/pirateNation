-- MVP fan votes
create table if not exists public.mvp_votes (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default now() not null,
  category text not null check (category in ('OMVP','DMVP')),
  player_id text not null,
  player_name text not null,
  message text,
  week int,
  game_id text,
  user_id uuid,
  ip inet,
  user_agent text
);

alter table public.mvp_votes enable row level security;

do $$ begin
  perform 1 from pg_policies where schemaname = 'public' and tablename = 'mvp_votes' and policyname = 'mvp_votes_read';
  if not found then
    create policy mvp_votes_read on public.mvp_votes for select to anon, authenticated using (true);
  end if;
end $$;

