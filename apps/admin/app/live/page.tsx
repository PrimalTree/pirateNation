import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '../../lib/supabase-server';

async function getLiveRows() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from('live_games')
    .select('game_id, updated_at, score_json')
    .order('updated_at', { ascending: false })
    .limit(100);
  return Array.isArray(data) ? data : [];
}

async function triggerCron() {
  'use server';
  try {
    const base = process.env.CRON_URL || '';
    const token = process.env.CRON_SECRET || '';
    if (!base || !token) return;
    const url = new URL(base);
    url.searchParams.set('token', token);
    await fetch(url.toString(), { cache: 'no-store' });
    revalidatePath('/live');
  } catch (e: any) {
    // swallow
  }
}

export default async function LiveStatusPage() {
  const rows = await getLiveRows();
  const lastAt = rows[0]?.updated_at ? new Date(rows[0].updated_at).toLocaleString() : '—';
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Live Scores (Realtime Cache)</h1>
        <form action={triggerCron}>
          <button className="rounded-md bg-ecu-gold px-3 py-1.5 text-black hover:opacity-90" type="submit">Trigger Poll</button>
        </form>
      </div>
      <div className="text-sm text-white/70">Rows: {rows.length} • Last Update: {lastAt}</div>
      <div className="overflow-x-auto rounded border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-3 py-2">Game ID</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Score (snippet)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.game_id} className="border-t border-white/10">
                <td className="px-3 py-2 font-mono text-xs">{r.game_id}</td>
                <td className="px-3 py-2 text-xs">{new Date(r.updated_at!).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-white/70">
                  {(() => {
                    try {
                      const s = JSON.stringify(r.score_json);
                      return s.length > 120 ? s.slice(0, 120) + '…' : s;
                    } catch { return '—'; }
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
