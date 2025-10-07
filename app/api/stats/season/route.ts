import { NextResponse } from 'next/server';

const DEFAULT_TEAM = process.env.TEAM_NAME || 'East Carolina';
const CFBD_BASE = 'https://api.collegefootballdata.com';

export const revalidate = 300;

type MetricBundle = {
  team: SeasonBasicStats | null;
  opponent: SeasonBasicStats | null;
};

type SeasonBasicStats = {
  team: string;
  conference: string | null;
  games: number | null;
  pointsPerGame: number | null;
  pointsAllowedPerGame: number | null;
  yardsPerPlay: number | null;
  playsPerGame: number | null;
  passYardsPerGame: number | null;
  rushYardsPerGame: number | null;
};

type FetchInput = {
  team: string;
  opponent?: string;
  year: number;
  key: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const team = (url.searchParams.get('team') || DEFAULT_TEAM).trim();
    const yearParam = Number(url.searchParams.get('year'));
    const year = Number.isFinite(yearParam) && yearParam > 0 ? yearParam : new Date().getFullYear();
    const opponentParam = url.searchParams.get('opponent')?.trim() || undefined;
    const key = process.env.CFBD_API_KEY;
    if (!key) {
      return NextResponse.json(buildEmptyPayload(team, year, opponentParam ?? null));
    }

    const bundle = await getSeasonBasicBundle({ team, opponent: opponentParam, year, key });
    return NextResponse.json({
      source: 'cfbd',
      team: bundle.team,
      opponent: bundle.opponent,
      year,
      opponentName: opponentParam ?? bundle.opponent?.team ?? null,
      ts: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'failed' }, { status: 500 });
  }
}

function buildEmptyPayload(team: string, year: number, opponent: string | null) {
  return {
    source: 'empty',
    team: { team, conference: null, games: null, pointsPerGame: null, pointsAllowedPerGame: null, yardsPerPlay: null, playsPerGame: null, passYardsPerGame: null, rushYardsPerGame: null },
    opponent: null,
    year,
    opponentName: opponent,
    ts: Date.now(),
  };
}

async function getSeasonBasicBundle({ team, opponent, year, key }: FetchInput): Promise<MetricBundle> {
  const [teamStats, opponentStats] = await Promise.all([
    fetchSeasonForTeam(team, year, key),
    opponent ? fetchSeasonForTeam(opponent, year, key) : Promise.resolve<SeasonBasicStats | null>(null),
  ]);
  return { team: teamStats, opponent: opponentStats };
}

async function fetchSeasonForTeam(team: string, year: number, key: string): Promise<SeasonBasicStats | null> {
  const url = new URL(`${CFBD_BASE}/stats/season`);
  url.searchParams.set('year', String(year));
  url.searchParams.set('team', team);
  url.searchParams.set('seasonType', 'regular');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`CFBD season stats error: ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  const entry = pickSeasonEntry(json, team);
  if (!entry) return null;
  return normalizeSeasonEntry(entry, team);
}

type CfbdSeasonEntry = Record<string, unknown> & { team?: string; conference?: string };

function pickSeasonEntry(payload: unknown, team: string): CfbdSeasonEntry | null {
  if (!Array.isArray(payload)) return null;
  const target = normalize(team);
  for (const row of payload as CfbdSeasonEntry[]) {
    const candidate = normalize(row?.team ?? '');
    if (candidate === target) return row;
  }
  return payload.length ? (payload[0] as CfbdSeasonEntry) : null;
}

function normalizeSeasonEntry(entry: CfbdSeasonEntry, fallbackTeam: string): SeasonBasicStats {
  return {
    team: (entry?.team as string) ?? fallbackTeam,
    conference: (entry?.conference as string) ?? null,
    games: pickNumber(entry, ['games', 'g']),
    pointsPerGame: pickNumber(entry, ['pointsPerGame', 'points_per_game']),
    pointsAllowedPerGame: pickNumber(entry, ['pointsAllowedPerGame', 'points_allowed_per_game']),
    yardsPerPlay: pickNumber(entry, ['yardsPerPlay', 'yards_per_play']),
    playsPerGame: pickNumber(entry, ['playsPerGame', 'plays_per_game']),
    passYardsPerGame: pickNumber(entry, ['passYardsPerGame', 'pass_yards_per_game', 'passingYardsPerGame']),
    rushYardsPerGame: pickNumber(entry, ['rushYardsPerGame', 'rush_yards_per_game', 'rushingYardsPerGame']),
  };
}

function pickNumber(entry: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(entry, key)) continue;
    const num = toNumber(entry[key]);
    if (num != null) return num;
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function normalize(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}
