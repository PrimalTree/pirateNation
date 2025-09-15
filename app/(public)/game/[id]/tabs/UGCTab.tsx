"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

type UGC = { id: string; title: string; content?: string | null; status: string; created_at?: string };

export default function UGCTab({ initialPosts }: { initialPosts: UGC[] }) {
  const supabase = createSupabaseBrowser();
  const [posts, setPosts] = useState<UGC[]>(initialPosts || []);

  useEffect(() => {
    const channel = supabase
      .channel('ugc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ugc_posts' }, (payload) => {
        setPosts((prev) => {
          if (payload.eventType === 'INSERT') return [payload.new as UGC, ...prev];
          if (payload.eventType === 'UPDATE') return prev.map((p) => (p.id === (payload.new as any).id ? (payload.new as UGC) : p));
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
      {posts.length === 0 && <div className="text-white/70">No posts yet.</div>}
      {posts.map((p) => (
        <div key={p.id} className="rounded border border-white/10 bg-black/30 p-3">
          <div className="font-medium">{p.title}</div>
          {p.content && <div className="mt-1 text-white/80">{p.content}</div>}
          <div className="mt-1 text-xs text-white/60">Status: {p.status}</div>
        </div>
      ))}
    </div>
  );
}

