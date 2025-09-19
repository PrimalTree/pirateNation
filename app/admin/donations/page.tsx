import { createSupabaseServer } from '@shared/supabase-server';

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Recent Donations</h1>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-white/70">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Recipient</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Week</th>
              <th className="px-3 py-2">Game</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.stripe_session_id} className="odd:bg-white/0 even:bg-white/5">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.recipient || '—'}</td>
                <td className="px-3 py-2">{typeof r.amount === 'number' ? `$${r.amount}` : '—'}</td>
                <td className="px-3 py-2">{r.week ?? '—'}</td>
                <td className="px-3 py-2">{r.game_id ?? '—'}</td>
                <td className="px-3 py-2 max-w-[32rem] truncate" title={r.message || ''}>{r.message || '—'}</td>
                <td className="px-3 py-2">{r.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

