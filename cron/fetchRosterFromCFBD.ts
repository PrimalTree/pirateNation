#!/usr/bin/env node
/**
 * CFBD -> Supabase Roster ETL
 *
 * Fetches team roster from CollegeFootballData (CFBD) and inserts/updates rows in public.players.
 * - Identifies players primarily by CFBD `id` (stored in metadata.cfbd_id)
 * - Falls back to matching by `username` ("First Last") when cfbd_id not yet stored
 * - Stores position and derived `side` (offense/defense/special) in metadata
 *
 * Env required:
 * - CFBD_API_KEY
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE
 *
 * Optional env:
 * - CFBD_TEAM_NAME (default: "East Carolina")
 * - CFBD_YEAR (default: current year)
 * - TARGET_GAME_ID (uuid or string used for public.players.game_id; optional)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

type CfbdRosterItem = {
  id?: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  jersey?: number | string | null;
  height?: number | null;
  weight?: number | null;
  year?: string | number | null; // classification
  home_city?: string | null;
  home_state?: string | null;
  home_country?: string | null;
};

function mapSide(position: string | undefined | null): 'offense' | 'defense' | 'special' | null {
  const p = String(position || '').toUpperCase();
  const offense = ['QB', 'RB', 'TB', 'FB', 'WR', 'TE', 'OT', 'OG', 'C', 'OL'];
  const defense = ['DL', 'DE', 'DT', 'NT', 'EDGE', 'LB', 'OLB', 'ILB', 'DB', 'CB', 'S', 'SAFETY'];
  const special = ['K', 'PK', 'P', 'LS', 'KR', 'PR'];
  if (offense.includes(p)) return 'offense';
  if (defense.includes(p)) return 'defense';
  if (special.includes(p)) return 'special';
  // Position groups like "OL", "DL" are covered; fallback heuristics
  if (p.endsWith('OL')) return 'offense';
  if (p.endsWith('LB') || p.startsWith('D')) return 'defense';
  return null;
}

function chunk<T>(arr: T[], size = 200): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchRoster(team: string, year: number, apiKey: string): Promise<CfbdRosterItem[]> {
  const url = new URL('https://api.collegefootballdata.com/roster');
  url.searchParams.set('team', team);
  url.searchParams.set('year', String(year));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error(`CFBD roster failed: ${res.status}`);
  const json = (await res.json()) as CfbdRosterItem[];
  return Array.isArray(json) ? json : [];
}

type PlayerRow = {
  id?: string;
  username: string;
  game_id?: string | null;
  nil_links?: any;
  metadata: Record<string, any>;
};

async function upsertRoster(items: CfbdRosterItem[]) {
  const SUPABASE_URL = process.env.SUPABASE_URL as string;
  const SUPABASE_SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE as string) || (process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  const TARGET_GAME_ID = process.env.TARGET_GAME_ID || undefined;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) throw new Error('Missing Supabase env');
  const supabase: any = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

  // Build target rows
  const candidates: PlayerRow[] = items
    .map((p) => {
      const first = String(p.first_name || '').trim();
      const last = String(p.last_name || '').trim();
      const username = [first, last].filter(Boolean).join(' ').trim();
      if (!username) return null;
      const pos = (p.position || '').toString().toUpperCase();
      const side = mapSide(pos);
      const meta: Record<string, any> = {
        cfbd_id: p.id ?? null,
        position: pos || null,
        side: side,
        number: p.jersey ?? null,
        class: p.year ?? null,
        height: p.height ?? null,
        weight: p.weight ?? null,
        hometown: {
          city: p.home_city ?? null,
          state: p.home_state ?? null,
          country: p.home_country ?? null,
        },
        source: 'cfbd',
      };
      const row: PlayerRow = { username, metadata: meta };
      if (TARGET_GAME_ID) row.game_id = TARGET_GAME_ID;
      return row;
    })
    .filter(Boolean) as PlayerRow[];

  if (candidates.length === 0) return { inserted: 0, updated: 0 };

  // 1) Update rows matched by cfbd_id
  const cfbdIds = candidates.map((c) => String(c.metadata.cfbd_id)).filter((v) => v && v !== 'null');
  const byCfbdId = new Map<string, PlayerRow>();
  for (const c of candidates) {
    const key = String(c.metadata.cfbd_id);
    if (key && key !== 'null') byCfbdId.set(key, c);
  }

  let updated = 0;
  let inserted = 0;

  for (const idsChunk of chunk(cfbdIds, 200)) {
    if (idsChunk.length === 0) continue;
    const { data: existing } = await supabase
      .from('players')
      .select('id, username, metadata')
      .in('metadata->>cfbd_id' as any, idsChunk);
    const toUpdate: { id: string; username: string; metadata: any; game_id?: string | null }[] = [];
    for (const row of existing || []) {
      const key = String((row as any).metadata?.cfbd_id);
      const match = byCfbdId.get(key);
      if (match) {
        toUpdate.push({
          id: (row as any).id,
          username: match.username,
          metadata: match.metadata,
          game_id: match.game_id ?? null,
        });
      }
    }
    if (toUpdate.length) {
      const { error } = await supabase.from('players').upsert(toUpdate as any, { onConflict: 'id' });
      if (error) throw error;
      updated += toUpdate.length;
    }
  }

  // 2) For items without cfbd match, try username match (no cfbd_id yet)
  const remaining = candidates.filter((c) => !byCfbdId.has(String(c.metadata.cfbd_id)));
  if (remaining.length) {
    const names = Array.from(new Set(remaining.map((r) => r.username))).filter(Boolean);
    for (const namesChunk of chunk(names, 200)) {
      const { data: existByName } = await supabase
        .from('players')
        .select('id, username, metadata')
        .in('username', namesChunk);
      const byName = new Map<string, any[]>();
      for (const row of existByName || []) {
        const list = byName.get((row as any).username) || [];
        list.push(row);
        byName.set((row as any).username, list);
      }
      const toUpdate: { id: string; username: string; metadata: any; game_id?: string | null }[] = [];
      const toInsert: PlayerRow[] = [];
      for (const c of remaining.filter((r) => namesChunk.includes(r.username))) {
        const rows = byName.get(c.username) || [];
        if (rows.length === 1) {
          toUpdate.push({ id: (rows[0] as any).id, username: c.username, metadata: c.metadata, game_id: c.game_id ?? null });
        } else if (rows.length === 0) {
          toInsert.push(c);
        } else {
          // Ambiguous name; insert a new record tagged with cfbd_id to avoid collisions
          toInsert.push(c);
        }
      }
      if (toUpdate.length) {
        const { error } = await supabase.from('players').upsert(toUpdate as any, { onConflict: 'id' });
        if (error) throw error;
        updated += toUpdate.length;
      }
      if (toInsert.length) {
        const { error } = await supabase.from('players').insert(toInsert as any);
        if (error) throw error;
        inserted += toInsert.length;
      }
    }
  }

  // 3) Insert remaining that had cfbd_id but no existing rows matched (rare)
  const haveCfbd = new Set(cfbdIds);
  const needInsert = candidates.filter((c) => haveCfbd.has(String(c.metadata.cfbd_id)));
  if (needInsert.length) {
    // Fetch which cfbd_ids already exist to avoid duplicates
    const stillMissing: PlayerRow[] = [];
    for (const idsChunk of chunk(Array.from(haveCfbd), 200)) {
      const { data: existAgain } = await supabase
        .from('players')
        .select('metadata')
        .in('metadata->>cfbd_id' as any, idsChunk);
      const existingIds = new Set((existAgain || []).map((r: any) => String(r.metadata?.cfbd_id)));
      for (const c of candidates.filter((x) => idsChunk.includes(String(x.metadata.cfbd_id)))) {
        if (!existingIds.has(String(c.metadata.cfbd_id))) stillMissing.push(c);
      }
    }
    if (stillMissing.length) {
      const { error } = await supabase.from('players').insert(stillMissing as any);
      if (error) throw error;
      inserted += stillMissing.length;
    }
  }

  // Cleanup: ensure metadata.side is set based on metadata.position for rows lacking side
  try {
    const pageSize = 1000;
    let from = 0;
    // If TARGET_GAME_ID provided, scope cleanup to that game
    const filter = TARGET_GAME_ID ? { column: 'game_id', value: TARGET_GAME_ID } : null;
    for (;;) {
      let q = supabase.from('players').select('id, metadata').range(from, from + pageSize - 1);
      if (filter) q = (q as any).eq(filter.column, filter.value);
      const { data: rows, error } = await q;
      if (error) break;
      const list = rows || [];
      if (list.length === 0) break;
      const toPatch: { id: string; metadata: any }[] = [];
      for (const r of list) {
        const meta = (r as any).metadata || {};
        const pos = meta.position as string | undefined;
        const side: string | null = meta.side ?? null;
        if (pos && (!side || !['offense', 'defense', 'special'].includes(String(side)))) {
          const next = mapSide(pos) || null;
          if (next) toPatch.push({ id: (r as any).id, metadata: { ...meta, side: next } });
        }
      }
      if (toPatch.length) {
        const { error: uerr } = await supabase.from('players').upsert(toPatch as any, { onConflict: 'id' });
        if (uerr) throw uerr;
        updated += toPatch.length;
      }
      if (list.length < pageSize) break;
      from += pageSize;
    }
  } catch (e) {
    console.warn('[roster] side cleanup skipped:', (e as any)?.message || e);
  }

  return { inserted, updated };
}

async function main() {
  const apiKey = process.env.CFBD_API_KEY as string;
  if (!apiKey) throw new Error('CFBD_API_KEY not set');
  const team = process.env.CFBD_TEAM_NAME || 'East Carolina';
  const year = Number(process.env.CFBD_YEAR || new Date().getFullYear());

  console.log(`[roster] fetching roster team='${team}' year=${year}`);
  const roster = await fetchRoster(team, year, apiKey);
  console.log(`[roster] received ${roster.length} players`);
  const { inserted, updated } = await upsertRoster(roster);
  console.log(`[roster] upsert complete: inserted=${inserted} updated=${updated}`);
}

if (process.argv[1] && process.argv[1].includes('fetchRosterFromCFBD')) {
  main().catch((e) => {
    console.error('[roster] error:', e?.message || e);
    process.exit(1);
  });
}
