"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '../../../../lib/supabase-browser';

type Poll = { id: string; question: string; options: any; allow_anonymous: boolean; is_active: boolean; created_at?: string };

export default function PollsTab({ initialPolls }: { initialPolls: Poll[] }) {
  const supabase = createSupabaseBrowser();
  const [polls, setPolls] = useState<Poll[]>(initialPolls || []);

  useEffect(() => {
    const channel = supabase
      .channel('polls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, (payload) => {
        setPolls((prev) => {
          if (payload.eventType === 'INSERT') return [payload.new as Poll, ...prev];
          if (payload.eventType === 'UPDATE') return prev.map((p) => (p.id === (payload.new as any).id ? (payload.new as Poll) : p));
          if (payload.eventType === 'DELETE') return prev.filter((p) => p.id !== (payload.old as any).id);
          return prev;
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="space-y-3">
      {polls.length === 0 && <div className="text-white/70">No polls yet.</div>}
      {polls.map((p) => (
        <div key={p.id} className="rounded border border-white/10 bg-black/30 p-3">
          <div className="font-medium">{p.question}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(Array.isArray(p.options) ? p.options : []).map((opt: any, i: number) => (
              <button key={i} className="rounded border border-white/10 px-3 py-2 text-left hover:bg-white/5" disabled>
                {String(opt)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-white/60">{p.is_active ? 'Active' : 'Closed'}</div>
        </div>
      ))}
    </div>
  );
}

