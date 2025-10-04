import { NextResponse } from 'next/server';
import { fetchEspnScoreboard, normalizeEspnScoreboard } from '@pirate-nation/fetcher';
import { cfbdProvider } from '../../../lib/scores/providers/cfbd';

type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<any> = null;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours for schedule-like data
const PROVIDER = process.env.SCORE_PROVIDER || 'espn';
const TEAM_NAME = process.env.TEAM_NAME || 'East Carolina';
const SEASON = Number(process.env.SEASON || '2025');

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
      const games = await provider.getTeamGames(TEAM_NAME, SEASON);
      const mapped = games
        .map((g: any) => {
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
        })
        .filter((g: any) => {
          try {
            if (!g.when) return false;
            const d = new Date(g.when as string);
            return Number.isFinite(d.getTime()) && d.getUTCFullYear() === SEASON;
          } catch { return false; }
        })
        .sort((a: any, b: any) => new Date(a.when as string).getTime() - new Date(b.when as string).getTime());
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
      const onlySeason = onlyEcu
        .filter((g) => {
          try {
            if (!g.when) return false;
            const d = new Date(g.when as string);
            return Number.isFinite(d.getTime()) && d.getUTCFullYear() === SEASON;
          } catch { return false; }
        })
        .sort((a, b) => {
          const ta = a.when ? new Date(a.when as string).getTime() : 0;
          const tb = b.when ? new Date(b.when as string).getTime() : 0;
          return ta - tb;
        });
      cache = { data: onlySeason, ts: now };
      return NextResponse.json(onlySeason);
    }
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
