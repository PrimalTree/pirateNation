"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '../../../../lib/supabase-browser';

type Player = { id: string; username?: string | null; created_at?: string };

export default function FeedTab({ gameId, initialPlayers }: { gameId: string; initialPlayers: Player[] }) {
  const supabase = createSupabaseBrowser();
  const [players, setPlayers] = useState<Player[]>(initialPlayers || []);

  useEffect(() => {
    const channel = supabase
      .channel(`players-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
        (payload) => {
          setPlayers((prev) => {
            if (payload.eventType === 'INSERT') return [payload.new as Player, ...prev];
            if (payload.eventType === 'UPDATE') return prev.map((p) => (p.id === (payload.new as any).id ? (payload.new as Player) : p));
            if (payload.eventType === 'DELETE') return prev.filter((p) => p.id !== (payload.old as any).id);
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, supabase]);

  return (
    <div className="space-y-3">
      {players.length === 0 && <div className="text-white/70">No recent activity yet.</div>}
      {players.map((p) => (
        <div key={p.id} className="rounded border border-white/10 bg-black/30 p-3">
          <div className="font-medium">Player joined: {p.username || p.id}</div>
          <div className="text-xs text-white/60">{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
        </div>
      ))}
    </div>
  );
}

