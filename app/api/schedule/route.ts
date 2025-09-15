import { NextResponse } from 'next/server';
import { fetchEspnScoreboard, normalizeEspnScoreboard } from '@pirate-nation/fetcher';

type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<ReturnType<typeof normalizeEspnScoreboard>> = null;
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours for schedule-like data

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
    const only2025 = onlyEcu
      .filter((g) => {
        try {
          if (!g.when) return false;
          const d = new Date(g.when as string);
          return Number.isFinite(d.getTime()) && d.getUTCFullYear() === 2025;
        } catch { return false; }
      })
      .sort((a, b) => {
        const ta = a.when ? new Date(a.when as string).getTime() : 0;
        const tb = b.when ? new Date(b.when as string).getTime() : 0;
        return ta - tb;
      });
    cache = { data: only2025, ts: now };
    return NextResponse.json(only2025);
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
