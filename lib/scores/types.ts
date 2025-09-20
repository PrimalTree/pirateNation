export type RawGame = {
  id: number;
  season: number;
  week: number;
  start_date: string;
  start_time: string;
  status: string;
  home_team: string;
  away_team: string;
  home_points: number;
  away_points: number;
  venue: string;
  home_conference: string;
};

export type NormalizedGame = {
  game_id: string;
  provider: string;
  provider_id: string;
  season: number;
  week: number;
  start_time_utc: string;
  status: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  venue: string;
  conference: string;
};
