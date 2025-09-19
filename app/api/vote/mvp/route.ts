import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import schedule from '../../../../data/public/schedule.json';

function currentGameMeta() {
  try {
    const games = (schedule as any).games as Array<{ id: string; when: string }>;
    const now = Date.now();
    let idx = -1;
    let minDiff = Infinity;
    games.forEach((g, i) => {
      const t = new Date(g.when).getTime();
      const diff = Math.abs(t - now);
      if (diff < minDiff) { minDiff = diff; idx = i; }
    });
    const game = idx >= 0 ? games[idx] : undefined;
    return { week: idx + 1, gameId: game?.id };
  } catch { return { week: undefined, gameId: undefined }; }
}

export async function POST(req: NextRequest) {
  try {
    const { category, playerId, playerName, message } = await req.json();
    if (!['OMVP','DMVP'].includes(category)) return new Response('Invalid category', { status: 400 });
    if (!playerId || !playerName) return new Response('Missing player', { status: 400 });
    const { week, gameId } = currentGameMeta();

    const supabaseUrl = process.env.SUPABASE_URL as string;
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE as string) || (process.env.SUPABASE_SERVICE_ROLE_KEY as string);
    if (!supabaseUrl || !serviceKey) return new Response('Supabase not configured', { status: 500 });
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const ip = req.headers.get('x-forwarded-for') || req.ip || undefined as any;
    const ua = req.headers.get('user-agent') || undefined;
    const payload = {
      category,
      player_id: String(playerId),
      player_name: String(playerName),
      message: message ? String(message).slice(0,250) : null,
      week: week ?? null,
      game_id: gameId ?? null,
      ip: ip as any,
      user_agent: ua ?? null,
    };
    // Upsert with unique constraint to ignore duplicate by IP/week/game/category
    const { error } = await supabase.from('mvp_votes').upsert(payload, { onConflict: 'category,week,game_id,ip', ignoreDuplicates: true });
    if (error) return new Response(`DB error: ${error.message}`, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return new Response(e?.message || 'Error', { status: 400 });
  }
}
