import Link from 'next/link';
import { createSupabaseServer } from '@shared/supabase-server';

export default async function PlayersPage() {
  const supabase = await createSupabaseServer();
  // Try to fetch an optional athletics_url column if present; fall back gracefully
  const { data: players } = await supabase
    .from('players')
    .select('id, username, nil_links, athletics_url')
    .limit(50);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Players</h1>
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


