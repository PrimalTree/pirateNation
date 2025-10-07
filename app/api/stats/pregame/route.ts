import { NextResponse } from 'next/server';
import { cfbdProvider } from '../../../../lib/scores/providers/cfbd';
import {
  fetchEspnScoreboard,
  normalizeEspnScoreboard,
  fetchEspnTeamSchedule,
} from '@pirate-nation/fetcher';
import { getForecastForDate, type ForecastResult } from '../../../../lib/weather/openweather';
import fs from 'node:fs/promises';
import path from 'node:path';

type TeamEntry = { name?: string | null; homeAway?: string | null };

type WeatherPayload = {
  temp_f: number | null;
  temp_max_f: number | null;
  temp_min_f: number | null;
  description: string | null;
  icon: string | null;
  wind_mph: number | null;
  humidity: number | null;
  source: string;
  debug?: Record<string, unknown>;
};

type PregameResponse = {
  opponent: string | null;
  kickoff: string | null;
  venue: string | null;
  broadcast: string | null;
  status: string | null;
  teams: TeamEntry[] | null;
  gameName: string | null;
  weather: WeatherPayload | null;
};

type BaseGameInfo = {
  opponent: string | null;
  kickoff: string | null;
  venue: string | null;
  broadcast: string | null;
  status: string | null;
  teams: TeamEntry[] | null;
  gameName: string | null;
  venueCity: string | null;
  venueState: string | null;
  isHome: boolean;
};

type CachedEntry = { body: PregameResponse; ts: number };

declare const process: NodeJS.Process;

const TEAM_NAME = process.env.TEAM_NAME || 'East Carolina';
const TEAM_SLUG = TEAM_NAME.toLowerCase();
const ECU_TEAM_ID = '151';
const SCORE_PROVIDER = (process.env.SCORE_PROVIDER || 'espn').toLowerCase();
const FALLBACK_CITY = 'Greenville';
const FALLBACK_STATE = 'NC';
const CACHE_TTL_MS = 60_120 * 1000; // ~16.7 hours

const OPPONENT_CITY_OVERRIDES: Array<{ match: RegExp; city: string; state: string }> = [
  { match: /tulane/i, city: 'New Orleans', state: 'LA' },
  { match: /navy/i, city: 'Annapolis', state: 'MD' },
  { match: /appalachian state/i, city: 'Boone', state: 'NC' },
  { match: /memphis/i, city: 'Memphis', state: 'TN' },
  { match: /south florida|usf/i, city: 'Tampa', state: 'FL' },
  { match: /florida atlantic|fau/i, city: 'Boca Raton', state: 'FL' },
  { match: /rice/i, city: 'Houston', state: 'TX' },
];

let cache: CachedEntry | null = null;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get('debug') === '1';
    const teamParam = url.searchParams.get('team');
    const opponentOverride = url.searchParams.get('opponent') || undefined;
    const yearParam = Number(url.searchParams.get('year'));
    const teamName = teamParam || TEAM_NAME;
    const year = Number.isFinite(yearParam) && yearParam > 0 ? yearParam : new Date().getFullYear();
    const now = Date.now();

    if (cache && now - cache.ts < CACHE_TTL_MS) {
      const payload = clone(cache.body);
      if (!debug && payload.weather?.debug) {
        delete payload.weather.debug;
      }
      return NextResponse.json({ ...payload, ts: now });
    }

    let baseInfo: BaseGameInfo | null = null;

    if (SCORE_PROVIDER === 'cfbd') {
      baseInfo = await buildBaseFromCfbd({ teamName, year });
    } else {
      baseInfo = await buildBaseFromEspn({ teamName, opponentOverride });
    }

    if (!baseInfo) {
      baseInfo = await buildBaseFromStaticSchedule({ opponentOverride });
    }

    if (!baseInfo) {
      const fallback: PregameResponse = {
        opponent: opponentOverride ?? null,
        kickoff: null,
        venue: null,
        broadcast: null,
        status: null,
        teams: null,
        gameName: null,
        weather: buildWeatherPayload(null, true, null),
      };
      cache = { body: fallback, ts: now };
      return NextResponse.json({ ...fallback, ts: now });
    }

    const opponentFinal = opponentOverride ?? baseInfo.opponent ?? null;
    const openWeatherKey = process.env.OPENWEATHER_API_KEY || '';

    const { city: venueCity, state: venueState } = resolveCityState({
      city: baseInfo.venueCity,
      state: baseInfo.venueState,
      opponent: opponentFinal,
      isHome: baseInfo.isHome,
    });

    const weatherResult = openWeatherKey
      ? await getForecastForDate({
          apiKey: openWeatherKey,
          city: venueCity,
          state: venueState,
          country: 'US',
          fallbackCity: FALLBACK_CITY,
          fallbackState: FALLBACK_STATE,
          targetISO: baseInfo.kickoff,
        })
      : null;

    const weatherPayload = buildWeatherPayload(weatherResult, true, baseInfo.kickoff);

    const responseBody: PregameResponse = {
      opponent: opponentFinal,
      kickoff: baseInfo.kickoff,
      venue: baseInfo.venue,
      broadcast: baseInfo.broadcast,
      status: baseInfo.status,
      teams: baseInfo.teams,
      gameName: baseInfo.gameName,
      weather: weatherPayload,
    };

    cache = { body: responseBody, ts: now };

    const payload = clone(responseBody);
    if (!debug && payload.weather?.debug) {
      delete payload.weather.debug;
    }

    return NextResponse.json({ ...payload, ts: now });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

function clone<T>(value: T): T {
  const sc = (globalThis as unknown as { structuredClone?: (value: T) => T }).structuredClone;
  if (typeof sc === 'function') {
    return sc(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function buildWeatherPayload(result: ForecastResult | null, preserveDebug: boolean, targetISO: string | null): WeatherPayload {
  if (!result) {
    const payload: WeatherPayload = {
      temp_f: null,
      temp_max_f: null,
      temp_min_f: null,
      description: null,
      icon: null,
      wind_mph: null,
      humidity: null,
      source: 'none',
    };
    if (preserveDebug) {
      payload.debug = {
        targetISO: targetISO ?? null,
        method: 'none',
      };
    }
    return payload;
  }
  const payload: WeatherPayload = {
    temp_f: result.temp_f ?? null,
    temp_max_f: result.temp_max_f ?? null,
    temp_min_f: result.temp_min_f ?? null,
    description: result.description ?? null,
    icon: result.icon ?? null,
    wind_mph: result.wind_mph ?? null,
    humidity: result.humidity ?? null,
    source: result.source,
  };
  if (result.debug && preserveDebug) {
    payload.debug = result.debug;
  }
  return payload;
}

function resolveCityState({
  city,
  state,
  opponent,
  isHome,
}: {
  city: string | null;
  state: string | null;
  opponent: string | null;
  isHome: boolean;
}): { city: string; state: string } {
  let resolvedCity = city ?? null;
  let resolvedState = state ?? null;

  if ((!resolvedCity || !resolvedState) && opponent) {
    const override = OPPONENT_CITY_OVERRIDES.find((entry) => entry.match.test(opponent));
    if (override) {
      if (!resolvedCity) resolvedCity = override.city;
      if (!resolvedState) resolvedState = override.state;
    }
  }

  if (!resolvedCity && isHome) {
    resolvedCity = FALLBACK_CITY;
    resolvedState = FALLBACK_STATE;
  }

  if (!resolvedCity) {
    resolvedCity = FALLBACK_CITY;
  }
  if (!resolvedState) {
    resolvedState = FALLBACK_STATE;
  }

  return { city: resolvedCity, state: resolvedState };
}

function sanitizeIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function detectOpponentFromTeams(teams: TeamEntry[] | null): { opponent: string | null; isHome: boolean } {
  if (!Array.isArray(teams)) {
    return { opponent: null, isHome: false };
  }
  const ecuEntry = teams.find((team) => isTeamMatch(team?.name));
  const opponentEntry = teams.find((team) => team !== ecuEntry);
  return {
    opponent: opponentEntry?.name ?? null,
    isHome: (ecuEntry?.homeAway || '').toLowerCase() === 'home',
  };
}

function isTeamMatch(name?: string | null): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  if (lower.includes(TEAM_SLUG)) return true;
  if (lower.includes('east carolina')) return true;
  return lower.split(/[^a-z]/i).includes('ecu');
}

async function buildBaseFromEspn({
  teamName,
  opponentOverride,
}: {
  teamName: string;
  opponentOverride?: string;
}): Promise<BaseGameInfo | null> {
  const now = Date.now();
  let scoreboardRaw: unknown;
  try {
    scoreboardRaw = await fetchEspnScoreboard();
  } catch {
    return null;
  }

  const normalized = normalizeEspnScoreboard(scoreboardRaw).filter((game) => {
    try {
      const name = String(game?.name ?? '').toLowerCase();
      const teams: any[] | undefined = (game?.settings as any)?.teams;
      const teamHit =
        Array.isArray(teams) &&
        teams.some((entry) => isTeamMatch(entry?.name));
      const nameHit = name.includes(TEAM_SLUG) || name.split(/[^a-z]/i).includes('ecu');
      return teamHit || nameHit;
    } catch {
      return false;
    }
  });

  const current =
    normalized.find((game) => String((game?.settings as any)?.status ?? '').toLowerCase().includes('live')) ||
    normalized.find((game) => {
      if (!game?.when) return false;
      const ts = new Date(game.when as string).getTime();
      return Number.isFinite(ts) && ts >= now;
    }) ||
    normalized[normalized.length - 1];

  if (!current) {
    return null;
  }

  let kickoffISO = sanitizeIso((current.when as string) ?? null);
  let teams: TeamEntry[] | null = Array.isArray((current as any)?.settings?.teams)
    ? ((current as any).settings.teams as TeamEntry[])
    : null;
  const initialDetection = detectOpponentFromTeams(teams);
  let opponentFromTeams = initialDetection.opponent;
  let isHome = initialDetection.isHome;
  let opponent = opponentOverride ?? opponentFromTeams;

  let venueCity: string | null = null;
  let venueState: string | null = null;
  let venue: string | null = (current as any)?.settings?.venue ?? null;
  let broadcast: string | null = null;

  const scheduleRaw = await safeFetchSchedule();
  if (scheduleRaw) {
    const scheduleEvent = selectNearestScheduleEvent(scheduleRaw, kickoffISO, now);
    if (scheduleEvent) {
      const comp = scheduleEvent?.competitions?.[0];
      const venueInfo = comp?.venue || scheduleEvent?.venue;
      venue = venue ?? venueInfo?.fullName ?? venueInfo?.name ?? null;
      const address = venueInfo?.address;
      venueCity = (address?.city ?? venueInfo?.city ?? null) ?? venueCity;
      venueState = (address?.state ?? null) ?? venueState;
      broadcast = broadcast ?? extractBroadcast(comp);
      if (!kickoffISO) {
        const eventDate = comp?.date ?? scheduleEvent?.date ?? null;
        const isoCandidate = sanitizeIso(eventDate ?? null);
        if (isoCandidate) {
          kickoffISO = isoCandidate;
        }
      }
      if ((!teams || !teams.length) && Array.isArray(comp?.competitors)) {
        teams = comp.competitors.map((competitor: any) => ({
          name:
            competitor?.team?.displayName ??
            competitor?.team?.shortDisplayName ??
            competitor?.team?.name ??
            competitor?.displayName ??
            null,
          homeAway: competitor?.homeAway ?? null,
        }));
      }
    }
  }

  if (!venueCity || !venueState) {
    const location = (current as any)?.settings?.location;
    venueCity = venueCity ?? (location?.city ?? null);
    venueState = venueState ?? (location?.state ?? null);
  }

  const updatedDetection = detectOpponentFromTeams(teams);
  opponentFromTeams = updatedDetection.opponent;
  isHome = updatedDetection.isHome;
  opponent = opponentOverride ?? opponentFromTeams ?? opponent;

  const status = (current as any)?.settings?.status ?? 'Scheduled';

  return {
    opponent: opponent ?? null,
    kickoff: kickoffISO,
    venue,
    broadcast,
    status: status ?? null,
    teams,
    gameName: current?.name ?? null,
    venueCity,
    venueState,
    isHome,
  };
}

async function safeFetchSchedule(): Promise<any | null> {
  try {
    return await fetchEspnTeamSchedule(ECU_TEAM_ID);
  } catch {
    return null;
  }
}

function selectNearestScheduleEvent(scheduleRaw: any, kickoffISO: string | null, now: number) {
  const events = Array.isArray(scheduleRaw?.events) ? scheduleRaw.events : [];
  if (!events.length) return null;
  const candidates: Array<{ event: any; ts: number }> = [];
  for (const event of events) {
    const comp = Array.isArray(event?.competitions) ? event.competitions[0] : null;
    const dateStr = comp?.date ?? event?.date ?? comp?.startDate ?? comp?.start ?? null;
    const ts = dateStr ? new Date(dateStr).getTime() : NaN;
    if (Number.isFinite(ts)) {
      candidates.push({ event, ts });
    }
  }

  if (!candidates.length) return null;
  const target = kickoffISO ? new Date(kickoffISO).getTime() : NaN;
  if (Number.isFinite(target)) {
    candidates.sort((a, b) => Math.abs(a.ts - target) - Math.abs(b.ts - target));
    return candidates[0].event;
  }
  candidates.sort((a, b) => Math.abs(a.ts - now) - Math.abs(b.ts - now));
  return candidates[0].event;
}

function extractBroadcast(comp: any): string | null {
  const broadcast = Array.isArray(comp?.broadcasts) ? comp.broadcasts[0] : null;
  if (!broadcast) return null;
  return broadcast?.media?.shortName ?? broadcast?.name ?? null;
}

async function buildBaseFromCfbd({ teamName, year }: { teamName: string; year: number }): Promise<BaseGameInfo | null> {
  const apiKey = process.env.CFBD_API_KEY;
  if (!apiKey) return null;
  const provider = cfbdProvider(apiKey, undefined);
  let games: any[] = [];
  try {
    games = await provider.getTeamGames(teamName, year);
  } catch {
    return null;
  }

  const withTimestamps: Array<{ game: any; ts: number }> = [];
  for (const game of games) {
    const ts = new Date(game?.start_date ?? '').getTime();
    if (Number.isFinite(ts)) {
      withTimestamps.push({ game, ts });
    }
  }
  if (!withTimestamps.length) return null;

  const now = Date.now();
  withTimestamps.sort((a, b) => a.ts - b.ts);
  const upcoming = withTimestamps.find(({ ts }) => ts >= now) ?? withTimestamps[withTimestamps.length - 1];
  const targetGame = upcoming.game;
  const kickoff = sanitizeIso(targetGame?.start_date ?? null);
  const homeTeam = String(targetGame?.home_team ?? '') || null;
  const awayTeam = String(targetGame?.away_team ?? '') || null;
  const isHome = homeTeam ? isTeamMatch(homeTeam) : false;
  const opponent = isHome ? awayTeam : homeTeam;
  const teams: TeamEntry[] = [
    { name: homeTeam, homeAway: 'home' },
    { name: awayTeam, homeAway: 'away' },
  ];
  const gameName =
    targetGame?.name ||
    (homeTeam && awayTeam ? `${awayTeam} at ${homeTeam}` : null);

  return {
    opponent: opponent ?? null,
    kickoff,
    venue: targetGame?.venue ?? null,
    broadcast: targetGame?.tv ?? null,
    status: targetGame?.status ?? (kickoff && Date.now() < new Date(kickoff).getTime() ? 'Scheduled' : null),
    teams,
    gameName,
    venueCity: targetGame?.venue_city ?? null,
    venueState: targetGame?.venue_state ?? null,
    isHome,
  };
}

async function buildBaseFromStaticSchedule({ opponentOverride }: { opponentOverride?: string }): Promise<BaseGameInfo | null> {
  try {
    const schedulePath = path.join(process.cwd(), 'data', 'public', 'schedule.json');
    const raw = await fs.readFile(schedulePath, 'utf-8');
    const json = JSON.parse(raw) as { games?: Array<any> };
    const games = Array.isArray(json?.games) ? json.games : [];
    if (!games.length) return null;
    const now = Date.now();
    const withTs: Array<{ game: any; ts: number }> = [];
    for (const game of games) {
      if (!game.when) continue;
      const ts = new Date(game.when as string).getTime();
      if (Number.isFinite(ts)) {
        withTs.push({ game, ts });
      }
    }
    if (!withTs.length) return null;
    withTs.sort((a, b) => a.ts - b.ts);
    const upcoming = withTs.find(({ ts }) => ts >= now) ?? withTs[withTs.length - 1];
    const target = upcoming.game;
    const kickoff = sanitizeIso(target?.when ?? null);
    const { opponent, isHome } = deriveOpponentFromName(target?.name ?? '', opponentOverride);

    return {
      opponent,
      kickoff,
      venue: target?.venue ?? null,
      broadcast: target?.broadcast ?? null,
      status: kickoff && Date.now() < new Date(kickoff).getTime() ? 'Scheduled' : null,
      teams: null,
      gameName: target?.name ?? null,
      venueCity: null,
      venueState: null,
      isHome,
    };
  } catch {
    return null;
  }
}

function deriveOpponentFromName(name: string, override?: string): { opponent: string | null; isHome: boolean } {
  if (override) {
    return { opponent: override, isHome: false };
  }
  const parts = name.split(/\s+(at|vs\.?|vs)\s+/i);
  if (parts.length < 3) return { opponent: null, isHome: false };
  const host = parts[0];
  const guest = parts.slice(2).join(' ');
  const hostIsTeam = isTeamMatch(host);
  const guestIsTeam = isTeamMatch(guest);
  if (guestIsTeam) {
    return { opponent: host.trim(), isHome: false };
  }
  if (hostIsTeam) {
    return { opponent: guest.trim(), isHome: true };
  }
  return { opponent: null, isHome: false };
}

