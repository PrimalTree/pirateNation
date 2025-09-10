"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '../../../lib/supabase-browser';

type ScoreTeam = { name?: string; score?: string | number; homeAway?: string };
type ScoreData = { teams?: ScoreTeam[] } & Record<string, any>;

export default function LiveScoreStrip({ gameId, initialScore }: { gameId: string; initialScore?: ScoreData }) {
  const supabase = createSupabaseBrowser();
  const [score, setScore] = useState<ScoreData | undefined>(initialScore);

  useEffect(() => {
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          const next = (payload.new as any)?.score_json ?? (payload.new as any)?.settings;
          setScore(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const teams = score?.teams ?? [];

  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/40 p-2 text-sm">
      {teams.length ? (
        <div className="flex w-full items-center justify-between gap-4">
          {teams.map((t, i) => (
            <div key={i} className="flex flex-1 items-center justify-between gap-2">
              <div className="truncate text-white/90">{t?.name ?? 'Team'}</div>
              <div className="rounded bg-white/10 px-2 py-1 font-semibold">
                {typeof t?.score !== 'undefined' ? String(t.score) : '-'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-white/70">Live score will appear here.</div>
      )}
    </div>
  );
}

