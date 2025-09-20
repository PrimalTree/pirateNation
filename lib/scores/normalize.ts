import { RawGame, NormalizedGame } from './types';

function mapCfbdStatus(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'PREGAME';
    case 'in_progress':
    case 'halftime':
      return 'IN_PROGRESS';
    case 'completed':
      return 'FINAL';
    case 'postponed':
      return 'POSTPONED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'UNKNOWN';
  }
}

export function normalizeCfbd(g: RawGame): NormalizedGame {
  return {
    game_id: `cfbd-${g.id}`,
    provider: 'cfbd',
    provider_id: String(g.id),
    season: g.season,
    week: g.week,
    start_time_utc: `${g.start_date.substring(0,10)}T${g.start_time}Z`,
    status: mapCfbdStatus(g.status),
    home_team: g.home_team,
    away_team: g.away_team,
    home_score: g.home_points,
    away_score: g.away_points,
    venue: g.venue,
    conference: g.home_conference,
  };
}
