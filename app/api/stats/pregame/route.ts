import { NextResponse } from 'next/server';
import {
  fetchEspnScoreboard,
  normalizeEspnScoreboard,
  fetchEspnTeamSchedule,
  normalizeEspnTeamSchedule,
} from '@pirate-nation/fetcher';

type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<any> = null;
const TTL_MS = 60 * 1000;

const ECU_NAME = 'east carolina';
const ECU_TEAM_ID = '151';

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data);
    }

    const sbRaw = await fetchEspnScoreboard();
    let schedRaw: unknown | null = null;
    try {
      schedRaw = await fetchEspnTeamSchedule(ECU_TEAM_ID);
    } catch {}

    const events = normalizeEspnScoreboard(sbRaw)
      .filter((g) => {
        try {
          const name = (g?.name ?? '').toString().toLowerCase();
          const teams: any[] | undefined = (g?.settings as any)?.teams;
          const teamHit = Array.isArray(teams) && teams.some((t) => String(t?.name ?? '').toLowerCase().includes(ECU_NAME) || String(t?.name ?? '').toUpperCase() === 'ECU');
          const nameHit = name.includes(ECU_NAME) || name.split(/[^a-z]/i).includes('ecu');
          return teamHit || nameHit;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const ta = a.when ? new Date(a.when as string).getTime() : 0;
        const tb = b.when ? new Date(b.when as string).getTime() : 0;
        return ta - tb;
      });

    // pick current live or next upcoming
    const isLive = (g: any) => String((g?.settings as any)?.status ?? '').toLowerCase().includes('live');
    const current = events.find(isLive) || events.find((g) => (g.when ? new Date(g.when as string).getTime() : 0) >= now) || events[events.length - 1];

    const sched = schedRaw ? normalizeEspnTeamSchedule(schedRaw) : [] as any[];
    // Try to find a schedule entry near the current game's time to extract broadcast & venue
    let broadcast: string | undefined;
    let venue: string | undefined;
    if (current?.when) {
      const target = new Date(current.when as string).getTime();
      let nearest = { diff: Infinity, item: null as any };
      for (const s of sched) {
        const t = new Date(s.when).getTime();
        const diff = Math.abs(t - target);
        if (diff < nearest.diff) nearest = { diff, item: s };
      }
      if (nearest.item) {
        broadcast = nearest.item.broadcast;
        venue = nearest.item.venue;
      }
    }

    // opponent name
    let opponent: string | undefined;
    try {
      const teams: any[] = Array.isArray((current as any)?.settings?.teams) ? ((current as any).settings.teams as any[]) : [];
      const findEcu = (n?: string) => {
        const t = (n ?? '').toLowerCase();
        return t.includes(ECU_NAME) || t.split(/[^a-z]/i).includes('ecu');
      };
      const other = teams.find((t) => !findEcu(String(t?.name ?? '')));
      opponent = other?.name ?? undefined;
    } catch {}

    // Weather lookup (best-effort)
    let weather: any = null;
    try {
      const key = process.env.OPENWEATHER_API_KEY;
      const city = (current as any)?.settings?.location?.city as string | undefined;
      const state = (current as any)?.settings?.location?.state as string | undefined;
      if (key && city) {
        const q = encodeURIComponent(state ? `${city},${state},US` : `${city},US`);
        const wres = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=imperial&q=${q}&appid=${key}`, { cache: 'no-store' });
        if (wres.ok) {
          const wjson = await wres.json();
          weather = {
            temp_f: wjson?.main?.temp ?? null,
            description: wjson?.weather?.[0]?.description ?? null,
            icon: wjson?.weather?.[0]?.icon ?? null,
            wind_mph: wjson?.wind?.speed ?? null,
            humidity: wjson?.main?.humidity ?? null,
          };
        }
      }
    } catch {}

    const body = {
      opponent,
      kickoff: current?.when ?? null,
      venue: venue ?? null,
      broadcast: broadcast ?? null,
      status: (current as any)?.settings?.status ?? null,
      teams: (current as any)?.settings?.teams ?? null,
      gameName: current?.name ?? null,
      weather,
    };

    cache = { data: body, ts: now };
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
