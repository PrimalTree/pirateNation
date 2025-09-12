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
  const parsed = EspnScoreboardSchema.parse(json);
  return parsed.events.map((evt) => normalizeEspnEvent(evt));
}

export async function fetchEspnScoreboard(url?: string): Promise<unknown> {
  const target = url ?? 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard';
  try {
    const res = await fetch(target, { cache: 'no-store' });
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
