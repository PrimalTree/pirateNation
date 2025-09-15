"use client";
import Link from 'next/link';
import { useFlagOverlay } from './FlagOverlayContext';
import { Flag as FlagIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@shared/supabase-browser';

export function TopBar() {
  const { open } = useFlagOverlay();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        const role = (profile?.role || 'user') as string;
        const allowed = ['moderator', 'admin', 'sponsor_admin'];
        if (alive) setIsAdmin(allowed.includes(role));
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 via-purple-400 to-yellow-400" />
          <span className="font-semibold tracking-wide">{process.env.NEXT_PUBLIC_SITE_NAME ?? 'Pirate Nation'}</span>
          <span className="ml-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-300">Beta</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/gameday" className="text-zinc-300 hover:text-white">Gameday</Link>
          <Link href="/engage" className="text-zinc-300 hover:text-white">Engage</Link>
          <Link href="/support" className="text-zinc-300 hover:text-white">Support</Link>
        </nav>
      </div>
    </header>
  );
}
