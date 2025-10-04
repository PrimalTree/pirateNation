import { NextResponse } from 'next/server';
import { fetchEspnScoreboard, normalizeEspnScoreboard } from '@pirate-nation/fetcher';
import { cfbdProvider } from '../../../lib/scores/providers/cfbd';

type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<any> = null;
const TTL_MS = 15 * 1000; // 15 seconds for live scores
const PROVIDER = process.env.SCORE_PROVIDER || 'espn';
const TEAM_NAME = process.env.TEAM_NAME || 'East Carolina';

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data);
    }
    if (PROVIDER === 'cfbd') {
      const apiKey = process.env.CFBD_API_KEY as string | undefined;
      if (!apiKey) return NextResponse.json([], { status: 200 });
      const provider = cfbdProvider(apiKey);
      // Pull entire season and consider current/nearest game context client-side
      const games = await provider.getTeamGames(TEAM_NAME);
      const mapped = games.map((g: any) => {
        const home = { name: g.home_team, score: g.home_points ?? '', homeAway: 'home' };
        const away = { name: g.away_team, score: g.away_points ?? '', homeAway: 'away' };
        const status = g.status || (Number.isFinite(Number(home.score)) && Number.isFinite(Number(away.score)) ? 'final' : 'scheduled');
        return {
          provider: 'cfbd',
          provider_id: String(g.id ?? `${g.home_team}-${g.away_team}-${g.start_date}`),
          name: `${away.name} at ${home.name}`,
          when: g.start_date,
          settings: { provider: 'cfbd', teams: [home, away], status, venue: g.venue, broadcast: g.tv },
          hash: `${g.home_team}-${g.away_team}-${g.start_date}`,
        };
      });
      cache = { data: mapped, ts: now };
      return NextResponse.json(mapped);
    } else {
      const raw = await fetchEspnScoreboard();
      const normalized = normalizeEspnScoreboard(raw);
      const onlyEcu = normalized.filter((g) => {
        try {
          const name = (g?.name ?? '').toString().toLowerCase();
          const teams: any[] | undefined = (g?.settings as any)?.teams;
          const teamHit = Array.isArray(teams) && teams.some((t) => String(t?.name ?? '').toLowerCase().includes('east carolina') || String(t?.name ?? '').toUpperCase() === 'ECU');
          const nameHit = name.includes('east carolina') || name.split(/[^a-z]/i).includes('ecu');
          return teamHit || nameHit;
        } catch {
          return false;
        }
      });
      cache = { data: onlyEcu, ts: now };
      return NextResponse.json(onlyEcu);
    }
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
