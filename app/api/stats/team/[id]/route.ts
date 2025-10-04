import { NextResponse } from 'next/server';
import { fetchEspnTeamStats, normalizeEspnTeamStats } from '@pirate-nation/fetcher';
import { cfbdProvider } from '../../../../../lib/scores/providers/cfbd';
import fs from 'node:fs/promises';
import path from 'node:path';

type CacheEntry<T> = { data: T; ts: number } | null;
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const cacheMap = new Map<string, CacheEntry<any>>();
const PROVIDER = process.env.SCORE_PROVIDER || 'espn';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const teamId = String(resolved?.id || '').trim();
    if (!teamId) return NextResponse.json({}, { status: 400 });
    const now = Date.now();
    const hit = cacheMap.get(teamId);
    if (hit && now - hit.ts < TTL_MS) return NextResponse.json(hit.data);
    if (PROVIDER === 'cfbd') {
      const apiKey = process.env.CFBD_API_KEY as string | undefined;
      if (!apiKey) return NextResponse.json({}, { status: 200 });
      const provider = cfbdProvider(apiKey, process.env.OPENWEATHER_API_KEY);
      const teamName = decodeURIComponent(teamId);
      let stats = await provider.getTeamStats(teamName);
      if (!stats || Object.values(stats).every((v) => v == null)) {
        // Fallback: try cached CFBD opponent stats
        try {
          const safe = teamName.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
          const p = path.join(process.cwd(), 'data', 'public', 'cfbd', 'opponents', `${safe}.json`);
          const raw = await fs.readFile(p, 'utf-8');
          const json = JSON.parse(raw);
          if (json?.stats) stats = json.stats;
        } catch {}
      }
      if (!stats || Object.values(stats).every((v) => v == null)) {
        // Fallback: derive PPG against ECU from static schedule if present
        try {
          const p = path.join(process.cwd(), 'data', 'public', 'schedule.json');
          const raw = await fs.readFile(p, 'utf-8');
          const json = JSON.parse(raw) as { games?: Array<any> };
          const games = Array.isArray(json?.games) ? json.games : [];
          let pts = 0; let cnt = 0;
          for (const g of games) {
            const res = g?.result;
            if (!res) continue;
            const home: string = String(res.home || g?.home || '');
            const away: string = String(res.away || g?.away || '');
            const isHome = home.toLowerCase().includes(teamName.toLowerCase());
            const isAway = away.toLowerCase().includes(teamName.toLowerCase());
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
      cacheMap.set(teamId, { data: stats, ts: now });
      return NextResponse.json(stats);
    } else {
      const raw = await fetchEspnTeamStats(teamId);
      const stats = normalizeEspnTeamStats(raw as any);
      cacheMap.set(teamId, { data: stats, ts: now });
      return NextResponse.json(stats);
    }
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}
