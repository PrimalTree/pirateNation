import { NextResponse } from 'next/server';
import { fetchEspnTeamLeaders, normalizeEspnTeamLeaders } from '@pirate-nation/fetcher';

const ECU_TEAM_ID = '151';
type CacheEntry<T> = { data: T; ts: number } | null;
let cache: CacheEntry<any> = null;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < TTL_MS) return NextResponse.json(cache.data);
    const raw = await fetchEspnTeamLeaders(ECU_TEAM_ID);
    const leaders = normalizeEspnTeamLeaders(raw as any);
    cache = { data: leaders, ts: now };
    return NextResponse.json(leaders);
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}

