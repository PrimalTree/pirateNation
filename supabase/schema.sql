-- Enable required extensions
create extension if not exists pgcrypto;

-- Custom types
do $$ begin
  create type ugc_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- Users table (mirror of auth.users id for convenience)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'user',
  display_name text,
  avatar_url text,
  bio text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sponsors
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  logo_url text,
  flight_start timestamptz,
  flight_end timestamptz,
  created_at timestamptz not null default now()
);

-- Sponsor impressions
create table if not exists public.sponsor_impressions (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  device_hash text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Games
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Chats (rooms)
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete set null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- UGC posts
create table if not exists public.ugc_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  status ugc_status not null default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Polls (options stored as JSON array of strings)
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  allow_anonymous boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Poll votes (one per poll per user or device)
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  device_hash text,
  choice_index int not null,
  created_at timestamptz not null default now(),
  check (choice_index >= 0)
);

-- Uniqueness: one vote per user per poll, or per device when user is null
create unique index if not exists poll_votes_unique_user
  on public.poll_votes (poll_id, user_id)
  where user_id is not null;

create unique index if not exists poll_votes_unique_device
  on public.poll_votes (poll_id, device_hash)
  where user_id is null and device_hash is not null;

-- Donation routes
create table if not exists public.donation_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Players
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  username text,
  nil_links jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Feature flags
create table if not exists public.feature_flags (
  key text primary key,
  description text,
  enabled boolean not null default false,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

-- RLS Setup
alter table public.profiles enable row level security;
alter table public.ugc_posts enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chats enable row level security;
alter table public.poll_votes enable row level security;
alter table public.polls enable row level security;
alter table public.sponsors enable row level security;
alter table public.games enable row level security;
alter table public.players enable row level security;

-- profiles: user can read/write own profile
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ugc_posts
-- Public can read approved posts (and owners may read their own)
drop policy if exists ugc_posts_read_public on public.ugc_posts;
create policy ugc_posts_read_public on public.ugc_posts
  for select using (status = 'approved' or auth.uid() = user_id);

-- Only owner can insert
drop policy if exists ugc_posts_insert_owner on public.ugc_posts;
create policy ugc_posts_insert_owner on public.ugc_posts
  for insert with check (auth.uid() = user_id);

-- Owner can update their post but not change status unless moderator/admin
drop policy if exists ugc_posts_update_owner on public.ugc_posts;
create policy ugc_posts_update_owner on public.ugc_posts
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (new.status = old.status)
  );

-- Moderators/Admins can update (e.g., change status)
drop policy if exists ugc_posts_update_moderator on public.ugc_posts;
create policy ugc_posts_update_moderator on public.ugc_posts
  for update using ((auth.jwt() ->> 'role') in ('moderator','admin'))
  with check (true);

-- chat_messages
-- Authenticated can insert their own messages
drop policy if exists chat_messages_insert_auth on public.chat_messages;
create policy chat_messages_insert_auth on public.chat_messages
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Public can read messages for active rooms only
drop policy if exists chat_messages_select_active on public.chat_messages;
create policy chat_messages_select_active on public.chat_messages
  for select using (
    exists (
      select 1 from public.chats c
      where c.id = chat_messages.chat_id and c.is_active = true
    )
  );

-- Note: Implement application-level rate limiting for inserts (e.g., 1 msg/sec).

-- chats: allow public read of active rooms
drop policy if exists chats_select_public on public.chats;
create policy chats_select_public on public.chats
  for select using (is_active = true);

-- polls: public read
drop policy if exists polls_select_public on public.polls;
create policy polls_select_public on public.polls
  for select using (true);

-- poll_votes
-- Anyone can read votes
drop policy if exists poll_votes_select_public on public.poll_votes;
create policy poll_votes_select_public on public.poll_votes
  for select using (true);

-- Insert: authenticated user voting as themselves OR anonymous via device hash
drop policy if exists poll_votes_insert_rules on public.poll_votes;
create policy poll_votes_insert_rules on public.poll_votes
  for insert with check (
    (
      auth.role() = 'authenticated' and new.user_id = auth.uid()
    )
    or (
      new.user_id is null and new.device_hash is not null
    )
  );

-- sponsors: public read
drop policy if exists sponsors_select_public on public.sponsors;
create policy sponsors_select_public on public.sponsors
  for select using (true);

-- games: public read
drop policy if exists games_select_public on public.games;
create policy games_select_public on public.games
  for select using (true);

-- players: public read (demo visibility)
drop policy if exists players_select_public on public.players;
create policy players_select_public on public.players
  for select using (true);

-- Basic updated_at triggers (optional but helpful)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Live games cache for Realtime fanout
create table if not exists public.live_games (
  game_id text primary key,
  score_json jsonb not null,
  hash text not null,
  updated_at timestamptz not null default now()
);

-- RLS: public can read, only service role can write (via service key)
alter table public.live_games enable row level security;

drop policy if exists live_games_select_public on public.live_games;
create policy live_games_select_public on public.live_games
  for select using (true);

drop policy if exists live_games_insert_service on public.live_games;
create policy live_games_insert_service on public.live_games
  for insert with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists live_games_update_service on public.live_games;
create policy live_games_update_service on public.live_games
  for update using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

-- Optional: include table in "supabase_realtime" publication
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.live_games';
  end if;
exception when duplicate_object then null; end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_profiles_updated_at'
  ) then
    create trigger set_profiles_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_ugc_posts_updated_at'
  ) then
    create trigger set_ugc_posts_updated_at
      before update on public.ugc_posts
      for each row execute function public.set_updated_at();
  end if;
end $$;
