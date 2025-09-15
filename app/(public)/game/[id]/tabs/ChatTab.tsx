"use client";
import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

type ChatRoom = { id: string; name?: string | null; is_active?: boolean } | null;
type ChatMessage = { id: string; message: string; created_at?: string };

export default function ChatTab({ chatRoom, initialMessages }: { chatRoom: ChatRoom; initialMessages: ChatMessage[] }) {
  const supabase = createSupabaseBrowser();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);

  const roomId = chatRoom?.id;

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => {
            if (payload.eventType === 'INSERT') return [payload.new as ChatMessage, ...prev].slice(0, 50);
            if (payload.eventType === 'UPDATE') return prev.map((m) => (m.id === (payload.new as any).id ? (payload.new as ChatMessage) : m));
            if (payload.eventType === 'DELETE') return prev.filter((m) => m.id !== (payload.old as any).id);
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  const content = useMemo(() => {
    if (!roomId) return <div className="text-white/70">No active chat room for this game.</div>;
    return (
      <div className="space-y-3">
        {messages.length === 0 && <div className="text-white/70">No messages yet.</div>}
        {messages.map((m) => (
          <div key={m.id} className="rounded border border-white/10 bg-black/30 p-3">
            <div className="text-sm">{m.message}</div>
            <div className="text-xs text-white/60">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    );
  }, [roomId, messages]);

  return content;
}

