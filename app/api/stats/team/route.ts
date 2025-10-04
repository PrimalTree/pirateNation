import { NextResponse } from 'next/server';
import { fetchEspnTeamStats, normalizeEspnTeamStats } from '@pirate-nation/fetcher';
import { cfbdProvider } from '../../../../lib/scores/providers/cfbd';
import fs from 'node:fs/promises';
import path from 'node:path';

const ECU_TEAM_ID = '151';
const TEAM_NAME = process.env.TEAM_NAME || 'East Carolina';
const PROVIDER = process.env.SCORE_PROVIDER || 'espn';
type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<any> = null;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) return NextResponse.json(cache.data);
    if (PROVIDER === 'cfbd') {
      const apiKey = process.env.CFBD_API_KEY as string | undefined;
      if (!apiKey) return NextResponse.json({}, { status: 200 });
      const provider = cfbdProvider(apiKey, process.env.OPENWEATHER_API_KEY);
      let stats = await provider.getTeamStats(TEAM_NAME);
      // Try cached team stats first if provider is empty
      if (!stats || Object.values(stats).every((v) => v == null)) {
        try {
          const p = path.join(process.cwd(), 'data', 'public', 'cfbd', 'team.json');
          const raw = await fs.readFile(p, 'utf-8');
          const json = JSON.parse(raw);
          if (json?.stats) stats = json.stats;
        } catch {}
      }
      // Fallback to static schedule-derived PPG if empty
      if (!stats || Object.values(stats).every((v) => v == null)) {
        try {
          const p = path.join(process.cwd(), 'data', 'public', 'schedule.json');
          const raw = await fs.readFile(p, 'utf-8');
          const json = JSON.parse(raw) as { games?: Array<any> };
          const games = Array.isArray(json?.games) ? json.games : [];
          let pts = 0; let cnt = 0;
          for (const g of games) {
            const res = g?.result;
            if (!res) continue;
            const home: string = String(res.home || g?.home || '').toLowerCase();
            const away: string = String(res.away || g?.away || '').toLowerCase();
            const isHome = home.includes('east carolina') || home.split(/[^a-z]/i).includes('ecu');
            const isAway = away.includes('east carolina') || away.split(/[^a-z]/i).includes('ecu');
            if (!isHome && !isAway) continue;
            const hs = Number(res.homeScore);
            const as = Number(res.awayScore);
            if (Number.isFinite(hs) && Number.isFinite(as)) {
              pts += isHome ? hs : as; cnt += 1;
            }
          }
          const ppg = cnt > 0 ? pts / cnt : null;
          stats = { pointsPerGame: ppg } as any;
        } catch {}
      }
      cache = { data: stats, ts: now };
      return NextResponse.json(stats);
    } else {
      const raw = await fetchEspnTeamStats(ECU_TEAM_ID);
      let stats = normalizeEspnTeamStats(raw as any);
      if (!stats || Object.values(stats).every((v) => v == null)) {
        try {
          const p = path.join(process.cwd(), 'data', 'public', 'schedule.json');
          const raw2 = await fs.readFile(p, 'utf-8');
          const json = JSON.parse(raw2) as { games?: Array<any> };
          const games = Array.isArray(json?.games) ? json.games : [];
          let pts = 0; let cnt = 0;
          for (const g of games) {
            const res = g?.result;
            if (!res) continue;
            const home: string = String(res.home || g?.home || '').toLowerCase();
            const away: string = String(res.away || g?.away || '').toLowerCase();
            const isHome = home.includes('east carolina') || home.split(/[^a-z]/i).includes('ecu');
            const isAway = away.includes('east carolina') || away.split(/[^a-z]/i).includes('ecu');
            if (!isHome && !isAway) continue;
            const hs = Number(res.homeScore);
            const as = Number(res.awayScore);
            if (Number.isFinite(hs) && Number.isFinite(as)) {
              pts += isHome ? hs : as; cnt += 1;
            }
          }
          const ppg = cnt > 0 ? pts / cnt : null;
          stats = { pointsPerGame: ppg } as any;
        } catch {}
      }
      cache = { data: stats, ts: now };
      return NextResponse.json(stats);
    }
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}
