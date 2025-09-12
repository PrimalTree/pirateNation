#!/usr/bin/env node
/**
 * Pirate Nation — Admin Poller (ESPN mock)
 * Polls a live endpoint once and fanouts updates to all clients via Supabase Realtime.
 * - Fetch: https://api.example.com/live (mock)
 * - Cache: public.live_games (game_id, score_json, hash, updated_at)
 * - Interval: 30s
 *
 * Env vars required (use service role key server-side only):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE
 * - ADMIN_POLL_TOKEN (sent as Bearer when calling the upstream live endpoint)
 */

/* eslint-disable no-console */
import 'dotenv/config';
import crypto from 'node:crypto';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const ADMIN_POLL_TOKEN = process.env.ADMIN_POLL_TOKEN;
const LIVE_URL = process.env.LIVE_SOURCE_URL || 'https://api.example.com/live';
const INTERVAL_MS = Number(process.env.LIVE_POLL_INTERVAL_MS || 30_000);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('[poller] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

function stableStringify(value) {
  // Sort keys to get a stable hash for semantically-identical payloads
  const seen = new WeakSet();
  return JSON.stringify(value, function (key, val) {
    if (val && typeof val === 'object') {
      if (seen.has(val)) return undefined;
      seen.add(val);
      if (!Array.isArray(val)) {
        return Object.keys(val)
          .sort()
          .reduce((acc, k) => {
            acc[k] = val[k];
            return acc;
          }, {});
      }
    }
    return val;
  });
}

function hashPayload(obj) {
  return crypto.createHash('sha256').update(stableStringify(obj)).digest('hex');
}

async function fetchLive() {
  const headers = ADMIN_POLL_TOKEN ? { Authorization: `Bearer ${ADMIN_POLL_TOKEN}` } : {};
  const res = await fetch(LIVE_URL, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Upstream live fetch failed: ${res.status}`);
  return res.json();
}

function normalizeLive(json) {
  // Accept either { games: [...] } or just [...]
  const arr = Array.isArray(json) ? json : Array.isArray(json?.games) ? json.games : [];
  // Expect each item to include a unique id (game_id) and a score payload
  // Fallbacks are included to support generic feeds during MVP.
  return arr
    .map((g) => {
      const gameId = String(g.id ?? g.game_id ?? '').trim();
      if (!gameId) return null;
      const when = g.when ?? g.date ?? g.start ?? null;
      const score = g.score ?? g.score_json ?? g;
      return { game_id: gameId, when, score_json: score };
    })
    .filter(Boolean);
}

async function syncToSupabase(items) {
  if (items.length === 0) return { updated: 0 };

  const ids = items.map((i) => i.game_id);
  const { data: existing, error: selErr } = await supabase
    .from('live_games')
    .select('game_id, hash')
    .in('game_id', ids);
  if (selErr) throw selErr;

  const byId = new Map((existing || []).map((r) => [r.game_id, r.hash]));
  const upserts = items
    .map((i) => {
      const hash = hashPayload(i.score_json);
      const prev = byId.get(i.game_id);
      if (prev && prev === hash) return null; // unchanged — no broadcast
      return {
        game_id: i.game_id,
        score_json: i.score_json,
        hash,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (upserts.length === 0) return { updated: 0 };

  const { error: upErr } = await supabase
    .from('live_games')
    .upsert(upserts, { onConflict: 'game_id' });
  if (upErr) throw upErr;
  return { updated: upserts.length };
}

async function runOnce() {
  try {
    const json = await fetchLive();
    const items = normalizeLive(json);
    const { updated } = await syncToSupabase(items);
    if (updated > 0) {
      console.log(`[poller] synced ${updated} changes at ${new Date().toISOString()}`);
    } else {
      console.log('[poller] no changes');
    }
  } catch (e) {
    console.error('[poller] error', e?.message || e);
  }
}

async function main() {
  console.log(`[poller] starting. source=${LIVE_URL} interval=${INTERVAL_MS}ms`);
  await runOnce();
  const id = setInterval(runOnce, INTERVAL_MS);
  const cleanup = () => {
    clearInterval(id);
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Only run if invoked directly
if (process.argv[1] && process.argv[1].includes('fetchLiveScores.js')) {
  main();
}

