-- Uniqueness constraints to prevent duplicate voting by IP per week/game
do $$ begin
  begin
    alter table public.mvp_votes
      add constraint mvp_unique_per_game_ip unique (category, week, game_id, ip);
  exception when duplicate_table then null; when duplicate_object then null; end;
  begin
    alter table public.poll_votes
      add constraint poll_unique_per_game_ip unique (poll_key, week, game_id, ip);
  exception when duplicate_table then null; when duplicate_object then null; end;
end $$;

