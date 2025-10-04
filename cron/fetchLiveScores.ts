#!/usr/bin/env node
/**
 * Pirate Nation - Admin Poller (ESPN)
 * Polls a live endpoint once and fanouts updates to all clients via Supabase Realtime.
 * - Fetch: ESPN Scoreboard API
 * - Cache: public.live_games (game_id, score_json, hash, updated_at)
 * - Interval: 30s
 *
 * Env vars required (use service role key server-side only):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE
 */

/* eslint-disable no-console */
import 'dotenv/config';
import process from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createServiceRoleClient, syncLiveScores } from './liveSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const INTERVAL_MS = Number(process.env.LIVE_POLL_INTERVAL_MS || 30_000);
const LOCK_KEY = process.env.POLLER_LOCK_KEY || 'live_scores_poller';
const LOCK_TTL_MS = Math.max(INTERVAL_MS * 2, 60_000);
const LIVE_SOURCE_URL = process.env.LIVE_SOURCE_URL;
const ADMIN_POLL_TOKEN = process.env.ADMIN_POLL_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('[poller] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in environment');
  process.exit(1);
}

const supabase = createServiceRoleClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function updateHealthCheckFile() {
  try {
    const healthCheckFile = path.join(__dirname, '../../cron/.last-poller-run');
    await fs.writeFile(healthCheckFile, new Date().toISOString());
  } catch (e: any) {
    console.error(`[poller] failed to write health check file: ${e.message}`);
  }
}

async function runOnce() {
  console.log(`[poller] running at ${new Date().toISOString()}`);
  try {
    const { total, updated } = await syncLiveScores({
      supabase,
      liveSourceUrl: LIVE_SOURCE_URL,
      adminPollToken: ADMIN_POLL_TOKEN,
    });
    console.log(`[poller] received ${total} items from source`);
    if (updated > 0) {
      console.log(`[poller] synced ${updated} changes`);
    } else {
      console.log('[poller] no changes');
    }
    await updateHealthCheckFile();
  } catch (e: any) {
    console.error('[poller] error', e?.message || e);
  }
}

async function main() {
  console.log(`[poller] starting. interval=${INTERVAL_MS}ms`);

  // Best-effort distributed lock so only one instance is active
  const got = await acquireLock(LOCK_KEY, LOCK_TTL_MS);
  if (!got) {
    console.error(`[poller] another instance holds lock key='${LOCK_KEY}'. Exiting.`);
    process.exit(0);
  }

  // Periodically renew lock while running
  const renew = setInterval(async () => {
    const ok = await renewLock(LOCK_KEY, LOCK_TTL_MS);
    if (!ok) {
      console.warn('[poller] lost lock while running; attempting to re-acquire');
      const again = await acquireLock(LOCK_KEY, LOCK_TTL_MS);
      if (!again) {
        console.error('[poller] failed to re-acquire lock; exiting');
        cleanupAndExit();
      }
    }
  }, Math.floor(LOCK_TTL_MS / 2));
  renew.unref?.();

  await runOnce();
  const id = setInterval(runOnce, INTERVAL_MS);

  async function cleanupAndExit() {
    try { clearInterval(id); } catch {}
    try { clearInterval(renew as any); } catch {}
    try { await releaseLock(LOCK_KEY); } catch {}
    process.exit(0);
  }

  process.on('SIGINT', cleanupAndExit);
  process.on('SIGTERM', cleanupAndExit);
}

// Only run if invoked directly
console.log(`[poller] argv[1] = ${process.argv[1]}`);
if (process.argv[1] && process.argv[1].includes('fetchLiveScores.js')) {
  main();
}

// --- Distributed lock helpers (requires `public.locks` table) ---
async function acquireLock(key: string, ttlMs: number): Promise<boolean> {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  // First try insert
  const ins = await supabase.from('locks').insert({ key, owner: instanceId(), expires_at: expiresAt }).select();
  if (!ins.error) return true;
  // If exists, try to steal if expired
  const upd = await supabase
    .from('locks')
    .update({ owner: instanceId(), expires_at: expiresAt })
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
    .eq('owner', instanceId())
    .select();
  return !upd.error && Array.isArray(upd.data) && upd.data.length > 0;
}

async function releaseLock(key: string): Promise<void> {
  await supabase.from('locks').delete().eq('key', key).eq('owner', instanceId());
}

function instanceId(): string {
  // semi-stable per-process id
  return `${process.pid}-${process.env.HOSTNAME || 'host'}`;
}

