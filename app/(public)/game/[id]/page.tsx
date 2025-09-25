import { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServer } from '@shared/supabase-server';
import { Tabs } from '@pn/ui';
import LiveScoreStrip from './score-strip';
import FeedTab from './tabs/FeedTab';
import PollsTab from './tabs/PollsTab';
import ChatTab from './tabs/ChatTab';
import UGCTab from './tabs/UGCTab';
import MapTab from './tabs/MapTab';

type GameRouteParams = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: GameRouteParams): Promise<Metadata> {
  const supabase = await createSupabaseServer();
  const { id } = await params;
  const { data: game } = await supabase.from('games').select('id,name').eq('id', id).maybeSingle();
  return { title: game?.name ? `${game.name} • Game` : 'Game' };
}

export default async function GamePage({ params }: GameRouteParams) {
  const supabase = await createSupabaseServer();
  const { id } = await params;

  const { data: game } = await supabase
    .from('games')
    .select('id,name,settings,score_json')
    .eq('id', id)
    .maybeSingle();

  const { data: polls } = await supabase
    .from('polls')
    .select('id,question,options,allow_anonymous,is_active,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: chatRoom } = await supabase
    .from('chats')
    .select('id,name,is_active')
    .eq('game_id', id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  let initialMessages: { id: string; message: string; created_at: string }[] | undefined = undefined;
  if (chatRoom?.id) {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('id,message,created_at')
      .eq('chat_id', chatRoom.id)
      .order('created_at', { ascending: false })
      .limit(25);
    initialMessages = msgs ?? [];
  }

  const { data: ugc } = await supabase
    .from('ugc_posts')
    .select('id,title,content,status,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: players } = await supabase
    .from('players')
    .select('id,username,created_at')
    .eq('game_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Prefer live score from live_games, fallback to games.score_json/settings
  const { data: live } = await supabase
    .from('live_games')
    .select('game_id, score_json, updated_at')
    .eq('game_id', id)
    .maybeSingle();

  const score: any = (live as any)?.score_json ?? (game as any)?.score_json ?? (game?.settings as any);
  const whenIso: string | undefined = (score as any)?.when;
  const teams: any[] | undefined = (score as any)?.teams;
  const broadcast: string | undefined = (score as any)?.broadcast;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <h1 className="text-2xl font-semibold">{game?.name || (score as any)?.name || 'Game'}</h1>
        <div className="mt-2 grid gap-2 text-sm text-zinc-300 md:grid-cols-3">
          <div>
            <span className="text-zinc-400">Opponents:</span> {teams?.map((t: any) => t?.name).filter(Boolean).join(' vs ') || 'TBD'}
          </div>
          <div>
            <span className="text-zinc-400">Start:</span> {whenIso ? new Date(whenIso).toLocaleString() : 'TBD'}
          </div>
          <div>
            <span className="text-zinc-400">Broadcast:</span> {broadcast || 'TBD'}
          </div>
        </div>
        {id && (
          <div className="mt-4">
            <LiveScoreStrip gameId={id} initialScore={score ?? { teams: teams ?? [] }} />
          </div>
        )}
      </section>

      <Tabs
        className="mt-2"
        items={[
          { id: 'feed', label: 'Feed', content: <FeedTab gameId={id} initialPlayers={players ?? []} /> },
          { id: 'polls', label: 'Polls', content: <PollsTab initialPolls={polls ?? []} /> },
          { id: 'chat', label: 'Chat', content: <ChatTab chatRoom={chatRoom ?? null} initialMessages={initialMessages ?? []} /> },
          { id: 'ugc', label: 'UGC', content: <UGCTab initialPosts={ugc ?? []} /> },
          { id: 'map', label: 'Map', content: <MapTab /> }
        ]}
      />

    </div>
  );
}
