import { NextResponse } from 'next/server';
import { fetchEspnScoreboard, normalizeEspnScoreboard } from '@services/fetcher/espn';

type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<ReturnType<typeof normalizeEspnScoreboard>> = null;
const TTL_MS = 15 * 1000; // 15 seconds for live scores

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data);
    }
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
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
