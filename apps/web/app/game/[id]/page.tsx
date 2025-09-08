import { createSupabaseServer } from '../../../lib/supabase-server';

export default async function GameHub({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer();
  // Minimal example: fetch game by id if available
  const { data: game } = await supabase.from('games').select('*').eq('id', params.id).maybeSingle();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Game Hub</h1>
      <p className="text-sm text-white/70">ID: {params.id}</p>
      {game ? (
        <div className="rounded-lg border border-white/10 p-4">
          <div className="font-semibold">{game.name}</div>
          <pre className="mt-2 text-xs opacity-80">{JSON.stringify(game.settings, null, 2)}</pre>
        </div>
      ) : (
        <div className="text-white/70">No game found.</div>
      )}
    </div>
  );
}
