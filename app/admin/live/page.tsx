import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@shared/supabase-server';
import { ManualPushButton } from '../components/ManualPushButton';
import { ScoreSummary } from '@shared/ui/ScoreSummary';

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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Live Scores (Realtime Cache)</h1>
        <div className="flex items-center gap-2">
          <form action={triggerCron}>
            <button className="rounded-md bg-ecu-gold px-3 py-1.5 text-black hover:opacity-90" type="submit">Trigger Poll</button>
          </form>
          <ManualPushButton />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        {(() => {
          try {
            const events: any[] = Array.isArray(rows) ? rows : [];
            const isLive = (r: any) => String(r?.score_json?.status || '').toLowerCase().includes('live');
            const sorted = [...events].sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime());
            const best = events.find(isLive) || sorted[0];
            if (!best) return <p className="text-sm text-white/60">No data yet.</p>;
            const teams: any[] = Array.isArray(best.score_json?.teams) ? best.score_json.teams : [];
            const home = teams.find((t) => t.homeAway === 'home') ?? teams[0];
            const away = teams.find((t) => t.homeAway === 'away') ?? teams[1];
            const score = home && away
              ? `${away?.name ?? 'Away'} ${away?.score ?? ''} — ${home?.name ?? 'Home'} ${home?.score ?? ''}`
              : teams.map((t) => `${t?.name ?? ''} ${t?.score ?? ''}`).join(' — ');
            return (
              <div className="space-y-1">
                <div className="text-xs text-emerald-400">Preview</div>
                <div className="text-zinc-200">{best.score_json?.name ?? best.game_id}</div>
                {score && <div className="text-lg font-semibold text-yellow-200">{score}</div>}
                <div className="text-xs text-zinc-400">{best.score_json?.when ? new Date(best.score_json.when as string).toLocaleString() : ''}</div>
              </div>
            );
          } catch {
            return <p className="text-sm text-white/60">No data yet.</p>;
          }
        })()}
      </div>
      <div className="text-sm text-white/70">Rows: {rows.length} • Last Update: {lastAt}</div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <ScoreSummary events={rows.map((r: any) => r.score_json)} lastUpdated={rows[0]?.updated_at ? new Date(rows[0].updated_at).getTime() : undefined} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm text-white/70">Recent Updates</div>
        {rows.length === 0 ? (
          <p className="text-sm text-white/60">No rows yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 text-sm">
            {rows.slice(0, 20).map((r) => {
              const t: any[] = Array.isArray((r as any).score_json?.teams) ? (r as any).score_json.teams : [];
              const home = t.find((x) => x?.homeAway === 'home') ?? t[0];
              const away = t.find((x) => x?.homeAway === 'away') ?? t[1];
              const score = home && away
                ? `${away?.name ?? 'Away'} ${away?.score ?? ''} — ${home?.name ?? 'Home'} ${home?.score ?? ''}`
                : t.map((x) => `${x?.name ?? ''} ${x?.score ?? ''}`).join(' — ');
              return (
                <li key={r.game_id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs text-white/70">{r.game_id}</div>
                    <div className="truncate text-zinc-200">{(r as any).score_json?.name ?? ''}</div>
                    {score && <div className="truncate text-xs text-yellow-200">{score}</div>}
                  </div>
                  <div className="shrink-0 pl-3 text-xs text-white/50">{new Date(r.updated_at!).toLocaleString()}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


