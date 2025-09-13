#!/usr/bin/env node
/**
 * Mock Scores Poller
 * - Fetches from a mock/live endpoint every 30s
 * - Upserts into Supabase `public.live_games`
 * - Skips writes when content hash is unchanged
 *
 * Env vars (service key must be server-side only):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE (or SUPABASE_SERVICE_ROLE_KEY)
 * - MOCK_SCORES_URL (fallback: LIVE_SOURCE_URL) — JSON array or { games: [...] }
 * - LIVE_POLL_INTERVAL_MS (optional; default 30000)
 */

/* eslint-disable no-console */
import 'dotenv/config';
import crypto from 'node:crypto';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
const SUPABASE_SERVICE_ROLE =
  (process.env.SUPABASE_SERVICE_ROLE as string | undefined) ||
  (process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined);
const MOCK_SCORES_URL =
  (process.env.MOCK_SCORES_URL as string | undefined) ||
  (process.env.LIVE_SOURCE_URL as string | undefined) ||
  '';
const INTERVAL_MS = Number(process.env.LIVE_POLL_INTERVAL_MS || 30_000);
const LOCK_KEY = process.env.POLLER_LOCK_KEY || 'mock_scores_poller';
const LOCK_TTL_MS = Math.max(INTERVAL_MS * 2, 60_000);
const INSTANCE_ID = `${process.pid}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('[mock-poller] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in environment');
  process.exit(1);
}
if (!MOCK_SCORES_URL) {
  console.error('[mock-poller] Missing MOCK_SCORES_URL (or LIVE_SOURCE_URL) in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

type LogLevel = 'info' | 'warn' | 'error';
function log(level: LogLevel, msg: string, fields: Record<string, unknown> = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component: 'mock-poller',
    instance: INSTANCE_ID,
    msg,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else console.log(line);
}

function stableStringify(value: unknown) {
  const seen = new WeakSet();
  return JSON.stringify(value, function (key, val) {
    void key;
    if (val && typeof val === 'object') {
      if (seen.has(val as object)) return undefined as any;
      seen.add(val as object);
      if (!Array.isArray(val)) {
        return Object.keys(val as any)
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

type NormalizedItem = { game_id: string; when?: string | null; score_json: any };

function normalize(json: any): NormalizedItem[] {
  // Accept either an array of objects or { games: [...] }
  const arr = Array.isArray(json) ? json : Array.isArray(json?.games) ? json.games : [];
  return arr
    .map((g: any) => {
      const gameId = String(g.id ?? g.game_id ?? '').trim();
      if (!gameId) return null;
      const when = g.when ?? g.date ?? g.start ?? null;
      const score = g.score ?? g.score_json ?? g;
      return { game_id: gameId, when, score_json: score } as NormalizedItem;
    })
    .filter(Boolean) as NormalizedItem[];
}

async function sync(items: NormalizedItem[]) {
  if (items.length === 0) return { updated: 0 } as const;

  const ids = items.map((i) => i.game_id);
  const { data: existing, error: selErr } = await supabase
    .from('live_games')
    .select('game_id, hash')
    .in('game_id', ids);
  if (selErr) throw selErr;

  const byId = new Map((existing || []).map((r: any) => [r.game_id, r.hash]));
  const upserts = items
    .map((i) => {
      const hash = hashPayload(i.score_json);
      const prev = byId.get(i.game_id);
      if (prev && prev === hash) return null; // unchanged — skip write
      return {
        game_id: i.game_id,
        score_json: i.score_json,
        hash,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean) as any[];

  if (upserts.length === 0) return { updated: 0 } as const;

  const { error: upErr } = await supabase
    .from('live_games')
    .upsert(upserts, { onConflict: 'game_id' });
  if (upErr) throw upErr;
  return { updated: upserts.length } as const;
}

async function fetchWithRetry(url: string, attempts = 4, baseDelayMs = 750) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000).unref?.();
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeout as any);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) {
      lastErr = e;
      const backoff = Math.min(baseDelayMs * 2 ** i, 5_000);
      const jitter = Math.floor(Math.random() * 250);
      log('warn', 'upstream fetch failed; backing off', { attempt: i + 1, backoff: backoff + jitter, error: e?.message || String(e) });
      await sleep(backoff + jitter);
    }
  }
  throw lastErr;
}

async function runOnce() {
  try {
    const json = await fetchWithRetry(MOCK_SCORES_URL);
    const items = normalize(json);
    const { updated } = await sync(items);
    if (updated > 0) log('info', 'sync complete', { updated });
    else log('info', 'no changes');
  } catch (e: any) {
    log('error', 'runOnce failed', { error: e?.message || String(e) });
  }
}

// Distributed lock helpers (best-effort). Requires `public.locks` table (see schema.sql).
async function acquireLock(key: string, ttlMs: number): Promise<boolean> {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  // First try insert
  const ins = await supabase.from('locks').insert({ key, owner: INSTANCE_ID, expires_at: expiresAt }).select();
  if (!ins.error) return true;
  // If exists, try to steal if expired
  const upd = await supabase
    .from('locks')
    .update({ owner: INSTANCE_ID, expires_at: expiresAt })
    .eq('key', key)
    .lt('expires_at', new Date().toISOString())
    .select();
  return !upd.error && Array.isArray(upd.data) && upd.data.length > 0;
}

async function renewLock(key: string, ttlMs: number): Promise<boolean> {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const upd = await supabase
    .from('locks')
    .update({ expires_at: expiresAt })
    .eq('key', key)
    .eq('owner', INSTANCE_ID)
    .select();
  return !upd.error && Array.isArray(upd.data) && upd.data.length > 0;
}

async function releaseLock(key: string): Promise<void> {
  await supabase.from('locks').delete().eq('key', key).eq('owner', INSTANCE_ID);
}

async function main() {
  log('info', 'starting', { interval_ms: INTERVAL_MS, url: MOCK_SCORES_URL, lock_key: LOCK_KEY });
  // Acquire distributed lock (retry until success)
  while (true) {
    const ok = await acquireLock(LOCK_KEY, LOCK_TTL_MS);
    if (ok) break;
    log('warn', 'lock busy; retrying', { lock_key: LOCK_KEY });
    await sleep(2_000 + Math.floor(Math.random() * 500));
  }

  let renewTimer: NodeJS.Timeout | undefined;
  const renew = async () => {
    const ok = await renewLock(LOCK_KEY, LOCK_TTL_MS);
    if (!ok) log('warn', 'lock renew failed; attempting reacquire', { lock_key: LOCK_KEY });
  };
  renewTimer = setInterval(() => void renew(), Math.max(Math.floor(LOCK_TTL_MS / 2), 15_000));

  await runOnce();
  const tick = setInterval(runOnce, INTERVAL_MS);

  const cleanup = async () => {
    clearInterval(tick);
    if (renewTimer) clearInterval(renewTimer);
    await releaseLock(LOCK_KEY);
    log('info', 'stopped');
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Only run if invoked directly (compiled path check used by tsconfig build)
if (process.argv[1] && /mockScorePoller\.js$/.test(process.argv[1])) {
  void main();
}
