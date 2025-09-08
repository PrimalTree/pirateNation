-- Seed data for Pirate Nation

-- Demo game
insert into public.games (id, name, settings)
values (
  gen_random_uuid(),
  'Demo Seas',
  '{"difficulty":"normal","map":"archipelago"}'::jsonb
)
on conflict do nothing;

-- Sponsors
insert into public.sponsors (id, name, website_url, logo_url)
values
  (gen_random_uuid(), 'Black Pearl Co.', 'https://blackpearl.example', 'https://img.example/blackpearl.png'),
  (gen_random_uuid(), 'Golden Doubloon Ltd.', 'https://doubloon.example', 'https://img.example/doubloon.png')
on conflict do nothing;

-- Poll with options
insert into public.polls (id, question, options, allow_anonymous, is_active)
values (
  gen_random_uuid(),
  'Where should we sail next?',
  '["North", "South", "Treasure Cove"]'::jsonb,
  true,
  true
)
on conflict do nothing;

-- Players with nil_links JSON
insert into public.players (id, username, nil_links, metadata)
values
  (gen_random_uuid(), 'captain_anne', '[{"rel":"twitter","href":"https://twitter.com/captain_anne"}]'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), 'first_mate_jack', '[{"rel":"lens","href":"https://lenster.xyz/u/jack"}]'::jsonb, '{}'::jsonb)
on conflict do nothing;

