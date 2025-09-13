import 'dotenv/config';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function stableStringify(value: any) {
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

function normalizeLive(json: any) {
  const arr = Array.isArray(json) ? json : Array.isArray(json?.games) ? json.games : [];
  return arr
    .map((g: any) => {
      const gameId = String(g.id ?? g.game_id ?? '').trim();
      if (!gameId) return null;
      const when = g.when ?? g.date ?? g.start ?? null;
      const score = g.score ?? g.score_json ?? g;
      return { game_id: gameId, when, score_json: score };
    })
    .filter(Boolean) as { game_id: string; when?: string | null; score_json: any }[];
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const secret = process.env.CRON_SECRET || '';
    if (!secret || token !== secret) {
      return new Response('Forbidden', { status: 403 });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL as string;
    const SUPABASE_SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE as string) || (process.env.SUPABASE_SERVICE_ROLE_KEY as string);
    const ADMIN_POLL_TOKEN = process.env.ADMIN_POLL_TOKEN as string | undefined;
    const LIVE_URL = (process.env.LIVE_SOURCE_URL as string) || 'https://api.example.com/live';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return new Response('Missing Supabase env', { status: 500 });
    }

    const headers: Record<string, string> = { 'cache-control': 'no-store' } as any;
    if (ADMIN_POLL_TOKEN) headers['Authorization'] = `Bearer ${ADMIN_POLL_TOKEN}`;
    const upstream = await fetch(LIVE_URL, { headers });
    if (!upstream.ok) return new Response(`Upstream ${upstream.status}`, { status: 502 });
    const json = await upstream.json();
    const items = normalizeLive(json);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
    const ids = items.map((i) => i.game_id);
    const { data: existing, error: selErr } = await supabase
      .from('live_games')
      .select('game_id, hash')
      .in('game_id', ids);
    if (selErr) return new Response(`DB select error`, { status: 500 });

    const byId = new Map((existing || []).map((r: any) => [r.game_id, r.hash]));
    const upserts = items
      .map((i) => {
        const hash = hashPayload(i.score_json);
        const prev = byId.get(i.game_id);
        if (prev && prev === hash) return null;
        return { game_id: i.game_id, score_json: i.score_json, hash, updated_at: new Date().toISOString() };
      })
      .filter(Boolean) as any[];

    if (upserts.length === 0) {
      return Response.json({ updated: 0 });
    }

    const { error: upErr } = await supabase.from('live_games').upsert(upserts, { onConflict: 'game_id' });
    if (upErr) return new Response('DB upsert error', { status: 500 });

    return Response.json({ updated: upserts.length });
  } catch (e: any) {
    return new Response(`Error: ${e?.message || e}`, { status: 500 });
  }
}
