"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';
import { Trophy } from 'lucide-react';

type ScoreTeam = { name?: string; score?: string | number; homeAway?: string };
type ScoreData = { teams?: ScoreTeam[]; phase?: string; period?: number } & Record<string, any>;

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
  }, [gameId, supabase]);

  const teams = score?.teams ?? [];
  const home = teams.find((t) => (t.homeAway || '').toLowerCase() === 'home') || teams[1];
  const away = teams.find((t) => (t.homeAway || '').toLowerCase() === 'away') || teams[0];
  const phase = (score as any)?.phase || (score as any)?.status || '';

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-300">
          <Trophy className="h-5 w-5" />
          <span className="font-semibold">Live Score</span>
        </div>
      </div>
      {teams.length ? (
        <div className="grid grid-cols-3 items-center text-center">
          <div className="text-zinc-300">
            {away?.name ?? 'Away'}
            <div className="text-3xl font-bold">{typeof away?.score !== 'undefined' ? String(away?.score) : '-'}</div>
          </div>
          <div className="text-xs text-zinc-500">{phase}</div>
          <div className="text-zinc-300">
            {home?.name ?? 'Home'}
            <div className="text-3xl font-bold">{typeof home?.score !== 'undefined' ? String(home?.score) : '-'}</div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-400">Live score will appear here.</div>
      )}
    </div>
  );
}
