import { NextResponse } from 'next/server';
import { getSeasonAdvancedBundle } from '../../../../../lib/stats/cfbdAdvanced';
import { inferUpcomingOpponent } from '../../../../../lib/stats/cfbdTeam';

const DEFAULT_TEAM = process.env.TEAM_NAME || 'East Carolina';

export const revalidate = 300;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const team = (url.searchParams.get('team') || DEFAULT_TEAM).trim();
    const opponentParam = url.searchParams.get('opponent')?.trim() || undefined;
    const yearParam = Number(url.searchParams.get('year'));
    const year = Number.isFinite(yearParam) && yearParam > 0 ? yearParam : new Date().getFullYear();
    const key = process.env.CFBD_API_KEY;
    if (!key) {
      return NextResponse.json(buildEmptyPayload(team, year, opponentParam ?? null));
    }

    let opponent = opponentParam;
    let inferred: string | null = null;
    if (!opponent) {
      try {
        inferred = await inferUpcomingOpponent(team, year, key);
        if (inferred) opponent = inferred;
      } catch {}
    }

    const { team: teamStats, opponent: opponentStats } = await getSeasonAdvancedBundle({
      team,
      opponent,
      year,
      key,
    });

    return NextResponse.json({
      source: 'cfbd',
      team: teamStats,
      opponent: opponentStats,
      year,
      opponentName: opponent ?? opponentStats?.team ?? null,
      inferredOpponent: !opponentParam && inferred ? inferred : null,
      ts: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'failed' }, { status: 500 });
  }
}

type EmptyPayload = {
  source: 'empty';
  team: null;
  opponent: null;
  year: number;
  opponentName: string | null;
  inferredOpponent: null;
  ts: number;
};

function buildEmptyPayload(_team: string, year: number, opponent: string | null): EmptyPayload {
  return {
    source: 'empty',
    team: null,
    opponent: null,
    year,
    opponentName: opponent ?? null,
    inferredOpponent: null,
    ts: Date.now(),
  };
}
