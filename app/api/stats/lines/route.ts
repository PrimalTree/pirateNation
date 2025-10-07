import { NextResponse } from 'next/server';

const DEFAULT_TEAM = process.env.TEAM_NAME || 'East Carolina';
const CACHE_TTL_MS = 15 * 60 * 1000;
const SIGMA_MARGIN = Number(process.env.SPREAD_SIGMA || 13.5);

type CacheEntry = { data: LinesPayload; ts: number };
const cache = new Map<string, CacheEntry>();

type LinesPayload = {
  team: string;
  opponent: string | null;
  kickoff: string | null;
  isHome: boolean | null;
  bookCount: number;
  bestBook: string | null;
  spread: number | null;
  total: number | null;
  winProbability: number | null;
  lines: BookLine[];
  source: 'cfbd' | 'fallback' | 'empty';
};

type BookLine = {
  provider: string;
  spread: number | null;
  total: number | null;
  winProbability: number | null;
  lastUpdated: string | null;
  rawSpread: number | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = (url.searchParams.get('team') || DEFAULT_TEAM).trim();
  const yearParam = Number(url.searchParams.get('year'));
  const year = Number.isFinite(yearParam) && yearParam > 0 ? yearParam : new Date().getFullYear();
  const cacheKey = `${team.toLowerCase()}|${year}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached.data, cachedAt: cached.ts });
  }

  const apiKey = process.env.CFBD_API_KEY as string | undefined;
  if (!apiKey) {
    const empty = buildEmptyPayload(team);
    cache.set(cacheKey, { data: empty, ts: now });
    return NextResponse.json(empty);
  }

  const requestUrl = new URL('https://api.collegefootballdata.com/lines');
  requestUrl.searchParams.set('year', String(year));
  requestUrl.searchParams.set('team', team);
  if (!requestUrl.searchParams.has('seasonType')) {
    requestUrl.searchParams.set('seasonType', 'regular');
  }

  try {
    const res = await fetch(requestUrl.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const empty = buildEmptyPayload(team);
      cache.set(cacheKey, { data: empty, ts: now });
      return NextResponse.json(empty, { status: 200 });
    }
    const json = await res.json();
    const payload = normalizeLines(json, { team, year });
    cache.set(cacheKey, { data: payload, ts: now });
    return NextResponse.json(payload);
  } catch (err) {
    const fallback = buildEmptyPayload(team);
    cache.set(cacheKey, { data: fallback, ts: now });
    return NextResponse.json(fallback, { status: 200 });
  }
}

type NormalizeOptions = { team: string; year: number };

type CfbdLineEntry = {
  homeTeam?: string;
  home_team?: string;
  awayTeam?: string;
  away_team?: string;
  startDate?: string;
  start_date?: string;
  kickoff?: string;
  startTime?: string;
  lines?: CfbdBookLine[];
  spread?: number | string | null;
  overUnder?: number | string | null;
  total?: number | string | null;
};

type CfbdBookLine = {
  provider?: string | null;
  spread?: number | string | null;
  spreadOpen?: number | string | null;
  spread_open?: number | string | null;
  spreadCurrent?: number | string | null;
  spread_current?: number | string | null;
  overUnder?: number | string | null;
  overUnderOpen?: number | string | null;
  overUnderCurrent?: number | string | null;
  over_under?: number | string | null;
  over_under_open?: number | string | null;
  over_under_current?: number | string | null;
  total?: number | string | null;
  updated?: string | null;
  lastUpdated?: string | null;
  last_updated?: string | null;
};

function normalizeLines(raw: unknown, opts: NormalizeOptions): LinesPayload {
  const list: CfbdLineEntry[] = Array.isArray(raw) ? (raw as CfbdLineEntry[]) : [];
  if (!list.length) return buildEmptyPayload(opts.team);

  const enriched = list.map((entry) => {
    const ts = parseDate(getFirst(entry.startDate, entry.start_date, entry.kickoff, entry.startTime));
    return { entry, ts } as const;
  });

  const now = Date.now();
  enriched.sort((a, b) => {
    const aFuture = Number.isFinite(a.ts) && (a.ts as number) >= now;
    const bFuture = Number.isFinite(b.ts) && (b.ts as number) >= now;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    const aTs = Number.isFinite(a.ts) ? (a.ts as number) : Number.POSITIVE_INFINITY;
    const bTs = Number.isFinite(b.ts) ? (b.ts as number) : Number.POSITIVE_INFINITY;
    return aTs - bTs;
  });

  const target = enriched[0];
  if (!target) return buildEmptyPayload(opts.team);

  const { entry } = target;
  const isHome = inferHome(entry, opts.team);
  const opponent = inferOpponent(entry, opts.team);
  const kickoff = toISO(getFirst(entry.startDate, entry.start_date, entry.kickoff, entry.startTime));

  const booksRaw: CfbdBookLine[] = Array.isArray(entry.lines) ? entry.lines : [];
  const books = booksRaw
    .map((book) => normalizeBookLine(book, entry, isHome))
    .filter((book) => book.spread !== null || book.total !== null);

  if (!books.length) {
    const consensus = normalizeBookLine({}, entry, isHome, true);
    if (consensus.spread !== null || consensus.total !== null) books.push(consensus);
  }

  books.sort((a, b) => {
    if (a.lastUpdated && b.lastUpdated) return a.lastUpdated.localeCompare(b.lastUpdated);
    if (a.lastUpdated && !b.lastUpdated) return -1;
    if (!a.lastUpdated && b.lastUpdated) return 1;
    return a.provider.localeCompare(b.provider);
  });

  const best = selectBestBook(books);

  return {
    team: opts.team,
    opponent,
    kickoff,
    isHome,
    bookCount: books.length,
    bestBook: best?.provider ?? null,
    spread: best?.spread ?? null,
    total: best?.total ?? null,
    winProbability: best?.winProbability ?? null,
    lines: books,
    source: 'cfbd',
  } satisfies LinesPayload;
}

function normalizeBookLine(
  book: CfbdBookLine,
  entry: CfbdLineEntry,
  isHome: boolean | null,
  forceConsensus = false,
): BookLine {
  const provider = forceConsensus ? 'Consensus' : (book.provider || 'Unknown');
  const spreadRaw = toNumber(
    getFirst(
      book.spreadCurrent,
      book.spread_current,
      book.spread,
      book.spreadOpen,
      book.spread_open,
      entry.spread,
    ),
  );
  const totalRaw = toNumber(
    getFirst(
      book.overUnderCurrent,
      book.over_under_current,
      book.overUnder,
      book.over_under,
      book.overUnderOpen,
      book.over_under_open,
      book.total,
      entry.overUnder,
      entry.total,
    ),
  );

  const teamSpread = isHome == null || spreadRaw == null ? null : (isHome ? spreadRaw : -spreadRaw);
  const winProbability = teamSpread == null ? null : calcWinProbability(teamSpread);
  const lastUpdated = toISO(getFirst(book.lastUpdated, book.last_updated, book.updated));

  return {
    provider,
    spread: teamSpread,
    total: totalRaw,
    winProbability,
    lastUpdated,
    rawSpread: spreadRaw,
  };
}

function selectBestBook(books: BookLine[]): BookLine | null {
  if (!books.length) return null;
  const sorted = [...books].sort((a, b) => {
    const winA = a.winProbability ?? Number.NEGATIVE_INFINITY;
    const winB = b.winProbability ?? Number.NEGATIVE_INFINITY;
    if (winA !== winB) return winB - winA;
    const spreadA = a.spread ?? Number.POSITIVE_INFINITY;
    const spreadB = b.spread ?? Number.POSITIVE_INFINITY;
    if (spreadA !== spreadB) return spreadA - spreadB;
    return a.provider.localeCompare(b.provider);
  });
  return sorted[0] ?? null;
}

function buildEmptyPayload(team: string): LinesPayload {
  return {
    team,
    opponent: null,
    kickoff: null,
    isHome: null,
    bookCount: 0,
    bestBook: null,
    spread: null,
    total: null,
    winProbability: null,
    lines: [],
    source: 'empty',
  };
}

function inferHome(entry: CfbdLineEntry, team: string): boolean | null {
  const home = normalizeName(getFirst(entry.homeTeam, entry.home_team));
  const away = normalizeName(getFirst(entry.awayTeam, entry.away_team));
  const target = normalizeName(team);
  if (home && home === target) return true;
  if (away && away === target) return false;
  return null;
}

function inferOpponent(entry: CfbdLineEntry, team: string): string | null {
  const home = getFirst(entry.homeTeam, entry.home_team);
  const away = getFirst(entry.awayTeam, entry.away_team);
  const target = normalizeName(team);
  if (!home && !away) return null;
  if (home && normalizeName(home) !== target && home) return home;
  if (away && normalizeName(away) !== target && away) return away;
  return home && normalizeName(home) === target ? (away ?? null) : away && normalizeName(away) === target ? (home ?? null) : null;
}

function normalizeName(input: string | undefined | null): string | null {
  if (!input) return null;
  return input.toString().trim().toLowerCase();
}

function getFirst<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const sanitized = value.trim().replace(/[^0-9+\-.]/g, '');
    if (!sanitized) return null;
    const num = Number(sanitized);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function parseDate(value: string | null): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function toISO(value: string | null): string | null {
  if (!value) return null;
  const parsed = parseDate(value);
  if (parsed == null) return null;
  return new Date(parsed).toISOString();
}

function calcWinProbability(teamSpread: number): number {
  const sigma = SIGMA_MARGIN > 0 ? SIGMA_MARGIN : 13.5;
  const margin = -teamSpread;
  const z = margin / sigma;
  const prob = 0.5 * (1 + erf(z / Math.SQRT2));
  return clamp(prob, 0, 1);
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
