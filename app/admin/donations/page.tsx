import { createSupabaseServer } from '@shared/supabase-server';
import roster from '../../../data/public/roster.json';

export const metadata = { title: 'Donations', description: 'Recent donations' };

export default async function DonationsPage() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('donations')
    .select('created_at, amount, recipient, message, week, game_id, stripe_session_id, status')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return (
      <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        Failed to load donations: {error.message}
      </div>
    );
  }

  const rows = data || [];

  const players: Array<any> = ((roster as any).players ?? []) as Array<any>;
  const playerMap = new Map<string, any>(players.map((p: any) => [String(p.id), p]));

  function parseAthlete(message?: string | null) {
    if (!message || typeof message !== 'string') return { id: null as string | null, clean: '' };
    const m = message.match(/(?:^|\s)player:(\d+)/i);
    if (!m) return { id: null as string | null, clean: message };
    const id = m[1];
    const clean = message.replace(m[0].trim(), '').trim();
    return { id, clean };
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Recent Donations</h1>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/70">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Recipient</th>
              <th className="px-3 py-2">Athlete</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Week</th>
              <th className="px-3 py-2">Game</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => {
              const { id: athleteId, clean } = parseAthlete(r.message);
              const player = athleteId ? playerMap.get(String(athleteId)) : null;
              const athleteLabel = player
                ? `${player.number != null ? `#${player.number} ` : ''}${player.name}${
                    player.position ? ` (${player.position})` : ''
                  }`
                : athleteId || '—';
              const cleanMsg = clean || (r.message && !athleteId ? r.message : '—');
              return (
                <tr key={r.stripe_session_id || `${r.created_at}-${Math.random()}` } className="odd:bg-white/0 even:bg-white/5">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.recipient || '—'}</td>
                  <td className="px-3 py-2">{athleteLabel}</td>
                  <td className="px-3 py-2">{typeof r.amount === 'number' ? `$${r.amount}` : '—'}</td>
                  <td className="px-3 py-2">{r.week ?? '—'}</td>
                  <td className="px-3 py-2">{r.game_id ?? '—'}</td>
                  <td className="px-3 py-2 max-w-[32rem] truncate" title={cleanMsg || ''}>{cleanMsg}</td>
                  <td className="px-3 py-2">{r.status || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
