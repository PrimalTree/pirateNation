import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetchEspnScoreboard, normalizeEspnScoreboard, type NormalizedGame } from '../services/fetcher/espn.js';

export type LiveSyncOptions = {
  supabase: SupabaseClient;
  liveSourceUrl?: string;
  adminPollToken?: string;
};

export type LiveSyncResult = {
  total: number;
  updated: number;
};

export function createServiceRoleClient(url: string, serviceRole: string): SupabaseClient {
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}

function stableStringify(value: unknown) {
  const seen = new WeakSet();
  return JSON.stringify(value, function (key, val) {
    void key;
    if (val && typeof val === 'object') {
      if (seen.has(val)) return undefined;
      seen.add(val);
      if (!Array.isArray(val)) {
        return Object.keys(val)
          .sort()
          .reduce((acc: any, k) => {
            acc[k] = (val as any)[k];
            return acc;
          }, {});
      }
    }
    return val;
  });
}

function hashPayload(obj: unknown) {
  return crypto.createHash('sha256').update(stableStringify(obj)).digest('hex');
}

async function upsertLiveGames(supabase: SupabaseClient, items: NormalizedGame[]) {
  if (items.length === 0) return { updated: 0 };

  const ids = items.map((i) => i.provider_id);
  const { data: existing, error: selErr } = await supabase
    .from('live_games')
    .select('game_id, hash')
    .in('game_id', ids);

  if (selErr) throw selErr;

  const byId = new Map((existing || []).map((row) => [row.game_id, row.hash as string | null]));

  const upserts = items
    .map((item) => {
      const hash = hashPayload(item.settings);
      const prev = byId.get(item.provider_id);
      if (prev && prev === hash) return null;
      return {
        game_id: item.provider_id,
        score_json: item.settings,
        hash,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean) as Array<{ game_id: string; score_json: Record<string, unknown>; hash: string; updated_at: string }>;

  if (upserts.length === 0) return { updated: 0 };

  const { error: upErr } = await supabase.from('live_games').upsert(upserts, { onConflict: 'game_id' });
  if (upErr) throw upErr;
  return { updated: upserts.length };
}

export async function syncLiveScores({ supabase, liveSourceUrl, adminPollToken }: LiveSyncOptions): Promise<LiveSyncResult> {
  const headers = adminPollToken ? { Authorization: `Bearer ${adminPollToken}` } : undefined;
  const json = await fetchEspnScoreboard({ url: liveSourceUrl, headers });
  const normalized = normalizeEspnScoreboard(json);
  const { updated } = await upsertLiveGames(supabase, normalized);
  return { total: normalized.length, updated };
}
