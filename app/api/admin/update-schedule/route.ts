import { NextResponse } from 'next/server';
import { fetchEspnTeamSchedule, normalizeEspnTeamSchedule, fetchEspnScoreboard, normalizeEspnScoreboard } from '../../../../services/fetcher/espn';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const ECU_TEAM_ID = '151';

async function enrichWithScores(games: any[]) {
  const byDate = new Map<string, any[]>();
  for (const g of games) {
    if (!g.when) continue;
    const d = new Date(g.when);
    if (!Number.isFinite(d.getTime())) continue;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const key = `${y}${m}${day}`;
    const list = byDate.get(key) || [];
    list.push({ game: g, ts: d.getTime() });
    byDate.set(key, list);
  }

  const out: any[] = [];
  for (const [yyyymmdd, dayGames] of byDate.entries()) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${yyyymmdd}`;
      const sbJson = await fetchEspnScoreboard(url as any);
      const allEvents = normalizeEspnScoreboard(sbJson);
      const ecuEvents = allEvents.filter((evt: any) => {
        const teams: any[] = Array.isArray((evt as any)?.settings?.teams) ? (evt as any).settings.teams : [];
        const names = teams.map((t) => String(t?.name || '').toLowerCase());
        return names.some((n) => n.includes('east carolina') || n.split(/[^a-z]/i).includes('ecu'));
      });

      for (const { game, ts } of dayGames) {
        const best = ecuEvents
          .map((e: any) => ({ e, t: e.when ? new Date(e.when as string).getTime() : Number.NaN }))
          .filter((x: any) => Number.isFinite(x.t))
          .map((x: any) => ({ e: x.e, diff: Math.abs(x.t - ts) }))
          .sort((a: any, b: any) => a.diff - b.diff)[0]?.e;
        if (best) {
          const teams: any[] = Array.isArray((best as any)?.settings?.teams) ? (best as any).settings.teams : [];
          const home = teams.find((t) => t?.homeAway === 'home') ?? teams[0];
          const away = teams.find((t) => t?.homeAway === 'away') ?? teams[1];
          const hs = home?.score;
          const as = away?.score;
          if (hs !== undefined && hs !== '' && as !== undefined && as !== '') {
            (game as any).result = {
              home: home?.name,
              away: away?.name,
              homeScore: isNaN(Number(hs)) ? hs : Number(hs),
              awayScore: isNaN(Number(as)) ? as : Number(as)
            };
            (game as any).final = `${away?.name ?? 'Away'} ${as} – ${home?.name ?? 'Home'} ${hs}`;
          }
        }
        out.push(game);
      }
    } catch {
      for (const { game } of dayGames) out.push(game);
    }
  }
  return out;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const secret = process.env.CRON_SECRET || process.env.ADMIN_POLL_TOKEN || '';
  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const scheduleData = await fetchEspnTeamSchedule(ECU_TEAM_ID);
    const normalized = normalizeEspnTeamSchedule(scheduleData);
    const enriched = await enrichWithScores(normalized);
    const out = {
      season: new Date().getFullYear(),
      games: enriched,
    };
    const filePath = path.join(process.cwd(), 'data/public/schedule.json');
    await fs.writeFile(filePath, JSON.stringify(out, null, 2), 'utf8');
    return NextResponse.json({ ok: true, count: enriched.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

