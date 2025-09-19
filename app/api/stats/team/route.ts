import { NextResponse } from 'next/server';
import { fetchEspnTeamStats, normalizeEspnTeamStats } from '@pirate-nation/fetcher';

const ECU_TEAM_ID = '151';
type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<any> = null;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) return NextResponse.json(cache.data);
    const raw = await fetchEspnTeamStats(ECU_TEAM_ID);
    const stats = normalizeEspnTeamStats(raw as any);
    cache = { data: stats, ts: now };
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}

