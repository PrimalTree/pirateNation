import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchEspnScoreboard, normalizeEspnScoreboard, hexToUuidLike } from '@pirate-nation/fetcher';

export const dynamic = 'force-dynamic';

function diffObjects(a: any, b: any) {
  const diff: Record<string, { before: any; after: any }> = {};
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const av = a?.[k];
    const bv = b?.[k];
    if (JSON.stringify(av) !== JSON.stringify(bv)) diff[k] = { before: av, after: bv };
  }
  return diff;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const { url, payload } = body as { url?: string; payload?: unknown };

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  // 1) get provider payload
  const json = payload ?? (await fetchEspnScoreboard(url));

  // 2) normalize and validate
  let normalized: ReturnType<typeof normalizeEspnScoreboard>;
  try {
    normalized = normalizeEspnScoreboard(json);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: `Validation failed: ${e.message}` }, { status: 400 });
  }

  let upserts = 0;
  let updates = 0;
  const results: any[] = [];

  for (const game of normalized) {
    // derive stable id from provider id for idempotency
    const stableId = hexToUuidLike(game.provider_id.replace(/[^a-f0-9]/gi, '').slice(0, 32) || game.hash);

    // fetch existing by id or provider id in settings
    const { data: existing } = await supabase
      .from('games')
      .select('id,name,settings')
      .or(`id.eq.${stableId},settings->>provider_id.eq.${game.provider_id}`)
      .limit(1)
      .maybeSingle();

    const newSettings = { ...(existing?.settings || {}), ...game.settings, espn_hash: game.hash };
    const newRow = { id: stableId, name: game.name, settings: newSettings } as any;

    if (!existing) {
      const { error } = await supabase.from('games').upsert(newRow, { onConflict: 'id' });
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      upserts++;
      // log create
      await supabase.from('audit_logs').insert({
        action: 'sync_games:create',
        entity_type: 'game',
        entity_id: stableId,
        metadata: { after: newRow }
      });
      results.push({ id: stableId, status: 'created' });
    } else {
      // compare only changed fields
      const nameChanged = existing.name !== newRow.name;
      const settingsChanged = JSON.stringify(existing.settings) !== JSON.stringify(newSettings);
      if (!nameChanged && !settingsChanged) {
        results.push({ id: existing.id, status: 'unchanged' });
        continue;
      }
      const updatePatch: any = { id: existing.id };
      if (nameChanged) updatePatch.name = newRow.name;
      if (settingsChanged) updatePatch.settings = newSettings;

      const { error } = await supabase.from('games').update(updatePatch).eq('id', existing.id);
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      updates++;
      const diffs = diffObjects(existing, { name: newRow.name, settings: newSettings });
      await supabase.from('audit_logs').insert({
        action: 'sync_games:update',
        entity_type: 'game',
        entity_id: existing.id,
        metadata: { diffs }
      });
      results.push({ id: existing.id, status: 'updated' });
    }
  }

  return NextResponse.json({ ok: true, upserts, updates, results });
}
