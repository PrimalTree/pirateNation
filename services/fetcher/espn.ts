/* @ts-nocheck */
// Edge-compatible ESPN fetcher and normalizer
import { z } from 'zod';
export const EspnEventSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  shortName: z.string().optional(),
  date: z.string().optional(),
  status: z.object({ type: z.object({ state: z.string().optional() }).partial() }).partial().optional(),
  competitions: z.array(z.object({
    id: z.string().optional(),
    venue: z.object({
      fullName: z.string().optional(),
      address: z.object({ city: z.string().optional(), state: z.string().optional() }).partial().optional()
    }).partial().optional(),
    competitors: z.array(z.object({
      id: z.string().optional(),
      team: z.object({ id: z.string().optional(), displayName: z.string().optional(), shortDisplayName: z.string().optional() }).partial(),
      score: z.string().optional(),
      homeAway: z.string().optional()
    }).partial()).optional()
  }).partial()).optional()
});
export const EspnScoreboardSchema = z.object({
  events: z.array(EspnEventSchema)
});
export type NormalizedGame = {
  provider: 'espn';
  provider_id: string;
  name: string;
  when?: string;
  settings: Record<string, unknown>;
  hash: string;
};
export function hashString(input: string): string {
  // Simple non-crypto hash suitable for change detection; edge-compatible
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16);
}
export function hexToUuidLike(hex: string): string {
  // Expand/normalize to 32 chars
  const s = (hex + '0'.repeat(32)).slice(0, 32);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}
export function normalizeEspnEvent(evt: z.infer<typeof EspnEventSchema>): NormalizedGame {
  const title = evt.name || evt.shortName || `ESPN Event ${evt.id}`;
  const comp = evt.competitions?.[0];
  const venue = comp?.venue?.fullName;
  const city = comp?.venue?.address?.city;
  const state = comp?.venue?.address?.state;
  const teams = comp?.competitors?.map((c) => ({
    id: c.team?.id,
    name: c.team?.displayName || c.team?.shortDisplayName,
    score: c.score,
    homeAway: c.homeAway
  }));
  const settings = {
    provider: 'espn',
    provider_id: evt.id,
    venue,
    location: { city, state },
    teams,
    status: evt.status?.type?.state,
    raw_competition_id: comp?.id
  } as Record<string, unknown>;
  const payloadForHash = JSON.stringify({ title, when: evt.date, settings });
  const hash = hashString(payloadForHash);
  return {
    provider: 'espn',
    provider_id: evt.id,
    name: title,
    when: evt.date,
    settings,
    hash
  };
}
export function normalizeEspnScoreboard(json: unknown): NormalizedGame[] {
  const ECU_TEAM_ID = '151';
  const parsed = EspnScoreboardSchema.parse(json);
  return parsed.events
    .filter((evt) => {
      const teams = evt.competitions?.[0]?.competitors?.map((c) => c.team?.id);
      return teams?.includes(ECU_TEAM_ID);
    })
    .map((evt) => normalizeEspnEvent(evt));
}
export type FetchEspnScoreboardInput = string | {
  url?: string;
  headers?: Record<string, string>;
};
export async function fetchEspnScoreboard(input?: FetchEspnScoreboardInput): Promise<unknown> {
  let target: string | undefined;
  let headers: Record<string, string> | undefined;
  if (typeof input === 'string') {
    target = input;
  } else if (input) {
    target = input.url;
    headers = input.headers;
  }
  const url = target ?? 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard';
  try {
    const res = await fetch(url, { cache: 'no-store', headers });
    if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
    return await res.json();
  } catch {
    // Fallback demo payload (one event)
    return {
      events: [
        {
          id: 'demo-123',
          name: 'Demo Pirates vs. Corsairs',
          date: new Date().toISOString(),
          competitions: [
            {
              id: 'comp-1',
              venue: { fullName: 'Demo Field', address: { city: 'Harbor', state: 'NC' } },
              competitors: [
                { team: { id: 't1', displayName: 'Pirates' }, score: '21', homeAway: 'home' },
                { team: { id: 't2', displayName: 'Corsairs' }, score: '17', homeAway: 'away' }
              ]
            }
          ]
        }
      ]
    };
  }
}

export const EspnTeamScheduleSchema = z.object({
  events: z.array(z.object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    competitions: z.array(z.object({
      venue: z.object({
        fullName: z.string()
      }),
      broadcasts: z.array(z.object({
        media: z.object({
          shortName: z.string()
        })
      })).optional()
    }))
  }))
});
export async function fetchEspnTeamSchedule(teamId: string): Promise<unknown> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/schedule`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
  return await res.json();
}
export function normalizeEspnTeamSchedule(json: unknown) {
  const parsed = EspnTeamScheduleSchema.parse(json);
  return parsed.events.map(event => ({
    id: event.id,
    name: event.name,
    when: event.date,
    venue: event.competitions[0].venue.fullName,
    broadcast: event.competitions[0].broadcasts?.[0]?.media?.shortName ?? 'TBD'
  }));
}
export const EspnTeamRosterSchema = z.object({
  athletes: z.array(z.object({
    items: z.array(z.object({
      id: z.string(),
      displayName: z.string(),
      position: z.object({
        abbreviation: z.string()
      }),
      jersey: z.string().optional()
    }))
  }))
});
export async function fetchEspnTeamRoster(teamId: string): Promise<unknown> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/roster`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
  return await res.json();
}
export function normalizeEspnTeamRoster(json: unknown) {
  const parsed = EspnTeamRosterSchema.parse(json);
  return parsed.athletes.flatMap(athleteGroup =>
    athleteGroup.items.map(player => ({
      id: player.id,
      name: player.displayName,
      position: player.position.abbreviation,
      number: player.jersey ? parseInt(player.jersey, 10) : null
    }))
  );
}
// --- Team statistics (best-effort, structure can vary) ---
export async function fetchEspnTeamStats(teamId: string, season?: number): Promise<unknown> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/statistics${season ? `?season=${season}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN team stats failed: ${res.status}`);
  return await res.json();
}
export function normalizeEspnTeamStats(json: any) {
  try {
    const cats: any[] = Array.isArray(json?.statistics) ? json.statistics : [];
    const flat: Record<string, any> = {};
    for (const c of cats) {
      const groupStats: any[] = Array.isArray(c?.stats) ? c.stats : [];
      for (const s of groupStats) {
        if (!s?.name) continue;
        flat[s.name] = s.value ?? s.displayValue ?? null;
      }
    }
    return {
      pointsPerGame: Number(flat.pointsPerGame ?? flat.ppg ?? 0) || null,
      totalYardsPerGame: Number(flat.totalYardsPerGame ?? flat.yardsPerGame ?? 0) || null,
      rushingYardsPerGame: Number(flat.rushingYardsPerGame ?? 0) || null,
      passingYardsPerGame: Number(flat.passingYardsPerGame ?? 0) || null,
      thirdDownConversionPct: Number(flat.thirdDownConversionPct ?? flat.thirdDownConvPct ?? 0) || null,
      turnovers: Number(flat.turnovers ?? 0) || null,
    };
  } catch {
    return {};
  }
}
// --- Team leaders (best-effort) ---
export async function fetchEspnTeamLeaders(teamId: string, season?: number): Promise<unknown> {
  // Known ESPN endpoints vary; try leaders endpoint, fallback to team endpoint with leaders enabled
  const tryUrls = [
    `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}/leaders${season ? `?season=${season}` : ''}`,
    `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}?enable=leaders${season ? `&season=${season}` : ''}`
  ];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch {}
  }
  throw new Error('ESPN team leaders unavailable');
}
export function normalizeEspnTeamLeaders(json: any) {
  // Produce a compact map of categories => { name, value }
  const out: Record<string, { name: string; value: number | string }> = {};
  try {
    const source = json?.leaders || json?.team?.leaders || json; // try a few roots
    const categories: any[] = Array.isArray(source?.leaders) ? source.leaders : Array.isArray(source) ? source : [];
    for (const cat of categories) {
      const key = String(cat?.name || cat?.displayName || '').toLowerCase();
      const leaders: any[] = Array.isArray(cat?.leaders) ? cat.leaders : [];
      const top = leaders[0];
      if (!top) continue;
      const athleteName = top?.athlete?.displayName || top?.athlete?.fullName || top?.displayName || '—';
      const value = top?.value ?? top?.displayValue ?? null;
      if (!key) continue;
      out[key] = { name: String(athleteName), value: value as any };
    }
  } catch {}
  return out;
}
