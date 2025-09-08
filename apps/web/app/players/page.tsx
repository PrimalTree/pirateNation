import { createSupabaseServer } from '../../lib/supabase-server';

export default async function PlayersPage() {
  const supabase = createSupabaseServer();
  const { data: players } = await supabase.from('players').select('id, username, nil_links').limit(20);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Players</h1>
      <ul className="space-y-2">
        {players?.map((p) => (
          <li key={p.id} className="rounded border border-white/10 p-3">
            <div className="font-medium">{p.username}</div>
            <pre className="text-xs opacity-70">{JSON.stringify(p.nil_links)}</pre>
          </li>
        )) || <li className="text-white/70">No players yet.</li>}
      </ul>
    </div>
  );
}

