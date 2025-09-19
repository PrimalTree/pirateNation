import Link from 'next/link';
import { createSupabaseServer } from '@shared/supabase-server';

export default async function PlayersPage() {
  const supabase = await createSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  let myRole: string | null = null;
  if (uid) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('role, display_name, metadata')
      .eq('user_id', uid)
      .maybeSingle();
    myRole = (prof?.role ?? null) as any;
  }
  // Try to fetch an optional athletics_url column if present; fall back gracefully
  const { data: players } = await supabase
    .from('players')
    .select('id, username, nil_links, athletics_url')
    .limit(50);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Players</h1>
      {myRole === 'player' && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-emerald-300">Player Dashboard</div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">Player</span>
          </div>
          <div className="mt-2 text-sm text-zinc-200">Welcome. You can update your public info and NIL links here.</div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/profile" className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/20">Edit Profile</Link>
            <Link href="/player" className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800">Manage NIL Links</Link>
          </div>
        </div>
      )}
      <ul className="space-y-2">
        {players?.length ? (
          players.map((p: any) => {
            const name: string = p?.username ?? '';
            const directUrl: string | undefined = p?.athletics_url && typeof p.athletics_url === 'string' ? p.athletics_url : undefined;
            const searchUrl = name
              ? `https://www.google.com/search?q=${encodeURIComponent(`site:ecupirates.com/sports/football/roster ${name}`)}`
              : undefined;
            const athleticsUrl = directUrl || searchUrl;
            return (
              <li key={p.id} className="rounded border border-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{name || 'Unknown Player'}</div>
                    {athleticsUrl ? (
                      <Link href={athleticsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ecu-gold hover:underline">
                        View on ECU Athletics
                      </Link>
                    ) : (
                      <span className="text-xs text-white/50">No athletics link available</span>
                    )}
                  </div>
                </div>
                {p?.nil_links ? (
                  <pre className="mt-2 text-xs opacity-70">{JSON.stringify(p.nil_links)}</pre>
                ) : null}
              </li>
            );
          })
        ) : (
          <li className="text-white/70">No players yet.</li>
        )}
      </ul>
    </div>
  );
}


