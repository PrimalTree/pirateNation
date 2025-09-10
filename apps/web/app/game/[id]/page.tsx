import { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseServer } from '../../../lib/supabase-server';
import { Tabs } from '@pn/ui';
import LiveScoreStrip from './score-strip';
import FeedTab from './tabs/FeedTab';
import PollsTab from './tabs/PollsTab';
import ChatTab from './tabs/ChatTab';
import UGCTab from './tabs/UGCTab';
import MapTab from './tabs/MapTab';

type PageProps = {
  params: { id: string };
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createSupabaseServer();
  const { data: game } = await supabase.from('games').select('id,name').eq('id', params.id).maybeSingle();
  return { title: game?.name ? `${game.name} • Game` : 'Game' };
}

export default async function GamePage({ params }: PageProps) {
  const supabase = createSupabaseServer();

  // Game details (server-side for initial render)
  const { data: game } = await supabase
    .from('games')
    .select('id,name,settings')
    .eq('id', params.id)
    .maybeSingle();

  // Polls (initial)
  const { data: polls } = await supabase
    .from('polls')
    .select('id,question,options,allow_anonymous,is_active,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  // Chat: find a chat room for this game (or none)
  const { data: chatRoom } = await supabase
    .from('chats')
    .select('id,name,is_active')
    .eq('game_id', params.id)
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

  // UGC (initial approved or own)
  const { data: ugc } = await supabase
    .from('ugc_posts')
    .select('id,title,content,status,created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  // Players for feed (initial)
  const { data: players } = await supabase
    .from('players')
    .select('id,username,created_at')
    .eq('game_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const whenIso: string | undefined = (game as any)?.when || (game?.settings as any)?.when;
  const teams: any[] | undefined = (game?.settings as any)?.teams;
  const broadcast: string | undefined = (game?.settings as any)?.broadcast;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{game?.name || 'Game'}</h1>
        <div className="text-sm text-white/70">
          <div>
            Opponents: {teams?.map((t: any) => t?.name).filter(Boolean).join(' vs ') || 'TBD'}
          </div>
          <div>
            Start: {whenIso ? new Date(whenIso).toLocaleString() : 'TBD'}
          </div>
          <div>
            Broadcast: {broadcast || 'TBD'}
          </div>
        </div>
        {/* Live score strip */}
        {game?.id && (
          <LiveScoreStrip
            gameId={game.id}
            initialScore={(game as any)?.score_json ?? { teams: teams ?? [] }}
          />
        )}
      </div>

      <Tabs
        className="mt-2"
        items={[
          {
            id: 'feed',
            label: 'Feed',
            content: <FeedTab gameId={params.id} initialPlayers={players ?? []} />
          },
          {
            id: 'polls',
            label: 'Polls',
            content: <PollsTab initialPolls={polls ?? []} />
          },
          {
            id: 'chat',
            label: 'Chat',
            content: <ChatTab chatRoom={chatRoom ?? null} initialMessages={initialMessages ?? []} />
          },
          { id: 'ugc', label: 'UGC', content: <UGCTab initialPosts={ugc ?? []} /> },
          { id: 'map', label: 'Map', content: <MapTab /> }
        ]}
      />

      {/* Floating donate button */}
      <Link
        href="/donate"
        className="fixed bottom-6 right-6 inline-flex items-center rounded-full bg-ecu-gold px-5 py-3 font-semibold text-black shadow-lg hover:opacity-90"
      >
        Donate
      </Link>
    </div>
  );
}

