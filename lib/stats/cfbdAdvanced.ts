const CFBD_BASE = 'https://api.collegefootballdata.com';

type MetricGroup = {
  successRate: number | null;
  ppa: number | null;
  explosiveness: number | null;
};

type CfbdAdvancedEntry = {
  team?: string;
  conference?: string;
  offense?: Record<string, unknown> | null;
  defense?: Record<string, unknown> | null;
};

export type TeamAdvancedStats = {
  team: string;
  conference: string | null;
  offense: MetricGroup;
  defense: MetricGroup;
};

type BundleInput = {
  team: string;
  opponent?: string;
  year: number;
  key: string;
};

type BundleOutput = {
  team: TeamAdvancedStats | null;
  opponent: TeamAdvancedStats | null;
};

const headers = (key: string) => ({ Authorization: `Bearer ${key}` });

export async function getSeasonAdvancedBundle({ team, opponent, year, key }: BundleInput): Promise<BundleOutput> {
  const [teamStats, oppStats] = await Promise.all([
    fetchAdvancedForTeam(team, year, key),
    opponent ? fetchAdvancedForTeam(opponent, year, key) : Promise.resolve<TeamAdvancedStats | null>(null),
  ]);
  return { team: teamStats, opponent: oppStats };
}

async function fetchAdvancedForTeam(team: string, year: number, key: string): Promise<TeamAdvancedStats | null> {
  const url = new URL(`${CFBD_BASE}/stats/season/advanced`);
  url.searchParams.set('year', String(year));
  url.searchParams.set('team', team);
  url.searchParams.set('seasonType', 'regular');
  const res = await fetch(url.toString(), { headers: headers(key), cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`CFBD advanced stats error: ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  const entry = pickEntry(json, team);
  if (!entry) return null;
  return normalizeAdvancedEntry(entry, team);
}

function pickEntry(payload: unknown, team: string): CfbdAdvancedEntry | null {
  if (!Array.isArray(payload)) return null;
  const normalized = normalizeName(team);
  for (const row of payload as CfbdAdvancedEntry[]) {
    const candidate = normalizeName(row?.team ?? '');
    if (candidate === normalized) return row;
  }
  return payload.length ? (payload[0] as CfbdAdvancedEntry) : null;
}

function normalizeAdvancedEntry(entry: CfbdAdvancedEntry, fallbackTeam: string): TeamAdvancedStats {
  const offense = entry?.offense ?? {};
  const defense = entry?.defense ?? {};
  return {
    team: (entry?.team ?? fallbackTeam) as string,
    conference: (entry?.conference as string) ?? null,
    offense: {
      successRate: pickNumber(offense, ['successRate', 'success_rate']),
      ppa: pickNumber(offense, ['ppa', 'predictedPointsAdded', 'predicted_points_added']),
      explosiveness: pickNumber(offense, ['explosiveness', 'explosion', 'explosiveness_rate']),
    },
    defense: {
      successRate: pickNumber(defense, ['successRate', 'success_rate']),
      ppa: pickNumber(defense, ['ppa', 'predictedPointsAdded', 'predicted_points_added']),
      explosiveness: pickNumber(defense, ['explosiveness', 'explosion', 'explosiveness_rate']),
    },
  };
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = source?.[key];
    const num = toNumber(value);
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

function normalizeName(value: string | undefined | null): string {
  return String(value ?? '').trim().toLowerCase();
}
