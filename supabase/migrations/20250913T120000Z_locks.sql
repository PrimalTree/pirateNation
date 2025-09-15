-- Lightweight distributed locks for background workers (poller)
-- Safe to run multiple times; uses IF NOT EXISTS and guarded policy drops

begin;

create table if not exists public.locks (
  key text primary key,
  owner text not null,
  expires_at timestamptz not null
);

alter table public.locks enable row level security;

drop policy if exists locks_insert_service on public.locks;
create policy locks_insert_service on public.locks
  for insert with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists locks_update_service on public.locks;
create policy locks_update_service on public.locks
  for update using ((auth.jwt() ->> 'role') = 'service_role')
  with check ((auth.jwt() ->> 'role') = 'service_role');

drop policy if exists locks_delete_service on public.locks;
create policy locks_delete_service on public.locks
  for delete using ((auth.jwt() ->> 'role') = 'service_role');

commit;

