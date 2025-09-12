"use client";

import { createSupabaseBrowser } from './supabase-browser';

export type LiveGameRow = {
  game_id: string;
  score_json: any;
  hash: string;
  updated_at: string;
};

export async function fetchLiveInitial(): Promise<LiveGameRow[]> {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.from('live_games').select('*');
  return Array.isArray(data) ? (data as LiveGameRow[]) : [];
}

export function subscribeLive(
  onChange: (row: LiveGameRow) => void
) {
  const supabase = createSupabaseBrowser();
  const channel = supabase
    .channel('live-games')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_games' }, (payload: any) => {
      if (payload?.new) onChange(payload.new as LiveGameRow);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

